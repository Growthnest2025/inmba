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
   NORMALIZE LOGIN ID
========================= */

const normalizeLoginId =
  (
    loginId
  ) => {
    const normalized =
      String(
        loginId ||
          ""
      ).trim();

    if (
      !normalized ||
      normalized.length >
        100
    ) {
      return null;
    }

    return normalized;
  };

/* =========================
   NORMALIZE REFERRAL ID
========================= */

const normalizeReferralId =
  (
    referralId
  ) => {
    const normalized =
      String(
        referralId ||
          ""
      ).trim();

    return (
      normalized ||
      null
    );
  };

/* =========================
   FIND OWNER BY ID
========================= */

const findRoyaltyOwnerById =
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
          SELECT
            id,
            first_name,
            last_name,
            login_id,
            referral_id,
            membership_type,
            payment_status,
            direct_network,
            indirect_network,
            created_at
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
   FIND PUBLIC OWNER
========================= */

const findRoyaltyOwnerByLoginId =
  async (
    loginId,
    connection =
      null
  ) => {
    const normalizedLoginId =
      normalizeLoginId(
        loginId
      );

    if (
      !normalizedLoginId
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
            login_id,
            referral_id,
            membership_type,
            payment_status,
            direct_network,
            indirect_network,
            created_at
          FROM
            kyc_members
          WHERE
            login_id = ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0
            AND LOWER(
              TRIM(
                COALESCE(
                  payment_status,
                  ''
                )
              )
            ) = 'approved'
          LIMIT 1
        `,
        [
          normalizedLoginId,
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
   FIND DIRECT MEMBERS
========================= */

const findDirectRoyaltyMembers =
  async (
    referralId,
    connection =
      null
  ) => {
    const normalizedReferralId =
      normalizeReferralId(
        referralId
      );

    if (
      !normalizedReferralId
    ) {
      return [];
    }

    const rows =
      await executeQuery(
        `
          SELECT
            id,
            first_name,
            last_name,
            login_id,
            membership_type,
            referral_id,
            referred_by,
            amount,
            payment_status,
            created_at
          FROM
            kyc_members
          WHERE
            referred_by = ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0
          ORDER BY
            id DESC
        `,
        [
          normalizedReferralId,
        ],
        connection
      );

    return Array.isArray(
      rows
    )
      ? rows
      : [];
  };

/* =========================
   DIRECT REFERRAL IDS
========================= */

const findDirectRoyaltyReferralIds =
  async (
    referralId,
    connection =
      null
  ) => {
    const normalizedReferralId =
      normalizeReferralId(
        referralId
      );

    if (
      !normalizedReferralId
    ) {
      return [];
    }

    const rows =
      await executeQuery(
        `
          SELECT
            referral_id
          FROM
            kyc_members
          WHERE
            referred_by = ?
            AND referral_id IS NOT NULL
            AND TRIM(
              referral_id
            ) <> ''
            AND COALESCE(
              is_deleted,
              0
            ) = 0
        `,
        [
          normalizedReferralId,
        ],
        connection
      );

    if (
      !Array.isArray(
        rows
      )
    ) {
      return [];
    }

    return Array.from(
      new Set(
        rows
          .map(
            (
              row
            ) =>
              normalizeReferralId(
                row.referral_id
              )
          )
          .filter(Boolean)
      )
    );
  };

/* =========================
   FIND INDIRECT MEMBERS
========================= */

const findIndirectRoyaltyMembers =
  async (
    referralIds,
    connection =
      null
  ) => {
    const normalizedIds =
      Array.from(
        new Set(
          (
            Array.isArray(
              referralIds
            )
              ? referralIds
              : []
          )
            .map(
              normalizeReferralId
            )
            .filter(Boolean)
        )
      );

    if (
      normalizedIds.length ===
      0
    ) {
      return [];
    }

    const placeholders =
      normalizedIds
        .map(
          () =>
            "?"
        )
        .join(", ");

    const rows =
      await executeQuery(
        `
          SELECT
            id,
            amount,
            payment_status
          FROM
            kyc_members
          WHERE
            referred_by IN (
              ${placeholders}
            )
            AND COALESCE(
              is_deleted,
              0
            ) = 0
        `,
        normalizedIds,
        connection
      );

    return Array.isArray(
      rows
    )
      ? rows
      : [];
  };

/* =========================
   SAFE OWNER
========================= */

const toSafeRoyaltyOwner =
  (
    owner
  ) => {
    if (
      !owner
    ) {
      return null;
    }

    const firstName =
      owner.first_name ||
      "";

    const lastName =
      owner.last_name ||
      "";

    return {
      id:
        owner.id,

      login_id:
        owner.login_id ||
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

      referral_id:
        owner.referral_id ||
        "",

      membership_type:
        owner.membership_type ||
        "",

      payment_status:
        owner.payment_status ||
        "pending",

      direct_network:
        Number(
          owner.direct_network ||
            0
        ),

      indirect_network:
        Number(
          owner.indirect_network ||
            0
        ),

      created_at:
        owner.created_at ||
        null,
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  normalizeMemberId,
  normalizeLoginId,
  normalizeReferralId,
  findRoyaltyOwnerById,
  findRoyaltyOwnerByLoginId,
  findDirectRoyaltyMembers,
  findDirectRoyaltyReferralIds,
  findIndirectRoyaltyMembers,
  toSafeRoyaltyOwner,
};