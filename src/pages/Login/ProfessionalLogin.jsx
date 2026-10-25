import React, {
  useMemo,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import "@fortawesome/fontawesome-free/css/all.min.css";

import api from "../../api/api";

import {
  useAuth,
} from "../../context/AuthContext";

import "./ProfessionalLogin.css";
import { toText, asObject } from "../../utils/commonHelpers";

/* =========================================================
   CONSTANTS
========================================================= */

const PROFESSIONAL_NEXT_ROUTE_STORAGE_KEY =
  "inmba_professional_next_route";

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   MEMBER EXTRACTOR
========================================================= */

const extractMemberFromLoginResponse =
  (
    response
  ) => {
    const body =
      asObject(
        response?.data
      );

    const data =
      asObject(
        body.data
      );

    return asObject(
      data.member ||
        body.member ||
        data.user ||
        body.user
    );
  };

/* =========================================================
   PROFESSIONAL MEMBER CHECK
========================================================= */

const isProfessionalMember =
  (
    member
  ) => {
    const membershipType =
      toText(
        member
          ?.membership_type ||
          member
            ?.membershipType
      )
        .toLowerCase();

    return [
      "professional member",
      "professional membership",
      "professional",
    ].includes(
      membershipType
    );
  };

/* =========================================================
   API ERROR
========================================================= */

const getLoginErrorMessage =
  (
    error
  ) => {
    return (
      error?.response?.data
        ?.message ||
      error?.response?.data
        ?.error ||
      error?.apiMessage ||
      error?.message ||
      "Unable to login. Please try again."
    );
  };

/* =========================================================
   PROFESSIONAL LOGIN
========================================================= */

export default function ProfessionalLogin() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    checkMemberSession,
    clearMemberSession,
  } =
    useAuth();

  /* =======================================================
     PREFILL LOGIN ID
  ======================================================= */

  const initialLoginId =
    useMemo(
      () => {
        const stateLoginId =
          toText(
            location.state
              ?.prefillId ||
              location.state
                ?.loginId
          );

        if (
          stateLoginId
        ) {
          return stateLoginId;
        }

        const params =
          new URLSearchParams(
            location.search
          );

        return toText(
          params.get(
            "loginId"
          )
        );
      },
      [
        location.state,
        location.search,
      ]
    );

  /* =======================================================
     STATES
  ======================================================= */

  const [
    loginId,
    setLoginId,
  ] =
    useState(
      initialLoginId
    );

  const [
    password,
    setPassword,
  ] =
    useState(
      ""
    );

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(
      false
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  /* =======================================================
     LOGIN ID CHANGE
  ======================================================= */

const handleLoginIdChange = (event) => {
  let value = String(
    event.target.value || ""
  ).toUpperCase();

  // Always keep PRO prefix
  if (!value.startsWith("PRO")) {
    value = `PRO${value}`;
  }

  // Only digits after PRO
  const digits = value
    .slice(3)
    .replace(/\D/g, "")
    .slice(0, 7);

  setLoginId(
    `PRO${digits}`
  );

  setError("");
};
  /* =======================================================
     PASSWORD CHANGE
  ======================================================= */

  const handlePasswordChange =
    (
      event
    ) => {
      setPassword(
        event.target.value
      );

      setError(
        ""
      );
    };

  /* =======================================================
     LOGOUT WRONG MEMBER TYPE

     Professional login page-ல்
     Basic / other member login
     செய்தால் backend session
     active ஆகி இருக்கக்கூடாது.
  ======================================================= */

  const clearWrongMemberSession =
    async () => {
      try {
        await api.post(
          "/logout",
          {}
        );
      } catch (
        logoutError
      ) {
        console.error(
          "Professional login cleanup error:",
          logoutError
        );
      }

      try {
        clearMemberSession();
      } catch {
        // Ignore local auth cleanup failure.
      }
    };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        submitting
      ) {
        return;
      }

      const normalizedLoginId =
        toText(
          loginId
        );

      if (
        !normalizedLoginId
      ) {
        setError(
          "Login ID is required."
        );

        return;
      }


      const professionalLoginPattern =
  /^PRO\d{7}$/;

