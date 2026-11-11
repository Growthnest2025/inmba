const ApiError =
  require(
    "../utils/apiError"
  );

/* =========================================================
   PROFILE UPDATE ALLOWED FIELDS

   IMPORTANT:
   This list is synchronized with:

   frontend/src/pages/Profile/EditProfile/EditProfile.jsx
   frontend/src/services/profile.service.js

   System-controlled fields such as:

   login_id
   referral_id
   direct_network
   indirect_network
   payment_status
   password
   token

   MUST NOT be editable here.
========================================================= */

const PROFILE_UPDATE_ALLOWED_FIELDS =
  Object.freeze([
    /* =====================================================
       PERSONAL
    ===================================================== */

    "first_name",
    "last_name",
    "father_name",
    "dob",
    "gender",
    "marital_status",
    "nationality",

    /* =====================================================
       CONTACT
    ===================================================== */

    "email",
    "phone",
    "whatsapp_number",
    "contact_number",

    /* =====================================================
       RESIDENTIAL ADDRESS
    ===================================================== */

    "address",
    "city",
    "district",
    "state",
    "pincode",
    "country",

    /* =====================================================
       ENTITY ADDRESS
    ===================================================== */

    "entity_house_no",
    "entity_street",
    "entity_area",
    "entity_city",
    "entity_district",
    "entity_state",
    "entity_pincode",

    /* =====================================================
       PROFESSIONAL
    ===================================================== */

    "occupation",
    "education",
    "educational_qualification",
    "profession",

    /* =====================================================
       EDUCATION
    ===================================================== */

    "education_level",

    "school_name",
    "school_class",
    "board",
    "school_city",

    "ug_college",
    "ug_degree",
    "ug_department",
    "ug_year",

    "pg_college",
    "pg_degree",
    "pg_specialization",
    "pg_semester",

    /* =====================================================
       SKILLS / STUDENT
    ===================================================== */

    "skills",
    "student_id",

    /* =====================================================
       BIO / SOCIAL
    ===================================================== */

    "bio",

    "social_link",
    "social_links",

    "social_instagram",
    "social_linkedin",
    "social_twitter",
    "social_facebook",
    "social_youtube",

    /* =====================================================
       NOMINEE
    ===================================================== */

    "nomini_name",
    "nomini_dob",
    "nomini_relationship",
    "nomini_aadhar",
  ]);

/* =========================================================
   CLEAN TEXT
========================================================= */

const cleanText =
  (
    value
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    const cleaned =
      String(
        value
      ).trim();

    return cleaned === ""
      ? null
      : cleaned;
  };

/* =========================================================
   VALID EMAIL
========================================================= */

const isValidEmail =
  (
    email
  ) => {
    if (
      !email
    ) {
      return true;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      String(
        email
      ).trim()
    );
  };

/* =========================================================
   NORMALIZE PHONE FOR VALIDATION

   Accept:

   9876543210
   +91 98765 43210
   98765-43210
========================================================= */

const normalizePhone =
  (
    phone
  ) => {
    if (
      phone === null ||
      phone === undefined
    ) {
      return "";
    }

    return String(
      phone
    )
      .replace(
        /[\s()+-]/g,
        ""
      )
      .trim();
  };

/* =========================================================
   VALID PHONE
========================================================= */

const isValidPhone =
  (
    phone
  ) => {
    if (
      !phone
    ) {
      return true;
    }

    const normalizedPhone =
      normalizePhone(
        phone
      );

    return /^[0-9]{7,15}$/.test(
      normalizedPhone
    );
  };

/* =========================================================
   VALID DATE
========================================================= */

const isValidDate =
  (
    value
  ) => {
    if (
      !value
    ) {
      return true;
    }

    const normalizedValue =
      String(
        value
      ).trim();

    const date =
      new Date(
        normalizedValue
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return false;
    }

    const today =
      new Date();

    today.setHours(
      23,
      59,
      59,
      999
    );

    return (
      date <=
      today
    );
  };

/* =========================================================
   VALID PINCODE
========================================================= */

const isValidPincode =
  (
    value
  ) => {
    if (
      !value
    ) {
      return true;
    }

    return /^[a-zA-Z0-9 -]{4,12}$/.test(
      String(
        value
      ).trim()
    );
  };

