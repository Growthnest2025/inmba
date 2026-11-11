const mysql =
  require(
    "mysql2/promise"
  );

const databaseConfig =
  require(
    "../config/database"
  );

/* =========================================================
   PROFESSIONAL REGISTRATION DATABASE CONFIG

   IMPORTANT:
   database.js plain config object.
   அதையே mutate செய்யக்கூடாது.
========================================================= */

const professionalRegistrationDatabaseConfig =
  {
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
      databaseConfig.waitForConnections,

    connectionLimit:
      databaseConfig.connectionLimit,

    maxIdle:
      databaseConfig.maxIdle,

    idleTimeout:
      databaseConfig.idleTimeout,

    queueLimit:
      databaseConfig.queueLimit,

    connectTimeout:
      databaseConfig.connectTimeout,

    enableKeepAlive:
      databaseConfig.enableKeepAlive,

    keepAliveInitialDelay:
      databaseConfig.keepAliveInitialDelay,

    namedPlaceholders:
      databaseConfig.namedPlaceholders,

    dateStrings:
      databaseConfig.dateStrings,

    charset:
      databaseConfig.charset,
  };

let professionalRegistrationPool =
  null;

/* =========================================================
   GET DATABASE POOL
========================================================= */

const getProfessionalRegistrationPool =
  () => {
    if (
      !professionalRegistrationPool
    ) {
      professionalRegistrationPool =
        mysql.createPool(
          professionalRegistrationDatabaseConfig
        );
    }

    return professionalRegistrationPool;
  };

/* =========================================================
   DATABASE EXECUTOR
========================================================= */

const getDatabaseExecutor =
  (
    executor = null
  ) => {
    return (
      executor ||
      getProfessionalRegistrationPool()
    );
  };

/* =========================================================
   RUN QUERY
========================================================= */

const runQuery =
  async (
    sql,
    params = [],
    executor = null
  ) => {
    const db =
      getDatabaseExecutor(
        executor
      );

    if (
      typeof db?.execute ===
      "function"
    ) {
      const [
        rows,
      ] =
        await db.execute(
          sql,
          params
        );

      return rows;
    }

    if (
      typeof db?.query ===
      "function"
    ) {
      const [
        rows,
      ] =
        await db.query(
          sql,
          params
        );

      return rows;
    }

    throw new Error(
      "Professional registration database executor is not available."
    );
  };

/* =========================================================
   TRANSACTION CONNECTION
========================================================= */

const getTransactionConnection =
  async () => {
    const pool =
      getProfessionalRegistrationPool();

    if (
      typeof pool?.getConnection !==
      "function"
    ) {
      throw new Error(
        "Professional registration database connection is not available."
      );
    }

    return pool.getConnection();
  };

/* =========================================================
   HELPERS
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

const normalizeEmail =
  (
    value
  ) => {
    return toText(
      value
    )
      .toLowerCase();
  };

const normalizePhone =
  (
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
   PROFESSIONAL MEMBER CONDITION

   Same condition used by Professional KYC.
========================================================= */

const PROFESSIONAL_MEMBER_CONDITION = `
  LOWER(
    TRIM(
      membership_type
    )
  ) IN (
    'professional member',
    'professional membership',
    'professional'
  )
`;

/* =========================================================
   FIND EXISTING PROFESSIONAL ACCOUNT

   IMPORTANT:

   Email OR Mobile already exists:
   new Professional account create panna koodathu.

   FOR UPDATE:
   registration transaction உள்ளே use செய்யலாம்.
========================================================= */

