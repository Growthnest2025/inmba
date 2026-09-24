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
} from "../../../api/api";

import {
  useAuth,
} from "../../../context/AuthContext";

import {
  getMemberDashboard,
} from "../../../services/member.service";

import {
  saveCivilianKycPlan,
} from "../../../services/CivilianKyc.service";

import {
  getOwnFullProfile,
} from "../../../services/profile.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./Dashboard.css";

/* =========================================================
   COMMON HELPERS
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

/* =========================================================
   NUMBER
========================================================= */

const toNumber = (
  value
) => {
  const parsedValue =
    Number(
      value
    );

  return Number.isFinite(
    parsedValue
  )
    ? parsedValue
    : 0;
};

/* =========================================================
   TEXT
========================================================= */

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
   CIVILIAN MEMBERSHIP
========================================================= */

const isCivilianMembership = (
  value
) => {
  const type =
    normalizeMembershipType(
      value
    );

  return [
    "civilian",
    "civilian member",
    "civilian membership",
    "royalty",
    "royalty member",
    "royalty membership",
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

export default function Dashboard() {
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
                    "/dashboard",

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

  const civilianMember =
    isCivilianMembership(
      membershipType
    );

  const district =
    toText(
      member.district ??
      member.entity_district,
      "Not specified"
    );

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

  /*
     IMPORTANT:
     "paid" means payment is completed but admin approval is still pending.

     Public Profile + QR unlock ONLY after admin approval,
     when payment_status becomes "approved".
  */
  const isApproved =
    paymentStatus ===
      "approved";

  /* =======================================================
     MEMBERSHIP LEVEL

     Basic / not approved -> INMBA Member
     ₹300 + approved      -> INMBA Network Member
     ₹1500 + approved     -> INMBA Network Royalty Member
  ======================================================= */

  const selectedMembershipPlan =
    toText(
      member.selected_plan ??
        member.selectedPlan ??
        member.civilian_selected_plan ??
        member.civilianSelectedPlan ??
        member.professional_selected_plan ??
        member.commercial_selected_plan ??
        ""
    );

  const membershipLevel =
    !isApproved
      ? "INMBA Member"
      : selectedMembershipPlan === "1500"
        ? "INMBA Network Royalty Member"
        : selectedMembershipPlan === "300"
          ? "INMBA Network Member"
          : "INMBA Member";

  /* =======================================================
     CIVILIAN PLAN - STEP 1

     Temporary frontend persistence.
     Backend plan persistence will replace localStorage
     in the next implementation step.
  ======================================================= */

  const [
    civilianSelectedPlan,
    setCivilianSelectedPlan,
  ] =
    useState(() => {
      try {
        return toText(
          window.localStorage.getItem(
            "civilianSelectedPlan"
          )
        );
      } catch {
        return "";
      }
    });

  /* =======================================================
     CIVILIAN PLAN ACCESS

     ₹300:
       Payment -> Admin Approval -> QR + Public Profile
       NO Royalty

     ₹1500:
       Payment -> Admin Approval -> QR + Public Profile
       + Royalty Rewards

     IMPORTANT:
       - Backend selected plan is authoritative for access.
       - localStorage is NOT used for Royalty permission.
       - Plan chooser disappears as soon as payment is saved.
  ======================================================= */

  const backendCivilianPlan =
    toText(
      member.selected_plan ??
        member.selectedPlan ??
        member.civilian_selected_plan ??
        member.civilianSelectedPlan ??
        ""
    );

  const civilianPaidAmount =
    toNumber(
      member.amount ??
        member.payment_amount ??
        member.paymentAmount
    );

  /*
     New Civilian accounts may already have
     payment_status = "pending" before payment.

     Therefore payment_status alone must NOT
     decide whether payment was submitted.

     amount > 0 means payment details were saved.
  */
  const hasCivilianPayment =
    civilianMember &&
    civilianPaidAmount > 0;

  /*
     Before payment:
       Show ₹300 / ₹1500 chooser.

     After payment submission:
       Hide chooser even while admin approval is pending.
  */
  const showCivilianPlanSelection =
    civilianMember &&
    !hasCivilianPayment;

  /*
     SECURITY RULE:

     ₹300 + Approved  -> NO Royalty
     ₹1500 + Approved -> Royalty enabled
  */
  const isCivilianRoyaltyPlan =
    civilianMember &&
    isApproved &&
    backendCivilianPlan ===
      "1500";

  const handleCivilianPlanSelect =
    async (
      plan
    ) => {
      const selectedPlan =
        String(
          plan
        ).trim();

      if (
        ![
          "300",
          "1500",
        ].includes(
          selectedPlan
        )
      ) {
        toast.error(
          "Please choose a valid Civilian membership plan."
        );

        return;
      }

      try {
        /*
          IMPORTANT:
          Persist the selected Civilian plan in the backend first.

          Full KYC submit validates civilian_full_kyc.selected_plan,
          so navigation must happen only after this request succeeds.
        */
        await saveCivilianKycPlan(
          selectedPlan
        );

        setCivilianSelectedPlan(
          selectedPlan
        );

        /*
          localStorage is UI convenience only.
          It is NOT used for Royalty permission.
        */
        try {
          window.localStorage.setItem(
            "civilianSelectedPlan",
            selectedPlan
          );
        } catch {
          // localStorage failure must not block the flow.
        }

        toast.success(
          `₹${selectedPlan} Civilian plan selected.`
        );

        navigate(
          `/civilian-kyc?plan=${encodeURIComponent(
            selectedPlan
          )}`
        );
      } catch (
        requestError
      ) {
        console.error(
          "Civilian plan save failed:",
          requestError
        );

        toast.error(
          requestError?.response?.data?.message ||
            requestError?.apiMessage ||
            requestError?.message ||
            "Unable to save Civilian membership plan."
        );
      }
    };

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
    String(
      process.env.REACT_APP_FRONTEND_BASE_URL ||
      window.location.origin
    )
      .trim()
      .replace(
        /\/+$/,
        ""
      );

  /* =======================================================
     PUBLIC PROFILE

     IMPORTANT:

     This link intentionally opens PUBLIC profile.

     Even owner clicks this:
     /user-profile/:loginId

     Public API whitelist applies.
  ======================================================= */

  /*
     OWNER MANAGE PAGE
     -----------------
     Used only by the logged-in member to manage/edit
     the Civilian public profile after admin approval.
  */
  const managePublicProfilePath =
    loginId
      ? "/civilian-public-profile"
      : "";

  /*
     REAL PUBLIC PAGE
     ----------------
     QR must open the public visitor URL with Login ID.
  */
  const publicProfilePath =
    loginId
      ? `/user-profile/${encodeURIComponent(
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
      ownerProfile
        ?.referral_id ??
      dashboardData
        ?.referralId ??
      member.referral_id
    );

  const referralLink =
    referralId
      ? `${frontendBaseUrl}/membership?ref=${encodeURIComponent(
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
     JOINED VIA ORGANIZATION / INTRODUCER

     Organization referral:
       Show Organization + Organization ID only.

     Individual introducer:
       Show Introducer Name + Introducer ID only.

     Reserved organization referral ID 7777777 is treated
     as the INMBA organization referral.
  ======================================================= */

  const introducerId =
    toText(
      member?.referred_by ??
        member?.referrer_id ??
        member?.introducer_id ??
        dashboardData?.sponsor?.referral_id
    );

  const organizationId =
    toText(
      member?.organization_id ??
        member?.org_id ??
        dashboardData?.sponsor?.organization_id ??
        dashboardData?.sponsor?.org_id
    );

  const organizationName =
    toText(
      member?.organization_name ??
        member?.organization ??
        dashboardData?.sponsor?.organization_name ??
        dashboardData?.sponsor?.organization
    );

  const joinedViaOrganization =
    Boolean(
      organizationId ||
        organizationName ||
        introducerId === "7777777"
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
      <main className="member-dashboard-page">
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
      <main className="member-dashboard-page">
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
    <main className="member-dashboard-page">
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

        {!isApproved &&
          !civilianMember && (
          <section className="member-dashboard-alert">
            <div className="member-dashboard-alert-icon">
              <i
                className="fas fa-clock"
                aria-hidden="true"
              ></i>
            </div>

            <div>
              <h2>
                Verification Pending
              </h2>

              <p>
                Your complete membership benefits and QR access
                will be available after payment verification.
              </p>
            </div>

            <Link
              to={
                professionalMember
                  ? "/professional-payment"
                  : "/payment"
              }
              className="member-dashboard-alert-link"
            >
              View Payment
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
            CIVILIAN MEMBERSHIP PLAN - STEP 1

            BASIC KYC -> LOGIN ID -> PLAN -> FULL KYC

            Both ₹300 and ₹1500 go to /civilian-kyc.
            Payment comes only after Full KYC in the next step.
        ================================================= */}

        {showCivilianPlanSelection && (
          <section className="member-dashboard-card member-dashboard-civilian-plan-card">
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
                    Civilian Membership
                  </p>

                  <h2>
                    Choose Your Membership Plan
                  </h2>
                </div>
              </div>

              {civilianSelectedPlan && (
                <span className="member-dashboard-status member-dashboard-plan-selected-status">
                  ₹{civilianSelectedPlan} Selected
                </span>
              )}
            </div>

            <p className="member-dashboard-plan-description">
              Choose ₹300 or ₹1500. Both plans require Civilian
              Full KYC before payment and activation.
            </p>

            <div className="member-dashboard-plan-grid">
              <article
                className={`member-dashboard-plan-option ${
                  civilianSelectedPlan === "300"
                    ? "selected"
                    : ""
                }`}
              >
                <div className="member-dashboard-plan-top">
                  <div>
                    <span>
                      Civilian Profile Plan
                    </span>

                    <small>
                      Profile membership
                    </small>
                  </div>

                  <strong>
                    ₹300
                  </strong>
                </div>

                <ul>
                  <li>
                    <i className="fas fa-check"></i>
                    Full Civilian KYC
                  </li>

                  <li>
                    <i className="fas fa-check"></i>
                    Personal QR Code
                  </li>

                  <li>
                    <i className="fas fa-check"></i>
                    Public Profile
                  </li>

                  <li>
                    <i className="fas fa-check"></i>
                    Civilian Directory Profile
                  </li>
                </ul>

                <button
                  type="button"
                  className="member-dashboard-primary-button member-dashboard-plan-button"
                  onClick={() =>
                    handleCivilianPlanSelect(
                      "300"
                    )
                  }
                >
                  {civilianSelectedPlan === "300"
                    ? "Continue ₹300 Plan"
                    : "Choose ₹300"}

                  <i className="fas fa-arrow-right"></i>
                </button>
              </article>

              <article
                className={`member-dashboard-plan-option member-dashboard-plan-option-premium ${
                  civilianSelectedPlan === "1500"
                    ? "selected"
                    : ""
                }`}
              >
                <div className="member-dashboard-plan-badge">
                  <i className="fas fa-crown"></i>
                  Royalty Plan
                </div>

                <div className="member-dashboard-plan-top">
                  <div>
                    <span>
                      Civilian Royalty Plan
                    </span>

                    <small>
                      Profile + royalty benefits
                    </small>
                  </div>

                  <strong>
                    ₹1500
                  </strong>
                </div>

                <ul>
                  <li>
                    <i className="fas fa-check"></i>
                    Full Civilian KYC
                  </li>

                  <li>
                    <i className="fas fa-check"></i>
                    Personal QR Code
                  </li>

                  <li>
                    <i className="fas fa-check"></i>
                    Public Profile
                  </li>

                  <li>
                    <i className="fas fa-check"></i>
                    Royalty Rewards
                  </li>

                  <li>
                    <i className="fas fa-check"></i>
                    Royalty Membership Benefits
                  </li>
                </ul>

                <button
                  type="button"
                  className="member-dashboard-primary-button member-dashboard-plan-button"
                  onClick={() =>
                    handleCivilianPlanSelect(
                      "1500"
                    )
                  }
                >
                  {civilianSelectedPlan === "1500"
                    ? "Continue ₹1500 Plan"
                    : "Choose ₹1500"}

                  <i className="fas fa-crown"></i>
                </button>
              </article>
            </div>

            <div className="member-dashboard-plan-note">
              <i className="fas fa-circle-info"></i>

              <div>
                <strong>
                  Full KYC is mandatory for both plans.
                </strong>

                <span>
                  Payment will be connected only after Sections A-H are completed.
                  You can also leave this page and update your plan later.
                </span>
              </div>
            </div>
          </section>
        )}

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
                  {selectedMembershipPlan
                    ? `₹${selectedMembershipPlan}`
                    : "Basic"}
                </strong>
              </div>

              <div className="member-dashboard-info-row">
                <span>
                  District
                </span>

                <strong>
                  {district}
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
              {/* ===========================================
                  PRIVATE OWNER PROFILE

                  Professional member:
                  Full A-J details available here.
              =========================================== */}

              <Link
                to="/profile"
                className="member-dashboard-primary-button"
              >
                <i
                  className="fas fa-user-pen"
                  aria-hidden="true"
                ></i>

                View Full Profile
              </Link>

              {/* ===========================================
                  PUBLIC PROFILE

                  This intentionally opens sanitized
                  QR/public profile.
              =========================================== */}

              {isApproved &&
                loginId &&
                managePublicProfilePath && (
                  <Link
                    to={
                      managePublicProfilePath
                    }
                    className="member-dashboard-secondary-button"
                  >
                    <i
                      className="fas fa-address-card"
                      aria-hidden="true"
                    ></i>

                    Manage Public Profile
                  </Link>
                )}

              {isCivilianRoyaltyPlan && (
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
                to="/professional-kyc"
                className="member-dashboard-primary-button"
              >
                <i
                  className="fas fa-file-signature"
                  aria-hidden="true"
                ></i>

                Professional KYC
              </Link>

              <Link
                to="/profile"
                className="member-dashboard-secondary-button"
              >
                <i
                  className="fas fa-lock"
                  aria-hidden="true"
                ></i>

                Full Private Details
              </Link>

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
            </div>
          </section>
        )}

        {/* =================================================
            CIVILIAN ROYALTY PLAN

            Only approved ₹1500 Civilian members can see this.
            ₹300 approved Civilian members will NOT see it.
        ================================================= */}

        {isCivilianRoyaltyPlan && (
          <section className="member-dashboard-card">
            <div className="member-dashboard-card-header">
              <div>
                <span className="member-dashboard-card-icon">
                  <i
                    className="fas fa-crown"
                    aria-hidden="true"
                  ></i>
                </span>

                <div>
                  <p>
                    Civilian Royalty Membership
                  </p>

                  <h2>
                    Royalty Rewards
                  </h2>
                </div>
              </div>

              <span className="member-dashboard-status member-dashboard-status-approved">
                Active
              </span>
            </div>

            <div className="member-dashboard-info-list">
              <div className="member-dashboard-info-row">
                <span>
                  Membership Plan
                </span>

                <strong>
                  ₹1500 Royalty Plan
                </strong>
              </div>

              <div className="member-dashboard-info-row">
                <span>
                  Royalty Slab
                </span>

                <strong>
                  {toText(
                    member.royalty_slab_category ??
                      member.royaltySlabCategory,
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
                    member.preferred_payout_cycle ??
                      member.preferredPayoutCycle,
                    "Not selected"
                  )}
                </strong>
              </div>
            </div>

            <div className="member-dashboard-action-grid">
              <Link
                to="/royalty-rewards"
                className="member-dashboard-primary-button"
              >
                <i
                  className="fas fa-crown"
                  aria-hidden="true"
                ></i>

                Open Royalty & Rewards
              </Link>
            </div>
          </section>
        )}

        {/* =================================================
            SPONSOR

            Authenticated owner dashboard only.
        ================================================= */}

        {(toText(
          member?.referred_by ??
            member?.referrer_id ??
            member?.introducer_id ??
            dashboardData?.sponsor?.referral_id
        ) ||
          toText(
            member?.organization_id ??
              member?.org_id ??
              dashboardData?.sponsor?.organization_id ??
              dashboardData?.sponsor?.org_id
          ) ||
          Object.keys(
            dashboardData?.sponsor ||
              {}
          ).length > 0) && (
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
                    Your Introducer
                  </p>

                  <h2>
                    Introducer Details
                  </h2>
                </div>
              </div>
            </div>

            <div className="member-dashboard-sponsor-grid">
              {joinedViaOrganization ? (
                <>
                  <div>
                    <span>
                      Organization
                    </span>

                    <strong>
                      {organizationName ||
                        "INMBA"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Organization ID
                    </span>

                    <strong>
                      {organizationId ||
                        (introducerId === "7777777"
                          ? "7777777"
                          : "Not available")}
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
                      {toText(
                        member?.introducer_name ??
                          member?.referrer_name ??
                          dashboardData?.sponsor?.full_name ??
                          `${toText(
                            dashboardData?.sponsor?.first_name
                          )} ${toText(
                            dashboardData?.sponsor?.last_name
                          )}`.trim(),
                        "Not available"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Introducer ID
                    </span>

                    <strong>
                      {introducerId ||
                        "Not available"}
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

          {referralId ? (
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
                  Complete the required membership process to access
                  your referral information.
                </p>
              </div>

              {civilianMember ? (
                <button
                  type="button"
                  className="member-dashboard-primary-button"
                  onClick={() =>
                    navigate(
                      "/civilian-kyc",
                      {
                        state: {
                          selectedPlan:
                            civilianSelectedPlan ||
                            "",
                        },
                      }
                    )
                  }
                >
                  Complete Full KYC
                </button>
              ) : (
                <Link
                  to="/policy"
                  className="member-dashboard-primary-button"
                >
                  View Policy
                </Link>
              )}
            </div>
          )}
        </section>

        {/* =================================================
            ACKNOWLEDGEMENT
        ================================================= */}

        {professionalMember &&
          dashboardData
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

            QR points ONLY to:

            /user-profile/:loginId

            That page uses public whitelist.
        ================================================= */}

        {isApproved && (
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
                  INMBA profile. Private KYC details are not included
                  in the QR profile.
                </p>

                <div className="member-dashboard-qr-actions">
                  {/* {publicProfilePath && (
                    <Link
                      to={
                        publicProfilePath
                      }
                      className="member-dashboard-primary-button"
                    >
                      <i
                        className="fas fa-address-card"
                        aria-hidden="true"
                      ></i>

                      Public Profile
                    </Link>
                  )} */}

                  <Link
                    to="/qr-code"
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
                    fgColor="#0f4d0f"
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