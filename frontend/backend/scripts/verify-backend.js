require(
  "dotenv"
).config();

const fs =
  require(
    "fs"
  );

const fsPromises =
  require(
    "fs/promises"
  );

const path =
  require(
    "path"
  );

const http =
  require(
    "http"
  );

/* =========================
   PROJECT PATHS
========================= */

const BACKEND_ROOT =
  path.resolve(
    __dirname,
    ".."
  );

const REPORT_DIRECTORY =
  path.join(
    BACKEND_ROOT,
    "docs"
  );

const REPORT_PATH =
  path.join(
    REPORT_DIRECTORY,
    "backend-verification-report.json"
  );

/* =========================
   REQUIRED PACKAGES
========================= */

const REQUIRED_PACKAGES = [
  "express",
  "cors",
  "helmet",
  "compression",
  "morgan",
  "dotenv",

  "express-session",
  "express-mysql-session",
  "cookie-parser",

  "mysql2",
  "bcryptjs",
  "uuid",
  "express-validator",
  "formidable",

  "@sendgrid/mail",
  "qrcode",
  "sharp",

  "jsonwebtoken",
  "dayjs",

  "pdfkit",
  "html-pdf",
  "archiver",
];

/* =========================
   REQUIRED ENV VARIABLES
========================= */

const REQUIRED_ENV_VARIABLES = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_NAME",

  "SESSION_SECRET",
  "SESSION_NAME",

  "FRONTEND_BASE_URL",
  "BACKEND_URL",
  "CORS_ORIGINS",
];

/* =========================
   IMPORTANT FILES
========================= */

const REQUIRED_FILES = [
  /* Application */

  "src/app.js",
  "src/server.js",

  /* Configuration */

  "src/config/session.js",
  "src/config/transactionDatabase.js",

  /* Database */

  "src/database/schema.definition.js",
  "src/database/schemaBootstrap.js",

  /* Utilities */

  "src/utils/apiError.js",
  "src/utils/transaction.js",

  /* Main middleware */

  "src/middleware/notFound.middleware.js",
  "src/middleware/error.middleware.js",
  "src/middleware/adminAuth.middleware.js",
  "src/middleware/rateLimit.middleware.js",
  "src/middleware/requestSecurity.middleware.js",
  "src/middleware/securityAudit.middleware.js",

  /* Route index */

  "src/routes/index.js",

  /* Main routes */

  "src/routes/health.routes.js",
  "src/routes/schema.routes.js",

  "src/routes/registration.routes.js",
  "src/routes/auth.routes.js",
  "src/routes/passwordReset.routes.js",
  "src/routes/policy.routes.js",

  "src/routes/dashboard.routes.js",
  "src/routes/profile.routes.js",
  "src/routes/profileCompletion.routes.js",

  "src/routes/payment.routes.js",
  "src/routes/bankPan.routes.js",
  "src/routes/legalEntity.routes.js",
  "src/routes/signature.routes.js",

  "src/routes/acknowledgement.routes.js",
  "src/routes/qrCode.routes.js",
  "src/routes/download.routes.js",

  "src/routes/network.routes.js",
  "src/routes/publicProfile.routes.js",
  "src/routes/publicProfileOwner.routes.js",
  "src/routes/memberDirectory.routes.js",
  "src/routes/royalty.routes.js",

  "src/routes/adminAuth.routes.js",
  "src/routes/adminMember.routes.js",
  "src/routes/adminMemberAction.routes.js",
  "src/routes/adminEvent.routes.js",
  "src/routes/backup.routes.js",

  "src/routes/legacyPage.routes.js",

  /* Important controllers */

  "src/controllers/dashboard.controller.js",
  "src/controllers/publicProfileOwner.controller.js",
  "src/controllers/profileCompletion.controller.js",
  "src/controllers/permanentDelete.controller.js",
  "src/controllers/schema.controller.js",

  /* Important services */

  "src/services/index.js",
  "src/services/fileStorage.service.js",
  "src/services/publicProfile.service.js",
  "src/services/publicProfileOwner.service.js",
  "src/services/profileCompletion.service.js",
  "src/services/permanentDelete.service.js",
  "src/services/backup.service.js",
  "src/services/download.service.js",
  "src/services/legacyPage.service.js",

  /* Important repositories */

  "src/repositories/auth.repository.js",
  "src/repositories/publicProfileOwner.repository.js",
  "src/repositories/profileCompletion.repository.js",
  "src/repositories/backup.repository.js",

  /* Important validators */

  "src/validators/publicProfileOwner.validator.js",
  "src/validators/profileCompletion.validator.js",
  "src/validators/adminMemberAction.validator.js",

  /* Step 32 commands */

  "scripts/run-schema.js",
  "scripts/check-schema.js",
];

