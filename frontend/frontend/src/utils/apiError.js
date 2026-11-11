/* =========================
   DEFAULT ERROR MESSAGE
========================= */

export const DEFAULT_API_ERROR_MESSAGE =
  "Something went wrong. Please try again.";

/* =========================
   NORMALIZE ERROR ITEM
========================= */

const normalizeErrorItem = (
  errorItem
) => {
  if (!errorItem) {
    return "";
  }

  if (
    typeof errorItem ===
    "string"
  ) {
    return errorItem.trim();
  }

  if (
    typeof errorItem ===
    "object"
  ) {
    return String(
      errorItem.message ||
      errorItem.msg ||
      errorItem.error ||
      ""
    ).trim();
  }

  return "";
};

/* =========================
   GET VALIDATION ERRORS
========================= */

export const getValidationErrors = (
  error
) => {
  const responseData =
    error?.response?.data;

  const possibleErrors =
    responseData?.errors ||
    responseData?.data?.errors ||
    error?.errors ||
    [];

  if (
    !Array.isArray(
      possibleErrors
    )
  ) {
    return [];
  }

  return possibleErrors
    .map(
      normalizeErrorItem
    )
    .filter(Boolean);
};

/* =========================
   GET FIRST VALIDATION ERROR
========================= */

export const getFirstValidationError = (
  error
) => {
  const validationErrors =
    getValidationErrors(
      error
    );

  return (
    validationErrors[0] ||
    ""
  );
};

/* =========================
   GET API ERROR MESSAGE
========================= */

export const getApiErrorMessage = (
  error,
  fallbackMessage =
    DEFAULT_API_ERROR_MESSAGE
) => {
  /*
    Axios common interceptor-ல்
    apiMessage set செய்யப்பட்டிருந்தால்
    முதலில் அதை பயன்படுத்தும்.
  */

  if (
    error?.apiMessage &&
    typeof error.apiMessage ===
      "string"
  ) {
    return error.apiMessage.trim();
  }

  const responseData =
    error?.response?.data;

  /*
    Backend validation errors array-ல்
    கிடைத்த first message.
  */

  const validationMessage =
    getFirstValidationError(
      error
    );

  if (
    validationMessage
  ) {
    return validationMessage;
  }

  /*
    Backend common response formats.
  */

  const possibleMessages = [
    responseData?.message,
    responseData?.error,
    responseData?.data?.message,
    responseData?.data?.error,
    error?.message,
  ];

  const message =
    possibleMessages.find(
      (item) =>
        typeof item ===
          "string" &&
        item.trim()
    );

  if (message) {
    /*
      Axios network default message-ஐ
      user-friendly message-ஆக மாற்றும்.
    */

    if (
      message ===
      "Network Error"
    ) {
      return "Unable to connect to the server. Please check your internet connection and backend server.";
    }

    if (
      message.toLowerCase()
        .includes(
          "timeout"
        )
    ) {
      return "The request took too long. Please try again.";
    }

    if (
      message.toLowerCase()
        .includes(
          "failed to fetch"
        )
    ) {
      return "Unable to connect to the server. Please check whether the backend is running.";
    }

    return message.trim();
  }

  return fallbackMessage;
};

/* =========================
   GET FIELD ERRORS

   Example output:

   {
     email: "Email is required.",
     password: "Password is required."
   }
========================= */

export const getFieldErrors = (
  error
) => {
  const responseData =
    error?.response?.data;

  const possibleErrors =
    responseData?.errors ||
    responseData?.data?.errors ||
    error?.errors ||
    [];

  if (
    !Array.isArray(
      possibleErrors
    )
  ) {
    return {};
  }

  return possibleErrors.reduce(
    (
      result,
      errorItem
    ) => {
      const field =
        errorItem?.field ||
        errorItem?.path ||
        errorItem?.param ||
        "";

      const message =
        normalizeErrorItem(
          errorItem
        );

      if (
        field &&
        message &&
        !result[field]
      ) {
        result[field] =
          message;
      }

      return result;
    },
    {}
  );
};

/* =========================
   ERROR STATUS HELPERS
========================= */

export const getErrorStatusCode = (
  error
) => {
  return Number(
    error?.statusCode ||
    error?.response?.status ||
    0
  );
};

export const isUnauthorizedError = (
  error
) => {
  return (
    getErrorStatusCode(
      error
    ) === 401
  );
};

export const isForbiddenError = (
  error
) => {
  return (
    getErrorStatusCode(
      error
    ) === 403
  );
};

export const isNotFoundError = (
  error
) => {
  return (
    getErrorStatusCode(
      error
    ) === 404
  );
};

export const isValidationError = (
  error
) => {
  const statusCode =
    getErrorStatusCode(
      error
    );

  return (
    statusCode === 400 ||
    statusCode === 422
  );
};

export const isNetworkError = (
  error
) => {
  return Boolean(
    error?.isNetworkError ||
    !error?.response
  );
};

/* =========================
   DEFAULT EXPORT
========================= */

const apiErrorUtils = {
  DEFAULT_API_ERROR_MESSAGE,

  getValidationErrors,
  getFirstValidationError,
  getApiErrorMessage,
  getFieldErrors,
  getErrorStatusCode,

  isUnauthorizedError,
  isForbiddenError,
  isNotFoundError,
  isValidationError,
  isNetworkError,
};

export default apiErrorUtils;