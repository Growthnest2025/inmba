const mysql = require("mysql2/promise");

const databaseConfig =
  require(
    "../config/database"
  );

/* =========================================================
   COMMERCIAL KYC CONSTANTS
========================================================= */

const COMMERCIAL_MEMBERSHIP_TYPE =
  "Commercial Member";

const COMMERCIAL_KYC_SECTIONS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
];

const COMMERCIAL_KYC_STATUSES = [
  "draft",
  "in_progress",
  "submitted",
  "under_review",
  "approved",
  "rejected",
];

/* =========================================================
   SECTION COMPLETION COLUMNS
========================================================= */

const SECTION_COMPLETION_COLUMNS = {
  A:
    "commercial_section_a_completed",

  B:
    "commercial_section_b_completed",

  C:
    "commercial_section_c_completed",

  D:
    "commercial_section_d_completed",

  E:
    "commercial_section_e_completed",

  F:
    "commercial_section_f_completed",

  G:
    "commercial_section_g_completed",
};

/* =========================================================
   COMMERCIAL KYC FIELD WHITELIST

   A. Owner Identity & KYC
   B. Business Legal & Registration
   C. Business Contact & Address
   D. Financial & Bank
   E. Business Profile & Achievements
   F. Network / Royalty Details
   G. Emergency & Nominee
========================================================= */

const SECTION_FIELDS = {

  /* =======================================================
     A. OWNER IDENTITY & KYC
  ======================================================= */

  A: [
    "first_name",
    "last_name",

    "father_name",

    "dob",

    "gender",

    "marital_status",

    "nationality",

    "aadhar",

    "aadhar_front",
    "aadhar_back",

    "pan_number",
    "pan_document",

    "passport_number",

    "voter_id",

    "driving_license",

    "blood_group",
  ],

  /* =======================================================
     B. BUSINESS LEGAL & REGISTRATION
  ======================================================= */

  B: [
    "business_name",

    "business_legal_type",

    "business_registration_number",

    "business_gst_certificate",

    "shop_establishment_license",

    "trade_license",

    "industry_specific_license",

    "company_pan_tan",

    "incorporation_certificate",

    "partnership_deed_moa_aoa",

    "authorized_signatory_id_proof",
  ],

  /* =======================================================
     C. BUSINESS CONTACT & ADDRESS
  ======================================================= */

  C: [
    "business_address",

    "branch_locations",

    "business_contact_number",

    "business_email",

    "business_website",

    "business_google_map_location",
  ],

  /* =======================================================
     D. FINANCIAL & BANK
  ======================================================= */

  D: [
    "account_number",

    "ifsc",

    "commercial_bank_branch_name",

    "commercial_bank_proof",

    "commercial_upi_id",

    "commercial_gst_number",

    "commercial_income_tax_declaration",

    "commercial_nominee_name",

    "commercial_nominee_relationship",

    "commercial_nominee_aadhaar_id",

    "commercial_nominee_id_document",
  ],

  /* =======================================================
     E. BUSINESS PROFILE & ACHIEVEMENTS
  ======================================================= */

  E: [
    "business_year_established",

    "business_number_of_employees",

    "business_annual_turnover_slab",

    "products_services_offered",

    "business_category_tags",

    "business_awards_certifications",

    "business_client_testimonials",

    "business_bio",

    "business_logo",

    "business_gallery_photos",

    "business_promo_video",

    "business_social_media_links",
  ],

  /* =======================================================
     F. NETWORK / ROYALTY

     IMPORTANT:

     These are backend controlled:

     referred_by
     referral_id
     direct_network
     indirect_network
     commercial_network_level
     commercial_royalty_slab_category

     User can update only payout cycle.
  ======================================================= */

  F: [
    "commercial_preferred_payout_cycle",
  ],

  /* =======================================================
     G. EMERGENCY & NOMINEE
  ======================================================= */

  G: [
    "commercial_emergency_contact_name",

    "commercial_emergency_contact_number",

    "commercial_emergency_relationship",
  ],
};

