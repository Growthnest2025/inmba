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
import { buildDefaultBio } from "../../../utils/defaultBio";
import { getMembershipTitle } from "../../../utils/membershipTitle";
import ProfileHeroReferralBar from "../../../components/common/ProfileHeroReferralBar";

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

  if (value) {
    content = displayValue(value);
  } else {
    content =
      "Not Provided";
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
        {verified &&
          value && (
            <i className="fa-solid fa-circle-check" />
          )}

        {href &&
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
  hasData = true,
  onToggle,
  children,
}) {
  const canOpen = Boolean(hasData);
  const isOpen = canOpen && Boolean(opened);

  return (
    <section
      className={[
        "commercial-pro-section",

        isOpen
          ? "opened"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="commercial-pro-section-header"
        onClick={() => {
          if (!canOpen) return;
          onToggle?.();
        }}
        disabled={!canOpen}
        aria-disabled={!canOpen}
        aria-expanded={isOpen}
        style={
          !canOpen
            ? { cursor: "default", opacity: 0.72 }
            : undefined
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
            {canOpen ? subtitle : "No details added"}
          </small>
        </span>

        {canOpen && (
          <span
            className="commercial-pro-section-arrow"
          >
            <i
              className={
                isOpen
                  ? "fa-solid fa-chevron-up"
                  : "fa-solid fa-chevron-down"
              }
            />
          </span>
        )}
      </button>

      {isOpen && (
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

  const [
    copiedReferral,
    setCopiedReferral,
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

          let loadedProfile = result?.profile || null;

          // Merge with local storage draft so user's filled data always appears
          try {
            const currentLoginId =
              sessionStorage.getItem("commercial_login_id") ||
              sessionStorage.getItem("inmba_commercial_login_id") ||
              localStorage.getItem("commercial_login_id") ||
              localStorage.getItem("inmba_commercial_login_id") ||
              "";

            if (
              !loadedProfile ||
              (currentLoginId &&
                currentLoginId.toUpperCase() === safeLoginId.toUpperCase())
            ) {
              const draftStr = localStorage.getItem("inmba_commercial_kyc_draft");
              const basicName = localStorage.getItem("inmba_commercial_business_name");
              const basicType = localStorage.getItem("inmba_commercial_business_type");
              const basicOwner = localStorage.getItem("inmba_commercial_owner_name");
              const basicCity = localStorage.getItem("inmba_commercial_city");
              const basicPhone = localStorage.getItem("inmba_commercial_mobile");
              const basicEmail = localStorage.getItem("inmba_commercial_email");

              let draftObj = {};
              if (draftStr) {
                try {
                  draftObj = JSON.parse(draftStr) || {};
                } catch {}
              }

              const dA = draftObj.A || {};
              const dB = draftObj.B || {};
              const dC = draftObj.C || {};
              const dD = draftObj.D || {};
              const dE = draftObj.E || {};
              const dF = draftObj.F || {};
              const dG = draftObj.G || {};

              const base = loadedProfile || {
                login_id: safeLoginId,
                membership_type: "Commercial Member",
                membership_title: "INMBA Commercial Member",
                profile_type: "commercial",
              };

              loadedProfile = {
                ...base,
                ...loadedProfile,
                business_name:
                  loadedProfile?.business_name &&
                  loadedProfile?.business_name !== "Commercial Business" &&
                  loadedProfile?.business_name !== "INMBA Commercial"
                    ? loadedProfile.business_name
                    : (dB.business_name || dB.business_company_name || basicName || base.business_name || "Commercial Business"),
                business_type:
                  loadedProfile?.business_type || dB.business_type || basicType || base.business_type || "Commercial",
                business_category:
                  loadedProfile?.business_category || dB.business_type || basicType || base.business_category || "Commercial",
                owner_name:
                  loadedProfile?.owner_name || dA.owner_full_legal_name || basicOwner || base.owner_name || "",
                owner_full_legal_name:
                  loadedProfile?.owner_full_legal_name || dA.owner_full_legal_name || basicOwner || base.owner_name || "",
                full_name:
                  loadedProfile?.full_name || dA.owner_full_legal_name || basicOwner || base.full_name || "",
                father_spouse_name:
                  loadedProfile?.father_spouse_name || dA.father_spouse_name || "",
                father_name:
                  loadedProfile?.father_name || dA.father_spouse_name || "",
                dob:
                  loadedProfile?.dob || dA.dob || dA.date_of_birth || "",
                date_of_birth:
                  loadedProfile?.date_of_birth || dA.date_of_birth || dA.dob || "",
                gender:
                  loadedProfile?.gender || dA.gender || "",
                marital_status:
                  loadedProfile?.marital_status || dA.marital_status || "",
                nationality:
                  loadedProfile?.nationality || dA.nationality || "Indian",
                blood_group:
                  loadedProfile?.blood_group || dA.blood_group || "",
                aadhaar_number:
                  loadedProfile?.aadhaar_number || dA.aadhaar_number || "",
                pan_number:
                  loadedProfile?.pan_number || dA.pan_number || dB.company_pan || "",
                passport_number:
                  loadedProfile?.passport_number || dA.passport_number || "",
                voter_id:
                  loadedProfile?.voter_id || dA.voter_id || "",
                driving_license:
                  loadedProfile?.driving_license || dA.driving_license || "",
                business_registration_number:
                  loadedProfile?.business_registration_number || dB.business_registration_number || dB.registration_number || "",
                registration_number:
                  loadedProfile?.registration_number || dB.registration_number || dB.business_registration_number || "",
                company_pan:
                  loadedProfile?.company_pan || dB.company_pan || "",
                gst_number:
                  loadedProfile?.gst_number || dB.gst_number || dD.gst_number || "",
                bank_account_number:
                  loadedProfile?.bank_account_number || dD.bank_account_number || "",
                ifsc_code:
                  loadedProfile?.ifsc_code || dD.ifsc_code || "",
                bank_branch_name:
                  loadedProfile?.bank_branch_name || dD.bank_branch_name || dD.bank_branch || "",
                bank_branch:
                  loadedProfile?.bank_branch || dD.bank_branch || dD.bank_branch_name || "",
                upi_id:
                  loadedProfile?.upi_id || dD.upi_id || "",
                nominee_name:
                  loadedProfile?.nominee_name || dD.nominee_name || dG.nominee_name || "",
                nominee_relationship:
                  loadedProfile?.nominee_relationship || dD.nominee_relationship || dG.relationship || "",
                nominee_aadhaar_id:
                  loadedProfile?.nominee_aadhaar_id || dD.nominee_aadhaar_id || "",
                annual_turnover_slab:
                  loadedProfile?.annual_turnover_slab || dE.annual_turnover_slab || "",
                business_bio:
                  loadedProfile?.business_bio || dE.business_bio || base.business_bio || "",
                bio:
                  loadedProfile?.bio || dE.business_bio || base.bio || "",
                business_address:
                  loadedProfile?.business_address || dC.registered_business_address || base.business_address || "",
                city:
                  loadedProfile?.city || dC.city || basicCity || base.city || "",
                business_contact_number:
                  loadedProfile?.business_contact_number || dC.business_contact_number || basicPhone || base.business_contact_number || "",
                business_email:
                  loadedProfile?.business_email || dC.business_email || basicEmail || base.business_email || "",
                business_website:
                  loadedProfile?.business_website || dC.business_website || base.business_website || "",
                google_map_location:
                  loadedProfile?.google_map_location || dC.google_map_location || base.google_map_location || "",
                year_established:
                  loadedProfile?.year_established || dE.year_established || base.year_established || "",
                number_of_employees:
                  loadedProfile?.number_of_employees || dE.number_of_employees || base.number_of_employees || "",
                products_services_offered:
                  loadedProfile?.products_services_offered || dE.products_services_offered || base.products_services_offered || "",
                business_category_tags:
                  loadedProfile?.business_category_tags || dE.business_category_tags || base.business_category_tags || "",
                awards_certifications:
                  loadedProfile?.awards_certifications || dE.awards_certifications || base.awards_certifications || "",
                client_testimonials:
                  loadedProfile?.client_testimonials || dE.client_testimonials || base.client_testimonials || "",
                social_media_links:
                  loadedProfile?.social_media_links || dE.social_media_links || base.social_media_links || {},
                emergency_contact_name:
                  loadedProfile?.emergency_contact_name || dG.emergency_contact_name || "",
                emergency_contact_number:
                  loadedProfile?.emergency_contact_number || dG.emergency_contact_number || "",
                relationship:
                  loadedProfile?.relationship || dG.relationship || "",
                emergency_relationship:
                  loadedProfile?.emergency_relationship || dG.relationship || "",
                preferred_payout_cycle:
                  loadedProfile?.preferred_payout_cycle || dF.preferred_payout_cycle || "",
              };
            }
          } catch (e) {
            console.warn("Draft merge error:", e);
          }

          setProfile(
            loadedProfile
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

          // Fallback to local draft if this is own profile
          try {
            const currentLoginId =
              sessionStorage.getItem("commercial_login_id") ||
              sessionStorage.getItem("inmba_commercial_login_id") ||
              localStorage.getItem("commercial_login_id") ||
              localStorage.getItem("inmba_commercial_login_id") ||
              "";

            if (currentLoginId && currentLoginId.toUpperCase() === safeLoginId.toUpperCase()) {
              const draftStr = localStorage.getItem("inmba_commercial_kyc_draft");
              const basicName = localStorage.getItem("inmba_commercial_business_name");
              const basicType = localStorage.getItem("inmba_commercial_business_type");
              const basicOwner = localStorage.getItem("inmba_commercial_owner_name");
              const basicCity = localStorage.getItem("inmba_commercial_city");
              const basicPhone = localStorage.getItem("inmba_commercial_mobile");
              const basicEmail = localStorage.getItem("inmba_commercial_email");

              let draftObj = {};
              if (draftStr) {
                try { draftObj = JSON.parse(draftStr) || {}; } catch {}
              }

              const dA = draftObj.A || {};
              const dB = draftObj.B || {};
              const dC = draftObj.C || {};
              const dD = draftObj.D || {};
              const dE = draftObj.E || {};
              const dF = draftObj.F || {};
              const dG = draftObj.G || {};

              const localFallbackProfile = {
                login_id: safeLoginId,
                membership_type: "Commercial Member",
                membership_title: "INMBA Commercial Member",
                profile_type: "commercial",
                business_name: dB.business_name || dB.business_company_name || basicName || "Commercial Business",
                business_type: dB.business_type || basicType || "Commercial",
                business_category: dB.business_type || basicType || "Commercial",
                owner_name: dA.owner_full_legal_name || basicOwner || "",
                owner_full_legal_name: dA.owner_full_legal_name || basicOwner || "",
                full_name: dA.owner_full_legal_name || basicOwner || "",
                father_spouse_name: dA.father_spouse_name || "",
                father_name: dA.father_spouse_name || "",
                dob: dA.dob || dA.date_of_birth || "",
                date_of_birth: dA.date_of_birth || dA.dob || "",
                gender: dA.gender || "",
                marital_status: dA.marital_status || "",
                nationality: dA.nationality || "Indian",
                blood_group: dA.blood_group || "",
                aadhaar_number: dA.aadhaar_number || "",
                pan_number: dA.pan_number || dB.company_pan || "",
                passport_number: dA.passport_number || "",
                voter_id: dA.voter_id || "",
                driving_license: dA.driving_license || "",
                business_registration_number: dB.business_registration_number || dB.registration_number || "",
                registration_number: dB.registration_number || dB.business_registration_number || "",
                company_pan: dB.company_pan || "",
                gst_number: dB.gst_number || dD.gst_number || "",
                bank_account_number: dD.bank_account_number || "",
                ifsc_code: dD.ifsc_code || "",
                bank_branch_name: dD.bank_branch_name || dD.bank_branch || "",
                bank_branch: dD.bank_branch || dD.bank_branch_name || "",
                upi_id: dD.upi_id || "",
                nominee_name: dD.nominee_name || dG.nominee_name || "",
                nominee_relationship: dD.nominee_relationship || dG.relationship || "",
                nominee_aadhaar_id: dD.nominee_aadhaar_id || "",
                annual_turnover_slab: dE.annual_turnover_slab || "",
                business_bio: dE.business_bio || "",
                bio: dE.business_bio || "",
                business_address: dC.registered_business_address || "",
                city: dC.city || basicCity || "",
                business_contact_number: dC.business_contact_number || basicPhone || "",
                business_email: dC.business_email || basicEmail || "",
                business_website: dC.business_website || "",
                google_map_location: dC.google_map_location || "",
                year_established: dE.year_established || "",
                number_of_employees: dE.number_of_employees || "",
                products_services_offered: dE.products_services_offered || "",
                business_category_tags: dE.business_category_tags || "",
                awards_certifications: dE.awards_certifications || "",
                client_testimonials: dE.client_testimonials || "",
                social_media_links: dE.social_media_links || {},
                emergency_contact_name: dG.emergency_contact_name || "",
                emergency_contact_number: dG.emergency_contact_number || "",
                relationship: dG.relationship || "",
                emergency_relationship: dG.relationship || "",
                preferred_payout_cycle: dF.preferred_payout_cycle || "",
              };

              setProfile(localFallbackProfile);
              setError("");
              return;
            }
          } catch {}

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

      const cityState = [
  profile.city,
  profile.state,
]
  .map(toText)
  .filter(Boolean)
  .join(", ");

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
    Array.isArray(profile.products_services_offered)
      ? profile.products_services_offered.filter(Boolean).join(", ")
      : toText(profile.products_services_offered);

  const tags =
    Array.isArray(profile.business_category_tags)
      ? profile.business_category_tags.filter(Boolean).join(", ")
      : toText(profile.business_category_tags);

  const awards =
    Array.isArray(profile.awards_certifications)
      ? profile.awards_certifications.filter(Boolean).join(", ")
      : toText(profile.awards_certifications);

  const testimonials =
    Array.isArray(profile.client_testimonials)
      ? profile.client_testimonials.filter(Boolean).join(", ")
      : toText(profile.client_testimonials);

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

  const adminRank = toText(
    profile?.network_level_badge ||
      profile?.network?.rank_badge ||
      profile?.network_rank ||
      profile?.network_level
  );

  const directMembersCount = Number(
    profile?.direct_members ??
      profile?.direct_network ??
      profile?.network?.direct_members ??
      0
  );

  const totalNetworkCount = Number(
    profile?.total_network ??
      profile?.network?.total_network ??
      Number(profile?.direct_network ?? 0) +
        Number(profile?.indirect_network ?? 0)
  );

  const referralCode = toText(
    profile?.referral_id ||
      profile?.login_id ||
      safeLoginId
  );

  const referralLink = referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/membership-type?ref=${encodeURIComponent(referralCode)}`
    : "";

  const copyReferralText = async (kind, value) => {
    if (!value) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      }
      setCopiedReferral(kind);
      window.setTimeout(() => setCopiedReferral(""), 2200);
    } catch {
      setCopiedReferral("");
    }
  };

  const isPaymentApproved = [
    "approved",
    "paid",
    "success",
    "successful",
    "completed",
  ].includes(toText(profile?.payment_status || profile?.status).toLowerCase());

  const hasSectionA = true;
  const hasSectionB = true;
  const hasSectionC = true;
  const hasSectionD = true;
  const hasSectionE = true;
  const hasSectionF = true;
  const hasSectionG = true;

  const sectionAvailability = {
    A: hasSectionA,
    B: hasSectionB,
    C: hasSectionC,
    D: hasSectionD,
    E: hasSectionE,
    F: hasSectionF,
    G: hasSectionG,
    PRIVACY: true,
  };

  const toggleSection =
    (
      sectionId
    ) => {
      if (sectionAvailability[sectionId] === false) {
        return;
      }

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
                {getMembershipTitle(profile, "Commercial Member")}
              </span>
            </div>

            <h1 className="commercial-pro-name">
              {businessName}
            </h1>

            {isPaymentApproved && (
              <ProfileHeroReferralBar
                referralCode={referralCode}
                referralLink={referralLink}
                copied={copiedReferral}
                onCopy={copyReferralText}
              />
            )}

            <div className="commercial-pro-role">
              BUSINESS ? {getMembershipTitle(profile, "Commercial Member")}
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

    {" "}{getMembershipTitle(profile, "Commercial")}
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

        {/* QUICK LINKS & CONTACT (Name -> Links -> Contact) */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "18px 22px",
            marginBottom: "18px",
            display: "grid",
            gap: "12px",
          }}
        >
          <div>
            <strong style={{ display: "block", fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
              Links
            </strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {profile.business_website && (
                <a href={normalizeUrl(profile.business_website)} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", fontWeight: 600 }}>
                  <i className="fa-solid fa-globe" /> Website
                </a>
              )}
              {profile.google_map_location && (
                <a href={normalizeUrl(profile.google_map_location)} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8", fontWeight: 600 }}>
                  <i className="fa-solid fa-location-dot" /> Map Location
                </a>
              )}
              {socialLinks && <span><i className="fa-solid fa-share-nodes" /> {socialLinks}</span>}
              {!profile.business_website && !profile.google_map_location && !socialLinks && (
                <span style={{ color: "#64748b" }}>No public links added</span>
              )}
            </div>
          </div>
          <div>
            <strong style={{ display: "block", fontSize: "0.85rem", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
              Contact
            </strong>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", color: "#0f172a" }}>
              {(profile.business_email || profile.email) && (
                <a href={`mailto:${profile.business_email || profile.email}`} style={{ color: "#0f172a", fontWeight: 600 }}>
                  <i className="fa-solid fa-envelope" /> {profile.business_email || profile.email}
                </a>
              )}
              {profile.business_contact_number && (
                <a href={`tel:${profile.business_contact_number}`} style={{ color: "#0f172a" }}>
                  <i className="fa-solid fa-phone" /> {profile.business_contact_number}
                </a>
              )}
              {cityState && (
                <span><i className="fa-solid fa-location-dot" /> {cityState}</span>
              )}
            </div>
          </div>
        </section>

        {/* MY NETWORK PROFILE & REFERRAL PROGRAM */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "18px",
            padding: "18px 22px",
            marginBottom: "18px",
            display: "grid",
            gap: "16px",
          }}
        >
          <div>
            <strong style={{ display: "block", fontSize: "0.95rem", color: "#0f172a", marginBottom: "10px" }}>
              <i className="fa-solid fa-diagram-project" /> My Network Profile
            </strong>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
              <div style={{ padding: "10px 12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <small style={{ display: "block", color: "#64748b", fontWeight: 600 }}>Rank (Admin Controlled)</small>
                <strong style={{ color: "#0f172a" }}>{adminRank || "Assigned by Admin"}</strong>
              </div>
              <div style={{ padding: "10px 12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <small style={{ display: "block", color: "#64748b", fontWeight: 600 }}>Total Network</small>
                <strong style={{ color: "#0f172a" }}>{totalNetworkCount}</strong>
              </div>
              <div style={{ padding: "10px 12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <small style={{ display: "block", color: "#64748b", fontWeight: 600 }}>Direct Member</small>
                <strong style={{ color: "#0f172a" }}>{directMembersCount}</strong>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px", display: "grid", gap: "10px" }}>
            <strong style={{ display: "block", fontSize: "0.95rem", color: "#0f172a" }}>
              <i className="fa-solid fa-share-nodes" /> Referral Program
            </strong>
            {isPaymentApproved && referralCode ? (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div>
                    <small style={{ display: "block", color: "#64748b", fontWeight: 600 }}>Referral Code</small>
                    <strong style={{ color: "#0f172a" }}>{referralCode}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyReferralText("code", referralCode)}
                    style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", fontWeight: 600, cursor: "pointer" }}
                  >
                    {copiedReferral === "code" ? "Copied" : "Copy Code"}
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <small style={{ display: "block", color: "#64748b", fontWeight: 600 }}>Referral Link</small>
                    <span style={{ display: "block", fontSize: "0.86rem", color: "#0f172a", overflowWrap: "anywhere" }}>{referralLink}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyReferralText("link", referralLink)}
                    style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", fontWeight: 600, cursor: "pointer" }}
                  >
                    {copiedReferral === "link" ? "Copied" : "Copy Link"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: "12px 14px", borderRadius: "10px", background: "#fef2f2", border: "1px solid #fee2e2", color: "#991b1b", display: "flex", alignItems: "center", gap: "10px" }}>
                <i className="fa-solid fa-lock" />
                <span style={{ fontSize: "0.88rem", fontWeight: 500 }}>
                  Referral code and invite link will be unlocked once payment is approved by administrator.
                </span>
              </div>
            )}
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
          hasData={hasSectionA}
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
            value={profile.owner_full_legal_name || profile.owner_name || profile.full_name}
          />

          <PublicField
            label="Father / Spouse Name"
            value={profile.father_spouse_name || profile.father_name}
          />

          <PublicField
            label="Date of Birth"
            value={profile.date_of_birth || profile.dob}
          />

          <PublicField
            label="Gender"
            value={profile.gender}
          />

          <PublicField
            label="Marital Status"
            value={profile.marital_status}
          />

          <PublicField
            label="Nationality"
            value={profile.nationality || "Indian"}
          />

          <PublicField
            label="Aadhaar Number / Card"
            value={profile.aadhaar_number ? (profile.aadhaar_number.length > 4 ? `•••• •••• ${profile.aadhaar_number.slice(-4)}` : profile.aadhaar_number) : ""}
            privateField
          />

          <PublicField
            label="PAN Number / Card"
            value={profile.pan_number ? (profile.pan_number.length > 4 ? `••••••${profile.pan_number.slice(-4)}` : profile.pan_number) : ""}
            privateField
          />

          <PublicField
            label="Passport Number"
            value={profile.passport_number}
            privateField
          />

          <PublicField
            label="Voter ID"
            value={profile.voter_id}
            privateField
          />

          <PublicField
            label="Driving License"
            value={profile.driving_license}
            privateField
          />

          <PublicField
            label="Blood Group"
            value={profile.blood_group}
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
          hasData={hasSectionB}
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
            label="Firm Registration Type"
            value={
              profile.firm_registration_type ||
              profile.business_type
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
            value={
              profile.business_registration_number ||
              profile.registration_number
            }
            privateField
          />

          <PublicField
            label="Company PAN / TAN"
            value={
              profile.company_pan ||
              profile.pan_number ||
              profile.pan
            }
            privateField
          />

          <PublicField
            label="Authorized Signatory PAN"
            value={
              profile.authorized_pan ||
              profile.signatory_pan
            }
            privateField
          />

          <PublicField
            label="Registration Certificate"
            privateField
          />

          <PublicField
            label="GST Certificate / Number"
            value={
              profile.gst_number ||
              profile.gstin
            }
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
          hasData={hasSectionC}
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
          hasData={hasSectionD}
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
            value={
              profile.bank_account_number
                ? (profile.bank_account_number.length > 4
                    ? `•••• •••• ${profile.bank_account_number.slice(-4)}`
                    : profile.bank_account_number)
                : profile.account_number
            }
            privateField
          />

          <PublicField
            label="IFSC Code"
            value={
              profile.ifsc_code ||
              profile.ifsc
            }
            privateField
          />

          <PublicField
            label="Bank Branch"
            value={
              profile.bank_branch_name ||
              profile.bank_branch ||
              profile.branch
            }
            privateField
          />

          <PublicField
            label="UPI ID"
            value={
              profile.upi_id
            }
            privateField
          />

          <PublicField
            label="GST Number"
            value={
              profile.gst_number ||
              profile.gstin
            }
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
            value={profile.nominee_name}
            privateField
          />

          <PublicField
            label="Nominee Relationship"
            value={profile.nominee_relationship || profile.nominee_relation}
            privateField
          />

          <PublicField
            label="Nominee Aadhaar / ID"
            value={profile.nominee_aadhaar_id || profile.nominee_aadhaar ? (String(profile.nominee_aadhaar_id || profile.nominee_aadhaar).length > 4 ? `•••• •••• ${String(profile.nominee_aadhaar_id || profile.nominee_aadhaar).slice(-4)}` : String(profile.nominee_aadhaar_id || profile.nominee_aadhaar)) : ""}
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
          hasData={hasSectionE}
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
            value={profile.annual_turnover_slab}
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
            label="Bio"
            value={
              toText(profile.business_bio) ||
              buildDefaultBio({
                name: businessName,
                plan: profile.selected_plan || "2999",
                membershipType: "Commercial Member",
              })
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
          title="My Network Profile"
          subtitle="Admin-assigned rank, total network and direct members"
          icon="fa-solid fa-tree"
          iconBg="#dbeafe"
          hasData={hasSectionF}
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
            label="Rank (Admin Controlled)"
            value={
              adminRank ||
              "Assigned by Admin"
            }
          />

          <PublicField
            label="Total Network"
            value={String(totalNetworkCount)}
          />

          <PublicField
            label="Direct Member"
            value={String(directMembersCount)}
          />

          {referralCode && (
            <PublicField
              label="Referral Code"
              value={referralCode}
            />
          )}
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
          hasData={hasSectionG}
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
            value={profile.emergency_contact_name}
            privateField
          />

          <PublicField
            label="Emergency Contact Number"
            value={profile.emergency_contact_number ? (profile.emergency_contact_number.length > 4 ? `••••••${profile.emergency_contact_number.slice(-4)}` : profile.emergency_contact_number) : ""}
            privateField
          />

          <PublicField
            label="Relationship"
            value={profile.relationship || profile.emergency_relationship}
            privateField
          />

          <PublicField
            label="Nominee Information"
            value={profile.nominee_name ? `${profile.nominee_name} (${profile.nominee_relationship || profile.relationship || "Nominee"})` : ""}
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