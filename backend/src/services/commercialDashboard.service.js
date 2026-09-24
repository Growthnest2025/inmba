const ApiError =
  require(
    "../utils/apiError"
  );

const {
  normalizeMemberId,

  findCommercialDashboardMemberById,

  toCommercialDashboardMember,
} =
  require(
    "../repositories/commercialDashboard.repository"
  );

const {
  findAllDescendantMembers,
} = require(
  "../repositories/network.repository"
);

/* =========================================================
   COMMERCIAL DASHBOARD CONSTANTS
========================================================= */

const COMMERCIAL_BASIC_PLAN =
  Object.freeze({
    id:
      "basic",

    name:
      "Basic Membership",

    amount:
      300,
  });

const COMMERCIAL_PROFILE_UPGRADE_PLAN =
  Object.freeze({
    id:
      "profile_upgrade",

    name:
      "Profile Upgrade",

    amount:
      1500,
  });

/* =========================================================
   HIERARCHICAL NETWORK COUNTS

   Depth 1  -> direct
   Depth 2+ -> indirect (all descendants)

   approved -> paid
   anything else -> unpaid
========================================================= */

const calculateHierarchicalNetwork =
  async (
    dashboard
  ) => {
    const referralId =
      toText(
        dashboard
          ?.referral_id
      );

    if (
      !referralId
    ) {
      return {
        direct: 0,
        indirect: 0,
        total: 0,
        paid_direct: 0,
        unpaid_direct: 0,
        paid_indirect: 0,
        unpaid_indirect: 0,
      };
    }

    const descendants =
      await findAllDescendantMembers(
        referralId
      );

    const directMembers =
      descendants.filter(
        (member) =>
          Number(
            member.network_depth
          ) === 1
      );

    const indirectMembers =
      descendants.filter(
        (member) =>
          Number(
            member.network_depth
          ) >= 2
      );

    const isPaid =
      (member) =>
        toText(
          member
            ?.payment_status
        ).toLowerCase() ===
        "approved";

    const paidDirect =
      directMembers.filter(
        isPaid
      ).length;

    const paidIndirect =
      indirectMembers.filter(
        isPaid
      ).length;

    return {
      direct:
        directMembers.length,

      indirect:
        indirectMembers.length,

      total:
        descendants.length,

      paid_direct:
        paidDirect,

      unpaid_direct:
        directMembers.length -
        paidDirect,

      paid_indirect:
        paidIndirect,

      unpaid_indirect:
        indirectMembers.length -
        paidIndirect,
    };
  };

/* =========================================================
   HELPERS
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const text =
    String(
      value ?? ""
    ).trim();

  return (
    text ||
    fallback
  );
};

const toNumber = (
  value,
  fallback = 0
) => {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : fallback;
};

/* =========================================================
   JSON FIELD PARSER
========================================================= */

const parseStoredValue = (
  value
) => {
  if (
    value === null ||
    typeof value ===
      "undefined" ||
    value === ""
  ) {
    return null;
  }

  if (
    Array.isArray(
      value
    ) ||
    typeof value ===
      "object"
  ) {
    return value;
  }

  const text =
    toText(
      value
    );

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(
      text
    );
  } catch {
    return value;
  }
};

/* =========================================================
   MEMBER ERROR
========================================================= */

const createDashboardError = (
  statusCode,
  message,
  errorCode
) => {
  const error =
    new ApiError(
      statusCode,
      message
    );

  error.code =
    errorCode;

  error.errorCode =
    errorCode;

  return error;
};

/* =========================================================
   GET COMMERCIAL MEMBER
========================================================= */

const getCommercialDashboardMemberOrThrow =
  async (
    memberId
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      throw createDashboardError(
        401,

        "Please login to access the Commercial Dashboard.",

        "COMMERCIAL_DASHBOARD_AUTH_REQUIRED"
      );
    }

    const member =
      await findCommercialDashboardMemberById(
        normalizedMemberId
      );

    if (
      !member
    ) {
      throw createDashboardError(
        404,

        "Commercial member account not found.",

        "COMMERCIAL_DASHBOARD_MEMBER_NOT_FOUND"
      );
    }

    return member;
  };