/* =========================================================
   COMMERCIAL DATABASE CONFIG
========================================================= */

const commercialDatabaseConfig = {
  host:
    databaseConfig.host,

  port:
    databaseConfig.port,

  user:
    databaseConfig.user,

  password:
    databaseConfig.password,

  database:
    databaseConfig.database,

  waitForConnections:
    databaseConfig.waitForConnections,

  connectionLimit:
    databaseConfig.connectionLimit,

  maxIdle:
    databaseConfig.maxIdle,

  idleTimeout:
    databaseConfig.idleTimeout,

  queueLimit:
    databaseConfig.queueLimit,

  connectTimeout:
    databaseConfig.connectTimeout,

  enableKeepAlive:
    databaseConfig.enableKeepAlive,

  keepAliveInitialDelay:
    databaseConfig.keepAliveInitialDelay,

  namedPlaceholders:
    databaseConfig.namedPlaceholders,

  dateStrings:
    databaseConfig.dateStrings,

  charset:
    databaseConfig.charset,
};

let commercialDatabasePool =
  null;

/* =========================================================
   GET COMMERCIAL DATABASE POOL
========================================================= */

const getCommercialDatabasePool =
  () => {

    if (
      !commercialDatabasePool
    ) {
      commercialDatabasePool =
        mysql.createPool(
          commercialDatabaseConfig
        );
    }

    return commercialDatabasePool;
  };

/* =========================================================
   GET DATABASE EXECUTOR
========================================================= */

const getDatabaseExecutor =
  (
    executor = null
  ) => {

    return (
      executor ||
      getCommercialDatabasePool()
    );
  };

/* =========================================================
   RUN QUERY
========================================================= */

const runQuery =
  async (
    sql,
    params = [],
    executor = null
  ) => {

    const db =
      getDatabaseExecutor(
        executor
      );

    if (
      typeof db?.execute ===
      "function"
    ) {
      const [
        rows,
      ] =
        await db.execute(
          sql,
          params
        );

      return rows;
    }

    if (
      typeof db?.query ===
      "function"
    ) {
      const [
        rows,
      ] =
        await db.query(
          sql,
          params
        );

      return rows;
    }

    throw new Error(
      "Database executor is not available."
    );
  };

/* =========================================================
   TRANSACTION CONNECTION
========================================================= */

const getTransactionConnection =
  async () => {

    const pool =
      getCommercialDatabasePool();

    if (
      typeof pool?.getConnection !==
      "function"
    ) {
      throw new Error(
        "Database connection pool is not available."
      );
    }

    return pool.getConnection();
  };

/* =========================================================
   TEXT NORMALIZER
========================================================= */

const toText =
  (
    value,
    fallback = ""
  ) => {

    const text =
      String(
        value ?? ""
      ).trim();

    return (
      text ||
      fallback
    );
  };

/* =========================================================
   NORMALIZE SECTION
========================================================= */

const normalizeSection =
  (
    section
  ) => {

    const normalized =
      toText(
        section
      ).toUpperCase();

    if (
      !COMMERCIAL_KYC_SECTIONS
        .includes(
          normalized
        )
    ) {
      throw new Error(
        "Invalid Commercial KYC section."
      );
    }

    return normalized;
  };

/* =========================================================
   NORMALIZE DATABASE VALUE
========================================================= */

const normalizeDatabaseValue =
  (
    value
  ) => {

    if (
      typeof value ===
      "undefined"
    ) {
      return undefined;
    }

    if (
      value === null
    ) {
      return null;
    }

    if (
      typeof value ===
      "boolean"
    ) {
      return value
        ? 1
        : 0;
    }

    if (
      Array.isArray(
        value
      )
    ) {
      return JSON.stringify(
        value
      );
    }

    if (
      value &&
      typeof value ===
      "object"
    ) {
      return JSON.stringify(
        value
      );
    }

    return value;
  };

