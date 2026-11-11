const REQUIRED_DATABASE_SCHEMA =
  Object.freeze({
    /*
      Main member table.

      Flask setup_database.py-ல்
      உள்ள 91 columns exact order-ல்
      preserve செய்யப்பட்டுள்ளது.
    */
    kyc_members: [
      "id",

      "first_name",
      "last_name",
      "father_name",

      "dob",
      "email",
      "phone",
      "whatsapp_number",
      "contact_number",

      "gender",
      "marital_status",
      "nationality",

      "address",
      "city",
      "district",
      "state",
      "country",
      "pincode",

      "occupation",
      "education",
      "educational_qualification",

      "membership_type",

      "referred_by",
      "referral_id",

      "direct_network",
      "indirect_network",

      "aadhar",

      "token",
      "login_id",
      "password",

      "payment_status",
      "payment_method",
      "transaction_id",
      "subscription_year",
      "amount",
      "payment_proof",

      "account_holder",
      "bank_name",
      "account_number",
      "ifsc",
      "branch",
      "bank_proof",

      "pan_number",
      "pan_name",
      "pan_front",
      "pan_back",

      "profile_pic",
      "signature_image",

      "nomini_name",
      "nomini_dob",
      "nomini_relationship",
      "nomini_aadhar",

      "witness_name",
      "witness_phone",
      "witness_inmba_id",

      "entity_aadhar_number",
      "entity_house_no",
      "entity_street",
      "entity_area",
      "entity_city",
      "entity_district",
      "entity_state",
      "entity_pincode",
      "entity_aadhar_front",
      "entity_aadhar_back",
      "entity_aadhar_selfie",

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

      "marksheet",
      "bonafide",
      "govt_id",

      "social_link",
      "social_links",

      "otp",
      "otp_expires",

      "joining_date",
      "created_at",

      "is_deleted",
    ],

    /*
      Admin, Super Admin மற்றும்
      Subadmin table.
    */
    admins: [
      "id",
      "username",
      "email",
      "mobile",
      "first_name",
      "last_name",
      "role",
      "password_hash",
      "super_key",
      "otp",
      "otp_expires",
      "created_at",
    ],

    /*
      Events CRUD table.
    */
    events: [
      "id",
      "title",
      "event_date",
      "description",
      "badge",
      "location",
      "created_at",
    ],

    /*
      Permanently deleted member backup.
    */
    deleted_users_backup: [
      "backup_id",
      "original_id",
      "first_name",
      "last_name",
      "email",
      "phone",
      "backup_data",
      "backed_up_at",
    ],

    /*
      Full member backup.
    */
    all_users_backup: [
      "backup_id",
      "original_id",
      "backup_data",
      "backed_up_at",
    ],

    /*
      Step 4 Node MySQL session table.
    */
    inmba_sessions: [
      "session_id",
      "expires",
      "data",
    ],
  });

const REQUIRED_TABLE_NAMES =
  Object.freeze(
    Object.keys(
      REQUIRED_DATABASE_SCHEMA
    )
  );

const LEGACY_FLASK_TABLE_NAMES =
  Object.freeze([
    "kyc_members",
    "admins",
    "events",
    "deleted_users_backup",
    "all_users_backup",
  ]);

module.exports = {
  REQUIRED_DATABASE_SCHEMA,
  REQUIRED_TABLE_NAMES,
  LEGACY_FLASK_TABLE_NAMES,
};