import api from "../api/api";
import { toText, asObject } from "../utils/commonHelpers";

/* =========================================================
   COMMERCIAL KYC SERVICE

   BASE:
   /api/commercial-kyc

   SECTIONS:
   A - G
========================================================= */

const BASE_URL =
  "/commercial-kyc";

const VALID_SECTIONS =
  new Set([
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
  ]);

/* =========================================================
   BASIC HELPERS
========================================================= */

/* =========================================================
   SECTION NORMALIZER
========================================================= */

const normalizeSection = (
  section
) => {
  const normalized =
    toText(
      section
    ).toUpperCase();

  if (
    !VALID_SECTIONS.has(
      normalized
    )
  ) {
    throw new Error(
      "Invalid Commercial KYC section."
    );
  }

  return normalized;
};

/* =========================================================
   FILE HELPERS
========================================================= */

const isFileLike = (
  value
) => {
  if (
    typeof File !==
      "undefined" &&
    value instanceof File
  ) {
    return true;
  }

  if (
    typeof Blob !==
      "undefined" &&
    value instanceof Blob
  ) {
    return true;
  }

  return false;
};

const normalizeFileList = (
  value
) => {
  if (
    Array.isArray(
      value
    )
  ) {
    return value.filter(
      isFileLike
    );
  }

  if (
    isFileLike(
      value
    )
  ) {
    return [
      value,
    ];
  }

  return [];
};

const hasUploadFiles = (
  files
) => {
  return Object.values(
    asObject(
      files
    )
  ).some(
    (
      value
    ) =>
      normalizeFileList(
        value
      ).length > 0
  );
};

/* =========================================================
   RESPONSE NORMALIZER
========================================================= */

const normalizeResponse = (
  response
) => {
  const body =
    response?.data ?? {};

  if (
    body &&
    typeof body === "object" &&
    body.data !== undefined
  ) {
    const data =
      asObject(
        body.data
      );

    return {
      ...data,

      success:
        body.success !==
        false,

      statusCode:
        body.statusCode ||
        response?.status ||
        200,

      message:
        body.message ||
        data.message ||
        "",
    };
  }

  return body;
};

/* =========================================================
   ERROR NORMALIZER
========================================================= */

const normalizeError = (
  error,
  fallbackMessage
) => {
  const safeError =
    error &&
    typeof error === "object"
      ? error
      : new Error(
          fallbackMessage
        );

  const body =
    asObject(
      safeError
        ?.response
        ?.data
    );

  const data =
    asObject(
      body.data
    );

  let fieldErrors = {};

  if (
    body.fieldErrors &&
    typeof body.fieldErrors ===
      "object" &&
    !Array.isArray(
      body.fieldErrors
    )
  ) {
    fieldErrors =
      body.fieldErrors;
  } else if (
    data.fieldErrors &&
    typeof data.fieldErrors ===
      "object" &&
    !Array.isArray(
      data.fieldErrors
    )
  ) {
    fieldErrors =
      data.fieldErrors;
  } else if (
    Array.isArray(
      body.errors
    )
  ) {
    body.errors.forEach(
      (
        item
      ) => {
        const field =
          item?.field ||
          item?.param ||
          item?.path;

        const message =
          item?.message ||
          item?.msg ||
          item?.error;

        if (
          field &&
          message
        ) {
          fieldErrors[
            field
          ] =
            message;
        }
      }
    );
  }

  safeError.apiMessage =
    body.message ||
    data.message ||
    safeError.message ||
    fallbackMessage;

  safeError.fieldErrors =
    fieldErrors;

  safeError.errorCode =
    body.errorCode ||
    body.code ||
    data.errorCode ||
    data.code ||
    "";

  safeError.details =
    body.details ||
    data.details ||
    null;

  safeError.statusCode =
    Number(
      safeError
        ?.response
        ?.status ||
      body.statusCode ||
      0
    );

  return safeError;
};

