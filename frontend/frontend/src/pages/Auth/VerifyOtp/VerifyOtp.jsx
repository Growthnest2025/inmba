import React, {
  useEffect,
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
  normalizeOtp,
  requestPasswordReset,
  validateOtp,
  verifyPasswordResetOtp,
} from "../../../services/passwordReset.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./VerifyOtp.css";

/* ========================================
   OTP VALIDITY

   Original backend validity:
   5 minutes.
======================================== */

const OTP_VALIDITY_SECONDS =
  5 * 60;

const RESEND_COOLDOWN_SECONDS =
  60;

/* ========================================
   TIME FORMATTER
======================================== */

const formatRemainingTime = (
  totalSeconds
) => {
  const safeSeconds =
    Math.max(
      0,
      Number(totalSeconds) || 0
    );

  const minutes =
    Math.floor(
      safeSeconds / 60
    );

  const seconds =
    safeSeconds % 60;

  return `${String(
    minutes
  ).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
};

/* ========================================
   MASK EMAIL
======================================== */

const maskEmail = (
  email
) => {
  const normalizedEmail =
    String(email || "").trim();

  const [
    localPart,
    domain,
  ] =
    normalizedEmail.split("@");

  if (
    !localPart ||
    !domain
  ) {
    return normalizedEmail;
  }

  const visiblePart =
    localPart.slice(0, 2);

  const hiddenCount =
    Math.max(
      localPart.length - 2,
      3
    );

  return `${visiblePart}${"*".repeat(
    hiddenCount
  )}@${domain}`;
};

/* ========================================
   VERIFY OTP PAGE
======================================== */

export default function VerifyOtp() {
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
    otp,
    setOtp,
  ] =
    useState("");

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

  const [
    resending,
    setResending,
  ] =
    useState(false);

  const [
    expiresIn,
    setExpiresIn,
  ] =
    useState(
      OTP_VALIDITY_SECONDS
    );

  const [
    resendCooldown,
    setResendCooldown,
  ] =
    useState(
      RESEND_COOLDOWN_SECONDS
    );

  /* ========================================
     OTP EXPIRY TIMER
  ======================================== */

  useEffect(() => {
    if (expiresIn <= 0) {
      return undefined;
    }

    const timer =
      window.setInterval(
        () => {
          setExpiresIn(
            (
              previousValue
            ) =>
              Math.max(
                0,
                previousValue - 1
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
  }, [expiresIn]);

  /* ========================================
     RESEND COOLDOWN TIMER
  ======================================== */

  useEffect(() => {
    if (
      resendCooldown <= 0
    ) {
      return undefined;
    }

    const timer =
      window.setInterval(
        () => {
          setResendCooldown(
            (
              previousValue
            ) =>
              Math.max(
                0,
                previousValue - 1
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
  }, [resendCooldown]);

  /* ========================================
     OTP CHANGE
  ======================================== */

  const handleOtpChange = (
    event
  ) => {
    setOtp(
      normalizeOtp(
        event.target.value
      )
    );

    setFieldError("");
    setFormError("");
  };

  /* ========================================
     VERIFY OTP

     API:
     POST /verify_otp

     Body:
     {
       otp
     }
  ======================================== */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (submitting) {
        return;
      }

      if (expiresIn <= 0) {
        setFormError(
          "OTP has expired. Please request a new OTP."
        );

        return;
      }

      const validation =
        validateOtp(otp);

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
          await verifyPasswordResetOtp(
            validation.value
          );

        toast.success(
          result.message ||
            "OTP verified successfully."
        );

        navigate(
          result.nextRoute ||
            "/reset_password",
          {
            state: {
              email:
                resetEmail,

              otpVerified:
                true,

              message:
                result.message ||
                "OTP verified successfully.",
            },
          }
        );
      } catch (
        requestError
      ) {
        const otpError =
          requestError
            ?.fieldErrors
            ?.otp;

        if (otpError) {
          setFieldError(
            Array.isArray(
              otpError
            )
              ? otpError[0]
              : String(otpError)
          );
        }

        setFormError(
          getApiErrorMessage(
            requestError,
            "Unable to verify OTP."
          )
        );
      } finally {
        setSubmitting(false);
      }
    };

  /* ========================================
     RESEND OTP

     Same exact forgot password API:

     POST /forgot_password
     {
       email
     }
  ======================================== */

  const handleResendOtp =
    async () => {
      if (
        resending ||
        resendCooldown > 0
      ) {
        return;
      }

      try {
        setResending(true);
        setFieldError("");
        setFormError("");

        const result =
          await requestPasswordReset(
            resetEmail
          );

        setOtp("");

        setExpiresIn(
          Number(
            result.expiresIn
          ) ||
            OTP_VALIDITY_SECONDS
        );

        setResendCooldown(
          RESEND_COOLDOWN_SECONDS
        );

        toast.success(
          result.message ||
            "A new OTP has been sent."
        );
      } catch (
        requestError
      ) {
        setFormError(
          getApiErrorMessage(
            requestError,
            "Unable to resend OTP."
          )
        );
      } finally {
        setResending(false);
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
    <main className="inmba-otp-page">
      <div className="inmba-otp-card">
        <Link
          to="/"
          className="inmba-otp-brand"
        >
          INMBA
        </Link>

        <span className="inmba-otp-main-icon">
          <i
            className="fas fa-envelope-open-text"
            aria-hidden="true"
          ></i>
        </span>

        <p className="inmba-otp-eyebrow">
          Email Verification
        </p>

        <h1>
          Enter Verification OTP
        </h1>

        <p className="inmba-otp-description">
          We sent a 6-digit verification OTP to
        </p>

        <strong className="inmba-otp-email">
          {maskEmail(
            resetEmail
          )}
        </strong>

        <div
          className={`inmba-otp-timer ${
            expiresIn <= 60
              ? "inmba-otp-timer-warning"
              : ""
          }`}
        >
          <i
            className="fas fa-clock"
            aria-hidden="true"
          ></i>

          {expiresIn > 0 ? (
            <span>
              OTP expires in{" "}
              <strong>
                {formatRemainingTime(
                  expiresIn
                )}
              </strong>
            </span>
          ) : (
            <span>
              OTP expired
            </span>
          )}
        </div>

        {formError && (
          <div
            className="inmba-otp-alert"
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
          <div className="inmba-otp-form-group">
            <label htmlFor="otp-code">
              6-Digit OTP
            </label>

            <input
              id="otp-code"
              type="text"
              value={otp}
              onChange={
                handleOtpChange
              }
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              disabled={
                submitting
              }
              className={
                fieldError
                  ? "inmba-otp-input-error"
                  : ""
              }
            />

            {fieldError && (
              <small>
                {fieldError}
              </small>
            )}
          </div>

          <button
            type="submit"
            className="inmba-otp-submit"
            disabled={
              submitting ||
              expiresIn <= 0
            }
          >
            {submitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  aria-hidden="true"
                ></span>

                Verifying OTP...
              </>
            ) : (
              <>
                Verify OTP

                <i
                  className="fas fa-arrow-right"
                  aria-hidden="true"
                ></i>
              </>
            )}
          </button>
        </form>

        <div className="inmba-otp-resend">
          <span>
            Did not receive the OTP?
          </span>

          <button
            type="button"
            onClick={
              handleResendOtp
            }
            disabled={
              resending ||
              resendCooldown > 0
            }
          >
            {resending
              ? "Sending..."
              : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : "Resend OTP"}
          </button>
        </div>

        <div className="inmba-otp-actions">
          <Link to="/forgot_password">
            <i
              className="fas fa-arrow-left"
              aria-hidden="true"
            ></i>

            Change Email
          </Link>

          <Link to="/login">
            Member Login
          </Link>
        </div>

        <div className="inmba-otp-security">
          <i
            className="fas fa-shield-halved"
            aria-hidden="true"
          ></i>

          <span>
            Never share your OTP with anyone.
          </span>
        </div>
      </div>
    </main>
  );
}