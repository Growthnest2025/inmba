import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  QRCodeCanvas,
} from "qrcode.react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getCommercialDashboard,
} from "../../../services/commercialDashboard.service";

import "./CommercialQrPage.css";
import { toText } from "../../../utils/commonHelpers";

/* =========================================================
   HELPERS
========================================================= */

const normalizeLoginId =
  (
    value
  ) => {
    return toText(
      value
    )
      .replace(
        /\s+/g,
        ""
      )
      .toUpperCase();
  };

/* =========================================================
   PUBLIC ORIGIN

   Mobile QR test:
   localhost -> laptop LAN IP

   Production:
   actual domain
========================================================= */

const getPublicOrigin = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname || "";
    if (
      !hostname.includes("vercel.app") &&
      !hostname.includes("localhost") &&
      !hostname.includes("127.0.0.1")
    ) {
      return window.location.origin;
    }
  }
  return "https://inmba.org";
};

/* =========================================================
   STATUS
========================================================= */

const formatVerification =
  (
    verified
  ) => {
    return verified
      ? "Verified Commercial Member"
      : "Verification Pending";
  };

/* =========================================================
   COMMERCIAL QR DETAILS PAGE
========================================================= */

export default function CommercialQrPage() {
  const navigate =
    useNavigate();

  const {
    loginId,
  } =
    useParams();

  /* =======================================================
     ROUTE LOGIN ID
  ======================================================= */

  const routeLoginId =
    useMemo(
      () =>
        normalizeLoginId(
          loginId
        ),
      [
        loginId,
      ]
    );

  /* =======================================================
     STATES
  ======================================================= */

  const [
    dashboard,
    setDashboard,
  ] =
    useState(null);

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
    copied,
    setCopied,
  ] =
    useState(false);

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const result =
            await getCommercialDashboard();

          const data =
            result?.dashboard ||
            null;

          if (
            !data
          ) {
            throw new Error(
              "Commercial dashboard data is unavailable."
            );
          }

          const returnedLoginId =
            normalizeLoginId(
              data
                ?.member
                ?.loginId
            );

          if (
            !returnedLoginId
          ) {
            throw new Error(
              "Commercial Login ID was not found."
            );
          }

          /*
            QR Details must belong to currently
            logged-in Commercial account.
          */

          if (
            routeLoginId &&
            returnedLoginId !==
              routeLoginId
          ) {
            throw new Error(
              "This QR does not belong to the logged-in Commercial account."
            );
          }

          setDashboard(
            data
          );
        } catch (
          requestError
        ) {
          console.error(
            "Commercial QR Details Error:",
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
            "Unable to load Commercial QR details."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        routeLoginId,
      ]
    );

  useEffect(
    () => {
      loadDashboard();
    },
    [
      loadDashboard,
    ]
  );

  /* =======================================================
     VALUES
  ======================================================= */

  const member =
    dashboard
      ?.member ||
    {};

  const business =
    dashboard
      ?.business ||
    {};

  const activation =
    dashboard
      ?.activation ||
    {};

  const kyc =
    dashboard
      ?.kyc ||
    {};

  const publicProfileCard =
  useMemo(
    () =>
      dashboard
        ?.cards
        ?.public_profile ||
      {},
    [
      dashboard
        ?.cards
        ?.public_profile,
    ]
  );

  const safeLoginId =
    normalizeLoginId(
      member
        ?.loginId ||
      routeLoginId
    );

  const businessName =
    toText(
      business
        ?.name
    ) ||
    "Commercial Business";

  const membership =
    toText(
      member
        ?.membershipType ||
      member
        ?.membership_type
    ) ||
    "Commercial Member";

  /* =======================================================
     VERIFIED
  ======================================================= */

  const paymentStatus = String(
    dashboard?.payment?.payment_status ||
    dashboard?.payment?.status ||
    member?.payment_status ||
    sessionStorage.getItem("commercial_payment_status") ||
    ""
  ).toLowerCase();

  const isPaymentApproved = paymentStatus === "approved" || Boolean(dashboard?.payment?.approved);

  const verified = isPaymentApproved;

  /* =======================================================
     PROFILE PATH
  ======================================================= */

  const publicProfilePath =
    useMemo(
      () => {
        const backendPath =
          toText(
            publicProfileCard
              ?.public_profile_path
          );

        if (
          backendPath
        ) {
          return backendPath;
        }

        if (
          !safeLoginId
        ) {
          return "";
        }

        return `/commercial/public-profile/${encodeURIComponent(
          safeLoginId
        )}`;
      },
      [
        publicProfileCard,
        safeLoginId,
      ]
    );

  /* =======================================================
     PUBLIC PROFILE URL
  ======================================================= */

  const publicProfileUrl =
    useMemo(
      () => {
        if (
          !publicProfilePath
        ) {
          return "";
        }

        if (
          /^https?:\/\//i.test(
            publicProfilePath
          )
        ) {
          return publicProfilePath;
        }

        const origin =
          getPublicOrigin();

        return origin
          ? `${origin}${publicProfilePath}`
          : publicProfilePath;
      },
      [
        publicProfilePath,
      ]
    );

  /* =======================================================
     COPY
  ======================================================= */

  const handleCopy =
    async () => {
      if (
        !publicProfileUrl
      ) {
        return;
      }

      try {
        await navigator
          .clipboard
          .writeText(
            publicProfileUrl
          );

        setCopied(
          true
        );

        window.setTimeout(
          () => {
            setCopied(
              false
            );
          },
          1800
        );
      } catch (
        copyError
      ) {
        console.error(
          "Commercial QR Copy Error:",
          copyError
        );
      }
    };

  /* =======================================================
     DOWNLOAD PNG
  ======================================================= */

  const handleDownload =
    () => {
      const canvas =
        document.getElementById(
          "commercial-qr-details-canvas"
        );

      if (
        !canvas
      ) {
        return;
      }

      try {
        const png =
          canvas.toDataURL(
            "image/png"
          );

        const link =
          document.createElement(
            "a"
          );

        link.href =
          png;

        link.download =
          `${safeLoginId}-commercial-qr.png`;

        document.body.appendChild(
          link
        );

        link.click();

        document.body.removeChild(
          link
        );
      } catch (
        downloadError
      ) {
        console.error(
          "Commercial QR PNG Error:",
          downloadError
        );
      }
    };

  /* =======================================================
     SHARE
  ======================================================= */

  const handleShare =
    async () => {
      if (
        !publicProfileUrl
      ) {
        return;
      }

      try {
        if (
          navigator.share
        ) {
          await navigator.share({
            title:
              `${businessName} - INMBA`,

            text:
              "View my INMBA Commercial public profile.",

            url:
              publicProfileUrl,
          });

          return;
        }

        await handleCopy();
      } catch (
        shareError
      ) {
        if (
          shareError
            ?.name !==
          "AbortError"
        ) {
          console.error(
            "Commercial QR Share Error:",
            shareError
          );
        }
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <main className="commercial-qr-page">
        <div className="cqd-state">

          <span className="cqd-spinner" />

          <strong>
            Loading Commercial QR...
          </strong>

        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error ||
    !dashboard
  ) {
    return (
      <main className="commercial-qr-page">

        <section className="cqd-error-card">

          <span className="cqd-error-icon">
            <i className="fa-solid fa-circle-exclamation" />
          </span>

          <h2>
            Unable to load QR
          </h2>

          <p>
            {error ||
              "Commercial QR information is unavailable."}
          </p>

          <div className="cqd-error-actions">

            <button
              type="button"
              onClick={
                loadDashboard
              }
            >
              Try Again
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() =>
                navigate(
                  "/commercial/dashboard"
                )
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
     RENDER
  ======================================================= */

  return (
    <main className="commercial-qr-page">

      <div
        className="commercial-qr-page-bg"
        aria-hidden="true"
      >
        <span className="one" />

        <span className="two" />

        <span className="three" />
      </div>

      <div className="cqd-shell">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="cqd-hero">

          <div>

            <span className="cqd-eyebrow">
              INMBA COMMERCIAL DIGITAL IDENTITY
            </span>

            <h1>
              My Commercial QR Code
            </h1>

            <p>
              Scan this QR code to open your official public
              Commercial business profile.
            </p>

          </div>

          <button
            type="button"
            className="cqd-dashboard-button"
            onClick={() =>
              navigate(
                "/commercial/dashboard"
              )
            }
          >
            <i className="fa-solid fa-arrow-left" />

            Dashboard
          </button>

        </section>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="cqd-main-grid">

          {/* =================================================
              LEFT DIGITAL CARD
          ================================================= */}

          <section className="cqd-member-card">

            <div className="cqd-member-card-header">

              <div>

                <strong>
                  INMBA
                </strong>

                <span>
                  Official Commercial Digital Member Card
                </span>

              </div>

              <span
                className={`cqd-verified-pill ${
                  verified
                    ? "verified"
                    : "pending"
                }`}
              >
                <i
                  className={
                    verified
                      ? "fa-solid fa-circle-check"
                      : "fa-solid fa-clock"
                  }
                />

                {verified
                  ? "Verified Member"
                  : "Pending"}
              </span>

            </div>

            <div className="cqd-member-card-body">

              {/* QR */}

              <div className="cqd-qr-frame">

                {verified && publicProfileUrl ? (
                  <QRCodeCanvas
                    id="commercial-qr-details-canvas"
                    value={
                      publicProfileUrl
                    }
                    size={
                      245
                    }
                    level="H"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor="#E23744"
                    title={`Commercial QR for ${businessName}`}
                  />
                ) : (
                  <div className="cqd-qr-empty" style={{ textAlign: "center", padding: "40px 16px" }}>
                    <i className="fa-solid fa-lock" style={{ fontSize: "52px", color: "#f59e0b", marginBottom: "12px", display: "block" }} />
                    <strong style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", display: "block", marginBottom: "6px" }}>QR Code Locked</strong>
                    <span style={{ fontSize: "13px", color: "#64748b", display: "block", maxWidth: "260px", margin: "0 auto", lineHeight: "1.4" }}>Your QR code will be generated and visible here once your payment is approved by the admin.</span>
                  </div>
                )}

                <span className="cqd-qr-logo">
                  <i className="fa-solid fa-store" />
                </span>

              </div>

              <div className="cqd-scan-caption">
                <span />

                Point your mobile camera at this QR code

                <span />
              </div>

              {/* BUSINESS */}

              <div className="cqd-business-name">

                <h2>
                  {businessName}
                </h2>

                <p>
                  Commercial Member
                </p>

              </div>

              {/* LOGIN */}

              <div className="cqd-id-box">

                <span>
                  Login ID
                </span>

                <strong>
                  {safeLoginId}
                </strong>

              </div>

            </div>

            <div className="cqd-member-footer">

              <i className="fa-solid fa-shield-halved" />

              Scan verification powered by INMBA

            </div>

          </section>

          {/* =================================================
              RIGHT DETAILS CARD
          ================================================= */}

          <section className="cqd-details-card">

            <div className="cqd-details-heading">

              <span className="cqd-heading-icon">
                <i className="fa-solid fa-qrcode" />
              </span>

              <div>
                <h2>
                  Digital Profile QR
                </h2>

                <p>
                  Your QR code is connected directly to your
                  public Commercial profile.
                </p>
              </div>

            </div>

            {/* DETAILS */}

            <div className="cqd-detail-list">

              <DetailRow
                icon="fa-solid fa-store"
                label="Business Name"
                value={
                  businessName
                }
              />

              <DetailRow
                icon="fa-solid fa-id-card"
                label="Login ID"
                value={
                  safeLoginId
                }
              />

              <DetailRow
                icon="fa-solid fa-crown"
                label="Membership"
                value={
                  membership
                }
              />

              <DetailRow
                icon="fa-solid fa-shield-halved"
                label="Verification"
                value={
                  formatVerification(
                    verified
                  )
                }
                verified={
                  verified
                }
              />

            </div>

            {/* =================================================
                PUBLIC PROFILE LINK
            ================================================= */}

            <div className="cqd-profile-link-section">

              <label>
                Public Profile Link
              </label>

              <div className="cqd-profile-link">

                <input
                  type="text"
                  value={
                    publicProfileUrl
                  }
                  readOnly
                  aria-label="Commercial public profile URL"
                />

                <button
                  type="button"
                  title="Copy profile link"
                  onClick={
                    handleCopy
                  }
                >
                  <i
                    className={
                      copied
                        ? "fa-solid fa-check"
                        : "fa-regular fa-copy"
                    }
                  />
                </button>

              </div>

            </div>

            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="cqd-actions">

              <button
                type="button"
                className="primary"
                disabled={!verified || !publicProfileUrl}
                onClick={
                  handleDownload
                }
              >
                <i className="fa-solid fa-download" />

                Download PNG
              </button>

              <button
                type="button"
                onClick={
                  handleShare
                }
              >
                <i className="fa-solid fa-share-nodes" />

                Share Profile
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    publicProfilePath
                  )
                }
              >
                <i className="fa-solid fa-address-card" />

                View Profile
              </button>

            </div>

            {/* =================================================
                SECURITY
            ================================================= */}

            <div className="cqd-security">

              <span>
                <i className="fa-solid fa-lock" />
              </span>

              <div>

                <strong>
                  Secure Public Information
                </strong>

                <p>
                  The QR opens only approved public business
                  information. Aadhaar, PAN, bank, nominee
                  and private KYC details are protected.
                </p>

              </div>

            </div>

          </section>

        </div>

        {/* =================================================
            HOW QR WORKS
        ================================================= */}

        <section className="cqd-how-section">

          <div className="cqd-how-heading">

            <span>
              SIMPLE AND SECURE
            </span>

            <h2>
              How the QR code works
            </h2>

          </div>

          <div className="cqd-how-grid">

            <HowCard
              number="1"
              icon="fa-solid fa-mobile-screen-button"
              title="Open Camera"
              text="Open the camera or QR scanner on a mobile device."
            />

            <HowCard
              number="2"
              icon="fa-solid fa-qrcode"
              title="Scan QR"
              text="Point the camera at your Commercial QR code."
            />

            <HowCard
              number="3"
              icon="fa-solid fa-address-card"
              title="View Profile"
              text="Your approved public Commercial profile opens instantly."
            />

          </div>

        </section>

      </div>

    </main>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  icon,
  label,
  value,
  verified = false,
}) {
  return (
    <div className="cqd-detail-row">

      <div className="cqd-detail-label">

        <i className={icon} />

        <span>
          {label}
        </span>

      </div>

      <strong
        className={
          verified
            ? "verified"
            : ""
        }
      >
        {value ||
          "—"}
      </strong>

    </div>
  );
}

/* =========================================================
   HOW CARD
========================================================= */

function HowCard({
  number,
  icon,
  title,
  text,
}) {
  return (
    <div className="cqd-how-card">

      <span className="cqd-how-number">
        {number}
      </span>

      <div>

        <i className={icon} />

        <strong>
          {title}
        </strong>

        <p>
          {text}
        </p>

      </div>

    </div>
  );
}