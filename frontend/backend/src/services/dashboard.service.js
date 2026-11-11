const ApiError =
  require(
    "../utils/apiError"
  );

const {
  normalizeMemberId,
  findDashboardMemberById,
  toDashboardMember,
} = require(
  "../repositories/dashboard.repository"
);

const {
  findAllDescendantMembers,
} = require(
  "../repositories/network.repository"
);

/* =========================
   CIVILIAN HIERARCHICAL NETWORK
========================= */

const calculateHierarchicalNetwork =
  async (
    member,
    connection = null
  ) => {
    const referralId =
      String(
        member
          ?.referral_id ||
        ""
      ).trim();

    if (
      !referralId
    ) {
      return {
        direct: 0,
        indirect: 0,
        total: 0,
        direct_paid: 0,
        direct_unpaid: 0,
        indirect_paid: 0,
        indirect_unpaid: 0,
      };
    }

    const descendants =
      await findAllDescendantMembers(
        referralId,
        connection
      );

    const directMembers =
      descendants.filter(
        (memberRow) =>
          Number(
            memberRow.network_depth
          ) === 1
      );

    const indirectMembers =
      descendants.filter(
        (memberRow) =>
          Number(
            memberRow.network_depth
          ) >= 2
      );

    const isPaid =
      (memberRow) =>
        String(
          memberRow
            ?.payment_status ||
          ""
        )
          .trim()
          .toLowerCase() ===
        "approved";

    const directPaid =
      directMembers.filter(
        isPaid
      ).length;

    const indirectPaid =
      indirectMembers.filter(
        isPaid
      ).length;

    return {
      direct:
        directMembers.length,

      indirect:
        indirectMembers.length,

      total:
        descendants.length,

      direct_paid:
        directPaid,

      direct_unpaid:
        directMembers.length -
        directPaid,

      indirect_paid:
        indirectPaid,

      indirect_unpaid:
        indirectMembers.length -
        indirectPaid,
    };
  };

/* =========================
   URL HELPERS
========================= */

const removeTrailingSlash =
  (
    value
  ) => {
    return String(
      value ||
      ""
    ).replace(
      /\/+$/,
      ""
    );
  };

const getFrontendBaseUrl =
  () => {
    return removeTrailingSlash(
      process.env
        .FRONTEND_BASE_URL ||
        "http://localhost:5173"
    );
  };

const getBackendBaseUrl =
  () => {
    return removeTrailingSlash(
      process.env
        .BACKEND_URL ||
        "http://127.0.0.1:5000"
    );
  };

/* =========================
   DASHBOARD LINKS
========================= */

const createDashboardLinks =
  (
    member
  ) => {
    const frontendBaseUrl =
      getFrontendBaseUrl();

    const backendBaseUrl =
      getBackendBaseUrl();

    const loginId =
      encodeURIComponent(
        member.login_id
      );

    return {
      dashboard:
        `${frontendBaseUrl}/dashboard`,

      profile:
        `${frontendBaseUrl}/profile`,

      edit_profile:
        `${frontendBaseUrl}/profile/edit`,

      public_profile:
        `${frontendBaseUrl}/user-profile/${loginId}`,

      qr_code:
        `${backendBaseUrl}/api/qr-code`,

      qr_code_download:
        `${backendBaseUrl}/api/qr-code/download`,

      direct_network:
        `${frontendBaseUrl}/network/direct`,

      indirect_network:
        `${frontendBaseUrl}/network/indirect`,
    };
  };

/* =========================
   DASHBOARD SUMMARY
========================= */

const createDashboardSummary =
  (
    member
  ) => {
    const directNetwork =
      Number(
        member.direct_network ||
        0
      );

    const indirectNetwork =
      Number(
        member.indirect_network ||
        0
      );

    return {
      membership_status:
        member.status ||
        "pending",

      payment_status:
        member.payment_status ||
        "pending",

      profile_completion:
        Number(
          member.profile_completion ||
          0
        ),

      direct_network:
        directNetwork,

      indirect_network:
        indirectNetwork,

      total_network:
        directNetwork +
        indirectNetwork,
    };
  };

/* =========================
   GET MEMBER DASHBOARD
========================= */

const getMemberDashboard =
  async (
    memberId,
    connection =
      null
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      throw new ApiError(
        401,
        "Authentication required."
      );
    }

    const memberRecord =
      await findDashboardMemberById(
        normalizedMemberId,
        connection
      );

    if (
      !memberRecord
    ) {
      throw new ApiError(
        404,
        "Member account not found."
      );
    }

    const member =
      toDashboardMember(
        memberRecord
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Unable to load member dashboard."
      );
    }

    const network =
      await calculateHierarchicalNetwork(
        member,
        connection
      );

    return {
      member,

      network,

      summary:
        {
          ...createDashboardSummary(
            member
          ),

          direct_network:
            network.direct,

          indirect_network:
            network.indirect,

          total_network:
            network.total,
        },

      links:
        createDashboardLinks(
          member
        ),
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  removeTrailingSlash,
  getFrontendBaseUrl,
  getBackendBaseUrl,
  createDashboardLinks,
  createDashboardSummary,
  calculateHierarchicalNetwork,
  getMemberDashboard,
};