/* =========================================================
   NEXT SECTION
========================================================= */

const getNextSection =
  (
    section
  ) => {

    const normalized =
      normalizeSection(
        section
      );

    const index =
      COMMERCIAL_KYC_SECTIONS
        .indexOf(
          normalized
        );

    if (
      index < 0 ||
      index ===
        COMMERCIAL_KYC_SECTIONS
          .length - 1
    ) {
      return "G";
    }

    return (
      COMMERCIAL_KYC_SECTIONS[
        index + 1
      ]
    );
  };

/* =========================================================
   COMMERCIAL MEMBER CONDITION
========================================================= */

const COMMERCIAL_MEMBER_CONDITION = `
  LOWER(
    TRIM(
      membership_type
    )
  ) IN (
    'commercial member',
    'commercial membership',
    'commercial'
  )
`;

/* =========================================================
   FIND COMMERCIAL MEMBER BY ID
========================================================= */

const findCommercialMemberById =
  async (
    memberId,
    executor = null
  ) => {

    const rows =
      await runQuery(
        `
          SELECT

            kyc_members.*,

            (
              COALESCE(
                direct_network,
                0
              )
              +
              COALESCE(
                indirect_network,
                0
              )
            )
            AS team_size

          FROM
            kyc_members

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${COMMERCIAL_MEMBER_CONDITION}

          LIMIT 1
        `,
        [
          memberId,
        ],
        executor
      );

    return (
      rows?.[0] ||
      null
    );
  };

/* =========================================================
   FIND BY LOGIN ID
========================================================= */

const findCommercialMemberByLoginId =
  async (
    loginId,
    executor = null
  ) => {

    const rows =
      await runQuery(
        `
          SELECT

            kyc_members.*,

            (
              COALESCE(
                direct_network,
                0
              )
              +
              COALESCE(
                indirect_network,
                0
              )
            )
            AS team_size

          FROM
            kyc_members

          WHERE
            login_id = ?

            AND
            is_deleted = 0

            AND
            ${COMMERCIAL_MEMBER_CONDITION}

          LIMIT 1
        `,
        [
          toText(
            loginId
          ),
        ],
        executor
      );

    return (
      rows?.[0] ||
      null
    );
  };

/* =========================================================
   FIND BY TOKEN
========================================================= */

const findCommercialMemberByToken =
  async (
    token,
    executor = null
  ) => {

    const rows =
      await runQuery(
        `
          SELECT

            kyc_members.*,

            (
              COALESCE(
                direct_network,
                0
              )
              +
              COALESCE(
                indirect_network,
                0
              )
            )
            AS team_size

          FROM
            kyc_members

          WHERE
            token = ?

            AND
            is_deleted = 0

            AND
            ${COMMERCIAL_MEMBER_CONDITION}

          LIMIT 1
        `,
        [
          toText(
            token
          ),
        ],
        executor
      );

    return (
      rows?.[0] ||
      null
    );
  };

/* =========================================================
   GET COMMERCIAL KYC
========================================================= */

const getCommercialKycByMemberId =
  (
    memberId,
    executor = null
  ) => {

    return findCommercialMemberById(
      memberId,
      executor
    );
  };

const getCommercialKycByLoginId =
  (
    loginId,
    executor = null
  ) => {

    return findCommercialMemberByLoginId(
      loginId,
      executor
    );
  };

const getCommercialKycByToken =
  (
    token,
    executor = null
  ) => {

    return findCommercialMemberByToken(
      token,
      executor
    );
  };

/* =========================================================
   FILTER SECTION DATA
========================================================= */

