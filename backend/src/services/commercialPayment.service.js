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
  COMMERCIAL_BASIC_AMOUNT,

  COMMERCIAL_PROFILE_UPGRADE_AMOUNT,

  normalizeMemberId,

  findCommercialPaymentMemberById,

  lockCommercialPaymentMemberById,

  updateCommercialPaymentSubmissionById,

  approveCommercialPaymentById,

  rejectCommercialPaymentById,

  markCommercialPaymentPendingById,

  clearCommercialPaymentById,

  isCommercialKycSectionsComplete,

  inferCommercialPaymentPlan,

  toSafeCommercialPaymentMember,

  withCommercialPaymentTransaction,
} =
  require(
    "../repositories/commercialPayment.repository"
  );

const {
  getCommercialPaymentPlan,

  normalizePlanId,
} =
  require(
    "../validators/commercialPayment.validator"
  );

/* =========================================================
   COMMERCIAL PAYMENT STORAGE

   IMPORTANT:
   Payment Proof = PRIVATE

   Public Profile-ல் expose ஆகாது.
========================================================= */

const COMMERCIAL_PAYMENT_PRIVATE_DIRECTORY =
  path.resolve(
    process.cwd(),

    "storage",

    "private",

    "commercial-payment"
  );

const COMMERCIAL_PAYMENT_PRIVATE_PREFIX =
  "private/commercial-payment/";

/* =========================================================
   PAYMENT PROOF TYPES
========================================================= */

const PAYMENT_PROOF_MIME_EXTENSIONS =
  Object.freeze({
    "image/jpeg":
      ".jpg",

    "image/png":
      ".png",

    "image/webp":
      ".webp",

    "application/pdf":
      ".pdf",
  });

const ALLOWED_PAYMENT_PROOF_EXTENSIONS =
  new Set([
    ".jpg",

    ".jpeg",

    ".png",

    ".webp",

    ".pdf",
  ]);

/* =========================================================
   PROFILE UPGRADE PAYMENT

   ₹1500 payment allowed only after:

   A-G complete
   +
   KYC submitted / under_review / approved
========================================================= */

const PROFILE_UPGRADE_PAYMENT_KYC_STATUSES =
  new Set([
    "submitted",

    "under_review",

    "approved",
  ]);

/* =========================================================
   HELPERS
========================================================= */

const toText =
  (
    value,

    fallback = ""
  ) => {
    const text =
      String(
        value ??
          ""
      ).trim();

    return (
      text ||
      fallback
    );
  };

/* =========================================================
   AFFECTED ROWS
========================================================= */

const getAffectedRows =
  (
    result
  ) => {
    return Number(
      result
        ?.affectedRows ??

      result
        ?.[0]
        ?.affectedRows ??

      0
    );
  };

/* =========================================================
   NORMALIZE STATUS
========================================================= */

const normalizePaymentStatus =
  (
    value
  ) => {
    return toText(
      value,

      "pending"
    ).toLowerCase();
  };

/* =========================================================
   ERROR
========================================================= */

const createCommercialPaymentError =
  (
    statusCode,

    message,

    code,

    {
      errors = [],

      details = null,
    } = {}
  ) => {
    const error =
      new ApiError(
        statusCode,

        message,

        errors
      );

    error.code =
      code;

    error.errorCode =
      code;

    if (
      details
    ) {
      error.details =
        details;
    }

    return error;
  };

/* =========================================================
   PAYMENT PROOF EXTENSION
========================================================= */

const getPaymentProofExtension =
  (
    file
  ) => {
    const originalExtension =
      path.extname(
        toText(
          file
            ?.originalFilename
        )
      ).toLowerCase();

    if (
      ALLOWED_PAYMENT_PROOF_EXTENSIONS
        .has(
          originalExtension
        )
    ) {
      return (
        originalExtension ===
        ".jpeg"
          ? ".jpg"
          : originalExtension
      );
    }

    return (
      PAYMENT_PROOF_MIME_EXTENSIONS[
        toText(
          file
            ?.mimetype
        ).toLowerCase()
      ] ||
      null
    );
  };

