/* =========================================================
   INMBA BACKEND
   PUBLIC PROFILE SERVICE

   IMPORTANT:

   THIS FILE IS BACKEND COMMONJS.

   CORRECT:
   require(...)
   module.exports = ...

   WRONG:
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

const {
  buildProfessionalPublicProfile,
} = require(
  "../utils/professionalPublicProfile"
);

/* =========================================================
   DATABASE
========================================================= */

let fallbackPool =
  null;

/* =========================================================
   HELPERS
========================================================= */

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

const asObject = (
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

const toArray = (
  value
) => {
  if (
    Array.isArray(
      value
    )
  ) {
    return value;
  }

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  if (
    typeof value ===
      "string"
  ) {
    const text =
      value.trim();

    if (!text) {
      return [];
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
        return parsed;
      }
    } catch {
      /*
        Legacy comma / pipe /
        newline separated data.
      */
    }

    return text
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
      );
  }

  return [];
};

/* =========================================================
   MEMBERSHIP TYPE
========================================================= */

const normalizeMembershipType = (
  value
) => {
  return toText(
    value
  )
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );
};

const isProfessionalMembership = (
  value
) => {
  const type =
    normalizeMembershipType(
      value
    );

  return [
    "professional",
    "professional member",
    "professional membership",
  ].includes(
    type
  );
};

/* =========================================================
   PAYMENT STATUS
========================================================= */

