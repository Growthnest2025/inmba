/* =========================================================
   INMBA BACKEND PROFILE SERVICE

   IMPORTANT
   ---------------------------------------------------------

   THIS IS BACKEND CODE.

   CommonJS only:

   require(...)
   module.exports = ...

   DO NOT use:

   import ...
   export ...

========================================================= */

const mysql =
  require(
    "mysql2/promise"
  );

const databaseConfig =
  require(
    "../config/database"
  );

/* =========================================================
   DATABASE FALLBACK POOL
========================================================= */

let fallbackPool =
  null;

/* =========================================================
   PROFILE EDITABLE FIELDS

   Sensitive system-controlled fields are intentionally
   excluded from normal profile editing.

   Examples excluded:

   id
   login_id
   password
   payment_status
   referral_id
   referred_by
   direct_network
   indirect_network
   network_level
   royalty_slab_category
========================================================= */

const PROFILE_EDITABLE_FIELDS =
  Object.freeze([
    /* PERSONAL */

    "first_name",
    "last_name",
    "father_name",

    "dob",
    "gender",
    "marital_status",
    "nationality",

    /* CONTACT */

    "email",
    "phone",
    "secondary_mobile",
    "whatsapp_number",
    "contact_number",

    /* ADDRESS */

    "address",

    "city",
    "district",
    "state",
    "pincode",
    "country",

    "entity_house_no",
    "entity_street",
    "entity_area",
    "entity_city",
    "entity_district",
    "entity_state",
    "entity_pincode",

    /* EDUCATION */

    "education",
    "educational_qualification",

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

    /* PROFESSIONAL */

    "occupation",
    "profession",
    "professional_role",

    "years_of_experience",

    "skills",

    /* BIO */

    "bio",
    "profile_bio",

    /* SOCIAL */

    "social_link",
    "social_links",

    "social_instagram",
    "social_linkedin",
    "social_twitter",
    "social_facebook",
    "social_youtube",

    /* STUDENT */

    "student_id",

    /* NOMINEE */

    "nomini_name",
    "nomini_dob",
    "nomini_relationship",
    "nomini_aadhar",

    /* PUBLIC VISIBILITY */

    "public_profile_sections",
    "public_profile_fields",
  ]);

/* =========================================================
   TEXT
========================================================= */