/* =========================================================
   SAFE FILE DELETE
========================================================= */

const removeFileSafely =
  async (
    filePath
  ) => {
    if (
      !filePath
    ) {
      return;
    }

    try {
      await fs.unlink(
        filePath
      );
    } catch (
      error
    ) {
      if (
        error?.code !==
        "ENOENT"
      ) {
        console.error(
          "Commercial payment file cleanup failed:",

          error.message
        );
      }
    }
  };

/* =========================================================
   PRIVATE STORAGE KEY CHECK
========================================================= */

const isCommercialPaymentPrivateKey =
  (
    value
  ) => {
    const key =
      toText(
        value
      )
        .replace(
          /\\/g,

          "/"
        );

    return (
      key.startsWith(
        COMMERCIAL_PAYMENT_PRIVATE_PREFIX
      ) &&

      !key.includes(
        ".."
      )
    );
  };

/* =========================================================
   PRIVATE STORAGE KEY -> FILE PATH
========================================================= */

const resolveCommercialPaymentPrivatePath =
  (
    storageKey
  ) => {
    if (
      !isCommercialPaymentPrivateKey(
        storageKey
      )
    ) {
      return null;
    }

    const relativePath =
      toText(
        storageKey
      )
        .replace(
          /\\/g,

          "/"
        )
        .slice(
          COMMERCIAL_PAYMENT_PRIVATE_PREFIX
            .length
        );

    const resolvedPath =
      path.resolve(
        COMMERCIAL_PAYMENT_PRIVATE_DIRECTORY,

        relativePath
      );

    const root =
      path.resolve(
        COMMERCIAL_PAYMENT_PRIVATE_DIRECTORY
      );

    if (
      resolvedPath !==
        root &&

      !resolvedPath.startsWith(
        `${root}${path.sep}`
      )
    ) {
      return null;
    }

    return resolvedPath;
  };

/* =========================================================
   STORE COMMERCIAL PAYMENT PROOF
========================================================= */

const storeCommercialPaymentProof =
  async (
    memberId,

    paymentFile
  ) => {
    if (
      !paymentFile ||

      !paymentFile.filepath
    ) {
      return null;
    }

    const extension =
      getPaymentProofExtension(
        paymentFile
      );

    if (
      !extension
    ) {
      await removeFileSafely(
        paymentFile.filepath
      );

      throw createCommercialPaymentError(
        415,

        "Payment proof must be JPG, PNG, WEBP or PDF.",

        "COMMERCIAL_PAYMENT_INVALID_PROOF_TYPE"
      );
    }

    await fs.mkdir(
      COMMERCIAL_PAYMENT_PRIVATE_DIRECTORY,

      {
        recursive:
          true,
      }
    );

    const filename =
      [
        "commercial_payment",

        memberId,

        Date.now(),

        crypto
          .randomBytes(
            12
          )
          .toString(
            "hex"
          ),
      ].join(
        "_"
      ) +
      extension;

    const destinationPath =
      path.join(
        COMMERCIAL_PAYMENT_PRIVATE_DIRECTORY,

        filename
      );

    try {
      await fs.copyFile(
        paymentFile.filepath,

        destinationPath
      );

      await removeFileSafely(
        paymentFile.filepath
      );
    } catch (
      error
    ) {
      await removeFileSafely(
        paymentFile.filepath
      );

      await removeFileSafely(
        destinationPath
      );

      throw error;
    }

    return {
      filename,

      storageKey:
        `${COMMERCIAL_PAYMENT_PRIVATE_PREFIX}${filename}`,

      absolutePath:
        destinationPath,
    };
  };

/* =========================================================
   RESOLVE PLAN

   Frontend amount trusted கிடையாது.

   basic
      ₹300

   profile_upgrade
      ₹1500
========================================================= */

