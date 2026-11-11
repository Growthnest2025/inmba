const {
  executeQuery,
} = require(
  "./auth.repository"
);

/* =========================
   CIVILIAN OWNER EDITABLE FIELDS

   IMPORTANT:
   Civilian public-profile fields only.
   Professional members use the strict professional whitelist
   declared separately below.
========================= */

const PUBLIC_PROFILE_EDIT_FIELDS =
  new Set([
    /* BASIC PUBLIC PROFILE */
    "salutation",
    "display_name",

    /* LOCATION */
    "city",
    "district",
    "state",
    "pincode",

    /* EDUCATION */
    "educational_qualification",
    "school_college_name",
    "additional_certifications",
    "language_skills",

    /* ACHIEVEMENTS */
    "awards_recognitions",
    "publications",
    "professional_certifications",
    "key_milestones",
    "media_mentions",
    "reference_letters",

    /* BIO / SKILLS */
    "bio",
    "interest_categories",
    "skills",
    "hobbies",
    "preferred_industry",

    /* MEDIA */
    "profile_image_url",
    "cover_photo",
    "gallery_photos",
    "intro_video",

    /* SOCIAL */
    "social_link",
    "social_instagram",
    "social_linkedin",
    "social_twitter",
    "social_facebook",
    "social_youtube",
    "portfolio_url",

    /* PRIVACY */
    "phone_public",
    "qualification_public",

    /* VISIBILITY */
    "public_profile_sections",
    "public_profile_fields",
  ]);

/* =========================
   PROFESSIONAL OWNER EDITABLE FIELDS

   DO NOT MERGE WITH CIVILIAN.
   Professional public-profile-only data.
========================= */

const PROFESSIONAL_PUBLIC_PROFILE_EDIT_FIELDS =
  new Set([
    "salutation",
    "display_name",

    "city",
    "district",
    "state",
    "pincode",

    "occupation",
    "profession",
    "professional_role",
    "current_status",

    "educational_qualification",
    "school_college_name",
    "degree_certificate_year",
    "additional_certifications",
    "language_skills",

    "awards_recognitions",
    "publications",
    "professional_certifications",
    "key_milestones",
    "media_mentions",
    "reference_letters",

    "total_experience_years",
    "previous_employers_clients",
    "work_samples",
    "hourly_project_rate",
    "hourly_project_rate_public",
    "availability_status",

    "professional_bio",
    "bio",
    "interest_categories",
    "skills",
    "hobbies",
    "preferred_industry",

    "profile_image_url",
    "cover_photo",
    "gallery_photos",
    "intro_video",

    "social_link",
    "social_instagram",
    "social_linkedin",
    "social_twitter",
    "social_facebook",
    "social_youtube",
    "portfolio_url",

    "phone_public",
    "qualification_public",

    "public_profile_sections",
    "public_profile_fields",
  ]);

/* =========================
   CIVILIAN PUBLIC SELECTABLE FIELDS
========================= */

const PUBLIC_PROFILE_SELECTABLE_FIELDS =
  new Set([
    "salutation",
    "display_name",

    "city",
    "district",
    "state",
    "pincode",

    "phone",
    "phone_public",

    "educational_qualification",
    "qualification_public",
    "school_college_name",
    "additional_certifications",
    "language_skills",

    "awards_recognitions",
    "publications",
    "professional_certifications",
    "key_milestones",
    "media_mentions",
    "reference_letters",

    "bio",
    "interest_categories",
    "skills",
    "hobbies",
    "preferred_industry",

    "profile_image_url",
    "cover_photo",
    "gallery_photos",
    "intro_video",

    "social_link",
    "social_instagram",
    "social_linkedin",
    "social_twitter",
    "social_facebook",
    "social_youtube",
    "portfolio_url",

    "membership_type",
    "member_since",
    "network_level",
  ]);

/* =========================
   PROFESSIONAL PUBLIC SELECTABLE FIELDS
========================= */

