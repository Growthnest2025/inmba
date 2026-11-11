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
    const normalizedToken =
      String(
        token ||
          ""
      ).trim();

    return (
      normalizedToken ||
      null
    );
  };

/* =========================
   QR MEMBER SELECT
========================= */

const QR_MEMBER_SELECT =
  `
    SELECT
      id,
      first_name,
      last_name,
      email,
      phone,
      login_id,
      token,
      profile_pic,
      membership_type,
      payment_status,
      created_at,
      is_deleted
    FROM
      kyc_members
  `;

/* =========================
   FIND MEMBER BY ID
========================= */

const findQrMemberById =
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
          ${QR_MEMBER_SELECT}

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
   FIND MEMBER BY TOKEN
========================= */

const findQrMemberByToken =
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
          ${QR_MEMBER_SELECT}

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
   SAFE QR MEMBER
========================= */

const toSafeQrMember =
  (
    member
  ) => {
    if (
      !member
    ) {
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

      profile_pic:
        member.profile_pic ||
        null,

      membership_type:
        member.membership_type ||
        "",

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
  QR_MEMBER_SELECT,
  findQrMemberById,
  findQrMemberByToken,
  toSafeQrMember,
};