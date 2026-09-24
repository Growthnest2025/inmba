USE inmba;

/* =========================================================
   INMBA PROFESSIONAL MEMBERSHIP
   FULL KYC A - J DATABASE MIGRATION

   Existing kyc_members table only.
   Existing columns are NOT removed or renamed.
   Missing Professional KYC columns only are added.
========================================================= */


/* =========================================================
   A. IDENTITY & KYC

   Existing fields reused:
   first_name
   last_name
   father_name
   dob
   gender
   marital_status
   nationality
   aadhar
   pan_number
   pan_front
========================================================= */

ALTER TABLE kyc_members
  ADD COLUMN IF NOT EXISTS aadhar_front
    VARCHAR(255) NULL,

  ADD COLUMN IF NOT EXISTS aadhar_back
    VARCHAR(255) NULL,

  ADD COLUMN IF NOT EXISTS passport_number
    VARCHAR(100) NULL,

  ADD COLUMN IF NOT EXISTS voter_id
    VARCHAR(100) NULL,

  ADD COLUMN IF NOT EXISTS driving_license
    VARCHAR(100) NULL,

  ADD COLUMN IF NOT EXISTS blood_group
    VARCHAR(20) NULL;


/* =========================================================
   B. CONTACT & ADDRESS

   Existing fields reused:
   phone
   email
   whatsapp_number
   city
   district
   state
   pincode
========================================================= */

ALTER TABLE kyc_members
  ADD COLUMN IF NOT EXISTS secondary_mobile
    VARCHAR(30) NULL,

  ADD COLUMN IF NOT EXISTS current_address
    TEXT NULL,

  ADD COLUMN IF NOT EXISTS permanent_address
    TEXT NULL,

  ADD COLUMN IF NOT EXISTS address_proof
    VARCHAR(255) NULL,

  ADD COLUMN IF NOT EXISTS google_map_location
    VARCHAR(500) NULL;


/* =========================================================
   C. LEGAL & PROFESSIONAL COMPLIANCE
========================================================= */

ALTER TABLE kyc_members
  ADD COLUMN IF NOT EXISTS professional_license_number
    VARCHAR(150) NULL,

  ADD COLUMN IF NOT EXISTS professional_license_document
    VARCHAR(255) NULL,

  ADD COLUMN IF NOT EXISTS council_board_name
    VARCHAR(255) NULL,

  ADD COLUMN IF NOT EXISTS council_registration_number
    VARCHAR(150) NULL,

  ADD COLUMN IF NOT EXISTS council_registration_document
    VARCHAR(255) NULL,

  ADD COLUMN IF NOT EXISTS professional_indemnity_insurance
    VARCHAR(255) NULL,

  ADD COLUMN IF NOT EXISTS firm_pan_number
    VARCHAR(50) NULL,

  ADD COLUMN IF NOT EXISTS firm_pan_document
    VARCHAR(255) NULL,

  ADD COLUMN IF NOT EXISTS professional_gst_number
    VARCHAR(30) NULL,

  ADD COLUMN IF NOT EXISTS professional_gst_document
    VARCHAR(255) NULL;


/* =========================================================
   D. EDUCATION & QUALIFICATION

   Existing fields reused:
   education
   educational_qualification
   skills
========================================================= */

ALTER TABLE kyc_members
  ADD COLUMN IF NOT EXISTS school_college_name
    VARCHAR(255) NULL,

  ADD COLUMN IF NOT EXISTS degree_certificate_year
    VARCHAR(50) NULL,

  ADD COLUMN IF NOT EXISTS education_certificate
    VARCHAR(255) NULL,

  ADD COLUMN IF NOT EXISTS additional_certifications
    LONGTEXT NULL,

  ADD COLUMN IF NOT EXISTS language_skills
    TEXT NULL;


/* =========================================================
   E. ACHIEVEMENTS & CERTIFICATIONS
========================================================= */

ALTER TABLE kyc_members
  ADD COLUMN IF NOT EXISTS awards_recognitions
    LONGTEXT NULL,

  ADD COLUMN IF NOT EXISTS publications
    LONGTEXT NULL,

  ADD COLUMN IF NOT EXISTS professional_certifications
    LONGTEXT NULL,

  ADD COLUMN IF NOT EXISTS key_milestones
    LONGTEXT NULL,

  ADD COLUMN IF NOT EXISTS media_mentions
    LONGTEXT NULL,

  ADD COLUMN IF NOT EXISTS reference_letters
    LONGTEXT NULL;


/* =========================================================
   F. WORK EXPERIENCE & PORTFOLIO
========================================================= */

ALTER TABLE kyc_members
  ADD COLUMN IF NOT EXISTS total_experience_years
    DECIMAL(5,2) NULL,

  ADD COLUMN IF NOT EXISTS previous_employers_clients
    LONGTEXT NULL,

  ADD COLUMN IF NOT EXISTS work_samples
    LONGTEXT NULL,

  ADD COLUMN IF NOT EXISTS resume_cv
    VARCHAR(255) NULL,

  ADD COLUMN IF NOT EXISTS hourly_project_rate
    VARCHAR(100) NULL,

  ADD COLUMN IF NOT EXISTS availability_status
    VARCHAR(100) NULL;


