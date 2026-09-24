const {
  executeQuery,
} = require(
  "./auth.repository"
);

/* =========================
   NORMALIZE MEMBER ID
========================= */

const normalizeMemberId = (
  memberId
) => {
  const parsedId =
    Number(memberId);

  if (
    !Number.isInteger(parsedId) ||
    parsedId <= 0
  ) {
    return null;
  }

  return parsedId;
};

/* =========================
   NORMALIZE LOGIN ID
========================= */

const normalizeLoginId = (
  loginId
) => {
  const normalized =
    String(loginId || "")
      .trim();

  if (
    !normalized ||
    normalized.length > 100
  ) {
    return null;
  }

  return normalized;
};

/* =========================
   NORMALIZE TOKEN
========================= */

const normalizeToken = (
  token
) => {
  const normalized =
    String(token || "")
      .trim();

  if (
    !normalized ||
    normalized.length > 255
  ) {
    return null;
  }

  return normalized;
};

/* =========================
   FIND MEMBER BY ID
========================= */

const findDownloadMemberById =
  async (
    memberId,
    connection = null
  ) => {
    const normalizedMemberId =
      normalizeMemberId(memberId);

    if (!normalizedMemberId) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            id,
            first_name,
            last_name,
            login_id,
            token,
            profile_pic,
            payment_status,
            is_deleted

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
        [normalizedMemberId],
        connection
      );

    return Array.isArray(rows)
      ? rows[0] || null
      : null;
  };

/* =========================
   FIND MEMBER BY LOGIN ID
========================= */

const findDownloadMemberByLoginId =
  async (
    loginId,
    connection = null
  ) => {
    const normalizedLoginId =
      normalizeLoginId(loginId);

    if (!normalizedLoginId) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            id,
            first_name,
            last_name,
            login_id,
            token,
            profile_pic,
            payment_status,
            is_deleted

          FROM
            kyc_members

          WHERE
            login_id = ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0

          LIMIT 1
        `,
        [normalizedLoginId],
        connection
      );

    return Array.isArray(rows)
      ? rows[0] || null
      : null;
  };

/* =========================
   FIND MEMBER BY TOKEN
========================= */

const findDownloadMemberByToken =
  async (
    token,
    connection = null
  ) => {
    const normalizedToken =
      normalizeToken(token);

    if (!normalizedToken) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            id,
            first_name,
            last_name,
            login_id,
            token,
            profile_pic,
            payment_status,
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
        [normalizedToken],
        connection
      );

    return Array.isArray(rows)
      ? rows[0] || null
      : null;
  };

/* =========================
   SAFE MEMBER
========================= */

const toSafeDownloadMember = (
  member
) => {
  if (!member) {
    return null;
  }

  return {
    id:
      Number(member.id),

    first_name:
      member.first_name || "",

    last_name:
      member.last_name || "",

    full_name:
      [
        member.first_name,
        member.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim(),

    login_id:
      member.login_id || "",

    profile_pic:
      member.profile_pic || null,

    payment_status:
      member.payment_status || "",
  };
};

/* =========================
   EXPORTS
========================= */

module.exports = {
  normalizeMemberId,
  normalizeLoginId,
  normalizeToken,
  findDownloadMemberById,
  findDownloadMemberByLoginId,
  findDownloadMemberByToken,
  toSafeDownloadMember,
};