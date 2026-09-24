const {
  executeQuery,
} = require(
  "./auth.repository"
);

/* =========================
   REQUIRED COLUMNS
========================= */

const PROFILE_COMPLETION_COLUMNS =
  Object.freeze({
    profile_pic:
      "VARCHAR(500) NULL",

    contact_number:
      "VARCHAR(30) NULL",

    whatsapp_number:
      "VARCHAR(30) NULL",

    nomini_name:
      "VARCHAR(255) NULL",

    nomini_dob:
      "DATE NULL",

    nomini_relationship:
      "VARCHAR(150) NULL",

    nomini_aadhar:
      "VARCHAR(20) NULL",

    witness_name:
      "VARCHAR(255) NULL",

    witness_phone:
      "VARCHAR(30) NULL",

    witness_inmba_id:
      "VARCHAR(100) NULL",

    social_link:
      "TEXT NULL",

    educational_qualification:
      "VARCHAR(500) NULL",
  });

/* =========================
   TOKEN NORMALIZATION
========================= */

const normalizeProfileToken =
  (
    token
  ) => {
    const normalizedToken =
      String(
        token ||
          ""
      ).trim();

    if (
      !normalizedToken ||
      normalizedToken.length >
        255
    ) {
      return null;
    }

    return normalizedToken;
  };

/* =========================
   TABLE COLUMNS
========================= */

const getMemberTableColumns =
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
        .filter(Boolean)
    );
  };

/* =========================
   ENSURE COLUMNS
========================= */

const ensureProfileCompletionColumns =
  async (
    connection =
      null
  ) => {
    const existingColumns =
      await getMemberTableColumns(
        connection
      );

    const additions =
      Object.entries(
        PROFILE_COMPLETION_COLUMNS
      )
        .filter(
          (
            [
              columnName,
            ]
          ) =>
            !existingColumns.has(
              columnName
            )
        )
        .map(
          (
            [
              columnName,
              columnDefinition,
            ]
          ) =>
            `ADD COLUMN \`${columnName}\` ${columnDefinition}`
        );

    if (
      additions.length >
      0
    ) {
      try {
        await executeQuery(
          `
            ALTER TABLE
              kyc_members
            ${additions.join(
              ", "
            )}
          `,
          [],
          connection
        );
      } catch (error) {
        /*
          Another request may have
          added the same column.
        */

        if (
          error?.code !==
          "ER_DUP_FIELDNAME"
        ) {
          throw error;
        }
      }
    }

    return getMemberTableColumns(
      connection
    );
  };

/* =========================
   FIND MEMBER BY TOKEN
========================= */

const findProfileCompletionMemberByToken =
  async (
    token,
    connection =
      null
  ) => {
    const normalizedToken =
      normalizeProfileToken(
        token
      );

    if (
      !normalizedToken
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            id,
            first_name,
            last_name,
            email,
            phone,
            login_id,
            token,
            membership_type,

            profile_pic,
            contact_number,
            whatsapp_number,

            nomini_name,
            nomini_dob,
            nomini_relationship,
            nomini_aadhar,

            witness_name,
            witness_phone,
            witness_inmba_id,

            social_link,
            educational_qualification,

            payment_status,
            created_at,
            is_deleted

          FROM
            kyc_members

          WHERE
            token = ?

            AND COALESCE(
              is_deleted,
              0
            ) = 0

          LIMIT 1
        `,
        [
          normalizedToken,
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
   UPDATE PROFILE COMPLETION
========================= */

const updateProfileCompletionByToken =
  async (
    token,
    completionData,
    connection =
      null
  ) => {
    const normalizedToken =
      normalizeProfileToken(
        token
      );

    if (
      !normalizedToken
    ) {
      return null;
    }

    return executeQuery(
      `
        UPDATE
          kyc_members

        SET
          profile_pic = ?,
          contact_number = ?,
          whatsapp_number = ?,

          nomini_name = ?,
          nomini_dob = ?,
          nomini_relationship = ?,
          nomini_aadhar = ?,

          witness_name = ?,
          witness_phone = ?,
          witness_inmba_id = ?,

          social_link = ?,
          educational_qualification = ?,

          payment_status = 'pending'

        WHERE
          token = ?

          AND COALESCE(
            is_deleted,
            0
          ) = 0
      `,
      [
        completionData
          .profile_pic ||
          null,

        completionData
          .contact_number ||
          null,

        completionData
          .whatsapp_number ||
          null,

        completionData
          .nomini_name ||
          null,

        completionData
          .nomini_dob ||
          null,

        completionData
          .nomini_relationship ||
          null,

        completionData
          .nomini_aadhar ||
          null,

        completionData
          .witness_name ||
          null,

        completionData
          .witness_phone ||
          null,

        completionData
          .witness_inmba_id ||
          null,

        completionData
          .social_link ||
          null,

        completionData
          .educational_qualification ||
          null,

        normalizedToken,
      ],
      connection
    );
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  PROFILE_COMPLETION_COLUMNS,
  normalizeProfileToken,
  getMemberTableColumns,
  ensureProfileCompletionColumns,
  findProfileCompletionMemberByToken,
  updateProfileCompletionByToken,
};