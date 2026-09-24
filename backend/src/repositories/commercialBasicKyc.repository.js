const mysql = require("mysql2/promise");


/* =========================================================
   DATABASE CONNECTION
========================================================= */

const pool = mysql.createPool({
  host:
    process.env.DB_HOST ||
    "127.0.0.1",

  port:
    Number(
      process.env.DB_PORT ||
      3306
    ),

  user:
    process.env.DB_USER ||
    "root",

  password:
    process.env.DB_PASSWORD ||
    "",

  database:
    process.env.DB_NAME ||
    "inmba",

  waitForConnections: true,

  connectionLimit: 10,

  queueLimit: 0,
});


/* =========================================================
   QUERY HELPER
========================================================= */

async function runQuery(
  sql,
  params = []
) {
  const safeParams =
    params.map(
      (value) =>
        value === undefined
          ? null
          : value
    );

  const [rows] =
    await pool.execute(
      sql,
      safeParams
    );

  return rows;
}

/* =========================================================
   FIND BY ID
========================================================= */

async function findById(
  id
) {
  const rows =
    await runQuery(
      `
      SELECT *
      FROM commercial_basic_kyc
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

  return (
    rows[0] ||
    null
  );
}


/* =========================================================
   FIND BY MOBILE
========================================================= */

async function findByMobile(
  mobile
) {
  const rows =
    await runQuery(
      `
      SELECT *
      FROM commercial_basic_kyc
      WHERE mobile = ?
      LIMIT 1
      `,
      [mobile]
    );

  return (
    rows[0] ||
    null
  );
}


/* =========================================================
   FIND BY EMAIL
========================================================= */

async function findByEmail(
  email
) {
  const rows =
    await runQuery(
      `
      SELECT *
      FROM commercial_basic_kyc
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

  return (
    rows[0] ||
    null
  );
}


/* =========================================================
   FIND BY LOGIN ID
========================================================= */

async function findByLoginId(
  loginId
) {
  const rows =
    await runQuery(
      `
      SELECT *
      FROM commercial_basic_kyc
      WHERE login_id = ?
      LIMIT 1
      `,
      [loginId]
    );

  return (
    rows[0] ||
    null
  );
}


/* =========================================================
   CREATE BASIC KYC
========================================================= */

async function createCommercialBasicKyc(
  data = {}
) {
  const full_name =
    String(
      data.full_name ??
      data.owner_full_name ??
      ""
    ).trim();

  const mobile =
    String(
      data.mobile ??
      data.phone ??
      ""
    )
      .replace(/\s+/g, "")
      .replace(/^\+91/, "")
      .trim();

  const email =
    String(
      data.email ??
      ""
    )
      .trim()
      .toLowerCase();

  const business_name =
    String(
      data.business_name ??
      ""
    ).trim();

  const business_type =
    String(
      data.business_type ??
      data.business_category ??
      ""
    ).trim();

  const city =
    String(
      data.city ??
      ""
    ).trim();

  const login_id =
    data.login_id
      ? String(
          data.login_id
        ).trim()
      : null;

  const kyc_status =
    String(
      data.kyc_status ??
      "submitted"
    ).trim();


  const result =
    await runQuery(
      `
      INSERT INTO commercial_basic_kyc
      (
        full_name,
        mobile,
        email,
        business_name,
        business_type,
        city,
        login_id,
        kyc_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        full_name,
        mobile,
        email,
        business_name,
        business_type,
        city,
        login_id,
        kyc_status,
      ]
    );


  return findById(
    result.insertId
  );
}

/* =========================================================
   UPDATE BASIC KYC
========================================================= */

async function updateCommercialBasicKyc(
  id,
  data = {}
) {
  const full_name =
    String(
      data.full_name ??
      data.owner_full_name ??
      ""
    ).trim();

  const mobile =
    String(
      data.mobile ??
      data.phone ??
      ""
    )
      .replace(/\s+/g, "")
      .replace(/^\+91/, "")
      .trim();

  const email =
    String(
      data.email ??
      ""
    )
      .trim()
      .toLowerCase();

  const business_name =
    String(
      data.business_name ??
      ""
    ).trim();

  const business_type =
    String(
      data.business_type ??
      data.business_category ??
      ""
    ).trim();

  const city =
    String(
      data.city ??
      ""
    ).trim();

  const login_id =
    data.login_id
      ? String(
          data.login_id
        ).trim()
      : null;

  const kyc_status =
    String(
      data.kyc_status ??
      "submitted"
    ).trim();


  await runQuery(
    `
    UPDATE commercial_basic_kyc
    SET
      full_name = ?,
      mobile = ?,
      email = ?,
      business_name = ?,
      business_type = ?,
      city = ?,
      login_id = ?,
      kyc_status = ?
    WHERE id = ?
    `,
    [
      full_name,
      mobile,
      email,
      business_name,
      business_type,
      city,
      login_id,
      kyc_status,
      id,
    ]
  );


  return findById(
    id
  );
}

/* =========================================================
   UPDATE LOGIN ID
========================================================= */

async function updateLoginId(
  id,
  loginId
) {
  await runQuery(
    `
    UPDATE commercial_basic_kyc
    SET login_id = ?
    WHERE id = ?
    `,
    [
      loginId,
      id,
    ]
  );


  return findById(
    id
  );
}


/* =========================================================
   UPDATE STATUS
========================================================= */

async function updateStatus(
  id,
  status
) {
  await runQuery(
    `
    UPDATE commercial_basic_kyc
    SET kyc_status = ?
    WHERE id = ?
    `,
    [
      status,
      id,
    ]
  );


  return findById(
    id
  );
}


/* =========================================================
   SAVE / CREATE
========================================================= */

async function saveCommercialBasicKyc(
  data = {}
) {
  const mobile =
    String(
      data.mobile ||
      ""
    ).trim();


  const email =
    String(
      data.email ||
      ""
    )
      .trim()
      .toLowerCase();


  /*
    First mobile check.
  */

  const existingMobile =
    mobile
      ? await findByMobile(
          mobile
        )
      : null;


  if (
    existingMobile
  ) {
    return updateCommercialBasicKyc(
      existingMobile.id,
      {
        ...existingMobile,
        ...data,
        mobile,
        email,
      }
    );
  }


  /*
    Email check.
  */

  const existingEmail =
    email
      ? await findByEmail(
          email
        )
      : null;


  if (
    existingEmail
  ) {
    return updateCommercialBasicKyc(
      existingEmail.id,
      {
        ...existingEmail,
        ...data,
        mobile,
        email,
      }
    );
  }


  /*
    New Commercial Basic KYC.
  */

  return createCommercialBasicKyc({
    ...data,
    mobile,
    email,
  });
}


/* =========================================================
   DELETE - OPTIONAL
========================================================= */

async function deleteCommercialBasicKyc(
  id
) {
  const existing =
    await findById(
      id
    );


  if (
    !existing
  ) {
    return false;
  }


  await runQuery(
    `
    DELETE
    FROM commercial_basic_kyc
    WHERE id = ?
    `,
    [id]
  );


  return true;
}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  runQuery,

  findById,

  findByMobile,

  findByEmail,

  findByLoginId,

  createCommercialBasicKyc,

  updateCommercialBasicKyc,

  saveCommercialBasicKyc,

  updateLoginId,

  updateStatus,

  deleteCommercialBasicKyc,
};