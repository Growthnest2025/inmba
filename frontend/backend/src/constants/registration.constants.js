const BLOCKED_PUBLIC_MEMBERSHIP_TYPES =
  Object.freeze([
    "honor",
    "honour",
    "honor member",
    "honour member",
  ]);

const STUDENT_MEMBERSHIP_TYPE =
  "Student Member";

const DEFAULT_PAYMENT_STATUS =
  "pending";

const MEMBER_ACCOUNT_LIMIT =
  3;

const MEMBER_REGISTRATION_FIELDS =
  Object.freeze([
    "first_name",
    "last_name",
    "father_name",
    "dob",
    "email",
    "phone",
    "pincode",
    "gender",
    "marital_status",
    "nationality",
    "occupation",
    "education",
    "membership_type",
    "referral",
    "aadhar",
    "password",
    "confirm_password",
  ]);

const STUDENT_REGISTRATION_FIELDS =
  Object.freeze([
    "fullname",
    "dob",
    "gender",
    "mobile",
    "email",

    "education_level",

    "school_name",
    "school_class",
    "board",
    "school_city",

    "ug_college",
    "ug_degree",
    "ug_department",
    "ug_year",

    "pg_college",
    "pg_degree",
    "pg_specialization",
    "pg_semester",

    "skills",
    "student_id",

    "referral",
    "ref",
    "referral_token",
  ]);

const STUDENT_UPLOAD_FIELDS =
  Object.freeze([
    "marksheet",
    "bonafide",
    "govt_id",
  ]);

module.exports = {
  BLOCKED_PUBLIC_MEMBERSHIP_TYPES,

  STUDENT_MEMBERSHIP_TYPE,
  DEFAULT_PAYMENT_STATUS,

  MEMBER_ACCOUNT_LIMIT,

  MEMBER_REGISTRATION_FIELDS,
  STUDENT_REGISTRATION_FIELDS,
  STUDENT_UPLOAD_FIELDS,
};