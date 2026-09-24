import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  COMMERCIAL_PLAN_FALLBACK,
  getCommercialMembershipOptions,
  getSelectedCommercialMembership,
  selectCommercialMembership,
} from "../../../services/commercialMembership.service";

import "./CommercialMembershipPlan.css";

/* =========================================================
   FRONTEND ROUTES

   IMPORTANT:
   These paths match the CURRENT App.jsx exactly.

   basic
     -> /commercial/payment

   profile_upgrade
     -> /commercial/profile-upgrade
========================================================= */

const COMMERCIAL_FRONTEND_ROUTES = {
  basic:
    "/commercial/profile-upgrade",

  profile_upgrade:
    "/commercial/profile-upgrade",
};

/* =========================================================
   STATIC UI CONTENT

   Backend remains source of truth for:
   - plan id
   - amount
   - selection
========================================================= */

const PLAN_UI = {
  basic: {
    icon:
      "fa-solid fa-store",

    badge:
      "Starter",

    subtitle:
      "Start your Commercial Membership",

    description:
      "A simple membership option for businesses that want to join INMBA and activate their Commercial account.",

    features: [
      "Commercial Membership access",
      "Business account activation",
      "Membership dashboard access",
      "Referral network eligibility",
      "Secure payment verification",
    ],
  },

  profile_upgrade: {
    icon:
      "fa-solid fa-building-shield",

    badge:
      "Recommended",

    subtitle:
      "Build your verified business profile",

    description:
      "Complete the advanced Commercial KYC and unlock your verified business profile, QR access and public directory presence.",

    features: [
      "Everything in Basic Membership",
      "Full Commercial KYC A–G",
      "Verified Commercial Profile",
      "Business Public Profile",
      "QR Profile access",
      "Verification badges",
      "Business directory readiness",
    ],
  },
};

/* =========================================================
   COMPONENT
========================================================= */

