const ApiError =
  require(
    "../utils/apiError"
  );

/* =========================
   CLEAN TEXT
========================= */

const cleanText =
  (
    value
  ) => {
    const firstValue =
      Array.isArray(
        value
      )
        ? value[0]
        : value;

    if (
      firstValue === null ||
      firstValue ===
        undefined
    ) {
      return "";
    }

    return String(
      firstValue
    ).trim();
  };

/* =========================
   NORMALIZE ROLE
========================= */

const normalizeAdminRole =
  (
    role
  ) => {
    const value =
      cleanText(
        role
      )
        .toLowerCase()
        .replace(
          /[\s-]+/g,
          "_"
        );

    const aliases = {
      superadmin:
        "super_admin",

      super_admin:
        "super_admin",

      admin:
        "admin",

      subadmin:
        "subadmin",

      sub_admin:
        "subadmin",
    };

    return aliases[value] ||
      null;
  };

/* =========================
   LOGIN VALIDATION
========================= */

const validateAdminLoginData =
  (
    payload = {}
  ) => {
    const errors = [];

    const data = {
      role:
        normalizeAdminRole(
          payload.role ||
            "super_admin"
        ),

      username:
        cleanText(
          payload.username
        ),

      password:
        cleanText(
          payload.password
        ),

      email:
        cleanText(
          payload.email
        ).toLowerCase(),

      secret_key:
        cleanText(
          payload.secret_key ||
            payload.secretKey
        ),
    };

    if (
      !data.role
    ) {
      errors.push(
        "Valid admin role is required."
      );
    }

    if (
      !data.username
    ) {
      errors.push(
        "Username is required."
      );
    }

    if (
      !/^[A-Za-z0-9_.-]{3,150}$/.test(
        data.username
      )
    ) {
      errors.push(
        "Username contains invalid characters."
      );
    }

    if (
      !data.password
    ) {
      errors.push(
        "Password is required."
      );
    }

    if (
      data.role ===
        "super_admin" &&
      !data.secret_key
    ) {
      errors.push(
        "Super Admin secret key is required."
      );
    }

    if (
      [
        "admin",
        "subadmin",
      ].includes(
        data.role
      )
    ) {
      if (
        !data.email
      ) {
        errors.push(
          "Registered email is required."
        );
      } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          data.email
        )
      ) {
        errors.push(
          "Valid registered email is required."
        );
      }
    }

    return {
      isValid:
        errors.length ===
        0,

      errors,

      data,
    };
  };

/* =========================
   OTP VALIDATION
========================= */

const validateAdminOtpData =
  (
    payload = {}
  ) => {
    const errors = [];

    const data = {
      otp:
        cleanText(
          payload.otp
        ).replace(
          /\D/g,
          ""
        ),
    };

    if (
      !/^[0-9]{6}$/.test(
        data.otp
      )
    ) {
      errors.push(
        "OTP must contain exactly 6 digits."
      );
    }

    return {
      isValid:
        errors.length ===
        0,

      errors,

      data,
    };
  };

/* =========================
   SIGNUP VALIDATION
========================= */

const validateAdminSignupData =
  (
    payload = {}
  ) => {
    const errors = [];

    const data = {
      username:
        cleanText(
          payload.username
        ),

      email:
        cleanText(
          payload.email
        ).toLowerCase(),

      mobile:
        cleanText(
          payload.mobile
        ).replace(
          /\D/g,
          ""
        ),

      first_name:
        cleanText(
          payload.first_name
        ),

      last_name:
        cleanText(
          payload.last_name
        ),

      role:
        normalizeAdminRole(
          payload.role
        ),

      password:
        cleanText(
          payload.password
        ),

      confirm_password:
        cleanText(
          payload.confirm_password ||
            payload.confirmPassword
        ),
    };

    if (
      !/^[A-Za-z0-9_.-]{3,150}$/.test(
        data.username
      )
    ) {
      errors.push(
        "Username must contain 3 to 150 valid characters."
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        data.email
      )
    ) {
      errors.push(
        "Valid email is required."
      );
    }

    if (
      data.mobile &&
      !/^[0-9]{10,15}$/.test(
        data.mobile
      )
    ) {
      errors.push(
        "Mobile number must contain 10 to 15 digits."
      );
    }

    if (
      !data.first_name
    ) {
      errors.push(
        "First name is required."
      );
    }

    if (
      ![
        "admin",
        "subadmin",
      ].includes(
        data.role
      )
    ) {
      errors.push(
        "Only Admin or Subadmin role can be created."
      );
    }

    if (
      data.password.length <
        8
    ) {
      errors.push(
        "Password must contain at least 8 characters."
      );
    }

    if (
      data.password !==
      data.confirm_password
    ) {
      errors.push(
        "Password and confirm password do not match."
      );
    }

    return {
      isValid:
        errors.length ===
        0,

      errors,

      data,
    };
  };

/* =========================
   VALIDATION MIDDLEWARE
========================= */

const createValidationMiddleware =
  (
    validator,
    propertyName
  ) => {
    return (
      request,
      response,
      next
    ) => {
      try {
        const result =
          validator(
            request.body ||
              {}
          );

        if (
          !result.isValid
        ) {
          const error =
            new ApiError(
              422,
              result.errors[0]
            );

          error.errors =
            result.errors;

          throw error;
        }

        request[propertyName] =
          result.data;

        return next();
      } catch (error) {
        return next(
          error
        );
      }
    };
  };

const validateAdminLogin =
  createValidationMiddleware(
    validateAdminLoginData,
    "validatedAdminLogin"
  );

const validateAdminOtp =
  createValidationMiddleware(
    validateAdminOtpData,
    "validatedAdminOtp"
  );

const validateAdminSignup =
  createValidationMiddleware(
    validateAdminSignupData,
    "validatedAdminSignup"
  );

module.exports = {
  cleanText,
  normalizeAdminRole,
  validateAdminLoginData,
  validateAdminOtpData,
  validateAdminSignupData,
  validateAdminLogin,
  validateAdminOtp,
  validateAdminSignup,
};