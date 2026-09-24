import React, {
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  getProfessionalFlowLoginId,
  setProfessionalNextRoute,
} from "../../services/professionalFlow.service";

import {
  saveProfessionalKycPlan,
} from "../../services/professionalKyc.service";

import "./ProfessionalMembership.css";

/* =========================================================
   PROFESSIONAL MEMBERSHIP PLANS

   NEW FLOW:

   ₹300
   → Save selected_plan = 300
   → Professional Full KYC A-J
   → Payment
   → Admin Approval
   → INMBA Network Member

   ₹1500
   → Save selected_plan = 1500
   → Professional Full KYC A-J
   → Payment
   → Admin Approval
   → INMBA Network Royalty Member
========================================================= */

const MEMBERSHIP_PLANS = [
  {
    id: "network_member",

    name:
      "INMBA Network Member",

    amount: 300,

    badge:
      "NETWORK",

    description:
      "Complete your Professional Full KYC and activate your INMBA Network Membership.",

    features: [
      "Professional Member account",
      "Professional Full KYC A-J",
      "Referral access after approval",
      "QR Code after approval",
      "Public Profile after approval",
      "Professional network access",
    ],

    button:
      "Choose ₹300 Plan",

    icon:
      "fas fa-user-tie",
  },

  {
    id:
      "network_royalty_member",

    name:
      "INMBA Network Royalty Member",

    amount: 1500,

    badge:
      "ROYALTY",

    description:
      "Complete your Professional Full KYC and unlock Network Royalty Membership after approval.",

    features: [
      "Professional Member account",
      "Professional Full KYC A-J",
      "Referral access after approval",
      "QR Code after approval",
      "Public Profile after approval",
      "Professional network access",
      "Royalty & Rewards after approval",
    ],

    button:
      "Choose ₹1500 Plan",

    icon:
      "fas fa-crown",
  },
];

/* =========================================================
   STORAGE
========================================================= */

const MEMBERSHIP_STORAGE_KEY =
  "inmba_professional_membership_plan";

/* =========================================================
   HELPERS
========================================================= */

const asObject = (
  value
) => {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
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

  return (
    text ||
    fallback
  );
};

/* =========================================================
   GET STORED MEMBERSHIP
========================================================= */

const getStoredMembership =
  () => {
    try {
      const raw =
        sessionStorage.getItem(
          MEMBERSHIP_STORAGE_KEY
        );

      if (!raw) {
        return {};
      }

      return asObject(
        JSON.parse(
          raw
        )
      );
    } catch {
      return {};
    }
  };

/* =========================================================
   GET API ERROR MESSAGE
========================================================= */