const resolveCommercialPaymentPlan =
  (
    paymentData = {}
  ) => {
    const planId =
      normalizePlanId(
        paymentData
          .plan_id ??

        paymentData
          .planId ??

        paymentData
          .plan
      );

    const plan =
      getCommercialPaymentPlan(
        planId
      );

    if (
      !plan
    ) {
      throw createCommercialPaymentError(
        422,

        "Select a valid Commercial Membership plan before payment.",

        "COMMERCIAL_PAYMENT_PLAN_REQUIRED"
      );
    }

    const amount =
      Number(
        paymentData.amount
      );

    if (
      !Number.isFinite(
        amount
      ) ||

      amount !==
        Number(
          plan.amount
        )
    ) {
      throw createCommercialPaymentError(
        422,

        `Payment amount for ${plan.name} must be ₹${plan.amount}.`,

        "COMMERCIAL_PAYMENT_AMOUNT_MISMATCH"
      );
    }

    return plan;
  };

/* =========================================================
   GET COMMERCIAL MEMBER OR THROW
========================================================= */

const getCommercialPaymentMemberOrThrow =
  async (
    memberId,

    connection =
      null,

    {
      lock = false,
    } = {}
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      throw createCommercialPaymentError(
        401,

        "Authentication required.",

        "COMMERCIAL_PAYMENT_AUTH_REQUIRED"
      );
    }

    const member =
      lock
        ? await lockCommercialPaymentMemberById(
            normalizedMemberId,

            connection
          )

        : await findCommercialPaymentMemberById(
            normalizedMemberId,

            connection
          );

    if (
      !member
    ) {
      throw createCommercialPaymentError(
        404,

        "Commercial member account not found.",

        "COMMERCIAL_PAYMENT_MEMBER_NOT_FOUND"
      );
    }

    return member;
  };

/* =========================================================
   ₹1500 PROFILE UPGRADE KYC CHECK
========================================================= */

const assertProfileUpgradePaymentEligibility =
  (
    member
  ) => {
    const allSectionsComplete =
      isCommercialKycSectionsComplete(
        member
      );

    if (
      !allSectionsComplete
    ) {
      throw createCommercialPaymentError(
        422,

        "Complete Commercial KYC sections A-G before the ₹1500 Profile Upgrade payment.",

        "COMMERCIAL_KYC_INCOMPLETE_FOR_PAYMENT"
      );
    }

    const kycStatus =
      normalizePaymentStatus(
        member
          .commercial_kyc_status ||

        "draft"
      );

    if (
      !PROFILE_UPGRADE_PAYMENT_KYC_STATUSES
        .has(
          kycStatus
        )
    ) {
      throw createCommercialPaymentError(
        422,

        "Submit Commercial KYC before the ₹1500 Profile Upgrade payment.",

        "COMMERCIAL_KYC_NOT_SUBMITTED_FOR_PAYMENT",

        {
          details: {
            commercialKycStatus:
              kycStatus,
          },
        }
      );
    }

    return true;
  };

/* =========================================================
   PAYMENT ELIGIBILITY
========================================================= */

