const express =
  require(
    "express"
  );

const cors =
  require(
    "cors"
  );

const helmet =
  require(
    "helmet"
  );

const morgan =
  require(
    "morgan"
  );

const compression =
  require(
    "compression"
  );

const ApiError =
  require(
    "./utils/apiError"
  );

const apiRoutes =
  require(
    "./routes"
  );

const legacyPageRoutes =
  require(
    "./routes/legacyPage.routes"
  );

const registrationRoutes =
  require(
    "./routes/registration.routes"
  );

const {
  legacyAuthRoutes,
} = require(
  "./routes/auth.routes"
);

const professionalKycRoutes =
  require(
    "./routes/professionalKyc.routes"
  );

/* =========================================================
   COMMERCIAL KYC ROUTES
========================================================= */

const commercialBasicKycRoutes =
  require("./routes/commercialBasicKyc.routes");

const commercialMembershipRoutes =
  require("./routes/commercialMembership.routes");
const commercialKycRoutes =
  require(
    "./routes/commercialKyc.routes"
  );
const {
  commercialProfileVisibilityRoutes,
} = require(
  "./routes/commercialProfileVisibility.routes"
);
/* =========================================================
   PROFESSIONAL OWNER PROFILE
========================================================= */

const professionalOwnerProfileRoutes =
  require(
    "./routes/professionalOwnerProfile.routes"
  );

/* =========================================================
   CIVILIAN OWNER PROFILE
========================================================= */

const civilianOwnerProfileRoutes =
  require(
    "./routes/civilianOwnerProfile.routes"
  );

const {
  legacyPasswordResetRoutes,
} = require(
  "./routes/passwordReset.routes"
);

const {
  legacyDashboardRoutes,
} = require(
  "./routes/dashboard.routes"
);

const {
  legacyProfileRoutes,
} = require(
  "./routes/profile.routes"
);

const {
  legacyPaymentRoutes,
} = require(
  "./routes/payment.routes"
);

const {
  legacyBankPanRoutes,
} = require(
  "./routes/bankPan.routes"
);

const {
  legacyLegalEntityRoutes,
} = require(
  "./routes/legalEntity.routes"
);

const {
  legacySignatureRoutes,
} = require(
  "./routes/signature.routes"
);

const {
  legacyAcknowledgementRoutes,
} = require(
  "./routes/acknowledgement.routes"
);

const {
  legacyQrCodeRoutes,
} = require(
  "./routes/qrCode.routes"
);

const {
  legacyNetworkRoutes,
} = require(
  "./routes/network.routes"
);

const {
  legacyAdminAuthRoutes,
} = require(
  "./routes/adminAuth.routes"
);

const {
  legacyAdminMemberRoutes,
} = require(
  "./routes/adminMember.routes"
);

const {
  legacyAdminMemberActionRoutes,
} = require(
  "./routes/adminMemberAction.routes"
);

const {
  legacyBackupRoutes,
} = require(
  "./routes/backup.routes"
);

const {
  legacyDownloadRoutes,
} = require(
  "./routes/download.routes"
);

const {
  legacyPolicyRoutes,
} = require(
  "./routes/policy.routes"
);

const {
  legacyProfileCompletionRoutes,
} = require(
  "./routes/profileCompletion.routes"
);

const {
  sessionMiddleware,
} = require(
  "./config/session"
);

const {
  UPLOAD_ROOT,
  UPLOAD_PUBLIC_PATH,
} = require(
  "./services/fileStorage.service"
);
const commercialRegistrationRoutes =
  require(
    "./routes/commercialRegistration.routes"
  );

  const civilianKycRoutes =
  require(
    "./routes/civilianKyc.routes"
  );

const {
  requestIdMiddleware,
  originProtectionMiddleware,
  validateMutationContentType,
  sensitiveNoStoreMiddleware,
} = require(
  "./middleware/requestSecurity.middleware"
);

const {
  securityAuditMiddleware,
} = require(
  "./middleware/securityAudit.middleware"
);

const {
  globalApiLimiter,
  registrationLimiter,
  memberLoginLimiter,
  adminLoginLimiter,
  passwordResetLimiter,
  otpLimiter,
  adminMutationLimiter,
  backupLimiter,
} = require(
  "./middleware/rateLimit.middleware"
);

const notFoundHandler =
  require(
    "./middleware/notFound.middleware"
  );

const errorHandler =
  require(
    "./middleware/error.middleware"
  );

/* =========================================================
   EXPRESS APP
========================================================= */

const app =
  express();

app.disable(
  "x-powered-by"
);

/* =========================================================
   PRODUCTION PROXY
========================================================= */

if (
  process.env.NODE_ENV ===
  "production"
) {
  app.set(
    "trust proxy",
    1
  );
}

