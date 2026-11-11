import api from "../api/api";
import { toText, asObject } from "../utils/commonHelpers";

/* =========================================================
   PROFESSIONAL KYC CONSTANTS
========================================================= */

export const PROFESSIONAL_KYC_BASE_URL =
  "/professional-kyc";

export const PROFESSIONAL_KYC_SECTIONS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
];

export const PROFESSIONAL_KYC_SECTION_TITLES = {
  A:
    "Identity & KYC",

  B:
    "Contact & Address",

  C:
    "Legal & Professional Compliance",

  D:
    "Education & Qualification",

  E:
    "Achievements & Certifications",

  F:
    "Work Experience & Portfolio",

  G:
    "Interest, Skills & Bio",

  H:
    "Financial & Bank",

  I:
    "Network / Royalty Details",

  J:
    "Emergency & Nominee",
};

export const PROFESSIONAL_KYC_STATUS = {
  DRAFT:
    "draft",

  IN_PROGRESS:
    "in_progress",

  SUBMITTED:
    "submitted",

  UNDER_REVIEW:
    "under_review",

  APPROVED:
    "approved",

  REJECTED:
    "rejected",
};

/* =========================================================
   OBJECT HELPER
========================================================= */

/* =========================================================
   TEXT HELPER
========================================================= */

/* =========================================================
   SECTION NORMALIZER
========================================================= */

export const normalizeProfessionalKycSection =
  (
    section
  ) => {
    const normalizedSection =
      toText(
        section
      ).toUpperCase();

    if (
      !PROFESSIONAL_KYC_SECTIONS
        .includes(
          normalizedSection
        )
    ) {
      throw new Error(
        "Invalid Professional KYC section."
      );
    }

    return normalizedSection;
  };

/* =========================================================
   TOKEN NORMALIZER
========================================================= */

const normalizeToken = (
  token
) => {
  return toText(
    token
  );
};

/* =========================================================
   TOKEN URL
========================================================= */

const buildProfessionalKycBaseUrl =
  (
    token = ""
  ) => {
    const safeToken =
      normalizeToken(
        token
      );

    if (
      safeToken
    ) {
      return `${PROFESSIONAL_KYC_BASE_URL}/token/${encodeURIComponent(
        safeToken
      )}`;
    }

    return PROFESSIONAL_KYC_BASE_URL;
  };

/* =========================================================
   RESPONSE DATA NORMALIZER

   Backend format:

   {
     success: true,
     statusCode: 200,
     message: "...",
     data: {...}
   }
========================================================= */

const normalizeApiResponse =
  (
    response
  ) => {
    const body =
      asObject(
        response?.data
      );

    return {
      success:
        body.success !==
        false,

      statusCode:
        Number(
          body.statusCode ??
            response
              ?.status ??
            200
        ),

      message:
        toText(
          body.message
        ),

      data:
        body.data ??
        (body.member || body.sections || body.progress || body.values ? body : null) ??
        body,

      raw:
        body,
    };
  };

/* =========================================================
   FIELD ERRORS NORMALIZER
========================================================= */

const normalizeFieldErrors =
  (
    value
  ) => {
    if (
      !value ||
      typeof value !==
        "object" ||
      Array.isArray(
        value
      )
    ) {
      return {};
    }

    const result = {};

    for (
      const [
        field,
        message,
      ]
      of Object.entries(
        value
      )
    ) {
      if (
        Array.isArray(
          message
        )
      ) {
        result[
          field
        ] =
          toText(
            message[0]
          );

        continue;
      }

      if (
        message &&
        typeof message ===
          "object"
      ) {
        result[
          field
        ] =
          toText(
            message.message ??
              message.msg ??
              message.error
          );

        continue;
      }

      result[
        field
      ] =
        toText(
          message
        );
    }

    return result;
  };

/* =========================================================
   API ERROR NORMALIZER
========================================================= */

