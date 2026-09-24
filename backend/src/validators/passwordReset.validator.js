const ApiError =
  require(
    "../utils/apiError"
  );

const EMAIL_PATTERN =
  /^[\w.-]+@[\w.-]+\.\w{2,}$/;

const normalizeEmail =
  (
    value
  ) => {
    return String(
      value ?? ""
    )
      .trim()
      .toLowerCase();
  };

const normalizeOtp =
  (
    value
  ) => {
    return String(
      value ?? ""
    ).trim();
  };

const extractRequestData =
  (
    req
  ) => {
    return {
      ...(
        req.body ||
        {}
      ),

      ...(
        req.formFields ||
        {}
      ),
    };
  };

/*
  =========================
  FORGOT PASSWORD
  =========================
*/

const validateForgotPasswordData =
  (
    input = {}
  ) => {
    const email =
      normalizeEmail(
        input.email
      );

    const errors =
      [];

    if (!email) {
      errors.push({
        field:
          "email",

        message:
          "Email is required",

        code:
          "EMAIL_REQUIRED",
      });
    } else if (
      !EMAIL_PATTERN.test(
        email
      )
    ) {
      errors.push({
        field:
          "email",

        message:
          "Invalid email address",

        code:
          "INVALID_EMAIL",
      });
    }

    return {
      isValid:
        errors.length === 0,

      message:
        errors[0]?.message ||
        null,

      errors,

      data: {
        email,
      },
    };
  };

const validateForgotPassword =
  (
    req,
    res,
    next
  ) => {
    const result =
      validateForgotPasswordData(
        extractRequestData(
          req
        )
      );

    if (
      !result.isValid
    ) {
      const error =
        new ApiError(
          400,
          result.message,
          result.errors
        );

      error.code =
        "VALIDATION_ERROR";

      return next(
        error
      );
    }

    req.validatedData =
      result.data;

    return next();
  };

/*
  =========================
  VERIFY OTP
  =========================
*/

const validateVerifyOtpData =
  (
    input = {}
  ) => {
    const otp =
      normalizeOtp(
        input.otp
      );

    const errors =
      [];

    if (!otp) {
      errors.push({
        field:
          "otp",

        message:
          "OTP is required",

        code:
          "OTP_REQUIRED",
      });
    } else if (
      !/^\d{6}$/.test(
        otp
      )
    ) {
      errors.push({
        field:
          "otp",

        message:
          "Invalid OTP",

        code:
          "INVALID_OTP_FORMAT",
      });
    }

    return {
      isValid:
        errors.length === 0,

      message:
        errors[0]?.message ||
        null,

      errors,

      data: {
        otp,
      },
    };
  };

const validateVerifyOtp =
  (
    req,
    res,
    next
  ) => {
    const result =
      validateVerifyOtpData(
        extractRequestData(
          req
        )
      );

    if (
      !result.isValid
    ) {
      const error =
        new ApiError(
          400,
          result.message,
          result.errors
        );

      error.code =
        "VALIDATION_ERROR";

      return next(
        error
      );
    }

    req.validatedData =
      result.data;

    return next();
  };

/*
  =========================
  RESET PASSWORD
  =========================
*/

const validateResetPasswordData =
  (
    input = {}
  ) => {
    const password =
      String(
        input.password ??
        ""
      );

    const confirmPassword =
      String(
        input.confirm_password ??
        input.confirmPassword ??
        ""
      );

    const errors =
      [];

    if (
      !password ||
      !confirmPassword
    ) {
      errors.push({
        field:
          !password
            ? "password"
            : "confirm_password",

        message:
          "All fields required",

        code:
          "ALL_FIELDS_REQUIRED",
      });
    } else if (
      password !==
      confirmPassword
    ) {
      errors.push({
        field:
          "confirm_password",

        message:
          "Passwords do not match",

        code:
          "PASSWORDS_DO_NOT_MATCH",
      });
    }

    return {
      isValid:
        errors.length === 0,

      message:
        errors[0]?.message ||
        null,

      errors,

      data: {
        password,

        confirm_password:
          confirmPassword,
      },
    };
  };

const validateResetPassword =
  (
    req,
    res,
    next
  ) => {
    const result =
      validateResetPasswordData(
        extractRequestData(
          req
        )
      );

    if (
      !result.isValid
    ) {
      const error =
        new ApiError(
          400,
          result.message,
          result.errors
        );

      error.code =
        "VALIDATION_ERROR";

      return next(
        error
      );
    }

    req.validatedData =
      result.data;

    return next();
  };

module.exports = {
  EMAIL_PATTERN,

  normalizeEmail,
  normalizeOtp,
  extractRequestData,

  validateForgotPasswordData,
  validateForgotPassword,

  validateVerifyOtpData,
  validateVerifyOtp,

  validateResetPasswordData,
  validateResetPassword,
};