if (
  !professionalLoginPattern.test(
    normalizedLoginId.toUpperCase()
  )
) {
  setError(
    "Professional Login ID must be PRO followed by exactly 7 digits."
  );

  return;
}
      if (
        !password
      ) {
        setError(
          "Password is required."
        );

        return;
      }

      setSubmitting(
        true
      );

      setError(
        ""
      );

      try {
        /* ===============================================
           EXISTING MEMBER LOGIN API

           api.js baseURL = /api

           Final request:
           POST /api/login
        =============================================== */

        const response =
          await api.post(
            "/login",
            {
              login_id:
                normalizedLoginId,

              password,
            }
          );

        const member =
          extractMemberFromLoginResponse(
            response
          );

        if (member?.login_id) {
          sessionStorage.setItem("inmba_member_login_id", String(member.login_id));
          sessionStorage.setItem("inmba_login_id", String(member.login_id));
          sessionStorage.setItem("inmba_professional_login_id", String(member.login_id));
        }

        window.dispatchEvent(new Event("auth-change"));

        /* ===============================================
           PROFESSIONAL MEMBER ONLY
        =============================================== */

if (
  typeof checkMemberSession ===
    "function"
) {
  await checkMemberSession();
}

/* =====================================================
   PAYMENT STATUS CHECK
===================================================== */

const paymentStatus =
  String(
    member?.payment_status || ""
  )
    .trim()
    .toLowerCase();

const isPaymentApproved =
  [
    "approved",
    "paid",
    "completed",
    "success",
    "successful",
  ].includes(
    paymentStatus
  );

/* =====================================================
   ALREADY APPROVED → DIRECT DASHBOARD
===================================================== */

if (
  isPaymentApproved
) {
  sessionStorage.removeItem(
    PROFESSIONAL_NEXT_ROUTE_STORAGE_KEY
  );

  navigate(
    "/professional-dashboard",
    {
      replace: true,

      state: {
        loginId:
          member?.login_id,

        member,

        membershipType:
          member?.membership_type,
      },
    }
  );

  return;
}

/* =====================================================
   NOT APPROVED → CONTINUE MEMBERSHIP FLOW
===================================================== */

sessionStorage.setItem(
  PROFESSIONAL_NEXT_ROUTE_STORAGE_KEY,
  "/professional-membership"
);


        navigate(
          "/professional-membership",
          {
            replace:
              true,

            state: {
              loginId:
                toText(
                  member
                    .login_id,
                  normalizedLoginId
                ),

              member,

              membershipType:
                toText(
                  member
                    .membership_type,
                  "Professional Member"
                ),

              professionalFlow:
                true,

              fromProfessionalLogin:
                true,
            },
          }
        );
      } catch (
        loginError
      ) {
        setError(
          getLoginErrorMessage(
            loginError
          )
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="professional-login-page">
      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div
        className="professional-login-background"
        aria-hidden="true"
      >
        <div className="professional-login-glow professional-login-glow-one" />

        <div className="professional-login-glow professional-login-glow-two" />

        <div className="professional-login-grid-pattern" />
      </div>

      {/* =================================================
          MAIN WRAPPER
      ================================================= */}

      <div className="professional-login-wrapper">
        {/* ===============================================
            LEFT PANEL
        =============================================== */}

        <section className="professional-login-brand-panel">
          <div className="professional-login-brand-top">
            <Link
              to="/"
              className="professional-login-logo"
            >
              <div className="professional-login-logo-icon">
                <i className="fa-solid fa-shield-halved" />
              </div>

              <div>
                <strong>
                  INMBA
                </strong>

                <span>
                  Professional Network
                </span>
              </div>
            </Link>
          </div>

          <div className="professional-login-brand-content">
            <span className="professional-login-brand-label">
              PROFESSIONAL MEMBERSHIP
            </span>

            <h1>
              Welcome Back,
              <br />

              <span>
                Professional.
              </span>
            </h1>

            <p>
              Sign in to continue your
              Professional membership,
              profile upgrade, Full KYC,
              payment and member benefits.
            </p>

            <div className="professional-login-benefits">
              <div className="professional-login-benefit">
                <span>
                  <i className="fa-solid fa-check" />
                </span>

                <p>
                  Professional Membership
                </p>
              </div>

              <div className="professional-login-benefit">
                <span>
                  <i className="fa-solid fa-check" />
                </span>

                <p>
                  Full Professional KYC
                </p>
              </div>

              <div className="professional-login-benefit">
                <span>
                  <i className="fa-solid fa-check" />
                </span>

                <p>
                  Profile Upgrade & Network
                </p>
              </div>
            </div>
          </div>

          <div className="professional-login-brand-footer">
            <i className="fa-solid fa-lock" />

            <span>
              Secure INMBA Member Login
            </span>
          </div>
        </section>

        {/* ===============================================
            LOGIN PANEL
        =============================================== */}

        <section className="professional-login-form-panel">
          <div className="professional-login-card">
            {/* ===========================================
                MOBILE BRAND
            =========================================== */}

            <div className="professional-login-mobile-brand">
              <div className="professional-login-mobile-brand-icon">
                <i className="fa-solid fa-user-tie" />
              </div>

              <div>
                <strong>
                  INMBA Professional
                </strong>

                <span>
                  Member Login
                </span>
              </div>
            </div>

            {/* ===========================================
                HEADING
            =========================================== */}

            <div className="professional-login-heading">
              <span>
                MEMBER ACCESS
              </span>

              <h2>
                Professional Login
              </h2>

              <p>
                Enter your Professional
                Member Login ID and
                password to continue.
              </p>
            </div>

            {/* ===========================================
                ERROR
            =========================================== */}

            {error && (
              <div
                className="professional-login-error"
                role="alert"
              >
                <i className="fa-solid fa-circle-exclamation" />

                <span>
                  {error}
                </span>
              </div>
            )}

            {/* ===========================================
                FORM
            =========================================== */}

            <form
              className="professional-login-form"
              onSubmit={
                handleSubmit
              }
              noValidate
            >
              {/* LOGIN ID */}

              <div className="professional-login-field">
                <label
                  htmlFor="professional-login-id"
                >
                  Login ID
                </label>

<div className="professional-login-input-wrapper">
  <i className="fa-solid fa-id-badge" />

  <input
    id="professional-login-id"
    type="text"
    value={loginId}
    onChange={handleLoginIdChange}
    placeholder="PRO1234567"
    maxLength={10}
    autoCapitalize="characters"
    autoComplete="username"
    disabled={submitting}
  />
</div>
              </div>

              {/* PASSWORD */}

              <div className="professional-login-field">
                <div className="professional-login-label-row">
                  <label
                    htmlFor="professional-login-password"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot_password"
                    className="professional-login-forgot-link"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <div className="professional-login-input-wrapper">
                  <i className="fa-solid fa-lock" />

                  <input
                    id="professional-login-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      password
                    }
                    onChange={
                      handlePasswordChange
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={
                      submitting
                    }
                  />

                  <button
                    type="button"
                    className="professional-login-password-toggle"
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
                          ? "fa-solid fa-eye-slash"
                          : "fa-solid fa-eye"
                      }
                    />
                  </button>
                </div>
              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                className="professional-login-submit-button"
                disabled={
                  submitting
                }
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" />

                    Signing In...
                  </>
                ) : (
                  <>
                    Login to Professional Account

                    <i className="fa-solid fa-arrow-right" />
                  </>
                )}
              </button>
            </form>

            {/* ===========================================
                DIVIDER
            =========================================== */}

            <div className="professional-login-divider">
              <span>
                New Professional Member?
              </span>
            </div>

            {/* ===========================================
                REGISTER
            =========================================== */}

            <Link
              to="/professional"
              className="professional-login-register-button"
            >
              <i className="fa-solid fa-user-plus" />

              Create Professional Account
            </Link>

            {/* ===========================================
                OTHER MEMBER
            =========================================== */}

            <div className="professional-login-other-member">
              <span>
                Not a Professional Member?
              </span>

              <Link
                to="/login"
              >
                Go to Regular Member Login
              </Link>
            </div>

            {/* ===========================================
                BACK
            =========================================== */}

            <Link
              to="/membership-type"
              className="professional-login-back-link"
            >
              <i className="fa-solid fa-arrow-left" />

              Back to Membership Types
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}