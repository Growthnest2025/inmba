const ApiError =
  require(
    "../utils/apiError"
  );

const cleanText =
  (
    value
  ) => {
    const firstValue =
      Array.isArray(
        value
      )
        ? value[0]
        : value;

    if (
      firstValue === null ||
      firstValue ===
        undefined
    ) {
      return "";
    }

    return String(
      firstValue
    ).trim();
  };

/* =========================
   BANK VALIDATION
========================= */

const validateBankDetailsData =
  (
    payload = {}
  ) => {
    const errors = [];

    const data = {
      account_holder:
        cleanText(
          payload
            .account_holder
        ),

      bank_name:
        cleanText(
          payload
            .bank_name
        ),

      account_number:
        cleanText(
          payload
            .account_number
        ).replace(
          /\s+/g,
          ""
        ),

      ifsc:
        cleanText(
          payload.ifsc
        )
          .replace(
            /\s+/g,
            ""
          )
          .toUpperCase(),
    };

    if (
      !data.account_holder
    ) {
      errors.push(
        "Account holder name is required."
      );
    }

    if (
      data.account_holder
        .length > 150
    ) {
      errors.push(
        "Account holder name must not exceed 150 characters."
      );
    }

    if (
      !data.bank_name
    ) {
      errors.push(
        "Bank name is required."
      );
    }

    if (
      data.bank_name
        .length > 150
    ) {
      errors.push(
        "Bank name must not exceed 150 characters."
      );
    }

// Account Number - Optional, but validate if entered
if (
  data.account_number &&
  !/^[A-Za-z0-9]{6,30}$/.test(
    data.account_number
  )
) {
  errors.push(
    "Please provide a valid account number."
  );
}

// IFSC Code - Optional, but validate if entered
if (
  data.ifsc &&
  !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
    data.ifsc.toUpperCase()
  )
) {
  errors.push(
    "Please provide a valid IFSC code."
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
   PAN VALIDATION
========================= */
const validatePanDetailsData =
  (
    payload = {}
  ) => {
    const errors = [];

    const data = {
      pan_number:
        cleanText(
          payload
            .pan_number
        )
          .replace(
            /\s+/g,
            ""
          )
          .toUpperCase(),

      pan_name:
        cleanText(
          payload
            .pan_name
        ),
    };

    // PAN Number - Optional, but validate if entered
    if (
      data.pan_number &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
        data.pan_number
      )
    ) {
      errors.push(
        "Please provide a valid PAN number."
      );
    }

    // PAN Name - Optional, but validate length if entered
    if (
      data.pan_name &&
      data.pan_name.length > 150
    ) {
      errors.push(
        "PAN card name must not exceed 150 characters."
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
   BANK MIDDLEWARE
========================= */

const validateBankDetails =
  (
    request,
    response,
    next
  ) => {
    try {
      const result =
        validateBankDetailsData(
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

      request.validatedBankDetails =
        result.data;

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   PAN MIDDLEWARE
========================= */

const validatePanDetails =
  (
    request,
    response,
    next
  ) => {
    try {
      const result =
        validatePanDetailsData(
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

      request.validatedPanDetails =
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
  validateBankDetailsData,
  validatePanDetailsData,
  validateBankDetails,
  validatePanDetails,
};