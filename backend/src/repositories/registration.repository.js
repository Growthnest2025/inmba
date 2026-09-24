const {
  pool,
} = require(
  "../database/connection"
);

/*
  Existing Flask public member registration
  insert செய்த exact columns.
*/
const MEMBER_INSERT_COLUMNS =
  Object.freeze([
    "first_name",
    "last_name",
    "father_name",
    "dob",
    "email",
    "phone",
    "pincode",
    "gender",
    "marital_status",
    "nationality",
    "occupation",
    "education",
    "membership_type",
    "referred_by",
    "aadhar",
    "token",
    "login_id",
    "password",
    "profile_pic",
    "created_at",
  ]);

/*
  Existing Flask student registration
  insert செய்த exact columns.
*/
const STUDENT_INSERT_COLUMNS =
  Object.freeze([
    "first_name",
    "last_name",
    "dob",
    "email",
    "phone",
    "gender",

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

    "skills",
    "student_id",

    "membership_type",

    "token",
    "login_id",
    "password",

    "payment_status",
    "created_at",

    "marksheet",
    "bonafide",
    "govt_id",
  ]);

/*
  Repository method-க்கு connection
  கொடுக்கவில்லை என்றால் main pool use ஆகும்.
*/
const resolveConnection =
  (connection) => {
    return connection || pool;
  };

/*
  Fixed column list-ஐ வைத்து safe INSERT
  SQL உருவாக்கும்.

  created_at column-க்கு மட்டும் NOW().
*/
const buildInsertStatement =
  (
    tableName,
    columns
  ) => {
    const columnSql =
      columns
        .map(
          (column) =>
            `\`${column}\``
        )
        .join(", ");

    const placeholderSql =
      columns
        .map(
          (column) => {
            if (
              column ===
              "created_at"
            ) {
              return "NOW()";
            }

            return "?";
          }
        )
        .join(", ");

    return `
      INSERT INTO \`${tableName}\` (
        ${columnSql}
      )
      VALUES (
        ${placeholderSql}
      )
    `;
  };

const MEMBER_INSERT_SQL =
  buildInsertStatement(
    "kyc_members",
    MEMBER_INSERT_COLUMNS
  );

const STUDENT_INSERT_SQL =
  buildInsertStatement(
    "kyc_members",
    STUDENT_INSERT_COLUMNS
  );

/*
  Same email + phone combination-ல்
  எத்தனை accounts இருக்கிறது என்பதை
  Flask போல exact comparison செய்கிறது.

  Email அல்லது phone இல்லையென்றால்
  Flask இந்த check-ஐ skip செய்தது.
*/
const countAccountsByEmailAndPhone =
  async (
    {
      email,
      phone,
    },
    connection
  ) => {
    if (!email || !phone) {
      return 0;
    }

    const database =
      resolveConnection(
        connection
      );

    const [rows] =
      await database.query(
        `
          SELECT
            COUNT(*) AS total
          FROM
            kyc_members
          WHERE
            email = ?
            AND phone = ?
        `,
        [
          email,
          phone,
        ]
      );

    return Number(
      rows[0]
        ?.total ||
      0
    );
  };

const countCivilianAccountsByPhone =
  async (phone, connection) => {
    const normalizedPhone =
      String(phone || "").trim();

    if (!normalizedPhone) {
      return 0;
    }

    const database =
      resolveConnection(connection);

    const [rows] = await database.query(
      `
        SELECT COUNT(*) AS total
        FROM kyc_members
        WHERE phone = ?
          AND membership_type = 'Civilian Member'
      `,
      [normalizedPhone]
    );

    return Number(rows[0]?.total || 0);
  };

/*
  Aadhaar already registered-ஆ
  இருக்கிறதா check.

  Existing Flask behavior போல
  deleted status filter சேர்க்கவில்லை.
*/
const findMemberByAadhar =
  async (
    aadhar,
    connection
  ) => {
    const normalizedAadhar =
      String(
        aadhar || ""
      ).trim();

    if (
      !normalizedAadhar
    ) {
      return null;
    }

    const database =
      resolveConnection(
        connection
      );

    const [rows] =
      await database.query(
        `
          SELECT
            id,
            login_id
          FROM
            kyc_members
          WHERE
            aadhar = ?
          LIMIT 1
        `,
        [
          normalizedAadhar,
        ]
      );

    return rows[0] ||
      null;
  };

