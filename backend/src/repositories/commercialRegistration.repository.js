const {
  pool,
} = require(
  "../database/connection"
);

/* =========================================================
   HELPERS
========================================================= */

const resolveConnection = (
  connection = null
) => {
  return (
    connection ||
    pool
  );
};

const normalizeEmail = (
  value
) => {
  return String(
    value ?? ""
  )
    .trim()
    .toLowerCase();
};

const normalizePhone = (
  value
) => {
  return String(
    value ?? ""
  )
    .replace(/\D/g, "")
    .slice(-10);
};

const toText = (
  value
) => {
  return String(
    value ?? ""
  ).trim();
};

/* =========================================================
   TRANSACTION
========================================================= */

const withCommercialRegistrationTransaction =
  async (
    work
  ) => {
    if (
      typeof work !==
      "function"
    ) {
      throw new TypeError(
        "Commercial registration transaction requires a callback."
      );
    }

    const connection =
      await pool.getConnection();

    try {
      await connection.beginTransaction();

      const result =
        await work(
          connection
        );

      await connection.commit();

      return result;
    } catch (
      error
    ) {
      try {
        await connection.rollback();
      } catch {
        // Preserve original error.
      }

      throw error;
    } finally {
      connection.release();
    }
  };

/* =========================================================
   DUPLICATE ACCOUNT CHECK
========================================================= */

const countAccountsByEmailAndPhone =
  async (
    {
      email,
      phone,
    },
    connection = null
  ) => {
    const normalizedEmail =
      normalizeEmail(
        email
      );

    const normalizedPhone =
      normalizePhone(
        phone
      );

    if (
      !normalizedEmail ||
      !normalizedPhone
    ) {
      return 0;
    }

    const database =
      resolveConnection(
        connection
      );

    const [rows] =
      await database.query(
        `
          SELECT
            COUNT(*) AS total
          FROM
            kyc_members
          WHERE
            email = ?
            AND phone = ?
        `,
        [
          normalizedEmail,
          normalizedPhone,
        ]
      );

    return Number(
      rows?.[0]?.total ||
      0
    );
  };

/* =========================================================
   INSERT COMMERCIAL REGISTRATION

   PDF MAPPING:

   Business / Shop Name
       -> business_name

   Owner Full Name
       -> first_name + last_name

   Mobile Number
       -> phone

   Email ID
       -> email

   Business Category / Type
       -> business_category

   City / Location
       -> city

   Business Address
       -> business_address + address

   Password / PIN
       -> hashed password

   Referral ID
       -> referred_by
========================================================= */

const insertCommercialRegistration =
  async (
    {
      first_name = null,
      last_name = null,

      email,
      phone,

      business_name,
      business_category,

      city,
      business_address,

      referred_by = null,

      token,
      login_id,
      passwordHash,
    },
    connection = null
  ) => {
    const database =
      resolveConnection(
        connection
      );

    const [result] =
      await database.query(
        `
          INSERT INTO kyc_members
          (
            first_name,
            last_name,

            email,
            phone,

            city,
            address,

            business_name,
            business_category,
            business_address,

            membership_type,

            referred_by,

            token,
            login_id,
            password,

            payment_status,

            created_at
          )

          VALUES
          (
            ?,
            ?,

            ?,
            ?,

            ?,
            ?,

            ?,
            ?,
            ?,

            'Commercial Member',

            ?,

            ?,
            ?,
            ?,

            'pending',

            NOW()
          )
        `,
        [
          first_name,
          last_name,

          normalizeEmail(
            email
          ),

          normalizePhone(
            phone
          ),

          toText(
            city
          ) || null,

          toText(
            business_address
          ) || null,

          toText(
            business_name
          ),

          toText(
            business_category
          ),

          toText(
            business_address
          ),

          referred_by
            ? toText(
                referred_by
              ).toUpperCase()
            : null,

          toText(
            token
          ),

          toText(
            login_id
          ),

          toText(
            passwordHash
          ),
        ]
      );

    return {
      insertId:
        Number(
          result.insertId ||
          0
        ),

      affectedRows:
        Number(
          result.affectedRows ||
          0
        ),
    };
  };

/* =========================================================
   LOAD CREATED COMMERCIAL MEMBER
========================================================= */

const findCommercialRegistrationSummaryById =
  async (
    memberId,
    connection = null
  ) => {
    const database =
      resolveConnection(
        connection
      );

    const [rows] =
      await database.query(
        `
          SELECT
            id,

            first_name,
            last_name,

            email,
            phone,

            city,

            business_name,
            business_category,
            business_address,

            membership_type,

            referred_by,
            referral_id,

            login_id,

            payment_status,

            direct_network,
            indirect_network,

            created_at

          FROM
            kyc_members

          WHERE
            id = ?

            AND LOWER(
              TRIM(
                COALESCE(
                  membership_type,
                  ''
                )
              )
            ) = 'commercial member'

          LIMIT 1
        `,
        [
          Number(
            memberId
          ),
        ]
      );

    return (
      rows?.[0] ||
      null
    );
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  withCommercialRegistrationTransaction,

  countAccountsByEmailAndPhone,

  insertCommercialRegistration,

  findCommercialRegistrationSummaryById,
};