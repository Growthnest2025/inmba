import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
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
  BACKEND_URL,
} from "../../../api/api";

import {
  useAuth,
} from "../../../context/AuthContext";

import {
  getOwnFullProfile,
  uploadOwnProfilePhoto,
} from "../../../services/profile.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import ProfessionalVisibility from "../ProfessionalVisibility/ProfessionalVisibility";

import "./Profile.css";
import { asObject } from "../../../utils/commonHelpers";

/* =========================================================
   OBJECT
========================================================= */

/* =========================================================
   TEXT
========================================================= */

const toText = (
  value,
  fallback = "Not provided"
) => {
  const text =
    String(
      value ?? ""
    ).trim();

  return (
    text ||
    fallback
  );
};

/* =========================================================
   EMPTY TEXT
========================================================= */

const toEmptyText = (
  value
) => {
  return String(
    value ?? ""
  ).trim();
};

/* =========================================================
   DATE
========================================================= */

const formatDate = (
  value,
  fallback = "Not provided"
) => {
  if (
    !value
  ) {
    return fallback;
  }

  const normalizedValue =
    typeof value === "string"
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
      fallback
    );
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
};

/* =========================================================
   ASSET URL
========================================================= */

const buildAssetUrl = (
  value,
  {
    profile = false,
  } = {}
) => {
  const fileValue =
    toEmptyText(
      value
    );

  if (
    !fileValue
  ) {
    return "";
  }

  /* =====================================================
     ALREADY COMPLETE URL
  ===================================================== */

  if (
    fileValue.startsWith(
      "http://"
    ) ||
    fileValue.startsWith(
      "https://"
    ) ||
    fileValue.startsWith(
      "data:"
    ) ||
    fileValue.startsWith(
      "blob:"
    )
  ) {
    return fileValue;
  }

  /* =====================================================
     PROFESSIONAL PRIVATE KYC DOCUMENT

     DB:

     /private/professional-kyc/2026/08/file.pdf

                     ↓

     Frontend authenticated API:

     /api/downloads/professional-kyc/2026/08/file.pdf

     IMPORTANT:

     Do NOT use BACKEND_URL directly here.

     Using localhost:5173/api lets Vite proxy forward
     the current logged-in member session correctly.
  ===================================================== */

  if (
    fileValue.startsWith(
      "/private/professional-kyc/"
    )
  ) {
    const privatePath =
      fileValue.replace(
        "/private/professional-kyc/",
        ""
      );

    return `/api/downloads/professional-kyc/${privatePath}`;
  }

  if (
    fileValue.startsWith(
      "private/professional-kyc/"
    )
  ) {
    const privatePath =
      fileValue.replace(
        "private/professional-kyc/",
        ""
      );

    return `/api/downloads/professional-kyc/${privatePath}`;
  }

  /* =====================================================
     OLD STATIC UPLOAD PATH
  ===================================================== */

  if (
    fileValue.startsWith(
      "/static/uploads/"
    )
  ) {
    return `${BACKEND_URL}${fileValue.replace(
      "/static/uploads/",
      "/uploads/"
    )}`;
  }

  if (
    fileValue.startsWith(
      "static/uploads/"
    )
  ) {
    return `${BACKEND_URL}/${fileValue.replace(
      "static/uploads/",
      "uploads/"
    )}`;
  }

  /* =====================================================
     NORMAL ABSOLUTE BACKEND PATH
  ===================================================== */

  if (
    fileValue.startsWith(
      "/"
    )
  ) {
    return `${BACKEND_URL}${fileValue}`;
  }

  /* =====================================================
     PROFILE IMAGE FILENAME
  ===================================================== */

  if (
    profile &&
    !fileValue.includes(
      "/"
    )
  ) {
    return `${BACKEND_URL}/uploads/profile/${encodeURIComponent(
      fileValue
    )}`;
  }

  /* =====================================================
     OTHER FILE PATH
  ===================================================== */

  return `${BACKEND_URL}/${fileValue.replace(
    /^\/+/,
    ""
  )}`;
};

/* =========================================================
   PROFILE PHOTO
========================================================= */

const getProfilePhotoUrl = (
  profile
) => {
  return buildAssetUrl(
    profile?.profile_pic_url ??
      profile?.profile_photo_url ??
      profile?.photo_url ??
      profile?.profile_pic ??
      profile?.profile_photo ??
      profile?.photo,
    {
      profile: true,
    }
  );
};

/* =========================================================
   ARRAY
========================================================= */

const parseList = (
  value
) => {
  if (
    Array.isArray(
      value
    )
  ) {
    return value
      .map(
        (
          item
        ) => {
          if (
            typeof item ===
            "string"
          ) {
            return item.trim();
          }

          if (
            item &&
            typeof item ===
            "object"
          ) {
            return toEmptyText(
              item.name ??
                item.title ??
                item.label ??
                item.url ??
                item.path
            );
          }

          return toEmptyText(
            item
          );
        }
      )
      .filter(
        Boolean
      );
  }

  const text =
    toEmptyText(
      value
    );

  if (
    !text
  ) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(
        text
      );

    if (
      Array.isArray(
        parsed
      )
    ) {
      return parseList(
        parsed
      );
    }
  } catch {
    /*
      Legacy comma / pipe /
      newline separated value.
    */
  }

  return text
    .split(
      /[,|\n]/
    )
    .map(
      (
        item
      ) =>
        item.trim()
    )
    .filter(
      Boolean
    );
};

/* =========================================================
   BOOLEAN
========================================================= */

