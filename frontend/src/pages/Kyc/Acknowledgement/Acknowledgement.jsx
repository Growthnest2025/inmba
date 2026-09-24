import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import "@fortawesome/fontawesome-free/css/all.min.css";

import {
  getAcknowledgementDetails,
} from "../../../services/kyc.service";

import "./Acknowledgement.css";


/* =========================================================
   CONSTANTS
========================================================= */

const BASIC_MEMBERSHIP_AMOUNT = 300;
const PROFILE_UPGRADE_AMOUNT = 1500;

const PAYMENT_RESULT_STORAGE_KEY =
  "inmba_professional_payment_result";

const PAYMENT_STATUS_STORAGE_KEY =
  "inmba_professional_payment_status";

const KYC_STATUS_STORAGE_KEY =
  "inmba_professional_kyc_status";

const NEXT_ROUTE_STORAGE_KEY =
  "inmba_professional_next_route";


/* =========================================================
   HELPERS
========================================================= */

const asObject = (value) => {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
};


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


const safeParse = (
  value
) => {
  try {
    return JSON.parse(
      value
    );
  } catch {
    return null;
  }
};


const isTrueValue = (
  value
) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
};


const formatDate = (
  value
) => {
  if (!value) {
    return new Date()
      .toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      );
  }

  const normalized =
    typeof value === "string"
      ? value.replace(
          " ",
          "T"
        )
      : value;

  const date =
    new Date(
      normalized
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return toText(
      value,
      "—"
    );
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
};


