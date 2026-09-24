const ApiError =
  require(
    "../utils/apiError"
  );

/*
  Validator return format:

  {
    valid: true/false,
    errors: [],
    data: normalizedData
  }

  Success ஆனால்:
  req.validatedData

  Failure ஆனால்:
  global error middleware.
*/
const validateRequest =
  (validator) => {
    if (
      typeof validator !==
      "function"
    ) {
      throw new TypeError(
        "Validation middleware requires a validator function."
      );
    }

    return (
      req,
      res,
      next
    ) => {
      const requestInput = {
        ...(
          req.query ||
          {}
        ),

        ...(
          req.body ||
          {}
        ),

        ...(
          req.formFields ||
          {}
        ),
      };

      const result =
        validator(
          requestInput
        );

      if (
        !result ||
        result.valid !==
          true
      ) {
        const validationError =
          new ApiError(
            400,
            result?.errors?.[0]
              ?.message ||
              "Request validation failed.",
            result?.errors ||
              []
          );

        validationError.code =
          "VALIDATION_ERROR";

        return next(
          validationError
        );
      }

      req.validatedData =
        result.data;

      req.validationResult =
        result;

      next();
    };
  };

module.exports = {
  validateRequest,
};