import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api, {
  BACKEND_URL,
} from "../../../api/api";

import {
  getCommercialKyc,
} from "../../../services/commercialKyc.service";

import {
  getCommercialDashboard,
} from "../../../services/commercialDashboard.service";

import "./CommercialFullProfile.css";

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
    typeof value === "boolean"
  ) {
    return value
      ? "Yes"
      : "No";
  }

  if (
    Array.isArray(value)
  ) {
    return value
      .map((item) =>
        typeof item === "object"
          ? ""
          : String(item)
      )
      .filter(Boolean)
      .join(", ");
  }

  if (
    typeof value === "object"
  ) {
    return "";
  }

  return String(value).trim();
};

const toProfilePhotoUrl = (
  value
) => {
  const photo =
    String(
      value ?? ""
    ).trim();

  if (!photo) {
    return "";
  }

  if (
    /^https?:\/\//i.test(photo) ||
    photo.startsWith("data:") ||
    photo.startsWith("blob:")
  ) {
    return photo;
  }

  return `${BACKEND_URL}/${photo.replace(/^\/+/, "")}`;
};

const unwrapServiceResult = (
  result
) => {
  if (
    result?.data &&
    typeof result.data === "object" &&
    !Array.isArray(
      result.data
    )
  ) {
    return result.data;
  }

  if (
    result &&
    typeof result === "object"
  ) {
    return result;
  }

  return {};
};

const fileStatus = (
  value
) => {
  if (
    Array.isArray(value)
  ) {
    return value.length
      ? `${value.length} Uploaded`
      : "Not Uploaded";
  }

  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return "Uploaded";
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return "Uploaded";
  }

  return "Not Uploaded";
};

const formatStatus = (
  value
) => {
  const text =
    toText(
      value
    )
      .replace(
        /_/g,
        " "
      )
      .toLowerCase();

  if (!text) {
    return "Draft";
  }

  return text.replace(
    /\b\w/g,
    (character) =>
      character.toUpperCase()
  );
};

