const crypto =
  require(
    "crypto"
  );

const fs =
  require(
    "fs/promises"
  );

const path =
  require(
    "path"
  );

const ApiError =
  require(
    "../utils/apiError"
  );

const {
  normalizeMemberId,

  findPaymentMemberById,

  findCivilianPlanByMemberId,

  updateMemberPaymentById,

  toSafePaymentMember,
} = require(
  "../repositories/payment.repository"
);

const PAYMENT_UPLOAD_DIRECTORY =
  path.resolve(
    process.cwd(),

    "storage",

    "uploads",

    "payment"
  );

/* =========================
   CIVILIAN PLAN
========================= */

const CIVILIAN_PLAN_AMOUNTS = {
  300: 300,
  1500: 1500,
};

/* =========================
   HELPERS
========================= */

const getAffectedRows =
  (
    result
  ) => {
    return Number(
      result?.affectedRows ??
        result?.[0]?.affectedRows ??
        0
    );
  };

const removeTrailingSlash =
  (
    value
  ) => {
    return String(
      value || ""
    ).replace(
      /\/+$/,
      ""
    );
  };

const getBackendBaseUrl =
  () => {
    return removeTrailingSlash(
      process.env.BACKEND_URL ||
        "http://127.0.0.1:5000"
    );
  };

const createPaymentProofUrl =
  (
    paymentProof
  ) => {
    if (!paymentProof) {
      return null;
    }

    const value =
      String(
        paymentProof
      ).trim();

    if (
      /^https?:\/\//i.test(
        value
      )
    ) {
      return value;
    }

    if (
      value.startsWith(
        "/uploads/"
      )
    ) {
      return (
        `${getBackendBaseUrl()}` +
        value
      );
    }

    return (
      `${getBackendBaseUrl()}` +
      `/uploads/payment/` +
      encodeURIComponent(
        path.basename(
          value
        )
      )
    );
  };

const getFileExtension =
  (
    file
  ) => {
    const originalExtension =
      path.extname(
        file?.originalFilename ||
          ""
      ).toLowerCase();

    const allowedExtensions =
      new Set([
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".pdf",
      ]);

    if (
      allowedExtensions.has(
        originalExtension
      )
    ) {
      return originalExtension === ".jpeg"
        ? ".jpg"
        : originalExtension;
    }

    const mimeExtensions = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "application/pdf": ".pdf",
    };

    return (
      mimeExtensions[
        file?.mimetype
      ] ||
      ".bin"
    );
  };

const removeFileSafely =
  async (
    filePath
  ) => {
    if (!filePath) {
      return;
    }

    try {
      await fs.unlink(
        filePath
      );
    } catch {
      // File may not exist.
    }
  };

/* =========================
   MEMBERSHIP TYPE
========================= */

const getMembershipInfo =
  (
    member
  ) => {
    const membershipType =
      String(
        member?.membership_type ||
          member?.membershipType ||
          member?.member_type ||
          ""
      )
        .trim()
        .toLowerCase();

    const isProfessional =
      membershipType.includes(
        "professional"
      );

    const isCommercial =
      membershipType.includes(
        "commercial"
      );

    /*
      Existing Civilian accounts may contain:
      - Civilian
      - Civilian Member
      - INMBA Member

      Anything which is not Professional
      or Commercial is treated as Civilian.
    */

    const isCivilian =
      !isProfessional &&
      !isCommercial;

    return {
      membershipType,
      isProfessional,
      isCommercial,
      isCivilian,
    };
  };

/* =========================
   CIVILIAN PAYMENT PLAN
========================= */

const getCivilianPaymentPlan =
  async (
    memberId,
    connection = null
  ) => {
    const civilianKyc =
      await findCivilianPlanByMemberId(
        memberId,
        connection
      );

    if (!civilianKyc) {
      return null;
    }

    const selectedPlan =
      String(
        civilianKyc.selected_plan ||
          ""
      ).trim();

    const amount =
      CIVILIAN_PLAN_AMOUNTS[
        selectedPlan
      ];

    return {
      ...civilianKyc,

      selected_plan:
        selectedPlan,

      amount:
        Number(
          amount || 0
        ),
    };
  };

/* =========================
   PAYMENT RESPONSE
========================= */

const createPaymentResponse =
  (
    member,
    overrides = {}
  ) => {
    const safeMember =
      toSafePaymentMember(
        member
      );

    if (!safeMember) {
      return null;
    }

    const finalMember = {
      ...safeMember,
      ...overrides,
    };

    return {
      ...finalMember,

      payment_proof_url:
        createPaymentProofUrl(
          finalMember.payment_proof
        ),

      payment_submitted:
        Boolean(
          finalMember.transaction_id ||
            finalMember.payment_method ||
            finalMember.payment_proof
        ),

      payment_approved:
        String(
          finalMember.payment_status ||
            ""
        )
          .trim()
          .toLowerCase() ===
        "approved",
    };
  };

