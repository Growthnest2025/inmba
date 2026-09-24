import api from "../api/api";

/* =========================================================
   COMMERCIAL DASHBOARD SERVICE

   BACKEND:

   GET /api/commercial-dashboard
   GET /api/commercial-dashboard/summary
========================================================= */


/* =========================================================
   FRONTEND ROUTE MAP

   Backend action paths:
   /commercial-membership
   /commercial-payment
   /commercial-kyc
   /commercial-dashboard

   Current frontend routes:
   /commercial/membership-plan
   /commercial/payment
   /commercial/profile-upgrade
   /commercial/dashboard
========================================================= */

const COMMERCIAL_ROUTE_MAP = Object.freeze({
  "/commercial-membership":
    "/commercial/membership-plan",

  "/commercial-payment":
    "/commercial/payment",

  "/commercial-kyc":
    "/commercial/profile-upgrade",

  "/commercial-dashboard":
    "/commercial/dashboard",
});


/* =========================================================
   HELPERS
========================================================= */

const toText = (value) =>
  String(value ?? "").trim();


const toNumber = (
  value,
  fallback = 0
) => {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};


const extractData = (response) =>
  response?.data?.data ??
  response?.data ??
  null;


/* =========================================================
   ERROR
========================================================= */

const normalizeDashboardError = (
  error,
  fallbackMessage
) => {
  const body =
    error?.response?.data || {};

  const normalized =
    error instanceof Error
      ? error
      : new Error(
          fallbackMessage
        );

  normalized.apiMessage =
    body?.message ||
    error?.message ||
    fallbackMessage;

  normalized.statusCode =
    Number(
      body?.statusCode ??
      error?.response?.status ??
      0
    ) || null;

  normalized.errorCode =
    body?.errorCode ||
    body?.code ||
    null;

  return normalized;
};


/* =========================================================
   BACKEND PATH -> FRONTEND PATH
========================================================= */

export const mapCommercialDashboardPath = (
  path
) => {
  const safePath =
    toText(path);

  if (!safePath) {
    return null;
  }

  return (
    COMMERCIAL_ROUTE_MAP[
      safePath
    ] ||
    safePath
  );
};


/* =========================================================
   NORMALIZE NEXT ACTION
========================================================= */

const normalizeNextAction = (
  action
) => {
  if (
    !action ||
    typeof action !== "object"
  ) {
    return {
      type: "NONE",

      code:
        "NO_ACTION_REQUIRED",

      path: null,

      backendPath: null,

      title:
        "Commercial Dashboard",

      message:
        "No action is required.",
    };
  }

  const backendPath =
    toText(
      action.path
    ) || null;

  return {
    type:
      toText(
        action.type
      ) || "NONE",

    code:
      toText(
        action.code
      ) ||
      "NO_ACTION_REQUIRED",

    path:
      mapCommercialDashboardPath(
        backendPath
      ),

    backendPath,

    title:
      toText(
        action.title
      ),

    message:
      toText(
        action.message
      ),
  };
};


/* =========================================================
   NORMALIZE DASHBOARD
========================================================= */

