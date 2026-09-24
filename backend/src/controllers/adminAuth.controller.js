const ApiError =
  require(
    "../utils/apiError"
  );

const {
  getSessionAdmin,
} = require(
  "../middleware/adminAuth.middleware"
);

const {
  startAdminLogin,
  verifyAdminLoginOtp,
  getCurrentAdmin,
  createAdminAccount,
} = require(
  "../services/adminAuth.service"
);

/* =========================
   SAVE SESSION
========================= */

const saveSession =
  (
    request
  ) => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        request.session.save(
          (
            error
          ) => {
            if (
              error
            ) {
              return reject(
                error
              );
            }

            return resolve();
          }
        );
      }
    );
  };

/* =========================
   DESTROY SESSION
========================= */

const destroySession =
  (
    request
  ) => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        request.session.destroy(
          (
            error
          ) => {
            if (
              error
            ) {
              return reject(
                error
              );
            }

            return resolve();
          }
        );
      }
    );
  };

/* =========================
   LOGIN VERIFY
========================= */

const adminLoginVerifyController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await startAdminLogin(
          request
            .validatedAdminLogin
        );

      if (
        result.requires_otp
      ) {
        request.session
          .admin_login_pending =
          {
            admin_id:
              result
                .pending_admin
                .id,

            username:
              result
                .pending_admin
                .username,

            role:
              result
                .pending_admin
                .role,

            expires_at:
              result
                .otp_expires_at,
          };
      } else {
        request.session.admin =
          result.admin;

        delete request.session
          .admin_login_pending;
      }

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
            result.requires_otp
              ? "OTP sent to the registered admin email."
              : "Super Admin login successful.",

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
   OTP VERIFY
========================= */

const adminLoginOtpController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const pendingLogin =
        request.session
          ?.admin_login_pending;

      const result =
        await verifyAdminLoginOtp(
          pendingLogin,
          request
            .validatedAdminOtp
            .otp
        );

      request.session.admin =
        result.admin;

      delete request.session
        .admin_login_pending;

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
            "Admin OTP verified successfully.",

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
   ADMIN ME
========================= */

const getAdminMeController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const sessionAdmin =
        getSessionAdmin(
          request
        );

      if (
        !sessionAdmin
      ) {
        throw new ApiError(
          401,
          "Admin authentication required."
        );
      }

      const admin =
        await getCurrentAdmin(
          sessionAdmin.id
        );

      request.session.admin =
        admin;

      await saveSession(
        request
      );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data: {
            authenticated:
              true,

            admin,
          },

          message:
            "Admin session loaded successfully.",

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
   ADMIN SIGNUP
========================= */

const adminSignupController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await createAdminAccount(
          request
            .validatedAdminSignup
        );

      return response
        .status(201)
        .json({
          statusCode:
            201,

          data:
            result,

          message:
            `${
              result.admin.role ===
              "subadmin"
                ? "Subadmin"
                : "Admin"
            } account created successfully.`,

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
   LOGOUT
========================= */

const adminLogoutController =
  async (
    request,
    response,
    next
  ) => {
    try {
      await destroySession(
        request
      );

      response.clearCookie(
        process.env
          .SESSION_NAME ||
          "session"
      );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data: {
            authenticated:
              false,

            redirectTo:
              "/admin_login",
          },

          message:
            "Admin logout successful.",

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
   LEGACY ADMIN LOGIN PAGE
========================= */

const getLegacyAdminLoginController =
  (
    request,
    response
  ) => {
    return response
      .status(200)
      .json({
        statusCode:
          200,

        data: {
          authenticated:
            Boolean(
              getSessionAdmin(
                request
              )
            ),

          login_endpoint:
            "/api/auth/admin-login-verify",

          otp_endpoint:
            "/api/auth/admin-login-otp",
        },

        message:
          "Admin login endpoint is available.",

        success:
          true,
      });
  };

/* =========================
   LEGACY ALIASES
========================= */

const postLegacyAdminLoginController =
  adminLoginVerifyController;

const legacyAdminLogoutController =
  adminLogoutController;

/* =========================
   EXPORTS
========================= */

module.exports = {
  saveSession,
  destroySession,
  adminLoginVerifyController,
  adminLoginOtpController,
  getAdminMeController,
  adminSignupController,
  adminLogoutController,
  getLegacyAdminLoginController,
  postLegacyAdminLoginController,
  legacyAdminLogoutController,
};