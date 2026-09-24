import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  getCommercialPublicProfile,
} from "../../../services/commercialPublicProfile.service";

import "./CommercialPublicProfile.css";

/* =========================================================
   HELPERS
========================================================= */

const toText = (
  value
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value
      .map(
        (item) =>
          toText(item)
      )
      .filter(Boolean)
      .join(", ");
  }

  if (
    typeof value ===
    "object"
  ) {
    return "";
  }

  return String(
    value
  ).trim();
};

const displayValue = (
  value,
  fallback = "Not Provided"
) => {
  const text =
    toText(
      value
    );

  return (
    text ||
    fallback
  );
};

const normalizeUrl = (
  value
) => {
  const text =
    toText(
      value
    );

  if (!text) {
    return "";
  }

  if (
    /^https?:\/\//i.test(
      text
    )
  ) {
    return text;
  }

  return `https://${text}`;
};

const getInitials = (
  value
) => {
  const words =
    toText(
      value
    )
      .split(/\s+/)
      .filter(Boolean);

  if (
    words.length === 0
  ) {
    return "CM";
  }

  if (
    words.length === 1
  ) {
    return words[0]
      .slice(
        0,
        2
      )
      .toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`
    .toUpperCase();
};

const availabilityText = (
  value
) => {
  if (
    Array.isArray(
      value
    )
  ) {
    return value.length
      ? `${value.length} Available`
      : "Not Provided";
  }

  return toText(
    value
  )
    ? "Available"
    : "Not Provided";
};

/* =========================================================
   PUBLIC FIELD

   privateField=true
   -> actual value NEVER displayed
========================================================= */

function PublicField({
  label,
  value,
  privateField = false,
  verified = false,
  href = "",
}) {
  let content =
    displayValue(
      value
    );

  if (
    privateField
  ) {
    content =
      "Access Restricted";
  }

  if (
    verified
  ) {
    content =
      value
        ? "Verified"
        : "Not Verified";
  }

  return (
    <div
      className={[
        "commercial-pro-field",

        privateField
          ? "commercial-pro-field-private"
          : "",

        verified &&
        value
          ? "commercial-pro-field-verified"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="commercial-pro-field-label">
        {label}
      </span>

      <div className="commercial-pro-field-value">
        {privateField && (
          <span className="commercial-pro-lock">
            🔒
          </span>
        )}

        {verified &&
          value && (
            <i className="fa-solid fa-circle-check" />
          )}

        {href &&
        !privateField &&
        value ? (
          <a
            href={
              href
            }
            target={
              href.startsWith(
                "http"
              )
                ? "_blank"
                : undefined
            }
            rel={
              href.startsWith(
                "http"
              )
                ? "noreferrer"
                : undefined
            }
          >
            {content}
          </a>
        ) : (
          <strong>
            {content}
          </strong>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   ACCORDION SECTION
========================================================= */

function CommercialSection({
  sectionId,
  title,
  subtitle,
  icon,
  iconBg,
  opened,
  onToggle,
  children,
}) {
  return (
    <section
      className={[
        "commercial-pro-section",

        opened
          ? "opened"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="commercial-pro-section-header"
        onClick={
          onToggle
        }
        aria-expanded={
          opened
        }
      >
        <span
          className="commercial-pro-section-icon"
          style={{
            background:
              iconBg,
          }}
        >
          <i
            className={
              icon
            }
          />
        </span>

        <span className="commercial-pro-section-heading">
          <strong>
            {sectionId}.{" "}
            {title}
          </strong>

          <small>
            {subtitle}
          </small>
        </span>

        <span
          className="commercial-pro-section-arrow"
        >
          <i
            className={
              opened
                ? "fa-solid fa-chevron-up"
                : "fa-solid fa-chevron-down"
            }
          />
        </span>
      </button>

      {opened && (
        <div className="commercial-pro-section-content">
          <div className="commercial-pro-field-grid">
            {children}
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function CommercialPublicProfile({
  loginId:
    loginIdProp = "",
  profile:
    suppliedProfile = null,
}) {
  const params =
    useParams();

  const safeLoginId =
    useMemo(
      () =>
        toText(
          loginIdProp ||
            params.loginId
        ),
      [
        loginIdProp,
        params.loginId,
      ]
    );

  const [
    profile,
    setProfile,
  ] =
    useState(
      suppliedProfile
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      !suppliedProfile
    );

  const [
    error,
    setError,
  ] =
    useState("");

  /*
    Professional design pattern:

    First section can be opened.

    Only one section opens at a time.
  */

  const [
    openedSection,
    setOpenedSection,
  ] =
    useState("");

  /* =======================================================
     LOAD PROFILE
  ======================================================= */

  const loadProfile =
    useCallback(
      async (
        signal
      ) => {
        if (
          suppliedProfile
        ) {
          setProfile(
            suppliedProfile
          );

          setLoading(
            false
          );

          return;
        }

        if (
          !safeLoginId
        ) {
          setError(
            "Commercial Login ID is missing."
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
            await getCommercialPublicProfile(
              safeLoginId,
              {
                signal,
              }
            );

          setProfile(
            result?.profile ||
              null
          );
        } catch (
          requestError
        ) {
          if (
            signal
              ?.aborted ||
            requestError
              ?.name ===
              "AbortError" ||
            requestError
              ?.name ===
              "CanceledError"
          ) {
            return;
          }

          console.error(
            "Commercial Public Profile Error:",
            requestError
          );

          setProfile(
            null
          );

          setError(
            Number(
              requestError
                ?.statusCode ||
                requestError
                  ?.response
                  ?.status
            ) === 404
              ? "Commercial public profile was not found."
              : requestError
                  ?.apiMessage ||
                requestError
                  ?.message ||
                "Unable to load Commercial public profile."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        safeLoginId,
        suppliedProfile,
      ]
    );

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadProfile(
        controller.signal
      );

      return () => {
        controller.abort();
      };
    },
    [
      loadProfile,
    ]
  );

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <main className="commercial-pro-page">
        <div className="commercial-pro-loading">
          <span className="commercial-pro-spinner" />

          <strong>
            Loading Commercial Profile
          </strong>

          <small>
            {safeLoginId}
          </small>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error ||
    !profile
  ) {
    return (
      <main className="commercial-pro-page">
        <div className="commercial-pro-error">
          <div>
            <i className="fa-solid fa-store-slash" />
          </div>

          <h2>
            Commercial Profile Not Available
          </h2>

          <p>
            {error ||
              "Profile information is unavailable."}
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     PROFILE VALUES
  ======================================================= */

  const businessName =
    toText(
      profile.business_name ||
        profile.display_name
    ) ||
    "INMBA Commercial";

  const username =
    toText(
      profile.username
    ) ||
    (
      safeLoginId
        ? `@${safeLoginId}`
        : ""
    );

  const businessLogo =
    toText(
      profile.business_logo ||
        profile.profile_pic
    );

  const locationText =
    [
      profile.city,
      profile.district,
      profile.state,
    ]
      .map(
        toText
      )
      .filter(Boolean)
      .join(" · ");

  const businessBio =
    toText(
      profile.business_bio
    ) ||
    "INMBA Commercial Member business profile.";

  const branches =
    toText(
      profile.branch_locations
    );

  const products =
    toText(
      profile
        .products_services_offered
    );

  const tags =
    toText(
      profile
        .business_category_tags
    );

  const awards =
    toText(
      profile
        .awards_certifications
    );

  const testimonials =
    toText(
      profile
        .client_testimonials
    );

  const socialLinks =
    profile
      ?.social_media_links &&
    typeof profile
      .social_media_links ===
      "object" &&
    !Array.isArray(
      profile.social_media_links
    )
      ? Object
          .entries(
            profile.social_media_links
          )
          .filter(
            ([, value]) =>
              toText(
                value
              )
          )
          .map(
            ([
              name,
            ]) =>
              name
                .charAt(0)
                .toUpperCase() +
              name.slice(1)
          )
          .join(", ")
      : toText(
          profile
            .social_media_links
        );

  const toggleSection =
    (
      sectionId
    ) => {
      setOpenedSection(
        (
          current
        ) =>
          current ===
          sectionId
            ? ""
            : sectionId
      );
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="commercial-pro-page">
      <div className="commercial-pro-bg-orb commercial-pro-bg-one" />
      <div className="commercial-pro-bg-orb commercial-pro-bg-two" />

      <div className="commercial-pro-shell">
        {/* =================================================
            HERO

            Same visual structure as Professional profile,
            Commercial red theme only.
        ================================================= */}

        <section className="commercial-pro-hero">
          <div className="commercial-pro-banner">
            <span />
            <span />
          </div>

          <div className="commercial-pro-hero-body">
            <div className="commercial-pro-avatar-wrap">
              <div className="commercial-pro-avatar-ring">
                <div className="commercial-pro-avatar">
                  {businessLogo ? (
                    <img
                      src={
                        businessLogo
                      }
                      alt={
                        businessName
                      }
                    />
                  ) : (
                    <span>
                      {getInitials(
                        businessName
                      )}
                    </span>
                  )}
                </div>
              </div>

              <span className="commercial-pro-member-pill">
                <span />
                Commercial Member
              </span>
            </div>

            <h1 className="commercial-pro-name">
              {businessName}
            </h1>

            <div className="commercial-pro-role">
              BUSINESS
            </div>

            <p className="commercial-pro-bio">
              {businessBio}
            </p>

            <div className="commercial-pro-chips">
              {locationText && (
                <span>
                  📍 {locationText}
                </span>
              )}

              <span>
                {profile
                  .commercial_verified
                  ? "🟢 Verified"
                  : "🔴 Commercial Member"}
              </span>

              {profile
                .business_category && (
                <span>
                  🏷️{" "}
                  {
                    profile
                      .business_category
                  }
                </span>
              )}
            </div>

            {/* =================================================
    COMMERCIAL HERO META

    Professional-style information row.
================================================= */}

<div className="commercial-pro-hero-meta">

  <span>
    <i className="fa-solid fa-tag" />

    <b>
      Login ID :
    </b>

    {safeLoginId}
  </span>

  <span>
    <i className="fa-solid fa-user-tie" />

    <b>
      Account :
    </b>

    Commercial
  </span>

  <span>
    <i className="fa-solid fa-store" />

    <b>
      Business Name :
    </b>

    {businessName}
  </span>

  <span>
    <i className="fa-solid fa-building" />

    <b>
      Business Type :
    </b>

    {displayValue(
      profile.business_type
    )}
  </span>

</div>

<div className="commercial-pro-visibility">
  <span>
    PROFILE VISIBILITY
  </span>

  <strong>
    Public Commercial Profile
  </strong>
</div>
          </div>
        </section>

        {/* =================================================
            A
        ================================================= */}

        <CommercialSection
          sectionId="A"
          title="Owner Identity & KYC"
          subtitle="Public business identity with protected personal KYC"
          icon="fa-solid fa-id-card"
          iconBg="#dcfce7"
          opened={
            openedSection ===
            "A"
          }
          onToggle={() =>
            toggleSection(
              "A"
            )
          }
        >
          <PublicField
            label="Display Name"
            value={
              businessName
            }
          />

          <PublicField
            label="Username / Login ID"
            value={
              username
            }
          />

          <PublicField
            label="Commercial KYC Status"
            value={
              profile
                .commercial_verified
            }
            verified
          />

          <PublicField
            label="Owner Full Legal Name"
            privateField
          />

          <PublicField
            label="Father / Spouse Name"
            privateField
          />

          <PublicField
            label="Date of Birth"
            privateField
          />

          <PublicField
            label="Gender"
            privateField
          />

          <PublicField
            label="Marital Status"
            privateField
          />

          <PublicField
            label="Nationality"
            privateField
          />

          <PublicField
            label="Aadhaar Number / Card"
            privateField
          />

          <PublicField
            label="PAN Number / Card"
            privateField
          />

          <PublicField
            label="Passport Number"
            privateField
          />

          <PublicField
            label="Voter ID"
            privateField
          />

          <PublicField
            label="Driving License"
            privateField
          />

          <PublicField
            label="Blood Group"
            privateField
          />
        </CommercialSection>

        {/* =================================================
            B
        ================================================= */}

        <CommercialSection
          sectionId="B"
          title="Business Legal & Registration"
          subtitle="Public business details with protected legal documents"
          icon="fa-solid fa-scale-balanced"
          iconBg="#dbeafe"
          opened={
            openedSection ===
            "B"
          }
          onToggle={() =>
            toggleSection(
              "B"
            )
          }
        >
          <PublicField
            label="Business / Company Name"
            value={
              businessName
            }
          />

          <PublicField
            label="Business Type"
            value={
              profile
                .business_type
            }
          />

          <PublicField
            label="Business Category"
            value={
              profile
                .business_category
            }
          />

          <PublicField
            label="Registration Status"
            value={
              profile
                .registration_verified
            }
            verified
          />

          <PublicField
            label="GST Verification"
            value={
              profile
                .gst_verified
            }
            verified
          />

          <PublicField
            label="Business Registration Number"
            privateField
          />

          <PublicField
            label="Company PAN / TAN"
            privateField
          />

          <PublicField
            label="Registration Certificate"
            privateField
          />

          <PublicField
            label="GST Certificate / Number"
            privateField
          />

          <PublicField
            label="Shop & Establishment License"
            privateField
          />

          <PublicField
            label="Industry License"
            privateField
          />

          <PublicField
            label="Authorized Signatory ID"
            privateField
          />
        </CommercialSection>

        {/* =================================================
            C
        ================================================= */}

        <CommercialSection
          sectionId="C"
          title="Business Contact & Address"
          subtitle="Public business contact and area-level location"
          icon="fa-solid fa-location-dot"
          iconBg="#ccfbf1"
          opened={
            openedSection ===
            "C"
          }
          onToggle={() =>
            toggleSection(
              "C"
            )
          }
        >
          <PublicField
            label="Business Location"
            value={
              locationText
            }
          />

          <PublicField
            label="Branch Locations"
            value={
              branches
            }
          />

          <PublicField
            label="Business Contact Number"
            value={
              profile
                .business_contact_number
            }
            href={
              profile
                .business_contact_number
                ? `tel:${profile.business_contact_number}`
                : ""
            }
          />

          <PublicField
            label="Business Email"
            value={
              profile
                .business_email
            }
            href={
              profile
                .business_email
                ? `mailto:${profile.business_email}`
                : ""
            }
          />

          <PublicField
            label="Business Website"
            value={
              profile
                .business_website
            }
            href={
              normalizeUrl(
                profile
                  .business_website
              )
            }
          />

          <PublicField
            label="Google Map Location"
            value={
              profile
                .google_map_location
                ? "View Location"
                : ""
            }
            href={
              normalizeUrl(
                profile
                  .google_map_location
              )
            }
          />

          <PublicField
            label="Exact Registered Street Address"
            privateField
          />
        </CommercialSection>

        {/* =================================================
            D
        ================================================= */}

        <CommercialSection
          sectionId="D"
          title="Financial & Bank Details"
          subtitle="Financial information is protected and available only to the member"
          icon="fa-solid fa-building-columns"
          iconBg="#fee2e2"
          opened={
            openedSection ===
            "D"
          }
          onToggle={() =>
            toggleSection(
              "D"
            )
          }
        >
          <PublicField
            label="Bank Account Number"
            privateField
          />

          <PublicField
            label="IFSC Code"
            privateField
          />

          <PublicField
            label="Bank Branch"
            privateField
          />

          <PublicField
            label="UPI ID"
            privateField
          />

          <PublicField
            label="GST Number"
            privateField
          />

          <PublicField
            label="GST Verification"
            value={
              profile
                .gst_verified
            }
            verified
          />

          <PublicField
            label="Income Tax Declaration"
            privateField
          />

          <PublicField
            label="Nominee Name"
            privateField
          />

          <PublicField
            label="Nominee Relationship"
            privateField
          />

          <PublicField
            label="Nominee Aadhaar / ID"
            privateField
          />

          <PublicField
            label="Bank Proof"
            privateField
          />
        </CommercialSection>

        {/* =================================================
            E
        ================================================= */}

        <CommercialSection
          sectionId="E"
          title="Business Profile & Achievements"
          subtitle="Business profile, services and achievements shared publicly"
          icon="fa-solid fa-trophy"
          iconBg="#fef3c7"
          opened={
            openedSection ===
            "E"
          }
          onToggle={() =>
            toggleSection(
              "E"
            )
          }
        >
          <PublicField
            label="Year Established"
            value={
              profile
                .year_established
            }
          />

          <PublicField
            label="Number of Employees"
            value={
              profile
                .number_of_employees
            }
          />

          <PublicField
            label="Annual Turnover Slab"
            privateField
          />

          <PublicField
            label="Products / Services Offered"
            value={
              products
            }
          />

          <PublicField
            label="Business Category Tags"
            value={
              tags
            }
          />

          <PublicField
            label="Awards & Certifications"
            value={
              awards
            }
          />

          <PublicField
            label="Client Testimonials"
            value={
              testimonials
            }
          />

          <PublicField
            label="Business Bio"
            value={
              profile
                .business_bio
            }
          />

          <PublicField
            label="Business Logo"
            value={
              availabilityText(
                profile
                  .business_logo
              )
            }
          />

          <PublicField
            label="Business Gallery"
            value={
              availabilityText(
                profile
                  .gallery_photos
              )
            }
          />

          <PublicField
            label="Promo Video"
            value={
              availabilityText(
                profile
                  .promo_video
              )
            }
          />

          <PublicField
            label="Social Media Links"
            value={
              socialLinks
            }
          />
        </CommercialSection>

        {/* =================================================
            F
        ================================================= */}

        <CommercialSection
          sectionId="F"
          title="Network & Royalty"
          subtitle="Public rank badge with protected network and payout information"
          icon="fa-solid fa-tree"
          iconBg="#dbeafe"
          opened={
            openedSection ===
            "F"
          }
          onToggle={() =>
            toggleSection(
              "F"
            )
          }
        >
          <PublicField
            label="Network Rank / Level"
            value={
              profile
                .network_level_badge
            }
          />

          <PublicField
            label="Referral / Sponsor ID"
            privateField
          />

          <PublicField
            label="Team Size"
            privateField
          />

          <PublicField
            label="Royalty Slab"
            privateField
          />

          <PublicField
            label="Preferred Payout Cycle"
            privateField
          />

          <PublicField
            label="Payout Information"
            privateField
          />
        </CommercialSection>

        {/* =================================================
            G
        ================================================= */}

        <CommercialSection
          sectionId="G"
          title="Emergency & Nominee"
          subtitle="Emergency contact and nominee information is private"
          icon="fa-solid fa-truck-medical"
          iconBg="#ffedd5"
          opened={
            openedSection ===
            "G"
          }
          onToggle={() =>
            toggleSection(
              "G"
            )
          }
        >
          <PublicField
            label="Emergency Contact Name"
            privateField
          />

          <PublicField
            label="Emergency Contact Number"
            privateField
          />

          <PublicField
            label="Relationship"
            privateField
          />

          <PublicField
            label="Nominee Information"
            privateField
          />
        </CommercialSection>

        {/* =================================================
            PRIVACY

            Same concept as Professional.
        ================================================= */}

        <CommercialSection
          sectionId="🔐"
          title="Privacy Protection"
          subtitle="Commercial member private information is protected"
          icon="fa-solid fa-lock"
          iconBg="#f1f5f9"
          opened={
            openedSection ===
            "PRIVACY"
          }
          onToggle={() =>
            toggleSection(
              "PRIVACY"
            )
          }
        >
          <div className="commercial-pro-privacy-message">
            <i className="fa-solid fa-shield-halved" />

            <div>
              <strong>
                Private Information Protected
              </strong>

              <p>
                Personal KYC, Aadhaar, PAN, passport,
                banking, nominee, emergency contact,
                referral, team, royalty and payout
                information are not exposed through the
                public Commercial QR profile.
              </p>
            </div>
          </div>
        </CommercialSection>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="commercial-pro-footer">
          <span>
            INMBA Commercial Public Profile
          </span>

          <strong>
            {safeLoginId}
          </strong>
        </footer>
      </div>

      <div className="commercial-pro-floating-brand">
        🌿
      </div>
    </main>
  );
}