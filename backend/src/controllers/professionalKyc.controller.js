const professionalKycService =
  require(
    "../services/professionalKyc.service"
  );

/* =========================================================
   COMMON HELPERS
========================================================= */

const asObject = (
  value
) => {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
};

/* =========================================================
   TEXT NORMALIZER
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const normalized =
    String(
      value ?? ""
    ).trim();

  return (
    normalized ||
    fallback
  );
};

/* =========================================================
   BOOLEAN NORMALIZER
========================================================= */

const toBoolean = (
  value
) => {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
    "number"
  ) {
    return (
      value === 1
    );
  }

  const normalized =
    toText(
      value
    ).toLowerCase();

  return [
    "1",
    "true",
    "yes",
    "on",
    "completed",
    "complete",
    "save_and_next",
  ].includes(
    normalized
  );
};

/* =========================================================
   SAFE NUMBER
========================================================= */

const toPositiveInteger = (
  value
) => {
  const number =
    Number(
      value
    );

  if (
    !Number.isInteger(
      number
    ) ||
    number <= 0
  ) {
    return null;
  }

  return number;
};

/* =========================================================
   ASYNC CONTROLLER WRAPPER

   Error goes to existing global Express
   error middleware through next(error).
========================================================= */

const asyncController = (
  handler
) => {
  return (
    req,
    res,
    next
  ) => {
    Promise.resolve(
      handler(
        req,
        res,
        next
      )
    ).catch(
      next
    );
  };
};

/* =========================================================
   SUCCESS RESPONSE

   Existing INMBA APIs use:
   {
     success,
     statusCode,
     message,
     data
   }
========================================================= */

const sendSuccess = (
  res,
  {
    statusCode = 200,
    message = "Success",
    data = null,
  } = {}
) => {
  return res
    .status(
      statusCode
    )
    .json({
      success:
        true,

      statusCode,

      message,

      data,
    });
};

/* =========================================================
   CONTROLLER ERROR
========================================================= */

const createControllerError =
  (
    statusCode,
    message,
    errorCode
  ) => {
    const error =
      new Error(
        message
      );

    error.statusCode =
      statusCode;

    error.errorCode =
      errorCode;

    return error;
  };

/* =========================================================
   GET MEMBER ID FROM SESSION / AUTH

   Supports different current middleware shapes
   without changing existing auth system.
========================================================= */

const getSessionMemberId = (
  req
) => {
  const candidates = [
    req?.member?.id,

    req?.user?.id,

    req?.auth?.memberId,

    req?.auth?.member_id,

    req?.session?.memberId,

    req?.session?.member_id,

    req?.session?.userId,

    req?.session?.user_id,
  ];

  for (
    const candidate
    of candidates
  ) {
    const memberId =
      toPositiveInteger(
        candidate
      );

    if (
      memberId
    ) {
      return memberId;
    }
  }

  return null;
};

/* =========================================================
   GET LOGIN ID FROM SESSION / AUTH
========================================================= */

const getSessionLoginId = (
  req
) => {
  const candidates = [
    req?.member?.login_id,

    req?.member?.loginId,

    req?.user?.login_id,

    req?.user?.loginId,

    req?.auth?.loginId,

    req?.auth?.login_id,

    req?.session?.loginId,

    req?.session?.login_id,

    req?.session?.userLoginId,
  ];

  for (
    const candidate
    of candidates
  ) {
    const loginId =
      toText(
        candidate
      );

    if (
      loginId
    ) {
      return loginId;
    }
  }

  return "";
};

/* =========================================================
   GET TOKEN

   Existing KYC architecture uses:
   /something/:token
========================================================= */

const getRequestToken = (
  req
) => {
  return toText(
    req?.params?.token ??
      req?.query?.token ??
      ""
  );
};

/* =========================================================
   BUILD MEMBER REFERENCE

   Priority:
   1. Auth/session member ID
   2. Route token
   3. Auth/session login ID

   IMPORTANT:
   Normal member API does NOT trust arbitrary
   memberId/loginId from request body.
========================================================= */

