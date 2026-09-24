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

    return normalized ||
      null;
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

    return normalized ||
      null;
  };

/* =========================
   NETWORK MEMBER FIELDS
========================= */

const NETWORK_MEMBER_FIELDS =
  `
    id,
    first_name,
    last_name,
    login_id,
    email,
    phone,
    profile_pic,
    occupation,
    education,
    educational_qualification,
    membership_type,
    referral_id,
    referred_by,
    payment_status,
    direct_network,
    indirect_network,
    city,
    district,
    state,
    created_at
  `;

/* =========================
   FIND OWNER BY MEMBER ID
========================= */

const findNetworkOwnerById =
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
            ${NETWORK_MEMBER_FIELDS}
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

const findPublicNetworkOwnerByLoginId =
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
            ${NETWORK_MEMBER_FIELDS}
          FROM
            kyc_members
          WHERE
            login_id = ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0
            AND payment_status = 'approved'
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

const findDirectNetworkMembers =
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
            ${NETWORK_MEMBER_FIELDS}
          FROM
            kyc_members
          WHERE
            referred_by = ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0
          ORDER BY
            created_at DESC,
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
   FIND DIRECT REFERRAL IDS
========================= */

const findDirectReferralIds =
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

    return rows
      .map(
        (
          row
        ) =>
          normalizeReferralId(
            row.referral_id
          )
      )
      .filter(Boolean);
  };

/* =========================
   FIND INDIRECT MEMBERS
========================= */

const findIndirectNetworkMembers =
  async (
    referralIds,
    connection =
      null
  ) => {
    const normalizedReferralIds =
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
              (
                referralId
              ) =>
                normalizeReferralId(
                  referralId
                )
            )
            .filter(Boolean)
        )
      );

    if (
      normalizedReferralIds
        .length === 0
    ) {
      return [];
    }

    const placeholders =
      normalizedReferralIds
        .map(
          () =>
            "?"
        )
        .join(", ");

    const rows =
      await executeQuery(
        `
          SELECT
            ${NETWORK_MEMBER_FIELDS}
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
          ORDER BY
            created_at DESC,
            id DESC
        `,
        normalizedReferralIds,
        connection
      );

    return Array.isArray(
      rows
    )
      ? rows
      : [];
  };

/* =========================
   FIND ALL DESCENDANTS

   Depth 1  -> direct members
   Depth 2+ -> indirect members

   The depth limit and visited member path protect the
   recursive query from malformed cyclic referral data.
========================= */

const findAllDescendantMembers =
  async (
    referralId,
    connection = null
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
          WITH RECURSIVE network_tree AS (
            SELECT
              member.*,
              1 AS network_depth,
              CAST(
                member.id AS CHAR(4000)
              ) AS visited_member_ids
            FROM
              kyc_members AS member
            WHERE
              member.referred_by = ?
              AND COALESCE(
                member.is_deleted,
                0
              ) = 0

            UNION ALL

            SELECT
              child.*,
              parent.network_depth + 1,
              CONCAT(
                parent.visited_member_ids,
                ',',
                child.id
              )
            FROM
              kyc_members AS child
            INNER JOIN
              network_tree AS parent
                ON child.referred_by =
                   parent.referral_id
            WHERE
              COALESCE(
                child.is_deleted,
                0
              ) = 0
              AND parent.network_depth < 100
              AND FIND_IN_SET(
                child.id,
                parent.visited_member_ids
              ) = 0
          )

          SELECT
            *
          FROM
            network_tree
          ORDER BY
            network_depth ASC,
            created_at ASC,
            id ASC
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
   SAFE PRIVATE MEMBER
========================= */

const toSafeNetworkMember =
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

      occupation:
        member.occupation ||
        "",

      education:
        member.education ||
        "",

      educational_qualification:
        member
          .educational_qualification ||
        "",

      membership_type:
        member.membership_type ||
        "",

      referral_id:
        member.referral_id ||
        "",

      referred_by:
        member.referred_by ||
        "",

      payment_status:
        member.payment_status ||
        "pending",

      direct_network:
        Number(
          member.direct_network ||
            0
        ),

      indirect_network:
        Number(
          member.indirect_network ||
            0
        ),

      city:
        member.city ||
        "",

      district:
        member.district ||
        "",

      state:
        member.state ||
        "",

      created_at:
        member.created_at ||
        null,
    };
  };

/* =========================
   SAFE PUBLIC MEMBER
========================= */

const toPublicNetworkMember =
  (
    member
  ) => {
    const safeMember =
      toSafeNetworkMember(
        member
      );

    if (
      !safeMember
    ) {
      return null;
    }

    return {
      login_id:
        safeMember.login_id,

      first_name:
        safeMember.first_name,

      last_name:
        safeMember.last_name,

      full_name:
        safeMember.full_name,

      profile_pic:
        safeMember.profile_pic,

      occupation:
        safeMember.occupation,

      education:
        safeMember.education,

      educational_qualification:
        safeMember
          .educational_qualification,

      membership_type:
        safeMember
          .membership_type,

      payment_status:
        safeMember
          .payment_status,

      direct_network:
        safeMember
          .direct_network,

      indirect_network:
        safeMember
          .indirect_network,

      city:
        safeMember.city,

      district:
        safeMember.district,

      state:
        safeMember.state,

      created_at:
        safeMember
          .created_at,
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  normalizeMemberId,
  normalizeLoginId,
  normalizeReferralId,
  NETWORK_MEMBER_FIELDS,
  findNetworkOwnerById,
  findPublicNetworkOwnerByLoginId,
  findDirectNetworkMembers,
  findDirectReferralIds,
  findIndirectNetworkMembers,
  findAllDescendantMembers,
  toSafeNetworkMember,
  toPublicNetworkMember,
};