/* =========================================================
   SAVE ARGUMENT NORMALIZER

   Supports:

   saveCommercialKycSection(
     "A",
     values,
     {
       files,
       completed: true
     }
   )

   OR

   saveCommercialKycSection(
     "A",
     {
       values,
       files,
       completed: true
     }
   )
========================================================= */

const normalizeSaveArguments = (
  valuesOrConfig,
  options = {}
) => {
  const source =
    asObject(
      valuesOrConfig
    );

  const safeOptions =
    asObject(
      options
    );

  const looksLikeConfig =
    Object.prototype
      .hasOwnProperty
      .call(
        source,
        "values"
      ) ||
    Object.prototype
      .hasOwnProperty
      .call(
        source,
        "files"
      ) ||
    Object.prototype
      .hasOwnProperty
      .call(
        source,
        "completed"
      );

  if (
    looksLikeConfig
  ) {
    return {
      values:
        asObject(
          source.values
        ),

      files:
        asObject(
          source.files
        ),

      completed:
        Boolean(
          source.completed
        ),
    };
  }

  return {
    values:
      source,

    files:
      asObject(
        safeOptions.files
      ),

    completed:
      Boolean(
        safeOptions.completed
      ),
  };
};

/* =========================================================
   MULTIPART BODY
========================================================= */

const createMultipartBody =
  ({
    values = {},
    files = {},
    completed = false,
  }) => {
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

    Object.entries(
      asObject(
        files
      )
    ).forEach(
      ([
        fieldName,
        fileValue,
      ]) => {
        const selectedFiles =
          normalizeFileList(
            fileValue
          );

        selectedFiles.forEach(
          (
            file
          ) => {
            formData.append(
              fieldName,
              file
            );
          }
        );
      }
    );

    return formData;
  };

/* =========================================================
   GET FULL COMMERCIAL KYC
========================================================= */

export const getCommercialKyc =
  async (
    {
      signal,
    } = {}
  ) => {
    try {
      const response =
        await api.get(
          BASE_URL,
          {
            signal,
          }
        );

      return normalizeResponse(
        response
      );
    } catch (
      error
    ) {
      throw normalizeError(
        error,
        "Unable to load Commercial KYC."
      );
    }
  };

/* =========================================================
   GET KYC PROGRESS
========================================================= */

export const getCommercialKycProgress =
  async (
    {
      signal,
    } = {}
  ) => {
    try {
      const response =
        await api.get(
          `${BASE_URL}/progress`,
          {
            signal,
          }
        );

      return normalizeResponse(
        response
      );
    } catch (
      error
    ) {
      throw normalizeError(
        error,
        "Unable to load Commercial KYC progress."
      );
    }
  };

/* =========================================================
   GET NETWORK DETAILS
========================================================= */

export const getCommercialNetwork =
  async (
    {
      signal,
    } = {}
  ) => {
    try {
      const response =
        await api.get(
          `${BASE_URL}/network`,
          {
            signal,
          }
        );

      return normalizeResponse(
        response
      );
    } catch (
      error
    ) {
      throw normalizeError(
        error,
        "Unable to load Commercial network details."
      );
    }
  };

/* =========================================================
   GET SINGLE SECTION
========================================================= */

export const getCommercialKycSection =
  async (
    section,
    {
      signal,
    } = {}
  ) => {
    const safeSection =
      normalizeSection(
        section
      );

    try {
      const response =
        await api.get(
          `${BASE_URL}/sections/${safeSection}`,
          {
            signal,
          }
        );

      return normalizeResponse(
        response
      );
    } catch (
      error
    ) {
      throw normalizeError(
        error,
        `Unable to load Commercial KYC Section ${safeSection}.`
      );
    }
  };

/* =========================================================
   SAVE COMMERCIAL KYC SECTION

   completed = false
   -----------------
   Draft

   completed = true
   ----------------
   Validate + Complete
========================================================= */

