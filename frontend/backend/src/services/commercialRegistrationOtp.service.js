const ApiError =
  require(
    "../utils/apiError"
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

/* =========================================================
   CONSTANTS
========================================================= */

const COMMERCIAL_OTP_SENT_MESSAGE =
  "OTP sent successfully to your mobile number.";

const COMMERCIAL_OTP_VERIFIED_MESSAGE =
  "Mobile number verified successfully.";

/* =========================================================
   MOBILE NORMALIZER
========================================================= */

const normalizeCommercialMobile =
  (
    value
  ) => {
    const digits =
      String(
        value ?? ""
      )
        .replace(
          /\D/g,
          ""
        )
        .slice(
          -10
        );

    if (
      !/^[6-9]\d{9}$/.test(
        digits
      )
    ) {
      return "";
    }

    return digits;
  };

/* =========================================================
   OTP NORMALIZER
========================================================= */

const normalizeCommercialOtp =
  (
    value
  ) => {
    const otp =
      String(
        value ?? ""
      )
        .replace(
          /\D/g,
          ""
        )
        .slice(
          0,
          6
        );

    if (
      !/^\d{6}$/.test(
        otp
      )
    ) {
      return "";
    }

    return otp;
  };

/* =========================================================
   ERROR
========================================================= */

const createCommercialOtpError =
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

/* =========================================================
   DEVELOPMENT OTP LOG
========================================================= */

const logDevelopmentCommercialOtp =
  ({
    phone,
    otp,
  }) => {
    console.log(
      "\n========================================"
    );

    console.log(
      "INMBA COMMERCIAL REGISTRATION OTP"
    );

    console.log(
      `Mobile : ${phone}`
    );

    console.log(
      `OTP    : ${otp}`
    );

    console.log(
      "========================================\n"
    );
  };

/* =========================================================
   SEND COMMERCIAL OTP

   Development:
   OTP backend terminal-la show aagum.

   Production:
   SMS provider configure panna vendum.
========================================================= */

const sendCommercialRegistrationOtp =
  async ({
    phone,
    otp,
  }) => {
    const normalizedPhone =
      normalizeCommercialMobile(
        phone
      );

    const normalizedOtp =
      normalizeCommercialOtp(
        otp
      );

    if (
      !normalizedPhone
    ) {
      throw createCommercialOtpError({
        message:
          "Enter a valid 10-digit Indian mobile number.",

        code:
          "INVALID_COMMERCIAL_MOBILE",

        field:
          "phone",
      });
    }

    if (
      !normalizedOtp
    ) {
      throw createCommercialOtpError({
        statusCode:
          500,

        message:
          "Unable to generate a valid OTP.",

        code:
          "INVALID_COMMERCIAL_OTP",
      });
    }

    /* =====================================================
       DEVELOPMENT
    ===================================================== */

    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      logDevelopmentCommercialOtp({
        phone:
          normalizedPhone,

        otp:
          normalizedOtp,
      });

      return {
        success:
          true,

        sent:
          true,

        provider:
          "development",

        phone:
          normalizedPhone,
      };
    }

    /* =====================================================
       PRODUCTION

       Real SMS provider configure pannum varai
       fake success return panna koodathu.
    ===================================================== */

    throw createCommercialOtpError({
      statusCode:
        503,

      message:
        "SMS provider is not configured for Commercial Registration OTP.",

      code:
        "COMMERCIAL_SMS_PROVIDER_NOT_CONFIGURED",
    });
  };

/* =========================================================
   REQUEST COMMERCIAL REGISTRATION OTP
========================================================= */

