const mysql = require("mysql2/promise");
const databaseConfig = require("../config/database");

const pool = mysql.createPool({
  ...databaseConfig,
  namedPlaceholders: true,
});

const CIVILIAN_KYC_SECTIONS = Object.freeze([
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
]);

const SECTION_FIELDS = Object.freeze({
  A: [
    "full_legal_name",
    "father_spouse_name",
    "dob",
    "gender",
    "marital_status",
    "nationality",
    "aadhaar_number",
    "aadhaar_front",
    "aadhaar_back",
    "pan_number",
    "pan_card_scan",
    "passport_number",
    "voter_id",
    "driving_license",
    "blood_group",
  ],

  B: [
    "primary_mobile",
    "secondary_mobile",
    "primary_email",
    "whatsapp_number",
    "current_address",
    "permanent_address",
    "address_proof",
    "district",
    "state",
    "pincode",
    "google_map_location",
  ],

  C: [
    "account_holder_name",
    "bank_name",
    "bank_account_number",
    "ifsc_code",
    "bank_branch_name",
    "bank_proof",
    "upi_id",
    "gst_number",
    "income_tax_slab",
    "nominee_name",
    "nominee_relationship",
    "nominee_id",
  ],

  D: [
    "highest_qualification",
    "school_college_name",
    "degree_year",
    "education_certificate",
    "additional_certifications",
    "language_skills",
  ],

  E: [
    "awards_recognitions",
    "publications",
    "professional_certifications",
    "key_milestones",
    "media_mentions",
    "testimonials",
  ],

  F: [
    "bio",
    "interest_categories",
    "skills",
    "hobbies",
    "preferred_industry",
    "profile_photo",
    "cover_photo",
    "gallery_photos",
    "intro_video",
    "facebook_url",
    "instagram_url",
    "linkedin_url",
    "youtube_url",
    "website_portfolio",
  ],

  G: [
    "preferred_payout_cycle",
  ],

  H: [
    "emergency_contact_name",
    "emergency_contact_number",
    "emergency_relationship",
  ],
});

const completionColumn = (section) =>
  `section_${String(section).toLowerCase()}_completed`;

const normalizeSection = (section) => {
  const value = String(section || "")
    .trim()
    .toUpperCase();

  if (!CIVILIAN_KYC_SECTIONS.includes(value)) {
    const error = new Error(
      "Invalid Civilian KYC section."
    );

    error.statusCode = 400;
    error.errorCode =
      "INVALID_CIVILIAN_KYC_SECTION";

    throw error;
  }

  return value;
};

/* =========================================================
   FIND MEMBER BY LOGIN ID
========================================================= */