/* =========================================================
   VALID URL

   Empty URL is allowed.
========================================================= */

const isValidOptionalUrl =
  (
    value
  ) => {
    if (
      !value
    ) {
      return true;
    }

    try {
      const url =
        new URL(
          String(
            value
          ).trim()
        );

      return (
        url.protocol ===
          "http:" ||
        url.protocol ===
          "https:"
      );
    } catch {
      return false;
    }
  };

/* =========================================================
   NORMALIZE DATE VALUE

   DB expects:

   YYYY-MM-DD
========================================================= */

const normalizeDateValue =
  (
    value
  ) => {
    const text =
      cleanText(
        value
      );

    if (
      !text
    ) {
      return null;
    }

    const match =
      String(
        text
      ).match(
        /^\d{4}-\d{2}-\d{2}/
      );

    if (
      match
    ) {
      return match[0];
    }

    return text;
  };

/* =========================================================
   PROFILE PAYLOAD OBJECT

   Current frontend sends:

   {
     first_name: "...",
     address: "...",
     skills: "..."
   }

   Compatibility is also retained for:

   {
     profile: {...}
   }

   {
     data: {...}
   }
========================================================= */

const getProfilePayload =
  (
    payload
  ) => {
    if (
      !payload ||
      typeof payload !==
        "object" ||
      Array.isArray(
        payload
      )
    ) {
      return {};
    }

    if (
      payload.profile &&
      typeof payload.profile ===
        "object" &&
      !Array.isArray(
        payload.profile
      )
    ) {
      return payload.profile;
    }

    if (
      payload.data &&
      typeof payload.data ===
        "object" &&
      !Array.isArray(
        payload.data
      )
    ) {
      return payload.data;
    }

    return payload;
  };

/* =========================================================
   VALIDATE PROFILE DATA
========================================================= */