/* =========================
   REPORT
========================= */

const report = {
  verification_name:
    "INMBA Backend Complete Verification",

  started_at:
    new Date()
      .toISOString(),

  completed_at:
    null,

  passed:
    false,

  summary: {
    passed_checks:
      0,

    failed_checks:
      0,

    warning_checks:
      0,

    skipped_checks:
      0,
  },

  checks:
    [],

  environment: {
    node_version:
      process.version,

    node_environment:
      process.env
        .NODE_ENV ||
      "development",

    backend_root:
      BACKEND_ROOT,
  },
};

/* =========================
   CHECK RECORDER
========================= */

const addCheck =
  (
    category,
    name,
    status,
    details = null
  ) => {
    const normalizedStatus =
      String(
        status
      ).toLowerCase();

    report.checks.push({
      category,
      name,
      status:
        normalizedStatus,
      details,
    });

    if (
      normalizedStatus ===
      "passed"
    ) {
      report.summary
        .passed_checks +=
        1;
    } else if (
      normalizedStatus ===
      "failed"
    ) {
      report.summary
        .failed_checks +=
        1;
    } else if (
      normalizedStatus ===
      "warning"
    ) {
      report.summary
        .warning_checks +=
        1;
    } else {
      report.summary
        .skipped_checks +=
        1;
    }
  };

/* =========================
   ERROR DETAILS
========================= */

const getErrorDetails =
  (
    error
  ) => {
    return {
      name:
        error?.name ||
        null,

      code:
        error?.code ||
        null,

      message:
        error?.message ||
        String(
          error
        ),

      stack:
        error?.stack ||
        null,
    };
  };

/* =========================
   REQUIRED FILE CHECK
========================= */

const checkRequiredFiles =
  () => {
    for (
      const relativePath of
        REQUIRED_FILES
    ) {
      const absolutePath =
        path.join(
          BACKEND_ROOT,
          relativePath
        );

      if (
        fs.existsSync(
          absolutePath
        )
      ) {
        addCheck(
          "files",
          relativePath,
          "passed"
        );
      } else {
        addCheck(
          "files",
          relativePath,
          "failed",
          "Required file is missing."
        );
      }
    }
  };

/* =========================
   PACKAGE CHECK
========================= */

const checkRequiredPackages =
  () => {
    for (
      const packageName of
        REQUIRED_PACKAGES
    ) {
      try {
        const packagePath =
          require.resolve(
            packageName,
            {
              paths: [
                BACKEND_ROOT,
              ],
            }
          );

        addCheck(
          "packages",
          packageName,
          "passed",
          packagePath
        );
      } catch (error) {
        addCheck(
          "packages",
          packageName,
          "failed",
          getErrorDetails(
            error
          )
        );
      }
    }
  };

/* =========================
   ENV CHECK
========================= */