/* =========================
   GET PAYMENT
========================= */

const getMemberPayment =
  async (
    memberId,
    connection = null
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (!normalizedMemberId) {
      throw new ApiError(
        401,
        "Authentication required."
      );
    }

    const member =
      await findPaymentMemberById(
        normalizedMemberId,
        connection
      );

    if (!member) {
      throw new ApiError(
        404,
        "Member account not found."
      );
    }

    const {
      isCivilian,
    } =
      getMembershipInfo(
        member
      );

    /* =====================
       PROFESSIONAL /
       COMMERCIAL
    ===================== */

    if (!isCivilian) {
      return createPaymentResponse(
        member
      );
    }

    /* =====================
       CIVILIAN
    ===================== */

    const civilianPlan =
      await getCivilianPaymentPlan(
        normalizedMemberId,
        connection
      );

    /*
      If Full KYC row is not created yet,
      return normal member payment data.
    */

    if (!civilianPlan) {
      return createPaymentResponse(
        member
      );
    }

    const selectedPlan =
      civilianPlan.selected_plan;

    const planAmount =
      civilianPlan.amount;

    return createPaymentResponse(
      member,
      {
        selected_plan:
          selectedPlan,

        selectedPlan,

        plan_selected_at:
          civilianPlan.plan_selected_at ||
          null,

        civilian_kyc_status:
          civilianPlan.status ||
          "",

        /*
          IMPORTANT:
          Payment amount is calculated
          from selected_plan.

          ₹300 -> 300
          ₹1500 -> 1500
        */
        amount:
          planAmount ||
          null,

        /*
          Civilian payment is one fixed
          membership-plan payment.

          Do NOT multiply by year.
        */
        subscription_year:
          "1",
      }
    );
  };

/* =========================
   SUBMIT PAYMENT
========================= */

