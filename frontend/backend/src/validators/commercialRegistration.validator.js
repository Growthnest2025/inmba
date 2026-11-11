const toText = (value) => {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizePhone = (value) => {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(-10);
};

const normalizeEmail = (value) => {
  return toText(value).toLowerCase();
};

const normalizeReferral = (value) => {
  return toText(value)
    .replace(/\s+/g, "")
    .toUpperCase();
};

const BUSINESS_CATEGORIES = new Set([
  "Retail",
  "Service",
  "Wholesale",
]);

const createValidationFailure = (errors) => {
  return {
    valid: false,
    errors,
    data: null,
  };
};

const createValidationSuccess = (data) => {
  return {
    valid: true,
    errors: [],
    data,
  };
};

const validateCommercialRegistration = (input = {}) => {
  const errors = [];

  const business_name = toText(
    input.business_name ??
      input.shop_name
  );

  const owner_full_name = toText(
    input.owner_full_name ??
      input.owner_name
  );

  const phone = normalizePhone(
    input.phone ??
      input.mobile
  );

  const email = normalizeEmail(
    input.email ??
      input.email_id
  );

  const rawBusinessCategory =
    toText(
      input.business_category ??
        input.business_type
    );

  const business_category =
    [...BUSINESS_CATEGORIES].find(
      (value) =>
        value.toLowerCase() ===
        rawBusinessCategory.toLowerCase()
    ) || rawBusinessCategory;

  const city = toText(
    input.city ??
      input.location
  );

  const business_address =
    toText(
      input.business_address ??
        input.address
    );

  const password = String(
    input.password ??
      input.pin ??
      ""
  );

  const referral =
    normalizeReferral(
      input.referral ??
        input.referral_id
    );

  if (!business_name) {
    errors.push({
      field: "business_name",
      message:
        "Business / Shop Name is required.",
      code:
        "BUSINESS_NAME_REQUIRED",
    });
  } else if (
    business_name.length < 2 ||
    business_name.length > 255
  ) {
    errors.push({
      field: "business_name",
      message:
        "Business / Shop Name must be between 2 and 255 characters.",
      code:
        "INVALID_BUSINESS_NAME",
    });
  }

  if (!owner_full_name) {
    errors.push({
      field: "owner_full_name",
      message:
        "Owner Full Name is required.",
      code:
        "OWNER_FULL_NAME_REQUIRED",
    });
  } else if (
    owner_full_name.length < 2 ||
    owner_full_name.length > 150
  ) {
    errors.push({
      field: "owner_full_name",
      message:
        "Owner Full Name must be between 2 and 150 characters.",
      code:
        "INVALID_OWNER_FULL_NAME",
    });
  }

  if (!phone) {
    errors.push({
      field: "phone",
      message:
        "Mobile number is required.",
      code:
        "PHONE_REQUIRED",
    });
  } else if (
    !/^[6-9]\d{9}$/.test(phone)
  ) {
    errors.push({
      field: "phone",
      message:
        "Enter a valid 10-digit Indian mobile number.",
      code:
        "INVALID_PHONE",
    });
  }

  if (!email) {
    errors.push({
      field: "email",
      message:
        "Email ID is required.",
      code:
        "EMAIL_REQUIRED",
    });
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
      email
    )
  ) {
    errors.push({
      field: "email",
      message:
        "Enter a valid Email ID.",
      code:
        "INVALID_EMAIL",
    });
  }

  if (!business_category) {
    errors.push({
      field:
        "business_category",
      message:
        "Business Category / Type is required.",
      code:
        "BUSINESS_CATEGORY_REQUIRED",
    });
  } else if (
    !BUSINESS_CATEGORIES.has(
      business_category
    )
  ) {
    errors.push({
      field:
        "business_category",
      message:
        "Business Category must be Retail, Service, or Wholesale.",
      code:
        "INVALID_BUSINESS_CATEGORY",
    });
  }

  if (!city) {
    errors.push({
      field: "city",
      message:
        "City / Location is required.",
      code:
        "CITY_REQUIRED",
    });
  } else if (
    city.length > 150
  ) {
    errors.push({
      field: "city",
      message:
        "City / Location is too long.",
      code:
        "INVALID_CITY",
    });
  }

  if (!business_address) {
    errors.push({
      field:
        "business_address",
      message:
        "Business Address is required.",
      code:
        "BUSINESS_ADDRESS_REQUIRED",
    });
  } else if (
    business_address.length >
    2000
  ) {
    errors.push({
      field:
        "business_address",
      message:
        "Business Address is too long.",
      code:
        "INVALID_BUSINESS_ADDRESS",
    });
  }

if (!password) {
  errors.push({
    field: "password",
    message:
      "5-digit PIN is required.",
    code:
      "PASSWORD_REQUIRED",
  });
} else if (
  !/^\d{5}$/.test(password)
) {
  errors.push({
    field: "password",
    message:
      "PIN must contain exactly 5 digits.",
    code:
      "INVALID_PASSWORD",
  });
}

  if (
    referral &&
    referral.length > 100
  ) {
    errors.push({
      field: "referral",
      message:
        "Referral ID is too long.",
      code:
        "INVALID_REFERRAL",
    });
  }

  if (
    errors.length > 0
  ) {
    return createValidationFailure(
      errors
    );
  }

  return createValidationSuccess({
    business_name,
    owner_full_name,
    phone,
    email,
    business_category,
    city,
    business_address,
    password,
    referral:
      referral || null,
  });
};

module.exports = {
  BUSINESS_CATEGORIES,
  validateCommercialRegistration,
};