const getAllowedSectionData =
  (
    section,
    values
  ) => {

    const normalized =
      normalizeSection(
        section
      );

    const source =
      values &&
      typeof values ===
        "object" &&
      !Array.isArray(
        values
      )
        ? values
        : {};

    const result =
      {};

    for (
      const fieldName
      of SECTION_FIELDS[
        normalized
      ]
    ) {

      if (
        !Object.prototype
          .hasOwnProperty
          .call(
            source,
            fieldName
          )
      ) {
        continue;
      }

      const value =
        normalizeDatabaseValue(
          source[
            fieldName
          ]
        );

      if (
        typeof value ===
        "undefined"
      ) {
        continue;
      }

      result[
        fieldName
      ] =
        value;
    }

    return result;
  };

/* =========================================================
   CURRENT STEP
========================================================= */

const updateCommercialKycCurrentStep =
  async (
    memberId,
    section,
    executor = null
  ) => {

    const normalized =
      normalizeSection(
        section
      );

    const result =
      await runQuery(
        `
          UPDATE
            kyc_members

          SET

            commercial_kyc_current_step = ?,

            commercial_kyc_status =
              CASE

                WHEN
                  commercial_kyc_status
                  IN (
                    'submitted',
                    'under_review',
                    'approved'
                  )

                THEN
                  commercial_kyc_status

                ELSE
                  'in_progress'

              END

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${COMMERCIAL_MEMBER_CONDITION}
        `,
        [
          normalized,
          memberId,
        ],
        executor
      );

    return (
      result?.affectedRows ||
      0
    );
  };

/* =========================================================
   SECTION COMPLETION
========================================================= */

const setSectionCompletion =
  async (
    memberId,
    section,
    completed,
    executor = null
  ) => {

    const normalized =
      normalizeSection(
        section
      );

    const completionColumn =
      SECTION_COMPLETION_COLUMNS[
        normalized
      ];

    const result =
      await runQuery(
        `
          UPDATE
            kyc_members

          SET
            \`${completionColumn}\`
            = ?

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${COMMERCIAL_MEMBER_CONDITION}
        `,
        [
          completed
            ? 1
            : 0,

          memberId,
        ],
        executor
      );

    return (
      result?.affectedRows ||
      0
    );
  };

/* =========================================================
   SAVE COMMERCIAL KYC SECTION
========================================================= */

const saveCommercialKycSection =
  async ({
    memberId,

    section,

    values = {},

    completed = false,
  }) => {

    const normalized =
      normalizeSection(
        section
      );

    const sectionData =
      getAllowedSectionData(
        normalized,
        values
      );

    const connection =
      await getTransactionConnection();

    try {

      await connection
        .beginTransaction();

      /* ===================================================
         LOCK COMMERCIAL MEMBER
      =================================================== */

      const memberRows =
        await runQuery(
          `
            SELECT

              id,

              membership_type,

              commercial_kyc_status

            FROM
              kyc_members

            WHERE
              id = ?

              AND
              is_deleted = 0

              AND
              ${COMMERCIAL_MEMBER_CONDITION}

            LIMIT 1

            FOR UPDATE
          `,
          [
            memberId,
          ],
          connection
        );

      const member =
        memberRows?.[0];

      if (
        !member
      ) {
        await connection
          .rollback();

        return null;
      }

      /* ===================================================
         APPROVED PROFILE LOCK
      =================================================== */

      if (
        member
          .commercial_kyc_status ===
        "approved"
      ) {
        throw new Error(
          "Approved Commercial KYC cannot be modified."
        );
      }

      /* ===================================================
         UPDATE SECTION FIELDS
      =================================================== */

      const fieldNames =
        Object.keys(
          sectionData
        );

      if (
        fieldNames.length >
        0
      ) {

        const assignments =
          fieldNames
            .map(
              (
                field
              ) =>
                `\`${field}\` = ?`
            )
            .join(
              ", "
            );

        const params =
          fieldNames.map(
            (
              field
            ) =>
              sectionData[
                field
              ]
          );

        params.push(
          memberId
        );

        await runQuery(
          `
            UPDATE
              kyc_members

            SET
              ${assignments}

            WHERE
              id = ?

              AND
              is_deleted = 0

              AND
              ${COMMERCIAL_MEMBER_CONDITION}
          `,
          params,
          connection
        );
      }

      /* ===================================================
         COMPLETION FLAG
      =================================================== */

      await setSectionCompletion(
        memberId,
        normalized,
        completed,
        connection
      );

      /* ===================================================
         NEXT STEP
      =================================================== */

      const nextSection =
        completed
          ? getNextSection(
              normalized
            )
          : normalized;

      await updateCommercialKycCurrentStep(
        memberId,
        nextSection,
        connection
      );

      await connection
        .commit();

      return findCommercialMemberById(
        memberId
      );

    } catch (
      error
    ) {

      try {
        await connection
          .rollback();
      } catch {
        // Preserve original error.
      }

      throw error;

    } finally {

      connection
        .release();
    }
  };