const findExistingProfessionalAccount =
  async (
    {
      email,
      phone,
    },
    executor = null,
    {
      forUpdate =
        false,
    } = {}
  ) => {
    const normalizedEmail =
      normalizeEmail(
        email
      );

    const normalizedPhone =
      normalizePhone(
        phone
      );

    if (
      !normalizedEmail &&
      !normalizedPhone
    ) {
      return [];
    }

    const rows =
      await runQuery(
        `
          SELECT
            id,
            login_id,
            first_name,
            last_name,
            email,
            phone,
            membership_type,
            referral_id,
            referred_by,
            token,
            profile_pic,
            payment_status,
            created_at,
            is_deleted

          FROM
            kyc_members

          WHERE
            COALESCE(
              is_deleted,
              0
            ) = 0

            AND
            ${PROFESSIONAL_MEMBER_CONDITION}

            AND
            (
              LOWER(
                TRIM(
                  COALESCE(
                    email,
                    ''
                  )
                )
              ) = ?

              OR

              TRIM(
                COALESCE(
                  phone,
                  ''
                )
              ) = ?
            )

          ORDER BY
            id ASC

          LIMIT 5

          ${
            forUpdate
              ? "FOR UPDATE"
              : ""
          }
        `,
        [
          normalizedEmail,
          normalizedPhone,
        ],
        executor
      );

    return Array.isArray(
      rows
    )
      ? rows
      : [];
  };

/* =========================================================
   FIND LOGIN ID
========================================================= */

const findProfessionalMemberByLoginId =
  async (
    loginId,
    executor = null
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
            COALESCE(
              is_deleted,
              0
            ) = 0

            AND
            ${PROFESSIONAL_MEMBER_CONDITION}

          LIMIT 1
        `,
        [
          normalizedLoginId,
        ],
        executor
      );

    return (
      rows?.[0] ||
      null
    );
  };

/* =========================================================
   FIND MEMBER BY ID
========================================================= */

const findProfessionalMemberById =
  async (
    memberId,
    executor = null
  ) => {
    const normalizedMemberId =
      Number(
        memberId
      );

    if (
      !Number.isInteger(
        normalizedMemberId
      ) ||
      normalizedMemberId <=
        0
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
            COALESCE(
              is_deleted,
              0
            ) = 0

            AND
            ${PROFESSIONAL_MEMBER_CONDITION}

          LIMIT 1
        `,
        [
          normalizedMemberId,
        ],
        executor
      );

    return (
      rows?.[0] ||
      null
    );
  };

/* =========================================================
   LOGIN ID EXISTS
========================================================= */

const loginIdExists =
  async (
    loginId,
    executor = null
  ) => {
    const rows =
      await runQuery(
        `
          SELECT
            id

          FROM
            kyc_members

          WHERE
            login_id = ?

          LIMIT 1
        `,
        [
          toText(
            loginId
          ),
        ],
        executor
      );

    return Boolean(
      rows?.[0]
    );
  };

/* =========================================================
   GENERATE UNIQUE LOGIN ID

   7-digit numeric ID.
========================================================= */

/* =========================================================
   GENERATE UNIQUE PROFESSIONAL LOGIN ID

   FORMAT:
   PRO + 7 DIGITS

   Example:
   PRO1096784
========================================================= */

const generateUniqueLoginId =
  async (
    executor = null
  ) => {
    const minimum =
      1000000;

    const maximum =
      9999999;

    for (
      let attempt = 0;
      attempt < 100;
      attempt += 1
    ) {
const digits =
  String(
    Math.floor(
      Math.random() *
        (
          maximum -
          minimum +
          1
        )
    ) +
      minimum
  );

const candidate =
  `PRO${digits}`;

      const exists =
        await loginIdExists(
          candidate,
          executor
        );

      if (!exists) {
        return candidate;
      }
    }

    throw new Error(
      "Unable to generate a unique Professional Login ID."
    );
  };
/* =========================================================
   FIND REFERRAL MEMBER

   Referral ID OR Login ID accepted.
========================================================= */

const findReferralMember =
  async (
    referralValue,
    executor = null
  ) => {
    const referral =
      toText(
        referralValue
      );

    if (!referral) {
      return null;
    }

    const rows =
      await runQuery(
        `
          SELECT
            id,
            login_id,
            referral_id,
            referred_by,
            first_name,
            last_name,
            email,
            direct_network,
            indirect_network

          FROM
            kyc_members

          WHERE
            COALESCE(
              is_deleted,
              0
            ) = 0

            AND
            (
              referral_id = ?

              OR

              login_id = ?
            )

          LIMIT 1
        `,
        [
          referral,
          referral,
        ],
        executor
      );

    return (
      rows?.[0] ||
      null
    );
  };

/* =========================================================
   CREATE PROFESSIONAL MEMBER
========================================================= */