const formatBoolean = (
  value
) => {
  const enabled =
    value === true ||
    value === 1 ||
    value === "1" ||
    String(
      value ?? ""
    )
      .trim()
      .toLowerCase() === "true" ||
    String(
      value ?? ""
    )
      .trim()
      .toLowerCase() === "yes";

  return enabled
    ? "Yes"
    : "No";
};

/* =========================================================
   MEMBERSHIP
========================================================= */

const normalizeMembershipType = (
  value
) => {
  return toEmptyText(
    value
  )
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );
};

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
   PAYMENT STATUS
========================================================= */

const getPaymentStatus = (
  value
) => {
  const status =
    toText(
      value,
      "pending"
    ).toLowerCase();

  let label =
    "Pending";

  if (
    status === "approved"
  ) {
    label =
      "Approved";
  } else if (
    status === "paid"
  ) {
    label =
      "Paid";
  } else if (
    status === "submitted"
  ) {
    label =
      "Submitted";
  } else if (
    status === "rejected"
  ) {
    label =
      "Rejected";
  }

  return {
    value: status,
    label,
  };
};

/* =========================================================
   SOCIAL LINKS
========================================================= */

const getSocialLinks = (
  profile
) => {
  const items = [
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: "fab fa-linkedin",
      value: profile?.social_linkedin,
    },

    {
      key: "instagram",
      label: "Instagram",
      icon: "fab fa-instagram",
      value: profile?.social_instagram,
    },

    {
      key: "facebook",
      label: "Facebook",
      icon: "fab fa-facebook",
      value: profile?.social_facebook,
    },

    {
      key: "twitter",
      label: "Twitter / X",
      icon: "fab fa-x-twitter",
      value: profile?.social_twitter,
    },

    {
      key: "youtube",
      label: "YouTube",
      icon: "fab fa-youtube",
      value: profile?.social_youtube,
    },
  ];

  const result =
    items
      .map(
        (
          item
        ) => ({
          ...item,
          value:
            toEmptyText(
              item.value
            ),
        })
      )
      .filter(
        (
          item
        ) =>
          Boolean(
            item.value
          )
      );

  const generalLink =
    toEmptyText(
      profile?.social_link ??
        profile?.social_links
    );

  if (
    generalLink
  ) {
    result.push({
      key: "general",
      label: "Social Link",
      icon: "fas fa-link",
      value: generalLink,
    });
  }

  const portfolioUrl =
    toEmptyText(
      profile?.portfolio_url
    );

  if (
    portfolioUrl
  ) {
    result.push({
      key: "portfolio",
      label: "Portfolio",
      icon: "fas fa-globe",
      value: portfolioUrl,
    });
  }

  return result;
};

/* =========================================================
   INFO ROW
========================================================= */

function ProfileInfoRow({
  label,
  value,
  icon,
}) {
  return (
    <div className="inmba-profile-info-row">
      <div className="inmba-profile-info-label">
        <i
          className={icon}
          aria-hidden="true"
        ></i>

        <span>
          {label}
        </span>
      </div>

      <strong>
        {toText(
          value
        )}
      </strong>
    </div>
  );
}

/* =========================================================
   DOCUMENT ROW
========================================================= */

function ProfileDocumentRow({
  label,
  value,
  icon = "fas fa-file",
}) {
  const fileValue =
    toEmptyText(
      value
    );

  const url =
    buildAssetUrl(
      fileValue
    );

  return (
    <div className="inmba-profile-info-row">
      <div className="inmba-profile-info-label">
        <i
          className={icon}
          aria-hidden="true"
        ></i>

        <span>
          {label}
        </span>
      </div>

      {fileValue ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          View Document
        </a>
      ) : (
        <strong>
          Not provided
        </strong>
      )}
    </div>
  );
}

/* =========================================================
   LIST ROW
========================================================= */

function ProfileListRow({
  label,
  value,
  icon = "fas fa-list",
}) {
  const items =
    parseList(
      value
    );

  return (
    <div className="inmba-profile-info-row">
      <div className="inmba-profile-info-label">
        <i
          className={icon}
          aria-hidden="true"
        ></i>

        <span>
          {label}
        </span>
      </div>

      <strong>
        {items.length
          ? items.join(
              ", "
            )
          : "Not provided"}
      </strong>
    </div>
  );
}

/* =========================================================
   PROFILE CARD
========================================================= */

