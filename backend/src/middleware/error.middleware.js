/* =========================
   STATUS CODE
========================= */

const getErrorStatusCode =
  (
    error
  ) => {
    if (
      error?.statusCode
    ) {
      return Number(
        error.statusCode
      );
    }

    if (
      error?.status
    ) {
      return Number(
        error.status
      );
    }

    if (
      error?.type ===
      "entity.too.large"
    ) {
      return 413;
    }

    if (
      error?.code ===
      "ER_DUP_ENTRY"
    ) {
      return 409;
    }

    if (
      error?.code ===
      "LIMIT_FILE_SIZE"
    ) {
      return 413;
    }

    return 500;
  };

/* =========================
   ERROR CODE
========================= */

const getPublicErrorCode =
  (
    error,
    statusCode
  ) => {
    if (
      error?.errorCode
    ) {
      return error.errorCode;
    }

    if (
      error?.code ===
      "ER_DUP_ENTRY"
    ) {
      return "DUPLICATE_RECORD";
    }

    if (
      statusCode ===
      413
    ) {
      return "PAYLOAD_TOO_LARGE";
    }

    if (
      statusCode ===
      415
    ) {
      return "UNSUPPORTED_CONTENT_TYPE";
    }

    if (
      statusCode ===
      429
    ) {
      return "RATE_LIMIT_EXCEEDED";
    }

    if (
      statusCode >=
      500
    ) {
      return "INTERNAL_SERVER_ERROR";
    }

    return null;
  };

/* =========================
   PUBLIC MESSAGE
========================= */

const getPublicErrorMessage =
  (
    error,
    statusCode,
    isProduction
  ) => {
    if (
      isProduction &&
      statusCode >=
        500
    ) {
      return "Internal server error.";
    }

    if (
      error?.code ===
      "ER_DUP_ENTRY"
    ) {
      return "A record with the same unique value already exists.";
    }

    return (
      error?.message ||
      "Internal server error."
    );
  };

/* =========================
   ERROR HANDLER
========================= */

const errorHandler =
  (
    error,
    request,
    response,
    next
  ) => {
    if (
      response.headersSent
    ) {
      return next(
        error
      );
    }

    const isProduction =
      process.env
        .NODE_ENV ===
      "production";

    const statusCode =
      getErrorStatusCode(
        error
      );

    const message =
      getPublicErrorMessage(
        error,
        statusCode,
        isProduction
      );

    const errorCode =
      getPublicErrorCode(
        error,
        statusCode
      );

    const payload = {
      success:
        false,

      statusCode,

      message,

      errors:
        Array.isArray(
          error?.errors
        )
          ? error.errors
          : [],

      errorCode,

      requestId:
        request.id ||
        null,
    };

    /*
      Development only.
      Never return stack in production.
    */

    if (
      !isProduction
    ) {
      payload.stack =
        error?.stack ||
        null;
    }

    if (
      statusCode >=
      500
    ) {
      console.error(
        JSON.stringify({
          type:
            "server_error",

          request_id:
            request.id ||
            null,

          method:
            request.method,

          path:
            request.originalUrl,

          status:
            statusCode,

          error_code:
            error?.code ||
            null,

          message:
            error?.message ||
            null,

          stack:
            error?.stack ||
            null,

          created_at:
            new Date()
              .toISOString(),
        })
      );
    }

    return response
      .status(
        statusCode
      )
      .json(
        payload
      );
  };

module.exports =
  errorHandler;