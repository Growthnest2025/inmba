const ApiError =
  require(
    "../utils/apiError"
  );

const {
  normalizeMemberId,
  normalizeLoginId,
  findNetworkOwnerById,
  findPublicNetworkOwnerByLoginId,
  findDirectNetworkMembers,
  findDirectReferralIds,
  findIndirectNetworkMembers,
  findAllDescendantMembers,
  toSafeNetworkMember,
  toPublicNetworkMember,
} = require(
  "../repositories/network.repository"
);

/* =========================
   STATUS HELPERS
========================= */

const isApprovedMember =
  (
    member
  ) => {
    return (
      String(
        member
          ?.payment_status ||
          ""
      )
        .trim()
        .toLowerCase() ===
      "approved"
    );
  };

const createStatusCounts =
  (
    members
  ) => {
    const safeMembers =
      Array.isArray(
        members
      )
        ? members
        : [];

    const approved =
      safeMembers.filter(
        isApprovedMember
      ).length;

    const pending =
      safeMembers.length -
      approved;

    return {
      total:
        safeMembers.length,

      approved,

      pending,
    };
  };

/* =========================
   REQUIRE OWNER BY ID
========================= */

const requireNetworkOwnerById =
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

    const owner =
      await findNetworkOwnerById(
        normalizedMemberId,
        connection
      );

    if (
      !owner
    ) {
      throw new ApiError(
        404,
        "Member account not found."
      );
    }

    return owner;
  };

/* =========================
   REQUIRE PUBLIC OWNER
========================= */

const requirePublicNetworkOwner =
  async (
    loginId,
    connection =
      null
  ) => {
    const normalizedLoginId =
      normalizeLoginId(
        loginId
      );

    if (
      !normalizedLoginId
    ) {
      throw new ApiError(
        400,
        "Member login ID is required."
      );
    }

    const owner =
      await findPublicNetworkOwnerByLoginId(
        normalizedLoginId,
        connection
      );

    if (
      !owner
    ) {
      throw new ApiError(
        404,
        "Approved member profile not found."
      );
    }

    return owner;
  };

/* =========================
   LOAD NETWORK MEMBERS
========================= */

const loadNetworkMembers =
  async (
    owner,
    connection =
      null
  ) => {
    const referralId =
      String(
        owner
          ?.referral_id ||
          ""
      ).trim();

    if (
      !referralId
    ) {
      return {
        directMembers:
          [],

        indirectMembers:
          [],
      };
    }

    const descendants =
      await findAllDescendantMembers(
        referralId,
        connection
      );

    const directMembers =
      descendants.filter(
        (
          member
        ) =>
          Number(
            member.network_depth
          ) === 1
      );

    const indirectMembers =
      descendants.filter(
        (
          member
        ) =>
          Number(
            member.network_depth
          ) >= 2
      );

    return {
      directMembers,
      indirectMembers,
    };
  };

/* =========================
   NETWORK SUMMARY
========================= */

const createNetworkSummary =
  (
    owner,
    directMembers,
    indirectMembers
  ) => {
    const directCounts =
      createStatusCounts(
        directMembers
      );

    const indirectCounts =
      createStatusCounts(
        indirectMembers
      );

    const calculatedDirect =
      directCounts.total;

    const calculatedIndirect =
      indirectCounts.total;

    const storedDirect =
      Number(
        owner
          ?.direct_network ||
          0
      );

    const storedIndirect =
      Number(
        owner
          ?.indirect_network ||
          0
      );

    return {
      direct: {
        ...directCounts,

        stored_count:
          storedDirect,

        calculated_count:
          calculatedDirect,

        count_matches:
          storedDirect ===
          calculatedDirect,
      },

      indirect: {
        ...indirectCounts,

        stored_count:
          storedIndirect,

        calculated_count:
          calculatedIndirect,

        count_matches:
          storedIndirect ===
          calculatedIndirect,
      },

      total: {
        members:
          calculatedDirect +
          calculatedIndirect,

        approved:
          directCounts
            .approved +
          indirectCounts
            .approved,

        pending:
          directCounts
            .pending +
          indirectCounts
            .pending,
      },
    };
  };

/* =========================
   PRIVATE NETWORK DATA
========================= */