const isPaymentApproved = (
  value
) => {
  const status =
    toText(
      value
    ).toLowerCase();

  return (
    status ===
      "approved" ||
    status ===
      "paid"
  );
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
========================================================= */

const getDatabaseExecutor =
  async () => {
    /*
      Current lazy DB wrapper.
    */

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

    /*
      Direct wrapper.
    */

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

    /*
      Plain config object.
    */

    return getFallbackPool();
  };

/* =========================================================
   MYSQL RESULT
========================================================= */

const normalizeQueryResult = (
  result
) => {
  if (
    Array.isArray(
      result
    ) &&
    result.length ===
      2
  ) {
    return result[0];
  }

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
      typeof db?.execute ===
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
      typeof db?.query ===
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
   GET MEMBER BY LOGIN ID

   Full DB row stays INTERNAL.

   Never send this raw object directly
   from a public controller.
========================================================= */

const findMemberByLoginId =
  async (
    loginId
  ) => {
    const safeLoginId =
      toText(
        loginId
      );

    if (
      !safeLoginId
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
          safeLoginId,
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
   LEGACY NON-PROFESSIONAL PUBLIC PROFILE

   Professional members DO NOT use this builder.
========================================================= */

const buildLegacyPublicProfile = (
  member
) => {
  const source =
    asObject(
      member
    );

  return {
    login_id:
      source.login_id ??
      null,

    first_name:
      source.first_name ??
      null,

    last_name:
      source.last_name ??
      null,

    membership_type:
      source.membership_type ??
      null,

    occupation:
      source.occupation ??
      null,

    education:
      source.education ??
      null,

    educational_qualification:
      source
        .educational_qualification ??
      null,

    profile_pic:
      source.profile_pic ??
      null,

    city:
      source.city ??
      null,

    district:
      source.district ??
      null,

    state:
      source.state ??
      null,

    pincode:
      source.pincode ??
      null,

    social_link:
      source.social_link ??
      source.social_links ??
      null,

    social_links:
      source.social_links ??
      source.social_link ??
      null,

    social_instagram:
      source.social_instagram ??
      null,

    social_linkedin:
      source.social_linkedin ??
      null,

    social_twitter:
      source.social_twitter ??
      null,

    social_facebook:
      source.social_facebook ??
      null,

    social_youtube:
      source.social_youtube ??
      null,

    public_profile_sections:
      toArray(
        source
          .public_profile_sections
      ),

    public_profile_fields:
      toArray(
        source
          .public_profile_fields
      ),
  };
};

/* =========================================================
   GET PUBLIC PROFILE

   PROFESSIONAL:

   Uses strict Professional whitelist created
   in professionalPublicProfile.js.

   NON-PROFESSIONAL:

   Uses existing safe legacy public response.
========================================================= */

const getPublicProfile =
  async (
    loginId
  ) => {
    const safeLoginId =
      toText(
        loginId
      );

    if (
      !safeLoginId
    ) {
      const error =
        new Error(
          "Member Login ID is required."
        );

      error.statusCode =
        400;

      throw error;
    }

    const member =
      await findMemberByLoginId(
        safeLoginId
      );

    if (
      !member
    ) {
      return null;
    }

    /* =====================================================
       PAYMENT
    ===================================================== */

    if (
      !isPaymentApproved(
        member.payment_status
      )
    ) {
      return null;
    }

    /* =====================================================
       PROFESSIONAL

       Aadhaar / PAN / bank / DOB /
       email / documents etc. never returned.
    ===================================================== */

    if (
      isProfessionalMembership(
        member.membership_type
      )
    ) {
      return (
        buildProfessionalPublicProfile(
          member
        )
      );
    }

    /* =====================================================
       OTHER MEMBERSHIP
    ===================================================== */

    return buildLegacyPublicProfile(
      member
    );
  };

/* =========================================================
   PUBLIC PROFILE VISIBILITY UPDATE FIELDS

   This service intentionally only handles
   visibility/preferences.

   Full member profile update stays in
   profile.service.js / Professional KYC service.
========================================================= */

const PUBLIC_VISIBILITY_FIELDS =
  Object.freeze([
    "public_profile_sections",

    "public_profile_fields",
  ]);

/* =========================================================
   NORMALIZE DB VALUE
========================================================= */

const normalizeDatabaseValue = (
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
    ) ||
    (
      value &&
      typeof value ===
        "object"
    )
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

    return (
      text ||
      null
    );
  }

  return value;
};

/* =========================================================
   GET VISIBILITY UPDATE VALUES
========================================================= */

const getAllowedPublicProfileUpdate =
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
      of PUBLIC_VISIBILITY_FIELDS
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
   UPDATE OWN PUBLIC PROFILE VISIBILITY

   memberId MUST come from authenticated session/controller.

   Do not use body.memberId as ownership proof.
========================================================= */

const updatePublicProfile =
  async (
    memberId,
    values = {}
  ) => {
    const id =
      Number(
        memberId
      );

    if (
      !Number.isInteger(
        id
      ) ||
      id <= 0
    ) {
      const error =
        new Error(
          "Valid authenticated member ID is required."
        );

      error.statusCode =
        401;

      throw error;
    }

    const updateData =
      getAllowedPublicProfileUpdate(
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
      fieldNames.map(
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

    return {
      success:
        Number(
          result
            ?.affectedRows ??
          0
        ) >
        0,

      affectedRows:
        Number(
          result
            ?.affectedRows ??
          0
        ),

      updatedFields:
        fieldNames,
    };
  };

/* =========================================================
   COMPATIBILITY ALIASES

   Existing controller/service-index versions may
   use slightly different names.
========================================================= */

const getPublicMemberProfile =
  getPublicProfile;

const getPublicProfileByLoginId =
  getPublicProfile;

const findPublicProfileByLoginId =
  getPublicProfile;

const fetchPublicProfile =
  getPublicProfile;

const updateOwnPublicProfile =
  updatePublicProfile;

const updatePublicMemberProfile =
  updatePublicProfile;


  /* =========================================================
   CREATE PUBLIC PROFILE PHOTO URL

   Compatible with:
   createPublicProfilePhotoUrl(photo)
   createPublicProfilePhotoUrl(photo, request)
   createPublicProfilePhotoUrl(request, photo)

   Bare filename:
   abc.jpg
        ↓
   /uploads/profile/abc.jpg
========================================================= */

const createPublicProfilePhotoUrl =
  (
    firstValue,
    secondValue
  ) => {
    let request =
      null;

    let photoValue =
      "";

    const values = [
      firstValue,
      secondValue,
    ];

    for (
      const value
      of values
    ) {
      /* ===============================================
         REQUEST OBJECT
      =============================================== */

      if (
        value &&
        typeof value ===
          "object" &&
        (
          typeof value.get ===
            "function" ||
          value.headers ||
          value.protocol
        )
      ) {
        request =
          value;

        continue;
      }

      /* ===============================================
         STRING PHOTO
      =============================================== */

      if (
        typeof value ===
          "string" &&
        value.trim()
      ) {
        photoValue =
          value.trim();

        continue;
      }

      /* ===============================================
         MEMBER / PROFILE OBJECT
      =============================================== */

      if (
        value &&
        typeof value ===
          "object"
      ) {
        photoValue =
          toText(
            value.profile_pic ??
            value.profilePic ??
            value.profile_photo ??
            value.profilePhoto ??
            value.photo_url ??
            value.photoUrl
          );
      }
    }

    if (
      !photoValue
    ) {
      return null;
    }

    /* ===============================================
       ALREADY COMPLETE URL
    =============================================== */

    if (
      photoValue.startsWith(
        "http://"
      ) ||
      photoValue.startsWith(
        "https://"
      ) ||
      photoValue.startsWith(
        "data:"
      ) ||
      photoValue.startsWith(
        "blob:"
      )
    ) {
      return photoValue;
    }

    /* ===============================================
       NORMALIZE PATH
    =============================================== */

    let publicPath =
      "";

    if (
      photoValue.startsWith(
        "/uploads/"
      )
    ) {
      publicPath =
        photoValue;
    } else if (
      photoValue.startsWith(
        "uploads/"
      )
    ) {
      publicPath =
        `/${photoValue}`;
    } else if (
      photoValue.startsWith(
        "/static/uploads/"
      )
    ) {
      publicPath =
        photoValue.replace(
          "/static/uploads/",
          "/uploads/"
        );
    } else if (
      photoValue.startsWith(
        "static/uploads/"
      )
    ) {
      publicPath =
        `/${photoValue.replace(
          "static/uploads/",
          "uploads/"
        )}`;
    } else if (
      photoValue.includes(
        "/"
      )
    ) {
      publicPath =
        `/${photoValue.replace(
          /^\/+/,
          ""
        )}`;
    } else {
      publicPath =
        `/uploads/profile/${encodeURIComponent(
          photoValue
        )}`;
    }

    /* ===============================================
       REQUEST AVAILABLE

       Return absolute backend URL.
    =============================================== */

    if (
      request
    ) {
      const protocol =
        toText(
          request.protocol,
          "http"
        );

      let host =
        "";

      if (
        typeof request.get ===
        "function"
      ) {
        host =
          toText(
            request.get(
              "host"
            )
          );
      }

      if (
        !host
      ) {
        host =
          toText(
            request.headers
              ?.host
          );
      }

      if (
        host
      ) {
        return `${protocol}://${host}${publicPath}`;
      }
    }

    /* ===============================================
       REQUEST NOT AVAILABLE

       Relative URL is safe for frontend.
    =============================================== */

    return publicPath;
  };

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  /* CONSTANTS */

  PUBLIC_VISIBILITY_FIELDS,

  /* HELPERS */

  isProfessionalMembership,

  isPaymentApproved,

  buildLegacyPublicProfile,

  getAllowedPublicProfileUpdate,

  /* DB */

  findMemberByLoginId,

  /* PUBLIC PROFILE */

  getPublicProfile,

  getPublicMemberProfile,

  getPublicProfileByLoginId,

  findPublicProfileByLoginId,

  fetchPublicProfile,

  createPublicProfilePhotoUrl,

  /* VISIBILITY UPDATE */

  updatePublicProfile,

  updateOwnPublicProfile,

  updatePublicMemberProfile,
};