const assertCommercialPaymentEligibility =
  (
    member,

    plan
  ) => {
    if (
      !member ||

      !plan
    ) {
      throw createCommercialPaymentError(
        422,

        "Commercial payment eligibility could not be verified.",

        "COMMERCIAL_PAYMENT_ELIGIBILITY_FAILED"
      );
    }

    /* =========================
       ₹1500
    ========================= */

    if (
      plan.id ===
      "profile_upgrade"
    ) {
      assertProfileUpgradePaymentEligibility(
        member
      );
    }

    const existingAmount =
      Number(
        member.amount
      );

    const existingStatus =
      normalizePaymentStatus(
        member
          .payment_status
      );

    /* =====================================================
       SAME APPROVED PLAN CANNOT PAY AGAIN

       ₹300 approved → ₹1500 upgrade allowed.
    ===================================================== */

    if (
      existingStatus ===
        "approved" &&

      Number.isFinite(
        existingAmount
      ) &&

      existingAmount ===
        Number(
          plan.amount
        )
    ) {
      throw createCommercialPaymentError(
        409,

        `${plan.name} payment has already been approved.`,

        "COMMERCIAL_PAYMENT_ALREADY_APPROVED"
      );
    }

    /* =====================================================
       ₹1500 APPROVED -> ₹300 DOWNGRADE NOT ALLOWED
    ===================================================== */

    if (
      existingStatus ===
        "approved" &&

      existingAmount ===
        COMMERCIAL_PROFILE_UPGRADE_AMOUNT &&

      Number(
        plan.amount
      ) ===
        COMMERCIAL_BASIC_AMOUNT
    ) {
      throw createCommercialPaymentError(
        409,

        "An approved Profile Upgrade cannot be changed to Basic Membership.",

        "COMMERCIAL_PAYMENT_DOWNGRADE_NOT_ALLOWED"
      );
    }

    return true;
  };

/* =========================================================
   SAFE PAYMENT RESPONSE
========================================================= */

const createCommercialPaymentResponse =
  (
    member
  ) => {
    const payment =
      toSafeCommercialPaymentMember(
        member
      );

    if (
      !payment
    ) {
      return null;
    }

    const plan =
      payment.plan ||

      inferCommercialPaymentPlan(
        payment.amount
      );

    const status =
      normalizePaymentStatus(
        payment
          .payment_status
      );

    const proofAvailable =
      Boolean(
        payment
          .payment_proof
      );

    /* =====================================================
       ₹1500 PROFILE UPGRADE ACTIVE

       Both:

       Payment Approved
       +
       Commercial KYC Approved
    ===================================================== */

    const profileUpgradeActive =
      Boolean(
        plan?.id ===
          "profile_upgrade" &&

        status ===
          "approved" &&

        payment
          .commercial_kyc_status ===
          "approved"
      );

    /* =====================================================
       ₹300 BASIC ACTIVE
    ===================================================== */

    const basicMembershipActive =
      Boolean(
        plan?.id ===
          "basic" &&

        status ===
          "approved"
      );

    return {
      ...payment,

      plan,

      currency:
        "INR",

      payment_proof_available:
        proofAvailable,

      /*
        Payment Proof PRIVATE.

        Public URL intentionally இல்லை.

        Later protected Owner/Admin endpoint
        மூலமாக மட்டும் access பண்ணுவோம்.
      */

      payment_proof_url:
        null,

      basic_membership_active:
        basicMembershipActive,

      profile_upgrade_active:
        profileUpgradeActive,

      activation_ready:
        Boolean(
          basicMembershipActive ||

          profileUpgradeActive
        ),
    };
  };

/* =========================================================
   GET COMMERCIAL PAYMENT
========================================================= */

const getCommercialPayment =
  async (
    memberId,

    connection =
      null
  ) => {
    const member =
      await getCommercialPaymentMemberOrThrow(
        memberId,

        connection
      );

    return createCommercialPaymentResponse(
      member
    );
  };

/* =========================================================
   GET PAYMENT STATUS
========================================================= */

const getCommercialPaymentStatus =
  async (
    memberId,

    connection =
      null
  ) => {
    const payment =
      await getCommercialPayment(
        memberId,

        connection
      );

    return {
      member_id:
        payment.id,

      login_id:
        payment.login_id,

      plan:
        payment.plan,

      amount:
        payment.amount,

      currency:
        "INR",

      payment_status:
        payment
          .payment_status,

      payment_submitted:
        payment
          .payment_submitted,

      payment_approved:
        payment
          .payment_approved,

      payment_rejected:
        payment
          .payment_rejected,

      payment_method:
        payment
          .payment_method,

      transaction_id:
        payment
          .transaction_id,

      payment_proof_available:
        payment
          .payment_proof_available,

      commercial_kyc_status:
        payment
          .commercial_kyc_status,

      commercial_kyc_complete:
        payment
          .commercial_kyc_complete,

      basic_membership_active:
        payment
          .basic_membership_active,

      profile_upgrade_active:
        payment
          .profile_upgrade_active,

      activation_ready:
        payment
          .activation_ready,
    };
  };

