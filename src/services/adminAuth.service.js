import axios from "axios";

import api from "../api/api";
import { toText, asObject } from "../utils/commonHelpers";

/* =========================================================
   STORAGE KEYS

   Password / Secret Key / OTP எதுவும்
   browser storage-ல் save செய்யப்படாது.
========================================================= */

const ADMIN_SESSION_CACHE_KEY =
  "inmba_admin_session";

const ADMIN_PENDING_IDENTITY_KEY =
  "inmba_admin_pending_identity";

/* =========================================================
   ROOT ADMIN API

   Used for legacy-compatible root routes:

   POST /admin_login
   GET  /logout
   GET  /admin
========================================================= */

const rootAdminApi =
  axios.create({
    baseURL: "/",

    withCredentials: true,

    timeout: 45000,

    headers: {
      Accept:
        "application/json",
    },
  });

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   TO TEXT
========================================================= */

/* =========================================================
   NORMALIZE ROLE
========================================================= */

export const normalizeAdminRole =
  (
    value
  ) => {
    const role =
      toText(
        value
      )
        .toLowerCase()
        .replace(
          /[\s-]+/g,
          "_"
        );

    if (
      role ===
        "superadmin" ||
      role ===
        "super_admin"
    ) {
      return "super_admin";
    }

    if (
      role ===
      "sub_admin"
    ) {
      return "subadmin";
    }

    if (
      role ===
      "subadmin"
    ) {
      return "subadmin";
    }

    if (
      role ===
      "admin"
    ) {
      return "admin";
    }

    return role;
  };

/* =========================================================
   ADMIN ROLE LABEL
========================================================= */

export const getAdminRoleLabel =
  (
    value
  ) => {
    const role =
      normalizeAdminRole(
        value
      );

    if (
      role ===
      "super_admin"
    ) {
      return "Super Admin";
    }

    if (
      role ===
      "subadmin"
    ) {
      return "Sub Admin";
    }

    if (
      role ===
      "admin"
    ) {
      return "Admin";
    }

    return (
      toText(
        value
      ) ||
      "Administrator"
    );
  };

/* =========================================================
   CHECK HTML RESPONSE
========================================================= */

const isHtmlResponse = (
  value
) => {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  return (
    normalized.startsWith(
      "<!doctype html"
    ) ||
    normalized.startsWith(
      "<html"
    )
  );
};

/* =========================================================
   GET RESPONSE URL
========================================================= */

const getResponseUrl = (
  response
) => {
  return toText(
    response
      ?.request
      ?.responseURL
  ).toLowerCase();
};

/* =========================================================
   NORMALIZE ADMIN
========================================================= */

export const normalizeAdmin =
  (
    admin
  ) => {
    const data =
      asObject(
        admin
      );

    const firstName =
      toText(
        data.first_name
      );

    const lastName =
      toText(
        data.last_name
      );

    const username =
      toText(
        data.username ??
          data.user_name
      );

    const role =
      normalizeAdminRole(
        data.role
      );

    return {
      ...data,

      id:
        data.id ??
        data.admin_id ??
        null,

      username:
        username ||
        firstName ||
        "Administrator",

      first_name:
        firstName,

      last_name:
        lastName,

      name:
        toText(
          data.name,
          [
            firstName,
            lastName,
          ]
            .filter(
              Boolean
            )
            .join(" ")
            .trim()
        ),

      email:
        toText(
          data.email
        ),

      mobile:
        toText(
          data.mobile ??
            data.phone
        ),

      role:
        role ||
        "admin",
    };
  };

/* =========================================================
   EXTRACT ADMIN FROM RESPONSE
========================================================= */

const extractAdmin = (
  responseData
) => {
  const root =
    asObject(
      responseData
    );

  const data =
    asObject(
      root.data
    );

  const rootAdmin =
    asObject(
      root.admin
    );

  const nestedAdmin =
    asObject(
      data.admin
    );

  const user =
    asObject(
      root.user
    );

  const nestedUser =
    asObject(
      data.user
    );

  if (
    Object.keys(
      rootAdmin
    ).length
  ) {
    return normalizeAdmin(
      rootAdmin
    );
  }

  if (
    Object.keys(
      nestedAdmin
    ).length
  ) {
    return normalizeAdmin(
      nestedAdmin
    );
  }

  if (
    Object.keys(
      user
    ).length &&
    (
      user.role ||
      user.username
    )
  ) {
    return normalizeAdmin(
      user
    );
  }

  if (
    Object.keys(
      nestedUser
    ).length &&
    (
      nestedUser.role ||
      nestedUser.username
    )
  ) {
    return normalizeAdmin(
      nestedUser
    );
  }

  if (
    root.role ||
    root.username
  ) {
    return normalizeAdmin(
      root
    );
  }

  if (
    data.role ||
    data.username
  ) {
    return normalizeAdmin(
      data
    );
  }

  return null;
};