/* =========================================================
   REQUEST ID
========================================================= */

app.use(
  requestIdMiddleware
);

/* =========================================================
   CORS ORIGINS
========================================================= */

const allowedOrigins =
  String(
    process.env.CORS_ORIGINS ||
      ""
  )
    .split(
      ","
    )
    .map(
      (
        origin
      ) =>
        origin.trim()
    )
    .filter(
      Boolean
    );

/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin(
      origin,
      callback
    ) {
      if (
        !origin
      ) {
        return callback(
          null,
          true
        );
      }

      if (
        allowedOrigins.includes(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      return callback(
        new ApiError(
          403,
          `CORS blocked for origin: ${origin}`
        )
      );
    },

    credentials:
      true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

allowedHeaders: [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "X-Request-ID",
  "X-CSRF-Token",
  "Cache-Control",
  "Pragma",
],
    exposedHeaders: [
      "X-Request-ID",
      "RateLimit-Limit",
      "RateLimit-Remaining",
      "RateLimit-Reset",
      "Retry-After",
    ],

    optionsSuccessStatus:
      204,
  })
);

/* =========================================================
   SECURITY HEADERS
========================================================= */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy:
        "cross-origin",
    },

    hsts:
      process.env.NODE_ENV ===
      "production"
        ? {
            maxAge:
              31536000,

            includeSubDomains:
              true,

            preload:
              true,
          }
        : false,
  })
);

/* =========================================================
   COMPRESSION
========================================================= */

app.use(
  compression()
);

/* =========================================================
   LOGGER
========================================================= */

app.use(
  morgan(
    "dev"
  )
);

/* =========================================================
   SENSITIVE CACHE HEADERS
========================================================= */

app.use(
  sensitiveNoStoreMiddleware
);

/* =========================================================
   GLOBAL API RATE LIMIT
========================================================= */

app.use(
  "/api",
  globalApiLimiter
);

/* =========================================================
   REGISTRATION RATE LIMIT
========================================================= */

/* =========================================================
   REGISTRATION RATE LIMIT
========================================================= */

app.use(
  [
    "/api/register",
    "/register",

    "/api/student",
    "/student",

    "/api/commercial-register",
  ],

  registrationLimiter
);

/* =========================================================
   MEMBER LOGIN RATE LIMIT
========================================================= */

app.use(
  [
    "/api/login",
    "/login",
  ],

  memberLoginLimiter
);

/* =========================================================
   PASSWORD RESET RATE LIMIT
========================================================= */

app.use(
  [
    "/api/forgot-password",
    "/forgot_password",

    "/api/reset-password",
    "/reset_password",
  ],

  passwordResetLimiter
);
const commercialDashboardRoutes =
  require("./routes/commercialDashboard.routes");
/* =========================================================
   OTP RATE LIMIT
========================================================= */

app.use(
  [
    "/api/verify-otp",
    "/verify_otp",

    "/api/auth/admin-login-otp",

    "/api/admin/request-user-otp",

    "/api/admin/verify-user-otp",
  ],

  otpLimiter
);

/* =========================================================
   ADMIN LOGIN RATE LIMIT
========================================================= */

app.use(
  [
    "/api/auth/admin-login-verify",

    "/api/auth/admin-login-otp",

    "/admin_login",
  ],

  adminLoginLimiter
);

/* =========================================================
   ADMIN MUTATION RATE LIMIT
========================================================= */

app.use(
  [
    "/api/admin",

    "/admin_verify",

    "/soft_delete",

    "/restore_user",

    "/permanent_delete",
  ],

  adminMutationLimiter
);

/* =========================================================
   BACKUP RATE LIMIT
========================================================= */

app.use(
  [
    "/api/admin/backups/all-users",

    "/backup_all_users",
  ],

  backupLimiter
);

/* =========================================================
   ORIGIN / CSRF PROTECTION
========================================================= */

app.use(
  originProtectionMiddleware
);

/* =========================================================
   MUTATION CONTENT TYPE
========================================================= */

app.use(
  validateMutationContentType
);

/* =========================================================
   JSON BODY
========================================================= */

app.use(
  express.json({
    limit:
      "10mb",
  })
);

/* =========================================================
   URL ENCODED BODY
========================================================= */

app.use(
  express.urlencoded({
    extended:
      true,

    limit:
      "10mb",
  })
);

/* =========================================================
   MYSQL SESSION
========================================================= */

app.use(
  sessionMiddleware
);

/* =========================================================
   SECURITY AUDIT
========================================================= */

app.use(
  securityAuditMiddleware
);

/* =========================================================
   PROFESSIONAL KYC
========================================================= */

app.use(
  "/api/professional-kyc",

  professionalKycRoutes
);

/* =========================================================
   COMMERCIAL BASIC KYC
========================================================= */

