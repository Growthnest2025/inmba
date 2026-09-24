import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getCommercialKyc,
  reopenCommercialKyc,
  saveCommercialKycDraft,
} from "../../../services/commercialKyc.service";

import {
  getCommercialDashboard,
} from "../../../services/commercialDashboard.service";

import "./CommercialProfileEdit.css";

/* =========================================================
   SECTIONS
========================================================= */

const SECTION_IDS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
];

/* =========================================================
   EMPTY FORM
========================================================= */

const EMPTY_FORM = {
  A: {
    owner_full_legal_name: "",
    father_spouse_name: "",
    date_of_birth: "",
    gender: "",
    marital_status: "",
    nationality: "Indian",
    aadhaar_number: "",
    pan_number: "",
    passport_number: "",
    voter_id: "",
    driving_license: "",
    blood_group: "",
  },

  B: {
    business_company_name: "",
    business_type: "",
    business_registration_number: "",
    company_pan_tan: "",
    gst_applicable: false,
    shop_establishment_license_required: false,
    industry_license_required: false,
  },

  C: {
    registered_business_address: "",
    branch_locations: "",
    business_contact_number: "",
    business_email: "",
    business_website: "",
    google_map_location: "",
  },

  D: {
    bank_account_number: "",
    ifsc_code: "",
    bank_branch_name: "",
    upi_id: "",
    gst_applicable: false,
    gst_number: "",
    income_tax_declaration: "",
    nominee_name: "",
    nominee_relationship: "",
    nominee_aadhaar_id: "",
  },

  E: {
    year_established: "",
    number_of_employees: "",
    annual_turnover_slab: "",
    products_services_offered: "",
    business_category_tags: "",
    awards_certifications: "",
    client_testimonials: "",
    business_bio: "",
    social_media_links: "",
  },

  F: {
    preferred_payout_cycle: "",
  },

  G: {
    emergency_contact_name: "",
    emergency_contact_number: "",
    relationship: "",
  },
};

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
    return value.join(
      ", "
    );
  }

  if (
    typeof value ===
    "object"
  ) {
    return "";
  }

  return String(
    value
  );
};

const unwrapResult = (
  result
) => {
  if (
    result?.data &&
    typeof result.data ===
      "object" &&
    !Array.isArray(
      result.data
    )
  ) {
    return result.data;
  }

  if (
    result &&
    typeof result ===
      "object"
  ) {
    return result;
  }

  return {};
};

const mergeSections = (
  sections = {}
) => {
  const result = {};

  SECTION_IDS.forEach(
    (
      sectionId
    ) => {
      const source =
        sections
          ?.[sectionId] ||
        {};

      const emptySection =
        EMPTY_FORM[
          sectionId
        ];

      result[
        sectionId
      ] = {
        ...emptySection,
      };

      Object.keys(
        emptySection
      ).forEach(
        (
          fieldName
        ) => {
          const sourceValue =
            source[
              fieldName
            ];

          if (
            sourceValue ===
              null ||
            sourceValue ===
              undefined
          ) {
            return;
          }

          if (
            typeof emptySection[
              fieldName
            ] ===
            "boolean"
          ) {
            result[
              sectionId
            ][
              fieldName
            ] =
              Boolean(
                sourceValue
              );

            return;
          }

          result[
            sectionId
          ][
            fieldName
          ] =
            toText(
              sourceValue
            );
        }
      );
    }
  );

  return result;
};

const formatStatus = (
  value
) => {
  const status =
    String(
      value ||
      "draft"
    )
      .trim()
      .replace(
        /_/g,
        " "
      )
      .toLowerCase();

  return status.replace(
    /\b\w/g,
    (
      character
    ) =>
      character.toUpperCase()
  );
};

