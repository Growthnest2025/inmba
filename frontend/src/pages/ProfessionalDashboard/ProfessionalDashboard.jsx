import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  QRCodeCanvas,
} from "qrcode.react";

import {
  toast,
} from "react-toastify";

import {
  BACKEND_URL,
} from "../../api/api";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  getMemberDashboard,
} from "../../services/member.service";

import {
  getOwnFullProfile,
} from "../../services/profile.service";

import {
  getApiErrorMessage,
} from "../../utils/apiError";

import "./ProfessionalDashboard.css";
import { toText, asObject, toNumber } from "../../utils/commonHelpers";

/* =========================================================
   COMMON HELPERS
========================================================= */

/* =========================================================
   NUMBER
========================================================= */

/* =========================================================
   TEXT
========================================================= */

/* =========================================================
   MEMBERSHIP TYPE
========================================================= */

const normalizeMembershipType = (
  value
) => {
  return toText(
    value
  )
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );
};

/* =========================================================
   PROFESSIONAL MEMBERSHIP
========================================================= */

const isProfessionalMembership = (
  value
) => {
  const type =
    normalizeMembershipType(
      value
    );

  return [
    "professional",
    "professional member",
    "professional membership",
  ].includes(
    type
  );
};

/* =========================================================
   BACKEND FILE URL
========================================================= */

const getBackendFileUrl = (
  value
) => {
  const filePath =
    toText(
      value
    );

  if (
    !filePath
  ) {
    return "";
  }

  if (
    filePath.startsWith(
      "http://"
    ) ||
    filePath.startsWith(
      "https://"
    ) ||
    filePath.startsWith(
      "data:"
    ) ||
    filePath.startsWith(
      "blob:"
    )
  ) {
    return filePath;
  }

  if (
    filePath.startsWith(
      "/"
    )
  ) {
    return `${BACKEND_URL}${filePath}`;
  }

  return `${BACKEND_URL}/${filePath}`;
};

/* =========================================================
   DATE
========================================================= */

const formatMemberDate = (
  value
) => {
  if (
    !value
  ) {
    return "Not available";
  }

  const normalizedValue =
    typeof value ===
      "string"
      ? value.replace(
          " ",
          "T"
        )
      : value;

  const date =
    new Date(
      normalizedValue
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return toText(
      value,
      "Not available"
    );
  }

  return date
    .toLocaleDateString(
      "en-IN",
      {
        month:
          "short",

        year:
          "numeric",
      }
    );
};

/* =========================================================
   PAYMENT STATUS
========================================================= */

const normalizePaymentStatus = (
  value
) => {
  return toText(
    value,
    "pending"
  ).toLowerCase();
};

const getPaymentStatusLabel = (
  value
) => {
  const status =
    normalizePaymentStatus(
      value
    );

  if (
    status ===
    "approved"
  ) {
    return "Approved";
  }

  if (
    status ===
    "paid"
  ) {
    return "Paid";
  }

  if (
    status ===
    "rejected"
  ) {
    return "Rejected";
  }

  if (
    status ===
    "submitted"
  ) {
    return "Submitted";
  }

  return "Pending";
};

/* =========================================================
   PROFESSIONAL KYC STATUS
========================================================= */

const getProfessionalKycStatusLabel = (
  value
) => {
  const status =
    toText(
      value,
      "draft"
    )
      .toLowerCase()
      .replace(
        /_/g,
        " "
      );

  if (
    status ===
    "approved"
  ) {
    return "Approved";
  }

  if (
    status ===
    "submitted"
  ) {
    return "Submitted";
  }

  if (
    status ===
    "under review"
  ) {
    return "Under Review";
  }

  if (
    status ===
    "rejected"
  ) {
    return "Rejected";
  }

  if (
    status ===
    "in progress"
  ) {
    return "In Progress";
  }

  return "Draft";
};

/* =========================================================
   COPY TEXT
========================================================= */

const copyTextToClipboard =
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
      throw new Error(
        "Nothing to copy."
      );
    }

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard
        .writeText(
          text
        );

      return;
    }

    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value =
      text;

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

    textarea.remove();

    if (
      !copied
    ) {
      throw new Error(
        "Unable to copy."
      );
    }
  };

/* =========================================================
   NORMALIZE DASHBOARD DATA
========================================================= */

