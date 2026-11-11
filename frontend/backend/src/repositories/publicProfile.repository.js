const {
  executeQuery,
} = require(
  "./auth.repository"
);

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
   FIND PUBLIC MEMBER
========================= */

const findPublicMemberByLoginId =
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
            email,
            phone,
            gender,
            dob,
            occupation,
            education,
            educational_qualification,
            profile_pic,
            login_id,
            referral_id,
            membership_type,
            payment_status,
            direct_network,
            indirect_network,
            city,
            district,
            state,
            created_at,
            is_deleted
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
   PUBLIC-SAFE MEMBER
========================= */

const toPublicProfileMember =
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

    const directNetwork =
      Number(
        member.direct_network ||
          0
      );

    const indirectNetwork =
      Number(
        member.indirect_network ||
          0
      );

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

      gender:
        member.gender ||
        "",

      dob:
        member.dob ||
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

      profile_pic:
        member.profile_pic ||
        null,

      membership_type:
        member.membership_type ||
        "",

      payment_status:
        member.payment_status ||
        "approved",

      location: {
        city:
          member.city ||
          "",

        district:
          member.district ||
          "",

        state:
          member.state ||
          "",
      },

      network: {
        direct:
          directNetwork,

        indirect:
          indirectNetwork,

        total:
          directNetwork +
          indirectNetwork,
      },

      member_since:
        member.created_at ||
        null,
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  normalizeLoginId,
  findPublicMemberByLoginId,
  toPublicProfileMember,
};