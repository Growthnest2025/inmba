const {
  pool,
} = require(
  "../database/connection"
);

const SAFE_ADMIN_COLUMNS = `
  id,
  username,
  email,
  mobile,
  first_name,
  last_name,
  role,
  created_at
`;

const AUTH_ADMIN_COLUMNS = `
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
`;

const findAdminById =
  async (adminId) => {
    const [rows] =
      await pool.query(
        `
          SELECT
            ${SAFE_ADMIN_COLUMNS}
          FROM
            admins
          WHERE
            id = ?
          LIMIT 1
        `,
        [
          adminId,
        ]
      );

    return rows[0] ||
      null;
  };

const findAdminByUsername =
  async (username) => {
    const normalizedUsername =
      String(username || "")
        .trim();

    if (
      !normalizedUsername
    ) {
      return null;
    }

    const [rows] =
      await pool.query(
        `
          SELECT
            ${SAFE_ADMIN_COLUMNS}
          FROM
            admins
          WHERE
            username = ?
          LIMIT 1
        `,
        [
          normalizedUsername,
        ]
      );

    return rows[0] ||
      null;
  };

/*
  Admin login verification-க்கு
  password_hash மற்றும் super_key
  தேவை.

  இந்த result frontend-க்கு direct-ஆ
  அனுப்பக்கூடாது.
*/
const findAuthAdminByUsername =
  async (username) => {
    const normalizedUsername =
      String(username || "")
        .trim();

    if (
      !normalizedUsername
    ) {
      return null;
    }

    const [rows] =
      await pool.query(
        `
          SELECT
            ${AUTH_ADMIN_COLUMNS}
          FROM
            admins
          WHERE
            username = ?
          LIMIT 1
        `,
        [
          normalizedUsername,
        ]
      );

    return rows[0] ||
      null;
  };

const findAdminByEmail =
  async (email) => {
    const normalizedEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    if (
      !normalizedEmail
    ) {
      return null;
    }

    const [rows] =
      await pool.query(
        `
          SELECT
            ${SAFE_ADMIN_COLUMNS}
          FROM
            admins
          WHERE
            LOWER(email) = ?
          LIMIT 1
        `,
        [
          normalizedEmail,
        ]
      );

    return rows[0] ||
      null;
  };

const listAdmins =
  async () => {
    const [rows] =
      await pool.query(
        `
          SELECT
            ${SAFE_ADMIN_COLUMNS}
          FROM
            admins
          ORDER BY
            id DESC
        `
      );

    return rows;
  };

const getAdminCounts =
  async () => {
    const [rows] =
      await pool.query(
        `
          SELECT
            COUNT(*) AS totalAdmins,

            SUM(
              CASE
                WHEN role = 'super_admin'
                THEN 1
                ELSE 0
              END
            ) AS superAdmins,

            SUM(
              CASE
                WHEN role = 'admin'
                THEN 1
                ELSE 0
              END
            ) AS admins,

            SUM(
              CASE
                WHEN role = 'subadmin'
                THEN 1
                ELSE 0
              END
            ) AS subadmins
          FROM
            admins
        `
      );

    const counts =
      rows[0] || {};

    return {
      totalAdmins:
        Number(
          counts.totalAdmins ||
          0
        ),

      superAdmins:
        Number(
          counts.superAdmins ||
          0
        ),

      admins:
        Number(
          counts.admins ||
          0
        ),

      subadmins:
        Number(
          counts.subadmins ||
          0
        ),
    };
  };

/*
  Password, email, mobile மற்றும்
  super key output செய்யாமல் test.
*/
const findFirstAdminSummary =
  async () => {
    const [rows] =
      await pool.query(
        `
          SELECT
            id,
            username,
            role,
            created_at
          FROM
            admins
          ORDER BY
            id ASC
          LIMIT 1
        `
      );

    return rows[0] ||
      null;
  };

module.exports = {
  SAFE_ADMIN_COLUMNS,

  findAdminById,
  findAdminByUsername,
  findAuthAdminByUsername,
  findAdminByEmail,

  listAdmins,
  getAdminCounts,
  findFirstAdminSummary,
};