const normalizeDashboardData = (
  rawData
) => {
  const rootData =
    asObject(
      rawData
    );

  const dashboardObject =
    asObject(
      rootData.dashboard
    );

  const source =
    Object.keys(
      dashboardObject
    ).length > 0
      ? dashboardObject
      : rootData;

  const member =
    asObject(
      source.member ||
      source.user ||
      source.profile ||
      rootData.member ||
      rootData.user
    );

  const network =
    asObject(
      source.network ||
      source.network_stats ||
      source.statistics ||
      source.stats
    );

  const sponsor =
    asObject(
      source.referred_user ||
      source.referredUser ||
      source.sponsor ||
      source.referrer
    );

  const direct =
    toNumber(
      source.direct ??
      source.direct_count ??
      network.direct ??
      network.direct_count ??
      member.direct_network
    );

  const indirect =
    toNumber(
      source.indirect ??
      source.indirect_count ??
      network.indirect ??
      network.indirect_count ??
      member.indirect_network
    );

  const paidDirect =
    toNumber(
      source.paid_direct ??
      source.paidDirect ??
      network.paid_direct ??
      network.direct_paid
    );

  const unpaidDirect =
    toNumber(
      source.unpaid_direct ??
      source.unpaidDirect ??
      network.unpaid_direct ??
      network.direct_unpaid
    );

  const paidIndirect =
    toNumber(
      source.paid_indirect ??
      source.paidIndirect ??
      network.paid_indirect ??
      network.indirect_paid
    );

  const unpaidIndirect =
    toNumber(
      source.unpaid_indirect ??
      source.unpaidIndirect ??
      network.unpaid_indirect ??
      network.indirect_unpaid
    );

  const networkStrength =
    toNumber(
      source.network_strength ??
      network.total ??
      member.network_strength ??
      direct +
        indirect
    );

  const referralId =
    toText(
      source.referral_id ??
      source.referralId ??
      member.referral_id
    );

  const acknowledgementPath =
    source.acknowledgement_url ??
    source.acknowledgementUrl ??
    source.download_ack_url ??
    source.downloadAckUrl ??
    member.acknowledgement_url;

  return {
    member,

    network,

    sponsor,

    direct,

    indirect,

    paidDirect,

    unpaidDirect,

    paidIndirect,

    unpaidIndirect,

    networkStrength,

    referralId,

    acknowledgementUrl:
      getBackendFileUrl(
        acknowledgementPath
      ),
  };
};

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  icon,
  label,
  value,
  valueClassName = "",
}) {
  return (
    <article className="member-dashboard-summary-card">
      <div className="member-dashboard-summary-icon">
        <i
          className={
            icon
          }
          aria-hidden="true"
        ></i>
      </div>

      <div>
        <p>
          {label}
        </p>

        <h3
          className={
            valueClassName
          }
        >
          {value}
        </h3>
      </div>
    </article>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function ProfessionalDashboard() {
  const navigate =
    useNavigate();

  const {
    member:
      sessionMember,

    clearMemberSession,

    accountTheme,
  } =
    useAuth();

  const [
    dashboardData,
    setDashboardData,
  ] =
    useState(
      null
    );

  /* =======================================================
     OWN FULL PROFILE

     Professional:
     /api/me/professional-profile

     Other membership:
     existing profile fallback.
  ======================================================= */

  const [
    ownerProfile,
    setOwnerProfile,
  ] =
    useState(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  /* =======================================================
     LOAD DASHBOARD + OWN FULL PROFILE
  ======================================================= */

  const loadDashboard =
    useCallback(
      async (
        {
          signal,
        } = {}
      ) => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          /* ===============================================
             BOTH REQUESTS ARE OWNER-AUTHENTICATED

             Dashboard:
             network/payment/general data

             Owner profile:
             Professional private/full data
          =============================================== */

          const [
            dashboardResult,
            profileResult,
          ] =
            await Promise.all([
              getMemberDashboard({
                signal,
              }),

              getOwnFullProfile({
                signal,
              }),
            ]);

          const normalizedDashboard =
            normalizeDashboardData(
              dashboardResult
                ?.data ??
              dashboardResult
            );

          const normalizedOwnerProfile =
            asObject(
              profileResult
                ?.profile ??
              profileResult
                ?.member
            );

          setDashboardData(
            normalizedDashboard
          );

          setOwnerProfile(
            normalizedOwnerProfile
          );
        } catch (
          requestError
        ) {
          const cancelled =
            requestError
              ?.code ===
              "ERR_CANCELED" ||
            requestError
              ?.name ===
              "CanceledError" ||
            signal
              ?.aborted;

          if (
            cancelled
          ) {
            return;
          }

          const statusCode =
            Number(
              requestError
                ?.response
                ?.status ??
              requestError
                ?.statusCode ??
              0
            );

          if (
            statusCode ===
              401 ||
            requestError
              ?.sessionExpired
          ) {
            clearMemberSession();

            navigate(
              "/login",
              {
                replace:
                  true,

                state: {
                  from:
                    "/professional-dashboard",

                  error:
                    "Your session has expired. Please login again.",
                },
              }
            );

            return;
          }

          console.error(
            "Dashboard API Error:",
            requestError
          );

          setDashboardData(
            null
          );

          setOwnerProfile(
            null
          );

          setError(
            getApiErrorMessage(
              requestError,
              "Unable to load your dashboard."
            )
          );
        } finally {
          if (
            !signal
              ?.aborted
          ) {
            setLoading(
              false
            );
          }
        }
      },
      [
        clearMemberSession,
        navigate,
      ]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadDashboard({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadDashboard,
    ]
  );

  /* =======================================================
     MERGED OWNER MEMBER

     Priority:

     Session
       ↓
     Dashboard
       ↓
     Full owner profile

     Full owner profile wins.
  ======================================================= */

  const member =
    useMemo(
      () => ({
        ...asObject(
          sessionMember
        ),

        ...asObject(
          dashboardData
            ?.member
        ),

        ...asObject(
          ownerProfile
        ),
      }),
      [
        sessionMember,
        dashboardData,
        ownerProfile,
      ]
    );

  /* =======================================================
     MEMBER DETAILS
  ======================================================= */

  const firstName =
    toText(
      member.first_name ??
      member.firstName,
      "Member"
    );

  const lastName =
    toText(
      member.last_name ??
      member.lastName
    );

  const fullName =
    `${firstName} ${lastName}`
      .trim();

  const loginId =
    toText(
      member.login_id ??
      member.loginId
    );

  const displayLoginId =
    loginId ||
    "Not available";

  const membershipType =
    toText(
      member.membership_type ??
      member.membershipType,
      "INMBA Member"
    );

  const professionalMember =
    isProfessionalMembership(
      membershipType
    );

  /* =======================================================
     DASHBOARD ACCOUNT THEME

     Professional member always uses blue theme.
     Other member types fall back to the account theme.
  ======================================================= */

  const isBlueTheme =
    professionalMember ||
    accountTheme === "blue";

  const dashboardThemeClass =
    isBlueTheme
      ? "member-dashboard-theme-blue"
      : "member-dashboard-theme-green";

  /* =======================================================
     PAYMENT
  ======================================================= */

  const paymentStatus =
    normalizePaymentStatus(
      member.payment_status ??
      member.paymentStatus
    );

  const paymentStatusLabel =
    getPaymentStatusLabel(
      paymentStatus
    );

  const isApproved =
    ["approved", "paid"].includes(paymentStatus);

  /* =======================================================
     PROFESSIONAL MEMBERSHIP PLAN / LEVEL

     Account Type:
     Professional Member

     ₹300 + Approved:
     INMBA Network Member
     Referral + QR + Public Profile

     ₹1500 + Approved:
     INMBA Network Royalty Member
     Referral + QR + Public Profile + Royalty

     Before approval:
     INMBA Member
  ======================================================= */

  const selectedMembershipPlan =
    toText(
      member.selected_plan ??
      member.selectedPlan ??
      member.professional_selected_plan ??
      member.professional_plan ??
      (
        Number(
          member.amount ||
          0
        ) === 1500
          ? "1500"
          : Number(
              member.amount ||
              0
            ) === 300
            ? "300"
            : ""
      )
    );

  const membershipLevel =
    !isApproved
      ? "INMBA Member"
      : selectedMembershipPlan ===
          "1500"
        ? "INMBA Network Royalty Member"
        : selectedMembershipPlan ===
            "300"
          ? "INMBA Network Member"
          : "INMBA Member";

  const membershipPlanLabel =
    selectedMembershipPlan ===
      "1500"
      ? "₹1500"
      : selectedMembershipPlan ===
          "300"
        ? "₹300"
        : "Not selected";

  const hasProfessionalNetworkAccess =
    isApproved &&
    [
      "300",
      "1500",
    ].includes(
      selectedMembershipPlan
    );

  const hasProfessionalRoyaltyAccess =
    isApproved &&
    selectedMembershipPlan ===
      "1500";

  /* =======================================================
     CREATED DATE
  ======================================================= */

  const createdAt =
    formatMemberDate(
      member.created_at ??
      member.createdAt
    );

  /* =======================================================
     PROFILE PHOTO
  ======================================================= */

  const profilePhoto =
    getBackendFileUrl(
      member.profile_pic_url ??
      member.profile_photo_url ??
      member.photo_url ??
      member.profile_pic ??
      member.profile_photo ??
      member.photo
    );

  /* =======================================================
     FRONTEND BASE URL
  ======================================================= */

  const frontendBaseUrl =
    typeof window !== "undefined" &&
    !window.location.hostname.includes("vercel.app") &&
    !window.location.hostname.includes("localhost") &&
    !window.location.hostname.includes("127.0.0.1")
      ? window.location.origin
      : "https://inmba.org";

  /* =======================================================
     PUBLIC PROFILE

     IMPORTANT:

     This link intentionally opens PUBLIC profile.

     Even owner clicks this:
     /user-profile/:loginId

     Public API whitelist applies.
  ======================================================= */

  const publicProfilePath =
    loginId
      ? `/user-profile/${encodeURIComponent(
          loginId
        )}`
      : "";

  const publicProfileUrl =
    loginId
      ? `${frontendBaseUrl}${publicProfilePath}`
      : "";

  /* =======================================================
     REFERRAL
  ======================================================= */

  const referralId =
    toText(
      ownerProfile
        ?.referral_id ??
      dashboardData
        ?.referralId ??
      member.referral_id
    );

  const referralLink =
    referralId
      ? `${frontendBaseUrl}/membership-type?ref=${encodeURIComponent(
          referralId
        )}`
      : "";

  /* =======================================================
     PROFESSIONAL KYC
  ======================================================= */

  const professionalKycStatus =
    getProfessionalKycStatusLabel(
      member
        .professional_kyc_status
    );

  const professionalCurrentStep =
    toText(
      member
        .professional_kyc_current_step,
      "A"
    );

  const completedProfessionalSections =
    useMemo(
      () => {
        if (
          !professionalMember
        ) {
          return 0;
        }

        const sectionFields = [
          "professional_section_a_completed",
          "professional_section_b_completed",
          "professional_section_c_completed",
          "professional_section_d_completed",
          "professional_section_e_completed",
          "professional_section_f_completed",
          "professional_section_g_completed",
          "professional_section_h_completed",
          "professional_section_i_completed",
          "professional_section_j_completed",
        ];

        return sectionFields
          .filter(
            (
              fieldName
            ) =>
              Boolean(
                member[
                  fieldName
                ]
              )
          )
          .length;
      },
      [
        member,
        professionalMember,
      ]
    );

  /* =======================================================
     OWNER NETWORK VALUES

     Professional full owner endpoint gets priority.
  ======================================================= */

  const directNetwork =
    toNumber(
      ownerProfile
        ?.direct_network ??
      dashboardData
        ?.direct ??
      member.direct_network
    );

  const indirectNetwork =
    toNumber(
      ownerProfile
        ?.indirect_network ??
      dashboardData
        ?.indirect ??
      member.indirect_network
    );

  const totalNetwork =
    toNumber(
      ownerProfile
        ?.team_size ??
      dashboardData
        ?.networkStrength ??
      directNetwork +
        indirectNetwork
    );

  /* =======================================================
     COPY REFERRAL CODE
  ======================================================= */

  const handleCopyReferralCode =
    async () => {
      try {
        await copyTextToClipboard(
          referralId
        );

        toast.success(
          "Referral code copied."
        );
      } catch {
        toast.error(
          "Unable to copy referral code."
        );
      }
    };

  /* =======================================================
     COPY REFERRAL LINK
  ======================================================= */

  const handleCopyReferralLink =
    async () => {
      try {
        await copyTextToClipboard(
          referralLink
        );

        toast.success(
          "Referral link copied."
        );
      } catch {
        toast.error(
          "Unable to copy referral link."
        );
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <main
        className={`member-dashboard-page ${dashboardThemeClass}`}
      >
        <div className="member-dashboard-state">
          <div
            className="spinner-border"
            role="status"
            aria-label="Loading dashboard"
          ></div>

          <h2>
            Loading Dashboard
          </h2>

          <p>
            Please wait while we load your member information.
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error
  ) {
    return (
      <main
        className={`member-dashboard-page ${dashboardThemeClass}`}
      >
        <div className="member-dashboard-state member-dashboard-error-state">
          <div className="member-dashboard-state-icon">
            <i
              className="fas fa-triangle-exclamation"
              aria-hidden="true"
            ></i>
          </div>

          <h2>
            Dashboard Unavailable
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="member-dashboard-primary-button"
            onClick={() =>
              loadDashboard()
            }
          >
            <i
              className="fas fa-rotate-right"
              aria-hidden="true"
            ></i>

            Try Again
          </button>
        </div>
      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main
      className={`member-dashboard-page ${dashboardThemeClass}`}
    >
      <div className="member-dashboard-container">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="member-dashboard-hero">
          <div className="member-dashboard-profile">
            <div className="member-dashboard-avatar">
              {profilePhoto ? (
                <img
                  src={
                    profilePhoto
                  }
                  alt={
                    fullName
                  }
                />
              ) : (
                <span>
                  {firstName
                    .charAt(
                      0
                    )
                    .toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <p className="member-dashboard-eyebrow">
                INMBA Member Portal
              </p>

              <h1>
                Welcome,{" "}
                {firstName}
              </h1>

              <p className="member-dashboard-hero-description">
                {professionalMember
                  ? "Manage your Professional profile, KYC, network, referral and membership information."
                  : "Manage your profile, network, referral details and membership information."}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="member-dashboard-refresh-button"
            onClick={() =>
              loadDashboard()
            }
          >
            <i
              className="fas fa-rotate"
              aria-hidden="true"
            ></i>

            Refresh
          </button>
        </section>

        {/* =================================================
            PAYMENT / APPROVAL
        ================================================= */}

        {!isApproved && (
          <section className="member-dashboard-alert">
            <div className="member-dashboard-alert-icon">
              <i
                className="fas fa-clock"
                aria-hidden="true"
              ></i>
            </div>

            <div>
              <h2>
                {selectedMembershipPlan
                  ? "Membership Pending Approval"
                  : "Choose Your Membership"}
              </h2>

              <p>
                {selectedMembershipPlan
                  ? `Your ₹${selectedMembershipPlan} Professional membership is not active yet. Complete the Full KYC, payment and admin approval process to unlock your membership benefits.`
                  : "Choose the ₹300 Network Member or ₹1500 Network Royalty Member plan to continue your Professional Full KYC A–J flow."}
              </p>
            </div>

            <Link
              to={
                selectedMembershipPlan
                  ? `/professional-kyc?plan=${encodeURIComponent(
                      selectedMembershipPlan
                    )}`
                  : "/professional-membership"
              }
              className="member-dashboard-alert-link"
            >
              {selectedMembershipPlan
                ? "Continue Membership"
                : "Choose Membership"}
            </Link>
          </section>
        )}

        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="member-dashboard-summary-grid">
          <SummaryCard
            icon="fas fa-users"
            label="Total Network"
            value={
              totalNetwork
            }
          />

          <SummaryCard
            icon="fas fa-user-plus"
            label="Direct Members"
            value={
              directNetwork
            }
          />

          <SummaryCard
            icon="fas fa-share-nodes"
            label="Indirect Members"
            value={
              indirectNetwork
            }
          />

          <SummaryCard
            icon="fas fa-circle-check"
            label="Payment Status"
            value={
              paymentStatusLabel
            }
            valueClassName="member-dashboard-status-value"
          />
        </section>

        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="member-dashboard-main-grid">
          {/* ===============================================
              MEMBER DETAILS
          =============================================== */}

          <section className="member-dashboard-card">
            <div className="member-dashboard-card-header">
              <div>
                <span className="member-dashboard-card-icon">
                  <i
                    className="fas fa-id-card"
                    aria-hidden="true"
                  ></i>
                </span>

                <div>
                  <p>
                    Member Information
                  </p>

                  <h2>
                    Your Account
                  </h2>
                </div>
              </div>

              <span
                className={`member-dashboard-status member-dashboard-status-${paymentStatus}`}
              >
                {paymentStatusLabel}
              </span>
            </div>

            <div className="member-dashboard-info-list">
              <div className="member-dashboard-info-row">
                <span>
                  Full Name
                </span>

                <strong>
                  {fullName}
                </strong>
              </div>

              {professionalMember &&
                member.display_name && (
                  <div className="member-dashboard-info-row">
                    <span>
                      Display Name
                    </span>

                    <strong>
                      {
                        member.display_name
                      }
                    </strong>
                  </div>
                )}

              {professionalMember &&
                member.username && (
                  <div className="member-dashboard-info-row">
                    <span>
                      Username
                    </span>

                    <strong>
                      @
                      {String(
                        member.username
                      ).replace(
                        /^@/,
                        ""
                      )}
                    </strong>
                  </div>
                )}

              <div className="member-dashboard-info-row">
                <span>
                  Login ID
                </span>

                <strong>
                  {displayLoginId}
                </strong>
              </div>

              <div className="member-dashboard-info-row">
                <span>
                  Account Type
                </span>

                <strong>
                  {membershipType}
                </strong>
              </div>

              <div className="member-dashboard-info-row">
                <span>
                  Membership Level
                </span>

                <strong>
                  {membershipLevel}
                </strong>
              </div>

              <div className="member-dashboard-info-row">
                <span>
                  Membership Plan
                </span>

                <strong>
                  {membershipPlanLabel}
                </strong>
              </div>

              <div className="member-dashboard-info-row">
                <span>
                  Member Since
                </span>

                <strong>
                  {createdAt}
                </strong>
              </div>
            </div>

<div className="member-dashboard-action-grid">
  <Link
    to="/professional-profile"
    className="member-dashboard-primary-button"
  >
    <i
      className="fas fa-user-circle"
      aria-hidden="true"
    ></i>

    My Profile
  </Link>

{hasProfessionalNetworkAccess && (
  <Link
    to="/professional-public-profile"
    className="member-dashboard-secondary-button"
  >
    <i
      className="fas fa-address-card"
      aria-hidden="true"
    ></i>

    Public Profile
  </Link>
)}

</div>
          </section>

          {/* ===============================================
              OWNER NETWORK

              IMPORTANT:
              Use protected /direct_network page.

              Do NOT send Professional owner to public
              /network profile endpoint.
          =============================================== */}

          <section className="member-dashboard-card">
            <div className="member-dashboard-card-header">
              <div>
                <span className="member-dashboard-card-icon">
                  <i
                    className="fas fa-chart-column"
                    aria-hidden="true"
                  ></i>
                </span>

                <div>
                  <p>
                    Network Statistics
                  </p>

                  <h2>
                    Performance
                  </h2>
                </div>
              </div>
            </div>

            <div className="member-dashboard-network-grid">
              <article className="member-dashboard-network-stat member-dashboard-network-green">
                <span>
                  Direct Paid
                </span>

                <strong>
                  {dashboardData
                    ?.paidDirect ??
                    0}
                </strong>

                <small>
                  Active members
                </small>
              </article>

              <article className="member-dashboard-network-stat member-dashboard-network-orange">
                <span>
                  Direct Unpaid
                </span>

                <strong>
                  {dashboardData
                    ?.unpaidDirect ??
                    0}
                </strong>

                <small>
                  Pending activation
                </small>
              </article>

              <article className="member-dashboard-network-stat member-dashboard-network-blue">
                <span>
                  Indirect Paid
                </span>

                <strong>
                  {dashboardData
                    ?.paidIndirect ??
                    0}
                </strong>

                <small>
                  Active downline
                </small>
              </article>

              <article className="member-dashboard-network-stat member-dashboard-network-pink">
                <span>
                  Indirect Unpaid
                </span>

                <strong>
                  {dashboardData
                    ?.unpaidIndirect ??
                    0}
                </strong>

                <small>
                  Awaiting payment
                </small>
              </article>
            </div>

            <Link
              to="/direct_network"
              className="member-dashboard-full-button"
            >
              <i
                className="fas fa-user-group"
                aria-hidden="true"
              ></i>

              View Network Members
            </Link>
          </section>
        </div>

        {/* =================================================
            PROFESSIONAL OWNER KYC

            This card only appears in authenticated Dashboard.

            No public profile uses this component.
        ================================================= */}

        {professionalMember && (
          <section className="member-dashboard-card">
            <div className="member-dashboard-card-header">
              <div>
                <span className="member-dashboard-card-icon">
                  <i
                    className="fas fa-file-shield"
                    aria-hidden="true"
                  ></i>
                </span>

                <div>
                  <p>
                    Professional Membership
                  </p>

                  <h2>
                    KYC & Private Profile
                  </h2>
                </div>
              </div>

              <span className="member-dashboard-status">
                {
                  professionalKycStatus
                }
              </span>
            </div>

            <div className="member-dashboard-info-list">
              <div className="member-dashboard-info-row">
                <span>
                  KYC Status
                </span>

                <strong>
                  {
                    professionalKycStatus
                  }
                </strong>
              </div>

              <div className="member-dashboard-info-row">
                <span>
                  Current KYC Step
                </span>

                <strong>
                  {
                    professionalCurrentStep
                  }
                </strong>
              </div>

              <div className="member-dashboard-info-row">
                <span>
                  Completed Sections
                </span>

                <strong>
                  {
                    completedProfessionalSections
                  } / 10
                </strong>
              </div>

              <div className="member-dashboard-info-row">
                <span>
                  Network Rank
                </span>

                <strong>
                  {toText(
                    member.network_level,
                    "Not assigned"
                  )}
                </strong>
              </div>

              <div className="member-dashboard-info-row">
                <span>
                  Royalty Slab
                </span>

                <strong>
                  {toText(
                    member
                      .royalty_slab_category,
                    "Not assigned"
                  )}
                </strong>
              </div>

              <div className="member-dashboard-info-row">
                <span>
                  Payout Cycle
                </span>

                <strong>
                  {toText(
                    member
                      .preferred_payout_cycle,
                    "Not selected"
                  )}
                </strong>
              </div>
            </div>

            <div className="member-dashboard-action-grid">
              <Link
                to={
                  selectedMembershipPlan
                    ? `/professional-kyc?plan=${encodeURIComponent(
                        selectedMembershipPlan
                      )}`
                    : "/professional-membership"
                }
                className="member-dashboard-primary-button"
              >
                <i
                  className="fas fa-file-signature"
                  aria-hidden="true"
                ></i>

                {selectedMembershipPlan
                  ? "Professional KYC"
                  : "Choose Membership"}
              </Link>

              <Link
                to="/professional-profile"
                className="member-dashboard-secondary-button"
              >
                <i
                  className="fas fa-lock"
                  aria-hidden="true"
                ></i>

                Full Private Details
              </Link>

              {hasProfessionalRoyaltyAccess && (
                <Link
                  to="/royalty-rewards"
                  className="member-dashboard-secondary-button"
                >
                  <i
                    className="fas fa-crown"
                    aria-hidden="true"
                  ></i>

                  Royalty & Rewards
                </Link>
              )}
            </div>
          </section>
        )}

        {/* =================================================
            SPONSOR

            Authenticated owner dashboard only.
        ================================================= */}

        {Object.keys(
          dashboardData
            ?.sponsor ||
          {}
        ).length > 0 && (
          <section className="member-dashboard-card member-dashboard-sponsor-card">
            <div className="member-dashboard-card-header">
              <div>
                <span className="member-dashboard-card-icon member-dashboard-sponsor-icon">
                  <i
                    className="fas fa-user-tie"
                    aria-hidden="true"
                  ></i>
                </span>

                <div>
                  <p>
                    Your Sponsor
                  </p>

                  <h2>
                    Referred By
                  </h2>
                </div>
              </div>
            </div>

            <div className="member-dashboard-sponsor-grid">
              {(
                toText(
                  dashboardData
                    .sponsor
                    .organization_id ??
                  dashboardData
                    .sponsor
                    .org_id
                ) ||
                toText(
                  dashboardData
                    .sponsor
                    .organization_name ??
                  dashboardData
                    .sponsor
                    .organization
                ) ||
                toText(
                  dashboardData
                    .sponsor
                    .referral_id
                ) === "7777777"
              ) ? (
                <>
                  <div>
                    <span>
                      Organization
                    </span>

                    <strong>
                      {toText(
                        dashboardData
                          .sponsor
                          .organization_name ??
                        dashboardData
                          .sponsor
                          .organization,
                        "INMBA"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Organization ID
                    </span>

                    <strong>
                      {toText(
                        dashboardData
                          .sponsor
                          .organization_id ??
                        dashboardData
                          .sponsor
                          .org_id ??
                        dashboardData
                          .sponsor
                          .referral_id,
                        "Not available"
                      )}
                    </strong>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span>
                      Introducer Name
                    </span>

                    <strong>
                      {`${toText(
                        dashboardData
                          .sponsor
                          .first_name,
                        "INMBA"
                      )} ${toText(
                        dashboardData
                          .sponsor
                          .last_name
                      )}`.trim()}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Introducer ID
                    </span>

                    <strong>
                      {toText(
                        dashboardData
                          .sponsor
                          .referral_id,
                        "Not available"
                      )}
                    </strong>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* =================================================
            REFERRAL

            Owner-only private dashboard information.
        ================================================= */}

        <section className="member-dashboard-card member-dashboard-referral-card">
          <div className="member-dashboard-card-header">
            <div>
              <span className="member-dashboard-card-icon">
                <i
                  className="fas fa-share-from-square"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <p>
                  Referral Program
                </p>

                <h2>
                  Invite Members
                </h2>
              </div>
            </div>
          </div>

          {hasProfessionalNetworkAccess &&
          referralId ? (
            <>
              <div className="member-dashboard-info-list">
                <div className="member-dashboard-info-row">
                  <span>
                    Referral Code
                  </span>

                  <strong>
                    {referralId}
                  </strong>
                </div>

                <div className="member-dashboard-info-row">
                  <span>
                    Referral Link
                  </span>

                  <strong
                    style={{
                      wordBreak:
                        "break-all",
                    }}
                  >
                    {referralLink}
                  </strong>
                </div>
              </div>

              <div className="member-dashboard-action-grid">
                <button
                  type="button"
                  className="member-dashboard-primary-button"
                  onClick={
                    handleCopyReferralCode
                  }
                >
                  <i
                    className="fas fa-copy"
                    aria-hidden="true"
                  ></i>

                  Copy Code
                </button>

                <button
                  type="button"
                  className="member-dashboard-secondary-button"
                  onClick={
                    handleCopyReferralLink
                  }
                >
                  <i
                    className="fas fa-link"
                    aria-hidden="true"
                  ></i>

                  Copy Link
                </button>
              </div>

              <p className="member-dashboard-referral-note">
                Share your referral code or invitation link with
                new INMBA members.
              </p>
            </>
          ) : (
            <div className="member-dashboard-locked">
              <i
                className="fas fa-lock"
                aria-hidden="true"
              ></i>

              <div>
                <h3>
                  Referral Code Not Available
                </h3>

                <p>
                  {isApproved
                    ? "Your referral information is not available yet."
                    : "Referral access unlocks only after payment verification and admin approval."}
                </p>
              </div>

              {!isApproved && (
                <Link
                  to={
                    selectedMembershipPlan
                      ? `/professional-kyc?plan=${encodeURIComponent(
                          selectedMembershipPlan
                        )}`
                      : "/professional-membership"
                  }
                  className="member-dashboard-primary-button"
                >
                  {selectedMembershipPlan
                    ? "Continue Membership"
                    : "Choose Membership"}
                </Link>
              )}
            </div>
          )}
        </section>

        {/* =================================================
            ACKNOWLEDGEMENT
        ================================================= */}

        {dashboardData
          ?.acknowledgementUrl && (
          <section className="member-dashboard-card">
            <div className="member-dashboard-card-header">
              <div>
                <span className="member-dashboard-card-icon">
                  <i
                    className="fas fa-file-pdf"
                    aria-hidden="true"
                  ></i>
                </span>

                <div>
                  <p>
                    Member Document
                  </p>

                  <h2>
                    Acknowledgement
                  </h2>
                </div>
              </div>
            </div>

            <a
              href={
                dashboardData
                  .acknowledgementUrl
              }
              className="member-dashboard-primary-button"
              target="_blank"
              rel="noreferrer"
            >
              <i
                className="fas fa-download"
                aria-hidden="true"
              ></i>

              Open Acknowledgement
            </a>
          </section>
        )}

        {/* =================================================
            QR CODE

            ₹300 / ₹1500 Approved Professional:
            QR + Public Profile access.

            QR points ONLY to:

            /user-profile/:loginId

            That page uses public whitelist.
        ================================================= */}

        {hasProfessionalNetworkAccess && (
          <section className="member-dashboard-card member-dashboard-qr-card">
            <div className="member-dashboard-qr-content">
              <div>
                <p className="member-dashboard-eyebrow">
                  Digital Identity
                </p>

                <h2>
                  Your Public Profile QR Code
                </h2>

                <p>
                  Scan or share this QR code to open your public
                  INMBA profile. Private Professional details are
                  not included in the QR profile.
                </p>

<div className="member-dashboard-qr-actions">

  <Link
    to="/professional-public-profile"
    className="member-dashboard-primary-button"
  >
    <i
      className="fas fa-address-card"
      aria-hidden="true"
    ></i>

    Manage Public Profile
  </Link>

  {publicProfilePath && (
    <Link
      to={publicProfilePath}
      className="member-dashboard-secondary-button"
    >
      <i
        className="fas fa-eye"
        aria-hidden="true"
      ></i>

      Preview Public View
    </Link>
  )}

  <Link
    to="/qr-code?theme=professional"
    className="member-dashboard-secondary-button"
  >
    <i
      className="fas fa-qrcode"
      aria-hidden="true"
    ></i>

    QR Details
  </Link>

</div>
              </div>

              <div className="member-dashboard-qr-preview">
                {publicProfileUrl ? (
                  <QRCodeCanvas
                    id="member-dashboard-qr-canvas"
                    value={
                      publicProfileUrl
                    }
                    size={
                      180
                    }
                    level="H"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor={
                      isBlueTheme
                        ? "#0d47a1"
                        : "#0f4d0f"
                    }
                    title={`INMBA public profile QR code for ${fullName}`}
                  />
                ) : (
                  <div className="member-dashboard-qr-placeholder">
                    <i
                      className="fas fa-qrcode"
                      aria-hidden="true"
                    ></i>

                    <span>
                      Login ID unavailable
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {!hasProfessionalNetworkAccess && (
          <section className="member-dashboard-card member-dashboard-qr-card">
            <div className="member-dashboard-qr-content">
              <div>
                <p className="member-dashboard-eyebrow">
                  Digital Identity
                </p>

                <h2>
                  Public Profile QR Code
                </h2>

                <p>
                  Your professional public profile QR code is currently locked. It will be generated automatically once your payment has been approved by the administrator.
                </p>

                <div className="member-dashboard-qr-actions" style={{ marginTop: "12px" }}>
                  <span className="badge bg-warning text-dark px-3 py-2" style={{ borderRadius: "8px", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <i className="fas fa-clock" aria-hidden="true"></i>
                    Awaiting Admin Approval
                  </span>
                </div>
              </div>

              <div className="member-dashboard-qr-preview">
                <div className="member-dashboard-qr-placeholder" style={{ textAlign: "center", padding: "24px 16px" }}>
                  <i
                    className="fas fa-lock"
                    aria-hidden="true"
                    style={{ fontSize: "48px", color: "#f59e0b", marginBottom: "12px" }}
                  ></i>

                  <strong style={{ display: "block", fontSize: "16px", color: "#1e293b", marginBottom: "4px" }}>
                    QR Code Locked
                  </strong>

                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    Pending Admin Verification
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =================================================
            OWNER PRIVACY NOTICE
        ================================================= */}

        {professionalMember && (
          <section className="member-dashboard-card">
            <div className="member-dashboard-card-header">
              <div>
                <span className="member-dashboard-card-icon">
                  <i
                    className="fas fa-shield-halved"
                    aria-hidden="true"
                  ></i>
                </span>

                <div>
                  <p>
                    Privacy Protection
                  </p>

                  <h2>
                    Professional Profile Access
                  </h2>
                </div>
              </div>
            </div>

            <div className="member-dashboard-info-list">
              <div className="member-dashboard-info-row">
                <span>
                  My Dashboard / Full Profile
                </span>

                <strong>
                  Private Owner Access
                </strong>
              </div>

              <div className="member-dashboard-info-row">
                <span>
                  QR / Public Profile
                </span>

                <strong>
                  Public Details Only
                </strong>
              </div>

              <div className="member-dashboard-info-row">
                <span>
                  Aadhaar / PAN / Bank / KYC
                </span>

                <strong>
                  Private
                </strong>
              </div>

              <div className="member-dashboard-info-row">
                <span>
                  Network / Royalty
                </span>

                <strong>
                  Owner Access Only
                </strong>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
