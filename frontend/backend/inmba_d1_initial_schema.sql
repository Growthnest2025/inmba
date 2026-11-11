-- INMBA D1 schema converted from schema.definition.js v33.0.0
-- Covers only the five TABLE_SCHEMAS explicitly defined in that file.
-- This is an initial schema for a NEW EMPTY D1 database, not the complete INMBA app schema.
-- Do not run the original MySQL bootstrap against D1.

CREATE TABLE IF NOT EXISTS "schema_migrations" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "migration_name" TEXT NOT NULL,
  "migration_version" TEXT NOT NULL,
  "details_json" TEXT NULL,
  "applied_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_verified_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_schema_migrations_migration_name" ON "schema_migrations" ("migration_name");

CREATE TABLE IF NOT EXISTS "commercial_basic_kyc" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "full_name" TEXT NOT NULL,
  "mobile" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "business_name" TEXT NOT NULL,
  "business_type" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "login_id" TEXT NULL,
  "kyc_status" TEXT NOT NULL DEFAULT 'submitted',
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_commercial_basic_kyc_mobile" ON "commercial_basic_kyc" ("mobile");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_commercial_basic_kyc_email" ON "commercial_basic_kyc" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_commercial_basic_kyc_login_id" ON "commercial_basic_kyc" ("login_id") WHERE "login_id" IS NOT NULL AND "login_id" <> '';

CREATE TABLE IF NOT EXISTS "commercial_payments" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "login_id" TEXT NOT NULL,
  "plan_id" TEXT NOT NULL,
  "plan_name" TEXT NOT NULL,
  "amount" NUMERIC NOT NULL,
  "payment_method" TEXT NULL,
  "transaction_id" TEXT NULL,
  "payment_status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_commercial_payments_login_id" ON "commercial_payments" ("login_id");

CREATE TABLE IF NOT EXISTS "commercial_kyc" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "member_id" INTEGER NULL,
  "login_id" TEXT NULL,
  "full_legal_name" TEXT NULL,
  "father_spouse_name" TEXT NULL,
  "dob" TEXT NULL,
  "gender" TEXT NULL,
  "marital_status" TEXT NULL,
  "nationality" TEXT NULL,
  "aadhaar_number" TEXT NULL,
  "pan_number" TEXT NULL,
  "passport_number" TEXT NULL,
  "voter_id" TEXT NULL,
  "driving_license" TEXT NULL,
  "blood_group" TEXT NULL,
  "business_name" TEXT NULL,
  "business_type" TEXT NULL,
  "registration_number" TEXT NULL,
  "gst_number" TEXT NULL,
  "company_pan" TEXT NULL,
  "tan_number" TEXT NULL,
  "business_address" TEXT NULL,
  "branch_locations" TEXT NULL,
  "business_phone" TEXT NULL,
  "business_email" TEXT NULL,
  "business_website" TEXT NULL,
  "google_map_pin" TEXT NULL,
  "bank_account_number" TEXT NULL,
  "ifsc_code" TEXT NULL,
  "bank_branch" TEXT NULL,
  "upi_id" TEXT NULL,
  "income_tax_slab" TEXT NULL,
  "nominee_name" TEXT NULL,
  "nominee_relation" TEXT NULL,
  "year_established" TEXT NULL,
  "employee_count" TEXT NULL,
  "annual_turnover" TEXT NULL,
  "products_services" TEXT NULL,
  "business_category_tags" TEXT NULL,
  "awards_certifications" TEXT NULL,
  "client_testimonials" TEXT NULL,
  "business_bio" TEXT NULL,
  "social_links" TEXT NULL,
  "referral_id" TEXT NULL,
  "preferred_payout_cycle" TEXT NULL,
  "emergency_contact_name" TEXT NULL,
  "emergency_contact_number" TEXT NULL,
  "emergency_relationship" TEXT NULL,
  "kyc_status" TEXT NULL DEFAULT 'draft',
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS "kyc_members" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "salutation" TEXT NULL,
  "first_name" TEXT NULL,
  "last_name" TEXT NULL,
  "email" TEXT NULL,
  "phone" TEXT NULL,
  "educational_qualification" TEXT NULL,
  "membership_type" TEXT NULL,
  "profile_pic" TEXT NULL,
  "business_name" TEXT NULL,
  "business_category" TEXT NULL,
  "business_address" TEXT NULL,
  "login_id" TEXT NULL,
  "referral_id" TEXT NULL,
  "referred_by" TEXT NULL,
  "payment_status" TEXT NOT NULL DEFAULT 'pending',
  "commercial_kyc_status" TEXT NULL DEFAULT 'draft',
  "commercial_kyc_current_step" TEXT NULL DEFAULT 'A',
  "commercial_section_a_completed" INTEGER NOT NULL DEFAULT 0,
  "commercial_section_b_completed" INTEGER NOT NULL DEFAULT 0,
  "commercial_section_c_completed" INTEGER NOT NULL DEFAULT 0,
  "commercial_section_d_completed" INTEGER NOT NULL DEFAULT 0,
  "commercial_section_e_completed" INTEGER NOT NULL DEFAULT 0,
  "commercial_section_f_completed" INTEGER NOT NULL DEFAULT 0,
  "commercial_section_g_completed" INTEGER NOT NULL DEFAULT 0,
  "commercial_privacy_consent" INTEGER NOT NULL DEFAULT 0,
  "commercial_declaration_accepted" INTEGER NOT NULL DEFAULT 0,
  "commercial_kyc_submitted_at" TEXT NULL,
  "commercial_kyc_completed_at" TEXT NULL,
  "commercial_kyc_rejection_reason" TEXT NULL,
  "commercial_declaration_at" TEXT NULL,
  "commercial_network_level" TEXT NULL,
  "commercial_royalty_slab_category" TEXT NULL,
  "commercial_preferred_payout_cycle" TEXT NULL,
  "business_legal_type" TEXT NULL,
  "business_registration_number" TEXT NULL,
  "business_contact_number" TEXT NULL,
  "business_email" TEXT NULL,
  "business_website" TEXT NULL,
  "business_google_map_location" TEXT NULL,
  "commercial_upi_id" TEXT NULL,
  "commercial_gst_number" TEXT NULL,
  "business_year_established" INTEGER NULL,
  "business_number_of_employees" INTEGER NULL,
  "business_annual_turnover_slab" TEXT NULL,
  "products_services_offered" TEXT NULL,
  "business_category_tags" TEXT NULL,
  "business_awards_certifications" TEXT NULL,
  "business_client_testimonials" TEXT NULL,
  "business_bio" TEXT NULL,
  "business_logo" TEXT NULL,
  "business_gallery_photos" TEXT NULL,
  "business_promo_video" TEXT NULL,
  "business_social_media_links" TEXT NULL,
  "commercial_emergency_contact_name" TEXT NULL,
  "commercial_emergency_contact_number" TEXT NULL,
  "commercial_emergency_relationship" TEXT NULL,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_kyc_members_email" ON "kyc_members" ("email");
CREATE INDEX IF NOT EXISTS "idx_kyc_members_phone" ON "kyc_members" ("phone");
CREATE INDEX IF NOT EXISTS "idx_kyc_members_membership_type" ON "kyc_members" ("membership_type");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_kyc_members_login_id" ON "kyc_members" ("login_id") WHERE "login_id" IS NOT NULL AND "login_id" <> '';
CREATE UNIQUE INDEX IF NOT EXISTS "uq_kyc_members_referral_id" ON "kyc_members" ("referral_id") WHERE "referral_id" IS NOT NULL AND "referral_id" <> '';