/* =========================================================
   SAVE SECTION A
========================================================= */

const saveSectionA =
  (
    memberId,
    values,
    options = {}
  ) => {

    return saveCommercialKycSection({
      memberId,

      section:
        "A",

      values,

      completed:
        Boolean(
          options.completed
        ),
    });
  };

/* =========================================================
   SAVE SECTION B
========================================================= */

const saveSectionB =
  (
    memberId,
    values,
    options = {}
  ) => {

    return saveCommercialKycSection({
      memberId,

      section:
        "B",

      values,

      completed:
        Boolean(
          options.completed
        ),
    });
  };

/* =========================================================
   SAVE SECTION C
========================================================= */

const saveSectionC =
  (
    memberId,
    values,
    options = {}
  ) => {

    return saveCommercialKycSection({
      memberId,

      section:
        "C",

      values,

      completed:
        Boolean(
          options.completed
        ),
    });
  };

/* =========================================================
   SAVE SECTION D
========================================================= */

const saveSectionD =
  (
    memberId,
    values,
    options = {}
  ) => {

    return saveCommercialKycSection({
      memberId,

      section:
        "D",

      values,

      completed:
        Boolean(
          options.completed
        ),
    });
  };

/* =========================================================
   SAVE SECTION E
========================================================= */

const saveSectionE =
  (
    memberId,
    values,
    options = {}
  ) => {

    return saveCommercialKycSection({
      memberId,

      section:
        "E",

      values,

      completed:
        Boolean(
          options.completed
        ),
    });
  };

/* =========================================================
   SAVE SECTION F
========================================================= */

const saveSectionF =
  (
    memberId,
    values,
    options = {}
  ) => {

    return saveCommercialKycSection({
      memberId,

      section:
        "F",

      values,

      completed:
        Boolean(
          options.completed
        ),
    });
  };

/* =========================================================
   SAVE SECTION G
========================================================= */

const saveSectionG =
  (
    memberId,
    values,
    options = {}
  ) => {

    return saveCommercialKycSection({
      memberId,

      section:
        "G",

      values,

      completed:
        Boolean(
          options.completed
        ),
    });
  };

/* =========================================================
   COMPLETION STATE
========================================================= */

