const ApiError =
  require(
    "../utils/apiError"
  );

const cleanText =
  (
    value
  ) => {
    const firstValue =
      Array.isArray(
        value
      )
        ? value[0]
        : value;

    if (
      firstValue === null ||
      firstValue ===
        undefined
    ) {
      return "";
    }

    return String(
      firstValue
    ).trim();
  };

/* =========================
   VALIDATE KYC DATA
========================= */

const validateLegalEntityData =
  (
    payload = {}
  ) => {
    const errors = [];

    const entityAadharNumber =
      cleanText(
        payload
          .entity_aadhar_number ||
        payload
          .entity_aadhaar_number ||
        payload
          .aadhar_number
      ).replace(
        /\D/g,
        ""
      );

    const data = {
      entity_aadhar_number:
        entityAadharNumber,

      entity_house_no:
        cleanText(
          payload
            .entity_house_no
        ),

      entity_street:
        cleanText(
          payload
            .entity_street
        ),

      entity_area:
        cleanText(
          payload
            .entity_area
        ),

      entity_city:
        cleanText(
          payload
            .entity_city
        ),

      entity_district:
        cleanText(
          payload
            .entity_district
        ),

      entity_state:
        cleanText(
          payload
            .entity_state
        ),

      entity_pincode:
        cleanText(
          payload
            .entity_pincode
        ).replace(
          /\D/g,
          ""
        ),
    };

    if (
      data
        .entity_aadhar_number &&
      !/^[0-9]{12}$/.test(
        data
          .entity_aadhar_number
      )
    ) {
      errors.push(
        "Aadhaar number must contain exactly 12 digits."
      );
    }

    if (
      !data.entity_house_no
    ) {
      errors.push(
        "House or door number is required."
      );
    }

    if (
      !data.entity_street
    ) {
      errors.push(
        "Street is required."
      );
    }

    if (
      !data.entity_area
    ) {
      errors.push(
        "Area is required."
      );
    }

    if (
      !data.entity_city
    ) {
      errors.push(
        "City is required."
      );
    }

    if (
      !data.entity_district
    ) {
      errors.push(
        "District is required."
      );
    }

    if (
      !data.entity_state
    ) {
      errors.push(
        "State is required."
      );
    }

    if (
      !data.entity_pincode
    ) {
      errors.push(
        "Pincode is required."
      );
    } else if (
      !/^[0-9]{6}$/.test(
        data.entity_pincode
      )
    ) {
      errors.push(
        "Pincode must contain exactly 6 digits."
      );
    }

    const textFields = [
      "entity_house_no",
      "entity_street",
      "entity_area",
      "entity_city",
      "entity_district",
      "entity_state",
    ];

    textFields.forEach(
      (
        field
      ) => {
        if (
          data[field] &&
          data[field].length >
            255
        ) {
          errors.push(
            `${field.replace(
              /_/g,
              " "
            )} must not exceed 255 characters.`
          );
        }
      }
    );

    return {
      isValid:
        errors.length ===
        0,

      errors,

      data,
    };
  };

/* =========================
   EXPRESS MIDDLEWARE
========================= */

const validateLegalEntity =
  (
    request,
    response,
    next
  ) => {
    try {
      const result =
        validateLegalEntityData(
          request.body ||
            {}
        );

      if (
        !result.isValid
      ) {
        const error =
          new ApiError(
            422,
            result.errors[0]
          );

        error.errors =
          result.errors;

        throw error;
      }

      request
        .validatedLegalEntity =
        result.data;

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

module.exports = {
  cleanText,
  validateLegalEntityData,
  validateLegalEntity,
};