const checkEnvironment =
  () => {
    for (
      const variableName of
        REQUIRED_ENV_VARIABLES
    ) {
      const value =
        String(
          process.env[
            variableName
          ] ||
            ""
        ).trim();

      if (
        value
      ) {
        addCheck(
          "environment",
          variableName,
          "passed",
          "Value is configured."
        );
      } else {
        addCheck(
          "environment",
          variableName,
          "failed",
          "Environment value is missing."
        );
      }
    }

    const sendGridKey =
      String(
        process.env
          .SENDGRID_API_KEY ||
          ""
      ).trim();

    if (
      !sendGridKey ||
      sendGridKey.includes(
        "PASTE"
      ) ||
      sendGridKey.includes(
        "YOUR_"
      )
    ) {
      addCheck(
        "environment",
        "SENDGRID_API_KEY",
        "warning",
        "SendGrid key is missing or still contains a placeholder."
      );
    } else {
      addCheck(
        "environment",
        "SENDGRID_API_KEY",
        "passed",
        "SendGrid key is configured."
      );
    }

    const sessionSecret =
      String(
        process.env
          .SESSION_SECRET ||
          ""
      );

    if (
      sessionSecret.length >=
      32
    ) {
      addCheck(
        "security",
        "SESSION_SECRET_LENGTH",
        "passed",
        `Length: ${sessionSecret.length}`
      );
    } else {
      addCheck(
        "security",
        "SESSION_SECRET_LENGTH",
        "warning",
        "SESSION_SECRET should contain at least 32 characters."
      );
    }

    const frontendBaseUrl =
      String(
        process.env
          .FRONTEND_BASE_URL ||
          ""
      );

    if (
      /^https?:\/\//i.test(
        frontendBaseUrl
      )
    ) {
      addCheck(
        "environment",
        "FRONTEND_BASE_URL_FORMAT",
        "passed",
        frontendBaseUrl
      );
    } else {
      addCheck(
        "environment",
        "FRONTEND_BASE_URL_FORMAT",
        "failed",
        "FRONTEND_BASE_URL must start with http:// or https://."
      );
    }
  };

/* =========================
   MODULE IMPORT CHECK
========================= */

const checkModuleImports =
  () => {
    const modules = [
      {
        name:
          "Application",

        file:
          "../src/app",
      },

      {
        name:
          "Route index",

        file:
          "../src/routes",
      },

      {
        name:
          "Service index",

        file:
          "../src/services",
      },

      {
        name:
          "Schema bootstrap",

        file:
          "../src/database/schemaBootstrap",
      },

      {
        name:
          "Transaction utility",

        file:
          "../src/utils/transaction",
      },

      {
        name:
          "Permanent delete service",

        file:
          "../src/services/permanentDelete.service",
      },

      {
        name:
          "Profile completion service",

        file:
          "../src/services/profileCompletion.service",
      },

      {
        name:
          "Public profile owner service",

        file:
          "../src/services/publicProfileOwner.service",
      },
    ];

    const imported = {};

    for (
      const moduleDetails of
        modules
    ) {
      try {
        imported[
          moduleDetails.name
        ] =
          require(
            moduleDetails.file
          );

        addCheck(
          "imports",
          moduleDetails.name,
          "passed",
          moduleDetails.file
        );
      } catch (error) {
        addCheck(
          "imports",
          moduleDetails.name,
          "failed",
          getErrorDetails(
            error
          )
        );
      }
    }

    return imported;
  };

/* =========================
   DATABASE CHECK
========================= */

const checkDatabase =
  async () => {
    try {
      const {
        checkTransactionPool,
      } = require(
        "../src/config/transactionDatabase"
      );

      const databaseInfo =
        await checkTransactionPool();

      addCheck(
        "database",
        "MariaDB connection",
        "passed",
        databaseInfo
      );

      const forceRecovery =
        Number(
          databaseInfo
            ?.innodb_force_recovery ||
            0
        );

      if (
        forceRecovery ===
        0
      ) {
        addCheck(
          "database",
          "InnoDB recovery mode",
          "passed",
          "innodb_force_recovery = 0"
        );
      } else {
        addCheck(
          "database",
          "InnoDB recovery mode",
          "failed",
          `innodb_force_recovery = ${forceRecovery}`
        );
      }

      const readOnly =
        Number(
          databaseInfo
            ?.read_only ||
            0
        );

      if (
        readOnly ===
        0
      ) {
        addCheck(
          "database",
          "Database write mode",
          "passed",
          "read_only = 0"
        );
      } else {
        addCheck(
          "database",
          "Database write mode",
          "failed",
          "Database is running in read-only mode."
        );
      }

      return databaseInfo;
    } catch (error) {
      addCheck(
        "database",
        "MariaDB connection",
        "failed",
        getErrorDetails(
          error
        )
      );

      return null;
    }
  };

/* =========================
   SCHEMA CHECK
========================= */

