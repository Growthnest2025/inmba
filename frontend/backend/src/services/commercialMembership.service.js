const ApiError =
  require(
    "../utils/apiError"
  );

const {
  findMemberById,
} = require(
  "../repositories/member.repository"
);

/* =========================================================
   COMMERCIAL MEMBERSHIP PLANS

   BASIC
      ₹300
      -> PAYMENT

   PROFILE UPGRADE
      ₹1500
      -> COMMERCIAL FULL KYC A-G
========================================================= */

const COMMERCIAL_MEMBERSHIP_PLANS =
  Object.freeze({
    basic: {
      id:
        "basic",

      name:
        "Basic Membership",

      amount:
        300,

      membershipType:
        "Commercial Member",

      description:
        "Start your INMBA Commercial Membership with basic commercial member benefits.",

      nextRoute:
        "/commercial-payment",

      requiresFullKyc:
        false,
    },

    profile_upgrade: {
      id:
        "profile_upgrade",

      name:
        "Profile Upgrade",

      amount:
        1500,

      membershipType:
        "Commercial Member",

      description:
        "Complete the Commercial Full KYC A-G and upgrade your business profile.",

      nextRoute:
        "/commercial-kyc",

      requiresFullKyc:
        true,
    },
  });

/* =========================================================
   HELPERS
========================================================= */

const toText = (
  value
) => {
  return String(
    value ?? ""
  )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
};

const normalizeMembershipType = (
  value
) => {
  return toText(
    value
  )
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );
};

const normalizePlanId = (
  value
) => {
  return toText(
    value
  )
    .toLowerCase();
};

/* =========================================================
   IS COMMERCIAL MEMBER
========================================================= */

const isCommercialMember = (
  member
) => {
  const membershipType =
    normalizeMembershipType(
      member?.membership_type
    );

  return [
    "commercial",
    "commercial member",
    "commercial membership",
  ].includes(
    membershipType
  );
};

/* =========================================================
   REQUIRE COMMERCIAL MEMBER
========================================================= */

const requireCommercialMember =
  async (
    memberId
  ) => {
    const normalizedMemberId =
      Number(
        memberId
      );

    if (
      !Number.isInteger(
        normalizedMemberId
      ) ||
      normalizedMemberId <= 0
    ) {
      const error =
        new ApiError(
          401,
          "Authentication required."
        );

      error.code =
        "AUTHENTICATION_REQUIRED";

      throw error;
    }

    const member =
      await findMemberById(
        normalizedMemberId
      );

    if (
      !member
    ) {
      const error =
        new ApiError(
          404,
          "Member account not found."
        );

      error.code =
        "MEMBER_NOT_FOUND";

      throw error;
    }

    if (
      Number(
        member.is_deleted ||
        0
      ) === 1
    ) {
      const error =
        new ApiError(
          403,
          "This member account is inactive."
        );

      error.code =
        "MEMBER_ACCOUNT_INACTIVE";

      throw error;
    }

    if (
      !isCommercialMember(
        member
      )
    ) {
      const error =
        new ApiError(
          403,
          "Commercial Membership access is available only for Commercial members."
        );

      error.code =
        "COMMERCIAL_MEMBERSHIP_REQUIRED";

      throw error;
    }

    return member;
  };

/* =========================================================
   GET PLAN
========================================================= */

const getCommercialPlanById = (
  planId
) => {
  const normalizedPlanId =
    normalizePlanId(
      planId
    );

  if (
    !normalizedPlanId
  ) {
    return null;
  }

  return (
    COMMERCIAL_MEMBERSHIP_PLANS[
      normalizedPlanId
    ] ||
    null
  );
};

/* =========================================================
   INFER PREVIOUS PLAN FROM PAYMENT

   Existing DB amount:
      300  -> Basic
      1500 -> Profile Upgrade
========================================================= */