export const normalizeProfessionalKycError =
  (
    error,
    fallbackMessage =
      "Unable to process Professional KYC request."
  ) => {
    const responseData =
      asObject(
        error
          ?.response
          ?.data
      );

    const nestedData =
      asObject(
        responseData.data
      );

    const apiMessage =
      toText(
        responseData.message ??
          nestedData.message ??
          error?.apiMessage ??
          error?.message,
        fallbackMessage
      );

    const fieldErrors =
      normalizeFieldErrors(
        responseData
          .fieldErrors ??
          nestedData
            .fieldErrors ??
          error
            ?.fieldErrors
      );

    const normalizedError =
      new Error(
        apiMessage
      );

    normalizedError.apiMessage =
      apiMessage;

    normalizedError.statusCode =
      Number(
        responseData
          .statusCode ??
          error
            ?.response
            ?.status ??
          error
            ?.statusCode ??
          0
      );

    normalizedError.errorCode =
      toText(
        responseData
          .errorCode ??
          nestedData
            .errorCode ??
          error
            ?.errorCode
      );

    normalizedError.fieldErrors =
      fieldErrors;

    normalizedError.details =
      responseData
        .details ??
      nestedData
        .details ??
      error
        ?.details ??
      null;

    normalizedError.originalError =
      error;

    return normalizedError;
  };

/* =========================================================
   FILE DETECTION
========================================================= */

const isFile = (
  value
) => {
  return (
    typeof File !==
      "undefined" &&
    value instanceof
      File
  );
};

const isBlob = (
  value
) => {
  return (
    typeof Blob !==
      "undefined" &&
    value instanceof
      Blob
  );
};

const isFileList = (
  value
) => {
  return (
    typeof FileList !==
      "undefined" &&
    value instanceof
      FileList
  );
};

const isUploadValue = (
  value
) => {
  if (
    isFile(
      value
    ) ||
    isBlob(
      value
    ) ||
    isFileList(
      value
    )
  ) {
    return true;
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value.some(
      (
        item
      ) =>
        isFile(
          item
        ) ||
        isBlob(
          item
        )
    );
  }

  return false;
};

/* =========================================================
   CONVERT FILE VALUE TO ARRAY
========================================================= */

const getUploadFiles = (
  value
) => {
  if (
    isFileList(
      value
    )
  ) {
    return Array.from(
      value
    );
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value.filter(
      (
        item
      ) =>
        isFile(
          item
        ) ||
        isBlob(
          item
        )
    );
  }

  if (
    isFile(
      value
    ) ||
    isBlob(
      value
    )
  ) {
    return [
      value,
    ];
  }

  return [];
};

/* =========================================================
   SPLIT TEXT VALUES + FILES

   Example input:

   {
     first_name: "Vignesh",
     aadhar_front: File,
     gallery_photos: [File, File]
   }

   Output:

   values:
   {
     first_name: "Vignesh"
   }

   files:
   {
     aadhar_front: File,
     gallery_photos: [...]
   }
========================================================= */

const splitValuesAndFiles =
  (
    values = {}
  ) => {
    const source =
      asObject(
        values
      );

    const plainValues =
      {};

    const files =
      {};

    for (
      const [
        key,
        value,
      ]
      of Object.entries(
        source
      )
    ) {
      if (
        isUploadValue(
          value
        )
      ) {
        files[
          key
        ] =
          value;

        continue;
      }

      plainValues[
        key
      ] =
        value;
    }

    return {
      values:
        plainValues,

      files,
    };
  };

/* =========================================================
   CHECK WHETHER FILES EXIST
========================================================= */

const hasFiles = (
  files
) => {
  return Object
    .values(
      asObject(
        files
      )
    )
    .some(
      (
        value
      ) =>
        getUploadFiles(
          value
        ).length >
        0
    );
};

/* =========================================================
   BUILD FORM DATA

   IMPORTANT:
   Content-Type header manually set பண்ணக்கூடாது.

   Browser / Axios automatically:
   multipart/form-data; boundary=...
   set பண்ணும்.
========================================================= */

