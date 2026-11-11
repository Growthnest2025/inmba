import React, {
  useMemo,
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import "@fortawesome/fontawesome-free/css/all.min.css";

import api from "../../../api/api";
import inmbaLogo from "../../../assets/images/inmba_logo.png";

import "./Login.css";
import { toText, asObject } from "../../../utils/commonHelpers";

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   ERROR MESSAGE
========================================================= */

const getLoginErrorMessage = (
  error
) => {
  return (
    error?.apiMessage ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Unable to login. Please try again."
  );
};

/* =========================================================
   LOGIN
========================================================= */

export default function Login() {
  const location =
    useLocation();

  /* =======================================================
     NEW REGISTRATION FLOW

     true:
     Registration
     -> Success
     -> Civilian Login
     -> Membership Plan

     false:
     Normal Civilian Login
     -> Dashboard
  ======================================================= */

  const fromNewRegistration =
    location.state?.fromNewRegistration === true;

  /* =======================================================
     SUCCESS / ERROR MESSAGE
  ======================================================= */

  const flashMessage =
    toText(
      location.state?.message
    );

  const routeError =
    toText(
      location.state?.error
    );

  /* =======================================================
     LOGIN ID PREFILL
  ======================================================= */

  const initialLoginId =
    useMemo(
      () => {
        const stateLoginId =
          toText(
            location.state?.prefillId ||
            location.state?.loginId
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
      routeError
    );

  /* =======================================================
     LOGIN ID
  ======================================================= */

  const handleLoginIdChange = (
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
          7
        );

    setLoginId(
      value
    );

    setError(
      ""
    );
  };

  /* =======================================================
     PASSWORD
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
     LOGIN SUBMIT
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

      const civilianLoginPattern =
        /^\d{7}$/;

      if (
        !civilianLoginPattern.test(
          normalizedLoginId
        )
      ) {
        setError(
          "Civilian Login ID must be exactly 7 digits."
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
        /* =============================================
           LOGIN API

           POST /api/login

           Backend session cookie login success
           ஆனதும் active ஆகும்.
        ============================================= */

        const response =
          await api.post(
            "/login",
            {
              login_id:
                normalizedLoginId,

              password,
            }
          );

        const body =
          asObject(
            response?.data
          );

        const data =
          asObject(
            body.data
          );

        /* =============================================
           LOGIN SUCCESS CHECK
        ============================================= */

        const success =
          body.success !== false &&
          response?.status >= 200 &&
          response?.status < 300;

        if (
          !success
        ) {
          throw new Error(
            body.message ||
            "Login failed."
          );
        }

        /* =============================================
           MEMBER
        ============================================= */

        const member =
          asObject(
            data.member ||
            body.member
          );

        /* =============================================
           SAVE MEMBER LOGIN ID
        ============================================= */

        if (
          member?.login_id
        ) {
          sessionStorage.setItem(
            "inmba_member_login_id",
            String(
              member.login_id
            )
          );
        } else {
          sessionStorage.setItem(
            "inmba_member_login_id",
            normalizedLoginId
          );
        }

        /* =============================================
           AUTH STATE UPDATE
        ============================================= */

        window.dispatchEvent(
          new Event(
            "auth-change"
          )
        );

        /* =================================================
           REDIRECT LOGIC

           NEW REGISTRATION:
           Registration Success
           -> Login
           -> Membership Plan

           EXISTING USER:
           Normal Login
           -> Dashboard
        ================================================= */

        if (
          fromNewRegistration
        ) {
          window.location.replace(
            "/civilian-membership-plan"
          );

          return;
        }

        window.location.replace(
          "/dashboard"
        );
      } catch (
        loginError
      ) {
        setPassword(
          ""
        );

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
     UI
  ======================================================= */

  return (
    <main className="inmba-member-login-page">

      {/* BACKGROUND */}

      <div
        className="inmba-member-login-background"
        aria-hidden="true"
      >
        <div className="inmba-member-login-circle inmba-member-login-circle-one" />

        <div className="inmba-member-login-circle inmba-member-login-circle-two" />

        <div className="inmba-member-login-pattern" />
      </div>

      {/* WRAPPER */}

      <div className="inmba-member-login-wrapper">

        {/* ===============================================
            GREEN LEFT PANEL
        =============================================== */}

        <section className="inmba-member-login-brand-panel">

          <div className="inmba-member-login-brand-top">

            <Link
              to="/"
              className="inmba-member-login-logo"
            >
              <div className="inmba-member-login-logo-icon">
                <img src={inmbaLogo} alt="INMBA Logo" className="inmba-member-login-logo-img" />
              </div>

              <div>
                <strong>
                  INMBA
                </strong>

                <span>
                  International Network
                </span>
              </div>
            </Link>

          </div>

          <div className="inmba-member-login-brand-content">

            <span className="inmba-member-login-brand-label">
              MEMBER LOGIN
            </span>

            <h1>
              Welcome
              <br />

              <span>
                Back.
              </span>
            </h1>

            <p>
              Sign in to access your INMBA
              membership dashboard,
              profile, network, payments
              and member benefits.
            </p>

            <div className="inmba-member-login-benefits">

              <div className="inmba-member-login-benefit">
                <span>
                  <i className="fas fa-check" />
                </span>

                <p>
                  Member Dashboard
                </p>
              </div>

              <div className="inmba-member-login-benefit">
                <span>
                  <i className="fas fa-check" />
                </span>

                <p>
                  Profile & Membership
                </p>
              </div>

              <div className="inmba-member-login-benefit">
                <span>
                  <i className="fas fa-check" />
                </span>

                <p>
                  Network & Rewards
                </p>
              </div>

            </div>

          </div>

          <div className="inmba-member-login-brand-footer">
            <i className="fas fa-lock" />

            <span>
              Secure INMBA Member Login
            </span>
          </div>

        </section>

        {/* ===============================================
            FORM
        =============================================== */}

        <section className="inmba-member-login-form-panel">

          <div className="inmba-member-login-card">

            <div className="inmba-member-login-mobile-brand">

              <div className="inmba-member-login-mobile-brand-icon">
                <img src={inmbaLogo} alt="INMBA Logo" className="inmba-member-login-mobile-logo-img" />
              </div>

              <div>
                <strong>
                  INMBA
                </strong>

                <span>
                  Member Login
                </span>
              </div>

            </div>

            <div className="inmba-member-login-heading">

              <span>
                MEMBER ACCESS
              </span>

              <h2>
                Login to Your Account
              </h2>

              <p>
                Enter your Member Login ID
                and password to continue.
              </p>

            </div>

            {/* SUCCESS */}

            {flashMessage && (
              <div
                className="inmba-member-login-message"
                role="status"
              >
                <i className="fas fa-circle-check" />

                <span>
                  {flashMessage}
                </span>
              </div>
            )}

            {/* ERROR */}

            {error && (
              <div
                className="inmba-member-login-error"
                role="alert"
              >
                <i className="fas fa-circle-exclamation" />

                <span>
                  {error}
                </span>
              </div>
            )}

            <form
              className="inmba-member-login-form"
              onSubmit={
                handleLogin
              }
              noValidate
            >

              {/* LOGIN ID */}

              <div className="inmba-member-login-field">

                <label
                  htmlFor="member-login-id"
                >
                  Login ID
                </label>

                <div className="inmba-member-login-input-wrap">

                  <i className="fas fa-id-badge" />

                  <input
                    id="member-login-id"
                    type="text"
                    name="login_id"
                    value={
                      loginId
                    }
                    onChange={
                      handleLoginIdChange
                    }
                    placeholder="7 Digit Login ID"
                    maxLength={7}
                    inputMode="numeric"
                    autoComplete="username"
                    disabled={
                      submitting
                    }
                    required
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div className="inmba-member-login-field">

                <div className="inmba-member-login-label-row">

                  <label
                    htmlFor="member-login-password"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot_password"
                    className="inmba-member-login-forgot"
                  >
                    Forgot Password?
                  </Link>

                </div>

                <div className="inmba-member-login-input-wrap">

                  <i className="fas fa-lock" />

                  <input
                    id="member-login-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
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
                    required
                  />

                  <button
                    type="button"
                    className="inmba-member-login-password-toggle"
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
                    />
                  </button>

                </div>

              </div>

              {/* LOGIN */}

              <button
                type="submit"
                className="inmba-member-login-submit"
                disabled={
                  submitting
                }
              >
                {submitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />

                    Signing In...
                  </>
                ) : (
                  <>
                    Login

                    <i className="fas fa-arrow-right" />
                  </>
                )}
              </button>

            </form>

            {/* JOIN */}

            <div className="inmba-member-login-divider">
              <span>
                New to INMBA?
              </span>
            </div>

            <Link
              to="/membership-type"
              className="inmba-member-login-register"
            >
              <i className="fas fa-user-plus" />

              Join INMBA
            </Link>

            {/* PROFESSIONAL */}

            <div className="inmba-member-login-professional">

              <span>
                Professional Member?
              </span>

              <Link
                to="/professional-login"
              >
                Professional Login
              </Link>

            </div>

            {/* HOME */}

            <Link
              to="/"
              className="inmba-member-login-home"
            >
              <i className="fas fa-arrow-left" />

              Back to Home
            </Link>

          </div>

        </section>

      </div>

    </main>
  );
}