app.use(
  "/api/commercial-basic-kyc",

  commercialBasicKycRoutes
);
/* =========================================================
   COMMERCIAL REGISTRATION
========================================================= */

app.use(
  "/api/commercial-register",
  commercialRegistrationRoutes
);
app.use(
  "/api/commercial-membership",
  commercialMembershipRoutes
);
app.use(
  "/api",
  commercialProfileVisibilityRoutes
);
/* =========================================================
   COMMERCIAL FULL KYC
========================================================= */

app.use(
  "/api/commercial-kyc",

  commercialKycRoutes
);


/* =========================================================
   CIVILIAN FULL KYC
========================================================= */

app.use(
  "/api/civilian-kyc",
  civilianKycRoutes
);
/* =========================================================
   PROFESSIONAL OWNER FULL PROFILE
========================================================= */

app.use(
  "/api/me",

  professionalOwnerProfileRoutes
);

/* =========================================================
   CIVILIAN OWNER FULL PROFILE

   FINAL:
   GET /api/me/civilian-profile
========================================================= */

app.use(
  "/api/me",

  civilianOwnerProfileRoutes
);

/* =========================================================
   STATIC UPLOAD FILES
========================================================= */

app.use(
  UPLOAD_PUBLIC_PATH,

  express.static(
    UPLOAD_ROOT,
    {
      dotfiles:
        "deny",

      index:
        false,

      fallthrough:
        true,

      maxAge:
        process.env
          .NODE_ENV ===
        "production"
          ? "1d"
          : 0,
    }
  )
);

/* =========================================================
   LEGACY PUBLIC PAGES
========================================================= */

app.use(
  "/",
  legacyPageRoutes
);

/* =========================================================
   LEGACY POLICY
========================================================= */

app.use(
  "/",
  legacyPolicyRoutes
);
app.use(
  "/api/commercial-dashboard",
  commercialDashboardRoutes
);
/* =========================================================
   LEGACY REGISTRATION
========================================================= */

app.use(
  "/",
  registrationRoutes
);

/* =========================================================
   LEGACY MEMBER AUTH
========================================================= */

app.use(
  "/",
  legacyAuthRoutes
);

/* =========================================================
   LEGACY PASSWORD RESET
========================================================= */

app.use(
  "/",
  legacyPasswordResetRoutes
);

/* =========================================================
   LEGACY DASHBOARD
========================================================= */

app.use(
  "/",
  legacyDashboardRoutes
);

/* =========================================================
   LEGACY PROFILE
========================================================= */

app.use(
  "/",
  legacyProfileRoutes
);

/* =========================================================
   LEGACY PAYMENT
========================================================= */

app.use(
  "/",
  legacyPaymentRoutes
);

/* =========================================================
   LEGACY BANK / PAN
========================================================= */

app.use(
  "/",
  legacyBankPanRoutes
);

/* =========================================================
   LEGACY LEGAL ENTITY
========================================================= */

app.use(
  "/",
  legacyLegalEntityRoutes
);

/* =========================================================
   LEGACY SIGNATURE
========================================================= */

app.use(
  "/",
  legacySignatureRoutes
);

/* =========================================================
   LEGACY PROFILE COMPLETION
========================================================= */

app.use(
  "/",
  legacyProfileCompletionRoutes
);

/* =========================================================
   LEGACY ACKNOWLEDGEMENT
========================================================= */

app.use(
  "/",
  legacyAcknowledgementRoutes
);

/* =========================================================
   LEGACY QR
========================================================= */

app.use(
  "/",
  legacyQrCodeRoutes
);

/* =========================================================
   LEGACY DOWNLOAD
========================================================= */

app.use(
  "/",
  legacyDownloadRoutes
);

/* =========================================================
   LEGACY NETWORK
========================================================= */

app.use(
  "/",
  legacyNetworkRoutes
);

/* =========================================================
   LEGACY ADMIN AUTH
========================================================= */

app.use(
  "/",
  legacyAdminAuthRoutes
);

/* =========================================================
   LEGACY ADMIN MEMBER
========================================================= */

app.use(
  "/",
  legacyAdminMemberRoutes
);

/* =========================================================
   LEGACY ADMIN ACTIONS
========================================================= */

app.use(
  "/",
  legacyAdminMemberActionRoutes
);

/* =========================================================
   LEGACY BACKUPS
========================================================= */

app.use(
  "/",
  legacyBackupRoutes
);

/* =========================================================
   MAIN API ROUTES
========================================================= */

app.use(
  "/api",

  apiRoutes
);

/* =========================================================
   404
========================================================= */

app.use(
  notFoundHandler
);

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  errorHandler
);

/* =========================================================
   EXPORT
========================================================= */

module.exports =
  app;