const checkSchema =
  async () => {
    try {
      const {
        runSchemaBootstrap,
        inspectSchema,
      } = require(
        "../src/database/schemaBootstrap"
      );

      const bootstrap =
        await runSchemaBootstrap({
          logger: {
            log() {},
            warn() {},
          },
        });

      addCheck(
        "schema",
        "Schema bootstrap",
        "passed",
        {
          schema_version:
            bootstrap
              .schema_version,

          tables_created:
            bootstrap
              .tables_created,

          columns_added:
            bootstrap
              .columns_added,

          indexes_added:
            bootstrap
              .indexes_added,

          warnings:
            bootstrap.warnings,
        }
      );

      const inspection =
        await inspectSchema();

      if (
        inspection.ready
      ) {
        addCheck(
          "schema",
          "Schema readiness",
          "passed",
          inspection
        );
      } else {
        addCheck(
          "schema",
          "Schema readiness",
          "failed",
          inspection
        );
      }

      if (
        inspection
          .fully_indexed
      ) {
        addCheck(
          "schema",
          "Schema indexes",
          "passed",
          "All expected indexes are available."
        );
      } else {
        addCheck(
          "schema",
          "Schema indexes",
          "warning",
          inspection
            .missing_indexes
        );
      }

      return inspection;
    } catch (error) {
      addCheck(
        "schema",
        "Schema bootstrap",
        "failed",
        getErrorDetails(
          error
        )
      );

      return null;
    }
  };

/* =========================
   COOKIE JAR
========================= */

const createCookieJar =
  () => {
    const cookies =
      new Map();

    const storeResponseCookies =
      (
        response
      ) => {
        let setCookieValues =
          [];

        if (
          typeof response
            .headers
            .getSetCookie ===
          "function"
        ) {
          setCookieValues =
            response.headers
              .getSetCookie();
        } else {
          const setCookie =
            response.headers.get(
              "set-cookie"
            );

          if (
            setCookie
          ) {
            setCookieValues = [
              setCookie,
            ];
          }
        }

        for (
          const cookieValue of
            setCookieValues
        ) {
          const firstPart =
            String(
              cookieValue
            )
              .split(";")[0]
              .trim();

          const separatorIndex =
            firstPart.indexOf(
              "="
            );

          if (
            separatorIndex <=
            0
          ) {
            continue;
          }

          const name =
            firstPart.slice(
              0,
              separatorIndex
            );

          const value =
            firstPart.slice(
              separatorIndex +
                1
            );

          if (
            value
          ) {
            cookies.set(
              name,
              value
            );
          } else {
            cookies.delete(
              name
            );
          }
        }
      };

    const getCookieHeader =
      () => {
        return Array.from(
          cookies.entries()
        )
          .map(
            (
              [
                name,
                value,
              ]
            ) =>
              `${name}=${value}`
          )
          .join("; ");
      };

    return {
      storeResponseCookies,
      getCookieHeader,
      size:
        () =>
          cookies.size,
    };
  };

/* =========================
   RESPONSE PARSER
========================= */

const parseResponseBody =
  async (
    response
  ) => {
    const contentType =
      String(
        response.headers.get(
          "content-type"
        ) ||
          ""
      ).toLowerCase();

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      try {
        return await response
          .json();
      } catch {
        return null;
      }
    }

    try {
      return await response
        .text();
    } catch {
      return null;
    }
  };

/* =========================
   FETCH REQUEST
========================= */

const performRequest =
  async (
    baseUrl,
    options
  ) => {
    const {
      method =
        "GET",

      pathname,

      body =
        undefined,

      expectedStatus =
        [200],

      cookieJar =
        null,

      redirect =
        "manual",
    } = options;

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => {
          controller.abort();
        },
        15000
      );

    const headers = {
      Accept:
        "application/json",

      Origin:
        process.env
          .FRONTEND_BASE_URL ||
        "http://localhost:5173",
    };

    const cookieHeader =
      cookieJar
        ?.getCookieHeader();

    if (
      cookieHeader
    ) {
      headers.Cookie =
        cookieHeader;
    }

    let requestBody;

    if (
      body !== undefined
    ) {
      headers[
        "Content-Type"
      ] =
        "application/json";

      requestBody =
        JSON.stringify(
          body
        );
    }

    try {
      const response =
        await fetch(
          `${baseUrl}${pathname}`,
          {
            method,

            headers,

            body:
              requestBody,

            redirect,

            signal:
              controller.signal,
          }
        );

      cookieJar
        ?.storeResponseCookies(
          response
        );

      const responseBody =
        await parseResponseBody(
          response
        );

      const passed =
        expectedStatus.includes(
          response.status
        );

      return {
        passed,

        method,

        pathname,

        status:
          response.status,

        expected_status:
          expectedStatus,

        location:
          response.headers.get(
            "location"
          ),

        content_type:
          response.headers.get(
            "content-type"
          ),

        request_id:
          response.headers.get(
            "x-request-id"
          ),

        body:
          responseBody,
      };
    } finally {
      clearTimeout(
        timeout
      );
    }
  };