/* =========================================================
   PUBLIC PROFILE PATH

   Current INMBA public profile route:

   /user-profile/:loginId
========================================================= */

const buildCommercialPublicProfilePath = (
  loginId
) => {
  const normalizedLoginId =
    toText(
      loginId
    );

  if (
    !normalizedLoginId
  ) {
    return null;
  }

  return (
    `/user-profile/${encodeURIComponent(
      normalizedLoginId
    )}`
  );
};

/* =========================================================
   REFERRAL LINK PATH
========================================================= */

const buildCommercialReferralPath = (
  referralId
) => {
  const normalizedReferralId =
    toText(
      referralId
    );

  if (
    !normalizedReferralId
  ) {
    return null;
  }

  return (
    `/membership-type?ref=${encodeURIComponent(
      normalizedReferralId
    )}`
  );
};

/* =========================================================
   DASHBOARD NEXT ACTION

   BASIC:

   No payment
   -> Payment

   Pending
   -> Wait

   Rejected
   -> Resubmit

   Approved
   -> Dashboard Active


   PROFILE UPGRADE:

   A-G incomplete
   -> Commercial KYC

   A-G complete but not submitted
   -> KYC Submit

   KYC submitted
   -> Payment

   Payment pending
   -> Wait

   Payment rejected
   -> Resubmit

   Payment approved + KYC approved
   -> Active
========================================================= */

