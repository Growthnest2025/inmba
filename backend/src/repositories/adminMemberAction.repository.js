const {
  executeQuery,
} = require(
  "./auth.repository"
);

/* =========================
   MEMBER ID
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
   EDITABLE FIELDS
========================= */

const ADMIN_EDITABLE_FIELDS =
  new Set([
    "first_name",
    "last_name",
    "father_name",
    "dob",
    "gender",
    "marital_status",
    "nationality",
    "email",
    "phone",
    "whatsapp_number",
    "contact_number",

    "city",
    "district",
    "state",
    "pincode",

    "entity_house_no",
    "entity_street",
    "entity_area",
    "entity_city",
    "entity_district",
    "entity_state",
    "entity_pincode",

    "education",
    "educational_qualification",
    "occupation",
    "membership_type",

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
    "social_link",

    "nomini_name",
    "nomini_dob",
    "nomini_relationship",
    "nomini_aadhar",

    "witness_name",
    "witness_phone",
    "witness_inmba_id",

    "payment_method",
    "transaction_id",
    "amount",
    "subscription_year",

    "account_holder",
    "bank_name",
    "account_number",
    "ifsc",

    "pan_number",
    "pan_name",
    "entity_aadhar_number",

    "referral_id",
    "payment_status",
  ]);

/* =========================
   FIND MEMBER
========================= */

const findActionMemberById =
  async (
    memberId,
    includeDeleted =
      false,
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

    const deletionCondition =
      includeDeleted
        ? ""
        : `
          AND COALESCE(
            is_deleted,
            0
          ) = 0
        `;

    const rows =
      await executeQuery(
        `
          SELECT
            *
          FROM
            kyc_members
          WHERE
            id = ?

            ${deletionCondition}

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
   REFERRAL LOOKUP
========================= */

const findMemberByReferralId =
  async (
    referralId,
    connection =
      null
  ) => {
    const normalizedReferralId =
      String(
        referralId ||
          ""
      ).trim();

    if (
      !normalizedReferralId
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            id,
            login_id,
            referral_id
          FROM
            kyc_members
          WHERE
            referral_id = ?
          LIMIT 1
        `,
        [
          normalizedReferralId,
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
   UPDATE STATUS
========================= */

const updateMemberStatusById =
  async (
    memberId,
    status,
    referralId,
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

    return executeQuery(
      `
        UPDATE
          kyc_members
        SET
          payment_status = ?,
          referral_id = ?
        WHERE
          id = ?
          AND COALESCE(
            is_deleted,
            0
          ) = 0
      `,
      [
        status,
        referralId ||
          null,
        normalizedMemberId,
      ],
      connection
    );
  };

/* =========================
   UPDATE MEMBER FIELDS
========================= */

const updateMemberFieldsById =
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
      return null;
    }

    const entries =
      Object.entries(
        updateData ||
          {}
      ).filter(
        (
          [
            fieldName,
          ]
        ) =>
          ADMIN_EDITABLE_FIELDS
            .has(
              fieldName
            )
      );

    if (
      entries.length ===
      0
    ) {
      return null;
    }

    const setClause =
      entries
        .map(
          (
            [
              fieldName,
            ]
          ) =>
            `\`${fieldName}\` = ?`
        )
        .join(", ");

    const values =
      entries.map(
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

    return executeQuery(
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
  };

/* =========================
   SOFT DELETE
========================= */

const softDeleteMemberById =
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

    return executeQuery(
      `
        UPDATE
          kyc_members
        SET
          is_deleted = 1
        WHERE
          id = ?
          AND COALESCE(
            is_deleted,
            0
          ) = 0
      `,
      [
        normalizedMemberId,
      ],
      connection
    );
  };

/* =========================
   RESTORE MEMBER
========================= */

const restoreMemberById =
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

    return executeQuery(
      `
        UPDATE
          kyc_members
        SET
          is_deleted = 0
        WHERE
          id = ?
          AND COALESCE(
            is_deleted,
            0
          ) = 1
      `,
      [
        normalizedMemberId,
      ],
      connection
    );
  };

/* =========================
   DELETED MEMBERS
========================= */

const findDeletedMembers =
  async (
    page =
      1,
    limit =
      25,
    connection =
      null
  ) => {
    const offset =
      (
        page -
        1
      ) *
      limit;

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
            membership_type,
            payment_status,
            referral_id,
            referred_by,
            profile_pic,
            created_at,
            is_deleted
          FROM
            kyc_members
          WHERE
            COALESCE(
              is_deleted,
              0
            ) = 1
          ORDER BY
            id DESC
          LIMIT ?
          OFFSET ?
        `,
        [
          limit,
          offset,
        ],
        connection
      );

    return Array.isArray(
      rows
    )
      ? rows
      : [];
  };

const countDeletedMembers =
  async (
    connection =
      null
  ) => {
    const rows =
      await executeQuery(
        `
          SELECT
            COUNT(*) AS total
          FROM
            kyc_members
          WHERE
            COALESCE(
              is_deleted,
              0
            ) = 1
        `,
        [],
        connection
      );

    return Number(
      rows?.[0]?.total ||
        0
    );
  };

/* =========================
   BACKUP TABLE
========================= */

const ensureDeletedBackupTable =
  async (
    connection =
      null
  ) => {
    return executeQuery(
      `
        CREATE TABLE IF NOT EXISTS
          deleted_users_backup
        (
          backup_id INT
            AUTO_INCREMENT
            PRIMARY KEY,

          original_id INT,

          first_name
            VARCHAR(120),

          last_name
            VARCHAR(120),

          email
            VARCHAR(255),

          phone
            VARCHAR(30),

          backup_data
            LONGTEXT,

          backed_up_at
            TIMESTAMP
            DEFAULT
            CURRENT_TIMESTAMP
        )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb4
      `,
      [],
      connection
    );
  };

/* =========================
   INSERT BACKUP
========================= */

const insertDeletedMemberBackup =
  async (
    member,
    backupData,
    connection =
      null
  ) => {
    return executeQuery(
      `
        INSERT INTO
          deleted_users_backup
        (
          original_id,
          first_name,
          last_name,
          email,
          phone,
          backup_data
        )
        VALUES
        (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )
      `,
      [
        member.id,
        member.first_name ||
          null,
        member.last_name ||
          null,
        member.email ||
          null,
        member.phone ||
          null,
        backupData,
      ],
      connection
    );
  };

/* =========================
   PERMANENT DELETE
========================= */

const permanentlyDeleteMemberById =
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

    return executeQuery(
      `
        DELETE FROM
          kyc_members
        WHERE
          id = ?
      `,
      [
        normalizedMemberId,
      ],
      connection
    );
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  normalizeMemberId,
  ADMIN_EDITABLE_FIELDS,
  findActionMemberById,
  findMemberByReferralId,
  updateMemberStatusById,
  updateMemberFieldsById,
  softDeleteMemberById,
  restoreMemberById,
  findDeletedMembers,
  countDeletedMembers,
  ensureDeletedBackupTable,
  insertDeletedMemberBackup,
  permanentlyDeleteMemberById,
};