const ApiError =
  require(
    "../utils/apiError"
  );

const {
  passwordResetRepository,
} = require(
  "../repositories"
);

const {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  createOtpExpiry,
  isOtpExpired,
  getDevelopmentOtp,
} = require(
  "../utils/passwordReset.utils"
);

const {
  sendPasswordResetOtp,
} = require(
  "./email.service"
);

const {
  hashLegacyPassword,
} = require(
  "./auth.service"
);

/* =========================
   SUCCESS MESSAGES
========================= */

const FORGOT_PASSWORD_SUCCESS_MESSAGE =
  "If an account exists for this email, a password reset OTP has been sent.";

const OTP_VERIFIED_SUCCESS_MESSAGE =
  "OTP verified successfully.";

const PASSWORD_RESET_SUCCESS_MESSAGE =
  "Password reset successfully. You can now login using your new password.";

const INVALID_OTP_MESSAGE =
  "Invalid email or OTP.";

/* =========================
   CREATE PASSWORD RESET ERROR
========================= */

const createPasswordResetError =
  ({
    statusCode = 400,
    message,
    code,
    field = null,
  }) => {
    const errors =
      field
        ? [
            {
              field,
              message,
              code,
            },
          ]
        : [];

    const error =
      new ApiError(
        statusCode,
        message,
        errors
      );

    error.code =
      code;

    return error;
  };

/* =========================
   GET AFFECTED ROWS
========================= */

const getAffectedRows =
  (
    result
  ) => {
    return Number(
      result?.affectedRows ??
      result?.changedRows ??
      0
    );
  };

/* =========================
   CREATE SERVICE
========================= */