const determineCommercialNextAction = (
  dashboard
) => {
  const plan =
    dashboard
      ?.membership_plan ||
    null;

  const payment =
    dashboard
      ?.payment ||
    {};

  const kyc =
    dashboard
      ?.kyc ||
    {};

  const activation =
    dashboard
      ?.activation ||
    {};

  /* =======================================================
     NO PLAN YET
  ======================================================= */

  if (
    !plan
  ) {
    return {
      type:
        "NAVIGATE",

      code:
        "SELECT_COMMERCIAL_PLAN",

      path:
        "/commercial-membership",

      title:
        "Choose Commercial Membership",

      message:
        "Select Basic Membership ₹300 or Profile Upgrade ₹1500.",
    };
  }

  /* =======================================================
     BASIC MEMBERSHIP
  ======================================================= */

  if (
    plan.id ===
    "basic"
  ) {
    if (
      activation
        .basic_membership_active
    ) {
      return {
        type:
          "ACTIVE",

        code:
          "BASIC_MEMBERSHIP_ACTIVE",

        path:
          "/commercial-dashboard",

        title:
          "Commercial Membership Active",

        message:
          "Your Basic Commercial Membership is active.",
      };
    }

    if (
      payment.status ===
      "rejected"
    ) {
      return {
        type:
          "NAVIGATE",

        code:
          "RESUBMIT_BASIC_PAYMENT",

        path:
          "/commercial-payment",

        title:
          "Payment Rejected",

        message:
          "Your ₹300 Basic Membership payment was rejected. Please submit the payment again.",
      };
    }

    if (
      payment.status ===
        "pending" &&
      (
        payment.method ||
        payment.transaction_id
      )
    ) {
      return {
        type:
          "WAIT",

        code:
          "BASIC_PAYMENT_PENDING",

        path:
          null,

        title:
          "Payment Verification Pending",

        message:
          "Your ₹300 Basic Membership payment is waiting for approval.",
      };
    }

    return {
      type:
        "NAVIGATE",

      code:
        "PAY_BASIC_MEMBERSHIP",

      path:
        "/commercial-payment",

      title:
        "Complete Membership Payment",

      message:
        "Complete the ₹300 Basic Membership payment.",
    };
  }

  /* =======================================================
     PROFILE UPGRADE
  ======================================================= */

  if (
    plan.id ===
    "profile_upgrade"
  ) {
    if (
      activation
        .profile_upgrade_active
    ) {
      return {
        type:
          "ACTIVE",

        code:
          "PROFILE_UPGRADE_ACTIVE",

        path:
          "/commercial-dashboard",

        title:
          "Profile Upgrade Active",

        message:
          "Your Commercial Profile Upgrade is active and verified.",
      };
    }

    const progress =
      kyc
        ?.progress ||
      {};

    if (
      toNumber(
        progress.completed
      ) < 7
    ) {
      return {
        type:
          "NAVIGATE",

        code:
          "COMPLETE_COMMERCIAL_KYC",

        path:
          "/commercial-kyc",

        title:
          "Complete Commercial KYC",

        message:
          `Complete Commercial KYC A-G. ${toNumber(
            progress.completed
          )}/7 sections completed.`,
      };
    }

    const kycStatus =
      toText(
        kyc.status,
        "draft"
      ).toLowerCase();

    if (
      [
        "draft",
        "in_progress",
      ].includes(
        kycStatus
      )
    ) {
      return {
        type:
          "NAVIGATE",

        code:
          "SUBMIT_COMMERCIAL_KYC",

        path:
          "/commercial-kyc",

        title:
          "Submit Commercial KYC",

        message:
          "All A-G sections are complete. Submit your Commercial KYC to continue.",
      };
    }

    if (
      payment.status ===
      "rejected"
    ) {
      return {
        type:
          "NAVIGATE",

        code:
          "RESUBMIT_PROFILE_UPGRADE_PAYMENT",

        path:
          "/commercial-payment",

        title:
          "Payment Rejected",

        message:
          "Your ₹1500 Profile Upgrade payment was rejected. Please submit it again.",
      };
    }

    if (
      payment.status ===
        "pending" &&
      (
        payment.method ||
        payment.transaction_id
      )
    ) {
      return {
        type:
          "WAIT",

        code:
          "PROFILE_UPGRADE_PAYMENT_PENDING",

        path:
          null,

        title:
          "Payment Verification Pending",

        message:
          "Your ₹1500 Profile Upgrade payment is waiting for approval.",
      };
    }

    if (
      [
        "submitted",
        "under_review",
        "approved",
      ].includes(
        kycStatus
      ) &&
      payment.status !==
        "approved"
    ) {
      return {
        type:
          "NAVIGATE",

        code:
          "PAY_PROFILE_UPGRADE",

        path:
          "/commercial-payment",

        title:
          "Complete Profile Upgrade Payment",

        message:
          "Complete the ₹1500 Profile Upgrade payment.",
      };
    }

    if (
      payment.status ===
        "approved" &&
      kycStatus !==
        "approved"
    ) {
      return {
        type:
          "WAIT",

        code:
          "COMMERCIAL_KYC_APPROVAL_PENDING",

        path:
          null,

        title:
          "KYC Verification Pending",

        message:
          "Payment is approved. Your Commercial KYC is waiting for final verification.",
      };
    }
  }

  return {
    type:
      "NONE",

    code:
      "NO_ACTION_REQUIRED",

    path:
      null,

    title:
      "Commercial Dashboard",

    message:
      "No action is required at this time.",
  };
};

/* =========================================================
   ACCOUNT CARD
========================================================= */

const buildAccountCard = (
  dashboard
) => {
  return {
    title:
      "Commercial Account",

    login_id:
      dashboard.login_id,

    membership_type:
      dashboard.membership_type,

    business_name:
      dashboard
        .business
        .name,

    business_category:
      dashboard
        .business
        .category,

    owner_display_name:
      dashboard
        .owner
        .display_name,

    member_since:
      dashboard.member_since,
  };
};

/* =========================================================
   MEMBERSHIP CARD
========================================================= */

const buildMembershipCard = (
  dashboard
) => {
  const plan =
    dashboard
      .membership_plan;

  return {
    title:
      "Commercial Membership",

    selected:
      Boolean(
        plan
      ),

    plan_id:
      plan?.id ||
      null,

    plan_name:
      plan?.name ||
      null,

    amount:
      plan?.amount ??
      null,

    currency:
      "INR",

    payment_status:
      dashboard
        .payment
        .status,

    active:
      Boolean(
        dashboard
          .activation
          .active
      ),
  };
};

