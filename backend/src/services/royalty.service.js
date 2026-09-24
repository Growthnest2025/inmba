const ApiError =
  require(
    "../utils/apiError"
  );

const {
  normalizeMemberId,
  normalizeLoginId,
  findRoyaltyOwnerById,
  findRoyaltyOwnerByLoginId,
  findDirectRoyaltyMembers,
  findDirectRoyaltyReferralIds,
  findIndirectRoyaltyMembers,
  toSafeRoyaltyOwner,
} = require(
  "../repositories/royalty.repository"
);

/* =========================
   ROYALTY PERCENTAGE
========================= */

const ROYALTY_PCT =
  12;

/* =========================
   STATUS HELPERS
========================= */

const normalizeStatus =
  (
    value
  ) => {
    return String(
      value ||
        ""
    )
      .trim()
      .toLowerCase();
  };

const isApproved =
  (
    member
  ) => {
    return (
      normalizeStatus(
        member
          ?.payment_status
      ) ===
      "approved"
    );
  };

/* =========================
   MONEY HELPERS
========================= */

const normalizeAmount =
  (
    value
  ) => {
    const amount =
      Number(
        value
      );

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      return 0;
    }

    return amount;
  };

const roundMoney =
  (
    value
  ) => {
    const number =
      Number(
        value
      );

    if (
      !Number.isFinite(
        number
      )
    ) {
      return 0;
    }

    return Math.round(
      (
        number +
        Number.EPSILON
      ) *
        100
    ) /
      100;
  };

const calculateRoyalty =
  (
    amount
  ) => {
    return roundMoney(
      normalizeAmount(
        amount
      ) *
        ROYALTY_PCT /
        100
    );
  };

/* =========================
   APPROVED PAID MEMBER
========================= */

const isApprovedPaidMember =
  (
    member
  ) => {
    return (
      isApproved(
        member
      ) &&
      normalizeAmount(
        member?.amount
      ) >
        0
    );
  };

/* =========================
   REQUIRE OWNER BY ID
========================= */

const requireRoyaltyOwnerById =
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
      await findRoyaltyOwnerById(
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

    if (
      !isApproved(
        owner
      )
    ) {
      throw new ApiError(
        403,
        "Approved membership is required to access royalty details."
      );
    }

    return owner;
  };

/* =========================
   REQUIRE PUBLIC OWNER
========================= */

const requireRoyaltyOwnerByLoginId =
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
        "Valid member login ID is required."
      );
    }

    const owner =
      await findRoyaltyOwnerByLoginId(
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
   DIRECT MEMBER RESPONSE
========================= */

const createDirectRoyaltyMember =
  (
    member
  ) => {
    const firstName =
      member.first_name ||
      "";

    const lastName =
      member.last_name ||
      "";

    const fullName =
      [
        firstName,
        lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return {
      name:
        fullName ||
        member.login_id ||
        "Member",

      login_id:
        member.login_id ||
        "",

      membership_type:
        member.membership_type ||
        "",

      amount:
        roundMoney(
          normalizeAmount(
            member.amount
          )
        ),
    };
  };

/* =========================
   LOAD ROYALTY NETWORK
========================= */

const loadRoyaltyNetwork =
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

    const directMembers =
      await findDirectRoyaltyMembers(
        referralId,
        connection
      );

    const directReferralIds =
      await findDirectRoyaltyReferralIds(
        referralId,
        connection
      );

    const indirectMembers =
      await findIndirectRoyaltyMembers(
        directReferralIds,
        connection
      );

    return {
      directMembers,
      indirectMembers,
    };
  };

/* =========================
   CREATE ROYALTY RESPONSE
========================= */

const createRoyaltyResponse =
  (
    owner,
    directMembers,
    indirectMembers
  ) => {
    const approvedDirectMembers =
      (
        Array.isArray(
          directMembers
        )
          ? directMembers
          : []
      )
        .filter(
          isApprovedPaidMember
        )
        .map(
          createDirectRoyaltyMember
        );

    const approvedIndirectMembers =
      (
        Array.isArray(
          indirectMembers
        )
          ? indirectMembers
          : []
      ).filter(
        isApprovedPaidMember
      );

    const totalDirectAmount =
      roundMoney(
        approvedDirectMembers.reduce(
          (
            total,
            member
          ) =>
            total +
            normalizeAmount(
              member.amount
            ),
          0
        )
      );

    const totalIndirectAmount =
      roundMoney(
        approvedIndirectMembers.reduce(
          (
            total,
            member
          ) =>
            total +
            normalizeAmount(
              member.amount
            ),
          0
        )
      );

    const networkRoyalty =
      calculateRoyalty(
        totalDirectAmount
      );

    const businessRoyalty =
      calculateRoyalty(
        totalIndirectAmount
      );

    return {
      login_id:
        owner.login_id,

      royalty_pct:
        ROYALTY_PCT,

      network_members:
        approvedDirectMembers,

      total_direct_amount:
        totalDirectAmount,

      network_royalty:
        networkRoyalty,

      indirect_count:
        approvedIndirectMembers
          .length,

      total_indirect_amount:
        totalIndirectAmount,

      business_royalty:
        businessRoyalty,

      total_royalty:
        roundMoney(
          networkRoyalty +
          businessRoyalty
        ),
    };
  };

/* =========================
   PRIVATE MEMBER ROYALTY
========================= */

const getMemberRoyalty =
  async (
    memberId,
    connection =
      null
  ) => {
    const owner =
      await requireRoyaltyOwnerById(
        memberId,
        connection
      );

    const {
      directMembers,
      indirectMembers,
    } =
      await loadRoyaltyNetwork(
        owner,
        connection
      );

    return {
      owner:
        toSafeRoyaltyOwner(
          owner
        ),

      royalty:
        createRoyaltyResponse(
          owner,
          directMembers,
          indirectMembers
        ),
    };
  };

/* =========================
   PUBLIC MEMBER ROYALTY
========================= */

const getPublicRoyalty =
  async (
    loginId,
    connection =
      null
  ) => {
    const owner =
      await requireRoyaltyOwnerByLoginId(
        loginId,
        connection
      );

    const {
      directMembers,
      indirectMembers,
    } =
      await loadRoyaltyNetwork(
        owner,
        connection
      );

    return createRoyaltyResponse(
      owner,
      directMembers,
      indirectMembers
    );
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  ROYALTY_PCT,
  normalizeStatus,
  isApproved,
  normalizeAmount,
  roundMoney,
  calculateRoyalty,
  isApprovedPaidMember,
  requireRoyaltyOwnerById,
  requireRoyaltyOwnerByLoginId,
  createDirectRoyaltyMember,
  loadRoyaltyNetwork,
  createRoyaltyResponse,
  getMemberRoyalty,
  getPublicRoyalty,
};