const PROFESSIONAL_PUBLIC_PROFILE_SELECTABLE_FIELDS =
  new Set([
    "salutation",
    "display_name",
    "username",

    "city",
    "district",
    "state",
    "pincode",

    "phone",
    "phone_public",

    "occupation",
    "profession",
    "professional_role",
    "current_status",
    "preferred_industry",

    "educational_qualification",
    "qualification_public",
    "school_college_name",
    "degree_certificate_year",
    "additional_certifications",
    "language_skills",

    "awards_recognitions",
    "publications",
    "professional_certifications",
    "key_milestones",
    "media_mentions",
    "reference_letters",

    "total_experience_years",
    "previous_employers_clients",
    "work_samples",
    "hourly_project_rate",
    "hourly_project_rate_public",
    "availability_status",

    "professional_bio",
    "bio",
    "interest_categories",
    "skills",
    "hobbies",

    "profile_image_url",
    "cover_photo",
    "gallery_photos",
    "intro_video",

    "social_link",
    "social_instagram",
    "social_linkedin",
    "social_twitter",
    "social_facebook",
    "social_youtube",
    "portfolio_url",

    "network_level",
    "kyc_verified",
    "professional_license_badge",
    "council_registration_badge",
    "gst_badge",

    "membership_type",
    "member_since",
  ]);

/* =========================
   PUBLIC SECTIONS
========================= */

const PUBLIC_PROFILE_SELECTABLE_SECTIONS =
  new Set([
    "overview",
    "about",
    "education",
    "skills",
    "achievements",
    "media",
    "contact",
    "social",
    "network",
  ]);

const PROFESSIONAL_PUBLIC_PROFILE_SELECTABLE_SECTIONS =
  new Set([
    "overview",
    "about",
    "professional",
    "education",
    "skills",
    "certifications",
    "achievements",
    "portfolio",
    "media",
    "contact",
    "social",
    "network",
  ]);

/* =========================
   OPTIONAL DATABASE COLUMNS

   Existing columns are never modified.
   Missing public-profile columns are created once.
========================= */

const OPTIONAL_PUBLIC_COLUMNS = {
  salutation:
    "VARCHAR(30) NULL",

  blood_group:
    "VARCHAR(20) NULL",

  current_status:
    "VARCHAR(100) NULL",

  professional_role:
    "VARCHAR(255) NULL",

  years_of_experience:
    "INT UNSIGNED NULL",

  bio:
    "TEXT NULL",

  profile_bio:
    "TEXT NULL",

  profile_image_url:
    "VARCHAR(500) NULL",

  social_instagram:
    "VARCHAR(500) NULL",

  social_linkedin:
    "VARCHAR(500) NULL",

  social_twitter:
    "VARCHAR(500) NULL",

  social_facebook:
    "VARCHAR(500) NULL",

  social_youtube:
    "VARCHAR(500) NULL",

  public_profile_sections:
    "LONGTEXT NULL",

  public_profile_fields:
    "LONGTEXT NULL",

  display_name:
    "VARCHAR(255) NULL",

  school_college_name:
    "VARCHAR(255) NULL",

  degree_certificate_year:
    "VARCHAR(10) NULL",

  additional_certifications:
    "LONGTEXT NULL",

  language_skills:
    "LONGTEXT NULL",

  awards_recognitions:
    "LONGTEXT NULL",

  publications:
    "LONGTEXT NULL",

  professional_certifications:
    "LONGTEXT NULL",

  key_milestones:
    "LONGTEXT NULL",

  media_mentions:
    "LONGTEXT NULL",

  reference_letters:
    "LONGTEXT NULL",

  total_experience_years:
    "DECIMAL(5,2) NULL",

  previous_employers_clients:
    "LONGTEXT NULL",

  work_samples:
    "LONGTEXT NULL",

  hourly_project_rate:
    "VARCHAR(100) NULL",

  hourly_project_rate_public:
    "TINYINT(1) NOT NULL DEFAULT 0",

  availability_status:
    "VARCHAR(100) NULL",

  professional_bio:
    "TEXT NULL",

  interest_categories:
    "LONGTEXT NULL",

  hobbies:
    "LONGTEXT NULL",

  preferred_industry:
    "VARCHAR(255) NULL",

  cover_photo:
    "VARCHAR(500) NULL",

  gallery_photos:
    "LONGTEXT NULL",

  intro_video:
    "VARCHAR(500) NULL",

  portfolio_url:
    "VARCHAR(500) NULL",

  phone_public:
    "TINYINT(1) NOT NULL DEFAULT 0",

  qualification_public:
    "TINYINT(1) NOT NULL DEFAULT 0",
};

