/*
  Formidable field value:

  {
    first_name: ["Vignesh"]
  }

  அல்லது:

  {
    first_name: "Vignesh"
  }

  இரண்டு format-யும் support செய்யும்.
*/
const getFirstFormValue =
  (value) => {
    if (
      Array.isArray(value)
    ) {
      return value.length
        ? value[0]
        : undefined;
    }

    return value;
  };

/*
  Object-ன் எல்லா field values-ஐ
  scalar value-ஆ convert செய்கிறது.
*/
const normalizeFormFields =
  (fields = {}) => {
    const normalized = {};

    for (
      const [
        key,
        value,
      ] of Object.entries(
        fields || {}
      )
    ) {
      normalized[key] =
        getFirstFormValue(
          value
        );
    }

    return normalized;
  };

/*
  Multiple possible field names-ல்
  first available value return செய்யும்.

  Example:
  referral / ref / referral_token
*/
const getFirstAvailableField =
  (
    fields,
    fieldNames,
    defaultValue = undefined
  ) => {
    for (
      const fieldName of
      fieldNames
    ) {
      const value =
        getFirstFormValue(
          fields?.[
            fieldName
          ]
        );

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }

    return defaultValue;
  };

/*
  Allowed fields மட்டும்
  புதிய object-க்கு copy செய்கிறது.
*/
const pickFormFields =
  (
    fields,
    allowedFields
  ) => {
    const normalizedFields =
      normalizeFormFields(
        fields
      );

    const selectedFields = {};

    for (
      const fieldName of
      allowedFields
    ) {
      if (
        Object.prototype
          .hasOwnProperty
          .call(
            normalizedFields,
            fieldName
          )
      ) {
        selectedFields[
          fieldName
        ] =
          normalizedFields[
            fieldName
          ];
      }
    }

    return selectedFields;
  };

module.exports = {
  getFirstFormValue,
  normalizeFormFields,
  getFirstAvailableField,
  pickFormFields,
};