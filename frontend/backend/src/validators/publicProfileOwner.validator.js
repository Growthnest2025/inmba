const ApiError =
  require(
    "../utils/apiError"
  );

const {
  PUBLIC_PROFILE_EDIT_FIELDS,
  PROFESSIONAL_PUBLIC_PROFILE_EDIT_FIELDS,

  PUBLIC_PROFILE_SELECTABLE_FIELDS,
  PROFESSIONAL_PUBLIC_PROFILE_SELECTABLE_FIELDS,

  PUBLIC_PROFILE_SELECTABLE_SECTIONS,
  PROFESSIONAL_PUBLIC_PROFILE_SELECTABLE_SECTIONS,
} = require(
  "../repositories/publicProfileOwner.repository"
);

/* =========================================================
   ALL PUBLIC PROFILE WHITELISTS

   Validator accepts both legacy + professional fields.

   Final membership-specific protection is again applied
   inside publicProfileOwner.repository.js.
========================================================= */

const ALL_PUBLIC_PROFILE_EDIT_FIELDS =
  new Set([
    ...PUBLIC_PROFILE_EDIT_FIELDS,
    ...PROFESSIONAL_PUBLIC_PROFILE_EDIT_FIELDS,
  ]);

const ALL_PUBLIC_PROFILE_SELECTABLE_FIELDS =
  new Set([
    ...PUBLIC_PROFILE_SELECTABLE_FIELDS,
    ...PROFESSIONAL_PUBLIC_PROFILE_SELECTABLE_FIELDS,
  ]);

const ALL_PUBLIC_PROFILE_SELECTABLE_SECTIONS =
  new Set([
    ...PUBLIC_PROFILE_SELECTABLE_SECTIONS,
    ...PROFESSIONAL_PUBLIC_PROFILE_SELECTABLE_SECTIONS,
  ]);

/* =========================================================
   ADMIN ONLY FIELDS
========================================================= */

const ADMIN_ONLY_FIELDS =
  new Set([
    "membership_type",
    "payment_status",
    "login_id",
    "referral_id",
    "referred_by",
    "direct_network",
    "indirect_network",
    "is_deleted",
    "token",
    "password",
  ]);

/* =========================================================
   FIELD ALIASES
========================================================= */

const PROFILE_FIELD_ALIASES =
  Object.freeze({
    firstName:
      "first_name",

    lastName:
      "last_name",

    fatherName:
      "father_name",

    maritalStatus:
      "marital_status",

    bloodGroup:
      "blood_group",

    whatsappNumber:
      "whatsapp_number",

    contactNumber:
      "contact_number",

    professionalRole:
      "professional_role",

    currentStatus:
      "current_status",

    yearsOfExperience:
      "years_of_experience",

    totalExperienceYears:
      "total_experience_years",

    educationalQualification:
      "educational_qualification",

    degreeCertificateYear:
      "degree_certificate_year",

    profileBio:
      "profile_bio",

    professionalBio:
      "professional_bio",

    profileImageUrl:
      "profile_image_url",

    coverPhoto:
      "cover_photo",

    galleryPhotos:
      "gallery_photos",

    introVideo:
      "intro_video",

    socialLinks:
      "social_link",

    socialInstagram:
      "social_instagram",

    socialLinkedin:
      "social_linkedin",

    socialTwitter:
      "social_twitter",

    socialFacebook:
      "social_facebook",

    socialYoutube:
      "social_youtube",

    portfolioUrl:
      "portfolio_url",

    publicProfileSections:
      "public_profile_sections",

    publicProfileFields:
      "public_profile_fields",
  });

/* =========================================================
   SALUTATIONS
========================================================= */

const SALUTATIONS =
  new Set([
    "Mr",
    "Mrs",
    "Ms",
    "Dr",
  ]);

/* =========================================================
   BLOOD GROUPS
========================================================= */

const BLOOD_GROUPS =
  new Set([
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
  ]);

/* =========================================================
   ARRAY FIELDS
========================================================= */

const ARRAY_PROFILE_FIELDS =
  new Set([
    "additional_certifications",
    "language_skills",

    "awards_recognitions",
    "publications",
    "professional_certifications",
    "key_milestones",
    "media_mentions",
    "reference_letters",

    "previous_employers_clients",
    "work_samples",

    "interest_categories",
    "skills",
    "hobbies",

    "gallery_photos",
  ]);

