const ApiError =
  require(
    "../utils/apiError"
  );

/* =========================================================
   COMMERCIAL PAYMENT PLANS

   IMPORTANT:
   Amount is decided by backend.
   Frontend amount is never trusted.
========================================================= */

const COMMERCIAL_PAYMENT_PLANS =
  Object.freeze({
    basic: {
      id:
        "basic",

      name:
        "Basic Membership",

      amount:
        300,

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

      requiresFullKyc:
        true,
    },
  });

const ALLOWED_COMMERCIAL_PAYMENT_METHODS =
  Object.freeze([
    "Account",
    "UPI",
    "QR",
  ]);

/* =========================================================
   HELPERS
========================================================= */

const cleanText =
  (
    value
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    const firstValue =
      Array.isArray(
        value
      )
        ? value[0]
        : value;

    const cleaned =
      String(
        firstValue
      ).trim();

    return cleaned === ""
      ? null
      : cleaned;
  };

const normalizePlanId =
  (
    value
  ) => {
    const normalized =
      String(
        cleanText(
          value
        ) ||
        ""
      )
        .trim()
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
      null
    );
  };

const normalizePaymentMethod =
  (
    value
  ) => {
    const normalized =
      String(
        cleanText(
          value
        ) ||
        ""
      )
        .trim()
        .toLowerCase();

    const aliases = {
      account:
        "Account",

      bank:
        "Account",

      "bank account":
        "Account",

      "bank transfer":
        "Account",

      upi:
        "UPI",

      qr:
        "QR",

      "scan qr":
        "QR",
    };

    return (
      aliases[
        normalized
      ] ||
      null
    );
  };

const getCommercialPaymentPlan =
  (
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
      COMMERCIAL_PAYMENT_PLANS[
        normalizedPlanId
      ] ||
      null
    );
  };

const getCommercialPlanFromSession =
  (
    request
  ) => {
    const session =
      request?.session ||
      null;

    if (
      !session
    ) {
      return {
        planId:
          null,

        amount:
          null,

        requiresFullKyc:
          false,
      };
    }

    return {
      planId:
        normalizePlanId(
          session
            .commercial_selected_plan_id
        ),

      amount:
        session
          .commercial_selected_plan_amount ===
          null ||
        session
          .commercial_selected_plan_amount ===
          undefined ||
        session
          .commercial_selected_plan_amount ===
          ""
          ? null
          : Number(
              session
                .commercial_selected_plan_amount
            ),

      requiresFullKyc:
        Boolean(
          session
            .commercial_selected_plan_requires_full_kyc
        ),
    };
  };

/* =========================================================
   VALIDATE COMMERCIAL PAYMENT DATA
========================================================= */