/* =========================
   CIVILIAN ARRAY FIELDS
========================= */

const CIVILIAN_ARRAY_FIELDS =
  new Set([
    "additional_certifications",
    "language_skills",

    "awards_recognitions",
    "publications",
    "professional_certifications",
    "key_milestones",
    "media_mentions",
    "reference_letters",

    "interest_categories",
    "skills",
    "hobbies",

    "gallery_photos",

    "public_profile_sections",
    "public_profile_fields",
  ]);

/* =========================
   CIVILIAN BOOLEAN FIELDS
========================= */

const CIVILIAN_BOOLEAN_FIELDS =
  new Set([
    "phone_public",
    "qualification_public",
  ]);

/* =========================
   PROFESSIONAL ARRAY FIELDS

   PROFESSIONAL LOGIC UNCHANGED
========================= */

const PROFESSIONAL_ARRAY_FIELDS =
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
    "public_profile_sections",
    "public_profile_fields",
  ]);

/* =========================
   PROFESSIONAL BOOLEAN FIELDS
========================= */

const PROFESSIONAL_BOOLEAN_FIELDS =
  new Set([
    "phone_public",
    "qualification_public",
    "hourly_project_rate_public",
  ]);

/* =========================
   PROFESSIONAL MEMBERSHIP CHECK
========================= */

const isProfessionalMembership = (
  value
) => {
  const normalized =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  return (
    normalized ===
      "professional" ||
    normalized ===
      "professional member" ||
    normalized ===
      "professional membership" ||
    normalized.includes(
      "professional"
    )
  );
};

/* =========================
   NORMALIZE ARRAY FOR STORAGE
========================= */

const normalizeArrayForStorage = (
  value
) => {
  if (
    Array.isArray(
      value
    )
  ) {
    return JSON.stringify(
      value
        .map(
          (item) =>
            typeof item ===
            "string"
              ? item.trim()
              : item
        )
        .filter(
          Boolean
        )
    );
  }

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return JSON.stringify(
      []
    );
  }

  if (
    typeof value ===
    "string"
  ) {
    const text =
      value.trim();

    if (!text) {
      return JSON.stringify(
        []
      );
    }

    try {
      const parsed =
        JSON.parse(
          text
        );

      if (
        Array.isArray(
          parsed
        )
      ) {
        return JSON.stringify(
          parsed
        );
      }
    } catch {
      // Supports comma, pipe and newline input.
    }

    return JSON.stringify(
      text
        .split(
          /[,|\n]/
        )
        .map(
          (item) =>
            item.trim()
        )
        .filter(
          Boolean
        )
    );
  }

  return JSON.stringify(
    []
  );
};

/* =========================
   NORMALIZE CIVILIAN UPDATE VALUE
========================= */

const normalizeCivilianUpdateValue = (
  fieldName,
  value
) => {
  /* ARRAY / LIST FIELDS */

  if (
    CIVILIAN_ARRAY_FIELDS.has(
      fieldName
    )
  ) {
    return normalizeArrayForStorage(
      value
    );
  }

  /* BOOLEAN FIELDS */

  if (
    CIVILIAN_BOOLEAN_FIELDS.has(
      fieldName
    )
  ) {
    return (
      value === true ||
      value === 1 ||
      value === "1" ||
      String(
        value
      )
        .trim()
        .toLowerCase() ===
        "true"
    )
      ? 1
      : 0;
  }

  /* NULL */

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  /* NORMAL TEXT */

  return typeof value ===
    "string"
    ? value.trim()
    : value;
};