const requestCommercialRegistrationOtp =
  async (
    payload = {}
  ) => {
    const phone =
      normalizeCommercialMobile(
        payload.phone ??
        payload.mobile
      );

    if (
      !phone
    ) {
      throw createCommercialOtpError({
        message:
          "Enter a valid 10-digit Indian mobile number.",

        code:
          "INVALID_COMMERCIAL_MOBILE",

        field:
          "phone",
      });
    }

    /* =====================================================
       GENERATE OTP
    ===================================================== */

    const otp =
      generateOtp();

    if (
      !/^\d{6}$/.test(
        String(
          otp
        )
      )
    ) {
      throw createCommercialOtpError({
        statusCode:
          500,

        message:
          "Unable to generate OTP. Please try again.",

        code:
          "COMMERCIAL_OTP_GENERATION_FAILED",
      });
    }

    /* =====================================================
       HASH OTP

       Plain OTP session-la save panna koodathu.
    ===================================================== */

    const otpHash =
      hashOtp(
        otp
      );

    /* =====================================================
       EXPIRY
    ===================================================== */

    const expiresAt =
      createOtpExpiry();

    /* =====================================================
       SEND
    ===================================================== */

    const smsResult =
      await sendCommercialRegistrationOtp({
        phone,
        otp,
      });

    /* =====================================================
       RESULT
    ===================================================== */

    return {
      success:
        true,

      message:
        COMMERCIAL_OTP_SENT_MESSAGE,

      phone,

      otpHash,

      expiresAt,

      provider:
        smsResult?.provider ||
        null,

      developmentOtp:
        process.env.NODE_ENV !==
        "production"
          ? getDevelopmentOtp(
              otp
            )
          : undefined,
    };
  };

/* =========================================================
   VERIFY COMMERCIAL REGISTRATION OTP
========================================================= */

const verifyCommercialRegistrationOtp =
  async (
    payload = {}
  ) => {
    const phone =
      normalizeCommercialMobile(
        payload.phone ??
        payload.mobile
      );

    const otp =
      normalizeCommercialOtp(
        payload.otp
      );

    const storedPhone =
      normalizeCommercialMobile(
        payload.storedPhone
      );

    const storedOtpHash =
      String(
        payload.storedOtpHash ??
        ""
      ).trim();

    const expiresAt =
      payload.expiresAt ||
      null;

    /* =====================================================
       PHONE
    ===================================================== */

    if (
      !phone
    ) {
      throw createCommercialOtpError({
        message:
          "Enter a valid 10-digit Indian mobile number.",

        code:
          "INVALID_COMMERCIAL_MOBILE",

        field:
          "phone",
      });
    }

    /* =====================================================
       OTP FORMAT
    ===================================================== */

    if (
      !otp
    ) {
      throw createCommercialOtpError({
        message:
          "Enter a valid 6-digit OTP.",

        code:
          "INVALID_COMMERCIAL_OTP_FORMAT",

        field:
          "otp",
      });
    }

    /* =====================================================
       OTP REQUEST CHECK
    ===================================================== */

    if (
      !storedPhone ||
      !storedOtpHash ||
      !expiresAt
    ) {
      throw createCommercialOtpError({
        statusCode:
          401,

        message:
          "Please request an OTP first.",

        code:
          "COMMERCIAL_OTP_REQUEST_REQUIRED",
      });
    }

    /* =====================================================
       PHONE MATCH
    ===================================================== */

    if (
      phone !==
      storedPhone
    ) {
      throw createCommercialOtpError({
        statusCode:
          401,

        message:
          "Mobile number does not match the OTP request. Please request a new OTP.",

        code:
          "COMMERCIAL_OTP_PHONE_MISMATCH",

        field:
          "phone",
      });
    }

    /* =====================================================
       EXPIRY
    ===================================================== */

    if (
      isOtpExpired(
        expiresAt
      )
    ) {
      throw createCommercialOtpError({
        statusCode:
          400,

        message:
          "OTP has expired. Please request a new OTP.",

        code:
          "COMMERCIAL_OTP_EXPIRED",

        field:
          "otp",
      });
    }

    /* =====================================================
       VERIFY HASH
    ===================================================== */

    const otpMatches =
      verifyOtpHash(
        otp,
        storedOtpHash
      );

    if (
      !otpMatches
    ) {
      throw createCommercialOtpError({
        statusCode:
          400,

        message:
          "Invalid OTP. Please try again.",

        code:
          "INVALID_COMMERCIAL_OTP",

        field:
          "otp",
      });
    }

    /* =====================================================
       VERIFIED
    ===================================================== */

    return {
      success:
        true,

      verified:
        true,

      message:
        COMMERCIAL_OTP_VERIFIED_MESSAGE,

      phone,

      verifiedAt:
        new Date()
          .toISOString(),
    };
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  COMMERCIAL_OTP_SENT_MESSAGE,
  COMMERCIAL_OTP_VERIFIED_MESSAGE,

  normalizeCommercialMobile,
  normalizeCommercialOtp,

  createCommercialOtpError,

  requestCommercialRegistrationOtp,
  verifyCommercialRegistrationOtp,
};