/* =========================================================
   G. INTEREST, SKILLS & BIO

   Existing fields reused:
   skills
   profile_pic
   social_link
========================================================= */

ALTER TABLE kyc_members
  ADD COLUMN IF NOT EXISTS professional_bio
    LONGTEXT NULL,

  ADD COLUMN IF NOT EXISTS interest_categories
    TEXT NULL,

  ADD COLUMN IF NOT EXISTS hobbies
    TEXT NULL,

  ADD COLUMN IF NOT EXISTS preferred_industry
    VARCHAR(255) NULL,

  ADD COLUMN IF NOT EXISTS cover_photo
    VARCHAR(255) NULL,

  ADD COLUMN IF NOT EXISTS gallery_photos
    LONGTEXT NULL,

  ADD COLUMN IF NOT EXISTS intro_video
    VARCHAR(500) NULL,

  ADD COLUMN IF NOT EXISTS portfolio_url
    VARCHAR(500) NULL;


/* =========================================================
   H. FINANCIAL & BANK

   Existing fields reused:
   account_holder
   bank_name
   account_number
   ifsc
   branch
   bank_proof

   Existing nominee fields reused:
   nomini_name
   nomini_relationship
   nomini_aadhar
========================================================= */

ALTER TABLE kyc_members
  ADD COLUMN IF NOT EXISTS upi_id
    VARCHAR(150) NULL,

  ADD COLUMN IF NOT EXISTS income_tax_declaration
    VARCHAR(255) NULL,

  ADD COLUMN IF NOT EXISTS nomini_id_document
    VARCHAR(255) NULL;


/* =========================================================
   I. NETWORK / ROYALTY

   Existing fields reused:
   referral_id
   referred_by
   direct_network
   indirect_network

   Team Size:
   direct_network + indirect_network
   so duplicate team_size column is unnecessary.
========================================================= */

ALTER TABLE kyc_members
  ADD COLUMN IF NOT EXISTS network_level
    VARCHAR(100) NULL,

  ADD COLUMN IF NOT EXISTS royalty_slab_category
    VARCHAR(100) NULL,

  ADD COLUMN IF NOT EXISTS preferred_payout_cycle
    VARCHAR(100) NULL;


/* =========================================================
   J. EMERGENCY & NOMINEE
========================================================= */

ALTER TABLE kyc_members
  ADD COLUMN IF NOT EXISTS emergency_contact_name
    VARCHAR(255) NULL,

  ADD COLUMN IF NOT EXISTS emergency_contact_number
    VARCHAR(30) NULL,

  ADD COLUMN IF NOT EXISTS emergency_relationship
    VARCHAR(100) NULL;


/* =========================================================
   PROFESSIONAL KYC WORKFLOW STATUS
========================================================= */

ALTER TABLE kyc_members
  ADD COLUMN IF NOT EXISTS professional_kyc_current_step
    CHAR(1) NULL DEFAULT 'A',

  ADD COLUMN IF NOT EXISTS professional_kyc_status
    VARCHAR(50) NOT NULL DEFAULT 'draft',

  ADD COLUMN IF NOT EXISTS professional_kyc_submitted_at
    DATETIME NULL,

  ADD COLUMN IF NOT EXISTS professional_kyc_completed_at
    DATETIME NULL,

  ADD COLUMN IF NOT EXISTS professional_kyc_rejection_reason
    TEXT NULL;


/* =========================================================
   A - J SECTION COMPLETION
========================================================= */

ALTER TABLE kyc_members
  ADD COLUMN IF NOT EXISTS professional_section_a_completed
    TINYINT(1) NOT NULL DEFAULT 0,

  ADD COLUMN IF NOT EXISTS professional_section_b_completed
    TINYINT(1) NOT NULL DEFAULT 0,

  ADD COLUMN IF NOT EXISTS professional_section_c_completed
    TINYINT(1) NOT NULL DEFAULT 0,

  ADD COLUMN IF NOT EXISTS professional_section_d_completed
    TINYINT(1) NOT NULL DEFAULT 0,

  ADD COLUMN IF NOT EXISTS professional_section_e_completed
    TINYINT(1) NOT NULL DEFAULT 0,

  ADD COLUMN IF NOT EXISTS professional_section_f_completed
    TINYINT(1) NOT NULL DEFAULT 0,

  ADD COLUMN IF NOT EXISTS professional_section_g_completed
    TINYINT(1) NOT NULL DEFAULT 0,

  ADD COLUMN IF NOT EXISTS professional_section_h_completed
    TINYINT(1) NOT NULL DEFAULT 0,

  ADD COLUMN IF NOT EXISTS professional_section_i_completed
    TINYINT(1) NOT NULL DEFAULT 0,

  ADD COLUMN IF NOT EXISTS professional_section_j_completed
    TINYINT(1) NOT NULL DEFAULT 0;


/* =========================================================
   PROFESSIONAL KYC CONSENT
========================================================= */

ALTER TABLE kyc_members
  ADD COLUMN IF NOT EXISTS professional_privacy_consent
    TINYINT(1) NOT NULL DEFAULT 0,

  ADD COLUMN IF NOT EXISTS professional_declaration_accepted
    TINYINT(1) NOT NULL DEFAULT 0,

  ADD COLUMN IF NOT EXISTS professional_declaration_at
    DATETIME NULL;


/* =========================================================
   END
========================================================= */