/* =========================
   NORMALIZE PROFESSIONAL UPDATE VALUE

   PROFESSIONAL LOGIC UNCHANGED
========================= */

const normalizeProfessionalUpdateValue = (
  fieldName,
  value
) => {
  if (
    PROFESSIONAL_ARRAY_FIELDS.has(
      fieldName
    )
  ) {
    return normalizeArrayForStorage(
      value
    );
  }

  if (
    PROFESSIONAL_BOOLEAN_FIELDS.has(
      fieldName
    )
  ) {
    return (
      value === true ||
      value === 1 ||
      value === "1" ||
      String(
        value
      )
        .trim()
        .toLowerCase() ===
        "true"
    )
      ? 1
      : 0;
  }

  if (
    fieldName ===
    "total_experience_years"
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const parsed =
      Number(
        value
      );

    return (
      Number.isFinite(
        parsed
      ) &&
      parsed >= 0 &&
      parsed <= 80
    )
      ? parsed
      : null;
  }

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return typeof value ===
    "string"
    ? value.trim()
    : value;
};

/* =========================
   NORMALIZE MEMBER ID
========================= */

const normalizeMemberId =
  (
    memberId
  ) => {
    const parsedId =
      Number(
        memberId
      );

    if (
      !Number.isInteger(
        parsedId
      ) ||
      parsedId <= 0
    ) {
      return null;
    }

    return parsedId;
  };

/* =========================
   NORMALIZE LOGIN ID
========================= */

const normalizeLoginId =
  (
    loginId
  ) => {
    const normalized =
      String(
        loginId ||
          ""
      ).trim();

    if (
      !normalized ||
      normalized.length >
        100
    ) {
      return null;
    }

    return normalized;
  };

/* =========================
   GET TABLE COLUMNS
========================= */

const getKycMemberColumns =
  async (
    connection =
      null
  ) => {
    const rows =
      await executeQuery(
        `
          SHOW COLUMNS
          FROM kyc_members
        `,
        [],
        connection
      );

    return new Set(
      (
        Array.isArray(
          rows
        )
          ? rows
          : []
      )
        .map(
          (
            row
          ) =>
            row.Field ||
            row.field ||
            Object.values(
              row
            )[0]
        )
        .filter(
          Boolean
        )
    );
  };

/* =========================
   ENSURE OPTIONAL COLUMNS
========================= */

const ensurePublicProfileColumns =
  async (
    connection =
      null
  ) => {
    const columns =
      await getKycMemberColumns(
        connection
      );

    for (
      const [
        columnName,
        columnDefinition,
      ] of Object.entries(
        OPTIONAL_PUBLIC_COLUMNS
      )
    ) {
      if (
        columns.has(
          columnName
        )
      ) {
        continue;
      }

      try {
        await executeQuery(
          `
            ALTER TABLE
              kyc_members

            ADD COLUMN
              \`${columnName}\`
              ${columnDefinition}
          `,
          [],
          connection
        );

        columns.add(
          columnName
        );
      } catch (
        error
      ) {
        if (
          error?.code !==
          "ER_DUP_FIELDNAME"
        ) {
          throw error;
        }

        columns.add(
          columnName
        );
      }
    }

    return columns;
  };

/* =========================
   FIND PUBLIC MEMBER
========================= */