const getMemberReference = (
  req
) => {
  const memberId =
    getSessionMemberId(
      req
    );

  if (
    memberId
  ) {
    return {
      memberId,
    };
  }

  const token =
    getRequestToken(
      req
    );

  if (
    token
  ) {
    return {
      token,
    };
  }

  const loginId =
    getSessionLoginId(
      req
    );

  if (
    loginId
  ) {
    return {
      loginId,
    };
  }

  throw createControllerError(
    401,

    "Professional member authentication is required.",

    "PROFESSIONAL_MEMBER_AUTH_REQUIRED"
  );
};

/* =========================================================
   ADMIN MEMBER ID

   Admin routes later use:
   /admin/professional-kyc/:memberId/...
========================================================= */

const getAdminMemberId = (
  req
) => {
  const memberId =
    toPositiveInteger(
      req?.params
        ?.memberId ??
        req?.params
          ?.id
    );

  if (
    !memberId
  ) {
    throw createControllerError(
      400,

      "Valid Professional member ID is required.",

      "INVALID_PROFESSIONAL_MEMBER_ID"
    );
  }

  return memberId;
};

/* =========================================================
   GET STORED FILE VALUE

   Later Professional Formidable middleware
   can place parsed files in req.uploadedFiles.

   Supported values:
   string
   file object
   file array
========================================================= */

const getStoredFileValue = (
  value
) => {
  if (
    !value
  ) {
    return null;
  }

  if (
    typeof value ===
    "string"
  ) {
    return (
      toText(
        value
      ) ||
      null
    );
  }

  if (
    Array.isArray(
      value
    )
  ) {
    if (
      value.length === 0
    ) {
      return null;
    }

    if (
      value.length === 1
    ) {
      return (
        getStoredFileValue(
          value[0]
        )
      );
    }

    return value
      .map(
        getStoredFileValue
      )
      .filter(
        Boolean
      );
  }

  if (
    typeof value ===
    "object"
  ) {
    return (
      toText(
        value.savedPath ??
          value.publicPath ??
          value.relativePath ??
          value.filepath ??
          value.path ??
          value.newFilename ??
          value.filename
      ) ||
      null
    );
  }

  return null;
};

/* =========================================================
   GET REQUEST VALUES

   Supports:

   {
     values: {...},
     completed: true
   }

   OR flat request:

   {
     first_name: "...",
     completed: true
   }
========================================================= */

const getRequestValues = (
  req
) => {
  const body =
    asObject(
      req?.validatedData ??
        req?.body
    );

  const source =
    Object.keys(
      asObject(
        body.values
      )
    ).length > 0
      ? asObject(
          body.values
        )
      : {
          ...body,
        };

  /* =======================================================
     CONTROLLER-ONLY KEYS
  ======================================================= */

  delete source.completed;

  delete source.complete;

  delete source.saveMode;

  delete source.save_mode;

  delete source.mode;

  delete source.values;

  delete source.section;

  delete source.token;

  delete source.memberId;

  delete source.member_id;

  delete source.loginId;

  delete source.login_id;

  /* =======================================================
     MERGE UPLOADED FILES
  ======================================================= */

  const uploadedFiles =
    asObject(
      req?.uploadedFiles ??
        req?.files
    );

  for (
    const [
      fieldName,
      fileValue,
    ]
    of Object.entries(
      uploadedFiles
    )
  ) {
    const storedValue =
      getStoredFileValue(
        fileValue
      );

    if (
      storedValue !==
        null &&
      typeof storedValue !==
        "undefined"
    ) {
      source[
        fieldName
      ] =
        storedValue;
    }
  }

  return source;
};

/* =========================================================
   GET SAVE MODE

   Save Draft:
   completed = false

   Save & Next:
   completed = true
========================================================= */

const getCompletedFlag = (
  req
) => {
  const body =
    asObject(
      req?.validatedData ??
        req?.body
    );

  const mode =
    toText(
      body.saveMode ??
        body.save_mode ??
        body.mode
    )
      .toLowerCase();

  if (
    mode ===
      "save_and_next" ||
    mode ===
      "complete" ||
    mode ===
      "completed"
  ) {
    return true;
  }

  if (
    mode ===
      "draft" ||
    mode ===
      "save_draft"
  ) {
    return false;
  }

  return toBoolean(
    body.completed ??
      body.complete ??
      false
  );
};

