import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  getAdminUserById,
  requestAdminUserOtp,
  verifyAdminUserOtp,
  verifyAdminMember,
} from "../../../services/admin.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import AdminMemberVerification from "../../../components/admin/AdminMemberVerification";

import AdminMemberDangerZone from "../../../components/admin/AdminMemberDangerZone";

import "./AdminMemberDetails.css";
import { toText } from "../../../utils/commonHelpers";

/* =========================================================
   HELPERS
========================================================= */

const displayValue = (
  value
) => {
  if (
    Array.isArray(
      value
    )
  ) {
    const result =
      value
        .map(
          (item) =>
            toText(
              item
            )
        )
        .filter(
          Boolean
        )
        .join(", ");

    return (
      result ||
      "—"
    );
  }

  const text =
    toText(
      value
    );

  return (
    text ||
    "—"
  );
};

/* =========================================================
   DATE FORMAT
========================================================= */

const formatDate = (
  value
) => {
  if (!value) {
    return "—";
  }

  const normalized =
    typeof value ===
    "string"
      ? value.replace(
          " ",
          "T"
        )
      : value;

  const date =
    new Date(
      normalized
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return displayValue(
      value
    );
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

/* =========================================================
   AMOUNT FORMAT
========================================================= */

const formatAmount = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const amount =
    Number(
      value
    );

  if (
    !Number.isFinite(
      amount
    )
  ) {
    return displayValue(
      value
    );
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }
  ).format(
    amount
  );
};

/* =========================================================
   BACKEND ASSET URL
========================================================= */

const BACKEND_ORIGIN =
  String(
    process.env
      .REACT_APP_BACKEND_URL ||
      ""
  )
    .replace(
      /\/api\/?$/,
      ""
    )
    .replace(
      /\/+$/,
      ""
    );

/* =========================================================
   BUILD ASSET URL
========================================================= */

const buildAssetUrl = (
  value,
  {
    profile = false,
  } = {}
) => {
  const rawValue =
    toText(
      value
    );

  if (!rawValue) {
    return "";
  }

  /* Already complete URL */

  if (
    /^(https?:|data:|blob:)/i.test(
      rawValue
    )
  ) {
    return rawValue;
  }

  /* Absolute path */

  if (
    rawValue.startsWith(
      "/"
    )
  ) {
    return `${BACKEND_ORIGIN}${rawValue}`;
  }

  /* static/... */

  if (
    rawValue.startsWith(
      "static/"
    )
  ) {
    return `${BACKEND_ORIGIN}/${rawValue}`;
  }

  /* uploads/... */

  if (
    rawValue.startsWith(
      "uploads/"
    )
  ) {
    return `${BACKEND_ORIGIN}/${rawValue}`;
  }

  /* Other path already contains folder */

  if (
    rawValue.includes(
      "/"
    )
  ) {
    return `${BACKEND_ORIGIN}/${rawValue}`;
  }

  /* Only filename */

  const path =
    profile
      ? `/static/uploads/profile/${rawValue}`
      : `/static/uploads/${rawValue}`;

  return `${BACKEND_ORIGIN}${path}`;
};

/* =========================================================
   STATUS DETAILS
========================================================= */

const getStatusDetails = (
  value,
  restricted = false
) => {
  if (
    restricted
  ) {
    return {
      label:
        "Restricted",

      icon:
        "fas fa-lock",

      className:
        "inmba-admin-detail-status-restricted",
    };
  }

  const status =
    toText(
      value
    ).toLowerCase();

  if (
    status ===
    "approved"
  ) {
    return {
      label:
        "Approved",

      icon:
        "fas fa-circle-check",

      className:
        "inmba-admin-detail-status-approved",
    };
  }

  if (
    status ===
    "rejected"
  ) {
    return {
      label:
        "Rejected",

      icon:
        "fas fa-circle-xmark",

      className:
        "inmba-admin-detail-status-rejected",
    };
  }

  if (
    status ===
    "pending"
  ) {
    return {
      label:
        "Pending",

      icon:
        "fas fa-clock",

      className:
        "inmba-admin-detail-status-pending",
    };
  }

  return {
    label:
      status
        ? `${status
            .charAt(0)
            .toUpperCase()}${status.slice(
            1
          )}`
        : "Pending",

    icon:
      "fas fa-clock",

    className:
      "inmba-admin-detail-status-pending",
  };
};

/* =========================================================
   ADMIN MEMBER DETAILS
========================================================= */

