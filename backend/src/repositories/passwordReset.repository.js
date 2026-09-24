const {
  executeQuery,
} = require(
  "./auth.repository"
);

const normalizeEmail =
  (
    email
  ) => {
    return String(
      email ?? ""
    )
      .trim()
      .toLowerCase();
  };

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

/*
  Email மூலம் member find.

  Existing Flask:
  SELECT id
  FROM kyc_members
  WHERE email=%s
*/
const findMemberByEmail =
  async (
    email,
    options = {}
  ) => {
    const normalizedEmail =
      normalizeEmail(
        email
      );

    if (
      !normalizedEmail
    ) {
      return null;
    }

    const {
      includeDeleted =
        false,

      connection =
        null,
    } = options;

    const deletedCondition =
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
            LOWER(
              TRIM(email)
            ) = ?
            ${deletedCondition}
          ORDER BY
            id ASC
          LIMIT 1
        `,
        [
          normalizedEmail,
        ],
        connection
      );

    return (
      Array.isArray(
        rows
      )
        ? rows[0] ||
          null
        : null
    );
  };

/*
  OTP verify செய்ய தேவையான
  fields மட்டும் fetch செய்கிறது.
*/
const findOtpRecordByEmail =
  async (
    email,
    connection =
      null
  ) => {
    const normalizedEmail =
      normalizeEmail(
        email
      );

    if (
      !normalizedEmail
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            id,
            email,
            otp,
            otp_expires,
            is_deleted
          FROM
            kyc_members
          WHERE
            LOWER(
              TRIM(email)
            ) = ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0
          ORDER BY
            id ASC
          LIMIT 1
        `,
        [
          normalizedEmail,
        ],
        connection
      );

    return (
      Array.isArray(
        rows
      )
        ? rows[0] ||
          null
        : null
    );
  };

/*
  Existing Flask:

  UPDATE kyc_members
  SET otp=?,
      otp_expires=?
  WHERE id=?
*/
const savePasswordResetOtp =
  async ({
    memberId,
    otp,
    expiresAt,
    connection =
      null,
  }) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      throw new Error(
        "Valid member ID is required."
      );
    }

    const normalizedOtp =
      String(
        otp ?? ""
      ).trim();

    if (
      !/^\d{6}$/.test(
        normalizedOtp
      )
    ) {
      throw new Error(
        "Valid six-digit OTP is required."
      );
    }

    if (
      !expiresAt
    ) {
      throw new Error(
        "OTP expiry time is required."
      );
    }

    const result =
      await executeQuery(
        `
          UPDATE
            kyc_members
          SET
            otp = ?,
            otp_expires = ?
          WHERE
            id = ?
          LIMIT 1
        `,
        [
          normalizedOtp,
          expiresAt,
          normalizedMemberId,
        ],
        connection
      );

    return result;
  };

/*
  Password reset success:

  password update
  otp clear
  otp_expires clear
*/
const updatePasswordAndClearOtp =
  async ({
    email,
    passwordHash,
    connection =
      null,
  }) => {
    const normalizedEmail =
      normalizeEmail(
        email
      );

    if (
      !normalizedEmail
    ) {
      throw new Error(
        "Email is required."
      );
    }

    if (
      !/^[a-f0-9]{64}$/i.test(
        String(
          passwordHash ??
          ""
        )
      )
    ) {
      throw new Error(
        "Valid SHA-256 password hash is required."
      );
    }

    const result =
      await executeQuery(
        `
          UPDATE
            kyc_members
          SET
            password = ?,
            otp = NULL,
            otp_expires = NULL
          WHERE
            LOWER(
              TRIM(email)
            ) = ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0
        `,
        [
          passwordHash,
          normalizedEmail,
        ],
        connection
      );

    return result;
  };

const clearPasswordResetOtp =
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
          otp = NULL,
          otp_expires = NULL
        WHERE
          id = ?
        LIMIT 1
      `,
      [
        normalizedMemberId,
      ],
      connection
    );
  };

const toSafePasswordResetMember =
  (
    member
  ) => {
    if (!member) {
      return null;
    }

    return {
      id:
        member.id,

      first_name:
        member.first_name ||
        "",

      last_name:
        member.last_name ||
        "",

      email:
        member.email ||
        "",

      login_id:
        member.login_id ||
        "",
    };
  };

module.exports = {
  normalizeEmail,
  normalizeMemberId,

  findMemberByEmail,
  findOtpRecordByEmail,

  savePasswordResetOtp,
  updatePasswordAndClearOtp,
  clearPasswordResetOtp,

  toSafePasswordResetMember,
};