/* =========================================================
   SUBMIT COMMERCIAL PAYMENT
========================================================= */

const submitCommercialPayment =
  async (
    memberId,

    paymentData = {},

    paymentFile =
      null
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      await removeFileSafely(
        paymentFile
          ?.filepath
      );

      throw createCommercialPaymentError(
        401,

        "Authentication required.",

        "COMMERCIAL_PAYMENT_AUTH_REQUIRED"
      );
    }

    let storedProof =
      null;

    let oldProofToDelete =
      null;

    try {
      const plan =
        resolveCommercialPaymentPlan(
          paymentData
        );

      /* ===================================================
         STORE NEW PROOF

         File I/O DB transactionக்கு வெளியே.
      =================================================== */

      if (
        paymentFile &&

        paymentFile
          .filepath
      ) {
        storedProof =
          await storeCommercialPaymentProof(
            normalizedMemberId,

            paymentFile
          );
      }

      /* ===================================================
         DATABASE TRANSACTION
      =================================================== */

      const transactionResult =
        await withCommercialPaymentTransaction(
          async (
            connection
          ) => {
            /* =========================
               LOCK MEMBER ROW
            ========================= */

            const member =
              await getCommercialPaymentMemberOrThrow(
                normalizedMemberId,

                connection,

                {
                  lock:
                    true,
                }
              );

            /* =========================
               VERIFY ELIGIBILITY
            ========================= */

            assertCommercialPaymentEligibility(
              member,

              plan
            );

            const existingProof =
              toText(
                member
                  .payment_proof
              ) ||
              null;

            /* =================================================
               NO NEW PROOF?

               Existing proof preserve ஆகும்.
            ================================================= */

            const paymentProof =
              storedProof
                ?.storageKey ||

              existingProof;

            /* =========================
               UPDATE PAYMENT
            ========================= */

            const updateResult =
              await updateCommercialPaymentSubmissionById(
                normalizedMemberId,

                {
                  transaction_id:
                    paymentData
                      .transaction_id ||
                    null,

                  payment_method:
                    paymentData
                      .payment_method ||
                    null,

                  amount:
                    Number(
                      plan.amount
                    ),

                  payment_proof:
                    paymentProof,
                },

                connection
              );

            if (
              getAffectedRows(
                updateResult
              ) === 0
            ) {
              throw createCommercialPaymentError(
                404,

                "Commercial member account could not be updated.",

                "COMMERCIAL_PAYMENT_UPDATE_FAILED"
              );
            }

            const updatedMember =
              await findCommercialPaymentMemberById(
                normalizedMemberId,

                connection
              );

            if (
              !updatedMember
            ) {
              throw createCommercialPaymentError(
                404,

                "Commercial member account not found after payment submission.",

                "COMMERCIAL_PAYMENT_MEMBER_NOT_FOUND"
              );
            }

            /* =================================================
               NEW PROOF SUCCESSFULLY SAVED?

               Commit முடிந்த பிறகு old proof delete.
            ================================================= */

            if (
              storedProof &&

              existingProof &&

              existingProof !==
                storedProof
                  .storageKey
            ) {
              oldProofToDelete =
                existingProof;
            }

            return {
              member:
                updatedMember,

              plan,
            };
          }
        );

      /* ===================================================
         TRANSACTION COMMITTED

         OLD PRIVATE PROOF DELETE
      =================================================== */

      if (
        oldProofToDelete
      ) {
        const oldProofPath =
          resolveCommercialPaymentPrivatePath(
            oldProofToDelete
          );

        if (
          oldProofPath
        ) {
          await removeFileSafely(
            oldProofPath
          );
        }
      }

      const payment =
        createCommercialPaymentResponse(
          transactionResult
            .member
        );

      return {
        payment,

        selectedPlan:
          transactionResult
            .plan,

        paymentStatus:
          "pending",

        nextAction: {
          type:
            "NAVIGATE",

          path:
            "/commercial-payment-pending",
        },

        message:
          `${transactionResult.plan.name} payment submitted successfully and is pending approval.`,
      };
    } catch (
      error
    ) {
      /* ===================================================
         TEMP FILE CLEAN
      =================================================== */

      await removeFileSafely(
        paymentFile
          ?.filepath
      );

      /* ===================================================
         DB FAILURE -> NEW PRIVATE PROOF CLEAN
      =================================================== */

      if (
        storedProof
          ?.absolutePath
      ) {
        await removeFileSafely(
          storedProof
            .absolutePath
        );
      }

      throw error;
    }
  };