const createPasswordResetService =
  ({
    repository =
      passwordResetRepository,

    emailService =
      sendPasswordResetOtp,
  } = {}) => {
    /* =========================
       REQUEST PASSWORD RESET OTP
    ========================= */

    const requestPasswordReset =
      async (
        payload = {}
      ) => {
        const email =
          repository
            .normalizeEmail(
              payload.email
            );

        if (!email) {
          throw createPasswordResetError({
            message:
              "Email is required.",

            code:
              "EMAIL_REQUIRED",

            field:
              "email",
          });
        }

        const emailPattern =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
          !emailPattern.test(
            email
          )
        ) {
          throw createPasswordResetError({
            message:
              "Please enter a valid email address.",

            code:
              "INVALID_EMAIL",

            field:
              "email",
          });
        }

        const member =
          await repository
            .findMemberByEmail(
              email
            );

        /*
          Unknown email என்றாலும் same
          success response return செய்கிறோம்.

          இதனால் account enumeration
          prevent செய்யப்படுகிறது.
        */

        if (!member) {
          return {
            success:
              true,

            message:
              FORGOT_PASSWORD_SUCCESS_MESSAGE,

            email,

            otpSent:
              false,
          };
        }

        const otp =
          generateOtp();

        const expiresAt =
          createOtpExpiry();

        await repository
          .savePasswordResetOtp({
            memberId:
              member.id,

            otp,

            expiresAt,
          });

        let emailResult;

        try {
          emailResult =
            await emailService({
              to:
                email,

              otp,
            });
        } catch (error) {
          /*
            Email send fail ஆனால்
            database-ல் save ஆன OTP
            clear செய்யப்படுகிறது.
          */

          await repository
            .clearPasswordResetOtp(
              member.id
            );

          throw createPasswordResetError({
            statusCode:
              500,

            message:
              "Unable to send password reset OTP. Please try again.",

            code:
              "OTP_EMAIL_FAILED",
          });
        }

        return {
          success:
            true,

          message:
            FORGOT_PASSWORD_SUCCESS_MESSAGE,

          email,

          otpSent:
            true,

          expiresAt,

          provider:
            emailResult.provider,

          /*
            Development mode-ல் மட்டும்
            OTP response-ல் வரும்.

            Production mode-ல் undefined.
          */

          developmentOtp:
            getDevelopmentOtp(
              otp
            ),
        };
      };

    /* =========================
       VERIFY PASSWORD RESET OTP
    ========================= */

    const verifyPasswordResetOtp =
      async (
        payload = {}
      ) => {
        const email =
          repository
            .normalizeEmail(
              payload.email
            );

        const otp =
          String(
            payload.otp ??
            ""
          ).trim();

        if (!email) {
          throw createPasswordResetError({
            message:
              "Email is required.",

            code:
              "EMAIL_REQUIRED",

            field:
              "email",
          });
        }

        if (!otp) {
          throw createPasswordResetError({
            message:
              "OTP is required.",

            code:
              "OTP_REQUIRED",

            field:
              "otp",
          });
        }

        if (
          !/^\d{6}$/.test(
            otp
          )
        ) {
          throw createPasswordResetError({
            message:
              "OTP must contain exactly six digits.",

            code:
              "INVALID_OTP_FORMAT",

            field:
              "otp",
          });
        }

        const otpRecord =
          await repository
            .findOtpRecordByEmail(
              email
            );

        if (
          !otpRecord ||
          !otpRecord.otp
        ) {
          throw createPasswordResetError({
            message:
              INVALID_OTP_MESSAGE,

            code:
              "INVALID_OTP",
          });
        }

        if (
          isOtpExpired(
            otpRecord.otp_expires
          )
        ) {
          await repository
            .clearPasswordResetOtp(
              otpRecord.id
            );

          throw createPasswordResetError({
            message:
              "OTP has expired. Please request a new OTP.",

            code:
              "OTP_EXPIRED",

            field:
              "otp",
          });
        }

        /*
          Existing Flask database
          plain six-digit OTP store செய்கிறது.

          Compare செய்யும்போது SHA-256
          மற்றும் timingSafeEqual use செய்கிறோம்.
        */

        const storedOtpHash =
          hashOtp(
            otpRecord.otp
          );

        const otpMatches =
          verifyOtpHash(
            otp,
            storedOtpHash
          );

        if (!otpMatches) {
          throw createPasswordResetError({
            message:
              INVALID_OTP_MESSAGE,

            code:
              "INVALID_OTP",

            field:
              "otp",
          });
        }

        /*
          Controller இந்த values-ஐ
          session-ல் temporarily store செய்யும்.

          Password update success ஆன பிறகு
          OTP clear செய்யப்படும்.
        */

        return {
          success:
            true,

          verified:
            true,

          message:
            OTP_VERIFIED_SUCCESS_MESSAGE,

          email,

          memberId:
            otpRecord.id,

          verifiedAt:
            new Date(),
        };
      };

    /* =========================
       RESET MEMBER PASSWORD
    ========================= */

    const resetPassword =
      async (
        payload = {}
      ) => {
        const email =
          repository
            .normalizeEmail(
              payload.email
            );

        const memberId =
          repository
            .normalizeMemberId(
              payload.memberId ??
              payload.verifiedMemberId
            );

        const password =
          String(
            payload.password ??
            ""
          );

        const confirmPassword =
          String(
            payload.confirm_password ??
            payload.confirmPassword ??
            ""
          );

        /*
          Email மற்றும் member ID
          OTP verification session-லிருந்து
          controller pass செய்ய வேண்டும்.
        */

        if (
          !email ||
          !memberId
        ) {
          throw createPasswordResetError({
            statusCode:
              401,

            message:
              "Please verify your OTP before resetting the password.",

            code:
              "OTP_VERIFICATION_REQUIRED",
          });
        }

        if (
          !password ||
          !confirmPassword
        ) {
          throw createPasswordResetError({
            message:
              "All fields required.",

            code:
              "ALL_FIELDS_REQUIRED",

            field:
              !password
                ? "password"
                : "confirm_password",
          });
        }

        if (
          password !==
          confirmPassword
        ) {
          throw createPasswordResetError({
            message:
              "Passwords do not match.",

            code:
              "PASSWORDS_DO_NOT_MATCH",

            field:
              "confirm_password",
          });
        }

        const member =
          await repository
            .findMemberByEmail(
              email
            );

        /*
          Session email மற்றும் member ID
          database member-க்கு match ஆக வேண்டும்.
        */

        if (
          !member ||
          Number(
            member.id
          ) !==
          Number(
            memberId
          )
        ) {
          throw createPasswordResetError({
            statusCode:
              401,

            message:
              "Password reset verification is invalid. Please request a new OTP.",

            code:
              "INVALID_RESET_VERIFICATION",
          });
        }

        /*
          Existing Flask/login compatibility:

          SHA-256 password hash.
        */

        const passwordHash =
          hashLegacyPassword(
            password
          );

        const updateResult =
          await repository
            .updatePasswordAndClearOtp({
              email,

              passwordHash,
            });

        if (
          getAffectedRows(
            updateResult
          ) < 1
        ) {
          throw createPasswordResetError({
            statusCode:
              500,

            message:
              "Unable to reset password. Please try again.",

            code:
              "PASSWORD_RESET_FAILED",
          });
        }

        return {
          success:
            true,

          message:
            PASSWORD_RESET_SUCCESS_MESSAGE,

          email,

          memberId,

          nextAction: {
            type:
              "NAVIGATE",

            path:
              "/login",
          },
        };
      };

    return {
      requestPasswordReset,
      verifyPasswordResetOtp,
      resetPassword,
    };
  };

/* =========================
   DEFAULT SERVICE
========================= */

const passwordResetService =
  createPasswordResetService();

/* =========================
   EXPORTS
========================= */

module.exports = {
  FORGOT_PASSWORD_SUCCESS_MESSAGE,
  OTP_VERIFIED_SUCCESS_MESSAGE,
  PASSWORD_RESET_SUCCESS_MESSAGE,
  INVALID_OTP_MESSAGE,

  createPasswordResetError,
  getAffectedRows,

  createPasswordResetService,

  requestPasswordReset:
    passwordResetService
      .requestPasswordReset,

  verifyPasswordResetOtp:
    passwordResetService
      .verifyPasswordResetOtp,

  resetPassword:
    passwordResetService
      .resetPassword,
};