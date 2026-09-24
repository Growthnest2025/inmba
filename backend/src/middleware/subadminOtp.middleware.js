const ApiError =
  require(
    "../utils/apiError"
  );

const {
  ADMIN_ROLES,
  normalizeAdminRole,
} = require(
  "../constants/adminRoles"
);

const {
  isAdminUserOtpVerified,
} = require(
  "../utils/session.utils"
);

/*
  ZIP code behavior:

  subadmin ஒரு member details
  பார்க்கும் முன் அந்த member ID-க்கு
  OTP verify செய்ய வேண்டும்.

  super_admin மற்றும் admin-க்கு
  இந்த per-user OTP check இல்லை.
*/
const requireSubadminUserOtp =
  (
    req,
    res,
    next
  ) => {
    const adminRole =
      normalizeAdminRole(
        req.admin?.role
      );

    if (
      adminRole !==
      ADMIN_ROLES.SUBADMIN
    ) {
      next();
      return;
    }

    const userId =
      req.params.id ||
      req.params.userId ||
      req.body?.user_id ||
      req.body?.userId;

    if (!userId) {
      return next(
        new ApiError(
          400,
          "Member ID is required for subadmin OTP verification."
        )
      );
    }

    const isVerified =
      isAdminUserOtpVerified(
        req,
        userId
      );

    if (!isVerified) {
      return next(
        new ApiError(
          403,
          "OTP verification required to view this member's details."
        )
      );
    }

    next();
  };

module.exports = {
  requireSubadminUserOtp,
};