/*
  Referral code owner-ஐ load செய்யும்.

  referred_by field grand-referrer
  update-க்கு தேவை.
*/
const findReferrerByReferralId =
  async (
    referralId,
    connection
  ) => {
    const normalizedReferralId =
      String(
        referralId || ""
      )
        .trim()
        .toUpperCase();

    if (
      !normalizedReferralId
    ) {
      return null;
    }

    const database =
      resolveConnection(
        connection
      );

    const [rows] =
      await database.query(
        `
          SELECT
            id,
            first_name,
            last_name,
            login_id,
            profile_pic,
            referral_id,
            referred_by,
            direct_network,
            indirect_network
          FROM
            kyc_members
          WHERE
            referral_id = ?
          LIMIT 1
        `,
        [
          normalizedReferralId,
        ]
      );

    return rows[0] ||
      null;
  };
const findRegistrationSummaryById =
  async (
    memberId,
    connection
  ) => {
    const database =
      resolveConnection(
        connection
      );

    const [rows] =
      await database.query(
        `
          SELECT
            id,
            first_name,
            last_name,
            email,
            phone,
            membership_type,
            referred_by,
            referral_id,
            login_id,
            profile_pic,
            token,
            payment_status,
            direct_network,
            indirect_network,
            created_at
          FROM
            kyc_members
          WHERE
            id = ?
          LIMIT 1
        `,
        [
          memberId,
        ]
      );

    return rows[0] ||
      null;
  };

const findRegistrationSummaryByLoginId =
  async (
    loginId,
    connection
  ) => {
    const normalizedLoginId =
      String(
        loginId || ""
      ).trim();

    if (
      !normalizedLoginId
    ) {
      return null;
    }

    const database =
      resolveConnection(
        connection
      );

    const [rows] =
      await database.query(
        `
          SELECT
            id,
            first_name,
            last_name,
            email,
            phone,
            membership_type,
            referred_by,
            referral_id,
            login_id,
            token,
            payment_status,
            direct_network,
            indirect_network,
            created_at
          FROM
            kyc_members
          WHERE
            login_id = ?
          LIMIT 1
        `,
        [
          normalizedLoginId,
        ]
      );

    return rows[0] ||
      null;
  };

/*
  Normal member registration insert.

  passwordHash என்பது Step 7A
  SHA-256 hash.
*/
const insertMemberRegistration =
  async (
    {
      first_name = null,
      last_name = null,
      father_name = null,
      dob = null,
      email = null,
      phone = null,
      pincode = null,
      gender = null,
      marital_status = null,
      nationality = null,
      occupation = null,
      education = null,
      membership_type = null,
      referred_by = null,
      aadhar = null,
      token,
      login_id,
      passwordHash,
      profile_pic = null,
    },
    connection
  ) => {
    const database =
      resolveConnection(
        connection
      );

    const values = [
      first_name,
      last_name,
      father_name,
      dob,
      email,
      phone,
      pincode,
      gender,
      marital_status,
      nationality,
      occupation,
      education,
      membership_type,
      referred_by,
      aadhar,
      token,
      login_id,
      passwordHash,
      profile_pic,
    ];

    const [result] =
      await database.query(
        MEMBER_INSERT_SQL,
        values
      );

    return {
      insertId:
        Number(
          result.insertId
        ),

      affectedRows:
        Number(
          result.affectedRows
        ),
    };
  };

/*
  Student registration insert.

  Existing Flask code student referral-ஐ
  insert செய்யவில்லை. அதனால் இந்த SQL-லும்
  referred_by இல்லை.
*/
const insertStudentRegistration =
  async (
    {
      first_name = null,
      last_name = null,
      dob = null,
      email = null,
      phone = null,
      gender = null,

      education_level = null,

      school_name = null,
      school_class = null,
      board = null,
      school_city = null,

      ug_college = null,
      ug_degree = null,
      ug_department = null,
      ug_year = null,

      pg_college = null,
      pg_degree = null,
      pg_specialization = null,
      pg_semester = null,

      skills = null,
      student_id = null,

      membership_type =
        "Student Member",

      token,
      login_id,
      passwordHash,

      payment_status =
        "pending",

      marksheet = null,
      bonafide = null,
      govt_id = null,
    },
    connection
  ) => {
    const database =
      resolveConnection(
        connection
      );

    const values = [
      first_name,
      last_name,
      dob,
      email,
      phone,
      gender,

      education_level,

      school_name,
      school_class,
      board,
      school_city,

      ug_college,
      ug_degree,
      ug_department,
      ug_year,

      pg_college,
      pg_degree,
      pg_specialization,
      pg_semester,

      skills,
      student_id,

      membership_type,

      token,
      login_id,
      passwordHash,

      payment_status,

      marksheet,
      bonafide,
      govt_id,
    ];

    const [result] =
      await database.query(
        STUDENT_INSERT_SQL,
        values
      );

    return {
      insertId:
        Number(
          result.insertId
        ),

      affectedRows:
        Number(
          result.affectedRows
        ),
    };
  };