export const createProfessionalKycFormData =
  ({
    values = {},

    files = {},

    completed = false,

    saveMode = "",
  } = {}) => {
    const formData =
      new FormData();

    formData.append(
      "values",
      JSON.stringify(
        asObject(
          values
        )
      )
    );

    formData.append(
      "completed",
      completed
        ? "true"
        : "false"
    );

    if (
      saveMode
    ) {
      formData.append(
        "saveMode",
        saveMode
      );
    }

    for (
      const [
        fieldName,
        fileValue,
      ]
      of Object.entries(
        asObject(
          files
        )
      )
    ) {
      const uploadFiles =
        getUploadFiles(
          fileValue
        );

      for (
        const file
        of uploadFiles
      ) {
        formData.append(
          fieldName,
          file
        );
      }
    }

    return formData;
  };

/* =========================================================
   PREPARE SECTION REQUEST

   If files:
   multipart/form-data

   No files:
   application/json
========================================================= */

const prepareSectionRequest =
  ({
    values = {},

    files = {},

    completed = false,
  } = {}) => {
    const split =
      splitValuesAndFiles(
        values
      );

    const mergedFiles = {
      ...split.files,

      ...asObject(
        files
      ),
    };

    const shouldUseFormData =
      hasFiles(
        mergedFiles
      );

    const saveMode =
      completed
        ? "save_and_next"
        : "draft";

    if (
      shouldUseFormData
    ) {
      return {
        data:
          createProfessionalKycFormData({
            values:
              split.values,

            files:
              mergedFiles,

            completed,

            saveMode,
          }),

        isMultipart:
          true,
      };
    }

    return {
      data: {
        values:
          split.values,

        completed:
          Boolean(
            completed
          ),

        saveMode,
      },

      isMultipart:
        false,
    };
  };

/* =========================================================
   GET MODULE INFO
========================================================= */

export const getProfessionalKycInfo =
  async () => {
    try {
      const response =
        await api.get(
          `${PROFESSIONAL_KYC_BASE_URL}/info`
        );

      return normalizeApiResponse(
        response
      );
    } catch (
      error
    ) {
      throw normalizeProfessionalKycError(
        error,
        "Unable to load Professional KYC information."
      );
    }
  };

/* =========================================================
   SAVE PROFESSIONAL MEMBERSHIP PLAN

   Allowed:
   ₹300
   ₹1500
========================================================= */

export const saveProfessionalKycPlan =
  async (
    selectedPlan,
    {
      token = "",
    } = {}
  ) => {
    try {
      const plan =
        toText(
          selectedPlan
        );

      if (
        ![
          "300",
          "1500",
        ].includes(
          plan
        )
      ) {
        throw new Error(
          "Please select the Professional ₹300 or ₹1500 plan."
        );
      }

      const baseUrl =
        buildProfessionalKycBaseUrl(
          token
        );

      const response =
        await api.patch(
          `${baseUrl}/plan`,
          {
            selectedPlan:
              plan,
          }
        );

      const normalized =
        normalizeApiResponse(
          response
        );

      return normalized.data;
    } catch (
      error
    ) {
      throw normalizeProfessionalKycError(
        error,
        "Unable to save Professional membership plan."
      );
    }
  };

/* =========================================================
   GET FULL PROFESSIONAL KYC
========================================================= */

export const getProfessionalKyc =
  async (
    {
      token = "",
    } = {}
  ) => {
    try {
      const baseUrl =
        buildProfessionalKycBaseUrl(
          token
        );

      const response =
        await api.get(
          baseUrl
        );

      const normalized =
        normalizeApiResponse(
          response
        );

      return normalized.data;
    } catch (
      error
    ) {
      throw normalizeProfessionalKycError(
        error,
        "Unable to load Professional KYC."
      );
    }
  };

/* =========================================================
   GET KYC PROGRESS
========================================================= */

export const getProfessionalKycProgress =
  async (
    {
      token = "",
    } = {}
  ) => {
    try {
      const baseUrl =
        buildProfessionalKycBaseUrl(
          token
        );

      const response =
        await api.get(
          `${baseUrl}/progress`
        );

      const normalized =
        normalizeApiResponse(
          response
        );

      return normalized.data;
    } catch (
      error
    ) {
      throw normalizeProfessionalKycError(
        error,
        "Unable to load Professional KYC progress."
      );
    }
  };

/* =========================================================
   GET NETWORK / ROYALTY
========================================================= */