/* =========================================================
   KYC CARD
========================================================= */

const buildKycCard = (
  dashboard
) => {
  const progress =
    dashboard
      .kyc
      .progress;

  return {
    title:
      "Commercial KYC",

    status:
      dashboard
        .kyc
        .status,

    current_step:
      dashboard
        .kyc
        .current_step,

    completed_sections:
      progress.completed,

    total_sections:
      progress.total,

    progress_percentage:
      progress.percentage,

    sections:
      progress.sections,

    submitted_at:
      dashboard
        .kyc
        .submitted_at,

    completed_at:
      dashboard
        .kyc
        .completed_at,
  };
};

/* =========================================================
   NETWORK CARD
========================================================= */

const buildNetworkCard = (
  dashboard
) => {
  return {
    title:
      "Commercial Network",

    referral_id:
      dashboard.referral_id,

    sponsor_referral_id:
      dashboard.referred_by,

    direct_network:
      dashboard
        .network
        .direct,

    indirect_network:
      dashboard
        .network
        .indirect,

    team_size:
      dashboard
        .network
        .total,

    network_level_rank:
      dashboard
        .network
        .level_rank,

    royalty_slab:
      dashboard
        .network
        .royalty_slab,

    preferred_payout_cycle:
      dashboard
        .network
        .preferred_payout_cycle,
  };
};

/* =========================================================
   PUBLIC PROFILE CARD
========================================================= */

const buildPublicProfileCard = (
  dashboard
) => {
  const publicProfilePath =
    buildCommercialPublicProfilePath(
      dashboard.login_id
    );

  return {
    title:
      "Commercial Public Profile",

    login_id:
      dashboard.login_id,

    business_name:
      dashboard
        .business
        .name,

    logo:
      dashboard
        .business
        .logo,

    public_profile_path:
      publicProfilePath,

    qr_target:
      publicProfilePath,

    available:
      Boolean(
        dashboard.login_id
      ),

    commercial_verified:
      Boolean(
        dashboard
          .activation
          .profile_upgrade_active
      ),
  };
};

/* =========================================================
   REFERRAL CARD
========================================================= */

const buildReferralCard = (
  dashboard
) => {
  return {
    title:
      "Invite & Referral",

    referral_id:
      dashboard.referral_id,

    referral_path:
      buildCommercialReferralPath(
        dashboard.referral_id
      ),

    direct_members:
      dashboard
        .network
        .direct,

    total_network:
      dashboard
        .network
        .total,
  };
};

/* =========================================================
   BUSINESS SUMMARY
========================================================= */

const buildBusinessSummary = (
  dashboard
) => {
  const business =
    dashboard.business;

  return {
    name:
      business.name,

    category:
      business.category,

    legal_type:
      business.legal_type,

    address:
      business.address,

    city:
      business.city,

    contact_number:
      business.contact_number,

    email:
      business.email,

    website:
      business.website,

    google_map_location:
      business.google_map_location,

    year_established:
      business.year_established,

    number_of_employees:
      business.number_of_employees,

    products_services_offered:
      parseStoredValue(
        business
          .products_services_offered
      ),

    category_tags:
      parseStoredValue(
        business
          .category_tags
      ),

    bio:
      business.bio,

    logo:
      business.logo,
  };
};

/* =========================================================
   DASHBOARD STATS
========================================================= */

const buildDashboardStats = (
  dashboard
) => {
  return {
    kyc_progress:
      dashboard
        .kyc
        .progress
        .percentage,

    direct_network:
      dashboard
        .network
        .direct,

    indirect_network:
      dashboard
        .network
        .indirect,

    team_size:
      dashboard
        .network
        .total,

    payment_approved:
      dashboard
        .payment
        .approved,

    membership_active:
      dashboard
        .activation
        .active,
  };
};

/* =========================================================
   VERIFICATION BADGES

   No sensitive Aadhaar/PAN/Bank data exposed.
========================================================= */

