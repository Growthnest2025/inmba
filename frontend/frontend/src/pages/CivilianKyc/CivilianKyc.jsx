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
import { toast } from "react-toastify";

import "@fortawesome/fontawesome-free/css/all.min.css";

import {
  CIVILIAN_KYC_SECTIONS,
  CIVILIAN_KYC_SECTION_TITLES,
  getCivilianKyc,
  getCivilianKycSection,
  saveCivilianKycSection,
  submitCivilianKyc,
} from "../../services/CivilianKyc.service";

import "./CivilianKyc.css";
import { buildDefaultBio } from "../../utils/defaultBio";

/* =========================================================
   CONFIG
========================================================= */

const SECTIONS = [
  {
    id: "A",
    title: "Identity & KYC",
    icon: "fa-solid fa-address-card",
  },
  {
    id: "B",
    title: "Contact & Address",
    icon: "fa-solid fa-location-dot",
  },
  {
    id: "C",
    title: "Financial & Bank",
    icon: "fa-solid fa-building-columns",
  },
  {
    id: "D",
    title: "Education & Qualification",
    icon: "fa-solid fa-graduation-cap",
  },
  {
    id: "E",
    title: "Achievements & Certifications",
    icon: "fa-solid fa-award",
  },
  {
    id: "F",
    title: "Interest, Skills & Bio",
    icon: "fa-solid fa-user-tie",
  },
  {
    id: "G",
    title: "Network / Royalty",
    icon: "fa-solid fa-network-wired",
  },
  {
    id: "H",
    title: "Emergency Contact",
    icon: "fa-solid fa-phone-volume",
  },
];

/* =========================================================
   EMPTY FORM
========================================================= */

const EMPTY_FORM = {
  A: {
    full_legal_name: "",
    father_spouse_name: "",
    dob: "",
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
    primary_mobile: "",
    secondary_mobile: "",
    primary_email: "",
    whatsapp_number: "",

    current_address: "",
    permanent_address: "",

    district: "",
    state: "",
    pincode: "",

    google_map_location: "",
  },

  C: {
    account_holder_name: "",
    bank_name: "",
    bank_account_number: "",
    ifsc_code: "",
    bank_branch_name: "",

    upi_id: "",
    gst_number: "",
    income_tax_slab: "",

    nominee_name: "",
    nominee_relationship: "",
  },

  D: {
    highest_qualification: "",
    school_college_name: "",
    degree_year: "",

    additional_certifications: "",
    language_skills: "",
  },

  E: {
    awards_recognitions: "",
    publications: "",
    professional_certifications: "",
    key_milestones: "",
    media_mentions: "",
    testimonials: "",
  },

  F: {
    bio: "",
    interest_categories: "",
    skills: "",
    hobbies: "",
    preferred_industry: "",

    facebook_url: "",
    instagram_url: "",
    linkedin_url: "",
    youtube_url: "",
    website_portfolio: "",
  },

  G: {
    sponsor_referral_id: "",
    network_level_rank: "",
    team_size: "",
    royalty_slab_category: "",
    preferred_payout_cycle: "",
  },

  H: {
    emergency_contact_name: "",
    emergency_contact_number: "",
    emergency_relationship: "",
  },
};

/* =========================================================
   EMPTY FILES
========================================================= */

const EMPTY_FILES = {
  A: {},
  B: {},
  C: {},
  D: {},
  E: {},
  F: {},
  G: {},
  H: {},
};

/* =========================================================
   ACCEPT TYPES
========================================================= */

const DOCUMENT_ACCEPT =
  ".pdf,.jpg,.jpeg,.png";

const IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.webp";

const VIDEO_ACCEPT =
  ".mp4,.webm,.mov";

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
    typeof value === "object"
  ) {
    try {
      return JSON.stringify(
        value
      );
    } catch {
      return "";
    }
  }

  return String(
    value
  );
};

const toDateInputString = (val) => {
  if (!val) return "";
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const isoPrefix = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoPrefix) return isoPrefix[1];
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  const months = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
  const worded = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (worded) {
    const day = worded[1].padStart(2, '0');
    const monKey = worded[2].slice(0, 3).toLowerCase();
    const mon = months[monKey];
    const yr = worded[3];
    if (mon) return `${yr}-${mon}-${day}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const yr = d.getFullYear();
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mon}-${day}`;
  }
  return "";
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

const mergeServerSections = (
  sections = {}
) => {
  const result = {};

  SECTIONS.forEach(
    ({
      id,
    }) => {
      const source =
        sections?.[id] ||
        {};

      result[id] = {
        ...EMPTY_FORM[id],
      };

      Object.keys(
        EMPTY_FORM[id]
      ).forEach(
        (
          key
        ) => {
          if (
            source[key] !== null &&
            source[key] !== undefined
          ) {
            result[id][key] =
              toText(
                source[key]
              );
          }
        }
      );
    }
  );

  return result;
};

const normalizeFilesBySection = (
  source = {}
) => {
  const result = {
    A: {},
    B: {},
    C: {},
    D: {},
    E: {},
    F: {},
    G: {},
    H: {},
  };

  SECTIONS.forEach(
    ({
      id,
    }) => {
      if (
        source?.[id] &&
        typeof source[id] === "object"
      ) {
        result[id] = {
          ...source[id],
        };
      }
    }
  );

  return result;
};

const normalizeCompletionMap = (
  data = {}
) => {
  const source =
    data.completionBySection ||
    data.sectionsCompleted ||
    data.completedSections ||
    data.progress?.sections ||
    data.sections ||
    {};

  const output = {};

  SECTIONS.forEach(
    ({
      id,
    }) => {
      const value =
        source?.[id];

      if (
        value &&
        typeof value === "object"
      ) {
        output[id] =
          Boolean(
            value.completed ??
            value.isCompleted ??
            value.complete
          );
      } else {
        output[id] =
          Boolean(
            value
          );
      }
    }
  );

  return output;
};

/* =========================================================
   SMALL COMPONENT
========================================================= */

