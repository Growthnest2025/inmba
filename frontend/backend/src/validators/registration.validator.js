const {
  BLOCKED_PUBLIC_MEMBERSHIP_TYPES,
  MEMBER_REGISTRATION_FIELDS,
} = require("../constants/registration.constants");
const {
  pickFormFields,
  getFirstAvailableField,
} = require("../utils/formData.utils");
const {
  normalizeText,
  normalizeEmail,
  normalizeUppercase,
  createValidationError,
} = require("../utils/validation.utils");

const normalizeMemberRegistrationInput = (rawInput = {}) => {
  const fields = pickFormFields(rawInput, MEMBER_REGISTRATION_FIELDS);
  const referral = getFirstAvailableField(
    rawInput,
    ["referral", "referred_by", "ref", "referral_token"],
    null
  );

  return {
    first_name: normalizeText(fields.first_name),
    last_name: normalizeText(fields.last_name),
    father_name: normalizeText(fields.father_name),
    dob: normalizeText(fields.dob),
    email: normalizeEmail(fields.email),
    phone: normalizeText(fields.phone),
    pincode: normalizeText(fields.pincode),
    gender: normalizeText(fields.gender),
    marital_status: normalizeText(fields.marital_status),
    nationality: normalizeText(fields.nationality),
    occupation: normalizeText(fields.occupation),
    education: normalizeText(fields.education),
    membership_type: normalizeText(fields.membership_type),
    referral: normalizeUppercase(referral),
    aadhar: normalizeText(fields.aadhar),
    password: normalizeText(fields.password, {
      trim: false,
      emptyAsNull: true,
    }),
    confirm_password: normalizeText(fields.confirm_password, {
      trim: false,
      emptyAsNull: true,
    }),
  };
};

const validateMemberRegistration = (input) => {
  const errors = [];
  const data = normalizeMemberRegistrationInput(input);
  const membershipType = String(data.membership_type || "")
    .trim()
    .toLowerCase();
  const isCivilian = membershipType === "civilian member";

  if (BLOCKED_PUBLIC_MEMBERSHIP_TYPES.includes(membershipType)) {
    errors.push(
      createValidationError(
        "membership_type",
        "Honor membership can only be granted by administrators.",
        "HONOR_MEMBERSHIP_BLOCKED"
      )
    );
  }

  if (isCivilian && !data.first_name) {
    errors.push(
      createValidationError(
        "full_name",
        "Full name is required.",
        "FULL_NAME_REQUIRED"
      )
    );
  }

  if (isCivilian && !/^\d{10}$/.test(data.phone || "")) {
    errors.push(
      createValidationError(
        "phone",
        "Enter a valid 10-digit mobile number.",
        "INVALID_PHONE"
      )
    );
  }

  if (!data.password) {
    errors.push(
      createValidationError(
        "password",
        "Password is required.",
        "PASSWORD_REQUIRED"
      )
    );
  } else if (isCivilian && data.password.length < 5) {
    errors.push(
      createValidationError(
        "password",
        "Password must contain at least 5 characters.",
        "INVALID_PASSWORD"
      )
    );
  }

  if (!data.confirm_password) {
    errors.push(
      createValidationError(
        "confirm_password",
        "Confirm password is required.",
        "CONFIRM_PASSWORD_REQUIRED"
      )
    );
  } else if (data.password !== data.confirm_password) {
    errors.push(
      createValidationError(
        "confirm_password",
        "Password and Confirm Password do not match.",
        "PASSWORD_MISMATCH"
      )
    );
  }

  return { valid: errors.length === 0, errors, data };
};

module.exports = {
  normalizeMemberRegistrationInput,
  validateMemberRegistration,
};
