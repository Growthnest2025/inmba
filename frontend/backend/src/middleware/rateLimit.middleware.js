/* =========================
   RATE LIMIT SETTINGS
========================= */

const RATE_LIMIT_ENABLED =
  String(
    process.env
      .SECURITY_RATE_LIMIT_ENABLED ??
      "true"
  )
    .trim()
    .toLowerCase() !==
  "false";

/* =========================
   CLIENT IP
========================= */

const getClientIp =
  (
    request
  ) => {
    return (
      request.ip ||
      request.socket
        ?.remoteAddress ||
      "unknown"
    );
  };

/* =========================
   CREATE RATE LIMITER
========================= */

const createRateLimiter =
  (
    options = {}
  ) => {
    const name =
      options.name ||
      "general";

    const windowMs =
      Number(
        options.windowMs
      ) ||
      15 *
        60 *
        1000;

    const max =
      Number(
        options.max
      ) ||
      100;

    const methods =
      Array.isArray(
        options.methods
      )
        ? new Set(
            options.methods.map(
              (
                method
              ) =>
                String(
                  method
                ).toUpperCase()
            )
          )
        : null;

    const store =
      new Map();

    const cleanupTimer =
      setInterval(
        () => {
          const now =
            Date.now();

          for (
            const [
              key,
              record,
            ] of store
          ) {
            if (
              now >=
              record.resetAt
            ) {
              store.delete(
                key
              );
            }
          }
        },
        Math.min(
          windowMs,
          60000
        )
      );

    cleanupTimer.unref();

    return (
      request,
      response,
      next
    ) => {
      if (
        !RATE_LIMIT_ENABLED
      ) {
        return next();
      }

      if (
        methods &&
        !methods.has(
          request.method
        )
      ) {
        return next();
      }

      const customKey =
        typeof options
          .keyGenerator ===
        "function"
          ? options
              .keyGenerator(
                request
              )
          : null;

      const key =
        `${name}:` +
        (
          customKey ||
          getClientIp(
            request
          )
        );

      const now =
        Date.now();

      let record =
        store.get(
          key
        );

      if (
        !record ||
        now >=
          record.resetAt
      ) {
        record = {
          count:
            0,

          resetAt:
            now +
            windowMs,
        };
      }

      record.count +=
        1;

      store.set(
        key,
        record
      );

      const remaining =
        Math.max(
          max -
            record.count,
          0
        );

      const resetSeconds =
        Math.max(
          Math.ceil(
            (
              record.resetAt -
              now
            ) /
              1000
          ),
          1
        );

      response.set(
        "RateLimit-Limit",
        String(
          max
        )
      );

      response.set(
        "RateLimit-Remaining",
        String(
          remaining
        )
      );

      response.set(
        "RateLimit-Reset",
        String(
          resetSeconds
        )
      );

      if (
        record.count >
        max
      ) {
        response.set(
          "Retry-After",
          String(
            resetSeconds
          )
        );

        return response
          .status(429)
          .json({
            success:
              false,

            statusCode:
              429,

            message:
              options.message ||
              "Too many requests. Please try again later.",

            errorCode:
              "RATE_LIMIT_EXCEEDED",

            retryAfterSeconds:
              resetSeconds,

            requestId:
              request.id ||
              null,
          });
      }

      return next();
    };
  };

/* =========================
   PRECONFIGURED LIMITERS
========================= */

const globalApiLimiter =
  createRateLimiter({
    name:
      "global-api",

    windowMs:
      15 *
      60 *
      1000,

    max:
      300,

    message:
      "Too many API requests. Please try again later.",
  });

const registrationLimiter =
  createRateLimiter({
    name:
      "registration",

    windowMs:
      60 *
      60 *
      1000,

    max:
      10,

    methods: [
      "POST",
    ],

    message:
      "Too many registration attempts. Please try again later.",
  });

const memberLoginLimiter =
  createRateLimiter({
    name:
      "member-login",

    windowMs:
      15 *
      60 *
      1000,

    max:
      10,

    methods: [
      "POST",
    ],

    message:
      "Too many login attempts. Please try again after 15 minutes.",
  });

const adminLoginLimiter =
  createRateLimiter({
    name:
      "admin-login",

    windowMs:
      15 *
      60 *
      1000,

    max:
      10,

    methods: [
      "POST",
    ],

    message:
      "Too many admin login attempts. Please try again later.",
  });

const passwordResetLimiter =
  createRateLimiter({
    name:
      "password-reset",

    windowMs:
      30 *
      60 *
      1000,

    max:
      8,

    methods: [
      "POST",
    ],

    message:
      "Too many password reset attempts. Please try again later.",
  });

const otpLimiter =
  createRateLimiter({
    name:
      "otp",

    windowMs:
      15 *
      60 *
      1000,

    max:
      6,

    methods: [
      "POST",
    ],

    message:
      "Too many OTP attempts. Please wait before trying again.",
  });

const adminMutationLimiter =
  createRateLimiter({
    name:
      "admin-mutation",

    windowMs:
      15 *
      60 *
      1000,

    max:
      100,

    methods: [
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ],

    message:
      "Too many admin update requests.",
  });

const backupLimiter =
  createRateLimiter({
    name:
      "admin-backup",

    windowMs:
      60 *
      60 *
      1000,

    max:
      10,

    methods: [
      "POST",
    ],

    message:
      "Too many backup requests. Please try again later.",
  });

module.exports = {
  RATE_LIMIT_ENABLED,
  getClientIp,
  createRateLimiter,

  globalApiLimiter,
  registrationLimiter,
  memberLoginLimiter,
  adminLoginLimiter,
  passwordResetLimiter,
  otpLimiter,
  adminMutationLimiter,
  backupLimiter,
};