const getErrorMessage = (
  error
) => {
  return (
    error?.response?.data
      ?.message ||
    error?.data?.message ||
    error?.message ||
    "Unable to save Professional membership plan."
  );
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ProfessionalMembership() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  /* =======================================================
     LOCATION STATE
  ======================================================= */

  const locationState =
    useMemo(
      () =>
        asObject(
          location.state
        ),
      [
        location.state,
      ]
    );

  /* =======================================================
     STORED MEMBERSHIP
  ======================================================= */

  const storedMembership =
    useMemo(
      () =>
        getStoredMembership(),
      []
    );

  /* =======================================================
     LOGIN ID
  ======================================================= */

  const loginId =
    useMemo(
      () =>
        toText(
          locationState
            .loginId ??
            locationState
              .member
              ?.login_id ??
            locationState
              .member
              ?.loginId ??
            getProfessionalFlowLoginId() ??
            storedMembership
              .loginId
        ),
      [
        locationState,
        storedMembership,
      ]
    );

  /* =======================================================
     STATE
  ======================================================= */

  const [
    selectedPlan,
    setSelectedPlan,
  ] =
    useState(
      toText(
        storedMembership
          .planId
      )
    );

  const [
    continuingPlan,
    setContinuingPlan,
  ] =
    useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  /* =======================================================
     SAVE LOCAL MEMBERSHIP SELECTION
  ======================================================= */

  const saveMembershipSelection =
    (
      plan
    ) => {
      const membershipSelection =
        {
          planId:
            plan.id,

          planName:
            plan.name,

          selectedPlan:
            String(
              plan.amount
            ),

          selected_plan:
            String(
              plan.amount
            ),

          amount:
            plan.amount,

          loginId,

          membershipType:
            "Professional Member",

          membershipLevel:
            plan.amount ===
            1500
              ? "INMBA Network Royalty Member"
              : "INMBA Network Member",

          selectedAt:
            new Date()
              .toISOString(),
        };

      sessionStorage.setItem(
        MEMBERSHIP_STORAGE_KEY,
        JSON.stringify(
          membershipSelection
        )
      );

      localStorage.setItem(
        "professionalSelectedPlan",
        String(
          plan.amount
        )
      );

      return membershipSelection;
    };

  /* =======================================================
     CHOOSE MEMBERSHIP

     IMPORTANT:

     BOTH ₹300 AND ₹1500
     GO TO SAME PROFESSIONAL FULL KYC A-J.
  ======================================================= */

  const handleChoosePlan =
    async (
      plan
    ) => {
      if (
        !plan ||
        !plan.id
      ) {
        return;
      }

      if (
        continuingPlan
      ) {
        return;
      }

      const planAmount =
        String(
          plan.amount
        );

      if (
        ![
          "300",
          "1500",
        ].includes(
          planAmount
        )
      ) {
        setErrorMessage(
          "Please select a valid Professional membership plan."
        );

        return;
      }

      try {
        setErrorMessage(
          ""
        );

        setSelectedPlan(
          plan.id
        );

        setContinuingPlan(
          plan.id
        );

        /* ===============================================
           STEP 1:
           SAVE PLAN IN BACKEND
        =============================================== */

        await saveProfessionalKycPlan(
          planAmount
        );

        /* ===============================================
           STEP 2:
           SAVE FRONTEND FLOW DATA
        =============================================== */

        const membershipSelection =
          saveMembershipSelection(
            plan
          );

        /* ===============================================
           STEP 3:
           NEXT ROUTE = SAME FULL KYC
        =============================================== */

        setProfessionalNextRoute(
          `/professional-kyc?plan=${encodeURIComponent(
            planAmount
          )}`
        );

        /* ===============================================
           STEP 4:
           OPEN PROFESSIONAL FULL KYC A-J

           BOTH ₹300 + ₹1500
           COME HERE.
        =============================================== */

        navigate(
          `/professional-kyc?plan=${encodeURIComponent(
            planAmount
          )}`,
          {
            state: {
              membershipSelection,

              loginId,

              membershipType:
                "Professional Member",

              selectedPlan:
                planAmount,

              selected_plan:
                planAmount,

              amount:
                plan.amount,

              professionalFlow:
                "full_kyc",

              startSection:
                "A",
            },
          }
        );
      } catch (
        error
      ) {
        console.error(
          "Professional plan selection failed:",
          error
        );

        setErrorMessage(
          getErrorMessage(
            error
          )
        );

        setContinuingPlan(
          ""
        );
      }
    };

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <main className="pro-membership-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="pro-membership-header">

        <div className="pro-membership-logo">

          <span>
            I
          </span>

          <div>
            <strong>
              INMBA
            </strong>

            <small>
              Professional Membership
            </small>
          </div>

        </div>

        {loginId && (
          <div className="pro-membership-member-id">

            <small>
              Login ID
            </small>

            <strong>
              {loginId}
            </strong>

          </div>
        )}

      </header>

      {/* =================================================
          PROGRESS
      ================================================= */}

      <section className="pro-membership-progress">

        <div className="pro-membership-step completed">

          <span>
            <i className="fas fa-check" />
          </span>

          <small>
            Basic KYC
          </small>

        </div>

        <div className="pro-membership-line completed" />

        <div className="pro-membership-step completed">

          <span>
            <i className="fas fa-check" />
          </span>

          <small>
            Login
          </small>

        </div>

        <div className="pro-membership-line active" />

        <div className="pro-membership-step active">

          <span>
            3
          </span>

          <small>
            Membership
          </small>

        </div>

        <div className="pro-membership-line" />

        <div className="pro-membership-step">

          <span>
            4
          </span>

          <small>
            Full KYC
          </small>

        </div>

      </section>

      {/* =================================================
          HEADING
      ================================================= */}

      <section className="pro-membership-heading">

        <span className="pro-membership-heading-label">
          PROFESSIONAL MEMBERSHIP
        </span>

        <h1>
          Choose Your Professional Membership
        </h1>

        <p>
          Select ₹300 Network Membership or
          ₹1500 Network Royalty Membership.
          Both plans require Professional Full
          KYC A-J before payment and approval.
        </p>

      </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {errorMessage && (
        <div
          style={{
            maxWidth:
              "900px",

            margin:
              "0 auto 20px",

            padding:
              "14px 18px",

            borderRadius:
              "12px",

            background:
              "#fff3f3",

            border:
              "1px solid #ffcaca",

            fontSize:
              "0.85rem",
          }}
        >
          <i
            className="fas fa-circle-exclamation"
            style={{
              marginRight:
                "8px",
            }}
          />

          {errorMessage}
        </div>
      )}

      {/* =================================================
          MEMBERSHIP PLANS
      ================================================= */}

      <section className="pro-membership-plans">

        {MEMBERSHIP_PLANS.map(
          (
            plan
          ) => {
            const selected =
              selectedPlan ===
              plan.id;

            const loading =
              continuingPlan ===
              plan.id;

            const recommended =
              plan.amount ===
              1500;

            return (
              <article
                key={
                  plan.id
                }
                className={[
                  "pro-membership-card",

                  recommended
                    ? "recommended"
                    : "",

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
              >

                {/* ===============================
                    RECOMMENDED
                =============================== */}

                {recommended && (
                  <div className="pro-membership-recommended-badge">
                    Royalty Plan
                  </div>
                )}

                {/* ===============================
                    CARD TOP
                =============================== */}

                <div className="pro-membership-card-top">

                  <span className="pro-membership-plan-badge">
                    {plan.badge}
                  </span>

                  <div className="pro-membership-plan-icon">

                    <i
                      className={
                        plan.icon
                      }
                    />

                  </div>

                  <h2>
                    {plan.name}
                  </h2>

                  <p>
                    {plan.description}
                  </p>

                </div>

                {/* ===============================
                    PRICE
                =============================== */}

                <div className="pro-membership-price">

                  <span>
                    ₹
                  </span>

                  <strong>
                    {plan.amount}
                  </strong>

                  <small>
                    Membership Fee
                  </small>

                </div>

                <div className="pro-membership-divider" />

                {/* ===============================
                    FEATURES
                =============================== */}

                <div className="pro-membership-features">

                  {plan.features.map(
                    (
                      feature
                    ) => (
                      <div
                        key={
                          feature
                        }
                      >

                        <span>
                          <i className="fas fa-check" />
                        </span>

                        <p>
                          {feature}
                        </p>

                      </div>
                    )
                  )}

                </div>

                {/* ===============================
                    SELECT BUTTON
                =============================== */}

                <button
                  type="button"
                  className="pro-membership-select-button"
                  onClick={() =>
                    handleChoosePlan(
                      plan
                    )
                  }
                  disabled={
                    Boolean(
                      continuingPlan
                    )
                  }
                >

                  {loading ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin" />

                      <span>
                        Saving Plan...
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        {plan.button}
                      </span>

                      <i className="fas fa-arrow-right" />
                    </>
                  )}

                </button>

                {/* ===============================
                    FLOW
                =============================== */}

                <div
                  style={{
                    marginTop:
                      "12px",

                    textAlign:
                      "center",

                    color:
                      "#8b95a3",

                    fontSize:
                      "0.56rem",

                    lineHeight:
                      1.5,
                  }}
                >
                  ₹{plan.amount}
                  {" → "}
                  Professional Full KYC A-J
                  {" → "}
                  Payment
                  {" → "}
                  Admin Approval
                </div>

              </article>
            );
          }
        )}

      </section>

      {/* =================================================
          INFO
      ================================================= */}

      <div className="pro-membership-info">

        <i className="fas fa-shield-halved" />

        <span>
          Secure INMBA Professional
          Membership Selection
        </span>

      </div>

    </main>
  );
}