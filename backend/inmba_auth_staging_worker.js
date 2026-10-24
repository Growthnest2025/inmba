
import bcrypt from "bcryptjs";

const COOKIE_NAME = "inmba_staging_session";
const SESSION_SECONDS = 8 * 60 * 60;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function hex(bytes) {
  return Array.from(
    new Uint8Array(bytes),
    b => b.toString(16).padStart(2, "0")
  ).join("");
}

async function sha256(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
  return hex(digest);
}

function randomToken() {
  return hex(crypto.getRandomValues(new Uint8Array(32)));
}

function allowedOrigins(env) {
  return String(env.FRONTEND_ORIGIN || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin, env) {
  if (!origin) return false;
  const list = allowedOrigins(env);
  if (list.includes(origin)) return true;

  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    if (
      host.endsWith(".vercel.app") ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".inmba.org") ||
      host === "inmba.org"
    ) {
      return true;
    }
  } catch {}

  return false;
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");

  if (!origin || !isOriginAllowed(origin, env)) {
    return {};
  }

  const requestedHeaders = request.headers.get("Access-Control-Request-Headers");
  const baseHeaders = "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, cache-control, Pragma, pragma, Expires, Cookie";

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE, PATCH",
    "Access-Control-Allow-Headers": requestedHeaders ? `${baseHeaders}, ${requestedHeaders}` : baseHeaders,
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin, Access-Control-Request-Headers",
  };
}

function getCookie(request) {
  const raw = request.headers.get("Cookie") || "";

  for (const part of raw.split(";")) {
    const [name, ...value] = part.trim().split("=");

    if (name === COOKIE_NAME) {
      return value.join("=");
    }
  }

  return null;
}

function sessionCookie(token, maxAge) {
  return [
    `${COOKIE_NAME}=${token}`,
    "HttpOnly",
    "Secure",
    "SameSite=None",
    "Path=/api",
    `Max-Age=${maxAge}`,
  ].join("; ");
}

const MEMBER_FIELDS = `
  id,
  login_id,
  first_name,
  last_name,
  email,
  phone,
  referral_id,
  referred_by,
  membership_type,
  payment_status,
  is_deleted
`;

function safeMember(member) {
  if (!member) return null;

  return {
    id: member.id,
    login_id: member.login_id,
    first_name: member.first_name,
    last_name: member.last_name,
    email: member.email,
    phone: member.phone,
    referral_id: member.referral_id,
    membership_type: member.membership_type,
    payment_status: member.payment_status,
  };
}

async function verifyPassword(password, storedHash) {
  const hash = String(storedHash || "").trim();

  // bcrypt verification
  if (/^\$2[aby]\$\d{2}\$/.test(hash)) {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }

  // Legacy SHA-256 verification
  if (/^[a-f0-9]{64}$/i.test(hash)) {
    const computed = await sha256(password);
    return computed === hash.toLowerCase();
  }

  return false;
}

async function getCurrentMember(request, db) {
  let token = getCookie(request);

  if (!token) {
    const authHeader = request.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return null;
  }

  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);

  const session = await db.prepare(`
    SELECT member_id
    FROM worker_auth_sessions
    WHERE token_hash = ?
      AND expires_at > ?
  `).bind(tokenHash, now).first();

  if (!session) return null;

  return db.prepare(`
    SELECT ${MEMBER_FIELDS}
    FROM kyc_members
    WHERE id = ?
      AND is_deleted = 0
  `).bind(session.member_id).first();
}

async function handleLogin(request, db, cors) {
  const type = (
    request.headers.get("Content-Type") || ""
  ).toLowerCase();

  if (!type.startsWith("application/json")) {
    return json({
      success: false,
      error: "JSON required",
    }, 415, cors);
  }

  const raw = await request.text();

  if (raw.length > 8192) {
    return json({
      success: false,
      error: "Payload too large",
    }, 413, cors);
  }

  let input;

  try {
    input = JSON.parse(raw);
  } catch {
    return json({
      success: false,
      error: "Invalid JSON",
    }, 400, cors);
  }

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return json({
      success: false,
      error: "Invalid login data",
    }, 400, cors);
  }

  const loginId = String(
    input.login_id ??
    input.loginId ??
    input.userid ??
    input.user_id ??
    ""
  ).trim();

  const password =
    typeof input.password === "string"
      ? input.password
      : "";

  if (!loginId || !password) {
    return json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Login ID and password are required.",
    }, 400, cors);
  }

  if (loginId.length > 100 || password.length > 512) {
    return json({
      success: false,
      message: "Invalid login ID or password.",
    }, 401, cors);
  }

  const now = Math.floor(Date.now() / 1000);
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  const attemptKey = await sha256(
    loginId.toLowerCase() + ":" + ip
  );

  const attempts = await db.prepare(`
    SELECT failures, window_ends
    FROM worker_login_attempts
    WHERE attempt_key = ?
  `).bind(attemptKey).first();

  if (
    attempts &&
    attempts.window_ends > now &&
    attempts.failures >= 5
  ) {
    return json({
      success: false,
      message: "Too many attempts. Try again later.",
    }, 429, {
      ...cors,
      "Retry-After": String(attempts.window_ends - now),
    });
  }

  const member = await db.prepare(`
    SELECT ${MEMBER_FIELDS}, password
    FROM kyc_members
    WHERE login_id = ?
  `).bind(loginId).first();

  const valid = !!member &&
    await verifyPassword(password, member.password);

  if (!valid) {
    await db.prepare(`
      INSERT INTO worker_login_attempts
        (attempt_key, failures, window_ends)
      VALUES (?, 1, ?)
      ON CONFLICT(attempt_key)
      DO UPDATE SET
        failures = CASE
          WHEN window_ends <= ? THEN 1
          ELSE failures + 1
        END,
        window_ends = CASE
          WHEN window_ends <= ? THEN ?
          ELSE window_ends
        END
    `).bind(
      attemptKey,
      now + 900,
      now,
      now,
      now + 900
    ).run();

    return json({
      success: false,
      code: "INVALID_CREDENTIALS",
      message: "Invalid login ID or password.",
    }, 401, cors);
  }

  if (Number(member.is_deleted) === 1) {
    return json({
      success: false,
      code: "ACCOUNT_INACTIVE",
      message: "This account is not active.",
    }, 403, cors);
  }

  await db.prepare(`
    DELETE FROM worker_login_attempts
    WHERE attempt_key = ?
  `).bind(attemptKey).run();

  const token = randomToken();
  const expiresAt = now + SESSION_SECONDS;

  await db.prepare(`
    INSERT INTO worker_auth_sessions
      (token_hash, member_id, expires_at)
    VALUES (?, ?, ?)
  `).bind(
    await sha256(token),
    member.id,
    expiresAt
  ).run();

  return json({
    success: true,
    message: "Login successful.",
    member: safeMember(member),
    token,
    nextAction: {
      type: "NAVIGATE",
      path: "/dashboard",
    },
  }, 200, {
    ...cors,
    "Set-Cookie": sessionCookie(token, SESSION_SECONDS),
  });
}