const getCommercialKycCompletionState =
  async (
    memberId,
    executor = null
  ) => {

    const rows =
      await runQuery(
        `
          SELECT

            commercial_kyc_current_step,

            commercial_kyc_status,

            commercial_section_a_completed,

            commercial_section_b_completed,

            commercial_section_c_completed,

            commercial_section_d_completed,

            commercial_section_e_completed,

            commercial_section_f_completed,

            commercial_section_g_completed,

            commercial_privacy_consent,

            commercial_declaration_accepted,

            commercial_kyc_submitted_at,

            commercial_kyc_completed_at,

            commercial_kyc_rejection_reason

          FROM
            kyc_members

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${COMMERCIAL_MEMBER_CONDITION}

          LIMIT 1
        `,
        [
          memberId,
        ],
        executor
      );

    const record =
      rows?.[0];

    if (
      !record
    ) {
      return null;
    }

    const sections =
      {};

    let completedCount =
      0;

    for (
      const section
      of COMMERCIAL_KYC_SECTIONS
    ) {

      const column =
        SECTION_COMPLETION_COLUMNS[
          section
        ];

      const completed =
        Number(
          record[
            column
          ] ||
          0
        ) === 1;

      sections[
        section
      ] =
        completed;

      if (
        completed
      ) {
        completedCount +=
          1;
      }
    }

    const totalSections =
      COMMERCIAL_KYC_SECTIONS
        .length;

    return {

      currentStep:
        record
          .commercial_kyc_current_step ||
        "A",

      status:
        record
          .commercial_kyc_status ||
        "draft",

      sections,

      completedCount,

      totalSections,

      progressPercent:
        Math.round(
          (
            completedCount /
            totalSections
          ) *
          100
        ),

      allSectionsCompleted:
        completedCount ===
        totalSections,

      privacyConsent:
        Number(
          record
            .commercial_privacy_consent ||
          0
        ) === 1,

      declarationAccepted:
        Number(
          record
            .commercial_declaration_accepted ||
          0
        ) === 1,

      submittedAt:
        record
          .commercial_kyc_submitted_at ||
        null,

      completedAt:
        record
          .commercial_kyc_completed_at ||
        null,

      rejectionReason:
        record
          .commercial_kyc_rejection_reason ||
        null,
    };
  };

/* =========================================================
   SAVE CONSENT
========================================================= */

const saveCommercialKycConsent =
  async (
    memberId,
    {
      privacyConsent,

      declarationAccepted,
    },
    executor = null
  ) => {

    const privacyValue =
      privacyConsent
        ? 1
        : 0;

    const declarationValue =
      declarationAccepted
        ? 1
        : 0;

    const result =
      await runQuery(
        `
          UPDATE
            kyc_members

          SET

            commercial_privacy_consent = ?,

            commercial_declaration_accepted = ?,

            commercial_declaration_at =
              CASE

                WHEN
                  ? = 1

                THEN
                  NOW()

                ELSE
                  NULL

              END

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${COMMERCIAL_MEMBER_CONDITION}
        `,
        [
          privacyValue,

          declarationValue,

          declarationValue,

          memberId,
        ],
        executor
      );

    return (
      result?.affectedRows ||
      0
    );
  };

/* =========================================================
   COMMERCIAL NETWORK SNAPSHOT
========================================================= */

const getCommercialNetworkSnapshot =
  async (
    memberId,
    executor = null
  ) => {

    const rows =
      await runQuery(
        `
          SELECT

            referral_id,

            referred_by,

            COALESCE(
              direct_network,
              0
            )
            AS direct_network,

            COALESCE(
              indirect_network,
              0
            )
            AS indirect_network,

            (
              COALESCE(
                direct_network,
                0
              )
              +
              COALESCE(
                indirect_network,
                0
              )
            )
            AS team_size,

            commercial_network_level,

            commercial_royalty_slab_category,

            commercial_preferred_payout_cycle

          FROM
            kyc_members

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${COMMERCIAL_MEMBER_CONDITION}

          LIMIT 1
        `,
        [
          memberId,
        ],
        executor
      );

    return (
      rows?.[0] ||
      null
    );
  };

/* =========================================================
   SYSTEM NETWORK UPDATE

   Client request-க்கு direct expose பண்ணக்கூடாது.
========================================================= */

const updateCommercialSystemNetwork =
  async (
    memberId,
    {
      networkLevel,

      royaltySlabCategory,
    },
    executor = null
  ) => {

    const result =
      await runQuery(
        `
          UPDATE
            kyc_members

          SET

            commercial_network_level = ?,

            commercial_royalty_slab_category = ?

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${COMMERCIAL_MEMBER_CONDITION}
        `,
        [
          networkLevel ??
          null,

          royaltySlabCategory ??
          null,

          memberId,
        ],
        executor
      );

    return (
      result?.affectedRows ||
      0
    );
  };

