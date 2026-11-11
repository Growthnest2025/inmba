const crypto =
  require(
    "crypto"
  );

const ApiError =
  require(
    "../utils/apiError"
  );

/* =========================
   SAFE METHODS
========================= */

const SAFE_HTTP_METHODS =
  new Set([
    "GET",
    "HEAD",
    "OPTIONS",
  ]);

/* =========================
   BOOLEAN ENV
========================= */

const getBooleanEnv =
  (
    name,
    defaultValue
  ) => {
    const value =
      process.env[
        name
      ];

    if (
      value === undefined
    ) {
      return defaultValue;
    }

    return [
      "true",
      "1",
      "yes",
      "on",
    ].includes(
      String(
        value
      )
        .trim()
        .toLowerCase()
    );
  };

/* =========================
   NORMALIZE ORIGIN
========================= */

const normalizeOrigin =
  (
    value
  ) => {
    const stringValue =
      String(
        value ||
          ""
      ).trim();

    if (
      !stringValue ||
      stringValue ===
        "null"
    ) {
      return null;
    }

    try {
      return new URL(
        stringValue
      ).origin;
    } catch {
      return null;
    }
  };

/* =========================
   ALLOWED ORIGINS
========================= */

const getAllowedSecurityOrigins =
  () => {
    const values = [
      ...String(
        process.env
          .CORS_ORIGINS ||
          ""
      ).split(","),

      process.env
        .FRONTEND_BASE_URL,

      process.env
        .BACKEND_URL,
    ];

    return new Set(
      values
        .map(
          normalizeOrigin
        )
        .filter(Boolean)
    );
  };

/* =========================
   REQUEST ID
========================= */

const requestIdMiddleware =
  (
    request,
    response,
    next
  ) => {
    const suppliedRequestId =
      String(
        request.headers[
          "x-request-id"
        ] ||
          ""
      ).trim();

    const requestId =
      /^[A-Za-z0-9._-]{8,100}$/.test(
        suppliedRequestId
      )
        ? suppliedRequestId
        : crypto.randomUUID();

    request.id =
      requestId;

    response.set(
      "X-Request-ID",
      requestId
    );

    return next();
  };

/* =========================
   REQUEST SOURCE ORIGIN
========================= */

const getRequestSourceOrigin =
  (
    request
  ) => {
    const origin =
      normalizeOrigin(
        request.headers
          .origin
      );

    if (
      origin
    ) {
      return origin;
    }

    const referer =
      normalizeOrigin(
        request.headers
          .referer
      );

    return referer;
  };

/* =========================
   ORIGIN / CSRF PROTECTION
========================= */

const originProtectionMiddleware =
  (
    request,
    response,
    next
  ) => {
    const enabled =
      getBooleanEnv(
        "ORIGIN_PROTECTION_ENABLED",
        true
      );

    if (
      !enabled ||
      SAFE_HTTP_METHODS.has(
        request.method
      )
    ) {
      return next();
    }

    const allowedOrigins =
      getAllowedSecurityOrigins();

    const sourceOrigin =
      getRequestSourceOrigin(
        request
      );

    if (
      sourceOrigin
    ) {
      if (
        allowedOrigins.has(
          sourceOrigin
        )
      ) {
        return next();
      }

      return next(
        new ApiError(
          403,
          "Request origin is not allowed."
        )
      );
    }

    /*
      Postman and CMD normally do not
      send Origin or Referer.

      Development allows them.
      Production blocks them unless
      explicitly enabled.
    */

    const allowNonBrowserClients =
      getBooleanEnv(
        "ALLOW_NON_BROWSER_CLIENTS",
        process.env
          .NODE_ENV !==
          "production"
      );

    if (
      allowNonBrowserClients
    ) {
      return next();
    }

    return next(
      new ApiError(
        403,
        "Request origin could not be verified."
      )
    );
  };

/* =========================
   MUTATION CONTENT TYPE
========================= */

const validateMutationContentType =
  (
    request,
    response,
    next
  ) => {
    if (
      SAFE_HTTP_METHODS.has(
        request.method
      )
    ) {
      return next();
    }

    const contentLength =
      Number(
        request.headers[
          "content-length"
        ] ||
          0
      );

    const hasTransferEncoding =
      Boolean(
        request.headers[
          "transfer-encoding"
        ]
      );

    if (
      contentLength <= 0 &&
      !hasTransferEncoding
    ) {
      return next();
    }

    const contentType =
      String(
        request.headers[
          "content-type"
        ] ||
          ""
      )
        .split(";")[0]
        .trim()
        .toLowerCase();

    const allowedContentTypes =
      new Set([
        "application/json",
        "application/x-www-form-urlencoded",
        "multipart/form-data",
      ]);

    if (
      !allowedContentTypes.has(
        contentType
      )
    ) {
      return next(
        new ApiError(
          415,
          "Unsupported request content type."
        )
      );
    }

    return next();
  };

/* =========================
   SENSITIVE CACHE HEADERS
========================= */

const sensitiveNoStoreMiddleware =
  (
    request,
    response,
    next
  ) => {
    const sensitivePrefixes = [
      "/api/auth",
      "/api/login",
      "/api/me",
      "/api/dashboard",
      "/api/profile",
      "/api/payment",
      "/api/bank",
      "/api/pan",
      "/api/kyc",

      /*
        PROFESSIONAL KYC

        Aadhaar / PAN / Bank /
        private Professional data
        must never be cached.
      */

      "/api/professional-kyc",

      "/api/signature",
      "/api/acknowledgement",
      "/api/qr-code",
      "/api/downloads",
      "/api/admin",
      "/login",
      "/admin",
      "/payment",
      "/profile",
      "/bank_form",
      "/pan",
      "/legal_entity",
      "/signature",
      "/acknowledgement",
    ];

    const isSensitive =
      sensitivePrefixes.some(
        (
          prefix
        ) =>
          request.path
            .startsWith(
              prefix
            )
      );

    if (
      isSensitive
    ) {
      response.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
      );

      response.set(
        "Pragma",
        "no-cache"
      );

      response.set(
        "Expires",
        "0"
      );
    }

    return next();
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  SAFE_HTTP_METHODS,

  getBooleanEnv,

  normalizeOrigin,

  getAllowedSecurityOrigins,

  requestIdMiddleware,

  getRequestSourceOrigin,

  originProtectionMiddleware,

  validateMutationContentType,

  sensitiveNoStoreMiddleware,
};