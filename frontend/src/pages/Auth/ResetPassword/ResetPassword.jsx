import React, {
  useMemo,
  useState,
} from "react";

import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  getStoredPasswordResetEmail,
  resetMemberPassword,
} from "../../../services/passwordReset.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./ResetPassword.css";

/* ========================================
   PASSWORD STRENGTH
======================================== */

const getPasswordStrength = (
  password
) => {
  const value =
    String(password || "");

  let score = 0;

  if (value.length >= 8) {
    score += 1;
  }

  if (/[A-Z]/.test(value)) {
    score += 1;
  }

  if (/[a-z]/.test(value)) {
    score += 1;
  }

  if (/\d/.test(value)) {
    score += 1;
  }

  if (
    /[^A-Za-z0-9]/.test(
      value
    )
  ) {
    score += 1;
  }

  if (!value) {
    return {
      score: 0,
      label: "",
      className: "",
    };
  }

  if (score <= 2) {
    return {
      score,
      label: "Weak",
      className:
        "inmba-reset-strength-weak",
    };
  }

  if (score <= 4) {
    return {
      score,
      label: "Medium",
      className:
        "inmba-reset-strength-medium",
    };
  }

  return {
    score,
    label: "Strong",
    className:
      "inmba-reset-strength-strong",
  };
};

/* ========================================
   RESET PASSWORD PAGE
======================================== */

