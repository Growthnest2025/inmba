import React, {
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  QRCodeCanvas,
} from "qrcode.react";

import {
  downloadQrJpeg,
} from "../../services/download.service";

import {
  getPublicProfilePath,
} from "../../services/publicProfile.service";

import "./MemberQrCard.css";
import { toText } from "../../utils/commonHelpers";

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   PUBLIC PROFILE URL

   Priority:

   1. REACT_APP_FRONTEND_BASE_URL
   2. Current browser origin

   Example:

   http://10.217.209.179:5173/user-profile/6668717
========================================================= */

const buildPublicProfileUrl =
  (
    loginId
  ) => {
    const safeLoginId =
      toText(
        loginId
      );

    if (
      !safeLoginId
    ) {
      return "";
    }

    const profilePath =
      `/user-profile/${encodeURIComponent(
        safeLoginId
      )}`;

    const configuredBase =
      toText(
        process.env
          .REACT_APP_FRONTEND_BASE_URL
      );

    if (
      configuredBase
    ) {
      return `${configuredBase.replace(
        /\/+$/,
        ""
      )}${profilePath}`;
    }

    if (
      typeof window !==
        "undefined" &&
      window.location
        ?.origin
    ) {
      return `${window.location.origin}${profilePath}`;
    }

    return profilePath;
  };

/* =========================================================
   COPY TEXT
========================================================= */

const copyText =
  async (
    value
  ) => {
    const text =
      toText(
        value
      );

    if (
      !text
    ) {
      return false;
    }

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(
        text
      );

      return true;
    }

    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value =
      text;

    textarea.style.position =
      "fixed";

    textarea.style.left =
      "-9999px";

    textarea.style.top =
      "0";

    textarea.style.opacity =
      "0";

    textarea.style.pointerEvents =
      "none";

    document.body.appendChild(
      textarea
    );

    textarea.focus();

    textarea.select();

    const copied =
      document.execCommand(
        "copy"
      );

    textarea.remove();

    return copied;
  };

/* =========================================================
   MEMBER QR CARD
========================================================= */

