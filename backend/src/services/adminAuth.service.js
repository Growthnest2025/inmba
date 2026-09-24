const crypto =
  require(
    "crypto"
  );

const bcrypt =
  require(
    "bcryptjs"
  );

const sgMail =
  require(
    "@sendgrid/mail"
  );

const ApiError =
  require(
    "../utils/apiError"
  );

const {
  findAdminById,
  findAdminByUsername,
  findAdminByEmail,
  createAdmin,
  updateAdminOtp,
  clearAdminOtp,
  toSafeAdmin,
} = require(
  "../repositories/adminAuth.repository"
);

/* =========================
   SETTINGS
========================= */

const ADMIN_OTP_EXPIRY_MINUTES =
  Number(
    process.env
      .ADMIN_OTP_EXPIRY_MINUTES ||
      5
  );

const ADMIN_PASSWORD_ROUNDS =
  Number(
    process.env
      .ADMIN_PASSWORD_ROUNDS ||
      12
  );

/* =========================
   STRING HELPERS
========================= */

const secureCompare =
  (
    value1,
    value2
  ) => {
    const first =
      Buffer.from(
        String(
          value1 ||
            ""
        )
      );

    const second =
      Buffer.from(
        String(
          value2 ||
            ""
        )
      );

    if (
      first.length !==
      second.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      first,
      second
    );
  };

/* =========================
   LEGACY PASSWORD CHECK
========================= */

const verifyWerkzeugPassword =
  (
    password,
    storedHash
  ) => {
    try {
      const parts =
        String(
          storedHash ||
            ""
        ).split("$");

      if (
        parts.length !==
        3
      ) {
        return false;
      }

      const [
        method,
        salt,
        expectedHash,
      ] = parts;

      if (
        method.startsWith(
          "pbkdf2:"
        )
      ) {
        const [
          ,
          algorithm,
          iterationValue,
        ] =
          method.split(":");

        const iterations =
          Number(
            iterationValue
          );

        if (
          !algorithm ||
          !Number.isInteger(
            iterations
          ) ||
          iterations <= 0
        ) {
          return false;
        }

        const generatedHash =
          crypto
            .pbkdf2Sync(
              password,
              salt,
              iterations,
              expectedHash.length /
                2,
              algorithm
            )
            .toString(
              "hex"
            );

        return secureCompare(
          generatedHash,
          expectedHash
        );
      }

      if (
        method.startsWith(
          "scrypt:"
        )
      ) {
        const [
          ,
          nValue,
          rValue,
          pValue,
        ] =
          method.split(":");

        const N =
          Number(
            nValue
          );

        const r =
          Number(
            rValue
          );

        const p =
          Number(
            pValue
          );

        if (
          !N ||
          !r ||
          !p
        ) {
          return false;
        }

        const keyLength =
          expectedHash.length /
          2;

        const generatedHash =
          crypto
            .scryptSync(
              password,
              salt,
              keyLength,
              {
                N,
                r,
                p,

                maxmem:
                  Math.max(
                    128 *
                      N *
                      r *
                      2,
                    64 *
                      1024 *
                      1024
                  ),
              }
            )
            .toString(
              "hex"
            );

        return secureCompare(
          generatedHash,
          expectedHash
        );
      }

      return false;
    } catch {
      return false;
    }
  };

/* =========================
   VERIFY STORED PASSWORD
========================= */

const verifyAdminPassword =
  async (
    password,
    storedHash
  ) => {
    const normalizedHash =
      String(
        storedHash ||
          ""
      ).trim();

    if (
      !normalizedHash
    ) {
      return false;
    }

    if (
      normalizedHash.startsWith(
        "$2a$"
      ) ||
      normalizedHash.startsWith(
        "$2b$"
      ) ||
      normalizedHash.startsWith(
        "$2y$"
      )
    ) {
      return bcrypt.compare(
        password,
        normalizedHash
      );
    }

    if (
      normalizedHash.includes(
        "$"
      )
    ) {
      return verifyWerkzeugPassword(
        password,
        normalizedHash
      );
    }

    return false;
  };

/* =========================
   OTP HELPERS
========================= */

const generateAdminOtp =
  () => {
    return String(
      crypto.randomInt(
        100000,
        1000000
      )
    );
  };

const createOtpExpiry =
  () => {
    return new Date(
      Date.now() +
        ADMIN_OTP_EXPIRY_MINUTES *
          60 *
          1000
    );
  };

/* =========================
   SEND OTP EMAIL
========================= */

