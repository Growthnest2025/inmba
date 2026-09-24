import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import "@fortawesome/fontawesome-free/css/all.min.css";

import {
  getCivilianKyc,
} from "../../services/CivilianKyc.service";

import "./CivilianReview.css";

/* =========================================================
   CIVILIAN REVIEW
   Basic → Login → Membership → Full KYC → Review → Payment
========================================================= */

const KYC_SECTIONS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
];

const MAIN_FLOW_STEPS = [
  {
    key: "basic",
    label: "Basic KYC",
    icon: "fa-solid fa-user",
  },
  {
    key: "login",
    label: "Login",
    icon: "fa-solid fa-right-to-bracket",
  },
  {
    key: "membership",
    label: "Membership",
    icon: "fa-solid fa-id-card",
  },
  {
    key: "full-kyc",
    label: "Full KYC",
    icon: "fa-solid fa-file-shield",
  },
  {
    key: "review",
    label: "Review",
    icon: "fa-solid fa-clipboard-check",
  },
  {
    key: "payment",
    label: "Payment",
    icon: "fa-solid fa-credit-card",
  },
  {
    key: "complete",
    label: "Complete",
    icon: "fa-solid fa-circle-check",
  },
];

const SECTION_META = {
  A: {
    title: "Identity & KYC",
    icon: "fa-solid fa-address-card",
  },
  B: {
    title: "Contact & Address",
    icon: "fa-solid fa-location-dot",
  },
  C: {
    title: "Financial & Bank",
    icon: "fa-solid fa-building-columns",
  },
  D: {
    title: "Education & Qualification",
    icon: "fa-solid fa-graduation-cap",
  },
  E: {
    title: "Achievements & Certifications",
    icon: "fa-solid fa-award",
  },
  F: {
    title: "Interest, Skills & Bio",
    icon: "fa-solid fa-user-tie",
  },
  G: {
    title: "Network & Royalty",
    icon: "fa-solid fa-network-wired",
  },
  H: {
    title: "Emergency Contact",
    icon: "fa-solid fa-phone-volume",
  },
};

const FIELD_LABELS = {
  father_spouse_name: "Father / Spouse Name",
  gender: "Gender",
  marital_status: "Marital Status",
  nationality: "Nationality",
  aadhaar_number: "Aadhaar Number",
  aadhar_number: "Aadhaar Number",
  pan_number: "PAN Number",
  passport_number: "Passport Number",
  voter_id: "Voter ID",
  driving_license: "Driving Licence",
  blood_group: "Blood Group",
  aadhaar_front: "Aadhaar Front",
  aadhaar_back: "Aadhaar Back",
  aadhar_front: "Aadhaar Front",
  aadhar_back: "Aadhaar Back",
  pan_front: "PAN Card",

  secondary_mobile: "Secondary Mobile",
  whatsapp_number: "WhatsApp Number",
  current_address: "Current Address",
  permanent_address: "Permanent Address",
  city: "City",
  district: "District",
  state: "State",
  pincode: "Pincode",
  google_map_location: "Google Map Location",
  address_proof: "Address Proof",

  account_holder_name: "Account Holder Name",
  account_holder: "Account Holder Name",
  bank_name: "Bank Name",
  bank_account_number: "Bank Account Number",
  account_number: "Bank Account Number",
  ifsc_code: "IFSC Code",
  ifsc: "IFSC Code",
  bank_branch_name: "Bank Branch",
  branch: "Bank Branch",
  upi_id: "UPI ID",
  gst_number: "GST Number",
  income_tax_slab: "Income Tax Slab",
  nominee_name: "Nominee Name",
  nomini_name: "Nominee Name",
  nominee_relationship: "Nominee Relationship",
  nomini_relationship: "Nominee Relationship",
  bank_proof: "Bank Proof",

  highest_qualification: "Highest Qualification",
  education: "Highest Qualification",
  educational_qualification: "Qualification Details",
  school_college_name: "School / College Name",
  degree_year: "Degree / Certificate Year",
  degree_certificate_year: "Degree / Certificate Year",
  additional_certifications: "Additional Certifications",
  language_skills: "Language Skills",
  education_certificate: "Education Certificate",

  awards_recognitions: "Awards & Recognitions",
  publications: "Publications",
  professional_certifications: "Professional Certifications",
  key_milestones: "Key Milestones",
  media_mentions: "Media Mentions",
  testimonials: "Testimonials",
  reference_letters: "Testimonials / References",

  bio: "Bio / About",
  professional_bio: "Bio / About",
  interest_categories: "Interest Categories",
  skills: "Skills",
  hobbies: "Hobbies",
  preferred_industry: "Preferred Industry",
  facebook_url: "Facebook",
  instagram_url: "Instagram",
  linkedin_url: "LinkedIn",
  youtube_url: "YouTube",
  website_portfolio: "Website / Portfolio",
  portfolio_url: "Portfolio URL",
  social_link: "Social Media Link",

  sponsor_referral_id: "Sponsor / Referral ID",
  referral_id: "Sponsor / Referral ID",
  referred_by: "Referred By",
  network_level_rank: "Network Level / Rank",
  network_level: "Network Level",
  direct_network: "Direct Network",
  indirect_network: "Indirect Network",
  team_size: "Team Size",
  royalty_slab_category: "Royalty Slab",
  preferred_payout_cycle: "Preferred Payout Cycle",

  emergency_contact_name: "Emergency Contact Name",
  emergency_contact_number: "Emergency Contact Number",
  emergency_relationship: "Relationship",
};

