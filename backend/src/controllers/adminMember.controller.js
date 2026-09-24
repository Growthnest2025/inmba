const {
  saveSession,
} = require(
  "./adminAuth.controller"
);

const {
  getAdminMembers,
  getAdminDashboard,
  getAdminMemberDetails,
  requestSubadminMemberOtp,
  verifySubadminMemberOtp,
} = require(
  "../services/adminMember.service"
);

/* =========================
   ADMIN DASHBOARD
========================= */

const getAdminDashboardController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getAdminDashboard(
          request
            .validatedAdminMemberQuery,
          request.admin
            .role
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data: {
            admin:
              request.admin,

            dashboard:
              result,
          },

          message:
            "Admin dashboard loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   MEMBER LIST
========================= */

const getAdminMembersController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getAdminMembers(
          request
            .validatedAdminMemberQuery,
          request.admin
            .role
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Admin member list loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   PAID MEMBER LIST
========================= */

const getAdminPaidMembersController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getAdminMembers(
          request
            .validatedAdminMemberQuery,
          request.admin
            .role,
          {
            paidOnly:
              true,
          }
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Paid member list loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   MEMBER DETAILS
========================= */

const getAdminMemberDetailsController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const verifiedUsers =
        request.session
          ?.admin_otp_verified ||
        {};

      const member =
        await getAdminMemberDetails(
          request
            .validatedAdminMemberId,
          request.admin
            .role,
          verifiedUsers
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data: {
            member,
          },

          message:
            "Member details loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   REQUEST USER OTP
========================= */

const requestAdminUserOtpController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await requestSubadminMemberOtp(
          request.admin,
          request
            .validatedAdminMemberId
        );

      request.session
        .admin_user_otp_pending =
        {
          admin_id:
            request.admin.id,

          user_id:
            request
              .validatedAdminMemberId,

          expires_at:
            result
              .otp_expires_at,
        };

      await saveSession(
        request
      );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            result
              .otp_email_sent
              ? "Member access OTP sent successfully."
              : "Member access OTP generated successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   VERIFY USER OTP
========================= */

const verifyAdminUserOtpController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await verifySubadminMemberOtp(
          request.admin,
          request.session
            ?.admin_user_otp_pending,
          request
            .validatedAdminUserOtp
        );

      const verifiedUsers = {
        ...(
          request.session
            ?.admin_otp_verified ||
          {}
        ),
      };

      verifiedUsers[
        String(
          result.user_id
        )
      ] = true;

      request.session
        .admin_otp_verified =
        verifiedUsers;

      delete request.session
        .admin_user_otp_pending;

      await saveSession(
        request
      );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Member access OTP verified successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   LEGACY DASHBOARD
========================= */

const getLegacyAdminDashboardController =
  getAdminDashboardController;

/* =========================
   EXPORTS
========================= */

module.exports = {
  getAdminDashboardController,
  getAdminMembersController,
  getAdminPaidMembersController,
  getAdminMemberDetailsController,
  requestAdminUserOtpController,
  verifyAdminUserOtpController,
  getLegacyAdminDashboardController,
};