/* =========================================================
   RESPONSE SUCCESS
========================================================= */

const isSuccessResponse = (
  data
) => {
  const root =
    asObject(
      data
    );

  if (
    root.success ===
    false
  ) {
    return false;
  }

  if (
    toText(
      root.status
    ).toLowerCase() ===
    "error"
  ) {
    return false;
  }

  return true;
};

/* =========================================================
   NORMALIZE AUTH ERROR
========================================================= */

const normalizeAdminAuthError =
  (
    error,
    fallbackMessage
  ) => {
    const responseData =
      asObject(
        error?.response
          ?.data
      );

    const message =
      toText(
        responseData.message ??
          responseData.error ??
          error?.apiMessage ??
          error?.message,
        fallbackMessage
      );

    error.apiMessage =
      message;

    error.statusCode =
      Number(
        error?.response
          ?.status ||
          error?.statusCode ||
          0
      );

    if (
      error.statusCode ===
      401
    ) {
      error.unauthorized =
        true;
    }

    if (
      error.statusCode ===
      403
    ) {
      error.forbidden =
        true;
    }

    return error;
  };

/* =========================================================
   SESSION STORAGE
========================================================= */

const saveJsonStorage = (
  key,
  value
) => {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify(
        value
      )
    );
  } catch (
    error
  ) {
    console.warn(
      "Admin session cache write failed:",
      error
    );
  }
};

/* =========================================================
   READ JSON STORAGE
========================================================= */

