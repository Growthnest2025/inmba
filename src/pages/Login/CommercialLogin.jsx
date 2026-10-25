import React, {
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

import "@fortawesome/fontawesome-free/css/all.min.css";

import api from "../../api/api";

import {
  useAuth,
} from "../../context/AuthContext";

import "./CommercialLogin.css";
import { toText, asObject } from "../../utils/commonHelpers";

/* =========================================================
   HELPERS
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

const isCommercialMember =
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

    const loginId =
      toText(
        member?.login_id ||
        member?.loginId
      ).toUpperCase();

    return (
      loginId.startsWith("COM") ||
      [
        "commercial",
        "commercial member",
        "commercial membership",
      ].includes(membershipType)
    );
  };

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
   COMMERCIAL LOGIN
========================================================= */

export default function CommercialLogin() {
  const navigate =
    useNavigate();
  const location =
    useLocation();

  const {
    checkMemberSession,
    clearMemberSession,
  } =
    useAuth();

  const initialLoginId = (() => {
    const fromState = toText(location?.state?.loginId || location?.state?.prefillId);
    if (/^COM\d{7}$/i.test(fromState)) return fromState.toUpperCase();
    const fromStorage = toText(
      sessionStorage.getItem("commercial_login_id") ||
      sessionStorage.getItem("inmba_commercial_login_id") ||
      localStorage.getItem("commercial_login_id")
    );
    if (/^COM\d{7}$/i.test(fromStorage)) return fromStorage.toUpperCase();
    return "COM";
  })();

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
     LOGIN ID
  ======================================================= */

  const handleLoginIdChange =
    (
      event
    ) => {
      let value =
        String(
          event.target.value ||
            ""
        ).toUpperCase();

      if (
        !value.startsWith(
          "COM"
        )
      ) {
        value =
          `COM${value}`;
      }

      const digits =
        value
          .slice(3)
          .replace(
            /\D/g,
            ""
          )
          .slice(
            0,
            7
          );

      setLoginId(
        `COM${digits}`
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
     CLEAR WRONG MEMBER SESSION
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
          "Commercial login cleanup error:",
          logoutError
        );
      }

      try {
        clearMemberSession();
      } catch {
        // Ignore local cleanup issue
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
        ).toUpperCase();

      if (
        !normalizedLoginId
      ) {
        setError(
          "Login ID is required."
        );

        return;
      }

      const commercialPattern =
        /^COM\d{7}$/;

      if (
        !commercialPattern.test(
          normalizedLoginId
        )
      ) {
        setError(
          "Commercial Login ID must be COM followed by exactly 7 digits."
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

        if (
          !isCommercialMember(
            member
          )
        ) {
          await clearWrongMemberSession();

          setPassword(
            ""
          );

          setError(
            "This login page is only for Commercial Members."
          );

          return;
        }

        if (
          typeof checkMemberSession ===
            "function"
        ) {
          await checkMemberSession();
        }

        if (
          member?.login_id
        ) {
          const commLoginId = String(member.login_id);
          sessionStorage.setItem("commercial_login_id", commLoginId);
          localStorage.setItem("commercial_login_id", commLoginId);
          sessionStorage.setItem("inmba_commercial_login_id", commLoginId);
          localStorage.setItem("inmba_commercial_login_id", commLoginId);
          sessionStorage.setItem("inmba_member_login_id", commLoginId);
          localStorage.setItem("inmba_member_login_id", commLoginId);
          sessionStorage.setItem("inmba_login_id", commLoginId);
          localStorage.setItem("inmba_login_id", commLoginId);
        }

        if (response?.data?.token) {
          localStorage.setItem("inmba_auth_token", response.data.token);
          sessionStorage.setItem("inmba_auth_token", response.data.token);
          localStorage.setItem("inmba_session_token", response.data.token);
          sessionStorage.setItem("inmba_session_token", response.data.token);
        }

        window.dispatchEvent(
          new Event(
            "auth-change"
          )
        );

const paymentStatus =
          toText(
            member?.payment_status ??
            member?.paymentStatus
          ).toLowerCase();

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

        const fromNewRegistration =
          location.state?.registrationSuccess === true ||
          location.state?.fromNewRegistration === true ||
          sessionStorage.getItem("commercial_from_registration") === "true";

        sessionStorage.removeItem("commercial_from_registration");

        const targetPath =
          !isPaymentApproved || fromNewRegistration
            ? "/commercial/membership-plan"
            : "/commercial/dashboard";

        navigate(
          targetPath,
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
                  "Commercial Member"
                ),

              commercialFlow:
                true,

              fromCommercialLogin:
                true,
            },
          }
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

  return (
    <main className="commercial-login-page">
      <div
        className="commercial-login-background"
        aria-hidden="true"
      >
        <div className="commercial-login-glow commercial-login-glow-one" />

        <div className="commercial-login-glow commercial-login-glow-two" />

        <div className="commercial-login-pattern" />
      </div>

      <div className="commercial-login-wrapper">
        {/* LEFT */}

        <section className="commercial-login-brand-panel">
          <div className="commercial-login-brand-top">
            <Link
              to="/"
              className="commercial-login-logo"
            >
              <div className="commercial-login-logo-icon">
                <i className="fa-solid fa-building" />
              </div>

              <div>
                <strong>
                  INMBA
                </strong>

                <span>
                  Commercial Network
                </span>
              </div>
            </Link>
          </div>

          <div className="commercial-login-brand-content">
            <span className="commercial-login-brand-label">
              COMMERCIAL MEMBERSHIP
            </span>

            <h1>
              Welcome Back,
              <br />

              <span>
                Business Member.
              </span>
            </h1>

            <p>
              Sign in to access your
              commercial profile,
              business membership,
              network and member
              benefits.
            </p>

            <div className="commercial-login-benefits">
              <div className="commercial-login-benefit">
                <span>
                  <i className="fa-solid fa-check" />
                </span>

                <p>
                  Commercial Dashboard
                </p>
              </div>

              <div className="commercial-login-benefit">
                <span>
                  <i className="fa-solid fa-check" />
                </span>

                <p>
                  Business Profile
                </p>
              </div>

              <div className="commercial-login-benefit">
                <span>
                  <i className="fa-solid fa-check" />
                </span>

                <p>
                  Network & Royalty
                </p>
              </div>
            </div>
          </div>

          <div className="commercial-login-brand-footer">
            <i className="fa-solid fa-lock" />

            <span>
              Secure INMBA Commercial Login
            </span>
          </div>
        </section>

        {/* FORM */}

        <section className="commercial-login-form-panel">
          <div className="commercial-login-card">
            <div className="commercial-login-mobile-brand">
              <div className="commercial-login-mobile-brand-icon">
                <i className="fa-solid fa-building" />
              </div>

              <div>
                <strong>
                  INMBA Commercial
                </strong>

                <span>
                  Business Member Login
                </span>
              </div>
            </div>

            <div className="commercial-login-heading">
              <span>
                BUSINESS ACCESS
              </span>

              <h2>
                Commercial Login
              </h2>

              <p>
                Enter your Commercial
                Member Login ID and
                password.
              </p>
            </div>

            {error && (
              <div
                className="commercial-login-error"
                role="alert"
              >
                <i className="fa-solid fa-circle-exclamation" />

                <span>
                  {error}
                </span>
              </div>
            )}

            <form
              className="commercial-login-form"
              onSubmit={
                handleSubmit
              }
              noValidate
            >
              <div className="commercial-login-field">
                <label
                  htmlFor="commercial-login-id"
                >
                  Login ID
                </label>

                <div className="commercial-login-input-wrapper">
                  <i className="fa-solid fa-id-badge" />

                  <input
                    id="commercial-login-id"
                    type="text"
                    value={
                      loginId
                    }
                    onChange={
                      handleLoginIdChange
                    }
                    placeholder="COM1234567"
                    maxLength={10}
                    autoCapitalize="characters"
                    autoComplete="username"
                    disabled={
                      submitting
                    }
                  />
                </div>

                <small className="commercial-login-id-help">
                  Example: COM1234567
                </small>
              </div>

              <div className="commercial-login-field">
                <div className="commercial-login-label-row">
                  <label
                    htmlFor="commercial-login-password"
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot_password"
                    className="commercial-login-forgot"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <div className="commercial-login-input-wrapper">
                  <i className="fa-solid fa-lock" />

                  <input
                    id="commercial-login-password"
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
                    className="commercial-login-password-toggle"
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

              <button
                type="submit"
                className="commercial-login-submit"
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
                    Login to Commercial Account

                    <i className="fa-solid fa-arrow-right" />
                  </>
                )}
              </button>
            </form>

            <div className="commercial-login-divider">
              <span>
                New Commercial Member?
              </span>
            </div>

            <Link
              to="/membership/commercial"
              className="commercial-login-register"
            >
              <i className="fa-solid fa-building-circle-check" />

              Create Commercial Account
            </Link>

            <div className="commercial-login-other-member">
              <span>
                Not a Commercial Member?
              </span>

              <Link
                to="/login"
              >
                Choose Another Login
              </Link>
            </div>

            <Link
              to="/"
              className="commercial-login-home"
            >
              <i className="fa-solid fa-arrow-left" />

              Back to Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}