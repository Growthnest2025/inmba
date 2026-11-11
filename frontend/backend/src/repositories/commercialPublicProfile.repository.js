const {
  executeQuery,
} = require(
  "./auth.repository"
);

/* =========================================================
   COMMERCIAL PUBLIC PROFILE REPOSITORY

   SECURITY RULE
   ---------------------------------------------------------
   This repository intentionally SELECTS only public-safe
   Commercial fields.

   NEVER SELECTED / NEVER RETURNED:

   - Legal Owner Name
   - Father / Spouse
   - DOB
   - Aadhaar
   - PAN
   - Passport
   - Voter ID
   - Driving Licence
   - Bank Account
   - IFSC
   - Bank Proof
   - UPI
   - Nominee
   - Annual Turnover
   - Sponsor / Referral ID
   - Team Size
   - Royalty Slab
   - Preferred Payout Cycle
   - Emergency Contact
   - Payment transaction details
   - Password
   - Token
   - Internal Member ID
========================================================= */


/* =========================================================
   COMMERCIAL MEMBERSHIP CONDITION
========================================================= */

const COMMERCIAL_MEMBER_CONDITION = `
  LOWER(
    TRIM(
      COALESCE(
        membership_type,
        ''
      )
    )
  ) IN (
    'commercial',
    'commercial member',
    'commercial membership'
  )
`;


/* =========================================================
   TEXT
========================================================= */

const normalizeText = (
  value
) => {
  return String(
    value ?? ""
  ).trim();
};


/* =========================================================
   LOGIN ID
========================================================= */

const normalizeLoginId = (
  value
) => {
  return normalizeText(
    value
  );
};


/* =========================================================
   PUBLIC MEDIA SQL

   Additional protection:

   Even if a private storage key is accidentally stored
   in a public media column, public profile must never
   return that path.
========================================================= */

const publicMediaColumn = (
  columnName
) => {
  return `
    CASE
      WHEN ${columnName} IS NULL
        THEN NULL

      WHEN TRIM(
        ${columnName}
      ) = ''
        THEN NULL

      WHEN LOWER(
        REPLACE(
          TRIM(
            ${columnName}
          ),
          '\\\\',
          '/'
        )
      ) LIKE 'private/%'
        THEN NULL

      WHEN LOWER(
        REPLACE(
          TRIM(
            ${columnName}
          ),
          '\\\\',
          '/'
        )
      ) LIKE '%/private/%'
        THEN NULL

      ELSE ${columnName}
    END
  `;
};


/* =========================================================
   COMMERCIAL PROFILE ACTIVATION CONDITION

   BASIC ₹300
   ---------------------------------
   Payment Approved

   PROFILE UPGRADE ₹1500
   ---------------------------------
   Payment Approved
   +
   Commercial KYC Approved

   Unknown/unactivated Commercial records are not exposed
   through the public profile API.
========================================================= */

const COMMERCIAL_PUBLIC_ACTIVATION_CONDITION = `
  (
    (
      CAST(
        COALESCE(
          amount,
          0
        )
        AS DECIMAL(12,2)
      ) = 300.00

      AND LOWER(
        TRIM(
          COALESCE(
            payment_status,
            ''
          )
        )
      ) = 'approved'
    )

    OR

    (
      CAST(
        COALESCE(
          amount,
          0
        )
        AS DECIMAL(12,2)
      ) = 1500.00

      AND LOWER(
        TRIM(
          COALESCE(
            payment_status,
            ''
          )
        )
      ) = 'approved'

      AND LOWER(
        TRIM(
          COALESCE(
            commercial_kyc_status,
            ''
          )
        )
      ) = 'approved'
    )
  )
`;


/* =========================================================
   FIND COMMERCIAL PUBLIC PROFILE

   IMPORTANT:

   login_id currently acts as the existing INMBA public
   profile handle:

   /user-profile/:loginId

   Business Name acts as the public Display Name.

   Legal owner first_name / last_name are deliberately
   NOT selected.
========================================================= */

