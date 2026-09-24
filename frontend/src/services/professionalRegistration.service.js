import api from "../api/api";

import {
  storeRegistrationResult,
} from "./registration.service";

/* =========================================================
   HELPERS
========================================================= */

const asObject = (
  value
) => {
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
  const text =
    String(
      value ?? ""
    ).trim();

  return (
    text ||
    fallback
  );
};

/* =========================================================
   NORMALIZE EMAIL
========================================================= */

const normalizeEmail = (
  value
) => {
  return toText(
    value
  ).toLowerCase();
};

/* =========================================================
   NORMALIZE MOBILE
========================================================= */

const normalizePhone = (
  value
) => {
  return String(
    value ?? ""
  )
    .replace(
      /\D/g,
      ""
    )
    .slice(
      -10
    );
};

/* =========================================================
   EMAIL VALIDATOR
========================================================= */

export const validateProfessionalEmail =
  (
    value
  ) => {
    const email =
      normalizeEmail(
        value
      );

    if (!email) {
      return {
        valid: false,

        error:
          "Email address is required.",
      };
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (
      !emailPattern.test(
        email
      )
    ) {
      return {
        valid: false,

        error:
          "Enter a valid email address.",
      };
    }

    return {
      valid: true,

      error: "",

      value:
        email,
    };
  };

/* =========================================================
   PHONE VALIDATOR
========================================================= */

export const validateProfessionalPhone =
  (
    value
  ) => {
    const phone =
      normalizePhone(
        value
      );

    if (!phone) {
      return {
        valid: false,

        error:
          "Mobile number is required.",
      };
    }

    if (
      !/^[6-9]\d{9}$/.test(
        phone
      )
    ) {
      return {
        valid: false,

        error:
          "Enter a valid 10-digit Indian mobile number.",
      };
    }

    return {
      valid: true,

      error: "",

      value:
        phone,
    };
  };

/* =========================================================
   MOBILE VALIDATOR ALIAS

   ProfessionalRegistration.jsx imports:

   validateProfessionalMobile

   So both names are supported:

   validateProfessionalPhone
   validateProfessionalMobile
========================================================= */

export const validateProfessionalMobile =
  validateProfessionalPhone;

/* =========================================================
   DATE OF BIRTH VALIDATOR
========================================================= */

export const validateProfessionalDob =
  (
    value
  ) => {
    const dob =
      toText(
        value
      );

    if (!dob) {
      return {
        valid: false,

        error:
          "Date of birth is required.",
      };
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        dob
      )
    ) {
      return {
        valid: false,

        error:
          "Enter a valid date of birth.",
      };
    }

    const selectedDate =
      new Date(
        `${dob}T00:00:00`
      );

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    if (
      Number.isNaN(
        selectedDate.getTime()
      )
    ) {
      return {
        valid: false,

        error:
          "Enter a valid date of birth.",
      };
    }

    if (
      selectedDate >=
      today
    ) {
      return {
        valid: false,

        error:
          "Date of birth must be before today.",
      };
    }

    return {
      valid: true,

      error: "",

      value:
        dob,
    };
  };

/* =========================================================
   PROFILE PHOTO VALIDATOR
========================================================= */

