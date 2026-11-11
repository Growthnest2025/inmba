const {
  getPolicyStatus,
  acceptPolicy,
} = require(
  "../services/policy.service"
);

/* =========================
   SAVE SESSION
========================= */

const savePolicySession =
  (
    request
  ) => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        request.session.save(
          (
            error
          ) => {
            if (
              error
            ) {
              return reject(
                error
              );
            }

            return resolve();
          }
        );
      }
    );
  };

/* =========================
   GET POLICY STATUS
========================= */

const getPolicyStatusController =
  (
    request,
    response,
    next
  ) => {
    try {
      const status =
        getPolicyStatus(
          request.session
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            status,

          message:
            status.accepted
              ? "Policy has already been accepted."
              : "Policy acceptance is required.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   ACCEPT POLICY API
========================= */

const acceptPolicyController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        acceptPolicy(
          request.session
        );

      await savePolicySession(
        request
      );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Policy accepted successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   LEGACY ACCEPT POLICY
========================= */

const legacyAcceptPolicyController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        acceptPolicy(
          request.session
        );

      await savePolicySession(
        request
      );

      response.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate"
      );

      return response.redirect(
        302,
        result.paymentUrl
      );
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  savePolicySession,
  getPolicyStatusController,
  acceptPolicyController,
  legacyAcceptPolicyController,
};