const getInitials = (
  value
) => {
  const words =
    String(
      value ||
      ""
    )
      .trim()
      .split(
        /\s+/
      )
      .filter(
        Boolean
      );

  if (
    words.length ===
    0
  ) {
    return "CM";
  }

  if (
    words.length ===
    1
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

/* =========================================================
   FIELD
========================================================= */

function EditField({
  label,
  section,
  name,
  value,
  type = "text",
  options = null,
  required = false,
  onChange,
}) {
  return (
    <div className="cpe-field">

      <label
        htmlFor={`${section}-${name}`}
      >
        {label}

        {required && (
          <span>
            *
          </span>
        )}
      </label>

      {options ? (
        <select
          id={`${section}-${name}`}
          value={
            value
          }
          onChange={
            (
              event
            ) =>
              onChange(
                section,
                name,
                event
                  .target
                  .value
              )
          }
        >
          <option value="">
            Select
          </option>

          {options.map(
            (
              option
            ) => (
              <option
                key={
                  option
                }
                value={
                  option
                }
              >
                {option}
              </option>
            )
          )}
        </select>
      ) : (
        <input
          id={`${section}-${name}`}
          type={
            type
          }
          value={
            value
          }
          onChange={
            (
              event
            ) =>
              onChange(
                section,
                name,
                event
                  .target
                  .value
              )
          }
        />
      )}

    </div>
  );
}

/* =========================================================
   TEXTAREA
========================================================= */

function EditTextArea({
  label,
  section,
  name,
  value,
  required = false,
  onChange,
}) {
  return (
    <div className="cpe-field cpe-field-full">

      <label
        htmlFor={`${section}-${name}`}
      >
        {label}

        {required && (
          <span>
            *
          </span>
        )}
      </label>

      <textarea
        id={`${section}-${name}`}
        value={
          value
        }
        onChange={
          (
            event
          ) =>
            onChange(
              section,
              name,
              event
                .target
                .value
            )
        }
      />

    </div>
  );
}

/* =========================================================
   CHECKBOX
========================================================= */

function EditToggle({
  label,
  section,
  name,
  checked,
  onChange,
}) {
  return (
    <label className="cpe-toggle">

      <input
        type="checkbox"
        checked={
          Boolean(
            checked
          )
        }
        onChange={
          (
            event
          ) =>
            onChange(
              section,
              name,
              event
                .target
                .checked
            )
        }
      />

      <span>
        {label}
      </span>

    </label>
  );
}

/* =========================================================
   SECTION CARD
========================================================= */

function EditSection({
  letter,
  icon,
  title,
  subtitle,
  children,
}) {
  return (
    <section className="cpe-section">

      <div className="cpe-section-heading">

        <span className="cpe-section-icon">
          <i
            className={
              icon
            }
          />
        </span>

        <div>
          <h2>
            {letter}.{" "}
            {title}
          </h2>

          <p>
            {subtitle}
          </p>
        </div>

      </div>

      <div className="cpe-grid">
        {children}
      </div>

    </section>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function CommercialProfileEdit() {
  const navigate =
    useNavigate();

  const [
    form,
    setForm,
  ] =
    useState(
      EMPTY_FORM
    );

  const [
    dashboard,
    setDashboard,
  ] =
    useState(
      null
    );

  const [
    kycStatus,
    setKycStatus,
  ] =
    useState(
      "draft"
    );

  const [
    canEdit,
    setCanEdit,
  ] =
    useState(
      true
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    success,
    setSuccess,
  ] =
    useState(
      ""
    );

  /* =======================================================
     LOAD PROFILE
  ======================================================= */

  const loadProfile =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          setSuccess(
            ""
          );

          const [
            kycResult,
            dashboardResult,
          ] =
            await Promise.all([
              getCommercialKyc(),
              getCommercialDashboard(),
            ]);

          let kycData =
            unwrapResult(
              kycResult
            );

          const currentStatus =
            String(
              kycData
                ?.status ||
              "draft"
            )
              .trim()
              .toLowerCase();

          /*
            Approved / rejected profile edit:

            Try existing reopen endpoint.

            If backend currently permits only rejected,
            approved edit will return 409.
          */

if (
  currentStatus === "rejected" &&
  kycData?.canEdit === false
)  {
            try {
              const reopenResult =
                await reopenCommercialKyc();

              kycData =
                unwrapResult(
                  reopenResult
                );
            } catch (
              reopenError
            ) {
              /*
                Do not crash page.

                Existing values are still shown.
                Save remains disabled until backend permits edit.
              */

              console.error(
                "Commercial KYC Reopen:",
                reopenError
              );

              setError(
                reopenError
                  ?.apiMessage ||
                "This approved Commercial KYC is currently locked by the backend. Existing details are shown below."
              );
            }
          }

          setForm(
            mergeSections(
              kycData
                ?.sections ||
              {}
            )
          );

          setKycStatus(
            kycData
              ?.status ||
            currentStatus
          );

          setCanEdit(
            kycData
              ?.canEdit !==
              false
          );

setCanEdit(
  ![
    "submitted",
    "under_review",
  ].includes(
    currentStatus
  )
);
        } catch (
          requestError
        ) {
          console.error(
            "Commercial Profile Edit Load Error:",
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
              "Your Commercial login session has expired. Please login again."
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
     UPDATE VALUE
  ======================================================= */

  const updateValue =
    (
      section,
      name,
      value
    ) => {
      setForm(
        (
          previous
        ) => ({
          ...previous,

          [section]: {
            ...previous[
              section
            ],

            [name]:
              value,
          },
        })
      );

      setError(
        ""
      );

      setSuccess(
        ""
      );
    };

  /* =======================================================
     SAVE ALL A-G

     Existing backend section save API is reused.
  ======================================================= */

  const handleSave =
    async () => {
      if (
        saving
      ) {
        return;
      }

      if (
        !canEdit
      ) {
        setError(
          "Commercial KYC is currently locked and cannot be edited."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        for (
          const sectionId
          of SECTION_IDS
        ) {
          await saveCommercialKycDraft(
            sectionId,
            {
              values:
                form[
                  sectionId
                ],

              files:
                {},
            }
          );
        }

        setSuccess(
          "Commercial profile changes saved successfully."
        );

        window.setTimeout(
          () => {
           navigate(
  "/commercial/full-profile",
  {
    replace: true,
  }
);
          },
          700
        );
      } catch (
        requestError
      ) {
        console.error(
          "Commercial Profile Edit Save Error:",
          requestError
        );

        setError(
          requestError
            ?.apiMessage ||
          requestError
            ?.message ||
          "Unable to save Commercial profile changes."
        );
      } finally {
        setSaving(
          false
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
      <main className="cpe-page">

        <div className="cpe-loading">

          <span />

          <strong>
            Loading Commercial Profile...
          </strong>

        </div>

      </main>
    );
  }

  /* =======================================================
     DATA

     NO HOOKS BELOW THIS POINT.
  ======================================================= */

  const member =
    dashboard
      ?.member ||
    {};

  const business =
    dashboard
      ?.business ||
    {};

  const businessName =
    toText(
      form
        ?.B
        ?.business_company_name
    ) ||
    toText(
      business
        ?.name
    ) ||
    "Commercial Member";

  const loginId =
    toText(
      member
        ?.loginId
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="cpe-page">

      <div className="cpe-shell">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="cpe-hero">

          <div>

            <span>
              INMBA COMMERCIAL MEMBER PORTAL
            </span>

            <h1>
              Edit Commercial Profile
            </h1>

            <p>
              Update your owner, business, contact,
              financial and Commercial information.
            </p>

          </div>

          <button
            type="button"
           onClick={() =>
  navigate(
    "/commercial/full-profile"
  )
}
          >
            <i className="fa-solid fa-arrow-left" />

            Back to Profile
          </button>

        </section>

        {/* =================================================
            MEMBER SUMMARY
        ================================================= */}

        <section className="cpe-member-summary">

          <div className="cpe-avatar">
            {getInitials(
              businessName
            )}
          </div>

          <div className="cpe-member-main">

            <strong>
              {businessName}
            </strong>

            <span>
              Login ID:{" "}
              {loginId ||
                "—"}
            </span>

          </div>

          <span className="cpe-member-type">
            Commercial Member
          </span>

          <span className="cpe-kyc-status">
            {formatStatus(
              kycStatus
            )}
          </span>

        </section>

        {/* =================================================
            ERROR / SUCCESS
        ================================================= */}

        {error && (
          <div
            className="cpe-alert error"
            role="alert"
          >
            <i className="fa-solid fa-circle-exclamation" />

            <span>
              {error}
            </span>
          </div>
        )}

        {success && (
          <div
            className="cpe-alert success"
            role="status"
          >
            <i className="fa-solid fa-circle-check" />

            <span>
              {success}
            </span>
          </div>
        )}

        {/* =================================================
            SECTION A
        ================================================= */}

        <EditSection
          letter="A"
          icon="fa-solid fa-user-shield"
          title="Owner Identity & KYC"
          subtitle="Update owner personal and KYC details."
        >
          <EditField
            label="Owner Full Legal Name"
            section="A"
            name="owner_full_legal_name"
            value={
              form.A
                .owner_full_legal_name
            }
            required
            onChange={
              updateValue
            }
          />

          <EditField
            label="Father / Spouse Name"
            section="A"
            name="father_spouse_name"
            value={
              form.A
                .father_spouse_name
            }
            required
            onChange={
              updateValue
            }
          />

          <EditField
            label="Date of Birth"
            section="A"
            name="date_of_birth"
            type="date"
            value={
              form.A
                .date_of_birth
            }
            required
            onChange={
              updateValue
            }
          />

          <EditField
            label="Gender"
            section="A"
            name="gender"
            value={
              form.A
                .gender
            }
            options={[
              "Male",
              "Female",
              "Other",
            ]}
            onChange={
              updateValue
            }
          />

          <EditField
            label="Marital Status"
            section="A"
            name="marital_status"
            value={
              form.A
                .marital_status
            }
            options={[
              "Single",
              "Married",
              "Other",
            ]}
            onChange={
              updateValue
            }
          />

          <EditField
            label="Nationality"
            section="A"
            name="nationality"
            value={
              form.A
                .nationality
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="Aadhaar Number"
            section="A"
            name="aadhaar_number"
            value={
              form.A
                .aadhaar_number
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="PAN Number"
            section="A"
            name="pan_number"
            value={
              form.A
                .pan_number
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="Passport Number"
            section="A"
            name="passport_number"
            value={
              form.A
                .passport_number
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="Voter ID"
            section="A"
            name="voter_id"
            value={
              form.A
                .voter_id
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="Driving License"
            section="A"
            name="driving_license"
            value={
              form.A
                .driving_license
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="Blood Group"
            section="A"
            name="blood_group"
            value={
              form.A
                .blood_group
            }
            onChange={
              updateValue
            }
          />
        </EditSection>

        {/* =================================================
            SECTION B
        ================================================= */}

        <EditSection
          letter="B"
          icon="fa-solid fa-building-shield"
          title="Business Legal & Registration"
          subtitle="Update business registration and legal details."
        >
          <EditField
            label="Business / Company Name"
            section="B"
            name="business_company_name"
            value={
              form.B
                .business_company_name
            }
            required
            onChange={
              updateValue
            }
          />

          <EditField
            label="Business Type"
            section="B"
            name="business_type"
            value={
              form.B
                .business_type
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="Business Registration Number"
            section="B"
            name="business_registration_number"
            value={
              form.B
                .business_registration_number
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="Company PAN / TAN"
            section="B"
            name="company_pan_tan"
            value={
              form.B
                .company_pan_tan
            }
            onChange={
              updateValue
            }
          />

          <EditToggle
            label="GST Applicable"
            section="B"
            name="gst_applicable"
            checked={
              form.B
                .gst_applicable
            }
            onChange={
              updateValue
            }
          />

          <EditToggle
            label="Shop / Establishment Licence Required"
            section="B"
            name="shop_establishment_license_required"
            checked={
              form.B
                .shop_establishment_license_required
            }
            onChange={
              updateValue
            }
          />

          <EditToggle
            label="Industry Licence Required"
            section="B"
            name="industry_license_required"
            checked={
              form.B
                .industry_license_required
            }
            onChange={
              updateValue
            }
          />
        </EditSection>

        {/* =================================================
            SECTION C
        ================================================= */}

        <EditSection
          letter="C"
          icon="fa-solid fa-location-dot"
          title="Business Contact & Address"
          subtitle="Update business contact and location information."
        >
          <EditTextArea
            label="Registered Business Address"
            section="C"
            name="registered_business_address"
            value={
              form.C
                .registered_business_address
            }
            required
            onChange={
              updateValue
            }
          />

          <EditTextArea
            label="Branch Locations"
            section="C"
            name="branch_locations"
            value={
              form.C
                .branch_locations
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="Business Contact Number"
            section="C"
            name="business_contact_number"
            value={
              form.C
                .business_contact_number
            }
            required
            onChange={
              updateValue
            }
          />

          <EditField
            label="Business Email"
            section="C"
            name="business_email"
            type="email"
            value={
              form.C
                .business_email
            }
            required
            onChange={
              updateValue
            }
          />

          <EditField
            label="Business Website"
            section="C"
            name="business_website"
            value={
              form.C
                .business_website
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="Google Map Location"
            section="C"
            name="google_map_location"
            value={
              form.C
                .google_map_location
            }
            onChange={
              updateValue
            }
          />
        </EditSection>

        {/* =================================================
            SECTION D
        ================================================= */}

        <EditSection
          letter="D"
          icon="fa-solid fa-building-columns"
          title="Financial & Bank"
          subtitle="Update private financial and bank details."
        >
          <EditField
            label="Bank Account Number"
            section="D"
            name="bank_account_number"
            value={
              form.D
                .bank_account_number
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="IFSC Code"
            section="D"
            name="ifsc_code"
            value={
              form.D
                .ifsc_code
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="Bank Branch Name"
            section="D"
            name="bank_branch_name"
            value={
              form.D
                .bank_branch_name
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="UPI ID"
            section="D"
            name="upi_id"
            value={
              form.D
                .upi_id
            }
            onChange={
              updateValue
            }
          />

          <EditToggle
            label="GST Applicable"
            section="D"
            name="gst_applicable"
            checked={
              form.D
                .gst_applicable
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="GST Number"
            section="D"
            name="gst_number"
            value={
              form.D
                .gst_number
            }
            onChange={
              updateValue
            }
          />

          <EditTextArea
            label="Income Tax Declaration"
            section="D"
            name="income_tax_declaration"
            value={
              form.D
                .income_tax_declaration
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="Nominee Name"
            section="D"
            name="nominee_name"
            value={
              form.D
                .nominee_name
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="Nominee Relationship"
            section="D"
            name="nominee_relationship"
            value={
              form.D
                .nominee_relationship
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="Nominee Aadhaar / ID"
            section="D"
            name="nominee_aadhaar_id"
            value={
              form.D
                .nominee_aadhaar_id
            }
            onChange={
              updateValue
            }
          />
        </EditSection>

        {/* =================================================
            SECTION E
        ================================================= */}

        <EditSection
          letter="E"
          icon="fa-solid fa-store"
          title="Business Profile & Achievements"
          subtitle="Update public-facing business profile information."
        >
          <EditField
            label="Year Established"
            section="E"
            name="year_established"
            value={
              form.E
                .year_established
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="Number of Employees"
            section="E"
            name="number_of_employees"
            type="number"
            value={
              form.E
                .number_of_employees
            }
            onChange={
              updateValue
            }
          />

          <EditField
            label="Annual Turnover Slab"
            section="E"
            name="annual_turnover_slab"
            value={
              form.E
                .annual_turnover_slab
            }
            onChange={
              updateValue
            }
          />

          <EditTextArea
            label="Products / Services Offered"
            section="E"
            name="products_services_offered"
            value={
              form.E
                .products_services_offered
            }
            onChange={
              updateValue
            }
          />

          <EditTextArea
            label="Business Category Tags"
            section="E"
            name="business_category_tags"
            value={
              form.E
                .business_category_tags
            }
            onChange={
              updateValue
            }
          />

          <EditTextArea
            label="Awards / Certifications"
            section="E"
            name="awards_certifications"
            value={
              form.E
                .awards_certifications
            }
            onChange={
              updateValue
            }
          />

          <EditTextArea
            label="Client Testimonials"
            section="E"
            name="client_testimonials"
            value={
              form.E
                .client_testimonials
            }
            onChange={
              updateValue
            }
          />

          <EditTextArea
            label="Business Bio"
            section="E"
            name="business_bio"
            value={
              form.E
                .business_bio
            }
            onChange={
              updateValue
            }
          />

          <EditTextArea
            label="Social Media Links"
            section="E"
            name="social_media_links"
            value={
              form.E
                .social_media_links
            }
            onChange={
              updateValue
            }
          />
        </EditSection>

        {/* =================================================
            SECTION F
        ================================================= */}

        <EditSection
          letter="F"
          icon="fa-solid fa-network-wired"
          title="Network / Royalty"
          subtitle="Update member-controlled network preferences."
        >
          <EditField
            label="Preferred Payout Cycle"
            section="F"
            name="preferred_payout_cycle"
            value={
              form.F
                .preferred_payout_cycle
            }
            options={[
              "Monthly",
              "Quarterly",
            ]}
            onChange={
              updateValue
            }
          />

          <div className="cpe-readonly-note cpe-field-full">

            <i className="fa-solid fa-lock" />

            <span>
              Referral ID, Network Rank, Team Size and
              Royalty Slab are controlled by INMBA and
              cannot be manually edited.
            </span>

          </div>
        </EditSection>

        {/* =================================================
            SECTION G
        ================================================= */}

        <EditSection
          letter="G"
          icon="fa-solid fa-phone-volume"
          title="Emergency & Nominee"
          subtitle="Update emergency contact information."
        >
          <EditField
            label="Emergency Contact Name"
            section="G"
            name="emergency_contact_name"
            value={
              form.G
                .emergency_contact_name
            }
            required
            onChange={
              updateValue
            }
          />

          <EditField
            label="Emergency Contact Number"
            section="G"
            name="emergency_contact_number"
            value={
              form.G
                .emergency_contact_number
            }
            required
            onChange={
              updateValue
            }
          />

          <EditField
            label="Relationship"
            section="G"
            name="relationship"
            value={
              form.G
                .relationship
            }
            required
            onChange={
              updateValue
            }
          />
        </EditSection>

        {/* =================================================
            SAVE BAR
        ================================================= */}

        <div className="cpe-save-bar">

          <button
            type="button"
            className="secondary"
            disabled={
              saving
            }
onClick={() =>
  navigate(
    "/commercial/full-profile"
  )
}
          >
            Cancel
          </button>

          <button
            type="button"
            className="primary"
disabled={saving}
            onClick={
              handleSave
            }
          >
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />

                Saving Changes...
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk" />

                Save Changes
              </>
            )}
          </button>

        </div>

      </div>
    </main>
  );
}