/* =========================================================
   ALL A-G COMPLETE
========================================================= */

const areAllCommercialSectionsComplete =
  async (
    memberId,
    executor = null
  ) => {

    const state =
      await getCommercialKycCompletionState(
        memberId,
        executor
      );

    return Boolean(
      state
        ?.allSectionsCompleted
    );
  };

/* =========================================================
   FINAL SUBMIT COMMERCIAL KYC
========================================================= */

const submitCommercialKyc =
  async (
    memberId,
    {
      privacyConsent,

      declarationAccepted,
    }
  ) => {

    const connection =
      await getTransactionConnection();

    try {

      await connection
        .beginTransaction();

      const memberRows =
        await runQuery(
          `
            SELECT

              id,

              commercial_kyc_status,

              commercial_section_a_completed,

              commercial_section_b_completed,

              commercial_section_c_completed,

              commercial_section_d_completed,

              commercial_section_e_completed,

              commercial_section_f_completed,

              commercial_section_g_completed

            FROM
              kyc_members

            WHERE
              id = ?

              AND
              is_deleted = 0

              AND
              ${COMMERCIAL_MEMBER_CONDITION}

            LIMIT 1

            FOR UPDATE
          `,
          [
            memberId,
          ],
          connection
        );

      const member =
        memberRows?.[0];

      if (
        !member
      ) {

        await connection
          .rollback();

        return {
          success:
            false,

          reason:
            "MEMBER_NOT_FOUND",
        };
      }

      /* ===================================================
         CHECK ALL SECTIONS
      =================================================== */

      const incompleteSections =
        COMMERCIAL_KYC_SECTIONS
          .filter(
            (
              section
            ) => {

              const column =
                SECTION_COMPLETION_COLUMNS[
                  section
                ];

              return (
                Number(
                  member[
                    column
                  ] ||
                  0
                ) !== 1
              );
            }
          );

      if (
        incompleteSections
          .length >
        0
      ) {

        await connection
          .rollback();

        return {
          success:
            false,

          reason:
            "INCOMPLETE_SECTIONS",

          incompleteSections,
        };
      }

      /* ===================================================
         CONSENT REQUIRED
      =================================================== */

      if (
        !privacyConsent ||
        !declarationAccepted
      ) {

        await connection
          .rollback();

        return {
          success:
            false,

          reason:
            "CONSENT_REQUIRED",
        };
      }

      /* ===================================================
         SAVE CONSENT
      =================================================== */

      await saveCommercialKycConsent(
        memberId,
        {
          privacyConsent:
            true,

          declarationAccepted:
            true,
        },
        connection
      );

      /* ===================================================
         SUBMIT
      =================================================== */

      await runQuery(
        `
          UPDATE
            kyc_members

          SET

            commercial_kyc_status =
              'submitted',

            commercial_kyc_current_step =
              'G',

            commercial_kyc_submitted_at =
              NOW(),

            commercial_kyc_rejection_reason =
              NULL

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${COMMERCIAL_MEMBER_CONDITION}
        `,
        [
          memberId,
        ],
        connection
      );

      await connection
        .commit();

      return {
        success:
          true,

        member:
          await findCommercialMemberById(
            memberId
          ),

        status:
          "submitted",
      };

    } catch (
      error
    ) {

      try {
        await connection
          .rollback();
      } catch {
        // Preserve original error.
      }

      throw error;

    } finally {

      connection
        .release();
    }
  };

/* =========================================================
   UPDATE KYC STATUS
========================================================= */