const createProfessionalMember =
  async (
    {
      firstName,
      lastName,
      dob,
      email,
      phone,
      passwordHash,
      loginId,
      token,
      profilePic = null,
      referredBy = null,
    },
    executor = null
  ) => {
    const result =
      await runQuery(
        `
          INSERT INTO
            kyc_members
            (
              first_name,
              last_name,
              dob,
              email,
              phone,

              membership_type,

              referred_by,

              token,
              login_id,
              password,

              profile_pic,

              payment_status,

              created_at
            )

          VALUES
            (
              ?,
              ?,
              ?,
              ?,
              ?,

              'Professional Member',

              ?,

              ?,
              ?,
              ?,

              ?,

              'pending',

              NOW()
            )
        `,
        [
          toText(
            firstName
          ),

          toText(
            lastName
          ),

          toText(
            dob
          ),

          normalizeEmail(
            email
          ),

          normalizePhone(
            phone
          ),

          referredBy
            ? toText(
                referredBy
              )
            : null,

          toText(
            token
          ),

          toText(
            loginId
          ),

          toText(
            passwordHash
          ),

          profilePic
            ? toText(
                profilePic
              )
            : null,
        ],
        executor
      );

    return {
      id:
        result?.insertId ||
        null,

      affectedRows:
        result?.affectedRows ||
        0,
    };
  };

/* =========================================================
   INCREMENT DIRECT NETWORK
========================================================= */

const incrementDirectNetwork =
  async (
    sponsorId,
    executor = null
  ) => {
    const memberId =
      Number(
        sponsorId
      );

    if (
      !Number.isInteger(
        memberId
      ) ||
      memberId <= 0
    ) {
      return 0;
    }

    const result =
      await runQuery(
        `
          UPDATE
            kyc_members

          SET
            direct_network =
              COALESCE(
                direct_network,
                0
              ) + 1

          WHERE
            id = ?

            AND
            COALESCE(
              is_deleted,
              0
            ) = 0
        `,
        [
          memberId,
        ],
        executor
      );

    return (
      result?.affectedRows ||
      0
    );
  };

/* =========================================================
   INCREMENT INDIRECT NETWORK
========================================================= */

const incrementIndirectNetwork =
  async (
    sponsorId,
    executor = null
  ) => {
    const memberId =
      Number(
        sponsorId
      );

    if (
      !Number.isInteger(
        memberId
      ) ||
      memberId <= 0
    ) {
      return 0;
    }

    const result =
      await runQuery(
        `
          UPDATE
            kyc_members

          SET
            indirect_network =
              COALESCE(
                indirect_network,
                0
              ) + 1

          WHERE
            id = ?

            AND
            COALESCE(
              is_deleted,
              0
            ) = 0
        `,
        [
          memberId,
        ],
        executor
      );

    return (
      result?.affectedRows ||
      0
    );
  };

/* =========================================================
   COUNT ACCOUNTS

   Compatibility export.
========================================================= */

const countAccountsByEmailAndPhone =
  async (
    {
      email,
      phone,
    },
    executor = null
  ) => {
    const rows =
      await runQuery(
        `
          SELECT
            COUNT(*) AS total

          FROM
            kyc_members

          WHERE
            LOWER(
              TRIM(
                COALESCE(
                  email,
                  ''
                )
              )
            ) = ?

            AND
            TRIM(
              COALESCE(
                phone,
                ''
              )
            ) = ?

            AND
            COALESCE(
              is_deleted,
              0
            ) = 0
        `,
        [
          normalizeEmail(
            email
          ),

          normalizePhone(
            phone
          ),
        ],
        executor
      );

    return Number(
      rows?.[0]?.total ||
        0
    );
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getProfessionalRegistrationPool,

  getDatabaseExecutor,

  runQuery,

  getTransactionConnection,

  findExistingProfessionalAccount,

  findProfessionalMemberByLoginId,

  findProfessionalMemberById,

  loginIdExists,

  generateUniqueLoginId,

  findReferralMember,

  createProfessionalMember,

  incrementDirectNetwork,

  incrementIndirectNetwork,

  countAccountsByEmailAndPhone,

  PROFESSIONAL_MEMBER_CONDITION,
};