const submitMemberPayment =
  async (
    memberId,
    paymentData,
    paymentFile = null,
    connection = null
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (!normalizedMemberId) {
      throw new ApiError(
        401,
        "Authentication required."
      );
    }

    const existingMember =
      await findPaymentMemberById(
        normalizedMemberId,
        connection
      );

    if (!existingMember) {
      await removeFileSafely(
        paymentFile?.filepath
      );

      throw new ApiError(
        404,
        "Member account not found."
      );
    }

    const {
      isCivilian,
    } =
      getMembershipInfo(
        existingMember
      );

    /*
      Start with request data.

      Professional / Commercial existing
      flow continues normally.
    */

    let finalPaymentData = {
      ...(paymentData || {}),
    };

    /* =====================================================
       CIVILIAN SECURITY

       NEVER trust frontend amount.

       Selected amount must come from:

       civilian_full_kyc.selected_plan

       300  -> ₹300
       1500 -> ₹1500
    ===================================================== */

    if (isCivilian) {
      const civilianPlan =
        await getCivilianPaymentPlan(
          normalizedMemberId,
          connection
        );

      if (!civilianPlan) {
        await removeFileSafely(
          paymentFile?.filepath
        );

        throw new ApiError(
          422,
          "Please select a Civilian membership plan before payment."
        );
      }

      const selectedPlan =
        String(
          civilianPlan.selected_plan ||
            ""
        ).trim();

      if (
        ![
          "300",
          "1500",
        ].includes(
          selectedPlan
        )
      ) {
        await removeFileSafely(
          paymentFile?.filepath
        );

        throw new ApiError(
          422,
          "Invalid Civilian membership plan."
        );
      }

      /* =========================
         FULL KYC CHECK
      ========================= */

      const civilianKycStatus =
        String(
          civilianPlan.status ||
            ""
        )
          .trim()
          .toLowerCase();

      if (
        ![
          "submitted",
          "approved",
        ].includes(
          civilianKycStatus
        )
      ) {
        await removeFileSafely(
          paymentFile?.filepath
        );

        throw new ApiError(
          422,
          "Please submit Civilian Full KYC before payment."
        );
      }

      /* =========================
         TRUSTED AMOUNT
      ========================= */

      const requiredAmount =
        Number(
          CIVILIAN_PLAN_AMOUNTS[
            selectedPlan
          ]
        );

      if (
        !Number.isFinite(
          requiredAmount
        ) ||
        requiredAmount <= 0
      ) {
        await removeFileSafely(
          paymentFile?.filepath
        );

        throw new ApiError(
          422,
          "Civilian plan amount is invalid."
        );
      }

      /*
        IMPORTANT:

        Whatever amount frontend sends,
        backend overwrites it here.

        Example:

        DB selected_plan = 300
        frontend amount = 1500

        Stored amount = 300
      */

      finalPaymentData = {
        ...finalPaymentData,

        amount:
          requiredAmount,

        subscription_year:
          "1",
      };
    }

    let newFilename =
      null;

    let destinationPath =
      null;

    try {
      /* =========================
         PAYMENT PROOF
      ========================= */

      if (
        paymentFile &&
        paymentFile.filepath
      ) {
        await fs.mkdir(
          PAYMENT_UPLOAD_DIRECTORY,
          {
            recursive: true,
          }
        );

        const extension =
          getFileExtension(
            paymentFile
          );

        newFilename =
          [
            "payment",
            normalizedMemberId,
            crypto
              .randomBytes(
                8
              )
              .toString(
                "hex"
              ),
          ].join("_") +
          extension;

        destinationPath =
          path.join(
            PAYMENT_UPLOAD_DIRECTORY,
            newFilename
          );

        await fs.copyFile(
          paymentFile.filepath,
          destinationPath
        );

        await removeFileSafely(
          paymentFile.filepath
        );
      }

      /* =========================
         UPDATE PAYMENT
      ========================= */

      const updateResult =
        await updateMemberPaymentById(
          normalizedMemberId,
          {
            ...finalPaymentData,

            payment_proof:
              newFilename,
          },
          connection
        );

      if (
        getAffectedRows(
          updateResult
        ) === 0
      ) {
        await removeFileSafely(
          destinationPath
        );

        throw new ApiError(
          404,
          "Member account not found."
        );
      }

      /* =========================
         REMOVE OLD PROOF
      ========================= */

      if (
        existingMember.payment_proof
      ) {
        const oldFilename =
          path.basename(
            existingMember.payment_proof
          );

        const oldPath =
          path.join(
            PAYMENT_UPLOAD_DIRECTORY,
            oldFilename
          );

        if (
          oldPath !==
          destinationPath
        ) {
          await removeFileSafely(
            oldPath
          );
        }
      }

      /* =========================
         GET UPDATED MEMBER
      ========================= */

      const updatedMember =
        await findPaymentMemberById(
          normalizedMemberId,
          connection
        );

      if (!updatedMember) {
        throw new ApiError(
          404,
          "Member account not found after payment update."
        );
      }

      /* =========================
         RESPONSE OVERRIDES
      ========================= */

      let responseOverrides =
        {};

      if (isCivilian) {
        const civilianPlan =
          await getCivilianPaymentPlan(
            normalizedMemberId,
            connection
          );

        responseOverrides = {
          selected_plan:
            civilianPlan?.selected_plan ||
            "",

          selectedPlan:
            civilianPlan?.selected_plan ||
            "",

          amount:
            civilianPlan?.amount ||
            updatedMember.amount ||
            null,

          subscription_year:
            "1",
        };
      }

      const payment =
        createPaymentResponse(
          updatedMember,
          responseOverrides
        );

      /* =========================
         TOKEN
      ========================= */

      const token =
        String(
          updatedMember.token ||
            ""
        ).trim();

      if (!token) {
        throw new ApiError(
          500,
          "Member flow token is missing."
        );
      }

      const {
        isCivilian:
          updatedIsCivilian,
      } =
        getMembershipInfo(
          updatedMember
        );

      /* =====================================================
         NEXT ROUTE

         CIVILIAN:
         Payment submitted
         -> Dashboard
         -> Waiting Admin Approval

         Professional / Commercial:
         Existing Bank flow remains.
      ===================================================== */

      const nextRoute =
        updatedIsCivilian
          ? "/dashboard"
          : `/bank_form/${encodeURIComponent(
              token
            )}`;

      return {
        payment,

        token,

        nextRoute,

        redirectTo:
          nextRoute,

        nextAction: {
          type:
            "NAVIGATE",

          path:
            nextRoute,
        },
      };
    } catch (error) {
      /*
        Delete temporary uploaded file
        when payment update fails.
      */

      await removeFileSafely(
        paymentFile?.filepath
      );

      if (
        destinationPath
      ) {
        await removeFileSafely(
          destinationPath
        );
      }

      throw error;
    }
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  PAYMENT_UPLOAD_DIRECTORY,

  CIVILIAN_PLAN_AMOUNTS,

  getAffectedRows,

  getBackendBaseUrl,

  createPaymentProofUrl,

  getFileExtension,

  removeFileSafely,

  getMembershipInfo,

  getCivilianPaymentPlan,

  createPaymentResponse,

  getMemberPayment,

  submitMemberPayment,
};