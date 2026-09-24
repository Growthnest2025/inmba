import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  loginAdmin,
  verifyAdminLoginOtp,
} from "../../../services/adminAuth.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./AdminLogin.css";

/* =========================================================
   PENDING OTP STORAGE

   Password / secret key store பண்ண மாட்டோம்.
========================================================= */

const ADMIN_PENDING_LOGIN_KEY =
  "inmba_admin_pending_login";

/* =========================================================
   ADMIN ROLES
========================================================= */

const ADMIN_ROLES = [
  {
    value:
      "super_admin",

    label:
      "Super Admin",

    icon:
      "fas fa-crown",

    description:
      "Full administrative access",
  },

  {
    value:
      "admin",

    label:
      "Admin",

    icon:
      "fas fa-user-shield",

    description:
      "Administrative member management",
  },

  {
    value:
      "subadmin",

    label:
      "Sub Admin",

    icon:
      "fas fa-user-lock",

    description:
      "OTP protected administrative access",
  },
];

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM = {
  role:
    "super_admin",

  username:
    "",

  password:
    "",

  email:
    "",

  secret_key:
    "",
};

/* =========================================================
   HELPERS
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const normalized =
    String(
      value ?? ""
    ).trim();

  return (
    normalized ||
    fallback
  );
};

/* =========================================================
   SAFE ADMIN REDIRECT

   External URL redirect block பண்ணுறோம்.
========================================================= */

const getSafeAdminRedirect = (
  value
) => {
  const path =
    toText(
      value
    );

  if (!path) {
    return "/admin";
  }

  /* ========================================
     BLOCK EXTERNAL URL
  ======================================== */

  if (
    path.startsWith(
      "http://"
    ) ||
    path.startsWith(
      "https://"
    ) ||
    path.startsWith(
      "//"
    )
  ) {
    return "/admin";
  }

  /* ========================================
     MAIN ADMIN
  ======================================== */

  if (
    path ===
      "/admin" ||
    path.startsWith(
      "/admin?"
    ) ||
    path.startsWith(
      "/admin/"
    )
  ) {
    return path;
  }

  /* ========================================
     DELETED USERS
  ======================================== */

  if (
    path ===
      "/deleted_users" ||
    path.startsWith(
      "/deleted_users?"
    )
  ) {
    return path;
  }

  /* ========================================
     DELETED USERS BACKUP
  ======================================== */

  if (
    path ===
      "/deleted_users_backup" ||
    path.startsWith(
      "/deleted_users_backup?"
    )
  ) {
    return path;
  }

  /* ========================================
     ALL USERS BACKUP
  ======================================== */

  if (
    path ===
      "/all_users_backup" ||
    path.startsWith(
      "/all_users_backup?"
    )
  ) {
    return path;
  }

  return "/admin";
};

/* =========================================================
   SAVE PENDING LOGIN

   Important:
   password / secret_key sessionStorage-ல்
   save பண்ண மாட்டோம்.
========================================================= */

const savePendingLogin = ({
  role,
  username,
  email,
  expiresAt,
}) => {
  try {
    sessionStorage.setItem(
      ADMIN_PENDING_LOGIN_KEY,
      JSON.stringify({
        role:
          toText(
            role
          ),

        username:
          toText(
            username
          ),

        email:
          toText(
            email
          ),

        expiresAt:
          Number(
            expiresAt ||
              Date.now() +
                5 *
                  60 *
                  1000
          ),
      })
    );
  } catch (
    error
  ) {
    console.warn(
      "Unable to save pending admin login:",
      error
    );
  }
};

/* =========================================================
   READ PENDING LOGIN
========================================================= */