/* =========================
   API TEST RECORDER
========================= */

const runApiTest =
  async (
    baseUrl,
    name,
    options
  ) => {
    try {
      const result =
        await performRequest(
          baseUrl,
          options
        );

      addCheck(
        "api",
        name,
        result.passed
          ? "passed"
          : "failed",
        result
      );

      return result;
    } catch (error) {
      addCheck(
        "api",
        name,
        "failed",
        getErrorDetails(
          error
        )
      );

      return null;
    }
  };

/* =========================
   PUBLIC API TESTS
========================= */

const runPublicApiTests =
  async (
    baseUrl
  ) => {
    await runApiTest(
      baseUrl,
      "GET /api/health",
      {
        pathname:
          "/api/health",

        expectedStatus: [
          200,
        ],
      }
    );

    await runApiTest(
      baseUrl,
      "GET /api/health/schema",
      {
        pathname:
          "/api/health/schema",

        expectedStatus: [
          200,
        ],
      }
    );

    await runApiTest(
      baseUrl,
      "GET /api/events",
      {
        pathname:
          "/api/events",

        expectedStatus: [
          200,
        ],
      }
    );

    await runApiTest(
      baseUrl,
      "GET /api/members",
      {
        pathname:
          "/api/members?page=1&limit=1",

        expectedStatus: [
          200,
        ],
      }
    );

    await runApiTest(
      baseUrl,
      "GET /api/downloads",
      {
        pathname:
          "/api/downloads",

        expectedStatus: [
          200,
        ],
      }
    );

    await runApiTest(
      baseUrl,
      "Missing public profile returns 404",
      {
        pathname:
          "/api/public/user/__INMBA_MISSING_MEMBER__",

        expectedStatus: [
          404,
        ],
      }
    );

    const rootRedirect =
      await runApiTest(
        baseUrl,
        "Legacy root redirect",
        {
          pathname:
            "/",

          expectedStatus: [
            301,
            302,
            307,
            308,
          ],

          redirect:
            "manual",
        }
      );

    if (
      rootRedirect?.passed
    ) {
      const frontendBaseUrl =
        String(
          process.env
            .FRONTEND_BASE_URL ||
            ""
        ).replace(
          /\/+$/,
          ""
        );

      if (
        rootRedirect
          .location
          ?.startsWith(
            frontendBaseUrl
          )
      ) {
        addCheck(
          "redirect",
          "Legacy root frontend target",
          "passed",
          rootRedirect
            .location
        );
      } else {
        addCheck(
          "redirect",
          "Legacy root frontend target",
          "failed",
          rootRedirect
            .location
        );
      }
    }

    const membersRedirect =
      await runApiTest(
        baseUrl,
        "Legacy members redirect",
        {
          pathname:
            "/members?search=Vignesh",

          expectedStatus: [
            301,
            302,
            307,
            308,
          ],

          redirect:
            "manual",
        }
      );

    if (
      membersRedirect?.passed &&
      membersRedirect
        .location
        ?.includes(
          "/members"
        )
    ) {
      addCheck(
        "redirect",
        "Members query preservation",
        membersRedirect
          .location
          .includes(
            "search=Vignesh"
          )
          ? "passed"
          : "failed",
        membersRedirect
          .location
      );
    }
  };

/* =========================
   MEMBER AUTH TESTS
========================= */

