const express =
  require(
    "express"
  );

const {
  validateAdminLogin,
  validateAdminOtp,
  validateAdminSignup,
} = require(
  "../validators/adminAuth.validator"
);

const {
  requireAdmin,
  requireAdminRole,
} = require(
  "../middleware/adminAuth.middleware"
);

const {
  adminLoginVerifyController,
  adminLoginOtpController,
  getAdminMeController,
  adminSignupController,
  adminLogoutController,
  getLegacyAdminLoginController,
  postLegacyAdminLoginController,
  legacyAdminLogoutController,
} = require(
  "../controllers/adminAuth.controller"
);

const apiAdminAuthRoutes =
  express.Router();

const legacyAdminAuthRoutes =
  express.Router();

/*
  =========================
  NEW ADMIN AUTH API
  =========================
*/

apiAdminAuthRoutes.post(
  "/auth/admin-login-verify",
  validateAdminLogin,
  adminLoginVerifyController
);

apiAdminAuthRoutes.post(
  "/auth/admin-login-otp",
  validateAdminOtp,
  adminLoginOtpController
);

apiAdminAuthRoutes.get(
  "/auth/admin-me",
  requireAdmin,
  getAdminMeController
);

apiAdminAuthRoutes.post(
  "/auth/admin-logout",
  requireAdmin,
  adminLogoutController
);

/*
  Super Admin only:
  Create Admin or Subadmin
*/

apiAdminAuthRoutes.post(
  "/auth/admin-signup",
  requireAdminRole(
    "super_admin"
  ),
  validateAdminSignup,
  adminSignupController
);

/*
  =========================
  LEGACY FLASK ROUTES
  =========================
*/

legacyAdminAuthRoutes.get(
  "/admin_login",
  getLegacyAdminLoginController
);

legacyAdminAuthRoutes.post(
  "/admin_login",
  validateAdminLogin,
  postLegacyAdminLoginController
);

legacyAdminAuthRoutes.get(
  "/admin_logout",
  legacyAdminLogoutController
);

module.exports = {
  apiAdminAuthRoutes,
  legacyAdminAuthRoutes,
};