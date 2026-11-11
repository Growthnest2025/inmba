const {
  executeQuery,
} = require(
  "./auth.repository"
);

/* =========================================================
   COMMERCIAL MEMBER CONDITION
========================================================= */

const COMMERCIAL_MEMBER_CONDITION = `
  LOWER(
    TRIM(
      COALESCE(
        membership_type,
        ''
      )
    )
  ) IN (
    'commercial member',
    'commercial membership',
    'commercial'
  )
`;

/* =========================================================
   NORMALIZE MEMBER ID
========================================================= */

const normalizeMemberId = (
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

/* =========================================================
   FIND COMMERCIAL DASHBOARD MEMBER
========================================================= */

const findCommercialDashboardMemberById =
  async (
    memberId,
    connection = null
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

            city,
            address,

            login_id,

            referral_id,
            referred_by,

            membership_type,

            business_name,
            business_category,
            business_address,
            business_legal_type,

            business_contact_number,
            business_email,
            business_website,
            business_google_map_location,

            business_year_established,
            business_number_of_employees,

            products_services_offered,
            business_category_tags,

            business_bio,
            business_logo,

            payment_status,
            payment_method,
            transaction_id,
            amount,

            direct_network,
            indirect_network,

            commercial_network_level,
            commercial_royalty_slab_category,
            commercial_preferred_payout_cycle,

            commercial_kyc_current_step,
            commercial_kyc_status,

            commercial_section_a_completed,
            commercial_section_b_completed,
            commercial_section_c_completed,
            commercial_section_d_completed,
            commercial_section_e_completed,
            commercial_section_f_completed,
            commercial_section_g_completed,

            commercial_kyc_submitted_at,
            commercial_kyc_completed_at,

            created_at,
            updated_at,

            is_deleted

          FROM
            kyc_members

          WHERE
            id = ?

            AND COALESCE(
              is_deleted,
              0
            ) = 0

            AND ${COMMERCIAL_MEMBER_CONDITION}

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
      ? rows[0] || null
      : null;
  };

/* =========================================================
   COMMERCIAL KYC PROGRESS
========================================================= */

const calculateCommercialKycProgress = (
  member
) => {
  if (!member) {
    return {
      completed: 0,

      total: 7,

      percentage: 0,

      sections: {
        A: false,
        B: false,
        C: false,
        D: false,
        E: false,
        F: false,
        G: false,
      },
    };
  }

  const sections = {
    A:
      Number(
        member
          .commercial_section_a_completed ||
        0
      ) === 1,

    B:
      Number(
        member
          .commercial_section_b_completed ||
        0
      ) === 1,

    C:
      Number(
        member
          .commercial_section_c_completed ||
        0
      ) === 1,

    D:
      Number(
        member
          .commercial_section_d_completed ||
        0
      ) === 1,

    E:
      Number(
        member
          .commercial_section_e_completed ||
        0
      ) === 1,

    F:
      Number(
        member
          .commercial_section_f_completed ||
        0
      ) === 1,

    G:
      Number(
        member
          .commercial_section_g_completed ||
        0
      ) === 1,
  };

  const completed =
    Object.values(
      sections
    ).filter(
      Boolean
    ).length;

  const total = 7;

  return {
    completed,

    total,

    percentage:
      Math.round(
        (
          completed /
          total
        ) *
          100
      ),

    sections,
  };
};

/* =========================================================
   INFER COMMERCIAL PLAN
========================================================= */

const inferCommercialPlan = (
  amount
) => {
  const numericAmount =
    Number(
      amount
    );

  if (
    numericAmount === 300
  ) {
    return {
      id:
        "basic",

      name:
        "Basic Membership",

      amount:
        300,

      requires_full_kyc:
        false,
    };
  }

  if (
    numericAmount === 1500
  ) {
    return {
      id:
        "profile_upgrade",

      name:
        "Profile Upgrade",

      amount:
        1500,

      requires_full_kyc:
        true,
    };
  }

  return null;
};

/* =========================================================
   SAFE COMMERCIAL DASHBOARD MEMBER
========================================================= */

const toCommercialDashboardMember = (
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

  const kyc =
    calculateCommercialKycProgress(
      member
    );

  const plan =
    inferCommercialPlan(
      member.amount
    );

  const paymentStatus =
    String(
      member.payment_status ||
      "pending"
    ).toLowerCase();

  const kycStatus =
    String(
      member.commercial_kyc_status ||
      "draft"
    ).toLowerCase();

  /* =======================================================
     BASIC ACTIVE

     ₹300 + Payment Approved
  ======================================================= */

  const basicActive =
    plan?.id ===
      "basic" &&
    paymentStatus ===
      "approved";

  /* =======================================================
     PROFILE UPGRADE ACTIVE

     ₹1500
     +
     Payment Approved
     +
     Commercial KYC Approved
  ======================================================= */

  const profileUpgradeActive =
    plan?.id ===
      "profile_upgrade" &&
    paymentStatus ===
      "approved" &&
    kycStatus ===
      "approved";

  return {
    id:
      Number(
        member.id
      ),

    login_id:
      member.login_id ||
      "",

    referral_id:
      member.referral_id ||
      "",

    referred_by:
      member.referred_by ||
      "",

    membership_type:
      member.membership_type ||
      "Commercial Member",

    /* =====================================================
       OWNER SUMMARY
    ===================================================== */

    owner: {
      display_name:
        [
          firstName,
          lastName,
        ]
          .filter(
            Boolean
          )
          .join(" ")
          .trim(),

      email:
        member.email ||
        "",

      phone:
        member.phone ||
        "",
    },

    /* =====================================================
       BUSINESS SUMMARY
    ===================================================== */

    business: {
      name:
        member.business_name ||
        "",

      category:
        member.business_category ||
        "",

      legal_type:
        member.business_legal_type ||
        "",

      address:
        member.business_address ||
        member.address ||
        "",

      city:
        member.city ||
        "",

      contact_number:
        member.business_contact_number ||
        member.phone ||
        "",

      email:
        member.business_email ||
        member.email ||
        "",

      website:
        member.business_website ||
        "",

      google_map_location:
        member.business_google_map_location ||
        "",

      year_established:
        member.business_year_established ??
        null,

      number_of_employees:
        member.business_number_of_employees ??
        null,

      products_services_offered:
        member.products_services_offered ||
        null,

      category_tags:
        member.business_category_tags ||
        null,

      bio:
        member.business_bio ||
        "",

      logo:
        member.business_logo ||
        null,
    },

    /* =====================================================
       MEMBERSHIP PLAN
    ===================================================== */

    membership_plan:
      plan,

    /* =====================================================
       PAYMENT
    ===================================================== */

    payment: {
      status:
        paymentStatus,

      method:
        member.payment_method ||
        "",

      transaction_id:
        member.transaction_id ||
        "",

      amount:
        member.amount ===
          null ||
        member.amount ===
          undefined
          ? null
          : Number(
              member.amount
            ),

      approved:
        paymentStatus ===
        "approved",
    },

    /* =====================================================
       COMMERCIAL KYC
    ===================================================== */

    kyc: {
      status:
        kycStatus,

      current_step:
        member
          .commercial_kyc_current_step ||
        "A",

      progress:
        kyc,

      submitted_at:
        member
          .commercial_kyc_submitted_at ||
        null,

      completed_at:
        member
          .commercial_kyc_completed_at ||
        null,
    },

    /* =====================================================
       NETWORK
    ===================================================== */

    network: {
      direct:
        directNetwork,

      indirect:
        indirectNetwork,

      total:
        directNetwork +
        indirectNetwork,

      level_rank:
        member
          .commercial_network_level ||
        null,

      royalty_slab:
        member
          .commercial_royalty_slab_category ||
        null,

      preferred_payout_cycle:
        member
          .commercial_preferred_payout_cycle ||
        null,
    },

    /* =====================================================
       ACTIVATION
    ===================================================== */

    activation: {
      basic_membership_active:
        basicActive,

      profile_upgrade_active:
        profileUpgradeActive,

      active:
        basicActive ||
        profileUpgradeActive,
    },

    member_since:
      member.created_at ||
      null,

    updated_at:
      member.updated_at ||
      null,
  };
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  COMMERCIAL_MEMBER_CONDITION,

  normalizeMemberId,

  findCommercialDashboardMemberById,

  calculateCommercialKycProgress,

  inferCommercialPlan,

  toCommercialDashboardMember,
};