const getInitials = (
  value
) => {
  const parts =
    toText(
      value
    )
      .split(/\s+/)
      .filter(Boolean);

  if (!parts.length) {
    return "CM";
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`
    .toUpperCase();
};

/* =========================================================
   PROFILE FIELD
========================================================= */

function ProfileField({
  icon = "fa-solid fa-circle",
  label,
  value,
  full = false,
  file = false,
}) {
  const displayValue =
    file
      ? fileStatus(
          value
        )
      : toText(
          value
        ) ||
        "Not Provided";

  return (
    <div
      className={`cfp-field ${
        full
          ? "cfp-field-full"
          : ""
      }`}
    >
      <div className="cfp-field-label">

        <i
          className={
            icon
          }
        />

        <span>
          {label}
        </span>

      </div>

      <strong>
        {displayValue}
      </strong>
    </div>
  );
}

/* =========================================================
   SECTION
========================================================= */

function ProfileSection({
  letter,
  icon,
  title,
  subtitle,
  children,
}) {
  return (
    <section className="cfp-section-card">

      <div className="cfp-section-heading">

        <span className="cfp-section-icon">
          <i
            className={
              icon
            }
          />
        </span>

        <div>
          <h2>
            {letter}. {title}
          </h2>

          <p>
            {subtitle}
          </p>
        </div>

      </div>

      <div className="cfp-section-grid">
        {children}
      </div>

    </section>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function CommercialFullProfile() {
  const navigate =
    useNavigate();

  const [
    kyc,
    setKyc,
  ] =
    useState(null);

  const [
    dashboard,
    setDashboard,
  ] =
    useState(null);

  const [
    ownerProfile,
    setOwnerProfile,
  ] =
    useState({});

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
     LOAD
  ======================================================= */

  const loadProfile =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          const [
            kycResult,
            dashboardResult,
            ownerProfileResult,
          ] =
            await Promise.all([
              getCommercialKyc(),
              getCommercialDashboard(),
              api
                .get(
                  "/profile"
                )
                .catch(
                  () => null
                ),
            ]);

          const kycData =
            unwrapServiceResult(
              kycResult
            );

          const dashboardData =
            dashboardResult
              ?.dashboard ||
            dashboardResult
              ?.data
              ?.dashboard ||
            null;

          setKyc(
            kycData
          );

          setDashboard(
            dashboardData
          );

          setOwnerProfile(
            ownerProfileResult
              ?.data
              ?.data
              ?.profile ||
            ownerProfileResult
              ?.data
              ?.profile ||
            ownerProfileResult
              ?.data
              ?.data ||
            {}
          );
        } catch (
          requestError
        ) {
          console.error(
            "Commercial Full Profile Error:",
            requestError
          );

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
            setError(
              "Your Commercial login session has expired."
            );

            return;
          }

          setError(
            requestError
              ?.apiMessage ||
            requestError
              ?.message ||
            "Unable to load Commercial profile."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  useEffect(
    () => {
      loadProfile();
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
      <main className="cfp-page">

        <div className="cfp-loading">

          <span />

          <strong>
            Loading Commercial Profile...
          </strong>

        </div>

      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error ||
    !kyc
  ) {
    return (
      <main className="cfp-page">

        <div className="cfp-error">

          <i className="fa-solid fa-circle-exclamation" />

          <h2>
            Unable to load profile
          </h2>

          <p>
            {error ||
              "Commercial profile is unavailable."}
          </p>

          <button
            type="button"
            onClick={
              loadProfile
            }
          >
            Try Again
          </button>

        </div>

      </main>
    );
  }

  /* =======================================================
     DATA
  ======================================================= */

  const sections =
    kyc
      ?.sections ||
    {};

  const A =
    sections.A ||
    {};

  const B =
    sections.B ||
    {};

  const C =
    sections.C ||
    {};

  const D =
    sections.D ||
    {};

  const E =
    sections.E ||
    {};

  const F =
    sections.F ||
    {};

  const G =
    sections.G ||
    {};

  const network =
    kyc
      ?.network ||
    dashboard
      ?.network ||
    {};

  const member =
    dashboard
      ?.member ||
    {};

  const business =
    dashboard
      ?.business ||
    {};

  const publicProfileCard =
    dashboard
      ?.cards
      ?.public_profile ||
    {};

  const profilePhoto =
    toProfilePhotoUrl(
      ownerProfile.profile_pic ||
      ownerProfile.profile_pic_url ||
      ownerProfile.profile_image_url ||
      member.profile_pic ||
      member.profile_pic_url ||
      dashboard?.profile_pic
    );

  const loginId =
    toText(
      member
        ?.loginId
    );

  const businessName =
    toText(
      B
        ?.business_company_name
    ) ||
    toText(
      business
        ?.name
    ) ||
    "Commercial Member";

  const ownerName =
    toText(
      A
        ?.owner_full_legal_name
    ) ||
    businessName;

  const kycStatus =
    formatStatus(
      kyc
        ?.status
    );

  const approved =
    toText(
      kyc
        ?.status
    )
      .toLowerCase() ===
      "approved";

 const publicProfilePath =
  loginId
    ? `/commercial/public-profile/${encodeURIComponent(
        loginId
      )}`
    : "";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="cfp-page">

      <div className="cfp-shell">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="cfp-hero">

          <div className="cfp-hero-banner">

            <div>
              <span className="cfp-eyebrow">
                INMBA COMMERCIAL MEMBER PORTAL
              </span>

              <h1>
                My Commercial Profile
              </h1>
            </div>

            <span
              className={`cfp-status ${
                approved
                  ? "approved"
                  : ""
              }`}
            >
              <i
                className={
                  approved
                    ? "fa-solid fa-circle-check"
                    : "fa-solid fa-clock"
                }
              />

              {kycStatus}
            </span>

          </div>

          <div className="cfp-hero-body">

            {/* =============================================
                AVATAR
            ============================================= */}

            <div className="cfp-avatar-area">

              <div className="cfp-avatar">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={`${businessName} profile`}
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      objectFit: "cover",
                      borderRadius: "inherit",
                    }}
                  />
                ) : (
                  getInitials(
                    businessName
                  )
                )}

                <span>
                  <i className="fa-solid fa-store" />
                </span>
              </div>

            </div>

            {/* =============================================
                MAIN INFO
            ============================================= */}

            <div className="cfp-profile-info">

              <div className="cfp-profile-name">

                <h2>
                  {businessName}
                </h2>

                {approved && (
                  <i className="fa-solid fa-circle-check" />
                )}

              </div>

              <strong className="cfp-member-type">
                Commercial Member
              </strong>

              <div className="cfp-meta">

                <span>
                  <i className="fa-solid fa-user" />

                  Owner:{" "}
                  <b>
                    {ownerName}
                  </b>
                </span>

                <span>
                  <i className="fa-solid fa-id-card" />

                  Login ID:{" "}
                  <b>
                    {loginId ||
                      "—"}
                  </b>
                </span>

                <span>
                  <i className="fa-solid fa-store" />

                  {toText(
                    business
                      ?.category
                  ) ||
                    toText(
                      B
                        ?.business_type
                    ) ||
                    "Commercial Business"}
                </span>

              </div>

              {toText(
                E
                  ?.business_bio
              ) && (
                <p className="cfp-bio">
                  {
                    E
                      .business_bio
                  }
                </p>
              )}

              {/* ===========================================
                  ACTIONS
              =========================================== */}

              <div className="cfp-actions">

<button
  type="button"
  className="primary"
  onClick={() =>
    navigate(
      "/commercial/public-profile-edit"
    )
  }
>
  <i className="fa-solid fa-user-pen" />

  Edit Public Profile
</button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/commercial/profile-edit"
                    )
                  }
                >
                  <i className="fa-solid fa-building-shield" />

                  Edit Commercial KYC
                </button>

                {publicProfilePath && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        publicProfilePath
                      )
                    }
                  >
                    <i className="fa-solid fa-address-card" />

                    Public Profile
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/commercial/dashboard"
                    )
                  }
                >
                  <i className="fa-solid fa-arrow-left" />

                  Dashboard
                </button>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            A
        ================================================= */}

        <ProfileSection
          letter="A"
          icon="fa-solid fa-user-shield"
          title="Owner Identity & KYC"
          subtitle="Private owner identity and KYC information"
        >
          <ProfileField
            icon="fa-solid fa-user"
            label="Owner Full Legal Name"
            value={
              A.owner_full_legal_name
            }
          />

          <ProfileField
            icon="fa-solid fa-users"
            label="Father / Spouse Name"
            value={
              A.father_spouse_name
            }
          />

          <ProfileField
            icon="fa-solid fa-calendar"
            label="Date of Birth"
            value={
              A.date_of_birth
            }
          />

          <ProfileField
            icon="fa-solid fa-person"
            label="Gender"
            value={
              A.gender
            }
          />

          <ProfileField
            icon="fa-solid fa-ring"
            label="Marital Status"
            value={
              A.marital_status
            }
          />

          <ProfileField
            icon="fa-solid fa-flag"
            label="Nationality"
            value={
              A.nationality
            }
          />

          <ProfileField
            icon="fa-solid fa-fingerprint"
            label="Aadhaar Number"
            value={
              A.aadhaar_number
            }
          />

          <ProfileField
            icon="fa-solid fa-id-card"
            label="PAN Number"
            value={
              A.pan_number
            }
          />

          <ProfileField
            icon="fa-solid fa-passport"
            label="Passport Number"
            value={
              A.passport_number
            }
          />

          <ProfileField
            icon="fa-solid fa-id-badge"
            label="Voter ID"
            value={
              A.voter_id
            }
          />

          <ProfileField
            icon="fa-solid fa-car"
            label="Driving License"
            value={
              A.driving_license
            }
          />

          <ProfileField
            icon="fa-solid fa-droplet"
            label="Blood Group"
            value={
              A.blood_group
            }
          />

          <ProfileField
            icon="fa-solid fa-file"
            label="Aadhaar Front"
            value={
              A.aadhaar_front
            }
            file
          />

          <ProfileField
            icon="fa-solid fa-file"
            label="Aadhaar Back"
            value={
              A.aadhaar_back
            }
            file
          />

          <ProfileField
            icon="fa-solid fa-file"
            label="PAN Card Scan"
            value={
              A.pan_card_scan
            }
            file
          />
        </ProfileSection>

        {/* =================================================
            B
        ================================================= */}

        <ProfileSection
          letter="B"
          icon="fa-solid fa-building-shield"
          title="Business Legal & Registration"
          subtitle="Business registration, legal and licence details"
        >
          <ProfileField
            icon="fa-solid fa-building"
            label="Business / Company Name"
            value={
              B.business_company_name
            }
          />

          <ProfileField
            icon="fa-solid fa-briefcase"
            label="Business Type"
            value={
              B.business_type
            }
          />

          <ProfileField
            icon="fa-solid fa-file-signature"
            label="Business Registration Number"
            value={
              B.business_registration_number
            }
          />

          <ProfileField
            icon="fa-solid fa-id-card"
            label="Company PAN / TAN"
            value={
              B.company_pan_tan
            }
          />

          <ProfileField
            icon="fa-solid fa-receipt"
            label="GST Applicable"
            value={
              B.gst_applicable
            }
          />

          <ProfileField
            icon="fa-solid fa-shop"
            label="Shop Establishment Licence Required"
            value={
              B.shop_establishment_license_required
            }
          />

          <ProfileField
            icon="fa-solid fa-industry"
            label="Industry Licence Required"
            value={
              B.industry_license_required
            }
          />

          <ProfileField
            icon="fa-solid fa-file"
            label="GST Certificate"
            value={
              B.gst_certificate
            }
            file
          />

          <ProfileField
            icon="fa-solid fa-file"
            label="Shop / Establishment Licence"
            value={
              B.shop_establishment_license
            }
            file
          />

          <ProfileField
            icon="fa-solid fa-file"
            label="Trade Licence"
            value={
              B.trade_license
            }
            file
          />

          <ProfileField
            icon="fa-solid fa-file"
            label="Industry Licence"
            value={
              B.industry_license
            }
            file
          />

          <ProfileField
            icon="fa-solid fa-file"
            label="Incorporation Certificate"
            value={
              B.incorporation_certificate
            }
            file
          />

          <ProfileField
            icon="fa-solid fa-file"
            label="Partnership / MOA / AOA"
            value={
              B.partnership_moa_aoa
            }
            file
          />

          <ProfileField
            icon="fa-solid fa-file-shield"
            label="Authorized Signatory ID"
            value={
              B.authorized_signatory_id_proof
            }
            file
          />
        </ProfileSection>

        {/* =================================================
            C
        ================================================= */}

        <ProfileSection
          letter="C"
          icon="fa-solid fa-location-dot"
          title="Business Contact & Address"
          subtitle="Registered business communication details"
        >
          <ProfileField
            icon="fa-solid fa-location-dot"
            label="Registered Business Address"
            value={
              C.registered_business_address
            }
            full
          />

          <ProfileField
            icon="fa-solid fa-code-branch"
            label="Branch Locations"
            value={
              C.branch_locations
            }
            full
          />

          <ProfileField
            icon="fa-solid fa-phone"
            label="Business Contact Number"
            value={
              C.business_contact_number
            }
          />

          <ProfileField
            icon="fa-solid fa-envelope"
            label="Business Email"
            value={
              C.business_email
            }
          />

          <ProfileField
            icon="fa-solid fa-globe"
            label="Business Website"
            value={
              C.business_website
            }
          />

          <ProfileField
            icon="fa-solid fa-map-location-dot"
            label="Google Map Location"
            value={
              C.google_map_location
            }
          />
        </ProfileSection>

        {/* =================================================
            D
        ================================================= */}

        <ProfileSection
          letter="D"
          icon="fa-solid fa-building-columns"
          title="Financial & Bank"
          subtitle="Private bank, tax and nominee information"
        >
          <ProfileField
            icon="fa-solid fa-building-columns"
            label="Bank Account Number"
            value={
              D.bank_account_number
            }
          />

          <ProfileField
            icon="fa-solid fa-code"
            label="IFSC Code"
            value={
              D.ifsc_code
            }
          />

          <ProfileField
            icon="fa-solid fa-building"
            label="Bank Branch Name"
            value={
              D.bank_branch_name
            }
          />

          <ProfileField
            icon="fa-solid fa-mobile-screen"
            label="UPI ID"
            value={
              D.upi_id
            }
          />

          <ProfileField
            icon="fa-solid fa-receipt"
            label="GST Applicable"
            value={
              D.gst_applicable
            }
          />

          <ProfileField
            icon="fa-solid fa-file-invoice"
            label="GST Number"
            value={
              D.gst_number
            }
          />

          <ProfileField
            icon="fa-solid fa-file-circle-check"
            label="Income Tax Declaration"
            value={
              D.income_tax_declaration
            }
            full
          />

          <ProfileField
            icon="fa-solid fa-user-check"
            label="Nominee Name"
            value={
              D.nominee_name
            }
          />

          <ProfileField
            icon="fa-solid fa-people-arrows"
            label="Nominee Relationship"
            value={
              D.nominee_relationship
            }
          />

          <ProfileField
            icon="fa-solid fa-id-card"
            label="Nominee Aadhaar / ID"
            value={
              D.nominee_aadhaar_id
            }
          />

          <ProfileField
            icon="fa-solid fa-file"
            label="Bank Proof"
            value={
              D.bank_proof
            }
            file
          />

          <ProfileField
            icon="fa-solid fa-file"
            label="Nominee ID Proof"
            value={
              D.nominee_id_proof
            }
            file
          />
        </ProfileSection>

        {/* =================================================
            E
        ================================================= */}

        <ProfileSection
          letter="E"
          icon="fa-solid fa-store"
          title="Business Profile & Achievements"
          subtitle="Business experience, services and achievements"
        >
          <ProfileField
            icon="fa-solid fa-calendar-check"
            label="Year Established"
            value={
              E.year_established
            }
          />

          <ProfileField
            icon="fa-solid fa-users"
            label="Number of Employees"
            value={
              E.number_of_employees
            }
          />

          <ProfileField
            icon="fa-solid fa-chart-line"
            label="Annual Turnover Slab"
            value={
              E.annual_turnover_slab
            }
          />

          <ProfileField
            icon="fa-solid fa-box-open"
            label="Products / Services Offered"
            value={
              E.products_services_offered
            }
            full
          />

          <ProfileField
            icon="fa-solid fa-tags"
            label="Business Category Tags"
            value={
              E.business_category_tags
            }
            full
          />

          <ProfileField
            icon="fa-solid fa-award"
            label="Awards / Certifications"
            value={
              E.awards_certifications
            }
            full
          />

          <ProfileField
            icon="fa-solid fa-comment"
            label="Client Testimonials"
            value={
              E.client_testimonials
            }
            full
          />

          <ProfileField
            icon="fa-solid fa-align-left"
            label="Business Bio"
            value={
              E.business_bio
            }
            full
          />

          <ProfileField
            icon="fa-solid fa-share-nodes"
            label="Social Media Links"
            value={
              E.social_media_links
            }
            full
          />

          <ProfileField
            icon="fa-solid fa-image"
            label="Business Logo"
            value={
              E.business_logo
            }
            file
          />

          <ProfileField
            icon="fa-solid fa-images"
            label="Business Gallery"
            value={
              E.business_gallery
            }
            file
          />

          <ProfileField
            icon="fa-solid fa-video"
            label="Promotional Video"
            value={
              E.promotional_video
            }
            file
          />
        </ProfileSection>

        {/* =================================================
            F
        ================================================= */}

        <ProfileSection
          letter="F"
          icon="fa-solid fa-network-wired"
          title="Network / Royalty"
          subtitle="INMBA network, rank and royalty information"
        >
          <ProfileField
            icon="fa-solid fa-wallet"
            label="Preferred Payout Cycle"
            value={
              F.preferred_payout_cycle
            }
          />

          <ProfileField
            icon="fa-solid fa-link"
            label="Referral ID"
            value={
              network
                ?.referralId ||
              network
                ?.referral_id
            }
          />

          <ProfileField
            icon="fa-solid fa-ranking-star"
            label="Network Rank"
            value={
              network
                ?.levelRank ||
              network
                ?.commercial_level_rank ||
              network
                ?.rank
            }
          />

          <ProfileField
            icon="fa-solid fa-users"
            label="Team Size"
            value={
              network
                ?.teamSize ||
              network
                ?.team_size
            }
          />

          <ProfileField
            icon="fa-solid fa-crown"
            label="Royalty Slab"
            value={
              network
                ?.royaltySlab ||
              network
                ?.commercial_royalty_slab_category ||
              network
                ?.royaltySlabCategory
            }
          />
        </ProfileSection>

        {/* =================================================
            G
        ================================================= */}

        <ProfileSection
          letter="G"
          icon="fa-solid fa-phone-volume"
          title="Emergency & Nominee"
          subtitle="Private emergency contact information"
        >
          <ProfileField
            icon="fa-solid fa-user"
            label="Emergency Contact Name"
            value={
              G.emergency_contact_name
            }
          />

          <ProfileField
            icon="fa-solid fa-phone"
            label="Emergency Contact Number"
            value={
              G.emergency_contact_number
            }
          />

          <ProfileField
            icon="fa-solid fa-people-arrows"
            label="Relationship"
            value={
              G.relationship
            }
          />

          <ProfileField
            icon="fa-solid fa-shield-halved"
            label="Privacy Consent"
            value={
              kyc
                ?.progress
                ?.privacyConsent
            }
          />

          <ProfileField
            icon="fa-solid fa-file-signature"
            label="Declaration Accepted"
            value={
              kyc
                ?.progress
                ?.declarationAccepted
            }
          />
        </ProfileSection>

        {/* =================================================
            PRIVACY
        ================================================= */}

        <section className="cfp-private-note">

          <i className="fa-solid fa-lock" />

          <div>

            <strong>
              Private Commercial Profile
            </strong>

            <p>
              This page contains owner-only KYC information.
              These private values are not included in your
              public QR profile.
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}
