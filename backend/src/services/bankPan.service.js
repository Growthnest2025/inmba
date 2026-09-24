const ApiError =
  require(
    "../utils/apiError"
  );

const {
  normalizeMemberId,
  normalizeToken,
  findBankPanMemberById,
  findBankPanMemberByToken,
  updateBankDetailsById,
  findDuplicatePanNumber,
  updatePanDetailsById,
  toSafeBankPanMember,
} = require(
  "../repositories/bankPan.repository"
);

/* =========================
   GET MEMBER BY ID
========================= */

const requireMemberById =
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

    const member =
      await findBankPanMemberById(
        normalizedMemberId,
        connection
      );

    if (!member) {
      throw new ApiError(
        404,
        "Member account not found."
      );
    }

    return member;
  };

/* =========================
   GET MEMBER BY TOKEN
========================= */

const requireMemberByToken =
  async (
    token,
    connection =
      null
  ) => {
    const normalizedToken =
      normalizeToken(
        token
      );

    if (
      !normalizedToken
    ) {
      throw new ApiError(
        400,
        "Member token is required."
      );
    }

    const member =
      await findBankPanMemberByToken(
        normalizedToken,
        connection
      );

    if (!member) {
      throw new ApiError(
        404,
        "Invalid member token."
      );
    }

    return member;
  };

/* =========================
   GET BANK DETAILS
========================= */

const getBankDetails =
  async (
    memberId,
    connection =
      null
  ) => {
    const member =
      await requireMemberById(
        memberId,
        connection
      );

    const safeMember =
      toSafeBankPanMember(
        member
      );

    return {
      member: {
        id:
          safeMember.id,

        login_id:
          safeMember
            .login_id,

        full_name:
          safeMember
            .full_name,

        email:
          safeMember.email,

        phone:
          safeMember.phone,
      },

      bank_details: {
        account_holder:
          safeMember
            .account_holder,

        bank_name:
          safeMember
            .bank_name,

        account_number:
          safeMember
            .account_number,

        ifsc:
          safeMember.ifsc,
      },

      bank_details_completed:
        Boolean(
          safeMember
            .account_holder &&
          safeMember
            .bank_name &&
          safeMember
            .account_number &&
          safeMember.ifsc
        ),
    };
  };

/* =========================
   SAVE BANK DETAILS
========================= */

const saveBankDetails =
  async (
    memberId,
    bankDetails,
    connection =
      null
  ) => {
    const member =
      await requireMemberById(
        memberId,
        connection
      );

    await updateBankDetailsById(
      member.id,
      bankDetails,
      connection
    );

    const updatedMember =
      await findBankPanMemberById(
        member.id,
        connection
      );

    const safeMember =
      toSafeBankPanMember(
        updatedMember
      );

    const redirectTo =
      `/legal_entity/${encodeURIComponent(
        member.token
      )}`;

    return {
      bank_details: {
        account_holder:
          safeMember
            .account_holder,

        bank_name:
          safeMember
            .bank_name,

        account_number:
          safeMember
            .account_number,

        ifsc:
          safeMember.ifsc,
      },

      bank_details_completed:
        true,

      redirectTo,

      nextAction: {
        type:
          "NAVIGATE",

        path:
          redirectTo,
      },
    };
  };

/* =========================
   GET BANK BY TOKEN
========================= */

const getBankDetailsByToken =
  async (
    token,
    connection =
      null
  ) => {
    const member =
      await requireMemberByToken(
        token,
        connection
      );

    const safeMember =
      toSafeBankPanMember(
        member
      );

    return {
      member: {
        login_id:
          safeMember
            .login_id,

        full_name:
          safeMember
            .full_name,
      },

      bank_details: {
        account_holder:
          safeMember
            .account_holder,

        bank_name:
          safeMember
            .bank_name,

        account_number:
          safeMember
            .account_number,

        ifsc:
          safeMember.ifsc,
      },
    };
  };

/* =========================
   SAVE BANK BY TOKEN
========================= */

const saveBankDetailsByToken =
  async (
    token,
    bankDetails,
    connection =
      null
  ) => {
    const member =
      await requireMemberByToken(
        token,
        connection
      );

    return saveBankDetails(
      member.id,
      bankDetails,
      connection
    );
  };

/* =========================
   GET PAN DETAILS
========================= */

const getPanDetails =
  async (
    memberId,
    connection =
      null
  ) => {
    const member =
      await requireMemberById(
        memberId,
        connection
      );

    const safeMember =
      toSafeBankPanMember(
        member
      );

    return {
      member: {
        id:
          safeMember.id,

        login_id:
          safeMember
            .login_id,

        full_name:
          safeMember
            .full_name,
      },

      pan_details: {
        pan_number:
          safeMember
            .pan_number,

        pan_name:
          safeMember
            .pan_name,
      },

      pan_details_completed:
        Boolean(
          safeMember
            .pan_number &&
          safeMember
            .pan_name
        ),
    };
  };

/* =========================
   SAVE PAN DETAILS
========================= */

const savePanDetails =
  async (
    memberId,
    panDetails,
    connection =
      null
  ) => {
    const member =
      await requireMemberById(
        memberId,
        connection
      );

    const duplicatePan =
      await findDuplicatePanNumber(
        panDetails
          .pan_number,
        member.id,
        connection
      );

    if (
      duplicatePan
    ) {
      throw new ApiError(
        409,
        "This PAN number is already registered."
      );
    }

    await updatePanDetailsById(
      member.id,
      panDetails,
      connection
    );

    const updatedMember =
      await findBankPanMemberById(
        member.id,
        connection
      );

    const safeMember =
      toSafeBankPanMember(
        updatedMember
      );

    const redirectTo =
      `/profile_picture/${encodeURIComponent(
        member.token
      )}`;

    return {
      pan_details: {
        pan_number:
          safeMember
            .pan_number,

        pan_name:
          safeMember
            .pan_name,
      },

      pan_details_completed:
        true,

      redirectTo,

      nextAction: {
        type:
          "NAVIGATE",

        path:
          redirectTo,
      },
    };
  };

/* =========================
   GET PAN BY TOKEN
========================= */

const getPanDetailsByToken =
  async (
    token,
    connection =
      null
  ) => {
    const member =
      await requireMemberByToken(
        token,
        connection
      );

    const safeMember =
      toSafeBankPanMember(
        member
      );

    return {
      member: {
        login_id:
          safeMember
            .login_id,

        full_name:
          safeMember
            .full_name,
      },

      pan_details: {
        pan_number:
          safeMember
            .pan_number,

        pan_name:
          safeMember
            .pan_name,
      },
    };
  };

/* =========================
   SAVE PAN BY TOKEN
========================= */

const savePanDetailsByToken =
  async (
    token,
    panDetails,
    connection =
      null
  ) => {
    const member =
      await requireMemberByToken(
        token,
        connection
      );

    return savePanDetails(
      member.id,
      panDetails,
      connection
    );
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  requireMemberById,
  requireMemberByToken,
  getBankDetails,
  saveBankDetails,
  getBankDetailsByToken,
  saveBankDetailsByToken,
  getPanDetails,
  savePanDetails,
  getPanDetailsByToken,
  savePanDetailsByToken,
};