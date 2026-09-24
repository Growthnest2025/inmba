const asyncHandler =
  require(
    "../utils/asyncHandler"
  );

const ApiError =
  require(
    "../utils/apiError"
  );

const ApiResponse =
  require(
    "../utils/apiResponse"
  );

const {
  passwordResetService,
} = require(
  "../services"
);

/* =========================
   SAVE SESSION
========================= */

const saveSession =
  (
    req
  ) => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        if (
          !req.session ||
          typeof req.session.save !==
            "function"
        ) {
          return resolve();
        }

        return req.session.save(
          (error) => {
            if (error) {
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
   CLEAR PASSWORD RESET SESSION
========================= */

const clearPasswordResetSession =
  (
    req
  ) => {
    if (!req.session) {
      return;
    }

    delete req.session
      .password_reset_email;

    delete req.session
      .password_reset_member_id;

    delete req.session
      .password_reset_verified;

    delete req.session
      .password_reset_verified_at;
  };

/* =========================
   FORGOT PASSWORD
========================= */

/*
  POST /api/forgot-password
*/

const forgotPasswordController =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const result =
        await passwordResetService
          .requestPasswordReset(
            req.validatedData
          );

      /*
        Verify OTP page-ல் email மீண்டும்
        user-கிட்ட கேட்காமல் session-ல் save.
      */

      clearPasswordResetSession(
        req
      );

      if (req.session) {
        req.session
          .password_reset_email =
            result.email;

        req.session
          .password_reset_verified =
            false;

        await saveSession(
          req
        );
      }

      const responseData = {
        email:
          result.email,

        expiresAt:
          result.expiresAt ||
          null,

        nextAction: {
          type:
            "NAVIGATE",

          path:
            "/verify-otp",
        },
      };

      /*
        Development mode-ல் மட்டும்
        testing details response-ல் வரும்.

        Production-ல் OTP expose ஆகாது.
      */

      if (
        process.env.NODE_ENV !==
        "production"
      ) {
        responseData.otpSent =
          result.otpSent;

        responseData.provider =
          result.provider ||
          null;

        responseData.developmentOtp =
          result.developmentOtp ||
          null;
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            responseData,
            result.message
          )
        );
    }
  );

/* =========================
   VERIFY OTP
========================= */

/*
  POST /api/verify-otp
*/

const verifyOtpController =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const email =
        req.session
          ?.password_reset_email;

      if (!email) {
        const error =
          new ApiError(
            401,
            "Please request a password reset OTP first."
          );

        error.code =
          "PASSWORD_RESET_REQUEST_REQUIRED";

        throw error;
      }

      const result =
        await passwordResetService
          .verifyPasswordResetOtp({
            email,

            otp:
              req.validatedData
                .otp,
          });

      if (req.session) {
        req.session
          .password_reset_email =
            result.email;

        req.session
          .password_reset_member_id =
            result.memberId;

        req.session
          .password_reset_verified =
            true;

        req.session
          .password_reset_verified_at =
            result.verifiedAt
              ? new Date(
                  result.verifiedAt
                ).toISOString()
              : new Date()
                  .toISOString();

        await saveSession(
          req
        );
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            {
              verified:
                true,

              email:
                result.email,

              nextAction: {
                type:
                  "NAVIGATE",

                path:
                  "/reset-password",
              },
            },
            result.message
          )
        );
    }
  );

/* =========================
   RESET PASSWORD
========================= */

/*
  POST /api/reset-password
*/

const resetPasswordController =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const email =
        req.session
          ?.password_reset_email;

      const memberId =
        req.session
          ?.password_reset_member_id;

      const verified =
        req.session
          ?.password_reset_verified;

      if (
        !email ||
        !memberId ||
        verified !== true
      ) {
        const error =
          new ApiError(
            401,
            "Please verify your OTP before resetting the password."
          );

        error.code =
          "OTP_VERIFICATION_REQUIRED";

        throw error;
      }

      const result =
        await passwordResetService
          .resetPassword({
            ...req.validatedData,

            email,

            memberId,
          });

      /*
        Password reset success ஆனதும்
        temporary reset session values clear.
      */

      clearPasswordResetSession(
        req
      );

      await saveSession(
        req
      );

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            {
              email:
                result.email,

              redirectTo:
                "/login",

              nextAction:
                result.nextAction,
            },
            result.message
          )
        );
    }
  );

/* =========================
   EXPORTS
========================= */

module.exports = {
  saveSession,
  clearPasswordResetSession,

  forgotPasswordController,
  verifyOtpController,
  resetPasswordController,
};