const findPublicUserByLoginId =
  async (
    loginId,
    connection =
      null
  ) => {
    const normalizedLoginId =
      normalizeLoginId(
        loginId
      );

    if (
      !normalizedLoginId
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            *

          FROM
            kyc_members

          WHERE
            login_id = ?

            AND COALESCE(
              is_deleted,
              0
            ) = 0

            AND LOWER(
              TRIM(
                COALESCE(
                  payment_status,
                  ''
                )
              )
            ) = 'approved'

          LIMIT 1
        `,
        [
          normalizedLoginId,
        ],
        connection
      );

    return Array.isArray(
      rows
    )
      ? rows[0] ||
          null
      : null;
  };

/* =========================
   FIND OWNER
========================= */

const findPublicProfileOwnerById =
  async (
    memberId,
    connection =
      null
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            *

          FROM
            kyc_members

          WHERE
            id = ?

            AND COALESCE(
              is_deleted,
              0
            ) = 0

          LIMIT 1
        `,
        [
          normalizedMemberId,
        ],
        connection
      );

    return Array.isArray(
      rows
    )
      ? rows[0] ||
          null
      : null;
  };

/* =========================
   DUPLICATE EMAIL
========================= */

const findOtherMemberByEmail =
  async (
    email,
    memberId,
    connection =
      null
  ) => {
    const normalizedEmail =
      String(
        email ||
          ""
      )
        .trim()
        .toLowerCase();

    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedEmail ||
      !normalizedMemberId
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            id,
            login_id,
            email

          FROM
            kyc_members

          WHERE
            LOWER(
              TRIM(
                email
              )
            ) = ?

            AND id <> ?

            AND COALESCE(
              is_deleted,
              0
            ) = 0

          LIMIT 1
        `,
        [
          normalizedEmail,
          normalizedMemberId,
        ],
        connection
      );

    return Array.isArray(
      rows
    )
      ? rows[0] ||
          null
      : null;
  };

/* =========================
   DUPLICATE PHONE
========================= */

const findOtherMemberByPhone =
  async (
    phone,
    memberId,
    connection =
      null
  ) => {
    const normalizedPhone =
      String(
        phone ||
          ""
      ).replace(
        /\D/g,
        ""
      );

    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedPhone ||
      !normalizedMemberId
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            id,
            login_id,
            phone

          FROM
            kyc_members

          WHERE
            phone = ?

            AND id <> ?

            AND COALESCE(
              is_deleted,
              0
            ) = 0

          LIMIT 1
        `,
        [
          normalizedPhone,
          normalizedMemberId,
        ],
        connection
      );

    return Array.isArray(
      rows
    )
      ? rows[0] ||
          null
      : null;
  };

/* =========================
   UPDATE OWNER PROFILE
========================= */