const inferCommercialPlanFromAmount = (
  amount
) => {
  const numericAmount =
    Number(
      amount
    );

  if (
    numericAmount ===
    COMMERCIAL_MEMBERSHIP_PLANS
      .basic
      .amount
  ) {
    return (
      COMMERCIAL_MEMBERSHIP_PLANS
        .basic
    );
  }

  if (
    numericAmount ===
    COMMERCIAL_MEMBERSHIP_PLANS
      .profile_upgrade
      .amount
  ) {
    return (
      COMMERCIAL_MEMBERSHIP_PLANS
        .profile_upgrade
    );
  }

  return null;
};

/* =========================================================
   SAFE PLAN RESPONSE
========================================================= */

const createSafePlan = (
  plan
) => {
  if (!plan) {
    return null;
  }

  return {
    id:
      plan.id,

    name:
      plan.name,

    amount:
      plan.amount,

    currency:
      "INR",

    membershipType:
      plan.membershipType,

    description:
      plan.description,

    requiresFullKyc:
      plan.requiresFullKyc,

    nextRoute:
      plan.nextRoute,
  };
};

/* =========================================================
   GET COMMERCIAL MEMBERSHIP OPTIONS
========================================================= */

const getCommercialMembershipOptions =
  async (
    memberId
  ) => {
    const member =
      await requireCommercialMember(
        memberId
      );

    const currentPlan =
      inferCommercialPlanFromAmount(
        member.amount
      );

    return {
      membershipType:
        "Commercial Member",

      member: {
        id:
          Number(
            member.id
          ),

        loginId:
          member.login_id ||
          null,

        businessName:
          member.business_name ||
          null,

        paymentStatus:
          member.payment_status ||
          "pending",

        amount:
          member.amount ===
          null ||
          member.amount ===
          undefined
            ? null
            : Number(
                member.amount
              ),
      },

      plans:
        Object.values(
          COMMERCIAL_MEMBERSHIP_PLANS
        ).map(
          createSafePlan
        ),

      currentPlan:
        createSafePlan(
          currentPlan
        ),
    };
  };

/* =========================================================
   SELECT COMMERCIAL MEMBERSHIP
========================================================= */

const selectCommercialMembership =
  async (
    memberId,
    planId
  ) => {
    const member =
      await requireCommercialMember(
        memberId
      );

    const plan =
      getCommercialPlanById(
        planId
      );

    if (!plan) {
      const error =
        new ApiError(
          422,
          "Please choose a valid Commercial Membership plan."
        );

      error.code =
        "INVALID_COMMERCIAL_MEMBERSHIP_PLAN";

      error.errors = [
        {
          field:
            "plan_id",

          message:
            "Choose Basic Membership or Profile Upgrade.",

          code:
            "INVALID_COMMERCIAL_MEMBERSHIP_PLAN",
        },
      ];

      throw error;
    }

    return {
      success:
        true,

      membershipType:
        "Commercial Member",

      member: {
        id:
          Number(
            member.id
          ),

        loginId:
          member.login_id ||
          null,
      },

      selectedPlan:
        createSafePlan(
          plan
        ),

      nextAction: {
        type:
          "NAVIGATE",

        path:
          plan.nextRoute,
      },
    };
  };

/* =========================================================
   VERIFY EXPECTED COMMERCIAL AMOUNT

   Later Commercial Payment API இதை use பண்ணும்.

   User frontend-ல custom amount மாற்றினாலும்
   backend reject பண்ணும்.
========================================================= */

const validateCommercialPlanAmount = (
  planId,
  amount
) => {
  const plan =
    getCommercialPlanById(
      planId
    );

  if (!plan) {
    return false;
  }

  return (
    Number(
      amount
    ) ===
    Number(
      plan.amount
    )
  );
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  COMMERCIAL_MEMBERSHIP_PLANS,

  isCommercialMember,

  requireCommercialMember,

  getCommercialPlanById,

  inferCommercialPlanFromAmount,

  createSafePlan,

  getCommercialMembershipOptions,

  selectCommercialMembership,

  validateCommercialPlanAmount,
};