const runMemberAuthTests =
  async (
    baseUrl
  ) => {
    const loginId =
      String(
        process.env
          .TEST_MEMBER_LOGIN_ID ||
          ""
      ).trim();

    const password =
      String(
        process.env
          .TEST_MEMBER_PASSWORD ||
          ""
      );

    if (
      !loginId ||
      !password
    ) {
      addCheck(
        "member-auth",
        "Member authenticated tests",
        "skipped",
        "Set TEST_MEMBER_LOGIN_ID and TEST_MEMBER_PASSWORD in .env to run."
      );

      return;
    }

    const cookieJar =
      createCookieJar();

    const loginResult =
      await runApiTest(
        baseUrl,
        "Member login",
        {
          method:
            "POST",

          pathname:
            "/api/login",

          body: {
            login_id:
              loginId,

            password,
          },

          expectedStatus: [
            200,
          ],

          cookieJar,
        }
      );

    if (
      !loginResult?.passed
    ) {
      return;
    }

    if (
      cookieJar.size() >
      0
    ) {
      addCheck(
        "member-auth",
        "Member session cookie",
        "passed",
        `${cookieJar.size()} cookie(s) stored.`
      );
    } else {
      addCheck(
        "member-auth",
        "Member session cookie",
        "failed",
        "Login succeeded but session cookie was not returned."
      );
    }

    await runApiTest(
      baseUrl,
      "GET /api/me",
      {
        pathname:
          "/api/me",

        expectedStatus: [
          200,
        ],

        cookieJar,
      }
    );

    await runApiTest(
      baseUrl,
      "GET /api/dashboard",
      {
        pathname:
          "/api/dashboard",

        expectedStatus: [
          200,
        ],

        cookieJar,
      }
    );

    await runApiTest(
      baseUrl,
      "GET /api/profile",
      {
        pathname:
          "/api/profile",

        expectedStatus: [
          200,
        ],

        cookieJar,
      }
    );

    await runApiTest(
      baseUrl,
      "GET /api/policy/status",
      {
        pathname:
          "/api/policy/status",

        expectedStatus: [
          200,
        ],

        cookieJar,
      }
    );

    await runApiTest(
      baseUrl,
      "GET /api/network/summary",
      {
        pathname:
          "/api/network/summary",

        expectedStatus: [
          200,
        ],

        cookieJar,
      }
    );

    await runApiTest(
      baseUrl,
      "GET /api/qr-code",
      {
        pathname:
          "/api/qr-code",

        expectedStatus: [
          200,
        ],

        cookieJar,
      }
    );

    await runApiTest(
      baseUrl,
      "Member logout",
      {
        method:
          "POST",

        pathname:
          "/api/logout",

        body: {},

        expectedStatus: [
          200,
          204,
        ],

        cookieJar,
      }
    );
  };

/* =========================
   FIND VALUE RECURSIVELY
========================= */

const findFirstValueByKeys =
  (
    input,
    acceptedKeys
  ) => {
    if (
      !input ||
      typeof input !==
        "object"
    ) {
      return null;
    }

    for (
      const [
        key,
        value,
      ] of Object.entries(
        input
      )
    ) {
      if (
        acceptedKeys.includes(
          key
        ) &&
        value !== null &&
        value !== undefined &&
        value !== ""
      ) {
        return value;
      }
    }

    for (
      const value of
        Object.values(
          input
        )
    ) {
      if (
        value &&
        typeof value ===
          "object"
      ) {
        const result =
          findFirstValueByKeys(
            value,
            acceptedKeys
          );

        if (
          result !== null
        ) {
          return result;
        }
      }
    }

    return null;
  };

/* =========================
   ADMIN AUTH TESTS
========================= */

