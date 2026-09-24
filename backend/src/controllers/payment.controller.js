const ApiError =
  require(
    "../utils/apiError"
  );

const {
  getSessionMemberId,
} = require(
  "./dashboard.controller"
);

const {
  getMemberPayment,
  submitMemberPayment,
} = require(
  "../services/payment.service"
);

/* =========================
   REQUIRE MEMBER SESSION
========================= */

const requirePaymentMemberId =
  (
    request
  ) => {
    const memberId =
      getSessionMemberId(
        request
      );

    if (!memberId) {
      throw new ApiError(
        401,
        "Authentication required."
      );
    }

    return memberId;
  };

/* =========================
   GET PAYMENT
========================= */

const getPaymentController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requirePaymentMemberId(
          request
        );

      const payment =
        await getMemberPayment(
          memberId
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data: {
            payment,
          },

          message:
            "Payment details loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   PAYMENT STATUS
========================= */

const getPaymentStatusController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requirePaymentMemberId(
          request
        );

      const payment =
        await getMemberPayment(
          memberId
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data: {
            payment_status:
              payment
                .payment_status,

            payment_submitted:
              payment
                .payment_submitted,

            payment_approved:
              payment
                .payment_approved,

            amount:
              payment.amount,

            transaction_id:
              payment
                .transaction_id,

            payment_proof_url:
              payment
                .payment_proof_url,
          },

          message:
            "Payment status loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   SUBMIT PAYMENT
========================= */

const submitPaymentController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requirePaymentMemberId(
          request
        );

      const result =
        await submitMemberPayment(
          memberId,
          request
            .validatedPayment ||
            request.body ||
            {},
          request
            .uploadedPaymentProof ||
            null
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Payment details submitted successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   LEGACY CONTROLLERS
========================= */

const getLegacyPaymentController =
  getPaymentController;

const submitLegacyPaymentController =
  submitPaymentController;

/* =========================
   EXPORTS
========================= */

module.exports = {
  requirePaymentMemberId,
  getPaymentController,
  getPaymentStatusController,
  submitPaymentController,
  getLegacyPaymentController,
  submitLegacyPaymentController,
};