const FILE_FIELDS = new Set([
  "aadhaar_front",
  "aadhaar_back",
  "aadhar_front",
  "aadhar_back",
  "pan_front",
  "address_proof",
  "bank_proof",
  "education_certificate",
  "profile_pic",
  "profile_photo",
  "cover_photo",
]);

const HIDDEN_FIELDS = new Set([
  "id",
  "_id",
  "password",
  "password_hash",
  "token",
  "created_at",
  "updated_at",
  "success",
  "message",
  "statusCode",

  // Basic KYC details are shown only once in Member Summary.
  "full_legal_name",
  "full_name",
  "dob",
  "primary_mobile",
  "primary_email",

  "civilian_kyc_current_step",
  "civilian_kyc_status",
  "civilian_kyc_submitted_at",
  "civilian_kyc_completed_at",
  "civilian_kyc_rejection_reason",
]);

const toText = (value) => {
  if (
    value === null ||
    typeof value === "undefined"
  ) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .join(", ");
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return "";
  }

  return String(value).trim();
};

const asObject = (value) => {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
};

const unwrapResult = (result) => {
  const source = asObject(result);
  const data = asObject(source.data);

  return {
    ...source,
    ...data,
  };
};

const getMember = (data) => {
  const member =
    data?.member ||
    data?.memberData ||
    data?.basicKyc ||
    data?.profile ||
    data?.user ||
    {};

  const firstName =
    toText(member?.first_name);

  const lastName =
    toText(member?.last_name);

  const displayName =
    toText(
      member?.full_name ||
      member?.name ||
      member?.full_legal_name
    ) ||
    [firstName, lastName]
      .filter(Boolean)
      .join(" ") ||
    "Civilian Member";

  return {
    ...member,
    displayName,

    loginId:
      toText(
        member?.login_id ||
        member?.loginId
      ),

    phone:
      toText(
        member?.phone ||
        member?.mobile ||
        member?.primary_mobile
      ),

    email:
      toText(
        member?.email ||
        member?.primary_email
      ),

    dob:
      toText(member?.dob),

    profilePhoto:
      toText(
        member?.profile_photo ||
        member?.profile_pic
      ),
  };
};

const getSections = (data) => {
  return (
    data?.sections ||
    data?.valuesBySection ||
    data?.kycSections ||
    data?.sectionValues ||
    {}
  );
};

