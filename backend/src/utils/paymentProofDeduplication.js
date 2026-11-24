const fs = require("fs/promises");
const fsSync = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const { executeQuery } = require("../repositories/auth.repository");

const REGISTRY_FILE_NAME = ".payment_proof_registry.json";

/**
 * Compute 256-bit perceptual difference/average hash using sharp.
 * Resizes the image to 16x16 grayscale and generates a binary hash.
 */
async function getPerceptualHash(buffer) {
  try {
    const data = await sharp(buffer)
      .greyscale()
      .resize(16, 16, { fit: "fill" })
      .raw()
      .toBuffer();

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const avg = sum / data.length;

    let pHash = "";
    for (let i = 0; i < data.length; i++) {
      pHash += data[i] >= avg ? "1" : "0";
    }

    return pHash;
  } catch {
    return null;
  }
}

/**
 * Compute Hamming distance between two binary hash strings.
 */
function hammingDistance(h1, h2) {
  if (!h1 || !h2 || h1.length !== h2.length) return 999;
  let dist = 0;
  for (let i = 0; i < h1.length; i++) {
    if (h1[i] !== h2[i]) dist++;
  }
  return dist;
}

/**
 * Compute SHA-256, MD5, file size, and perceptual hash for a file.
 */
async function computeFileHashes(filePathOrBuffer) {
  try {
    let buffer;
    if (Buffer.isBuffer(filePathOrBuffer)) {
      buffer = filePathOrBuffer;
    } else {
      buffer = await fs.readFile(filePathOrBuffer);
    }

    if (!buffer || buffer.length === 0) return null;

    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const md5 = crypto.createHash("md5").update(buffer).digest("hex");
    const pHash = await getPerceptualHash(buffer);

    return {
      sha256,
      md5,
      fileSize: buffer.length,
      pHash,
    };
  } catch (err) {
    console.warn("computeFileHashes warning:", err?.message);
    return null;
  }
}

/**
 * Load the persistent proof registry from disk.
 * If empty, indexes existing files in uploadDirectory.
 */
async function loadProofRegistry(uploadDirectory) {
  const registryPath = path.join(uploadDirectory, REGISTRY_FILE_NAME);
  let registry = [];

  try {
    if (fsSync.existsSync(registryPath)) {
      const content = await fs.readFile(registryPath, "utf-8");
      registry = JSON.parse(content);
      if (!Array.isArray(registry)) registry = [];
    }
  } catch {
    registry = [];
  }

  // If registry is empty, index existing proof files in the upload directory
  if (registry.length === 0) {
    try {
      if (fsSync.existsSync(uploadDirectory)) {
        const files = await fs.readdir(uploadDirectory);
        for (const file of files) {
          if (file.startsWith(".") || file.endsWith(".json")) continue;
          const fullPath = path.join(uploadDirectory, file);
          try {
            const stat = await fs.stat(fullPath);
            if (stat.isFile() && stat.size > 0) {
              const hashes = await computeFileHashes(fullPath);
              if (hashes) {
                registry.push({
                  filename: file,
                  sha256: hashes.sha256,
                  md5: hashes.md5,
                  fileSize: hashes.fileSize,
                  pHash: hashes.pHash,
                  createdAt: stat.birthtime || new Date().toISOString(),
                });
              }
            }
          } catch {}
        }
        if (registry.length > 0) {
          await saveProofRegistry(uploadDirectory, registry);
        }
      }
    } catch {}
  }

  return registry;
}

/**
 * Save the persistent proof registry to disk.
 */
async function saveProofRegistry(uploadDirectory, registry) {
  try {
    const registryPath = path.join(uploadDirectory, REGISTRY_FILE_NAME);
    await fs.writeFile(registryPath, JSON.stringify(registry, null, 2), "utf-8");
  } catch (err) {
    console.warn("saveProofRegistry warning:", err?.message);
  }
}

/**
 * Check if the transaction ID has already been submitted by another member.
 */
