const normalizeText =
  (
    value,
    {
      trim = true,
      emptyAsNull = true,
    } = {}
  ) => {
    if (
      value === undefined ||
      value === null
    ) {
      return emptyAsNull
        ? null
        : "";
    }

    let normalized =
      String(value);

    if (trim) {
      normalized =
        normalized.trim();
    }

    if (
      emptyAsNull &&
      normalized === ""
    ) {
      return null;
    }

    return normalized;
  };

const normalizeEmail =
  (value) => {
    const normalized =
      normalizeText(value);

    return normalized
      ? normalized.toLowerCase()
      : null;
  };

const normalizeUppercase =
  (value) => {
    const normalized =
      normalizeText(value);

    return normalized
      ? normalized.toUpperCase()
      : null;
  };

const isEmptyValue =
  (value) => {
    if (
      value === undefined ||
      value === null
    ) {
      return true;
    }

    return (
      typeof value ===
        "string" &&
      value.trim() === ""
    );
  };

const createValidationError =
  (
    field,
    message,
    code =
      "INVALID_FIELD"
  ) => {
    return {
      field,
      message,
      code,
    };
  };

const hasValidationErrors =
  (errors) => {
    return (
      Array.isArray(errors) &&
      errors.length > 0
    );
  };

module.exports = {
  normalizeText,
  normalizeEmail,
  normalizeUppercase,

  isEmptyValue,

  createValidationError,
  hasValidationErrors,
};