/* =========================================================
   ADMIN - APPROVE COMMERCIAL PAYMENT
========================================================= */

const approveCommercialPayment =
  async (
    memberId
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      throw createCommercialPaymentError(
        400,

        "Valid Commercial member ID is required.",

        "INVALID_COMMERCIAL_MEMBER_ID"
      );
    }

    return withCommercialPaymentTransaction(
      async (
        connection
      ) => {
        const member =
          await getCommercialPaymentMemberOrThrow(
            normalizedMemberId,

            connection,

            {
              lock:
                true,
            }
          );

        const plan =
          inferCommercialPaymentPlan(
            member.amount
          );

        if (
          !plan
        ) {
          throw createCommercialPaymentError(
            422,

            "Commercial payment details have not been submitted.",

            "COMMERCIAL_PAYMENT_NOT_SUBMITTED"
          );
        }

        /* =================================================
           ₹1500

           KYC must still be valid before payment approval.
        ================================================= */

        if (
          plan.id ===
          "profile_upgrade"
        ) {
          assertProfileUpgradePaymentEligibility(
            member
          );
        }

        const currentStatus =
          normalizePaymentStatus(
            member
              .payment_status
          );

        if (
          currentStatus ===
          "approved"
        ) {
          throw createCommercialPaymentError(
            409,

            "Commercial payment is already approved.",

            "COMMERCIAL_PAYMENT_ALREADY_APPROVED"
          );
        }

        const updateResult =
          await approveCommercialPaymentById(
            normalizedMemberId,

            connection
          );

        if (
          getAffectedRows(
            updateResult
          ) === 0
        ) {
          throw createCommercialPaymentError(
            404,

            "Commercial payment could not be approved.",

            "COMMERCIAL_PAYMENT_APPROVAL_FAILED"
          );
        }

        const updatedMember =
          await findCommercialPaymentMemberById(
            normalizedMemberId,

            connection
          );

        return {
          payment:
            createCommercialPaymentResponse(
              updatedMember
            ),

          message:
            "Commercial payment approved successfully.",
        };
      }
    );
  };

/* =========================================================
   ADMIN - REJECT COMMERCIAL PAYMENT
========================================================= */

