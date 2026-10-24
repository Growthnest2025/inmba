import React, {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "@fortawesome/fontawesome-free/css/all.min.css";

import "./CommercialPayment.css";
import api from "../../../services/api";

/* =========================================================
   DEFAULT BASIC PLAN

   Backend Commercial plan:
   basic = ₹300
========================================================= */

const DEFAULT_BASIC_PLAN = {
  id: "basic",
  name: "Basic Membership",
  amount: 300,
  requiresFullKyc: false,
};

/* =========================================================
   PAYMENT METHODS

   IMPORTANT:
   These names match Commercial backend validator.
========================================================= */

const PAYMENT_METHODS = [
  {
    id: "Account",
    label: "Account",
    icon: "fa-solid fa-building-columns",
  },
  {
    id: "UPI",
    label: "UPI",
    icon: "fa-solid fa-mobile-screen-button",
  },
  {
    id: "QR",
    label: "QR",
    icon: "fa-solid fa-qrcode",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const safeText = (
  value,
  fallback = ""
) => {
  const result =
    String(
      value ?? ""
    ).trim();

  return (
    result ||
    fallback
  );
};

const safeNumber = (
  value,
  fallback
) => {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : fallback;
};

/* =========================================================
   READ SELECTED PLAN
========================================================= */

const readSelectedPlan =
  () => {
    try {
      const stored =
        sessionStorage.getItem(
          "commercial_selected_plan"
        );

      if (!stored) {
        return {
          ...DEFAULT_BASIC_PLAN,
        };
      }

      const parsed =
        JSON.parse(
          stored
        );

      const amount =
        safeNumber(
          parsed?.amount,
          300
        );

      /*
        ₹300 page should always map
        to backend plan id "basic".
      */

      if (amount === 300) {
        return {
          id: "basic",

          name:
            safeText(
              parsed?.name,
              "Basic Membership"
            ),

          amount: 300,

          requiresFullKyc:
            false,
        };
      }

      /*
        Keeps selected data safe if another
        Commercial plan reaches this page.
      */

      return {
        id:
          safeText(
            parsed?.id ||
              parsed?.plan_id,
            amount === 1500
              ? "profile_upgrade"
              : "basic"
          ),

        name:
          safeText(
            parsed?.name,
            amount === 1500
              ? "Profile Upgrade"
              : "Basic Membership"
          ),

        amount,

        requiresFullKyc:
          Boolean(
            parsed
              ?.requiresFullKyc ||
              parsed
                ?.requires_full_kyc
          ),
      };
    } catch (
      error
    ) {
      console.error(
        "Commercial selected plan parse error:",
        error
      );

      return {
        ...DEFAULT_BASIC_PLAN,
      };
    }
  };

/* =========================================================
   COMMERCIAL PAYMENT
========================================================= */

export default function CommercialPayment() {
  const navigate =
    useNavigate();

  /* =======================================================
     PLAN
  ======================================================= */

  const plan =
    useMemo(
      () =>
        readSelectedPlan(),
      []
    );

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState(
      "Account"
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
    error,
    setError,
  ] =
    useState(
      ""
    );

  /* =======================================================
     PAYMENT METHOD
  ======================================================= */

  const handlePaymentMethodChange =
    (
      method
    ) => {
      setPaymentMethod(
        method
      );

      setError(
        ""
      );
    };

  /* =======================================================
     PAYMENT PROOF
  ======================================================= */

  const handlePaymentProofChange =
    (
      event
    ) => {
      const file =
        event
          .target
          .files?.[0] ||
        null;

      if (!file) {
        setPaymentProof(
          null
        );

        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        setPaymentProof(
          null
        );

        setError(
          "Upload JPG, PNG, WEBP or PDF payment proof."
        );

        event.target.value =
          "";

        return;
      }

      /*
        Frontend safety limit.
        Backend validation remains authoritative.
      */

      const maxSize =
        5 *
        1024 *
        1024;

      if (
        file.size >
        maxSize
      ) {
        setPaymentProof(
          null
        );

        setError(
          "Payment proof must be below 5 MB."
        );

        event.target.value =
          "";

        return;
      }

      setPaymentProof(
        file
      );

      setError(
        ""
      );
    };

  /* =======================================================
     REMOVE PROOF
  ======================================================= */

  const removePaymentProof =
    () => {
      setPaymentProof(
        null
      );

      setError(
        ""
      );

      const input =
        document.getElementById(
          "commercial-payment-proof"
        );

      if (input) {
        input.value =
          "";
      }
    };

  /* =======================================================
     SUBMIT

     IMPORTANT:
     First we complete the UI exactly.
     Actual POST /api/commercial-payment wiring
     will be connected in the next payment step.

     No fake payment success.
     No automatic dashboard navigation.
  ======================================================= */
const handleSubmit = async (event) => {
  event.preventDefault();

  if (!paymentMethod) {
    setError("Please select a payment method.");
    return;
  }

  const loginId =
    sessionStorage.getItem("commercial_login_id") ||
    localStorage.getItem("commercial_login_id") ||
    sessionStorage.getItem("inmba_commercial_login_id");

  if (!loginId) {
    setError("Commercial Login ID is missing.");
    return;
  }

  try {
    setError("");

    const formData = new FormData();

    formData.append("login_id", loginId);
    formData.append("plan_id", plan.id);
    formData.append("plan_name", plan.name);
    formData.append("amount", String(plan.amount));
    formData.append("payment_method", paymentMethod);

    if (transactionId.trim()) {
      formData.append(
        "transaction_id",
        transactionId.trim()
      );
    }

    if (paymentProof) {
      formData.append(
        "payment_proof",
        paymentProof
      );
    }

    const response = await api.post(
      "/commercial-payment",
      formData
    );

    console.log(
      "Commercial Payment Success:",
      response.data
    );

navigate(
  "/commercial/qr",
  {
    replace: true,
  }
);
  } catch (error) {
    console.error(
      "Commercial Payment Error:",
      error
    );

    setError(
      error?.response?.data?.message ||
      "Payment submission failed."
    );
  }
};
  /* =======================================================
     BASIC BENEFITS
  ======================================================= */

  const benefits = [
    "Commercial Member Access",
    "Referral Link",
    "Basic Commercial Dashboard",
    "Upgrade Later",
  ];

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="commercial-payment-page">
      <div className="commercial-payment-shell">

        {/* =================================================
            LEFT PANEL
        ================================================= */}

        <section className="commercial-payment-left">

          <div className="commercial-payment-left-content">

            {/* BRAND */}

            <div className="commercial-payment-brand">
              <div className="commercial-payment-brand-icon">
                <i className="fa-solid fa-building" />
              </div>

              <div>
                <span>
                  INMBA
                </span>

                <strong>
                  Commercial
                </strong>
              </div>
            </div>

            {/* TITLE */}

            <div className="commercial-payment-intro">
              <span className="commercial-payment-kicker">
                COMMERCIAL MEMBERSHIP
              </span>

              <h1>
                Complete Your
                <br />
                Membership
              </h1>

              <p>
                Complete your payment securely
                and upload payment proof for
                verification.
              </p>
            </div>

            {/* SELECTED PLAN */}

            <div className="commercial-payment-selected-card">
              <span className="commercial-payment-selected-label">
                SELECTED PLAN
              </span>

              <h2>
                {plan.name}
              </h2>

              <div className="commercial-payment-price">
                <span>
                  ₹
                </span>

                {plan.amount}
              </div>
            </div>

            {/* BENEFITS */}

            <div className="commercial-payment-benefits">
              {benefits.map(
                (
                  benefit
                ) => (
                  <div
                    className="commercial-payment-benefit"
                    key={
                      benefit
                    }
                  >
                    <span className="commercial-payment-check">
                      <i className="fa-solid fa-check" />
                    </span>

                    <span>
                      {benefit}
                    </span>
                  </div>
                )
              )}
            </div>

            {/* SECURITY */}

            <div className="commercial-payment-security">
              <i className="fa-solid fa-shield-halved" />

              <span>
                Secure Commercial Membership
                Payment
              </span>
            </div>
          </div>

          {/* DECORATION */}

          <div
            className="commercial-payment-circle circle-one"
            aria-hidden="true"
          />

          <div
            className="commercial-payment-circle circle-two"
            aria-hidden="true"
          />
        </section>

        {/* =================================================
            RIGHT PANEL
        ================================================= */}

        <section className="commercial-payment-right">

          <div className="commercial-payment-form-wrap">

            {/* TOP */}

            <div className="commercial-payment-top-row">
              <button
                type="button"
                className="commercial-payment-back"
                onClick={() =>
                  navigate(
                    "/commercial/membership-plan"
                  )
                }
              >
                <i className="fa-solid fa-arrow-left" />

                Back
              </button>

              <div className="commercial-payment-secure-badge">
                <i className="fa-solid fa-lock" />

                Secure Payment
              </div>
            </div>

            {/* HEADER */}

            <header className="commercial-payment-header">
              <span>
                PAYMENT
              </span>

              <h2>
                Complete Payment
              </h2>

              <p>
                Complete your Commercial Membership
                payment of{" "}
                <strong>
                  ₹{plan.amount}
                </strong>.
              </p>
            </header>

            <form
              className="commercial-payment-form"
              onSubmit={
                handleSubmit
              }
            >

              {/* ===========================================
                  MEMBERSHIP PLAN
              =========================================== */}

              <div className="commercial-payment-field">
                <label>
                  Membership Plan
                </label>

                <div className="commercial-payment-plan-box">
                  <div className="commercial-payment-plan-icon">
                    <i className="fa-solid fa-id-card" />
                  </div>

                  <div className="commercial-payment-plan-text">
                    <span>
                      Selected Membership
                    </span>

                    <strong>
                      {plan.name}
                    </strong>
                  </div>

                  <div className="commercial-payment-plan-amount">
                    ₹{plan.amount}
                  </div>
                </div>
              </div>

              {/* ===========================================
                  PAYMENT METHOD
              =========================================== */}

              <div className="commercial-payment-field">
                <label>
                  Payment Method
                  <span className="required">
                    *
                  </span>
                </label>

                <div className="commercial-payment-methods">
                  {PAYMENT_METHODS.map(
                    (
                      method
                    ) => {
                      const active =
                        paymentMethod ===
                        method.id;

                      return (
                        <label
                          key={
                            method.id
                          }
                          className={
                            active
                              ? "commercial-payment-method active"
                              : "commercial-payment-method"
                          }
                        >
                          <input
                            type="radio"
                            name="payment_method"
                            value={
                              method.id
                            }
                            checked={
                              active
                            }
                            onChange={() =>
                              handlePaymentMethodChange(
                                method.id
                              )
                            }
                          />

                          <span className="commercial-payment-radio" />

                          <i
                            className={
                              method.icon
                            }
                          />

                          <span>
                            {method.label}
                          </span>
                        </label>
                      );
                    }
                  )}
                </div>
              </div>

              {/* ===========================================
                  AMOUNT
              =========================================== */}

              <div className="commercial-payment-field">
                <label>
                  Amount
                </label>

                <div className="commercial-payment-input-wrap commercial-payment-amount-input">
                  <span className="commercial-payment-prefix">
                    ₹
                  </span>

                  <input
                    type="text"
                    value={
                      plan.amount
                    }
                    readOnly
                    aria-label="Payment amount"
                  />

                  <span className="commercial-payment-locked">
                    <i className="fa-solid fa-lock" />
                  </span>
                </div>
              </div>

              {/* ===========================================
                  TRANSACTION ID
              =========================================== */}

              <div className="commercial-payment-field">
                <div className="commercial-payment-label-row">
                  <label
                    htmlFor="commercial-transaction-id"
                  >
                    Transaction ID / UTR
                  </label>

                  <span>
                    Optional
                  </span>
                </div>

                <div className="commercial-payment-input-wrap">
                  <span className="commercial-payment-input-icon">
                    <i className="fa-solid fa-receipt" />
                  </span>

                  <input
                    id="commercial-transaction-id"
                    type="text"
                    maxLength={255}
                    placeholder="Enter Transaction ID / UTR"
                    value={
                      transactionId
                    }
                    onChange={(
                      event
                    ) => {
                      setTransactionId(
                        event
                          .target
                          .value
                      );

                      setError(
                        ""
                      );
                    }}
                  />
                </div>
              </div>

              {/* ===========================================
                  PAYMENT PROOF
              =========================================== */}

              <div className="commercial-payment-field">
                <div className="commercial-payment-label-row">
                  <label
                    htmlFor="commercial-payment-proof"
                  >
                    Upload Payment Proof
                  </label>

                  <span>
                    Optional
                  </span>
                </div>

                {!paymentProof ? (
                  <label
                    htmlFor="commercial-payment-proof"
                    className="commercial-payment-upload"
                  >
                    <input
                      id="commercial-payment-proof"
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={
                        handlePaymentProofChange
                      }
                    />

                    <div className="commercial-payment-upload-icon">
                      <i className="fa-solid fa-cloud-arrow-up" />
                    </div>

                    <div className="commercial-payment-upload-text">
                      <strong>
                        Upload Payment Screenshot
                      </strong>

                      <span>
                        JPG, PNG, WEBP or PDF • Max 5 MB
                      </span>
                    </div>

                    <span className="commercial-payment-browse">
                      Browse
                    </span>
                  </label>
                ) : (
                  <div className="commercial-payment-file">
                    <div className="commercial-payment-file-icon">
                      <i className="fa-solid fa-file-circle-check" />
                    </div>

                    <div className="commercial-payment-file-details">
                      <strong>
                        {paymentProof.name}
                      </strong>

                      <span>
                        {(
                          paymentProof.size /
                          1024 /
                          1024
                        ).toFixed(
                          2
                        )}{" "}
                        MB
                      </span>
                    </div>

                    <button
                      type="button"
                      className="commercial-payment-file-remove"
                      onClick={
                        removePaymentProof
                      }
                      aria-label="Remove payment proof"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                )}
              </div>

              {/* ===========================================
                  INFO
              =========================================== */}

              <div className="commercial-payment-info">
                <i className="fa-solid fa-circle-info" />

                <p>
                  Your payment will be submitted
                  securely for verification.
                  Membership activation will follow
                  the Commercial payment status.
                </p>
              </div>

              {/* ===========================================
                  ERROR
              =========================================== */}

              {error && (
                <div
                  className="commercial-payment-error"
                  role="alert"
                >
                  <i className="fa-solid fa-triangle-exclamation" />

                  <span>
                    {error}
                  </span>
                </div>
              )}

              {/* ===========================================
                  SUBMIT
              =========================================== */}

              <button
                type="submit"
                className="commercial-payment-submit"
              >
                <span>
                  Confirm ₹{plan.amount} Payment
                </span>

                <i className="fa-solid fa-arrow-right" />
              </button>

              <p className="commercial-payment-footer-note">
                <i className="fa-solid fa-shield-halved" />

                Your payment information is handled
                securely.
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}