export const getProfessionalKycNetwork =
  async (
    {
      token = "",
    } = {}
  ) => {
    try {
      const baseUrl =
        buildProfessionalKycBaseUrl(
          token
        );

      const response =
        await api.get(
          `${baseUrl}/network`
        );

      const normalized =
        normalizeApiResponse(
          response
        );

      return normalized.data;
    } catch (
      error
    ) {
      throw normalizeProfessionalKycError(
        error,
        "Unable to load Professional network details."
      );
    }
  };

/* =========================================================
   GET SINGLE SECTION
========================================================= */

export const getProfessionalKycSection =
  async (
    section,
    {
      token = "",
    } = {}
  ) => {
    try {
      const safeSection =
        normalizeProfessionalKycSection(
          section
        );

      const baseUrl =
        buildProfessionalKycBaseUrl(
          token
        );

      const response =
        await api.get(
          `${baseUrl}/sections/${safeSection}`
        );

      const normalized =
        normalizeApiResponse(
          response
        );

      return normalized.data;
    } catch (
      error
    ) {
      throw normalizeProfessionalKycError(
        error,
        "Unable to load Professional KYC section."
      );
    }
  };

/* =========================================================
   GENERIC SAVE SECTION

   completed false:
   Save Draft

   completed true:
   Save & Next
========================================================= */

export const saveProfessionalKycSection =
  async (
    section,
    values = {},
    {
      token = "",

      files = {},

      completed = false,
    } = {}
  ) => {
    try {
      const safeSection =
        normalizeProfessionalKycSection(
          section
        );

      const baseUrl =
        buildProfessionalKycBaseUrl(
          token
        );

      const request =
        prepareSectionRequest({
          values,

          files,

          completed:
            Boolean(
              completed
            ),
        });

      /*
        Do NOT manually set:
        Content-Type: multipart/form-data

        Browser will add the required boundary.
      */

      const response =
        await api.patch(
          `${baseUrl}/sections/${safeSection}`,
          request.data
        );

      const normalized =
        normalizeApiResponse(
          response
        );

      return normalized.data;
    } catch (
      error
    ) {
      throw normalizeProfessionalKycError(
        error,
        completed
          ? "Unable to save and continue Professional KYC."
          : "Unable to save Professional KYC draft."
      );
    }
  };

/* =========================================================
   SAVE DRAFT
========================================================= */

export const saveProfessionalKycDraft =
  async (
    section,
    values = {},
    {
      token = "",

      files = {},
    } = {}
  ) => {
    return saveProfessionalKycSection(
      section,
      values,
      {
        token,

        files,

        completed:
          false,
      }
    );
  };

/* =========================================================
   SAVE & NEXT
========================================================= */

export const saveProfessionalKycAndNext =
  async (
    section,
    values = {},
    {
      token = "",

      files = {},
    } = {}
  ) => {
    return saveProfessionalKycSection(
      section,
      values,
      {
        token,

        files,

        completed:
          true,
      }
    );
  };

/* =========================================================
   SAVE A
========================================================= */

export const saveProfessionalSectionA =
  async (
    values,
    options = {}
  ) => {
    return saveProfessionalKycSection(
      "A",
      values,
      options
    );
  };

/* =========================================================
   SAVE B
========================================================= */

export const saveProfessionalSectionB =
  async (
    values,
    options = {}
  ) => {
    return saveProfessionalKycSection(
      "B",
      values,
      options
    );
  };

/* =========================================================
   SAVE C
========================================================= */

export const saveProfessionalSectionC =
  async (
    values,
    options = {}
  ) => {
    return saveProfessionalKycSection(
      "C",
      values,
      options
    );
  };

/* =========================================================
   SAVE D
========================================================= */

export const saveProfessionalSectionD =
  async (
    values,
    options = {}
  ) => {
    return saveProfessionalKycSection(
      "D",
      values,
      options
    );
  };

/* =========================================================
   SAVE E
========================================================= */

export const saveProfessionalSectionE =
  async (
    values,
    options = {}
  ) => {
    return saveProfessionalKycSection(
      "E",
      values,
      options
    );
  };

