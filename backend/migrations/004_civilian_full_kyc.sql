USE inmba;

/* =========================================================
   INMBA CIVILIAN / ROYALTY MEMBERSHIP
   FULL KYC A - H
========================================================= */

CREATE TABLE IF NOT EXISTS civilian_full_kyc (

  id INT UNSIGNED NOT NULL AUTO_INCREMENT,

  member_id INT NOT NULL,

  /* =======================================================
     PLAN
  ======================================================= */

  selected_plan VARCHAR(20) NULL,

  plan_selected_at DATETIME NULL,

  /* =======================================================
     A. IDENTITY & KYC
  ======================================================= */

  full_legal_name VARCHAR(255) NULL,

  father_spouse_name VARCHAR(255) NULL,

  dob DATE NULL,

  gender VARCHAR(50) NULL,

  marital_status VARCHAR(50) NULL,

  nationality VARCHAR(100) NULL,

  aadhaar_number VARCHAR(20) NULL,

  aadhaar_front VARCHAR(500) NULL,

  aadhaar_back VARCHAR(500) NULL,

  pan_number VARCHAR(30) NULL,

  pan_card_scan VARCHAR(500) NULL,

  passport_number VARCHAR(100) NULL,

  voter_id VARCHAR(100) NULL,

  driving_license VARCHAR(100) NULL,

  blood_group VARCHAR(20) NULL,

  /* =======================================================
     B. CONTACT & ADDRESS
  ======================================================= */

  primary_mobile VARCHAR(30) NULL,

  secondary_mobile VARCHAR(30) NULL,

  primary_email VARCHAR(255) NULL,

  whatsapp_number VARCHAR(30) NULL,

  current_address TEXT NULL,

  permanent_address TEXT NULL,

  address_proof VARCHAR(500) NULL,

  district VARCHAR(150) NULL,

  state VARCHAR(150) NULL,

  pincode VARCHAR(20) NULL,

  google_map_location VARCHAR(500) NULL,

  /* =======================================================
     C. FINANCIAL & BANK
  ======================================================= */

  account_holder_name VARCHAR(255) NULL,

  bank_name VARCHAR(255) NULL,

  bank_account_number VARCHAR(100) NULL,

  ifsc_code VARCHAR(30) NULL,

  bank_branch_name VARCHAR(255) NULL,

  bank_proof VARCHAR(500) NULL,

  upi_id VARCHAR(255) NULL,

  gst_number VARCHAR(50) NULL,

  income_tax_slab VARCHAR(100) NULL,

  nominee_name VARCHAR(255) NULL,

  nominee_relationship VARCHAR(100) NULL,

  nominee_id VARCHAR(500) NULL,

  /* =======================================================
     D. EDUCATION
  ======================================================= */

  highest_qualification VARCHAR(255) NULL,

  school_college_name VARCHAR(255) NULL,

  degree_year VARCHAR(50) NULL,

  education_certificate VARCHAR(500) NULL,

  additional_certifications LONGTEXT NULL,

  language_skills LONGTEXT NULL,

  /* =======================================================
     E. ACHIEVEMENTS
  ======================================================= */

  awards_recognitions LONGTEXT NULL,

  publications LONGTEXT NULL,

  professional_certifications LONGTEXT NULL,

  key_milestones LONGTEXT NULL,

  media_mentions LONGTEXT NULL,

  testimonials LONGTEXT NULL,

  /* =======================================================
     F. INTEREST / SKILLS / BIO
  ======================================================= */

  bio LONGTEXT NULL,

  interest_categories LONGTEXT NULL,

  skills LONGTEXT NULL,

  hobbies LONGTEXT NULL,

  preferred_industry VARCHAR(255) NULL,

  profile_photo VARCHAR(500) NULL,

  cover_photo VARCHAR(500) NULL,

  gallery_photos LONGTEXT NULL,

  intro_video VARCHAR(500) NULL,

  facebook_url VARCHAR(500) NULL,

  instagram_url VARCHAR(500) NULL,

  linkedin_url VARCHAR(500) NULL,

  youtube_url VARCHAR(500) NULL,

  website_portfolio VARCHAR(500) NULL,

  /* =======================================================
     G. NETWORK / ROYALTY
  ======================================================= */

  preferred_payout_cycle VARCHAR(100) NULL,

  /* =======================================================
     H. EMERGENCY CONTACT
  ======================================================= */

  emergency_contact_name VARCHAR(255) NULL,

  emergency_contact_number VARCHAR(30) NULL,

  emergency_relationship VARCHAR(100) NULL,

  /* =======================================================
     SECTION COMPLETION
  ======================================================= */

  section_a_completed TINYINT(1) NOT NULL DEFAULT 0,

  section_b_completed TINYINT(1) NOT NULL DEFAULT 0,

  section_c_completed TINYINT(1) NOT NULL DEFAULT 0,

  section_d_completed TINYINT(1) NOT NULL DEFAULT 0,

  section_e_completed TINYINT(1) NOT NULL DEFAULT 0,

  section_f_completed TINYINT(1) NOT NULL DEFAULT 0,

  section_g_completed TINYINT(1) NOT NULL DEFAULT 0,

  section_h_completed TINYINT(1) NOT NULL DEFAULT 0,

  /* =======================================================
     KYC STATUS
  ======================================================= */

  status VARCHAR(30)
    NOT NULL
    DEFAULT 'draft',

  submitted_at DATETIME NULL,

  approved_at DATETIME NULL,

  rejected_at DATETIME NULL,

  rejection_reason TEXT NULL,

  created_at TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP,

  updated_at TIMESTAMP
    NOT NULL
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),

  UNIQUE KEY uq_civilian_full_kyc_member_id (
    member_id
  ),

  KEY idx_civilian_full_kyc_status (
    status
  ),

  KEY idx_civilian_full_kyc_selected_plan (
    selected_plan
  )

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;