export const validateProfessionalProfilePhoto =
  (
    file
  ) => {
    /*
      Profile photo optional.
    */

    if (!file) {
      return {
        valid: true,

        error: "",
      };
    }

    const allowedTypes =
      [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

    if (
      file.type &&
      !allowedTypes.includes(
        file.type
      )
    ) {
      return {
        valid: false,

        error:
          "Profile photo must be JPG, PNG or WEBP.",
      };
    }

    const maximumSize =
      5 *
      1024 *
      1024;

    if (
      file.size >
      maximumSize
    ) {
      return {
        valid: false,

        error:
          "Profile photo must be below 5 MB.",
      };
    }

    return {
      valid: true,

      error: "",
    };
  };

/* =========================================================
   CREATE PROFESSIONAL REGISTRATION PAYLOAD

   Backend expects:

   full_name
   phone
   email
   dob
   password
   referral
   profile_photo
========================================================= */

export const createProfessionalRegistrationPayload =
  (
    values
  ) => {
    const source =
      asObject(
        values
      );

    const formData =
      new FormData();

    /* =====================================================
       FULL NAME
    ===================================================== */

    formData.append(
      "full_name",
      toText(
        source.full_name ??
        source.fullName
      )
    );

    /* =====================================================
       MOBILE NUMBER
    ===================================================== */

    formData.append(
      "phone",
      normalizePhone(
        source.phone ??
        source.mobile
      )
    );

    /* =====================================================
       EMAIL
    ===================================================== */

    formData.append(
      "email",
      normalizeEmail(
        source.email
      )
    );

    /* =====================================================
       DOB
    ===================================================== */

    formData.append(
      "dob",
      toText(
        source.dob
      )
    );

    /* =====================================================
       PASSWORD / PIN
    ===================================================== */

    formData.append(
      "password",
      String(
        source.password ??
        ""
      )
    );

    /* =====================================================
       REFERRAL ID

       Optional
    ===================================================== */

    const referral =
      toText(
        source.referral ??
        source.referral_id
      );

    if (
      referral
    ) {
      formData.append(
        "referral",
        referral
      );
    }

    /* =====================================================
       PROFILE PHOTO

       Optional
    ===================================================== */

    const profilePhoto =
      source.profile_photo ??
      source.profilePhoto ??
      null;

    if (
      typeof File !==
        "undefined" &&
      profilePhoto instanceof
        File
    ) {
      formData.append(
        "profile_photo",
        profilePhoto
      );
    }

    /*
      =====================================================
      TODO — PROFESSIONAL MOBILE OTP

      OTP verification currently disabled.

      Later flow:

      Mobile
        ↓
      Send OTP
        ↓
      Verify OTP
        ↓
      Registration

      Current registration does NOT block on OTP.
      =====================================================
    */

    return formData;
  };

/* =========================================================
   NORMALIZE PROFESSIONAL REGISTRATION RESPONSE
========================================================= */

const normalizeProfessionalRegistrationResponse =
  (
    response
  ) => {
    const body =
      asObject(
        response?.data
      );

    const data =
      asObject(
        body.data
      );

    const member =
      asObject(
        data.member
      );

    const referral =
      asObject(
        data.referral
      );

    const nextAction =
      asObject(
        data.nextAction
      );

    /* =====================================================
       LOGIN ID
    ===================================================== */

    const loginId =
      toText(
        data.loginId ??
        data.login_id ??
        member.login_id ??
        member.loginId
      );

    /* =====================================================
       DUPLICATE REGISTRATION RESPONSE
    ===================================================== */

    const alreadyRegistered =
      Boolean(
        data.alreadyRegistered ??
        data.existingAccount ??
        member.already_registered ??
        member.alreadyRegistered
      );

    /* =====================================================
       ACCOUNT MATCH

       NEW
       EXACT
       CONFLICT
    ===================================================== */

    const accountMatch =
      toText(
        data.accountMatch ??
        member.account_match,
        alreadyRegistered
          ? "EXACT"
          : "NEW"
      ).toUpperCase();

    return {
      success:
        body.success !==
        false,

      statusCode:
        Number(
          body.statusCode ??
          response?.status ??
          200
        ),

      message:
        toText(
          body.message,
          alreadyRegistered
            ? "Professional account already exists."
            : "Professional registration completed successfully."
        ),

      loginId,

      loginLink:
        toText(
          data.loginLink,
          "/login"
        ),

      successPage:
        toText(
          data.successPage,
          "/success"
        ),

      nextRoute:
        toText(
          nextAction.path ??
          data.nextRoute,
          alreadyRegistered
            ? "/login"
            : "/success"
        ),

      loginRoute:
        toText(
          nextAction.loginPath ??
          data.loginPath,
          "/login"
        ),

      member,

      referral,

      alreadyRegistered,

      existingAccount:
        alreadyRegistered,

      accountMatch,

      raw:
        body,
    };
  };

/* =========================================================
   CREATE ALREADY REGISTERED ERROR

   IMPORTANT:

   Same Professional user submit panna:

   ❌ new account create ஆகாது
   ❌ new Login ID generate ஆகாது

   Existing Login ID கிடைத்தால்
   frontend-க்கு pass ஆகும்.
========================================================= */

const createAlreadyRegisteredError =
  (
    result
  ) => {
    const loginId =
      toText(
        result.loginId
      );

    const exactMatch =
      result.accountMatch ===
      "EXACT";

    let message =
      "A Professional account already exists. Please login to continue.";

    if (
      exactMatch &&
      loginId
    ) {
      message =
        `Professional account already exists. Your Login ID is ${loginId}. Please login to continue.`;
    } else if (
      result.accountMatch ===
      "CONFLICT"
    ) {
      message =
        "This email address or mobile number is already linked to a Professional account. Please login with your existing account.";
    }

    const error =
      new Error(
        message
      );

    error.statusCode =
      409;

    error.code =
      "PROFESSIONAL_ACCOUNT_EXISTS";

    error.apiMessage =
      message;

    error.alreadyRegistered =
      true;

    error.existingAccount =
      true;

    error.existingLoginId =
      loginId;

    error.loginId =
      loginId;

    error.loginRoute =
      "/login";

    error.accountMatch =
      result.accountMatch;

    error.registrationResult =
      result;

    return error;
  };

/* =========================================================
   NORMALIZE API ERROR
========================================================= */

const normalizeProfessionalRegistrationError =
  (
    error
  ) => {
    if (
      error?.alreadyRegistered
    ) {
      return error;
    }

    const responseData =
      asObject(
        error?.response?.data
      );

    const responseDataBody =
      asObject(
        responseData.data
      );

    error.statusCode =
      Number(
        error?.response?.status ??
        error?.statusCode ??
        0
      );

    error.apiMessage =
      toText(
        responseData.message ??
        responseDataBody.message ??
        responseData.error ??
        error?.apiMessage ??
        error?.message,
        "Unable to complete Professional registration."
      );

    const responseErrors =
      responseData.errors ??
      responseData.fieldErrors ??
      responseDataBody.errors ??
      responseDataBody.fieldErrors;

    error.fieldErrors =
      asObject(
        responseErrors
      );

    return error;
  };

/* =========================================================
   REGISTER PROFESSIONAL MEMBER
========================================================= */

export const registerProfessionalMember =
  async (
    values,
    {
      signal,
    } = {}
  ) => {
    /* =====================================================
       CREATE FORMDATA
    ===================================================== */

    const payload =
      createProfessionalRegistrationPayload(
        values
      );

    try {
      /* ===================================================
         PROFESSIONAL REGISTRATION API

         api baseURL already /api.

         Final endpoint:

         POST /api/professional-register
      =================================================== */

      const response =
        await api.post(
          "/professional-register",
          payload,
          {
            signal,

            /*
              IMPORTANT:

              FormData Content-Type manual-aa set panna
              வேண்டாம்.

              Browser itself boundary set pannum.
            */

            skipSessionExpiredHandling:
              true,
          }
        );

      /* ===================================================
         NORMALIZE RESPONSE
      =================================================== */

      const result =
        normalizeProfessionalRegistrationResponse(
          response
        );

      /* ===================================================
         DUPLICATE PROFESSIONAL ACCOUNT

         Backend duplicate கண்டுபிடிச்சிருந்தா:

         Success page போகக்கூடாது.

         User existing Login ID use பண்ணணும்.
      =================================================== */

      if (
        result.alreadyRegistered
      ) {
        throw createAlreadyRegisteredError(
          result
        );
      }

      /* ===================================================
         LOGIN ID REQUIRED

         New registration success ஆனால்
         Login ID கண்டிப்பாக இருக்க வேண்டும்.
      =================================================== */

      if (
        !result.loginId
      ) {
        const error =
          new Error(
            "Professional registration completed but Login ID was not returned."
          );

        error.statusCode =
          500;

        error.code =
          "PROFESSIONAL_LOGIN_ID_MISSING";

        error.apiMessage =
          "Unable to get your Professional Login ID. Please try again.";

        throw error;
      }

      /* ===================================================
         STORE ONLY NEW REGISTRATION

         Duplicate registration result store
         செய்யக்கூடாது.
      =================================================== */

      storeRegistrationResult(
        result
      );

      return result;
    } catch (
      error
    ) {
      throw normalizeProfessionalRegistrationError(
        error
      );
    }
  };

/* =========================================================
   DEFAULT EXPORT
========================================================= */

const professionalRegistrationService =
  {
    registerProfessionalMember,

    createProfessionalRegistrationPayload,

    validateProfessionalEmail,

    validateProfessionalPhone,

    /*
      IMPORTANT FIX:

      ProfessionalRegistration.jsx
      validateProfessionalMobile import pannuthu.

      So this export MUST exist.
    */

    validateProfessionalMobile,

    validateProfessionalDob,

    validateProfessionalProfilePhoto,
  };

export default professionalRegistrationService;