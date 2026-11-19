import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Avatar,
  Banner,
  EyeOff,
  EyeOpen,
  Section,
  SocialGrid,
} from "./Shared";

import {
  burst,
  showToast,
} from "./helpers";
import { toText, asObject } from "../../utils/commonHelpers";
import { getMembershipTitle } from "../../utils/membershipTitle";
import ProfileHeroReferralBar from "../../components/common/ProfileHeroReferralBar";

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   OBJECT
========================================================= */

/* =========================================================
   ARRAY
========================================================= */

const toArray = (
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

          return item;
        }
      )
      .filter(
        Boolean
      );
  }

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  if (
    typeof value ===
    "string"
  ) {
    const text =
      value.trim();

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
        return parsed;
      }
    } catch {
      /*
        Existing DB may use:
        comma / pipe / newline text.
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
  }

  return [];
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

const isProfessionalProfile = (
  profile
) => {
  const source =
    asObject(
      profile
    );

  const membershipType =
    normalizeMembershipType(
      source.membership_type
    );

  const profileType =
    normalizeMembershipType(
      source.profile_type
    );

  return (
    [
      "professional",
      "professional member",
      "professional membership",
    ].includes(
      membershipType
    ) ||
    profileType ===
      "professional"
  );
};

/* =========================================================
   LIST DISPLAY
========================================================= */

const listDisplayValue = (
  value
) => {
  const values =
    toArray(
      value
    );

  if (
    values.length ===
    0
  ) {
    return "";
  }

  return values
    .map(
      (
        item
      ) => {
        if (
          typeof item ===
          "string"
        ) {
          return item;
        }

        const source =
          asObject(
            item
          );

        return toText(
          source.label ??
          source.name ??
          source.title ??
          source.url ??
          source.path
        );
      }
    )
    .filter(
      Boolean
    )
    .join(
      ", "
    );
};

/* =========================================================
   INITIALS

   Professional Public Profile:
   NEVER derive initials from legal first / last name.

   Use:
   Display Name
   Username
========================================================= */

function initialsOf(
  profile = {}
) {
  if (
    isProfessionalProfile(
      profile
    )
  ) {
    const displayName =
      toText(
        profile.display_name
      );

    const username =
      toText(
        profile.username
      ).replace(
        /^@/,
        ""
      );

    const source =
      displayName ||
      username ||
      "IN";

    const words =
      source
        .split(
          /\s+/
        )
        .filter(
          Boolean
        );

    if (
      words.length >=
      2
    ) {
      return `${words[0].charAt(
        0
      )}${words[1].charAt(
        0
      )}`.toUpperCase();
    }

    return source
      .slice(
        0,
        2
      )
      .toUpperCase();
  }

  const firstName =
    toText(
      profile.first_name
    );

  const lastName =
    toText(
      profile.last_name
    );

  if (
    !firstName &&
    !lastName
  ) {
    return "IN";
  }

  return `${firstName.charAt(
    0
  )}${lastName.charAt(
    0
  )}`.toUpperCase();
}

/* =========================================================
   FULL NAME

   Professional public profile:
   Display Name only.

   Legal name must never be reconstructed.
========================================================= */

function fullName(
  profile = {}
) {
  if (
    isProfessionalProfile(
      profile
    )
  ) {
    return toText(
      profile.display_name ??
      profile.username,
      "INMBA Professional"
    );
  }

  const name =
    [
      toText(
        profile.first_name
      ),

      toText(
        profile.last_name
      ),
    ]
      .filter(
        Boolean
      )
      .join(
        " "
      );

  return (
    name ||
    toText(
      profile.login_id,
      "INMBA Member"
    )
  );
}

/* =========================================================
   SOCIAL LINKS
========================================================= */

function socialItemsOf(
  profile = {}
) {
  const items = [];

  const addSocial = (
    label,
    value,
    icon,
    color
  ) => {
    const url =
      toText(
        value
      );

    if (
      !url
    ) {
      return;
    }

    items.push({
      label,

      handle:
        url,

      icon,

      color,

      url:
        url.startsWith(
          "http://"
        ) ||
        url.startsWith(
          "https://"
        )
          ? url
          : `https://${url}`,
    });
  };

  addSocial(
    "Instagram",
    profile.social_instagram,
    "ig",
    "#e1306c"
  );

  addSocial(
    "LinkedIn",
    profile.social_linkedin,
    "in",
    "#0077b5"
  );

  addSocial(
    "Twitter / X",
    profile.social_twitter,
    "x",
    "#111111"
  );

  addSocial(
    "Facebook",
    profile.social_facebook,
    "fb",
    "#1877f2"
  );

  addSocial(
    "YouTube",
    profile.social_youtube,
    "yt",
    "#ff0000"
  );

  const genericLinks =
    toArray(
      profile.social_links ??
      profile.social_link
    );

  genericLinks.forEach(
    (
      value,
      index
    ) => {
      const url =
        toText(
          value
        );

      if (
        !url
      ) {
        return;
      }

      const duplicate =
        items.some(
          (
            item
          ) =>
            item.handle ===
            url
        );

      if (
        duplicate
      ) {
        return;
      }

      items.push({
        label:
          `Social Link ${
            index + 1
          }`,

        handle:
          url,

        icon:
          "🔗",

        color:
          "#16a34a",

        url:
          url.startsWith(
            "http://"
          ) ||
          url.startsWith(
            "https://"
          )
            ? url
            : `https://${url}`,
      });
    }
  );

  const portfolioUrl =
    toText(
      profile.portfolio_url
    );

  if (
    portfolioUrl
  ) {
    items.push({
      label:
        "Portfolio",

      handle:
        portfolioUrl,

      icon:
        "🌐",

      color:
        "#15803d",

      url:
        portfolioUrl.startsWith(
          "http://"
        ) ||
        portfolioUrl.startsWith(
          "https://"
        )
          ? portfolioUrl
          : `https://${portfolioUrl}`,
    });
  }

  return items;
}

/* =========================================================
   EDITABLE GRID

   NON-PROFESSIONAL EXISTING UI
========================================================= */

function EditableGrid({
  rows = [],
  editing = false,
  draft = {},
  onChange,
}) {
  return (
    <div className="fg">
      {rows.map(
        (
          {
            label,
            field,
            full,
            value,
            readOnly = false,
            type = "text",
          },
          index
        ) => (
          <div
            key={`${field}-${index}`}
            className={
              "fc" +
              (
                full
                  ? " fg-full"
                  : ""
              )
            }
            style={{
              animationDelay:
                `${index * 0.06}s`,
            }}
          >
            <div className="flbl">
              {label}
            </div>

            {editing &&
            !readOnly ? (
              <input
                className="fval-input"
                type={
                  type
                }
                value={
                  draft[
                    field
                  ] ??
                  ""
                }
                placeholder={`Enter ${label.toLowerCase()}`}
                onChange={(
                  event
                ) =>
                  onChange?.(
                    field,
                    event.target.value
                  )
                }
              />
            ) : (
              <div className="fval">
                {toText(
                  value,
                  "—"
                )}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

/* =========================================================
   PROFESSIONAL PUBLIC FIELD GRID

   status:

   public
   private
   optional-private

   PRIVATE VALUES ARE NEVER READ FROM profile.
========================================================= */

function ProfessionalPublicGrid({
  rows = [],
}) {
  return (
    <div className="fg">
      {rows.map(
        (
          row,
          index
        ) => {
          const status =
            row.status ||
            "public";

          const full =
            Boolean(
              row.full
            );

          let displayValue =
            "";

          let locked =
            false;

          if (row.value !== undefined && row.value !== null && String(row.value).trim() !== "") {
            displayValue = toText(row.value);
            locked = false;
          } else if (
            status ===
            "private"
          ) {
            locked =
              true;

            displayValue =
              "Not Provided";
          } else if (
            status ===
            "optional-private"
          ) {
            locked =
              true;

            displayValue =
              "Not Provided";
          } else {
            displayValue =
              toText(
                row.value,
                "Not Provided"
              );
          }

          return (
            <div
              key={`${row.label}-${index}`}
              className={
                "fc" +
                (
                  full
                    ? " fg-full"
                    : ""
                )
              }
              style={{
                animationDelay:
                  `${index * 0.045}s`,
              }}
            >
              <div className="flbl">
                {row.label}
              </div>

              <div
                className="fval"
                style={
                  locked
                    ? {
                        display:
                          "flex",

                        alignItems:
                          "center",

                        gap:
                          "7px",

                        color:
                          "#64748b",

                        fontWeight:
                          600,
                      }
                    : undefined
                }
              >
                {locked && (
                  <span
                    aria-hidden="true"
                  >
                    🔒
                  </span>
                )}

                <span>
                  {displayValue}
                </span>
              </div>
            </div>
          );
        }
      )}
    </div>
  );
}

/* =========================================================
   PROFESSIONAL OPTIONAL FIELD

   Public opt-in:
   actual public value

   No opt-in:
   Private by Member
========================================================= */

const optionalPublicStatus = (
  enabled
) => {
  return enabled
    ? "public"
    : "optional-private";
};

/* =========================================================
   REFERRAL LINK

   NON-PROFESSIONAL ONLY
========================================================= */

function ReferralLinkCard({
  profile,
}) {
  const referralId =
    toText(
      profile?.referral_id
    );

  const referralLink =
    useMemo(
      () => {
        if (
          !referralId
        ) {
          return "";
        }

        if (
          typeof window ===
          "undefined"
        ) {
          return "";
        }

        return `${window.location.origin}/membership?ref=${encodeURIComponent(
          referralId
        )}`;
      },
      [
        referralId,
      ]
    );

  const copyReferral =
    async () => {
      if (
        !referralLink
      ) {
        return;
      }

      try {
        if (
          navigator.clipboard &&
          window.isSecureContext
        ) {
          await navigator.clipboard
            .writeText(
              referralLink
            );
        } else {
          const textarea =
            document.createElement(
              "textarea"
            );

          textarea.value =
            referralLink;

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
        }

        showToast(
          "✅ Referral link copied"
        );
      } catch {
        showToast(
          "Unable to copy referral link"
        );
      }
    };

  const copyCode = async () => {
    if (!referralId) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralId);
      }
      showToast("Referral code copied");
    } catch {
      showToast("Unable to copy referral code");
    }
  };

  return (
    <div className="ref-link-only">
      <div className="ref-label">
        Referral Code
      </div>

      <div className="ref-link-row" style={{ marginBottom: "8px" }}>
        <span className="ref-link-text" style={{ fontWeight: 700 }}>
          {referralId || "Not yet assigned"}
        </span>

        {referralId && (
          <button
            type="button"
            className="ref-copy-btn"
            onClick={copyCode}
          >
            Copy Code
          </button>
        )}
      </div>

      <div className="ref-label">
        Referral Link
      </div>

      <div className="ref-link-row">
        <span className="ref-link-text">
          {referralLink || "Not yet assigned"}
        </span>

        {referralLink && (
          <button
            type="button"
            className="ref-copy-btn"
            onClick={copyReferral}
          >
            Copy Link
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   REFERRAL GRID

   NON-PROFESSIONAL ONLY
========================================================= */

function ReferralGrid({
  profile,
}) {
  return (
    <div className="ref-grid">
      <div className="ref-item">
        <div className="ref-label">
          Email
        </div>

        <div className="ref-value">
          {toText(
            profile?.email,
            "—"
          )}
        </div>
      </div>

      <div className="ref-item">
        <div className="ref-label">
          Referral ID
        </div>

        <div className="ref-value">
          {toText(
            profile?.referral_id,
            "Not assigned"
          )}
        </div>
      </div>

      <div className="ref-item">
        <div className="ref-label">
          Login ID
        </div>

        <div className="ref-value">
          {toText(
            profile?.login_id,
            "—"
          )}
        </div>
      </div>

      <div className="ref-item">
        <div className="ref-label">
          Mobile
        </div>

        <div className="ref-value">
          {toText(
            profile?.phone ??
            profile?.whatsapp_number ??
            profile?.contact_number,
            "—"
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   REFERRAL CARD

   NON-PROFESSIONAL ONLY
========================================================= */

function ReferralCard({
  profile,
}) {
  const [
    hidden,
    setHidden,
  ] =
    useState(
      false
    );

  const toggleHide = (
    event
  ) => {
    event.stopPropagation();

    const next =
      !hidden;

    setHidden(
      next
    );

    burst(
      event.clientX,
      event.clientY,
      next
        ? 9
        : 6
    );

    showToast(
      next
        ? "🔒 Referral details hidden"
        : "👁 Referral details revealed"
    );
  };

  return (
    <div className="ref-card">
      <div className="ref-title-row">
        <div className="ref-title">
          🎁 Referral Program
        </div>

        <button
          type="button"
          className={
            "eye-btn" +
            (
              hidden
                ? " is-hidden"
                : ""
            )
          }
          onClick={
            toggleHide
          }
          title={
            hidden
              ? "Reveal"
              : "Hide"
          }
        >
          {hidden ? (
            <EyeOff />
          ) : (
            <EyeOpen />
          )}
        </button>
      </div>

      {hidden ? (
        <div className="hidden-wrap">
          <div className="blur-layer">
            <ReferralGrid
              profile={
                profile
              }
            />
          </div>

          <div className="locked-msg">
            <span className="lock-icon">
              🔐
            </span>

            <span>
              Hidden from profile view
            </span>
          </div>
        </div>
      ) : (
        <ReferralGrid
          profile={
            profile
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   PROFESSIONAL PUBLIC HERO
========================================================= */

function ProfessionalPublicHero({
  profile,
  avRef,
  onAvatarOpen,
}) {
  const displayName =
    toText(
      profile.display_name,
      "INMBA Professional"
    );

  const username =
    toText(
      profile.username
    );

  const occupation =
    toText(
      profile.occupation,
      "INMBA Professional"
    );

  const location =
    [
      toText(
        profile.district
      ),

      toText(
        profile.state
      ),

      toText(
        profile.pincode
      ),
    ]
      .filter(
        Boolean
      )
      .join(
        " · "
      );

  return (
    <div className="hero page-enter">
      <div className="hero-banner">
        <Banner />
      </div>

      <div className="hero-body">
        <Avatar
          onOpen={
            onAvatarOpen
          }
          wrapRef={
            avRef
          }
          initials={
            initialsOf(
              profile
            )
          }
        />

        <div className="spill">
          <span className="sdot" />

          {getMembershipTitle(profile, "INMBA Professional Member")}
        </div>

        <div className="h-name">
          {displayName}
        </div>

        <ProfileHeroReferralBar
          referralCode={toText(profile?.referral_id)}
          referralLink={toText(profile?.referral_id) && typeof window !== "undefined" ? `${window.location.origin}/membership?ref=${encodeURIComponent(toText(profile?.referral_id))}` : ""}
          copied={""}
          onCopy={async (kind, val) => {
            if (!val) return;
            try {
              if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(val);
              }
              showToast(kind === "hero-code" ? "Referral code copied" : "Referral link copied");
            } catch {}
          }}
        />

        {username && (
          <div
            style={{
              color:
                "#15803d",

              fontWeight:
                700,

              marginBottom:
                "7px",

              fontSize:
                "0.9rem",
            }}
          >
            {username}
          </div>
        )}

        <div className="h-role">
          {occupation}
        </div>

        {toText(
          profile.professional_bio ??
          profile.bio
        ) && (
          <div
            className="h-tag"
            style={{
              marginTop:
                "8px",
            }}
          >
            {toText(
              profile.professional_bio ??
              profile.bio
            )}
          </div>
        )}

        <div className="h-meta">
          {location && (
            <span className="h-chip">
              📍 {location}
            </span>
          )}

          {profile.kyc_verified && (
            <span className="h-chip">
              ✅ KYC Verified
            </span>
          )}

          {profile.network_level && (
            <span className="h-chip">
              🏅{" "}
              {
                profile.network_level
              }
            </span>
          )}

          {profile.availability_status && (
            <span className="h-chip">
              🟢{" "}
              {
                profile.availability_status
              }
            </span>
          )}
        </div>

        <div
          className="member-status-card"
          style={{
            marginTop:
              "18px",
          }}
        >
          <div className="member-status-label">
            Profile Visibility
          </div>

          <div className="member-status-value">
            Public Professional Profile
          </div>
        </div>

        {toText(profile?.referral_id) && (
          <ReferralLinkCard profile={profile} />
        )}
      </div>
    </div>
  );
}

/* =========================================================
   NORMAL / NON-PROFESSIONAL HERO
========================================================= */

function PublicProfilePage({
  profile,
  avRef,
  onAvatarOpen,
  isOwner,
  editing,
  onEditToggle,
  publicViewOnly,
}) {
  if (
    isProfessionalProfile(
      profile
    )
  ) {
    return (
      <ProfessionalPublicHero
        profile={
          profile
        }
        avRef={
          avRef
        }
        onAvatarOpen={
          onAvatarOpen
        }
      />
    );
  }

  const membershipType =
    toText(
      profile?.membership_type,
      "Member"
    );

  return (
    <div className="hero page-enter">
      <div className="hero-banner">
        <Banner />
      </div>

      <div className="hero-body">
        <div
          style={{
            display:
              "flex",

            justifyContent:
              "space-between",

            alignItems:
              "flex-start",

            gap:
              "12px",

            flexWrap:
              "wrap",
          }}
        >
          <Avatar
            onOpen={
              onAvatarOpen
            }
            wrapRef={
              avRef
            }
            initials={
              initialsOf(
                profile
              )
            }
          />

          {isOwner &&
            !publicViewOnly && (
            <button
              type="button"
              className="edit-toggle-btn"
              onClick={
                onEditToggle
              }
              style={{
                marginTop:
                  10,
              }}
            >
              {editing
                ? "✕ Cancel"
                : "✏️ Edit Profile"}
            </button>
          )}
        </div>

        <div className="spill">
          <span className="sdot" />

          {getMembershipTitle(profile, `${membershipType} Member`)}
        </div>

        <div className="h-name">
          {fullName(
            profile
          )}
        </div>

        <ProfileHeroReferralBar
          referralCode={toText(profile?.referral_id)}
          referralLink={toText(profile?.referral_id) && typeof window !== "undefined" ? `${window.location.origin}/membership?ref=${encodeURIComponent(toText(profile?.referral_id))}` : ""}
          copied={""}
          onCopy={async (kind, val) => {
            if (!val) return;
            try {
              if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(val);
              }
              showToast(kind === "hero-code" ? "Referral code copied" : "Referral link copied");
            } catch {}
          }}
        />

        {toText(
          profile
            ?.educational_qualification
        ) && (
          <div className="edu-line">
            🎓{" "}
            {
              profile
                .educational_qualification
            }

            <span className="edu-tick">
              ✅
            </span>
          </div>
        )}

        <div className="h-role">
          {toText(
            profile?.profession ??
            profile?.occupation ??
            profile
              ?.professional_role,
            "INMBA Member"
          )}
        </div>

        <div className="member-status-card">
          <div className="member-status-label">
            INMBA Status
          </div>

          <div className="member-status-value">
            {membershipType} Member
          </div>
        </div>

        <ReferralLinkCard
          profile={
            profile
          }
        />

        <ReferralCard
          profile={
            profile
          }
        />
      </div>
    </div>
  );
}

/* =========================================================
   PROFESSIONAL PUBLIC SECTIONS
========================================================= */

function ProfessionalPublicSections({
  profile,
}) {
  const social =
    socialItemsOf(
      profile
    );

  const phonePublic =
    Boolean(
      profile.phone_public
    );

  const qualificationPublic =
    Boolean(
      profile.qualification_public
    );

  const ratePublic =
    Boolean(
      profile
        .hourly_project_rate_public
    );

  const hasText = (val) => Boolean(toText(val));
  const hasList = (val) => toArray(val).length > 0;
  const adminRank = toText(profile.network_level ?? profile.network_rank ?? profile.rank, "Assigned by Admin");
  const directMembers = Number(profile.direct_network ?? profile.direct_members ?? profile.direct_members_count ?? 0);
  const totalNetwork = Number(profile.total_network ?? (directMembers + Number(profile.indirect_network ?? 0)));

  const hasSectionAData = Boolean(hasText(profile.display_name) || hasText(profile.username));
  const hasSectionBData = Boolean((phonePublic && hasText(profile.phone)) || hasText(profile.district) || hasText(profile.state) || hasText(profile.pincode));
  const hasSectionCData = Boolean(
    profile.kyc_verified ||
      profile.professional_license_badge ||
      profile.council_registration_badge ||
      profile.gst_badge
  );
  const hasSectionDData = Boolean(
    (qualificationPublic && hasText(profile.educational_qualification ?? profile.education)) ||
      hasText(profile.school_college_name) ||
      hasList(profile.additional_certifications) ||
      hasList(profile.language_skills)
  );
  const hasSectionEData = Boolean(
    hasList(profile.awards_recognitions) ||
      hasList(profile.publications) ||
      hasList(profile.professional_certifications) ||
      hasList(profile.key_milestones) ||
      hasList(profile.media_mentions) ||
      hasList(profile.reference_letters)
  );
  const hasSectionFData = Boolean(
    profile.total_experience_years != null ||
      hasList(profile.previous_employers_clients) ||
      hasList(profile.work_samples) ||
      (ratePublic && hasText(profile.hourly_project_rate)) ||
      hasText(profile.availability_status)
  );
  const hasSectionGData = Boolean(
    hasText(profile.professional_bio ?? profile.bio) ||
      hasList(profile.interest_categories) ||
      hasList(profile.skills) ||
      hasList(profile.hobbies) ||
      hasText(profile.preferred_industry) ||
      hasText(profile.cover_photo) ||
      toArray(profile.gallery_photos).length > 0 ||
      hasText(profile.intro_video) ||
      hasText(profile.portfolio_url) ||
      social.length > 0
  );

  const badges = [
    profile.kyc_verified
      ? "KYC Verified"
      : "",

    profile.professional_license_badge
      ? "Professional License Verified"
      : "",

    profile.council_registration_badge
      ? "Council Registration Verified"
      : "",

    profile.gst_badge
      ? "GST Verified"
      : "",
  ]
    .filter(
      Boolean
    )
    .join(
      ", "
    );

  return (
    <>
      {/* =================================================
          A. IDENTITY & KYC
      ================================================= */}

      <Section
        icon="🪪"
        bg="#dcfce7"
        title="A. Identity & KYC"
        hasData={hasSectionAData}
        sub="Public identity with protected legal KYC"
        delay={
          0.05
        }
        hideable={
          false
        }
      >
        <ProfessionalPublicGrid
          rows={[
            {
              label:
                "Display Name",

              value:
                profile.display_name,
            },

            {
              label:
                "Username",

              value:
                profile.username,
            },

            {
              label:
                "Full Legal Name",

              value:
                profile.full_name ||
                profile.name ||
                profile.first_name,
            },

            {
              label:
                "Father / Spouse Name",

              value:
                profile.father_spouse_name ||
                profile.father_name,
            },

            {
              label:
                "Date of Birth",

              value:
                profile.dob ||
                profile.date_of_birth,
            },

            {
              label:
                "Gender",

              value:
                profile.gender,
            },

            {
              label:
                "Marital Status",

              value:
                profile.marital_status,
            },

            {
              label:
                "Nationality",

              value:
                profile.nationality ||
                "Indian",
            },

            {
              label:
                "Aadhaar Number / Card",

              value:
                profile.aadhaar_number
                  ? (profile.aadhaar_number.length === 12
                      ? `•••• •••• ${profile.aadhaar_number.slice(8)}`
                      : profile.aadhaar_number)
                  : (profile.aadhaar
                      ? (profile.aadhaar.length === 12
                          ? `•••• •••• ${profile.aadhaar.slice(8)}`
                          : profile.aadhaar)
                      : null),
            },

            {
              label:
                "PAN Number / Card",

              value:
                profile.pan_number ||
                profile.pan,
            },

            {
              label:
                "Passport Number",

              value:
                profile.passport_number ||
                profile.passport,
            },

            {
              label:
                "Voter ID",

              value:
                profile.voter_id,
            },

            {
              label:
                "Driving License",

              value:
                profile.driving_license,
            },

            {
              label:
                "Blood Group",

              value:
                profile.blood_group,
            },
          ]}
        />
      </Section>

      {/* =================================================
          B. CONTACT & ADDRESS
      ================================================= */}

      <Section
        icon="📍"
        bg="#ccfbf1"
        title="B. Contact & Address"
        hasData={hasSectionBData}
        sub="Public area information with private personal contact"
        delay={
          0.1
        }
        hideable={
          false
        }
      >
        <ProfessionalPublicGrid
          rows={[
            {
              label:
                "Primary Mobile",

              value:
                profile.phone,

              status:
                optionalPublicStatus(
                  phonePublic
                ),
            },

            {
              label:
                "Secondary Mobile",

              value:
                profile.secondary_mobile ||
                profile.alternate_mobile,
            },

            {
              label:
                "Email Address",

              value:
                profile.email ||
                profile.primary_email,
            },

            {
              label:
                "WhatsApp Number",

              value:
                profile.whatsapp_number ||
                profile.whatsapp,
            },

            {
              label:
                "Current Address",

              value:
                profile.current_address ||
                profile.address,
            },

            {
              label:
                "Permanent Address",

              value:
                profile.permanent_address ||
                profile.address,
            },

            {
              label:
                "Address Proof",

              value:
                profile.address_proof_type ||
                profile.address_proof,
            },

            {
              label:
                "District",

              value:
                profile.district,
            },

            {
              label:
                "State",

              value:
                profile.state,
            },

            {
              label:
                "Pincode",

              value:
                profile.pincode,
            },

            {
              label:
                "Google Map Location",

              status:
                "private",
            },
          ]}
        />
      </Section>

      {/* =================================================
          C. LEGAL & PROFESSIONAL COMPLIANCE
      ================================================= */}

      <Section
        icon="⚖️"
        bg="#dbeafe"
        title="C. Legal & Professional Compliance"
        hasData={hasSectionCData}
        sub="Verification badges are public; actual numbers and documents stay private"
        delay={
          0.15
        }
        hideable={
          false
        }
      >
        <ProfessionalPublicGrid
          rows={[
            {
              label:
                "Verification Status",

              value:
                badges ||
                "No public verification badge",
              full:
                true,
            },

            {
              label:
                "Professional License Number",

              status:
                "private",
            },

            {
              label:
                "Professional License Document",

              status:
                "private",
            },

            {
              label:
                "Council / Board Registration",

              status:
                "private",
            },

            {
              label:
                "Council Registration Number",

              status:
                "private",
            },

            {
              label:
                "Council Registration Document",

              status:
                "private",
            },

            {
              label:
                "Professional Indemnity Insurance",

              status:
                "private",
            },

            {
              label:
                "Firm PAN",

              status:
                "private",
            },

            {
              label:
                "Professional GST Number",

              status:
                "private",
            },

            {
              label:
                "GST Document",

              status:
                "private",
            },
          ]}
        />
      </Section>

      {/* =================================================
          D. EDUCATION
      ================================================= */}

      <Section
        icon="🎓"
        bg="#ecfccb"
        title="D. Education & Qualification"
        hasData={hasSectionDData}
        sub="Shared education and certifications"
        delay={
          0.2
        }
        hideable={
          false
        }
      >
        <ProfessionalPublicGrid
          rows={[
            {
              label:
                "Highest Qualification",

              value:
                profile
                  .educational_qualification ??
                profile.education,

              status:
                optionalPublicStatus(
                  qualificationPublic
                ),
            },

            {
              label:
                "School / College",

              value:
                profile
                  .school_college_name,
            },

            {
              label:
                "Degree / Certificate Year",

              status:
                "private",
            },

            {
              label:
                "Education Certificate",

              status:
                "private",
            },

            {
              label:
                "Additional Certifications",

              value:
                listDisplayValue(
                  profile
                    .additional_certifications
                ),
              full:
                true,
            },

            {
              label:
                "Language Skills",

              value:
                listDisplayValue(
                  profile
                    .language_skills
                ),
              full:
                true,
            },
          ]}
        />
      </Section>

      {/* =================================================
          E. ACHIEVEMENTS
      ================================================= */}

      <Section
        icon="🏆"
        bg="#fef3c7"
        title="E. Achievements & Certifications"
        hasData={hasSectionEData}
        sub="Professional accomplishments shared publicly"
        delay={
          0.25
        }
        hideable={
          false
        }
      >
        <ProfessionalPublicGrid
          rows={[
            {
              label:
                "Awards & Recognitions",

              value:
                listDisplayValue(
                  profile
                    .awards_recognitions
                ),
              full:
                true,
            },

            {
              label:
                "Publications",

              value:
                listDisplayValue(
                  profile.publications
                ),
              full:
                true,
            },

            {
              label:
                "Professional Certifications",

              value:
                listDisplayValue(
                  profile
                    .professional_certifications
                ),
              full:
                true,
            },

            {
              label:
                "Key Milestones",

              value:
                listDisplayValue(
                  profile
                    .key_milestones
                ),
              full:
                true,
            },

            {
              label:
                "Media Mentions",

              value:
                listDisplayValue(
                  profile
                    .media_mentions
                ),
              full:
                true,
            },

            {
              label:
                "Reference Letters / Testimonials",

              value:
                listDisplayValue(
                  profile
                    .reference_letters
                ),
              full:
                true,
            },
          ]}
        />
      </Section>

      {/* =================================================
          F. WORK EXPERIENCE
      ================================================= */}

      <Section
        icon="💼"
        bg="#ede9fe"
        title="F. Work Experience & Portfolio"
        hasData={hasSectionFData}
        sub="Professional experience and public work information"
        delay={
          0.3
        }
        hideable={
          false
        }
      >
        <ProfessionalPublicGrid
          rows={[
            {
              label:
                "Total Experience",

              value:
                profile
                  .total_experience_years !=
                null
                  ? `${profile.total_experience_years} Years`
                  : "",
            },

            {
              label:
                "Previous Employers / Clients",

              value:
                listDisplayValue(
                  profile
                    .previous_employers_clients
                ),
              full:
                true,
            },

            {
              label:
                "Work Samples",

              value:
                listDisplayValue(
                  profile.work_samples
                ),
              full:
                true,
            },

            {
              label:
                "Resume / CV",

              status:
                "private",
            },

            {
              label:
                "Hourly / Project Rate",

              value:
                profile
                  .hourly_project_rate,

              status:
                optionalPublicStatus(
                  ratePublic
                ),
            },

            {
              label:
                "Availability Status",

              value:
                profile
                  .availability_status,
            },
          ]}
        />
      </Section>

      {/* =================================================
          G. INTEREST / BIO
      ================================================= */}

      <Section
        icon="👤"
        bg="#dcfce7"
        title="G. Professional Bio & Interests"
        hasData={hasSectionGData}
        sub="Public professional identity and online presence"
        delay={
          0.35
        }
        hideable={
          false
        }
      >
        <ProfessionalPublicGrid
          rows={[
            {
              label:
                "Professional Bio",

              value:
                profile
                  .professional_bio ??
                profile.bio,

              full:
                true,
            },

            {
              label:
                "Interest Categories",

              value:
                listDisplayValue(
                  profile
                    .interest_categories
                ),
              full:
                true,
            },

            {
              label:
                "Skills",

              value:
                listDisplayValue(
                  profile.skills
                ),
              full:
                true,
            },

            {
              label:
                "Hobbies",

              value:
                listDisplayValue(
                  profile.hobbies
                ),
              full:
                true,
            },

            {
              label:
                "Preferred Industry",

              value:
                profile
                  .preferred_industry,
            },

            {
              label:
                "Cover / Banner",

              value:
                profile.cover_photo
                  ? "Available"
                  : "",
            },

            {
              label:
                "Gallery Photos",

              value:
                toArray(
                  profile
                    .gallery_photos
                ).length
                  ? `${toArray(
                      profile
                        .gallery_photos
                    ).length} photo(s)`
                  : "",
            },

            {
              label:
                "Intro Video",

              value:
                profile.intro_video
                  ? "Available"
                  : "",
            },

            {
              label:
                "Portfolio Website",

              value:
                profile.portfolio_url,
              full:
                true,
            },
          ]}
        />

        {social.length >
          0 && (
          <div
            style={{
              marginTop:
                "18px",
            }}
          >
            <SocialGrid
              items={
                social
              }
            />
          </div>
        )}
      </Section>

      {/* =================================================
          H. FINANCIAL / BANK
      ================================================= */}

      <Section
        icon="🏦"
        bg="#fee2e2"
        title="H. Financial & Bank Details"
        hasData={false}
        sub="Financial information is protected and available only to the member"
        delay={
          0.4
        }
        hideable={
          false
        }
      >
        <ProfessionalPublicGrid
          rows={[
            {
              label:
                "Account Holder Name",

              status:
                "private",
            },

            {
              label:
                "Bank Name",

              status:
                "private",
            },

            {
              label:
                "Account Number",

              status:
                "private",
            },

            {
              label:
                "IFSC Code",

              status:
                "private",
            },

            {
              label:
                "Bank Branch",

              status:
                "private",
            },

            {
              label:
                "Passbook / Cancelled Cheque",

              status:
                "private",
            },

            {
              label:
                "UPI ID",

              status:
                "private",
            },

            {
              label:
                "Income Tax Declaration",

              status:
                "private",
            },

            {
              label:
                "Nominee Details",

              status:
                "private",
            },

            {
              label:
                "Nominee ID Document",

              status:
                "private",
            },
          ]}
        />
      </Section>

      {/* =================================================
          I. NETWORK / ROYALTY
      ================================================= */}

      <Section
        icon="🌳"
        bg="#dbeafe"
        title="I. My Network Profile"
        sub="Admin-assigned rank, total network and direct members"
        delay={
          0.45
        }
        hideable={
          false
        }
        hasData={true}
      >
        <ProfessionalPublicGrid
          rows={[
            {
              label:
                "Rank",

              value:
                adminRank,
            },

            {
              label:
                "Total Network",

              value:
                String(totalNetwork),
            },

            {
              label:
                "Direct Member",

              value:
                String(directMembers),
            },
          ]}
        />
      </Section>

      {/* =================================================
          J. EMERGENCY CONTACT
      ================================================= */}

      <Section
        icon="🚨"
        bg="#ffedd5"
        title="J. Emergency Contact"
        hasData={false}
        sub="Emergency contact information is private"
        delay={
          0.5
        }
        hideable={
          false
        }
      >
        <ProfessionalPublicGrid
          rows={[
            {
              label:
                "Emergency Contact Name",

              status:
                "private",
            },

            {
              label:
                "Emergency Contact Number",

              status:
                "private",
            },

            {
              label:
                "Relationship",

              status:
                "private",
            },
          ]}
        />
      </Section>

      {/* =================================================
          PRIVACY NOTICE
      ================================================= */}

      <Section
        icon="🔐"
        bg="#f1f5f9"
        title="Privacy Protection"
        sub="Professional member private information is protected"
        delay={
          0.55
        }
        hideable={
          false
        }
      >
        <div
          style={{
            padding:
              "6px 2px",

            color:
              "#475569",

            lineHeight:
              1.75,

            fontSize:
              "0.88rem",
          }}
        >
          <strong
            style={{
              display:
                "block",

              marginBottom:
                "7px",

              color:
                "#166534",
            }}
          >
            🔒 Protected Professional Profile
          </strong>

          Sensitive identity, KYC, contact, banking,
          nominee, referral, royalty and emergency details
          are available only through the authenticated
          member account. This public QR profile contains
          public information only.
        </div>
      </Section>
    </>
  );
}

/* =========================================================
   NORMAL / NON-PROFESSIONAL SECTIONS

   Existing behavior preserved.
========================================================= */

function PublicSections({
  profile,
  editing,
  draft,
  onFieldChange,
}) {
  const social =
    socialItemsOf(
      profile
    );

  const hasTextVal = (val) => Boolean(toText(val));
  const hasContactSec = Boolean(hasTextVal(profile.email) || hasTextVal(profile.phone) || hasTextVal(profile.whatsapp_number) || hasTextVal(profile.contact_number));
  const hasPersonalSec = Boolean(hasTextVal(profile.first_name) || hasTextVal(profile.last_name) || hasTextVal(profile.father_name) || hasTextVal(profile.dob) || hasTextVal(profile.gender) || hasTextVal(profile.login_id));
  const hasAddressSec = Boolean(hasTextVal(profile.entity_house_no) || hasTextVal(profile.entity_street) || hasTextVal(profile.entity_area) || hasTextVal(profile.entity_city ?? profile.city) || hasTextVal(profile.entity_district ?? profile.district) || hasTextVal(profile.entity_state ?? profile.state) || hasTextVal(profile.entity_pincode ?? profile.pincode) || hasTextVal(profile.country));
  const hasEducationSec = Boolean(hasTextVal(profile.education) || hasTextVal(profile.educational_qualification) || hasTextVal(profile.education_level) || hasTextVal(profile.ug_degree) || hasTextVal(profile.ug_department) || hasTextVal(profile.ug_college));
  const hasProfSec = Boolean(hasTextVal(profile.occupation) || hasTextVal(profile.profession) || hasTextVal(profile.professional_role) || hasTextVal(profile.years_of_experience) || toArray(profile.skills).length > 0 || hasTextVal(profile.nationality) || hasTextVal(profile.marital_status) || hasTextVal(profile.bio ?? profile.profile_bio));
  const civAdminRank = toText(profile.network_level ?? profile.network_rank ?? profile.rank, "Assigned by Admin");
  const civDirectMembers = Number(profile.direct_network ?? profile.direct_members ?? profile.direct_members_count ?? 0);
  const civTotalNetwork = Number(profile.total_network ?? (civDirectMembers + Number(profile.indirect_network ?? 0)));

  return (
    <>
      {!editing &&
        social.length >
          0 && (
          <Section
            icon="🌐"
            bg="#ecfccb"
            title="Social Media"
            sub="Online presence"
            delay={
              0.2
            }
          >
            <SocialGrid
              items={
                social
              }
            />
          </Section>
        )}

      <Section
        icon="📞"
        bg="#ccfbf1"
        title="Contact Details"
        hasData={hasContactSec}
        sub="Email · Phone · WhatsApp"
        delay={
          0.1
        }
      >
        <EditableGrid
          editing={
            editing
          }
          draft={
            draft
          }
          onChange={
            onFieldChange
          }
          rows={[
            {
              label:
                "Email",

              field:
                "email",

              value:
                profile.email,
            },

            {
              label:
                "Phone",

              field:
                "phone",

              value:
                profile.phone,
            },

            {
              label:
                "WhatsApp",

              field:
                "whatsapp_number",

              value:
                profile.whatsapp_number,
            },

            {
              label:
                "Contact Number",

              field:
                "contact_number",

              value:
                profile.contact_number,
            },
          ]}
        />
      </Section>

      <Section
        icon="👤"
        bg="#dcfce7"
        title="Personal Information"
        hasData={hasPersonalSec}
        sub="Name · DOB · Gender"
        delay={
          0.05
        }
      >
        <EditableGrid
          editing={
            editing
          }
          draft={
            draft
          }
          onChange={
            onFieldChange
          }
          rows={[
            {
              label:
                "First Name",

              field:
                "first_name",

              value:
                profile.first_name,
            },

            {
              label:
                "Last Name",

              field:
                "last_name",

              value:
                profile.last_name,
            },

            {
              label:
                "Father's Name",

              field:
                "father_name",

              value:
                profile.father_name,
            },

            {
              label:
                "Date of Birth",

              field:
                "dob",

              value:
                profile.dob,

              type:
                "date",
            },

            {
              label:
                "Gender",

              field:
                "gender",

              value:
                profile.gender,
            },

            {
              label:
                "Login ID",

              field:
                "login_id",

              value:
                profile.login_id,

              readOnly:
                true,
            },
          ]}
        />
      </Section>

      <Section
        icon="📍"
        bg="#ecfccb"
        title="Address"
        hasData={hasAddressSec}
        sub="House · Street · City · State"
        delay={
          0.15
        }
      >
        <EditableGrid
          editing={
            editing
          }
          draft={
            draft
          }
          onChange={
            onFieldChange
          }
          rows={[
            {
              label:
                "House / Door No.",

              field:
                "entity_house_no",

              value:
                profile.entity_house_no,
            },

            {
              label:
                "Street",

              field:
                "entity_street",

              value:
                profile.entity_street,
            },

            {
              label:
                "Area",

              field:
                "entity_area",

              value:
                profile.entity_area,
            },

            {
              label:
                "City",

              field:
                "city",

              value:
                profile.entity_city ??
                profile.city,
            },

            {
              label:
                "District",

              field:
                "district",

              value:
                profile.entity_district ??
                profile.district,
            },

            {
              label:
                "State",

              field:
                "state",

              value:
                profile.entity_state ??
                profile.state,
            },

            {
              label:
                "Pincode",

              field:
                "pincode",

              value:
                profile.entity_pincode ??
                profile.pincode,
            },

            {
              label:
                "Country",

              field:
                "country",

              value:
                profile.country,
            },
          ]}
        />
      </Section>

      <Section
        icon="🎓"
        bg="#ecfccb"
        title="Education"
        hasData={hasEducationSec}
        sub="Academic background"
        delay={
          0.25
        }
      >
        <EditableGrid
          editing={
            editing
          }
          draft={
            draft
          }
          onChange={
            onFieldChange
          }
          rows={[
            {
              label:
                "Education",

              field:
                "education",

              value:
                profile.education,
            },

            {
              label:
                "Qualification",

              field:
                "educational_qualification",

              value:
                profile
                  .educational_qualification,
            },

            {
              label:
                "Education Level",

              field:
                "education_level",

              value:
                profile.education_level,
            },

            {
              label:
                "UG Degree",

              field:
                "ug_degree",

              value:
                profile.ug_degree,
            },

            {
              label:
                "UG Department",

              field:
                "ug_department",

              value:
                profile.ug_department,
            },

            {
              label:
                "UG College",

              field:
                "ug_college",

              value:
                profile.ug_college,

              full:
                true,
            },
          ]}
        />
      </Section>

      <Section
        icon="💼"
        bg="#dcfce7"
        title="Professional Details"
        hasData={hasProfSec}
        sub="Occupation · profession · skills"
        delay={
          0.3
        }
      >
        <EditableGrid
          editing={
            editing
          }
          draft={
            draft
          }
          onChange={
            onFieldChange
          }
          rows={[
            {
              label:
                "Occupation",

              field:
                "occupation",

              value:
                profile.occupation,
            },

            {
              label:
                "Profession",

              field:
                "profession",

              value:
                profile.profession,
            },

            {
              label:
                "Professional Role",

              field:
                "professional_role",

              value:
                profile.professional_role,
            },

            {
              label:
                "Years of Experience",

              field:
                "years_of_experience",

              value:
                profile
                  .years_of_experience,
            },

            {
              label:
                "Skills",

              field:
                "skills",

              value:
                listDisplayValue(
                  profile.skills
                ),

              full:
                true,
            },

            {
              label:
                "Nationality",

              field:
                "nationality",

              value:
                profile.nationality,
            },

            {
              label:
                "Marital Status",

              field:
                "marital_status",

              value:
                profile.marital_status,
            },

            {
              label:
                "Bio",

              field:
                "bio",

              value:
                profile.bio ??
                profile.profile_bio,

              full:
                true,
            },
          ]}
        />
      </Section>

      <Section
        icon="??"
        bg="#dbeafe"
        title="My Network Profile"
        sub="Rank ? Total network ? Direct member"
        hideable={
          false
        }
        hasData={true}
        delay={
          0.35
        }
      >
        <EditableGrid
          editing={
            false
          }
          draft={{}}
          onChange={() => {}}
          rows={[
            {
              label:
                "Rank",

              field:
                "network_level",

              value:
                civAdminRank,
            },

            {
              label:
                "Total Network",

              field:
                "total_network",

              value:
                civTotalNetwork,
            },

            {
              label:
                "Direct Member",

              field:
                "direct_network",

              value:
                civDirectMembers,
            },
          ]}
        />
      </Section>
    </>
  );
}

/* =========================================================
   PUBLIC PROFILE TAB
========================================================= */

export default function PublicProfileTab({
  loginId,
  profile,
  publicViewOnly = false,
  avRef,
  onAvatarOpen,
  middleSlot,
  onProfileUpdated,
}) {
  const professional =
    isProfessionalProfile(
      profile
    );

  const [
    isOwner,
    setIsOwner,
  ] =
    useState(
      false
    );

  const [
    editing,
    setEditing,
  ] =
    useState(
      false
    );

  const [
    draft,
    setDraft,
  ] =
    useState(
      {}
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  /* =======================================================
     OWNER CHECK

     IMPORTANT:

     Professional public profile:
     Never enable private editing from QR/public endpoint.

     Public QR:
     publicViewOnly=true
  ======================================================= */

  useEffect(
    () => {
      if (
        !profile ||
        publicViewOnly ||
        professional
      ) {
        setIsOwner(
          false
        );

        return undefined;
      }

      const controller =
        new AbortController();

      fetch(
        "/api/me",
        {
          credentials:
            "include",

          signal:
            controller.signal,

          headers: {
            Accept:
              "application/json",
          },
        }
      )
        .then(
          async (
            response
          ) => {
            if (
              !response.ok
            ) {
              return null;
            }

            return response.json();
          }
        )
        .then(
          (
            responseData
          ) => {
            const root =
              asObject(
                responseData
              );

            const data =
              asObject(
                root.data
              );

            const member =
              asObject(
                root.member ??
                root.user ??
                data.member ??
                data.user ??
                data.profile ??
                root.profile ??
                root
              );

            const currentLoginId =
              toText(
                member.login_id ??
                member.loginId
              );

            const profileLoginId =
              toText(
                profile.login_id ??
                loginId
              );

            setIsOwner(
              Boolean(
                currentLoginId &&
                profileLoginId &&
                currentLoginId ===
                  profileLoginId
              )
            );
          }
        )
        .catch(
          (
            requestError
          ) => {
            if (
              requestError?.name ===
              "AbortError"
            ) {
              return;
            }

            setIsOwner(
              false
            );
          }
        );

      return () => {
        controller.abort();
      };
    },
    [
      loginId,
      profile,
      professional,
      publicViewOnly,
    ]
  );

  /* =======================================================
     NO PROFILE
  ======================================================= */

  if (
    !profile
  ) {
    return null;
  }

  /* =======================================================
     START EDIT

     NON-PROFESSIONAL ONLY
  ======================================================= */

  const startEdit = () => {
    if (
      publicViewOnly ||
      professional
    ) {
      return;
    }

    setDraft({
      first_name:
        toText(
          profile.first_name
        ),

      last_name:
        toText(
          profile.last_name
        ),

      father_name:
        toText(
          profile.father_name
        ),

      dob:
        profile.dob
          ? String(
              profile.dob
            ).slice(
              0,
              10
            )
          : "",

      gender:
        toText(
          profile.gender
        ),

      email:
        toText(
          profile.email
        ),

      phone:
        toText(
          profile.phone
        ),

      whatsapp_number:
        toText(
          profile.whatsapp_number
        ),

      contact_number:
        toText(
          profile.contact_number
        ),

      entity_house_no:
        toText(
          profile.entity_house_no
        ),

      entity_street:
        toText(
          profile.entity_street
        ),

      entity_area:
        toText(
          profile.entity_area
        ),

      city:
        toText(
          profile.entity_city ??
          profile.city
        ),

      district:
        toText(
          profile.entity_district ??
          profile.district
        ),

      state:
        toText(
          profile.entity_state ??
          profile.state
        ),

      pincode:
        toText(
          profile.entity_pincode ??
          profile.pincode
        ),

      country:
        toText(
          profile.country
        ),

      education:
        toText(
          profile.education
        ),

      educational_qualification:
        toText(
          profile
            .educational_qualification
        ),

      education_level:
        toText(
          profile.education_level
        ),

      ug_degree:
        toText(
          profile.ug_degree
        ),

      ug_department:
        toText(
          profile.ug_department
        ),

      ug_college:
        toText(
          profile.ug_college
        ),

      occupation:
        toText(
          profile.occupation
        ),

      profession:
        toText(
          profile.profession
        ),

      professional_role:
        toText(
          profile.professional_role
        ),

      years_of_experience:
        toText(
          profile
            .years_of_experience
        ),

      skills:
        toText(
          profile.skills
        ),

      nationality:
        toText(
          profile.nationality
        ),

      marital_status:
        toText(
          profile.marital_status
        ),

      bio:
        toText(
          profile.bio ??
          profile.profile_bio
        ),
    });

    setEditing(
      true
    );
  };

  /* =======================================================
     EDIT TOGGLE
  ======================================================= */

  const handleEditToggle = () => {
    if (
      publicViewOnly ||
      professional
    ) {
      return;
    }

    if (
      editing
    ) {
      setEditing(
        false
      );

      return;
    }

    startEdit();
  };

  /* =======================================================
     FIELD CHANGE
  ======================================================= */

  const handleFieldChange = (
    field,
    value
  ) => {
    setDraft(
      (
        previous
      ) => ({
        ...previous,

        [field]:
          value,
      })
    );
  };

  /* =======================================================
     SAVE PROFILE

     NON-PROFESSIONAL EXISTING FLOW ONLY.
  ======================================================= */

  const handleSave = async () => {
    if (
      publicViewOnly ||
      professional ||
      saving
    ) {
      return;
    }

    try {
      setSaving(
        true
      );

      const response =
        await fetch(
          "/api/public/user/update",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            credentials:
              "include",

            body:
              JSON.stringify(
                draft
              ),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (
        !response.ok
      ) {
        showToast(
          result.message ||
          result.error ||
          "Update failed"
        );

        return;
      }

      showToast(
        "✅ Profile updated successfully"
      );

      setEditing(
        false
      );

      if (
        typeof onProfileUpdated ===
        "function"
      ) {
        onProfileUpdated();
      }
    } catch (
      requestError
    ) {
      console.error(
        "Profile Update Error:",
        requestError
      );

      showToast(
        "❌ Network error — could not save"
      );
    } finally {
      setSaving(
        false
      );
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <PublicProfilePage
        profile={
          profile
        }
        avRef={
          avRef
        }
        onAvatarOpen={
          onAvatarOpen
        }
        isOwner={
          isOwner
        }
        editing={
          editing
        }
        onEditToggle={
          handleEditToggle
        }
        publicViewOnly={
          publicViewOnly
        }
      />

      {editing &&
        !publicViewOnly &&
        !professional && (
          <div className="edit-save-bar">
            <button
              type="button"
              className="ref-copy-btn"
              disabled={
                saving
              }
              onClick={
                handleSave
              }
            >
              {saving
                ? "Saving..."
                : "💾 Save Changes"}
            </button>

            <button
              type="button"
              className="edit-toggle-btn"
              disabled={
                saving
              }
              onClick={() =>
                setEditing(
                  false
                )
              }
            >
              ✕ Cancel
            </button>
          </div>
        )}

      {middleSlot}

      {professional ? (
        <ProfessionalPublicSections
          profile={
            profile
          }
        />
      ) : (
        <PublicSections
          profile={
            profile
          }
          editing={
            editing &&
            !publicViewOnly
          }
          draft={
            draft
          }
          onFieldChange={
            handleFieldChange
          }
        />
      )}
    </>
  );
}