const getPlan = ({
  searchParams,
  location,
  data,
}) => {
  const urlPlan =
    toText(
      searchParams.get("plan")
    );

  const statePlan =
    toText(
      location.state?.selectedPlan ||
      location.state?.selected_plan
    );

  let storagePlan = "";

  try {
    storagePlan =
      toText(
        window.localStorage.getItem(
          "civilianSelectedPlan"
        )
      );
  } catch {
    storagePlan = "";
  }

  const serverPlan =
    toText(
      data?.selected_plan ||
      data?.selectedPlan ||
      data?.plan ||
      data?.kyc?.selected_plan
    );

  const candidate =
    urlPlan ||
    statePlan ||
    storagePlan ||
    serverPlan;

  return ["300", "1500"].includes(
    candidate
  )
    ? candidate
    : "";
};

const getFileName = (value) => {
  const text =
    toText(value);

  if (!text) {
    return "";
  }

  return (
    text
      .replace(/\\/g, "/")
      .split("/")
      .filter(Boolean)
      .pop() ||
    text
  );
};

const humanizeField = (value) => {
  return toText(value)
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
};

const maskAadhaar = (value) => {
  const text =
    toText(value)
      .replace(/\s/g, "");

  if (
    !/^\d{12}$/.test(text)
  ) {
    return text;
  }

  return `XXXX XXXX ${text.slice(-4)}`;
};

const formatValue = (
  field,
  value
) => {
  if (
    FILE_FIELDS.has(field)
  ) {
    return (
      getFileName(value) ||
      "Not uploaded"
    );
  }

  if (
    Array.isArray(value)
  ) {
    return value
      .filter(Boolean)
      .join(", ");
  }

  if (
    value &&
    typeof value === "object"
  ) {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }

  const text =
    toText(value);

  if (
    ["aadhaar_number", "aadhar_number"].includes(
      field
    )
  ) {
    return maskAadhaar(text);
  }

  return text;
};

const getDisplayEntries = (
  values
) => {
  return Object.entries(
    asObject(values)
  )
    .filter(
      ([key, value]) => {
        if (
          HIDDEN_FIELDS.has(key)
        ) {
          return false;
        }

        if (
          key.startsWith(
            "civilian_section_"
          )
        ) {
          return false;
        }

        return Boolean(
          formatValue(
            key,
            value
          )
        );
      }
    )
    .map(
      ([key, value]) => ({
        key,
        label:
          FIELD_LABELS[key] ||
          humanizeField(key),
        value:
          formatValue(
            key,
            value
          ),
        file:
          FILE_FIELDS.has(key),
      })
    );
};

const isTrueValue = (value) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
};