const getPrivateNetworkData =
  async (
    memberId,
    connection =
      null
  ) => {
    const owner =
      await requireNetworkOwnerById(
        memberId,
        connection
      );

    const {
      directMembers,
      indirectMembers,
    } =
      await loadNetworkMembers(
        owner,
        connection
      );

    return {
      owner:
        toSafeNetworkMember(
          owner
        ),

      directMembers,

      indirectMembers,

      summary:
        createNetworkSummary(
          owner,
          directMembers,
          indirectMembers
        ),
    };
  };

/* =========================
   GET DIRECT NETWORK
========================= */

const getDirectNetwork =
  async (
    memberId,
    connection =
      null
  ) => {
    const network =
      await getPrivateNetworkData(
        memberId,
        connection
      );

    return {
      owner:
        network.owner,

      members:
        network
          .directMembers
          .map(
            toSafeNetworkMember
          )
          .filter(Boolean),

      summary:
        network
          .summary
          .direct,
    };
  };

/* =========================
   GET INDIRECT NETWORK
========================= */

const getIndirectNetwork =
  async (
    memberId,
    connection =
      null
  ) => {
    const network =
      await getPrivateNetworkData(
        memberId,
        connection
      );

    return {
      owner:
        network.owner,

      members:
        network
          .indirectMembers
          .map(
            toSafeNetworkMember
          )
          .filter(Boolean),

      summary:
        network
          .summary
          .indirect,
    };
  };

/* =========================
   GET NETWORK SUMMARY
========================= */

const getNetworkSummary =
  async (
    memberId,
    connection =
      null
  ) => {
    const network =
      await getPrivateNetworkData(
        memberId,
        connection
      );

    return {
      owner: {
        id:
          network.owner.id,

        login_id:
          network
            .owner
            .login_id,

        full_name:
          network
            .owner
            .full_name,

        referral_id:
          network
            .owner
            .referral_id,
      },

      summary:
        network.summary,
    };
  };

/* =========================
   PUBLIC NETWORK DATA
========================= */

const getPublicNetworkData =
  async (
    loginId,
    connection =
      null
  ) => {
    const owner =
      await requirePublicNetworkOwner(
        loginId,
        connection
      );

    const {
      directMembers,
      indirectMembers,
    } =
      await loadNetworkMembers(
        owner,
        connection
      );

    return {
      owner,

      directMembers,

      indirectMembers,

      summary:
        createNetworkSummary(
          owner,
          directMembers,
          indirectMembers
        ),
    };
  };

/* =========================
   PUBLIC NETWORK SUMMARY
========================= */

const getPublicNetworkSummary =
  async (
    loginId,
    connection =
      null
  ) => {
    const network =
      await getPublicNetworkData(
        loginId,
        connection
      );

    return {
      login_id:
        network
          .owner
          .login_id,

      direct_paid:
        network
          .summary
          .direct
          .approved,

      direct_unpaid:
        network
          .summary
          .direct
          .pending,

      indirect_paid:
        network
          .summary
          .indirect
          .approved,

      indirect_unpaid:
        network
          .summary
          .indirect
          .pending,

      direct_total:
        network
          .summary
          .direct
          .total,

      indirect_total:
        network
          .summary
          .indirect
          .total,

      total_network:
        network
          .summary
          .total
          .members,
    };
  };

/* =========================
   PUBLIC NETWORK MEMBERS
========================= */

const getPublicNetworkMembers =
  async (
    loginId,
    connection =
      null
  ) => {
    const network =
      await getPublicNetworkData(
        loginId,
        connection
      );

    return {
      owner: {
        login_id:
          network
            .owner
            .login_id,

        full_name:
          [
            network
              .owner
              .first_name,
            network
              .owner
              .last_name,
          ]
            .filter(Boolean)
            .join(" ")
            .trim(),

        profile_pic:
          network
            .owner
            .profile_pic ||
          null,

        membership_type:
          network
            .owner
            .membership_type ||
          "",
      },

      direct_members:
        network
          .directMembers
          .map(
            toPublicNetworkMember
          )
          .filter(Boolean),

      indirect_members:
        network
          .indirectMembers
          .map(
            toPublicNetworkMember
          )
          .filter(Boolean),

      summary:
        network.summary,
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  isApprovedMember,
  createStatusCounts,
  requireNetworkOwnerById,
  requirePublicNetworkOwner,
  loadNetworkMembers,
  createNetworkSummary,
  getPrivateNetworkData,
  getDirectNetwork,
  getIndirectNetwork,
  getNetworkSummary,
  getPublicNetworkData,
  getPublicNetworkSummary,
  getPublicNetworkMembers,
};
