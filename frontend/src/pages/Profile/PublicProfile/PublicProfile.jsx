import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
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
  getPublicMemberProfile,
} from "../../../services/profile.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./PublicProfile.css";

/* =========================
   OBJECT HELPER
========================= */

const asObject = (
  value
) => {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
};

/* =========================
   TEXT HELPER
========================= */

const toText = (
  value,
  fallback = ""
) => {
  const normalizedValue =
    String(
      value ??
      ""
    ).trim();

  return (
    normalizedValue ||
    fallback
  );
};

/* =========================
   DATE FORMATTER
========================= */

const formatDate = (
  value,
  fallback = "Not provided"
) => {
  if (!value) {
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

/* =========================
   PROFILE PHOTO URL
========================= */

const getProfilePhotoUrl = (
  profile
) => {
  const value =
    toText(
      profile?.profile_pic_url ??
        profile?.profile_photo_url ??
        profile?.photo_url ??
        profile?.profile_pic ??
        profile?.profile_photo ??
        profile?.photo,
      ""
    );

  if (!value) {
    return "";
  }

  if (
    value.startsWith(
      "http://"
    ) ||
    value.startsWith(
      "https://"
    ) ||
    value.startsWith(
      "data:"
    ) ||
    value.startsWith(
      "blob:"
    )
  ) {
    return value;
  }

  if (
    value.startsWith("/")
  ) {
    return `${BACKEND_URL}${value}`;
  }

  return `${BACKEND_URL}/uploads/profile/${encodeURIComponent(
    value
  )}`;
};

/* =========================
   FULL NAME
========================= */

const getFullName = (
  profile
) => {
  const firstName =
    toText(
      profile?.first_name ??
        profile?.firstName,
      ""
    );

  const lastName =
    toText(
      profile?.last_name ??
        profile?.lastName,
      ""
    );

  return (
    `${firstName} ${lastName}`.trim() ||
    toText(
      profile?.login_id,
      "INMBA Member"
    )
  );
};

/* =========================
   INITIALS
========================= */

const getInitials = (
  profile
) => {
  const firstName =
    toText(
      profile?.first_name,
      ""
    );

  const lastName =
    toText(
      profile?.last_name,
      ""
    );

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`
      .toUpperCase();

  return (
    initials ||
    "IM"
  );
};

/* =========================
   ADDRESS BUILDER
========================= */

const getAddress = (
  profile
) => {
  const addressParts = [
    profile?.entity_house_no,
    profile?.entity_street,
    profile?.entity_area,
    profile?.entity_city ??
      profile?.city,
    profile?.entity_district ??
      profile?.district,
    profile?.entity_state ??
      profile?.state,
    profile?.entity_pincode ??
      profile?.pincode,
    profile?.country,
  ]
    .map(
      (
        item
      ) =>
        toText(
          item,
          ""
        )
    )
    .filter(Boolean);

  if (
    addressParts.length >
    0
  ) {
    return addressParts.join(
      ", "
    );
  }

  return toText(
    profile?.address,
    "Not provided"
  );
};

/* =========================
   SKILLS PARSER
========================= */

const parseSkills = (
  value
) => {
  if (
    Array.isArray(value)
  ) {
    return value
      .map(
        (
          item
        ) =>
          toText(
            item,
            ""
          )
      )
      .filter(Boolean);
  }

  const normalizedValue =
    toText(
      value,
      ""
    );

  if (!normalizedValue) {
    return [];
  }

  try {
    const parsedValue =
      JSON.parse(
        normalizedValue
      );

    if (
      Array.isArray(
        parsedValue
      )
    ) {
      return parsedValue
        .map(
          (
            item
          ) =>
            toText(
              item,
              ""
            )
        )
        .filter(Boolean);
    }
  } catch {
    // Normal comma-separated value.
  }

  return normalizedValue
    .split(
      /[,|\n]/
    )
    .map(
      (
        item
      ) =>
        item.trim()
    )
    .filter(Boolean);
};

/* =========================
   URL NORMALIZER
========================= */

const normalizeExternalUrl = (
  value
) => {
  const url =
    toText(
      value,
      ""
    );

  if (!url) {
    return "";
  }

  if (
    url.startsWith(
      "http://"
    ) ||
    url.startsWith(
      "https://"
    )
  ) {
    return url;
  }

  return `https://${url}`;
};

/* =========================
   SOCIAL LINKS
========================= */

const getSocialLinks = (
  profile
) => {
  const links = [
    {
      key: "linkedin",
      label: "LinkedIn",
      icon: "fab fa-linkedin-in",
      value:
        profile?.social_linkedin,
    },
    {
      key: "instagram",
      label: "Instagram",
      icon: "fab fa-instagram",
      value:
        profile?.social_instagram,
    },
    {
      key: "facebook",
      label: "Facebook",
      icon: "fab fa-facebook-f",
      value:
        profile?.social_facebook,
    },
    {
      key: "twitter",
      label: "Twitter / X",
      icon: "fab fa-x-twitter",
      value:
        profile?.social_twitter,
    },
    {
      key: "youtube",
      label: "YouTube",
      icon: "fab fa-youtube",
      value:
        profile?.social_youtube,
    },
    {
      key: "website",
      label: "Website",
      icon: "fas fa-globe",
      value:
        profile?.social_link,
    },
  ];

  return links
    .map(
      (
        item
      ) => ({
        ...item,

        value:
          normalizeExternalUrl(
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
};

/* =========================
   PAYMENT STATUS
========================= */

const getMemberStatus = (
  profile
) => {
  const paymentStatus =
    toText(
      profile?.payment_status ??
        profile?.paymentStatus,
      "pending"
    ).toLowerCase();

  const isVerified =
    paymentStatus ===
      "approved" ||
    paymentStatus ===
      "paid";

  return {
    value:
      isVerified
        ? "verified"
        : paymentStatus,

    label:
      isVerified
        ? "Verified Member"
        : paymentStatus ===
          "rejected"
        ? "Verification Rejected"
        : "Verification Pending",

    verified:
      isVerified,
  };
};

/* =========================
   COPY HELPER
========================= */

const copyToClipboard =
  async (
    value
  ) => {
    const text =
      toText(
        value,
        ""
      );

    if (!text) {
      throw new Error(
        "No content to copy."
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

    const textArea =
      document.createElement(
        "textarea"
      );

    textArea.value =
      text;

    textArea.style.position =
      "fixed";

    textArea.style.opacity =
      "0";

    document.body.appendChild(
      textArea
    );

    textArea.focus();
    textArea.select();

    const copied =
      document.execCommand(
        "copy"
      );

    document.body.removeChild(
      textArea
    );

    if (!copied) {
      throw new Error(
        "Unable to copy."
      );
    }
  };

/* =========================
   PROFILE INFO ITEM
========================= */

function PublicProfileInfo({
  icon,
  label,
  value,
  full = false,
}) {
  return (
    <div
      className={`inmba-public-profile-info ${
        full
          ? "inmba-public-profile-info-full"
          : ""
      }`}
    >
      <div className="inmba-public-profile-info-icon">
        <i
          className={icon}
          aria-hidden="true"
        ></i>
      </div>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {toText(
            value,
            "Not provided"
          )}
        </strong>
      </div>
    </div>
  );
}

/* =========================
   PROFILE SECTION
========================= */

function PublicProfileSection({
  icon,
  title,
  subtitle,
  children,
}) {
  return (
    <section className="inmba-public-profile-card">
      <header className="inmba-public-profile-card-header">
        <div className="inmba-public-profile-card-icon">
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

      <div className="inmba-public-profile-card-content">
        {children}
      </div>
    </section>
  );
}

/* =========================
   PUBLIC PROFILE PAGE
========================= */

export default function PublicProfile() {
  const {
    loginId,
  } =
    useParams();

  const {
    member:
      loggedInMember,
  } =
    useAuth();

  const [
    profile,
    setProfile,
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

  /* =========================
     LOAD PUBLIC PROFILE

     GET:
     /api/public/user/:loginId
  ========================= */

  const loadPublicProfile =
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
            await getPublicMemberProfile(
              loginId,
              {
                signal,
              }
            );

          const memberProfile =
            asObject(
              result.profile
            );

          if (
            Object.keys(
              memberProfile
            ).length ===
            0
          ) {
            throw new Error(
              "Member profile not found."
            );
          }

          setProfile(
            memberProfile
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

          console.error(
            "Public Profile API Error:",
            requestError
          );

          setProfile(
            null
          );

          const statusCode =
            Number(
              requestError?.response?.status ||
                requestError?.statusCode ||
                0
            );

          if (
            statusCode ===
            404
          ) {
            setError(
              "The requested INMBA member profile could not be found."
            );

            return;
          }

          setError(
            getApiErrorMessage(
              requestError,
              "Unable to load this public profile."
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
        loginId,
      ]
    );

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadPublicProfile({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadPublicProfile,
    ]
  );

  /* =========================
     PROFILE VALUES
  ========================= */

  const fullName =
    useMemo(
      () =>
        getFullName(
          profile
        ),
      [
        profile,
      ]
    );

  const initials =
    useMemo(
      () =>
        getInitials(
          profile
        ),
      [
        profile,
      ]
    );

  const profilePhoto =
    useMemo(
      () =>
        getProfilePhotoUrl(
          profile
        ),
      [
        profile,
      ]
    );

  const address =
    useMemo(
      () =>
        getAddress(
          profile
        ),
      [
        profile,
      ]
    );

  const skills =
    useMemo(
      () =>
        parseSkills(
          profile?.skills
        ),
      [
        profile?.skills,
      ]
    );

  const socialLinks =
    useMemo(
      () =>
        getSocialLinks(
          profile
        ),
      [
        profile,
      ]
    );

  const memberStatus =
    useMemo(
      () =>
        getMemberStatus(
          profile
        ),
      [
        profile,
      ]
    );

  const profileLoginId =
    toText(
      profile?.login_id ??
        profile?.loginId,
      ""
    );

  const isOwner =
    Boolean(
      loggedInMember &&
        profileLoginId &&
        String(
          loggedInMember.login_id ??
            loggedInMember.loginId ??
            ""
        ) ===
          String(
            profileLoginId
          )
    );

  const referralId =
    toText(
      profile?.referral_id,
      ""
    );

  const referralLink =
    referralId
      ? `${window.location.origin}/membership?ref=${encodeURIComponent(
          referralId
        )}`
      : "";

  const profileUrl =
    window.location.href;

  /* =========================
     COPY LOGIN ID
  ========================= */

  const handleCopyLoginId =
    async () => {
      try {
        await copyToClipboard(
          profileLoginId
        );

        toast.success(
          "Login ID copied."
        );
      } catch {
        toast.error(
          "Unable to copy Login ID."
        );
      }
    };

  /* =========================
     COPY REFERRAL LINK
  ========================= */

  const handleCopyReferral =
    async () => {
      try {
        await copyToClipboard(
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
              `View ${fullName}'s INMBA public profile.`,

            url:
              profileUrl,
          });

          return;
        }

        await copyToClipboard(
          profileUrl
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
     LOADING STATE
  ========================= */

  if (loading) {
    return (
      <main className="inmba-public-profile-page">
        <div className="inmba-public-profile-state">
          <div
            className="spinner-border"
            role="status"
            aria-label="Loading public profile"
          ></div>

          <h1>
            Loading Member Profile
          </h1>

          <p>
            Please wait while we load the INMBA member information.
          </p>
        </div>
      </main>
    );
  }

  /* =========================
     ERROR STATE
  ========================= */

  if (
    error ||
    !profile
  ) {
    return (
      <main className="inmba-public-profile-page">
        <div className="inmba-public-profile-state inmba-public-profile-error">
          <div className="inmba-public-profile-state-icon">
            <i
              className="fas fa-user-slash"
              aria-hidden="true"
            ></i>
          </div>

          <h1>
            Member Not Found
          </h1>

          <p>
            {error ||
              "The requested member profile is unavailable."}
          </p>

          <div className="inmba-public-profile-state-actions">
            <Link
              to="/"
              className="inmba-public-profile-primary-button"
            >
              <i
                className="fas fa-house"
                aria-hidden="true"
              ></i>

              Go to Home
            </Link>

            <button
              type="button"
              className="inmba-public-profile-secondary-button"
              onClick={() =>
                loadPublicProfile()
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
    <main className="inmba-public-profile-page">
      <div className="inmba-public-profile-container">
        {/* =====================
            PROFILE HERO
        ===================== */}

        <section className="inmba-public-profile-hero">
          <div className="inmba-public-profile-cover">
            <div className="inmba-public-profile-brand">
              <span className="inmba-public-profile-brand-icon">
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
                  Public Member Profile
                </span>
              </div>
            </div>

            <button
              type="button"
              className="inmba-public-profile-share-button"
              onClick={
                handleShareProfile
              }
            >
              <i
                className="fas fa-share-nodes"
                aria-hidden="true"
              ></i>

              Share Profile
            </button>
          </div>

          <div className="inmba-public-profile-hero-body">
            <div className="inmba-public-profile-avatar-wrapper">
              <div className="inmba-public-profile-avatar">
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
                    {
                      initials
                    }
                  </span>
                )}
              </div>

              <span
                className={`inmba-public-profile-verification inmba-public-profile-verification-${memberStatus.value}`}
              >
                <i
                  className={
                    memberStatus.verified
                      ? "fas fa-circle-check"
                      : "fas fa-clock"
                  }
                  aria-hidden="true"
                ></i>

                {
                  memberStatus.label
                }
              </span>
            </div>

            <div className="inmba-public-profile-main-details">
              <p className="inmba-public-profile-membership">
                {toText(
                  profile.membership_type,
                  "INMBA"
                )}{" "}
                Member
              </p>

              <h1>
                {fullName}
              </h1>

              <p className="inmba-public-profile-role">
                <i
                  className="fas fa-briefcase"
                  aria-hidden="true"
                ></i>

                {toText(
                  profile.occupation ??
                    profile.profession,
                  "INMBA Member"
                )}
              </p>

              <p className="inmba-public-profile-bio">
                {toText(
                  profile.bio,
                  "An active member of the INMBA community."
                )}
              </p>

              <div className="inmba-public-profile-quick-details">
                <span>
                  <i
                    className="fas fa-location-dot"
                    aria-hidden="true"
                  ></i>

                  {toText(
                    profile.entity_city ??
                      profile.city ??
                      profile.district,
                    "India"
                  )}
                </span>

                <span>
                  <i
                    className="fas fa-calendar-check"
                    aria-hidden="true"
                  ></i>

                  Member since{" "}
                  {formatDate(
                    profile.created_at,
                    "Not available"
                  )}
                </span>
              </div>

              <div className="inmba-public-profile-actions">
                {isOwner && (
                  <Link
                    to="/profile/edit"
                    className="inmba-public-profile-primary-button"
                  >
                    <i
                      className="fas fa-user-pen"
                      aria-hidden="true"
                    ></i>

                    Edit My Profile
                  </Link>
                )}

                <button
                  type="button"
                  className="inmba-public-profile-secondary-button"
                  onClick={
                    handleCopyLoginId
                  }
                >
                  <i
                    className="fas fa-copy"
                    aria-hidden="true"
                  ></i>

                  Copy Login ID
                </button>
              </div>
            </div>

            <aside className="inmba-public-profile-id-card">
              <span>
                INMBA LOGIN ID
              </span>

              <strong>
                {profileLoginId ||
                  "Not available"}
              </strong>

              <div>
                <i
                  className="fas fa-shield-halved"
                  aria-hidden="true"
                ></i>

                Official Member Profile
              </div>
            </aside>
          </div>
        </section>

        {/* =====================
            SUMMARY CARDS
        ===================== */}

        <section className="inmba-public-profile-summary-grid">
          <article>
            <div>
              <i
                className="fas fa-user-group"
                aria-hidden="true"
              ></i>
            </div>

            <span>
              Direct Network
            </span>

            <strong>
              {Number(
                profile.direct_network ??
                  0
              )}
            </strong>
          </article>

          <article>
            <div>
              <i
                className="fas fa-people-arrows"
                aria-hidden="true"
              ></i>
            </div>

            <span>
              Indirect Network
            </span>

            <strong>
              {Number(
                profile.indirect_network ??
                  0
              )}
            </strong>
          </article>

          <article>
            <div>
              <i
                className="fas fa-graduation-cap"
                aria-hidden="true"
              ></i>
            </div>

            <span>
              Qualification
            </span>

            <strong className="inmba-public-profile-summary-text">
              {toText(
                profile.educational_qualification ??
                  profile.education,
                "Not provided"
              )}
            </strong>
          </article>

          <article>
            <div>
              <i
                className="fas fa-location-dot"
                aria-hidden="true"
              ></i>
            </div>

            <span>
              District
            </span>

            <strong className="inmba-public-profile-summary-text">
              {toText(
                profile.entity_district ??
                  profile.district,
                "Not provided"
              )}
            </strong>
          </article>
        </section>

        {/* =====================
            PROFILE CONTENT
        ===================== */}

        <div className="inmba-public-profile-grid">
          <PublicProfileSection
            icon="fas fa-user"
            title="Personal Information"
            subtitle="Member personal details"
          >
            <div className="inmba-public-profile-info-grid">
              <PublicProfileInfo
                icon="fas fa-user"
                label="Full Name"
                value={
                  fullName
                }
              />

              <PublicProfileInfo
                icon="fas fa-person"
                label="Father Name"
                value={
                  profile.father_name
                }
              />

              <PublicProfileInfo
                icon="fas fa-cake-candles"
                label="Date of Birth"
                value={
                  formatDate(
                    profile.dob
                  )
                }
              />

              <PublicProfileInfo
                icon="fas fa-venus-mars"
                label="Gender"
                value={
                  profile.gender
                }
              />

              <PublicProfileInfo
                icon="fas fa-ring"
                label="Marital Status"
                value={
                  profile.marital_status
                }
              />

              <PublicProfileInfo
                icon="fas fa-flag"
                label="Nationality"
                value={
                  profile.nationality
                }
              />
            </div>
          </PublicProfileSection>

          <PublicProfileSection
            icon="fas fa-address-book"
            title="Contact Information"
            subtitle="Member communication details"
          >
            <div className="inmba-public-profile-info-grid">
              <PublicProfileInfo
                icon="fas fa-envelope"
                label="Email"
                value={
                  profile.email
                }
              />

              <PublicProfileInfo
                icon="fas fa-phone"
                label="Phone"
                value={
                  profile.phone
                }
              />

              <PublicProfileInfo
                icon="fab fa-whatsapp"
                label="WhatsApp"
                value={
                  profile.whatsapp_number
                }
              />

              <PublicProfileInfo
                icon="fas fa-id-card"
                label="Login ID"
                value={
                  profileLoginId
                }
              />
            </div>
          </PublicProfileSection>

          <PublicProfileSection
            icon="fas fa-location-dot"
            title="Address"
            subtitle="Member location information"
          >
            <div className="inmba-public-profile-info-grid">
              <PublicProfileInfo
                icon="fas fa-map-location-dot"
                label="Complete Address"
                value={
                  address
                }
                full
              />

              <PublicProfileInfo
                icon="fas fa-city"
                label="City"
                value={
                  profile.entity_city ??
                    profile.city
                }
              />

              <PublicProfileInfo
                icon="fas fa-map"
                label="District"
                value={
                  profile.entity_district ??
                    profile.district
                }
              />

              <PublicProfileInfo
                icon="fas fa-location-crosshairs"
                label="Pincode"
                value={
                  profile.entity_pincode ??
                    profile.pincode
                }
              />
            </div>
          </PublicProfileSection>

          <PublicProfileSection
            icon="fas fa-briefcase"
            title="Professional Information"
            subtitle="Education and career details"
          >
            <div className="inmba-public-profile-info-grid">
              <PublicProfileInfo
                icon="fas fa-briefcase"
                label="Occupation"
                value={
                  profile.occupation ??
                    profile.profession
                }
              />

              <PublicProfileInfo
                icon="fas fa-graduation-cap"
                label="Education"
                value={
                  profile.education
                }
              />

              <PublicProfileInfo
                icon="fas fa-certificate"
                label="Qualification"
                value={
                  profile.educational_qualification
                }
              />

              <PublicProfileInfo
                icon="fas fa-school"
                label="Institution"
                value={
                  profile.ug_college ??
                    profile.pg_college ??
                    profile.school_name
                }
              />
            </div>
          </PublicProfileSection>
        </div>

        {/* =====================
            SKILLS
        ===================== */}

        <PublicProfileSection
          icon="fas fa-lightbulb"
          title="Skills"
          subtitle="Professional skills and abilities"
        >
          {skills.length >
          0 ? (
            <div className="inmba-public-profile-skills">
              {skills.map(
                (
                  skill,
                  index
                ) => (
                  <span
                    key={`${skill}-${index}`}
                  >
                    <i
                      className="fas fa-check"
                      aria-hidden="true"
                    ></i>

                    {
                      skill
                    }
                  </span>
                )
              )}
            </div>
          ) : (
            <div className="inmba-public-profile-empty">
              <i
                className="fas fa-lightbulb"
                aria-hidden="true"
              ></i>

              <p>
                No skills have been added.
              </p>
            </div>
          )}
        </PublicProfileSection>

        {/* =====================
            SOCIAL LINKS
        ===================== */}

        {socialLinks.length >
          0 && (
          <PublicProfileSection
            icon="fas fa-share-nodes"
            title="Social Profiles"
            subtitle="Connect with this member online"
          >
            <div className="inmba-public-profile-social-grid">
              {socialLinks.map(
                (
                  social
                ) => (
                  <a
                    key={
                      social.key
                    }
                    href={
                      social.value
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>
                      <i
                        className={
                          social.icon
                        }
                        aria-hidden="true"
                      ></i>
                    </span>

                    <strong>
                      {
                        social.label
                      }
                    </strong>

                    <i
                      className="fas fa-arrow-up-right-from-square"
                      aria-hidden="true"
                    ></i>
                  </a>
                )
              )}
            </div>
          </PublicProfileSection>
        )}

        {/* =====================
            REFERRAL SECTION
        ===================== */}

        <section className="inmba-public-profile-referral">
          <div className="inmba-public-profile-referral-content">
            <span className="inmba-public-profile-referral-icon">
              <i
                className="fas fa-gift"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <p>
                Join the INMBA Network
              </p>

              <h2>
                Connect through {fullName}
              </h2>

              <span>
                Use this member's referral information to join the
                INMBA community.
              </span>
            </div>
          </div>

          <div className="inmba-public-profile-referral-details">
            <div>
              <span>
                Referral ID
              </span>

              <strong>
                {referralId ||
                  "Not assigned"}
              </strong>
            </div>

            {referralLink && (
              <button
                type="button"
                onClick={
                  handleCopyReferral
                }
              >
                <i
                  className="fas fa-copy"
                  aria-hidden="true"
                ></i>

                Copy Referral Link
              </button>
            )}
          </div>
        </section>

        <footer className="inmba-public-profile-footer">
          <div>
            <i
              className="fas fa-shield-halved"
              aria-hidden="true"
            ></i>

            <span>
              This is an official INMBA public member profile.
            </span>
          </div>

          <Link to="/">
            Visit INMBA Website
          </Link>
        </footer>
      </div>
    </main>
  );
}