const sendAdminOtpEmail =
  async (
    admin,
    otp
  ) => {
    const sendgridKey =
      String(
        process.env
          .SENDGRID_API_KEY ||
          ""
      ).trim();

    const fromEmail =
      String(
        process.env
          .EMAIL_FROM ||
          ""
      ).trim();

    if (
      !sendgridKey ||
      !fromEmail ||
      !admin.email
    ) {
      return {
        sent:
          false,

        reason:
          "Email configuration is unavailable.",
      };
    }

    sgMail.setApiKey(
      sendgridKey
    );

    try {
      await sgMail.send({
        to:
          admin.email,

        from:
          fromEmail,

        subject:
          "INMBA Admin Login OTP",

        text:
          `Your INMBA Admin login OTP is ${otp}. It expires in ${ADMIN_OTP_EXPIRY_MINUTES} minutes.`,

        html:
          `
            <div style="font-family:Arial,sans-serif;padding:20px;">
              <h2 style="color:#0f4d0f;">
                INMBA Admin Login
              </h2>

              <p>
                Your One-Time Password is:
              </p>

              <div style="
                display:inline-block;
                padding:12px 20px;
                background:#eef7ee;
                border:1px solid #0f4d0f;
                border-radius:8px;
                font-size:24px;
                font-weight:700;
                letter-spacing:6px;
                color:#0f4d0f;
              ">
                ${otp}
              </div>

              <p style="margin-top:18px;">
                This OTP expires in
                ${ADMIN_OTP_EXPIRY_MINUTES}
                minutes.
              </p>

              <p style="color:#777;">
                Do not share this OTP with anyone.
              </p>
            </div>
          `,
      });

      return {
        sent:
          true,
      };
    } catch (error) {
      console.error(
        "Admin OTP email failed:",
        error.message
      );

      return {
        sent:
          false,

        reason:
          "Unable to send OTP email.",
      };
    }
  };

/* =========================
   SUPER ADMIN SETTINGS
========================= */

const getSuperAdminSettings =
  () => {
    return {
      username:
        String(
          process.env
            .SUPER_ADMIN_USERNAME ||
            ""
        ).trim(),

      password:
        String(
          process.env
            .SUPER_ADMIN_PASSWORD ||
            ""
        ),

      secretKey:
        String(
          process.env
            .SUPER_ADMIN_SECRET_KEY ||
            ""
        ),

      email:
        String(
          process.env
            .SUPER_ADMIN_EMAIL ||
            ""
        )
          .trim()
          .toLowerCase(),
    };
  };

/* =========================
   ENSURE SUPER ADMIN RECORD
========================= */

const ensureSuperAdminRecord =
  async (
    settings,
    connection =
      null
  ) => {
    let admin =
      await findAdminByUsername(
        settings.username,
        connection
      );

    if (
      admin
    ) {
      return admin;
    }

    const passwordHash =
      await bcrypt.hash(
        settings.password,
        ADMIN_PASSWORD_ROUNDS
      );

    const result =
      await createAdmin(
        {
          username:
            settings.username,

          email:
            settings.email ||
            null,

          mobile:
            null,

          first_name:
            "Super",

          last_name:
            "Admin",

          role:
            "super_admin",

          password_hash:
            passwordHash,

          super_key:
            settings.secretKey,
        },
        connection
      );

    const insertedId =
      Number(
        result?.insertId ||
          result?.[0]
            ?.insertId ||
          0
      );

    if (
      insertedId
    ) {
      admin =
        await findAdminById(
          insertedId,
          connection
        );
    } else {
      admin =
        await findAdminByUsername(
          settings.username,
          connection
        );
    }

    return admin;
  };

/* =========================
   START ADMIN LOGIN
========================= */

const startAdminLogin =
  async (
    loginData,
    connection =
      null
  ) => {
    if (
      loginData.role ===
      "super_admin"
    ) {
      const settings =
        getSuperAdminSettings();

      if (
        !settings.username ||
        !settings.password ||
        !settings.secretKey
      ) {
        throw new ApiError(
          500,
          "Super Admin environment configuration is missing."
        );
      }

      const validCredentials =
        secureCompare(
          loginData.username,
          settings.username
        ) &&
        secureCompare(
          loginData.password,
          settings.password
        ) &&
        secureCompare(
          loginData.secret_key,
          settings.secretKey
        );

      if (
        !validCredentials
      ) {
        throw new ApiError(
          401,
          "Invalid Super Admin credentials."
        );
      }

      const admin =
        await ensureSuperAdminRecord(
          settings,
          connection
        );

      if (
        !admin
      ) {
        throw new ApiError(
          500,
          "Unable to initialize Super Admin account."
        );
      }

      return {
        requires_otp:
          false,

        authenticated:
          true,

        admin:
          toSafeAdmin(
            admin
          ),

        redirectTo:
          "/admin",
      };
    }

    const admin =
      await findAdminByUsername(
        loginData.username,
        connection
      );

    if (
      !admin
    ) {
      throw new ApiError(
        401,
        "Invalid admin credentials."
      );
    }

    const databaseRole =
      String(
        admin.role ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      databaseRole !==
      loginData.role
    ) {
      throw new ApiError(
        401,
        "Selected role does not match this account."
      );
    }

    if (
      ![
        "admin",
        "subadmin",
      ].includes(
        databaseRole
      )
    ) {
      throw new ApiError(
        403,
        "This account cannot use OTP login."
      );
    }

    const passwordValid =
      await verifyAdminPassword(
        loginData.password,
        admin.password_hash
      );

    if (
      !passwordValid
    ) {
      throw new ApiError(
        401,
        "Invalid admin credentials."
      );
    }

    const registeredEmail =
      String(
        admin.email ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      !registeredEmail
    ) {
      throw new ApiError(
        400,
        "No registered email is available for this admin."
      );
    }

    if (
      registeredEmail !==
      loginData.email
    ) {
      throw new ApiError(
        401,
        "Provided email does not match the registered email."
      );
    }

    const otp =
      generateAdminOtp();

    const otpExpires =
      createOtpExpiry();

    await updateAdminOtp(
      admin.id,
      otp,
      otpExpires,
      connection
    );

    const emailResult =
      await sendAdminOtpEmail(
        admin,
        otp
      );

    const response = {
      requires_otp:
        true,

      authenticated:
        false,

      pending_admin: {
        id:
          admin.id,

        username:
          admin.username,

        email:
          admin.email,

        role:
          admin.role,
      },

      otp_expires_at:
        otpExpires.toISOString(),

      otp_email_sent:
        emailResult.sent,

      nextAction: {
        type:
          "VERIFY_OTP",

        path:
          "/admin/verify-otp",
      },
    };

    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      response.debug_otp =
        otp;
    }

    return response;
  };