/* =========================================================
   GET SECTION PARAM
========================================================= */

const getSection = (
  req
) => {
  return toText(
    req?.params
      ?.section ??
      req?.body
        ?.section
  )
    .toUpperCase();
};

/* =========================================================
   GET FULL PROFESSIONAL KYC
========================================================= */

const getProfessionalKycController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const result =
        await professionalKycService
          .getProfessionalKyc(
            reference
          );

      return sendSuccess(
        res,
        {
          message:
            "Professional KYC loaded successfully.",

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   GET SINGLE SECTION
========================================================= */

const getProfessionalKycSectionController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const section =
        getSection(
          req
        );

      const result =
        await professionalKycService
          .getProfessionalKycSection(
            reference,
            section
          );

      return sendSuccess(
        res,
        {
          message:
            `${result.section.title} loaded successfully.`,

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   GET PROGRESS
========================================================= */

const getProfessionalKycProgressController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const result =
        await professionalKycService
          .getProfessionalKycProgress(
            reference
          );

      return sendSuccess(
        res,
        {
          message:
            "Professional KYC progress loaded successfully.",

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   GET NETWORK / ROYALTY
========================================================= */

const getProfessionalNetworkController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const result =
        await professionalKycService
          .getProfessionalNetwork(
            reference
          );

      return sendSuccess(
        res,
        {
          message:
            "Professional network details loaded successfully.",

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   SAVE PROFESSIONAL MEMBERSHIP PLAN

   Allowed:
   ₹300
   ₹1500
========================================================= */

const saveProfessionalKycPlanController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const body =
        asObject(
          req?.validatedData ??
            req?.body
        );

      const selectedPlan =
        toText(
          body.selectedPlan ??
            body.selected_plan ??
            body.plan
        );

      if (
        ![
          "300",
          "1500",
        ].includes(
          selectedPlan
        )
      ) {
        throw createControllerError(
          422,

          "Please select the Professional ₹300 or ₹1500 plan.",

          "PROFESSIONAL_PLAN_REQUIRED"
        );
      }

      const result =
        await professionalKycService
          .saveProfessionalPlan(
            reference,
            selectedPlan
          );

      return sendSuccess(
        res,
        {
          message:
            `Professional ₹${selectedPlan} plan selected successfully.`,

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   GENERIC SAVE SECTION
========================================================= */

const saveProfessionalKycSectionController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const section =
        getSection(
          req
        );

      const values =
        getRequestValues(
          req
        );

      const completed =
        getCompletedFlag(
          req
        );

      const result =
        await professionalKycService
          .saveProfessionalKycSection({
            ...reference,

            section,

            values,

            completed,
          });

      return sendSuccess(
        res,
        {
          message:
            result.message,

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   SECTION A
   IDENTITY & KYC
========================================================= */

const saveSectionAController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const values =
        getRequestValues(
          req
        );

      const completed =
        getCompletedFlag(
          req
        );

      const result =
        await professionalKycService
          .saveSectionA(
            reference,
            values,
            {
              completed,
            }
          );

      return sendSuccess(
        res,
        {
          message:
            result.message,

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   SECTION B
   CONTACT & ADDRESS
========================================================= */

const saveSectionBController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const values =
        getRequestValues(
          req
        );

      const completed =
        getCompletedFlag(
          req
        );

      const result =
        await professionalKycService
          .saveSectionB(
            reference,
            values,
            {
              completed,
            }
          );

      return sendSuccess(
        res,
        {
          message:
            result.message,

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   SECTION C
   LEGAL & PROFESSIONAL COMPLIANCE
========================================================= */

const saveSectionCController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const values =
        getRequestValues(
          req
        );

      const completed =
        getCompletedFlag(
          req
        );

      const result =
        await professionalKycService
          .saveSectionC(
            reference,
            values,
            {
              completed,
            }
          );

      return sendSuccess(
        res,
        {
          message:
            result.message,

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   SECTION D
   EDUCATION & QUALIFICATION
========================================================= */

const saveSectionDController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const values =
        getRequestValues(
          req
        );

      const completed =
        getCompletedFlag(
          req
        );

      const result =
        await professionalKycService
          .saveSectionD(
            reference,
            values,
            {
              completed,
            }
          );

      return sendSuccess(
        res,
        {
          message:
            result.message,

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   SECTION E
   ACHIEVEMENTS & CERTIFICATIONS
========================================================= */

const saveSectionEController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const values =
        getRequestValues(
          req
        );

      const completed =
        getCompletedFlag(
          req
        );

      const result =
        await professionalKycService
          .saveSectionE(
            reference,
            values,
            {
              completed,
            }
          );

      return sendSuccess(
        res,
        {
          message:
            result.message,

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   SECTION F
   WORK EXPERIENCE & PORTFOLIO
========================================================= */

const saveSectionFController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const values =
        getRequestValues(
          req
        );

      const completed =
        getCompletedFlag(
          req
        );

      const result =
        await professionalKycService
          .saveSectionF(
            reference,
            values,
            {
              completed,
            }
          );

      return sendSuccess(
        res,
        {
          message:
            result.message,

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   SECTION G
   INTEREST, SKILLS & BIO
========================================================= */

const saveSectionGController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const values =
        getRequestValues(
          req
        );

      const completed =
        getCompletedFlag(
          req
        );

      const result =
        await professionalKycService
          .saveSectionG(
            reference,
            values,
            {
              completed,
            }
          );

      return sendSuccess(
        res,
        {
          message:
            result.message,

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   SECTION H
   FINANCIAL & BANK
========================================================= */

const saveSectionHController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const values =
        getRequestValues(
          req
        );

      const completed =
        getCompletedFlag(
          req
        );

      const result =
        await professionalKycService
          .saveSectionH(
            reference,
            values,
            {
              completed,
            }
          );

      return sendSuccess(
        res,
        {
          message:
            result.message,

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   SECTION I
   NETWORK / ROYALTY
========================================================= */

const saveSectionIController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const values =
        getRequestValues(
          req
        );

      const completed =
        getCompletedFlag(
          req
        );

      const result =
        await professionalKycService
          .saveSectionI(
            reference,
            values,
            {
              completed,
            }
          );

      return sendSuccess(
        res,
        {
          message:
            result.message,

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   SECTION J
   EMERGENCY & NOMINEE
========================================================= */

const saveSectionJController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const values =
        getRequestValues(
          req
        );

      const completed =
        getCompletedFlag(
          req
        );

      const result =
        await professionalKycService
          .saveSectionJ(
            reference,
            values,
            {
              completed,
            }
          );

      return sendSuccess(
        res,
        {
          message:
            result.message,

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   SAVE PRIVACY + DECLARATION CONSENT
========================================================= */

const saveProfessionalKycConsentController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const body =
        asObject(
          req?.validatedData ??
            req?.body
        );

      const privacyConsent =
        toBoolean(
          body.privacyConsent ??
            body.privacy_consent ??
            body
              .professional_privacy_consent
        );

      const declarationAccepted =
        toBoolean(
          body.declarationAccepted ??
            body
              .declaration_accepted ??
            body
              .professional_declaration_accepted
        );

      const result =
        await professionalKycService
          .saveProfessionalKycConsent(
            reference,
            {
              privacyConsent,

              declarationAccepted,
            }
          );

      return sendSuccess(
        res,
        {
          message:
            result.message,

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   FINAL SUBMIT PROFESSIONAL KYC
========================================================= */

const submitProfessionalKycController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const body =
        asObject(
          req?.validatedData ??
            req?.body
        );

      const privacyConsent =
        toBoolean(
          body.privacyConsent ??
            body.privacy_consent ??
            body
              .professional_privacy_consent
        );

      const declarationAccepted =
        toBoolean(
          body.declarationAccepted ??
            body
              .declaration_accepted ??
            body
              .professional_declaration_accepted
        );

      const result =
        await professionalKycService
          .submitProfessionalKyc(
            reference,
            {
              privacyConsent,

              declarationAccepted,
            }
          );

      return sendSuccess(
        res,
        {
          message:
            result.message,

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   REOPEN REJECTED PROFESSIONAL KYC
========================================================= */

const reopenProfessionalKycController =
  asyncController(
    async (
      req,
      res
    ) => {
      const reference =
        getMemberReference(
          req
        );

      const result =
        await professionalKycService
          .reopenProfessionalKyc(
            reference
          );

      return sendSuccess(
        res,
        {
          message:
            "Professional KYC reopened successfully. You can edit and resubmit your application.",

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   ADMIN
   MOVE TO UNDER REVIEW
========================================================= */

const markProfessionalKycUnderReviewController =
  asyncController(
    async (
      req,
      res
    ) => {
      const memberId =
        getAdminMemberId(
          req
        );

      const result =
        await professionalKycService
          .markProfessionalKycUnderReview(
            memberId
          );

      return sendSuccess(
        res,
        {
          message:
            "Professional KYC moved to under review.",

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   ADMIN
   APPROVE KYC
========================================================= */

const approveProfessionalKycController =
  asyncController(
    async (
      req,
      res
    ) => {
      const memberId =
        getAdminMemberId(
          req
        );

      const result =
        await professionalKycService
          .approveProfessionalKyc(
            memberId
          );

      return sendSuccess(
        res,
        {
          message:
            "Professional KYC approved successfully.",

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   ADMIN
   REJECT KYC
========================================================= */

const rejectProfessionalKycController =
  asyncController(
    async (
      req,
      res
    ) => {
      const memberId =
        getAdminMemberId(
          req
        );

      const body =
        asObject(
          req?.validatedData ??
            req?.body
        );

      const rejectionReason =
        toText(
          body.rejectionReason ??
            body.rejection_reason ??
            body.reason
        );

      const result =
        await professionalKycService
          .rejectProfessionalKyc(
            memberId,
            rejectionReason
          );

      return sendSuccess(
        res,
        {
          message:
            "Professional KYC rejected.",

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   ADMIN / INTERNAL
   UPDATE NETWORK LEVEL + ROYALTY SLAB

   IMPORTANT:
   This controller must later be placed only
   behind admin/internal middleware.
========================================================= */

const updateProfessionalSystemNetworkController =
  asyncController(
    async (
      req,
      res
    ) => {
      const memberId =
        getAdminMemberId(
          req
        );

      const body =
        asObject(
          req?.validatedData ??
            req?.body
        );

      const networkLevel =
        toText(
          body.networkLevel ??
            body.network_level
        ) ||
        null;

      const royaltySlabCategory =
        toText(
          body
            .royaltySlabCategory ??
            body
              .royalty_slab_category
        ) ||
        null;

      const result =
        await professionalKycService
          .updateProfessionalSystemNetwork(
            memberId,
            {
              networkLevel,

              royaltySlabCategory,
            }
          );

      return sendSuccess(
        res,
        {
          message:
            "Professional network system values updated successfully.",

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  /* =========================
     MEMBER GET
  ========================= */

  getProfessionalKycController,

  getProfessionalKycSectionController,

  getProfessionalKycProgressController,

  getProfessionalNetworkController,

  /* =========================
     PLAN
  ========================= */

  saveProfessionalKycPlanController,

  /* =========================
     GENERIC SAVE
  ========================= */

  saveProfessionalKycSectionController,

  /* =========================
     A - J
  ========================= */

  saveSectionAController,

  saveSectionBController,

  saveSectionCController,

  saveSectionDController,

  saveSectionEController,

  saveSectionFController,

  saveSectionGController,

  saveSectionHController,

  saveSectionIController,

  saveSectionJController,

  /* =========================
     CONSENT / FINAL SUBMIT
  ========================= */

  saveProfessionalKycConsentController,

  submitProfessionalKycController,

  reopenProfessionalKycController,

  /* =========================
     ADMIN
  ========================= */

  markProfessionalKycUnderReviewController,

  approveProfessionalKycController,

  rejectProfessionalKycController,

  updateProfessionalSystemNetworkController,
};