const findCommercialPublicProfileByLoginId =
  async (
    loginId,
    connection = null
  ) => {
    const normalizedLoginId =
      normalizeLoginId(
        loginId
      );

    if (
      !normalizedLoginId
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT

            /* =============================================
               PUBLIC IDENTITY

               login_id:
               Existing public handle / profile URL key.

               business_name:
               Public Display Name / Brand Name.

               Internal DB id is intentionally NOT selected.
            ============================================= */

            login_id,

            membership_type,

            business_name,

            business_category,

            business_legal_type,


            /* =============================================
               PUBLIC LOCATION

               IMPORTANT:
               Raw registered business_address is NOT
               returned because it may contain full/private
               street-level data.

               Current public profile uses safe area-level
               location fields only.
            ============================================= */

            city,

            district,

            state,

            pincode,


            /* =============================================
               BUSINESS CONTACT

               Commercial PDF marks these Public.
            ============================================= */

            business_contact_number,

            business_email,

            business_website,

            business_google_map_location,


            /* =============================================
               BRANCH LOCATIONS

               Commercial PDF marks Branch Locations Public.
            ============================================= */

            branch_locations,


            /* =============================================
               BUSINESS PROFILE
            ============================================= */

            business_year_established,

            business_number_of_employees,

            products_services_offered,

            business_category_tags,

            business_awards_certifications,

            business_client_testimonials,

            business_bio,


            /* =============================================
               PUBLIC MEDIA

               Private storage path guard applied in SQL.
            ============================================= */

            ${publicMediaColumn(
              "business_logo"
            )}
            AS business_logo,

            ${publicMediaColumn(
              "business_gallery_photos"
            )}
            AS business_gallery_photos,

            ${publicMediaColumn(
              "business_promo_video"
            )}
            AS business_promo_video,

            business_social_media_links,


            /* =============================================
               PUBLIC NETWORK BADGE ONLY

               Team size / referral / royalty are PRIVATE.
            ============================================= */

            commercial_network_level,


            /* =============================================
               REGISTRATION VERIFIED BADGE

               Raw Udyam/MSME number is PRIVATE.

               Public receives only true / false.
            ============================================= */

            CASE

              WHEN NULLIF(
                TRIM(
                  COALESCE(
                    business_registration_number,
                    ''
                  )
                ),
                ''
              ) IS NOT NULL

              THEN 1

              ELSE 0

            END
            AS registration_verified,


            /* =============================================
               GST VERIFIED BADGE

               GST Number / Certificate remain PRIVATE.

               Public receives only true / false.
            ============================================= */

            CASE

              WHEN NULLIF(
                TRIM(
                  COALESCE(
                    commercial_gst_number,
                    ''
                  )
                ),
                ''
              ) IS NOT NULL

              OR

              NULLIF(
                TRIM(
                  COALESCE(
                    business_gst_certificate,
                    ''
                  )
                ),
                ''
              ) IS NOT NULL

              THEN 1

              ELSE 0

            END
            AS gst_verified,


            /* =============================================
               COMMERCIAL VERIFIED BADGE

               Public receives only status boolean.

               Raw payment/KYC details are NOT selected.
            ============================================= */

            CASE

              WHEN
                LOWER(
                  TRIM(
                    COALESCE(
                      payment_status,
                      ''
                    )
                  )
                ) = 'approved'

                AND

                (
                  CAST(
                    COALESCE(
                      amount,
                      0
                    )
                    AS DECIMAL(12,2)
                  ) = 300.00

                  OR

                  (
                    CAST(
                      COALESCE(
                        amount,
                        0
                      )
                      AS DECIMAL(12,2)
                    ) = 1500.00

                    AND

                    LOWER(
                      TRIM(
                        COALESCE(
                          commercial_kyc_status,
                          ''
                        )
                      )
                    ) = 'approved'
                  )
                )

              THEN 1

              ELSE 0

            END
            AS commercial_verified,


            /* =============================================
               PUBLIC PROFILE VISIBILITY CONFIG

               These contain field/section names only,
               not private KYC values.
            ============================================= */

            public_profile_fields,

            public_profile_sections,


            /* =============================================
               MEMBER SINCE

               Safe public metadata.
            ============================================= */

            created_at
              AS member_since

          FROM
            kyc_members

          WHERE

            login_id = ?

            AND COALESCE(
              is_deleted,
              0
            ) = 0

            AND
            ${COMMERCIAL_MEMBER_CONDITION}

            AND
            ${COMMERCIAL_PUBLIC_ACTIVATION_CONDITION}

          LIMIT 1
        `,
        [
          normalizedLoginId,
        ],
        connection
      );

    if (
      !Array.isArray(
        rows
      ) ||
      rows.length === 0
    ) {
      return null;
    }

    return (
      rows[0] ||
      null
    );
  };


/* =========================================================
   COMMERCIAL PUBLIC PROFILE EXISTS
========================================================= */

const commercialPublicProfileExists =
  async (
    loginId,
    connection = null
  ) => {
    const normalizedLoginId =
      normalizeLoginId(
        loginId
      );

    if (
      !normalizedLoginId
    ) {
      return false;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            1
              AS profile_exists

          FROM
            kyc_members

          WHERE

            login_id = ?

            AND COALESCE(
              is_deleted,
              0
            ) = 0

            AND
            ${COMMERCIAL_MEMBER_CONDITION}

            AND
            ${COMMERCIAL_PUBLIC_ACTIVATION_CONDITION}

          LIMIT 1
        `,
        [
          normalizedLoginId,
        ],
        connection
      );

    return Boolean(
      Array.isArray(
        rows
      ) &&
      rows[0]
    );
  };


/* =========================================================
   GET COMMERCIAL PUBLIC PROFILE TYPE

   Used later by main public profile API:

   profileType: "commercial"
========================================================= */

const findCommercialPublicProfileType =
  async (
    loginId,
    connection = null
  ) => {
    const normalizedLoginId =
      normalizeLoginId(
        loginId
      );

    if (
      !normalizedLoginId
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT

            login_id,

            membership_type

          FROM
            kyc_members

          WHERE

            login_id = ?

            AND COALESCE(
              is_deleted,
              0
            ) = 0

            AND
            ${COMMERCIAL_MEMBER_CONDITION}

            AND
            ${COMMERCIAL_PUBLIC_ACTIVATION_CONDITION}

          LIMIT 1
        `,
        [
          normalizedLoginId,
        ],
        connection
      );

    const member =
      Array.isArray(
        rows
      )
        ? rows[0]
        : null;

    if (
      !member
    ) {
      return null;
    }

    return {
      login_id:
        member.login_id,

      membership_type:
        member.membership_type,

      profile_type:
        "commercial",
    };
  };


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  COMMERCIAL_MEMBER_CONDITION,

  COMMERCIAL_PUBLIC_ACTIVATION_CONDITION,

  normalizeLoginId,

  findCommercialPublicProfileByLoginId,

  commercialPublicProfileExists,

  findCommercialPublicProfileType,
};