function Field({
  label,
  name,
  value,
  onChange,

  type = "text",

  placeholder = "",

  required = false,

  options = null,

  error = "",

  readOnly = false,

  verified = false,

  requirement = "",

  description = "",
}) {
  return (
    <div className={`civilian-kyc-field ${error ? "has-error" : ""}`}>
      <div className="civilian-kyc-label-row">
        <label
          htmlFor={
            name
          }
        >
          {label}
        </label>

        {verified ? (
          <span className="civilian-kyc-requirement verified">
            <i className="fa-solid fa-circle-check" />
            Already Verified
          </span>
        ) : null}
      </div>

      {options ? (
        <select
          id={
            name
          }
          value={
            value
          }
          disabled={
            readOnly
          }
          className={error ? "civilian-kyc-input-error" : ""}
          style={error ? { borderColor: "#dc2626", backgroundColor: "#fef2f2", boxShadow: "0 0 0 3px rgba(220, 38, 38, 0.15)" } : {}}
          onChange={(
            event
          ) =>
            onChange(
              name,
              event.target.value
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
          id={
            name
          }
          type={
            type
          }
          value={
            value
          }
          placeholder={
            placeholder
          }
          readOnly={
            readOnly
          }
          className={error ? "civilian-kyc-input-error" : ""}
          style={error ? { borderColor: "#dc2626", backgroundColor: "#fef2f2", boxShadow: "0 0 0 3px rgba(220, 38, 38, 0.15)" } : {}}
          onChange={(
            event
          ) =>
            onChange(
              name,
              event.target.value
            )
          }
        />
      )}

      {description && (
        <small className="civilian-kyc-field-description">
          {description}
        </small>
      )}

      {error && (
        <small
          className="civilian-kyc-field-error"
          style={{
            color: "#dc2626",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "5px",
            marginTop: "5px",
            fontSize: "0.82rem",
          }}
        >
          <i className="fa-solid fa-circle-exclamation" style={{ color: "#dc2626" }} />
          {error}
        </small>
      )}
    </div>
  );
}

/* =========================================================
   TEXT AREA
========================================================= */

function TextAreaField({
  label,
  name,
  value,
  onChange,

  placeholder = "",

  required = false,

  error = "",

  requirement = "",

  description = "",
}) {
  return (
    <div className={`civilian-kyc-field civilian-kyc-field-full ${error ? "has-error" : ""}`}>
      <div className="civilian-kyc-label-row">
        <label
          htmlFor={
            name
          }
        >
          {label}
        </label>
      </div>

      <textarea
        id={
          name
        }
        value={
          value
        }
        placeholder={
          placeholder
        }
        className={error ? "civilian-kyc-input-error" : ""}
        style={error ? { borderColor: "#dc2626", backgroundColor: "#fef2f2", boxShadow: "0 0 0 3px rgba(220, 38, 38, 0.15)" } : {}}
        onChange={(
          event
        ) =>
          onChange(
            name,
            event.target.value
          )
        }
      />

      {description && (
        <small className="civilian-kyc-field-description">
          {description}
        </small>
      )}

      {error && (
        <small
          className="civilian-kyc-field-error"
          style={{
            color: "#dc2626",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "5px",
            marginTop: "5px",
            fontSize: "0.82rem",
          }}
        >
          <i className="fa-solid fa-circle-exclamation" style={{ color: "#dc2626" }} />
          {error}
        </small>
      )}
    </div>
  );
}

/* =========================================================
   FILE FIELD
========================================================= */

function FileField({
  label,
  name,
  accept,

  multiple = false,

  required = false,

  selected,
  existing,

  onChange,

  error = "",

  description = "",
}) {
  const selectedLabel =
    Array.isArray(
      selected
    )
      ? selected
          .map(
            (
              file
            ) =>
              file.name
          )
          .join(
            ", "
          )
      : selected?.name ||
        "";

  return (
    <div className="civilian-kyc-file-field">
      <div className="civilian-kyc-label-row">
        <label>
          {label}
        </label>
      </div>

      <input
        type="file"
        accept={
          accept
        }
        multiple={
          multiple
        }
        onChange={(
          event
        ) =>
          onChange(
            name,

            multiple
              ? Array.from(
                  event.target.files ||
                    []
                )
              : event.target.files?.[0] ||
                null
          )
        }
      />

      {description && (
        <small>
          {description}
        </small>
      )}

      {selectedLabel && (
        <div className="civilian-kyc-file-status">
          <i className="fa-solid fa-circle-check" />

          New file:{" "}
          {
            selectedLabel
          }
        </div>
      )}

      {!selectedLabel &&
        existing && (
          <div className="civilian-kyc-file-status existing">
            <i className="fa-solid fa-file-shield" />

            Already uploaded
          </div>
        )}

      {error && (
        <small className="civilian-kyc-field-error">
          {error}
        </small>
      )}
    </div>
  );
}

/* =========================================================
   INLINE CIVILIAN TOPBAR
========================================================= */

function CivilianFlowTopbar() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const isKycPage =
    location.pathname ===
    "/civilian-kyc";

  const isReviewPage =
    location.pathname ===
    "/civilian-review";

  const goDashboard =
    () => {
      navigate(
        "/dashboard"
      );
    };

  const goKyc =
    () => {
      navigate(
        "/civilian-kyc"
      );
    };

  const goReview =
    () => {
      navigate(
        "/civilian-review"
      );
    };

  return (
    <header className="civilian-flow-topbar">
      <div className="civilian-flow-topbar-inner">
        <button
          type="button"
          className="civilian-flow-brand"
          onClick={
            goDashboard
          }
        >
          <span className="civilian-flow-brand-icon">
            <i className="fa-solid fa-users" />
          </span>

          <span className="civilian-flow-brand-copy">
            <strong>
              INMBA Civilian
            </strong>

            <small>
              Full KYC Portal
            </small>
          </span>
        </button>

        <div className="civilian-flow-topbar-actions">
          {isReviewPage && (
            <button
              type="button"
              className="civilian-flow-nav-button secondary"
              onClick={
                goKyc
              }
            >
              <i className="fa-solid fa-pen-to-square" />

              <span>
                Edit KYC
              </span>
            </button>
          )}

          {isKycPage && (
            <button
              type="button"
              className="civilian-flow-nav-button secondary"
              onClick={
                goReview
              }
            >
              <i className="fa-solid fa-eye" />

              <span>
                Preview
              </span>
            </button>
          )}

          <button
            type="button"
            className="civilian-flow-nav-button dashboard"
            onClick={
              goDashboard
            }
          >
            <i className="fa-solid fa-table-columns" />

            <span>
              Dashboard
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function CivilianKyc() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    searchParams,
  ] =
    useSearchParams();

  const selectedPlan =
    useMemo(
      () => {
        const planFromUrl =
          String(
            searchParams.get(
              "plan"
            ) ||
              ""
          ).trim();

        const planFromState =
          String(
            location.state?.selectedPlan ||
              ""
          ).trim();

        let planFromStorage =
          "";

        try {
          planFromStorage =
            String(
              window.localStorage.getItem(
                "civilianSelectedPlan"
              ) ||
                ""
            ).trim();
        } catch {
          planFromStorage =
            "";
        }

        const candidate =
          planFromUrl ||
          planFromState ||
          planFromStorage;

        return [
          "299",
          "2999",
        ].includes(
          candidate
        )
          ? candidate
          : "";
      },
      [
        location.state,
        searchParams,
      ]
    );

  useEffect(
    () => {
      if (!selectedPlan) {
        return;
      }

      try {
        window.localStorage.setItem(
          "civilianSelectedPlan",
          selectedPlan
        );
      } catch {
        // Browser storage is optional.
      }
    },
    [
      selectedPlan,
    ]
  );

  const [
    activeSection,
    setActiveSection,
  ] =
    useState(
      "A"
    );

  const [
    form,
    setForm,
  ] =
    useState(
      EMPTY_FORM
    );

  const [
    files,
    setFiles,
  ] =
    useState(
      EMPTY_FILES
    );

  const [
    serverSections,
    setServerSections,
  ] =
    useState(
      {}
    );

  const [
    existingFiles,
    setExistingFiles,
  ] =
    useState(
      EMPTY_FILES
    );

  const [
    completionMap,
    setCompletionMap,
  ] =
    useState(
      {}
    );

  const [
    status,
    setStatus,
  ] =
    useState(
      "draft"
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

  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState(
      {}
    );

  const [
    memberSummary,
    setMemberSummary,
  ] =
    useState(
      {}
    );

  const [
    basicVerifiedFields,
    setBasicVerifiedFields,
  ] =
    useState(
      new Set()
    );

  const getBasicMemberData =
    useCallback(
      (
        data
      ) => {
        const member =
          data?.member ||
          data?.memberData ||
          data?.basicKyc ||
          data?.profile ||
          {};

        const firstName =
          String(
            member?.first_name ||
            ""
          ).trim();

        const lastName =
          String(
            member?.last_name ||
            ""
          ).trim();

        const fullName =
          String(
            member?.full_name ||
            member?.name ||
            [firstName, lastName]
              .filter(Boolean)
              .join(" ")
          ).trim();

        return {
          raw: member,

          summary: {
            full_name:
              fullName ||
              "Civilian Member",

            login_id:
              member?.login_id ||
              "",

            email:
              member?.email ||
              "",

            phone:
              member?.phone ||
              member?.mobile ||
              "",
          },

          values: {
            A: {
              full_legal_name: fullName,
              father_spouse_name: member?.father_name || member?.father_spouse_name || "",
              dob: toDateInputString(member?.dob || member?.date_of_birth || ""),
              gender: member?.gender || "",
              marital_status: member?.marital_status || "",
              nationality: member?.nationality || "Indian",
              aadhaar_number: member?.aadhar || member?.aadhaar || member?.aadhaar_number || "",
              pan_number: member?.pan_number || member?.pan || "",
              blood_group: member?.blood_group || "",
            },

            B: {
              primary_mobile: member?.phone || member?.mobile || "",
              secondary_mobile: member?.secondary_mobile || member?.contact_number || "",
              primary_email: member?.email || "",
              whatsapp_number: member?.whatsapp_number || "",
              current_address: member?.current_address || member?.address || "",
              permanent_address: member?.permanent_address || "",
              district: member?.district || member?.entity_district || "",
              state: member?.state || member?.entity_state || "",
              pincode: member?.pincode || member?.entity_pincode || "",
              google_map_location: member?.google_map_location || "",
            },

            C: {
              account_holder_name: member?.account_holder || fullName,
              bank_name: member?.bank_name || "",
              bank_account_number: member?.account_number || member?.bank_account_number || "",
              ifsc_code: member?.ifsc_code || member?.ifsc || "",
              bank_branch_name: member?.branch || member?.bank_branch_name || member?.bank_branch || "",
              upi_id: member?.upi_id || "",
              gst_number: member?.gst_number || "",
              income_tax_slab: member?.income_tax_slab || "",
              nominee_name: member?.nominee_name || member?.nomini_name || "",
              nominee_relationship: member?.nominee_relationship || "",
            },

            D: {
              highest_qualification:
                member?.highest_qualification ||
                member?.educational_qualification ||
                member?.education ||
                "",
              school_college_name:
                member?.school_college_name ||
                member?.school_name ||
                member?.ug_college ||
                member?.pg_college ||
                member?.institution_name ||
                "",
              degree_year:
                member?.degree_year ||
                member?.ug_year ||
                "",
              additional_certifications:
                member?.additional_certifications ||
                "",
              language_skills:
                member?.language_skills ||
                "",
            },

            E: {
              awards_recognitions: member?.awards_recognitions || "",
              publications: member?.publications || "",
              professional_certifications: member?.professional_certifications || "",
              key_milestones: member?.key_milestones || "",
              media_mentions: member?.media_mentions || "",
              testimonials: member?.testimonials || "",
            },

            F: {
              bio: member?.bio || "",
              interest_categories: member?.interest_categories || "",
              skills: member?.skills || "",
              hobbies: member?.hobbies || "",
              preferred_industry: member?.preferred_industry || "",
              facebook_url: member?.social_facebook || member?.facebook || "",
              instagram_url: member?.social_instagram || member?.instagram || "",
              linkedin_url: member?.social_linkedin || member?.linkedin || "",
              youtube_url: member?.social_youtube || member?.youtube || "",
              website_portfolio: member?.social_website || member?.website || "",
            },

            G: {
              sponsor_referral_id: member?.referred_by || "",
              network_level_rank: member?.network_level || "",
              team_size: member?.team_size ? String(member.team_size) : "",
              royalty_slab_category: member?.royalty_slab_category || "",
              preferred_payout_cycle: member?.preferred_payout_cycle || "",
            },

            H: {
              emergency_contact_name: member?.emergency_contact_name || "",
              emergency_contact_number: member?.emergency_contact_number || "",
              emergency_relationship: member?.emergency_relationship || "",
            },
          },
        };
      },
      []
    );

  const mergeBasicVerifiedData =
    useCallback(
      (
        sections,
        basicValues
      ) => {
        const next =
          mergeServerSections(
            sections
          );

        const verified =
          new Set();

        Object.entries(
          basicValues ||
          {}
        ).forEach(
          (
            [
              sectionId,
              values,
            ]
          ) => {
            Object.entries(
              values ||
              {}
            ).forEach(
              (
                [
                  field,
                  value,
                ]
              ) => {
                if (
                  value ===
                    null ||
                  value ===
                    undefined ||
                  String(
                    value
                  ).trim() ===
                    ""
                ) {
                  return;
                }

                verified.add(
                  field
                );

                if (
                  !String(
                    next?.[
                      sectionId
                    ]?.[
                      field
                    ] ??
                    ""
                  ).trim()
                ) {
                  next[
                    sectionId
                  ] = {
                    ...next[
                      sectionId
                    ],

                    [field]:
                      value,
                  };
                }
              }
            );
          }
        );

        return {
          next,
          verified,
        };
      },
      []
    );

  const isBasicVerified =
    useCallback(
      (
        field
      ) =>
        basicVerifiedFields.has(
          field
        ),
      [
        basicVerifiedFields,
      ]
    );

  /* =======================================================
     APPLY SERVER DATA
  ======================================================= */

  const applyServerData =
    useCallback(
      (
        rawData
      ) => {
        const data =
          unwrapServiceResult(
            rawData
          );

        if (
          !data
        ) {
          return;
        }

        const sections =
          data.sections ||
          data.valuesBySection ||
          data.kycSections ||
          {};

        const basic =
          getBasicMemberData(
            data
          );

        setMemberSummary(
          basic.summary
        );

        const mergedBasic =
          mergeBasicVerifiedData(
            sections,
            basic.values
          );

        setBasicVerifiedFields(
          mergedBasic.verified
        );

        setServerSections(
          sections
        );

        const selectedPlanForBio =
          String(
            data?.selectedPlan ||
              data?.selected_plan ||
              window.localStorage.getItem("civilianSelectedPlan") ||
              ""
          ).trim();
        const enrichedForm = { ...mergedBasic.next };
        if (!String(enrichedForm.F?.bio || "").trim()) {
          enrichedForm.F = {
            ...(enrichedForm.F || {}),
            bio: buildDefaultBio({
              name: basic.summary?.name || enrichedForm.A?.full_name,
              plan: selectedPlanForBio,
              membershipType: data?.member?.membership_type || "Civilian Member",
            }),
          };
        }
        setForm(enrichedForm);

        const filesSource =
          data.filesBySection ||
          data.files ||
          {};

        setExistingFiles(
          normalizeFilesBySection(
            filesSource
          )
        );

        setCompletionMap(
          normalizeCompletionMap(
            data
          )
        );

        setStatus(
          data.status ||
          "draft"
        );
      },
      [
        getBasicMemberData,
        mergeBasicVerifiedData,
      ]
    );

  /* =======================================================
     LOAD
  ======================================================= */

  useEffect(
    () => {
      let mounted =
        true;

      const load =
        async () => {
          try {
            setLoading(
              true
            );

            setError(
              ""
            );

            const result =
              await getCivilianKyc();

            if (
              !mounted
            ) {
              return;
            }

            applyServerData(
              result
            );

            const requestedSection =
              String(
                location?.state?.section ||
                ""
              ).toUpperCase();

            if (
              SECTIONS.some(
                (
                  item
                ) =>
                  item.id ===
                  requestedSection
              )
            ) {
              setActiveSection(
                requestedSection
              );
            }
          } catch (
            requestError
          ) {
            if (
              !mounted
            ) {
              return;
            }

            setError(
              requestError?.apiMessage ||
              requestError?.message ||
              "Unable to load Civilian KYC."
            );
          } finally {
            if (
              mounted
            ) {
              setLoading(
                false
              );
            }
          }
        };

      load();

      return () => {
        mounted =
          false;
      };
    },
    [
      applyServerData,
      location.state,
    ]
  );

  /* =======================================================
     PROGRESS
  ======================================================= */

  const completedCount =
    useMemo(
      () => {
        return SECTIONS.reduce(
          (
            total,
            section
          ) => {
            return (
              total +
              (
                completionMap?.[
                  section.id
                ]
                  ? 1
                  : 0
              )
            );
          },
          0
        );
      },
      [
        completionMap,
      ]
    );

  const progressPercentage =
    useMemo(
      () => {
        return Math.round(
          (
            completedCount /
            SECTIONS.length
          ) *
            100
        );
      },
      [
        completedCount,
      ]
    );

  /* =======================================================
     VALUE UPDATE
  ======================================================= */

  const updateValue =
    (
      name,
      rawValue
    ) => {
      let value = rawValue;
      if (name === "aadhaar_number") {
        value = String(rawValue || "").replace(/\D/g, "").slice(0, 12);
      } else if (name === "pan_number") {
        value = String(rawValue || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
      } else if (name === "pincode") {
        value = String(rawValue || "").replace(/\D/g, "").slice(0, 6);
      } else if (name === "bank_account_number") {
        value = String(rawValue || "").replace(/\D/g, "").slice(0, 18);
      } else if (name === "ifsc_code") {
        value = String(rawValue || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11);
      } else if (["primary_mobile", "secondary_mobile", "whatsapp_number", "emergency_contact_number"].includes(name)) {
        value = String(rawValue || "").replace(/\D/g, "").slice(0, 10);
      } else if (name === "gst_number") {
        value = String(rawValue || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
      }

      setForm(
        (
          previous
        ) => ({
          ...previous,

          [activeSection]: {
            ...previous[
              activeSection
            ],

            [name]:
              value,
          },
        })
      );

      setFieldErrors(
        (
          previous
        ) => ({
          ...previous,

          [name]:
            "",
        })
      );

      setError(
        ""
      );
    };

  /* =======================================================
     FILE UPDATE
  ======================================================= */

  const updateFile =
    (
      name,
      value
    ) => {
      setFiles(
        (
          previous
        ) => ({
          ...previous,

          [activeSection]: {
            ...previous[
              activeSection
            ],

            [name]:
              value,
          },
        })
      );

      setFieldErrors(
        (
          previous
        ) => ({
          ...previous,

          [name]:
            "",
        })
      );

      setError(
        ""
      );
    };

  /* =======================================================
     LOCAL VALIDATION
  ======================================================= */

  const validateCurrentSection =
    () => {
      const values =
        form[
          activeSection
        ] ||
        {};

      const errors =
        {};

      if (
        activeSection ===
        "A"
      ) {
        /*
          Full Name and DOB belong to Civilian Basic KYC.
          They are intentionally not validated again in Full KYC.
        */




        if (
          !values.nationality?.trim()
        ) {
          errors.nationality =
            "Nationality is required.";
        }

        if (
          !values.aadhaar_number ||
          !values.aadhaar_number.trim()
        ) {
          errors.aadhaar_number =
            "Aadhaar Number is required.";
        } else if (
          !/^\d{12}$/.test(
            values.aadhaar_number.replace(
              /\s/g,
              ""
            )
          )
        ) {
          errors.aadhaar_number =
            "Enter valid 12-digit Aadhaar Number.";
        }

        if (
          values.pan_number &&
          !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(
            values.pan_number.trim()
          )
        ) {
          errors.pan_number =
            "Enter valid 10-character PAN (e.g. ABCDE1234F).";
        }
      }

      if (
        activeSection ===
        "B"
      ) {
        /*
          Primary Mobile and Primary Email belong to Civilian Basic KYC.
          They are intentionally not validated again in Full KYC.
        */

        if (
          !values.current_address?.trim()
        ) {
          errors.current_address =
            "Current Address is required.";
        }

        if (
          !values.permanent_address?.trim()
        ) {
          errors.permanent_address =
            "Permanent Address is required.";
        }

        if (
          !values.district?.trim()
        ) {
          errors.district =
            "District is required.";
        }

        if (
          !values.state?.trim()
        ) {
          errors.state =
            "State is required.";
        }

        if (
          !values.pincode?.trim()
        ) {
          errors.pincode =
            "Pincode is required.";
        } else if (
          !/^\d{6}$/.test(values.pincode.trim())
        ) {
          errors.pincode = "Enter valid 6-digit Pincode.";
        }

        if (
          values.secondary_mobile &&
          !/^[6-9]\d{9}$/.test(values.secondary_mobile.trim())
        ) {
          errors.secondary_mobile = "Secondary Mobile Number must be a valid 10-digit number.";
        }

        if (
          values.whatsapp_number &&
          !/^[6-9]\d{9}$/.test(values.whatsapp_number.trim())
        ) {
          errors.whatsapp_number = "WhatsApp Number must be a valid 10-digit number.";
        }
      }

      if (activeSection === "C") {
        if (
          values.bank_account_number &&
          !/^\d{9,18}$/.test(values.bank_account_number.trim())
        ) {
          errors.bank_account_number =
            "Bank Account Number must be between 9 and 18 digits.";
        }
        if (
          values.ifsc_code &&
          !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(
            values.ifsc_code.trim()
          )
        ) {
          errors.ifsc_code =
            "Enter valid 11-character IFSC Code (e.g. SBIN0001234).";
        }
        if (!values.nominee_name?.trim()) {
          errors.nominee_name = "Nominee Name is required.";
        }
        if (!values.nominee_relationship?.trim()) {
          errors.nominee_relationship = "Nominee Relationship is required.";
        }
      }

      if (
        activeSection ===
        "F" &&
        !values.bio?.trim()
      ) {
        errors.bio =
          "Bio is required.";
      }

      if (
        activeSection ===
        "H"
      ) {
        if (
          !values.emergency_contact_name?.trim()
        ) {
          errors.emergency_contact_name =
            "Emergency Contact Name is required.";
        }

        if (
          !values.emergency_contact_number?.trim()
        ) {
          errors.emergency_contact_number =
            "Emergency Contact Number is required.";
        } else if (
          !/^[6-9]\d{9}$/.test(values.emergency_contact_number.replace(/\D/g, ""))
        ) {
          errors.emergency_contact_number =
            "Enter valid 10-digit mobile number.";
        }

        if (
          !values.emergency_relationship?.trim()
        ) {
          errors.emergency_relationship =
            "Relationship is required.";
        }
      }

      setFieldErrors(errors);

      const errKeys = Object.keys(errors);
      if (errKeys.length > 0) {
        const firstErrMsg = errors[errKeys[0]];
        setError(
          `Please correct Section ${activeSection}: ${firstErrMsg}`
        );
        return false;
      }

      return true;
    };

  /* =======================================================
     SAVE DRAFT / SAVE & CONTINUE
  ======================================================= */

  const handleSave =
    async (
      completed
    ) => {
      if (
        completed &&
        !validateCurrentSection()
      ) {
        window.scrollTo({
          top:
            0,

          behavior:
            "smooth",
        });

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

        const values =
          form[
            activeSection
          ] ||
          {};

        const uploadFiles =
          files[
            activeSection
          ] ||
          {};

        const payload = {
          ...values,
        };

        Object.entries(
          uploadFiles
        ).forEach(
          ([
            key,
            value,
          ]) => {
            payload[key] =
              value;
          }
        );

        const result =
          await saveCivilianKycSection(
            activeSection,
            payload,
            completed
          );

        const data =
          unwrapServiceResult(
            result
          );

        applyServerData(
          data
        );

        setFiles(
          (
            previous
          ) => ({
            ...previous,

            [activeSection]:
              {},
          })
        );

        setSuccess(
          completed
            ? `Section ${activeSection} completed successfully.`
            : `Section ${activeSection} draft saved successfully.`
        );

        if (
          completed
        ) {
          setCompletionMap(
            (
              previous
            ) => ({
              ...previous,

              [activeSection]:
                true,
            })
          );

          const currentIndex =
            SECTIONS.findIndex(
              (
                section
              ) =>
                section.id ===
                activeSection
            );

          if (
            currentIndex <
            SECTIONS.length -
              1
          ) {
            setActiveSection(
              SECTIONS[
                currentIndex +
                  1
              ].id
            );

            window.scrollTo({
              top:
                0,

              behavior:
                "smooth",
            });
          }
        }
      } catch (
        requestError
      ) {
        setFieldErrors(
          requestError?.fieldErrors ||
          {}
        );

        setError(
          requestError?.apiMessage ||
          requestError?.message ||
          (
            completed
              ? `Please complete Section ${activeSection} correctly before continuing.`
              : `Unable to save Section ${activeSection} draft.`
          )
        );

        window.scrollTo({
          top:
            0,

          behavior:
            "smooth",
        });
      } finally {
        setSaving(
          false
        );
      }
    };

    const handleFinalSubmit = async () => {
  if (!validateCurrentSection()) {
    setError(
      "Please complete Section H correctly before submitting Full KYC."
    );
    return;
  }

  try {
    setSaving(true);
    setError("");
    setSuccess("");

    const values = form.H || {};
    const uploadFiles = files.H || {};

    const payload = {
      ...values,
    };

    Object.entries(uploadFiles).forEach(
      ([key, value]) => {
        payload[key] = value;
      }
    );

    // 1. First save Section H as completed
    await saveCivilianKycSection(
      "H",
      payload,
      true
    );

    // 2. Then submit Full KYC
    await submitCivilianKyc();
    toast.success("Civilian Full KYC submitted successfully!");

    // 3. User flow: Registration -> Payment -> KYC -> Dashboard
    navigate("/dashboard", {
      replace: true,
      state: {
        civilianKycSubmitted: true,
        selectedPlan: selectedPlan || "299",
        selected_plan: selectedPlan || "299",
      },
    });
  } catch (requestError) {
    setError(
      requestError?.apiMessage ||
        requestError?.message ||
        "Unable to submit Civilian Full KYC."
    );
  } finally {
    setSaving(false);
  }
};
  /* =======================================================
     FINAL SUBMIT
  ======================================================= */

  const handleSubmit =
    async () => {
      const incomplete =
        SECTIONS.filter(
          (
            section
          ) =>
            !completionMap?.[
              section.id
            ]
        );

      if (
        incomplete.length
      ) {
        setActiveSection(
          incomplete[
            0
          ].id
        );

        setError(
          `Please complete Section ${incomplete[0].id} before submitting Full KYC.`
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

        await submitCivilianKyc();
        toast.success("Civilian Full KYC submitted successfully!");

        /*
          Full KYC submitted successfully.
          User flow: Registration -> Payment -> KYC -> Dashboard
        */
        navigate("/dashboard", {
          replace: true,
          state: {
            civilianKycSubmitted: true,
            selectedPlan: selectedPlan || "299",
            selected_plan: selectedPlan || "299",
          },
        });
      } catch (
        requestError
      ) {
        setError(
          requestError?.apiMessage ||
          requestError?.message ||
          "Unable to submit Civilian Full KYC."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     SECTION CONTENT
  ======================================================= */

  const renderSection =
    () => {
      const values =
        form[
          activeSection
        ] ||
        {};

      const sectionFiles =
        files[
          activeSection
        ] ||
        {};

      const existing =
        existingFiles[
          activeSection
        ] ||
        serverSections[
          activeSection
        ] ||
        {};

      /* ===================================================
         SECTION A
      =================================================== */

      if (
        activeSection ===
        "A"
      ) {
        return (
          <>
            <div
              className="civilian-kyc-policy-banner"
              style={{
                backgroundColor: "#eff6ff",
                border: "1px solid #93c5fd",
                borderRadius: "10px",
                padding: "14px 18px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                color: "#1e40af",
              }}
            >
              <i
                className="fas fa-triangle-exclamation"
                style={{ fontSize: "1.3rem", marginTop: "2px", color: "#2563eb", flexShrink: 0 }}
                aria-hidden="true"
              />
              <div>
                <strong style={{ display: "block", marginBottom: "3px", fontSize: "0.95rem" }}>
                  Aadhaar Verification Policy (90-Day Rule)
                </strong>
                <span style={{ fontSize: "0.85rem", lineHeight: "1.45", display: "block" }}>
                  Aadhaar submission is strictly <strong>mandatory within 90 days</strong> of registration. Accounts without Aadhaar verification after 90 days will be permanently terminated.
                </span>
              </div>
            </div>
            <div className="civilian-kyc-form-grid">

              <Field
                label="Father / Spouse Name"
                name="father_spouse_name"
                value={
                  values.father_spouse_name
                }
                onChange={
                  updateValue
                }
                error={
                  fieldErrors.father_spouse_name
                }
                readOnly={
                  isBasicVerified(
                    "father_spouse_name"
                  )
                }
                verified={
                  isBasicVerified(
                    "father_spouse_name"
                  )
                }
              />

              <Field
                label="Date of Birth"
                name="dob"
                type="date"
                value={
                  toDateInputString(values.dob)
                }
                onChange={
                  updateValue
                }
                error={
                  fieldErrors.dob
                }
                readOnly={
                  isBasicVerified(
                    "dob"
                  )
                }
                verified={
                  isBasicVerified(
                    "dob"
                  )
                }
              />

              <Field
                label="Gender"
                name="gender"
                value={
                  values.gender
                }
                onChange={
                  updateValue
                }
                options={[
                  "Male",
                  "Female",
                  "Other",
                ]}
                error={
                  fieldErrors.gender
                }
                readOnly={
                  isBasicVerified(
                    "gender"
                  )
                }
                verified={
                  isBasicVerified(
                    "gender"
                  )
                }
              />

              <Field
                label="Marital Status"
                name="marital_status"
                value={
                  values.marital_status
                }
                onChange={
                  updateValue
                }
                options={[
                  "Single",
                  "Married",
                  "Divorced",
                  "Widowed",
                  "Other",
                ]}
                readOnly={
                  isBasicVerified(
                    "marital_status"
                  )
                }
                verified={
                  isBasicVerified(
                    "marital_status"
                  )
                }
              />

              <Field
                label="Nationality"
                name="nationality"
                value={
                  values.nationality
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.nationality
                }
                readOnly={
                  isBasicVerified(
                    "nationality"
                  )
                }
                verified={
                  isBasicVerified(
                    "nationality"
                  )
                }
              />

              <Field
                label="Aadhaar Number"
                name="aadhaar_number"
                description="Mandatory within 90 days of registration. Accounts without Aadhaar verification will be terminated."
                value={
                  values.aadhaar_number
                }
                onChange={
                  updateValue
                }
                placeholder="12 digit Aadhaar"
                required
                error={
                  fieldErrors.aadhaar_number
                }
                readOnly={
                  isBasicVerified(
                    "aadhaar_number"
                  )
                }
                verified={
                  isBasicVerified(
                    "aadhaar_number"
                  )
                }
              />

              <Field
                label="PAN Number"
                name="pan_number"
                value={
                  values.pan_number
                }
                onChange={
                  updateValue
                }
                placeholder="ABCDE1234F"
                error={
                  fieldErrors.pan_number
                }
                readOnly={
                  isBasicVerified(
                    "pan_number"
                  )
                }
                verified={
                  isBasicVerified(
                    "pan_number"
                  )
                }
              />

              <Field
                label="Passport Number"
                name="passport_number"
                value={
                  values.passport_number
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Voter ID"
                name="voter_id"
                value={
                  values.voter_id
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Driving License"
                name="driving_license"
                value={
                  values.driving_license
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Blood Group"
                name="blood_group"
                value={
                  values.blood_group
                }
                onChange={
                  updateValue
                }
                options={[
                  "A+",
                  "A-",
                  "B+",
                  "B-",
                  "AB+",
                  "AB-",
                  "O+",
                  "O-",
                ]}
                readOnly={
                  isBasicVerified(
                    "blood_group"
                  )
                }
                verified={
                  isBasicVerified(
                    "blood_group"
                  )
                }
              />
            </div>

            <div className="civilian-kyc-upload-grid">
              <FileField
                label="Aadhaar Front"
                name="aadhaar_front"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.aadhaar_front
                }
                existing={
                  existing.aadhaar_front
                }
                onChange={
                  updateFile
                }
                description="PDF, JPG or PNG · Max 5 MB"
              />

              <FileField
                label="Aadhaar Back"
                name="aadhaar_back"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.aadhaar_back
                }
                existing={
                  existing.aadhaar_back
                }
                onChange={
                  updateFile
                }
                description="PDF, JPG or PNG · Max 5 MB"
              />

              <FileField
                label="PAN Card Scan"
                name="pan_card_scan"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.pan_card_scan
                }
                existing={
                  existing.pan_card_scan
                }
                onChange={
                  updateFile
                }
                description="PDF, JPG or PNG · Max 5 MB"
              />
            </div>
          </>
        );
      }

      /* ===================================================
         SECTION B
      =================================================== */

      if (
        activeSection ===
        "B"
      ) {
        return (
          <>
            <div className="civilian-kyc-form-grid">

              <Field
                label="Secondary Mobile Number"
                name="secondary_mobile"
                value={
                  values.secondary_mobile
                }
                onChange={
                  updateValue
                }
                error={
                  fieldErrors.secondary_mobile
                }
              />


              <Field
                label="WhatsApp Number"
                name="whatsapp_number"
                value={
                  values.whatsapp_number
                }
                onChange={
                  updateValue
                }
                error={
                  fieldErrors.whatsapp_number
                }
                readOnly={
                  isBasicVerified(
                    "whatsapp_number"
                  )
                }
                verified={
                  isBasicVerified(
                    "whatsapp_number"
                  )
                }
              />

              <TextAreaField
                label="Current Address"
                name="current_address"
                value={
                  values.current_address
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.current_address
                }
              />

              <TextAreaField
                label="Permanent Address"
                name="permanent_address"
                value={
                  values.permanent_address
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.permanent_address
                }
              />

              <Field
                label="District"
                name="district"
                value={
                  values.district
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.district
                }
                readOnly={
                  isBasicVerified(
                    "district"
                  )
                }
                verified={
                  isBasicVerified(
                    "district"
                  )
                }
              />

              <Field
                label="State"
                name="state"
                value={
                  values.state
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.state
                }
                readOnly={
                  isBasicVerified(
                    "state"
                  )
                }
                verified={
                  isBasicVerified(
                    "state"
                  )
                }
              />

              <Field
                label="Pincode"
                name="pincode"
                value={
                  values.pincode
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.pincode
                }
                readOnly={
                  isBasicVerified(
                    "pincode"
                  )
                }
                verified={
                  isBasicVerified(
                    "pincode"
                  )
                }
              />

              <Field
                label="Google Map Location / Pin"
                name="google_map_location"
                value={
                  values.google_map_location
                }
                onChange={
                  updateValue
                }
              />
            </div>

            <div className="civilian-kyc-upload-grid">
              <FileField
                label="Address Proof"
                name="address_proof"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.address_proof
                }
                existing={
                  existing.address_proof
                }
                onChange={
                  updateFile
                }
                description="PDF, JPG or PNG · Max 5 MB"
              />
            </div>
          </>
        );
      }

      /* ===================================================
         SECTION C
      =================================================== */

      if (
        activeSection ===
        "C"
      ) {
        return (
          <>
            <div className="civilian-kyc-form-grid">
              <Field
                label="Account Holder Name"
                name="account_holder_name"
                value={
                  values.account_holder_name
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Bank Name"
                name="bank_name"
                value={
                  values.bank_name
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Bank Account Number"
                name="bank_account_number"
                value={
                  values.bank_account_number
                }
                onChange={
                  updateValue
                }
                error={
                  fieldErrors.bank_account_number
                }
              />

              <Field
                label="IFSC Code"
                name="ifsc_code"
                value={
                  values.ifsc_code
                }
                onChange={
                  updateValue
                }
                error={
                  fieldErrors.ifsc_code
                }
              />

              <Field
                label="Bank Branch Name"
                name="bank_branch_name"
                value={
                  values.bank_branch_name
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="UPI ID"
                name="upi_id"
                value={
                  values.upi_id
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="GST Number"
                name="gst_number"
                value={
                  values.gst_number
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Income Tax Slab / 15G-15H"
                name="income_tax_slab"
                value={
                  values.income_tax_slab
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Nominee Name"
                name="nominee_name"
                required
                value={
                  values.nominee_name
                }
                onChange={
                  updateValue
                }
                error={fieldErrors.nominee_name}
              />

              <Field
                label="Nominee Relationship"
                name="nominee_relationship"
                required
                value={
                  values.nominee_relationship
                }
                onChange={
                  updateValue
                }
                error={fieldErrors.nominee_relationship}
              />
            </div>

            <div className="civilian-kyc-upload-grid">
              <FileField
                label="Passbook / Cancelled Cheque"
                name="bank_proof"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.bank_proof
                }
                existing={
                  existing.bank_proof
                }
                onChange={
                  updateFile
                }
                description="PDF, JPG or PNG · Max 5 MB"
              />

              <FileField
                label="Nominee ID Proof"
                name="nominee_id"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.nominee_id
                }
                existing={
                  existing.nominee_id
                }
                onChange={
                  updateFile
                }
              />
            </div>
          </>
        );
      }

      /* ===================================================
         SECTION D
      =================================================== */

      if (
        activeSection ===
        "D"
      ) {
        return (
          <>
            <div className="civilian-kyc-form-grid">
              <Field
                label="Highest Educational Qualification"
                name="highest_qualification"
                value={
                  values.highest_qualification
                }
                onChange={
                  updateValue
                }
                readOnly={
                  isBasicVerified(
                    "highest_qualification"
                  )
                }
                verified={
                  isBasicVerified(
                    "highest_qualification"
                  )
                }
              />

              <Field
                label="School / College Name"
                name="school_college_name"
                value={
                  values.school_college_name
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Degree / Certificate Year"
                name="degree_year"
                value={
                  values.degree_year
                }
                onChange={
                  updateValue
                }
              />

              <TextAreaField
                label="Additional Diploma / Certifications"
                name="additional_certifications"
                value={
                  values.additional_certifications
                }
                onChange={
                  updateValue
                }
              />

              <TextAreaField
                label="Language Skills (Spoken / Written)"
                name="language_skills"
                value={
                  values.language_skills
                }
                onChange={
                  updateValue
                }
              />
            </div>

            <div className="civilian-kyc-upload-grid">
              <FileField
                label="Educational Certificate Scan"
                name="education_certificate"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.education_certificate
                }
                existing={
                  existing.education_certificate
                }
                onChange={
                  updateFile
                }
                description="PDF, JPG or PNG · Max 5 MB"
              />
            </div>
          </>
        );
      }

      /* ===================================================
         SECTION E
      =================================================== */

      if (
        activeSection ===
        "E"
      ) {
        return (
          <>
            <div className="civilian-kyc-form-grid">
              <TextAreaField
                label="Awards / Recognitions"
                name="awards_recognitions"
                value={
                  values.awards_recognitions
                }
                onChange={
                  updateValue
                }
              />

              <TextAreaField
                label="Publications / Published Work"
                name="publications"
                value={
                  values.publications
                }
                onChange={
                  updateValue
                }
              />

              <TextAreaField
                label="Professional Certifications"
                name="professional_certifications"
                value={
                  values.professional_certifications
                }
                onChange={
                  updateValue
                }
              />

              <TextAreaField
                label="Key Milestones / Achievements"
                name="key_milestones"
                value={
                  values.key_milestones
                }
                onChange={
                  updateValue
                }
              />

              <TextAreaField
                label="Media Mentions / Press Coverage"
                name="media_mentions"
                value={
                  values.media_mentions
                }
                onChange={
                  updateValue
                }
              />

              <TextAreaField
                label="Testimonials / Reference Letters"
                name="testimonials"
                value={
                  values.testimonials
                }
                onChange={
                  updateValue
                }
              />
            </div>

            <div className="civilian-kyc-upload-grid">
              <FileField
                label="Achievement / Award Certificate Scan"
                name="achievement_certificate"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.achievement_certificate
                }
                existing={
                  existing.achievement_certificate
                }
                onChange={
                  updateFile
                }
                description="PDF, JPG or PNG · Max 5 MB"
              />
            </div>
          </>
        );
      }

      /* ===================================================
         SECTION F
      =================================================== */

      if (
        activeSection ===
        "F"
      ) {
        return (
          <>
            <div className="civilian-kyc-form-grid">
              <TextAreaField
                label="Bio"
                name="bio"
                value={
                  values.bio
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.bio
                }
              />

              <TextAreaField
                label="Interest Categories"
                name="interest_categories"
                value={
                  values.interest_categories
                }
                onChange={
                  updateValue
                }
                placeholder="Education, Technology, Social Service..."
              />

              <TextAreaField
                label="Skills"
                name="skills"
                value={
                  values.skills
                }
                onChange={
                  updateValue
                }
                placeholder="Communication, Leadership, Excel..."
                readOnly={
                  isBasicVerified(
                    "skills"
                  )
                }
                verified={
                  isBasicVerified(
                    "skills"
                  )
                }
              />

              <TextAreaField
                label="Hobbies"
                name="hobbies"
                value={
                  values.hobbies
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Preferred Industry / Sector"
                name="preferred_industry"
                value={
                  values.preferred_industry
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Facebook URL"
                name="facebook_url"
                value={
                  values.facebook_url
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Instagram URL"
                name="instagram_url"
                value={
                  values.instagram_url
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="LinkedIn URL"
                name="linkedin_url"
                value={
                  values.linkedin_url
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="YouTube URL"
                name="youtube_url"
                value={
                  values.youtube_url
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Website / Portfolio"
                name="website_portfolio"
                value={
                  values.website_portfolio
                }
                onChange={
                  updateValue
                }
              />
            </div>

            <div className="civilian-kyc-upload-grid">
              <FileField
                label="Profile Photo"
                name="profile_photo"
                accept={
                  IMAGE_ACCEPT
                }
                selected={
                  sectionFiles.profile_photo
                }
                existing={
                  existing.profile_photo
                }
                onChange={
                  updateFile
                }
                description="JPG, PNG or WEBP · Max 5 MB"
              />

              <FileField
                label="Cover Photo / Banner"
                name="cover_photo"
                accept={
                  IMAGE_ACCEPT
                }
                selected={
                  sectionFiles.cover_photo
                }
                existing={
                  existing.cover_photo
                }
                onChange={
                  updateFile
                }
              />

              <FileField
                label="Gallery Photos"
                name="gallery_photos"
                accept={
                  IMAGE_ACCEPT
                }
                selected={
                  sectionFiles.gallery_photos
                }
                existing={
                  existing.gallery_photos
                }
                onChange={
                  updateFile
                }
                multiple
                description="Maximum 10 photos"
              />

              <FileField
                label="Intro Video"
                name="intro_video"
                accept={
                  VIDEO_ACCEPT
                }
                selected={
                  sectionFiles.intro_video
                }
                existing={
                  existing.intro_video
                }
                onChange={
                  updateFile
                }
                description="MP4, WEBM or MOV"
              />
            </div>
          </>
        );
      }

      /* ===================================================
         SECTION G
      =================================================== */

      if (
        activeSection ===
        "G"
      ) {
        return (
          <>
            <div className="civilian-kyc-network-panel">
              <div>
                <span>
                  Sponsor / Referral ID
                </span>

                <strong>
                  {
                    values.sponsor_referral_id ||
                    "System Generated"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Network Rank
                </span>

                <strong>
                  {
                    values.network_level_rank ||
                    "Not assigned"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Team Size
                </span>

                <strong>
                  {
                    values.team_size ||
                    0
                  }
                </strong>
              </div>

              <div>
                <span>
                  Royalty Slab
                </span>

                <strong>
                  {
                    values.royalty_slab_category ||
                    "Not assigned"
                  }
                </strong>
              </div>
            </div>

            <div className="civilian-kyc-form-grid">
              <Field
                label="Preferred Payout Cycle"
                name="preferred_payout_cycle"
                value={
                  values.preferred_payout_cycle
                }
                onChange={
                  updateValue
                }
                options={[
                  "Monthly",
                  "Quarterly",
                  "Half-Yearly",
                  "Yearly",
                ]}
              />
            </div>

            <p className="civilian-kyc-readonly-note">
              <i className="fa-solid fa-lock" />

              Sponsor, rank, team size and royalty slab are controlled by the INMBA system.
            </p>
          </>
        );
      }

      /* ===================================================
         SECTION H
      =================================================== */

      return (
        <div className="civilian-kyc-form-grid">
          <Field
            label="Emergency Contact Name"
            name="emergency_contact_name"
            value={
              values.emergency_contact_name
            }
            onChange={
              updateValue
            }
            required
            error={
              fieldErrors.emergency_contact_name
            }
          />

          <Field
            label="Emergency Contact Number"
            name="emergency_contact_number"
            value={
              values.emergency_contact_number
            }
            onChange={
              updateValue
            }
            required
            error={
              fieldErrors.emergency_contact_number
            }
          />

          <Field
            label="Relationship"
            name="emergency_relationship"
            value={
              values.emergency_relationship
            }
            onChange={
              updateValue
            }
            options={[
              "Father",
              "Mother",
              "Spouse",
              "Brother",
              "Sister",
              "Son",
              "Daughter",
              "Friend",
              "Guardian",
              "Other",
            ]}
            required
            error={
              fieldErrors.emergency_relationship
            }
          />
        </div>
      );
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <div className="civilian-kyc-loading">
        Loading Civilian KYC...
      </div>
    );
  }

  /* =======================================================
     LOCKED
  ======================================================= */

  const fromReview =
    location.state?.fromReview ===
    true;

  const normalizedStatus =
    String(
      status ||
      ""
    )
      .trim()
      .toLowerCase();

  /*
    REVIEW EDIT RULE

    - draft / in_progress:
      normal edit is allowed.

    - submitted / under_review:
      normally locked, but when the member comes from
      Civilian Review using state.fromReview === true,
      editing is temporarily allowed.

    - approved:
      always locked. Once admin has approved the KYC,
      Review Edit must not reopen it.
  */
  const locked =
    normalizedStatus ===
      "approved" ||
    (
      !fromReview &&
      [
        "submitted",
        "under_review",
      ].includes(
        normalizedStatus
      )
    );

  /* =======================================================
     RENDER
  ======================================================= */

  const activeMeta =
    SECTIONS.find(
      (
        item
      ) =>
        item.id ===
        activeSection
    ) ||
    SECTIONS[0];

  const displayStatus =
    String(
      status ||
      "draft"
    )
      .replace(
        /_/g,
        " "
      )
      .toUpperCase();

  return (
    <main className="civilian-kyc-page">
      <CivilianFlowTopbar />

      <section className="civilian-kyc-shell">
        {/* ===============================================
            MEMBER / PLAN / STATUS
        =============================================== */}

        <section className="civilian-kyc-member-card">
          <div className="civilian-kyc-member-main">
            <div className="civilian-kyc-member-avatar">
              <i className="fa-solid fa-users" />
            </div>

            <div>
              <span className="civilian-kyc-member-label">
                Civilian / Royalty Membership
              </span>

              <h1>
                {
                  memberSummary?.full_name ||
                  "Civilian Member"
                }
              </h1>

              <div className="civilian-kyc-member-meta">
                <span>
                  <i className="fa-solid fa-id-badge" />
                  {
                    memberSummary?.login_id ||
                    "Login ID"
                  }
                </span>

                {memberSummary?.phone && (
                  <span>
                    <i className="fa-solid fa-phone" />
                    {
                      memberSummary.phone
                    }
                  </span>
                )}

                {memberSummary?.email && (
                  <span>
                    <i className="fa-solid fa-envelope" />
                    {
                      memberSummary.email
                    }
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="civilian-kyc-member-side">
            <div className="civilian-kyc-plan-status">
              <span>
                Selected Plan
              </span>

              <strong>
                {
                  selectedPlan
                    ? `₹${selectedPlan}`
                    : "Not selected"
                }
              </strong>
            </div>

            <div className="civilian-kyc-status-box">
              <span>
                KYC Status
              </span>

              <strong
                className={`status-${String(
                  status ||
                  "draft"
                )
                  .toLowerCase()
                  .replace(/_/g, "-")}`}
              >
                <i className="fa-solid fa-circle" />
                {
                  displayStatus
                }
              </strong>
            </div>
          </div>
        </section>

        {/* ===============================================
            PROFESSIONAL STYLE PROGRESS CARD
        =============================================== */}

        <section className="civilian-kyc-progress-card">
          <div className="civilian-kyc-progress-heading">
            <div className="civilian-kyc-progress-title">
              <div className="civilian-kyc-progress-icon">
                <i className="fa-solid fa-chart-line" />
              </div>

              <div>
                <span>
                  Full KYC Progress
                </span>

                <h3>
                  Complete all A–H sections
                </h3>
              </div>
            </div>

            <strong className="civilian-kyc-progress-percent">
              {
                progressPercentage
              }
              %
            </strong>
          </div>

          <div className="civilian-kyc-progress-track">
            <div
              className="civilian-kyc-progress-bar"
              style={{
                width:
                  `${progressPercentage}%`,
              }}
            />
          </div>

          <div className="civilian-kyc-progress-footer">
            <span>
              {
                completedCount
              }{" "}
              of 8 sections completed
            </span>

            <span>
              Required fields must be completed before final submission.
            </span>
          </div>
        </section>

        {error && (
          <div className="civilian-kyc-error">
            <i className="fa-solid fa-circle-exclamation" />
            {error}
          </div>
        )}

        {success && (
          <div className="civilian-kyc-success">
            <i className="fa-solid fa-circle-check" />
            {success}
          </div>
        )}

        {locked ? (
          <section className="civilian-kyc-card civilian-kyc-locked-card">
            <i className="fa-solid fa-file-circle-check" />

            <h2>
              Civilian KYC{" "}
              {
                status ===
                "approved"
                  ? "Approved"
                  : "Submitted"
              }
            </h2>

            <p>
              Your Civilian KYC is locked while it is under verification.
            </p>

            <button
              type="button"
              className="civilian-kyc-next"
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
            >
              Back to Dashboard
            </button>
          </section>
        ) : (
          <div className="civilian-kyc-workspace">
            {/* =============================================
                SINGLE A-H NAVIGATION - NO DUPLICATE STEPPER
            ============================================= */}

            <aside className="civilian-kyc-sidebar">
              <div className="civilian-kyc-sidebar-title">
                <span>
                  Full KYC
                </span>

                <strong>
                  Sections A–H
                </strong>

                <small>
                  Required, optional and verified fields are clearly marked.
                </small>
              </div>

              <div className="civilian-kyc-section-list">
                {SECTIONS.map(
                  (
                    section
                  ) => {
                    const completed =
                      Boolean(
                        completionMap?.[
                          section.id
                        ]
                      );

                    const active =
                      activeSection ===
                      section.id;

                    return (
                      <button
                        key={
                          section.id
                        }
                        type="button"
                        className={[
                          "civilian-kyc-section-button",
                          active
                            ? "active"
                            : "",
                          completed
                            ? "completed"
                            : "",
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " "
                          )}
                        onClick={() => {
                          setActiveSection(
                            section.id
                          );

                          setError(
                            ""
                          );

                          setSuccess(
                            ""
                          );

                          setFieldErrors(
                            {}
                          );
                        }}
                        disabled={
                          saving
                        }
                      >
                        <div className="civilian-kyc-section-letter">
                          {completed ? (
                            <i className="fa-solid fa-check" />
                          ) : (
                            section.id
                          )}
                        </div>

                        <div className="civilian-kyc-section-button-copy">
                          <span>
                            Section{" "}
                            {
                              section.id
                            }
                          </span>

                          <strong>
                            {
                              section.title
                            }
                          </strong>
                        </div>

                        <i
                          className={
                            section.icon
                          }
                        />
                      </button>
                    );
                  }
                )}
              </div>

              <div className="civilian-kyc-sidebar-help">
                <i className="fa-solid fa-shield-halved" />

                <div>
                  <strong>
                    Secure KYC
                  </strong>

                  <p>
                    Basic KYC details such as Full Name, Date of Birth, Primary Mobile and Primary Email are already linked to your membership and are not asked again here.
                  </p>
                </div>
              </div>
            </aside>

            {/* =============================================
                ACTIVE SECTION CONTENT
            ============================================= */}

            <section className="civilian-kyc-card civilian-kyc-content-card">
              <div className="civilian-kyc-section-heading">
                <div className="civilian-kyc-content-icon">
                  <i
                    className={
                      activeMeta.icon
                    }
                  />
                </div>

                <div>
                  <span>
                    SECTION{" "}
                    {
                      activeSection
                    }
                  </span>

                  <h2>
                    {
                      activeMeta.title
                    }
                  </h2>
                </div>

                <div className="civilian-kyc-secure-badge">
                  <i className="fa-solid fa-lock" />
                  Secure KYC
                </div>
              </div>

              {/* ALL DETAILS MANDATORY NOTICE */}
              <div
                style={{
                  background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                  border: "1.5px solid #86efac",
                  borderRadius: "10px",
                  padding: "12px 18px",
                  margin: "12px 0 18px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  boxShadow: "0 2px 6px rgba(21, 128, 61, 0.08)",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#15803d",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.95rem",
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-solid fa-clipboard-check" />
                </div>
                <div>
                  <strong style={{ display: "block", color: "#14532d", fontSize: "0.92rem", fontWeight: 700, marginBottom: "2px" }}>
                    முக்கிய குறிப்பு: படிவத்தில் உள்ள அனைத்து விவரங்களையும் கட்டாயமாக பதிவு செய்ய வேண்டும்.
                  </strong>
                  <span style={{ fontSize: "0.82rem", color: "#166534" }}>
                    All details are strictly mandatory. Please fill in complete and accurate information across all sections.
                  </span>
                </div>
              </div>

              {renderSection()}

              <div className="civilian-kyc-actions">
                <button
                  type="button"
                  className="civilian-kyc-save-draft"
                  disabled={
                    saving
                  }
                  onClick={() =>
                    handleSave(
                      false
                    )
                  }
                >
                  <i className="fa-regular fa-floppy-disk" />

                  {saving
                    ? "Saving..."
                    : "Save Draft"}
                </button>

                {activeSection !== "H" ? (
                  <button
                    type="button"
                    className="civilian-kyc-next"
                    disabled={
                      saving
                    }
                    onClick={() =>
                      handleSave(
                        true
                      )
                    }
                  >
                    {saving
                      ? "Saving..."
                      : "Save & Continue"}

                    <i className="fa-solid fa-arrow-right" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="civilian-kyc-next"
                    disabled={
                      saving
                    }
onClick={
  handleFinalSubmit
}
                  >
                    {saving
                      ? "Submitting..."
                      : "Submit Full KYC"}

                    <i className="fa-solid fa-circle-check" />
                  </button>
                )}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
