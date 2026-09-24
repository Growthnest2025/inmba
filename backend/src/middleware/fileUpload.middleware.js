const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const { normalizeFormFields } = require("../utils/formData.utils");
const { STUDENT_UPLOAD_FIELDS } = require("../constants/registration.constants");
const {
  createStudentUploadForm,
  createMemberProfileUploadForm,
  convertFormidableError,
} = require("../config/formidable");
const {
  normalizeUploadedFiles,
  cleanupUploadedFiles,
} = require("../services/fileStorage.service");

const isMultipartRequest = (req) =>
  String(req.headers["content-type"] || "")
    .toLowerCase()
    .startsWith("multipart/form-data");

const registerAutomaticUploadCleanup = (req, res) => {
  req.keepUploadedFiles = false;
  res.once("finish", () => {
    if (req.keepUploadedFiles) return;
    cleanupUploadedFiles(req.uploadedFiles || req.rawUploadedFiles).catch(
      (error) => console.error("Automatic upload cleanup failed:", error.message)
    );
  });
};

const validateSingleFilePerField = (rawFiles, allowedFields) => {
  for (const fieldName of allowedFields) {
    const fileValue = rawFiles?.[fieldName];
    if (Array.isArray(fileValue) && fileValue.length > 1) {
      const message = `Only one file can be uploaded for ${fieldName}.`;
      const error = new ApiError(400, message, [
        { field: fieldName, message, code: "MULTIPLE_FILES_NOT_ALLOWED" },
      ]);
      error.code = "MULTIPLE_FILES_NOT_ALLOWED";
      throw error;
    }
  }
};

const parseRegistrationForm = (createForm, allowedFields) =>
  asyncHandler(async (req, res, next) => {
    req.formFields = {};
    req.uploadedFiles = {};
    req.rawUploadedFiles = {};

    if (!isMultipartRequest(req)) {
      req.formFields = normalizeFormFields(req.body || {});
      next();
      return;
    }

    const form = createForm();
    try {
      const [fields, files] = await form.parse(req);
      req.rawUploadedFiles = files || {};
      validateSingleFilePerField(files || {}, allowedFields);
      req.formFields = normalizeFormFields(fields || {});
      req.uploadedFiles = normalizeUploadedFiles(files || {});
      registerAutomaticUploadCleanup(req, res);
      next();
    } catch (error) {
      await cleanupUploadedFiles(form.openedFiles || req.rawUploadedFiles);
      if (error instanceof ApiError) throw error;
      throw convertFormidableError(error);
    }
  });

const parseMemberRegistrationForm = parseRegistrationForm(
  createMemberProfileUploadForm,
  ["profile_pic"]
);

const parseStudentRegistrationForm = parseRegistrationForm(
  createStudentUploadForm,
  STUDENT_UPLOAD_FIELDS
);

module.exports = {
  isMultipartRequest,
  registerAutomaticUploadCleanup,
  validateSingleFilePerField,
  parseMemberRegistrationForm,
  parseStudentRegistrationForm,
};
