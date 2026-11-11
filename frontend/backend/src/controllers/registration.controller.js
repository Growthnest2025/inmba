const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const { registrationService } = require("../services");
const { setNewLoginId } = require("../utils/session.utils");
const {
  cleanupUploadedFiles,
  buildUploadPublicUrl,
} = require("../services/fileStorage.service");

const getFrontendBaseUrl = () =>
  String(
    process.env.FRONTEND_BASE_URL || "http://localhost:5173"
  ).replace(/\/+$/, "");

const createMemberRegistrationResponse = (result) => {
  const frontendBaseUrl = getFrontendBaseUrl();
  const referralId = result.member?.referral_id || null;

  return {
    loginId: result.loginId,
    loginLink: `${frontendBaseUrl}/login`,
    successPage: `${frontendBaseUrl}/success`,
    member: result.member,
    referral: {
      ...result.referral,
      referralId,
      referralLink: referralId
        ? `${frontendBaseUrl}/register?ref=${encodeURIComponent(referralId)}`
        : null,
    },
    nextAction: {
      type: "NAVIGATE",
      path: "/success",
      loginPath: "/login",
    },
  };
};

const createStudentRegistrationResponse = (result) => {
  const frontendBaseUrl = getFrontendBaseUrl();
  const uploadedFiles = {};

  for (const [fieldName, storedFilename] of Object.entries(
    result.uploadedFiles || {}
  )) {
    uploadedFiles[fieldName] = storedFilename
      ? {
          filename: storedFilename,
          url: buildUploadPublicUrl(storedFilename),
        }
      : null;
  }

  return {
    loginId: result.loginId,
    member: result.member,
    uploadedFiles,
    successPage: `${frontendBaseUrl}/student`,
    nextAction: {
      type: "SHOW_SUCCESS",
      path: "/student",
    },
  };
};

const registerMemberController = asyncHandler(async (req, res) => {
  try {
    const result = await registrationService.registerMember(
      req.validatedData,
      { uploadedFiles: req.uploadedFiles || {} }
    );

    req.keepUploadedFiles = true;
    await setNewLoginId(req, result.loginId);

    return res.status(201).json(
      new ApiResponse(
        201,
        createMemberRegistrationResponse(result),
        result.message
      )
    );
  } catch (error) {
    if (!res.headersSent) {
      await cleanupUploadedFiles(
        req.uploadedFiles || req.rawUploadedFiles
      );
    }
    throw error;
  }
});

const registerStudentController = asyncHandler(async (req, res) => {
  try {
    const result = await registrationService.registerStudent(
      req.validatedData,
      { uploadedFiles: req.uploadedFiles || {} }
    );

    req.keepUploadedFiles = true;

    return res.status(201).json(
      new ApiResponse(
        201,
        createStudentRegistrationResponse(result),
        result.message
      )
    );
  } catch (error) {
    if (!res.headersSent) {
      await cleanupUploadedFiles(
        req.uploadedFiles || req.rawUploadedFiles
      );
    }
    throw error;
  }
});

module.exports = {
  getFrontendBaseUrl,
  createMemberRegistrationResponse,
  createStudentRegistrationResponse,
  registerMemberController,
  registerStudentController,
};
