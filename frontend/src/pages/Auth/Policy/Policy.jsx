import React, {
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  useAuth,
} from "../../../context/AuthContext";

import {
  acceptMembershipPolicy,
} from "../../../services/policy.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./Policy.css";

/* ========================================
   POLICY SECTIONS

   Policy acceptance backend behaviour
   மட்டும் exact legacy route-ல் உள்ளது.

   இந்த content membership, payment,
   KYC workflow-ஐ தெளிவாக காட்டுகிறது.
======================================== */

const POLICY_SECTIONS = [
  {
    id: "information",

    icon:
      "fas fa-user-check",

    title:
      "Member Information",

    description:
      "Registration, profile, nominee and contact information must be complete and accurate.",

    points: [
      "The applicant is responsible for providing correct personal details.",
      "Email address and mobile number must belong to the registered applicant.",
      "Changes to member information must be updated through the profile workflow.",
    ],
  },

  {
    id: "payment",

    icon:
      "fas fa-credit-card",

    title:
      "Membership Payment",

    description:
      "Membership payment information must match the actual transaction submitted by the member.",

    points: [
      "Payment amount, method and transaction ID must be entered correctly.",
      "Uploaded payment proof must represent the submitted transaction.",
      "Submitting payment does not automatically complete KYC verification.",
    ],
  },

  {
    id: "kyc",

    icon:
      "fas fa-file-shield",

    title:
      "KYC & Documents",

    description:
      "Identity, bank, PAN, Aadhaar and supporting documents are subject to verification.",

    points: [
      "Uploaded documents must be clear, valid and related to the registered member.",
      "Incorrect or unreadable documents may delay the verification process.",
      "The member must complete all required KYC stages before final approval.",
    ],
  },

  {
    id: "approval",

    icon:
      "fas fa-user-shield",

    title:
      "Membership Approval",

    description:
      "A submitted application may remain pending until reviewed by an authorized administrator.",

    points: [
      "Registration submission and membership approval are separate stages.",
      "The administrator may approve, reject or request corrections.",
      "Member access and status depend on the current verification result.",
    ],
  },

  {
    id: "network",

    icon:
      "fas fa-network-wired",

    title:
      "Referral & Network",

    description:
      "Referral, direct network and indirect network information depends on valid membership records.",

    points: [
      "Referral IDs must belong to valid INMBA members.",
      "Network values are calculated using registered member relationships.",
      "Royalty or reward information depends on approved payment and network data.",
    ],
  },

  {
    id: "security",

    icon:
      "fas fa-lock",

    title:
      "Account Security",

    description:
      "The member is responsible for protecting account credentials and OTP information.",

    points: [
      "Login ID, password and OTP must not be shared with another person.",
      "Suspicious account activity should be reported to INMBA support.",
      "The member should logout after using a shared or public device.",
    ],
  },
];

/* ========================================
   HELPERS
======================================== */

