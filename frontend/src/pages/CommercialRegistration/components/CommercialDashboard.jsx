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
  useAuth,
} from "../../../context/AuthContext";

import {
  getMemberDashboard,
} from "../../../services/member.service";

import api, {
  BACKEND_URL,
} from "../../../api/api";

import "./CommercialDashboard.css";


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
  const result =
    String(
      value ?? ""
    ).trim();

  return (
    result ||
    fallback
  );
};


const toNumber = (
  value
) => {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
};


const getBackendFileUrl = (
  value
) => {
  const path =
    toText(
      value
    );

  if (!path) {
    return "";
  }

  if (
    path.startsWith(
      "http://"
    ) ||
    path.startsWith(
      "https://"
    ) ||
    path.startsWith(
      "data:"
    ) ||
    path.startsWith(
      "blob:"
    )
  ) {
    return path;
  }

  if (
    path.startsWith(
      "/"
    )
  ) {
    return `${BACKEND_URL}${path}`;
  }

  return `${BACKEND_URL}/${path}`;
};


const formatDate = (
  value
) => {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(
      typeof value ===
        "string"
        ? value.replace(
            " ",
            "T"
          )
        : value
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

  return date.toLocaleDateString(
    "en-IN",
    {
      month:
        "short",

      year:
        "numeric",
    }
  );
};


const normalizeStatus = (
  value,
  fallback = "pending"
) => {
  return toText(
    value,
    fallback
  )
    .toLowerCase()
    .replace(
      /\s+/g,
      "_"
    );
};


const statusLabel = (
  value
) => {
  const status =
    normalizeStatus(
      value
    );

  if (
    status ===
      "approved" ||
    status ===
      "paid"
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
      "under_review" ||
    status ===
      "under-review"
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
    "draft"
  ) {
    return "Draft";
  }

  return "Pending";
};


const copyText = async (
  value
) => {
  const text =
    toText(
      value
    );

  if (!text) {
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

  document.body.appendChild(
    textarea
  );

  textarea.focus();

  textarea.select();

  document.execCommand(
    "copy"
  );

  textarea.remove();
};


/* =========================================================
   NORMALIZE DASHBOARD
========================================================= */

const normalizeDashboardData = (
  raw
) => {
  const root =
    asObject(
      raw
    );

  const dashboard =
    asObject(
      root.dashboard
    );

  const source =
    Object.keys(
      dashboard
    ).length
      ? dashboard
      : root;

  const member =
    asObject(
      source.member ||
      source.user ||
      root.member ||
      root.user
    );

  const network =
    asObject(
      source.network ||
      source.network_stats ||
      source.stats
    );

  const sponsor =
    asObject(
      source.referred_user ||
      source.sponsor ||
      source.referrer
    );

  const direct =
    toNumber(
      source.direct ??
      source.direct_count ??
      network.direct ??
      network.direct_count
    );

  const indirect =
    toNumber(
      source.indirect ??
      source.indirect_count ??
      network.indirect ??
      network.indirect_count
    );

  return {
    member,

    network,

    sponsor,

    direct,

    indirect,

    total:
      toNumber(
        source.network_strength ??
        network.total ??
        direct +
          indirect
      ),

    paidDirect:
      toNumber(
        source.paid_direct ??
        network.paid_direct ??
        network.direct_paid
      ),

    unpaidDirect:
      toNumber(
        source.unpaid_direct ??
        network.unpaid_direct ??
        network.direct_unpaid
      ),

    paidIndirect:
      toNumber(
        source.paid_indirect ??
        network.paid_indirect ??
        network.indirect_paid
      ),

    unpaidIndirect:
      toNumber(
        source.unpaid_indirect ??
        network.unpaid_indirect ??
        network.indirect_unpaid
      ),

    referralId:
      toText(
        source.referral_id ??
        member.referral_id
      ),

    acknowledgementUrl:
      getBackendFileUrl(
        source.acknowledgement_url ??
        member.acknowledgement_url
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
  status = false,
}) {
  return (
    <article className="commercial-dashboard-summary-card">

      <div className="commercial-dashboard-summary-icon">
        <i
          className={icon}
          aria-hidden="true"
        />
      </div>

      <div>

        <p>
          {label}
        </p>

        <h3
          className={
            status
              ? "commercial-dashboard-status-value"
              : ""
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

export default function CommercialDashboard() {

  const navigate =
    useNavigate();


  const {
    member:
      sessionMember,

    clearMemberSession,
  } =
    useAuth();


  const [
    dashboardData,
    setDashboardData,
  ] =
    useState(
      null
    );


  const [
    commercialKyc,
    setCommercialKyc,
  ] =
    useState(
      null
    );


  const [
    commercialPayment,
    setCommercialPayment,
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
     LOAD
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


          const storedCommercialLoginId =
            toText(
              sessionStorage.getItem(
                "commercial_login_id"
              ) ||
              sessionStorage.getItem(
                "inmba_commercial_login_id"
              ) ||
              localStorage.getItem(
                "commercial_login_id"
              )
            );


          const [
            dashboardResult,
            kycResult,
            paymentResult,
          ] =
            await Promise.allSettled([
              getMemberDashboard(),

              api.get(
                "/commercial-kyc"
              ),

api.get(
  "/commercial-payment"
),
            ]);


          if (
            dashboardResult.status ===
            "fulfilled"
          ) {

            setDashboardData(
              normalizeDashboardData(
                dashboardResult.value
                  ?.data ??
                dashboardResult.value
              )
            );

          }


          if (
            kycResult.status ===
            "fulfilled"
          ) {

            setCommercialKyc(
              asObject(
                kycResult.value
                  ?.data
                  ?.data
                  ?.commercialKyc
              )
            );

          }


          if (
            paymentResult.status ===
            "fulfilled"
          ) {

            const paymentResponse =
              paymentResult.value
                ?.data;

            const paymentData =
              paymentResponse
                ?.data
                ?.payment ||
              paymentResponse
                ?.payment ||
              paymentResponse
                ?.data ||
              paymentResponse ||
              null;

            setCommercialPayment(
              paymentData &&
              typeof paymentData ===
                "object"
                ? paymentData
                : null
            );

          }


          if (
            dashboardResult.status ===
            "rejected"
          ) {

            console.warn(
              "Commercial dashboard member summary unavailable:",
              dashboardResult.reason
            );

            setDashboardData(
              null
            );

          }

        } catch (
          requestError
        ) {

          console.error(
            "Commercial Dashboard Error:",
            requestError
          );


          setError(
            requestError?.response
              ?.data
              ?.message ||
            requestError?.message ||
            "Unable to load Commercial Dashboard."
          );

        } finally {

          setLoading(
            false
          );

        }

      },
      [
        clearMemberSession,
        navigate,
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
     MEMBER
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
          commercialKyc
        ),
      }),
      [
        sessionMember,
        dashboardData,
        commercialKyc,
      ]
    );


  /* =======================================================
     DETAILS
  ======================================================= */

  const ownerName =
    toText(
      member.full_legal_name ||
      member.full_name ||
      member.first_name,
      "Commercial Member"
    );


  const businessName =
    toText(
      member.business_name,
      "Business Member"
    );


  const loginId =
    toText(
      member.login_id ||
      member.loginId ||
      sessionStorage.getItem(
        "inmba_commercial_login_id"
      ) ||
      sessionStorage.getItem(
        "commercial_login_id"
      ),
      "Not available"
    );


  const storedPlan =
    useMemo(
      () => {

        try {

          const value =
            sessionStorage.getItem(
              "commercial_selected_plan"
            );

          return value
            ? JSON.parse(
                value
              )
            : {};

        } catch {

          return {};

        }

      },
      []
    );


  const businessType =
    toText(
      member.business_type,
      "Not specified"
    );


  const city =
    toText(
      member.city ||
      member.district ||
      member.entity_district,
      "Not specified"
    );


  const createdAt =
    formatDate(
      member.created_at ||
      member.createdAt
    );


  const profilePhoto =
    getBackendFileUrl(
      member.profile_pic_url ||
      member.profile_photo_url ||
      member.logo_url ||
      member.business_logo
    );


  /* =======================================================
     PAYMENT
  ======================================================= */

  const paymentStatus =
    normalizeStatus(
      commercialPayment
        ?.payment_status ||
      member.payment_status ||
      sessionStorage.getItem(
        "commercial_payment_status"
      ),
      "pending"
    );


  const paymentStatusLabel =
    statusLabel(
      paymentStatus
    );


  /*
    IMPORTANT:
    Benefits unlock only after ADMIN APPROVAL.

    "paid" / "success" means payment may have been submitted or processed,
    but Referral / QR / Public Profile must not unlock until the stored
    Commercial payment status is exactly "approved".
  */
  const isAdminApproved =
    paymentStatus ===
    "approved";


  /*
    STRICT PLAN SOURCE

    IMPORTANT:
    QR / Public Profile access must NEVER be decided from:
    - old sessionStorage
    - old member.amount
    - previous selected plan

    Premium access is decided ONLY from the CURRENT backend
    Commercial payment record approved by admin.
  */

const backendPlanId =
  toText(
    commercialPayment?.plan?.id ||
    commercialPayment?.plan_id
  ).toLowerCase();

const backendAmount =
  toNumber(
    commercialPayment?.amount ||
    commercialPayment?.plan?.amount
  );

  /*
    UI fallback only.
    This is used to display the selected membership before/while
    payment information is loading. It NEVER unlocks Premium access.
  */
  const selectedPlanId =
    backendPlanId ||
    toText(
      storedPlan?.id ||
      storedPlan?.plan_id
    ).toLowerCase();

  const selectedAmount =
    backendAmount ||
    toNumber(
      storedPlan?.amount
    );

  /*
    STRICT MEMBERSHIP RULE

    Basic:
      plan_id = basic
      amount  = 300

    Premium:
      plan_id = profile_upgrade
      amount  = 1500

    Do not use >= 1500.
    Do not accept aliases such as premium / upgrade / full.
  */
  const isPremium =
    backendPlanId ===
      "profile_upgrade" &&
    backendAmount ===
      1500;

  const isBasic =
    backendPlanId ===
      "basic" &&
    backendAmount ===
      300;

  const hasPaidPlan =
    isBasic ||
    isPremium;

  const membershipType =
    isPremium
      ? "Profile Upgrade ₹1500"
      : isBasic
        ? "Basic Membership ₹300"
        : "Commercial Member";

  /*
    FINAL COMMERCIAL ACCESS RULES

    Login / no payment:
      ✅ Referral ID
      ✅ Referral Link
      ❌ QR / Public Profile
      ❌ Royalty / Rewards

    ₹300 Basic + Admin Approved:
      ✅ Referral ID
      ✅ Referral Link
      ✅ QR / Public Profile
      ❌ Royalty / Rewards

    ₹1500 Profile Upgrade + Admin Approved:
      ✅ Referral ID
      ✅ Referral Link
      ✅ QR / Public Profile
      ✅ Royalty / Rewards
  */
  const hasQrPublicProfileAccess =
    isAdminApproved &&
    hasPaidPlan;

  const hasRoyaltyRewardsAccess =
    isAdminApproved &&
    isPremium;


  /* =======================================================
     COMMERCIAL KYC
  ======================================================= */

  const kycStatus =
    normalizeStatus(
      commercialKyc
        ?.kyc_status,
      "draft"
    );


  const kycStatusLabel =
    statusLabel(
      kycStatus
    );


  /* =======================================================
     NETWORK
  ======================================================= */

  const directNetwork =
    toNumber(
      dashboardData
        ?.direct
    );


  const indirectNetwork =
    toNumber(
      dashboardData
        ?.indirect
    );


  const totalNetwork =
    toNumber(
      dashboardData
        ?.total
    );


  /* =======================================================
     PUBLIC PROFILE
  ======================================================= */

  const frontendBaseUrl =
    String(
      process.env.REACT_APP_FRONTEND_BASE_URL ||
      window.location.origin
    )
      .trim()
      .replace(
        /\/+$/,
        ""
      );


  const validLoginId =
    loginId !==
    "Not available";


  const publicProfilePath =
    hasQrPublicProfileAccess &&
    validLoginId
      ? `/commercial/public-profile/${encodeURIComponent(
          loginId
        )}`
      : "";


  const publicProfileUrl =
    publicProfilePath
      ? `${frontendBaseUrl}${publicProfilePath}`
      : "";


  /* =======================================================
     REFERRAL
  ======================================================= */

  const referralId =
    toText(
      commercialKyc
        ?.referral_id ||
      dashboardData
        ?.referralId ||
      member.referral_id
    );


  const referralLink =
    referralId
      ? `${frontendBaseUrl}/membership-type?ref=${encodeURIComponent(
          referralId
        )}`
      : "";

  // Referral is available from Commercial registration/login itself.
  // Payment approval is NOT required for Referral ID / Link access.
  const hasReferralAccess =
    Boolean(
      referralId
    );


  const handleCopyReferral =
    async () => {

      try {

        await copyText(
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


  const handleCopyReferralLink =
    async () => {

      try {

        await copyText(
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

      <main className="commercial-dashboard-page">

        <div className="commercial-dashboard-state">

          <div className="commercial-dashboard-spinner" />

          <h2>
            Loading Commercial Dashboard
          </h2>

          <p>
            Please wait while we load your
            Commercial membership information.
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

      <main className="commercial-dashboard-page">

        <div className="commercial-dashboard-state">

          <div className="commercial-dashboard-state-icon">
            <i className="fas fa-triangle-exclamation" />
          </div>

          <h2>
            Dashboard Unavailable
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="commercial-dashboard-primary-button"
            onClick={
              loadDashboard
            }
          >
            <i className="fas fa-rotate-right" />

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

    <main className="commercial-dashboard-page">

      <div className="commercial-dashboard-container">


        {/* =================================================
            HERO
        ================================================= */}

        <section className="commercial-dashboard-hero">

          <div className="commercial-dashboard-profile">

            <div className="commercial-dashboard-avatar">

              {profilePhoto ? (

                <img
                  src={
                    profilePhoto
                  }
                  alt={
                    businessName
                  }
                />

              ) : (

                <span>
                  {businessName
                    .charAt(0)
                    .toUpperCase()}
                </span>

              )}

            </div>


            <div>

              <p className="commercial-dashboard-eyebrow">
                INMBA Commercial Portal
              </p>

              <h1>
                Welcome,{" "}
                {businessName}
              </h1>

              <p className="commercial-dashboard-hero-description">
                Manage your business profile,
                Commercial KYC, network,
                referral and membership
                information.
              </p>

            </div>

          </div>


          <button
            type="button"
            className="commercial-dashboard-refresh-button"
            onClick={
              loadDashboard
            }
          >
            <i className="fas fa-rotate" />

            Refresh
          </button>

        </section>


        {/* =================================================
            PAYMENT ALERT
        ================================================= */}

        {hasPaidPlan && !isAdminApproved && (

          <section className="commercial-dashboard-alert">

            <div className="commercial-dashboard-alert-icon">

              <i className="fas fa-clock" />

            </div>


            <div>

              <h2>
                Payment Verification Pending
              </h2>

              <p>
                Your Commercial payment is waiting
                for admin verification. Benefits will
                unlock after approval.
              </p>

            </div>


            <Link
              to="/commercial/payment"
              className="commercial-dashboard-alert-link"
            >
              View Payment
            </Link>

          </section>

        )}


        {/* =================================================
            SUMMARY
        ================================================= */}

        <section className="commercial-dashboard-summary-grid">

          <SummaryCard
            icon="fas fa-wallet"
            label="Membership Plan"
            value={
              membershipType
            }
          />

          <SummaryCard
            icon="fas fa-share-nodes"
            label="Referral Access"
            value={
              hasReferralAccess
                ? "Enabled"
                : "Locked"
            }
          />

          <SummaryCard
            icon="fas fa-qrcode"
            label="QR / Public Profile"
            value={
              hasQrPublicProfileAccess
                ? "Enabled"
                : "Locked"
            }
          />

          <SummaryCard
            icon="fas fa-gift"
            label="Royalty / Rewards"
            value={
              hasRoyaltyRewardsAccess
                ? "Enabled"
                : "Locked"
            }
          />

          <SummaryCard
            icon="fas fa-circle-check"
            label="Payment Status"
            value={
              paymentStatusLabel
            }
            status
          />

        </section>


        {/* =================================================
            MAIN GRID
        ================================================= */}

        <div className="commercial-dashboard-main-grid">


          {/* ACCOUNT */}

          <section className="commercial-dashboard-card">

            <div className="commercial-dashboard-card-header">

              <div>

                <span className="commercial-dashboard-card-icon">

                  <i className="fas fa-building" />

                </span>

                <div>

                  <p>
                    Commercial Information
                  </p>

                  <h2>
                    Business Account
                  </h2>

                </div>

              </div>


              <span
                className={`commercial-dashboard-status commercial-dashboard-status-${paymentStatus}`}
              >
                {paymentStatusLabel}
              </span>

            </div>


            <div className="commercial-dashboard-info-list">

              <InfoRow
                label="Business Name"
                value={
                  businessName
                }
              />

              <InfoRow
                label="Owner Name"
                value={
                  ownerName
                }
              />

              <InfoRow
                label="Login ID"
                value={
                  loginId
                }
              />

              <InfoRow
                label="Membership"
                value={
                  membershipType
                }
              />

              <InfoRow
                label="Business Type"
                value={
                  businessType
                }
              />

              <InfoRow
                label="Location"
                value={
                  city
                }
              />

              <InfoRow
                label="Member Since"
                value={
                  createdAt
                }
              />

            </div>


            <div className="commercial-dashboard-action-grid">

              {hasPaidPlan && (
                <Link
                  to="/commercial/profile-upgrade"
                  className="commercial-dashboard-primary-button"
                >
                  <i className="fas fa-building-shield" />

                  Commercial KYC
                </Link>
              )}

              {hasPaidPlan && (
                <Link
                  to="/commercial/profile-upgrade/review"
                  className="commercial-dashboard-secondary-button"
                >
                  <i className="fas fa-eye" />

                  Review KYC
                </Link>
              )}

              {isBasic && (
                <button
                  type="button"
                  className="commercial-dashboard-secondary-button"
                  onClick={() =>
                    navigate(
                      "/commercial/profile-upgrade"
                    )
                  }
                >
                  <i className="fas fa-crown" />

                  Upgrade to ₹1500
                </button>
              )}

              {hasQrPublicProfileAccess &&
                publicProfilePath && (
                  <Link
                    to="/commercial/full-profile"
                    className="commercial-dashboard-secondary-button"
                  >
                    <i className="fas fa-address-card" />

                    Owner Profile
                  </Link>
                )}

            </div>

          </section>


          {/* NETWORK */}

          <section className="commercial-dashboard-card">

            <div className="commercial-dashboard-card-header">

              <div>

                <span className="commercial-dashboard-card-icon">

                  <i className="fas fa-chart-column" />

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


            <div className="commercial-dashboard-network-grid">

              <NetworkStat
                className="green"
                label="Direct Paid"
                value={
                  dashboardData
                    ?.paidDirect ??
                  0
                }
                description="Active members"
              />

              <NetworkStat
                className="orange"
                label="Direct Unpaid"
                value={
                  dashboardData
                    ?.unpaidDirect ??
                  0
                }
                description="Pending activation"
              />

              <NetworkStat
                className="blue"
                label="Indirect Paid"
                value={
                  dashboardData
                    ?.paidIndirect ??
                  0
                }
                description="Active downline"
              />

              <NetworkStat
                className="pink"
                label="Indirect Unpaid"
                value={
                  dashboardData
                    ?.unpaidIndirect ??
                  0
                }
                description="Awaiting payment"
              />

            </div>


            <Link
              to="/direct_network"
              className="commercial-dashboard-full-button"
            >
              <i className="fas fa-user-group" />

              View Network Members
            </Link>

          </section>

        </div>


        {isBasic && (

          <section className="commercial-dashboard-upgrade-card">

            <div className="commercial-dashboard-upgrade-icon">
              <i className="fas fa-crown" />
            </div>

            <div className="commercial-dashboard-upgrade-copy">

              <p>
                PROFILE UPGRADE
              </p>

              <h2>
                Unlock Royalty & Rewards
              </h2>

              <span>
                Your ₹300 membership already includes Referral ID,
                Referral Link, QR Code and Public Business Profile after
                admin approval. Upgrade to ₹1500 to unlock Royalty & Rewards.
              </span>

              <div className="commercial-dashboard-upgrade-benefits">

                <b>
                  <i className="fas fa-check" />
                  Royalty Rewards
                </b>

                <b>
                  <i className="fas fa-check" />
                  Royalty Slab Access
                </b>

                <b>
                  <i className="fas fa-check" />
                  Premium Rewards Access
                </b>

              </div>

            </div>

            <button
              type="button"
              className="commercial-dashboard-upgrade-button"
              onClick={() =>
                navigate(
                  "/commercial/profile-upgrade"
                )
              }
            >
              Upgrade to ₹1500

              <i className="fas fa-arrow-right" />
            </button>

          </section>

        )}


        {/* =================================================
            COMMERCIAL KYC
        ================================================= */}

        {hasPaidPlan && (

        <section className="commercial-dashboard-card">

          <div className="commercial-dashboard-card-header">

            <div>

              <span className="commercial-dashboard-card-icon">

                <i className="fas fa-file-shield" />

              </span>

              <div>

                <p>
                  Commercial Membership
                </p>

                <h2>
                  KYC & Business Profile
                </h2>

              </div>

            </div>


            <span
              className={`commercial-dashboard-status commercial-dashboard-status-${kycStatus}`}
            >
              {kycStatusLabel}
            </span>

          </div>


          <div className="commercial-dashboard-info-list">

            <InfoRow
              label="KYC Status"
              value={
                kycStatusLabel
              }
            />

            <InfoRow
              label="Business Category"
              value={
                toText(
                  commercialKyc
                    ?.business_category_tags,
                  "Not specified"
                )
              }
            />

            <InfoRow
              label="GST Number"
              value={
                toText(
                  commercialKyc
                    ?.gst_number,
                  "Not provided"
                )
              }
            />

            <InfoRow
              label="Registration / MSME"
              value={
                toText(
                  commercialKyc
                    ?.registration_number,
                  "Not provided"
                )
              }
            />

            <InfoRow
              label="Employee Count"
              value={
                toText(
                  commercialKyc
                    ?.employee_count,
                  "Not specified"
                )
              }
            />

            <InfoRow
              label="Payout Cycle"
              value={
                toText(
                  commercialKyc
                    ?.preferred_payout_cycle,
                  "Not selected"
                )
              }
            />

          </div>


          <div className="commercial-dashboard-action-grid">

            <Link
              to="/commercial/profile-upgrade"
              className="commercial-dashboard-primary-button"
            >
              <i className="fas fa-file-signature" />

              Commercial KYC
            </Link>


            <Link
              to="/commercial/profile-upgrade/review"
              className="commercial-dashboard-secondary-button"
            >
              <i className="fas fa-eye" />

              Review Details
            </Link>

          </div>

        </section>

        )}


        {/* =================================================
            SPONSOR
        ================================================= */}

        {Object.keys(
          dashboardData
            ?.sponsor ||
          {}
        ).length > 0 && (

          <section className="commercial-dashboard-card">

            <div className="commercial-dashboard-card-header">

              <div>

                <span className="commercial-dashboard-card-icon">

                  <i className="fas fa-user-tie" />

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


            <div className="commercial-dashboard-sponsor-grid">

              <InfoBox
                label="Sponsor Name"
                value={`${toText(
                  dashboardData
                    .sponsor
                    .first_name,
                  "INMBA"
                )} ${toText(
                  dashboardData
                    .sponsor
                    .last_name
                )}`.trim()}
              />

              <InfoBox
                label="Referral Code"
                value={
                  toText(
                    dashboardData
                      .sponsor
                      .referral_id,
                    "Not available"
                  )
                }
              />

              <InfoBox
                label="Location"
                value={
                  toText(
                    dashboardData
                      .sponsor
                      .district,
                    "India"
                  )
                }
              />

              <InfoBox
                label="Sponsor Since"
                value={
                  formatDate(
                    dashboardData
                      .sponsor
                      .created_at
                  )
                }
              />

            </div>

          </section>

        )}


        {/* =================================================
            REFERRAL
        ================================================= */}

        <section className="commercial-dashboard-card">

          <div className="commercial-dashboard-card-header">

            <div>

              <span className="commercial-dashboard-card-icon">

                <i className="fas fa-share-from-square" />

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


          {hasReferralAccess &&
            referralId ? (

            <>

              <div className="commercial-dashboard-info-list">

                <InfoRow
                  label="Referral Code"
                  value={
                    referralId
                  }
                />

                <InfoRow
                  label="Referral Link"
                  value={
                    referralLink
                  }
                />

              </div>


              <div className="commercial-dashboard-action-grid">

                <button
                  type="button"
                  className="commercial-dashboard-primary-button"
                  onClick={
                    handleCopyReferral
                  }
                >
                  <i className="fas fa-copy" />

                  Copy Code
                </button>


                <button
                  type="button"
                  className="commercial-dashboard-secondary-button"
                  onClick={
                    handleCopyReferralLink
                  }
                >
                  <i className="fas fa-link" />

                  Copy Link
                </button>

              </div>

            </>

          ) : (

            <div className="commercial-dashboard-locked">

              <i className="fas fa-lock" />

              <div>

                <h3>
                  Referral Code Not Available
                </h3>

                <p>
                  Referral ID / Link is available from your Commercial
                  account itself. If it is not visible yet, refresh the
                  dashboard after your account details finish loading.
                </p>

              </div>

            </div>

          )}

        </section>


        {/* =================================================
            ACKNOWLEDGEMENT
        ================================================= */}

        {dashboardData
          ?.acknowledgementUrl && (

          <section className="commercial-dashboard-card">

            <div className="commercial-dashboard-card-header">

              <div>

                <span className="commercial-dashboard-card-icon">

                  <i className="fas fa-file-pdf" />

                </span>

                <div>

                  <p>
                    Commercial Document
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
              target="_blank"
              rel="noreferrer"
              className="commercial-dashboard-primary-button"
            >
              <i className="fas fa-download" />

              Open Acknowledgement
            </a>

          </section>

        )}


        {/* =================================================
            QR
        ================================================= */}

        {hasQrPublicProfileAccess && (

          <section className="commercial-dashboard-card commercial-dashboard-qr-card">

            <div className="commercial-dashboard-qr-content">

              <div>

                <p className="commercial-dashboard-eyebrow">
                  Digital Business Identity
                </p>

                <h2>
                  Public Business Profile QR
                </h2>

                <p>
                  Scan or share this QR code
                  to open your public Commercial
                  profile.
                </p>


                {publicProfilePath && (

                  <Link
                    to={
                      publicProfilePath
                    }
                    className="commercial-dashboard-primary-button"
                  >
                    <i className="fas fa-address-card" />

                    Public Profile
                  </Link>

                )}

              </div>


              <div className="commercial-dashboard-qr-preview">

                {publicProfileUrl ? (

                  <QRCodeCanvas
                    value={
                      publicProfileUrl
                    }
                    size={180}
                    level="H"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor="#c91f2e"
                    title={`Commercial public profile QR for ${businessName}`}
                  />

                ) : (

                  <div className="commercial-dashboard-qr-placeholder">

                    <i className="fas fa-qrcode" />

                    <span>
                      Login ID unavailable
                    </span>

                  </div>

                )}

              </div>

            </div>

          </section>

        )}


        {/* =================================================
            ROYALTY / REWARDS - ₹1500 ONLY
        ================================================= */}

        <section className="commercial-dashboard-card">

          <div className="commercial-dashboard-card-header">
            <div>
              <span className="commercial-dashboard-card-icon">
                <i className="fas fa-gift" />
              </span>

              <div>
                <p>Royalty Program</p>
                <h2>Royalty & Rewards</h2>
              </div>
            </div>

            <span
              className={`commercial-dashboard-status ${
                hasRoyaltyRewardsAccess
                  ? "commercial-dashboard-status-approved"
                  : ""
              }`}
            >
              {hasRoyaltyRewardsAccess
                ? "Enabled"
                : "Locked"}
            </span>
          </div>

          {hasRoyaltyRewardsAccess ? (
            <div className="commercial-dashboard-info-list">
              <InfoRow
                label="Royalty Access"
                value="Enabled"
              />

              <InfoRow
                label="Royalty Slab"
                value={
                  toText(
                    commercialKyc?.commercial_royalty_slab_category ||
                    commercialKyc?.royalty_slab_category ||
                    member.commercial_royalty_slab_category ||
                    member.royalty_slab_category,
                    "Active"
                  )
                }
              />

              <InfoRow
                label="Rewards"
                value="Enabled for ₹1500 Profile Upgrade"
              />
            </div>
          ) : (
            <div className="commercial-dashboard-locked">
              <i className="fas fa-lock" />

              <div>
                <h3>Royalty & Rewards Locked</h3>
                <p>
                  Royalty and Rewards are available only for the
                  ₹1500 Profile Upgrade after admin approval.
                </p>
              </div>
            </div>
          )}

        </section>


        {/* =================================================
            PRIVACY
        ================================================= */}

        <section className="commercial-dashboard-card">

          <div className="commercial-dashboard-card-header">

            <div>

              <span className="commercial-dashboard-card-icon">

                <i className="fas fa-shield-halved" />

              </span>

              <div>

                <p>
                  Privacy Protection
                </p>

                <h2>
                  Commercial Profile Access
                </h2>

              </div>

            </div>

          </div>


          <div className="commercial-dashboard-info-list">

            <InfoRow
              label="Dashboard"
              value="Private Owner Access"
            />

            <InfoRow
              label="QR / Public Profile"
              value={
                hasQrPublicProfileAccess
                  ? "Enabled - Public Business Details Only"
                  : "Locked - ₹300 / ₹1500 Admin Approval Required"
              }
            />

            <InfoRow
              label="Aadhaar / PAN / Bank"
              value="Private"
            />

            <InfoRow
              label="Network / Royalty"
              value="Owner Access Only"
            />

          </div>

        </section>


      </div>

    </main>

  );

}


/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  label,
  value,
}) {

  return (

    <div className="commercial-dashboard-info-row">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>

  );

}


/* =========================================================
   NETWORK
========================================================= */

function NetworkStat({
  label,
  value,
  description,
  className,
}) {

  return (

    <article
      className={`commercial-dashboard-network-stat commercial-dashboard-network-${className}`}
    >

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {description}
      </small>

    </article>

  );

}


/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({
  label,
  value,
}) {

  return (

    <div className="commercial-dashboard-info-box">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>

  );

}
