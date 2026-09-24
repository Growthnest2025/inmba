import React, {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "@fortawesome/fontawesome-free/css/all.min.css";
import "./ProfessionalRegistrationSuccess.css";

/* =========================================================
   HELPER
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const text =
    String(
      value ?? ""
    ).trim();

  return text || fallback;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ProfessionalRegistrationSuccess() {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const state =
    location.state ||
    {};

  const registration =
    state.registration ||
    {};

  /* =======================================================
     LOGIN ID

     SUPPORTS:
     - flat route state
     - nested registration state
     - backend result
     - member object
     - sessionStorage
  ======================================================= */

  const getLoginId =
    () => {
      return toText(
        state.loginId ??
          state.login_id ??
          state.generatedLoginId ??

          registration.loginId ??
          registration.login_id ??
          registration.generatedLoginId ??

          registration.member?.login_id ??
          registration.member?.loginId ??

          registration.data?.loginId ??
          registration.data?.login_id ??
          registration.data?.member?.login_id ??

          sessionStorage.getItem(
            "professional_registration_login_id"
          ) ??

          sessionStorage.getItem(
            "inmba_professional_login_id"
          ) ??

          sessionStorage.getItem(
            "inmba_existing_professional_login_id"
          )
      );
    };

  const [
    loginId,
    setLoginId,
  ] =
    useState(
      getLoginId
    );

  /* =======================================================
     ACCOUNT EXISTS
  ======================================================= */

  const accountExists =
    Boolean(
      state.accountExists ??
        registration.accountExists ??
        false
    );

  /* =======================================================
     LOAD / SAVE LOGIN ID
  ======================================================= */

  useEffect(
    () => {
      const resolvedLoginId =
        getLoginId();

      if (
        resolvedLoginId
      ) {
        setLoginId(
          resolvedLoginId
        );

        sessionStorage.setItem(
          "inmba_professional_login_id",
          resolvedLoginId
        );

        sessionStorage.setItem(
          "professional_registration_login_id",
          resolvedLoginId
        );

        if (
          accountExists
        ) {
          sessionStorage.setItem(
            "inmba_existing_professional_login_id",
            resolvedLoginId
          );
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      location.state,
    ]
  );

  /* =======================================================
     COPY LOGIN ID
  ======================================================= */

  const handleCopyLoginId =
    async () => {
      if (
        !loginId
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          loginId
        );

        window.alert(
          "Professional Login ID copied successfully."
        );
      } catch {
        window.alert(
          `Your Professional Login ID is ${loginId}`
        );
      }
    };

  /* =======================================================
     CONTINUE TO PROFESSIONAL LOGIN
  ======================================================= */

  const handleContinue =
    () => {
      const finalLoginId =
        toText(
          loginId ??
            sessionStorage.getItem(
              "professional_registration_login_id"
            ) ??
            sessionStorage.getItem(
              "inmba_professional_login_id"
            )
        );

      const targetUrl =
        finalLoginId
          ? `/professional-login?loginId=${encodeURIComponent(
              finalLoginId
            )}`
          : "/professional-login";

      navigate(
        targetUrl,
        {
          replace:
            true,

          state: {
            loginId:
              finalLoginId,

            login_id:
              finalLoginId,

            prefillId:
              finalLoginId,

            registrationSuccess:
              true,

            accountExists,

            membershipType:
              "Professional Member",

            nextPath:
              "/professional-membership",

            message:
              "Professional registration completed successfully. Please login to continue to Membership Plan selection.",

            from:
              "professional-registration-success",
          },
        }
      );
    };

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <main className="pro-success-page">
      <div className="pro-success-bg-shape pro-success-bg-shape-one" />

      <div className="pro-success-bg-shape pro-success-bg-shape-two" />

      <section className="pro-success-card">

        {/* BRAND */}

        <div className="pro-success-brand">
          <div className="pro-success-brand-icon">
            <i className="fas fa-user-tie" />
          </div>

          <div>
            <span>
              INMBA
            </span>

            <strong>
              Professional
            </strong>
          </div>
        </div>

        {/* SUCCESS ICON */}

        <div className="pro-success-icon-wrap">
          <div className="pro-success-icon">
            <i className="fas fa-check" />
          </div>
        </div>

        {/* BADGE */}

        <span className="pro-success-badge">
          {accountExists
            ? "PROFESSIONAL ACCOUNT FOUND"
            : "REGISTRATION SUCCESSFUL"}
        </span>

        {/* TITLE */}

        <h1>
          {accountExists
            ? "Professional Account Found"
            : "Professional Account Created Successfully"}
        </h1>

        {/* DESCRIPTION */}

        <p className="pro-success-description">
          {accountExists
            ? "Your Professional account already exists. Please save your Professional Login ID and continue to login."
            : "Your Professional Basic KYC has been completed successfully. Please save your generated Professional Login ID and use it to login."}
        </p>

        {/* LOGIN ID CARD */}

        <div className="pro-success-login-card">
          <span>
            Your Professional Login ID
          </span>

          {loginId ? (
            <>
              <strong>
                {loginId}
              </strong>

              <button
                type="button"
                className="pro-success-copy"
                onClick={
                  handleCopyLoginId
                }
              >
                <i className="far fa-copy" />

                <span>
                  Copy Login ID
                </span>
              </button>
            </>
          ) : (
            <div className="pro-success-missing">
              <i className="fas fa-circle-exclamation" />

              <span>
                Login ID could not be loaded.
                Please try the registration again
                or continue to Professional Login.
              </span>
            </div>
          )}
        </div>

        {/* SECURITY NOTE */}

        <div className="pro-success-note">
          <i className="fas fa-shield-halved" />

          <div>
            <strong>
              Keep your Login ID safe
            </strong>

            <p>
              You will need this Login ID every
              time you access your Professional
              account.
            </p>
          </div>
        </div>

        {/* FLOW */}

        <div className="pro-success-flow">

          <div className="active">
            <span>
              1
            </span>

            <p>
              Basic KYC
            </p>
          </div>

          <i className="fas fa-angle-right" />

          <div>
            <span>
              2
            </span>

            <p>
              Login
            </p>
          </div>

          <i className="fas fa-angle-right" />

          <div>
            <span>
              3
            </span>

            <p>
              Membership
            </p>
          </div>

        </div>

        {/* CONTINUE */}

        <button
          type="button"
          className="pro-success-continue"
          onClick={
            handleContinue
          }
        >
          <span>
            Continue to Professional Login
          </span>

          <i className="fas fa-arrow-right" />
        </button>

        {/* HOME */}

        <button
          type="button"
          className="pro-success-home"
          onClick={() =>
            navigate("/")
          }
        >
          <i className="fas fa-house" />

          Back to Home
        </button>

      </section>
    </main>
  );
}