const buildVerificationBadges = (
  dashboard
) => {
  return {
    registration: {
      verified:
        Boolean(
          dashboard.id &&
          dashboard.login_id
        ),

      label:
        "Commercial Member",
    },

    membership: {
      verified:
        Boolean(
          dashboard
            .activation
            .active
        ),

      label:
        dashboard
          .activation
          .profile_upgrade_active
          ? "Profile Upgrade Active"
          : dashboard
              .activation
              .basic_membership_active
            ? "Basic Membership Active"
            : "Membership Pending",
    },

    commercial_kyc: {
      verified:
        dashboard
          .kyc
          .status ===
        "approved",

      label:
        dashboard
          .kyc
          .status ===
        "approved"
          ? "Commercial KYC Verified"
          : "Commercial KYC Pending",
    },
  };
};

/* =========================================================
   GET COMMERCIAL DASHBOARD
========================================================= */

const getCommercialDashboard =
  async (
    memberId
  ) => {
    const member =
      await getCommercialDashboardMemberOrThrow(
        memberId
      );

    const dashboard =
      toCommercialDashboardMember(
        member
      );

    if (
      !dashboard
    ) {
      throw createDashboardError(
        500,

        "Unable to prepare Commercial Dashboard.",

        "COMMERCIAL_DASHBOARD_BUILD_FAILED"
      );
    }

    const hierarchicalNetwork =
      await calculateHierarchicalNetwork(
        dashboard
      );

    dashboard.network = {
      ...dashboard.network,
      ...hierarchicalNetwork,
    };

    const nextAction =
      determineCommercialNextAction(
        dashboard
      );

    return {
      member: {
        id:
          dashboard.id,

        login_id:
          dashboard.login_id,

        membership_type:
          dashboard
            .membership_type,

        member_since:
          dashboard
            .member_since,
      },

      business:
        buildBusinessSummary(
          dashboard
        ),

      membership_plan:
        dashboard
          .membership_plan,

      payment:
        dashboard.payment,

      kyc:
        dashboard.kyc,

      network:
        dashboard.network,

      activation:
        dashboard.activation,

      stats:
        buildDashboardStats(
          dashboard
        ),

      badges:
        buildVerificationBadges(
          dashboard
        ),

      cards: {
        account:
          buildAccountCard(
            dashboard
          ),

        membership:
          buildMembershipCard(
            dashboard
          ),

        kyc:
          buildKycCard(
            dashboard
          ),

        network:
          buildNetworkCard(
            dashboard
          ),

        referral:
          buildReferralCard(
            dashboard
          ),

        public_profile:
          buildPublicProfileCard(
            dashboard
          ),
      },

      next_action:
        nextAction,
    };
  };

/* =========================================================
   GET DASHBOARD SUMMARY
========================================================= */

const getCommercialDashboardSummary =
  async (
    memberId
  ) => {
    const dashboard =
      await getCommercialDashboard(
        memberId
      );

    return {
      member:
        dashboard.member,

      business: {
        name:
          dashboard
            .business
            .name,

        category:
          dashboard
            .business
            .category,

        logo:
          dashboard
            .business
            .logo,
      },

      membership:
        dashboard
          .cards
          .membership,

      kyc:
        dashboard
          .cards
          .kyc,

      network:
        dashboard
          .cards
          .network,

      stats:
        dashboard.stats,

      next_action:
        dashboard
          .next_action,
    };
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  COMMERCIAL_BASIC_PLAN,

  COMMERCIAL_PROFILE_UPGRADE_PLAN,

  buildCommercialPublicProfilePath,

  buildCommercialReferralPath,

  determineCommercialNextAction,

  buildAccountCard,

  buildMembershipCard,

  buildKycCard,

  buildNetworkCard,

  buildPublicProfileCard,

  buildReferralCard,

  buildBusinessSummary,

  buildDashboardStats,

  buildVerificationBadges,

  getCommercialDashboardMemberOrThrow,

  getCommercialDashboard,

  getCommercialDashboardSummary,
};