export default function CivilianReview() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    searchParams,
  ] =
    useSearchParams();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    confirming,
    setConfirming,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    data,
    setData,
  ] =
    useState({});

  const [
    privacyConsent,
    setPrivacyConsent,
  ] =
    useState(false);

  const [
    declarationAccepted,
    setDeclarationAccepted,
  ] =
    useState(false);

  const [
    consentErrors,
    setConsentErrors,
  ] =
    useState({});

  const loadReview =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const result =
            await getCivilianKyc();

          setData(
            unwrapResult(result)
          );
        } catch (
          requestError
        ) {
          setError(
            requestError?.response?.data?.message ||
            requestError?.apiMessage ||
            requestError?.message ||
            "Unable to load Civilian KYC review."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(
    () => {
      loadReview();
    },
    [
      loadReview,
    ]
  );

  const member =
    useMemo(
      () =>
        getMember(data),
      [data]
    );

  const sections =
    useMemo(
      () =>
        getSections(data),
      [data]
    );

  const selectedPlan =
    useMemo(
      () =>
        getPlan({
          searchParams,
          location,
          data,
        }),
      [
        searchParams,
        location,
        data,
      ]
    );

  const membershipLevel =
    selectedPlan === "1500"
      ? "INMBA Network Royalty Member"
      : selectedPlan === "300"
      ? "INMBA Network Member"
      : "Civilian Membership";

  const completionMap =
    useMemo(
      () => {
        const result = {};

        const progress =
          asObject(
            data?.progress ||
            data?.kycProgress
          );

        const progressSections =
          asObject(
            progress?.sections
          );

        KYC_SECTIONS.forEach(
          (section) => {
            const lower =
              section.toLowerCase();

            const possible =
              progressSections?.[
                section
              ] ??
              progressSections?.[
                lower
              ] ??
              data?.[
                `civilian_section_${lower}_completed`
              ] ??
              data?.[
                `section_${lower}_completed`
              ];

            if (
              typeof possible !==
              "undefined"
            ) {
              result[section] =
                isTrueValue(possible);
              return;
            }

            // Fallback for older Civilian API responses:
            // if the section has saved values, treat it as completed
            // for the review visual only.
            result[section] =
              Object.keys(
                asObject(
                  sections?.[
                    section
                  ] ||
                  sections?.[
                    lower
                  ]
                )
              ).length > 0;
          }
        );

        return result;
      },
      [
        data,
        sections,
      ]
    );

  const completedCount =
    KYC_SECTIONS.filter(
      (section) =>
        completionMap?.[
          section
        ]
    ).length;

  const allSectionsCompleted =
    completedCount ===
    KYC_SECTIONS.length;

  const progressPercent =
    Math.round(
      (
        completedCount /
        KYC_SECTIONS.length
      ) *
      100
    );

  const handleEditKyc =
    () => {
      const suffix =
        selectedPlan
          ? `?plan=${encodeURIComponent(
              selectedPlan
            )}`
          : "";

      navigate(
        `/civilian-kyc${suffix}`,
        {
          state: {
            fromReview: true,
            selectedPlan,
            selected_plan:
              selectedPlan,
          },
        }
      );
    };

  const handleConfirmAndPayment =
    async () => {
      if (confirming) {
        return;
      }

      const nextErrors = {};

      if (!privacyConsent) {
        nextErrors.privacyConsent =
          "Please accept the privacy consent.";
      }

      if (!declarationAccepted) {
        nextErrors.declarationAccepted =
          "Please confirm the member declaration.";
      }

      setConsentErrors(
        nextErrors
      );

      if (
        Object.keys(
          nextErrors
        ).length
      ) {
        return;
      }

      if (!selectedPlan) {
        setError(
          "Selected Civilian membership plan is missing. Please return to the membership plan page."
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      try {
        setConfirming(true);
        setError("");

        try {
          window.sessionStorage.setItem(
            "civilianKycReviewed",
            "true"
          );

          window.sessionStorage.setItem(
            "civilianSelectedPlan",
            selectedPlan
          );
        } catch {
          // Optional storage only.
        }

        navigate(
          `/payment?plan=${encodeURIComponent(
            selectedPlan
          )}`,
          {
            replace: true,
            state: {
              civilianKycSubmitted:
                true,
              civilianKycReviewed:
                true,
              selectedPlan,
              selected_plan:
                selectedPlan,
            },
          }
        );
      } finally {
        setConfirming(false);
      }
    };

  if (loading) {
    return (
      <main className="civilian-review-page">
        <div className="civilian-review-loading">
          <span className="civilian-review-spinner" />
          <h2>
            Loading your KYC review...
          </h2>
          <p>
            Please wait while we prepare your Civilian Full KYC details.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="civilian-review-page">
      {/* HEADER */}
      <header className="civilian-review-header">
        <div className="civilian-review-header-inner">
          <div className="civilian-review-brand">
            <div className="civilian-review-brand-icon">
              <i className="fa-solid fa-clipboard-check" />
            </div>

            <div>
              <h1>
                INMBA Civilian
              </h1>
              <p>
                Membership KYC Review
              </p>
            </div>
          </div>

          <div className="civilian-review-header-plan">
            <span>
              Selected Plan
            </span>
            <strong>
              {selectedPlan
                ? `₹${selectedPlan}`
                : "—"}
            </strong>
          </div>
        </div>
      </header>

      {/* FLOW */}
      <section className="civilian-review-flow-wrapper">
        <div className="civilian-review-flow">
          {MAIN_FLOW_STEPS.map(
            (step, index) => {
              const completed =
                index < 4;

              const active =
                step.key ===
                "review";

              return (
                <React.Fragment
                  key={step.key}
                >
                  <div
                    className={[
                      "civilian-review-flow-item",
                      completed
                        ? "completed"
                        : "",
                      active
                        ? "active"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className="civilian-review-flow-icon">
                      {completed ? (
                        <i className="fa-solid fa-check" />
                      ) : (
                        <i
                          className={
                            step.icon
                          }
                        />
                      )}
                    </div>

                    <span>
                      {step.label}
                    </span>
                  </div>

                  {index <
                    MAIN_FLOW_STEPS.length -
                      1 && (
                    <div
                      className={[
                        "civilian-review-flow-line",
                        index < 4
                          ? "completed"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />
                  )}
                </React.Fragment>
              );
            }
          )}
        </div>
      </section>

      <main className="civilian-review-container">
        {error && (
          <div className="civilian-review-page-error">
            <i className="fa-solid fa-circle-exclamation" />
            <span>
              {error}
            </span>
            <button
              type="button"
              onClick={
                loadReview
              }
              aria-label="Reload review"
            >
              <i className="fa-solid fa-rotate-right" />
            </button>
          </div>
        )}

        {/* MEMBER */}
        <section className="civilian-review-member-card">
          <div className="civilian-review-member-main">
            <div className="civilian-review-avatar">
              {member.profilePhoto ? (
                <img
                  src={
                    member.profilePhoto
                  }
                  alt={
                    member.displayName
                  }
                />
              ) : (
                <i className="fa-solid fa-user" />
              )}
            </div>

            <div className="civilian-review-member-info">
              <span>
                Civilian Member
              </span>

              <h2>
                {member.displayName}
              </h2>

              <div className="civilian-review-member-meta">
                <span>
                  <i className="fa-solid fa-id-badge" />
                  {member.loginId ||
                    "—"}
                </span>

                <span>
                  <i className="fa-solid fa-envelope" />
                  {member.email ||
                    "Email not provided"}
                </span>

                <span>
                  <i className="fa-solid fa-phone" />
                  {member.phone ||
                    "—"}
                </span>

                <span>
                  <i className="fa-solid fa-calendar-days" />
                  {member.dob ||
                    "DOB not provided"}
                </span>
              </div>
            </div>
          </div>

          <div className="civilian-review-payment-summary">
            <span>
              Membership Amount
            </span>

            <strong>
              {selectedPlan
                ? `₹${selectedPlan}`
                : "—"}
            </strong>

            <small>
              {membershipLevel}
            </small>
          </div>
        </section>

        {/* COMPLETION */}
        <section className="civilian-review-completion-card">
          <div className="civilian-review-completion-heading">
            <div>
              <span>
                Full KYC Completion
              </span>

              <h3>
                Civilian KYC Sections A–H
              </h3>
            </div>

            <strong>
              {completedCount}/
              {KYC_SECTIONS.length}
            </strong>
          </div>

          <div className="civilian-review-progress-track">
            <div
              className="civilian-review-progress-bar"
              style={{
                width:
                  `${progressPercent}%`,
              }}
            />
          </div>

          <div className="civilian-review-section-status-list">
            {KYC_SECTIONS.map(
              (section) => {
                const completed =
                  completionMap?.[
                    section
                  ];

                return (
                  <div
                    key={section}
                    className={[
                      "civilian-review-section-status",
                      completed
                        ? "completed"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span>
                      {completed ? (
                        <i className="fa-solid fa-check" />
                      ) : (
                        section
                      )}
                    </span>

                    <small>
                      {section}
                    </small>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* INTRO */}
        <section className="civilian-review-intro">
          <div className="civilian-review-intro-icon">
            <i className="fa-solid fa-magnifying-glass" />
          </div>

          <div>
            <span>
              FINAL REVIEW
            </span>

            <h2>
              Confirm Your Civilian Details
            </h2>

            <p>
              Review the information entered in Sections A–H.
              If anything needs to be changed, return to Full KYC
              before continuing to payment.
            </p>
          </div>
        </section>

        {/* A-H */}
        <div className="civilian-review-sections">
          {KYC_SECTIONS.map(
            (section, index) => {
              const values =
                asObject(
                  sections?.[
                    section
                  ] ||
                  sections?.[
                    section.toLowerCase()
                  ]
                );

              const entries =
                getDisplayEntries(
                  values
                );

              const completed =
                completionMap?.[
                  section
                ];

              const meta =
                SECTION_META[
                  section
                ] || {};

              return (
                <details
                  key={section}
                  className="civilian-review-section-card"
                  open={
                    index === 0
                  }
                >
                  <summary className="civilian-review-section-summary">
                    <div className="civilian-review-section-summary-left">
                      <div
                        className={[
                          "civilian-review-section-letter",
                          completed
                            ? "completed"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {completed ? (
                          <i className="fa-solid fa-check" />
                        ) : (
                          section
                        )}
                      </div>

                      <div>
                        <span>
                          Section {section}
                        </span>

                        <h3>
                          {meta.title ||
                            `Section ${section}`}
                        </h3>
                      </div>
                    </div>

                    <div className="civilian-review-section-summary-right">
                      <span
                        className={
                          completed
                            ? "completed"
                            : "incomplete"
                        }
                      >
                        {completed
                          ? "Completed"
                          : "Incomplete"}
                      </span>

                      <i className="fa-solid fa-chevron-down" />
                    </div>
                  </summary>

                  <div className="civilian-review-section-body">
                    {entries.length >
                    0 ? (
                      <div className="civilian-review-detail-grid">
                        {entries.map(
                          (item) => (
                            <div
                              key={
                                item.key
                              }
                              className={[
                                "civilian-review-detail-item",
                                item.file
                                  ? "file"
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            >
                              <span>
                                {item.label}
                              </span>

                              <strong>
                                {item.file && (
                                  <i className="fa-solid fa-file-shield" />
                                )}

                                {item.value}
                              </strong>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="civilian-review-empty-section">
                        <i className="fa-regular fa-folder-open" />
                        <span>
                          No review data available.
                        </span>
                      </div>
                    )}
                  </div>
                </details>
              );
            }
          )}
        </div>

        {/* READY */}
        <section
          className={[
            "civilian-review-ready-card",
            allSectionsCompleted
              ? "ready"
              : "not-ready",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="civilian-review-ready-icon">
            <i
              className={
                allSectionsCompleted
                  ? "fa-solid fa-circle-check"
                  : "fa-solid fa-circle-exclamation"
              }
            />
          </div>

          <div>
            <strong>
              {allSectionsCompleted
                ? "Full KYC A–H Completed"
                : "Full KYC Review"}
            </strong>

            <p>
              {allSectionsCompleted
                ? "All Civilian KYC sections are available for final review. Confirm the declarations below before payment."
                : "Please review the saved Civilian KYC details. If any section is missing, return to Full KYC and complete it."}
            </p>
          </div>
        </section>

        {/* CONSENT */}
        <section className="civilian-review-consent-card">
          <div className="civilian-review-consent-heading">
            <div className="civilian-review-consent-heading-icon">
              <i className="fa-solid fa-file-signature" />
            </div>

            <div>
              <span>
                FINAL CONFIRMATION
              </span>

              <h3>
                Consent & Declaration
              </h3>

              <p>
                Both confirmations are required before continuing to payment.
              </p>
            </div>
          </div>

          <label
            className={[
              "civilian-review-consent-option",
              consentErrors
                .privacyConsent
                ? "has-error"
                : "",
              privacyConsent
                ? "checked"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <input
              type="checkbox"
              checked={
                privacyConsent
              }
              onChange={
                (event) => {
                  const checked =
                    event.target
                      .checked;

                  setPrivacyConsent(
                    checked
                  );

                  if (checked) {
                    setConsentErrors(
                      (previous) => ({
                        ...previous,
                        privacyConsent:
                          "",
                      })
                    );
                  }
                }
              }
            />

            <span className="civilian-review-checkbox">
              {privacyConsent && (
                <i className="fa-solid fa-check" />
              )}
            </span>

            <div>
              <strong>
                Privacy Consent
              </strong>

              <p>
                I consent to INMBA securely processing the Civilian KYC information
                and documents provided for membership verification.
              </p>
            </div>
          </label>

          {consentErrors
            .privacyConsent && (
            <small className="civilian-review-consent-error">
              <i className="fa-solid fa-circle-exclamation" />
              {
                consentErrors
                  .privacyConsent
              }
            </small>
          )}

          <label
            className={[
              "civilian-review-consent-option",
              consentErrors
                .declarationAccepted
                ? "has-error"
                : "",
              declarationAccepted
                ? "checked"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <input
              type="checkbox"
              checked={
                declarationAccepted
              }
              onChange={
                (event) => {
                  const checked =
                    event.target
                      .checked;

                  setDeclarationAccepted(
                    checked
                  );

                  if (checked) {
                    setConsentErrors(
                      (previous) => ({
                        ...previous,
                        declarationAccepted:
                          "",
                      })
                    );
                  }
                }
              }
            />

            <span className="civilian-review-checkbox">
              {declarationAccepted && (
                <i className="fa-solid fa-check" />
              )}
            </span>

            <div>
              <strong>
                Member Declaration
              </strong>

              <p>
                I confirm that the information and documents provided in Sections A–H
                are true and correct to the best of my knowledge.
              </p>
            </div>
          </label>

          {consentErrors
            .declarationAccepted && (
            <small className="civilian-review-consent-error">
              <i className="fa-solid fa-circle-exclamation" />
              {
                consentErrors
                  .declarationAccepted
              }
            </small>
          )}
        </section>

        {/* PAYMENT NEXT */}
        <section className="civilian-review-payment-card">
          <div className="civilian-review-payment-icon">
            <i className="fa-solid fa-credit-card" />
          </div>

          <div className="civilian-review-payment-content">
            <span>
              NEXT STEP
            </span>

            <h3>
              Civilian Membership Payment
            </h3>

            <p>
              Confirm your Full KYC review and continue with the selected membership payment.
            </p>
          </div>

          <div className="civilian-review-payment-amount">
            <span>
              Selected Amount
            </span>

            <strong>
              {selectedPlan
                ? `₹${selectedPlan}`
                : "—"}
            </strong>

            <small>
              {membershipLevel}
            </small>
          </div>
        </section>

        {/* ACTIONS */}
        <div className="civilian-review-actions">
          <button
            type="button"
            className="civilian-review-edit-button"
            onClick={
              handleEditKyc
            }
            disabled={
              confirming
            }
          >
            <i className="fa-solid fa-arrow-left" />
            Edit KYC Details
          </button>

          <button
            type="button"
            className="civilian-review-confirm-button"
            onClick={
              handleConfirmAndPayment
            }
            disabled={
              confirming ||
              !selectedPlan
            }
          >
            {confirming ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />
                Opening Payment...
              </>
            ) : (
              <>
                Confirm & Continue to Payment
                <i className="fa-solid fa-arrow-right" />
              </>
            )}
          </button>
        </div>

        <div className="civilian-review-security">
          <i className="fa-solid fa-lock" />
          <span>
            Your Civilian KYC information is private and securely processed by INMBA.
          </span>
        </div>
      </main>
    </div>
  );
}
