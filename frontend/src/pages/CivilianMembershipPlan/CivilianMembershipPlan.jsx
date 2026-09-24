import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  saveCivilianKycPlan,
} from "../../services/CivilianKyc.service";

import "./CivilianMembershipPlan.css";

/* =========================================================
   PLAN CONFIG
========================================================= */

const CIVILIAN_PLANS = [
  {
    id: "network_member",
    amount: "300",
    name: "INMBA Network Member",
    shortName: "Network Member",
    description:
      "Complete your Civilian Full KYC and payment. QR Code, Public Profile and Referral access will be enabled after admin approval.",
    features: [
      "Civilian Full KYC A-H",
      "₹300 Membership Payment",
      "Personal QR Code after approval",
      "Public Profile after approval",
      "Referral access after approval",
    ],
    royalty: false,
  },
  {
    id: "network_royalty_member",
    amount: "1500",
    name: "INMBA Network Royalty Member",
    shortName: "Royalty Member",
    description:
      "Complete your Civilian Full KYC and payment. All Network Member benefits plus Royalty Rewards will be enabled after admin approval.",
    features: [
      "Civilian Full KYC A-H",
      "₹1500 Membership Payment",
      "Personal QR Code after approval",
      "Public Profile after approval",
      "Referral access after approval",
      "Royalty Rewards after approval",
    ],
    royalty: true,
  },
];

/* =========================================================
   HELPERS
========================================================= */

const normalizePlan = (
  value
) => {
  const plan =
    String(
      value ?? ""
    ).trim();

  return [
    "300",
    "1500",
  ].includes(
    plan
  )
    ? plan
    : "";
};

/* =========================================================
   COMPONENT
========================================================= */