const runAdminAuthTests =
  async (
    baseUrl
  ) => {
    const username =
      String(
        process.env
          .TEST_ADMIN_USERNAME ||
          ""
      ).trim();

    const password =
      String(
        process.env
          .TEST_ADMIN_PASSWORD ||
          ""
      );

    const secretKey =
      String(
        process.env
          .TEST_ADMIN_SECRET_KEY ||
        process.env
          .SUPER_ADMIN_SECRET_KEY ||
          ""
      );

    if (
      !username ||
      !password
    ) {
      addCheck(
        "admin-auth",
        "Admin authenticated tests",
        "skipped",
        "Set TEST_ADMIN_USERNAME and TEST_ADMIN_PASSWORD in .env to run."
      );

      return;
    }

    const cookieJar =
      createCookieJar();

    const verifyResult =
      await runApiTest(
        baseUrl,
        "Admin login verification",
        {
          method:
            "POST",

          pathname:
            "/api/auth/admin-login-verify",

          body: {
            username,
            password,

            secret_key:
              secretKey,
          },

          expectedStatus: [
            200,
          ],

          cookieJar,
        }
      );

    if (
      !verifyResult?.passed
    ) {
      return;
    }

    const debugOtp =
      findFirstValueByKeys(
        verifyResult.body,
        [
          "debug_otp",
          "debugOtp",
          "otp",
        ]
      );

    const adminId =
      findFirstValueByKeys(
        verifyResult.body,
        [
          "admin_id",
          "adminId",
          "id",
        ]
      );

    const requiresOtp =
      Boolean(
        findFirstValueByKeys(
          verifyResult.body,
          [
            "requires_otp",
            "requiresOtp",
            "otp_required",
          ]
        )
      );

    if (
      requiresOtp ||
      debugOtp
    ) {
      if (
        !debugOtp
      ) {
        addCheck(
          "admin-auth",
          "Admin OTP verification",
          "skipped",
          "OTP is required but debug OTP was not returned."
        );

        return;
      }

      const otpResult =
        await runApiTest(
          baseUrl,
          "Admin OTP verification",
          {
            method:
              "POST",

            pathname:
              "/api/auth/admin-login-otp",

            body: {
              username,

              admin_id:
                adminId,

              otp:
                String(
                  debugOtp
                ),

              secret_key:
                secretKey,
            },

            expectedStatus: [
              200,
            ],

            cookieJar,
          }
        );

      if (
        !otpResult?.passed
      ) {
        return;
      }
    }

    if (
      cookieJar.size() >
      0
    ) {
      addCheck(
        "admin-auth",
        "Admin session cookie",
        "passed",
        `${cookieJar.size()} cookie(s) stored.`
      );
    } else {
      addCheck(
        "admin-auth",
        "Admin session cookie",
        "warning",
        "No admin session cookie was detected."
      );
    }

    await runApiTest(
      baseUrl,
      "GET /api/auth/admin-me",
      {
        pathname:
          "/api/auth/admin-me",

        expectedStatus: [
          200,
        ],

        cookieJar,
      }
    );

    await runApiTest(
      baseUrl,
      "GET /api/admin/dashboard",
      {
        pathname:
          "/api/admin/dashboard",

        expectedStatus: [
          200,
        ],

        cookieJar,
      }
    );

    await runApiTest(
      baseUrl,
      "GET /api/admin/users",
      {
        pathname:
          "/api/admin/users?page=1&limit=1",

        expectedStatus: [
          200,
        ],

        cookieJar,
      }
    );

    await runApiTest(
      baseUrl,
      "GET /api/admin/events",
      {
        pathname:
          "/api/admin/events",

        expectedStatus: [
          200,
        ],

        cookieJar,
      }
    );

    await runApiTest(
      baseUrl,
      "GET /api/admin/backups/summary",
      {
        pathname:
          "/api/admin/backups/summary",

        expectedStatus: [
          200,
        ],

        cookieJar,
      }
    );

    await runApiTest(
      baseUrl,
      "Admin logout",
      {
        method:
          "POST",

        pathname:
          "/api/auth/admin-logout",

        body: {},

        expectedStatus: [
          200,
          204,
        ],

        cookieJar,
      }
    );
  };

/* =========================
   START TEMP SERVER
========================= */

const startTestServer =
  async (
    app
  ) => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const server =
          http.createServer(
            app
          );

        server.once(
          "error",
          reject
        );

        server.listen(
          0,
          "127.0.0.1",
          () => {
            const address =
              server.address();

            resolve({
              server,

              baseUrl:
                `http://127.0.0.1:${address.port}`,
            });
          }
        );
      }
    );
  };

/* =========================
   CLOSE SERVER
========================= */

const closeServer =
  (
    server
  ) => {
    return new Promise(
      (
        resolve
      ) => {
        if (
          !server
        ) {
          return resolve();
        }

        server.close(
          () =>
            resolve()
        );
      }
    );
  };