const validateCommercialPaymentData =
  (
    payload = {},
    sessionPlan = {}
  ) => {
    const errors = [];

    const payloadPlanId =
      normalizePlanId(
        payload.plan_id ??
        payload.planId ??
        payload.plan
      );

    const sessionPlanId =
      normalizePlanId(
        sessionPlan.planId ??
        sessionPlan.plan_id
      );

    /* =====================================================
       SERVER SESSION PLAN HAS PRIORITY
    ===================================================== */

    const selectedPlanId =
      sessionPlanId ||
      payloadPlanId;

    const selectedPlan =
      getCommercialPaymentPlan(
        selectedPlanId
      );

    if (
      !selectedPlan
    ) {
      errors.push({
        field:
          "plan_id",

        message:
          "Select a valid Commercial Membership plan before payment.",

        code:
          "COMMERCIAL_PAYMENT_PLAN_REQUIRED",
      });
    }

    /* =====================================================
       BODY PLAN MUST MATCH SERVER SESSION PLAN
    ===================================================== */

    if (
      sessionPlanId &&
      payloadPlanId &&
      sessionPlanId !==
        payloadPlanId
    ) {
      errors.push({
        field:
          "plan_id",

        message:
          "Selected Commercial Membership plan does not match the active payment session.",

        code:
          "COMMERCIAL_PAYMENT_PLAN_MISMATCH",
      });
    }

    /* =====================================================
       PAYMENT METHOD
    ===================================================== */

    const paymentMethod =
      normalizePaymentMethod(
        payload
          .payment_method ??
        payload
          .paymentMethod
      );

    if (
      !paymentMethod
    ) {
      errors.push({
        field:
          "payment_method",

        message:
          "Select a valid payment method: Account, UPI or QR.",

        code:
          "COMMERCIAL_PAYMENT_METHOD_REQUIRED",
      });
    }

    /* =====================================================
       TRANSACTION ID

       Existing INMBA payment flow allows this to be empty.
    ===================================================== */

    const transactionId =
      cleanText(
        payload
          .transaction_id ??
        payload
          .transactionId
      );

    if (
      transactionId &&
      transactionId.length >
        255
    ) {
      errors.push({
        field:
          "transaction_id",

        message:
          "Transaction ID must not exceed 255 characters.",

        code:
          "COMMERCIAL_PAYMENT_TRANSACTION_ID_TOO_LONG",
      });
    }

    /* =====================================================
       AMOUNT

       Client can send amount for display compatibility,
       but backend always uses plan amount.
    ===================================================== */

    const rawAmount =
      cleanText(
        payload.amount
      );

    const clientAmount =
      rawAmount === null
        ? null
        : Number(
            rawAmount
          );

    if (
      rawAmount !== null &&
      (
        !Number.isFinite(
          clientAmount
        ) ||
        clientAmount <= 0
      )
    ) {
      errors.push({
        field:
          "amount",

        message:
          "Invalid Commercial Membership payment amount.",

        code:
          "INVALID_COMMERCIAL_PAYMENT_AMOUNT",
      });
    }

    if (
      selectedPlan &&
      clientAmount !== null &&
      Number.isFinite(
        clientAmount
      ) &&
      clientAmount !==
        Number(
          selectedPlan.amount
        )
    ) {
      errors.push({
        field:
          "amount",

        message:
          `Payment amount for ${selectedPlan.name} must be ₹${selectedPlan.amount}.`,

        code:
          "COMMERCIAL_PAYMENT_AMOUNT_MISMATCH",
      });
    }

    /* =====================================================
       SESSION AMOUNT CONSISTENCY
    ===================================================== */

    const sessionAmount =
      sessionPlan.amount ===
        null ||
      sessionPlan.amount ===
        undefined ||
      sessionPlan.amount ===
        ""
        ? null
        : Number(
            sessionPlan.amount
          );

    if (
      selectedPlan &&
      sessionAmount !== null &&
      (
        !Number.isFinite(
          sessionAmount
        ) ||
        sessionAmount !==
          Number(
            selectedPlan.amount
          )
      )
    ) {
      errors.push({
        field:
          "plan_id",

        message:
          "Commercial Membership payment session is invalid. Please select the plan again.",

        code:
          "INVALID_COMMERCIAL_PAYMENT_SESSION",
      });
    }

    /* =====================================================
       FINAL NORMALIZED DATA
    ===================================================== */

    const data = {
      plan_id:
        selectedPlan
          ?.id ||
        null,

      plan_name:
        selectedPlan
          ?.name ||
        null,

      amount:
        selectedPlan
          ? Number(
              selectedPlan.amount
            )
          : null,

      currency:
        "INR",

      requires_full_kyc:
        Boolean(
          selectedPlan
            ?.requiresFullKyc
        ),

      payment_method:
        paymentMethod,

      transaction_id:
        transactionId,

      /*
        Existing kyc_members column retained.
        Commercial membership plan is not a yearly
        subscription, therefore this remains NULL.
      */
      subscription_year:
        null,
    };

    return {
      isValid:
        errors.length ===
        0,

      errors,

      data,

      plan:
        selectedPlan,
    };
  };

/* =========================================================
   EXPRESS MIDDLEWARE
========================================================= */

const validateCommercialPayment =
  (
    request,
    response,
    next
  ) => {
    try {
      const sessionPlan =
        getCommercialPlanFromSession(
          request
        );

      const result =
        validateCommercialPaymentData(
          request.body ||
            {},
          sessionPlan
        );

      if (
        !result.isValid
      ) {
        const firstError =
          result.errors[0];

        const error =
          new ApiError(
            422,
            firstError
              ?.message ||
              "Invalid Commercial payment details.",
            result.errors
          );

        error.errorCode =
          firstError
            ?.code ||
          "COMMERCIAL_PAYMENT_VALIDATION_FAILED";

        throw error;
      }

      request.validatedCommercialPayment =
        result.data;

      request.commercialPaymentPlan =
        result.plan;

      return next();
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  COMMERCIAL_PAYMENT_PLANS,
  ALLOWED_COMMERCIAL_PAYMENT_METHODS,

  cleanText,
  normalizePlanId,
  normalizePaymentMethod,

  getCommercialPaymentPlan,
  getCommercialPlanFromSession,

  validateCommercialPaymentData,
  validateCommercialPayment,
};