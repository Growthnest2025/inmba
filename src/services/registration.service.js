import api from "../api/api";
import { toText, asObject } from "../utils/commonHelpers";

/* ========================================
   REGISTRATION RESULT STORAGE
======================================== */

export const REGISTRATION_RESULT_KEY =
  "inmba_registration_result";

/* ========================================
   COMMON HELPERS
======================================== */

const normalizeEmail = (value) => {
  return toText(value)
    .toLowerCase();
};

const normalizeDigits = (
  value,
  maximumLength
) => {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, maximumLength);
};

/* ========================================
   FIELD ERROR NORMALIZER
======================================== */

const normalizeFieldErrors = (
  value
) => {
  if (Array.isArray(value)) {
    return value.reduce(
      (
        errors,
        currentError
      ) => {
        const source =
          asObject(currentError);

        const fieldName =
          toText(
            source.field ??
              source.path ??
              source.param,
            ""
          );

        const message =
          toText(
            source.message ??
              source.msg ??
              source.error,
            ""
          );

        if (
          fieldName &&
          message
        ) {
          errors[fieldName] =
            message;
        }

        return errors;
      },
      {}
    );
  }

  return asObject(value);
};

/* ========================================
   RESPONSE NORMALIZER
======================================== */

const normalizeRegistrationResponse = (
  response
) => {
  const responseBody =
    response?.data;

  if (
    typeof responseBody ===
    "string"
  ) {
    const invalidResponseError =
      new Error(
        "Registration API returned an invalid response."
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

  const data =
    asObject(body.data);

  const member =
    asObject(data.member);

  const referral =
    asObject(data.referral);

  const nextAction =
    asObject(data.nextAction);

  return {
    success:
      body.success !== false,

    statusCode:
      Number(
        body.statusCode ??
          response?.status ??
          201
      ),

    message:
      toText(
        body.message,
        "Your membership registration has been submitted successfully."
      ),

    loginId:
      toText(
        data.loginId ??
          data.login_id ??
          member.login_id ??
          body.loginId ??
          body.login_id,
        ""
      ),

    loginLink:
      toText(
        data.loginLink ??
          data.login_link,
        "/login"
      ),

    successPage:
      toText(
        data.successPage ??
          data.success_page,
        "/success"
      ),

    nextRoute:
      toText(
        nextAction.path ??
          data.nextRoute ??
          data.redirectTo,
        "/success"
      ),

    loginRoute:
      toText(
        nextAction.loginPath ??
          data.loginPath,
        "/login"
      ),

    member,

    referral,

    raw: body,
  };
};

/* ========================================
   REQUEST ERROR NORMALIZER
======================================== */

const normalizeRegistrationError = (
  error
) => {
  const responseData =
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
      responseData.message ??
        responseData.error ??
        error?.message,
      "Unable to complete membership registration."
    );

  error.fieldErrors =
    normalizeFieldErrors(
      responseData.errors ??
        responseData.fieldErrors
    );

  return error;
};

/* ========================================
   VALIDATORS
======================================== */

export const validateRegistrationEmail = (
  value
) => {
  const email =
    normalizeEmail(value);

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

export const validateRegistrationPhone = (
  value
) => {
  const phone =
    normalizeDigits(
      value,
      10
    );

  if (!phone) {
    return {
      valid: false,
      error:
        "Mobile number is required.",
    };
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    return {
      valid: false,
      error:
        "Enter a valid 10-digit Indian mobile number.",
    };
  }

  return {
    valid: true,
    error: "",
    value: phone,
  };
};

export const validateRegistrationPincode = (
  value
) => {
  const pincode =
    normalizeDigits(
      value,
      6
    );

  if (!pincode) {
    return {
      valid: false,
      error:
        "Pincode is required.",
    };
  }

  if (!/^[1-9]\d{5}$/.test(pincode)) {
    return {
      valid: false,
      error:
        "Enter a valid 6-digit pincode.",
    };
  }

  return {
    valid: true,
    error: "",
    value: pincode,
  };
};

export const validateRegistrationAadhaar = (
  value
) => {
  const aadhar =
    normalizeDigits(
      value,
      12
    );

  if (!aadhar) {
    return {
      valid: false,
      error:
        "Aadhaar number is required.",
    };
  }

  if (!/^\d{12}$/.test(aadhar)) {
    return {
      valid: false,
      error:
        "Enter a valid 12-digit Aadhaar number.",
    };
  }

  return {
    valid: true,
    error: "",
    value: aadhar,
  };
};

/* ========================================
   EXACT MEMBER PAYLOAD

   No frontend-only fields are sent.
======================================== */

export const createMemberRegistrationPayload = (
  values
) => {
  const source =
    asObject(values);

  const payload = {
    first_name:
      toText(
        source.first_name
      ),

    last_name:
      toText(
        source.last_name
      ),

    father_name:
      toText(
        source.father_name
      ),

    dob:
      toText(
        source.dob
      ),

    email:
      normalizeEmail(
        source.email
      ),

    phone:
      normalizeDigits(
        source.phone,
        10
      ),

    pincode:
      normalizeDigits(
        source.pincode,
        6
      ),

    gender:
      toText(
        source.gender
      ),

    marital_status:
      toText(
        source.marital_status
      ),

    nationality:
      toText(
        source.nationality
      ),

    occupation:
      toText(
        source.occupation
      ),

    education:
      toText(
        source.education
      ),

    membership_type:
      toText(
        source.membership_type,
        "Civilian Member"
      ),

    referral:
      toText(
        source.referral
      ),

    aadhar:
      normalizeDigits(
        source.aadhar,
        12
      ),

    password:
      String(
        source.password ?? ""
      ),

    confirm_password:
      String(
        source.confirm_password ??
          ""
      ),
  };

  if (
    typeof File !== "undefined" &&
    source.profile_pic instanceof File
  ) {
    const formData = new FormData();

    Object.entries(payload).forEach(
      ([key, value]) => {
        formData.append(key, value ?? "");
      }
    );

    formData.append(
      "profile_pic",
      source.profile_pic
    );

    return formData;
  }

  return payload;
};

/* ========================================
   STORE REGISTRATION RESULT
======================================== */

export const storeRegistrationResult = (
  result
) => {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      REGISTRATION_RESULT_KEY,
      JSON.stringify(result)
    );
    if (result?.loginId) {
      window.sessionStorage.setItem("civilian_login_id", result.loginId);
      window.localStorage.setItem("civilian_login_id", result.loginId);
      window.sessionStorage.setItem("inmba_civilian_login_id", result.loginId);
    }
  } catch {
    // Registration can continue even
    // when browser storage is blocked.
  }
};

