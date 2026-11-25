import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  useAuth,
} from "../../../context/AuthContext";

import {
  getOwnProfile,
  updateOwnProfile,
  uploadMyProfilePhoto,
  uploadMyCoverPhoto,
} from "../../../services/profile.service";

import {
  getApiErrorMessage,
  getFieldErrors,
} from "../../../utils/apiError";

import "./EditProfile.css";
import { asObject } from "../../../utils/commonHelpers";

/* =========================
   EDITABLE PROFILE FIELDS
========================= */

const EDITABLE_FIELDS = [
  "first_name",
  "last_name",
  "father_name",
  "dob",
  "gender",
  "blood_group",
  "marital_status",
  "nationality",
  "email",
  "phone",
  "whatsapp_number",
  "contact_number",

  "address",
  "district",
  "state",
  "pincode",
  "country",

  "entity_house_no",
  "entity_street",
  "entity_area",
  "entity_district",
  "entity_state",
  "entity_pincode",

  "occupation",
  "profession",

  "school_name",
  "school_class",
  "board",
  "school_city",

  "ug_college",
  "ug_degree",
  "ug_department",
  "ug_year",

  "pg_college",
  "pg_degree",
  "pg_specialization",

  "skills",
  "student_id",

  "bio",
  "social_link",
  "social_instagram",
  "social_linkedin",
  "social_twitter",
  "social_facebook",
  "social_youtube",

  "bank_name",
  "bank_account_number",
  "account_number",
  "ifsc_code",
  "ifsc",
  "branch",
  "bank_branch",
  "bank_branch_name",

  "cover_photo",
  "banner",
  "profile_photo",
  "profile_pic",

  "nomini_name",
  "nomini_relationship",
  "nominee_name",
  "nominee_relationship",
  "emergency_contact_name",
  "emergency_contact_number",
  "emergency_relationship",
  "school_college_name",
  "highest_qualification",
  "degree_year",
];

/* =========================
   INITIAL FORM DATA
========================= */

const INITIAL_FORM_DATA =
  EDITABLE_FIELDS.reduce(
    (
      result,
      field
    ) => {
      result[field] =
        "";

      return result;
    },
    {}
  );

/* =========================
   OBJECT HELPER
========================= */

/* =========================
   STRING HELPER
========================= */

const toInputValue = (
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

  return String(
    value
  );
};

/* =========================
   DATE INPUT FORMAT
========================= */

