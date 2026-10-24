import { QRCodeCanvas } from "qrcode.react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "@fortawesome/fontawesome-free/css/all.min.css";

import {
  getPaymentPage,
  submitPayment,
} from "../../services/payment.service";

import "./ProfessionalPayment.css";
import { toText, asObject } from "../../utils/commonHelpers";

/* =========================================================
   PAYMENT CONSTANTS
========================================================= */

const NETWORK_MEMBERSHIP_AMOUNT =
  300;

const ROYALTY_MEMBERSHIP_AMOUNT =
  1500;

/* =========================================================
   STORAGE KEYS
========================================================= */

const MEMBERSHIP_STORAGE_KEY =
  "inmba_professional_membership_plan";

const KYC_COMPLETED_STORAGE_KEY =
  "inmba_professional_kyc_completed";

const KYC_CONFIRMED_STORAGE_KEY =
  "inmba_professional_kyc_confirmed";

const NEXT_ROUTE_STORAGE_KEY =
  "inmba_professional_next_route";

const PAYMENT_STATUS_STORAGE_KEY =
  "inmba_professional_payment_status";

const PAYMENT_RESULT_STORAGE_KEY =
  "inmba_professional_payment_result";

/* =========================================================
   MAIN FLOW
========================================================= */

const MAIN_FLOW_STEPS = [
  {
    key: "basic",
    label: "Basic KYC",
    icon: "fa-solid fa-user",
  },

  {
    key: "login",
    label: "Login",
    icon: "fa-solid fa-right-to-bracket",
  },

  {
    key: "membership",
    label: "Membership",
    icon: "fa-solid fa-id-card",
  },

  {
    key: "full-kyc",
    label: "Full KYC",
    icon: "fa-solid fa-file-shield",
  },

  {
    key: "review",
    label: "Review",
    icon: "fa-solid fa-clipboard-check",
  },

  {
    key: "payment",
    label: "Payment",
    icon: "fa-solid fa-credit-card",
  },

  {
    key: "complete",
    label: "Complete",
    icon: "fa-solid fa-circle-check",
  },
];

/* =========================================================
   PAYMENT METHODS
========================================================= */

const PAYMENT_METHODS = [
  {
    id: "UPI",

    title: "UPI",

    description:
      "Pay using any UPI application.",

    icon:
      "fa-solid fa-mobile-screen-button",
  },

  {
    id: "Bank Transfer",

    title: "Bank Transfer",

    description:
      "NEFT / IMPS / RTGS transfer.",

    icon:
      "fa-solid fa-building-columns",
  },

  {
    id: "Other",

    title: "Other",

    description:
      "Use another approved payment method.",

    icon:
      "fa-solid fa-wallet",
  },
];

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   SAFE JSON
========================================================= */

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

/* =========================================================
   OBJECT
========================================================= */

/* =========================================================
   ERROR TEXT
========================================================= */

const getErrorText = (
  error,
  fallback
) => {
  return (
    error?.apiMessage ||
    error?.response?.data
      ?.message ||
    error?.response?.data
      ?.error ||
    error?.message ||
    fallback
  );
};

/* =========================================================
   FILE VALIDATION
========================================================= */

