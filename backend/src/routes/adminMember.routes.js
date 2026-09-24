const express =
  require(
    "express"
  );

const {
  requireAdmin,
  requireAdminRole,
} = require(
  "../middleware/adminAuth.middleware"
);

const {
  validateAdminMemberQuery,
  validateAdminMemberId,
  validateAdminUserOtp,
} = require(
  "../validators/adminMember.validator"
);

const {
  getAdminDashboardController,
  getAdminMembersController,
  getAdminPaidMembersController,
  getAdminMemberDetailsController,
  requestAdminUserOtpController,
  verifyAdminUserOtpController,
  getLegacyAdminDashboardController,
} = require(
  "../controllers/adminMember.controller"
);

const apiAdminMemberRoutes =
  express.Router();

const legacyAdminMemberRoutes =
  express.Router();

/* =========================
   ADMIN DASHBOARD
========================= */

apiAdminMemberRoutes.get(
  "/admin/dashboard",
  requireAdmin,
  validateAdminMemberQuery,
  getAdminDashboardController
);

/* =========================
   MEMBER LIST
========================= */

apiAdminMemberRoutes.get(
  "/admin/users",
  requireAdmin,
  validateAdminMemberQuery,
  getAdminMembersController
);

/* =========================
   PAID MEMBERS
========================= */

apiAdminMemberRoutes.get(
  "/admin/paid_users",
  requireAdmin,
  validateAdminMemberQuery,
  getAdminPaidMembersController
);

/* =========================
   SUBADMIN USER OTP
========================= */

apiAdminMemberRoutes.post(
  "/admin/request-user-otp/:userId",
  requireAdminRole(
    "subadmin"
  ),
  validateAdminMemberId,
  requestAdminUserOtpController
);

apiAdminMemberRoutes.post(
  "/admin/verify-user-otp",
  requireAdminRole(
    "subadmin"
  ),
  validateAdminUserOtp,
  verifyAdminUserOtpController
);

/* =========================
   MEMBER DETAILS
========================= */

apiAdminMemberRoutes.get(
  "/admin/user/:id",
  requireAdmin,
  validateAdminMemberId,
  getAdminMemberDetailsController
);

/* =========================
   LEGACY ADMIN PAGE
========================= */

legacyAdminMemberRoutes.get(
  "/admin",
  requireAdmin,
  validateAdminMemberQuery,
  getLegacyAdminDashboardController
);

module.exports = {
  apiAdminMemberRoutes,
  legacyAdminMemberRoutes,
};