const express =
  require("express");

const {
  validateForgotPassword,
  validateVerifyOtp,
  validateResetPassword,
} = require(
  "../validators/passwordReset.validator"
);

const {
  forgotPasswordController,
  verifyOtpController,
  resetPasswordController,
} = require(
  "../controllers/passwordReset.controller"
);

const apiPasswordResetRoutes =
  express.Router();

const legacyPasswordResetRoutes =
  express.Router();

/*
  =========================
  NEW API ROUTES
  =========================

  POST /api/forgot-password
  POST /api/verify-otp
  POST /api/reset-password
*/

apiPasswordResetRoutes.post(
  "/forgot-password",
  validateForgotPassword,
  forgotPasswordController
);

apiPasswordResetRoutes.post(
  "/verify-otp",
  validateVerifyOtp,
  verifyOtpController
);

apiPasswordResetRoutes.post(
  "/reset-password",
  validateResetPassword,
  resetPasswordController
);

/*
  =========================
  LEGACY FLASK ROUTES
  =========================

  POST /forgot_password
  POST /verify_otp
  POST /reset_password
*/

legacyPasswordResetRoutes.post(
  "/forgot_password",
  validateForgotPassword,
  forgotPasswordController
);

legacyPasswordResetRoutes.post(
  "/verify_otp",
  validateVerifyOtp,
  verifyOtpController
);

legacyPasswordResetRoutes.post(
  "/reset_password",
  validateResetPassword,
  resetPasswordController
);

module.exports = {
  apiPasswordResetRoutes,
  legacyPasswordResetRoutes,
};