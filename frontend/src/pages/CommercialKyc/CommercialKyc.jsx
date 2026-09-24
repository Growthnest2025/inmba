import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "@fortawesome/fontawesome-free/css/all.min.css";

import {
  CIVILIAN_KYC_SECTIONS,
  CIVILIAN_KYC_SECTION_TITLES,
  getCivilianKyc,
  getCivilianKycSection,
  saveCivilianKycSection,
  submitCivilianKyc,
}from "../../services/CivilianKyc.service.js";
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
}) {
  return (
    <div className="civilian-kyc-field">
      <label
        htmlFor={
          name
        }
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
}) {
  return (
    <div className="civilian-kyc-field civilian-kyc-field-full">
      <label
        htmlFor={
          name
        }
      >
        {label}

        {required && (
          <span>
            *
          </span>
        )}
      </label>

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
      <label>
        {label}

        {required && (
          <span>
            *
          </span>
        )}
      </label>

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

        if (
          Object.keys(
            sections
          ).length
        ) {
          setServerSections(
            sections
          );

          setForm(
            mergeServerSections(
              sections
            )
          );
        }

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
      []
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
        if (
          !values.full_legal_name?.trim()
        ) {
          errors.full_legal_name =
            "Full Legal Name is required.";
        }

        if (
          !values.father_spouse_name?.trim()
        ) {
          errors.father_spouse_name =
            "Father / Spouse Name is required.";
        }

        if (
          !values.dob
        ) {
          errors.dob =
            "Date of Birth is required.";
        }

        if (
          !values.gender
        ) {
          errors.gender =
            "Gender is required.";
        }

        if (
          !values.nationality?.trim()
        ) {
          errors.nationality =
            "Nationality is required.";
        }

        const aadhaarNumber = String(values.aadhaar_number || "").replace(/\s/g, "");

        if (!aadhaarNumber) {
          errors.aadhaar_number = "Aadhaar Number is required.";
        } else if (!/^\d{12}$/.test(aadhaarNumber)) {
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
        if (
          !values.primary_mobile?.trim()
        ) {
          errors.primary_mobile =
            "Primary Mobile is required.";
        }

        if (
          !values.primary_email?.trim()
        ) {
          errors.primary_email =
            "Primary Email is required.";
        }

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

        navigate(
          "/dashboard",
          {
            replace:
              true,

            state: {
              civilianKycSubmitted:
                true,
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
                label="Full Legal Name"
                name="full_legal_name"
                value={
                  values.full_legal_name
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.full_legal_name
                }
              />

              <Field
                label="Father / Spouse Name"
                name="father_spouse_name"
                value={
                  values.father_spouse_name
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.father_spouse_name
                }
              />

              <Field
                label="Date of Birth"
                name="dob"
                type="date"
                value={
                  values.dob
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.dob
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
                required
                error={
                  fieldErrors.gender
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
              />

              <Field
                label="Aadhaar Number"
                name="aadhaar_number"
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
                label="Primary Mobile Number"
                name="primary_mobile"
                value={
                  values.primary_mobile
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.primary_mobile
                }
              />

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
                label="Primary Email"
                name="primary_email"
                type="email"
                value={
                  values.primary_email
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.primary_email
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

  const locked =
    [
      "submitted",
      "under_review",
      "approved",
    ].includes(
      String(
        status
      ).toLowerCase()
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="civilian-kyc-page">
      <CivilianFlowTopbar />

      <section className="civilian-kyc-shell">
        <header className="civilian-kyc-header">
          <span>
            CIVILIAN / ROYALTY MEMBER
          </span>

          <h1>
            Complete your Full KYC
          </h1>

          <p>
            Complete sections A - H to build your verified INMBA Civilian profile.
          </p>

          <div className="civilian-kyc-progress-wrap">
            <div>
              <span>
                {
                  progressPercentage
                }
                % Complete
              </span>

              <strong>
                {
                  completedCount
                }
                /8 Sections
              </strong>
            </div>

            <div className="civilian-kyc-progress-track">
              <span
                style={{
                  width:
                    `${progressPercentage}%`,
                }}
              />
            </div>
          </div>
        </header>

        <div className="civilian-kyc-steps">
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

              return (
                <button
                  key={
                    section.id
                  }
                  type="button"
                  className={[
                    activeSection ===
                    section.id
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
                >
                  <b>
                    {completed ? (
                      <i className="fa-solid fa-check" />
                    ) : (
                      section.id
                    )}
                  </b>

                  <span>
                    {
                      section.title
                    }
                  </span>
                </button>
              );
            }
          )}
        </div>

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
          <section className="civilian-kyc-card">
            <div className="civilian-kyc-section-heading">
              <span>
                SECTION{" "}
                {
                  activeSection
                }
              </span>

              <h2>
                {
                  SECTIONS.find(
                    (
                      item
                    ) =>
                      item.id ===
                      activeSection
                  )?.title
                }
              </h2>
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
                    handleSubmit
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
        )}
      </section>
    </main>
  );
}