/*
  Referral owner direct_network +1.
*/
const incrementDirectNetwork =
  async (
    memberId,
    connection
  ) => {
    const database =
      resolveConnection(
        connection
      );

    const [result] =
      await database.query(
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
        `,
        [
          memberId,
        ]
      );

    return Number(
      result.affectedRows
    );
  };

/*
  Grand-referrer indirect_network +1.
*/
const incrementIndirectNetwork =
  async (
    memberId,
    connection
  ) => {
    const database =
      resolveConnection(
        connection
      );

    const [result] =
      await database.query(
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
        `,
        [
          memberId,
        ]
      );

    return Number(
      result.affectedRows
    );
  };

/*
  Existing Flask referral network logic:

  New member referred_by
          ↓
  Referral owner direct_network +1
          ↓
  Referral owner-க்கு referred_by இருந்தால்
          ↓
  Grand-referrer indirect_network +1

  Invalid/non-existing referral code இருந்தால்
  member insert fail ஆகாது. Network update
  மட்டும் நடக்காது.
*/
const applyReferralNetworkUpdates =
  async (
    referredBy,
    connection
  ) => {
    const normalizedReferralId =
      String(
        referredBy || ""
      )
        .trim()
        .toUpperCase();

    if (
      !normalizedReferralId
    ) {
      return {
        referralProvided:
          false,

        referrerFound:
          false,

        directNetworkUpdated:
          false,

        grandReferrerFound:
          false,

        indirectNetworkUpdated:
          false,
      };
    }

    const referrer =
      await findReferrerByReferralId(
        normalizedReferralId,
        connection
      );

    if (!referrer) {
      return {
        referralProvided:
          true,

        referrerFound:
          false,

        directNetworkUpdated:
          false,

        grandReferrerFound:
          false,

        indirectNetworkUpdated:
          false,
      };
    }

    const directAffectedRows =
      await incrementDirectNetwork(
        referrer.id,
        connection
      );

    let grandReferrer =
      null;

    let indirectAffectedRows =
      0;

    if (
      referrer.referred_by
    ) {
      grandReferrer =
        await findReferrerByReferralId(
          referrer.referred_by,
          connection
        );

      if (
        grandReferrer
      ) {
        indirectAffectedRows =
          await incrementIndirectNetwork(
            grandReferrer.id,
            connection
          );
      }
    }

    return {
      referralProvided:
        true,

      referrerFound:
        true,

      referrerId:
        referrer.id,

      directNetworkUpdated:
        directAffectedRows > 0,

      grandReferrerFound:
        Boolean(
          grandReferrer
        ),

      grandReferrerId:
        grandReferrer
          ?.id ||
        null,

      indirectNetworkUpdated:
        indirectAffectedRows > 0,
    };
  };

/*
  Registration transaction wrapper.

  Service callback success:
    COMMIT

  Error:
    ROLLBACK
*/
const withRegistrationTransaction =
  async (
    transactionCallback
  ) => {
    if (
      typeof transactionCallback !==
      "function"
    ) {
      throw new TypeError(
        "Registration transaction requires a callback function."
      );
    }

    const connection =
      await pool.getConnection();

    try {
      await connection
        .beginTransaction();

      const result =
        await transactionCallback(
          connection
        );

      await connection
        .commit();

      return result;
    } catch (error) {
      try {
        await connection
          .rollback();
      } catch (
        rollbackError
      ) {
        console.error(
          "Registration rollback failed:",
          rollbackError.message
        );
      }

      throw error;
    } finally {
      connection.release();
    }
  };

module.exports = {
  MEMBER_INSERT_COLUMNS,
  STUDENT_INSERT_COLUMNS,

  countAccountsByEmailAndPhone,
  countCivilianAccountsByPhone,

  findMemberByAadhar,
  findReferrerByReferralId,

  findRegistrationSummaryById,
  findRegistrationSummaryByLoginId,

  insertMemberRegistration,
  insertStudentRegistration,

  incrementDirectNetwork,
  incrementIndirectNetwork,
  applyReferralNetworkUpdates,

  withRegistrationTransaction,
};