const rejectCommercialPayment =
  async (
    memberId
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      throw createCommercialPaymentError(
        400,

        "Valid Commercial member ID is required.",

        "INVALID_COMMERCIAL_MEMBER_ID"
      );
    }

    return withCommercialPaymentTransaction(
      async (
        connection
      ) => {
        const member =
          await getCommercialPaymentMemberOrThrow(
            normalizedMemberId,

            connection,

            {
              lock:
                true,
            }
          );

        const plan =
          inferCommercialPaymentPlan(
            member.amount
          );

        if (
          !plan
        ) {
          throw createCommercialPaymentError(
            422,

            "Commercial payment details have not been submitted.",

            "COMMERCIAL_PAYMENT_NOT_SUBMITTED"
          );
        }

        const currentStatus =
          normalizePaymentStatus(
            member
              .payment_status
          );

        if (
          currentStatus ===
          "rejected"
        ) {
          throw createCommercialPaymentError(
            409,

            "Commercial payment is already rejected.",

            "COMMERCIAL_PAYMENT_ALREADY_REJECTED"
          );
        }

        const updateResult =
          await rejectCommercialPaymentById(
            normalizedMemberId,

            connection
          );

        if (
          getAffectedRows(
            updateResult
          ) === 0
        ) {
          throw createCommercialPaymentError(
            404,

            "Commercial payment could not be rejected.",

            "COMMERCIAL_PAYMENT_REJECTION_FAILED"
          );
        }

        const updatedMember =
          await findCommercialPaymentMemberById(
            normalizedMemberId,

            connection
          );

        return {
          payment:
            createCommercialPaymentResponse(
              updatedMember
            ),

          message:
            "Commercial payment rejected successfully.",
        };
      }
    );
  };

/* =========================================================
   INTERNAL - MARK PAYMENT PENDING
========================================================= */

const markCommercialPaymentPending =
  async (
    memberId
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      throw createCommercialPaymentError(
        400,

        "Valid Commercial member ID is required.",

        "INVALID_COMMERCIAL_MEMBER_ID"
      );
    }

    const updateResult =
      await markCommercialPaymentPendingById(
        normalizedMemberId
      );

    if (
      getAffectedRows(
        updateResult
      ) === 0
    ) {
      throw createCommercialPaymentError(
        404,

        "Commercial payment could not be marked pending.",

        "COMMERCIAL_PAYMENT_PENDING_UPDATE_FAILED"
      );
    }

    return getCommercialPayment(
      normalizedMemberId
    );
  };

/* =========================================================
   INTERNAL / ADMIN
   CLEAR COMMERCIAL PAYMENT
========================================================= */

const clearCommercialPayment =
  async (
    memberId
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      throw createCommercialPaymentError(
        400,

        "Valid Commercial member ID is required.",

        "INVALID_COMMERCIAL_MEMBER_ID"
      );
    }

    const member =
      await getCommercialPaymentMemberOrThrow(
        normalizedMemberId
      );

    const oldProof =
      member
        .payment_proof ||
      null;

    const updateResult =
      await clearCommercialPaymentById(
        normalizedMemberId
      );

    if (
      getAffectedRows(
        updateResult
      ) === 0
    ) {
      throw createCommercialPaymentError(
        404,

        "Commercial payment could not be cleared.",

        "COMMERCIAL_PAYMENT_CLEAR_FAILED"
      );
    }

    const oldProofPath =
      resolveCommercialPaymentPrivatePath(
        oldProof
      );

    if (
      oldProofPath
    ) {
      await removeFileSafely(
        oldProofPath
      );
    }

    return getCommercialPayment(
      normalizedMemberId
    );
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  COMMERCIAL_PAYMENT_PRIVATE_DIRECTORY,

  COMMERCIAL_PAYMENT_PRIVATE_PREFIX,

  PROFILE_UPGRADE_PAYMENT_KYC_STATUSES,

  getAffectedRows,

  getPaymentProofExtension,

  removeFileSafely,

  isCommercialPaymentPrivateKey,

  resolveCommercialPaymentPrivatePath,

  storeCommercialPaymentProof,

  resolveCommercialPaymentPlan,

  getCommercialPaymentMemberOrThrow,

  assertProfileUpgradePaymentEligibility,

  assertCommercialPaymentEligibility,

  createCommercialPaymentResponse,

  getCommercialPayment,

  getCommercialPaymentStatus,

  submitCommercialPayment,

  approveCommercialPayment,

  rejectCommercialPayment,

  markCommercialPaymentPending,

  clearCommercialPayment,
};