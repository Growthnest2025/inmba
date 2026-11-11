import React, {
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
  getStoredPasswordResetEmail,
  requestPasswordReset,
  validateResetEmail,
} from "../../../services/passwordReset.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./ForgotPassword.css";

/* ========================================
   FORGOT PASSWORD PAGE
======================================== */

export default function ForgotPassword() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const initialEmail =
    useMemo(
      () =>
        String(
          location.state?.email ||
            getStoredPasswordResetEmail() ||
            ""
        ).trim(),
      [
        location.state,
      ]
    );

  const [
    email,
    setEmail,
  ] =
    useState(initialEmail);

  const [
    fieldError,
    setFieldError,
  ] =
    useState("");

  const [
    formError,
    setFormError,
  ] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  /* ========================================
     EMAIL CHANGE
  ======================================== */

  const handleEmailChange = (
    event
  ) => {
    setEmail(
      event.target.value
    );

    setFieldError("");
    setFormError("");
  };

  /* ========================================
     SUBMIT EMAIL

     API:
     POST /forgot_password

     Body:
     {
       email
     }
  ======================================== */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (submitting) {
        return;
      }

      const validation =
        validateResetEmail(email);

      if (!validation.valid) {
        setFieldError(
          validation.error
        );

        return;
      }

      try {
        setSubmitting(true);
        setFieldError("");
        setFormError("");

        const result =
          await requestPasswordReset(
            validation.value
          );

        toast.success(
          result.message ||
            "OTP sent successfully."
        );

        navigate(
          result.nextRoute ||
            "/verify_otp",
          {
            state: {
              email:
                result.email ||
                validation.value,

              message:
                result.message ||
                "OTP sent successfully.",
            },
          }
        );
      } catch (
        requestError
      ) {
        const emailError =
          requestError
            ?.fieldErrors
            ?.email;

        if (emailError) {
          setFieldError(
            Array.isArray(
              emailError
            )
              ? emailError[0]
              : String(
                  emailError
                )
          );
        }

        setFormError(
          getApiErrorMessage(
            requestError,
            "Unable to send password reset OTP."
          )
        );
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <main className="inmba-forgot-page">
      <div className="inmba-forgot-shell">
        {/* VISUAL PANEL */}

        <section className="inmba-forgot-visual">
          <Link
            to="/"
            className="inmba-forgot-brand"
          >
            <span>
              I
            </span>

            <div>
              <strong>
                INMBA
              </strong>

              <small>
                Member Portal
              </small>
            </div>
          </Link>

          <div className="inmba-forgot-visual-content">
            <span className="inmba-forgot-visual-icon">
              <i
                className="fas fa-shield-halved"
                aria-hidden="true"
              ></i>
            </span>

            <p>
              Secure Account Recovery
            </p>

            <h1>
              Forgot your
              <br />
              password?
            </h1>

            <span>
              Enter your registered email address. We will send a
              secure 6-digit OTP to continue the password reset.
            </span>
          </div>

          <div className="inmba-forgot-security-list">
            <article>
              <i
                className="fas fa-envelope-circle-check"
                aria-hidden="true"
              ></i>

              <span>
                OTP sent to registered email
              </span>
            </article>

            <article>
              <i
                className="fas fa-clock"
                aria-hidden="true"
              ></i>

              <span>
                OTP valid for 5 minutes
              </span>
            </article>

            <article>
              <i
                className="fas fa-lock"
                aria-hidden="true"
              ></i>

              <span>
                Secure session-based verification
              </span>
            </article>
          </div>
        </section>

        {/* FORM PANEL */}

        <section className="inmba-forgot-form-panel">
          <div className="inmba-forgot-mobile-brand">
            <Link to="/">
              INMBA
            </Link>

            <span>
              Member Portal
            </span>
          </div>

          <div className="inmba-forgot-form-card">
            <header>
              <span>
                <i
                  className="fas fa-key"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <p>
                  Password Recovery
                </p>

                <h2>
                  Find Your Account
                </h2>

                <small>
                  Enter the email used for your INMBA membership.
                </small>
              </div>
            </header>

            {formError && (
              <div
                className="inmba-forgot-alert"
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

            <form
              onSubmit={
                handleSubmit
              }
              noValidate
            >
              <div className="inmba-forgot-form-group">
                <label htmlFor="forgot-email">
                  Registered Email
                </label>

                <div className="inmba-forgot-input-shell">
                  <i
                    className="fas fa-envelope"
                    aria-hidden="true"
                  ></i>

                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={
                      handleEmailChange
                    }
                    placeholder="example@email.com"
                    autoComplete="email"
                    disabled={
                      submitting
                    }
                    className={
                      fieldError
                        ? "inmba-forgot-input-error"
                        : ""
                    }
                  />
                </div>

                {fieldError && (
                  <small className="inmba-forgot-field-error">
                    {fieldError}
                  </small>
                )}
              </div>

              <button
                type="submit"
                className="inmba-forgot-submit"
                disabled={
                  submitting
                }
              >
                {submitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      aria-hidden="true"
                    ></span>

                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP

                    <i
                      className="fas fa-arrow-right"
                      aria-hidden="true"
                    ></i>
                  </>
                )}
              </button>
            </form>

            <div className="inmba-forgot-back">
              <Link to="/login">
                <i
                  className="fas fa-arrow-left"
                  aria-hidden="true"
                ></i>

                Back to Member Login
              </Link>
            </div>
          </div>

          <p className="inmba-forgot-footer">
            Protected by INMBA secure member authentication.
          </p>
        </section>
      </div>
    </main>
  );
}