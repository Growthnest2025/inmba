const {
  STUDENT_REGISTRATION_FIELDS,
  STUDENT_MEMBERSHIP_TYPE,
  DEFAULT_PAYMENT_STATUS,
} = require(
  "../constants/registration.constants"
);

const {
  pickFormFields,
  getFirstAvailableField,
} = require(
  "../utils/formData.utils"
);

const {
  normalizeText,
  normalizeEmail,
  normalizeUppercase,
  createValidationError,
} = require(
  "../utils/validation.utils"
);

const {
  splitFullName,
} = require(
  "../utils/name.utils"
);

const normalizeStudentRegistrationInput =
  (rawInput = {}) => {
    const selectedFields =
      pickFormFields(
        rawInput,
        STUDENT_REGISTRATION_FIELDS
      );

    const referral =
      getFirstAvailableField(
        rawInput,
        [
          "referral",
          "ref",
          "referral_token",
          "referred_by",
        ],
        null
      );

    const fullname =
      normalizeText(
        selectedFields.fullname
      );

    const {
      firstName,
      lastName,
    } =
      splitFullName(
        fullname || ""
      );

    return {
      fullname,

      first_name:
        firstName,

      last_name:
        lastName,

      dob:
        normalizeText(
          selectedFields.dob
        ),

      gender:
        normalizeText(
          selectedFields.gender
        ),

      mobile:
        normalizeText(
          selectedFields.mobile
        ),

      /*
        Database column பெயர் phone.
        Form field பெயர் mobile.
      */
      phone:
        normalizeText(
          selectedFields.mobile
        ),

      email:
        normalizeEmail(
          selectedFields.email
        ),

      education_level:
        normalizeText(
          selectedFields
            .education_level
        ),

      school_name:
        normalizeText(
          selectedFields
            .school_name
        ),

      school_class:
        normalizeText(
          selectedFields
            .school_class
        ),

      board:
        normalizeText(
          selectedFields.board
        ),

      school_city:
        normalizeText(
          selectedFields
            .school_city
        ),

      ug_college:
        normalizeText(
          selectedFields
            .ug_college
        ),

      ug_degree:
        normalizeText(
          selectedFields
            .ug_degree
        ),

      ug_department:
        normalizeText(
          selectedFields
            .ug_department
        ),

      ug_year:
        normalizeText(
          selectedFields
            .ug_year
        ),

      pg_college:
        normalizeText(
          selectedFields
            .pg_college
        ),

      pg_degree:
        normalizeText(
          selectedFields
            .pg_degree
        ),

      pg_specialization:
        normalizeText(
          selectedFields
            .pg_specialization
        ),

      pg_semester:
        normalizeText(
          selectedFields
            .pg_semester
        ),

      skills:
        normalizeText(
          selectedFields.skills
        ),

      student_id:
        normalizeText(
          selectedFields
            .student_id
        ),

      referral:
        normalizeUppercase(
          referral
        ),

      membership_type:
        STUDENT_MEMBERSHIP_TYPE,

      payment_status:
        DEFAULT_PAYMENT_STATUS,
    };
  };

const validateStudentRegistration =
  (input) => {
    const errors = [];

    const normalizedInput =
      normalizeStudentRegistrationInput(
        input
      );

    if (
      !normalizedInput
        .first_name
    ) {
      errors.push(
        createValidationError(
          "fullname",
          "Please provide your name, email and mobile number.",
          "STUDENT_NAME_REQUIRED"
        )
      );
    }

    if (
      !normalizedInput.email
    ) {
      errors.push(
        createValidationError(
          "email",
          "Please provide your name, email and mobile number.",
          "STUDENT_EMAIL_REQUIRED"
        )
      );
    }

    if (
      !normalizedInput.mobile
    ) {
      errors.push(
        createValidationError(
          "mobile",
          "Please provide your name, email and mobile number.",
          "STUDENT_MOBILE_REQUIRED"
        )
      );
    }

    return {
      valid:
        errors.length === 0,

      errors,

      data:
        normalizedInput,
    };
  };

module.exports = {
  normalizeStudentRegistrationInput,
  validateStudentRegistration,
};