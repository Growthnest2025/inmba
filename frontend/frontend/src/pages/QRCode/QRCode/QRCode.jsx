import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  QRCodeCanvas,
} from "qrcode.react";

import {
  toast,
} from "react-toastify";

import {
  useAuth,
} from "../../../context/AuthContext";

import {
  getMemberDashboard,
} from "../../../services/member.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./QRCode.css";
import { toText, asObject } from "../../../utils/commonHelpers";

/* =========================
   OBJECT HELPER
========================= */

/* =========================
   TEXT HELPER
========================= */

/* =========================
   FULL NAME
========================= */

const getFullName = (member) => {
  const firstName =
    toText(
      member?.first_name ??
        member?.firstName,
      ""
    );

  const lastName =
    toText(
      member?.last_name ??
        member?.lastName,
      ""
    );

  return (
    `${firstName} ${lastName}`.trim() ||
    "INMBA Member"
  );
};

/* =========================
   MEMBER STATUS
========================= */

const getMemberStatus = (member, isApproved = false) => {
  const paymentStatus =
    toText(
      member?.payment_status ??
        member?.paymentStatus,
      "pending"
    ).toLowerCase();

  const verified = Boolean(isApproved);

  return {
    verified,

    value:
      verified
        ? "verified"
        : paymentStatus,

    label:
      verified
        ? "Verified Member"
        : paymentStatus === "rejected"
        ? "Verification Rejected"
        : "Verification Pending",
  };
};

/* =========================
   DASHBOARD DATA
========================= */

const normalizeDashboardData = (
  rawData
) => {
  const root =
    asObject(rawData);

  const dashboard =
    asObject(root.dashboard);

  const source =
    Object.keys(dashboard).length > 0
      ? dashboard
      : root;

  const member =
    asObject(
      source.member ||
        source.user ||
        source.profile ||
        root.member ||
        root.user
    );

  return {
    member,
  };
};

/* =========================
   COPY TEXT
========================= */

const copyToClipboard =
  async (value) => {
    const text =
      toText(value);

    if (!text) {
      throw new Error(
        "Nothing to copy."
      );
    }

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(
        text
      );

      return;
    }

    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value = text;

    textarea.style.position =
      "fixed";

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

    document.body.removeChild(
      textarea
    );

    if (!copied) {
      throw new Error(
        "Unable to copy."
      );
    }
  };

/* =========================
   DOWNLOAD CANVAS AS PNG
========================= */

const downloadCanvasQr = ({
  canvasId,
  filename,
}) => {
  const canvas =
    document.getElementById(
      canvasId
    );

  if (
    !canvas ||
    canvas.tagName !== "CANVAS"
  ) {
    throw new Error(
      "QR canvas is unavailable."
    );
  }

  const pngUrl =
    canvas.toDataURL(
      "image/png"
    );

  const downloadLink =
    document.createElement("a");

  downloadLink.href =
    pngUrl;

  downloadLink.download =
    filename;

  downloadLink.style.display =
    "none";

  document.body.appendChild(
    downloadLink
  );

  downloadLink.click();

  document.body.removeChild(
    downloadLink
  );
};

/* =========================
   QR CODE PAGE
========================= */

