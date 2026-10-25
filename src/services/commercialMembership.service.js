import api from "../api/api";
import { toText } from "../utils/commonHelpers";

/* =========================================================
   COMMERCIAL MEMBERSHIP SERVICE

   BACKEND:

   GET
   /api/commercial-membership

   POST
   /api/commercial-membership/select

   GET
   /api/commercial-membership/selected

   PLAN IDS:

   basic
   profile_upgrade
========================================================= */


/* =========================================================
   PLAN IDS
========================================================= */

export const COMMERCIAL_PLAN_IDS = Object.freeze({
  BASIC: "basic",

  PROFILE_UPGRADE:
    "profile_upgrade",
});


/* =========================================================
   FALLBACK PLAN DATA

   Backend remains source of truth.

   These values are only used for safe UI fallback.
========================================================= */

export const COMMERCIAL_PLAN_FALLBACK =
  Object.freeze({
    basic: {
      id:
        "basic",

      name:
        "Commercial Membership",

      amount:
        300,

      currency:
        "INR",

      requiresFullKyc:
        true,
    },

    profile_upgrade: {
      id:
        "profile_upgrade",

      name:
        "Profile Upgrade",

      amount:
        1500,

      currency:
        "INR",

      requiresFullKyc:
        true,
    },
  });


/* =========================================================
   TEXT
========================================================= */


/* =========================================================
   PLAN ID
========================================================= */

export const normalizeCommercialPlanId =
  (
    value
  ) => {
    const normalized =
      toText(
        value
      )
        .toLowerCase()
        .replace(
          /[\s-]+/g,
          "_"
        );

    const aliases = {
      basic:
        "basic",

      basic_membership:
        "basic",

      profile_upgrade:
        "profile_upgrade",

      profileupgrade:
        "profile_upgrade",
    };

    return (
      aliases[
        normalized
      ] ||
      ""
    );
  };


/* =========================================================
   API RESPONSE DATA
========================================================= */

const extractApiData = (
  response
) => {
  const body =
    response?.data ||
    {};

  return (
    body?.data ??
    body
  );
};


/* =========================================================
   ERROR NORMALIZER
========================================================= */

const normalizeCommercialMembershipError =
  (
    error,
    fallbackMessage
  ) => {
    const body =
      error?.response
        ?.data ||
      {};

    const message =
      body?.message ||
      body?.data
        ?.message ||
      error?.message ||
      fallbackMessage;

    error.apiMessage =
      message;

    error.statusCode =
      Number(
        body?.statusCode ??
        error?.response
          ?.status ??
        0
      ) ||
      null;

    error.errorCode =
      body?.errorCode ||
      body?.code ||
      null;

    const errors =
      body?.errors ||
      body?.data
        ?.errors ||
      null;

    error.fieldErrors =
      {};

    if (
      Array.isArray(
        errors
      )
    ) {
      errors.forEach(
        (
          item
        ) => {
          const field =
            toText(
              item?.field
            );

          const fieldMessage =
            toText(
              item?.message ??
              item?.msg
            );

          if (
            field &&
            fieldMessage
          ) {
            error.fieldErrors[
              field
            ] =
              fieldMessage;
          }
        }
      );
    }

    return error;
  };


/* =========================================================
   SAFE PLAN
========================================================= */

export const normalizeCommercialPlan =
  (
    plan
  ) => {
    if (
      !plan ||
      typeof plan !==
        "object"
    ) {
      return null;
    }

    const id =
      normalizeCommercialPlanId(
        plan.id ??
        plan.plan_id ??
        plan.planId
      );

    if (
      !id
    ) {
      return null;
    }

    const fallback =
      COMMERCIAL_PLAN_FALLBACK[
        id
      ];

    const amount =
      id === "profile_upgrade"
        ? 1500
        : id === "basic"
          ? 300
          : Number(plan.amount ?? fallback?.amount ?? 300);

    return {
      id,

      name:
        toText(
          plan.name ??
          plan.plan_name
        ) ||
        fallback?.name ||
        "",

      amount:
        Number.isFinite(
          amount
        )
          ? amount
          : fallback?.amount ||
            0,

      currency:
        toText(
          plan.currency
        ) ||
        "INR",

      requiresFullKyc:
        typeof plan
          .requiresFullKyc ===
          "boolean"
          ? plan
              .requiresFullKyc
          : typeof plan
              .requires_full_kyc ===
              "boolean"
            ? plan
                .requires_full_kyc
            : Boolean(
                fallback
                  ?.requiresFullKyc
              ),

      description:
        toText(
          plan.description
        ),

      features:
        Array.isArray(
          plan.features
        )
          ? plan.features
          : [],
    };
  };


/* =========================================================
   GET MEMBERSHIP OPTIONS

   GET
   /api/commercial-membership
========================================================= */