const updatePublicProfileOwner =
  async (
    memberId,
    updateData,
    connection =
      null
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      return {
        result:
          null,

        updatedFields:
          [],

        skippedFields:
          [],
      };
    }

    const owner =
      await findPublicProfileOwnerById(
        normalizedMemberId,
        connection
      );

    if (!owner) {
      return {
        result:
          null,

        updatedFields:
          [],

        skippedFields:
          Object.keys(
            updateData ||
              {}
          ),
      };
    }

    /*
      IMPORTANT

      Professional:
        → PROFESSIONAL whitelist
        → PROFESSIONAL normalization

      Civilian:
        → CIVILIAN whitelist
        → CIVILIAN normalization
    */

    const professionalOwner =
      isProfessionalMembership(
        owner.membership_type
      );

    const editableFields =
      professionalOwner
        ? PROFESSIONAL_PUBLIC_PROFILE_EDIT_FIELDS
        : PUBLIC_PROFILE_EDIT_FIELDS;

    const selectableFields =
      professionalOwner
        ? PROFESSIONAL_PUBLIC_PROFILE_SELECTABLE_FIELDS
        : PUBLIC_PROFILE_SELECTABLE_FIELDS;

    const selectableSections =
      professionalOwner
        ? PROFESSIONAL_PUBLIC_PROFILE_SELECTABLE_SECTIONS
        : PUBLIC_PROFILE_SELECTABLE_SECTIONS;

    const availableColumns =
      await ensurePublicProfileColumns(
        connection
      );

    const validEntries =
      [];

    const skippedFields =
      [];

    for (
      const [
        fieldName,
        rawValue,
      ] of Object.entries(
        updateData ||
          {}
      )
    ) {
      if (
        !editableFields.has(
          fieldName
        ) ||
        !availableColumns.has(
          fieldName
        )
      ) {
        skippedFields.push(
          fieldName
        );

        continue;
      }

      let value =
        rawValue;

      /* ===============================================
         VISIBILITY FIELDS

         Filter values using corresponding
         membership-specific public whitelist.
      =============================================== */

      if (
        fieldName ===
        "public_profile_fields"
      ) {
        const requested =
          Array.isArray(
            rawValue
          )
            ? rawValue
            : normalizeArrayForStorage(
                rawValue
              );

        const requestedArray =
          Array.isArray(
            requested
          )
            ? requested
            : (() => {
                try {
                  return JSON.parse(
                    requested
                  );
                } catch {
                  return [];
                }
              })();

        value =
          requestedArray.filter(
            (item) =>
              selectableFields.has(
                String(
                  item
                )
              )
          );
      }

      if (
        fieldName ===
        "public_profile_sections"
      ) {
        const requested =
          Array.isArray(
            rawValue
          )
            ? rawValue
            : normalizeArrayForStorage(
                rawValue
              );

        const requestedArray =
          Array.isArray(
            requested
          )
            ? requested
            : (() => {
                try {
                  return JSON.parse(
                    requested
                  );
                } catch {
                  return [];
                }
              })();

        value =
          requestedArray.filter(
            (item) =>
              selectableSections.has(
                String(
                  item
                )
              )
          );
      }

      /* ===============================================
         MEMBERSHIP-SPECIFIC NORMALIZATION
      =============================================== */

      validEntries.push([
        fieldName,

        professionalOwner
          ? normalizeProfessionalUpdateValue(
              fieldName,
              value
            )
          : normalizeCivilianUpdateValue(
              fieldName,
              value
            ),
      ]);
    }

    if (
      validEntries.length ===
      0
    ) {
      return {
        result:
          null,

        updatedFields:
          [],

        skippedFields,
      };
    }

    const setClause =
      validEntries
        .map(
          (
            [
              fieldName,
            ]
          ) =>
            `\`${fieldName}\` = ?`
        )
        .join(
          ", "
        );

    const values =
      validEntries.map(
        (
          [
            ,
            value,
          ]
        ) =>
          value
      );

    values.push(
      normalizedMemberId
    );

    const result =
      await executeQuery(
        `
          UPDATE
            kyc_members

          SET
            ${setClause}

          WHERE
            id = ?

            AND COALESCE(
              is_deleted,
              0
            ) = 0
        `,
        values,
        connection
      );

    return {
      result,

      updatedFields:
        validEntries.map(
          (
            [
              fieldName,
            ]
          ) =>
            fieldName
        ),

      skippedFields,
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  PUBLIC_PROFILE_EDIT_FIELDS,

  PROFESSIONAL_PUBLIC_PROFILE_EDIT_FIELDS,

  PUBLIC_PROFILE_SELECTABLE_FIELDS,

  PROFESSIONAL_PUBLIC_PROFILE_SELECTABLE_FIELDS,

  PUBLIC_PROFILE_SELECTABLE_SECTIONS,

  PROFESSIONAL_PUBLIC_PROFILE_SELECTABLE_SECTIONS,

  OPTIONAL_PUBLIC_COLUMNS,

  normalizeMemberId,

  normalizeLoginId,

  getKycMemberColumns,

  ensurePublicProfileColumns,

  findPublicUserByLoginId,

  findPublicProfileOwnerById,

  findOtherMemberByEmail,

  findOtherMemberByPhone,

  updatePublicProfileOwner,
};