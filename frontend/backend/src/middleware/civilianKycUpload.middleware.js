const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const formidablePackage = require("formidable");

const {
  UPLOAD_ROOT,
  UPLOAD_PUBLIC_PATH,
} = require("../services/fileStorage.service");

const createFormidable =
  formidablePackage.formidable ||
  formidablePackage.default ||
  formidablePackage;

const PRIVATE_ROOT = path.resolve(
  __dirname,
  "../../storage/private/civilian-kyc"
);

const PUBLIC_ROOT = path.join(
  UPLOAD_ROOT,
  "civilian-kyc",
  "public"
);

const PUBLIC_FIELDS = new Set([
  "profile_photo",
  "cover_photo",
  "gallery_photos",
  "intro_video",
]);

const ALLOWED_FIELDS = new Set([
  "aadhaar_front",
  "aadhaar_back",
  "pan_card_scan",
  "address_proof",
  "bank_proof",
  "nominee_id",
  "education_certificate",
  "profile_photo",
  "cover_photo",
  "gallery_photos",
  "intro_video",
]);

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const DOCUMENT_TYPES = new Set([
  "application/pdf",
  ...IMAGE_TYPES,
]);

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const toArray = (value) =>
  Array.isArray(value) ? value : value ? [value] : [];

const singleFieldValue = (value) =>
  Array.isArray(value) ? value[0] : value;

const extensionFor = (mimetype) => ({
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
}[mimetype] || "");

const ensureDir = (directory) => {
  fs.mkdirSync(directory, { recursive: true });
};

const validateType = (fieldName, mimetype) => {
  if (fieldName === "intro_video") return VIDEO_TYPES.has(mimetype);
  if (PUBLIC_FIELDS.has(fieldName)) return IMAGE_TYPES.has(mimetype);
  return DOCUMENT_TYPES.has(mimetype);
};

const destinationFor = (fieldName) =>
  PUBLIC_FIELDS.has(fieldName) ? PUBLIC_ROOT : PRIVATE_ROOT;

const storageKeyFor = (fieldName, absolutePath) => {
  if (PUBLIC_FIELDS.has(fieldName)) {
    const relative = path
      .relative(UPLOAD_ROOT, absolutePath)
      .replace(/\\/g, "/");

    return `${UPLOAD_PUBLIC_PATH}/${relative}`.replace(/\/+/g, "/");
  }

  const relative = path
    .relative(PRIVATE_ROOT, absolutePath)
    .replace(/\\/g, "/");

  return `private/civilian-kyc/${relative}`;
};

const moveFile = async (fieldName, file) => {
  const mimetype = String(file?.mimetype || "").toLowerCase();

  if (!validateType(fieldName, mimetype)) {
    const error = new Error(`Unsupported file type for ${fieldName}.`);
    error.statusCode = 422;
    throw error;
  }

  const maxSize =
    fieldName === "intro_video"
      ? 50 * 1024 * 1024
      : 5 * 1024 * 1024;

  if (Number(file?.size || 0) > maxSize) {
    const error = new Error(`Uploaded file for ${fieldName} is too large.`);
    error.statusCode = 422;
    throw error;
  }

  const now = new Date();
  const destination = path.join(
    destinationFor(fieldName),
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0")
  );

  ensureDir(destination);

  const filename =
    `${fieldName}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}` +
    extensionFor(mimetype);

  const finalPath = path.join(destination, filename);

  await fs.promises.rename(file.filepath, finalPath);

  return storageKeyFor(fieldName, finalPath);
};

const parseCivilianKycUpload = (req, res, next) => {
  const contentType = String(req.headers["content-type"] || "");

  if (!contentType.includes("multipart/form-data")) {
    req.civilianKycFiles = {};
    return next();
  }

  const tempRoot = path.join(PRIVATE_ROOT, ".tmp");
  ensureDir(tempRoot);

  const form = createFormidable({
    uploadDir: tempRoot,
    keepExtensions: false,
    multiples: true,
    maxFiles: 15,
    maxFileSize: 50 * 1024 * 1024,
    maxTotalFileSize: 100 * 1024 * 1024,
  });

  form.parse(req, async (error, fields, files) => {
    if (error) return next(error);

    try {
      const normalizedBody = {};
      Object.entries(fields || {}).forEach(([key, value]) => {
        normalizedBody[key] = singleFieldValue(value);
      });

      req.body = normalizedBody;

      const stored = {};

      for (const [fieldName, value] of Object.entries(files || {})) {
        if (!ALLOWED_FIELDS.has(fieldName)) continue;

        const uploadedFiles = toArray(value);

        if (fieldName === "gallery_photos") {
          const keys = [];
          for (const file of uploadedFiles.slice(0, 10)) {
            keys.push(await moveFile(fieldName, file));
          }
          stored[fieldName] = JSON.stringify(keys);
        } else if (uploadedFiles[0]) {
          stored[fieldName] = await moveFile(fieldName, uploadedFiles[0]);
        }
      }

      req.civilianKycFiles = stored;
      return next();
    } catch (uploadError) {
      return next(uploadError);
    }
  });
};

module.exports = {
  parseCivilianKycUpload,
  PRIVATE_ROOT,
  PUBLIC_ROOT,
};