const readJsonStorage = (
  key
) => {
  try {
    const raw =
      sessionStorage.getItem(
        key
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(
        raw
      );

    if (
      parsed &&
      typeof parsed ===
        "object"
    ) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
};

/* =========================================================
   REMOVE STORAGE
========================================================= */

const removeStorage = (
  key
) => {
  try {
    sessionStorage.removeItem(
      key
    );
  } catch {
    /* Ignore cleanup error */
  }
};

/* =========================================================
   SAVE ADMIN SESSION CACHE

   Only non-sensitive identity data.
========================================================= */

const saveAdminSessionCache =
  (
    admin
  ) => {
    const normalized =
      normalizeAdmin(
        admin
      );

    saveJsonStorage(
      ADMIN_SESSION_CACHE_KEY,
      {
        id:
          normalized.id,

        username:
          normalized.username,

        first_name:
          normalized.first_name,

        last_name:
          normalized.last_name,

        name:
          normalized.name,

        email:
          normalized.email,

        mobile:
          normalized.mobile,

        role:
          normalized.role,
      }
    );

    return normalized;
  };

/* =========================================================
   READ ADMIN SESSION CACHE
========================================================= */

const readAdminSessionCache =
  () => {
    const value =
      readJsonStorage(
        ADMIN_SESSION_CACHE_KEY
      );

    if (!value) {
      return null;
    }

    return normalizeAdmin(
      value
    );
  };

/* =========================================================
   SAVE PENDING LOGIN IDENTITY

   Password, Secret Key and OTP are NOT stored.
========================================================= */

const savePendingAdminIdentity =
  ({
    username,
    email,
    role,
  }) => {
    saveJsonStorage(
      ADMIN_PENDING_IDENTITY_KEY,
      {
        username:
          toText(
            username
          ),

        email:
          toText(
            email
          ),

        role:
          normalizeAdminRole(
            role
          ),

        createdAt:
          Date.now(),
      }
    );
  };

/* =========================================================
   READ PENDING IDENTITY
========================================================= */

const readPendingAdminIdentity =
  () => {
    const pending =
      readJsonStorage(
        ADMIN_PENDING_IDENTITY_KEY
      );

    if (!pending) {
      return null;
    }

    /*
      Pending identity-க்கு 10 minute
      client-side lifetime மட்டும்.
    */

    const createdAt =
      Number(
        pending.createdAt ||
          0
      );

    if (
      !createdAt ||
      Date.now() -
        createdAt >
        10 *
          60 *
          1000
    ) {
      removeStorage(
        ADMIN_PENDING_IDENTITY_KEY
      );

      return null;
    }

    return pending;
  };

/* =========================================================
   CLEAR ADMIN CLIENT STATE
========================================================= */

const clearAdminClientState =
  () => {
    removeStorage(
      ADMIN_SESSION_CACHE_KEY
    );

    removeStorage(
      ADMIN_PENDING_IDENTITY_KEY
    );

    /*
      AdminLogin.jsx Step 48.8
      pending OTP key.
    */

    removeStorage(
      "inmba_admin_pending_login"
    );
  };

/* =========================================================
   ROUTE #37
   ADMIN SIGNUP

   POST /api/auth/admin-signup

   Exact source fields:

   first_name
   last_name
   username
   email
   mobile
   role
   password
   confirm_password

   Optional super admin fields:

   super_token
   super_key
========================================================= */

export const signupAdmin =
  async ({
    firstName,
    lastName,
    first_name,
    last_name,
    username,
    email,
    mobile,
    role = "admin",
    password,
    confirmPassword,
    confirm_password,
    superToken = "",
    super_token = "",
    superKey = "",
    super_key = "",
  }) => {
    const payload = {
      first_name:
        toText(
          first_name ??
            firstName
        ),

      last_name:
        toText(
          last_name ??
            lastName
        ),

      username:
        toText(
          username
        ),

      email:
        toText(
          email
        ),

      mobile:
        toText(
          mobile
        ),

      role:
        normalizeAdminRole(
          role
        ) ||
        "admin",

      password:
        String(
          password ??
            ""
        ),

      confirm_password:
        String(
          confirm_password ??
            confirmPassword ??
            ""
        ),
    };

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      !payload.first_name ||
      !payload.last_name ||
      !payload.username ||
      !payload.email ||
      !payload.mobile
    ) {
      throw new Error(
        "All admin account details are required."
      );
    }

    if (
      payload.password.length <
      8
    ) {
      throw new Error(
        "Password must be at least 8 characters."
      );
    }

    if (
      payload.password !==
      payload.confirm_password
    ) {
      throw new Error(
        "Passwords do not match."
      );
    }

    /* =====================================================
       OPTIONAL SUPER ADMIN SECURITY
    ===================================================== */

    const safeSuperToken =
      toText(
        super_token ??
          superToken
      );

    const safeSuperKey =
      toText(
        super_key ??
          superKey
      );

    if (
      safeSuperToken
    ) {
      payload.super_token =
        safeSuperToken;
    }

    if (
      safeSuperKey
    ) {
      payload.super_key =
        safeSuperKey;
    }

    try {
      const response =
        await api.post(
          "/auth/admin-signup",
          payload
        );

      const data =
        asObject(
          response.data
        );

      if (
        !isSuccessResponse(
          data
        )
      ) {
        const requestError =
          new Error(
            toText(
              data.message ??
                data.error,
              "Unable to create admin account."
            )
          );

        requestError.response =
          response;

        throw requestError;
      }

      return {
        success:
          true,

        message:
          toText(
            data.message,
            "Admin account created successfully."
          ),

        admin:
          extractAdmin(
            data
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeAdminAuthError(
        error,
        "Unable to create admin account."
      );
    }
  };

/* =========================================================
   ROUTE #38
   ADMIN LOGIN VERIFY API

   POST /api/auth/admin-login-verify

   Source:

   username
   password

   Super Admin:
   super_key

   This function is retained so the exact
   API route is fully represented in React.

   Canonical AdminLogin page currently uses
   /admin_login through loginAdmin().
========================================================= */

export const verifyAdminCredentials =
  async ({
    username,
    password,
    role = "admin",
    superKey = "",
    super_key = "",
  }) => {
    const safeUsername =
      toText(
        username
      );

    const safePassword =
      String(
        password ??
          ""
      );

    const safeRole =
      normalizeAdminRole(
        role
      ) ||
      "admin";

    if (
      !safeUsername ||
      !safePassword
    ) {
      throw new Error(
        "Username and password are required."
      );
    }

    const payload = {
      username:
        safeUsername,

      password:
        safePassword,
    };

    if (
      safeRole ===
      "super_admin"
    ) {
      payload.super_key =
        toText(
          super_key ??
            superKey
        );
    }

    try {
      const response =
        await api.post(
          "/auth/admin-login-verify",
          payload
        );

      const data =
        asObject(
          response.data
        );

      if (
        !isSuccessResponse(
          data
        )
      ) {
        const loginError =
          new Error(
            toText(
              data.message ??
                data.error,
              "Admin credential verification failed."
            )
          );

        loginError.response =
          response;

        throw loginError;
      }

      const admin =
        extractAdmin(
          data
        );

      /* ===================================================
         SUPER ADMIN API LOGIN SUCCESS
      =================================================== */

      if (
        safeRole ===
        "super_admin"
      ) {
        saveAdminSessionCache(
          admin || {
            username:
              safeUsername,

            role:
              "super_admin",
          }
        );
      } else {
        savePendingAdminIdentity({
          username:
            safeUsername,

          email:
            "",

          role:
            safeRole,
        });
      }

      return {
        success:
          true,

        message:
          toText(
            data.message,
            safeRole ===
              "super_admin"
              ? "Admin login successful."
              : "OTP generated successfully."
          ),

        admin,

        otpRequired:
          safeRole !==
          "super_admin",

        requiresOtp:
          safeRole !==
          "super_admin",

        redirect:
          toText(
            data.redirect ??
              data.redirectTo ??
              data.data
                ?.redirect ??
              data.data
                ?.redirectTo
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeAdminAuthError(
        error,
        "Admin credential verification failed."
      );
    }
  };

/* =========================================================
   ROUTE #62
   CANONICAL ADMIN LOGIN

   POST /admin_login

   Super Admin:

   role
   username
   password
   secret_key

   Admin/Subadmin:

   role
   username
   password
   email

   This is the function used by AdminLogin.jsx.
========================================================= */

export const loginAdmin =
  async ({
    role = "super_admin",
    username,
    password,
    email = "",
    secret_key = "",
    secretKey = "",
  }) => {
    const safeRole =
      normalizeAdminRole(
        role
      ) ||
      "super_admin";

    const safeUsername =
      toText(
        username
      );

    const safePassword =
      String(
        password ??
          ""
      );

    const safeEmail =
      toText(
        email
      );

    const safeSecretKey =
      toText(
        secret_key ??
          secretKey
      );

    /* =====================================================
       ROLE
    ===================================================== */

    if (
      ![
        "super_admin",
        "admin",
        "subadmin",
      ].includes(
        safeRole
      )
    ) {
      throw new Error(
        "Invalid admin role."
      );
    }

    /* =====================================================
       USERNAME / PASSWORD
    ===================================================== */

    if (
      !safeUsername
    ) {
      throw new Error(
        "Username is required."
      );
    }

    if (
      !safePassword
    ) {
      throw new Error(
        "Password is required."
      );
    }

    /* =====================================================
       SUPER ADMIN
    ===================================================== */

    if (
      safeRole ===
        "super_admin" &&
      !safeSecretKey
    ) {
      throw new Error(
        "Super Admin secret key is required."
      );
    }

    /* =====================================================
       ADMIN / SUBADMIN
    ===================================================== */

    if (
      (
        safeRole ===
          "admin" ||
        safeRole ===
          "subadmin"
      ) &&
      !safeEmail
    ) {
      throw new Error(
        "Registered email is required."
      );
    }

    /* =====================================================
       PAYLOAD
    ===================================================== */

    const payload = {
      role:
        safeRole,

      username:
        safeUsername,

      password:
        safePassword,
    };

    if (
      safeRole ===
      "super_admin"
    ) {
      payload.secret_key =
        safeSecretKey;
    } else {
      payload.email =
        safeEmail;
    }

    try {
      const response =
        await rootAdminApi.post(
          "/admin_login",
          payload,
          {
            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              "X-Requested-With":
                "XMLHttpRequest",
            },
          }
        );

      /* ===================================================
         HTML SHOULD NOT BE SUCCESS FOR POST LOGIN
      =================================================== */

      if (
        isHtmlResponse(
          response.data
        )
      ) {
        const loginError =
          new Error(
            "Admin login endpoint returned HTML instead of JSON."
          );

        loginError.response =
          response;

        throw loginError;
      }

      const data =
        asObject(
          response.data
        );

      if (
        !isSuccessResponse(
          data
        )
      ) {
        const loginError =
          new Error(
            toText(
              data.message ??
                data.error,
              "Admin login failed."
            )
          );

        loginError.response =
          response;

        throw loginError;
      }

      /* ===================================================
         SUPER ADMIN SESSION READY
      =================================================== */

      if (
        safeRole ===
        "super_admin"
      ) {
        removeStorage(
          ADMIN_PENDING_IDENTITY_KEY
        );

        const admin =
          saveAdminSessionCache({
            ...extractAdmin(
              data
            ),

            username:
              extractAdmin(
                data
              )?.username ||
              safeUsername,

            role:
              "super_admin",
          });

        return {
          success:
            true,

          authenticated:
            true,

          otpRequired:
            false,

          requiresOtp:
            false,

          admin,

          message:
            toText(
              data.message,
              "Admin login successful."
            ),

          redirect:
            toText(
              data.redirect ??
                data.redirectTo ??
                data.data
                  ?.redirect ??
                data.data
                  ?.redirectTo,
              "/admin"
            ),

          raw:
            response.data,
        };
      }

      /* ===================================================
         ADMIN / SUBADMIN OTP REQUIRED
      =================================================== */

      savePendingAdminIdentity({
        username:
          safeUsername,

        email:
          safeEmail,

        role:
          safeRole,
      });

      return {
        success:
          true,

        authenticated:
          false,

        otpRequired:
          true,

        requiresOtp:
          true,

        role:
          safeRole,

        username:
          safeUsername,

        email:
          safeEmail,

        message:
          toText(
            data.message,
            "OTP sent to registered email."
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeAdminAuthError(
        error,
        "Admin login failed."
      );
    }
  };

/* =========================================================
   ROUTE #39
   VERIFY ADMIN LOGIN OTP

   POST /api/auth/admin-login-otp

   Exact body:

   {
     email,
     otp
   }

   Successful backend flow:

   clear OTP
   clear expiry
   create session["admin"]
========================================================= */

export const verifyAdminLoginOtp =
  async ({
    email,
    otp,
  }) => {
    const safeEmail =
      toText(
        email
      );

    const safeOtp =
      toText(
        otp
      )
        .replace(
          /\D/g,
          ""
        )
        .slice(
          0,
          6
        );

    if (
      !safeEmail
    ) {
      throw new Error(
        "Admin email is required."
      );
    }

    if (
      safeOtp.length !==
      6
    ) {
      throw new Error(
        "Enter the complete 6-digit OTP."
      );
    }

    try {
      const response =
        await api.post(
          "/auth/admin-login-otp",
          {
            email:
              safeEmail,

            otp:
              safeOtp,
          }
        );

      const data =
        asObject(
          response.data
        );

      if (
        !isSuccessResponse(
          data
        )
      ) {
        const otpError =
          new Error(
            toText(
              data.message ??
                data.error,
              "Invalid or expired OTP."
            )
          );

        otpError.response =
          response;

        throw otpError;
      }

      /* ===================================================
         PENDING LOGIN IDENTITY
      =================================================== */

      const pending =
        readPendingAdminIdentity();

      const responseAdmin =
        extractAdmin(
          data
        );

      const admin =
        saveAdminSessionCache({
          ...(responseAdmin ||
            {}),

          username:
            responseAdmin
              ?.username ||
            pending?.username ||
            "Administrator",

          email:
            responseAdmin
              ?.email ||
            pending?.email ||
            safeEmail,

          role:
            responseAdmin
              ?.role ||
            pending?.role ||
            "admin",
        });

      removeStorage(
        ADMIN_PENDING_IDENTITY_KEY
      );

      removeStorage(
        "inmba_admin_pending_login"
      );

      return {
        success:
          true,

        authenticated:
          true,

        admin,

        message:
          toText(
            data.message,
            "OTP verified successfully."
          ),

        redirect:
          toText(
            data.redirect ??
              data.redirectTo ??
              data.data
                ?.redirect ??
              data.data
                ?.redirectTo,
            "/admin"
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeAdminAuthError(
        error,
        "Invalid or expired OTP."
      );
    }
  };

/* =========================================================
   CHECK ADMIN SERVER SESSION

   Primary check:
   GET /api/admin/users

   Reason:
   this endpoint requires an active admin session.

   200 → admin session valid
   401 → admin session invalid

   Cached identity gives frontend role/username.
========================================================= */

export const getAdminSession =
  async () => {
    const cachedAdmin =
      readAdminSessionCache();

    try {
      const response =
        await api.get(
          "/admin/users",
          {
            params: {
              _session_check:
                Date.now(),
            },

            headers: {
              Accept:
                "application/json",
            },
          }
        );

      /*
        Endpoint success means backend admin
        session is active.

        We intentionally do not use member
        list data here.
      */

      const responseAdmin =
        extractAdmin(
          response.data
        );

      const admin =
        responseAdmin ||
        cachedAdmin ||
        normalizeAdmin({
          username:
            "Administrator",

          /*
            Unknown role fallback is regular
            Admin because it is the safest
            frontend permission level.
          */

          role:
            "admin",
        });

      if (
        responseAdmin
      ) {
        saveAdminSessionCache(
          responseAdmin
        );
      }

      return {
        success:
          true,

        authenticated:
          true,

        admin,

        data: {
          authenticated:
            true,

          admin,
        },

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      const normalizedError =
        normalizeAdminAuthError(
          error,
          "Admin session is not active."
        );

      if (
        normalizedError
          .statusCode ===
        401
      ) {
        clearAdminClientState();

        return {
          success:
            false,

          authenticated:
            false,

          admin:
            null,

          data: {
            authenticated:
              false,

            admin:
              null,
          },
        };
      }

      throw normalizedError;
    }
  };

/* =========================================================
   ADMIN SESSION QUICK CHECK
========================================================= */

export const isAdminAuthenticated =
  async () => {
    try {
      const result =
        await getAdminSession();

      return Boolean(
        result
          ?.authenticated
      );
    } catch {
      return false;
    }
  };

/* =========================================================
   ADMIN LOGOUT

   Legacy exact route:

   GET /logout

   Old backend clears complete session and
   redirects admin users to /admin_login.

   New backend may return JSON or redirect HTML.
   Both are accepted because client cleanup is
   always performed in finally.
========================================================= */

export const logoutAdmin =
  async () => {
    try {
      const response =
        await rootAdminApi.get(
          "/logout",
          {
            headers: {
              Accept:
                "application/json, text/html",

              "X-Requested-With":
                "XMLHttpRequest",
            },
          }
        );

      const responseUrl =
        getResponseUrl(
          response
        );

      if (
        isHtmlResponse(
          response.data
        )
      ) {
        return {
          success:
            true,

          message:
            "Admin logged out successfully.",

          redirect:
            responseUrl.includes(
              "/admin_login"
            )
              ? "/admin_login"
              : "/admin_login",

          raw:
            response.data,
        };
      }

      const data =
        asObject(
          response.data
        );

      return {
        success:
          data.success !==
          false,

        message:
          toText(
            data.message,
            "Admin logged out successfully."
          ),

        redirect:
          toText(
            data.redirect ??
              data.redirectTo ??
              data.data
                ?.redirect ??
              data.data
                ?.redirectTo,
            "/admin_login"
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      /*
        Logout server request fail ஆனாலும்
        frontend cache clear பண்ண வேண்டும்.

        AdminHeader login page-க்கு
        redirect பண்ணும்.
      */

      return {
        success:
          false,

        message:
          toText(
            error
              ?.response
              ?.data
              ?.message ??
              error?.message,
            "Admin logout completed locally."
          ),

        error,
      };
    } finally {
      clearAdminClientState();
    }
  };

/* =========================================================
   CLEAR ADMIN AUTH CACHE

   Manual helper.
========================================================= */

export const clearAdminAuthCache =
  () => {
    clearAdminClientState();
  };

/* =========================================================
   COMPATIBILITY EXPORTS
========================================================= */

export const adminSignup =
  signupAdmin;

export const adminLoginVerify =
  verifyAdminCredentials;

export const adminLogin =
  loginAdmin;

export const adminLoginOtp =
  verifyAdminLoginOtp;

export const fetchAdminSession =
  getAdminSession;

export const adminLogout =
  logoutAdmin;

/* =========================================================
   DEFAULT EXPORT
========================================================= */

const adminAuthService = {
  /* SIGNUP */

  signupAdmin,
  adminSignup,

  /* LOGIN */

  loginAdmin,
  adminLogin,

  verifyAdminCredentials,
  adminLoginVerify,

  verifyAdminLoginOtp,
  adminLoginOtp,

  /* SESSION */

  getAdminSession,
  fetchAdminSession,

  isAdminAuthenticated,

  /* LOGOUT */

  logoutAdmin,
  adminLogout,

  clearAdminAuthCache,

  /* HELPERS */

  normalizeAdminRole,
  normalizeAdmin,

  getAdminRoleLabel,
};

export default adminAuthService;