/* =========================================================
   SAVE F
========================================================= */

export const saveProfessionalSectionF =
  async (
    values,
    options = {}
  ) => {
    return saveProfessionalKycSection(
      "F",
      values,
      options
    );
  };

/* =========================================================
   SAVE G
========================================================= */

export const saveProfessionalSectionG =
  async (
    values,
    options = {}
  ) => {
    return saveProfessionalKycSection(
      "G",
      values,
      options
    );
  };

/* =========================================================
   SAVE H
========================================================= */

export const saveProfessionalSectionH =
  async (
    values,
    options = {}
  ) => {
    return saveProfessionalKycSection(
      "H",
      values,
      options
    );
  };

/* =========================================================
   SAVE I
========================================================= */

export const saveProfessionalSectionI =
  async (
    values,
    options = {}
  ) => {
    return saveProfessionalKycSection(
      "I",
      values,
      options
    );
  };

/* =========================================================
   SAVE J
========================================================= */

export const saveProfessionalSectionJ =
  async (
    values,
    options = {}
  ) => {
    return saveProfessionalKycSection(
      "J",
      values,
      options
    );
  };

/* =========================================================
   SAVE CONSENT
========================================================= */

export const saveProfessionalKycConsent =
  async (
    {
      privacyConsent,

      declarationAccepted,

      token = "",
    }
  ) => {
    try {
      const baseUrl =
        buildProfessionalKycBaseUrl(
          token
        );

      const response =
        await api.patch(
          `${baseUrl}/consent`,
          {
            privacyConsent:
              Boolean(
                privacyConsent
              ),

            declarationAccepted:
              Boolean(
                declarationAccepted
              ),
          }
        );

      const normalized =
        normalizeApiResponse(
          response
        );

      return normalized.data;
    } catch (
      error
    ) {
      throw normalizeProfessionalKycError(
        error,
        "Unable to save Professional KYC consent."
      );
    }
  };

/* =========================================================
   FINAL SUBMIT
========================================================= */

export const submitProfessionalKyc =
  async (
    {
      privacyConsent,

      declarationAccepted,

      token = "",
    }
  ) => {
    try {
      const baseUrl =
        buildProfessionalKycBaseUrl(
          token
        );

      const response =
        await api.post(
          `${baseUrl}/submit`,
          {
            privacyConsent:
              Boolean(
                privacyConsent
              ),

            declarationAccepted:
              Boolean(
                declarationAccepted
              ),
          }
        );

      const normalized =
        normalizeApiResponse(
          response
        );

      return normalized.data;
    } catch (
      error
    ) {
      throw normalizeProfessionalKycError(
        error,
        "Unable to submit Professional KYC."
      );
    }
  };

/* =========================================================
   REOPEN REJECTED KYC
========================================================= */

export const reopenProfessionalKyc =
  async (
    {
      token = "",
    } = {}
  ) => {
    try {
      const baseUrl =
        buildProfessionalKycBaseUrl(
          token
        );

      const response =
        await api.post(
          `${baseUrl}/reopen`,
          {}
        );

      const normalized =
        normalizeApiResponse(
          response
        );

      return normalized.data;
    } catch (
      error
    ) {
      throw normalizeProfessionalKycError(
        error,
        "Unable to reopen rejected Professional KYC."
      );
    }
  };

/* =========================================================
   GET SECTION TITLE
========================================================= */

export const getProfessionalKycSectionTitle =
  (
    section
  ) => {
    const safeSection =
      normalizeProfessionalKycSection(
        section
      );

    return (
      PROFESSIONAL_KYC_SECTION_TITLES[
        safeSection
      ]
    );
  };

/* =========================================================
   NEXT SECTION
========================================================= */

export const getNextProfessionalKycSection =
  (
    section
  ) => {
    const safeSection =
      normalizeProfessionalKycSection(
        section
      );

    const currentIndex =
      PROFESSIONAL_KYC_SECTIONS
        .indexOf(
          safeSection
        );

    if (
      currentIndex ===
      PROFESSIONAL_KYC_SECTIONS
        .length -
        1
    ) {
      return null;
    }

    return (
      PROFESSIONAL_KYC_SECTIONS[
        currentIndex +
          1
      ]
    );
  };

