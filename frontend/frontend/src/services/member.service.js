import api from "../api/api";

/* =========================
   RESPONSE BODY HELPER
========================= */

const getResponseBody = (
  response
) => {
  return (
    response?.data ||
    {}
  );
};

/* =========================
   RESPONSE DATA HELPER

   Supported formats:

   {
     success: true,
     data: { ... }
   }

   அல்லது:

   {
     success: true,
     member: { ... }
   }
========================= */

const getResponseData = (
  response
) => {
  const responseBody =
    getResponseBody(
      response
    );

  return (
    responseBody?.data ||
    responseBody
  );
};

/* =========================
   GET MEMBER DASHBOARD

   Final API:
   GET /api/dashboard
========================= */

export const getMemberDashboard =
  async (
    {
      signal,
    } = {}
  ) => {
    const response =
      await api.get(
        "/dashboard",
        {
          signal,
        }
      );

    return {
      response:
        response.data,

      data:
        getResponseData(
          response
        ),
    };
  };

/* =========================
   GET CURRENT MEMBER SESSION

   Final API:
   GET /api/me
========================= */

export const getCurrentMember =
  async (
    {
      signal,
    } = {}
  ) => {
    const response =
      await api.get(
        "/me",
        {
          signal,

          skipSessionExpiredHandling:
            true,
        }
      );

    const responseData =
      getResponseData(
        response
      );

    return (
      responseData?.member ||
      responseData?.user ||
      responseData
        ?.sessionUser ||
      responseData ||
      null
    );
  };

/* =========================
   MEMBER LOGOUT

   Final API:
   POST /api/logout
========================= */

export const logoutMember =
  async () => {
    const response =
      await api.post(
        "/logout"
      );

    return response.data;
  };

/* =========================
   DEFAULT EXPORT
========================= */

const memberService = {
  getMemberDashboard,
  getCurrentMember,
  logoutMember,
};

export default memberService;