export const normalizeCommercialDashboard = (
  data
) => {
  const source =
    data &&
    typeof data === "object"
      ? data
      : {};

  const member =
    source.member || {};

  const business =
    source.business || {};

  const membershipPlan =
    source.membership_plan ||
    null;

  const payment =
    source.payment || {};

  const kyc =
    source.kyc || {};

  const network =
    source.network || {};

  const activation =
    source.activation || {};

  const stats =
    source.stats || {};

  const badges =
    source.badges || {};

  const cards =
    source.cards || {};

  return {
    member: {
      id:
        member.id ?? null,

      loginId:
        toText(
          member.login_id
        ),

      membershipType:
        toText(
          member.membership_type
        ) ||
        "Commercial Member",

      memberSince:
        member.member_since ||
        null,
    },

    business: {
      name:
        toText(
          business.name
        ),

      category:
        toText(
          business.category
        ),

      legalType:
        toText(
          business.legal_type
        ),

      address:
        toText(
          business.address
        ),

      city:
        toText(
          business.city
        ),

      contactNumber:
        toText(
          business.contact_number
        ),

      email:
        toText(
          business.email
        ),

      website:
        toText(
          business.website
        ),

      googleMapLocation:
        toText(
          business.google_map_location
        ),

      yearEstablished:
        business.year_established ??
        null,

      numberOfEmployees:
        business.number_of_employees ??
        null,

      productsServices:
        business.products_services_offered ??
        null,

      categoryTags:
        business.category_tags ??
        null,

      bio:
        toText(
          business.bio
        ),

      logo:
        business.logo ||
        null,
    },

    membershipPlan:
      membershipPlan
        ? {
            id:
              toText(
                membershipPlan.id
              ),

            name:
              toText(
                membershipPlan.name
              ),

            amount:
              toNumber(
                membershipPlan.amount,
                0
              ),

            requiresFullKyc:
              Boolean(
                membershipPlan
                  .requires_full_kyc
              ),
          }
        : null,

    payment: {
      status:
        toText(
          payment.status
        ).toLowerCase() ||
        "pending",

      method:
        toText(
          payment.method
        ),

      transactionId:
        toText(
          payment.transaction_id
        ),

      amount:
        payment.amount ===
          null ||
        payment.amount ===
          undefined
          ? null
          : toNumber(
              payment.amount,
              0
            ),

      approved:
        Boolean(
          payment.approved
        ),
    },

    kyc: {
      status:
        toText(
          kyc.status
        ).toLowerCase() ||
        "draft",

      currentStep:
        toText(
          kyc.current_step
        ) || "A",

      progress: {
        completed:
          toNumber(
            kyc
              ?.progress
              ?.completed,
            0
          ),

        total:
          toNumber(
            kyc
              ?.progress
              ?.total,
            7
          ),

        percentage:
          toNumber(
            kyc
              ?.progress
              ?.percentage,
            0
          ),

        sections:
          kyc
            ?.progress
            ?.sections ||
          {
            A: false,
            B: false,
            C: false,
            D: false,
            E: false,
            F: false,
            G: false,
          },
      },

      submittedAt:
        kyc.submitted_at ||
        null,

      completedAt:
        kyc.completed_at ||
        null,
    },

    network: {
      direct:
        toNumber(
          network.direct,
          0
        ),

      indirect:
        toNumber(
          network.indirect,
          0
        ),

      total:
        toNumber(
          network.total,
          0
        ),

      levelRank:
        toText(
          network.level_rank
        ),

      royaltySlab:
        toText(
          network.royalty_slab
        ),

      preferredPayoutCycle:
        toText(
          network.preferred_payout_cycle
        ),
    },

    activation: {
      basicMembershipActive:
        Boolean(
          activation
            .basic_membership_active
        ),

      profileUpgradeActive:
        Boolean(
          activation
            .profile_upgrade_active
        ),

      active:
        Boolean(
          activation.active
        ),
    },

    stats: {
      kycProgress:
        toNumber(
          stats.kyc_progress,
          0
        ),

      directNetwork:
        toNumber(
          stats.direct_network,
          0
        ),

      indirectNetwork:
        toNumber(
          stats.indirect_network,
          0
        ),

      teamSize:
        toNumber(
          stats.team_size,
          0
        ),

      paymentApproved:
        Boolean(
          stats.payment_approved
        ),

      membershipActive:
        Boolean(
          stats.membership_active
        ),
    },

    badges,

    cards,

    nextAction:
      normalizeNextAction(
        source.next_action
      ),

    raw:
      source,
  };
};


/* =========================================================
   GET FULL DASHBOARD

   GET /api/commercial-dashboard
========================================================= */

export const getCommercialDashboard =
  async () => {
    try {
      const response =
        await api.get(
          "/commercial-dashboard"
        );

      const data =
        extractData(
          response
        );

      return {
        dashboard:
          normalizeCommercialDashboard(
            data
          ),

        data,

        message:
          response?.data?.message ||
          "Commercial Dashboard loaded successfully.",
      };
    } catch (error) {
      throw normalizeDashboardError(
        error,
        "Unable to load Commercial Dashboard."
      );
    }
  };


/* =========================================================
   GET DASHBOARD SUMMARY

   GET /api/commercial-dashboard/summary
========================================================= */

export const getCommercialDashboardSummary =
  async () => {
    try {
      const response =
        await api.get(
          "/commercial-dashboard/summary"
        );

      const data =
        extractData(
          response
        );

      return {
        summary:
          data || {},

        data,

        nextAction:
          normalizeNextAction(
            data?.next_action
          ),

        message:
          response?.data?.message ||
          "Commercial Dashboard summary loaded successfully.",
      };
    } catch (error) {
      throw normalizeDashboardError(
        error,
        "Unable to load Commercial Dashboard summary."
      );
    }
  };