export const saveCommercialKycSection =
  async (
    section,
    valuesOrConfig = {},
    options = {}
  ) => {
    const safeSection =
      normalizeSection(
        section
      );

    const {
      values,
      files,
      completed,
    } =
      normalizeSaveArguments(
        valuesOrConfig,
        options
      );

    const requestData =
      hasUploadFiles(
        files
      )
        ? createMultipartBody({
            values,
            files,
            completed,
          })
        : {
            values,

            completed:
              Boolean(
                completed
              ),
          };

    try {
      const response =
        await api.patch(
          `${BASE_URL}/sections/${safeSection}`,
          requestData
        );

      return normalizeResponse(
        response
      );
    } catch (
      error
    ) {
      const normalizedError =
        normalizeError(
          error,
          `Unable to save Commercial KYC Section ${safeSection}.`
        );

      console.error(
        `Commercial KYC Section ${safeSection} Error:`,
        {
          statusCode:
            normalizedError.statusCode,

          message:
            normalizedError.apiMessage,

          errorCode:
            normalizedError.errorCode,

          fieldErrors:
            normalizedError.fieldErrors,

          details:
            normalizedError.details,
        }
      );

      throw normalizedError;
    }
  };

/* =========================================================
   SAVE COMMERCIAL KYC DRAFT

   REQUIRED BY:
   CommercialProfileUpgrade.jsx

   This function never completes the section.
========================================================= */

export const saveCommercialKycDraft =
  async (
    section,
    valuesOrConfig = {},
    options = {}
  ) => {
    const source =
      asObject(
        valuesOrConfig
      );

    const safeOptions =
      asObject(
        options
      );

    const looksLikeConfig =
      Object.prototype
        .hasOwnProperty
        .call(
          source,
          "values"
        ) ||
      Object.prototype
        .hasOwnProperty
        .call(
          source,
          "files"
        );

    if (
      looksLikeConfig
    ) {
      return saveCommercialKycSection(
        section,
        {
          values:
            asObject(
              source.values
            ),

          files:
            asObject(
              source.files
            ),

          completed:
            false,
        }
      );
    }

    return saveCommercialKycSection(
      section,
      source,
      {
        ...safeOptions,

        completed:
          false,
      }
    );
  };

/* =========================================================
   COMPLETE COMMERCIAL KYC SECTION

   REQUIRED BY:
   CommercialProfileUpgrade.jsx

   Always completed = true.
========================================================= */

export const completeCommercialKycSection =
  async (
    section,
    valuesOrConfig = {},
    options = {}
  ) => {
    const source =
      asObject(
        valuesOrConfig
      );

    const safeOptions =
      asObject(
        options
      );

    const looksLikeConfig =
      Object.prototype
        .hasOwnProperty
        .call(
          source,
          "values"
        ) ||
      Object.prototype
        .hasOwnProperty
        .call(
          source,
          "files"
        );

    if (
      looksLikeConfig
    ) {
      return saveCommercialKycSection(
        section,
        {
          values:
            asObject(
              source.values
            ),

          files:
            asObject(
              source.files
            ),

          completed:
            true,
        }
      );
    }

    return saveCommercialKycSection(
      section,
      source,
      {
        ...safeOptions,

        completed:
          true,
      }
    );
  };

/* =========================================================
   SECTION A
========================================================= */

export const saveSectionA =
  (
    values,
    options = {}
  ) =>
    saveCommercialKycSection(
      "A",
      values,
      options
    );

export const completeSectionA =
  (
    values,
    options = {}
  ) =>
    completeCommercialKycSection(
      "A",
      values,
      options
    );

/* =========================================================
   SECTION B
========================================================= */

export const saveSectionB =
  (
    values,
    options = {}
  ) =>
    saveCommercialKycSection(
      "B",
      values,
      options
    );

export const completeSectionB =
  (
    values,
    options = {}
  ) =>
    completeCommercialKycSection(
      "B",
      values,
      options
    );

/* =========================================================
   SECTION C
========================================================= */

