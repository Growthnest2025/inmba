import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "../../../api/api";

import {
  useAuth,
} from "../../../context/AuthContext";

import {
  getStoredRegistrationResult,
} from "../../../services/registration.service";

import "./KycSubmitted.css";
import { toText, asObject } from "../../../utils/commonHelpers";

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   COMPONENT
========================================================= */

export default function KycSubmitted() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    clearMemberSession,
  } =
    useAuth();

  const [
    copied,
    setCopied,
  ] =
    useState(false);

  const [
    continuing,
    setContinuing,
  ] =
    useState(false);

  /* =======================================================
     REGISTRATION RESULT
  ======================================================= */

  const registrationResult =
    useMemo(
      () => {
        const state =
          asObject(
            location.state
          );

        const navigationResult =
          asObject(
            state.registrationResult
          );

        if (
          Object.keys(
            navigationResult
          ).length >
          0
        ) {
          return navigationResult;
        }

        const legacyResult =
          asObject(
            state.registration
          );

        if (
          Object.keys(
            legacyResult
          ).length >
          0
        ) {
          return legacyResult;
        }

        return asObject(
          getStoredRegistrationResult()
        );
      },
      [
        location.state,
      ]
    );

  /* =======================================================
     LOGIN ID
  ======================================================= */

  const loginId =
    useMemo(
      () => {
        const state =
          asObject(
            location.state
          );

        const member =
          asObject(
            registrationResult.member
          );

        return toText(
          state.loginId ??
            registrationResult.loginId ??
            registrationResult.login_id ??
            member.login_id
        );
      },
      [
        location.state,
        registrationResult,
      ]
    );

  /* =======================================================
     COPY RESET
  ======================================================= */

  useEffect(
    () => {
      if (!copied) {
        return undefined;
      }

      const timer =
        window.setTimeout(
          () => {
            setCopied(false);
          },
          1800
        );

      return () => {
        window.clearTimeout(
          timer
        );
      };
    },
    [
      copied,
    ]
  );

  /* =======================================================
     COPY LOGIN ID
  ======================================================= */

  const handleCopyLoginId =
    async () => {
      if (!loginId) {
        return;
      }

      try {
        await navigator
          .clipboard
          .writeText(
            loginId
          );

        setCopied(true);
      } catch {
        setCopied(false);
      }
    };

  /* =======================================================
     CONTINUE TO CIVILIAN LOGIN

     REQUIRED NEW FLOW:

     Registration
       ↓
     Success
       ↓
     Clear previous member session
       ↓
     /login/civilian
       ↓
     fromNewRegistration = true
       ↓
     Login Success
       ↓
     /civilian-membership-plan
  ======================================================= */

  const handleContinueToDashboard =
    async () => {
      if (
        continuing
      ) {
        return;
      }

      try {
        setContinuing(true);

        /*
          ===============================================
          CLEAR PREVIOUS BACKEND SESSION

          Previous member session இருந்தால்
          GuestRoute direct login page-ஐ block
          பண்ணலாம்.

          அதனால் backend logout first.
          ===============================================
        */

        try {
          await api.post(
            "/logout",
            {},
            {
              skipSessionExpiredHandling:
                true,
            }
          );
        } catch (
          logoutError
        ) {
          /*
            Already logged out / no session
            இருந்தாலும் next navigation continue
            ஆக வேண்டும்.
          */

          console.warn(
            "Previous session logout:",
            logoutError
          );
        }

        /*
          ===============================================
          CLEAR REACT AUTH CONTEXT

          Backend logout மட்டும் இல்லாமல்
          frontend auth state-யும் clear
          ஆக வேண்டும்.
          ===============================================
        */

        if (
          typeof clearMemberSession ===
          "function"
        ) {
          clearMemberSession();
        }

        /*
          ===============================================
          OPEN DIRECT CIVILIAN LOGIN

          IMPORTANT:

          fromNewRegistration: true

          இதை Login.jsx check பண்ணி:

          Fresh registration:
            Login -> Membership Plan

          Existing normal login:
            Login -> Dashboard

          என்று decide பண்ணும்.
          ===============================================
        */

        navigate(
          "/login/civilian",
          {
            replace:
              false,

            state: {
              prefillId:
                loginId,

              message:
                "Registration successful. Login to continue with your Civilian membership plan.",

              membershipType:
                "Civilian Member",

              fromCivilianRegistration:
                true,

              fromNewRegistration:
                true,
            },
          }
        );
      } finally {
        setContinuing(false);
      }
    };

  /* =======================================================
     OPEN HOME
  ======================================================= */

  const handleOpenHome =
    () => {
      navigate("/");
    };

  /* =======================================================
     NO LOGIN ID
  ======================================================= */

  if (!loginId) {
    return (
      <main className="pro-success-page">

        <section className="pro-success-card pro-success-error-card">

          <div className="pro-success-warning-icon">
            <i className="fas fa-circle-exclamation" />
          </div>

          <h1>
            Registration Details
            Not Found
          </h1>

          <p>
            Please complete
            Civilian Membership
            registration first.
          </p>

          <button
            type="button"
            className="pro-success-primary"
            onClick={() =>
              navigate(
                "/membership/civilian"
              )
            }
          >
            Back to Registration
          </button>

          <button
            type="button"
            className="pro-success-secondary"
            onClick={
              handleOpenHome
            }
          >
            Open Home
          </button>

        </section>

      </main>
    );
  }

  /* =======================================================
     MAIN SUCCESS PAGE
  ======================================================= */

  return (
    <main className="pro-success-page">

      <div className="pro-success-background-shape pro-success-shape-one" />

      <div className="pro-success-background-shape pro-success-shape-two" />

      <div className="pro-success-background-shape pro-success-shape-three" />

      <section className="pro-success-card">

        {/* ===============================================
            SUCCESS ICON
        =============================================== */}

        <div className="pro-success-icon-area">

          <div className="pro-success-icon-ring">

            <div className="pro-success-icon">
              <i className="fas fa-check" />
            </div>

          </div>

        </div>

        {/* ===============================================
            HEADING
        =============================================== */}

        <div className="pro-success-heading">

          <h1>
            Registration Successful!
          </h1>

          <p>
            Your Civilian
            Member Login ID
          </p>

        </div>

        {/* ===============================================
            LOGIN ID
        =============================================== */}

        <div className="pro-success-login-id-section">

          <div className="pro-success-login-id-box">

            <strong>
              {loginId}
            </strong>

            <button
              type="button"
              className="pro-success-copy-button"
              onClick={
                handleCopyLoginId
              }
              title="Copy Login ID"
              aria-label="Copy Login ID"
            >

              <i
                className={
                  copied
                    ? "fas fa-check"
                    : "far fa-copy"
                }
              />

            </button>

          </div>

          <p>
            {copied
              ? "Login ID copied successfully."
              : "Please keep your Login ID safe. You will need it to login to your Civilian Member account."}
          </p>

        </div>

        {/* ===============================================
            STATUS
        =============================================== */}

        <div className="pro-success-status-list">

          <div className="pro-success-status completed">

            <span className="pro-success-status-icon">
              <i className="fas fa-check" />
            </span>

            <div>

              <strong>
                Civilian Account
                Created
              </strong>

              <small>
                Your basic registration
                has been completed.
              </small>

            </div>

          </div>

          <div className="pro-success-status pending">

            <span className="pro-success-status-icon">
              <i className="fas fa-lock" />
            </span>

            <div>

              <strong>
                Membership Plan Pending
              </strong>

              <small>
                Login with your ID and
                Password / PIN, then choose
                your ₹300 or ₹1500 plan.
              </small>

            </div>

          </div>

        </div>

        {/* ===============================================
            ACTION BUTTONS
        =============================================== */}

        <div className="pro-success-actions">

          <button
            type="button"
            className="pro-success-primary"
            onClick={
              handleContinueToDashboard
            }
            disabled={
              continuing
            }
          >

            {continuing ? (
              <>
                <i className="fas fa-circle-notch fa-spin" />

                <span>
                  Opening Login...
                </span>
              </>
            ) : (
              <>
                <span>
                  Go to Login
                </span>

                <i className="fas fa-arrow-right" />
              </>
            )}

          </button>

          <button
            type="button"
            className="pro-success-secondary"
            onClick={
              handleOpenHome
            }
            disabled={
              continuing
            }
          >

            <i className="fas fa-house" />

            <span>
              Open Home
            </span>

          </button>

        </div>

        {/* ===============================================
            FLOW INFO
        =============================================== */}

        <div className="pro-success-footer">

          <i className="fas fa-shield-halved" />

          <span>
            Login → Choose Membership Plan
            → Full KYC → Payment → Admin Approval
          </span>

        </div>

      </section>

    </main>
  );
}