const toText =
  (
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
   OBJECT CHECK
========================================================= */

const asObject =
  (
    value
  ) => {
    if (
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(
        value
      )
    ) {
      return value;
    }

    return {};
  };

/* =========================================================
   VALID MEMBER ID
========================================================= */

const normalizeMemberId =
  (
    value
  ) => {
    const number =
      Number(
        value
      );

    if (
      !Number.isInteger(
        number
      ) ||
      number <= 0
    ) {
      return null;
    }

    return number;
  };

/* =========================================================
   FALLBACK MYSQL POOL
========================================================= */

const getFallbackPool =
  () => {
    if (
      fallbackPool
    ) {
      return fallbackPool;
    }

    fallbackPool =
      mysql.createPool({
        host:
          databaseConfig.host,

        port:
          databaseConfig.port,

        user:
          databaseConfig.user,

        password:
          databaseConfig.password,

        database:
          databaseConfig.database,

        waitForConnections:
          databaseConfig
            .waitForConnections ??
          true,

        connectionLimit:
          databaseConfig
            .connectionLimit ??
          5,

        maxIdle:
          databaseConfig
            .maxIdle ??
          5,

        idleTimeout:
          databaseConfig
            .idleTimeout ??
          60000,

        queueLimit:
          databaseConfig
            .queueLimit ??
          0,

        connectTimeout:
          databaseConfig
            .connectTimeout ??
          20000,

        enableKeepAlive:
          databaseConfig
            .enableKeepAlive ??
          true,

        keepAliveInitialDelay:
          databaseConfig
            .keepAliveInitialDelay ??
          0,

        namedPlaceholders:
          databaseConfig
            .namedPlaceholders ??
          true,

        dateStrings:
          databaseConfig
            .dateStrings ??
          true,

        charset:
          databaseConfig
            .charset ||
          "utf8mb4",
      });

    return fallbackPool;
  };

/* =========================================================
   DATABASE EXECUTOR

   Supports current project DB implementations:

   getPool()
   execute()
   query()

   And plain config fallback.
========================================================= */

const getDatabaseExecutor =
  async () => {
    /* =====================================================
       LAZY POOL MODULE
    ===================================================== */

    if (
      typeof databaseConfig
        ?.getPool ===
      "function"
    ) {
      const pool =
        await databaseConfig
          .getPool();

      if (
        pool
      ) {
        return pool;
      }
    }

    /* =====================================================
       DIRECT DB WRAPPER
    ===================================================== */

    if (
      typeof databaseConfig
        ?.execute ===
        "function" ||
      typeof databaseConfig
        ?.query ===
        "function"
    ) {
      return databaseConfig;
    }

    /* =====================================================
       CONFIG OBJECT FALLBACK
    ===================================================== */

    return getFallbackPool();
  };

/* =========================================================
   MYSQL RESULT NORMALIZER
========================================================= */

const normalizeQueryResult =
  (
    result
  ) => {
    /*
      mysql2:

      [
        rows,
        fields
      ]
    */

    if (
      Array.isArray(
        result
      ) &&
      result.length ===
        2
    ) {
      return result[0];
    }

    /*
      Custom DB wrapper:
      rows directly
    */

    return result;
  };

/* =========================================================
   RUN QUERY
========================================================= */

const runQuery =
  async (
    sql,
    params = []
  ) => {
    const db =
      await getDatabaseExecutor();

    if (
      typeof db
        ?.execute ===
      "function"
    ) {
      const result =
        await db.execute(
          sql,
          params
        );

      return normalizeQueryResult(
        result
      );
    }

    if (
      typeof db
        ?.query ===
      "function"
    ) {
      const result =
        await db.query(
          sql,
          params
        );

      return normalizeQueryResult(
        result
      );
    }

    throw new Error(
      "Database executor is not available."
    );
  };

/* =========================================================
   JSON DATABASE VALUE

   Arrays / objects stored as JSON text.
========================================================= */

const normalizeDatabaseValue =
  (
    value
  ) => {
    if (
      typeof value ===
      "undefined"
    ) {
      return undefined;
    }

    if (
      value === null
    ) {
      return null;
    }

    if (
      Array.isArray(
        value
      )
    ) {
      return JSON.stringify(
        value
      );
    }

    if (
      typeof value ===
        "object"
    ) {
      return JSON.stringify(
        value
      );
    }

    if (
      typeof value ===
        "string"
    ) {
      const text =
        value.trim();

      return text ===
        ""
        ? null
        : text;
    }

    return value;
  };

/* =========================================================
   FILTER PROFILE UPDATE DATA
========================================================= */

const getAllowedProfileUpdateData =
  (
    values
  ) => {
    const source =
      asObject(
        values
      );

    const result = {};

    for (
      const fieldName
      of PROFILE_EDITABLE_FIELDS
    ) {
      if (
        !Object.prototype
          .hasOwnProperty
          .call(
            source,
            fieldName
          )
      ) {
        continue;
      }

      const value =
        normalizeDatabaseValue(
          source[
            fieldName
          ]
        );

      if (
        typeof value ===
        "undefined"
      ) {
        continue;
      }

      result[
        fieldName
      ] =
        value;
    }

    return result;
  };

/* =========================================================
   GET MEMBER PROFILE BY ID

   Owner/private backend service.

   GET /my_profile controller can use this.
========================================================= */

const getMemberProfileById =
  async (
    memberId
  ) => {
    const id =
      normalizeMemberId(
        memberId
      );

    if (
      !id
    ) {
      return null;
    }

    const rows =
      await runQuery(
        `
          SELECT
            *

          FROM
            kyc_members

          WHERE
            id = ?

            AND
            (
              is_deleted = 0
              OR
              is_deleted IS NULL
            )

          LIMIT 1
        `,
        [
          id,
        ]
      );

    if (
      !Array.isArray(
        rows
      )
    ) {
      return null;
    }

    return (
      rows[0] ||
      null
    );
  };

/* =========================================================
   GET MEMBER PROFILE BY LOGIN ID
========================================================= */

const getMemberProfileByLoginId =
  async (
    loginId
  ) => {
    const normalizedLoginId =
      toText(
        loginId
      );

    if (
      !normalizedLoginId
    ) {
      return null;
    }

    const rows =
      await runQuery(
        `
          SELECT
            *

          FROM
            kyc_members

          WHERE
            login_id = ?

            AND
            (
              is_deleted = 0
              OR
              is_deleted IS NULL
            )

          LIMIT 1
        `,
        [
          normalizedLoginId,
        ]
      );

    if (
      !Array.isArray(
        rows
      )
    ) {
      return null;
    }

    return (
      rows[0] ||
      null
    );
  };

/* =========================================================
   GET OWN PROFILE

   Compatibility function.

   Expected usage:

   getMyProfile(memberId)

   OR

   getOwnProfile(memberId)
========================================================= */

const getMyProfile =
  async (
    memberId
  ) => {
    return getMemberProfileById(
      memberId
    );
  };

/* =========================================================
   UPDATE PROFILE

   memberId comes from authenticated session/controller.

   Client cannot update:

   login_id
   password
   referral_id
   network
   payment status
========================================================= */

const updateProfile =
  async (
    memberId,
    values = {}
  ) => {
    const id =
      normalizeMemberId(
        memberId
      );

    if (
      !id
    ) {
      const error =
        new Error(
          "Valid member ID is required."
        );

      error.statusCode =
        400;

      throw error;
    }

    const updateData =
      getAllowedProfileUpdateData(
        values
      );

    const fieldNames =
      Object.keys(
        updateData
      );

    if (
      fieldNames.length ===
        0
    ) {
      return {
        success:
          false,

        affectedRows:
          0,

        updatedFields:
          [],
      };
    }

    const assignments =
      fieldNames
        .map(
          (
            fieldName
          ) =>
            `\`${fieldName}\` = ?`
        )
        .join(
          ", "
        );

    const params =
      fieldNames
        .map(
          (
            fieldName
          ) =>
            updateData[
              fieldName
            ]
        );

    params.push(
      id
    );

    const result =
      await runQuery(
        `
          UPDATE
            kyc_members

          SET
            ${assignments}

          WHERE
            id = ?

            AND
            (
              is_deleted = 0
              OR
              is_deleted IS NULL
            )
        `,
        params
      );

    const affectedRows =
      Number(
        result
          ?.affectedRows ??
        0
      );

    const member =
      await getMemberProfileById(
        id
      );

    return {
      success:
        affectedRows >
          0,

      affectedRows,

      updatedFields:
        fieldNames,

      member,

      profile:
        member,
    };
  };

/* =========================================================
   PROFILE PHOTO PATH NORMALIZER

   Service expects controller/file upload layer to provide:

   "/uploads/profile/photo.jpg"

   OR

   "photo.jpg"

   OR

   {
     photo_url: "...",
     profile_pic: "..."
   }
========================================================= */

const extractProfilePhotoValue =
  (
    value
  ) => {
    if (
      typeof value ===
      "string"
    ) {
      return toText(
        value
      );
    }

    const source =
      asObject(
        value
      );

    return toText(
      source.profile_pic ??
      source.profilePic ??
      source.profile_photo ??
      source.profilePhoto ??
      source.photo_url ??
      source.photoUrl ??
      source.file_url ??
      source.fileUrl ??
      source.path ??
      source.filepath ??
      source.filename
    );
  };

/* =========================================================
   UPDATE PROFILE PHOTO
========================================================= */

const updateProfilePhoto =
  async (
    memberId,
    photoValue
  ) => {
    const id =
      normalizeMemberId(
        memberId
      );

    if (
      !id
    ) {
      const error =
        new Error(
          "Valid member ID is required."
        );

      error.statusCode =
        400;

      throw error;
    }

    const profilePic =
      extractProfilePhotoValue(
        photoValue
      );

    if (
      !profilePic
    ) {
      const error =
        new Error(
          "Profile photo path is required."
        );

      error.statusCode =
        400;

      throw error;
    }

    const result =
      await runQuery(
        `
          UPDATE
            kyc_members

          SET
            profile_pic = ?

          WHERE
            id = ?

            AND
            (
              is_deleted = 0
              OR
              is_deleted IS NULL
            )
        `,
        [
          profilePic,
          id,
        ]
      );

    const affectedRows =
      Number(
        result
          ?.affectedRows ??
        0
      );

    const member =
      await getMemberProfileById(
        id
      );

    return {
      success:
        affectedRows >
          0,

      affectedRows,

      photo_url:
        profilePic,

      photoUrl:
        profilePic,

      profile_pic:
        profilePic,

      member,

      profile:
        member,
    };
  };

/* =========================================================
   FLEXIBLE UPLOAD PROFILE PHOTO COMPATIBILITY

   Some controller versions may call:

   uploadProfilePhoto(
     memberId,
     photoPath
   )

   This service only records the final uploaded file path.

   Multipart parsing/file moving stays in controller or
   fileStorage service.
========================================================= */

const uploadProfilePhoto =
  async (
    memberId,
    photoValue
  ) => {
    return updateProfilePhoto(
      memberId,
      photoValue
    );
  };

/* =========================================================
   GET PROFILE

   Compatibility alias.
========================================================= */

const getProfile =
  async (
    memberId
  ) => {
    return getMemberProfileById(
      memberId
    );
  };

/* =========================================================
   GET OWN PROFILE
========================================================= */

const getOwnProfile =
  async (
    memberId
  ) => {
    return getMemberProfileById(
      memberId
    );
  };

/* =========================================================
   UPDATE MEMBER PROFILE
========================================================= */

const updateMemberProfile =
  async (
    memberId,
    values
  ) => {
    return updateProfile(
      memberId,
      values
    );
  };

/* =========================================================
   UPDATE OWN PROFILE
========================================================= */

const updateOwnProfile =
  async (
    memberId,
    values
  ) => {
    return updateProfile(
      memberId,
      values
    );
  };

/* =========================================================
   SAVE PROFILE PHOTO
========================================================= */

const saveProfilePhoto =
  async (
    memberId,
    photoValue
  ) => {
    return updateProfilePhoto(
      memberId,
      photoValue
    );
  };

/* =========================================================
   CHANGE PROFILE PHOTO
========================================================= */

const changeProfilePhoto =
  async (
    memberId,
    photoValue
  ) => {
    return updateProfilePhoto(
      memberId,
      photoValue
    );
  };

/* =========================================================
   EXPORTS

   Multiple aliases are intentionally provided because
   existing INMBA controller/service-index versions used
   slightly different names during migration.

   All exports are CommonJS.
========================================================= */

module.exports = {
  /* CONSTANTS */

  PROFILE_EDITABLE_FIELDS,

  /* HELPERS */

  getAllowedProfileUpdateData,

  /* PROFILE READ */

  getMemberProfileById,

  getMemberProfileByLoginId,

  getMyProfile,

  getProfile,

  getOwnProfile,

  getMemberProfile:
    getMemberProfileById,

  findMemberProfileById:
    getMemberProfileById,

  findMemberById:
    getMemberProfileById,

  findProfileById:
    getMemberProfileById,

  /* PROFILE UPDATE */

  updateProfile,

  updateMemberProfile,

  updateOwnProfile,

  saveProfile:
    updateProfile,

  /* PHOTO */

  updateProfilePhoto,

  uploadProfilePhoto,

  saveProfilePhoto,

  changeProfilePhoto,

  updateMemberProfilePhoto:
    updateProfilePhoto,

  uploadMemberProfilePhoto:
    uploadProfilePhoto,
};