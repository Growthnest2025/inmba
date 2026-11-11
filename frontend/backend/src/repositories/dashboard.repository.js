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
   FIND DASHBOARD MEMBER
========================= */

const findDashboardMemberById =
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
  payment_status AS status,
  payment_status,
  direct_network,
  indirect_network,
  created_at,
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
   PROFILE COMPLETION
========================= */

const calculateProfileCompletion =
  (
    member
  ) => {
    if (!member) {
      return 0;
    }

    const requiredFields = [
      member.first_name,
      member.last_name,
      member.email,
      member.phone,
      member.gender,
      member.dob,
      member.occupation,
      member.education,
      member.profile_pic,
    ];

    const completedFields =
      requiredFields.filter(
        (value) =>
          value !== null &&
          value !== undefined &&
          String(
            value
          ).trim() !==
            ""
      ).length;

    return Math.round(
      (
        completedFields /
        requiredFields.length
      ) *
        100
    );
  };

/* =========================
   SAFE DASHBOARD MEMBER
========================= */

const toDashboardMember =
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

    const fullName =
      [
        firstName,
        lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return {
      id:
        member.id,

      login_id:
        member.login_id ||
        "",

      referral_id:
        member.referral_id ||
        "",

      first_name:
        firstName,

      last_name:
        lastName,

      full_name:
        fullName,

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

      status:
        member.status ||
        "pending",

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

      profile_completion:
        calculateProfileCompletion(
          member
        ),

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
  findDashboardMemberById,
  calculateProfileCompletion,
  toDashboardMember,
};