const readPendingLogin =
  () => {
    try {
      const rawValue =
        sessionStorage.getItem(
          ADMIN_PENDING_LOGIN_KEY
        );

      if (!rawValue) {
        return null;
      }

      const parsed =
        JSON.parse(
          rawValue
        );

      if (
        !parsed ||
        typeof parsed !==
          "object"
      ) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  };

/* =========================================================
   CLEAR PENDING LOGIN
========================================================= */

const clearPendingLogin =
  () => {
    try {
      sessionStorage.removeItem(
        ADMIN_PENDING_LOGIN_KEY
      );
    } catch {
      // Ignore storage cleanup error.
    }
  };

/* =========================================================
   CHECK OTP REQUIRED RESPONSE
========================================================= */

const isOtpRequiredResponse = (
  result,
  role
) => {
  if (
    role ===
    "super_admin"
  ) {
    return false;
  }

  if (
    result?.otpRequired ===
      true ||
    result?.requiresOtp ===
      true ||
    result?.requiresOTP ===
      true ||
    result?.pendingOtp ===
      true ||
    result?.data
      ?.otpRequired ===
      true ||
    result?.data
      ?.requiresOtp ===
      true ||
    result?.data
      ?.requiresOTP ===
      true
  ) {
    return true;
  }

  /*
    Existing Admin/Subadmin flow:
    credentials verify ஆன பிறகு OTP flow.

    Service response explicit flag இல்லாத
    implementation இருந்தாலும் OTP screen
    continue ஆக வேண்டும்.
  */

  return (
    role ===
      "admin" ||
    role ===
      "subadmin"
  );
};

/* =========================================================
   ADMIN LOGIN
========================================================= */

export default function AdminLogin() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  /* =======================================================
     REDIRECT TARGET

     Example:

     /admin?status=pending
     /deleted_users
     /admin/member/5/edit
  ======================================================= */

  const redirectTarget =
    useMemo(
      () =>
        getSafeAdminRedirect(
          location.state
            ?.from
        ),
      [
        location.state,
      ]
    );

  /* =======================================================
     FORM
  ======================================================= */

  const [
    formData,
    setFormData,
  ] =
    useState(
      INITIAL_FORM
    );

  const [
    formError,
    setFormError,
  ] =
    useState(
      toText(
        location.state
          ?.error
      )
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    showSecretKey,
    setShowSecretKey,
  ] =
    useState(false);

  /* =======================================================
     OTP
  ======================================================= */

  const [
    otpMode,
    setOtpMode,
  ] =
    useState(false);

  const [
    otp,
    setOtp,
  ] =
    useState("");

  const [
    verifyingOtp,
    setVerifyingOtp,
  ] =
    useState(false);

  const [
    secondsLeft,
    setSecondsLeft,
  ] =
    useState(0);

  const [
    otpEmail,
    setOtpEmail,
  ] =
    useState("");

  /* =======================================================
     RESTORE PENDING OTP STATE
  ======================================================= */

  useEffect(
    () => {
      const pending =
        readPendingLogin();

      if (!pending) {
        return;
      }

      const expiresAt =
        Number(
          pending.expiresAt ||
            0
        );

      const remaining =
        Math.floor(
          (
            expiresAt -
            Date.now()
          ) /
            1000
        );

      if (
        remaining <=
        0
      ) {
        clearPendingLogin();

        return;
      }

      const role =
        toText(
          pending.role
        );

      /*
        Super admin OTP mode கிடையாது.
      */

      if (
        role ===
        "super_admin"
      ) {
        clearPendingLogin();

        return;
      }

      setFormData(
        (
          previous
        ) => ({
          ...previous,

          role:
            role ||
            "admin",

          username:
            toText(
              pending.username
            ),

          email:
            toText(
              pending.email
            ),

          password:
            "",

          secret_key:
            "",
        })
      );

      setOtpEmail(
        toText(
          pending.email
        )
      );

      setOtpMode(
        true
      );

      setSecondsLeft(
        remaining
      );
    },
    []
  );

  /* =======================================================
     OTP TIMER
  ======================================================= */

  useEffect(
    () => {
      if (
        !otpMode ||
        secondsLeft <=
          0
      ) {
        return undefined;
      }

      const timer =
        window.setInterval(
          () => {
            setSecondsLeft(
              (
                previous
              ) =>
                Math.max(
                  previous -
                    1,
                  0
                )
            );
          },
          1000
        );

      return () => {
        window.clearInterval(
          timer
        );
      };
    },
    [
      otpMode,
      secondsLeft,
    ]
  );

  /* =======================================================
     OTP EXPIRY CLEANUP
  ======================================================= */

  useEffect(
    () => {
      if (
        otpMode &&
        secondsLeft ===
          0
      ) {
        clearPendingLogin();
      }
    },
    [
      otpMode,
      secondsLeft,
    ]
  );

  /* =======================================================
     TIMER TEXT
  ======================================================= */

  const timerText =
    useMemo(
      () => {
        const minutes =
          Math.floor(
            secondsLeft /
              60
          );

        const seconds =
          secondsLeft %
          60;

        return `${String(
          minutes
        ).padStart(
          2,
          "0"
        )}:${String(
          seconds
        ).padStart(
          2,
          "0"
        )}`;
      },
      [
        secondsLeft,
      ]
    );

  /* =======================================================
     CURRENT ROLE
  ======================================================= */

  const currentRole =
    useMemo(
      () =>
        ADMIN_ROLES.find(
          (
            role
          ) =>
            role.value ===
            formData.role
        ) ||
        ADMIN_ROLES[0],
      [
        formData.role,
      ]
    );

  /* =======================================================
     ROLE CHANGE
  ======================================================= */

  const handleRoleChange =
    (
      role
    ) => {
      if (
        submitting ||
        otpMode
      ) {
        return;
      }

      setFormData(
        (
          previous
        ) => ({
          ...previous,

          role,

          email:
            role ===
            "super_admin"
              ? ""
              : previous.email,

          secret_key:
            role ===
            "super_admin"
              ? previous.secret_key
              : "",
        })
      );

      setFormError("");
    };

  /* =======================================================
     INPUT CHANGE
  ======================================================= */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } =
      event.target;

    let nextValue =
      value;

    if (
      name ===
      "username"
    ) {
      nextValue =
        value.slice(
          0,
          150
        );
    }

    if (
      name ===
      "email"
    ) {
      nextValue =
        value
          .trimStart()
          .slice(
            0,
            255
          );
    }

    if (
      name ===
      "secret_key"
    ) {
      nextValue =
        value.slice(
          0,
          255
        );
    }

    setFormData(
      (
        previous
      ) => ({
        ...previous,

        [name]:
          nextValue,
      })
    );

    setFormError("");
  };

  /* =======================================================
     LOGIN VALIDATION
  ======================================================= */

  const validateLogin =
    () => {
      if (
        !toText(
          formData.role
        )
      ) {
        return "Select an admin role.";
      }

      if (
        !toText(
          formData.username
        )
      ) {
        return "Username is required.";
      }

      if (
        !formData.password
      ) {
        return "Password is required.";
      }

      if (
        (
          formData.role ===
            "admin" ||
          formData.role ===
            "subadmin"
        ) &&
        !toText(
          formData.email
        )
      ) {
        return "Registered email is required.";
      }

      if (
        formData.role ===
          "super_admin" &&
        !toText(
          formData.secret_key
        )
      ) {
        return "Super Admin secret key is required.";
      }

      return "";
    };

  /* =======================================================
     ADMIN LOGIN

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
  ======================================================= */

  const handleLogin =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        submitting
      ) {
        return;
      }

      const validationError =
        validateLogin();

      if (
        validationError
      ) {
        setFormError(
          validationError
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        setFormError("");

        const payload = {
          role:
            formData.role,

          username:
            toText(
              formData.username
            ),

          password:
            formData.password,
        };

        if (
          formData.role ===
          "super_admin"
        ) {
          payload.secret_key =
            toText(
              formData.secret_key
            );
        } else {
          payload.email =
            toText(
              formData.email
            );
        }

        const result =
          await loginAdmin(
            payload
          );

        /* ===============================================
           ADMIN / SUBADMIN OTP
        =============================================== */

        if (
          isOtpRequiredResponse(
            result,
            formData.role
          )
        ) {
          const email =
            toText(
              result?.email ??
                result?.data
                  ?.email ??
                formData.email
            );

          const expiresAt =
            Date.now() +
            5 *
              60 *
              1000;

          savePendingLogin({
            role:
              formData.role,

            username:
              formData.username,

            email,

            expiresAt,
          });

          setOtpEmail(
            email
          );

          setOtp("");

          setSecondsLeft(
            300
          );

          setOtpMode(
            true
          );

          /*
            Password page state-ல்
            retain செய்ய வேண்டாம்.
          */

          setFormData(
            (
              previous
            ) => ({
              ...previous,

              password:
                "",

              secret_key:
                "",
            })
          );

          toast.success(
            result?.message ||
              "OTP sent to your registered email."
          );

          return;
        }

        /* ===============================================
           SUPER ADMIN SUCCESS
        =============================================== */

        clearPendingLogin();

        toast.success(
          result?.message ||
            "Admin login successful."
        );

        navigate(
          redirectTarget,
          {
            replace: true,
          }
        );
      } catch (
        requestError
      ) {
        const message =
          getApiErrorMessage(
            requestError,
            requestError
              ?.apiMessage ||
              "Admin login failed."
          );

        setFormError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* =======================================================
     OTP CHANGE
  ======================================================= */

  const handleOtpChange =
    (
      event
    ) => {
      const value =
        event.target.value
          .replace(
            /\D/g,
            ""
          )
          .slice(
            0,
            6
          );

      setOtp(
        value
      );

      setFormError("");
    };

  /* =======================================================
     VERIFY LOGIN OTP

     POST /api/auth/admin-login-otp
  ======================================================= */

  const handleVerifyOtp =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        verifyingOtp
      ) {
        return;
      }

      if (
        otp.length !==
        6
      ) {
        setFormError(
          "Enter the complete 6-digit OTP."
        );

        return;
      }

      if (
        secondsLeft <=
        0
      ) {
        setFormError(
          "OTP expired. Login again to request a new OTP."
        );

        return;
      }

      if (
        !toText(
          otpEmail ||
            formData.email
        )
      ) {
        setFormError(
          "Admin email is missing. Please login again."
        );

        return;
      }

      try {
        setVerifyingOtp(
          true
        );

        setFormError("");

        const result =
          await verifyAdminLoginOtp({
            email:
              toText(
                otpEmail ||
                  formData.email
              ),

            otp,
          });

        clearPendingLogin();

        toast.success(
          result?.message ||
            "OTP verified successfully."
        );

        navigate(
          redirectTarget,
          {
            replace: true,
          }
        );
      } catch (
        requestError
      ) {
        const message =
          getApiErrorMessage(
            requestError,
            requestError
              ?.apiMessage ||
              "Invalid or expired OTP."
          );

        setFormError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setVerifyingOtp(
          false
        );
      }
    };

  /* =======================================================
     BACK TO LOGIN

     OTP expired / wrong account என்றால்
     credentials screen-க்கு திரும்பும்.
  ======================================================= */

  const handleBackToLogin =
    () => {
      if (
        verifyingOtp
      ) {
        return;
      }

      clearPendingLogin();

      setOtpMode(
        false
      );

      setOtp("");

      setOtpEmail("");

      setSecondsLeft(
        0
      );

      setFormError("");

      setFormData(
        (
          previous
        ) => ({
          ...previous,

          password:
            "",

          secret_key:
            "",
        })
      );
    };

  /* =======================================================
     OTP SCREEN
  ======================================================= */

  if (
    otpMode
  ) {
    return (
      <main className="inmba-admin-login-page">
        <div className="inmba-admin-login-background">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <section className="inmba-admin-login-shell">
          {/* =============================================
              BRAND SIDE
          ============================================= */}

          <aside className="inmba-admin-login-brand-panel">
            <div className="inmba-admin-login-brand">
              <span>
                IN
              </span>

              <div>
                <strong>
                  INMBA
                </strong>

                <small>
                  Administration
                </small>
              </div>
            </div>

            <div className="inmba-admin-login-brand-content">
              <span className="inmba-admin-login-security-icon">
                <i
                  className="fas fa-shield-halved"
                  aria-hidden="true"
                ></i>
              </span>

              <p>
                Secure Verification
              </p>

              <h1>
                Admin Access
                <br />
                Verification
              </h1>

              <span>
                Complete the second verification step to continue
                into the secure INMBA administration system.
              </span>
            </div>

            <div className="inmba-admin-login-brand-footer">
              <i
                className="fas fa-lock"
                aria-hidden="true"
              ></i>

              Secure administrative access
            </div>
          </aside>

          {/* =============================================
              OTP CARD
          ============================================= */}

          <section className="inmba-admin-login-form-panel">
            <div className="inmba-admin-login-form-wrap">
              <button
                type="button"
                className="inmba-admin-login-back-button"
                onClick={
                  handleBackToLogin
                }
                disabled={
                  verifyingOtp
                }
              >
                <i
                  className="fas fa-arrow-left"
                  aria-hidden="true"
                ></i>

                Back to Login
              </button>

              <header className="inmba-admin-login-form-header">
                <span className="inmba-admin-login-form-icon">
                  <i
                    className="fas fa-envelope-open-text"
                    aria-hidden="true"
                  ></i>
                </span>

                <p>
                  {currentRole.label}
                </p>

                <h2>
                  Verify Login OTP
                </h2>

                <span>
                  Enter the 6-digit OTP sent to your registered
                  administrator email.
                </span>
              </header>

              {/* EMAIL */}

              <div className="inmba-admin-login-otp-email">
                <i
                  className="fas fa-envelope"
                  aria-hidden="true"
                ></i>

                <div>
                  <small>
                    OTP sent to
                  </small>

                  <strong>
                    {otpEmail ||
                      formData.email ||
                      "Registered admin email"}
                  </strong>
                </div>
              </div>

              {/* ERROR */}

              {formError && (
                <div
                  className="inmba-admin-login-error"
                  role="alert"
                >
                  <i
                    className="fas fa-circle-exclamation"
                    aria-hidden="true"
                  ></i>

                  <span>
                    {formError}
                  </span>
                </div>
              )}

              {/* OTP FORM */}

              <form
                className="inmba-admin-login-form"
                onSubmit={
                  handleVerifyOtp
                }
              >
                <div className="inmba-admin-login-field">
                  <label htmlFor="admin-login-otp">
                    Verification Code
                  </label>

                  <div className="inmba-admin-login-input-wrap inmba-admin-login-otp-input-wrap">
                    <i
                      className="fas fa-key"
                      aria-hidden="true"
                    ></i>

                    <input
                      id="admin-login-otp"
                      type="text"
                      value={
                        otp
                      }
                      onChange={
                        handleOtpChange
                      }
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="000000"
                      autoFocus
                      disabled={
                        verifyingOtp ||
                        secondsLeft <=
                          0
                      }
                    />
                  </div>

                  <div className="inmba-admin-login-otp-meta">
                    <span>
                      {otp.length}/6
                    </span>

                    <strong
                      className={
                        secondsLeft <=
                        60
                          ? "inmba-admin-login-otp-expiring"
                          : ""
                      }
                    >
                      <i
                        className="far fa-clock"
                        aria-hidden="true"
                      ></i>

                      {timerText}
                    </strong>
                  </div>
                </div>

                {secondsLeft <=
                  0 && (
                  <div className="inmba-admin-login-otp-expired">
                    <i
                      className="fas fa-clock-rotate-left"
                      aria-hidden="true"
                    ></i>

                    <span>
                      OTP expired. Return to login and request a new
                      OTP.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className="inmba-admin-login-submit"
                  disabled={
                    verifyingOtp ||
                    otp.length !==
                      6 ||
                    secondsLeft <=
                      0
                  }
                >
                  {verifyingOtp ? (
                    <>
                      <i
                        className="fas fa-spinner fa-spin"
                        aria-hidden="true"
                      ></i>

                      Verifying OTP...
                    </>
                  ) : (
                    <>
                      Verify & Continue

                      <i
                        className="fas fa-arrow-right"
                        aria-hidden="true"
                      ></i>
                    </>
                  )}
                </button>
              </form>

              <footer className="inmba-admin-login-form-footer">
                <i
                  className="fas fa-shield-halved"
                  aria-hidden="true"
                ></i>

                OTP expires after 5 minutes.
              </footer>
            </div>
          </section>
        </section>
      </main>
    );
  }

  /* =======================================================
     LOGIN SCREEN
  ======================================================= */

  return (
    <main className="inmba-admin-login-page">
      <div className="inmba-admin-login-background">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <section className="inmba-admin-login-shell">
        {/* =================================================
            BRAND PANEL
        ================================================= */}

        <aside className="inmba-admin-login-brand-panel">
          <div className="inmba-admin-login-brand">
            <span>
              IN
            </span>

            <div>
              <strong>
                INMBA
              </strong>

              <small>
                Administration
              </small>
            </div>
          </div>

          <div className="inmba-admin-login-brand-content">
            <span className="inmba-admin-login-security-icon">
              <i
                className="fas fa-user-shield"
                aria-hidden="true"
              ></i>
            </span>

            <p>
              Administration Portal
            </p>

            <h1>
              Secure INMBA
              <br />
              Management
            </h1>

            <span>
              Access member management, verification, events and
              administrative operations through the secure admin
              portal.
            </span>
          </div>

          <div className="inmba-admin-login-features">
            <div>
              <i
                className="fas fa-users"
                aria-hidden="true"
              ></i>

              <span>
                Member Management
              </span>
            </div>

            <div>
              <i
                className="fas fa-user-check"
                aria-hidden="true"
              ></i>

              <span>
                Verification
              </span>
            </div>

            <div>
              <i
                className="fas fa-shield-halved"
                aria-hidden="true"
              ></i>

              <span>
                Secure Access
              </span>
            </div>
          </div>

          <div className="inmba-admin-login-brand-footer">
            <i
              className="fas fa-lock"
              aria-hidden="true"
            ></i>

            Authorized administrators only
          </div>
        </aside>

        {/* =================================================
            LOGIN FORM
        ================================================= */}

        <section className="inmba-admin-login-form-panel">
          <div className="inmba-admin-login-form-wrap">
            <header className="inmba-admin-login-form-header">
              <span className="inmba-admin-login-form-icon">
                <i
                  className={
                    currentRole.icon
                  }
                  aria-hidden="true"
                ></i>
              </span>

              <p>
                Secure Login
              </p>

              <h2>
                Admin Login
              </h2>

              <span>
                Select your administrative role and enter your
                credentials.
              </span>
            </header>

            {/* =================================================
                ROLE SELECTOR
            ================================================= */}

            <div className="inmba-admin-login-role-section">
              <label>
                Admin Role
              </label>

              <div className="inmba-admin-login-role-grid">
                {ADMIN_ROLES.map(
                  (
                    role
                  ) => {
                    const active =
                      formData.role ===
                      role.value;

                    return (
                      <button
                        type="button"
                        key={
                          role.value
                        }
                        className={`inmba-admin-login-role-option ${
                          active
                            ? "inmba-admin-login-role-option-active"
                            : ""
                        }`}
                        onClick={() =>
                          handleRoleChange(
                            role.value
                          )
                        }
                        disabled={
                          submitting
                        }
                      >
                        <span>
                          <i
                            className={
                              role.icon
                            }
                            aria-hidden="true"
                          ></i>
                        </span>

                        <div>
                          <strong>
                            {
                              role.label
                            }
                          </strong>

                          <small>
                            {
                              role.description
                            }
                          </small>
                        </div>

                        <i
                          className={
                            active
                              ? "fas fa-circle-check"
                              : "far fa-circle"
                          }
                          aria-hidden="true"
                        ></i>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {formError && (
              <div
                className="inmba-admin-login-error"
                role="alert"
              >
                <i
                  className="fas fa-circle-exclamation"
                  aria-hidden="true"
                ></i>

                <span>
                  {formError}
                </span>
              </div>
            )}

            {/* =================================================
                LOGIN FORM
            ================================================= */}

            <form
              className="inmba-admin-login-form"
              onSubmit={
                handleLogin
              }
            >
              {/* USERNAME */}

              <div className="inmba-admin-login-field">
                <label htmlFor="admin-login-username">
                  Username
                </label>

                <div className="inmba-admin-login-input-wrap">
                  <i
                    className="fas fa-user"
                    aria-hidden="true"
                  ></i>

                  <input
                    id="admin-login-username"
                    type="text"
                    name="username"
                    value={
                      formData.username
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter admin username"
                    autoComplete="username"
                    disabled={
                      submitting
                    }
                    required
                  />
                </div>
              </div>

              {/* EMAIL - ADMIN / SUBADMIN */}

              {formData.role !==
                "super_admin" && (
                <div className="inmba-admin-login-field">
                  <label htmlFor="admin-login-email">
                    Registered Email
                  </label>

                  <div className="inmba-admin-login-input-wrap">
                    <i
                      className="fas fa-envelope"
                      aria-hidden="true"
                    ></i>

                    <input
                      id="admin-login-email"
                      type="email"
                      name="email"
                      value={
                        formData.email
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter registered email"
                      autoComplete="email"
                      disabled={
                        submitting
                      }
                      required
                    />
                  </div>

                  <small className="inmba-admin-login-field-note">
                    OTP will be sent to this registered email after
                    credential verification.
                  </small>
                </div>
              )}

              {/* PASSWORD */}

              <div className="inmba-admin-login-field">
                <label htmlFor="admin-login-password">
                  Password
                </label>

                <div className="inmba-admin-login-input-wrap">
                  <i
                    className="fas fa-lock"
                    aria-hidden="true"
                  ></i>

                  <input
                    id="admin-login-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={
                      formData.password
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter password"
                    autoComplete="current-password"
                    disabled={
                      submitting
                    }
                    required
                  />

                  <button
                    type="button"
                    className="inmba-admin-login-password-toggle"
                    onClick={() =>
                      setShowPassword(
                        (
                          previous
                        ) =>
                          !previous
                      )
                    }
                    disabled={
                      submitting
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    <i
                      className={
                        showPassword
                          ? "fas fa-eye-slash"
                          : "fas fa-eye"
                      }
                      aria-hidden="true"
                    ></i>
                  </button>
                </div>
              </div>

              {/* SUPER ADMIN SECRET KEY */}

              {formData.role ===
                "super_admin" && (
                <div className="inmba-admin-login-field">
                  <label htmlFor="admin-login-secret-key">
                    Super Admin Secret Key
                  </label>

                  <div className="inmba-admin-login-input-wrap">
                    <i
                      className="fas fa-key"
                      aria-hidden="true"
                    ></i>

                    <input
                      id="admin-login-secret-key"
                      type={
                        showSecretKey
                          ? "text"
                          : "password"
                      }
                      name="secret_key"
                      value={
                        formData.secret_key
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Enter secret key"
                      autoComplete="off"
                      disabled={
                        submitting
                      }
                      required
                    />

                    <button
                      type="button"
                      className="inmba-admin-login-password-toggle"
                      onClick={() =>
                        setShowSecretKey(
                          (
                            previous
                          ) =>
                            !previous
                        )
                      }
                      disabled={
                        submitting
                      }
                      aria-label={
                        showSecretKey
                          ? "Hide secret key"
                          : "Show secret key"
                      }
                    >
                      <i
                        className={
                          showSecretKey
                            ? "fas fa-eye-slash"
                            : "fas fa-eye"
                        }
                        aria-hidden="true"
                      ></i>
                    </button>
                  </div>
                </div>
              )}

              {/* ROLE INFO */}

              <div className="inmba-admin-login-role-info">
                <span>
                  <i
                    className={
                      currentRole.icon
                    }
                    aria-hidden="true"
                  ></i>
                </span>

                <div>
                  <strong>
                    {
                      currentRole.label
                    }
                  </strong>

                  <small>
                    {
                      formData.role ===
                      "super_admin"
                        ? "Super Admin login uses username, password and secret key."
                        : "Admin and Sub Admin login uses username, password, registered email and OTP verification."
                    }
                  </small>
                </div>
              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                className="inmba-admin-login-submit"
                disabled={
                  submitting
                }
              >
                {submitting ? (
                  <>
                    <i
                      className="fas fa-spinner fa-spin"
                      aria-hidden="true"
                    ></i>

                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    {formData.role ===
                    "super_admin"
                      ? "Login to Admin Panel"
                      : "Continue to OTP"}

                    <i
                      className="fas fa-arrow-right"
                      aria-hidden="true"
                    ></i>
                  </>
                )}
              </button>
            </form>

            {/* =================================================
                FOOTER
            ================================================= */}

            <footer className="inmba-admin-login-form-footer">
              <Link to="/">
                <i
                  className="fas fa-arrow-left"
                  aria-hidden="true"
                ></i>

                Back to Website
              </Link>

              <span>
                <i
                  className="fas fa-shield-halved"
                  aria-hidden="true"
                ></i>

                Secure Session
              </span>
            </footer>
          </div>
        </section>
      </section>
    </main>
  );
}