/* =========================================================
   BOOLEAN FIELDS
========================================================= */

const BOOLEAN_PROFILE_FIELDS =
  new Set([
    "phone_public",
    "qualification_public",
    "hourly_project_rate_public",
  ]);

/* =========================================================
   URL FIELDS
========================================================= */

const URL_PROFILE_FIELDS =
  new Set([
    "social_link",
    "social_instagram",
    "social_linkedin",
    "social_twitter",
    "social_facebook",
    "social_youtube",

    "portfolio_url",
    "cover_photo",
    "intro_video",
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
      return "";
    }

    return String(
      value
    ).trim();
  };

/* =========================================================
   STRING ARRAY

   Supports:

   [
     "React",
     "Node"
   ]

   OR

   '["React","Node"]'

   OR

   "React, Node"

   OR

   "React|Node"

   OR new lines
========================================================= */

const normalizeStringArray =
  (
    value
  ) => {
    if (
      Array.isArray(
        value
      )
    ) {
      return Array.from(
        new Set(
          value
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
            )
        )
      );
    }

    const stringValue =
      cleanText(
        value
      );

    if (
      !stringValue
    ) {
      return [];
    }

    try {
      const parsed =
        JSON.parse(
          stringValue
        );

      if (
        Array.isArray(
          parsed
        )
      ) {
        return normalizeStringArray(
          parsed
        );
      }
    } catch {
      /*
        Continue with legacy
        comma / pipe / newline parsing.
      */
    }

    return Array.from(
      new Set(
        stringValue
          .split(
            /[,|\n]/
          )
          .map(
            (
              item
            ) =>
              item.trim()
          )
          .filter(
            Boolean
          )
      )
    );
  };

/* =========================================================
   BOOLEAN
========================================================= */

const normalizeBoolean =
  (
    value
  ) => {
    if (
      value === true ||
      value === 1 ||
      value === "1"
    ) {
      return 1;
    }

    const normalized =
      cleanText(
        value
      )
        .toLowerCase();

    if (
      [
        "true",
        "yes",
        "on",
        "public",
        "enabled",
      ].includes(
        normalized
      )
    ) {
      return 1;
    }

    return 0;
  };

/* =========================================================
   DATE CHECK
========================================================= */

const isValidDateValue =
  (
    value
  ) => {
    if (
      !value
    ) {
      return true;
    }

    const match =
      String(
        value
      ).match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (
      !match
    ) {
      return false;
    }

    const year =
      Number(
        match[1]
      );

    const month =
      Number(
        match[2]
      );

    const day =
      Number(
        match[3]
      );

    const date =
      new Date(
        Date.UTC(
          year,
          month - 1,
          day
        )
      );

    return (
      date.getUTCFullYear() ===
        year &&
      date.getUTCMonth() ===
        month - 1 &&
      date.getUTCDate() ===
        day
    );
  };

/* =========================================================
   RAW UPDATE DATA

   Supports:

   {
     field: "display_name",
     value: "Arul"
   }

   OR

   {
     display_name: "Arul",
     skills: [...]
   }
========================================================= */

const createRawUpdateData =
  (
    payload = {}
  ) => {
    const field =
      cleanText(
        payload.field
      );

    if (
      field
    ) {
      return {
        [field]:
          payload.value,
      };
    }

    return {
      ...payload,
    };
  };

/* =========================================================
   APPLY ALIASES
========================================================= */

const applyProfileAliases =
  (
    inputData
  ) => {
    const data = {
      ...inputData,
    };

    for (
      const [
        aliasName,
        canonicalName,
      ] of Object.entries(
        PROFILE_FIELD_ALIASES
      )
    ) {
      if (
        Object.prototype
          .hasOwnProperty
          .call(
            data,
            aliasName
          ) &&
        !Object.prototype
          .hasOwnProperty
          .call(
            data,
            canonicalName
          )
      ) {
        data[
          canonicalName
        ] =
          data[
            aliasName
          ];
      }

      delete data[
        aliasName
      ];
    }

    /*
      Legacy social_links
      → social_link
    */

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

    /*
      Keep old bio/profile_bio
      compatibility.
    */

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          data,
          "profile_bio"
        ) &&
      !Object.prototype
        .hasOwnProperty
        .call(
          data,
          "bio"
        )
    ) {
      data.bio =
        data.profile_bio;
    }

    if (
      Object.prototype
        .hasOwnProperty
        .call(
          data,
          "bio"
        ) &&
      !Object.prototype
        .hasOwnProperty
        .call(
          data,
          "profile_bio"
        )
    ) {
      data.profile_bio =
        data.bio;
    }

    delete data.field;
    delete data.value;

    return data;
  };