async function checkDuplicateTransactionId(transactionId, memberId, connection = null) {
  if (!transactionId) return false;
  const cleanTxnId = String(transactionId).trim();
  if (cleanTxnId.length < 4) return false;

  try {
    const rows = await executeQuery(
      `
      SELECT id, login_id
      FROM kyc_members
      WHERE LOWER(TRIM(transaction_id)) = LOWER(?)
        AND id != ?
        AND COALESCE(is_deleted, 0) = 0
      LIMIT 1
      `,
      [cleanTxnId, memberId],
      connection
    );

    return Array.isArray(rows) && rows.length > 0;
  } catch (err) {
    console.warn("checkDuplicateTransactionId query error:", err?.message);
    return false;
  }
}

/**
 * Validate whether the uploaded payment proof screenshot is a duplicate.
 * Returns { isDuplicate: true, reason: string } or { isDuplicate: false, hashes: object }.
 */
async function checkDuplicatePaymentProof({
  filePath,
  memberId,
  transactionId = null,
  uploadDirectory,
  connection = null,
}) {
  // 1. Transaction ID duplicate check
  if (transactionId) {
    const isTxnDup = await checkDuplicateTransactionId(transactionId, memberId, connection);
    if (isTxnDup) {
      return {
        isDuplicate: true,
        reason: "Invalid payment details: This Transaction ID / UTR has already been submitted. Please check your transaction details.",
      };
    }
  }

  // 2. File hash and perceptual hash duplicate check
  const hashes = await computeFileHashes(filePath);
  if (!hashes) {
    return { isDuplicate: false, hashes: null };
  }

  const registry = await loadProofRegistry(uploadDirectory);

  for (const entry of registry) {
    // Exact SHA-256 match
    if (entry.sha256 && entry.sha256 === hashes.sha256) {
      return {
        isDuplicate: true,
        reason: "Invalid payment proof: Same screenshot cannot be uploaded again. This payment proof has already been submitted.",
      };
    }

    // Exact MD5 + file size match
    if (
      entry.md5 &&
      hashes.md5 &&
      entry.md5 === hashes.md5 &&
      entry.fileSize === hashes.fileSize
    ) {
      return {
        isDuplicate: true,
        reason: "Invalid payment proof: Same screenshot cannot be uploaded again. This payment proof has already been submitted.",
      };
    }

    // Perceptual visual match (Hamming distance <= 6 out of 256 bits -> 97.6%+ visual match)
    if (entry.pHash && hashes.pHash) {
      const dist = hammingDistance(entry.pHash, hashes.pHash);
      if (dist <= 6) {
        return {
          isDuplicate: true,
          reason: "Invalid payment proof: Same screenshot cannot be uploaded again. This payment proof has already been submitted.",
        };
      }
    }
  }

  return {
    isDuplicate: false,
    hashes,
  };
}

/**
 * Register a newly submitted payment proof into the persistent registry.
 */
async function registerPaymentProof({
  memberId,
  filename,
  filePath,
  transactionId = null,
  uploadDirectory,
  hashes = null,
}) {
  try {
    const fileHashes = hashes || (await computeFileHashes(filePath));
    if (!fileHashes) return;

    const registry = await loadProofRegistry(uploadDirectory);

    // Filter out previous entries for the same member if re-submitting with a new file
    const updatedRegistry = registry.filter(
      (item) => !(String(item.memberId) === String(memberId) && item.filename !== filename)
    );

    updatedRegistry.push({
      memberId,
      filename,
      transactionId: transactionId ? String(transactionId).trim() : "",
      sha256: fileHashes.sha256,
      md5: fileHashes.md5,
      fileSize: fileHashes.fileSize,
      pHash: fileHashes.pHash,
      createdAt: new Date().toISOString(),
    });

    await saveProofRegistry(uploadDirectory, updatedRegistry);
  } catch (err) {
    console.warn("registerPaymentProof warning:", err?.message);
  }
}

module.exports = {
  getPerceptualHash,
  hammingDistance,
  computeFileHashes,
  loadProofRegistry,
  saveProofRegistry,
  checkDuplicateTransactionId,
  checkDuplicatePaymentProof,
  registerPaymentProof,
};
