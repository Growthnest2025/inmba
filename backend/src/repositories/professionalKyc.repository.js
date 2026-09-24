const mysql =
  require(
    "mysql2/promise"
  );

const databaseConfig =
  require(
    "../config/database"
  );

/* =========================================================
   PROFESSIONAL KYC CONSTANTS
========================================================= */

const PROFESSIONAL_MEMBERSHIP_TYPE =
  "Professional Member";

const PROFESSIONAL_KYC_SECTIONS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
];

const PROFESSIONAL_KYC_STATUSES = [
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
    "professional_section_a_completed",

  B:
    "professional_section_b_completed",

  C:
    "professional_section_c_completed",

  D:
    "professional_section_d_completed",

  E:
    "professional_section_e_completed",

  F:
    "professional_section_f_completed",

  G:
    "professional_section_g_completed",

  H:
    "professional_section_h_completed",

  I:
    "professional_section_i_completed",

  J:
    "professional_section_j_completed",
};

/* =========================================================
   PROFESSIONAL KYC FIELD WHITELIST

   IMPORTANT:
   ------------------------------
   Client/request data எந்த column-ஐ வேண்டுமானாலும்
   update செய்ய முடியாது.

   ஒவ்வொரு section-க்கும் allowed DB fields மட்டும்
   இங்கே whitelist செய்யப்பட்டுள்ளது.
========================================================= */

const SECTION_FIELDS = {
  /* =======================================================
     A. IDENTITY & KYC
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
    "pan_front",

    "passport_number",
    "voter_id",
    "driving_license",
    "blood_group",
  ],

  /* =======================================================
     B. CONTACT & ADDRESS
  ======================================================= */

  B: [
    "phone",
    "secondary_mobile",

    "email",
    "whatsapp_number",

    "current_address",
    "permanent_address",

    "address_proof",

    "city",
    "district",
    "state",
    "pincode",

    "google_map_location",
  ],

  /* =======================================================
     C. LEGAL & PROFESSIONAL COMPLIANCE
  ======================================================= */

  C: [
    "professional_license_number",
    "professional_license_document",

    "council_board_name",
    "council_registration_number",
    "council_registration_document",

    "professional_indemnity_insurance",

    "firm_pan_number",
    "firm_pan_document",

    "professional_gst_number",
    "professional_gst_document",
  ],

  /* =======================================================
     D. EDUCATION & QUALIFICATION
  ======================================================= */

  D: [
    "education",
    "educational_qualification",

    "school_college_name",
    "degree_certificate_year",

    "education_certificate",

    "additional_certifications",
    "language_skills",
  ],

  /* =======================================================
     E. ACHIEVEMENTS & CERTIFICATIONS
  ======================================================= */

  E: [
    "awards_recognitions",
    "publications",

    "professional_certifications",

    "key_milestones",

    "media_mentions",

    "reference_letters",
  ],

  /* =======================================================
     F. WORK EXPERIENCE & PORTFOLIO
  ======================================================= */

  F: [
    "occupation",

    "total_experience_years",

    "previous_employers_clients",

    "work_samples",

    "resume_cv",

    "hourly_project_rate",

    "availability_status",
  ],

  /* =======================================================
     G. INTEREST, SKILLS & BIO
  ======================================================= */

  G: [
    "professional_bio",

    "interest_categories",

    "skills",

    "hobbies",

    "preferred_industry",

    "profile_pic",

    "cover_photo",

    "gallery_photos",

    "intro_video",

    "social_link",

    "portfolio_url",
  ],

  /* =======================================================
     H. FINANCIAL & BANK
  ======================================================= */

  H: [
    "account_holder",

    "bank_name",

    "account_number",

    "ifsc",

    "branch",

    "bank_proof",

    "upi_id",

    "professional_gst_number",

    "income_tax_declaration",

    "nomini_name",

    "nomini_relationship",

    "nomini_aadhar",

    "nomini_id_document",
  ],

  /* =======================================================
     I. NETWORK / ROYALTY

     IMPORTANT:
     referral_id
     referred_by
     network_level
     direct_network
     indirect_network
     royalty_slab_category

     user request மூலம் update ஆகாது.

     These are backend-controlled.
  ======================================================= */

  I: [
    "preferred_payout_cycle",
  ],

  /* =======================================================
     J. EMERGENCY & NOMINEE
  ======================================================= */

  J: [
    "emergency_contact_name",

    "emergency_contact_number",

    "emergency_relationship",
  ],
};

