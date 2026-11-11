const ApiError =
  require(
    "../utils/apiError"
  );

/*
  Login ID aliases supported:

  login_id
  loginId
  userid
  user_id

  React frontend loginId அனுப்பினாலும்,
  old Flask form login_id அனுப்பினாலும்
  work ஆகும்.
*/
const extractLoginId =
  (
    input = {}
  ) => {
    return String(
      input.login_id ??
      input.loginId ??
      input.userid ??
      input.user_id ??
      ""
    ).trim();
  };

const extractPassword =
  (
    input = {}
  ) => {
    return String(
      input.password ??
      ""
    );
  };

/*
  Pure validation function.

  Database அல்லது request/response
  dependency கிடையாது.
*/
const validateLoginData =
  (
    input = {}
  ) => {
    const loginId =
      extractLoginId(
        input
      );

    const password =
      extractPassword(
        input
      );

    const errors =
      [];

    if (!loginId) {
      errors.push({
        field:
          "login_id",

        message:
          "Login ID is required.",

        code:
          "LOGIN_ID_REQUIRED",
      });
    }

    if (!password) {
      errors.push({
        field:
          "password",

        message:
          "Password is required.",

        code:
          "PASSWORD_REQUIRED",
      });
    }

    return {
      isValid:
        errors.length === 0,

      valid:
        errors.length === 0,

      success:
        errors.length === 0,

      message:
        errors.length > 0
          ? "Please provide both Login ID and password."
          : null,

      errors,

      data: {
        login_id:
          loginId,

        password,
      },

      validatedData: {
        login_id:
          loginId,

        password,
      },
    };
  };

/*
  Express middleware.

  Controller-ல்:

  req.validatedData.login_id
  req.validatedData.password

  கிடைக்கும்.
*/
const validateMemberLogin =
  (
    req,
    res,
    next
  ) => {
    const input = {
      ...(
        req.body ||
        {}
      ),

      ...(
        req.formFields ||
        {}
      ),
    };

    const result =
      validateLoginData(
        input
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
  extractLoginId,
  extractPassword,
  validateLoginData,
  validateMemberLogin,
};