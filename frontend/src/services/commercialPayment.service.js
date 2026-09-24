import api from "../api/api";

/* =========================================================
   COMMERCIAL PAYMENT SERVICE

   BACKEND BASE:
   api.js => /api

   FINAL ENDPOINTS:

   GET  /api/commercial-payment/status
   GET  /api/commercial-payment
   POST /api/commercial-payment
   GET  /api/commercial-payment/proof
========================================================= */

/* =========================================================
   HELPERS
========================================================= */

const toText = (
  value
) => {
  return String(
    value ?? ""
  ).trim();
};

const normalizeStatus = (
  value
) => {
  const status =
    toText(
      value
    ).toLowerCase();

  if (
    [
      "approved",
      "paid",
      "success",
      "successful",
      "active",
    ].includes(
      status
    )
  ) {
    return "approved";
  }

  if (
    [
      "pending",
      "submitted",
      "under_review",
      "under review",
      "processing",
    ].includes(
      status
    )
  ) {
    return "pending";
  }

  if (
    [
      "rejected",
      "failed",
      "declined",
    ].includes(
      status
    )
  ) {
    return "rejected";
  }

  return (
    status ||
    "not_submitted"
  );
};

/* =========================================================
   NORMALIZE ERROR
========================================================= */

const normalizePaymentError =
  (
    error,
    fallbackMessage
  ) => {
    const body =
      error
        ?.response
        ?.data ||
      {};

    const normalized =
      error instanceof Error
        ? error
        : new Error(
            fallbackMessage
          );

    normalized.apiMessage =
      body?.message ||
      body?.data
        ?.message ||
      error?.message ||
      fallbackMessage;

    normalized.statusCode =
      Number(
        body?.statusCode ??
        error
          ?.response
          ?.status ??
        0
      ) ||
      null;

    normalized.errorCode =
      body?.errorCode ||
      body?.code ||
      null;

    normalized.fieldErrors =
      {};

    const errors =
      body?.errors ||
      body?.data
        ?.errors ||
      [];

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

          const message =
            toText(
              item?.message
            );

          if (
            field &&
            message
          ) {
            normalized
              .fieldErrors[
                field
              ] =
              message;
          }
        }
      );
    }

    return normalized;
  };

/* =========================================================
   EXTRACT RESPONSE DATA
========================================================= */