export const saveSectionC =
  (
    values,
    options = {}
  ) =>
    saveCommercialKycSection(
      "C",
      values,
      options
    );

export const completeSectionC =
  (
    values,
    options = {}
  ) =>
    completeCommercialKycSection(
      "C",
      values,
      options
    );

/* =========================================================
   SECTION D
========================================================= */

export const saveSectionD =
  (
    values,
    options = {}
  ) =>
    saveCommercialKycSection(
      "D",
      values,
      options
    );

export const completeSectionD =
  (
    values,
    options = {}
  ) =>
    completeCommercialKycSection(
      "D",
      values,
      options
    );

/* =========================================================
   SECTION E
========================================================= */

export const saveSectionE =
  (
    values,
    options = {}
  ) =>
    saveCommercialKycSection(
      "E",
      values,
      options
    );

export const completeSectionE =
  (
    values,
    options = {}
  ) =>
    completeCommercialKycSection(
      "E",
      values,
      options
    );

/* =========================================================
   SECTION F
========================================================= */

export const saveSectionF =
  (
    values,
    options = {}
  ) =>
    saveCommercialKycSection(
      "F",
      values,
      options
    );

export const completeSectionF =
  (
    values,
    options = {}
  ) =>
    completeCommercialKycSection(
      "F",
      values,
      options
    );

/* =========================================================
   SECTION G
========================================================= */

export const saveSectionG =
  (
    values,
    options = {}
  ) =>
    saveCommercialKycSection(
      "G",
      values,
      options
    );

export const completeSectionG =
  (
    values,
    options = {}
  ) =>
    completeCommercialKycSection(
      "G",
      values,
      options
    );

/* =========================================================
   SAVE CONSENT
========================================================= */

export const saveCommercialKycConsent =
  async ({
    privacyConsent = true,
    declarationAccepted = true,
  } = {}) => {
    try {
      const response =
        await api.patch(
          `${BASE_URL}/consent`,
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

      return normalizeResponse(
        response
      );
    } catch (
      error
    ) {
      const normalizedError =
        normalizeError(
          error,
          "Unable to save Commercial KYC consent."
        );

      console.error(
        "Commercial KYC Consent Error:",
        {
          statusCode:
            normalizedError.statusCode,

          message:
            normalizedError.apiMessage,

          fieldErrors:
            normalizedError.fieldErrors,
        }
      );

      throw normalizedError;
    }
  };

/* =========================================================
   FINAL SUBMIT

   POST:
   /api/commercial-kyc/submit
========================================================= */

export const submitCommercialKyc =
  async ({
    privacyConsent = true,
    declarationAccepted = true,
  } = {}) => {
    try {
      const response =
        await api.post(
          `${BASE_URL}/submit`,
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

      return normalizeResponse(
        response
      );
    } catch (
      error
    ) {
      const normalizedError =
        normalizeError(
          error,
          "Unable to submit Commercial KYC."
        );

      console.error(
        "Commercial KYC Final Submit Error:",
        {
          statusCode:
            normalizedError.statusCode,

          message:
            normalizedError.apiMessage,

          errorCode:
            normalizedError.errorCode,

          fieldErrors:
            normalizedError.fieldErrors,

          details:
            normalizedError.details,
        }
      );

      throw normalizedError;
    }
  };

/* =========================================================
   REOPEN REJECTED KYC
========================================================= */

export const reopenCommercialKyc =
  async () => {
    try {
      const response =
        await api.post(
          `${BASE_URL}/reopen`
        );

      return normalizeResponse(
        response
      );
    } catch (
      error
    ) {
      const normalizedError =
        normalizeError(
          error,
          "Unable to reopen Commercial KYC."
        );

      console.error(
        "Commercial KYC Reopen Error:",
        {
          statusCode:
            normalizedError.statusCode,

          message:
            normalizedError.apiMessage,
        }
      );

      throw normalizedError;
    }
  };