/* ========================================
   GET REGISTRATION RESULT
======================================== */

export const getStoredRegistrationResult =
  () => {
    if (
      typeof window ===
      "undefined"
    ) {
      return null;
    }

    try {
      const storedValue =
        window.sessionStorage.getItem(
          REGISTRATION_RESULT_KEY
        );

      if (!storedValue) {
        return null;
      }

      return JSON.parse(
        storedValue
      );
    } catch {
      return null;
    }
  };

/* ========================================
   CLEAR REGISTRATION RESULT
======================================== */

export const clearStoredRegistrationResult =
  () => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    window.sessionStorage.removeItem(
      REGISTRATION_RESULT_KEY
    );
  };

/* ========================================
   REGISTER CIVILIAN MEMBER

   Exact API:
   POST /api/register

   api.js baseURL:
   /api

   Service endpoint:
   /register
======================================== */

export const registerMember =
  async (
    values,
    {
      signal,
    } = {}
  ) => {
    const payload =
      createMemberRegistrationPayload(
        values
      );

    try {
      const response =
        await api.post(
          "/register",
          payload,
          {
            signal,

            /*
              Registration is public.

              A 401 response should not trigger
              protected member logout handling.
            */

            skipSessionExpiredHandling:
              true,
          }
        );

      const result =
        normalizeRegistrationResponse(
          response
        );

      storeRegistrationResult(
        result
      );

      return result;
    } catch (error) {
      throw normalizeRegistrationError(
        error
      );
    }
  };

/* ========================================
   COMPATIBILITY EXPORTS
======================================== */

export const registerCivilianMember =
  registerMember;

export const submitMemberRegistration =
  registerMember;

/* ========================================
   DEFAULT EXPORT
======================================== */

const registrationService = {
  registerMember,
  registerCivilianMember,
  submitMemberRegistration,

  createMemberRegistrationPayload,

  validateRegistrationEmail,
  validateRegistrationPhone,
  validateRegistrationPincode,
  validateRegistrationAadhaar,

  storeRegistrationResult,
  getStoredRegistrationResult,
  clearStoredRegistrationResult,
};

export default registrationService;