/* =========================
   VERIFY ADMIN OTP
========================= */

const verifyAdminLoginOtp =
  async (
    pendingLogin,
    otp,
    connection =
      null
  ) => {
    if (
      !pendingLogin ||
      !pendingLogin.admin_id
    ) {
      throw new ApiError(
        401,
        "Admin login session expired. Please login again."
      );
    }

    const admin =
      await findAdminById(
        pendingLogin.admin_id,
        connection
      );

    if (
      !admin
    ) {
      throw new ApiError(
        404,
        "Admin account not found."
      );
    }

    if (
      !admin.otp
    ) {
      throw new ApiError(
        404,
        "No OTP found. Request a new OTP."
      );
    }

    const otpExpiry =
      admin.otp_expires
        ? new Date(
            admin.otp_expires
          )
        : null;

    if (
      !otpExpiry ||
      Number.isNaN(
        otpExpiry.getTime()
      ) ||
      new Date() >
        otpExpiry
    ) {
      await clearAdminOtp(
        admin.id,
        connection
      );

      throw new ApiError(
        401,
        "OTP expired. Please login again."
      );
    }

    if (
      !secureCompare(
        String(
          admin.otp
        ),
        String(
          otp
        )
      )
    ) {
      throw new ApiError(
        401,
        "Invalid OTP."
      );
    }

    await clearAdminOtp(
      admin.id,
      connection
    );

    return {
      authenticated:
        true,

      admin:
        toSafeAdmin(
          admin
        ),

      redirectTo:
        "/admin",

      nextAction: {
        type:
          "NAVIGATE",

        path:
          "/admin",
      },
    };
  };

/* =========================
   GET CURRENT ADMIN
========================= */

const getCurrentAdmin =
  async (
    adminId,
    connection =
      null
  ) => {
    const admin =
      await findAdminById(
        adminId,
        connection
      );

    if (
      !admin
    ) {
      throw new ApiError(
        404,
        "Admin account not found."
      );
    }

    return toSafeAdmin(
      admin
    );
  };

/* =========================
   CREATE ADMIN ACCOUNT
========================= */

const createAdminAccount =
  async (
    signupData,
    connection =
      null
  ) => {
    const existingUsername =
      await findAdminByUsername(
        signupData.username,
        connection
      );

    if (
      existingUsername
    ) {
      throw new ApiError(
        409,
        "Admin username is already registered."
      );
    }

    const existingEmail =
      await findAdminByEmail(
        signupData.email,
        connection
      );

    if (
      existingEmail
    ) {
      throw new ApiError(
        409,
        "Admin email is already registered."
      );
    }

    const passwordHash =
      await bcrypt.hash(
        signupData.password,
        ADMIN_PASSWORD_ROUNDS
      );

    const result =
      await createAdmin(
        {
          ...signupData,

          password_hash:
            passwordHash,

          super_key:
            null,
        },
        connection
      );

    const insertedId =
      Number(
        result?.insertId ||
          result?.[0]
            ?.insertId ||
          0
      );

    const admin =
      insertedId
        ? await findAdminById(
            insertedId,
            connection
          )
        : await findAdminByUsername(
            signupData.username,
            connection
          );

    if (
      !admin
    ) {
      throw new ApiError(
        500,
        "Admin account was created but could not be loaded."
      );
    }

    return {
      admin:
        toSafeAdmin(
          admin
        ),
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  ADMIN_OTP_EXPIRY_MINUTES,
  ADMIN_PASSWORD_ROUNDS,
  secureCompare,
  verifyWerkzeugPassword,
  verifyAdminPassword,
  generateAdminOtp,
  createOtpExpiry,
  sendAdminOtpEmail,
  getSuperAdminSettings,
  ensureSuperAdminRecord,
  startAdminLogin,
  verifyAdminLoginOtp,
  getCurrentAdmin,
  createAdminAccount,
};