const ApiError =
  require(
    "../utils/apiError"
  );

/* =========================
   NORMALIZE BOOLEAN
========================= */

const normalizeBoolean =
  (
    value,
    defaultValue = false
  ) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return defaultValue;
    }

    if (
      typeof value ===
      "boolean"
    ) {
      return value;
    }

    if (
      typeof value ===
      "number"
    ) {
      return value === 1;
    }

    const normalized =
      String(
        value
      )
        .trim()
        .toLowerCase();

    if (
      [
        "true",
        "1",
        "yes",
        "accepted",
        "accept",
        "on",
      ].includes(
        normalized
      )
    ) {
      return true;
    }

    if (
      [
        "false",
        "0",
        "no",
        "rejected",
        "decline",
        "off",
      ].includes(
        normalized
      )
    ) {
      return false;
    }

    return defaultValue;
  };

/* =========================
   POLICY ACCEPTANCE
========================= */

const validatePolicyAcceptance =
  (
    request,
    response,
    next
  ) => {
    try {
      /*
        Legacy /accept_policy route
        sends no request body.

        Therefore missing accepted
        value defaults to true.
      */

      const accepted =
        normalizeBoolean(
          request.body
            ?.accepted,
          true
        );

      if (
        accepted !== true
      ) {
        throw new ApiError(
          422,
          "You must accept the policy to continue."
        );
      }

      request
        .validatedPolicyAcceptance =
        {
          accepted:
            true,
        };

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

module.exports = {
  normalizeBoolean,
  validatePolicyAcceptance,
};