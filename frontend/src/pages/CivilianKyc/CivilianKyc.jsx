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
  CIVILIAN_KYC_SECTIONS,
  CIVILIAN_KYC_SECTION_TITLES,
  getCivilianKyc,
  getCivilianKycSection,
  saveCivilianKycSection,
  submitCivilianKyc,
} from "../../services/CivilianKyc.service";

import "./CivilianKyc.css";

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
  const requirementLabel =
    verified
      ? "Already Verified"
      : requirement ||
        (required ? "Required" : "Optional");

  return (
    <div className="civilian-kyc-field">
      <div className="civilian-kyc-label-row">
        <label
          htmlFor={
            name
          }
        >
          {label}
        </label>

        <span
          className={[
            "civilian-kyc-requirement",
            verified
              ? "verified"
              : requirementLabel
                  .toLowerCase()
                  .replace(/\s+/g, "-"),
          ].join(" ")}
        >
          {verified && (
            <i className="fa-solid fa-circle-check" />
          )}

          {requirementLabel}
        </span>
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
        <small className="civilian-kyc-field-error">
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
  const requirementLabel =
    requirement ||
    (required ? "Required" : "Optional");

  return (
    <div className="civilian-kyc-field civilian-kyc-field-full">
      <div className="civilian-kyc-label-row">
        <label
          htmlFor={
            name
          }
        >
          {label}
        </label>

        <span
          className={[
            "civilian-kyc-requirement",
            requirementLabel
              .toLowerCase()
              .replace(/\s+/g, "-"),
          ].join(" ")}
        >
          {requirementLabel}
        </span>
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
        <small className="civilian-kyc-field-error">
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

        <span
          className={[
            "civilian-kyc-requirement",
            required
              ? "required"
              : "optional",
          ].join(" ")}
        >
          {required ? "Required" : "Optional"}
        </span>
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
          "300",
          "1500",
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
              full_legal_name:
                fullName,

              father_spouse_name:
                member?.father_name ||
                member?.father_spouse_name ||
                "",

              dob:
                member?.dob ||
                "",

              gender:
                member?.gender ||
                "",

              marital_status:
                member?.marital_status ||
                "",

              nationality:
                member?.nationality ||
                "",

              aadhaar_number:
                member?.aadhar ||
                member?.aadhaar ||
                member?.aadhaar_number ||
                "",

              pan_number:
                member?.pan_number ||
                "",

              blood_group:
                member?.blood_group ||
                "",
            },

            B: {
              primary_mobile:
                member?.phone ||
                member?.mobile ||
                "",

              primary_email:
                member?.email ||
                "",

              whatsapp_number:
                member?.whatsapp_number ||
                "",

              district:
                member?.district ||
                member?.entity_district ||
                "",

              state:
                member?.state ||
                member?.entity_state ||
                "",

              pincode:
                member?.pincode ||
                member?.entity_pincode ||
                "",
            },

            D: {
              highest_qualification:
                member?.educational_qualification ||
                member?.education ||
                "",
            },

            F: {
              skills:
                member?.skills ||
                "",
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

        setForm(
          mergedBasic.next
        );

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
      value
    ) => {
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

        const aadhaarNumber = String(
          values.aadhaar_number || ""
        ).replace(/\s/g, "");

        if (selectedPlan === "300" && !aadhaarNumber) {
          errors.aadhaar_number = "Aadhaar Number is required for the ₹300 plan.";
        } else if (aadhaarNumber && !/^\d{12}$/.test(aadhaarNumber)) {
          errors.aadhaar_number = "Enter valid 12 digit Aadhaar Number.";
        }

        if (
          values.pan_number &&
          !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(
            values.pan_number.trim()
          )
        ) {
          errors.pan_number =
            "Enter valid PAN Number.";
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
        }
      }

      if (
        activeSection ===
        "C" &&
        values.ifsc_code &&
        !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(
          values.ifsc_code.trim()
        )
      ) {
        errors.ifsc_code =
          "Enter valid IFSC Code.";
      }

      if (
        activeSection ===
        "F" &&
        !values.bio?.trim()
      ) {
        errors.bio =
          "Bio / About Me is required.";
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
        }

        if (
          !values.emergency_relationship?.trim()
        ) {
          errors.emergency_relationship =
            "Relationship is required.";
        }
      }

      setFieldErrors(
        errors
      );

      return (
        Object.keys(
          errors
        ).length ===
        0
      );
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
        setError(
          `Please complete Section ${activeSection} correctly before continuing.`
        );

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

    if (!selectedPlan) {
      setError(
        "Please select the ₹300 or ₹1500 Civilian membership plan before reviewing Full KYC."
      );
      return;
    }

    // 3. Go to Civilian Review
    navigate(
      `/civilian-review?plan=${encodeURIComponent(
        selectedPlan
      )}`,
      {
        replace: true,
        state: {
          civilianKycSubmitted: true,
          selectedPlan,
          selected_plan: selectedPlan,
        },
      }
    );
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

        if (!selectedPlan) {
          setError(
            "Please select the ₹300 or ₹1500 Civilian membership plan before reviewing Full KYC."
          );

          return;
        }

        /*
          Full KYC submitted successfully.
          Civilian now follows the same review-first pattern:

          Full KYC
            ↓
          Review
            ↓
          Payment
        */
        navigate(
          `/civilian-review?plan=${encodeURIComponent(
            selectedPlan
          )}`,
          {
            replace: true,

            state: {
              civilianKycSubmitted: true,
              selectedPlan,
              selected_plan: selectedPlan,
            },
          }
        );
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
                requirement="Optional"
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
                requirement="Optional"
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
                description={selectedPlan === "300" ? "Required for the ₹300 plan." : "Optional. If already provided in Basic KYC, it is shown as verified and cannot be re-entered."}
                value={
                  values.aadhaar_number
                }
                onChange={
                  updateValue
                }
                placeholder="12 digit Aadhaar"
                required={selectedPlan === "300"}
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
                requirement="Optional"
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
                requirement="Optional"
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
                requirement="Optional"
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
                requirement="If applicable"
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
                requirement="If applicable"
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
                value={
                  values.nominee_name
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Nominee Relationship"
                name="nominee_relationship"
                value={
                  values.nominee_relationship
                }
                onChange={
                  updateValue
                }
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
                label="Bio / About Me"
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

              <div className="civilian-kyc-field-legend">
                <span className="required">
                  Required
                </span>

                <span className="optional">
                  Optional
                </span>

                <span className="if-applicable">
                  If applicable
                </span>

                <span className="verified">
                  <i className="fa-solid fa-circle-check" />
                  Already Verified
                </span>
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