/* =========================================================
   PROFESSIONAL KYC DATABASE POOL

   IMPORTANT:
   ------------------------------
   ../config/database.js இந்த project-ல்
   connection config மட்டும் export செய்கிறது.

   அந்த working config file-ஐ மாற்றாமல்,
   Professional KYC repository-க்கு மட்டும்
   தனியான mysql2 promise pool உருவாக்கப்படுகிறது.

   databaseConfig object-ஐ direct-aa mutate செய்யவில்லை.
   அதனால் existing login / schema / session flow
   பாதிக்கப்படாது.
========================================================= */

const professionalDatabaseConfig = {
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

let professionalDatabasePool =
  null;

/* =========================================================
   GET PROFESSIONAL DATABASE POOL
========================================================= */

const getProfessionalDatabasePool =
  () => {
    if (
      !professionalDatabasePool
    ) {
      professionalDatabasePool =
        mysql.createPool(
          professionalDatabaseConfig
        );
    }

    return professionalDatabasePool;
  };

/* =========================================================
   DATABASE EXECUTOR

   Transaction connection வந்தால் அதையே use செய்யும்.
   இல்லையெனில் Professional KYC pool use செய்யும்.
========================================================= */

const getDatabaseExecutor =
  (
    executor = null
  ) => {
    if (
      executor
    ) {
      return executor;
    }

    return getProfessionalDatabasePool();
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
   GET TRANSACTION CONNECTION
========================================================= */

const getTransactionConnection =
  async () => {
    const pool =
      getProfessionalDatabasePool();

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
   NORMALIZE TEXT
========================================================= */

const toText =
  (
    value,
    fallback = ""
  ) => {
    const normalizedValue =
      String(
        value ?? ""
      ).trim();

    return (
      normalizedValue ||
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
    const normalizedSection =
      toText(section)
        .toUpperCase();

    if (
      !PROFESSIONAL_KYC_SECTIONS
        .includes(
          normalizedSection
        )
    ) {
      throw new Error(
        "Invalid Professional KYC section."
      );
    }

    return normalizedSection;
  };

/* =========================================================
   NORMALIZE DB VALUE
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
      Array.isArray(value)
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
    const normalizedSection =
      normalizeSection(
        section
      );

    const index =
      PROFESSIONAL_KYC_SECTIONS
        .indexOf(
          normalizedSection
        );

    if (
      index === -1 ||
      index ===
        PROFESSIONAL_KYC_SECTIONS
          .length -
          1
    ) {
      return "J";
    }

    return (
      PROFESSIONAL_KYC_SECTIONS[
        index + 1
      ]
    );
  };

/* =========================================================
   PROFESSIONAL MEMBERSHIP SQL CONDITION
========================================================= */

const PROFESSIONAL_MEMBER_CONDITION = `
  LOWER(
    TRIM(
      membership_type
    )
  ) IN (
    'professional member',
    'professional membership',
    'professional'
  )
`;

/* =========================================================
   FIND PROFESSIONAL MEMBER BY ID
========================================================= */

const findProfessionalMemberById =
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
            ) AS team_size

          FROM
            kyc_members

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${PROFESSIONAL_MEMBER_CONDITION}

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
   FIND PROFESSIONAL MEMBER BY LOGIN ID
========================================================= */

const findProfessionalMemberByLoginId =
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
            ) AS team_size

          FROM
            kyc_members

          WHERE
            login_id = ?

            AND
            is_deleted = 0

            AND
            ${PROFESSIONAL_MEMBER_CONDITION}

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
   FIND PROFESSIONAL MEMBER BY TOKEN
========================================================= */

const findProfessionalMemberByToken =
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
            ) AS team_size

          FROM
            kyc_members

          WHERE
            token = ?

            AND
            is_deleted = 0

            AND
            ${PROFESSIONAL_MEMBER_CONDITION}

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
   SAVE PROFESSIONAL MEMBERSHIP PLAN

   Allowed plans:
   ₹300
   ₹1500

   Account type remains Professional Member.
========================================================= */

const saveProfessionalPlan =
  async (
    memberId,
    selectedPlan,
    executor = null
  ) => {
    const plan =
      toText(
        selectedPlan
      );

    if (
      ![
        "300",
        "1500",
      ].includes(
        plan
      )
    ) {
      throw new Error(
        "Invalid Professional membership plan."
      );
    }

    const result =
      await runQuery(
        `
          UPDATE
            kyc_members

          SET
            selected_plan = ?,

            plan_selected_at =
              NOW()

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${PROFESSIONAL_MEMBER_CONDITION}
        `,
        [
          plan,
          memberId,
        ],
        executor
      );

    if (
      !result?.affectedRows
    ) {
      return null;
    }

    return (
      findProfessionalMemberById(
        memberId,
        executor
      )
    );
  };

/* =========================================================
   GET PROFESSIONAL KYC

   Main Full KYC page initial load
========================================================= */

const getProfessionalKycByMemberId =
  async (
    memberId,
    executor = null
  ) => {
    return (
      findProfessionalMemberById(
        memberId,
        executor
      )
    );
  };

/* =========================================================
   GET PROFESSIONAL KYC BY TOKEN
========================================================= */

const getProfessionalKycByToken =
  async (
    token,
    executor = null
  ) => {
    return (
      findProfessionalMemberByToken(
        token,
        executor
      )
    );
  };

/* =========================================================
   GET PROFESSIONAL KYC BY LOGIN ID
========================================================= */

const getProfessionalKycByLoginId =
  async (
    loginId,
    executor = null
  ) => {
    return (
      findProfessionalMemberByLoginId(
        loginId,
        executor
      )
    );
  };

/* =========================================================
   FILTER SECTION DATA

   Request body-la extra fields வந்தாலும்
   DB update செய்யப்படாது.
========================================================= */

const getAllowedSectionData =
  (
    section,
    values
  ) => {
    const normalizedSection =
      normalizeSection(
        section
      );

    const source =
      values &&
      typeof values ===
        "object" &&
      !Array.isArray(values)
        ? values
        : {};

    const allowedFields =
      SECTION_FIELDS[
        normalizedSection
      ];

    const result = {};

    for (
      const fieldName
      of allowedFields
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

      const normalizedValue =
        normalizeDatabaseValue(
          source[
            fieldName
          ]
        );

      if (
        typeof normalizedValue ===
        "undefined"
      ) {
        continue;
      }

      result[
        fieldName
      ] =
        normalizedValue;
    }

    return result;
  };

/* =========================================================
   UPDATE PROFESSIONAL KYC CURRENT STEP
========================================================= */

const updateProfessionalKycCurrentStep =
  async (
    memberId,
    section,
    executor = null
  ) => {
    const normalizedSection =
      normalizeSection(
        section
      );

    const result =
      await runQuery(
        `
          UPDATE
            kyc_members

          SET
            professional_kyc_current_step = ?,

            professional_kyc_status =
              CASE

                WHEN
                  professional_kyc_status
                  IN (
                    'submitted',
                    'under_review',
                    'approved'
                  )

                THEN
                  professional_kyc_status

                ELSE
                  'in_progress'

              END

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${PROFESSIONAL_MEMBER_CONDITION}
        `,
        [
          normalizedSection,
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
   MARK SECTION COMPLETION
========================================================= */

const setSectionCompletion =
  async (
    memberId,
    section,
    completed,
    executor = null
  ) => {
    const normalizedSection =
      normalizeSection(
        section
      );

    const completionColumn =
      SECTION_COMPLETION_COLUMNS[
        normalizedSection
      ];

    const result =
      await runQuery(
        `
          UPDATE
            kyc_members

          SET
            ${completionColumn} = ?

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${PROFESSIONAL_MEMBER_CONDITION}
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
   SAVE PROFESSIONAL KYC SECTION

   Save Draft:
   completed = false

   Save & Next:
   completed = true
========================================================= */

const saveProfessionalKycSection =
  async ({
    memberId,

    section,

    values = {},

    completed = false,
  }) => {
    const normalizedSection =
      normalizeSection(
        section
      );

    const sectionData =
      getAllowedSectionData(
        normalizedSection,
        values
      );

    const connection =
      await getTransactionConnection();

    try {
      await connection
        .beginTransaction();

      /* ===================================================
         LOCK MEMBER
      =================================================== */

      const memberRows =
        await runQuery(
          `
            SELECT
              id,
              membership_type,
              professional_kyc_status

            FROM
              kyc_members

            WHERE
              id = ?

              AND
              is_deleted = 0

              AND
              ${PROFESSIONAL_MEMBER_CONDITION}

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

      if (!member) {
        await connection
          .rollback();

        return null;
      }

      /* ===================================================
         DO NOT MODIFY APPROVED KYC
      =================================================== */

      if (
        member
          .professional_kyc_status ===
        "approved"
      ) {
        throw new Error(
          "Approved Professional KYC cannot be modified."
        );
      }

      /* ===================================================
         BUILD SECTION UPDATE
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
                fieldName
              ) =>
                `${fieldName} = ?`
            )
            .join(", ");

        const params =
          fieldNames.map(
            (
              fieldName
            ) =>
              sectionData[
                fieldName
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
              ${PROFESSIONAL_MEMBER_CONDITION}
          `,
          params,
          connection
        );
      }

      /* ===================================================
         SECTION COMPLETE FLAG
      =================================================== */

      await setSectionCompletion(
        memberId,
        normalizedSection,
        completed,
        connection
      );

      /* ===================================================
         CURRENT STEP
      =================================================== */

      const nextSection =
        completed
          ? getNextSection(
              normalizedSection
            )
          : normalizedSection;

      await updateProfessionalKycCurrentStep(
        memberId,
        nextSection,
        connection
      );

      await connection
        .commit();

      return (
        findProfessionalMemberById(
          memberId
        )
      );
    } catch (error) {
      try {
        await connection
          .rollback();
      } catch {
        // Ignore rollback error.
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
  async (
    memberId,
    values,
    options = {}
  ) => {
    return (
      saveProfessionalKycSection({
        memberId,

        section: "A",

        values,

        completed:
          Boolean(
            options.completed
          ),
      })
    );
  };

/* =========================================================
   SAVE SECTION B
========================================================= */

const saveSectionB =
  async (
    memberId,
    values,
    options = {}
  ) => {
    return (
      saveProfessionalKycSection({
        memberId,

        section: "B",

        values,

        completed:
          Boolean(
            options.completed
          ),
      })
    );
  };

/* =========================================================
   SAVE SECTION C
========================================================= */

const saveSectionC =
  async (
    memberId,
    values,
    options = {}
  ) => {
    return (
      saveProfessionalKycSection({
        memberId,

        section: "C",

        values,

        completed:
          Boolean(
            options.completed
          ),
      })
    );
  };

/* =========================================================
   SAVE SECTION D
========================================================= */

const saveSectionD =
  async (
    memberId,
    values,
    options = {}
  ) => {
    return (
      saveProfessionalKycSection({
        memberId,

        section: "D",

        values,

        completed:
          Boolean(
            options.completed
          ),
      })
    );
  };

/* =========================================================
   SAVE SECTION E
========================================================= */

const saveSectionE =
  async (
    memberId,
    values,
    options = {}
  ) => {
    return (
      saveProfessionalKycSection({
        memberId,

        section: "E",

        values,

        completed:
          Boolean(
            options.completed
          ),
      })
    );
  };

/* =========================================================
   SAVE SECTION F
========================================================= */

const saveSectionF =
  async (
    memberId,
    values,
    options = {}
  ) => {
    return (
      saveProfessionalKycSection({
        memberId,

        section: "F",

        values,

        completed:
          Boolean(
            options.completed
          ),
      })
    );
  };

/* =========================================================
   SAVE SECTION G
========================================================= */

const saveSectionG =
  async (
    memberId,
    values,
    options = {}
  ) => {
    return (
      saveProfessionalKycSection({
        memberId,

        section: "G",

        values,

        completed:
          Boolean(
            options.completed
          ),
      })
    );
  };

/* =========================================================
   SAVE SECTION H
========================================================= */

const saveSectionH =
  async (
    memberId,
    values,
    options = {}
  ) => {
    return (
      saveProfessionalKycSection({
        memberId,

        section: "H",

        values,

        completed:
          Boolean(
            options.completed
          ),
      })
    );
  };

/* =========================================================
   SAVE SECTION I
========================================================= */

const saveSectionI =
  async (
    memberId,
    values,
    options = {}
  ) => {
    return (
      saveProfessionalKycSection({
        memberId,

        section: "I",

        values,

        completed:
          Boolean(
            options.completed
          ),
      })
    );
  };

/* =========================================================
   SAVE SECTION J
========================================================= */

const saveSectionJ =
  async (
    memberId,
    values,
    options = {}
  ) => {
    return (
      saveProfessionalKycSection({
        memberId,

        section: "J",

        values,

        completed:
          Boolean(
            options.completed
          ),
      })
    );
  };

/* =========================================================
   GET PROFESSIONAL KYC COMPLETION STATE
========================================================= */

const getProfessionalKycCompletionState =
  async (
    memberId,
    executor = null
  ) => {
    const rows =
      await runQuery(
        `
          SELECT
            professional_kyc_current_step,
            professional_kyc_status,

            professional_section_a_completed,
            professional_section_b_completed,
            professional_section_c_completed,
            professional_section_d_completed,
            professional_section_e_completed,
            professional_section_f_completed,
            professional_section_g_completed,
            professional_section_h_completed,
            professional_section_i_completed,
            professional_section_j_completed,

            professional_privacy_consent,
            professional_declaration_accepted,

            professional_kyc_submitted_at,
            professional_kyc_completed_at,
            professional_kyc_rejection_reason

          FROM
            kyc_members

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${PROFESSIONAL_MEMBER_CONDITION}

          LIMIT 1
        `,
        [
          memberId,
        ],
        executor
      );

    const record =
      rows?.[0];

    if (!record) {
      return null;
    }

    const sections = {};

    let completedCount =
      0;

    for (
      const section
      of PROFESSIONAL_KYC_SECTIONS
    ) {
      const columnName =
        SECTION_COMPLETION_COLUMNS[
          section
        ];

      const isCompleted =
        Number(
          record[
            columnName
          ] ||
            0
        ) === 1;

      sections[
        section
      ] =
        isCompleted;

      if (
        isCompleted
      ) {
        completedCount +=
          1;
      }
    }

    const totalSections =
      PROFESSIONAL_KYC_SECTIONS
        .length;

    return {
      currentStep:
        record
          .professional_kyc_current_step ||
        "A",

      status:
        record
          .professional_kyc_status ||
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
            .professional_privacy_consent ||
            0
        ) === 1,

      declarationAccepted:
        Number(
          record
            .professional_declaration_accepted ||
            0
        ) === 1,

      submittedAt:
        record
          .professional_kyc_submitted_at ||
        null,

      completedAt:
        record
          .professional_kyc_completed_at ||
        null,

      rejectionReason:
        record
          .professional_kyc_rejection_reason ||
        null,
    };
  };

/* =========================================================
   SAVE PROFESSIONAL CONSENT
========================================================= */

const saveProfessionalKycConsent =
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
            professional_privacy_consent = ?,

            professional_declaration_accepted = ?,

            professional_declaration_at =
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
            ${PROFESSIONAL_MEMBER_CONDITION}
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
   GET NETWORK / ROYALTY SNAPSHOT

   User cannot manually update these fields.
========================================================= */

const getProfessionalNetworkSnapshot =
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
            ) AS direct_network,

            COALESCE(
              indirect_network,
              0
            ) AS indirect_network,

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
            ) AS team_size,

            network_level,

            royalty_slab_category,

            preferred_payout_cycle

          FROM
            kyc_members

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${PROFESSIONAL_MEMBER_CONDITION}

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
   INTERNAL SYSTEM NETWORK UPDATE

   IMPORTANT:
   Controller request body-க்கு direct-aa
   இந்த function expose செய்யக்கூடாது.

   Backend internal calculations மட்டும் use செய்ய வேண்டும்.
========================================================= */

const updateProfessionalSystemNetwork =
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
            network_level = ?,

            royalty_slab_category = ?

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${PROFESSIONAL_MEMBER_CONDITION}
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
   CHECK ALL SECTIONS COMPLETE
========================================================= */

const areAllProfessionalSectionsComplete =
  async (
    memberId,
    executor = null
  ) => {
    const state =
      await getProfessionalKycCompletionState(
        memberId,
        executor
      );

    if (!state) {
      return false;
    }

    return (
      state
        .allSectionsCompleted
    );
  };

/* =========================================================
   FINAL PROFESSIONAL KYC SUBMISSION

   Requirements:
   - A to J completed
   - Privacy consent accepted
   - Declaration accepted
========================================================= */

const submitProfessionalKyc =
  async (
    memberId,
    {
      privacyConsent = false,
      declarationAccepted = false,
    } = {}
  ) => {
    const connection =
      await getTransactionConnection();

    try {
      await connection
        .beginTransaction();

      /* ===================================================
         LOCK MEMBER ROW
      =================================================== */

      const memberRows =
        await runQuery(
          `
            SELECT
              id,

              professional_kyc_status,

              professional_section_a_completed,
              professional_section_b_completed,
              professional_section_c_completed,
              professional_section_d_completed,
              professional_section_e_completed,
              professional_section_f_completed,
              professional_section_g_completed,
              professional_section_h_completed,
              professional_section_i_completed,
              professional_section_j_completed

            FROM
              kyc_members

            WHERE
              id = ?

              AND
              is_deleted = 0

              AND
              ${PROFESSIONAL_MEMBER_CONDITION}

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

      if (!member) {
        await connection
          .rollback();

        return {
          success: false,

          reason:
            "MEMBER_NOT_FOUND",
        };
      }

      /* ===================================================
         CHECK A - J
      =================================================== */

      const incompleteSections =
        PROFESSIONAL_KYC_SECTIONS
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
          success: false,

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
          success: false,

          reason:
            "CONSENT_REQUIRED",
        };
      }

      /* ===================================================
         SAVE CONSENT
      =================================================== */

      await saveProfessionalKycConsent(
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
         FINAL SUBMIT
      =================================================== */

      await runQuery(
        `
          UPDATE
            kyc_members

          SET
            professional_kyc_status =
              'submitted',

            professional_kyc_current_step =
              'J',

            professional_kyc_submitted_at =
              NOW(),

            professional_kyc_rejection_reason =
              NULL

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${PROFESSIONAL_MEMBER_CONDITION}
        `,
        [
          memberId,
        ],
        connection
      );

      await connection
        .commit();

      const updatedMember =
        await findProfessionalMemberById(
          memberId
        );

      return {
        success: true,

        member:
          updatedMember,

        status:
          "submitted",
      };
    } catch (error) {
      try {
        await connection
          .rollback();
      } catch {
        // Ignore rollback failure.
      }

      throw error;
    } finally {
      connection
        .release();
    }
  };

/* =========================================================
   UPDATE PROFESSIONAL KYC STATUS

   Later Admin Verification module use செய்யும்.

   allowed:
   draft
   in_progress
   submitted
   under_review
   approved
   rejected
========================================================= */

const updateProfessionalKycStatus =
  async (
    memberId,
    status,
    {
      rejectionReason = null,
    } = {},
    executor = null
  ) => {
    const normalizedStatus =
      toText(status)
        .toLowerCase();

    if (
      !PROFESSIONAL_KYC_STATUSES
        .includes(
          normalizedStatus
        )
    ) {
      throw new Error(
        "Invalid Professional KYC status."
      );
    }

    const completedAt =
      normalizedStatus ===
      "approved";

    const result =
      await runQuery(
        `
          UPDATE
            kyc_members

          SET
            professional_kyc_status = ?,

            professional_kyc_rejection_reason =
              ?,

            professional_kyc_completed_at =
              CASE

                WHEN
                  ? = 1

                THEN
                  NOW()

                ELSE
                  professional_kyc_completed_at

              END

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            ${PROFESSIONAL_MEMBER_CONDITION}
        `,
        [
          normalizedStatus,

          normalizedStatus ===
            "rejected"
            ? toText(
                rejectionReason
              ) ||
              null
            : null,

          completedAt
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
   MARK UNDER REVIEW
========================================================= */

const markProfessionalKycUnderReview =
  async (
    memberId,
    executor = null
  ) => {
    return (
      updateProfessionalKycStatus(
        memberId,
        "under_review",
        {},
        executor
      )
    );
  };

/* =========================================================
   APPROVE PROFESSIONAL KYC
========================================================= */

const approveProfessionalKyc =
  async (
    memberId,
    executor = null
  ) => {
    return (
      updateProfessionalKycStatus(
        memberId,
        "approved",
        {},
        executor
      )
    );
  };

/* =========================================================
   REJECT PROFESSIONAL KYC
========================================================= */

const rejectProfessionalKyc =
  async (
    memberId,
    rejectionReason,
    executor = null
  ) => {
    return (
      updateProfessionalKycStatus(
        memberId,
        "rejected",
        {
          rejectionReason,
        },
        executor
      )
    );
  };

/* =========================================================
   RESET REJECTED KYC FOR EDITING

   User edit/re-submit செய்யும்போது
   rejected -> in_progress.
========================================================= */

const reopenProfessionalKyc =
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
            professional_kyc_status =
              'in_progress',

            professional_kyc_rejection_reason =
              NULL,

            professional_kyc_submitted_at =
              NULL,

            professional_privacy_consent =
              0,

            professional_declaration_accepted =
              0,

            professional_declaration_at =
              NULL

          WHERE
            id = ?

            AND
            is_deleted = 0

            AND
            professional_kyc_status =
              'rejected'

            AND
            ${PROFESSIONAL_MEMBER_CONDITION}
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
   EXPORT
========================================================= */

module.exports = {
  PROFESSIONAL_MEMBERSHIP_TYPE,

  PROFESSIONAL_KYC_SECTIONS,

  PROFESSIONAL_KYC_STATUSES,

  SECTION_FIELDS,

  SECTION_COMPLETION_COLUMNS,

  findProfessionalMemberById,

  findProfessionalMemberByLoginId,

  findProfessionalMemberByToken,

  getProfessionalKycByMemberId,

  getProfessionalKycByLoginId,

  getProfessionalKycByToken,

  getAllowedSectionData,

  getProfessionalKycCompletionState,

  getProfessionalNetworkSnapshot,

  saveProfessionalPlan,

  saveProfessionalKycSection,

  saveSectionA,

  saveSectionB,

  saveSectionC,

  saveSectionD,

  saveSectionE,

  saveSectionF,

  saveSectionG,

  saveSectionH,

  saveSectionI,

  saveSectionJ,

  updateProfessionalKycCurrentStep,

  setSectionCompletion,

  saveProfessionalKycConsent,

  areAllProfessionalSectionsComplete,

  submitProfessionalKyc,

  updateProfessionalSystemNetwork,

  updateProfessionalKycStatus,

  markProfessionalKycUnderReview,

  approveProfessionalKyc,

  rejectProfessionalKyc,

  reopenProfessionalKyc,
};