const ApiError =
  require(
    "../utils/apiError"
  );

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

/* =========================
   VALIDATE PAYMENT DATA
========================= */

const validatePaymentData =
  (
    payload = {}
  ) => {
    const errors = [];

    const amountValue =
      cleanText(
        payload.amount
      );

    const amount =
      Number(
        amountValue
      );

    const data = {
      payment_method:
        cleanText(
          payload
            .payment_method
        ),

      subscription_year:
        cleanText(
          payload
            .subscription_year
        ),

      amount,

      transaction_id:
        cleanText(
          payload
            .transaction_id
        ),
    };

    if (
      !amountValue
    ) {
      errors.push(
        "Amount is required."
      );
    } else if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      errors.push(
        "Amount must be greater than 0."
      );
    }

    if (
      data.payment_method &&
      data.payment_method
        .length > 100
    ) {
      errors.push(
        "Payment method must not exceed 100 characters."
      );
    }

    if (
      data.subscription_year &&
      data.subscription_year
        .length > 50
    ) {
      errors.push(
        "Subscription year must not exceed 50 characters."
      );
    }

    if (
      data.transaction_id &&
      data.transaction_id
        .length > 255
    ) {
      errors.push(
        "Transaction ID must not exceed 255 characters."
      );
    }

    return {
      isValid:
        errors.length ===
        0,

      errors,

      data,
    };
  };

/* =========================
   EXPRESS MIDDLEWARE
========================= */

const validatePayment =
  (
    request,
    response,
    next
  ) => {
    try {
      const result =
        validatePaymentData(
          request.body ||
            {}
        );

      if (
        !result.isValid
      ) {
        const error =
          new ApiError(
            422,
            result.errors[0]
          );

        error.errors =
          result.errors;

        throw error;
      }

      request.validatedPayment =
        result.data;

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

module.exports = {
  cleanText,
  validatePaymentData,
  validatePayment,
};