/* =========================================================
   SALUTATION
========================================================= */

const normalizeSalutation =
  (
    value
  ) => {
    const normalized =
      cleanText(
        value
      )
        .replace(
          /\.$/,
          ""
        );

    if (
      !normalized
    ) {
      return null;
    }

    if (
      !SALUTATIONS.has(
        normalized
      )
    ) {
      throw new ApiError(
        422,
        "Salutation must be Mr, Mrs, Ms or Dr."
      );
    }

    return normalized;
  };

/* =========================================================
   PROFILE IMAGE URL
========================================================= */

const normalizeProfileImageUrl =
  (
    value
  ) => {
    const imageUrl =
      cleanText(
        value
      );

    if (
      !imageUrl
    ) {
      return null;
    }

    /*
      Local public upload path.
    */

    if (
      imageUrl.startsWith(
        "/uploads/"
      ) ||
      imageUrl.startsWith(
        "uploads/"
      )
    ) {
      return imageUrl;
    }

    let parsedUrl;

    try {
      parsedUrl =
        new URL(
          imageUrl
        );
    } catch {
      throw new ApiError(
        422,
        "Profile image URL is invalid."
      );
    }

    if (
      ![
        "http:",
        "https:",
      ].includes(
        parsedUrl.protocol
      )
    ) {
      throw new ApiError(
        422,
        "Profile image URL must use HTTP or HTTPS."
      );
    }

    return imageUrl;
  };

/* =========================================================
   PUBLIC URL
========================================================= */

const normalizePublicUrl =
  (
    value,
    fieldName
  ) => {
    const urlValue =
      cleanText(
        value
      );

    if (
      !urlValue
    ) {
      return null;
    }

    if (
      urlValue.startsWith(
        "/uploads/"
      ) ||
      urlValue.startsWith(
        "uploads/"
      )
    ) {
      return urlValue;
    }

    let parsedUrl;

    try {
      parsedUrl =
        new URL(
          urlValue
        );
    } catch {
      throw new ApiError(
        422,
        `${fieldName} must contain a valid URL.`
      );
    }

    if (
      ![
        "http:",
        "https:",
      ].includes(
        parsedUrl.protocol
      )
    ) {
      throw new ApiError(
        422,
        `${fieldName} must use HTTP or HTTPS.`
      );
    }

    return urlValue;
  };

/* =========================================================
   SOCIAL URL
========================================================= */

const normalizeSocialUrl =
  (
    value,
    fieldName
  ) =>
    normalizePublicUrl(
      value,
      fieldName
    );

/* =========================================================
   GALLERY
========================================================= */

const normalizeGalleryPhotos =
  (
    value
  ) => {
    const items =
      normalizeStringArray(
        value
      );

    const normalized =
      items.map(
        (
          item
        ) =>
          normalizePublicUrl(
            item,
            "gallery_photos"
          )
      );

    return normalized.length
      ? JSON.stringify(
          normalized
        )
      : null;
  };

/* =========================================================
   NORMALIZE PROFILE FIELD
========================================================= */