/* =========================================================
   PREVIOUS SECTION
========================================================= */

export const getPreviousProfessionalKycSection =
  (
    section
  ) => {
    const safeSection =
      normalizeProfessionalKycSection(
        section
      );

    const currentIndex =
      PROFESSIONAL_KYC_SECTIONS
        .indexOf(
          safeSection
        );

    if (
      currentIndex <= 0
    ) {
      return null;
    }

    return (
      PROFESSIONAL_KYC_SECTIONS[
        currentIndex -
          1
      ]
    );
  };

/* =========================================================
   STATUS CHECKS
========================================================= */

export const isProfessionalKycEditable =
  (
    status
  ) => {
    const normalizedStatus =
      toText(
        status,
        PROFESSIONAL_KYC_STATUS
          .DRAFT
      )
        .toLowerCase();

    return ![
      PROFESSIONAL_KYC_STATUS
        .SUBMITTED,

      PROFESSIONAL_KYC_STATUS
        .UNDER_REVIEW,

      PROFESSIONAL_KYC_STATUS
        .APPROVED,
    ].includes(
      normalizedStatus
    );
  };

/* =========================================================
   STATUS LABEL
========================================================= */

export const getProfessionalKycStatusLabel =
  (
    status
  ) => {
    const normalizedStatus =
      toText(
        status,
        PROFESSIONAL_KYC_STATUS
          .DRAFT
      )
        .toLowerCase();

    const labels = {
      draft:
        "Draft",

      in_progress:
        "In Progress",

      submitted:
        "Submitted",

      under_review:
        "Under Review",

      approved:
        "Approved",

      rejected:
        "Rejected",
    };

    return (
      labels[
        normalizedStatus
      ] ||
      "Draft"
    );
  };

/* =========================================================
   PROGRESS HELPER
========================================================= */

export const calculateProfessionalKycProgress =
  (
    progress
  ) => {
    const source =
      asObject(
        progress
      );

    if (
      Number.isFinite(
        Number(
          source.progressPercent
        )
      )
    ) {
      return Math.max(
        0,
        Math.min(
          100,
          Number(
            source.progressPercent
          )
        )
      );
    }

    const sections =
      asObject(
        source.sections
      );

    const completedCount =
      PROFESSIONAL_KYC_SECTIONS
        .filter(
          (
            section
          ) =>
            Boolean(
              sections[
                section
              ]
            )
        )
        .length;

    return Math.round(
      (
        completedCount /
        PROFESSIONAL_KYC_SECTIONS
          .length
      ) *
        100
    );
  };

/* =========================================================
   DEFAULT EXPORT
========================================================= */

const professionalKycService = {
  PROFESSIONAL_KYC_BASE_URL,

  PROFESSIONAL_KYC_SECTIONS,

  PROFESSIONAL_KYC_SECTION_TITLES,

  PROFESSIONAL_KYC_STATUS,

  normalizeProfessionalKycSection,

  normalizeProfessionalKycError,

  createProfessionalKycFormData,

  getProfessionalKycInfo,

  saveProfessionalKycPlan,

  getProfessionalKyc,

  getProfessionalKycProgress,

  getProfessionalKycNetwork,

  getProfessionalKycSection,

  saveProfessionalKycSection,

  saveProfessionalKycDraft,

  saveProfessionalKycAndNext,

  saveProfessionalSectionA,

  saveProfessionalSectionB,

  saveProfessionalSectionC,

  saveProfessionalSectionD,

  saveProfessionalSectionE,

  saveProfessionalSectionF,

  saveProfessionalSectionG,

  saveProfessionalSectionH,

  saveProfessionalSectionI,

  saveProfessionalSectionJ,

  saveProfessionalKycConsent,

  submitProfessionalKyc,

  reopenProfessionalKyc,

  getProfessionalKycSectionTitle,

  getNextProfessionalKycSection,

  getPreviousProfessionalKycSection,

  isProfessionalKycEditable,

  getProfessionalKycStatusLabel,

  calculateProfessionalKycProgress,
};

export default professionalKycService;