const getErrorText = (
  error,
  fallback
) => {
  return (
    error?.apiMessage ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};


const extractAcknowledgement = (
  result
) => {
  const source =
    asObject(
      result
    );

  const data =
    asObject(
      source.data
    );

  const response =
    asObject(
      source.response
    );

  const responseData =
    asObject(
      response.data
    );

  return asObject(
    data.acknowledgement ||
    source.acknowledgement ||
    responseData.acknowledgement ||
    response.acknowledgement ||
    data
  );
};


const extractMember = (
  result
) => {
  const source =
    asObject(
      result
    );

  const data =
    asObject(
      source.data
    );

  const acknowledgement =
    extractAcknowledgement(
      result
    );

  return asObject(
    acknowledgement.member ||
    source.member ||
    data.member ||
    data.user ||
    data.profile ||
    data.kyc_member ||
    data.kycMember
  );
};


const isSubmittedPaymentStatus = (
  value
) => {
  const status =
    toText(
      value
    )
      .trim()
      .toLowerCase();

  return [
    "pending",
    "submitted",
    "approved",
    "paid",
    "success",
    "completed",
  ].includes(
    status
  );
};


/* =========================================================
   COMPONENT
========================================================= */

export default function Acknowledgement() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    token,
  } =
    useParams();


  const acknowledgementToken =
    toText(
      token
    );


  /* =======================================================
     LOCAL PREVIEW
  ======================================================= */

  const isPreviewMode =
    useMemo(
      () => {
        const params =
          new URLSearchParams(
            location.search
          );

        const requested =
          params.get(
            "preview"
          ) === "1";

        const hostname =
          window.location.hostname;

        const localEnvironment =
          hostname === "localhost" ||
          hostname === "127.0.0.1";

        return (
          requested &&
          localEnvironment
        );
      },
      [
        location.search,
      ]
    );


  /* =======================================================
     STORED PAYMENT
  ======================================================= */

  const storedPaymentResult =
    useMemo(
      () => {
        const stored =
          sessionStorage.getItem(
            PAYMENT_RESULT_STORAGE_KEY
          );

        return asObject(
          safeParse(
            stored
          )
        );
      },
      []
    );


  const paymentDetails =
    useMemo(
      () => ({
        ...storedPaymentResult,
        ...asObject(
          location.state
        ),
      }),
      [
        storedPaymentResult,
        location.state,
      ]
    );


  const paymentToken =
    toText(
      paymentDetails.token
    );


  const paymentTokenMatches =
    Boolean(
      paymentToken &&
      acknowledgementToken &&
      paymentToken ===
        acknowledgementToken
    );


  const paymentSuccess =
    isTrueValue(
      paymentDetails.success
    ) ||
    isTrueValue(
      paymentDetails.paymentSubmitted
    ) ||
    sessionStorage.getItem(
      PAYMENT_STATUS_STORAGE_KEY
    ) === "submitted";


  const storedPaymentStatus =
    toText(
      paymentDetails.paymentStatus ||
      sessionStorage.getItem(
        PAYMENT_STATUS_STORAGE_KEY
      )
    );


  const paymentGatePassed =
    isPreviewMode ||
    (
      paymentTokenMatches &&
      paymentSuccess &&
      isSubmittedPaymentStatus(
        storedPaymentStatus
      )
    );


  /* =======================================================
     PLAN
  ======================================================= */

  const professionalFlow =
    toText(
      paymentDetails.professionalFlow
    )
      .trim()
      .toLowerCase();


  const planId =
    toText(
      paymentDetails.planId
    )
      .trim()
      .toLowerCase();


  const isProfileUpgrade =
    isPreviewMode ||
    professionalFlow ===
      "profile_upgrade" ||
    planId ===
      "profile_upgrade";


  const planName =
    isProfileUpgrade
      ? "Profile Upgrade"
      : toText(
          paymentDetails.planName,
          "Basic Membership"
        );


  const paymentAmount =
    isProfileUpgrade
      ? PROFILE_UPGRADE_AMOUNT
      : Number(
          paymentDetails.amount ||
          BASIC_MEMBERSHIP_AMOUNT
        );


  /* =======================================================
     STATE
  ======================================================= */

  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    acknowledgement,
    setAcknowledgement,
  ] =
    useState({});


  const [
    member,
    setMember,
  ] =
    useState({});


  /* =======================================================
     LOAD
  ======================================================= */

  const loadAcknowledgement =
    useCallback(
      async (
        signal
      ) => {
        if (
          !acknowledgementToken
        ) {
          setError(
            "Acknowledgement token is missing."
          );

          setLoading(
            false
          );

          return;
        }


        if (
          !paymentGatePassed
        ) {
          setLoading(
            false
          );

          return;
        }


        setLoading(
          true
        );

        setError(
          ""
        );


        try {
          const result =
            await getAcknowledgementDetails(
              acknowledgementToken,
              {
                signal,
              }
            );


          setAcknowledgement(
            extractAcknowledgement(
              result
            )
          );


          setMember(
            extractMember(
              result
            )
          );
        } catch (
          loadError
        ) {
          if (
            loadError?.name ===
              "CanceledError" ||
            loadError?.name ===
              "AbortError"
          ) {
            return;
          }


          setError(
            getErrorText(
              loadError,
              "Unable to load acknowledgement."
            )
          );
        } finally {
          if (
            !signal?.aborted
          ) {
            setLoading(
              false
            );
          }
        }
      },
      [
        acknowledgementToken,
        paymentGatePassed,
      ]
    );


  useEffect(
    () => {
      const controller =
        new AbortController();


      loadAcknowledgement(
        controller.signal
      );


      return () => {
        controller.abort();
      };
    },
    [
      loadAcknowledgement,
    ]
  );


  /* =======================================================
     DISPLAY DATA
  ======================================================= */

  const loginId =
    toText(
      member.login_id ||
      paymentDetails.loginId,
      "INMBA Member"
    );


  const acknowledgementNumber =
    toText(
      acknowledgement
        .acknowledgement_number,
      loginId !==
        "INMBA Member"
        ? `INMBA-ACK-${loginId}`
        : "INMBA-PRO-KYC-SUBMITTED"
    );


  const membershipType =
    toText(
      member.membership_type ||
      paymentDetails.membershipType,
      "Professional Member"
    );


  const kycStatus =
    toText(
      paymentDetails.kycStatus ||
      member.professional_kyc_status ||
      sessionStorage.getItem(
        KYC_STATUS_STORAGE_KEY
      ),
      isProfileUpgrade
        ? "submitted"
        : "completed"
    );


  const submittedDate =
    formatDate(
      paymentDetails.submittedAt ||
      member.professional_kyc_submitted_at ||
      member.updated_at ||
      member.created_at
    );


  /* =======================================================
     ACTIONS
  ======================================================= */

  const handleDashboard =
    () => {
      sessionStorage.setItem(
        NEXT_ROUTE_STORAGE_KEY,
        "/professional-dashboard"
      );

      navigate(
        "/professional-dashboard"
      );
    };


  const handleProfile =
    () => {
      navigate(
        "/professional-profile"
      );
    };


  const handleGoPayment =
    () => {
      sessionStorage.setItem(
        NEXT_ROUTE_STORAGE_KEY,
        "/professional-payment"
      );

      navigate(
        "/professional-payment"
      );
    };


  const handlePrint =
    () => {
      window.print();
    };


  /* =======================================================
     PAYMENT REQUIRED
  ======================================================= */

  if (
    !paymentGatePassed
  ) {
    return (
      <main className="professional-ack-loading-page">

        <section className="professional-ack-error-card">

          <div className="professional-ack-error-icon">
            <i className="fa-solid fa-lock" />
          </div>


          <h2>
            Payment Required
          </h2>


          <p>
            Complete the Professional
            membership payment before
            viewing your acknowledgement.
          </p>


          <div className="professional-ack-error-actions">

            <button
              type="button"
              onClick={
                handleGoPayment
              }
            >
              <i className="fa-solid fa-credit-card" />

              Go To Payment
            </button>


            <button
              type="button"
              className="secondary"
              onClick={
                handleDashboard
              }
            >
              Dashboard
            </button>

          </div>

        </section>

      </main>
    );
  }


  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <main className="professional-ack-loading-page">

        <section className="professional-ack-loading-card">

          <div className="professional-ack-spinner" />

          <h2>
            Preparing Acknowledgement
          </h2>

          <p>
            Please wait while we confirm
            your Professional membership
            submission.
          </p>

        </section>

      </main>
    );
  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error
  ) {
    return (
      <main className="professional-ack-loading-page">

        <section className="professional-ack-error-card">

          <div className="professional-ack-error-icon">
            <i className="fa-solid fa-triangle-exclamation" />
          </div>


          <h2>
            Unable to Load Acknowledgement
          </h2>


          <p>
            {error}
          </p>


          <div className="professional-ack-error-actions">

            <button
              type="button"
              onClick={() =>
                loadAcknowledgement()
              }
            >
              <i className="fa-solid fa-rotate-right" />

              Try Again
            </button>


            <button
              type="button"
              className="secondary"
              onClick={
                handleDashboard
              }
            >
              Dashboard
            </button>

          </div>

        </section>

      </main>
    );
  }


  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="professional-ack-page">

      <div className="professional-ack-container">


        {/* ============================================
            SUCCESS
        ============================================ */}

        <section className="professional-ack-success-card">

          <div className="professional-ack-success-icon">
            <i className="fa-solid fa-check" />
          </div>


          <span className="professional-ack-success-label">
            INMBA PROFESSIONAL MEMBERSHIP
          </span>


          <h2>
            KYC Submitted Successfully
          </h2>


          <p>
            Thank you. Your Professional
            Membership KYC and payment
            submission have been received
            successfully by INMBA.
          </p>


          <div className="professional-ack-status-pill">
            <i className="fa-solid fa-circle-check" />

            Submitted
          </div>

        </section>


        {/* ============================================
            ACCEPTED CARD
        ============================================ */}

        <section className="professional-ack-document">

          <div className="professional-ack-document-header">

            <div>
              <div className="professional-ack-document-logo">
                INMBA
              </div>

              <div>
                <h2>
                  Submission Accepted
                </h2>

                <p>
                  Professional Membership
                  Acknowledgement
                </p>
              </div>
            </div>

          </div>


          <div className="professional-ack-number-box">

            <span>
              Acknowledgement Number
            </span>

            <strong>
              {acknowledgementNumber}
            </strong>

          </div>


          <div className="professional-ack-grid">

            <div className="professional-ack-item">
              <span>
                Login ID
              </span>

              <strong>
                {loginId}
              </strong>
            </div>


            <div className="professional-ack-item">
              <span>
                Membership Type
              </span>

              <strong>
                {membershipType}
              </strong>
            </div>


            <div className="professional-ack-item">
              <span>
                Membership Plan
              </span>

              <strong>
                {planName}
              </strong>
            </div>


            <div className="professional-ack-item">
              <span>
                Payment Amount
              </span>

              <strong className="professional-ack-amount">
                ₹{paymentAmount}
              </strong>
            </div>


            <div className="professional-ack-item">
              <span>
                KYC Status
              </span>

              <strong>
                {kycStatus
                  .replace(
                    /_/g,
                    " "
                  )
                  .toUpperCase()}
              </strong>
            </div>


            <div className="professional-ack-item">
              <span>
                Submitted Date
              </span>

              <strong>
                {submittedDate}
              </strong>
            </div>

          </div>


          <div className="professional-ack-notice">

            <div>
              <i className="fa-solid fa-circle-info" />
            </div>

            <div>
              <strong>
                Submitted for Verification
              </strong>

              <p>
                Your Professional KYC has
                been received successfully.
                INMBA will review the
                submitted information as
                part of the verification
                process.
              </p>
            </div>

          </div>


          <div className="professional-ack-document-footer">

            <div>
              <i className="fa-solid fa-lock" />

              <span>
                Secure INMBA Professional
                Membership Submission
              </span>
            </div>

            <span>
              Login ID:{" "}
              {loginId}
            </span>

          </div>

        </section>


        {/* ============================================
            ACTIONS
        ============================================ */}

        <section className="professional-ack-actions">

          <button
            type="button"
            className="professional-ack-download-button"
            onClick={
              handleProfile
            }
          >
            <i className="fa-solid fa-user" />

            View My Profile
          </button>


          <button
            type="button"
            className="professional-ack-print-button"
            onClick={
              handlePrint
            }
          >
            <i className="fa-solid fa-print" />

            Print
          </button>


          <button
            type="button"
            className="professional-ack-dashboard-button"
            onClick={
              handleDashboard
            }
          >
            Go To Dashboard

            <i className="fa-solid fa-arrow-right" />
          </button>

        </section>


        <div className="professional-ack-security">

          <i className="fa-solid fa-shield-halved" />

          <span>
            Your Professional KYC submission
            has been securely received.
          </span>

        </div>

      </div>

    </main>
  );
}