export const getCommercialMembershipOptions =
  async () => {
    try {
      const response =
        await api.get(
          "/commercial-membership"
        );

      const data =
        extractApiData(
          response
        );

      const rawPlans =
        Array.isArray(
          data
        )
          ? data
          : data?.plans ||
            data?.membershipPlans ||
            data?.options ||
            [];

      const plans =
        rawPlans
          .map(
            normalizeCommercialPlan
          )
          .filter(
            Boolean
          );

      /*
        If backend returns plans in a different wrapper
        but request itself succeeded, use safe fallback
        so page does not become blank.
      */

      const finalPlans =
        plans.length >
        0
          ? plans
          : [
              COMMERCIAL_PLAN_FALLBACK
                .basic,

              COMMERCIAL_PLAN_FALLBACK
                .profile_upgrade,
            ];

      return {
        plans:
          finalPlans,

        membershipType:
          toText(
            data
              ?.membershipType
          ) ||
          "Commercial Member",

        message:
          response?.data
            ?.message ||
          "Commercial Membership plans loaded successfully.",
      };
    } catch (
      error
    ) {
      throw normalizeCommercialMembershipError(
        error,
        "Unable to load Commercial Membership plans."
      );
    }
  };


/* =========================================================
   SELECT PLAN

   POST
   /api/commercial-membership/select

   BODY:

   {
     plan_id: "basic"
   }

   OR

   {
     plan_id: "profile_upgrade"
   }
========================================================= */

export const selectCommercialMembership =
  async (
    planId
  ) => {
    const normalizedPlanId =
      normalizeCommercialPlanId(
        planId
      );

    if (
      !normalizedPlanId
    ) {
      const error =
        new Error(
          "Please choose a valid Commercial Membership plan."
        );

      error.apiMessage =
        error.message;

      error.fieldErrors = {
        plan_id:
          error.message,
      };

      throw error;
    }

    try {
      const response =
        await api.post(
          "/commercial-membership/select",
          {
            plan_id:
              normalizedPlanId,
          }
        );

      const data =
        extractApiData(
          response
        );

      const selectedPlan =
        normalizeCommercialPlan(
          data?.selectedPlan
        );

      if (
        !selectedPlan
      ) {
        throw new Error(
          "Commercial Membership plan selection response is invalid."
        );
      }

      /*
        UI convenience only.

        Backend session remains source of truth.
      */

      sessionStorage.setItem(
        "commercial_selected_plan",
        JSON.stringify(
          selectedPlan
        )
      );

      sessionStorage.setItem(
        "commercial_selected_plan_id",
        selectedPlan.id
      );

      return {
        membershipType:
          toText(
            data
              ?.membershipType
          ) ||
          "Commercial Member",

        selectedPlan,

        nextAction: {
          type:
            toText(
              data
                ?.nextAction
                ?.type
            ) ||
            "NAVIGATE",

          path:
            toText(
              data
                ?.nextAction
                ?.path
            ) ||
            (
              selectedPlan
                .requiresFullKyc
                ? "/commercial-kyc"
                : "/commercial-payment"
            ),
        },

        message:
          response?.data
            ?.message ||
          `${selectedPlan.name} selected successfully.`,
      };
    } catch (
      error
    ) {
      throw normalizeCommercialMembershipError(
        error,
        "Unable to select Commercial Membership plan."
      );
    }
  };


/* =========================================================
   GET CURRENT SELECTED PLAN

   GET
   /api/commercial-membership/selected
========================================================= */

export const getSelectedCommercialMembership =
  async () => {
    try {
      const response =
        await api.get(
          "/commercial-membership/selected"
        );

      const data =
        extractApiData(
          response
        );

      const selectedPlan =
        normalizeCommercialPlan(
          data?.selectedPlan
        );

      if (
        selectedPlan
      ) {
        sessionStorage.setItem(
          "commercial_selected_plan",
          JSON.stringify(
            selectedPlan
          )
        );

        sessionStorage.setItem(
          "commercial_selected_plan_id",
          selectedPlan.id
        );
      } else {
        sessionStorage.removeItem(
          "commercial_selected_plan"
        );

        sessionStorage.removeItem(
          "commercial_selected_plan_id"
        );
      }

      return {
        selected:
          Boolean(
            data?.selected &&
            selectedPlan
          ),

        selectedPlan,

        message:
          response?.data
            ?.message ||
          (
            selectedPlan
              ? "Selected Commercial Membership plan loaded successfully."
              : "No Commercial Membership plan selected."
          ),
      };
    } catch (
      error
    ) {
      throw normalizeCommercialMembershipError(
        error,
        "Unable to load selected Commercial Membership plan."
      );
    }
  };


/* =========================================================
   LOCAL SELECTED PLAN

   UI fallback only.
========================================================= */

export const getStoredCommercialPlan =
  () => {
    try {
      const raw =
        sessionStorage.getItem(
          "commercial_selected_plan"
        );

      if (
        !raw
      ) {
        return null;
      }

      return normalizeCommercialPlan(
        JSON.parse(
          raw
        )
      );
    } catch {
      return null;
    }
  };


/* =========================================================
   CLEAR LOCAL PLAN

   Does NOT clear backend session.
========================================================= */

export const clearStoredCommercialPlan =
  () => {
    sessionStorage.removeItem(
      "commercial_selected_plan"
    );

    sessionStorage.removeItem(
      "commercial_selected_plan_id"
    );
  };