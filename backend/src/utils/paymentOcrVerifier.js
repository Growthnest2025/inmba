const { execFile } = require("child_process");
const path = require("path");

/**
 * Runs native OCR on the given image file.
 * Returns the extracted text or an empty string.
 */
function extractTextFromImage(imagePath) {
  return new Promise((resolve) => {
    // Only attempt on Windows platforms
    if (process.platform !== "win32") {
      return resolve("");
    }

    const psScript = path.resolve(__dirname, "ocr_helper.ps1");
    execFile(
      "powershell.exe",
      ["-ExecutionPolicy", "Bypass", "-File", psScript, imagePath],
      { timeout: 12000, windowsHide: true },
      (error, stdout) => {
        if (error) {
          return resolve("");
        }
        const text = stdout || "";
        const match = text.match(/--- OCR TEXT BEGIN ---([\s\S]*?)--- OCR TEXT END ---/);
        const extracted = match ? match[1].trim() : text.trim();
        resolve(extracted);
      }
    );
  });
}

/**
 * Parses numeric amounts found in the OCR receipt text.
 */
function parseAmountsFromReceipt(ocrText) {
  if (!ocrText || typeof ocrText !== "string") {
    return [];
  }

  const found = new Set();
  const clean = ocrText.replace(/[\r\n]+/g, " ");

  // 1. Direct keywords: "Payment Successful ?100", "Paid ?100", "Amount ?100", etc.
  const keywordRegex =
    /(?:Payment\s+Successful|Paid\s+successfully|Payment\s+Success|Paid|Amount|Transfer(?:red)?|Sent|Debited|Total)\s*[:\-]?\s*([?₹Q]|Rs\.?|INR)?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/gi;
  let m;
  while ((m = keywordRegex.exec(clean)) !== null) {
    const raw = m[2].replace(/,/g, "");
    const val = parseFloat(raw);
    if (val > 0 && val < 500000) {
      found.add(val);
    }
  }

  // 2. Rupee / question-mark amounts: "?100", "₹100", "Rs 100", "INR 100", "Rs.100"
  const symRegex =
    /(?:[₹?]|Rs\.?|INR)\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/gi;
  while ((m = symRegex.exec(clean)) !== null) {
    const raw = m[1].replace(/,/g, "");
    const val = parseFloat(raw);
    if (val > 0 && val < 500000 && val !== 2024 && val !== 2025 && val !== 2026 && val !== 2027) {
      found.add(val);
    }
  }

  // 3. Special OCR artifacts: "Q99" -> 299, "Q999" -> 2999
  if (/\bQ99\b/i.test(clean) || /\b\?299\b/.test(clean)) {
    found.add(299);
  }
  if (/\bQ999\b/i.test(clean) || /\b\?2999\b/.test(clean)) {
    found.add(2999);
  }

  return Array.from(found);
}

/**
 * Extracts UPI Reference / Transaction ID from OCR text if available.
 */
function extractTransactionIdFromOcr(ocrText) {
  if (!ocrText || typeof ocrText !== "string") {
    return null;
  }
  const clean = ocrText.replace(/[\r\n]+/g, " ");
  const refMatch = clean.match(/(?:UPI\s+reference\s+ID|Ref\s+ID|Txn\s+ID|Transaction\s+ID|UTR)\s*[:\-]?\s*([A-Za-z0-9]{10,24})/i);
  if (refMatch) {
    return refMatch[1].trim();
  }
  return null;
}

/**
 * Verifies that the payment receipt matches the expected plan amount.
 * Rejects screenshots showing lower / unauthorized amounts (like ₹100 instead of ₹299 or ₹2999).
 */
async function verifyPaymentProofAmount({ filePath, expectedAmount }) {
  const exp = Number(expectedAmount);
  if (!filePath || !exp || exp <= 0) {
    return { isValid: true };
  }

  try {
    const ocrText = await extractTextFromImage(filePath);
    if (!ocrText) {
      return { isValid: true };
    }

    const detectedAmounts = parseAmountsFromReceipt(ocrText);
    const hasExpected = detectedAmounts.includes(exp);

    // Common unauthorized / lower amounts: 100, 50, 10, 1, 20, 200, 500, etc.
    const conflictingAmounts = detectedAmounts.filter(
      (a) => a !== exp && (a < exp || [1, 5, 10, 20, 50, 100, 150, 200, 250, 500, 1000].includes(a))
    );

    if (conflictingAmounts.length > 0 && !hasExpected) {
      const wrongAmt = conflictingAmounts[0];
      return {
        isValid: false,
        detectedAmount: wrongAmt,
        expectedAmount: exp,
        ocrText,
        reason: `Payment verification failed: Uploaded screenshot shows ₹${wrongAmt}, but your selected membership plan requires ₹${exp}. Please pay the full fee of ₹${exp} and upload the correct receipt.`
      };
    }

    const extractedTxnId = extractTransactionIdFromOcr(ocrText);

    return {
      isValid: true,
      detectedAmounts,
      expectedAmount: exp,
      extractedTxnId,
      ocrText
    };
  } catch (err) {
    return { isValid: true };
  }
}

module.exports = {
  extractTextFromImage,
  parseAmountsFromReceipt,
  extractTransactionIdFromOcr,
  verifyPaymentProofAmount,
};
