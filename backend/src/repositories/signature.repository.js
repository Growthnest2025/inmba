const {
  executeQuery,
} = require(
  "./auth.repository"
);

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
   NORMALIZE TOKEN
========================= */

const normalizeToken =
  (
    token
  ) => {
    const normalized =
      String(
        token ||
          ""
      ).trim();

    return normalized ||
      null;
  };

/* =========================
   SELECT MEMBER
========================= */

const SIGNATURE_MEMBER_SELECT =
  `
    SELECT
      id,
      first_name,
      last_name,
      email,
      phone,
      login_id,
      token,
      signature_image,
      payment_status,
      created_at,
      is_deleted
    FROM
      kyc_members
  `;

/* =========================
   FIND BY MEMBER ID
========================= */

const findSignatureMemberById =
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
          ${SIGNATURE_MEMBER_SELECT}
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
   FIND BY TOKEN
========================= */

const findSignatureMemberByToken =
  async (
    token,
    connection =
      null
  ) => {
    const normalizedToken =
      normalizeToken(
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
          ${SIGNATURE_MEMBER_SELECT}
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
   UPDATE SIGNATURE
========================= */

const updateSignatureImageById =
  async (
    memberId,
    filename,
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
          signature_image = ?
        WHERE
          id = ?
          AND COALESCE(
            is_deleted,
            0
          ) = 0
      `,
      [
        filename,
        normalizedMemberId,
      ],
      connection
    );
  };

/* =========================
   SAFE MEMBER
========================= */

const toSafeSignatureMember =
  (
    member
  ) => {
    if (!member) {
      return null;
    }

    const firstName =
      member.first_name ||
      "";

    const lastName =
      member.last_name ||
      "";

    return {
      id:
        member.id,

      login_id:
        member.login_id ||
        "",

      token:
        member.token ||
        "",

      first_name:
        firstName,

      last_name:
        lastName,

      full_name:
        [
          firstName,
          lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),

      email:
        member.email ||
        "",

      phone:
        member.phone ||
        "",

      signature_image:
        member.signature_image ||
        null,

      payment_status:
        member.payment_status ||
        "pending",

      created_at:
        member.created_at ||
        null,
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  normalizeMemberId,
  normalizeToken,
  SIGNATURE_MEMBER_SELECT,
  findSignatureMemberById,
  findSignatureMemberByToken,
  updateSignatureImageById,
  toSafeSignatureMember,
};