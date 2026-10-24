import React, {
  useMemo,
  useState,
} from "react";

import {
  QRCodeCanvas,
} from "qrcode.react";

import {
  useNavigate,
} from "react-router-dom";

import "./CommercialQrCard.css";
import { toText } from "../../../utils/commonHelpers";

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   PUBLIC ORIGIN

   Development:
   localhost QR mobile-la work aagathu.

   Laptop LAN IP:
   10.217.209.179

   Production:
   Current domain automatically use pannum.
========================================================= */

const getPublicOrigin =
  () => {
    if (
      typeof window ===
      "undefined"
    ) {
      return "";
    }

    const hostname =
      window.location.hostname;

    if (
      hostname ===
        "localhost" ||
      hostname ===
        "127.0.0.1"
    ) {
      return "http://192.168.31.155:5173";
    }

    return window.location.origin;
  };

/* =========================================================
   COMMERCIAL QR CARD
========================================================= */

export default function CommercialQrCard({
  loginId,
  businessName,
  publicProfilePath,
  verified = false,
}) {
  const navigate =
    useNavigate();

  const [
    copied,
    setCopied,
  ] =
    useState(false);

  /* =======================================================
     LOGIN ID
  ======================================================= */

  const safeLoginId =
    useMemo(
      () =>
        toText(
          loginId
        )
          .replace(
            /\s+/g,
            ""
          )
          .toUpperCase(),
      [
        loginId,
      ]
    );

  /* =======================================================
     QR DETAILS PATH

     Example:

     COM2686454
          ↓
     /commercial/qr/COM2686454
  ======================================================= */

  const qrDetailsPath =
    useMemo(
      () => {
        if (
          !safeLoginId
        ) {
          return "";
        }

        return `/commercial/qr/${encodeURIComponent(
          safeLoginId
        )}`;
      },
      [
        safeLoginId,
      ]
    );

  /* =======================================================
     PUBLIC PROFILE PATH

     Example:

     /user-profile/COM2686454
  ======================================================= */

  const profilePath =
    useMemo(
      () => {
        const backendPath =
          toText(
            publicProfilePath
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

        return `/user-profile/${encodeURIComponent(
          safeLoginId
        )}`;
      },
      [
        publicProfilePath,
        safeLoginId,
      ]
    );

  /* =======================================================
     PUBLIC PROFILE URL

     localhost dashboard open pannalum
     mobile QR uses LAN IP:

     http://10.217.209.179:5173/user-profile/COM...
  ======================================================= */

  const profileUrl =
    useMemo(
      () => {
        if (
          !profilePath
        ) {
          return "";
        }

        /* ===============================================
           Backend already full URL kudutha
        =============================================== */

        if (
          /^https?:\/\//i.test(
            profilePath
          )
        ) {
          return profilePath;
        }

        const origin =
          getPublicOrigin();

        return origin
          ? `${origin}${profilePath}`
          : profilePath;
      },
      [
        profilePath,
      ]
    );

  /* =======================================================
     QR DETAILS CLICK

     IMPORTANT:

     This DOES NOT copy link.

     This opens:
     /commercial/qr/COM2686454
  ======================================================= */

  const handleQrDetails =
    () => {
      if (
        !qrDetailsPath
      ) {
        console.error(
          "Commercial QR Details path is unavailable."
        );

        return;
      }

      navigate(
        qrDetailsPath
      );
    };

  /* =======================================================
     VIEW PUBLIC PROFILE
  ======================================================= */

  const handleViewProfile =
    () => {
      if (
        !profilePath
      ) {
        return;
      }

      navigate(
        profilePath
      );
    };

  /* =======================================================
     COPY PROFILE LINK

     Copy Link button ONLY.
  ======================================================= */

  const handleCopy =
    async () => {
      if (
        !profileUrl
      ) {
        return;
      }

      try {
        await navigator
          .clipboard
          .writeText(
            profileUrl
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
          1600
        );
      } catch (
        error
      ) {
        console.error(
          "Commercial QR Copy Error:",
          error
        );
      }
    };

  /* =======================================================
     DOWNLOAD QR
  ======================================================= */

  const handleDownload =
    () => {
      const canvas =
        document.getElementById(
          "commercial-public-profile-qr"
        );

      if (
        !canvas
      ) {
        console.error(
          "Commercial QR canvas was not found."
        );

        return;
      }

      try {
        const imageUrl =
          canvas.toDataURL(
            "image/png"
          );

        const link =
          document.createElement(
            "a"
          );

        link.href =
          imageUrl;

        link.download =
          `${safeLoginId || "commercial"}-profile-qr.png`;

        document.body.appendChild(
          link
        );

        link.click();

        document.body.removeChild(
          link
        );
      } catch (
        error
      ) {
        console.error(
          "Commercial QR Download Error:",
          error
        );
      }
    };

  /* =======================================================
     SHARE PROFILE
  ======================================================= */

  const handleShare =
    async () => {
      if (
        !profileUrl
      ) {
        return;
      }

      try {
        if (
          navigator.share
        ) {
          await navigator.share({
            title:
              toText(
                businessName
              ) ||
              "INMBA Commercial Profile",

            text:
              "View my INMBA Commercial public profile.",

            url:
              profileUrl,
          });

          return;
        }

        /*
          Browser share support illana
          fallback = copy link.
        */

        await handleCopy();
      } catch (
        error
      ) {
        if (
          error?.name !==
          "AbortError"
        ) {
          console.error(
            "Commercial QR Share Error:",
            error
          );
        }
      }
    };

  /* =======================================================
     EMPTY STATE
  ======================================================= */

  if (
    !safeLoginId ||
    !profileUrl
  ) {
    return (
      <section
        className="
          commercial-qr-card
          commercial-qr-unavailable
        "
      >
        <div className="commercial-qr-empty-icon">
          <i className="fa-solid fa-qrcode" />
        </div>

        <h2>
          Commercial QR unavailable
        </h2>

        <p>
          A valid Commercial Login ID is required.
        </p>
      </section>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="commercial-qr-card">

      {/* =================================================
          BACKGROUND DECORATION
      ================================================= */}

      <div
        className="commercial-qr-background"
        aria-hidden="true"
      >
        <span />

        <span />
      </div>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="commercial-qr-content">

        {/* =================================================
            LEFT INFORMATION
        ================================================= */}

        <div className="commercial-qr-info">

          <span className="commercial-qr-eyebrow">
            COMMERCIAL DIGITAL IDENTITY
          </span>

          <h2>
            Public Profile QR Code
          </h2>

          <p>
            Scan this QR code to open your official
            Commercial public business profile.
          </p>

          {/* ===============================================
              BUSINESS
          =============================================== */}

          <div className="commercial-qr-business">

            <span className="commercial-qr-business-icon">
              <i className="fa-solid fa-store" />
            </span>

            <div>
              <small>
                Business
              </small>

              <strong>
                {toText(
                  businessName
                ) ||
                  "Commercial Member"}
              </strong>
            </div>

          </div>

          {/* ===============================================
              LOGIN ID
          =============================================== */}

          <div className="commercial-qr-login">

            <span>
              Login ID
            </span>

            <strong>
              {safeLoginId}
            </strong>

          </div>

          {/* ===============================================
              VERIFIED STATUS
          =============================================== */}

          {verified && (
            <div className="commercial-qr-verified">

              <i className="fa-solid fa-circle-check" />

              Verified Commercial Profile

            </div>
          )}

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div className="commercial-qr-actions">

            {/* ===============================================
                QR DETAILS

                IMPORTANT:
                Opens QR details page.

                DOES NOT copy URL.
            =============================================== */}

            <button
              type="button"
              className="commercial-qr-primary-button"
              onClick={
                handleQrDetails
              }
            >
              <i className="fa-solid fa-qrcode" />

              QR Details
            </button>

            {/* ===============================================
                VIEW PROFILE
            =============================================== */}

            <button
              type="button"
              className="commercial-qr-secondary-button"
              onClick={
                handleViewProfile
              }
            >
              <i className="fa-solid fa-address-card" />

              View Profile
            </button>

            {/* ===============================================
                SHARE
            =============================================== */}

            <button
              type="button"
              className="commercial-qr-secondary-button"
              onClick={
                handleShare
              }
            >
              <i className="fa-solid fa-share-nodes" />

              Share
            </button>

            {/* ===============================================
                COPY LINK

                ONLY this button copies URL.
            =============================================== */}

            <button
              type="button"
              className="commercial-qr-secondary-button"
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

              {copied
                ? "Copied"
                : "Copy Link"}
            </button>

          </div>

        </div>

        {/* =================================================
            QR PREVIEW
        ================================================= */}

        <div className="commercial-qr-preview-wrap">

          <div className="commercial-qr-preview">

            <div className="commercial-qr-code-shell">

              <QRCodeCanvas
                id="commercial-public-profile-qr"
                value={
                  profileUrl
                }
                size={
                  210
                }
                level="H"
                includeMargin
                bgColor="#ffffff"
                fgColor="#E23744"
                title={`INMBA Commercial QR ${safeLoginId}`}
              />

              {/* =============================================
                  QR CENTER ICON
              ============================================= */}

              <span className="commercial-qr-center-logo">
                <i className="fa-solid fa-store" />
              </span>

            </div>

            {/* ===============================================
                SCAN MESSAGE
            =============================================== */}

            <div className="commercial-qr-scan-text">

              <i className="fa-solid fa-mobile-screen-button" />

              <span>
                Scan to view public profile
              </span>

            </div>

          </div>

          {/* =================================================
              DOWNLOAD
          ================================================= */}

          <button
            type="button"
            className="commercial-qr-download"
            onClick={
              handleDownload
            }
          >
            <i className="fa-solid fa-download" />

            Download QR
          </button>

        </div>

      </div>

      {/* =================================================
          PRIVACY MESSAGE
      ================================================= */}

      <div className="commercial-qr-privacy">

        <i className="fa-solid fa-shield-halved" />

        <span>
          QR opens only approved public Commercial
          information. Private KYC and bank information are
          never displayed.
        </span>

      </div>

    </section>
  );
}