async function getCurrentAdmin(request, db) {
  let token = getCookie(request);

  if (!token) {
    const authHeader = request.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return null;
  }

  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);

  const session = await db.prepare(`
    SELECT admin_id
    FROM worker_admin_sessions
    WHERE token_hash = ?
      AND expires_at > ?
  `).bind(tokenHash, now).first();

  if (!session) return null;

  return db.prepare(`
    SELECT id, username, email, role, is_active
    FROM admins
    WHERE id = ?
      AND is_active = 1
  `).bind(session.admin_id).first();
}

async function handleAdminLogin(request, db, cors) {
  let input = {};

  try {
    const raw = await request.text();
    if (raw) input = JSON.parse(raw);
  } catch {
    return json({ success: false, message: "Invalid JSON format" }, 400, cors);
  }

  const username = String(input.username || input.login_id || input.loginId || "").trim();
  const password = String(input.password || "");
  const role = String(input.role || "super_admin").trim().toLowerCase();
  const secretKey = String(input.secret_key || input.secretKey || "").trim();
  const email = String(input.email || "").trim().toLowerCase();

  if (!username || !password) {
    return json({
      success: false,
      message: "Username and password are required.",
    }, 400, cors);
  }

  const admin = await db.prepare(`
    SELECT id, username, email, role, password_hash, is_active, super_key
    FROM admins
    WHERE LOWER(username) = LOWER(?)
  `).bind(username).first();

  if (!admin || Number(admin.is_active) !== 1) {
    return json({
      success: false,
      message: "Invalid admin credentials.",
    }, 401, cors);
  }

  let validPassword = await verifyPassword(password, admin.password_hash);
  if (!validPassword && password.length > 0) {
    const capitalized = password.charAt(0).toUpperCase() + password.slice(1);
    validPassword = await verifyPassword(capitalized, admin.password_hash);
  }
  if (!validPassword) {
    return json({
      success: false,
      message: "Invalid admin credentials.",
    }, 401, cors);
  }

  if (role === "super_admin" || admin.role === "super_admin") {
    if (admin.super_key && secretKey !== admin.super_key) {
      return json({
        success: false,
        message: "Invalid Super Admin secret key.",
      }, 401, cors);
    }
  } else if (email && admin.email) {
    if (admin.email.toLowerCase() !== email) {
      return json({
        success: false,
        message: "Email does not match registered admin account.",
      }, 401, cors);
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const token = randomToken();
  const expiresAt = now + SESSION_SECONDS;

  await db.prepare(`
    INSERT INTO worker_admin_sessions
      (token_hash, admin_id, expires_at)
    VALUES (?, ?, ?)
  `).bind(
    await sha256(token),
    admin.id,
    expiresAt
  ).run();

  const safeAdmin = {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
  };

  return json({
    success: true,
    statusCode: 200,
    message: "Admin login successful.",
    authenticated: true,
    requires_otp: false,
    otpRequired: false,
    admin: safeAdmin,
    data: {
      requires_otp: false,
      admin: safeAdmin,
    },
    token,
    redirect_to: "/admin",
  }, 200, {
    ...cors,
    "Set-Cookie": sessionCookie(token, SESSION_SECONDS),
  });
}


async function parseRequestBody(request) {
  const contentType = (request.headers.get("Content-Type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    try {
      return await request.json();
    } catch {
      return {};
    }
  }
  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    try {
      const form = await request.formData();
      const result = {};
      for (const [key, value] of form.entries()) {
        if (typeof value === "string") {
          result[key] = value;
        } else if (value && value.name) {
          result[key] = value.name;
        }
      }
      return result;
    } catch {
      return {};
    }
  }
  try {
    const text = await request.text();
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function handleRegistration(request, db, cors) {
  const input = await parseRequestBody(request);

  const firstName = String(input.first_name || "").trim();
  const lastName = String(input.last_name || "").trim();
  const fatherName = String(input.father_name || input.father_spouse_name || "").trim();
  const dob = String(input.dob || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const phone = String(input.phone || input.mobile || "").trim();
  const pincode = String(input.pincode || "").trim();
  const gender = String(input.gender || "").trim();
  const maritalStatus = String(input.marital_status || "").trim();
  const nationality = String(input.nationality || "Indian").trim();
  const occupation = String(input.occupation || "").trim();
  const education = String(input.education || "").trim();
  const membershipType = String(input.membership_type || "Civilian Member").trim();
  const referral = String(input.referral || input.referred_by || "").trim();
  const aadhar = String(input.aadhar || input.aadhaar_number || "").trim();
  const password = String(input.password || "");

  if (!firstName || !phone || !password) {
    return json({
      success: false,
      message: "First name, mobile number, and password are required.",
    }, 400, cors);
  }

  // Check if phone already registered
  if (phone) {
    const existingPhone = await db.prepare(
      "SELECT id FROM kyc_members WHERE phone = ? LIMIT 1"
    ).bind(phone).first();

    if (existingPhone) {
      return json({
        success: false,
        message: "An account with this mobile number already exists.",
      }, 400, cors);
    }
  }

  // Generate unique Login ID
  let prefix = "";
  if (/professional/i.test(membershipType)) prefix = "PRO";
  else if (/commercial/i.test(membershipType)) prefix = "COM";

  let loginId = "";
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = prefix + String(Math.floor(1000000 + Math.random() * 9000000));
    const exists = await db.prepare(
      "SELECT id FROM kyc_members WHERE login_id = ?"
    ).bind(candidate).first();

    if (!exists) {
      loginId = candidate;
      break;
    }
  }

  if (!loginId) {
    loginId = prefix + String(Date.now()).slice(-7);
  }

  // Generate unique 8-character referral ID
  const refChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let referralId = "";
  for (let i = 0; i < 8; i++) {
    referralId += refChars.charAt(Math.floor(Math.random() * refChars.length));
  }

  const memberToken = randomToken();
  const passwordHash = await sha256(password);
  const nowIso = new Date().toISOString().replace("T", " ").slice(0, 19);

  const insertResult = await db.prepare(`
    INSERT INTO kyc_members (
      login_id, first_name, last_name, father_name, dob, email, phone,
      pincode, gender, marital_status, nationality, occupation, education,
      membership_type, referred_by, referral_id, aadhar, token, password,
      payment_status, created_at, is_deleted
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      'pending', ?, 0
    )
  `).bind(
    loginId, firstName, lastName || null, fatherName || null, dob || null, email || null, phone,
    pincode || null, gender || null, maritalStatus || null, nationality || "Indian", occupation || null, education || null,
    membershipType, referral || null, referralId, aadhar || null, memberToken, passwordHash,
    nowIso
  ).run();

  const member = {
    id: insertResult.meta?.last_row_id || 0,
    login_id: loginId,
    first_name: firstName,
    last_name: lastName,
    email,
    phone,
    membership_type: membershipType,
    payment_status: "pending",
    referral_id: referralId,
  };

  const responseData = {
    loginId,
    login_id: loginId,
    loginLink: "/login",
    successPage: "/success",
    member,
    referral: {
      referralId,
      referralLink: `/register?ref=${referralId}`,
    },
    nextAction: {
      type: "NAVIGATE",
      path: "/success",
      loginPath: "/login",
    },
  };

  return json({
    success: true,
    statusCode: 201,
    message: "Your membership registration has been submitted successfully.",
    data: responseData,
    ...responseData,
  }, 201, cors);
}

/* =========================================================
   CIVILIAN KYC & PAYMENT HELPERS FOR STAGING WORKER
========================================================= */

const CIVILIAN_SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const CIVILIAN_FILE_FIELDS = [
  "aadhaar_front",
  "aadhaar_back",
  "pan_card_scan",
  "address_proof",
  "bank_proof",
  "nominee_id",
  "education_certificate",
  "profile_photo",
  "cover_photo",
  "gallery_photos",
  "intro_video",
];

const CIVILIAN_SECTION_FIELDS = {
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
};

async function getCivilianFullKycRecord(memberId, db) {
  await db.prepare(`
    INSERT INTO civilian_full_kyc (member_id)
    VALUES (?)
    ON CONFLICT(member_id) DO NOTHING
  `).bind(memberId).run();

  const row = (await db.prepare(`
    SELECT * FROM civilian_full_kyc WHERE member_id = ?
  `).bind(memberId).first()) || {};

  const member = (await db.prepare(`
    SELECT * FROM kyc_members WHERE id = ?
  `).bind(memberId).first()) || {};

  const sections = {};
  for (const s of CIVILIAN_SECTIONS) {
    sections[s] = {
      completed: Boolean(row[`section_${s.toLowerCase()}_completed`]),
    };
  }

  const files = {};
  for (const f of CIVILIAN_FILE_FIELDS) {
    if (row[f]) files[f] = row[f];
  }

  const values = { ...row };
  const excludeFromValues = [
    "id",
    "member_id",
    "created_at",
    "updated_at",
    "submitted_at",
    "approved_at",
    "rejected_at",
    "rejection_reason",
    ...CIVILIAN_FILE_FIELDS,
    ...CIVILIAN_SECTIONS.map(s => `section_${s.toLowerCase()}_completed`),
  ];
  for (const key of excludeFromValues) {
    delete values[key];
  }

  const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ");
  if (!values.full_legal_name) values.full_legal_name = fullName || "";
  if (!values.primary_email) values.primary_email = member.email || "";
  if (!values.primary_mobile) values.primary_mobile = member.phone || "";
  if (!values.sponsor_referral_id) values.sponsor_referral_id = member.referral_id || member.referred_by || "";
  if (!values.network_level_rank) values.network_level_rank = member.network_level || "";
  if (!values.team_size) values.team_size = (Number(member.direct_network || 0) + Number(member.indirect_network || 0)) || "";
  if (!values.royalty_slab_category) values.royalty_slab_category = member.royalty_slab_category || "";

  const selectedPlan = ["300", "1500"].includes(String(row.selected_plan || ""))
    ? String(row.selected_plan)
    : "";

  return {
    values,
    files,
    sections,
    status: row.status || "draft",
    selectedPlan,
    selected_plan: selectedPlan || null,
    planSelectedAt: row.plan_selected_at || null,
    member: {
      id: member.id,
      login_id: member.login_id || "",
      first_name: member.first_name || "",
      last_name: member.last_name || "",
      name: fullName || "Civilian Member",
      full_name: fullName || "Civilian Member",
      email: member.email || "",
      phone: member.phone || "",
      referral_id: member.referral_id || "",
      membership_type: member.membership_type || "Civilian Member",
      payment_status: member.payment_status || "pending",
    },
  };
}

async function handleCivilianPlan(request, db, cors) {
  const member = await getCurrentMember(request, db);
  if (!member) {
    return json({
      success: false,
      message: "Member session not found. Please login again.",
    }, 401, cors);
  }

  const input = await parseRequestBody(request);
  const plan = String(input.selected_plan ?? input.selectedPlan ?? "").trim();

  if (!["300", "1500"].includes(plan)) {
    return json({
      success: false,
      message: "Invalid Civilian plan. Please select ₹300 or ₹1500.",
    }, 422, cors);
  }

  await db.prepare(`
    INSERT INTO civilian_full_kyc (member_id, selected_plan, plan_selected_at, updated_at)
    VALUES (?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(member_id) DO UPDATE SET
      selected_plan = excluded.selected_plan,
      plan_selected_at = excluded.plan_selected_at,
      updated_at = excluded.updated_at
  `).bind(member.id, plan).run();

  await db.prepare(`
    UPDATE kyc_members
    SET membership_type = 'Civilian Member'
    WHERE id = ?
  `).bind(member.id).run();

  const data = await getCivilianFullKycRecord(member.id, db);

  return json({
    success: true,
    message: `Civilian ₹${plan} plan selected successfully.`,
    data,
  }, 200, cors);
}

async function handleSaveCivilianSection(request, db, cors, section) {
  const member = await getCurrentMember(request, db);
  if (!member) {
    return json({
      success: false,
      message: "Member session not found. Please login again.",
    }, 401, cors);
  }

  const s = String(section || "").trim().toUpperCase();
  if (!CIVILIAN_SECTIONS.includes(s)) {
    return json({
      success: false,
      message: "Invalid Civilian KYC section.",
    }, 400, cors);
  }

  const input = await parseRequestBody(request);
  const completed = [
    "true",
    "1",
    "yes",
    "completed",
    "complete",
    "save_and_next",
    true,
  ].includes(input.completed);

  const allowed = CIVILIAN_SECTION_FIELDS[s] || [];
  const updates = [];
  const bindings = [];

  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(input, field) && input[field] !== undefined) {
      updates.push(`"${field}" = ?`);
      bindings.push(input[field]);
    }
  }

  if (completed) {
    updates.push(`"section_${s.toLowerCase()}_completed" = 1`);
  }

  updates.push(`"updated_at" = datetime('now')`);

  // Ensure record exists
  await db.prepare(`
    INSERT INTO civilian_full_kyc (member_id)
    VALUES (?)
    ON CONFLICT(member_id) DO NOTHING
  `).bind(member.id).run();

  if (updates.length > 0) {
    bindings.push(member.id);
    await db.prepare(`
      UPDATE civilian_full_kyc
      SET ${updates.join(", ")}
      WHERE member_id = ?
    `).bind(...bindings).run();
  }

  const data = await getCivilianFullKycRecord(member.id, db);

  return json({
    success: true,
    message: `Civilian KYC section ${s} saved.`,
    data,
  }, 200, cors);
}

async function handleSubmitCivilianKyc(request, db, cors) {
  const member = await getCurrentMember(request, db);
  if (!member) {
    return json({
      success: false,
      message: "Member session not found. Please login again.",
    }, 401, cors);
  }

  const data = await getCivilianFullKycRecord(member.id, db);
  if (!data.selectedPlan) {
    return json({
      success: false,
      message: "Please select the Civilian ₹300 or ₹1500 plan before submitting Full KYC.",
    }, 422, cors);
  }

  await db.prepare(`
    UPDATE civilian_full_kyc
    SET status = 'submitted',
        submitted_at = datetime('now'),
        updated_at = datetime('now')
    WHERE member_id = ?
  `).bind(member.id).run();

  const updatedData = await getCivilianFullKycRecord(member.id, db);

  return json({
    success: true,
    message: "Civilian Full KYC submitted successfully.",
    data: updatedData,
  }, 200, cors);
}

async function handleReopenCivilianKyc(request, db, cors) {
  const member = await getCurrentMember(request, db);
  if (!member) {
    return json({
      success: false,
      message: "Member session not found. Please login again.",
    }, 401, cors);
  }

  await db.prepare(`
    UPDATE civilian_full_kyc
    SET status = 'draft',
        updated_at = datetime('now')
    WHERE member_id = ?
  `).bind(member.id).run();

  const data = await getCivilianFullKycRecord(member.id, db);

  return json({
    success: true,
    message: "Civilian Full KYC reopened.",
    data,
  }, 200, cors);
}

async function handleGetPayment(request, db, cors) {
  const member = await getCurrentMember(request, db);
  if (!member) {
    return json({
      success: false,
      message: "Authentication required.",
    }, 401, cors);
  }

  const civilian = (await db.prepare(`
    SELECT selected_plan FROM civilian_full_kyc WHERE member_id = ?
  `).bind(member.id).first()) || {};

  const ext = (await db.prepare(`
    SELECT payment_method, transaction_id, subscription_year, amount, payment_proof
    FROM kyc_members_ext_1
    WHERE member_id = ?
  `).bind(member.id).first()) || {};

  const fullMember = (await db.prepare(`
    SELECT token FROM kyc_members WHERE id = ?
  `).bind(member.id).first()) || {};

  const amount = civilian.selected_plan || ext.amount || "300";
  const paymentStatus = member.payment_status || "pending";
  const isApproved = ["approved", "paid", "success", "successful"].includes(paymentStatus.toLowerCase());
  const isSubmitted = Boolean(ext.transaction_id || ext.payment_proof || isApproved);

  const paymentData = {
    member_id: member.id,
    login_id: member.login_id,
    name: [member.first_name, member.last_name].filter(Boolean).join(" ") || "Member",
    email: member.email,
    phone: member.phone,
    membership_type: member.membership_type || "Civilian Member",
    selected_plan: civilian.selected_plan || null,
    amount,
    payment_status: paymentStatus,
    payment_submitted: isSubmitted,
    payment_approved: isApproved,
    transaction_id: ext.transaction_id || null,
    payment_proof_url: ext.payment_proof || null,
    token: fullMember.token || "",
  };

  return json({
    statusCode: 200,
    success: true,
    message: "Payment details loaded successfully.",
    data: {
      payment: paymentData,
      ...paymentData,
    },
  }, 200, cors);
}

async function handleSubmitPayment(request, db, cors) {
  const member = await getCurrentMember(request, db);
  if (!member) {
    return json({
      success: false,
      message: "Authentication required.",
    }, 401, cors);
  }

  const input = await parseRequestBody(request);
  const transactionId = String(input.transaction_id || input.transactionId || input.utr || "").trim();
  const paymentMethod = String(input.payment_method || input.paymentMethod || "UPI").trim();
  const amount = String(input.amount || "").trim();
  const subscriptionYear = String(input.subscription_year || input.subscriptionYear || new Date().getFullYear()).trim();
  const paymentProof = String(input.payment_proof || input.paymentProof || "").trim();

  // 1. Update kyc_members: only payment_status and updated_at exist in kyc_members
  await db.prepare(`
    UPDATE kyc_members
    SET payment_status = 'pending',
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(member.id).run();

  // 2. Upsert kyc_members_ext_1: payment_method, transaction_id, subscription_year, amount, payment_proof
  await db.prepare(`
    INSERT INTO kyc_members_ext_1 (member_id, payment_method, transaction_id, subscription_year, amount, payment_proof)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(member_id) DO UPDATE SET
      payment_method = COALESCE(NULLIF(excluded.payment_method, ''), kyc_members_ext_1.payment_method),
      transaction_id = COALESCE(NULLIF(excluded.transaction_id, ''), kyc_members_ext_1.transaction_id),
      subscription_year = COALESCE(NULLIF(excluded.subscription_year, ''), kyc_members_ext_1.subscription_year),
      amount = COALESCE(NULLIF(excluded.amount, ''), kyc_members_ext_1.amount),
      payment_proof = COALESCE(NULLIF(excluded.payment_proof, ''), kyc_members_ext_1.payment_proof)
  `).bind(member.id, paymentMethod, transactionId, subscriptionYear, amount, paymentProof).run();

  // 3. Get member's token for civilian acknowledgement
  const fullMember = (await db.prepare(`
    SELECT token FROM kyc_members WHERE id = ?
  `).bind(member.id).first()) || {};

  const token = fullMember.token || member.token || "";
  const nextPath = token ? `/civilian-acknowledgement/${token}` : "/dashboard";

  return json({
    statusCode: 200,
    success: true,
    message: "Payment details submitted successfully.",
    token,
    nextPath,
    nextRoute: nextPath,
    redirectTo: nextPath,
    data: {
      payment_status: "pending",
      transaction_id: transactionId,
      token,
      nextPath,
      nextRoute: nextPath,
      redirectTo: nextPath,
    },
  }, 200, cors);
}

async function handleGetAcknowledgement(request, db, cors, token) {
  const safeToken = String(token || "").trim();
  if (!safeToken) {
    return json({
      success: false,
      message: "Acknowledgement token is required.",
    }, 400, cors);
  }

  const member = await db.prepare(`
    SELECT ${MEMBER_FIELDS}, token, created_at
    FROM kyc_members
    WHERE token = ? AND is_deleted = 0
  `).bind(safeToken).first();

  if (!member) {
    return json({
      success: false,
      message: "Member not found for the given acknowledgement token.",
    }, 404, cors);
  }

  const ext = (await db.prepare(`
    SELECT payment_method, transaction_id, subscription_year, amount, payment_proof
    FROM kyc_members_ext_1
    WHERE member_id = ?
  `).bind(member.id).first()) || {};

  const civilian = (await db.prepare(`
    SELECT selected_plan FROM civilian_full_kyc WHERE member_id = ?
  `).bind(member.id).first()) || {};

  const fullName = [member.first_name, member.last_name].filter(Boolean).join(" ") || "Member";
  const planAmount = civilian.selected_plan || ext.amount || "300";

  const ackData = {
    token: safeToken,
    login_id: member.login_id,
    first_name: member.first_name,
    last_name: member.last_name,
    full_name: fullName,
    name: fullName,
    email: member.email,
    phone: member.phone,
    membership_type: member.membership_type || "Civilian Member",
    payment_status: member.payment_status || "pending",
    selected_plan: planAmount,
    amount: planAmount,
    transaction_id: ext.transaction_id || null,
    payment_method: ext.payment_method || "UPI",
    payment_proof: ext.payment_proof || null,
    created_at: member.created_at,
  };

  return json({
    statusCode: 200,
    success: true,
    message: "Acknowledgement loaded successfully.",
    token: safeToken,
    data: {
      token: safeToken,
      acknowledgement: ackData,
      member: ackData,
      ...ackData,
    },
    acknowledgement: ackData,
    member: ackData,
  }, 200, cors);
}

async function handleGetCivilianProfile(request, db, cors) {
  const member = await getCurrentMember(request, db);
  if (!member) {
    return json({
      success: false,
      message: "Authentication required.",
    }, 401, cors);
  }

  const fullKyc = await getCivilianFullKycRecord(member.id, db);
  const ext = (await db.prepare(`
    SELECT payment_method, transaction_id, subscription_year, amount, payment_proof
    FROM kyc_members_ext_1
    WHERE member_id = ?
  `).bind(member.id).first()) || {};

  const fullMember = (await db.prepare(`
    SELECT * FROM kyc_members WHERE id = ?
  `).bind(member.id).first()) || member;

  const profile = {
    ...fullMember,
    ...fullKyc.values,
    ...fullKyc.files,
    ...ext,
    id: member.id,
    login_id: member.login_id,
    first_name: member.first_name,
    last_name: member.last_name,
    full_name: [member.first_name, member.last_name].filter(Boolean).join(" ") || "Civilian Member",
    name: [member.first_name, member.last_name].filter(Boolean).join(" ") || "Civilian Member",
    email: member.email,
    phone: member.phone,
    membership_type: member.membership_type || "Civilian Member",
    payment_status: member.payment_status || "pending",
    selected_plan: fullKyc.selectedPlan || ext.amount || "300",
    amount: fullKyc.selectedPlan || ext.amount || "300",
    sections: fullKyc.sections,
    status: fullKyc.status || "draft",
  };

  return json({
    success: true,
    statusCode: 200,
    message: "Civilian owner profile loaded successfully.",
    data: {
      profile,
      member: profile,
    },
    profile,
    member: profile,
    owner: true,
    visibility: "private",
  }, 200, cors);
}

async function handleGetProfessionalProfile(request, db, cors) {
  const member = await getCurrentMember(request, db);
  if (!member) {
    return json({
      success: false,
      message: "Authentication required.",
    }, 401, cors);
  }

  const ext1 = (await db.prepare(`
    SELECT * FROM kyc_members_ext_1 WHERE member_id = ?
  `).bind(member.id).first()) || {};

  const fullMember = (await db.prepare(`
    SELECT * FROM kyc_members WHERE id = ?
  `).bind(member.id).first()) || member;

  const profile = {
    ...fullMember,
    ...ext1,
    id: member.id,
    login_id: member.login_id,
    first_name: member.first_name,
    last_name: member.last_name,
    full_name: [member.first_name, member.last_name].filter(Boolean).join(" ") || "Professional Member",
    name: [member.first_name, member.last_name].filter(Boolean).join(" ") || "Professional Member",
    email: member.email,
    phone: member.phone,
    membership_type: member.membership_type || "Professional Member",
    payment_status: member.payment_status || "pending",
  };

  return json({
    success: true,
    statusCode: 200,
    message: "Professional owner profile loaded successfully.",
    data: {
      profile,
      member: profile,
    },
    profile,
    member: profile,
    owner: true,
    visibility: "private",
  }, 200, cors);
}

async function handleProfileUpdate(request, db, cors) {
  const member = await getCurrentMember(request, db);
  if (!member) {
    return json({
      success: false,
      message: "Authentication required.",
    }, 401, cors);
  }

  const input = await parseRequestBody(request);
  const firstName = input.first_name || input.name;
  const lastName = input.last_name;
  const email = input.email;
  const phone = input.phone;

  if (firstName || email || phone) {
    await db.prepare(`
      UPDATE kyc_members
      SET first_name = COALESCE(NULLIF(?, ''), first_name),
          last_name = COALESCE(NULLIF(?, ''), last_name),
          email = COALESCE(NULLIF(?, ''), email),
          phone = COALESCE(NULLIF(?, ''), phone),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(firstName || "", lastName || "", email || "", phone || "", member.id).run();
  }

  return json({
    success: true,
    statusCode: 200,
    message: "Profile updated successfully.",
    data: {
      id: member.id,
      login_id: member.login_id,
    },
  }, 200, cors);
}

async function handleProfilePhotoUpload(request, db, cors) {
  const member = await getCurrentMember(request, db);
  if (!member) {
    return json({
      success: false,
      message: "Authentication required.",
    }, 401, cors);
  }

  const input = await parseRequestBody(request);
  const photoUrl = String(input.photo_url || input.profile_photo || input.photo || "").trim();

  if (photoUrl) {
    await db.prepare(`
      UPDATE kyc_members
      SET profile_pic = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(photoUrl, member.id).run();
  }

  return json({
    success: true,
    statusCode: 200,
    message: "Profile photo uploaded successfully.",
    data: {
      photo_url: photoUrl,
    },
  }, 200, cors);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    const method = request.method;
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(request, env);

    if (method === "OPTIONS") {
      const accepted = !origin || isOriginAllowed(origin, env);

      return new Response(null, {
        status: accepted ? 204 : 403,
        headers: cors,
      });
    }

    if (origin && !isOriginAllowed(origin, env)) {
      return json({
        success: false,
        error: "Origin not allowed",
      }, 403, cors);
    }

    if (!env.inmba_db) {
      return json({
        success: false,
        error: "D1 binding missing",
      }, 503, cors);
    }

    const db = env.inmba_db;

    try {
      if (path === "/api/health" && method === "GET") {
        const result = await db.prepare(
          "SELECT 1 AS connected"
        ).first();

        return json({
          success: result?.connected === 1,
          service: "inmba-auth-staging",
          database: "connected",
        }, 200, cors);
      }

      if (path === "/api/me" && method === "GET") {
        const member = await getCurrentMember(request, db);

        return json({
          login_id: member?.login_id || null,
          authenticated: !!member,
          member: safeMember(member),
        }, 200, cors);
      }

      if (path === "/api/login" && method === "POST") {
        return await handleLogin(request, db, cors);
      }

      if ((path === "/api/register" || path === "/register" || path === "/api/student" || path === "/api/professional-register" || path === "/api/commercial-register") && method === "POST") {
        return await handleRegistration(request, db, cors);
      }

      // =========================================================
      // CIVILIAN FULL KYC ROUTES
      // =========================================================

      if ((path === "/api/civilian-kyc/plan" || path === "/civilian-kyc/plan") && (method === "PATCH" || method === "POST")) {
        return await handleCivilianPlan(request, db, cors);
      }

      if ((path === "/api/civilian-kyc/progress" || path === "/civilian-kyc/progress") && method === "GET") {
        const member = await getCurrentMember(request, db);
        if (!member) {
          return json({ success: false, message: "Member session not found. Please login again." }, 401, cors);
        }
        const data = await getCivilianFullKycRecord(member.id, db);
        const completedCount = Object.values(data.sections).filter(s => s.completed).length;
        const completionPercent = Math.round((completedCount / 8) * 100);
        return json({
          success: true,
          message: "Civilian Full KYC progress loaded.",
          data: { ...data, completionPercent },
        }, 200, cors);
      }

      if ((path === "/api/civilian-kyc/submit" || path === "/civilian-kyc/submit") && method === "POST") {
        return await handleSubmitCivilianKyc(request, db, cors);
      }

      if ((path === "/api/civilian-kyc/reopen" || path === "/civilian-kyc/reopen") && method === "POST") {
        return await handleReopenCivilianKyc(request, db, cors);
      }

      const sectionMatch = path.match(/^\/(?:api\/)?civilian-kyc\/sections\/([A-Za-z])/);
      if (sectionMatch) {
        const section = sectionMatch[1].toUpperCase();
        if (method === "GET") {
          const member = await getCurrentMember(request, db);
          if (!member) {
            return json({ success: false, message: "Member session not found. Please login again." }, 401, cors);
          }
          const data = await getCivilianFullKycRecord(member.id, db);
          return json({ success: true, message: `Civilian KYC section ${section} loaded.`, data }, 200, cors);
        }
        if (method === "PATCH" || method === "POST") {
          return await handleSaveCivilianSection(request, db, cors, section);
        }
      }

      if ((path === "/api/civilian-kyc" || path === "/civilian-kyc") && method === "GET") {
        const member = await getCurrentMember(request, db);
        if (!member) {
          return json({ success: false, message: "Member session not found. Please login again." }, 401, cors);
        }
        const data = await getCivilianFullKycRecord(member.id, db);
        return json({
          success: true,
          message: "Civilian Full KYC loaded.",
          data,
        }, 200, cors);
      }

      // =========================================================
      // PAYMENT ROUTES
      // =========================================================

      if ((path === "/payment" || path === "/api/payment" || path === "/api/payment/status" || path === "/payment/status") && method === "GET") {
        return await handleGetPayment(request, db, cors);
      }

      if ((path === "/payment_submit" || path === "/api/payment_submit" || path === "/api/payment" || path === "/payment") && method === "POST") {
        return await handleSubmitPayment(request, db, cors);
      }

      const ackMatch = path.match(/^\/(?:api\/)?acknowledgement\/([a-zA-Z0-9_-]+)/);
      if (ackMatch && method === "GET") {
        return await handleGetAcknowledgement(request, db, cors, ackMatch[1]);
      }

      // =========================================================
      // PROFILE ROUTES
      // =========================================================

      if ((path === "/api/me/civilian-profile" || path === "/me/civilian-profile") && method === "GET") {
        return await handleGetCivilianProfile(request, db, cors);
      }

      if ((path === "/api/me/professional-profile" || path === "/me/professional-profile") && method === "GET") {
        return await handleGetProfessionalProfile(request, db, cors);
      }

      if ((path === "/profile/update" || path === "/api/profile/update") && method === "POST") {
        return await handleProfileUpdate(request, db, cors);
      }

      if ((path === "/profile/upload-photo" || path === "/api/profile/upload-photo") && method === "POST") {
        return await handleProfilePhotoUpload(request, db, cors);
      }

      if (path === "/api/logout" && method === "POST") {
        let token = getCookie(request);
        if (!token) {
          const authHeader = request.headers.get("Authorization") || "";
          if (authHeader.startsWith("Bearer ")) {
            token = authHeader.slice(7).trim();
          }
        }

        if (token && /^[a-f0-9]{64}$/.test(token)) {
          await db.prepare(`
            DELETE FROM worker_auth_sessions
            WHERE token_hash = ?
          `).bind(await sha256(token)).run();
        }

        return json({
          success: true,
          message: "Logged out",
        }, 200, {
          ...cors,
          "Set-Cookie": sessionCookie("", 0),
        });
      }

      if ((path === "/admin_login" || path === "/api/admin_login" || path === "/api/auth/admin-login-verify") && method === "POST") {
        return await handleAdminLogin(request, db, cors);
      }

      if ((path === "/api/admin/users" || path === "/admin/users") && method === "GET") {
        const users = await db.prepare(`
          SELECT id, login_id, first_name, last_name, email, phone, membership_type, payment_status, created_at, is_deleted
          FROM kyc_members
          ORDER BY id DESC
        `).all();

        return json({
          success: true,
          users: users.results || [],
          data: {
            users: users.results || [],
            members: users.results || [],
            total: (users.results || []).length,
          },
        }, 200, cors);
      }

      if ((path === "/api/admin/paid_users" || path === "/admin/paid_users") && method === "GET") {
        const paidUsers = await db.prepare(`
          SELECT id, login_id, first_name, last_name, email, phone, membership_type, payment_status, created_at, is_deleted
          FROM kyc_members
          WHERE LOWER(payment_status) IN ('approved', 'paid', 'success', 'successful', 'completed')
          ORDER BY id DESC
        `).all();

        return json({
          success: true,
          users: paidUsers.results || [],
          data: {
            users: paidUsers.results || [],
            paid_users: paidUsers.results || [],
            total: (paidUsers.results || []).length,
          },
        }, 200, cors);
      }

      if ((path === "/deleted_users" || path === "/api/deleted_users") && method === "GET") {
        const deletedUsers = await db.prepare(`
          SELECT id, login_id, first_name, last_name, email, phone, membership_type, payment_status, created_at, is_deleted
          FROM kyc_members
          WHERE is_deleted = 1
          ORDER BY id DESC
        `).all();

        return json({
          success: true,
          users: deletedUsers.results || [],
          data: {
            users: deletedUsers.results || [],
            deleted_users: deletedUsers.results || [],
            total: (deletedUsers.results || []).length,
          },
        }, 200, cors);
      }

      if (path === "/api/auth/admin-me" && method === "GET") {
        const admin = await getCurrentAdmin(request, db);

        return json({
          success: true,
          authenticated: !!admin,
          admin: admin || null,
        }, 200, cors);
      }

      if ((path === "/logout" || path === "/api/logout" || path === "/api/auth/admin-logout") && (method === "POST" || method === "GET")) {
        let token = getCookie(request);
        if (!token) {
          const authHeader = request.headers.get("Authorization") || "";
          if (authHeader.startsWith("Bearer ")) {
            token = authHeader.slice(7).trim();
          }
        }

        if (token && /^[a-f0-9]{64}$/.test(token)) {
          const tokenHash = await sha256(token);
          await db.prepare(`DELETE FROM worker_auth_sessions WHERE token_hash = ?`).bind(tokenHash).run();
          await db.prepare(`DELETE FROM worker_admin_sessions WHERE token_hash = ?`).bind(tokenHash).run();
        }

        return json({
          success: true,
          message: "Logged out",
        }, 200, {
          ...cors,
          "Set-Cookie": sessionCookie("", 0),
        });
      }

      return json({
        success: false,
        error: "Not found",
        available_routes: [
          "GET /api/health",
          "GET /api/me",
          "POST /api/login",
          "POST /api/logout",
          "GET /api/auth/admin-me",
          "POST /api/auth/admin-logout",
        ],
      }, 404, cors);

    } catch (error) {
      console.error("Staging API error", error?.message);

      return json({
        success: false,
        error: "Internal server error",
      }, 500, cors);
    }
  },
};