export default function ResetPassword() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const resetEmail =
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
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] =
    useState(false);

  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState({});

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

  const passwordStrength =
    useMemo(
      () =>
        getPasswordStrength(
          password
        ),
      [
        password,
      ]
    );

  /* ========================================
     PASSWORD CHANGE
  ======================================== */

  const handlePasswordChange = (
    event
  ) => {
    setPassword(
      event.target.value
    );

    setFieldErrors(
      (
        previousErrors
      ) => ({
        ...previousErrors,

        password: "",

        confirm_password: "",
      })
    );

    setFormError("");
  };

  /* ========================================
     CONFIRM PASSWORD CHANGE
  ======================================== */

  const handleConfirmChange = (
    event
  ) => {
    setConfirmPassword(
      event.target.value
    );

    setFieldErrors(
      (
        previousErrors
      ) => ({
        ...previousErrors,

        confirm_password: "",
      })
    );

    setFormError("");
  };

  /* ========================================
     VALIDATE FORM
  ======================================== */

  const validateForm = () => {
    const errors = {};

    if (!password) {
      errors.password =
        "New password is required.";
    }

    if (!confirmPassword) {
      errors.confirm_password =
        "Confirm password is required.";
    } else if (
      password !==
      confirmPassword
    ) {
      errors.confirm_password =
        "Passwords do not match.";
    }

    setFieldErrors(errors);

    return (
      Object.keys(errors)
        .length === 0
    );
  };

  /* ========================================
     RESET PASSWORD

     API:
     POST /reset_password

     Exact body:
     {
       password,
       confirm_password
     }
  ======================================== */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (submitting) {
        return;
      }

      if (!validateForm()) {
        return;
      }

      try {
        setSubmitting(true);
        setFormError("");
        setFieldErrors({});

        const result =
          await resetMemberPassword({
            password,

            confirm_password:
              confirmPassword,
          });

        toast.success(
          result.message ||
            "Password updated successfully."
        );

        navigate(
          result.nextRoute ||
            "/login",
          {
            replace: true,

            state: {
              message:
                result.message ||
                "Password updated successfully. Please login using your new password.",

              prefillId:
                "",
            },
          }
        );
      } catch (
        requestError
      ) {
        const receivedErrors =
          requestError
            ?.fieldErrors ||
          {};

        setFieldErrors(
          receivedErrors
        );

        setFormError(
          getApiErrorMessage(
            requestError,
            "Unable to reset password."
          )
        );
      } finally {
        setSubmitting(false);
      }
    };

  if (!resetEmail) {
    return (
      <Navigate
        to="/forgot_password"
        replace
      />
    );
  }

  return (
    <main className="inmba-reset-page">
      <div className="inmba-reset-shell">
        {/* INFORMATION PANEL */}

        <section className="inmba-reset-information">
          <Link
            to="/"
            className="inmba-reset-brand"
          >
            INMBA
          </Link>

          <div>
            <span className="inmba-reset-info-icon">
              <i
                className="fas fa-lock"
                aria-hidden="true"
              ></i>
            </span>

            <p>
              Final Recovery Step
            </p>

            <h1>
              Create a new secure password
            </h1>

            <span>
              Your OTP has been verified. Enter and confirm the new
              password for your INMBA member account.
            </span>
          </div>

          <ul>
            <li>
              Use a password only you can remember.
            </li>

            <li>
              Avoid using your name, phone number or login ID.
            </li>

            <li>
              Include letters, numbers and a special character.
            </li>
          </ul>
        </section>

        {/* RESET FORM */}

        <section className="inmba-reset-form-panel">
          <div className="inmba-reset-form-card">
            <header>
              <span>
                <i
                  className="fas fa-key"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <p>
                  Password Reset
                </p>

                <h2>
                  Set New Password
                </h2>

                <small>
                  Resetting account registered with {resetEmail}
                </small>
              </div>
            </header>

            {formError && (
              <div
                className="inmba-reset-alert"
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
              {/* NEW PASSWORD */}

              <div className="inmba-reset-form-group">
                <label htmlFor="reset-password">
                  New Password
                </label>

                <div className="inmba-reset-input-shell">
                  <i
                    className="fas fa-lock"
                    aria-hidden="true"
                  ></i>

                  <input
                    id="reset-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={
                      handlePasswordChange
                    }
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    disabled={
                      submitting
                    }
                    className={
                      fieldErrors.password
                        ? "inmba-reset-input-error"
                        : ""
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (
                          previousValue
                        ) =>
                          !previousValue
                      )
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

                {fieldErrors.password && (
                  <small className="inmba-reset-field-error">
                    {Array.isArray(
                      fieldErrors.password
                    )
                      ? fieldErrors
                          .password[0]
                      : fieldErrors.password}
                  </small>
                )}

                {password && (
                  <div className="inmba-reset-strength">
                    <div>
                      {[1, 2, 3, 4, 5].map(
                        (
                          currentScore
                        ) => (
                          <span
                            key={
                              currentScore
                            }
                            className={
                              currentScore <=
                              passwordStrength.score
                                ? passwordStrength.className
                                : ""
                            }
                          ></span>
                        )
                      )}
                    </div>

                    <strong>
                      {
                        passwordStrength.label
                      }
                    </strong>
                  </div>
                )}
              </div>

              {/* CONFIRM PASSWORD */}

              <div className="inmba-reset-form-group">
                <label htmlFor="reset-confirm-password">
                  Confirm Password
                </label>

                <div className="inmba-reset-input-shell">
                  <i
                    className="fas fa-shield-halved"
                    aria-hidden="true"
                  ></i>

                  <input
                    id="reset-confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      confirmPassword
                    }
                    onChange={
                      handleConfirmChange
                    }
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    disabled={
                      submitting
                    }
                    className={
                      fieldErrors.confirm_password
                        ? "inmba-reset-input-error"
                        : ""
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (
                          previousValue
                        ) =>
                          !previousValue
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    <i
                      className={
                        showConfirmPassword
                          ? "fas fa-eye-slash"
                          : "fas fa-eye"
                      }
                      aria-hidden="true"
                    ></i>
                  </button>
                </div>

                {fieldErrors.confirm_password && (
                  <small className="inmba-reset-field-error">
                    {Array.isArray(
                      fieldErrors.confirm_password
                    )
                      ? fieldErrors
                          .confirm_password[0]
                      : fieldErrors.confirm_password}
                  </small>
                )}

                {password &&
                  confirmPassword &&
                  password ===
                    confirmPassword && (
                    <small className="inmba-reset-match-success">
                      <i
                        className="fas fa-circle-check"
                        aria-hidden="true"
                      ></i>

                      Passwords match
                    </small>
                  )}
              </div>

              <button
                type="submit"
                className="inmba-reset-submit"
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

                    Updating Password...
                  </>
                ) : (
                  <>
                    Update Password

                    <i
                      className="fas fa-arrow-right"
                      aria-hidden="true"
                    ></i>
                  </>
                )}
              </button>
            </form>

            <div className="inmba-reset-back">
              <Link to="/login">
                <i
                  className="fas fa-arrow-left"
                  aria-hidden="true"
                ></i>

                Back to Member Login
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}