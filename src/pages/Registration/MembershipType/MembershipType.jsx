import React, {
  useMemo,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import "./MembershipType.css";
import { toText } from "../../../utils/commonHelpers";

/* ========================================
   MEMBERSHIP TYPES

   Existing INMBA routes are preserved.
======================================== */

const MEMBERSHIP_TYPES = [
  {
    id: "civilian",
    title: "Civilian Member",
    subtitle: "Individual Membership",
    description:
      "Register as an individual member and become part of the INMBA professional network.",
    icon: "fas fa-user-tie",
    route: "/membership/civilian",
    status: "available",
    badge: "Available",
    theme: "green",
  },

  {
    id: "commercial",
    title: "Commercial Member",
    subtitle: "Business Membership",
    description:
      "Commercial membership option for companies and business-focused entities.",
    icon: "fas fa-store",
    route: "/commercial-basic-kyc",
    status: "available",
    badge: "Available",
    theme: "red",
  },

  {
    id: "professional",
    title: "Professional Member",
    subtitle: "Career Membership",
    description:
      "Professional membership registration for working individuals and experienced specialists.",
    icon: "fas fa-briefcase",
    route: "/professional",
    status: "available",
    badge: "Available",
    theme: "blue",
  },

  {
    id: "student",
    title: "Student Member",
    subtitle: "Academic Membership",
    description:
      "Student membership registration will be available soon.",
    icon: "fas fa-graduation-cap",
    route: "",
    status: "locked",
    badge: "Locked",
    theme: "locked",
  },



  {
    id: "honor",
    title: "Honor Member",
    subtitle: "Recognition Membership",
    description:
      "Honor membership registration will be available soon.",
    icon: "fas fa-award",
    route: "",
    status: "locked",
    badge: "Locked",
    theme: "locked",
  },

  {
    id: "special",
    title: "Special Member",
    subtitle: "Special Category",
    description:
      "Special category membership registration will be available soon.",
    icon: "fas fa-star",
    route: "",
    status: "locked",
    badge: "Locked",
    theme: "locked",
  },
];

/* ========================================
   COMMON HELPER
======================================== */

/* ========================================
   BUILD ROUTE WITH REFERRAL

   Example:

   /membership-type?ref=ABC123

   Civilian link:
   /membership/civilian?ref=ABC123

   Student link:
   /student?ref=ABC123
======================================== */

const buildMembershipRoute = (
  route,
  referralId
) => {
  const normalizedRoute =
    toText(
      route,
      "/"
    );

  const normalizedReferral =
    toText(
      referralId,
      ""
    );

  if (!normalizedReferral) {
    return normalizedRoute;
  }

  const separator =
    normalizedRoute.includes("?")
      ? "&"
      : "?";

  return `${normalizedRoute}${separator}ref=${encodeURIComponent(
    normalizedReferral
  )}`;
};

/* ========================================
   MEMBERSHIP TYPE PAGE
======================================== */

export default function MembershipType() {
  const [
    searchParams,
  ] =
    useSearchParams();

  const referralId =
    useMemo(
      () =>
        toText(
          searchParams.get("ref"),
          ""
        ),
      [
        searchParams,
      ]
    );

  return (
    <main className="inmba-membership-type-page">
      <div className="inmba-membership-type-container">
        {/* =================================
            TOP BAR
        ================================= */}

        <header className="inmba-membership-type-topbar">
          <Link
            to="/"
            className="inmba-membership-type-brand"
          >
            <span>
              I
            </span>

            <div>
              <strong>
                INMBA
              </strong>

              <small>
                Membership Registration
              </small>
            </div>
          </Link>

          <div className="inmba-membership-type-login">
            <span>
              Already a member?
            </span>

            <Link to="/login">
              <i
                className="fas fa-right-to-bracket"
                aria-hidden="true"
              ></i>

              Member Login
            </Link>
          </div>
        </header>

        {/* =================================
            HERO
        ================================= */}

        <section className="inmba-membership-type-hero">
          <div className="inmba-membership-type-hero-content">
            <p>
              INMBA Global Membership
            </p>

            <h1>
              Choose Your Membership Type
            </h1>

            <span>
              Select the membership category that matches your
              application and continue to the relevant registration
              form.
            </span>

            <div className="inmba-membership-type-hero-actions">
              <a href="#membership-options">
                View Membership Options

                <i
                  className="fas fa-arrow-down"
                  aria-hidden="true"
                ></i>
              </a>

              <Link to="/contact">
                Contact INMBA

                <i
                  className="fas fa-headset"
                  aria-hidden="true"
                ></i>
              </Link>
            </div>
          </div>

          <div className="inmba-membership-type-hero-visual">
            <div className="inmba-membership-type-orbit">
              <span className="inmba-membership-type-orbit-center">
                <i
                  className="fas fa-globe"
                  aria-hidden="true"
                ></i>
              </span>

              <span className="inmba-membership-type-orbit-item inmba-membership-type-orbit-one">
                <i
                  className="fas fa-user-tie"
                  aria-hidden="true"
                ></i>
              </span>

              <span className="inmba-membership-type-orbit-item inmba-membership-type-orbit-two">
                <i
                  className="fas fa-graduation-cap"
                  aria-hidden="true"
                ></i>
              </span>

              <span className="inmba-membership-type-orbit-item inmba-membership-type-orbit-three">
                <i
                  className="fas fa-building"
                  aria-hidden="true"
                ></i>
              </span>

              <span className="inmba-membership-type-orbit-item inmba-membership-type-orbit-four">
                <i
                  className="fas fa-briefcase"
                  aria-hidden="true"
                ></i>
              </span>
            </div>
          </div>
        </section>

        {/* =================================
            REFERRAL NOTICE
        ================================= */}

        {referralId && (
          <section className="inmba-membership-type-referral">
            <span>
              <i
                className="fas fa-user-plus"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <strong>
                Referral ID Applied
              </strong>

              <p>
                Referral ID{" "}
                <b>
                  {referralId}
                </b>{" "}
                will be forwarded to the selected registration page.
              </p>
            </div>

            <code>
              {referralId}
            </code>
          </section>
        )}

        {/* =================================
            SECTION INTRODUCTION
        ================================= */}

        <section
          id="membership-options"
          className="inmba-membership-type-intro"
        >
          <div>
            <p>
              Membership Categories
            </p>

            <h2>
              Select an Application
            </h2>

            <span>
              Each option opens its matching registration page. Your
              referral information will be preserved automatically.
            </span>
          </div>

          <strong>
            {MEMBERSHIP_TYPES.length} Options
          </strong>
        </section>

        {/* =================================
            MEMBERSHIP CARDS
        ================================= */}

        <section className="inmba-membership-type-grid">
          {MEMBERSHIP_TYPES.map(
            (
              membership,
              index
            ) => {
              const isLocked =
                membership.status ===
                "locked";

              const membershipRoute =
                !isLocked
                  ? buildMembershipRoute(
                      membership.route,
                      referralId
                    )
                  : "";

              return (
                <article
                  key={membership.id}
                  className={[
                    "inmba-membership-type-card",
                    `inmba-membership-type-card-${membership.theme}`,
                    isLocked
                      ? "inmba-membership-type-card-locked"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-disabled={
                    isLocked
                      ? "true"
                      : undefined
                  }
                >
                  <div className="inmba-membership-type-card-number">
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <header>
                    <span>
                      <i
                        className={
                          isLocked
                            ? "fas fa-lock"
                            : membership.icon
                        }
                        aria-hidden="true"
                      ></i>
                    </span>

                    <small>
                      <i
                        className={
                          isLocked
                            ? "fas fa-lock"
                            : "fas fa-circle-check"
                        }
                        aria-hidden="true"
                      ></i>

                      {membership.badge}
                    </small>
                  </header>

                  <div className="inmba-membership-type-card-content">
                    <p>
                      {membership.subtitle}
                    </p>

                    <h3>
                      {membership.title}
                    </h3>

                    <span>
                      {membership.description}
                    </span>
                  </div>

                  <footer>
                    {isLocked ? (
                      <button
                        type="button"
                        className="inmba-membership-type-locked-button"
                        disabled
                      >
                        <span>
                          <i
                            className="fas fa-lock"
                            aria-hidden="true"
                          ></i>

                          Coming Soon
                        </span>
                      </button>
                    ) : (
                      <Link
                        to={
                          membershipRoute
                        }
                      >
                        Select Membership

                        <i
                          className="fas fa-arrow-right"
                          aria-hidden="true"
                        ></i>
                      </Link>
                    )}
                  </footer>

                  {isLocked && (
                    <div
                      className="inmba-membership-type-lock-overlay"
                      aria-hidden="true"
                    >
                      <i className="fas fa-lock"></i>
                    </div>
                  )}

                  <div
                    className="inmba-membership-type-card-decoration"
                    aria-hidden="true"
                  ></div>
                </article>
              );
            }
          )}
        </section>

        {/* =================================
            REGISTRATION PROCESS
        ================================= */}

        <section className="inmba-membership-type-process">
          <header>
            <p>
              Registration Process
            </p>

            <h2>
              Complete Your Membership
            </h2>

            <span>
              Follow the registration and verification workflow for
              your selected membership category.
            </span>
          </header>

          <div className="inmba-membership-type-process-grid">
            <article>
              <span>
                1
              </span>

              <div>
                <i
                  className="fas fa-list-check"
                  aria-hidden="true"
                ></i>

                <h3>
                  Select Category
                </h3>

                <p>
                  Choose the membership type matching your
                  application.
                </p>
              </div>
            </article>

            <div></div>

            <article>
              <span>
                2
              </span>

              <div>
                <i
                  className="fas fa-file-pen"
                  aria-hidden="true"
                ></i>

                <h3>
                  Complete Form
                </h3>

                <p>
                  Enter the required personal, educational or
                  organization details.
                </p>
              </div>
            </article>

            <div></div>

            <article>
              <span>
                3
              </span>

              <div>
                <i
                  className="fas fa-user-shield"
                  aria-hidden="true"
                ></i>

                <h3>
                  Verification
                </h3>

                <p>
                  Submitted information is reviewed through the
                  relevant membership workflow.
                </p>
              </div>
            </article>

            <div></div>

            <article>
              <span>
                4
              </span>

              <div>
                <i
                  className="fas fa-circle-check"
                  aria-hidden="true"
                ></i>

                <h3>
                  Membership Access
                </h3>

                <p>
                  Continue using the generated member credentials
                  after completion.
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* =================================
            HELP CARD
        ================================= */}

        <section className="inmba-membership-type-help">
          <span>
            <i
              className="fas fa-circle-question"
              aria-hidden="true"
            ></i>
          </span>

          <div>
            <h3>
              Need Help Choosing?
            </h3>

            <p>
              Contact the INMBA support team before submitting a
              membership application.
            </p>
          </div>

          <Link to="/contact">
            Contact Support

            <i
              className="fas fa-arrow-right"
              aria-hidden="true"
            ></i>
          </Link>
        </section>
      </div>
    </main>
  );
}