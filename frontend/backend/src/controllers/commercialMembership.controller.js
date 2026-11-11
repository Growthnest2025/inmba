const asyncHandler =
  require(
    "../utils/asyncHandler"
  );

const ApiError =
  require(
    "../utils/apiError"
  );

const ApiResponse =
  require(
    "../utils/apiResponse"
  );

const {
  saveSession,
} = require(
  "../utils/authSession.utils"
);

const commercialMembershipService =
  require(
    "../services/commercialMembership.service"
  );

/* =========================================================
   AUTHENTICATED MEMBER ID

   Current INMBA login session:
   req.session.user_id
========================================================= */

const getAuthenticatedMemberId =
  (
    req
  ) => {
    const memberId =
      Number(
        req.session
          ?.user_id
      );

    if (
      !Number.isInteger(
        memberId
      ) ||
      memberId <= 0
    ) {
      const error =
        new ApiError(
          401,
          "Please login to continue."
        );

      error.code =
        "COMMERCIAL_LOGIN_REQUIRED";

      throw error;
    }

    return memberId;
  };

/* =========================================================
   GET COMMERCIAL MEMBERSHIP OPTIONS

   GET
   /api/commercial-membership

   Response:

   Basic Membership
   ₹300

   Profile Upgrade
   ₹1500
========================================================= */

const getCommercialMembershipOptionsController =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const memberId =
        getAuthenticatedMemberId(
          req
        );

      const result =
        await commercialMembershipService
          .getCommercialMembershipOptions(
            memberId
          );

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,

            result,

            "Commercial Membership plans loaded successfully."
          )
        );
    }
  );

/* =========================================================
   SELECT COMMERCIAL MEMBERSHIP

   POST
   /api/commercial-membership/select

   BODY BASIC:

   {
     "plan_id": "basic"
   }

   BODY PROFILE UPGRADE:

   {
     "plan_id": "profile_upgrade"
   }
========================================================= */

const selectCommercialMembershipController =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const memberId =
        getAuthenticatedMemberId(
          req
        );

      const planId =
        String(
          req.body
            ?.plan_id ??
          req.body
            ?.planId ??
          req.body
            ?.plan ??
          ""
        )
          .trim()
          .toLowerCase();

      if (
        !planId
      ) {
        const error =
          new ApiError(
            422,
            "Please choose a Commercial Membership plan.",
            [
              {
                field:
                  "plan_id",

                message:
                  "Choose Basic Membership or Profile Upgrade.",

                code:
                  "COMMERCIAL_PLAN_REQUIRED",
              },
            ]
          );

        error.code =
          "COMMERCIAL_PLAN_REQUIRED";

        throw error;
      }

      /* ===================================================
         VALIDATE MEMBER + PLAN
      =================================================== */

      const result =
        await commercialMembershipService
          .selectCommercialMembership(
            memberId,
            planId
          );

      const selectedPlan =
        result
          .selectedPlan;

      if (
        !selectedPlan
      ) {
        const error =
          new ApiError(
            500,
            "Unable to select Commercial Membership plan."
          );

        error.code =
          "COMMERCIAL_PLAN_SELECTION_FAILED";

        throw error;
      }

      /* ===================================================
         COMMERCIAL PLAN SESSION

         Professional session/data touch ஆகாது.

         Payment / A-G KYC backend
         இந்த session values use பண்ணும்.
      =================================================== */

      if (
        !req.session
      ) {
        const error =
          new ApiError(
            500,
            "Commercial Membership session is unavailable."
          );

        error.code =
          "COMMERCIAL_MEMBERSHIP_SESSION_UNAVAILABLE";

        throw error;
      }

      req.session
        .commercial_selected_plan_id =
          selectedPlan.id;

      req.session
        .commercial_selected_plan_name =
          selectedPlan.name;

      req.session
        .commercial_selected_plan_amount =
          Number(
            selectedPlan.amount
          );

      req.session
        .commercial_selected_plan_requires_full_kyc =
          Boolean(
            selectedPlan
              .requiresFullKyc
          );

      req.session
        .commercial_selected_plan_selected_at =
          new Date()
            .toISOString();

      await saveSession(
        req
      );

      /* ===================================================
         RESPONSE

         ₹300:
           -> Commercial Payment

         ₹1500:
           -> Commercial A-G KYC
      =================================================== */

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,

            {
              membershipType:
                "Commercial Member",

              selectedPlan: {
                id:
                  selectedPlan.id,

                name:
                  selectedPlan.name,

                amount:
                  Number(
                    selectedPlan.amount
                  ),

                currency:
                  "INR",

                requiresFullKyc:
                  Boolean(
                    selectedPlan
                      .requiresFullKyc
                  ),
              },

              nextAction: {
                type:
                  "NAVIGATE",

                path:
                  selectedPlan
                    .requiresFullKyc
                    ? "/commercial-kyc"
                    : "/commercial-payment",
              },
            },

            `${selectedPlan.name} selected successfully.`
          )
        );
    }
  );

/* =========================================================
   GET CURRENT SELECTED COMMERCIAL PLAN

   GET
   /api/commercial-membership/selected
========================================================= */

const getSelectedCommercialMembershipController =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const memberId =
        getAuthenticatedMemberId(
          req
        );

      /* ===================================================
         Confirm logged-in member is Commercial
      =================================================== */

      await commercialMembershipService
        .requireCommercialMember(
          memberId
        );

      const planId =
        req.session
          ?.commercial_selected_plan_id ||
        null;

      const plan =
        planId
          ? commercialMembershipService
              .getCommercialPlanById(
                planId
              )
          : null;

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,

            {
              selected:
                Boolean(
                  plan
                ),

              selectedPlan:
                plan
                  ? commercialMembershipService
                      .createSafePlan(
                        plan
                      )
                  : null,
            },

            plan
              ? "Selected Commercial Membership plan loaded successfully."
              : "No Commercial Membership plan selected."
          )
        );
    }
  );

/* =========================================================
   CLEAR COMMERCIAL PLAN SESSION

   Payment completed / flow reset ஆன பிறகு
   later use பண்ணலாம்.
========================================================= */

const clearCommercialMembershipPlanSession =
  async (
    req
  ) => {
    if (
      !req.session
    ) {
      return;
    }

    delete req.session
      .commercial_selected_plan_id;

    delete req.session
      .commercial_selected_plan_name;

    delete req.session
      .commercial_selected_plan_amount;

    delete req.session
      .commercial_selected_plan_requires_full_kyc;

    delete req.session
      .commercial_selected_plan_selected_at;

    await saveSession(
      req
    );
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getAuthenticatedMemberId,

  getCommercialMembershipOptionsController,

  selectCommercialMembershipController,

  getSelectedCommercialMembershipController,

  clearCommercialMembershipPlanSession,
};