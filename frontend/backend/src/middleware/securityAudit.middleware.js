const {
  SAFE_HTTP_METHODS,
} = require(
  "./requestSecurity.middleware"
);

/* =========================
   ACTOR DETAILS
========================= */

const getRequestActor =
  (
    request
  ) => {
    if (
      request.admin
    ) {
      return {
        type:
          "admin",

        id:
          request.admin.id ||
          null,

        username:
          request.admin
            .username ||
          null,

        role:
          request.admin.role ||
          null,
      };
    }

    const member =
      request.session
        ?.user ||
      request.session
        ?.member ||
      null;

    return {
      type:
        member
          ? "member"
          : "anonymous",

      id:
        member?.id ||
        request.session
          ?.user_id ||
        request.session
          ?.member_id ||
        null,

      login_id:
        member
          ?.login_id ||
        request.session
          ?.login_id ||
        null,
    };
  };

/* =========================
   AUDIT LOGGER
========================= */

const securityAuditMiddleware =
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

    const startedAt =
      process.hrtime
        .bigint();

    response.on(
      "finish",
      () => {
        const completedAt =
          process.hrtime
            .bigint();

        const durationMs =
          Number(
            completedAt -
              startedAt
          ) /
          1000000;

        const auditEntry = {
          type:
            "security_audit",

          request_id:
            request.id ||
            null,

          method:
            request.method,

          path:
            request.originalUrl,

          status:
            response.statusCode,

          duration_ms:
            Number(
              durationMs.toFixed(
                2
              )
            ),

          ip:
            request.ip ||
            request.socket
              ?.remoteAddress ||
            null,

          actor:
            getRequestActor(
              request
            ),

          created_at:
            new Date()
              .toISOString(),
        };

        /*
          Never log request.body.
          It may contain passwords,
          OTP, Aadhaar or bank data.
        */

        console.info(
          JSON.stringify(
            auditEntry
          )
        );
      }
    );

    return next();
  };

module.exports = {
  getRequestActor,
  securityAuditMiddleware,
};