const findMemberByLoginId = async (loginId) => {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        login_id,
        first_name,
        last_name,

        CONCAT_WS(
          ' ',
          NULLIF(TRIM(first_name), ''),
          NULLIF(TRIM(last_name), '')
        ) AS name,

        email,
        phone,
        referral_id,
        referred_by,
        network_level,
        direct_network,
        indirect_network,
        royalty_slab_category

      FROM kyc_members
      WHERE login_id = ?
        AND COALESCE(is_deleted, 0) = 0
      LIMIT 1
    `,
    [String(loginId || "").trim()]
  );

  return rows?.[0] || null;
};

/* =========================================================
   FIND MEMBER BY MEMBER ID
========================================================= */

const findMemberById = async (memberId) => {
  const [rows] = await pool.execute(
    `
      SELECT
        id,
        login_id,
        first_name,
        last_name,

        CONCAT_WS(
          ' ',
          NULLIF(TRIM(first_name), ''),
          NULLIF(TRIM(last_name), '')
        ) AS name,

        email,
        phone,
        referral_id,
        referred_by,
        network_level,
        direct_network,
        indirect_network,
        royalty_slab_category

      FROM kyc_members
      WHERE id = ?
        AND COALESCE(is_deleted, 0) = 0
      LIMIT 1
    `,
    [Number(memberId)]
  );

  return rows?.[0] || null;
};

/* =========================================================
   CREATE CIVILIAN FULL KYC ROW IF MISSING
========================================================= */

const createIfMissing = async (memberId) => {
  await pool.execute(
    `
      INSERT INTO civilian_full_kyc (
        member_id
      )
      VALUES (?)

      ON DUPLICATE KEY UPDATE
        member_id = VALUES(member_id)
    `,
    [
      Number(memberId),
    ]
  );
};

/* =========================================================
   GET FULL KYC
========================================================= */

const getByMemberId = async (memberId) => {
  await createIfMissing(
    memberId
  );

  const [rows] = await pool.execute(
    `
      SELECT *
      FROM civilian_full_kyc
      WHERE member_id = ?
      LIMIT 1
    `,
    [
      Number(memberId),
    ]
  );

  return rows?.[0] || null;
};

/* =========================================================
   SAVE CIVILIAN SELECTED PLAN
========================================================= */

const savePlan = async (
  memberId,
  selectedPlan
) => {
  const normalizedPlan =
    String(
      selectedPlan ?? ""
    ).trim();

  if (
    ![
      "300",
      "1500",
    ].includes(
      normalizedPlan
    )
  ) {
    const error =
      new Error(
        "Invalid Civilian plan. Please select 300 or 1500."
      );

    error.statusCode =
      422;

    error.errorCode =
      "INVALID_CIVILIAN_PLAN";

    throw error;
  }

  await createIfMissing(
    memberId
  );

  await pool.execute(
    `
      UPDATE civilian_full_kyc

      SET
        selected_plan = ?,
        plan_selected_at = NOW(),
        updated_at = NOW()

      WHERE member_id = ?
    `,
    [
      normalizedPlan,
      Number(memberId),
    ]
  );

  return getByMemberId(
    memberId
  );
};

/* =========================================================
   UPDATE SECTION
========================================================= */

const updateSection = async (
  memberId,
  section,
  values,
  completed
) => {
  const normalized =
    normalizeSection(
      section
    );

  const allowed =
    SECTION_FIELDS[
      normalized
    ];

  const safe = {};

  for (const key of allowed) {
    if (
      Object.prototype
        .hasOwnProperty
        .call(
          values || {},
          key
        )
    ) {
      safe[key] =
        values[key] === undefined
          ? null
          : values[key];
    }
  }

  const fields =
    Object.keys(
      safe
    );

  const params = [];

  const setters =
    fields.map(
      (field) => {
        params.push(
          safe[field]
        );

        return `\`${field}\` = ?`;
      }
    );

  setters.push(
    `\`${completionColumn(normalized)}\` = ?`
  );

  params.push(
    completed
      ? 1
      : 0
  );

  setters.push(
    `
      status =
        CASE
          WHEN status = 'draft'
          THEN 'in_progress'
          ELSE status
        END
    `
  );

  params.push(
    Number(memberId)
  );

  await createIfMissing(
    memberId
  );

  await pool.execute(
    `
      UPDATE civilian_full_kyc
      SET ${setters.join(", ")}
      WHERE member_id = ?
    `,
    params
  );

  return getByMemberId(
    memberId
  );
};

/* =========================================================
   SUBMIT FULL KYC
========================================================= */

const submit = async (
  memberId
) => {
  await createIfMissing(
    memberId
  );

  await pool.execute(
    `
      UPDATE civilian_full_kyc

      SET
        status = 'submitted',
        submitted_at = NOW(),
        updated_at = NOW()

      WHERE member_id = ?
    `,
    [
      Number(memberId),
    ]
  );

  return getByMemberId(
    memberId
  );
};

/* =========================================================
   REOPEN KYC
========================================================= */

const reopen = async (
  memberId
) => {
  await createIfMissing(
    memberId
  );

  await pool.execute(
    `
      UPDATE civilian_full_kyc

      SET
        status = 'in_progress',
        submitted_at = NULL,
        updated_at = NOW()

      WHERE member_id = ?
    `,
    [
      Number(memberId),
    ]
  );

  return getByMemberId(
    memberId
  );
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  CIVILIAN_KYC_SECTIONS,
  SECTION_FIELDS,

  normalizeSection,
  completionColumn,

  findMemberById,
  findMemberByLoginId,

  getByMemberId,

  savePlan,

  updateSection,

  submit,
  reopen,
};