/* =========================
   SAVE REPORT
========================= */

const saveReport =
  async () => {
    report.completed_at =
      new Date()
        .toISOString();

    report.passed =
      report.summary
        .failed_checks ===
      0;

    await fsPromises.mkdir(
      REPORT_DIRECTORY,
      {
        recursive:
          true,
      }
    );

    await fsPromises.writeFile(
      REPORT_PATH,
      JSON.stringify(
        report,
        null,
        2
      ),
      "utf8"
    );
  };

/* =========================
   PRINT SUMMARY
========================= */

const printSummary =
  () => {
    console.log(
      "\n========================================"
    );

    console.log(
      "INMBA BACKEND VERIFICATION"
    );

    console.log(
      "========================================"
    );

    console.log(
      `Passed : ${report.summary.passed_checks}`
    );

    console.log(
      `Failed : ${report.summary.failed_checks}`
    );

    console.log(
      `Warning: ${report.summary.warning_checks}`
    );

    console.log(
      `Skipped: ${report.summary.skipped_checks}`
    );

    console.log(
      "----------------------------------------"
    );

    console.log(
      report.passed
        ? "RESULT: BACKEND VERIFICATION PASSED"
        : "RESULT: BACKEND VERIFICATION FAILED"
    );

    console.log(
      `Report: ${REPORT_PATH}`
    );

    console.log(
      "========================================\n"
    );

    const failedChecks =
      report.checks.filter(
        (
          check
        ) =>
          check.status ===
          "failed"
      );

    if (
      failedChecks.length >
      0
    ) {
      console.log(
        "FAILED CHECKS:"
      );

      for (
        const check of
          failedChecks
      ) {
        console.log(
          `- [${check.category}] ${check.name}`
        );

        if (
          check.details
        ) {
          console.log(
            JSON.stringify(
              check.details,
              null,
              2
            )
          );
        }
      }

      console.log();
    }
  };

/* =========================
   CLOSE DATABASE POOL
========================= */

const closeDatabasePool =
  async () => {
    try {
      const {
        transactionPool,
      } = require(
        "../src/config/transactionDatabase"
      );

      await transactionPool
        .end();
    } catch {
      /*
        Process exit will close any
        remaining session connections.
      */
    }
  };

/* =========================
   MAIN VERIFICATION
========================= */

const runVerification =
  async () => {
    let server =
      null;

    try {
      if (
        typeof fetch !==
        "function"
      ) {
        addCheck(
          "runtime",
          "Node fetch API",
          "failed",
          "Node.js 18 or newer is required."
        );
      } else {
        addCheck(
          "runtime",
          "Node fetch API",
          "passed",
          process.version
        );
      }

      checkRequiredFiles();

      checkRequiredPackages();

      checkEnvironment();

      const importedModules =
        checkModuleImports();

      const databaseInfo =
        await checkDatabase();

      if (
        databaseInfo
      ) {
        await checkSchema();
      } else {
        addCheck(
          "schema",
          "Schema tests",
          "skipped",
          "Database connection failed."
        );
      }

      const app =
        importedModules
          .Application;

      if (
        app &&
        typeof app ===
          "function"
      ) {
        const serverResult =
          await startTestServer(
            app
          );

        server =
          serverResult.server;

        addCheck(
          "server",
          "Temporary Express server",
          "passed",
          serverResult.baseUrl
        );

        await runPublicApiTests(
          serverResult.baseUrl
        );

        await runMemberAuthTests(
          serverResult.baseUrl
        );

        await runAdminAuthTests(
          serverResult.baseUrl
        );
      } else {
        addCheck(
          "server",
          "Temporary Express server",
          "failed",
          "Express application could not be imported."
        );
      }
    } catch (error) {
      addCheck(
        "verification",
        "Unexpected verification failure",
        "failed",
        getErrorDetails(
          error
        )
      );
    } finally {
      await closeServer(
        server
      );

      await saveReport();

      printSummary();

      await closeDatabasePool();

      process.exit(
        report.passed
          ? 0
          : 1
      );
    }
  };

/* =========================
   RUN
========================= */

runVerification();