function ProfileCard({
  icon,
  title,
  subtitle,
  children,
}) {
  return (
    <section className="inmba-profile-card">
      <header className="inmba-profile-card-header">
        <div className="inmba-profile-card-icon">
          <i
            className={icon}
            aria-hidden="true"
          ></i>
        </div>

        <div>
          <h2>
            {title}
          </h2>

          {subtitle && (
            <p>
              {subtitle}
            </p>
          )}
        </div>
      </header>

      <div className="inmba-profile-card-content">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   PROFILE PAGE
========================================================= */

export default function Profile() {
  const navigate =
    useNavigate();

  const fileInputRef =
    useRef(
      null
    );

  const {
    member:
      sessionMember,

    clearMemberSession,

    checkMemberSession,
  } =
    useAuth();

  const [
    profile,
    setProfile,
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

  const [
    uploadingPhoto,
    setUploadingPhoto,
  ] =
    useState(
      false
    );

  /* =======================================================
     LOAD OWNER PROFILE
  ======================================================= */

  const loadProfile =
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

          const result =
            await getOwnFullProfile({
              signal,
            });

          const ownerProfile =
            asObject(
              result?.profile ??
                result?.member
            );

          setProfile(
            ownerProfile
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

          const statusCode =
            Number(
              requestError?.response?.status ??
                requestError?.statusCode ??
                0
            );

          if (
            statusCode === 401
          ) {
            clearMemberSession();

            navigate(
              "/login",
              {
                replace: true,

                state: {
                  from:
                    "/profile",

                  error:
                    "Your session has expired. Please login again.",
                },
              }
            );

            return;
          }

          console.error(
            "Profile API Error:",
            requestError
          );

          setProfile(
            null
          );

          setError(
            getApiErrorMessage(
              requestError,
              "Unable to load your profile."
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

      loadProfile({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadProfile,
    ]
  );

  /* =======================================================
     MERGED MEMBER

     Full owner profile wins over session member.
  ======================================================= */

  const member =
    useMemo(
      () => ({
        ...asObject(
          sessionMember
        ),

        ...asObject(
          profile
        ),
      }),
      [
        sessionMember,
        profile,
      ]
    );

  /* =======================================================
     PROFESSIONAL
  ======================================================= */

  const professionalOwner =
    isProfessionalMembership(
      member.membership_type ??
        member.membershipType
    );

  /* =======================================================
     NAME
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
        member.lastName,
      ""
    );

  const fullName =
    `${firstName} ${lastName}`
      .trim();

  /* =======================================================
     LOGIN
  ======================================================= */

  const loginId =
    toEmptyText(
      member.login_id ??
        member.loginId
    );

  /* =======================================================
     PAYMENT
  ======================================================= */

  const paymentStatus =
    getPaymentStatus(
      member.payment_status ??
        member.paymentStatus
    );

  /* =======================================================
     PHOTO
  ======================================================= */

  const profilePhoto =
    getProfilePhotoUrl(
      member
    );

  /* =======================================================
     SKILLS
  ======================================================= */

  const skills =
    parseList(
      member.skills
    );

  /* =======================================================
     SOCIAL
  ======================================================= */

  const socialLinks =
    getSocialLinks(
      member
    );

  /* =======================================================
     PUBLIC PROFILE PATH
  ======================================================= */

  const publicProfilePath =
    loginId
      ? `/user-profile/${encodeURIComponent(
          loginId
        )}`
      : "";

  /* =======================================================
     CHOOSE PHOTO
  ======================================================= */

  const handleChoosePhoto =
    () => {
      if (
        uploadingPhoto
      ) {
        return;
      }

      fileInputRef.current?.click();
    };

  /* =======================================================
     PHOTO UPLOAD
  ======================================================= */

  const handlePhotoChange =
    async (
      event
    ) => {
      const file =
        event.target.files?.[0];

      event.target.value =
        "";

      if (
        !file
      ) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        toast.error(
          "Please select a valid image file."
        );

        return;
      }

      const maxFileSize =
        5 *
        1024 *
        1024;

      if (
        file.size >
        maxFileSize
      ) {
        toast.error(
          "Profile photo must be below 5 MB."
        );

        return;
      }

      try {
        setUploadingPhoto(
          true
        );

        const result =
          await uploadOwnProfilePhoto(
            file
          );

        toast.success(
          result?.message ||
            "Profile photo updated successfully."
        );

        await Promise.allSettled([
          loadProfile(),
          checkMemberSession(),
        ]);
      } catch (
        uploadError
      ) {
        const statusCode =
          Number(
            uploadError?.response?.status ??
              uploadError?.statusCode ??
              0
          );

        if (
          statusCode === 401
        ) {
          clearMemberSession();

          navigate(
            "/login",
            {
              replace: true,

              state: {
                from:
                  "/profile",

                error:
                  "Your session has expired. Please login again.",
              },
            }
          );

          return;
        }

        toast.error(
          getApiErrorMessage(
            uploadError,
            "Unable to upload profile photo."
          )
        );
      } finally {
        setUploadingPhoto(
          false
        );
      }
    };

  /* =======================================================
     VISIBILITY SAVED
  ======================================================= */

  const handleVisibilitySaved =
    async () => {
      await loadProfile();
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <main className="inmba-profile-page">
        <div className="inmba-profile-state">
          <div
            className="spinner-border"
            role="status"
            aria-label="Loading profile"
          ></div>

          <h1>
            Loading Profile
          </h1>

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
      <main className="inmba-profile-page">
        <div className="inmba-profile-state inmba-profile-error-state">
          <div className="inmba-profile-state-icon">
            <i
              className="fas fa-triangle-exclamation"
              aria-hidden="true"
            ></i>
          </div>

          <h1>
            Profile Unavailable
          </h1>

          <p>
            {error}
          </p>

          <button
            type="button"
            className="inmba-profile-primary-button"
            onClick={() =>
              loadProfile()
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

  return (
    <main className="inmba-profile-page">
      <div className="inmba-profile-container">
        {/* =================================================
            HERO
        ================================================= */}

        <section className="inmba-profile-hero">
          <div className="inmba-profile-cover">
            <div>
              <p>
                INMBA Member Portal
              </p>

              <h1>
                My Profile
              </h1>
            </div>

            <span
              className={`inmba-profile-status inmba-profile-status-${paymentStatus.value}`}
            >
              <i
                className={
                  paymentStatus.value ===
                    "approved" ||
                  paymentStatus.value ===
                    "paid"
                    ? "fas fa-circle-check"
                    : "fas fa-clock"
                }
                aria-hidden="true"
              ></i>

              {paymentStatus.label}
            </span>
          </div>

          <div className="inmba-profile-hero-content">
            {/* =============================================
                AVATAR
            ============================================= */}

            <div className="inmba-profile-avatar-wrapper">
              <button
                type="button"
                className="inmba-profile-avatar"
                onClick={
                  handleChoosePhoto
                }
                disabled={
                  uploadingPhoto
                }
                aria-label="Change profile photo"
              >
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

                <span className="inmba-profile-avatar-overlay">
                  {uploadingPhoto ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      aria-hidden="true"
                    ></span>
                  ) : (
                    <i
                      className="fas fa-camera"
                      aria-hidden="true"
                    ></i>
                  )}
                </span>
              </button>

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="inmba-profile-file-input"
                onChange={
                  handlePhotoChange
                }
              />

              <button
                type="button"
                className="inmba-profile-photo-button"
                onClick={
                  handleChoosePhoto
                }
                disabled={
                  uploadingPhoto
                }
              >
                {uploadingPhoto
                  ? "Uploading..."
                  : "Change Photo"}
              </button>
            </div>

            {/* =============================================
                SUMMARY
            ============================================= */}

            <div className="inmba-profile-summary">
              <div className="inmba-profile-name-row">
                <h2>
                  {fullName}
                </h2>

                {(
                  paymentStatus.value ===
                    "approved" ||
                  paymentStatus.value ===
                    "paid"
                ) && (
                  <span className="inmba-profile-verified">
                    <i
                      className="fas fa-check"
                      aria-hidden="true"
                    ></i>
                  </span>
                )}
              </div>

              {professionalOwner &&
                member.display_name && (
                  <p className="inmba-profile-membership">
                    Display Name:{" "}
                    {
                      member.display_name
                    }
                  </p>
                )}

              {professionalOwner &&
                member.username && (
                  <p className="inmba-profile-membership">
                    @
                    {String(
                      member.username
                    ).replace(
                      /^@/,
                      ""
                    )}
                  </p>
                )}

              <p className="inmba-profile-membership">
                {toText(
                  member.membership_type ??
                    member.membershipType,
                  "INMBA Member"
                )}
              </p>

              <div className="inmba-profile-identity">
                <span>
                  <i
                    className="fas fa-id-card"
                    aria-hidden="true"
                  ></i>

                  Login ID:{" "}
                  {loginId ||
                    "Not assigned"}
                </span>

                <span>
                  <i
                    className="fas fa-calendar"
                    aria-hidden="true"
                  ></i>

                  Joined:{" "}
                  {formatDate(
                    member.created_at ??
                      member.createdAt
                  )}
                </span>
              </div>

              <p className="inmba-profile-bio">
                {toText(
                  member.professional_bio ??
                    member.bio,
                  "Add your professional bio to introduce yourself to the INMBA community."
                )}
              </p>

              {/* ===========================================
                  ACTIONS
              =========================================== */}

              <div className="inmba-profile-actions">
                <Link
                  to="/profile/edit"
                  className="inmba-profile-primary-button"
                >
                  <i
                    className="fas fa-user-pen"
                    aria-hidden="true"
                  ></i>

                  Edit Profile
                </Link>

                {professionalOwner && (
                  <Link
                    to="/professional-kyc"
                    className="inmba-profile-secondary-button"
                  >
                    <i
                      className="fas fa-file-shield"
                      aria-hidden="true"
                    ></i>

                    Professional KYC
                  </Link>
                )}

                {publicProfilePath && (
                  <Link
                    to={
                      publicProfilePath
                    }
                    className="inmba-profile-secondary-button"
                  >
                    <i
                      className="fas fa-address-card"
                      aria-hidden="true"
                    ></i>

                    Public Profile
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  className="inmba-profile-secondary-button"
                >
                  <i
                    className="fas fa-arrow-left"
                    aria-hidden="true"
                  ></i>

                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            PROFESSIONAL
        ================================================= */}

        {professionalOwner ? (
          <>
            <div className="inmba-profile-grid">
              {/* ===========================================
                  A
              =========================================== */}

              <ProfileCard
                icon="fas fa-id-card"
                title="A. Identity & KYC"
                subtitle="Your private identity and KYC information"
              >
                <ProfileInfoRow
                  icon="fas fa-user"
                  label="Full Legal Name"
                  value={
                    fullName
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-person"
                  label="Father / Spouse Name"
                  value={
                    member.father_name
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-cake-candles"
                  label="Date of Birth"
                  value={
                    formatDate(
                      member.dob
                    )
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-venus-mars"
                  label="Gender"
                  value={
                    member.gender
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-ring"
                  label="Marital Status"
                  value={
                    member.marital_status
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-flag"
                  label="Nationality"
                  value={
                    member.nationality
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-fingerprint"
                  label="Aadhaar Number"
                  value={
                    member.aadhar
                  }
                />

                <ProfileDocumentRow
                  icon="fas fa-id-card"
                  label="Aadhaar Front"
                  value={
                    member.aadhar_front
                  }
                />

                <ProfileDocumentRow
                  icon="fas fa-id-card"
                  label="Aadhaar Back"
                  value={
                    member.aadhar_back
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-address-card"
                  label="PAN Number"
                  value={
                    member.pan_number
                  }
                />

                <ProfileDocumentRow
                  label="PAN Document"
                  value={
                    member.pan_front
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-passport"
                  label="Passport Number"
                  value={
                    member.passport_number
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-id-card"
                  label="Voter ID"
                  value={
                    member.voter_id
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-car"
                  label="Driving License"
                  value={
                    member.driving_license
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-droplet"
                  label="Blood Group"
                  value={
                    member.blood_group
                  }
                />
              </ProfileCard>

              {/* ===========================================
                  B
              =========================================== */}

              <ProfileCard
                icon="fas fa-address-book"
                title="B. Contact & Address"
                subtitle="Your private contact and complete address"
              >
                <ProfileInfoRow
                  icon="fas fa-phone"
                  label="Primary Mobile"
                  value={
                    member.phone
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-mobile-screen"
                  label="Secondary Mobile"
                  value={
                    member.secondary_mobile
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-envelope"
                  label="Email"
                  value={
                    member.email
                  }
                />

                <ProfileInfoRow
                  icon="fab fa-whatsapp"
                  label="WhatsApp"
                  value={
                    member.whatsapp_number
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-house"
                  label="Current Address"
                  value={
                    member.current_address
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-house-user"
                  label="Permanent Address"
                  value={
                    member.permanent_address
                  }
                />

                <ProfileDocumentRow
                  label="Address Proof"
                  value={
                    member.address_proof
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-city"
                  label="City"
                  value={
                    member.city ??
                    member.entity_city
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-map"
                  label="District"
                  value={
                    member.district ??
                    member.entity_district
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-map-location-dot"
                  label="State"
                  value={
                    member.state ??
                    member.entity_state
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-location-crosshairs"
                  label="Pincode"
                  value={
                    member.pincode ??
                    member.entity_pincode
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-map-pin"
                  label="Google Map Location"
                  value={
                    member.google_map_location
                  }
                />
              </ProfileCard>

              {/* ===========================================
                  C
              =========================================== */}

              <ProfileCard
                icon="fas fa-scale-balanced"
                title="C. Legal & Professional Compliance"
                subtitle="Professional registrations and compliance documents"
              >
                <ProfileInfoRow
                  icon="fas fa-briefcase"
                  label="Occupation"
                  value={
                    member.occupation
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-certificate"
                  label="Professional License Number"
                  value={
                    member.professional_license_number
                  }
                />

                <ProfileDocumentRow
                  label="Professional License Document"
                  value={
                    member.professional_license_document
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-building-columns"
                  label="Council / Board Name"
                  value={
                    member.council_board_name
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-id-badge"
                  label="Council Registration Number"
                  value={
                    member.council_registration_number
                  }
                />

                <ProfileDocumentRow
                  label="Council Registration Document"
                  value={
                    member.council_registration_document
                  }
                />

                <ProfileDocumentRow
                  label="Professional Indemnity Insurance"
                  value={
                    member.professional_indemnity_insurance
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-address-card"
                  label="Firm PAN Number"
                  value={
                    member.firm_pan_number
                  }
                />

                <ProfileDocumentRow
                  label="Firm PAN Document"
                  value={
                    member.firm_pan_document
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-file-invoice"
                  label="Professional GST Number"
                  value={
                    member.professional_gst_number
                  }
                />

                <ProfileDocumentRow
                  label="GST Document"
                  value={
                    member.professional_gst_document
                  }
                />
              </ProfileCard>

              {/* ===========================================
                  D
              =========================================== */}

              <ProfileCard
                icon="fas fa-graduation-cap"
                title="D. Education & Qualification"
                subtitle="Academic and certification information"
              >
                <ProfileInfoRow
                  icon="fas fa-graduation-cap"
                  label="Highest Qualification"
                  value={
                    member.educational_qualification ??
                    member.education
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-building-columns"
                  label="School / College"
                  value={
                    member.school_college_name
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-calendar"
                  label="Degree / Certificate Year"
                  value={
                    member.degree_certificate_year
                  }
                />

                <ProfileDocumentRow
                  label="Education Certificate"
                  value={
                    member.education_certificate
                  }
                />

                <ProfileListRow
                  icon="fas fa-award"
                  label="Additional Certifications"
                  value={
                    member.additional_certifications
                  }
                />

                <ProfileListRow
                  icon="fas fa-language"
                  label="Language Skills"
                  value={
                    member.language_skills
                  }
                />
              </ProfileCard>

              {/* ===========================================
                  E
              =========================================== */}

              <ProfileCard
                icon="fas fa-trophy"
                title="E. Achievements & Certifications"
                subtitle="Awards, publications and milestones"
              >
                <ProfileListRow
                  icon="fas fa-trophy"
                  label="Awards & Recognitions"
                  value={
                    member.awards_recognitions
                  }
                />

                <ProfileListRow
                  icon="fas fa-book"
                  label="Publications"
                  value={
                    member.publications
                  }
                />

                <ProfileListRow
                  icon="fas fa-certificate"
                  label="Professional Certifications"
                  value={
                    member.professional_certifications
                  }
                />

                <ProfileListRow
                  icon="fas fa-flag-checkered"
                  label="Key Milestones"
                  value={
                    member.key_milestones
                  }
                />

                <ProfileListRow
                  icon="fas fa-newspaper"
                  label="Media Mentions"
                  value={
                    member.media_mentions
                  }
                />

                <ProfileListRow
                  icon="fas fa-comment"
                  label="Reference Letters / Testimonials"
                  value={
                    member.reference_letters
                  }
                />
              </ProfileCard>

              {/* ===========================================
                  F
              =========================================== */}

              <ProfileCard
                icon="fas fa-briefcase"
                title="F. Work Experience & Portfolio"
                subtitle="Professional experience and work records"
              >
                <ProfileInfoRow
                  icon="fas fa-clock"
                  label="Total Experience"
                  value={
                    member.total_experience_years != null
                      ? `${member.total_experience_years} Years`
                      : ""
                  }
                />

                <ProfileListRow
                  icon="fas fa-building"
                  label="Previous Employers / Clients"
                  value={
                    member.previous_employers_clients
                  }
                />

                <ProfileListRow
                  icon="fas fa-folder-open"
                  label="Work Samples"
                  value={
                    member.work_samples
                  }
                />

                <ProfileDocumentRow
                  icon="fas fa-file-pdf"
                  label="Resume / CV"
                  value={
                    member.resume_cv
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-indian-rupee-sign"
                  label="Hourly / Project Rate"
                  value={
                    member.hourly_project_rate
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-circle"
                  label="Availability Status"
                  value={
                    member.availability_status
                  }
                />
              </ProfileCard>

              {/* ===========================================
                  G
              =========================================== */}

              <ProfileCard
                icon="fas fa-user-tie"
                title="G. Interest, Skills & Bio"
                subtitle="Professional identity and online presence"
              >
                <ProfileInfoRow
                  icon="fas fa-address-card"
                  label="Professional Bio"
                  value={
                    member.professional_bio ??
                    member.bio
                  }
                />

                <ProfileListRow
                  icon="fas fa-tags"
                  label="Interest Categories"
                  value={
                    member.interest_categories
                  }
                />

                <ProfileListRow
                  icon="fas fa-lightbulb"
                  label="Skills"
                  value={
                    member.skills
                  }
                />

                <ProfileListRow
                  icon="fas fa-heart"
                  label="Hobbies"
                  value={
                    member.hobbies
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-industry"
                  label="Preferred Industry"
                  value={
                    member.preferred_industry
                  }
                />

                <ProfileDocumentRow
                  icon="fas fa-image"
                  label="Cover Photo"
                  value={
                    member.cover_photo
                  }
                />

                <ProfileListRow
                  icon="fas fa-images"
                  label="Gallery Photos"
                  value={
                    member.gallery_photos
                  }
                />

                <ProfileDocumentRow
                  icon="fas fa-video"
                  label="Intro Video"
                  value={
                    member.intro_video
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-globe"
                  label="Portfolio URL"
                  value={
                    member.portfolio_url
                  }
                />
              </ProfileCard>

              {/* ===========================================
                  H
              =========================================== */}

              <ProfileCard
                icon="fas fa-building-columns"
                title="H. Financial & Bank Details"
                subtitle="Private bank and payout information"
              >
                <ProfileInfoRow
                  icon="fas fa-user"
                  label="Account Holder"
                  value={
                    member.account_holder
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-building-columns"
                  label="Bank Name"
                  value={
                    member.bank_name
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-credit-card"
                  label="Account Number"
                  value={
                    member.account_number
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-code"
                  label="IFSC Code"
                  value={
                    member.ifsc
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-location-dot"
                  label="Bank Branch"
                  value={
                    member.branch
                  }
                />

                <ProfileDocumentRow
                  label="Passbook / Cancelled Cheque"
                  value={
                    member.bank_proof
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-mobile-screen"
                  label="UPI ID"
                  value={
                    member.upi_id
                  }
                />

                <ProfileDocumentRow
                  label="Income Tax Declaration"
                  value={
                    member.income_tax_declaration
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-user-shield"
                  label="Nominee Name"
                  value={
                    member.nomini_name
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-people-arrows"
                  label="Nominee Relationship"
                  value={
                    member.nomini_relationship
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-fingerprint"
                  label="Nominee Aadhaar / ID"
                  value={
                    member.nomini_aadhar
                  }
                />

                <ProfileDocumentRow
                  label="Nominee ID Document"
                  value={
                    member.nomini_id_document
                  }
                />
              </ProfileCard>

              {/* ===========================================
                  I
              =========================================== */}

              <ProfileCard
                icon="fas fa-users"
                title="I. Network & Royalty"
                subtitle="Your private referral and royalty information"
              >
                <ProfileInfoRow
                  icon="fas fa-share-nodes"
                  label="Sponsor / Referral ID"
                  value={
                    member.referral_id
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-user-check"
                  label="Referred By"
                  value={
                    member.referred_by
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-users"
                  label="Direct Network"
                  value={
                    member.direct_network ??
                    0
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-user-group"
                  label="Indirect Network"
                  value={
                    member.indirect_network ??
                    0
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-people-group"
                  label="Team Size"
                  value={
                    member.team_size ??
                    0
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-ranking-star"
                  label="Network Level / Rank"
                  value={
                    member.network_level
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-crown"
                  label="Royalty Slab Category"
                  value={
                    member.royalty_slab_category
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-calendar-check"
                  label="Preferred Payout Cycle"
                  value={
                    member.preferred_payout_cycle
                  }
                />
              </ProfileCard>

              {/* ===========================================
                  J
              =========================================== */}

              <ProfileCard
                icon="fas fa-phone-volume"
                title="J. Emergency Contact"
                subtitle="Private emergency contact information"
              >
                <ProfileInfoRow
                  icon="fas fa-user"
                  label="Emergency Contact Name"
                  value={
                    member.emergency_contact_name
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-phone"
                  label="Emergency Contact Number"
                  value={
                    member.emergency_contact_number
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-people-arrows"
                  label="Relationship"
                  value={
                    member.emergency_relationship
                  }
                />
              </ProfileCard>

              {/* ===========================================
                  PAYMENT
              =========================================== */}

              <ProfileCard
                icon="fas fa-wallet"
                title="Payment Information"
                subtitle="Membership payment details"
              >
                <ProfileInfoRow
                  icon="fas fa-circle-check"
                  label="Payment Status"
                  value={
                    paymentStatus.label
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-credit-card"
                  label="Payment Method"
                  value={
                    member.payment_method
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-receipt"
                  label="Transaction ID"
                  value={
                    member.transaction_id
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-indian-rupee-sign"
                  label="Amount"
                  value={
                    member.amount
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-calendar"
                  label="Subscription Year"
                  value={
                    member.subscription_year
                  }
                />
              </ProfileCard>

              {/* ===========================================
                  KYC STATUS
              =========================================== */}

              <ProfileCard
                icon="fas fa-file-shield"
                title="Professional KYC Status"
                subtitle="A–J KYC workflow status"
              >
                <ProfileInfoRow
                  icon="fas fa-list-ol"
                  label="Current Step"
                  value={
                    member.professional_kyc_current_step
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-circle-info"
                  label="KYC Status"
                  value={
                    member.professional_kyc_status
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-calendar"
                  label="Submitted At"
                  value={
                    formatDate(
                      member.professional_kyc_submitted_at
                    )
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-calendar-check"
                  label="Completed At"
                  value={
                    formatDate(
                      member.professional_kyc_completed_at
                    )
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-comment"
                  label="Rejection Reason"
                  value={
                    member.professional_kyc_rejection_reason
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-check"
                  label="Section A Completed"
                  value={
                    formatBoolean(
                      member.professional_section_a_completed
                    )
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-check"
                  label="Section B Completed"
                  value={
                    formatBoolean(
                      member.professional_section_b_completed
                    )
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-check"
                  label="Section C Completed"
                  value={
                    formatBoolean(
                      member.professional_section_c_completed
                    )
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-check"
                  label="Section D Completed"
                  value={
                    formatBoolean(
                      member.professional_section_d_completed
                    )
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-check"
                  label="Section E Completed"
                  value={
                    formatBoolean(
                      member.professional_section_e_completed
                    )
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-check"
                  label="Section F Completed"
                  value={
                    formatBoolean(
                      member.professional_section_f_completed
                    )
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-check"
                  label="Section G Completed"
                  value={
                    formatBoolean(
                      member.professional_section_g_completed
                    )
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-check"
                  label="Section H Completed"
                  value={
                    formatBoolean(
                      member.professional_section_h_completed
                    )
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-check"
                  label="Section I Completed"
                  value={
                    formatBoolean(
                      member.professional_section_i_completed
                    )
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-check"
                  label="Section J Completed"
                  value={
                    formatBoolean(
                      member.professional_section_j_completed
                    )
                  }
                />
              </ProfileCard>

              {/* ===========================================
                  PRIVACY CONSENT
              =========================================== */}

              <ProfileCard
                icon="fas fa-lock"
                title="Privacy & Consent"
                subtitle="Your Professional privacy and declaration status"
              >
                <ProfileInfoRow
                  icon="fas fa-shield"
                  label="Privacy Consent"
                  value={
                    formatBoolean(
                      member.professional_privacy_consent
                    )
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-file-signature"
                  label="Declaration Accepted"
                  value={
                    formatBoolean(
                      member.professional_declaration_accepted
                    )
                  }
                />

                <ProfileInfoRow
                  icon="fas fa-calendar-check"
                  label="Declaration Date"
                  value={
                    formatDate(
                      member.professional_declaration_at
                    )
                  }
                />
              </ProfileCard>
            </div>

            {/* =============================================
                PUBLIC VISIBILITY CONTROL

                IMPORTANT:
                Professional owner only.

                This updates QR/Public profile preferences.
            ============================================= */}

            <ProfessionalVisibility
              profile={
                member
              }
              onSaved={
                handleVisibilitySaved
              }
            />
          </>
        ) : (
          /* =================================================
             NON PROFESSIONAL
          ================================================= */

          <div className="inmba-profile-grid">
            <ProfileCard
              icon="fas fa-user"
              title="Personal Information"
              subtitle="Your basic member details"
            >
              <ProfileInfoRow
                icon="fas fa-user"
                label="Full Name"
                value={
                  fullName
                }
              />

              <ProfileInfoRow
                icon="fas fa-person"
                label="Father Name"
                value={
                  member.father_name
                }
              />

              <ProfileInfoRow
                icon="fas fa-cake-candles"
                label="Date of Birth"
                value={
                  formatDate(
                    member.dob
                  )
                }
              />

              <ProfileInfoRow
                icon="fas fa-venus-mars"
                label="Gender"
                value={
                  member.gender
                }
              />

              <ProfileInfoRow
                icon="fas fa-ring"
                label="Marital Status"
                value={
                  member.marital_status
                }
              />

              <ProfileInfoRow
                icon="fas fa-flag"
                label="Nationality"
                value={
                  member.nationality
                }
              />
            </ProfileCard>

            <ProfileCard
              icon="fas fa-address-book"
              title="Contact Information"
              subtitle="Your communication details"
            >
              <ProfileInfoRow
                icon="fas fa-envelope"
                label="Email"
                value={
                  member.email
                }
              />

              <ProfileInfoRow
                icon="fas fa-phone"
                label="Phone"
                value={
                  member.phone
                }
              />

              <ProfileInfoRow
                icon="fab fa-whatsapp"
                label="WhatsApp"
                value={
                  member.whatsapp_number
                }
              />

              <ProfileInfoRow
                icon="fas fa-mobile-screen"
                label="Contact Number"
                value={
                  member.contact_number
                }
              />
            </ProfileCard>

            <ProfileCard
              icon="fas fa-location-dot"
              title="Address Information"
              subtitle="Your current location details"
            >
              <ProfileInfoRow
                icon="fas fa-house"
                label="Address"
                value={
                  member.address
                }
              />

              <ProfileInfoRow
                icon="fas fa-city"
                label="City"
                value={
                  member.city ??
                  member.entity_city
                }
              />

              <ProfileInfoRow
                icon="fas fa-map"
                label="District"
                value={
                  member.district ??
                  member.entity_district
                }
              />

              <ProfileInfoRow
                icon="fas fa-map-location-dot"
                label="State"
                value={
                  member.state ??
                  member.entity_state
                }
              />

              <ProfileInfoRow
                icon="fas fa-location-crosshairs"
                label="Pincode"
                value={
                  member.pincode ??
                  member.entity_pincode
                }
              />

              <ProfileInfoRow
                icon="fas fa-earth-asia"
                label="Country"
                value={
                  member.country ??
                  member.nationality
                }
              />
            </ProfileCard>

            <ProfileCard
              icon="fas fa-briefcase"
              title="Professional Information"
              subtitle="Your education and career details"
            >
              <ProfileInfoRow
                icon="fas fa-briefcase"
                label="Occupation"
                value={
                  member.occupation ??
                  member.profession
                }
              />

              <ProfileInfoRow
                icon="fas fa-graduation-cap"
                label="Education"
                value={
                  member.education
                }
              />

              <ProfileInfoRow
                icon="fas fa-certificate"
                label="Qualification"
                value={
                  member.educational_qualification
                }
              />

              <ProfileInfoRow
                icon="fas fa-school"
                label="College / School"
                value={
                  member.ug_college ??
                  member.pg_college ??
                  member.school_name
                }
              />

              <ProfileInfoRow
                icon="fas fa-book"
                label="Course"
                value={
                  member.ug_degree ??
                  member.pg_degree ??
                  member.school_class
                }
              />

              <ProfileInfoRow
                icon="fas fa-id-badge"
                label="Student ID"
                value={
                  member.student_id
                }
              />
            </ProfileCard>

            <ProfileCard
              icon="fas fa-shield-halved"
              title="Membership Information"
              subtitle="Your INMBA account status"
            >
              <ProfileInfoRow
                icon="fas fa-id-card"
                label="Login ID"
                value={
                  loginId
                }
              />

              <ProfileInfoRow
                icon="fas fa-crown"
                label="Membership Type"
                value={
                  member.membership_type
                }
              />

              <ProfileInfoRow
                icon="fas fa-circle-check"
                label="Payment Status"
                value={
                  paymentStatus.label
                }
              />

              <ProfileInfoRow
                icon="fas fa-share-nodes"
                label="Referral ID"
                value={
                  member.referral_id
                }
              />

              <ProfileInfoRow
                icon="fas fa-users"
                label="Direct Network"
                value={
                  member.direct_network ??
                  0
                }
              />

              <ProfileInfoRow
                icon="fas fa-user-group"
                label="Indirect Network"
                value={
                  member.indirect_network ??
                  0
                }
              />
            </ProfileCard>

            <ProfileCard
              icon="fas fa-user-shield"
              title="Nominee Information"
              subtitle="Your registered nominee details"
            >
              <ProfileInfoRow
                icon="fas fa-user"
                label="Nominee Name"
                value={
                  member.nomini_name
                }
              />

              <ProfileInfoRow
                icon="fas fa-cake-candles"
                label="Nominee DOB"
                value={
                  formatDate(
                    member.nomini_dob
                  )
                }
              />

              <ProfileInfoRow
                icon="fas fa-people-arrows"
                label="Relationship"
                value={
                  member.nomini_relationship
                }
              />

              <ProfileInfoRow
                icon="fas fa-fingerprint"
                label="Nominee Aadhaar"
                value={
                  member.nomini_aadhar
                }
              />
            </ProfileCard>
          </div>
        )}

        {/* =================================================
            SKILLS
        ================================================= */}

        <ProfileCard
          icon="fas fa-lightbulb"
          title="Skills"
          subtitle="Your professional abilities"
        >
          {skills.length > 0 ? (
            <div className="inmba-profile-skills">
              {skills.map(
                (
                  skill,
                  index
                ) => (
                  <span
                    key={`${skill}-${index}`}
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          ) : (
            <div className="inmba-profile-empty-content">
              <i
                className="fas fa-lightbulb"
                aria-hidden="true"
              ></i>

              <p>
                Skills have not been added yet.
              </p>
            </div>
          )}
        </ProfileCard>

        {/* =================================================
            SOCIAL
        ================================================= */}

        <ProfileCard
          icon="fas fa-share-nodes"
          title="Social Links"
          subtitle="Connect with your professional profiles"
        >
          {socialLinks.length > 0 ? (
            <div className="inmba-profile-social-grid">
              {socialLinks.map(
                (
                  item
                ) => (
                  <a
                    key={
                      item.key
                    }
                    href={
                      item.value
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i
                      className={
                        item.icon
                      }
                      aria-hidden="true"
                    ></i>

                    <span>
                      {item.label}
                    </span>

                    <i
                      className="fas fa-arrow-up-right-from-square"
                      aria-hidden="true"
                    ></i>
                  </a>
                )
              )}
            </div>
          ) : (
            <div className="inmba-profile-empty-content">
              <i
                className="fas fa-link"
                aria-hidden="true"
              ></i>

              <p>
                Social links have not been added yet.
              </p>
            </div>
          )}
        </ProfileCard>
      </div>
    </main>
  );
}