const normalizeProfileFieldValue =
  (
    fieldName,
    value
  ) => {
    /* =====================================================
       PUBLIC PROFILE SECTIONS
    ===================================================== */

    if (
      fieldName ===
      "public_profile_sections"
    ) {
      const sections =
        normalizeStringArray(
          value
        )
          .map(
            (
              section
            ) =>
              section
                .trim()
                .toLowerCase()
          )
          .filter(
            (
              section
            ) =>
              ALL_PUBLIC_PROFILE_SELECTABLE_SECTIONS
                .has(
                  section
                )
          );

      return JSON.stringify(
        Array.from(
          new Set(
            sections
          )
        )
          .slice(
            0,
            20
          )
      );
    }

    /* =====================================================
       PUBLIC PROFILE FIELDS
    ===================================================== */

    if (
      fieldName ===
      "public_profile_fields"
    ) {
      const fields =
        normalizeStringArray(
          value
        )
          .map(
            (
              field
            ) =>
              field.trim()
          )
          .filter(
            (
              field
            ) =>
              ALL_PUBLIC_PROFILE_SELECTABLE_FIELDS
                .has(
                  field
                )
          );

      return JSON.stringify(
        Array.from(
          new Set(
            fields
          )
        )
          .slice(
            0,
            100
          )
      );
    }

    /* =====================================================
       SALUTATION
    ===================================================== */

    if (
      fieldName ===
      "salutation"
    ) {
      return normalizeSalutation(
        value
      );
    }

    /* =====================================================
       GALLERY
    ===================================================== */

    if (
      fieldName ===
      "gallery_photos"
    ) {
      return normalizeGalleryPhotos(
        value
      );
    }

    /* =====================================================
       ARRAY FIELDS
    ===================================================== */

    if (
      ARRAY_PROFILE_FIELDS
        .has(
          fieldName
        )
    ) {
      const items =
        normalizeStringArray(
          value
        );

      return items.length
        ? JSON.stringify(
            items
          )
        : null;
    }

    /* =====================================================
       BOOLEAN FIELDS
    ===================================================== */

    if (
      BOOLEAN_PROFILE_FIELDS
        .has(
          fieldName
        )
    ) {
      return normalizeBoolean(
        value
      );
    }

    /* =====================================================
       EXPERIENCE
    ===================================================== */

    if (
      fieldName ===
        "total_experience_years" ||
      fieldName ===
        "years_of_experience"
    ) {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return null;
      }

      const years =
        Number(
          value
        );

      if (
        !Number.isFinite(
          years
        ) ||
        years < 0 ||
        years > 80
      ) {
        throw new ApiError(
          422,
          "Experience must be between 0 and 80 years."
        );
      }

      return years;
    }

    /* =====================================================
       DEGREE / CERTIFICATE YEAR
    ===================================================== */

    if (
      fieldName ===
      "degree_certificate_year"
    ) {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return null;
      }

      const year =
        Number(
          value
        );

      if (
        !Number.isInteger(
          year
        ) ||
        year < 1900 ||
        year > 2200
      ) {
        throw new ApiError(
          422,
          "Degree / certificate year is invalid."
        );
      }

      return String(
        year
      );
    }

    /* =====================================================
       PROFILE IMAGE
    ===================================================== */

    if (
      fieldName ===
      "profile_image_url"
    ) {
      return normalizeProfileImageUrl(
        value
      );
    }

    /* =====================================================
       PUBLIC URL FIELDS
    ===================================================== */

    if (
      URL_PROFILE_FIELDS
        .has(
          fieldName
        )
    ) {
      return normalizePublicUrl(
        value,
        fieldName
      );
    }

    /* =====================================================
       NULL
    ===================================================== */

    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    /* =====================================================
       OBJECT SAFETY

       Arrays are already handled above.
    ===================================================== */

    if (
      typeof value ===
      "object"
    ) {
      throw new ApiError(
        422,
        `${fieldName} must contain valid text.`
      );
    }

    /* =====================================================
       NORMAL TEXT
    ===================================================== */

    const normalized =
      String(
        value
      ).trim();

    return normalized ||
      null;
  };

/* =========================================================
   VALIDATE OWNER PUBLIC PROFILE UPDATE
========================================================= */