export default function MemberQrCard({
  member,
}) {
  const [
    downloading,
    setDownloading,
  ] =
    useState(
      false
    );

  const [
    copied,
    setCopied,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  /* =======================================================
     MEMBER LOGIN ID
  ======================================================= */

  const loginId =
    useMemo(
      () =>
        toText(
          member?.login_id ??
            member?.loginId
        ),
      [
        member?.login_id,
        member?.loginId,
      ]
    );

  /* =======================================================
     PAYMENT STATUS
  ======================================================= */

  const paymentStatus =
    useMemo(
      () =>
        toText(
          member?.payment_status ??
            member?.paymentStatus
        ).toLowerCase(),
      [
        member?.payment_status,
        member?.paymentStatus,
      ]
    );

  /* =======================================================
     APPROVED MEMBER
  ======================================================= */

  const approved =
    paymentStatus ===
    "approved";

  /* =======================================================
     PUBLIC PROFILE PATH
  ======================================================= */

  const publicProfilePath =
    useMemo(
      () =>
        getPublicProfilePath(
          loginId
        ),
      [
        loginId,
      ]
    );

  /* =======================================================
     PUBLIC PROFILE FULL URL

     This is the exact value encoded
     inside QR code.
  ======================================================= */

  const publicProfileUrl =
    useMemo(
      () =>
        buildPublicProfileUrl(
          loginId
        ),
      [
        loginId,
      ]
    );

  /* =======================================================
     LEGACY RULE

     QR only visible for approved member.
  ======================================================= */

  if (
    !approved ||
    !loginId
  ) {
    return null;
  }

  /* =======================================================
     DOWNLOAD QR

     Existing backend download route
     preserved.
  ======================================================= */

  const handleDownload =
    async () => {
      if (
        downloading
      ) {
        return;
      }

      try {
        setDownloading(
          true
        );

        setError(
          ""
        );

        await downloadQrJpeg(
          loginId
        );
      } catch (
        downloadError
      ) {
        console.error(
          "QR Download Error:",
          downloadError
        );

        setError(
          downloadError
            ?.apiMessage ||
            downloadError
              ?.message ||
            "Unable to download QR code."
        );
      } finally {
        setDownloading(
          false
        );
      }
    };

  /* =======================================================
     COPY PUBLIC PROFILE URL
  ======================================================= */

  const handleCopy =
    async () => {
      try {
        setError(
          ""
        );

        const success =
          await copyText(
            publicProfileUrl
          );

        if (
          !success
        ) {
          throw new Error(
            "Unable to copy profile link."
          );
        }

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
        setError(
          copyError
            ?.message ||
            "Unable to copy profile link."
        );
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <section className="inmba-member-qr-card">
      {/* ===============================================
          HEADER
      =============================================== */}

      <div className="inmba-member-qr-header">
        <div className="inmba-member-qr-header-icon">
          <i
            className="fas fa-qrcode"
            aria-hidden="true"
          ></i>
        </div>

        <div>
          <span>
            Digital Identity
          </span>

          <h2>
            Your Digital Profile QR Code
          </h2>

          <p>
            Scan to view and share your public INMBA profile.
          </p>
        </div>
      </div>

      {/* ===============================================
          CONTENT
      =============================================== */}

      <div className="inmba-member-qr-content">
        {/* =============================================
            LEFT SIDE
        ============================================= */}

        <div className="inmba-member-qr-left">
          {/* ===========================================
              QR CODE

              No backend PNG required.

              React generates QR directly from:
              publicProfileUrl
          =========================================== */}

          <div className="inmba-member-qr-frame">
            {publicProfileUrl ? (
              <QRCodeCanvas
                id="member-profile-qr"
                value={
                  publicProfileUrl
                }
                size={
                  180
                }
                level="H"
                includeMargin={
                  true
                }
                bgColor="#ffffff"
                fgColor="#0f4d0f"
                title={`INMBA public profile QR code for ${loginId}`}
              />
            ) : (
              <div className="inmba-member-qr-image-error">
                <i
                  className="fas fa-qrcode"
                  aria-hidden="true"
                ></i>

                <strong>
                  QR unavailable
                </strong>

                <span>
                  Login ID unavailable.
                </span>
              </div>
            )}
          </div>

          {/* ===========================================
              LOGIN ID
          =========================================== */}

          <div className="inmba-member-qr-id">
            <span>
              Login ID
            </span>

            <strong>
              {loginId}
            </strong>
          </div>
        </div>

        {/* =============================================
            RIGHT SIDE
        ============================================= */}

        <div className="inmba-member-qr-right">
          {/* APPROVED BADGE */}

          <span className="inmba-member-qr-badge">
            <i
              className="fas fa-circle-check"
              aria-hidden="true"
            ></i>

            Approved Member
          </span>

          {/* TITLE */}

          <h3>
            Share your INMBA public profile
          </h3>

          <p>
            This QR code opens your public member profile using
            your unique INMBA Login ID.
          </p>

          {/* ===========================================
              PUBLIC PROFILE URL
          =========================================== */}

          <div className="inmba-member-qr-url">
            <i
              className="fas fa-link"
              aria-hidden="true"
            ></i>

            <span>
              {publicProfileUrl}
            </span>
          </div>

          {/* ===========================================
              ERROR
          =========================================== */}

          {error && (
            <div
              className="inmba-member-qr-error"
              role="alert"
            >
              <i
                className="fas fa-circle-exclamation"
                aria-hidden="true"
              ></i>

              <span>
                {error}
              </span>
            </div>
          )}

          {/* ===========================================
              ACTIONS
          =========================================== */}

          <div className="inmba-member-qr-actions">
            {/* VIEW PROFILE */}

            <Link
              to={
                publicProfilePath
              }
              className="inmba-member-qr-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i
                className="fas fa-user"
                aria-hidden="true"
              ></i>

              <span>
                View Public Profile
              </span>
            </Link>

            {/* DOWNLOAD */}

            <button
              type="button"
              className="inmba-member-qr-secondary"
              onClick={
                handleDownload
              }
              disabled={
                downloading
              }
            >
              <i
                className={
                  downloading
                    ? "fas fa-spinner fa-spin"
                    : "fas fa-download"
                }
                aria-hidden="true"
              ></i>

              <span>
                {downloading
                  ? "Downloading..."
                  : "Download QR"}
              </span>
            </button>

            {/* COPY */}

            <button
              type="button"
              className="inmba-member-qr-secondary"
              onClick={
                handleCopy
              }
            >
              <i
                className={
                  copied
                    ? "fas fa-check"
                    : "fas fa-copy"
                }
                aria-hidden="true"
              ></i>

              <span>
                {copied
                  ? "Copied"
                  : "Copy Link"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}