export default function CivilianMembershipPlan() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    selectedPlan,
    setSelectedPlan,
  ] =
    useState("");

  const [
    loadingPlan,
    setLoadingPlan,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     INITIAL SELECTED PLAN
  ======================================================= */

  const initialPlan =
    useMemo(
      () => {
        const statePlan =
          normalizePlan(
            location.state?.selectedPlan ||
              location.state?.selected_plan
          );

        if (
          statePlan
        ) {
          return statePlan;
        }

        try {
          return normalizePlan(
            window.localStorage.getItem(
              "civilianSelectedPlan"
            )
          );
        } catch {
          return "";
        }
      },
      [
        location.state,
      ]
    );

  useEffect(
    () => {
      if (
        initialPlan
      ) {
        setSelectedPlan(
          initialPlan
        );
      }
    },
    [
      initialPlan,
    ]
  );

  /* =======================================================
     PLAN SELECT
  ======================================================= */

  const handlePlanSelect =
    async (
      plan
    ) => {
      const amount =
        normalizePlan(
          plan?.amount
        );

      if (
        !amount
      ) {
        setError(
          "Please choose a valid Civilian membership plan."
        );

        return;
      }

      if (
        loadingPlan
      ) {
        return;
      }

      try {
        setError("");

        setLoadingPlan(
          amount
        );

        /*
          Backend is authoritative.
          Plan must be saved before Full KYC.
        */

        await saveCivilianKycPlan(
          amount
        );

        setSelectedPlan(
          amount
        );

        try {
          window.localStorage.setItem(
            "civilianSelectedPlan",
            amount
          );
        } catch {
          // localStorage failure should not block flow.
        }

        navigate(
          `/civilian-kyc?plan=${encodeURIComponent(
            amount
          )}`,
          {
            state: {
              selectedPlan:
                amount,

              selected_plan:
                amount,

              membershipType:
                "Civilian Member",

              membershipLevel:
                plan.name,

              startSection:
                "A",
            },
          }
        );
      } catch (
        requestError
      ) {
        console.error(
          "Civilian plan selection failed:",
          requestError
        );

        setError(
          requestError?.response?.data?.message ||
            requestError?.apiMessage ||
            requestError?.message ||
            "Unable to save Civilian membership plan."
        );
      } finally {
        setLoadingPlan("");
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="civilian-membership-page">

      <div className="civilian-membership-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="civilian-membership-header">

          <div className="civilian-membership-header-copy">

            <span className="civilian-membership-eyebrow">
              INMBA Civilian Membership
            </span>

            <h1 className="civilian-membership-title">
              Choose Your Membership Plan
            </h1>

            <p className="civilian-membership-description">
              Choose ₹300 or ₹1500. Your selected
              membership amount will continue through
              Civilian Full KYC and Payment.
            </p>

          </div>

          {selectedPlan && (
            <div className="civilian-selected-plan-badge">

              <i className="fas fa-circle-check" />

              <span>
                ₹{selectedPlan} Selected
              </span>

            </div>
          )}

        </section>

        {/* =================================================
            FLOW
        ================================================= */}

        <section className="civilian-plan-flow">

          <div className="civilian-plan-flow-item active">

            <span className="civilian-plan-flow-number">
              1
            </span>

            <span className="civilian-plan-flow-label">
              Plan
            </span>

          </div>

          <i className="fas fa-arrow-right civilian-plan-flow-arrow" />

          <div className="civilian-plan-flow-item">

            <span className="civilian-plan-flow-number">
              2
            </span>

            <span className="civilian-plan-flow-label">
              Full KYC
            </span>

          </div>

          <i className="fas fa-arrow-right civilian-plan-flow-arrow" />

          <div className="civilian-plan-flow-item">

            <span className="civilian-plan-flow-number">
              3
            </span>

            <span className="civilian-plan-flow-label">
              Payment
            </span>

          </div>

          <i className="fas fa-arrow-right civilian-plan-flow-arrow" />

          <div className="civilian-plan-flow-item">

            <span className="civilian-plan-flow-number">
              4
            </span>

            <span className="civilian-plan-flow-label">
              Admin Approval
            </span>

          </div>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="civilian-plan-error">

            <i className="fas fa-circle-exclamation" />

            <span>
              {error}
            </span>

          </div>
        )}

        {/* =================================================
            PLAN GRID
        ================================================= */}

        <section className="civilian-plan-grid">

          {CIVILIAN_PLANS.map(
            (
              plan
            ) => {
              const isSelected =
                selectedPlan ===
                plan.amount;

              const isLoading =
                loadingPlan ===
                plan.amount;

              return (
                <article
                  key={
                    plan.id
                  }
                  className={[
                    "civilian-plan-card",

                    isSelected
                      ? "selected"
                      : "",

                    plan.royalty
                      ? "royalty"
                      : "",
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      " "
                    )}
                >

                  {/* =======================================
                      ROYALTY BADGE
                  ======================================= */}

                  {plan.royalty && (
                    <div className="civilian-royalty-badge">

                      <i className="fas fa-crown" />

                      <span>
                        Royalty Plan
                      </span>

                    </div>
                  )}

                  {/* =======================================
                      CARD TOP
                  ======================================= */}

                  <div className="civilian-plan-card-top">

                    <div className="civilian-plan-card-heading">

                      <span className="civilian-plan-card-label">
                        Civilian Membership
                      </span>

                      <h2>
                        {plan.name}
                      </h2>

                    </div>

                    <div className="civilian-plan-price">

                      <span className="civilian-plan-price-symbol">
                        ₹
                      </span>

                      <strong>
                        {plan.amount}
                      </strong>

                    </div>

                  </div>

                  {/* =======================================
                      DESCRIPTION
                  ======================================= */}

                  <p className="civilian-plan-card-description">
                    {plan.description}
                  </p>

                  {/* =======================================
                      DIVIDER
                  ======================================= */}

                  <div className="civilian-plan-divider" />

                  {/* =======================================
                      FEATURES
                  ======================================= */}

                  <div className="civilian-plan-features-wrap">

                    <span className="civilian-plan-features-title">
                      What's included
                    </span>

                    <ul className="civilian-plan-features">

                      {plan.features.map(
                        (
                          feature
                        ) => (
                          <li
                            key={
                              feature
                            }
                          >

                            <span className="civilian-plan-feature-icon">

                              <i className="fas fa-check" />

                            </span>

                            <span>
                              {feature}
                            </span>

                          </li>
                        )
                      )}

                    </ul>

                  </div>

                  {/* =======================================
                      BOTTOM
                  ======================================= */}

                  <div className="civilian-plan-card-bottom">

                    {isSelected && (
                      <div className="civilian-plan-selected-note">

                        <i className="fas fa-circle-check" />

                        <span>
                          Currently selected plan
                        </span>

                      </div>
                    )}

                    <button
                      type="button"
                      className="civilian-plan-button"
                      disabled={
                        Boolean(
                          loadingPlan
                        )
                      }
                      onClick={() =>
                        handlePlanSelect(
                          plan
                        )
                      }
                    >

                      {isLoading ? (
                        <>
                          <i className="fas fa-circle-notch fa-spin" />

                          <span>
                            Saving Plan...
                          </span>
                        </>
                      ) : (
                        <>
                          <span>
                            {isSelected
                              ? `Continue with ₹${plan.amount}`
                              : `Choose ₹${plan.amount}`}
                          </span>

                          <i className="fas fa-arrow-right" />
                        </>
                      )}

                    </button>

                  </div>

                </article>
              );
            }
          )}

        </section>

        {/* =================================================
            NOTE
        ================================================= */}

        <section className="civilian-membership-note">

          <div className="civilian-membership-note-icon">

            <i className="fas fa-shield-halved" />

          </div>

          <div>

            <strong>
              Important
            </strong>

            <p>
              Your selected membership amount is saved
              before Full KYC. After completing Full KYC,
              you will continue directly to Payment.
              Referral, QR Code, Public Profile and Royalty
              benefits remain locked until admin approval.
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}