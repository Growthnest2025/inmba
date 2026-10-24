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
  "marital_status",
  "nationality",
  "email",
  "phone",
  "whatsapp_number",
  "contact_number",

  "address",
  "city",
  "district",
  "state",
  "pincode",
  "country",

  "entity_house_no",
  "entity_street",
  "entity_area",
  "entity_city",
  "entity_district",
  "entity_state",
  "entity_pincode",

  "occupation",
  "education",
  "educational_qualification",
  "profession",

  "education_level",
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
  "pg_semester",

  "skills",
  "student_id",

  "bio",
  "social_link",
  "social_instagram",
  "social_linkedin",
  "social_twitter",
  "social_facebook",
  "social_youtube",

  "nomini_name",
  "nomini_dob",
  "nomini_relationship",
  "nomini_aadhar",
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

  const normalizedValue =
    String(
      value
    ).trim();

  const dateOnlyMatch =
    normalizedValue.match(
      /^\d{4}-\d{2}-\d{2}/
    );

  if (
    dateOnlyMatch
  ) {
    return dateOnlyMatch[0];
  }

  const date =
    new Date(
      normalizedValue
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .slice(
      0,
      10
    );
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

  return EDITABLE_FIELDS.reduce(
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

const EDUCATION_LEVEL_OPTIONS = [
  {
    value:
      "School",
    label:
      "School",
  },
  {
    value:
      "UG",
    label:
      "Undergraduate",
  },
  {
    value:
      "PG",
    label:
      "Postgraduate",
  },
  {
    value:
      "Diploma",
    label:
      "Diploma",
  },
  {
    value:
      "Doctorate",
    label:
      "Doctorate",
  },
  {
    value:
      "Other",
    label:
      "Other",
  },
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
        return `${formData.first_name} ${formData.last_name}`
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

    if (
      formData
        .nomini_dob
    ) {
      const nomineeDob =
        new Date(
          formData
            .nomini_dob
        );

      const today =
        new Date();

      if (
        nomineeDob >
        today
      ) {
        errors.nomini_dob =
          "Nominee date of birth cannot be in the future.";
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
      return EDITABLE_FIELDS.reduce(
        (
          result,
          field
        ) => {
          const currentValue =
            toInputValue(
              formData[field]
            ).trim();

          const previousValue =
            toInputValue(
              originalData[
                field
              ]
            ).trim();

          if (
            currentValue !==
            previousValue
          ) {
            result[field] =
              currentValue;
          }

          return result;
        },
        {}
      );
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
              label="City"
              name="city"
              value={
                formData.city
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.city
              }
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
              label="City"
              name="entity_city"
              value={
                formData.entity_city
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.entity_city
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
              label="Education"
              name="education"
              value={
                formData.education
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.education
              }
            />

            <FormField
              label="Educational Qualification"
              name="educational_qualification"
              value={
                formData.educational_qualification
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.educational_qualification
              }
            />

            <FormField
              label="Education Level"
              name="education_level"
              type="select"
              options={
                EDUCATION_LEVEL_OPTIONS
              }
              value={
                formData.education_level
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.education_level
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

            <FormField
              label="Semester"
              name="pg_semester"
              value={
                formData.pg_semester
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.pg_semester
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
              label="Nominee Date of Birth"
              name="nomini_dob"
              type="date"
              value={
                formData.nomini_dob
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.nomini_dob
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

            <FormField
              label="Nominee Aadhaar"
              name="nomini_aadhar"
              value={
                formData.nomini_aadhar
              }
              onChange={
                handleChange
              }
              error={
                fieldErrors.nomini_aadhar
              }
              inputMode="numeric"
              maxLength={16}
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