const toDateInputValue = (
  value
) => {
  if (!value) {
    return "";
  }

  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const mon = dmy[2].padStart(2, '0');
    const yr = dmy[3];
    return `${yr}-${mon}-${day}`;
  }

  // DD Mon YYYY e.g. "02 Jan 2022" or "2 Jan 2022"
  const months = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
  const worded = s.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (worded) {
    const day = worded[1].padStart(2, '0');
    const monKey = worded[2].slice(0, 3).toLowerCase();
    const mon = months[monKey];
    const yr = worded[3];
    if (mon) return `${yr}-${mon}-${day}`;
  }

  const date = new Date(s);
  if (!Number.isNaN(date.getTime())) {
    const yr = date.getFullYear();
    const mon = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${yr}-${mon}-${day}`;
  }

  return "";
};

/* =========================
   PROFILE TO FORM DATA
========================= */

const createFormDataFromProfile = (
  profile
) => {
  const source =
    asObject(
      profile
    );

  const initial = EDITABLE_FIELDS.reduce(
    (
      result,
      field
    ) => {
      if (
        field === "dob" ||
        field ===
          "nomini_dob"
      ) {
        result[field] =
          toDateInputValue(
            source[field]
          );
      } else {
        result[field] =
          toInputValue(
            source[field]
          );
      }

      return result;
    },
    {}
  );

  // Clean unintended "org" suffix in name
  if ((initial.last_name || "").trim().toLowerCase() === "org") {
    initial.last_name = "";
  }
  if ((initial.first_name || "").match(/\s+org$/i)) {
    initial.first_name = initial.first_name.replace(/\s+org$/i, "").trim();
  }

  // Ensure date of birth is preserved
  initial.dob = toDateInputValue(source.dob || source.date_of_birth || initial.dob || "");
  initial.father_name = source.father_name || source.father_spouse_name || initial.father_name || "";

  // Education fallbacks
  initial.school_college_name = source.school_college_name || source.school_name || source.ug_college || source.pg_college || source.institution_name || initial.school_college_name || "";
  initial.school_name = initial.school_name || initial.school_college_name;
  initial.ug_college = initial.ug_college || initial.school_college_name;
  initial.highest_qualification = source.highest_qualification || source.educational_qualification || source.education || initial.highest_qualification || "";
  initial.degree_year = source.degree_year || source.ug_year || initial.degree_year || "";
  initial.ug_year = initial.ug_year || initial.degree_year;

  // Emergency contact fallbacks
  initial.emergency_contact_name = source.emergency_contact_name || initial.emergency_contact_name || "";
  initial.emergency_contact_number = source.emergency_contact_number || initial.emergency_contact_number || "";
  initial.emergency_relationship = source.emergency_relationship || initial.emergency_relationship || "";

  // Ensure bank, banner, photo, and nominee fields are mapped cleanly
  initial.branch = source.branch || source.bank_branch || source.bank_branch_name || initial.branch || "";
  initial.bank_branch = initial.branch;
  initial.bank_branch_name = initial.branch;
  initial.bank_name = source.bank_name || initial.bank_name || "";
  initial.account_number = source.bank_account_number || source.account_number || initial.account_number || "";
  initial.ifsc_code = source.ifsc_code || source.ifsc || initial.ifsc_code || "";
  initial.cover_photo = source.cover_photo || source.banner || initial.cover_photo || "";
  initial.banner = initial.cover_photo;
  initial.profile_photo = source.profile_photo || source.profile_pic || source.profile_image_url || initial.profile_photo || "";
  initial.profile_pic = initial.profile_photo;
  initial.nomini_name = source.nominee_name || source.nomini_name || initial.nomini_name || "";
  initial.nomini_relationship = source.nominee_relationship || source.nomini_relationship || initial.nomini_relationship || "";
  initial.nominee_name = initial.nomini_name;
  initial.nominee_relationship = initial.nomini_relationship;

  return initial;
};

/* =========================
   FIELD COMPONENT
========================= */

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder = "",
  options = [],
  required = false,
  disabled = false,
  inputMode,
  autoComplete,
  maxLength,
}) {
  const inputId =
    `edit-profile-${name}`;

  return (
    <div className="inmba-edit-field">
      <label
        htmlFor={
          inputId
        }
      >
        {label}

        {required && (
          <span>
            *
          </span>
        )}
      </label>

      {type ===
      "select" ? (
        <select
          id={
            inputId
          }
          name={
            name
          }
          value={
            value
          }
          onChange={
            onChange
          }
          disabled={
            disabled
          }
          className={
            error
              ? "inmba-edit-input-error"
              : ""
          }
        >
          <option value="">
            Select{" "}
            {label}
          </option>

          {options.map(
            (
              option
            ) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {
                  option.label
                }
              </option>
            )
          )}
        </select>
      ) : (
        <input
          id={
            inputId
          }
          name={
            name
          }
          type={
            type
          }
          value={
            value
          }
          onChange={
            onChange
          }
          placeholder={
            placeholder
          }
          required={
            required
          }
          disabled={
            disabled
          }
          inputMode={
            inputMode
          }
          autoComplete={
            autoComplete
          }
          maxLength={
            maxLength
          }
          className={
            error
              ? "inmba-edit-input-error"
              : ""
          }
        />
      )}

      {error && (
        <small className="inmba-edit-field-error">
          {error}
        </small>
      )}
    </div>
  );
}

/* =========================
   TEXTAREA COMPONENT
========================= */

function FormTextarea({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  rows = 4,
  maxLength,
}) {
  const inputId =
    `edit-profile-${name}`;

  return (
    <div className="inmba-edit-field inmba-edit-field-full">
      <label
        htmlFor={
          inputId
        }
      >
        {label}
      </label>

      <textarea
        id={
          inputId
        }
        name={
          name
        }
        value={
          value
        }
        onChange={
          onChange
        }
        placeholder={
          placeholder
        }
        rows={
          rows
        }
        maxLength={
          maxLength
        }
        className={
          error
            ? "inmba-edit-input-error"
            : ""
        }
      />

      <div className="inmba-edit-textarea-footer">
        {error ? (
          <small className="inmba-edit-field-error">
            {error}
          </small>
        ) : (
          <span></span>
        )}

        {maxLength && (
          <small>
            {
              String(
                value ||
                ""
              ).length
            }
            /
            {
              maxLength
            }
          </small>
        )}
      </div>
    </div>
  );
}

/* =========================
   FORM SECTION
========================= */

function FormSection({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section className="inmba-edit-section">
      <header className="inmba-edit-section-header">
        <div className="inmba-edit-section-icon">
          <i
            className={
              icon
            }
            aria-hidden="true"
          ></i>
        </div>

        <div>
          <h2>
            {title}
          </h2>

          <p>
            {
              description
            }
          </p>
        </div>
      </header>

      <div className="inmba-edit-form-grid">
        {children}
      </div>
    </section>
  );
}

/* =========================
   SELECT OPTIONS
========================= */

const GENDER_OPTIONS = [
  {
    value:
      "Male",
    label:
      "Male",
  },
  {
    value:
      "Female",
    label:
      "Female",
  },
  {
    value:
      "Other",
    label:
      "Other",
  },
];

const MARITAL_OPTIONS = [
  {
    value:
      "Single",
    label:
      "Single",
  },
  {
    value:
      "Married",
    label:
      "Married",
  },
  {
    value:
      "Widowed",
    label:
      "Widowed",
  },
  {
    value:
      "Divorced",
    label:
      "Divorced",
  },
];

const BLOOD_GROUP_OPTIONS = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
];

const CLASS_OPTIONS = [
  { value: "Class 1", label: "Class 1 (1st Std)" },
  { value: "Class 2", label: "Class 2 (2nd Std)" },
  { value: "Class 3", label: "Class 3 (3rd Std)" },
  { value: "Class 4", label: "Class 4 (4th Std)" },
  { value: "Class 5", label: "Class 5 (5th Std)" },
  { value: "Class 6", label: "Class 6 (6th Std)" },
  { value: "Class 7", label: "Class 7 (7th Std)" },
  { value: "Class 8", label: "Class 8 (8th Std)" },
  { value: "Class 9", label: "Class 9 (9th Std)" },
  { value: "Class 10", label: "Class 10 (10th Std / SSLC)" },
  { value: "Class 11", label: "Class 11 (11th Std / +1)" },
  { value: "Class 12", label: "Class 12 (12th Std / +2 / HSC)" },
];

const BOARD_OPTIONS = [
  { value: "State Board", label: "State Board" },
  { value: "CBSE", label: "CBSE (Central Board of Secondary Education)" },
  { value: "ICSE / ISC", label: "ICSE / ISC" },
  { value: "Matriculation", label: "Matriculation" },
  { value: "IGCSE / Cambridge", label: "IGCSE / Cambridge" },
  { value: "IB", label: "IB (International Baccalaureate)" },
  { value: "NIOS", label: "NIOS (Open School)" },
  { value: "Anglo-Indian", label: "Anglo-Indian Board" },
  { value: "Other", label: "Other" },
];

/* =========================
   EDIT PROFILE PAGE
========================= */

export default function EditProfile() {
  const navigate =
    useNavigate();

  const {
    clearMemberSession,
    checkMemberSession,
  } =
    useAuth();

  const [
    formData,
    setFormData,
  ] =
    useState({
      ...INITIAL_FORM_DATA,
    });

  const [
    originalData,
    setOriginalData,
  ] =
    useState({
      ...INITIAL_FORM_DATA,
    });

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
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    loadError,
    setLoadError,
  ] =
    useState("");

  const [
    formError,
    setFormError,
  ] =
    useState("");

  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState({});

  /* =========================
     LOAD PROFILE

     GET /my_profile
  ========================= */

  const loadProfile =
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

          setLoadError(
            ""
          );

          const result =
            await getOwnProfile({
              signal,
            });

          const currentProfile =
            asObject(
              result.profile
            );

          const nextFormData =
            createFormDataFromProfile(
              currentProfile
            );

          setProfile(
            currentProfile
          );

          setFormData(
            nextFormData
          );

          setOriginalData(
            nextFormData
          );
        } catch (
          error
        ) {
          const cancelled =
            error?.code ===
              "ERR_CANCELED" ||
            error?.name ===
              "CanceledError" ||
            signal?.aborted;

          if (
            cancelled
          ) {
            return;
          }

          const statusCode =
            Number(
              error?.response
                ?.status ||
              error?.statusCode ||
              0
            );

          if (
            statusCode ===
            401
          ) {
            clearMemberSession();

            navigate(
              "/login",
              {
                replace:
                  true,

                state: {
                  from:
                    "/profile/edit",

                  error:
                    "Your session has expired. Please login again.",
                },
              }
            );

            return;
          }

          console.error(
            "Edit Profile API Error:",
            error
          );

          setLoadError(
            getApiErrorMessage(
              error,
              "Unable to load profile information."
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
        clearMemberSession,
        navigate,
      ]
    );

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadProfile({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadProfile,
    ]
  );

  /* =========================
     MEMBER DETAILS
  ========================= */

  const fullName =
    useMemo(
      () => {
        const cleanLastName = (formData.last_name || "").trim().toLowerCase() === "org" ? "" : formData.last_name;
        const cleanFirstName = (formData.first_name || "").replace(/\s+org$/i, "").trim();
        return `${cleanFirstName} ${cleanLastName}`
          .trim() ||
          "INMBA Member";
      },
      [
        formData.first_name,
        formData.last_name,
      ]
    );

  const hasChanges =
    useMemo(
      () => {
        return EDITABLE_FIELDS.some(
          (
            field
          ) => {
            return (
              toInputValue(
                formData[field]
              ) !==
              toInputValue(
                originalData[
                  field
                ]
              )
            );
          }
        );
      },
      [
        formData,
        originalData,
      ]
    );

  /* =========================
     INPUT CHANGE
  ========================= */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } =
      event.target;

    setFormData(
      (
        previousData
      ) => {
        return {
          ...previousData,
          [name]:
            value,
        };
      }
    );

    setFormError(
      ""
    );

    setFieldErrors(
      (
        previousErrors
      ) => {
        if (
          !previousErrors[
            name
          ]
        ) {
          return previousErrors;
        }

        return {
          ...previousErrors,
          [name]:
            "",
        };
      }
    );
  };

  /* =========================
     VALIDATION
  ========================= */

  const validateForm = () => {
    const errors =
      {};

    if (
      !formData
        .first_name
        .trim()
    ) {
      errors.first_name =
        "First name is required.";
    }

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim()
      )
    ) {
      errors.email =
        "Enter a valid email address.";
    }

    const phoneFields = [
      "phone",
      "whatsapp_number",
      "contact_number",
    ];

    phoneFields.forEach(
      (
        field
      ) => {
        const value =
          formData[
            field
          ]
            .replace(
              /[\s()+-]/g,
              ""
            )
            .trim();

        if (
          value &&
          !/^\d{7,15}$/.test(
            value
          )
        ) {
          errors[field] =
            "Enter a valid phone number.";
        }
      }
    );

    if (
      formData.pincode &&
      !/^[a-zA-Z0-9 -]{4,12}$/.test(
        formData.pincode
      )
    ) {
      errors.pincode =
        "Enter a valid pincode.";
    }

    if (
      formData
        .entity_pincode &&
      !/^[a-zA-Z0-9 -]{4,12}$/.test(
        formData
          .entity_pincode
      )
    ) {
      errors.entity_pincode =
        "Enter a valid pincode.";
    }

    if (
      formData.dob
    ) {
      const dob =
        new Date(
          formData.dob
        );

      const today =
        new Date();

      if (
        dob >
        today
      ) {
        errors.dob =
          "Date of birth cannot be in the future.";
      }
    }

    setFieldErrors(
      errors
    );

    if (
      Object.keys(
        errors
      ).length >
      0
    ) {
      setFormError(
        "Please correct the highlighted fields."
      );

      return false;
    }

    return true;
  };

  /* =========================
     CREATE UPDATE PAYLOAD
  ========================= */

  const createUpdatePayload =
    () => {
      const payload = {};
      for (const field of EDITABLE_FIELDS) {
        let currentValue =
          toInputValue(
            formData[field]
          ).trim();

        if (field === "last_name" && currentValue.toLowerCase() === "org") {
          currentValue = "";
        }
        if (field === "first_name") {
          currentValue = currentValue.replace(/\s+org$/i, "").trim();
        }

        payload[field] = currentValue;
      }

      const origLastName = toInputValue(originalData.last_name).trim();
      if (origLastName.toLowerCase() === "org" && !payload.last_name) {
        payload.last_name = "";
      }

      return payload;
    };

  /* =========================
     SAVE PROFILE

     POST /profile/update
  ========================= */

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        saving
      ) {
        return;
      }

      setFormError(
        ""
      );

      if (
        !validateForm()
      ) {
        window.scrollTo({
          top:
            0,
          behavior:
            "smooth",
        });

        return;
      }

      const payload =
        createUpdatePayload();

      if (
        Object.keys(
          payload
        ).length ===
        0
      ) {
        toast.info(
          "No profile changes found."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        setFieldErrors(
          {}
        );

        const result =
          await updateOwnProfile(
            payload
          );

        await checkMemberSession();

        toast.success(
          result?.response
            ?.message ||
            "Profile updated successfully."
        );

        navigate(
          "/profile",
          {
            replace:
              true,

            state: {
              message:
                "Profile updated successfully.",
            },
          }
        );
      } catch (
        error
      ) {
        const statusCode =
          Number(
            error?.response
              ?.status ||
            error?.statusCode ||
            0
          );

        if (
          statusCode ===
          401
        ) {
          clearMemberSession();

          navigate(
            "/login",
            {
              replace:
                true,

              state: {
                from:
                  "/profile/edit",

                error:
                  "Your session has expired. Please login again.",
              },
            }
          );

          return;
        }

        const apiFieldErrors =
          getFieldErrors(
            error
          );

        setFieldErrors(
          apiFieldErrors
        );

        setFormError(
          getApiErrorMessage(
            error,
            "Unable to update profile."
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

  /* =========================
     RESET CHANGES
  ========================= */

  const handleReset =
    () => {
      setFormData({
        ...originalData,
      });

      setFieldErrors(
        {}
      );

      setFormError(
        ""
      );

      toast.info(
        "Unsaved changes cleared."
      );
    };

  /* =========================
     LOADING
  ========================= */

  if (
    loading
  ) {
    return (
      <main className="inmba-edit-profile-page">
        <div className="inmba-edit-profile-state">
          <div
            className="spinner-border"
            role="status"
            aria-label="Loading edit profile"
          ></div>

          <h1>
            Loading Profile
          </h1>

          <p>
            Preparing your editable profile information.
          </p>
        </div>
      </main>
    );
  }

  /* =========================
     LOAD ERROR
  ========================= */

  if (
    loadError
  ) {
    return (
      <main className="inmba-edit-profile-page">
        <div className="inmba-edit-profile-state inmba-edit-profile-error">
          <div className="inmba-edit-profile-state-icon">
            <i
              className="fas fa-triangle-exclamation"
              aria-hidden="true"
            ></i>
          </div>

          <h1>
            Unable to Edit Profile
          </h1>

          <p>
            {loadError}
          </p>

          <button
            type="button"
            className="inmba-edit-primary-button"
            onClick={() =>
              loadProfile()
            }
          >
            <i
              className="fas fa-rotate-right"
              aria-hidden="true"
            ></i>

            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="inmba-edit-profile-page">
      <div className="inmba-edit-profile-container">
        {/* =====================
            PAGE HEADER
        ===================== */}

        <header className="inmba-edit-profile-header">
          <div>
            <p>
              INMBA Member Portal
            </p>

            <h1>
              Edit Profile
            </h1>

            <span>
              Update your personal, contact, education and professional
              information.
            </span>
          </div>

          <div className="inmba-edit-profile-header-actions">
            <Link
              to="/profile"
              className="inmba-edit-secondary-button"
            >
              <i
                className="fas fa-arrow-left"
                aria-hidden="true"
              ></i>

              Back to Profile
            </Link>
          </div>
        </header>

        {/* =====================
            MEMBER SUMMARY
        ===================== */}

        <section className="inmba-edit-member-summary">
          <div className="inmba-edit-member-avatar">
            {fullName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <h2>
              {fullName}
            </h2>

            <p>
              Login ID:{" "}
              {profile
                ?.login_id ||
                "Not available"}
            </p>
          </div>

          <span>
            {profile
              ?.membership_type ||
              "INMBA Member"}
          </span>
        </section>

        {formError && (
          <div
            className="inmba-edit-alert"
            role="alert"
          >
            <i
              className="fas fa-circle-exclamation"
              aria-hidden="true"
            ></i>

            <span>
              {formError}
            </span>
          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          {/* =====================
              PROFILE & BANNER PHOTO
          ===================== */}
          <FormSection
            icon="fas fa-image"
            title="Profile & Banner Photo"
            description="Update your public profile photo and cover banner."
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.9rem" }}>
                  Profile Photo
                </label>
                {formData.profile_photo || formData.profile_pic ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <img
                      src={formData.profile_photo || formData.profile_pic}
                      alt="Profile preview"
                      style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", border: "2px solid #22c55e" }}
                    />
                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Photo uploaded</span>
                  </div>
                ) : null}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const res = await uploadMyProfilePhoto(file);
                      const photoUrl = res.photo_url || res.profile_pic || res.profile_photo;
                      if (photoUrl) {
                        setFormData((prev) => ({ ...prev, profile_photo: photoUrl, profile_pic: photoUrl }));
                        toast.success("Profile photo updated!");
                      }
                    } catch {
                      toast.error("Failed to upload profile photo.");
                    }
                  }}
                  style={{ padding: "8px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#f8fafc" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.9rem" }}>
                  Cover Banner Image
                </label>
                {formData.cover_photo || formData.banner ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <img
                      src={formData.cover_photo || formData.banner}
                      alt="Banner preview"
                      style={{ width: "120px", height: "50px", borderRadius: "8px", objectFit: "cover", border: "2px solid #22c55e" }}
                    />
                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>Banner uploaded</span>
                  </div>
                ) : null}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const res = await uploadMyCoverPhoto(file);
                      const bannerUrl = res.cover_photo || res.banner || res.photo_url;
                      if (bannerUrl) {
                        setFormData((prev) => ({ ...prev, cover_photo: bannerUrl, banner: bannerUrl }));
                        toast.success("Cover banner updated!");
                      }
                    } catch {
                      toast.error("Failed to upload cover banner.");
                    }
                  }}
                  style={{ padding: "8px", border: "1px solid #cbd5e1", borderRadius: "8px", background: "#f8fafc" }}
                />
              </div>
            </div>
          </FormSection>

          {/* =====================
              PERSONAL INFORMATION
          ===================== */}

          <FormSection
            icon="fas fa-user"
            title="Personal Information"
            description="Update your basic personal details."
          >
            <FormField
              label="First Name"
              name="first_name"
              value={
                formData.first_name
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.first_name
              }
              required
              autoComplete="given-name"
            />

            <FormField
              label="Last Name"
              name="last_name"
              value={
                formData.last_name
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.last_name
              }
              autoComplete="family-name"
            />

            <FormField
              label="Father Name"
              name="father_name"
              value={
                formData.father_name
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.father_name
              }
            />

            <FormField
              label="Date of Birth"
              name="dob"
              type="date"
              value={
                formData.dob
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.dob
              }
            />

            <FormField
              label="Gender"
              name="gender"
              type="select"
              options={
                GENDER_OPTIONS
              }
              value={
                formData.gender
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.gender
              }
            />

            <FormField
              label="Blood Group"
              name="blood_group"
              type="select"
              options={
                BLOOD_GROUP_OPTIONS
              }
              value={
                formData.blood_group
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.blood_group
              }
            />

            <FormField
              label="Marital Status"
              name="marital_status"
              type="select"
              options={
                MARITAL_OPTIONS
              }
              value={
                formData.marital_status
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.marital_status
              }
            />

            <FormField
              label="Nationality"
              name="nationality"
              value={
                formData.nationality
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.nationality
              }
              placeholder="Example: Indian"
            />
          </FormSection>

          {/* =====================
              CONTACT INFORMATION
          ===================== */}

          <FormSection
            icon="fas fa-address-book"
            title="Contact Information"
            description="Update your email and contact numbers."
          >
            <FormField
              label="Email"
              name="email"
              type="email"
              value={
                formData.email
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.email
              }
              autoComplete="email"
            />

            <FormField
              label="Phone Number"
              name="phone"
              type="tel"
              value={
                formData.phone
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.phone
              }
              inputMode="tel"
              autoComplete="tel"
            />

            <FormField
              label="WhatsApp Number"
              name="whatsapp_number"
              type="tel"
              value={
                formData.whatsapp_number
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.whatsapp_number
              }
              inputMode="tel"
            />

            <FormField
              label="Alternative Contact"
              name="contact_number"
              type="tel"
              value={
                formData.contact_number
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.contact_number
              }
              inputMode="tel"
            />
          </FormSection>

          {/* =====================
              ADDRESS
          ===================== */}

          <FormSection
            icon="fas fa-location-dot"
            title="Residential Address"
            description="Update your current residential location."
          >
            <FormTextarea
              label="Full Address"
              name="address"
              value={
                formData.address
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.address
              }
              placeholder="Enter house number, street and area"
              rows={3}
              maxLength={500}
            />

            <FormField
              label="District"
              name="district"
              value={
                formData.district
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.district
              }
            />

            <FormField
              label="State"
              name="state"
              value={
                formData.state
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.state
              }
            />

            <FormField
              label="Pincode"
              name="pincode"
              value={
                formData.pincode
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.pincode
              }
              inputMode="numeric"
            />

            <FormField
              label="Country"
              name="country"
              value={
                formData.country
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.country
              }
            />
          </FormSection>

          {/* =====================
              ENTITY ADDRESS
          ===================== */}

          <FormSection
            icon="fas fa-building"
            title="Entity Address"
            description="Fill this section when you have a business or legal entity address."
          >
            <FormField
              label="House / Door Number"
              name="entity_house_no"
              value={
                formData.entity_house_no
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.entity_house_no
              }
            />

            <FormField
              label="Street"
              name="entity_street"
              value={
                formData.entity_street
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.entity_street
              }
            />

            <FormField
              label="Area"
              name="entity_area"
              value={
                formData.entity_area
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.entity_area
              }
            />

            <FormField
              label="District"
              name="entity_district"
              value={
                formData.entity_district
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.entity_district
              }
            />

            <FormField
              label="State"
              name="entity_state"
              value={
                formData.entity_state
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.entity_state
              }
            />

            <FormField
              label="Pincode"
              name="entity_pincode"
              value={
                formData.entity_pincode
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.entity_pincode
              }
              inputMode="numeric"
            />
          </FormSection>

          {/* =====================
              PROFESSIONAL
          ===================== */}

          <FormSection
            icon="fas fa-briefcase"
            title="Professional Information"
            description="Update your occupation and professional details."
          >
            <FormField
              label="Occupation"
              name="occupation"
              value={
                formData.occupation
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.occupation
              }
            />

            <FormField
              label="Profession"
              name="profession"
              value={
                formData.profession
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.profession
              }
            />

            <FormField
              label="Student ID"
              name="student_id"
              value={
                formData.student_id
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.student_id
              }
            />

            <FormTextarea
              label="Skills"
              name="skills"
              value={
                formData.skills
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.skills
              }
              placeholder="Example: React, Node.js, Communication, Accounting"
              rows={3}
              maxLength={1000}
            />
          </FormSection>

          {/* =====================
              SCHOOL
          ===================== */}

          <FormSection
            icon="fas fa-school"
            title="School Information"
            description="Update school education details when applicable."
          >
            <FormField
              label="School Name"
              name="school_name"
              value={
                formData.school_name
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.school_name
              }
            />

            <FormField
              label="Class"
              name="school_class"
              type="select"
              options={
                CLASS_OPTIONS
              }
              value={
                formData.school_class
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.school_class
              }
            />

            <FormField
              label="Board"
              name="board"
              type="select"
              options={
                BOARD_OPTIONS
              }
              value={
                formData.board
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.board
              }
            />

            <FormField
              label="School City"
              name="school_city"
              value={
                formData.school_city
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.school_city
              }
            />
          </FormSection>

          {/* =====================
              UG
          ===================== */}

          <FormSection
            icon="fas fa-graduation-cap"
            title="Undergraduate Information"
            description="Update your undergraduate education details."
          >
            <FormField
              label="College"
              name="ug_college"
              value={
                formData.ug_college
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.ug_college
              }
            />

            <FormField
              label="Degree"
              name="ug_degree"
              value={
                formData.ug_degree
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.ug_degree
              }
            />

            <FormField
              label="Department"
              name="ug_department"
              value={
                formData.ug_department
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.ug_department
              }
            />

            <FormField
              label="Year"
              name="ug_year"
              value={
                formData.ug_year
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.ug_year
              }
              placeholder="Example: 2026"
            />
          </FormSection>

          {/* =====================
              PG
          ===================== */}

          <FormSection
            icon="fas fa-user-graduate"
            title="Postgraduate Information"
            description="Update your postgraduate education details."
          >
            <FormField
              label="College"
              name="pg_college"
              value={
                formData.pg_college
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.pg_college
              }
            />

            <FormField
              label="Degree"
              name="pg_degree"
              value={
                formData.pg_degree
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.pg_degree
              }
            />

            <FormField
              label="Specialization"
              name="pg_specialization"
              value={
                formData.pg_specialization
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.pg_specialization
              }
            />
          </FormSection>

          {/* =====================
              BIO AND SOCIAL
          ===================== */}

          <FormSection
            icon="fas fa-share-nodes"
            title="Bio and Social Links"
            description="Add a short introduction and your professional social profiles."
          >
            <FormTextarea
              label="Professional Bio"
              name="bio"
              value={
                formData.bio
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.bio
              }
              placeholder="Write a short professional introduction"
              rows={5}
              maxLength={2000}
            />

            <FormField
              label="General Social Link"
              name="social_link"
              type="url"
              value={
                formData.social_link
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.social_link
              }
              placeholder="https://example.com"
            />

            <FormField
              label="LinkedIn"
              name="social_linkedin"
              type="url"
              value={
                formData.social_linkedin
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.social_linkedin
              }
              placeholder="https://linkedin.com/in/..."
            />

            <FormField
              label="Instagram"
              name="social_instagram"
              type="url"
              value={
                formData.social_instagram
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.social_instagram
              }
              placeholder="https://instagram.com/..."
            />

            <FormField
              label="Facebook"
              name="social_facebook"
              type="url"
              value={
                formData.social_facebook
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.social_facebook
              }
              placeholder="https://facebook.com/..."
            />

            <FormField
              label="Twitter / X"
              name="social_twitter"
              type="url"
              value={
                formData.social_twitter
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.social_twitter
              }
              placeholder="https://x.com/..."
            />

            <FormField
              label="YouTube"
              name="social_youtube"
              type="url"
              value={
                formData.social_youtube
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.social_youtube
              }
              placeholder="https://youtube.com/..."
            />
          </FormSection>

          {/* =====================
              NOMINEE
          ===================== */}

          <FormSection
            icon="fas fa-user-shield"
            title="Nominee Information"
            description="Update your registered nominee details."
          >
            <FormField
              label="Nominee Name"
              name="nomini_name"
              value={
                formData.nomini_name
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.nomini_name
              }
            />

            <FormField
              label="Relationship"
              name="nomini_relationship"
              value={
                formData.nomini_relationship
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.nomini_relationship
              }
            />
          </FormSection>

          {/* =====================
              EMERGENCY CONTACT
          ===================== */}

          <FormSection
            icon="fas fa-phone-volume"
            title="Emergency Contact"
            description="Update your emergency contact information."
          >
            <FormField
              label="Emergency Contact Name"
              name="emergency_contact_name"
              value={
                formData.emergency_contact_name
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.emergency_contact_name
              }
              placeholder="Full name of emergency contact"
            />

            <FormField
              label="Emergency Contact Number"
              name="emergency_contact_number"
              type="tel"
              value={
                formData.emergency_contact_number
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.emergency_contact_number
              }
              placeholder="10-digit mobile number"
            />

            <FormField
              label="Relationship"
              name="emergency_relationship"
              value={
                formData.emergency_relationship
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.emergency_relationship
              }
              placeholder="Select or enter relationship"
              options={[
                "Father",
                "Mother",
                "Spouse",
                "Brother",
                "Sister",
                "Son",
                "Daughter",
                "Friend",
                "Other",
              ]}
            />
          </FormSection>

          {/* =====================
              BANK DETAILS
          ===================== */}

          <FormSection
            icon="fas fa-building-columns"
            title="Financial & Bank Details"
            description="Update your bank branch and payout details."
          >
            <FormField
              label="Bank Name"
              name="bank_name"
              value={formData.bank_name || ""}
              onChange={handleChange}
              error={fieldErrors.bank_name}
            />

            <FormField
              label="Account Number"
              name="account_number"
              value={formData.account_number || formData.bank_account_number || ""}
              onChange={handleChange}
              error={fieldErrors.account_number}
            />

            <FormField
              label="IFSC Code"
              name="ifsc_code"
              value={formData.ifsc_code || formData.ifsc || ""}
              onChange={handleChange}
              error={fieldErrors.ifsc_code}
            />

            <FormField
              label="Bank Branch"
              name="branch"
              value={formData.branch || formData.bank_branch || formData.bank_branch_name || ""}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  branch: val,
                  bank_branch: val,
                  bank_branch_name: val,
                }));
              }}
              error={fieldErrors.branch}
              placeholder="Enter bank branch name"
            />
          </FormSection>

          {/* =====================
              FORM ACTIONS
          ===================== */}

          <div className="inmba-edit-form-actions">
            <button
              type="button"
              className="inmba-edit-secondary-button"
              onClick={
                handleReset
              }
              disabled={
                saving ||
                !hasChanges
              }
            >
              <i
                className="fas fa-rotate-left"
                aria-hidden="true"
              ></i>

              Reset Changes
            </button>

            <Link
              to="/profile"
              className="inmba-edit-cancel-button"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inmba-edit-primary-button"
              disabled={
                saving ||
                !hasChanges
              }
              aria-busy={
                saving
              }
            >
              {saving ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    aria-hidden="true"
                  ></span>

                  Saving...
                </>
              ) : (
                <>
                  <i
                    className="fas fa-floppy-disk"
                    aria-hidden="true"
                  ></i>

                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}