export default function AdminMemberDetails() {
  const {
    id,
  } =
    useParams();

  const navigate =
    useNavigate();

  const outletContext =
    useOutletContext();

  const admin =
    outletContext?.admin ||
    {};

  const adminRole =
    toText(
      admin.role
    ).toLowerCase();

  /*
    Admin member details are server-authorized.
    Subadmin access is still protected by the existing OTP gate.
    Once access is granted, payment / KYC information is rendered.
  */

  const paymentRestricted = false;

  /* =======================================================
     MEMBER STATE
  ======================================================= */

  const [
    member,
    setMember,
  ] =
    useState(null);

  const [
    civilianKyc,
    setCivilianKyc,
  ] =
    useState(null);

  const [
    professionalKyc,
    setProfessionalKyc,
  ] =
    useState(null);

  const [
    commercialKyc,
    setCommercialKyc,
  ] =
    useState(null);

  const [
    payment,
    setPayment,
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

  /* =======================================================
     SUBADMIN MEMBER OTP
  ======================================================= */

  const [
    otpRequired,
    setOtpRequired,
  ] =
    useState(false);

  const [
    otpRequested,
    setOtpRequested,
  ] =
    useState(false);

  const [
    otp,
    setOtp,
  ] =
    useState("");

  const [
    requestingOtp,
    setRequestingOtp,
  ] =
    useState(false);

  const [
    verifyingOtp,
    setVerifyingOtp,
  ] =
    useState(false);

  const [
    secondsLeft,
    setSecondsLeft,
  ] =
    useState(0);

  const [
    approving,
    setApproving,
  ] =
    useState(false);

  const handleApproveMember = async () => {
    if (!window.confirm("Are you sure you want to approve this member?")) {
      return;
    }
    setApproving(true);
    try {
      await verifyAdminMember(id, { status: "approved" });
      toast.success("Member approved successfully!");
      await loadMember();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to approve member."));
    } finally {
      setApproving(false);
    }
  };

  /* =======================================================
     LOAD MEMBER

     GET /api/admin/user/:id
  ======================================================= */

  const loadMember =
    useCallback(
      async ({
        signal,
      } = {}) => {
        if (!id) {
          setError(
            "Member ID is required."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          setLoading(
            true
          );

          setError("");

          const result =
            await getAdminUserById(
              id,
              {
                signal,
              }
            );

          setMember(
            result.member
          );

          setCivilianKyc(
            result.civilianKyc ??
              result.civilian_kyc ??
              null
          );

          setProfessionalKyc(
            result.professionalKyc ??
              result.professional_kyc ??
              null
          );

          setCommercialKyc(
            result.commercialKyc ??
              result.commercial_kyc ??
              null
          );

          setPayment(
            result.payment ??
              null
          );

          setOtpRequired(
            false
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

          if (
            cancelled
          ) {
            return;
          }

          /* ===============================================
             SUBADMIN OTP REQUIRED
          =============================================== */

          if (
            requestError
              ?.otpRequired
          ) {
            setMember(
              null
            );

            setCivilianKyc(null);
            setProfessionalKyc(null);
            setCommercialKyc(null);
            setPayment(null);

            setOtpRequired(
              true
            );

            setError("");

            return;
          }

          /* ===============================================
             SESSION EXPIRED
          =============================================== */

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
            navigate(
              "/admin_login",
              {
                replace: true,

                state: {
                  from:
                    `/admin/member/${id}`,

                  error:
                    "Admin session expired. Please login again.",
                },
              }
            );

            return;
          }

          setMember(
            null
          );

          setCivilianKyc(null);
          setProfessionalKyc(null);
          setCommercialKyc(null);
          setPayment(null);

          setError(
            getApiErrorMessage(
              requestError,
              requestError
                ?.apiMessage ||
                "Unable to load member details."
            )
          );
        } finally {
          if (
            !signal?.aborted
          ) {
            setLoading(
              false
            );
          }
        }
      },
      [
        id,
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

      loadMember({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadMember,
    ]
  );

  /* =======================================================
     OTP TIMER
  ======================================================= */

  useEffect(
    () => {
      if (
        !otpRequested ||
        secondsLeft <= 0
      ) {
        return undefined;
      }

      const timer =
        window.setInterval(
          () => {
            setSecondsLeft(
              (
                previous
              ) =>
                Math.max(
                  previous -
                    1,
                  0
                )
            );
          },
          1000
        );

      return () => {
        window.clearInterval(
          timer
        );
      };
    },
    [
      otpRequested,
      secondsLeft,
    ]
  );

  /* =======================================================
     OTP TIMER TEXT
  ======================================================= */

  const otpTimerText =
    useMemo(
      () => {
        const minutes =
          Math.floor(
            secondsLeft /
              60
          );

        const seconds =
          secondsLeft %
          60;

        return `${String(
          minutes
        ).padStart(
          2,
          "0"
        )}:${String(
          seconds
        ).padStart(
          2,
          "0"
        )}`;
      },
      [
        secondsLeft,
      ]
    );

  /* =======================================================
     REQUEST MEMBER OTP

     POST /api/admin/request-user-otp/:id
  ======================================================= */

  const handleRequestOtp =
    async () => {
      if (
        requestingOtp
      ) {
        return;
      }

      try {
        setRequestingOtp(
          true
        );

        setError("");

        const result =
          await requestAdminUserOtp(
            id
          );

        setOtpRequested(
          true
        );

        setSecondsLeft(
          300
        );

        setOtp("");

        toast.success(
          result.message ||
            "OTP sent to your registered admin email."
        );
      } catch (
        requestError
      ) {
        const message =
          getApiErrorMessage(
            requestError,
            requestError
              ?.apiMessage ||
              "Unable to request OTP."
          );

        setError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setRequestingOtp(
          false
        );
      }
    };

  /* =======================================================
     OTP INPUT
  ======================================================= */

  const handleOtpChange = (
    event
  ) => {
    const value =
      event.target.value
        .replace(
          /\D/g,
          ""
        )
        .slice(
          0,
          6
        );

    setOtp(
      value
    );

    setError("");
  };

  /* =======================================================
     VERIFY MEMBER OTP

     POST /api/admin/verify-user-otp

     {
       user_id,
       otp
     }
  ======================================================= */

  const handleVerifyOtp =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        verifyingOtp
      ) {
        return;
      }

      if (
        otp.length !==
        6
      ) {
        setError(
          "Enter the complete 6-digit OTP."
        );

        return;
      }

      if (
        secondsLeft <= 0
      ) {
        setError(
          "OTP expired. Request a new OTP."
        );

        return;
      }

      try {
        setVerifyingOtp(
          true
        );

        setError("");

        const result =
          await verifyAdminUserOtp({
            userId:
              id,

            otp,
          });

        toast.success(
          result.message ||
            "OTP verified successfully."
        );

        setOtpRequired(
          false
        );

        setOtpRequested(
          false
        );

        setOtp("");

        setSecondsLeft(
          0
        );

        await loadMember();
      } catch (
        requestError
      ) {
        /*
          Invalid member OTP may return 401.
          இங்கே admin login page-க்கு
          redirect செய்யக்கூடாது.
        */

        const message =
          getApiErrorMessage(
            requestError,
            requestError
              ?.apiMessage ||
              "Invalid or expired OTP."
          );

        setError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setVerifyingOtp(
          false
        );
      }
    };

  /* =======================================================
     MEMBER NAME
  ======================================================= */

  const memberName =
    useMemo(
      () => {
        if (
          !member
        ) {
          return "";
        }

        const fullName =
          [
            member.first_name,
            member.last_name,
          ]
            .filter(
              Boolean
            )
            .join(" ")
            .trim();

        return (
          toText(
            civilianKyc?.full_legal_name
          ) ||
          fullName ||
          toText(
            member.full_name
          ) ||
          "INMBA Member"
        );
      },
      [
        member,
        civilianKyc,
      ]
    );

  /* =======================================================
     STATUS
  ======================================================= */

  const status =
    getStatusDetails(
      member?.payment_status,
      paymentRestricted
    );

  /* =======================================================
     REFERRAL TYPE
  ======================================================= */

  const referredBy =
    toText(
      member?.referred_by
    );

  const organizationJoin =
    !referredBy ||
    referredBy ===
      "7777777";

  const paymentDetails =
    payment &&
    typeof payment === "object"
      ? payment
      : member || {};

  const membershipTypeText =
    toText(
      member?.membership_type
    ).toLowerCase();

  const isProfessionalMember =
    membershipTypeText.includes(
      "professional"
    );

  const isCommercialMember =
    membershipTypeText.includes(
      "commercial"
    );

  const isCivilianMember =
    !isProfessionalMember &&
    !isCommercialMember;

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <section className="inmba-admin-member-details-state">
        <span className="inmba-admin-member-details-spinner"></span>

        <h2>
          Loading Member
        </h2>

        <p>
          Fetching full member information...
        </p>
      </section>
    );
  }

  /* =======================================================
     SUBADMIN OTP GATE
  ======================================================= */

  if (
    otpRequired
  ) {
    return (
      <section className="inmba-admin-member-otp-page">
        <Link
          to="/admin"
          className="inmba-admin-member-back"
        >
          <i
            className="fas fa-arrow-left"
            aria-hidden="true"
          ></i>

          Back to Members
        </Link>

        <div className="inmba-admin-member-otp-card">
          <span className="inmba-admin-member-otp-icon">
            <i
              className="fas fa-shield-halved"
              aria-hidden="true"
            ></i>
          </span>

          <p className="inmba-admin-member-otp-eyebrow">
            Sub Admin Security
          </p>

          <h2>
            OTP Verification Required
          </h2>

          <p>
            Member #{id} contains protected administrative
            information. Verify the OTP sent to your registered
            admin email before viewing this member.
          </p>

          {error && (
            <div
              className="inmba-admin-member-otp-error"
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

          {!otpRequested ? (
            <button
              type="button"
              className="inmba-admin-member-request-otp"
              onClick={
                handleRequestOtp
              }
              disabled={
                requestingOtp
              }
            >
              {requestingOtp ? (
                <>
                  <i
                    className="fas fa-spinner fa-spin"
                    aria-hidden="true"
                  ></i>

                  Sending OTP...
                </>
              ) : (
                <>
                  <i
                    className="fas fa-envelope"
                    aria-hidden="true"
                  ></i>

                  Send Access OTP
                </>
              )}
            </button>
          ) : (
            <form
              className="inmba-admin-member-otp-form"
              onSubmit={
                handleVerifyOtp
              }
            >
              <label htmlFor="admin-member-otp">
                Enter 6-digit OTP
              </label>

              <input
                id="admin-member-otp"
                type="text"
                value={
                  otp
                }
                onChange={
                  handleOtpChange
                }
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                autoComplete="one-time-code"
                autoFocus
                disabled={
                  verifyingOtp ||
                  secondsLeft <=
                    0
                }
              />

              <div className="inmba-admin-member-otp-meta">
                <span>
                  {otp.length}/6
                </span>

                <strong
                  className={
                    secondsLeft <=
                    60
                      ? "inmba-admin-member-otp-expiring"
                      : ""
                  }
                >
                  <i
                    className="far fa-clock"
                    aria-hidden="true"
                  ></i>

                  {otpTimerText}
                </strong>
              </div>

              <button
                type="submit"
                disabled={
                  verifyingOtp ||
                  otp.length !==
                    6 ||
                  secondsLeft <=
                    0
                }
              >
                {verifyingOtp ? (
                  <>
                    <i
                      className="fas fa-spinner fa-spin"
                      aria-hidden="true"
                    ></i>

                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & View Member

                    <i
                      className="fas fa-arrow-right"
                      aria-hidden="true"
                    ></i>
                  </>
                )}
              </button>

              <button
                type="button"
                className="inmba-admin-member-resend-otp"
                onClick={
                  handleRequestOtp
                }
                disabled={
                  requestingOtp ||
                  verifyingOtp
                }
              >
                <i
                  className={
                    requestingOtp
                      ? "fas fa-spinner fa-spin"
                      : "fas fa-rotate-right"
                  }
                  aria-hidden="true"
                ></i>

                Request New OTP
              </button>
            </form>
          )}

          <small>
            OTP is valid for 5 minutes and access is stored only
            for this member in the current admin session.
          </small>
        </div>
      </section>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error ||
    !member
  ) {
    return (
      <section className="inmba-admin-member-details-state">
        <span className="inmba-admin-member-details-error-icon">
          <i
            className="fas fa-triangle-exclamation"
            aria-hidden="true"
          ></i>
        </span>

        <h2>
          Member Details Unavailable
        </h2>

        <p>
          {error ||
            "Member not found."}
        </p>

        <div>
          <button
            type="button"
            onClick={() =>
              loadMember()
            }
          >
            Try Again
          </button>

          <Link to="/admin">
            Back to Members
          </Link>
        </div>
      </section>
    );
  }

  /* =======================================================
     MEMBER DETAILS PAGE
  ======================================================= */

  return (
    <section className="inmba-admin-member-details-page">
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <header className="inmba-admin-member-details-header">
        <div>
          <Link
            to="/admin"
            className="inmba-admin-member-back"
          >
            <i
              className="fas fa-arrow-left"
              aria-hidden="true"
            ></i>

            Back to Members
          </Link>

          <p>
            Member Management
          </p>

          <h2>
            Member Details
          </h2>
        </div>

        <div className="inmba-admin-member-header-actions">
          {/* APPROVE */}
          {member?.payment_status !== "approved" && (
            <button
              type="button"
              onClick={handleApproveMember}
              disabled={approving}
              className="inmba-admin-member-approve-button"
              style={{
                backgroundColor: "#16a34a",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <i className="fas fa-check-circle" aria-hidden="true" />
              {approving ? "Approving..." : "Approve Member"}
            </button>
          )}

          {/* EDIT */}

          <Link
            to={`/admin/member/${id}/edit`}
            className="inmba-admin-member-edit-button"
          >
            <i
              className="fas fa-pen-to-square"
              aria-hidden="true"
            ></i>

            Edit Member
          </Link>

          {/* REFRESH */}

          <button
            type="button"
            onClick={() =>
              loadMember()
            }
            className="inmba-admin-member-refresh"
          >
            <i
              className="fas fa-rotate"
              aria-hidden="true"
            ></i>

            Refresh
          </button>
        </div>
      </header>

      {/* =================================================
          MEMBER SUMMARY
      ================================================= */}

      <section className="inmba-admin-member-summary">
        <div className="inmba-admin-member-summary-profile">
          {member.profile_pic ? (
            <img
              src={buildAssetUrl(
                member.profile_pic,
                {
                  profile: true,
                }
              )}
              alt={
                memberName
              }
            />
          ) : (
            <span>
              {toText(
                member.first_name,
                "M"
              )
                .charAt(0)
                .toUpperCase()}
            </span>
          )}

          <div>
            <p>
              Member #{member.id}
            </p>

            <h1>
              {memberName}
            </h1>

            <div className="inmba-admin-member-summary-tags">
              <span>
                <i
                  className="fas fa-id-card"
                  aria-hidden="true"
                ></i>

                {displayValue(
                  member.login_id
                )}
              </span>

              <span>
                <i
                  className="fas fa-user-tie"
                  aria-hidden="true"
                ></i>

                {displayValue(
                  member.membership_type
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="inmba-admin-member-summary-right">
          <span
            className={`inmba-admin-detail-status ${status.className}`}
          >
            <i
              className={
                status.icon
              }
              aria-hidden="true"
            ></i>

            {status.label}
          </span>

          <div>
            <small>
              Network
            </small>

            <strong>
              {Number(
                member.direct_network ||
                  0
              )}
              :
              {Number(
                member.indirect_network ||
                  0
              )}
            </strong>
          </div>
        </div>
      </section>

      {/* =================================================
          ADMIN ROLE NOTICE
      ================================================= */}

      {false && paymentRestricted && (
        <div className="inmba-admin-member-role-notice">
          <i
            className="fas fa-lock"
            aria-hidden="true"
          ></i>

          <div>
            <strong>
              Payment Information Restricted
            </strong>

            <p>
              Your current Admin role cannot view payment,
              transaction or bank information. These values are
              restricted by the backend.
            </p>
          </div>
        </div>
      )}

      {/* =================================================
          DETAILS GRID
      ================================================= */}

      <div className="inmba-admin-member-detail-grid">
        {isCivilianMember ? (
          <>
            {/* =================================================
                BASIC MEMBERSHIP DETAILS
            ================================================= */}

            <DetailCard
              icon="fas fa-id-badge"
              title="Basic Membership Details"
            >
              <InfoRow
                label="Full Name"
                value={
                  civilianKyc?.full_legal_name ||
                  memberName
                }
              />

              <InfoRow
                label="Login ID"
                value={
                  member.login_id
                }
              />

              <InfoRow
                label="Membership Type"
                value={
                  member.membership_type
                }
              />

              <InfoRow
                label="Registration Mobile"
                value={
                  member.phone
                }
              />

              <InfoRow
                label="Registration Email"
                value={
                  member.email
                }
              />

              <InfoRow
                label="Referral ID"
                value={
                  member.referral_id
                }
              />

              <InfoRow
                label={
                  organizationJoin
                    ? "Organization / Referral"
                    : "Referred By"
                }
                value={
                  organizationJoin
                    ? toText(
                        member.referred_by,
                        "7777777"
                      )
                    : member.referred_by
                }
              />

              <InfoRow
                label="Selected Plan"
                value={
                  civilianKyc?.selected_plan
                    ? `₹${civilianKyc.selected_plan}`
                    : "—"
                }
              />

              <InfoRow
                label="KYC Status"
                value={
                  civilianKyc?.status
                }
              />
            </DetailCard>

            {/* =================================================
                SECTION A
            ================================================= */}

            <DetailCard
              icon="fas fa-address-card"
              title="A. Identity & KYC Details"
            >
              <InfoRow
                label="Full Legal Name"
                value={
                  civilianKyc?.full_legal_name ||
                  memberName
                }
              />

              <InfoRow
                label="Father / Spouse Name"
                value={
                  civilianKyc?.father_spouse_name ||
                  member.father_name
                }
              />

              <InfoRow
                label="Date of Birth"
                value={
                  formatDate(
                    civilianKyc?.dob ||
                    member.dob
                  )
                }
              />

              <InfoRow
                label="Gender"
                value={
                  civilianKyc?.gender ||
                  member.gender
                }
              />

              <InfoRow
                label="Marital Status"
                value={
                  civilianKyc?.marital_status ||
                  member.marital_status
                }
              />

              <InfoRow
                label="Nationality"
                value={
                  civilianKyc?.nationality ||
                  member.nationality
                }
              />

              <InfoRow
                label="Aadhaar Number"
                value={
                  civilianKyc?.aadhaar_number ||
                  member.aadhar ||
                  member.entity_aadhar_number
                }
              />

              <InfoRow
                label="PAN Number"
                value={
                  civilianKyc?.pan_number ||
                  member.pan_number
                }
              />

              <InfoRow
                label="Passport Number"
                value={
                  civilianKyc?.passport_number ||
                  member.passport_number
                }
              />

              <InfoRow
                label="Voter ID"
                value={
                  civilianKyc?.voter_id ||
                  member.voter_id
                }
              />

              <InfoRow
                label="Driving License"
                value={
                  civilianKyc?.driving_license ||
                  member.driving_license
                }
              />

              <InfoRow
                label="Blood Group"
                value={
                  civilianKyc?.blood_group ||
                  member.blood_group
                }
              />
            </DetailCard>

            {/* =================================================
                SECTION B
            ================================================= */}

            <DetailCard
              icon="fas fa-phone"
              title="B. Contact & Address Details"
            >
              <InfoRow
                label="Primary Mobile"
                value={
                  civilianKyc?.primary_mobile ||
                  member.phone
                }
              />

              <InfoRow
                label="Secondary Mobile"
                value={
                  civilianKyc?.secondary_mobile ||
                  member.contact_number
                }
              />

              <InfoRow
                label="Primary Email"
                value={
                  civilianKyc?.primary_email ||
                  member.email
                }
              />

              <InfoRow
                label="WhatsApp Number"
                value={
                  civilianKyc?.whatsapp_number ||
                  member.whatsapp_number
                }
              />

              <InfoRow
                label="Current Address"
                value={
                  civilianKyc?.current_address ||
                  member.entity_city ||
                  member.city
                }
              />

              <InfoRow
                label="Permanent Address"
                value={
                  civilianKyc?.permanent_address ||
                  member.permanent_address
                }
              />

              <InfoRow
                label="District"
                value={
                  civilianKyc?.district ||
                  member.entity_district ||
                  member.district
                }
              />

              <InfoRow
                label="State"
                value={
                  civilianKyc?.state ||
                  member.entity_state ||
                  member.state
                }
              />

              <InfoRow
                label="Pincode"
                value={
                  civilianKyc?.pincode ||
                  member.entity_pincode ||
                  member.pincode
                }
              />

              <InfoRow
                label="Google Map Location"
                value={
                  civilianKyc?.google_map_location
                }
              />
            </DetailCard>

            {/* =================================================
                SECTION C
            ================================================= */}

            <DetailCard
              icon="fas fa-building-columns"
              title="C. Bank & Financial Details"
            >
              {paymentRestricted ? (
                <RestrictedContent />
              ) : (
                <>
                  <InfoRow
                    label="Account Holder Name"
                    value={
                      civilianKyc?.account_holder_name ||
                      paymentDetails.account_holder ||
                      member.account_holder
                    }
                  />

                  <InfoRow
                    label="Bank Name"
                    value={
                      civilianKyc?.bank_name ||
                      paymentDetails.bank_name ||
                      member.bank_name
                    }
                  />

                  <InfoRow
                    label="Bank Account Number"
                    value={
                      civilianKyc?.bank_account_number ||
                      paymentDetails.account_number ||
                      member.account_number
                    }
                  />

                  <InfoRow
                    label="IFSC Code"
                    value={
                      civilianKyc?.ifsc_code ||
                      paymentDetails.ifsc ||
                      member.ifsc
                    }
                  />

                  <InfoRow
                    label="Bank Branch Name"
                    value={
                      civilianKyc?.bank_branch_name ||
                      member.branch_name ||
                      member.branch
                    }
                  />

                  <InfoRow
                    label="UPI ID"
                    value={
                      civilianKyc?.upi_id
                    }
                  />

                  <InfoRow
                    label="GST Number"
                    value={
                      civilianKyc?.gst_number
                    }
                  />

                  <InfoRow
                    label="Income Tax Slab"
                    value={
                      civilianKyc?.income_tax_slab
                    }
                  />

                  <InfoRow
                    label="Nominee Name"
                    value={
                      civilianKyc?.nominee_name ||
                      member.nomini_name
                    }
                  />

                  <InfoRow
                    label="Nominee Relationship"
                    value={
                      civilianKyc?.nominee_relationship ||
                      member.nomini_relationship
                    }
                  />
                </>
              )}
            </DetailCard>

            {/* =================================================
                SECTION D
            ================================================= */}

            <DetailCard
              icon="fas fa-graduation-cap"
              title="D. Education Details"
            >
              <InfoRow
                label="Highest Qualification"
                value={
                  civilianKyc?.highest_qualification ||
                  member.educational_qualification ||
                  member.education
                }
              />

              <InfoRow
                label="School / College Name"
                value={
                  civilianKyc?.school_college_name ||
                  member.school_name ||
                  member.ug_college ||
                  member.pg_college
                }
              />

              <InfoRow
                label="Degree Year"
                value={
                  civilianKyc?.degree_year ||
                  member.ug_year
                }
              />

              <InfoRow
                label="Additional Certifications"
                value={
                  civilianKyc?.additional_certifications
                }
              />

              <InfoRow
                label="Language Skills"
                value={
                  civilianKyc?.language_skills
                }
              />
            </DetailCard>

            {/* =================================================
                SECTION E
            ================================================= */}

            <DetailCard
              icon="fas fa-award"
              title="E. Achievements & Recognition"
            >
              <InfoRow
                label="Awards & Recognitions"
                value={
                  civilianKyc?.awards_recognitions
                }
              />

              <InfoRow
                label="Publications"
                value={
                  civilianKyc?.publications
                }
              />

              <InfoRow
                label="Professional Certifications"
                value={
                  civilianKyc?.professional_certifications
                }
              />

              <InfoRow
                label="Key Milestones"
                value={
                  civilianKyc?.key_milestones
                }
              />

              <InfoRow
                label="Media Mentions"
                value={
                  civilianKyc?.media_mentions
                }
              />

              <InfoRow
                label="Testimonials"
                value={
                  civilianKyc?.testimonials
                }
              />
            </DetailCard>

            {/* =================================================
                SECTION F
            ================================================= */}

            <DetailCard
              icon="fas fa-user-pen"
              title="F. Profile & Social Details"
            >
              <InfoRow
                label="Bio"
                value={
                  civilianKyc?.bio
                }
              />

              <InfoRow
                label="Interest Categories"
                value={
                  civilianKyc?.interest_categories
                }
              />

              <InfoRow
                label="Skills"
                value={
                  civilianKyc?.skills ||
                  member.skills
                }
              />

              <InfoRow
                label="Hobbies"
                value={
                  civilianKyc?.hobbies
                }
              />

              <InfoRow
                label="Preferred Industry"
                value={
                  civilianKyc?.preferred_industry
                }
              />

              <InfoRow
                label="Facebook"
                value={
                  civilianKyc?.facebook_url
                }
              />

              <InfoRow
                label="Instagram"
                value={
                  civilianKyc?.instagram_url
                }
              />

              <InfoRow
                label="LinkedIn"
                value={
                  civilianKyc?.linkedin_url
                }
              />

              <InfoRow
                label="YouTube"
                value={
                  civilianKyc?.youtube_url
                }
              />

              <InfoRow
                label="Website / Portfolio"
                value={
                  civilianKyc?.website_portfolio
                }
              />
            </DetailCard>

            {/* =================================================
                SECTION G
            ================================================= */}

            <DetailCard
              icon="fas fa-network-wired"
              title="G. Network & Royalty Details"
            >
              <InfoRow
                label="Sponsor / Referral ID"
                value={
                  civilianKyc?.sponsor_referral_id ||
                  member.referred_by
                }
              />

              <InfoRow
                label="Network Level / Rank"
                value={
                  civilianKyc?.network_level_rank
                }
              />

              <InfoRow
                label="Team Size"
                value={
                  civilianKyc?.team_size
                }
              />

              <InfoRow
                label="Royalty Slab Category"
                value={
                  civilianKyc?.royalty_slab_category
                }
              />

              <InfoRow
                label="Preferred Payout Cycle"
                value={
                  civilianKyc?.preferred_payout_cycle
                }
              />

              <InfoRow
                label="Direct Network"
                value={
                  member.direct_network ??
                  0
                }
              />

              <InfoRow
                label="Indirect Network"
                value={
                  member.indirect_network ??
                  0
                }
              />
            </DetailCard>

            {/* =================================================
                SECTION H
            ================================================= */}

            <DetailCard
              icon="fas fa-phone-volume"
              title="H. Emergency Contact"
            >
              <InfoRow
                label="Emergency Contact Name"
                value={
                  civilianKyc?.emergency_contact_name
                }
              />

              <InfoRow
                label="Emergency Contact Number"
                value={
                  civilianKyc?.emergency_contact_number
                }
              />

              <InfoRow
                label="Relationship"
                value={
                  civilianKyc?.emergency_relationship
                }
              />
            </DetailCard>

            {/* =================================================
                PAYMENT & MEMBERSHIP
            ================================================= */}

            <DetailCard
              icon="fas fa-credit-card"
              title="Payment & Membership"
            >
              <InfoRow
                label="Selected Plan"
                value={
                  civilianKyc?.selected_plan
                    ? `₹${civilianKyc.selected_plan}`
                    : "—"
                }
              />

              <InfoRow
                label="Amount"
                value={
                  formatAmount(
                    paymentDetails.amount ??
                    member.amount
                  )
                }
              />

              <InfoRow
                label="Payment Method"
                value={
                  paymentDetails.payment_method ??
                  member.payment_method
                }
              />

              <InfoRow
                label="Transaction ID"
                value={
                  paymentDetails.transaction_id ??
                  member.transaction_id
                }
              />

              <InfoRow
                label="Payment Status"
                value={
                  paymentDetails.payment_status ??
                  member.payment_status
                }
              />

              <InfoRow
                label="Subscription"
                value={
                  paymentDetails.subscription_year
                    ? `${paymentDetails.subscription_year} Year`
                    : member.subscription_year
                      ? `${member.subscription_year} Year`
                      : "—"
                }
              />

              <InfoRow
                label="Submitted At"
                value={
                  civilianKyc?.submitted_at
                }
              />

              <InfoRow
                label="Approved At"
                value={
                  civilianKyc?.approved_at
                }
              />

              {(paymentDetails.payment_proof ||
                member.payment_proof) && (
                <ImageDocument
                  label="Payment Proof"
                  src={buildAssetUrl(
                    paymentDetails.payment_proof ||
                    member.payment_proof
                  )}
                />
              )}
            </DetailCard>
          </>
        ) : (
          <>
            <DetailCard
              icon="fas fa-user-circle"
              title="Member Details"
            >
              <InfoRow
                label="Name"
                value={
                  memberName
                }
              />

              <InfoRow
                label="Login ID"
                value={
                  member.login_id
                }
              />

              <InfoRow
                label="Membership Type"
                value={
                  member.membership_type
                }
              />

              <InfoRow
                label="Email"
                value={
                  member.email
                }
              />

              <InfoRow
                label="Phone"
                value={
                  member.phone
                }
              />

              <InfoRow
                label="Payment Status"
                value={
                  paymentDetails.payment_status ??
                  member.payment_status
                }
              />
            </DetailCard>

            {isProfessionalMember && (
              <GenericKycDetails
                title="Professional Full KYC A–J"
                icon="fas fa-briefcase"
                data={professionalKyc || member}
              />
            )}

            {isCommercialMember && (
              <GenericKycDetails
                title="Commercial Full KYC"
                icon="fas fa-building"
                data={commercialKyc || member}
              />
            )}
          </>
        )}
      </div>

      {/* =================================================
          STEP 48.4
          MEMBER VERIFICATION
      ================================================= */}
<AdminMemberVerification
  member={
    member
  }
  memberId={
    id
  }
  onUpdated={
    loadMember
  }
/>

      {/* =================================================
          STEP 48.6
          SOFT DELETE
      ================================================= */}

      <AdminMemberDangerZone
        member={
          member
        }
      />

      {/* =================================================
          CURRENT STATUS INFO
      ================================================= */}

      <section className="inmba-admin-member-next-actions">
        <span>
          <i
            className="fas fa-circle-info"
            aria-hidden="true"
          ></i>
        </span>

        <div>
          <strong>
            Member Management
          </strong>

          <p>
            Member viewing, verification, editing and temporary
            deactivation are active. Restore and permanent deletion
            are handled from the Deleted Members workflow.
          </p>
        </div>
      </section>
    </section>
  );
}

/* =========================================================
   GENERIC FULL KYC RENDERER
========================================================= */

const KYC_HIDDEN_FIELDS = new Set([
  "password",
  "password_hash",
  "otp",
  "otp_expires",
  "reset_token",
  "reset_token_expires",
  "token",
  "secret_key",
]);

const KYC_META_FIELDS = new Set([
  "id",
  "member_id",
  "created_at",
  "updated_at",
]);

const KYC_DOCUMENT_HINT = /(aadhaar|aadhar|pan.*scan|proof|certificate|license|licence|passport.*scan|photo|image|gallery|video|cheque|document|file|marksheet|bonafide|govt_id)/i;

function humanizeKycKey(
  key
) {
  return String(
    key || ""
  )
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}

function normalizeKycDisplayValue(
  value
) {
  if (
    value === true ||
    value === 1 ||
    value === "1"
  ) {
    return "Yes";
  }

  if (
    value === false ||
    value === 0 ||
    value === "0"
  ) {
    return "No";
  }

  if (
    value &&
    typeof value === "object"
  ) {
    try {
      return JSON.stringify(
        value
      );
    } catch {
      return displayValue(
        value
      );
    }
  }

  return displayValue(
    value
  );
}

function GenericKycDetails({
  title,
  icon,
  data,
}) {
  if (
    !data ||
    typeof data !== "object"
  ) {
    return (
      <DetailCard
        icon={icon}
        title={title}
      >
        <NoDocument
          text="Full KYC data is not available for this member."
        />
      </DetailCard>
    );
  }

  const entries =
    Object.entries(
      data
    ).filter(
      ([key, value]) =>
        !KYC_HIDDEN_FIELDS.has(
          key
        ) &&
        !KYC_META_FIELDS.has(
          key
        ) &&
        value !== null &&
        value !== undefined &&
        value !== ""
    );

  if (
    entries.length === 0
  ) {
    return (
      <DetailCard
        icon={icon}
        title={title}
      >
        <NoDocument
          text="No Full KYC values found."
        />
      </DetailCard>
    );
  }

  const regularEntries =
    entries.filter(
      ([key]) =>
        !KYC_DOCUMENT_HINT.test(
          key
        )
    );

  const documentEntries =
    entries.filter(
      ([key]) =>
        KYC_DOCUMENT_HINT.test(
          key
        )
    );

  return (
    <DetailCard
      icon={icon}
      title={title}
    >
      {regularEntries.map(
        ([key, value]) => (
          <InfoRow
            key={key}
            label={
              humanizeKycKey(
                key
              )
            }
            value={
              normalizeKycDisplayValue(
                value
              )
            }
          />
        )
      )}

      {documentEntries.length > 0 && (
        <div className="inmba-admin-member-kyc-documents">
          <h4>Uploaded Documents</h4>

          <div className="inmba-admin-member-document-grid">
            {documentEntries.map(
              ([key, value]) => {
                if (
                  Array.isArray(
                    value
                  )
                ) {
                  return value.map(
                    (item, index) => (
                      <DocumentLink
                        key={`${key}-${index}`}
                        label={`${humanizeKycKey(
                          key
                        )} ${index + 1}`}
                        value={item}
                      />
                    )
                  );
                }

                if (
                  typeof value === "string" &&
                  (
                    value.includes(
                      "/"
                    ) ||
                    value.includes(
                      "\\"
                    ) ||
                    /\.(jpg|jpeg|png|webp|pdf|doc|docx|mp4)$/i.test(
                      value
                    )
                  )
                ) {
                  return (
                    <DocumentLink
                      key={key}
                      label={
                        humanizeKycKey(
                          key
                        )
                      }
                      value={value}
                    />
                  );
                }

                return (
                  <InfoRow
                    key={key}
                    label={
                      humanizeKycKey(
                        key
                      )
                    }
                    value={
                      normalizeKycDisplayValue(
                        value
                      )
                    }
                  />
                );
              }
            )}
          </div>
        </div>
      )}
    </DetailCard>
  );
}

/* =========================================================
   DETAIL CARD
========================================================= */

function DetailCard({
  icon,
  title,
  children,
}) {
  return (
    <article className="inmba-admin-member-detail-card">
      <header>
        <span>
          <i
            className={
              icon
            }
            aria-hidden="true"
          ></i>
        </span>

        <h3>
          {title}
        </h3>
      </header>

      <div>
        {children}
      </div>
    </article>
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
    <div className="inmba-admin-member-info-row">
      <span>
        {label}
      </span>

      <strong>
        {displayValue(
          value
        )}
      </strong>
    </div>
  );
}

/* =========================================================
   RESTRICTED CONTENT
========================================================= */

function RestrictedContent() {
  return (
    <div className="inmba-admin-member-restricted-content">
      <i
        className="fas fa-lock"
        aria-hidden="true"
      ></i>

      <strong>
        Restricted
      </strong>

      <p>
        This information is hidden for your current admin role.
      </p>
    </div>
  );
}

/* =========================================================
   NO DOCUMENT
========================================================= */

function NoDocument({
  text,
}) {
  return (
    <div className="inmba-admin-member-no-document">
      <i
        className="fas fa-file-circle-xmark"
        aria-hidden="true"
      ></i>

      <span>
        {text}
      </span>
    </div>
  );
}

/* =========================================================
   IMAGE DOCUMENT
========================================================= */

function ImageDocument({
  label,
  src,
  large = false,
}) {
  if (
    !src
  ) {
    return null;
  }

  return (
    <a
      href={
        src
      }
      target="_blank"
      rel="noreferrer"
      className={`inmba-admin-member-image-document ${
        large
          ? "inmba-admin-member-image-document-large"
          : ""
      }`}
    >
      <small>
        {label}
      </small>

      <img
        src={
          src
        }
        alt={
          label
        }
      />

      <span>
        <i
          className="fas fa-up-right-from-square"
          aria-hidden="true"
        ></i>

        Open File
      </span>
    </a>
  );
}

/* =========================================================
   DOCUMENT LINK
========================================================= */

function DocumentLink({
  label,
  value,
}) {
  const src =
    buildAssetUrl(
      value
    );

  if (
    !src
  ) {
    return null;
  }

  return (
    <a
      href={
        src
      }
      target="_blank"
      rel="noreferrer"
      className="inmba-admin-member-document-link"
    >
      <span>
        <i
          className="fas fa-file"
          aria-hidden="true"
        ></i>
      </span>

      <div>
        <strong>
          {label}
        </strong>

        <small>
          View uploaded document
        </small>
      </div>

      <i
        className="fas fa-arrow-up-right-from-square"
        aria-hidden="true"
      ></i>
    </a>
  );
}