const asObject = (
  value
) => {
  if (
    value &&
    typeof value ===
      "object" &&
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
  const normalizedValue =
    String(
      value ?? ""
    ).trim();

  return (
    normalizedValue ||
    fallback
  );
};

/* ========================================
   MEMBER NAME
======================================== */

const getMemberName = (
  member
) => {
  const source =
    asObject(member);

  const firstName =
    toText(
      source.first_name ??
        source.firstName
    );

  const lastName =
    toText(
      source.last_name ??
        source.lastName
    );

  return (
    `${firstName} ${lastName}`.trim() ||
    toText(
      source.name,
      "INMBA Member"
    )
  );
};

/* ========================================
   MEMBER LOGIN ID
======================================== */

const getMemberLoginId = (
  member
) => {
  const source =
    asObject(member);

  return toText(
    source.login_id ??
      source.loginId,
    "Not available"
  );
};

/* ========================================
   POLICY PAGE
======================================== */

export default function Policy() {
  const navigate =
    useNavigate();

  const {
    member,
  } =
    useAuth();

  const [
    accepted,
    setAccepted,
  ] =
    useState(false);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    pageError,
    setPageError,
  ] =
    useState("");

  const memberName =
    useMemo(
      () =>
        getMemberName(
          member
        ),
      [
        member,
      ]
    );

  const memberLoginId =
    useMemo(
      () =>
        getMemberLoginId(
          member
        ),
      [
        member,
      ]
    );

  /* ========================================
     ACCEPT POLICY

     Exact API:
     POST /accept_policy

     Request body:
     None
  ======================================== */

  const handleAcceptPolicy =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        submitting
      ) {
        return;
      }

      if (!accepted) {
        setPageError(
          "Please read and accept the membership policy before continuing."
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        setPageError("");

        const result =
          await acceptMembershipPolicy();

        toast.success(
          result.message ||
            "Membership policy accepted successfully."
        );

        navigate(
          result.nextRoute ||
            "/payment",
          {
            replace: true,

            state: {
              message:
                result.message ||
                "Policy accepted successfully. Continue with membership payment.",
            },
          }
        );
      } catch (
        requestError
      ) {
        if (
          requestError
            ?.sessionExpired ||
          Number(
            requestError
              ?.statusCode ||
              requestError
                ?.response
                ?.status ||
              0
          ) === 401
        ) {
          navigate(
            "/login",
            {
              replace: true,

              state: {
                error:
                  "Your session has expired. Please login again.",

                from:
                  "/policy",
              },
            }
          );

          return;
        }

        setPageError(
          getApiErrorMessage(
            requestError,
            "Unable to accept membership policy."
          )
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* ========================================
     CHECKBOX CHANGE
  ======================================== */

  const handleAcceptanceChange =
    (
      event
    ) => {
      setAccepted(
        event.target.checked
      );

      setPageError("");
    };

  return (
    <main className="inmba-policy-page">
      <div className="inmba-policy-container">
        {/* =================================
            HERO
        ================================= */}

        <header className="inmba-policy-hero">
          <div className="inmba-policy-hero-content">
            <p>
              INMBA Member Portal
            </p>

            <h1>
              Membership Policy
            </h1>

            <span>
              Review the membership, payment, verification and
              account responsibilities before continuing to the
              payment stage.
            </span>
          </div>

          <div className="inmba-policy-hero-icon">
            <i
              className="fas fa-file-contract"
              aria-hidden="true"
            ></i>
          </div>
        </header>

        {/* =================================
            MEMBER SUMMARY
        ================================= */}

        <section className="inmba-policy-member-card">
          <span>
            {memberName
              .charAt(0)
              .toUpperCase()}
          </span>

          <div>
            <p>
              Policy acceptance for
            </p>

            <h2>
              {memberName}
            </h2>

            <small>
              Login ID:{" "}
              {memberLoginId}
            </small>
          </div>

          <div className="inmba-policy-member-status">
            <i
              className="fas fa-clock"
              aria-hidden="true"
            ></i>

            <span>
              Acceptance Pending
            </span>
          </div>
        </section>

        {/* =================================
            POLICY LAYOUT
        ================================= */}

        <div className="inmba-policy-layout">
          {/* POLICY CONTENT */}

          <section className="inmba-policy-content">
            <div className="inmba-policy-introduction">
              <span>
                <i
                  className="fas fa-circle-info"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <h2>
                  Before You Continue
                </h2>

                <p>
                  Policy acceptance is stored in the current
                  authenticated session. After acceptance, the
                  membership process continues to the payment page.
                </p>
              </div>
            </div>

            <div className="inmba-policy-section-list">
              {POLICY_SECTIONS.map(
                (
                  policySection,
                  index
                ) => (
                  <article
                    className="inmba-policy-section"
                    key={
                      policySection.id
                    }
                  >
                    <header>
                      <span>
                        <i
                          className={
                            policySection.icon
                          }
                          aria-hidden="true"
                        ></i>
                      </span>

                      <div>
                        <small>
                          Policy{" "}
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </small>

                        <h2>
                          {
                            policySection.title
                          }
                        </h2>
                      </div>
                    </header>

                    <p>
                      {
                        policySection.description
                      }
                    </p>

                    <ul>
                      {policySection.points.map(
                        (
                          point
                        ) => (
                          <li
                            key={
                              point
                            }
                          >
                            <i
                              className="fas fa-circle-check"
                              aria-hidden="true"
                            ></i>

                            <span>
                              {point}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </article>
                )
              )}
            </div>
          </section>

          {/* ACCEPTANCE SIDEBAR */}

          <aside className="inmba-policy-sidebar">
            <div className="inmba-policy-progress">
              <span>
                <i
                  className="fas fa-list-check"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <p>
                  Policy Summary
                </p>

                <h3>
                  {
                    POLICY_SECTIONS.length
                  }{" "}
                  Sections
                </h3>
              </div>
            </div>

            <div className="inmba-policy-flow">
              <article className="inmba-policy-flow-completed">
                <span>
                  <i
                    className="fas fa-check"
                    aria-hidden="true"
                  ></i>
                </span>

                <div>
                  <strong>
                    Member Login
                  </strong>

                  <small>
                    Completed
                  </small>
                </div>
              </article>

              <article className="inmba-policy-flow-current">
                <span>
                  2
                </span>

                <div>
                  <strong>
                    Policy Acceptance
                  </strong>

                  <small>
                    Current stage
                  </small>
                </div>
              </article>

              <article>
                <span>
                  3
                </span>

                <div>
                  <strong>
                    Membership Payment
                  </strong>

                  <small>
                    Next stage
                  </small>
                </div>
              </article>

              <article>
                <span>
                  4
                </span>

                <div>
                  <strong>
                    KYC Details
                  </strong>

                  <small>
                    Final workflow
                  </small>
                </div>
              </article>
            </div>

            <form
              className="inmba-policy-acceptance"
              onSubmit={
                handleAcceptPolicy
              }
            >
              <label
                htmlFor="policy-acceptance"
                className={
                  pageError &&
                  !accepted
                    ? "inmba-policy-checkbox-error"
                    : ""
                }
              >
                <input
                  id="policy-acceptance"
                  type="checkbox"
                  checked={
                    accepted
                  }
                  onChange={
                    handleAcceptanceChange
                  }
                  disabled={
                    submitting
                  }
                />

                <span>
                  <i
                    className="fas fa-check"
                    aria-hidden="true"
                  ></i>
                </span>

                <p>
                  I have read and accept the INMBA membership policy
                  and agree to continue with the payment and KYC
                  process.
                </p>
              </label>

              {pageError && (
                <div
                  className="inmba-policy-error"
                  role="alert"
                >
                  <i
                    className="fas fa-circle-exclamation"
                    aria-hidden="true"
                  ></i>

                  <span>
                    {pageError}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  submitting ||
                  !accepted
                }
              >
                {submitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      aria-hidden="true"
                    ></span>

                    Accepting Policy...
                  </>
                ) : (
                  <>
                    Accept & Continue

                    <i
                      className="fas fa-arrow-right"
                      aria-hidden="true"
                    ></i>
                  </>
                )}
              </button>
            </form>

            <div className="inmba-policy-sidebar-links">
              <Link to="/dashboard">
                <i
                  className="fas fa-arrow-left"
                  aria-hidden="true"
                ></i>

                Dashboard
              </Link>

              <Link to="/contact">
                Need Help?
              </Link>
            </div>

            <p className="inmba-policy-security">
              <i
                className="fas fa-shield-halved"
                aria-hidden="true"
              ></i>

              Policy acceptance uses your authenticated member
              session.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}