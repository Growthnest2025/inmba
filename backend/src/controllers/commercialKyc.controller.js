const commercialKycService =
  require(
    "../services/commercialKyc.service"
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

const parseObjectValue = (
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

  if (
    typeof value ===
      "string"
  ) {
    const text =
      value.trim();

    if (!text) {
      return {};
    }

    try {
      const parsed =
        JSON.parse(text);

      return asObject(
        parsed
      );
    } catch {
      return {};
    }
  }

  return {};
};

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
    return value === 1;
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
   MEMBER ID FROM AUTH / SESSION
========================================================= */

const getSessionMemberId = (
  req
) => {
  const candidates = [
    req?.authUserId,

    req?.authUser?.id,

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
   LOGIN ID FROM AUTH / SESSION
========================================================= */

const getSessionLoginId = (
  req
) => {
  const candidates = [
    req?.authUser?.login_id,

    req?.authUser?.loginId,

    req?.member?.login_id,

    req?.member?.loginId,

    req?.user?.login_id,

    req?.user?.loginId,

    req?.auth?.loginId,

    req?.auth?.login_id,

    req?.session?.loginId,

    req?.session?.login_id,

    req?.session?.userLoginId,

    req?.session?.user?.login_id,

    req?.session?.user?.loginId,
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
   TOKEN
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
   MEMBER REFERENCE
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
    "Commercial member authentication is required.",
    "COMMERCIAL_MEMBER_AUTH_REQUIRED"
  );
};

/* =========================================================
   COMMERCIAL PROFILE UPGRADE ACCESS CONTEXT
========================================================= */

const getCommercialAccessContext = (
  req
) => {
  return {
    planId:
      req?.session
        ?.commercial_selected_plan_id ??
      null,

    amount:
      req?.session
        ?.commercial_selected_plan_amount ??
      null,

    requiresFullKyc:
      req?.session
        ?.commercial_selected_plan_requires_full_kyc ??
      false,
  };
};

/* =========================================================
   ADMIN MEMBER ID
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
      "Valid Commercial member ID is required.",
      "INVALID_COMMERCIAL_MEMBER_ID"
    );
  }

  return memberId;
};

/* =========================================================
   STORED FILE VALUE
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
      return getStoredFileValue(
        value[0]
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
   REQUEST VALUES
========================================================= */

const getRequestValues = (
  req
) => {
  const body =
    asObject(
      req?.validatedData ??
        req?.body
    );

  const nestedValues =
    parseObjectValue(
      body.values
    );

  const source =
    Object.keys(
      nestedValues
    ).length > 0
      ? {
          ...nestedValues,
        }
      : {
          ...body,
        };

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

  delete source.privacyConsent;

  delete source.privacy_consent;

  delete source.declarationAccepted;

  delete source.declaration_accepted;

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
   SAVE MODE
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
   SECTION PARAM
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
   GET FULL COMMERCIAL KYC
========================================================= */

const getCommercialKycController =
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
        await commercialKycService
          .getCommercialKyc(
            reference
          );

      return sendSuccess(
        res,
        {
          message:
            "Commercial KYC loaded successfully.",

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   GET SINGLE SECTION
========================================================= */

const getCommercialKycSectionController =
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
        await commercialKycService
          .getCommercialKycSection(
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

const getCommercialKycProgressController =
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
        await commercialKycService
          .getCommercialKycProgress(
            reference
          );

      return sendSuccess(
        res,
        {
          message:
            "Commercial KYC progress loaded successfully.",

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   GET NETWORK
========================================================= */

const getCommercialNetworkController =
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
        await commercialKycService
          .getCommercialNetwork(
            reference
          );

      return sendSuccess(
        res,
        {
          message:
            "Commercial network details loaded successfully.",

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   GENERIC SAVE SECTION
========================================================= */

const saveCommercialKycSectionController =
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

      const accessContext =
        getCommercialAccessContext(
          req
        );

      const result =
        await commercialKycService
          .saveCommercialKycSection({
            ...reference,

            section,

            values,

            completed,

            accessContext,
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
   SECTION SAVE FACTORY
========================================================= */

const createSectionSaveController = (
  serviceMethod
) => {
  return asyncController(
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

      const accessContext =
        getCommercialAccessContext(
          req
        );

      const result =
        await serviceMethod(
          reference,
          values,
          {
            completed,
            accessContext,
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
};

/* =========================================================
   A - G
========================================================= */

const saveSectionAController =
  createSectionSaveController(
    commercialKycService
      .saveSectionA
  );

const saveSectionBController =
  createSectionSaveController(
    commercialKycService
      .saveSectionB
  );

const saveSectionCController =
  createSectionSaveController(
    commercialKycService
      .saveSectionC
  );

const saveSectionDController =
  createSectionSaveController(
    commercialKycService
      .saveSectionD
  );

const saveSectionEController =
  createSectionSaveController(
    commercialKycService
      .saveSectionE
  );

const saveSectionFController =
  createSectionSaveController(
    commercialKycService
      .saveSectionF
  );

const saveSectionGController =
  createSectionSaveController(
    commercialKycService
      .saveSectionG
  );

/* =========================================================
   SAVE PRIVACY + DECLARATION
========================================================= */

const saveCommercialKycConsentController =
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
              .commercial_privacy_consent
        );

      const declarationAccepted =
        toBoolean(
          body.declarationAccepted ??
            body.declaration_accepted ??
            body
              .commercial_declaration_accepted
        );

      const accessContext =
        getCommercialAccessContext(
          req
        );

      const result =
        await commercialKycService
          .saveCommercialKycConsent(
            reference,
            {
              privacyConsent,

              declarationAccepted,

              accessContext,
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
   FINAL SUBMIT
========================================================= */

const submitCommercialKycController =
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
              .commercial_privacy_consent
        );

      const declarationAccepted =
        toBoolean(
          body.declarationAccepted ??
            body.declaration_accepted ??
            body
              .commercial_declaration_accepted
        );

      const accessContext =
        getCommercialAccessContext(
          req
        );

      const result =
        await commercialKycService
          .submitCommercialKyc(
            reference,
            {
              privacyConsent,

              declarationAccepted,

              accessContext,
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
   REOPEN REJECTED KYC
========================================================= */

const reopenCommercialKycController =
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
        await commercialKycService
          .reopenCommercialKyc(
            reference
          );

      return sendSuccess(
        res,
        {
          message:
            "Commercial KYC reopened successfully. You can edit and resubmit your application.",

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   ADMIN - UNDER REVIEW
========================================================= */

const markCommercialKycUnderReviewController =
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
        await commercialKycService
          .markCommercialKycUnderReview(
            memberId
          );

      return sendSuccess(
        res,
        {
          message:
            "Commercial KYC moved to under review.",

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   ADMIN - APPROVE
========================================================= */

const approveCommercialKycController =
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
        await commercialKycService
          .approveCommercialKyc(
            memberId
          );

      return sendSuccess(
        res,
        {
          message:
            "Commercial KYC approved successfully.",

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   ADMIN - REJECT
========================================================= */

const rejectCommercialKycController =
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
        await commercialKycService
          .rejectCommercialKyc(
            memberId,
            rejectionReason
          );

      return sendSuccess(
        res,
        {
          message:
            "Commercial KYC rejected.",

          data:
            result,
        }
      );
    }
  );

/* =========================================================
   ADMIN / INTERNAL NETWORK UPDATE
========================================================= */

const updateCommercialSystemNetworkController =
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
          body.royaltySlabCategory ??
            body.royalty_slab_category
        ) ||
        null;

      const result =
        await commercialKycService
          .updateCommercialSystemNetwork(
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
            "Commercial network system values updated successfully.",

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
  getCommercialKycController,

  getCommercialKycSectionController,

  getCommercialKycProgressController,

  getCommercialNetworkController,

  saveCommercialKycSectionController,

  saveSectionAController,

  saveSectionBController,

  saveSectionCController,

  saveSectionDController,

  saveSectionEController,

  saveSectionFController,

  saveSectionGController,

  saveCommercialKycConsentController,

  submitCommercialKycController,

  reopenCommercialKycController,

  markCommercialKycUnderReviewController,

  approveCommercialKycController,

  rejectCommercialKycController,

  updateCommercialSystemNetworkController,
};