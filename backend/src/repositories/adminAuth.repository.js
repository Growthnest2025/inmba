const {
  executeQuery,
} = require(
  "./auth.repository"
);

/* =========================
   NORMALIZE ADMIN ID
========================= */

const normalizeAdminId =
  (
    adminId
  ) => {
    const parsedId =
      Number(
        adminId
      );

    if (
      !Number.isInteger(
        parsedId
      ) ||
      parsedId <= 0
    ) {
      return null;
    }

    return parsedId;
  };

/* =========================
   ADMIN SELECT
========================= */

const ADMIN_SELECT =
  `
    SELECT
      id,
      username,
      email,
      mobile,
      first_name,
      last_name,
      role,
      password_hash,
      super_key,
      otp,
      otp_expires,
      created_at
    FROM
      admins
  `;

/* =========================
   FIND BY ID
========================= */

const findAdminById =
  async (
    adminId,
    connection =
      null
  ) => {
    const normalizedAdminId =
      normalizeAdminId(
        adminId
      );

    if (
      !normalizedAdminId
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          ${ADMIN_SELECT}

          WHERE
            id = ?

          LIMIT 1
        `,
        [
          normalizedAdminId,
        ],
        connection
      );

    return Array.isArray(
      rows
    )
      ? rows[0] ||
          null
      : null;
  };

/* =========================
   FIND BY USERNAME
========================= */

const findAdminByUsername =
  async (
    username,
    connection =
      null
  ) => {
    const normalizedUsername =
      String(
        username ||
          ""
      ).trim();

    if (
      !normalizedUsername
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          ${ADMIN_SELECT}

          WHERE
            LOWER(
              username
            ) = LOWER(
              ?
            )

          LIMIT 1
        `,
        [
          normalizedUsername,
        ],
        connection
      );

    return Array.isArray(
      rows
    )
      ? rows[0] ||
          null
      : null;
  };

/* =========================
   FIND BY EMAIL
========================= */

const findAdminByEmail =
  async (
    email,
    connection =
      null
  ) => {
    const normalizedEmail =
      String(
        email ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      !normalizedEmail
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          ${ADMIN_SELECT}

          WHERE
            LOWER(
              email
            ) = ?

          LIMIT 1
        `,
        [
          normalizedEmail,
        ],
        connection
      );

    return Array.isArray(
      rows
    )
      ? rows[0] ||
          null
      : null;
  };

/* =========================
   CREATE ADMIN
========================= */

const createAdmin =
  async (
    data,
    connection =
      null
  ) => {
    return executeQuery(
      `
        INSERT INTO
          admins
        (
          username,
          email,
          mobile,
          first_name,
          last_name,
          role,
          password_hash,
          super_key,
          otp,
          otp_expires
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
          NULL,
          NULL
        )
      `,
      [
        data.username,
        data.email ||
          null,
        data.mobile ||
          null,
        data.first_name ||
          null,
        data.last_name ||
          null,
        data.role,
        data.password_hash,
        data.super_key ||
          null,
      ],
      connection
    );
  };

/* =========================
   UPDATE ADMIN OTP
========================= */

const updateAdminOtp =
  async (
    adminId,
    otp,
    otpExpires,
    connection =
      null
  ) => {
    const normalizedAdminId =
      normalizeAdminId(
        adminId
      );

    if (
      !normalizedAdminId
    ) {
      return null;
    }

    return executeQuery(
      `
        UPDATE
          admins
        SET
          otp = ?,
          otp_expires = ?
        WHERE
          id = ?
      `,
      [
        otp,
        otpExpires,
        normalizedAdminId,
      ],
      connection
    );
  };

/* =========================
   CLEAR ADMIN OTP
========================= */

const clearAdminOtp =
  async (
    adminId,
    connection =
      null
  ) => {
    const normalizedAdminId =
      normalizeAdminId(
        adminId
      );

    if (
      !normalizedAdminId
    ) {
      return null;
    }

    return executeQuery(
      `
        UPDATE
          admins
        SET
          otp = NULL,
          otp_expires = NULL
        WHERE
          id = ?
      `,
      [
        normalizedAdminId,
      ],
      connection
    );
  };

/* =========================
   SAFE ADMIN
========================= */

const toSafeAdmin =
  (
    admin
  ) => {
    if (
      !admin
    ) {
      return null;
    }

    const firstName =
      admin.first_name ||
      "";

    const lastName =
      admin.last_name ||
      "";

    return {
      id:
        admin.id,

      username:
        admin.username ||
        "",

      email:
        admin.email ||
        "",

      mobile:
        admin.mobile ||
        "",

      first_name:
        firstName,

      last_name:
        lastName,

      full_name:
        [
          firstName,
          lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),

      role:
        admin.role ||
        "",

      created_at:
        admin.created_at ||
        null,
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  normalizeAdminId,
  ADMIN_SELECT,
  findAdminById,
  findAdminByUsername,
  findAdminByEmail,
  createAdmin,
  updateAdminOtp,
  clearAdminOtp,
  toSafeAdmin,
};