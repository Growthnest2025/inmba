const { formidable } = require("formidable");
const ApiError = require("../utils/apiError");
const { STUDENT_UPLOAD_FIELDS } = require("../constants/registration.constants");
const {
  UPLOAD_ROOT,
  generateStoredFilename,
  ensureUploadDirectorySync,
} = require("../services/fileStorage.service");

const maxDocumentSize = Number(process.env.MAX_DOCUMENT_SIZE) || 10485760;
const maxProfilePhotoSize = Number(process.env.MAX_PROFILE_PHOTO_SIZE) || 5242880;
const maxStudentUploadFiles = Number(process.env.MAX_STUDENT_UPLOAD_FILES) || 3;
const allowedStudentUploadFields = new Set(STUDENT_UPLOAD_FIELDS);
const allowedProfileMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const isAllowedStudentFile = ({ name, originalFilename }) =>
  allowedStudentUploadFields.has(name) &&
  Boolean(String(originalFilename || "").trim());

const createStudentUploadForm = () => {
  ensureUploadDirectorySync();
  return formidable({
    uploadDir: UPLOAD_ROOT,
    keepExtensions: false,
    multiples: false,
    allowEmptyFiles: false,
    minFileSize: 1,
    maxFiles: maxStudentUploadFiles,
    maxFileSize: maxDocumentSize,
    maxTotalFileSize: maxDocumentSize * maxStudentUploadFiles,
    filename(name, extension, part) {
      return generateStoredFilename(
        part.originalFilename || `${name}${extension || ""}`
      );
    },
    filter: isAllowedStudentFile,
  });
};

const createMemberProfileUploadForm = () => {
  ensureUploadDirectorySync();
  return formidable({
    uploadDir: UPLOAD_ROOT,
    keepExtensions: false,
    multiples: false,
    allowEmptyFiles: false,
    minFileSize: 1,
    maxFiles: 1,
    maxFileSize: maxProfilePhotoSize,
    maxTotalFileSize: maxProfilePhotoSize,
    filename(name, extension, part) {
      return generateStoredFilename(
        part.originalFilename || `${name}${extension || ""}`
      );
    },
    filter({ name, originalFilename, mimetype }) {
      return (
        name === "profile_pic" &&
        Boolean(String(originalFilename || "").trim()) &&
        allowedProfileMimeTypes.has(String(mimetype || "").toLowerCase())
      );
    },
  });
};

const convertFormidableError = (error) => {
  const rawMessage = String(error?.message || "Unable to process uploaded files.");
  const normalizedMessage = rawMessage.toLowerCase();
  let statusCode = Number(error?.httpCode) || 400;
  let message = "Unable to process uploaded files.";
  let code = error?.code || "FORMIDABLE_UPLOAD_ERROR";

  if (
    normalizedMessage.includes("maxfilesize") ||
    normalizedMessage.includes("max file size") ||
    normalizedMessage.includes("larger than") ||
    statusCode === 413
  ) {
    statusCode = 413;
    message = "The uploaded file is too large.";
    code = "FILE_TOO_LARGE";
  } else if (normalizedMessage.includes("empty")) {
    message = "Empty upload files are not allowed.";
    code = "EMPTY_UPLOAD_FILE";
  }

  const apiError = new ApiError(statusCode, message, [
    { field: "files", message, code },
  ]);
  apiError.code = code;
  return apiError;
};

module.exports = {
  maxDocumentSize,
  maxProfilePhotoSize,
  maxStudentUploadFiles,
  allowedStudentUploadFields,
  isAllowedStudentFile,
  createStudentUploadForm,
  createMemberProfileUploadForm,
  convertFormidableError,
};
