import api from "../api/api";

/* =========================
   COMMON HELPERS
========================= */

const asObject = (value) => {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
};

const toText = (
  value,
  fallback = ""
) => {
  const normalizedValue =
    String(value ?? "").trim();

  return normalizedValue || fallback;
};

const toNumber = (value) => {
  const normalizedValue =
    Number(value);

  return Number.isFinite(
    normalizedValue
  )
    ? normalizedValue
    : 0;
};

/* =========================
   LOGIN ID NORMALIZER
========================= */

const normalizeLoginId = (
  loginId
) => {
  const normalizedLoginId =
    toText(loginId);

  if (!normalizedLoginId) {
    throw new Error(
      "Member login ID is required."
    );
  }

  return normalizedLoginId;
};

/* =========================
   RESPONSE NORMALIZER
========================= */

const getResponseData = (
  response
) => {
  const responseBody =
    response?.data;

  if (
    typeof responseBody ===
    "string"
  ) {
    throw new Error(
      "Network API returned an invalid response."
    );
  }

  const normalizedBody =
    asObject(responseBody);

  const nestedData =
    asObject(
      normalizedBody.data
    );

  if (
    Object.keys(
      nestedData
    ).length > 0
  ) {
    return nestedData;
  }

  return normalizedBody;
};

/* =========================
   DIRECT MEMBER NORMALIZER
========================= */

const normalizeDirectMember = (
  member
) => {
  const source =
    asObject(member);

  return {
    name: toText(
      source.name,
      toText(
        source.login_id,
        "INMBA Member"
      )
    ),

    login_id: toText(
      source.login_id
    ),

    membership_type:
      toText(
        source.membership_type,
        "Civilian"
      ),

    paid:
      source.paid === true ||
      source.paid === 1 ||
      source.paid === "1" ||
      String(
        source.paid ?? ""
      ).toLowerCase() ===
        "true",
  };
};

/* =========================
   GET NETWORK SUMMARY

   API:
   GET /api/public/network/:loginId

   Because api.js baseURL is /api:
   /public/network/:loginId
========================= */

export const getNetworkSummary =
  async (
    loginId,
    {
      signal,
    } = {}
  ) => {
    const safeLoginId =
      normalizeLoginId(
        loginId
      );

    const response =
      await api.get(
        `/public/network/${encodeURIComponent(
          safeLoginId
        )}`,
        {
          signal,
        }
      );

    const data =
      getResponseData(
        response
      );

    return {
      login_id: toText(
        data.login_id,
        safeLoginId
      ),

      referral_id:
        toText(
          data.referral_id
        ),

      direct_paid:
        toNumber(
          data.direct_paid
        ),

      direct_unpaid:
        toNumber(
          data.direct_unpaid
        ),

      indirect_paid:
        toNumber(
          data.indirect_paid
        ),

      indirect_unpaid:
        toNumber(
          data.indirect_unpaid
        ),

      direct_total:
        toNumber(
          data.direct_total
        ),

      indirect_total:
        toNumber(
          data.indirect_total
        ),

      tns_points:
        toNumber(
          data.tns_points
        ),
    };
  };

/* =========================
   GET DIRECT MEMBER LIST

   API:
   GET /api/public/members/:loginId
========================= */

export const getDirectNetworkMembers =
  async (
    loginId,
    {
      signal,
    } = {}
  ) => {
    const safeLoginId =
      normalizeLoginId(
        loginId
      );

    const response =
      await api.get(
        `/public/members/${encodeURIComponent(
          safeLoginId
        )}`,
        {
          signal,
        }
      );

    const data =
      getResponseData(
        response
      );

    const directMembers =
      Array.isArray(
        data.direct_members
      )
        ? data.direct_members.map(
            normalizeDirectMember
          )
        : [];

    return {
      login_id: toText(
        data.login_id,
        safeLoginId
      ),

      direct_members:
        directMembers,

      indirect_paid:
        toNumber(
          data.indirect_paid
        ),

      indirect_unpaid:
        toNumber(
          data.indirect_unpaid
        ),
    };
  };

/* =========================
   GET COMPLETE NETWORK DATA

   Both exact APIs are called
   together.
========================= */

export const getCompleteNetwork =
  async (
    loginId,
    {
      signal,
    } = {}
  ) => {
    const safeLoginId =
      normalizeLoginId(
        loginId
      );

    const [
      summary,
      membersData,
    ] =
      await Promise.all([
        getNetworkSummary(
          safeLoginId,
          {
            signal,
          }
        ),

        getDirectNetworkMembers(
          safeLoginId,
          {
            signal,
          }
        ),
      ]);

    return {
      login_id:
        summary.login_id,

      referral_id:
        summary.referral_id,

      direct_paid:
        summary.direct_paid,

      direct_unpaid:
        summary.direct_unpaid,

      indirect_paid:
        summary.indirect_paid,

      indirect_unpaid:
        summary.indirect_unpaid,

      direct_total:
        summary.direct_total,

      indirect_total:
        summary.indirect_total,

      tns_points:
        summary.tns_points,

      direct_members:
        membersData.direct_members,
    };
  };

/* =========================
   COMPATIBILITY EXPORTS
========================= */

export const getPublicNetwork =
  getNetworkSummary;

export const getPublicMembers =
  getDirectNetworkMembers;

export const getMemberNetwork =
  getCompleteNetwork;

/* =========================
   DEFAULT EXPORT
========================= */

const networkService = {
  getNetworkSummary,
  getPublicNetwork,

  getDirectNetworkMembers,
  getPublicMembers,

  getCompleteNetwork,
  getMemberNetwork,
};

export default networkService;