export default function CommercialMembershipPlan() {
  const navigate =
    useNavigate();

  const [
    plans,
    setPlans,
  ] =
    useState([]);

  const [
    currentPlan,
    setCurrentPlan,
  ] =
    useState(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    selectingPlanId,
    setSelectingPlanId,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     LOAD PLAN OPTIONS
  ======================================================= */

  useEffect(
    () => {
      let active =
        true;

      const loadPage =
        async () => {
          try {
            setLoading(
              true
            );

            setError(
              ""
            );

            const [
              optionsResult,
              selectedResult,
            ] =
              await Promise.all([
                getCommercialMembershipOptions(),

                getSelectedCommercialMembership()
                  .catch(
                    () => ({
                      selected:
                        false,

                      selectedPlan:
                        null,
                    })
                  ),
              ]);

            if (
              !active
            ) {
              return;
            }

            const loadedPlans =
              Array.isArray(
                optionsResult
                  ?.plans
              ) &&
              optionsResult
                .plans
                .length >
                0
                ? optionsResult
                    .plans
                : [
                    COMMERCIAL_PLAN_FALLBACK
                      .basic,

                    COMMERCIAL_PLAN_FALLBACK
                      .profile_upgrade,
                  ];

            setPlans(
              loadedPlans
            );

            setCurrentPlan(
              selectedResult
                ?.selectedPlan ||
              null
            );
          } catch (
            requestError
          ) {
            if (
              !active
            ) {
              return;
            }

            console.error(
              "Commercial Membership Load Error:",
              requestError
            );

            setError(
              requestError
                ?.apiMessage ||
              requestError
                ?.message ||
              "Unable to load Commercial Membership plans."
            );

            /*
              UI fallback only.

              API selection still requires backend.
            */

            setPlans([
              COMMERCIAL_PLAN_FALLBACK
                .basic,

              COMMERCIAL_PLAN_FALLBACK
                .profile_upgrade,
            ]);
          } finally {
            if (
              active
            ) {
              setLoading(
                false
              );
            }
          }
        };

      loadPage();

      return () => {
        active =
          false;
      };
    },
    []
  );

  /* =======================================================
     SORT

     Basic first
     Profile Upgrade second
  ======================================================= */

  const sortedPlans =
    useMemo(
      () => {
        const priority = {
          basic:
            1,

          profile_upgrade:
            2,
        };

        return [
          ...plans,
        ].sort(
          (
            a,
            b
          ) =>
            (
              priority[
                a?.id
              ] ||
              99
            ) -
            (
              priority[
                b?.id
              ] ||
              99
            )
        );
      },
      [
        plans,
      ]
    );

  /* =======================================================
     SELECT PLAN
  ======================================================= */

  const handleSelectPlan =
    async (
      plan
    ) => {
      const planId =
        String(
          plan?.id ||
          ""
        ).trim();

      if (
        !planId ||
        selectingPlanId
      ) {
        return;
      }

      try {
        setSelectingPlanId(
          planId
        );

        setError(
          ""
        );

        const result =
          await selectCommercialMembership(
            planId
          );

        const selectedPlan =
          result
            ?.selectedPlan ||
          plan;

        setCurrentPlan(
          selectedPlan
        );

        /* ===============================================
           DO NOT USE BACKEND URL DIRECTLY HERE.

           Backend:
             /commercial-payment
             /commercial-kyc

           Current App.jsx:
             /commercial/payment
             /commercial/profile-upgrade
        =============================================== */

        const frontendPath =
          COMMERCIAL_FRONTEND_ROUTES[
            selectedPlan
              ?.id
          ];

        if (
          !frontendPath
        ) {
          throw new Error(
            "Commercial Membership destination route is unavailable."
          );
        }

        navigate(
          frontendPath
        );
      } catch (
        requestError
      ) {
        console.error(
          "Commercial Membership Selection Error:",
          requestError
        );

        const statusCode =
          Number(
            requestError
              ?.statusCode ||
            requestError
              ?.response
              ?.status ||
            0
          );

        if (
          statusCode ===
          401
        ) {
          setError(
            "Your login session has expired. Please login again."
          );

          return;
        }

        setError(
          requestError
            ?.apiMessage ||
          requestError
            ?.message ||
          "Unable to select Commercial Membership plan."
        );
      } finally {
        setSelectingPlanId(
          ""
        );
      }
    };

  /* =======================================================
     LOGIN
  ======================================================= */

  const handleLogin =
    () => {
      navigate(
        "/login"
      );
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="cmp-page">
      {/* ===================================================
          BACKGROUND DECORATION
      =================================================== */}

      <div
        className="cmp-orb cmp-orb-one"
        aria-hidden="true"
      />

      <div
        className="cmp-orb cmp-orb-two"
        aria-hidden="true"
      />

      <div
        className="cmp-orb cmp-orb-three"
        aria-hidden="true"
      />

      <section className="cmp-shell">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="cmp-header">
          <div className="cmp-brand-row">
            <div className="cmp-logo">
              <i className="fa-solid fa-building" />

              <span>
                INMBA
              </span>
            </div>

            <div className="cmp-secure-pill">
              <i className="fa-solid fa-shield-halved" />

              Secure Commercial Membership
            </div>
          </div>

          <div className="cmp-heading-wrap">
            <span className="cmp-eyebrow">
              COMMERCIAL MEMBERSHIP
            </span>

            <h1>
              Choose the right plan
              for your business
            </h1>

            <p>
              Start with Basic Membership or build a
              complete verified Commercial Profile with
              advanced KYC and public business visibility.
            </p>
          </div>

          {/* =================================================
              PROGRESS
          ================================================= */}

          <div className="cmp-progress">
            <div className="cmp-progress-item completed">
              <span className="cmp-progress-circle">
                <i className="fa-solid fa-check" />
              </span>

              <div>
                <strong>
                  Registration
                </strong>

                <small>
                  Completed
                </small>
              </div>
            </div>

            <div className="cmp-progress-line completed" />

            <div className="cmp-progress-item completed">
              <span className="cmp-progress-circle">
                <i className="fa-solid fa-check" />
              </span>

              <div>
                <strong>
                  Login
                </strong>

                <small>
                  Verified
                </small>
              </div>
            </div>

            <div className="cmp-progress-line active" />

            <div className="cmp-progress-item active">
              <span className="cmp-progress-circle">
                3
              </span>

              <div>
                <strong>
                  Membership
                </strong>

                <small>
                  Choose plan
                </small>
              </div>
            </div>

            <div className="cmp-progress-line" />

            <div className="cmp-progress-item">
              <span className="cmp-progress-circle">
                4
              </span>

              <div>
                <strong>
                  Activation
                </strong>

                <small>
                  Next
                </small>
              </div>
            </div>
          </div>
        </header>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            className="cmp-alert"
            role="alert"
          >
            <div className="cmp-alert-icon">
              <i className="fa-solid fa-circle-exclamation" />
            </div>

            <div className="cmp-alert-content">
              <strong>
                Unable to continue
              </strong>

              <span>
                {error}
              </span>
            </div>

            <button
              type="button"
              className="cmp-alert-login"
              onClick={
                handleLogin
              }
            >
              Login
            </button>
          </div>
        )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (
          <div className="cmp-loading-card">
            <div className="cmp-spinner" />

            <h3>
              Loading Commercial Membership
            </h3>

            <p>
              Please wait while we load your membership
              options.
            </p>
          </div>
        ) : (
          <>
            {/* ===============================================
                PLAN GRID
            =============================================== */}

            <section className="cmp-plan-grid">
              {sortedPlans.map(
                (
                  plan
                ) => {
                  const ui =
                    PLAN_UI[
                      plan.id
                    ] ||
                    {};

                  const isUpgrade =
                    plan.id ===
                    "profile_upgrade";

                  const isCurrent =
                    currentPlan
                      ?.id ===
                    plan.id;

                  const isSelecting =
                    selectingPlanId ===
                    plan.id;

                  return (
                    <article
                      key={
                        plan.id
                      }
                      className={[
                        "cmp-plan-card",

                        isUpgrade
                          ? "cmp-plan-card-premium"
                          : "",

                        isCurrent
                          ? "cmp-plan-card-selected"
                          : "",
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " "
                        )}
                    >
                      {isUpgrade && (
                        <div className="cmp-recommended">
                          <i className="fa-solid fa-crown" />

                          RECOMMENDED
                        </div>
                      )}

                      <div className="cmp-plan-top">
                        <div
                          className={[
                            "cmp-plan-icon",

                            isUpgrade
                              ? "premium"
                              : "",
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " "
                            )}
                        >
                          <i
                            className={
                              ui.icon ||
                              "fa-solid fa-store"
                            }
                          />
                        </div>

                        <div className="cmp-plan-name">
                          <span>
                            {ui.badge ||
                              "Membership"}
                          </span>

                          <h2>
                            {plan.name}
                          </h2>

                          <p>
                            {ui.subtitle ||
                              ""}
                          </p>
                        </div>
                      </div>

                      <div className="cmp-price-row">
                        <span className="cmp-currency">
                          ₹
                        </span>

                        <strong>
                          {Number(
                            plan.amount
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                        <span className="cmp-price-note">
                          one-time
                        </span>
                      </div>

                      <p className="cmp-plan-description">
                        {ui.description}
                      </p>

                      <div className="cmp-divider" />

                      <div className="cmp-feature-title">
                        <i className="fa-solid fa-circle-check" />

                        What you get
                      </div>

                      <ul className="cmp-feature-list">
                        {(
                          ui.features ||
                          []
                        ).map(
                          (
                            feature
                          ) => (
                            <li
                              key={
                                feature
                              }
                            >
                              <span className="cmp-feature-check">
                                <i className="fa-solid fa-check" />
                              </span>

                              {feature}
                            </li>
                          )
                        )}
                      </ul>

                      {isUpgrade && (
                        <div className="cmp-kyc-note">
                          <i className="fa-solid fa-id-card" />

                          <div>
                            <strong>
                              Full KYC required
                            </strong>

                            <span>
                              Complete Commercial KYC A–G
                              before profile activation.
                            </span>
                          </div>
                        </div>
                      )}

                      {!isUpgrade && (
                        <div className="cmp-basic-note">
                          <i className="fa-solid fa-bolt" />

                          <div>
                            <strong>
                              Quick activation flow
                            </strong>

                            <span>
                              Continue directly to the ₹300
                              payment page.
                            </span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        className={[
                          "cmp-select-button",

                          isUpgrade
                            ? "premium"
                            : "",
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " "
                          )}
                        disabled={
                          Boolean(
                            selectingPlanId
                          )
                        }
                        onClick={() =>
                          handleSelectPlan(
                            plan
                          )
                        }
                      >
                        {isSelecting ? (
                          <>
                            <span className="cmp-button-spinner" />

                            Selecting...
                          </>
                        ) : (
                          <>
                            {isCurrent
                              ? "Continue with this plan"
                              : isUpgrade
                                ? "Choose Profile Upgrade"
                                : "Choose Basic Membership"}

                            <i className="fa-solid fa-arrow-right" />
                          </>
                        )}
                      </button>

                      {isCurrent && (
                        <div className="cmp-current-plan">
                          <i className="fa-solid fa-circle-check" />

                          Currently selected
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </section>

            {/* ===============================================
                SECURITY FOOTER
            =============================================== */}

            <section className="cmp-security">
              <div className="cmp-security-icon">
                <i className="fa-solid fa-lock" />
              </div>

              <div>
                <strong>
                  Your Commercial data is protected
                </strong>

                <p>
                  Payment amount and membership selection
                  are validated by the backend. Sensitive
                  KYC information is not shown on the public
                  profile.
                </p>
              </div>
            </section>
          </>
        )}

        <footer className="cmp-footer">
          <button
            type="button"
            className="cmp-back-button"
            onClick={() =>
              navigate(
                "/commercial-login-id"
              )
            }
          >
            <i className="fa-solid fa-arrow-left" />

            Back
          </button>

          <span>
            INMBA Commercial Membership
          </span>
        </footer>
      </section>
    </main>
  );
}