import axios from "axios";
import { toText, asObject } from "../utils/commonHelpers";

/* ========================================
   POLICY API CLIENT

   Exact backend endpoint:
   POST /accept_policy

   இது /api route இல்லை.
   அதனால் api.js instance பயன்படுத்தவில்லை.
======================================== */

const policyApi =
  axios.create({
    baseURL: "/",

    withCredentials: true,

    timeout: 30000,

    headers: {
      Accept:
        "application/json",
    },
  });

/* ========================================
   COMMON HELPERS
======================================== */

/* ========================================
   URL TO INTERNAL ROUTE
======================================== */

const getInternalRoute = (
  value
) => {
  const route =
    toText(value);

  if (!route) {
    return "";
  }

  if (
    route.startsWith("/")
  ) {
    return route;
  }

  try {
    const parsedUrl =
      new URL(route);

    return `${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return "";
  }
};

/* ========================================
   GET FINAL RESPONSE URL

   Legacy backend redirect response:

   /accept_policy
          ↓
   /payment
======================================== */

const getResponseRoute = (
  response
) => {
  const responseUrl =
    toText(
      response?.request
        ?.responseURL
    );

  if (!responseUrl) {
    return "";
  }

  return getInternalRoute(
    responseUrl
  );
};

/* ========================================
   RESPONSE NORMALIZER
======================================== */

const normalizePolicyResponse = (
  response
) => {
  const responseBody =
    response?.data;

  const finalResponseRoute =
    getResponseRoute(
      response
    );

  /*
    Browser redirect follow பண்ணி
    /login page வந்தால் session இல்லை.
  */

  if (
    finalResponseRoute ===
    "/login"
  ) {
    const sessionError =
      new Error(
        "Your session has expired. Please login again."
      );

    sessionError.statusCode =
      401;

    sessionError.sessionExpired =
      true;

    throw sessionError;
  }

  /*
    Legacy Flask response HTML ஆக
    இருக்கலாம்.

    Redirect இறுதியில் /payment
    வந்தால் policy accepted.
  */

  if (
    typeof responseBody ===
    "string"
  ) {
    return {
      success: true,

      statusCode:
        Number(
          response?.status ||
            200
        ),

      message:
        "Membership policy accepted successfully.",

      policyAccepted:
        true,

      nextRoute:
        finalResponseRoute ===
        "/payment"
          ? "/payment"
          : "/payment",

      raw:
        responseBody,
    };
  }

  const body =
    asObject(
      responseBody
    );

  const data =
    asObject(
      body.data
    );

  const nextAction =
    asObject(
      data.nextAction ??
        body.nextAction
    );

  if (
    body.success === false
  ) {
    const apiError =
      new Error(
        toText(
          body.message ??
            body.error,
          "Unable to accept membership policy."
        )
      );

    apiError.statusCode =
      Number(
        body.statusCode ??
          response?.status ??
          400
      );

    apiError.apiMessage =
      apiError.message;

    throw apiError;
  }

  const responseRoute =
    getInternalRoute(
      nextAction.path ??
        data.redirectTo ??
        data.redirect_to ??
        body.redirectTo ??
        body.redirect_to
    );

  return {
    success: true,

    statusCode:
      Number(
        body.statusCode ??
          response?.status ??
          200
      ),

    message:
      toText(
        body.message ??
          data.message,
        "Membership policy accepted successfully."
      ),

    policyAccepted:
      data.policyAccepted ??
      data.policy_accepted ??
      body.policyAccepted ??
      body.policy_accepted ??
      true,

    nextRoute:
      responseRoute ||
      finalResponseRoute ||
      "/payment",

    raw:
      body,
  };
};

/* ========================================
   ERROR NORMALIZER
======================================== */

const normalizePolicyError = (
  error
) => {
  const responseData =
    asObject(
      error?.response?.data
    );

  const finalResponseRoute =
    getResponseRoute(
      error?.response
    );

  error.statusCode =
    Number(
      error?.response?.status ||
        error?.statusCode ||
        0
    );

  if (
    error.statusCode === 401 ||
    finalResponseRoute ===
      "/login"
  ) {
    error.sessionExpired =
      true;
  }

  error.apiMessage =
    toText(
      responseData.message ??
        responseData.error ??
        error?.apiMessage ??
        error?.message,
      "Unable to accept membership policy."
    );

  return error;
};

/* ========================================
   ACCEPT MEMBERSHIP POLICY

   Exact API:
   POST /accept_policy

   Exact body:
   No request body
======================================== */

export const acceptMembershipPolicy =
  async (
    {
      signal,
    } = {}
  ) => {
    try {
      const response =
  await policyApi.post(
    "/api/policy/accept",
    {
      accepted: true,
    },
    {
      signal,
    }
  );
      return normalizePolicyResponse(
        response
      );
    } catch (error) {
      throw normalizePolicyError(
        error
      );
    }
  };

/* ========================================
   COMPATIBILITY EXPORTS
======================================== */

export const acceptPolicy =
  acceptMembershipPolicy;

export const submitPolicyAcceptance =
  acceptMembershipPolicy;

/* ========================================
   DEFAULT EXPORT
======================================== */

const policyService = {
  acceptMembershipPolicy,
  acceptPolicy,
  submitPolicyAcceptance,
};

export default policyService;