const validateProfileUpdateData =
  (
    payload = {}
  ) => {
    const errors =
      [];

    const source =
      getProfilePayload(
        payload
      );

    const data =
      {};

    /* =====================================================
       FILTER ALLOWED FIELDS
    ===================================================== */

    PROFILE_UPDATE_ALLOWED_FIELDS.forEach(
      (
        field
      ) => {
        if (
          !Object.prototype
            .hasOwnProperty
            .call(
              source,
              field
            )
        ) {
          return;
        }

        /* ===============================================
           DATE FIELDS
        =============================================== */

        if (
          field === "dob" ||
          field ===
            "nomini_dob"
        ) {
          data[field] =
            normalizeDateValue(
              source[field]
            );

          return;
        }

        /* ===============================================
           ARRAY SUPPORT

           Example:
           ["React", "Node"]

           becomes:
           React, Node
        =============================================== */

        if (
          Array.isArray(
            source[field]
          )
        ) {
          const normalizedArray =
            source[field]
              .map(
                (
                  item
                ) =>
                  cleanText(
                    item
                  )
              )
              .filter(
                Boolean
              );

          data[field] =
            normalizedArray.length
              ? normalizedArray.join(
                  ", "
                )
              : null;

          return;
        }

        data[field] =
          cleanText(
            source[field]
          );
      }
    );

    /* =====================================================
       SOCIAL LINKS LEGACY ALIAS

       social_links
          ↓
       social_link
    ===================================================== */

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          data,
          "social_links"
        ) &&
      !Object.prototype
        .hasOwnProperty
        .call(
          data,
          "social_link"
        )
    ) {
      data.social_link =
        data.social_links;
    }

    delete data.social_links;

    /* =====================================================
       AT LEAST ONE FIELD
    ===================================================== */

    if (
      Object.keys(
        data
      ).length ===
      0
    ) {
      errors.push(
        "At least one profile field is required."
      );
    }

    /* =====================================================
       FIRST NAME
    ===================================================== */

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          data,
          "first_name"
        ) &&
      !data.first_name
    ) {
      errors.push(
        "First name is required."
      );
    }

    if (
      data.first_name &&
      data.first_name.length >
        120
    ) {
      errors.push(
        "First name must not exceed 120 characters."
      );
    }

    /* =====================================================
       LAST NAME
    ===================================================== */

    if (
      data.last_name &&
      data.last_name.length >
        120
    ) {
      errors.push(
        "Last name must not exceed 120 characters."
      );
    }

    /* =====================================================
       FATHER NAME
    ===================================================== */

    if (
      data.father_name &&
      data.father_name.length >
        160
    ) {
      errors.push(
        "Father name must not exceed 160 characters."
      );
    }

    /* =====================================================
       EMAIL
    ===================================================== */

    if (
      data.email &&
      !isValidEmail(
        data.email
      )
    ) {
      errors.push(
        "Please provide a valid email address."
      );
    }

    /* =====================================================
       PHONE
    ===================================================== */

    const phoneFields = [
      {
        field:
          "phone",

        label:
          "Phone number",
      },

      {
        field:
          "whatsapp_number",

        label:
          "WhatsApp number",
      },

      {
        field:
          "contact_number",

        label:
          "Contact number",
      },
    ];

    phoneFields.forEach(
      (
        {
          field,
          label,
        }
      ) => {
        if (
          data[field] &&
          !isValidPhone(
            data[field]
          )
        ) {
          errors.push(
            `${label} must contain 7 to 15 digits.`
          );
        }
      }
    );

    /* =====================================================
       PINCODE
    ===================================================== */

    if (
      data.pincode &&
      !isValidPincode(
        data.pincode
      )
    ) {
      errors.push(
        "Please provide a valid pincode."
      );
    }

    if (
      data.entity_pincode &&
      !isValidPincode(
        data.entity_pincode
      )
    ) {
      errors.push(
        "Please provide a valid entity pincode."
      );
    }

    /* =====================================================
       DOB
    ===================================================== */

    if (
      data.dob &&
      !isValidDate(
        data.dob
      )
    ) {
      errors.push(
        "Please provide a valid date of birth."
      );
    }

    /* =====================================================
       NOMINEE DOB
    ===================================================== */

    if (
      data.nomini_dob &&
      !isValidDate(
        data.nomini_dob
      )
    ) {
      errors.push(
        "Please provide a valid nominee date of birth."
      );
    }

    /* =====================================================
       SOCIAL URLs
    ===================================================== */

    const socialUrlFields = [
      {
        field:
          "social_link",

        label:
          "Social link",
      },

      {
        field:
          "social_instagram",

        label:
          "Instagram URL",
      },

      {
        field:
          "social_linkedin",

        label:
          "LinkedIn URL",
      },

      {
        field:
          "social_twitter",

        label:
          "Twitter / X URL",
      },

      {
        field:
          "social_facebook",

        label:
          "Facebook URL",
      },

      {
        field:
          "social_youtube",

        label:
          "YouTube URL",
      },
    ];

    socialUrlFields.forEach(
      (
        {
          field,
          label,
        }
      ) => {
        if (
          data[field] &&
          !isValidOptionalUrl(
            data[field]
          )
        ) {
          errors.push(
            `${label} must be a valid http or https URL.`
          );
        }
      }
    );

    /* =====================================================
       TEXT LENGTH SAFETY
    ===================================================== */

    if (
      data.bio &&
      data.bio.length >
        2000
    ) {
      errors.push(
        "Bio must not exceed 2000 characters."
      );
    }

    if (
      data.skills &&
      data.skills.length >
        1000
    ) {
      errors.push(
        "Skills must not exceed 1000 characters."
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

/* =========================================================
   EXPRESS MIDDLEWARE
========================================================= */

const validateProfileUpdate =
  (
    request,
    response,
    next
  ) => {
    try {
      const result =
        validateProfileUpdateData(
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

      /* ===================================================
         SANITIZED DATA

         Controller must use this.
      =================================================== */

      request.validatedProfileUpdate =
        result.data;

      return next();
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  PROFILE_UPDATE_ALLOWED_FIELDS,

  cleanText,

  isValidEmail,

  isValidPhone,

  isValidDate,

  isValidPincode,

  isValidOptionalUrl,

  normalizePhone,

  normalizeDateValue,

  getProfilePayload,

  validateProfileUpdateData,

  validateProfileUpdate,
};