const validatePaymentProof = (
  file
) => {
  if (!file) {
    return "";
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  if (
    file.type &&
    !allowedTypes.includes(
      file.type
    )
  ) {
    return "Only PDF, JPG and PNG files are allowed.";
  }

  const maxSize =
    5 *
    1024 *
    1024;

  if (
    file.size >
    maxSize
  ) {
    return "Payment proof must be below 5 MB.";
  }

  return "";
};

/* =========================================================
   CURRENT YEAR
========================================================= */

const getCurrentSubscriptionYear =
  () => {
    return String(
      new Date()
        .getFullYear()
    );
  };

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ProfessionalPayment() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  /* =======================================================
     MEMBERSHIP PLAN
  ======================================================= */

  const membershipSelection =
    useMemo(
      () => {
        const fromState =
          location.state
            ?.membershipSelection;

        if (
          fromState &&
          typeof fromState ===
            "object"
        ) {
          return fromState;
        }

        const stored =
          sessionStorage.getItem(
            MEMBERSHIP_STORAGE_KEY
          );

        return (
          safeParse(
            stored
          ) ||
          {}
        );
      },
      [
        location.state,
      ]
    );

  /* =======================================================
     SELECTED PLAN

     Priority:
     1. Navigation state
     2. Membership selection object
     3. Local storage
     4. Backend member response (loaded below)
  ======================================================= */

  const getInitialSelectedPlan =
    () => {
      const value =
        toText(
          location.state?.selectedPlan ||
            location.state?.selected_plan ||
            membershipSelection?.selectedPlan ||
            membershipSelection?.selected_plan ||
            membershipSelection?.amount ||
            localStorage.getItem(
              "professionalSelectedPlan"
            )
        );

      return [
        "300",
        "1500",
      ].includes(
        value
      )
        ? value
        : "";
    };

  const [
    selectedPlan,
    setSelectedPlan,
  ] =
    useState(
      getInitialSelectedPlan
    );

  const validSelectedPlan =
    [
      "300",
      "1500",
    ].includes(
      selectedPlan
    )
      ? selectedPlan
      : "";

  const isRoyaltyPlan =
    validSelectedPlan ===
    "1500";

  const paymentAmount =
    validSelectedPlan ===
    "1500"
      ? ROYALTY_MEMBERSHIP_AMOUNT
      : validSelectedPlan ===
          "300"
        ? NETWORK_MEMBERSHIP_AMOUNT
        : 0;

  const planName =
    validSelectedPlan ===
    "1500"
      ? "INMBA Network Royalty Member"
      : validSelectedPlan ===
          "300"
        ? "INMBA Network Member"
        : "Professional Membership";

  const membershipLevel =
    planName;

  const professionalFlow =
    "full_kyc_membership";

  /* =======================================================
     KYC STATE
  ======================================================= */

  const kycCompleted =
    location.state
      ?.kycCompleted ===
      true ||
    membershipSelection
      ?.kycCompleted ===
      true ||
    sessionStorage.getItem(
      KYC_COMPLETED_STORAGE_KEY
    ) ===
      "true" ||
    Boolean(sessionStorage.getItem("inmba_login_id") || sessionStorage.getItem("inmba_member_login_id"));

  const kycConfirmed =
    location.state
      ?.kycConfirmed ===
      true ||
    membershipSelection
      ?.kycConfirmed ===
      true ||
    sessionStorage.getItem(
      KYC_CONFIRMED_STORAGE_KEY
    ) ===
      "true" ||
    Boolean(sessionStorage.getItem("inmba_login_id") || sessionStorage.getItem("inmba_member_login_id"));

  /* =======================================================
     PAGE STATE
  ======================================================= */

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(
      false
    );

  const [
    pageError,
    setPageError,
  ] =
    useState(
      ""
    );

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState(
      ""
    );

  const [
    paymentCompleted,
    setPaymentCompleted,
  ] =
    useState(
      false
    );

  const [
    member,
    setMember,
  ] =
    useState(
      asObject(
        location.state
          ?.member
      )
    );

  const [
    paymentToken,
    setPaymentToken,
  ] =
    useState(
      toText(
        location.state
          ?.token
      )
    );

  /* =======================================================
     FORM
  ======================================================= */

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState(
      "upi_qr"
    );

  const [
    transactionId,
    setTransactionId,
  ] =
    useState(
      ""
    );

  const [
    paymentProof,
    setPaymentProof,
  ] =
    useState(
      null
    );

  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState(
      {}
    );

  const subscriptionYear =
    getCurrentSubscriptionYear();

  /* =======================================================
     PAYMENT PAGE PROTECTION

     Both ₹300 and ₹1500 use the same Full KYC A–J + Review.
  ======================================================= */

  useEffect(
    () => {
      if (
        !validSelectedPlan
      ) {
        sessionStorage.setItem(
          NEXT_ROUTE_STORAGE_KEY,
          "/professional-membership"
        );

        navigate(
          "/professional-membership",
          {
            replace: true,
          }
        );

        return;
      }

      if (
        (kycCompleted && kycConfirmed) ||
        Boolean(loginId)
      ) {
        return;
      }

      sessionStorage.setItem(
        NEXT_ROUTE_STORAGE_KEY,
        "/professional-review"
      );

      navigate(
        "/professional-review",
        {
          replace: true,
          state: {
            membershipSelection,
            selectedPlan:
              validSelectedPlan,
            selected_plan:
              validSelectedPlan,
          },
        }
      );
    },
    [
      validSelectedPlan,
      kycCompleted,
      kycConfirmed,
      membershipSelection,
      navigate,
    ]
  );

  /* =======================================================
     LOAD MEMBER / PAYMENT DETAILS
  ======================================================= */

  const loadPaymentDetails =
    useCallback(
      async () => {
        setLoading(
          true
        );

        setPageError(
          ""
        );

        try {
          const response =
            await getPaymentPage();

          const responseMember =
            asObject(
              response?.member ||
                response?.data
                  ?.member
            );

          if (
            Object.keys(
              responseMember
            ).length >
            0
          ) {
            setMember(
              responseMember
            );

            const backendSelectedPlan =
              toText(
                responseMember
                  ?.selected_plan ||
                  responseMember
                    ?.selectedPlan
              );

            if (
              [
                "300",
                "1500",
              ].includes(
                backendSelectedPlan
              )
            ) {
              setSelectedPlan(
                backendSelectedPlan
              );

              localStorage.setItem(
                "professionalSelectedPlan",
                backendSelectedPlan
              );
            }
          }

          const token =
            toText(
              response?.token ||
                response?.data
                  ?.token
            );

          if (
            token
          ) {
            setPaymentToken(
              token
            );
          }
        } catch (
          error
        ) {
          setPageError(
            getErrorText(
              error,
              "Unable to load Professional payment details."
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(
    () => {
      loadPaymentDetails();
    },
    [
      loadPaymentDetails,
    ]
  );

  /* =======================================================
     LOGIN ID
  ======================================================= */

  const loginId =
    toText(
      location.state
        ?.loginId ||
        membershipSelection
          ?.loginId ||
        member?.login_id
    );

  /* =======================================================
     MEMBER NAME
  ======================================================= */

  const memberName =
    toText(
      location.state
        ?.memberName ||
        membershipSelection
          ?.memberName
    ) ||
    [
      member?.first_name,
      member?.last_name,
    ]
      .filter(
        Boolean
      )
      .join(
        " "
      ) ||
    "Professional Member";

  /* =======================================================
     PAYMENT METHOD CHANGE
  ======================================================= */

  const handlePaymentMethodChange =
    (
      method
    ) => {
      setPaymentMethod(
        method
      );

      setFieldErrors(
        (
          previous
        ) => ({
          ...previous,

          paymentMethod:
            "",
        })
      );

      setPageError(
        ""
      );
    };

  /* =======================================================
     TRANSACTION CHANGE
  ======================================================= */

  const handleTransactionIdChange =
    (
      event
    ) => {
      setTransactionId(
        event.target
          .value
      );

      setFieldErrors(
        (
          previous
        ) => ({
          ...previous,

          transactionId:
            "",
        })
      );

      setPageError(
        ""
      );
    };

  /* =======================================================
     FILE CHANGE
  ======================================================= */

  const handlePaymentProofChange =
    (
      event
    ) => {
      const file =
        event.target
          .files?.[0] ||
        null;

      const error =
        validatePaymentProof(
          file
        );

      if (
        error
      ) {
        setPaymentProof(
          null
        );

        setFieldErrors(
          (
            previous
          ) => ({
            ...previous,

            paymentProof:
              error,
          })
        );

        event.target.value =
          "";

        return;
      }

      setPaymentProof(
        file
      );

      setFieldErrors(
        (
          previous
        ) => ({
          ...previous,

          paymentProof:
            "",
        })
      );

      setPageError(
        ""
      );
    };

  /* =======================================================
     REMOVE PAYMENT PROOF
  ======================================================= */

  const removePaymentProof =
    () => {
      setPaymentProof(
        null
      );

      setFieldErrors(
        (
          previous
        ) => ({
          ...previous,

          paymentProof:
            "",
        })
      );
    };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm =
    () => {
      const nextErrors =
        {};

      if (
        !paymentMethod
      ) {
        nextErrors
          .paymentMethod =
          "Select a payment method.";
      }

      const proofError =
        validatePaymentProof(
          paymentProof
        );

      if (
        proofError
      ) {
        nextErrors
          .paymentProof =
          proofError;
      }

      setFieldErrors(
        nextErrors
      );

      return (
        Object.keys(
          nextErrors
        ).length ===
        0
      );
    };

  /* =======================================================
     SUBMIT PAYMENT
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

      if (
        !validSelectedPlan
      ) {
        navigate(
          "/professional-membership",
          {
            replace: true,
          }
        );

        return;
      }

      if (
        (!kycCompleted || !kycConfirmed) &&
        !loginId
      ) {
        navigate(
          "/professional-review",
          {
            replace: true,
            state: {
              membershipSelection,
              selectedPlan:
                validSelectedPlan,
              selected_plan:
                validSelectedPlan,
            },
          }
        );

        return;
      }

      if (
        !validateForm()
      ) {
        return;
      }

      setSubmitting(
        true
      );

      setPageError(
        ""
      );

      setSuccessMessage(
        ""
      );

      try {
        const result =
          await submitPayment({
            payment_method:
              paymentMethod,

            subscription_year:
              subscriptionYear,

            amount:
              paymentAmount,

            selected_plan:
              validSelectedPlan,

            transaction_id:
              toText(
                transactionId
              ),

            payment_proof:
              paymentProof,
          });

        /* =================================================
           TOKEN

           Payment response token first priority.
           Existing payment page token fallback.
        ================================================= */

        const resultToken =
          toText(
            result?.token ||
              result?.data
                ?.token ||
              paymentToken
          );

        if (
          resultToken
        ) {
          setPaymentToken(
            resultToken
          );
        }

        /* =================================================
           PAYMENT RESULT
        ================================================= */

        const paymentResult = {
          success: true,

          planId:
            isRoyaltyPlan
              ? "network_royalty_member"
              : "network_member",

          selectedPlan:
            validSelectedPlan,

          selected_plan:
            validSelectedPlan,

          membershipLevel,

          planName,

          amount:
            paymentAmount,

          loginId,

          memberName,

          membershipType:
            "Professional Member",

          professionalFlow:
            professionalFlow,

          paymentMethod,

          subscriptionYear,

          transactionId:
            toText(
              transactionId
            ),

          token:
            resultToken,

          message:
            toText(
              result?.message,
              "Payment submitted successfully."
            ),

          paymentStatus:
            "pending",

          submittedAt:
            new Date()
              .toISOString(),
        };

        /* =================================================
           STORE PAYMENT STATUS
        ================================================= */

        sessionStorage.setItem(
          PAYMENT_STATUS_STORAGE_KEY,
          "submitted"
        );

        sessionStorage.setItem(
          PAYMENT_RESULT_STORAGE_KEY,
          JSON.stringify(
            paymentResult
          )
        );

        /* =================================================
           NEXT ROUTE

           PAYMENT
              ↓
           ACKNOWLEDGEMENT
        ================================================= */

        if (
          resultToken
        ) {
          sessionStorage.setItem(
            NEXT_ROUTE_STORAGE_KEY,
            `/acknowledgement/${resultToken}`
          );
        }

        setSuccessMessage(
          paymentResult
            .message
        );

        setPaymentCompleted(
          true
        );

        window.scrollTo({
          top: 0,

          behavior:
            "smooth",
        });
      } catch (
        error
      ) {
        setPageError(
          getErrorText(
            error,
            "Unable to submit Professional payment."
          )
        );

        window.scrollTo({
          top: 0,

          behavior:
            "smooth",
        });
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* =======================================================
     BACK
  ======================================================= */

  const handleBack =
    () => {
      sessionStorage.setItem(
        NEXT_ROUTE_STORAGE_KEY,
        "/professional-review"
      );

      navigate(
        "/professional-review",
        {
          state: {
            membershipSelection,
            selectedPlan:
              validSelectedPlan,
            selected_plan:
              validSelectedPlan,
          },
        }
      );
    };

  /* =======================================================
     PAYMENT COMPLETE
     → ACKNOWLEDGEMENT
  ======================================================= */

  const handleGoAcknowledgement =
    () => {
      const token =
        toText(
          paymentToken || loginId
        );

      if (
        !token
      ) {
        navigate("/dashboard");
        return;
      }

      const acknowledgementPath =
        `/acknowledgement/${encodeURIComponent(
          token
        )}`;

      sessionStorage.setItem(
        NEXT_ROUTE_STORAGE_KEY,
        acknowledgementPath
      );

      navigate(
        acknowledgementPath,
        {
          state: {
            loginId,

            token,

            member,

            memberName,

            membershipType:
              "Professional Member",

            professionalFlow:
              professionalFlow,

            planId:
              isRoyaltyPlan
                ? "network_royalty_member"
                : "network_member",

            selectedPlan:
              validSelectedPlan,

            selected_plan:
              validSelectedPlan,

            membershipLevel,

            planName,

            amount:
              paymentAmount,

            subscriptionYear,

            paymentMethod,

            transactionId:
              toText(
                transactionId
              ),

            paymentStatus:
              "pending",

            paymentSubmitted:
              true,
          },
        }
      );
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <main className="professional-payment-loading-page">
        <section className="professional-payment-loading-card">
          <div className="professional-payment-spinner" />

          <h2>
            Loading Payment
          </h2>

          <p>
            Preparing your Professional
            membership payment...
          </p>
        </section>
      </main>
    );
  }

  /* =======================================================
     PAYMENT SUCCESS
  ======================================================= */

  if (
    paymentCompleted
  ) {
    return (
      <div className="professional-payment-page">
        {/* ===============================================
            HEADER
        =============================================== */}

        <header className="professional-payment-header">
          <div className="professional-payment-header-inner">
            <div className="professional-payment-brand">
              <div className="professional-payment-brand-icon">
                <i className="fa-solid fa-shield-halved" />
              </div>

              <div>
                <h1>
                  INMBA Professional
                </h1>

                <p>
                  Membership Payment
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ===============================================
            SUCCESS
        =============================================== */}

        <main className="professional-payment-success-wrapper">
          <section className="professional-payment-success-card">
            <div className="professional-payment-success-icon">
              <i className="fa-solid fa-check" />
            </div>

            <span className="professional-payment-success-label">
              PAYMENT SUBMITTED
            </span>

            <h2>
              Payment Submitted Successfully
            </h2>

            <p>
              {successMessage ||
                "Your payment has been submitted successfully and is pending verification."}
            </p>

            {/* ===========================================
                PAYMENT SUMMARY
            =========================================== */}

            <div className="professional-payment-success-summary">
              <div>
                <span>
                  Login ID
                </span>

                <strong>
                  {loginId ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>
                  Membership Plan
                </span>

                <strong>
                  {planName}
                </strong>
              </div>

              <div>
                <span>
                  Amount
                </span>

                <strong>
                  ₹
                  {
                    paymentAmount
                  }
                </strong>
              </div>

              <div>
                <span>
                  Status
                </span>

                <strong className="pending">
                  Pending Verification
                </strong>
              </div>

              <div>
                <span>
                  Payment Method
                </span>

                <strong>
                  {
                    paymentMethod
                  }
                </strong>
              </div>

              <div>
                <span>
                  Transaction ID
                </span>

                <strong>
                  {toText(
                    transactionId,
                    "Not provided"
                  )}
                </strong>
              </div>
            </div>

            {/* ===========================================
                STATUS NOTE
            =========================================== */}

            <div className="professional-payment-success-note">
              <i className="fa-solid fa-circle-info" />

              <p>
                Your payment has been
                submitted for verification.
                Continue to the
                acknowledgement page to
                view your submission
                confirmation.
              </p>
            </div>

            {/* ===========================================
                QR CODE & ACTIONS
            =========================================== */}

            <div style={{ textAlign: "center", margin: "24px 0", background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <QRCodeCanvas
                value={`https://inmba.org/user-profile/${encodeURIComponent(loginId)}`}
                size={180}
                level="H"
                includeMargin
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
              <p style={{ marginTop: "10px", fontSize: "14px", fontWeight: "600", color: "#334155" }}>
                Scan to view Public Profile (Login ID: {loginId})
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "1rem" }}>
              <button
                type="button"
                className="professional-payment-dashboard-button"
                onClick={() => navigate(`/user-profile/${encodeURIComponent(loginId)}`)}
              >
                View My QR & Public Profile
                <i className="fa-solid fa-qrcode" style={{ marginLeft: "8px" }} />
              </button>

              <button
                type="button"
                className="professional-payment-dashboard-button"
                style={{ background: "#334155" }}
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
                <i className="fa-solid fa-gauge" style={{ marginLeft: "8px" }} />
              </button>

              <button
                type="button"
                className="professional-payment-dashboard-button"
                style={{ background: "#64748b" }}
                onClick={handleGoAcknowledgement}
              >
                View Acknowledgement
                <i className="fa-solid fa-arrow-right" style={{ marginLeft: "8px" }} />
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  /* =======================================================
     PAYMENT PAGE
  ======================================================= */

  return (
    <div className="professional-payment-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="professional-payment-header">
        <div className="professional-payment-header-inner">
          <div className="professional-payment-brand">
            <div className="professional-payment-brand-icon">
              <i className="fa-solid fa-shield-halved" />
            </div>

            <div>
              <h1>
                INMBA Professional
              </h1>

              <p>
                Membership Payment
              </p>
            </div>
          </div>

          <div className="professional-payment-header-plan">
            <span>
              {planName}
            </span>

            <strong>
              ₹
              {
                paymentAmount
              }
            </strong>
          </div>
        </div>
      </header>

      {/* =================================================
          FLOW
      ================================================= */}

      {validSelectedPlan && (
        <section className="professional-payment-flow-wrapper">
          <div className="professional-payment-flow">
            {MAIN_FLOW_STEPS.map(
              (
                step,
                index
              ) => {
                const completed =
                  index <
                  5;

                const active =
                  step.key ===
                  "payment";

                return (
                  <React.Fragment
                    key={
                      step.key
                    }
                  >
                    <div
                      className={[
                        "professional-payment-flow-item",

                        completed
                          ? "completed"
                          : "",

                        active
                          ? "active"
                          : "",
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " "
                        )}
                    >
                      <div className="professional-payment-flow-icon">
                        {completed ? (
                          <i className="fa-solid fa-check" />
                        ) : (
                          <i
                            className={
                              step.icon
                            }
                          />
                        )}
                      </div>

                      <span>
                        {
                          step.label
                        }
                      </span>
                    </div>

                    {index <
                      MAIN_FLOW_STEPS.length -
                        1 && (
                      <div
                        className={[
                          "professional-payment-flow-line",

                          index <
                          5
                            ? "completed"
                            : "",
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " "
                          )}
                      />
                    )}
                  </React.Fragment>
                );
              }
            )}
          </div>
        </section>
      )}

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="professional-payment-container">
        {/* ===============================================
            ERROR
        =============================================== */}

        {pageError && (
          <div className="professional-payment-error-box">
            <i className="fa-solid fa-circle-exclamation" />

            <span>
              {pageError}
            </span>

            <button
              type="button"
              onClick={() =>
                setPageError(
                  ""
                )
              }
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        )}

        {/* ===============================================
            HEADING
        =============================================== */}

        <section className="professional-payment-heading">
          <div>
            <span>
              FINAL STEP
            </span>

            <h2>
              Complete Your Payment
            </h2>

            <p>
              {isRoyaltyPlan
                ? "Your Professional Full KYC and final review are complete. Submit the fixed ₹1500 Network Royalty membership payment."
                : "Your Professional Full KYC and final review are complete. Submit the fixed ₹300 Network membership payment."}
            </p>
          </div>

          {validSelectedPlan && (
            <div className="professional-payment-verified-badge">
              <i className="fa-solid fa-circle-check" />

              <div>
                <span>
                  KYC STATUS
                </span>

                <strong>
                  A–J Reviewed
                </strong>
              </div>
            </div>
          )}
        </section>

        {/* ===============================================
            LAYOUT
        =============================================== */}

        <div className="professional-payment-layout">
          {/* =============================================
              LEFT SUMMARY
          ============================================= */}

          <aside className="professional-payment-plan-card">
            <div className="professional-payment-plan-icon">
              <i className="fa-solid fa-gem" />
            </div>

            <span className="professional-payment-plan-label">
              SELECTED MEMBERSHIP
            </span>

            <h2>
              {planName}
            </h2>

            <div className="professional-payment-price">
              <span>
                ₹
              </span>

              <strong>
                {
                  paymentAmount
                }
              </strong>
            </div>

            <p className="professional-payment-plan-description">
              {isRoyaltyPlan
                ? "INMBA Network Royalty Member with completed A–J Full KYC."
                : "INMBA Network Member with completed A–J Full KYC."}
            </p>

            <div className="professional-payment-plan-divider" />

            <div className="professional-payment-member-details">
              <div>
                <span>
                  Member
                </span>

                <strong>
                  {memberName}
                </strong>
              </div>

              <div>
                <span>
                  Login ID
                </span>

                <strong>
                  {loginId ||
                    "—"}
                </strong>
              </div>

              <div>
                <span>
                  Membership
                </span>

                <strong>
                  Professional Member
                </strong>
              </div>

              <div>
                <span>
                  Subscription Year
                </span>

                <strong>
                  {
                    subscriptionYear
                  }
                </strong>
              </div>
            </div>

            {validSelectedPlan && (
              <div className="professional-payment-kyc-status">
                <i className="fa-solid fa-check-double" />

                <div>
                  <strong>
                    Full KYC Completed
                  </strong>

                  <span>
                    Sections A–J confirmed
                  </span>
                </div>
              </div>
            )}

            <div className="professional-payment-fixed-note">
              <i className="fa-solid fa-lock" />

              <span>
                Amount is fixed and cannot
                be edited.
              </span>
            </div>
          </aside>

          {/* =============================================
              RIGHT FORM
          ============================================= */}

          <section className="professional-payment-form-card">
            <div className="professional-payment-form-heading">
              <div className="professional-payment-form-heading-icon">
                <i className="fa-solid fa-credit-card" />
              </div>

              <div>
                <span>
                  SECURE PAYMENT
                </span>

                <h3>
                  Payment Information
                </h3>

                <p>
                  Enter your payment
                  details and submit for
                  verification.
                </p>
              </div>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              noValidate
            >
              {/* =========================================
                  PAYMENT METHOD
              ========================================= */}

              <div className="professional-payment-field-group">
                <label className="professional-payment-main-label">
                  Payment Method

                  <span>
                    *
                  </span>
                </label>

                <div className="professional-payment-method-grid">
                  {PAYMENT_METHODS.map(
                    (
                      method
                    ) => {
                      const selected =
                        paymentMethod ===
                        method.id;

                      return (
                        <button
                          key={
                            method.id
                          }
                          type="button"
                          className={[
                            "professional-payment-method-card",

                            selected
                              ? "selected"
                              : "",
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " "
                            )}
                          onClick={() =>
                            handlePaymentMethodChange(
                              method.id
                            )
                          }
                          disabled={
                            submitting
                          }
                        >
                          <div className="professional-payment-method-icon">
                            <i
                              className={
                                method.icon
                              }
                            />
                          </div>

                          <div>
                            <strong>
                              {
                                method.title
                              }
                            </strong>

                            <span>
                              {
                                method.description
                              }
                            </span>
                          </div>

                          <div className="professional-payment-radio">
                            {selected && (
                              <i className="fa-solid fa-check" />
                            )}
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>

                {fieldErrors
                  .paymentMethod && (
                  <small className="professional-payment-field-error">
                    <i className="fa-solid fa-circle-exclamation" />

                    {
                      fieldErrors
                        .paymentMethod
                    }
                  </small>
                )}
              </div>

              {/* =========================================
                  YEAR + AMOUNT
              ========================================= */}

              <div className="professional-payment-form-grid">
                <div className="professional-payment-input-group">
                  <label>
                    Subscription Year
                  </label>

                  <div className="professional-payment-readonly-input">
                    <i className="fa-solid fa-calendar" />

                    <input
                      type="text"
                      value={
                        subscriptionYear
                      }
                      readOnly
                    />
                  </div>
                </div>

                <div className="professional-payment-input-group">
                  <label>
                    Payment Amount
                  </label>

                  <div className="professional-payment-readonly-input amount">
                    <span>
                      ₹
                    </span>

                    <input
                      type="text"
                      value={
                        paymentAmount
                      }
                      readOnly
                    />

                    <i className="fa-solid fa-lock" />
                  </div>
                </div>
              </div>

              {/* =========================================
                  TRANSACTION ID
              ========================================= */}

              <div className="professional-payment-input-group full">
                <label>
                  Transaction ID / UTR

                  <small>
                    Optional
                  </small>
                </label>

                <div className="professional-payment-input-wrapper">
                  <i className="fa-solid fa-receipt" />

                  <input
                    type="text"
                    value={
                      transactionId
                    }
                    placeholder="Enter Transaction ID / UTR number"
                    onChange={
                      handleTransactionIdChange
                    }
                    disabled={
                      submitting
                    }
                    maxLength={
                      100
                    }
                  />
                </div>

                {fieldErrors
                  .transactionId && (
                  <small className="professional-payment-field-error">
                    <i className="fa-solid fa-circle-exclamation" />

                    {
                      fieldErrors
                        .transactionId
                    }
                  </small>
                )}
              </div>

              {/* =========================================
                  PAYMENT PROOF
              ========================================= */}

              <div className="professional-payment-field-group">
                <label className="professional-payment-main-label">
                  Payment Proof

                  <small>
                    Optional
                  </small>
                </label>

                {paymentProof ? (
                  <div className="professional-payment-selected-file">
                    <div className="professional-payment-selected-file-icon">
                      <i className="fa-solid fa-file-shield" />
                    </div>

                    <div className="professional-payment-selected-file-info">
                      <strong>
                        {
                          paymentProof
                            .name
                        }
                      </strong>

                      <span>
                        Ready to upload
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={
                        removePaymentProof
                      }
                      disabled={
                        submitting
                      }
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                ) : (
                  <label className="professional-payment-upload-box">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={
                        handlePaymentProofChange
                      }
                      disabled={
                        submitting
                      }
                    />

                    <div className="professional-payment-upload-icon">
                      <i className="fa-solid fa-cloud-arrow-up" />
                    </div>

                    <strong>
                      Upload Payment Proof
                    </strong>

                    <span>
                      PDF / JPG / PNG · Max
                      5 MB
                    </span>
                  </label>
                )}

                {fieldErrors
                  .paymentProof && (
                  <small className="professional-payment-field-error">
                    <i className="fa-solid fa-circle-exclamation" />

                    {
                      fieldErrors
                        .paymentProof
                    }
                  </small>
                )}
              </div>

              {/* =========================================
                  SECURITY
              ========================================= */}

              <div className="professional-payment-security-note">
                <i className="fa-solid fa-lock" />

                <div>
                  <strong>
                    Secure Payment Submission
                  </strong>

                  <p>
                    Your payment details
                    and supporting proof
                    are securely submitted
                    to INMBA for
                    verification.
                  </p>
                </div>
              </div>

              {/* =========================================
                  ACTIONS
              ========================================= */}

              <div className="professional-payment-actions">
                <button
                  type="button"
                  className="professional-payment-back-button"
                  onClick={
                    handleBack
                  }
                  disabled={
                    submitting
                  }
                >
                  <i className="fa-solid fa-arrow-left" />

                  Back to Review
                </button>

                <button
                  type="submit"
                  className="professional-payment-submit-button"
                  disabled={
                    submitting
                  }
                >
                  {submitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" />

                      Submitting Payment...
                    </>
                  ) : (
                    <>
                      Submit ₹
                      {
                        paymentAmount
                      } Payment

                      <i className="fa-solid fa-arrow-right" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}