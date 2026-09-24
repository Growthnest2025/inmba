/* =========================
   POLICY SETTINGS
========================= */

const getPolicyVersion =
  () => {
    return String(
      process.env
        .POLICY_VERSION ||
        "1.0"
    ).trim();
  };

const getFrontendBaseUrl =
  () => {
    return String(
      process.env
        .FRONTEND_BASE_URL ||
        "http://localhost:5173"
    ).replace(
      /\/+$/,
      ""
    );
  };

/* =========================
   POLICY STATUS
========================= */

const getPolicyStatus =
  (
    session
  ) => {
    const safeSession =
      session ||
      {};

    return {
      accepted:
        safeSession
          .policy_accepted ===
        true,

      accepted_at:
        safeSession
          .policy_accepted_at ||
        null,

      policy_version:
        safeSession
          .policy_version ||
        getPolicyVersion(),

      redirectTo:
        safeSession
          .policy_accepted ===
        true
          ? "/payment"
          : "/policy",
    };
  };

/* =========================
   ACCEPT POLICY
========================= */

const acceptPolicy =
  (
    session
  ) => {
    const acceptedAt =
      new Date()
        .toISOString();

    const policyVersion =
      getPolicyVersion();

    session.policy_accepted =
      true;

    session.policy_accepted_at =
      acceptedAt;

    session.policy_version =
      policyVersion;

    return {
      accepted:
        true,

      accepted_at:
        acceptedAt,

      policy_version:
        policyVersion,

      redirectTo:
        "/payment",

      paymentUrl:
        `${getFrontendBaseUrl()}/payment`,

      nextAction: {
        type:
          "NAVIGATE",

        path:
          "/payment",
      },
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  getPolicyVersion,
  getFrontendBaseUrl,
  getPolicyStatus,
  acceptPolicy,
};