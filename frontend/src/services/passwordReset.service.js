import axios from "axios";

/* ========================================
   PASSWORD RESET API CLIENT

   Backend routes are root routes:

   /forgot_password
   /verify_otp
   /reset_password

   So api.js /api baseURL is not used here.
======================================== */

const passwordResetApi =
  axios.create({
    baseURL: "/",

    withCredentials: true,

    timeout: 45000,

    headers: {
      Accept: "application/json",

      "Content-Type":
        "application/json",
    },
  });

/* ========================================
   SESSION STORAGE KEY

   This email is only for frontend UI.

   Actual password reset authorization
   is maintained by backend session cookie.
======================================== */

export const PASSWORD_RESET_EMAIL_KEY =
  "inmba_password_reset_email";

/* ========================================
   COMMON HELPERS
======================================== */

const asObject = (value) => {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
};

const toText = (
  value,
  fallback = ""
) => {
  const normalizedValue =
    String(value ?? "").trim();

  return normalizedValue || fallback;
};

/* ========================================
   EMAIL NORMALIZER
======================================== */

export const normalizeResetEmail = (
  value
) => {
  return toText(value, "")
    .toLowerCase();
};

/* ========================================
   EMAIL VALIDATOR
======================================== */

export const validateResetEmail = (
  value
) => {
  const email =
    normalizeResetEmail(value);

  if (!email) {
    return {
      valid: false,

      error:
        "Email address is required.",
    };
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!emailPattern.test(email)) {
    return {
      valid: false,

      error:
        "Enter a valid email address.",
    };
  }

  return {
    valid: true,

    error: "",

    value: email,
  };
};

/* ========================================
   OTP NORMALIZER
======================================== */

export const normalizeOtp = (
  value
) => {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);
};

/* ========================================
   OTP VALIDATOR
======================================== */

export const validateOtp = (
  value
) => {
  const otp =
    normalizeOtp(value);

  if (!otp) {
    return {
      valid: false,

      error:
        "OTP is required.",
    };
  }

  if (!/^\d{6}$/.test(otp)) {
    return {
      valid: false,

      error:
        "Enter the complete 6-digit OTP.",
    };
  }

  return {
    valid: true,

    error: "",

    value: otp,
  };
};

/* ========================================
   RESPONSE ROUTE
======================================== */

const getNextRoute = (
  body,
  data
) => {
  return toText(
    data.nextRoute ??
      data.redirectTo ??
      data.redirect_to ??
      data.nextAction?.path ??
      body.nextRoute ??
      body.redirectTo ??
      body.redirect_to ??
      body.nextAction?.path,
    ""
  );
};

/* ========================================
   RESPONSE NORMALIZER
======================================== */

const normalizeResponse = (
  response
) => {
  const responseBody =
    response?.data;

  if (
    typeof responseBody ===
    "string"
  ) {
    const responseText =
      responseBody
        .trim()
        .toLowerCase();

    const invalidResponseError =
      new Error(
        responseText.includes(
          "<html"
        )
          ? "Authentication API returned an HTML page instead of JSON."
          : "Authentication API returned an invalid response."
      );

    invalidResponseError.statusCode =
      Number(
        response?.status || 0
      );

    invalidResponseError.apiMessage =
      invalidResponseError.message;

    throw invalidResponseError;
  }

  const body =
    asObject(responseBody);

  const nestedData =
    asObject(body.data);

  const data =
    Object.keys(nestedData)
      .length > 0
      ? nestedData
      : body;

  return {
    success:
      body.success !== false,

    statusCode:
      Number(
        body.statusCode ??
          response?.status ??
          200
      ),

    message:
      toText(
        body.message ??
          data.message,
        "Request completed successfully."
      ),

    nextRoute:
      getNextRoute(
        body,
        data
      ),

    email:
      normalizeResetEmail(
        data.email ??
          body.email
      ),

    expiresIn:
      Number(
        data.expiresIn ??
          data.expires_in ??
          body.expiresIn ??
          body.expires_in ??
          300
      ),

    data,

    raw: body,
  };
};

/* ========================================
   ERROR NORMALIZER
======================================== */

const normalizeRequestError =
  async (error) => {
    const responseData =
      error?.response?.data;

    if (
      responseData instanceof Blob
    ) {
      try {
        const blobText =
          await responseData.text();

        if (blobText) {
          try {
            const parsedData =
              JSON.parse(blobText);

            error.apiMessage =
              parsedData.message ||
              parsedData.error ||
              "";
          } catch {
            error.apiMessage =
              blobText
                .toLowerCase()
                .includes("<html")
                ? "Authentication API returned an invalid HTML response."
                : blobText;
          }
        }
      } catch {
        // Keep original error.
      }
    }

    const normalizedData =
      asObject(
        error?.response?.data
      );

    error.statusCode =
      Number(
        error?.response?.status ||
          error?.statusCode ||
          0
      );

    error.apiMessage =
      toText(
        error?.apiMessage ??
          normalizedData.message ??
          normalizedData.error ??
          error?.message,
        "Unable to complete password reset request."
      );

    error.fieldErrors =
      asObject(
        normalizedData.errors ??
          normalizedData.fieldErrors
      );

    throw error;
  };

/* ========================================
   STORE RESET EMAIL

   Frontend navigation helper only.
======================================== */