const validatePublicProfileOwnerUpdate =
  (
    request,
    response,
    next
  ) => {
    try {
      const rawUpdateData =
        applyProfileAliases(
          createRawUpdateData(
            request.body ||
              {}
          )
        );

      /* =====================================================
         ADMIN FIELD BLOCK
      ===================================================== */

      for (
        const fieldName of
        Object.keys(
          rawUpdateData
        )
      ) {
        if (
          ADMIN_ONLY_FIELDS
            .has(
              fieldName
            )
        ) {
          throw new ApiError(
            403,
            `${fieldName} can only be updated by an administrator.`
          );
        }
      }

      const updateData =
        {};

      /* =====================================================
         EDITABLE FIELD WHITELIST

         IMPORTANT FIX:

         Previously this was:

         PUBLIC_PROFILE_EDIT_FIELDS

         That ignored Professional-only fields.

         Now both Civilian/legacy + Professional fields
         are accepted by the validator.

         Repository applies membership-specific whitelist again.
      ===================================================== */

      for (
        const [
          fieldName,
          fieldValue,
        ] of Object.entries(
          rawUpdateData
        )
      ) {
        if (
          !ALL_PUBLIC_PROFILE_EDIT_FIELDS
            .has(
              fieldName
            )
        ) {
          continue;
        }

        updateData[
          fieldName
        ] =
          normalizeProfileFieldValue(
            fieldName,
            fieldValue
          );
      }

      /* =====================================================
         NOTHING VALID
      ===================================================== */

      if (
        Object.keys(
          updateData
        ).length ===
        0
      ) {
        throw new ApiError(
          422,
          "No valid public profile fields were provided."
        );
      }

      /* =====================================================
         EMAIL

         Legacy support only.
         Professional public editor should not send email.
      ===================================================== */

      if (
        updateData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
          .test(
            updateData.email
          )
      ) {
        throw new ApiError(
          422,
          "Valid email address is required."
        );
      }

      if (
        updateData.email
      ) {
        updateData.email =
          updateData.email
            .toLowerCase();
      }

      /* =====================================================
         PHONE

         Professional public editor should normally
         send phone_public only.
      ===================================================== */

      const phoneFields = [
        "phone",
        "whatsapp_number",
        "contact_number",
      ];

      for (
        const fieldName of
        phoneFields
      ) {
        if (
          !updateData[
            fieldName
          ]
        ) {
          continue;
        }

        const phone =
          String(
            updateData[
              fieldName
            ]
          )
            .replace(
              /\D/g,
              ""
            );

        if (
          !/^[0-9]{10,15}$/
            .test(
              phone
            )
        ) {
          throw new ApiError(
            422,
            `${fieldName} must contain 10 to 15 digits.`
          );
        }

        updateData[
          fieldName
        ] =
          phone;
      }

      /* =====================================================
         DATE VALIDATION

         Legacy only.
      ===================================================== */

      const dateFields = [
        "dob",
        "nomini_dob",
      ];

      for (
        const fieldName of
        dateFields
      ) {
        if (
          updateData[
            fieldName
          ] &&
          !isValidDateValue(
            updateData[
              fieldName
            ]
          )
        ) {
          throw new ApiError(
            422,
            `${fieldName} must be a valid YYYY-MM-DD date.`
          );
        }
      }

      /* =====================================================
         BLOOD GROUP
      ===================================================== */

      if (
        updateData
          .blood_group
      ) {
        const bloodGroup =
          String(
            updateData
              .blood_group
          )
            .trim()
            .toUpperCase();

        if (
          !BLOOD_GROUPS
            .has(
              bloodGroup
            )
        ) {
          throw new ApiError(
            422,
            "Blood group is invalid."
          );
        }

        updateData
          .blood_group =
          bloodGroup;
      }

      /* =====================================================
         PINCODE
      ===================================================== */

      if (
        updateData
          .pincode &&
        !/^[A-Za-z0-9 -]{4,12}$/
          .test(
            updateData
              .pincode
          )
      ) {
        throw new ApiError(
          422,
          "Pincode contains invalid characters."
        );
      }

      /* =====================================================
         MAX TEXT LENGTH
      ===================================================== */

      for (
        const [
          fieldName,
          value,
        ] of Object.entries(
          updateData
        )
      ) {
        if (
          typeof value ===
            "string" &&
          value.length >
            10000
        ) {
          throw new ApiError(
            422,
            `${fieldName} is too long.`
          );
        }
      }

      /* =====================================================
         SEND CLEAN DATA TO CONTROLLER
      ===================================================== */

      request
        .validatedPublicProfileUpdate =
        updateData;

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
   EXPORTS
========================================================= */

module.exports = {
  ALL_PUBLIC_PROFILE_EDIT_FIELDS,

  ALL_PUBLIC_PROFILE_SELECTABLE_FIELDS,

  ALL_PUBLIC_PROFILE_SELECTABLE_SECTIONS,

  ADMIN_ONLY_FIELDS,

  PROFILE_FIELD_ALIASES,

  SALUTATIONS,

  BLOOD_GROUPS,

  ARRAY_PROFILE_FIELDS,

  BOOLEAN_PROFILE_FIELDS,

  URL_PROFILE_FIELDS,

  cleanText,

  normalizeStringArray,

  normalizeBoolean,

  isValidDateValue,

  createRawUpdateData,

  applyProfileAliases,

  normalizeSalutation,

  normalizeProfileImageUrl,

  normalizePublicUrl,

  normalizeSocialUrl,

  normalizeGalleryPhotos,

  normalizeProfileFieldValue,

  validatePublicProfileOwnerUpdate,
};