const extractData = (
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
   NORMALIZE PAYMENT DATA
========================================================= */

export const normalizeCommercialPayment =
  (
    raw
  ) => {
    if (
      !raw ||
      typeof raw !==
        "object"
    ) {
      return {
        status:
          "not_submitted",

        paymentStatus:
          "not_submitted",

        planId:
          "",

        planName:
          "",

        amount:
          null,

        currency:
          "INR",

        paymentMethod:
          "",

        transactionId:
          "",

        proofUploaded:
          false,

        rejectionReason:
          "",

        raw:
          raw ||
          null,
      };
    }

    const payment =
      raw?.payment &&
      typeof raw.payment ===
        "object"
        ? raw.payment
        : raw;

    const status =
      normalizeStatus(
        payment
          ?.payment_status ??
        payment
          ?.paymentStatus ??
        payment?.status
      );

    const rawAmount =
      payment?.amount ??
      payment
        ?.payment_amount ??
      null;

    const numericAmount =
      rawAmount ===
        null ||
      rawAmount ===
        undefined ||
      rawAmount ===
        ""
        ? null
        : Number(
            rawAmount
          );

    return {
      status,

      paymentStatus:
        status,

      planId:
        toText(
          payment
            ?.plan_id ??
          payment
            ?.planId
        ),

      planName:
        toText(
          payment
            ?.plan_name ??
          payment
            ?.planName
        ),

      amount:
        Number.isFinite(
          numericAmount
        )
          ? numericAmount
          : null,

      currency:
        toText(
          payment?.currency
        ) ||
        "INR",

      paymentMethod:
        toText(
          payment
            ?.payment_method ??
          payment
            ?.paymentMethod
        ),

      transactionId:
        toText(
          payment
            ?.transaction_id ??
          payment
            ?.transactionId
        ),

      proofUploaded:
        Boolean(
          payment
            ?.payment_proof ||
          payment
            ?.proof_uploaded ||
          payment
            ?.proofUploaded
        ),

      rejectionReason:
        toText(
          payment
            ?.payment_rejection_reason ??
          payment
            ?.rejection_reason ??
          payment
            ?.rejectionReason
        ),

      submittedAt:
        payment
          ?.payment_submitted_at ??
        payment
          ?.submitted_at ??
        payment
          ?.submittedAt ??
        null,

      approvedAt:
        payment
          ?.payment_approved_at ??
        payment
          ?.approved_at ??
        payment
          ?.approvedAt ??
        null,

      raw:
        payment,
    };
  };

/* =========================================================
   GET PAYMENT STATUS

   GET /api/commercial-payment/status
========================================================= */

export const getCommercialPaymentStatus =
  async () => {
    try {
      const response =
        await api.get(
          "/commercial-payment/status"
        );

      const data =
        extractData(
          response
        );

      return {
        payment:
          normalizeCommercialPayment(
            data
          ),

        raw:
          data,

        message:
          response
            ?.data
            ?.message ||
          "Commercial payment status loaded.",
      };
    } catch (
      error
    ) {
      throw normalizePaymentError(
        error,
        "Unable to load Commercial payment status."
      );
    }
  };

/* =========================================================
   GET PAYMENT DETAILS

   GET /api/commercial-payment
========================================================= */

export const getCommercialPayment =
  async () => {
    try {
      const response =
        await api.get(
          "/commercial-payment"
        );

      const data =
        extractData(
          response
        );

      return {
        payment:
          normalizeCommercialPayment(
            data?.payment ??
            data
          ),

        raw:
          data,

        message:
          response
            ?.data
            ?.message ||
          "Commercial payment details loaded.",
      };
    } catch (
      error
    ) {
      throw normalizePaymentError(
        error,
        "Unable to load Commercial payment details."
      );
    }
  };

/* =========================================================
   SUBMIT PAYMENT

   POST /api/commercial-payment

   multipart/form-data

   IMPORTANT:
   Do NOT manually set Content-Type.
   Browser/Axios automatically adds multipart boundary.
========================================================= */

export const submitCommercialPayment =
  async ({
    planId,
    amount,
    paymentMethod,
    transactionId = "",
    paymentProof = null,
  }) => {
    const safePlanId =
      toText(
        planId
      );

    const safeMethod =
      toText(
        paymentMethod
      );

    if (
      !safePlanId
    ) {
      const error =
        new Error(
          "Commercial Membership plan is missing."
        );

      error.apiMessage =
        error.message;

      throw error;
    }

    if (
      ![
        "Account",
        "UPI",
        "QR",
      ].includes(
        safeMethod
      )
    ) {
      const error =
        new Error(
          "Select Account, UPI or QR payment method."
        );

      error.apiMessage =
        error.message;

      throw error;
    }

    const payload =
      new FormData();

    payload.append(
      "plan_id",
      safePlanId
    );

    payload.append(
      "payment_method",
      safeMethod
    );

    if (
      transactionId
    ) {
      payload.append(
        "transaction_id",
        toText(
          transactionId
        )
      );
    }

    if (
      amount !==
        null &&
      amount !==
        undefined &&
      amount !==
        ""
    ) {
      payload.append(
        "amount",
        String(
          amount
        )
      );
    }

    if (
      paymentProof instanceof
      File
    ) {
      payload.append(
        "payment_proof",
        paymentProof
      );
    }

    try {
      const response =
        await api.post(
          "/commercial-payment",
          payload
        );

      const data =
        extractData(
          response
        );

      return {
        success:
          response
            ?.data
            ?.success !==
          false,

        data,

        payment:
          normalizeCommercialPayment(
            data
              ?.payment ??
            data
          ),

        message:
          response
            ?.data
            ?.message ||
          data?.message ||
          "Commercial payment submitted successfully.",
      };
    } catch (
      error
    ) {
      throw normalizePaymentError(
        error,
        "Unable to submit Commercial payment."
      );
    }
  };

/* =========================================================
   GET PRIVATE PAYMENT PROOF

   Owner-only authenticated request.

   GET /api/commercial-payment/proof
========================================================= */

export const getCommercialPaymentProof =
  async () => {
    try {
      const response =
        await api.get(
          "/commercial-payment/proof",
          {
            responseType:
              "blob",
          }
        );

      return response.data;
    } catch (
      error
    ) {
      throw normalizePaymentError(
        error,
        "Unable to load payment proof."
      );
    }
  };