export const storePasswordResetEmail = (
  email
) => {
  const normalizedEmail =
    normalizeResetEmail(email);

  if (
    typeof window ===
    "undefined"
  ) {
    return normalizedEmail;
  }

  if (normalizedEmail) {
    window.sessionStorage.setItem(
      PASSWORD_RESET_EMAIL_KEY,
      normalizedEmail
    );
  }

  return normalizedEmail;
};

/* ========================================
   GET STORED RESET EMAIL
======================================== */

export const getStoredPasswordResetEmail =
  () => {
    if (
      typeof window ===
      "undefined"
    ) {
      return "";
    }

    return normalizeResetEmail(
      window.sessionStorage.getItem(
        PASSWORD_RESET_EMAIL_KEY
      )
    );
  };

/* ========================================
   CLEAR RESET EMAIL
======================================== */

export const clearStoredPasswordResetEmail =
  () => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    window.sessionStorage.removeItem(
      PASSWORD_RESET_EMAIL_KEY
    );
  };

/* ========================================
   FORGOT PASSWORD

   Exact API:
   POST /forgot_password

   Exact body:
   {
     email
   }
======================================== */

export const requestPasswordReset =
  async (
    email,
    {
      signal,
    } = {}
  ) => {
    const validation =
      validateResetEmail(email);

    if (!validation.valid) {
      const validationError =
        new Error(
          validation.error
        );

      validationError.fieldErrors = {
        email:
          validation.error,
      };

      throw validationError;
    }

    try {
      const response =
        await passwordResetApi.post(
          "/forgot_password",
          {
            email:
              validation.value,
          },
          {
            signal,
          }
        );

      const result =
        normalizeResponse(
          response
        );

      storePasswordResetEmail(
        result.email ||
          validation.value
      );

      return {
        ...result,

        email:
          result.email ||
          validation.value,

        nextRoute:
          result.nextRoute ||
          "/verify_otp",
      };
    } catch (error) {
      return normalizeRequestError(
        error
      );
    }
  };

/* ========================================
   VERIFY OTP

   Exact API:
   POST /verify_otp

   Exact body:
   {
     otp
   }

   Backend identifies email through
   the reset_email session value.
======================================== */

export const verifyPasswordResetOtp =
  async (
    otp,
    {
      signal,
    } = {}
  ) => {
    const validation =
      validateOtp(otp);

    if (!validation.valid) {
      const validationError =
        new Error(
          validation.error
        );

      validationError.fieldErrors = {
        otp:
          validation.error,
      };

      throw validationError;
    }

    try {
      const response =
        await passwordResetApi.post(
          "/verify_otp",
          {
            otp:
              validation.value,
          },
          {
            signal,
          }
        );

      const result =
        normalizeResponse(
          response
        );

      return {
        ...result,

        nextRoute:
          result.nextRoute ||
          "/reset_password",
      };
    } catch (error) {
      return normalizeRequestError(
        error
      );
    }
  };

/* ========================================
   RESET PASSWORD

   Exact API:
   POST /reset_password

   Exact body:
   {
     password,
     confirm_password
   }

   Backend identifies account through
   the reset_email session value.
======================================== */

export const resetMemberPassword =
  async (
    {
      password,
      confirm_password,
    },
    {
      signal,
    } = {}
  ) => {
    const normalizedPassword =
      String(password ?? "");

    const normalizedConfirmation =
      String(
        confirm_password ?? ""
      );

    if (!normalizedPassword) {
      const validationError =
        new Error(
          "New password is required."
        );

      validationError.fieldErrors = {
        password:
          "New password is required.",
      };

      throw validationError;
    }

    if (!normalizedConfirmation) {
      const validationError =
        new Error(
          "Confirm password is required."
        );

      validationError.fieldErrors = {
        confirm_password:
          "Confirm password is required.",
      };

      throw validationError;
    }

    if (
      normalizedPassword !==
      normalizedConfirmation
    ) {
      const validationError =
        new Error(
          "Passwords do not match."
        );

      validationError.fieldErrors = {
        confirm_password:
          "Passwords do not match.",
      };

      throw validationError;
    }

    try {
      const response =
        await passwordResetApi.post(
          "/reset_password",
          {
            password:
              normalizedPassword,

            confirm_password:
              normalizedConfirmation,
          },
          {
            signal,
          }
        );

      const result =
        normalizeResponse(
          response
        );

      clearStoredPasswordResetEmail();

      return {
        ...result,

        nextRoute:
          result.nextRoute ||
          "/login",
      };
    } catch (error) {
      return normalizeRequestError(
        error
      );
    }
  };

/* ========================================
   COMPATIBILITY EXPORTS
======================================== */

export const forgotPassword =
  requestPasswordReset;

export const verifyOtp =
  verifyPasswordResetOtp;

export const resetPassword =
  resetMemberPassword;

/* ========================================
   DEFAULT EXPORT
======================================== */

const passwordResetService = {
  requestPasswordReset,
  forgotPassword,

  verifyPasswordResetOtp,
  verifyOtp,

  resetMemberPassword,
  resetPassword,

  storePasswordResetEmail,
  getStoredPasswordResetEmail,
  clearStoredPasswordResetEmail,

  validateResetEmail,
  validateOtp,
  normalizeOtp,
};

export default passwordResetService;