export default function QRCode() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const {
    member: sessionMember,
    clearMemberSession,
  } = useAuth();

  const [
    dashboardData,
    setDashboardData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    downloading,
    setDownloading,
  ] = useState(false);

  /* =========================
     LOAD MEMBER DETAILS
  ========================= */

  const loadQrInformation =
    useCallback(
      async (
        {
          signal,
        } = {}
      ) => {
        try {
          setLoading(true);
          setError("");

          const result =
            await getMemberDashboard({
              signal,
            });

          setDashboardData(
            normalizeDashboardData(
              result.data
            )
          );
        } catch (
          requestError
        ) {
          const cancelled =
            requestError?.code ===
              "ERR_CANCELED" ||
            requestError?.name ===
              "CanceledError" ||
            signal?.aborted;

          if (cancelled) {
            return;
          }

          const statusCode =
            Number(
              requestError?.response
                ?.status ||
                requestError?.statusCode ||
                0
            );

          if (
            statusCode === 401 ||
            requestError?.sessionExpired
          ) {
            clearMemberSession();

            navigate(
              "/login",
              {
                replace: true,

                state: {
                  from: "/qr-code",

                  error:
                    "Your session has expired. Please login again.",
                },
              }
            );

            return;
          }

          console.error(
            "QR Page API Error:",
            requestError
          );

          setDashboardData(null);

          setError(
            getApiErrorMessage(
              requestError,
              "Unable to load your QR information."
            )
          );
        } finally {
          if (!signal?.aborted) {
            setLoading(false);
          }
        }
      },
      [
        clearMemberSession,
        navigate,
      ]
    );

  useEffect(() => {
    const controller =
      new AbortController();

    loadQrInformation({
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [loadQrInformation]);

  /* =========================
     MERGED MEMBER DATA
  ========================= */

  const member =
    useMemo(
      () => ({
        ...asObject(
          sessionMember
        ),

        ...asObject(
          dashboardData?.member
        ),
      }),
      [
        sessionMember,
        dashboardData,
      ]
    );

  const fullName =
    getFullName(member);

  const loginId =
    toText(
      member.login_id ??
        member.loginId ??
        dashboardData?.member?.login_id ??
        dashboardData?.login_id ??
        sessionMember?.login_id ??
        (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("inmba_login_id") : "") ??
        (typeof localStorage !== "undefined" ? localStorage.getItem("inmba_login_id") : ""),
      ""
    );

  const membershipType =
    toText(
      member.membership_type ??
        member.membershipType,
      "INMBA Member"
    );

  const themeParam = searchParams.get("theme");

  const isProfessional =
    themeParam ===
      "professional" ||
    [
      "professional",
      "professional member",
      "professional membership",
    ].includes(
      membershipType
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim()
    );

  const dashboardPath =
    isProfessional
      ? "/professional-dashboard"
      : "/dashboard";

  const isCommercial =
    themeParam === "commercial" ||
    /commercial/i.test(membershipType);

  const paymentStatus = toText(
    member.payment_status ??
      member.paymentStatus ??
      dashboardData?.member?.payment_status ??
      dashboardData?.payment_status ??
      sessionMember?.payment_status,
    "pending"
  ).toLowerCase().trim();

  const isPaymentApproved =
    paymentStatus === "approved" ||
    paymentStatus === "paid" ||
    paymentStatus === "completed" ||
    paymentStatus === "success";

  const kycStatus = toText(
    member.professional_kyc_status ??
      member.commercial_kyc_status ??
      member.kyc_status ??
      member.kycStatus ??
      dashboardData?.kyc?.status ??
      dashboardData?.kyc_status ??
      dashboardData?.member?.professional_kyc_status ??
      dashboardData?.member?.commercial_kyc_status,
    ""
  ).toLowerCase().trim();

  const isKycApproved = kycStatus === "approved";

  // For Professional & Civilian: payment approval by admin activates QR
  // For Commercial: payment approval or full KYC approval activates QR
  const isApproved = isCommercial
    ? Boolean(isPaymentApproved && (isKycApproved || member.is_approved || member.is_payment_approved || dashboardData?.is_approved))
    : Boolean(isPaymentApproved || member.is_approved || member.is_payment_approved || member.kyc_verified || dashboardData?.member?.is_approved || dashboardData?.is_approved);

  const memberStatus =
    getMemberStatus(member, isApproved);

  /* =========================
     PUBLIC PROFILE URL
  ========================= */

  const frontendBaseUrl =
    typeof window !== "undefined" &&
    !window.location.hostname.includes("vercel.app") &&
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("127.0.0.1")
      ? window.location.origin
      : "https://inmba.org";

  const publicProfilePath =
    loginId
      ? `/public-profile/${encodeURIComponent(
          loginId
        )}`
      : "";

  const publicProfileUrl =
    publicProfilePath
      ? `${frontendBaseUrl}${publicProfilePath}`
      : "";

  const qrCanvasId =
    "inmba-member-profile-qr";

  /* =========================
     COPY PROFILE LINK
  ========================= */

  const handleCopyProfileLink =
    async () => {
      try {
        await copyToClipboard(
          publicProfileUrl
        );

        toast.success(
          "Public profile link copied."
        );
      } catch {
        toast.error(
          "Unable to copy profile link."
        );
      }
    };

  /* =========================
     SHARE PROFILE
  ========================= */

  const handleShareProfile =
    async () => {
      try {
        if (
          navigator.share
        ) {
          await navigator.share({
            title:
              `${fullName} - INMBA Profile`,

            text:
              `View ${fullName}'s official INMBA member profile.`,

            url:
              publicProfileUrl,
          });

          return;
        }

        await copyToClipboard(
          publicProfileUrl
        );

        toast.success(
          "Profile link copied."
        );
      } catch (
        shareError
      ) {
        if (
          shareError?.name !==
          "AbortError"
        ) {
          toast.error(
            "Unable to share profile."
          );
        }
      }
    };

  /* =========================
     DOWNLOAD QR PNG
  ========================= */

  const handleDownloadQr =
    () => {
      if (downloading || !publicProfileUrl || !isApproved) {
        if (!isApproved) {
          toast.warning(
            (isProfessional || isCommercial)
              ? "QR Code unlocks after admin KYC and payment approval."
              : "QR Code downloads unlock after admin payment approval."
          );
        }
        return;
      }

      try {
        setDownloading(true);

        const filename =
          loginId
            ? `INMBA-${loginId}-Profile-QR.png`
            : "INMBA-Member-Profile-QR.png";

        downloadCanvasQr({
          canvasId:
            qrCanvasId,

          filename,
        });

        toast.success(
          "QR code downloaded successfully."
        );
      } catch (
        downloadError
      ) {
        toast.error(
          downloadError?.message ||
            "Unable to download QR code."
        );
      } finally {
        setDownloading(false);
      }
    };

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="inmba-qr-page">
        <div className="inmba-qr-state">
          <div
            className="spinner-border"
            role="status"
            aria-label="Loading QR code"
          ></div>

          <h1>
            Loading QR Code
          </h1>

          <p>
            Preparing your INMBA digital member identity.
          </p>
        </div>
      </main>
    );
  }

  /* =========================
     ERROR
  ========================= */

  if (error) {
    return (
      <main className="inmba-qr-page">
        <div className="inmba-qr-state inmba-qr-error-state">
          <div className="inmba-qr-state-icon">
            <i
              className="fas fa-qrcode"
              aria-hidden="true"
            ></i>
          </div>

          <h1>
            QR Code Unavailable
          </h1>

          <p>
            {error}
          </p>

          <div className="inmba-qr-state-actions">
            <Link
              to="/dashboard"
              className="inmba-qr-secondary-button"
            >
              Dashboard
            </Link>

            <button
              type="button"
              className="inmba-qr-primary-button"
              onClick={() =>
                loadQrInformation()
              }
            >
              <i
                className="fas fa-rotate-right"
                aria-hidden="true"
              ></i>

              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`inmba-qr-page ${
        isProfessional
          ? "inmba-qr-page-professional"
          : ""
      }`}
    >
      <div className="inmba-qr-container">
        {/* =====================
            HEADER
        ===================== */}

        <header className="inmba-qr-header">
          <div>
            <p>
              INMBA Member Portal
            </p>

            <h1>
              My QR Code
            </h1>

            <span>
              Scan this QR code to open your official public member
              profile.
            </span>
          </div>

          <Link
            to={dashboardPath}
            className="inmba-qr-header-button"
          >
            <i
              className="fas fa-arrow-left"
              aria-hidden="true"
            ></i>

            Dashboard
          </Link>
        </header>

        <div className="inmba-qr-main-grid">
          {/* =====================
              QR MEMBER CARD
          ===================== */}

          <section className="inmba-qr-card">
            <div className="inmba-qr-card-top">
              <span className="inmba-qr-brand-icon">
                <i
                  className="fas fa-leaf"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <p>
                  INMBA
                </p>

                <span>
                  Official Digital Member Card
                </span>
              </div>

              <span
                className={`inmba-qr-status inmba-qr-status-${memberStatus.value}`}
              >
                <i
                  className={
                    memberStatus.verified
                      ? "fas fa-circle-check"
                      : "fas fa-clock"
                  }
                  aria-hidden="true"
                ></i>

                {memberStatus.label}
              </span>
            </div>

            <div className="inmba-qr-preview-wrapper">
              {isApproved && publicProfileUrl ? (
                <div className="inmba-qr-preview">
                  <QRCodeCanvas
                    id={qrCanvasId}
                    value={
                      publicProfileUrl
                    }
                    size={260}
                    level="H"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor={
                      isProfessional
                        ? "#0d47a1"
                        : "#0f4d0f"
                    }
                    title={`INMBA public profile QR code for ${fullName}`}
                  />
                </div>
              ) : (
                <div className="inmba-qr-preview inmba-qr-placeholder" style={{ textAlign: "center", padding: "30px 20px" }}>
                  <i
                    className="fas fa-lock"
                    aria-hidden="true"
                    style={{ fontSize: "52px", color: "#f59e0b", marginBottom: "16px" }}
                  ></i>

                  <strong style={{ display: "block", fontSize: "18px", color: "#1e293b", marginBottom: "8px" }}>
                    QR Code Locked
                  </strong>

                  <span style={{ display: "block", fontSize: "14px", color: "#64748b", lineHeight: "1.5", maxWidth: "260px", margin: "0 auto" }}>
                    {!isApproved
                      ? (!isPaymentApproved && !isKycApproved
                          ? "Your payment and KYC verification are pending admin approval. The QR code will be generated once approved."
                          : !isPaymentApproved
                            ? "Your payment verification is pending admin approval. The QR code will be generated once approved."
                            : "Your KYC verification is pending admin approval. The QR code will be generated once approved.")
                      : "Member Login ID is unavailable."}
                  </span>
                </div>
              )}

              <div className="inmba-qr-scan-guide">
                <span></span>

                <p>
                  Point your mobile camera at this QR code
                </p>
              </div>
            </div>

            <div className="inmba-qr-member-details">
              <h2>
                {fullName}
              </h2>

              <p>
                {membershipType}
              </p>

              <div>
                <span>
                  Login ID
                </span>

                <strong>
                  {loginId ||
                    "Not available"}
                </strong>
              </div>
            </div>

            <div className="inmba-qr-card-footer">
              <i
                className="fas fa-shield-halved"
                aria-hidden="true"
              ></i>

              <span>
                Scan verification powered by INMBA
              </span>
            </div>
          </section>

          {/* =====================
              QR DETAILS
          ===================== */}

          <section className="inmba-qr-details-card">
            <header>
              <span>
                <i
                  className="fas fa-qrcode"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <h2>
                  Digital Profile QR
                </h2>

                <p>
                  Your QR code is connected directly to your public
                  profile.
                </p>
              </div>
            </header>

            <div className="inmba-qr-info-list">
              <div className="inmba-qr-info-item">
                <span>
                  <i
                    className="fas fa-user"
                    aria-hidden="true"
                  ></i>

                  Member Name
                </span>

                <strong>
                  {fullName}
                </strong>
              </div>

              <div className="inmba-qr-info-item">
                <span>
                  <i
                    className="fas fa-id-card"
                    aria-hidden="true"
                  ></i>

                  Login ID
                </span>

                <strong>
                  {loginId ||
                    "Not available"}
                </strong>
              </div>

              <div className="inmba-qr-info-item">
                <span>
                  <i
                    className="fas fa-crown"
                    aria-hidden="true"
                  ></i>

                  Membership
                </span>

                <strong>
                  {membershipType}
                </strong>
              </div>

              <div className="inmba-qr-info-item">
                <span>
                  <i
                    className="fas fa-shield-halved"
                    aria-hidden="true"
                  ></i>

                  Verification
                </span>

                <strong>
                  {memberStatus.label}
                </strong>
              </div>
            </div>

            <div className="inmba-qr-profile-link">
              <label>
                Public Profile Link
              </label>

              <div>
                <input
                  type="text"
                  value={
                    publicProfileUrl
                  }
                  readOnly
                  aria-label="Public profile link"
                />

                <button
                  type="button"
                  onClick={
                    handleCopyProfileLink
                  }
                  disabled={!isApproved || !publicProfileUrl}
                  aria-label="Copy public profile link"
                >
                  <i
                    className="fas fa-copy"
                    aria-hidden="true"
                  ></i>
                </button>
              </div>
            </div>

            <div className="inmba-qr-actions">
              <button
                type="button"
                className="inmba-qr-primary-button"
                onClick={
                  handleDownloadQr
                }
                disabled={downloading || !isApproved || !publicProfileUrl}
              >
                {downloading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      aria-hidden="true"
                    ></span>

                    Downloading...
                  </>
                ) : (
                  <>
                    <i
                      className="fas fa-download"
                      aria-hidden="true"
                    ></i>

                    Download PNG
                  </>
                )}
              </button>

              <button
                type="button"
                className="inmba-qr-secondary-button"
                onClick={
                  handleShareProfile
                }
                disabled={!isApproved || !publicProfileUrl}
              >
                <i
                  className="fas fa-share-nodes"
                  aria-hidden="true"
                ></i>

                Share Profile
              </button>

              {publicProfilePath && (
                <Link
                  to={
                    publicProfilePath
                  }
                  className="inmba-qr-secondary-button"
                >
                  <i
                    className="fas fa-address-card"
                    aria-hidden="true"
                  ></i>

                  View Profile
                </Link>
              )}
            </div>

            <div className="inmba-qr-security-note">
              <span>
                <i
                  className="fas fa-lock"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <h3>
                  Secure Public Information
                </h3>

                <p>
                  The QR code opens only the member information
                  approved for public display.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* =====================
            HOW IT WORKS
        ===================== */}

        <section className="inmba-qr-steps">
          <header>
            <p>
              Simple and Secure
            </p>

            <h2>
              How the QR code works
            </h2>
          </header>

          <div className="inmba-qr-steps-grid">
            <article>
              <span>
                1
              </span>

              <div>
                <i
                  className="fas fa-mobile-screen"
                  aria-hidden="true"
                ></i>

                <h3>
                  Open Camera
                </h3>

                <p>
                  Open the camera or QR scanner on a mobile device.
                </p>
              </div>
            </article>

            <article>
              <span>
                2
              </span>

              <div>
                <i
                  className="fas fa-qrcode"
                  aria-hidden="true"
                ></i>

                <h3>
                  Scan QR
                </h3>

                <p>
                  Point the camera at the member QR code.
                </p>
              </div>
            </article>

            <article>
              <span>
                3
              </span>

              <div>
                <i
                  className="fas fa-address-card"
                  aria-hidden="true"
                ></i>

                <h3>
                  View Profile
                </h3>

                <p>
                  The correct public member profile opens instantly.
                </p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
