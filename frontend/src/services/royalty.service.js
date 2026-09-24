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

const toNumber = (
  value,
  fallback = 0
) => {
  const normalizedValue =
    Number(value);

  return Number.isFinite(
    normalizedValue
  )
    ? normalizedValue
    : fallback;
};

/* =========================
   LOGIN ID NORMALIZER
========================= */

const normalizeLoginId = (
  loginId
) => {
  const normalizedLoginId =
    toText(loginId, "");

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

const normalizeResponseBody = (
  response
) => {
  const responseBody =
    response?.data;

  if (
    typeof responseBody ===
    "string"
  ) {
    throw new Error(
      "Royalty API returned an invalid response."
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
   NETWORK MEMBER NORMALIZER
========================= */

const normalizeNetworkMember = (
  member,
  index
) => {
  const source =
    asObject(member);

  const loginId =
    toText(
      source.login_id ??
        source.loginId,
      ""
    );

  return {
    id:
      loginId ||
      `royalty-member-${index + 1}`,

    name: toText(
      source.name,
      loginId ||
        "INMBA Member"
    ),

    login_id: loginId,

    amount: Math.max(
      0,
      toNumber(
        source.amount
      )
    ),
  };
};

/* =========================
   GET ROYALTY & REWARDS

   Exact backend API:
   GET /api/public/royalty/:loginId

   api.js baseURL = /api

   Service path:
   /public/royalty/:loginId
========================= */

export const getRoyaltyRewards =
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
        `/public/royalty/${encodeURIComponent(
          safeLoginId
        )}`,
        {
          signal,
        }
      );

    const data =
      normalizeResponseBody(
        response
      );

    const networkMembers =
      Array.isArray(
        data.network_members
      )
        ? data.network_members.map(
            normalizeNetworkMember
          )
        : [];

    return {
      login_id: toText(
        data.login_id,
        safeLoginId
      ),

      royalty_pct: Math.max(
        0,
        toNumber(
          data.royalty_pct
        )
      ),

      network_members:
        networkMembers,

      total_direct_amount:
        Math.max(
          0,
          toNumber(
            data.total_direct_amount
          )
        ),

      network_royalty:
        Math.max(
          0,
          toNumber(
            data.network_royalty
          )
        ),

      indirect_count:
        Math.max(
          0,
          toNumber(
            data.indirect_count
          )
        ),

      total_indirect_amount:
        Math.max(
          0,
          toNumber(
            data.total_indirect_amount
          )
        ),

      business_royalty:
        Math.max(
          0,
          toNumber(
            data.business_royalty
          )
        ),

      total_royalty:
        Math.max(
          0,
          toNumber(
            data.total_royalty
          )
        ),
    };
  };

/* =========================
   COMPATIBILITY EXPORTS
========================= */

export const getMemberRoyalty =
  getRoyaltyRewards;

export const getRoyaltySummary =
  getRoyaltyRewards;

/* =========================
   DEFAULT EXPORT
========================= */

const royaltyService = {
  getRoyaltyRewards,
  getMemberRoyalty,
  getRoyaltySummary,
};

export default royaltyService;