const updateCommercialKycStatus =
  async (
    memberId,

    status,

    {
      rejectionReason =
        null,
    } = {},

    executor = null
  ) => {

    const normalizedStatus =
      toText(
        status
      ).toLowerCase();

    if (
      !COMMERCIAL_KYC_STATUSES
        .includes(
          normalizedStatus
        )
    ) {
      throw new Error(
        "Invalid Commercial KYC status."
      );
    }

    const approved =
      normalizedStatus ===
      "approved";

    const result =
      await runQuery(
        `
          UPDATE
            kyc_members

          SET

            commercial_kyc_status = ?,

            commercial_kyc_rejection_reason = ?,

            commercial_kyc_completed_at =
              CASE

                WHEN
                  ? = 1

                THEN
                  NOW()

                ELSE
                  commercial_kyc_completed_at

              END

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${COMMERCIAL_MEMBER_CONDITION}
        `,
        [
          normalizedStatus,

          normalizedStatus ===
            "rejected"
            ? (
                toText(
                  rejectionReason
                ) ||
                null
              )
            : null,

          approved
            ? 1
            : 0,

          memberId,
        ],
        executor
      );

    return (
      result?.affectedRows ||
      0
    );
  };

/* =========================================================
   UNDER REVIEW
========================================================= */

const markCommercialKycUnderReview =
  (
    memberId,
    executor = null
  ) => {

    return updateCommercialKycStatus(
      memberId,

      "under_review",

      {},

      executor
    );
  };

/* =========================================================
   APPROVE
========================================================= */

const approveCommercialKyc =
  (
    memberId,
    executor = null
  ) => {

    return updateCommercialKycStatus(
      memberId,

      "approved",

      {},

      executor
    );
  };

/* =========================================================
   REJECT
========================================================= */

const rejectCommercialKyc =
  (
    memberId,

    rejectionReason,

    executor = null
  ) => {

    return updateCommercialKycStatus(
      memberId,

      "rejected",

      {
        rejectionReason,
      },

      executor
    );
  };

/* =========================================================
   REOPEN REJECTED KYC
========================================================= */

const reopenCommercialKyc =
  async (
    memberId,
    executor = null
  ) => {

    const result =
      await runQuery(
        `
          UPDATE
            kyc_members

          SET

            commercial_kyc_status =
              'in_progress',

            commercial_kyc_rejection_reason =
              NULL,

            commercial_kyc_submitted_at =
              NULL,

            commercial_privacy_consent =
              0,

            commercial_declaration_accepted =
              0,

            commercial_declaration_at =
              NULL

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            commercial_kyc_status =
              'rejected'

            AND
            ${COMMERCIAL_MEMBER_CONDITION}
        `,
        [
          memberId,
        ],
        executor
      );

    return (
      result?.affectedRows ||
      0
    );
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

  COMMERCIAL_MEMBERSHIP_TYPE,

  COMMERCIAL_KYC_SECTIONS,

  COMMERCIAL_KYC_STATUSES,

  SECTION_FIELDS,

  SECTION_COMPLETION_COLUMNS,

  COMMERCIAL_MEMBER_CONDITION,

  findCommercialMemberById,

  findCommercialMemberByLoginId,

  findCommercialMemberByToken,

  getCommercialKycByMemberId,

  getCommercialKycByLoginId,

  getCommercialKycByToken,

  getAllowedSectionData,

  updateCommercialKycCurrentStep,

  setSectionCompletion,

  saveCommercialKycSection,

  saveSectionA,

  saveSectionB,

  saveSectionC,

  saveSectionD,

  saveSectionE,

  saveSectionF,

  saveSectionG,

  getCommercialKycCompletionState,

  saveCommercialKycConsent,

  getCommercialNetworkSnapshot,

  updateCommercialSystemNetwork,

  areAllCommercialSectionsComplete,

  submitCommercialKyc,

  updateCommercialKycStatus,

  markCommercialKycUnderReview,

  approveCommercialKyc,

  rejectCommercialKyc,

  reopenCommercialKyc,
};