import React, {
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  registerMember,
  validateRegistrationAadhaar,
  validateRegistrationEmail,
  validateRegistrationPhone,
  validateRegistrationPincode,
} from "../../../services/registration.service";

import {
  getApiErrorMessage,
  getFieldErrors,
} from "../../../utils/apiError";

import "./OrganizationMemberRegistration.css";

/* ========================================
   MEMBERSHIP OPTIONS

   Honor Member is not shown because the
   backend blocks public Honor registration.

   Student Member uses the separate
   /student registration flow.
======================================== */

const MEMBERSHIP_OPTIONS = [
  {
    value: "Commercial Member",
    label: "Commercial Member",
    description:
      "For business and commercial representatives.",
  },
  {
    value: "Professional Member",
    label: "Professional Member",
    description:
      "For professional and institutional representatives.",
  },
  {
    value: "Civilian Member",
    label: "Civilian Member",
    description:
      "For authorized individual representatives.",
  },
  {
    value: "Special Member",
    label: "Special Member",
    description:
      "For applicants under the special membership category.",
  },
];

const GENDER_OPTIONS = [
  {
    value: "Male",
    label: "Male",
  },
  {
    value: "Female",
    label: "Female",
  },
  {
    value: "Special Gender",
    label: "Special Gender",
  },
];

const MARITAL_STATUS_OPTIONS = [
  {
    value: "Unmarried",
    label: "Unmarried",
  },
  {
    value: "Married",
    label: "Married",
  },
  {
    value: "Other",
    label: "Other",
  },
];

const OCCUPATION_OPTIONS = [
  {
    value: "student",
    label: "Student",
  },
  {
    value: "employee",
    label: "Private Employee",
  },
  {
    value: "government-employee",
    label: "Government Employee",
  },
  {
    value: "self-employed",
    label: "Self Employed",
  },
  {
    value: "business",
    label: "Business",
  },
  {
    value: "unemployed",
    label: "Unemployed",
  },
];

const EDUCATION_OPTIONS = [
  {
    value: "10th",
    label: "10th",
  },
  {
    value: "12th",
    label: "12th",
  },
  {
    value: "diploma",
    label: "Diploma",
  },
  {
    value: "ug",
    label: "UG / Bachelor Degree",
  },
  {
    value: "pg",
    label: "PG / Master Degree",
  },
  {
    value: "phd",
    label: "PhD",
  },
];

/* ========================================
   INITIAL FORM

   Exact backend registration fields.
======================================== */

const INITIAL_FORM_DATA = {
  first_name: "",
  last_name: "",
  father_name: "",
  dob: "",

  email: "",
  phone: "",
  pincode: "",

  gender: "",
  marital_status: "",
  nationality: "Indian",

  occupation: "business",
  education: "",

  membership_type:
    "Commercial Member",

  referral: "",
  aadhar: "",

  password: "",
  confirm_password: "",

  declaration: false,
};

/* ========================================
   HELPERS
======================================== */

const asObject = (
  value
) => {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
};

const toText = (
  value,
  fallback = ""
) => {
  const normalizedValue =
    String(value ?? "").trim();

  return normalizedValue || fallback;
};

const getErrorText = (
  value
) => {
  if (Array.isArray(value)) {
    return toText(value[0]);
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return toText(
      value.message ??
        value.msg ??
        value.error
    );
  }

  return toText(value);
};

/* ========================================
   INTERNAL ROUTE NORMALIZER
======================================== */

const getInternalRoute = (
  value
) => {
  const route =
    toText(value);

  if (!route) {
    return "";
  }

  if (route.startsWith("/")) {
    return route;
  }

  try {
    const parsedUrl =
      new URL(route);

    return `${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return "";
  }
};

/* ========================================
   ORGANIZATION MEMBER PAGE
======================================== */

export default function OrganizationMemberRegistration() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] =
    useSearchParams();

  const referralFromUrl =
    useMemo(
      () =>
        toText(
          searchParams.get("ref")
        ),
      [
        searchParams,
      ]
    );

  const [
    formData,
    setFormData,
  ] =
    useState({
      ...INITIAL_FORM_DATA,

      referral:
        referralFromUrl,
    });

  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState({});

  const [
    formError,
    setFormError,
  ] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] =
    useState(false);

  /* ========================================
     INPUT CHANGE
  ======================================== */

  const handleInputChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } =
      event.target;

    let nextValue =
      type === "checkbox"
        ? checked
        : value;

    if (name === "phone") {
      nextValue =
        value
          .replace(/\D/g, "")
          .slice(0, 10);
    }

    if (name === "pincode") {
      nextValue =
        value
          .replace(/\D/g, "")
          .slice(0, 6);
    }

    if (name === "aadhar") {
      nextValue =
        value
          .replace(/\D/g, "")
          .slice(0, 12);
    }

    if (name === "referral") {
      nextValue =
        value
          .replace(/\s/g, "")
          .slice(0, 50);
    }

    setFormData(
      (
        previousData
      ) => ({
        ...previousData,

        [name]:
          nextValue,
      })
    );

    setFieldErrors(
      (
        previousErrors
      ) => ({
        ...previousErrors,

        [name]: "",

        ...(name === "password"
          ? {
              confirm_password:
                "",
            }
          : {}),
      })
    );

    setFormError("");
  };

  /* ========================================
     VALIDATE FORM
  ======================================== */

  const validateForm = () => {
    const errors = {};

    if (
      !toText(
        formData.first_name
      )
    ) {
      errors.first_name =
        "First name is required.";
    }

    if (
      !toText(
        formData.last_name
      )
    ) {
      errors.last_name =
        "Last name is required.";
    }

    if (
      !toText(
        formData.father_name
      )
    ) {
      errors.father_name =
        "Father or guardian name is required.";
    }

    if (!formData.dob) {
      errors.dob =
        "Date of birth is required.";
    } else {
      const selectedDate =
        new Date(
          `${formData.dob}T00:00:00`
        );

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      if (
        Number.isNaN(
          selectedDate.getTime()
        ) ||
        selectedDate >= today
      ) {
        errors.dob =
          "Enter a valid date of birth.";
      }
    }

    const emailValidation =
      validateRegistrationEmail(
        formData.email
      );

    if (!emailValidation.valid) {
      errors.email =
        emailValidation.error;
    }

    const phoneValidation =
      validateRegistrationPhone(
        formData.phone
      );

    if (!phoneValidation.valid) {
      errors.phone =
        phoneValidation.error;
    }

    const pincodeValidation =
      validateRegistrationPincode(
        formData.pincode
      );

    if (!pincodeValidation.valid) {
      errors.pincode =
        pincodeValidation.error;
    }

    if (!formData.gender) {
      errors.gender =
        "Gender is required.";
    }

    if (
      !formData.marital_status
    ) {
      errors.marital_status =
        "Marital status is required.";
    }

    if (
      !toText(
        formData.nationality
      )
    ) {
      errors.nationality =
        "Nationality is required.";
    }

    if (
      !formData.occupation
    ) {
      errors.occupation =
        "Occupation is required.";
    }

    if (!formData.education) {
      errors.education =
        "Educational qualification is required.";
    }

    if (
      !formData.membership_type
    ) {
      errors.membership_type =
        "Membership category is required.";
    }

    const aadhaarValidation =
      validateRegistrationAadhaar(
        formData.aadhar
      );

    if (!aadhaarValidation.valid) {
      errors.aadhar =
        aadhaarValidation.error;
    }

    if (!formData.password) {
      errors.password =
        "Password is required.";
    } else if (
      formData.password.length < 8
    ) {
      errors.password =
        "Password must contain at least 8 characters.";
    }

    if (
      !formData.confirm_password
    ) {
      errors.confirm_password =
        "Confirm password is required.";
    } else if (
      formData.password !==
      formData.confirm_password
    ) {
      errors.confirm_password =
        "Passwords do not match.";
    }

    if (
      !formData.declaration
    ) {
      errors.declaration =
        "Please accept the membership declaration.";
    }

    setFieldErrors(errors);

    if (
      Object.keys(errors).length >
      0
    ) {
      setFormError(
        "Please complete all required membership details."
      );

      return false;
    }

    return true;
  };

  /* ========================================
     SUBMIT REGISTRATION

     Exact API:
     POST /api/register
  ======================================== */

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      if (submitting) {
        return;
      }

      setFormError("");

      if (!validateForm()) {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      try {
        setSubmitting(true);
        setFieldErrors({});

        const result =
          await registerMember({
            first_name:
              formData.first_name,

            last_name:
              formData.last_name,

            father_name:
              formData.father_name,

            dob:
              formData.dob,

            email:
              formData.email,

            phone:
              formData.phone,

            pincode:
              formData.pincode,

            gender:
              formData.gender,

            marital_status:
              formData.marital_status,

            nationality:
              formData.nationality,

            occupation:
              formData.occupation,

            education:
              formData.education,

            membership_type:
              formData.membership_type,

            referral:
              formData.referral,

            aadhar:
              formData.aadhar,

            password:
              formData.password,

            confirm_password:
              formData.confirm_password,
          });

        toast.success(
          result.message ||
            "Membership registration submitted successfully."
        );

        const nextRoute =
          getInternalRoute(
            result.nextRoute
          ) || "/success";

        navigate(
          nextRoute,
          {
            state: {
              registration:
                result,
            },
          }
        );
      } catch (
        requestError
      ) {
        const serviceErrors =
          asObject(
            requestError.fieldErrors
          );

        const utilityErrors =
          asObject(
            getFieldErrors(
              requestError
            )
          );

        setFieldErrors({
          ...utilityErrors,
          ...serviceErrors,
        });

        setFormError(
          getApiErrorMessage(
            requestError,
            "Unable to complete membership registration."
          )
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <main className="inmba-org-member-page">
      <div className="inmba-org-member-container">
        {/* =================================
            TOP BAR
        ================================= */}

        <header className="inmba-org-member-topbar">
          <Link
            to="/"
            className="inmba-org-member-brand"
          >
            <span>
              I
            </span>

            <div>
              <strong>
                INMBA
              </strong>

              <small>
                Organization Membership
              </small>
            </div>
          </Link>

          <div>
            <Link to="/membership-type">
              Membership Types
            </Link>

            <Link to="/login">
              Member Login
            </Link>
          </div>
        </header>

        {/* =================================
            HERO
        ================================= */}

        <section className="inmba-org-member-hero">
          <div>
            <p>
              Organization Membership
            </p>

            <h1>
              Membership KYC Form
            </h1>

            <span>
              Register the authorized representative connected with
              the organization and select the relevant INMBA
              membership category.
            </span>

            <div className="inmba-org-member-hero-features">
              <article>
                <i
                  className="fas fa-building"
                  aria-hidden="true"
                ></i>

                <span>
                  Organization Network
                </span>
              </article>

              <article>
                <i
                  className="fas fa-user-shield"
                  aria-hidden="true"
                ></i>

                <span>
                  Authorized Representative
                </span>
              </article>

              <article>
                <i
                  className="fas fa-shield-halved"
                  aria-hidden="true"
                ></i>

                <span>
                  Secure Registration
                </span>
              </article>
            </div>
          </div>

          <aside>
            <span>
              <i
                className="fas fa-building-user"
                aria-hidden="true"
              ></i>
            </span>

            <p>
              Default Category
            </p>

            <strong>
              {formData.membership_type}
            </strong>

            <small>
              Category can be changed below
            </small>
          </aside>
        </section>

        {/* =================================
            API INFORMATION
        ================================= */}

        <section className="inmba-org-member-api">
          <span>
            <i
              className="fas fa-code"
              aria-hidden="true"
            ></i>
          </span>

          <div>
            <strong>
              Registration API Connected
            </strong>

            <p>
              This page uses the existing verified{" "}
              <code>
                POST /api/register
              </code>{" "}
              endpoint. No separate or fake organization endpoint is
              used.
            </p>
          </div>
        </section>

        {/* =================================
            REFERRAL
        ================================= */}

        {referralFromUrl && (
          <section className="inmba-org-member-referral">
            <span>
              <i
                className="fas fa-user-plus"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <strong>
                Referral Applied
              </strong>

              <p>
                The referral ID will be included in the registration
                request.
              </p>
            </div>

            <code>
              {referralFromUrl}
            </code>
          </section>
        )}

        {/* =================================
            FORM ERROR
        ================================= */}

        {formError && (
          <div
            className="inmba-org-member-alert"
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
          className="inmba-org-member-form"
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          {/* =================================
              PERSONAL DETAILS
          ================================= */}

          <OrganizationSection
            icon="fas fa-user"
            title="Authorized Representative"
            description="Enter the personal details of the representative applying for membership."
          >
            <div className="inmba-org-member-grid">
              <OrganizationField
                id="organization-first-name"
                name="first_name"
                label="First Name"
                value={
                  formData.first_name
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.first_name
                  )
                }
                placeholder="Enter first name"
                autoComplete="given-name"
                required
                disabled={
                  submitting
                }
              />

              <OrganizationField
                id="organization-last-name"
                name="last_name"
                label="Last Name"
                value={
                  formData.last_name
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.last_name
                  )
                }
                placeholder="Enter last name"
                autoComplete="family-name"
                required
                disabled={
                  submitting
                }
              />

              <OrganizationField
                id="organization-father-name"
                name="father_name"
                label="Father / Guardian Name"
                value={
                  formData.father_name
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.father_name
                  )
                }
                placeholder="Enter father or guardian name"
                required
                disabled={
                  submitting
                }
              />

              <OrganizationField
                id="organization-dob"
                name="dob"
                label="Date of Birth"
                type="date"
                value={
                  formData.dob
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.dob
                  )
                }
                max={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                required
                disabled={
                  submitting
                }
              />

              <OrganizationSelect
                id="organization-gender"
                name="gender"
                label="Gender"
                value={
                  formData.gender
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.gender
                  )
                }
                options={
                  GENDER_OPTIONS
                }
                placeholder="Select gender"
                required
                disabled={
                  submitting
                }
              />

              <OrganizationSelect
                id="organization-marital-status"
                name="marital_status"
                label="Marital Status"
                value={
                  formData.marital_status
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.marital_status
                  )
                }
                options={
                  MARITAL_STATUS_OPTIONS
                }
                placeholder="Select marital status"
                required
                disabled={
                  submitting
                }
              />

              <OrganizationField
                id="organization-nationality"
                name="nationality"
                label="Nationality"
                value={
                  formData.nationality
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.nationality
                  )
                }
                placeholder="Enter nationality"
                required
                disabled={
                  submitting
                }
              />

              <OrganizationField
                id="organization-aadhaar"
                name="aadhar"
                label="Aadhaar Number"
                value={
                  formData.aadhar
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.aadhar
                  )
                }
                placeholder="12-digit Aadhaar number"
                inputMode="numeric"
                maxLength={12}
                required
                disabled={
                  submitting
                }
              />
            </div>
          </OrganizationSection>

          {/* =================================
              CONTACT
          ================================= */}

          <OrganizationSection
            icon="fas fa-address-book"
            title="Contact & Location"
            description="Provide the registered communication and location information."
          >
            <div className="inmba-org-member-grid">
              <OrganizationField
                id="organization-email"
                name="email"
                label="Email Address"
                type="email"
                value={
                  formData.email
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.email
                  )
                }
                placeholder="representative@email.com"
                autoComplete="email"
                required
                disabled={
                  submitting
                }
              />

              <OrganizationField
                id="organization-phone"
                name="phone"
                label="Mobile Number"
                value={
                  formData.phone
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.phone
                  )
                }
                placeholder="10-digit mobile number"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                required
                disabled={
                  submitting
                }
              />

              <OrganizationField
                id="organization-pincode"
                name="pincode"
                label="Pincode"
                value={
                  formData.pincode
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.pincode
                  )
                }
                placeholder="6-digit pincode"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                required
                disabled={
                  submitting
                }
              />

              <OrganizationField
                id="organization-referral"
                name="referral"
                label="Referral ID"
                value={
                  formData.referral
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.referral
                  )
                }
                placeholder="Optional referral ID"
                optional
                disabled={
                  submitting
                }
              />
            </div>
          </OrganizationSection>

          {/* =================================
              PROFESSIONAL & MEMBERSHIP
          ================================= */}

          <OrganizationSection
            icon="fas fa-building"
            title="Qualification & Membership"
            description="Select the professional and membership information stored by the registration API."
          >
            <div className="inmba-org-member-grid">
              <OrganizationSelect
                id="organization-occupation"
                name="occupation"
                label="Occupation"
                value={
                  formData.occupation
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.occupation
                  )
                }
                options={
                  OCCUPATION_OPTIONS
                }
                placeholder="Select occupation"
                required
                disabled={
                  submitting
                }
              />

              <OrganizationSelect
                id="organization-education"
                name="education"
                label="Educational Qualification"
                value={
                  formData.education
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.education
                  )
                }
                options={
                  EDUCATION_OPTIONS
                }
                placeholder="Select qualification"
                required
                disabled={
                  submitting
                }
              />
            </div>

            <div className="inmba-org-member-category-section">
              <label>
                Membership Category
                <span>
                  *
                </span>
              </label>

              <div className="inmba-org-member-category-grid">
                {MEMBERSHIP_OPTIONS.map(
                  (
                    option
                  ) => (
                    <label
                      key={
                        option.value
                      }
                      className={
                        formData.membership_type ===
                        option.value
                          ? "inmba-org-member-category-active"
                          : ""
                      }
                    >
                      <input
                        type="radio"
                        name="membership_type"
                        value={
                          option.value
                        }
                        checked={
                          formData.membership_type ===
                          option.value
                        }
                        onChange={
                          handleInputChange
                        }
                        disabled={
                          submitting
                        }
                      />

                      <span>
                        <i
                          className="fas fa-id-card"
                          aria-hidden="true"
                        ></i>
                      </span>

                      <strong>
                        {option.label}
                      </strong>

                      <small>
                        {option.description}
                      </small>
                    </label>
                  )
                )}
              </div>

              {getErrorText(
                fieldErrors.membership_type
              ) && (
                <small className="inmba-org-member-field-error">
                  {getErrorText(
                    fieldErrors.membership_type
                  )}
                </small>
              )}
            </div>
          </OrganizationSection>

          {/* =================================
              SECURITY
          ================================= */}

          <OrganizationSection
            icon="fas fa-shield-halved"
            title="Account Security"
            description="Create the password used with the generated INMBA login ID."
          >
            <div className="inmba-org-member-grid">
              <OrganizationPassword
                id="organization-password"
                name="password"
                label="Password"
                value={
                  formData.password
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.password
                  )
                }
                show={
                  showPassword
                }
                onToggle={() =>
                  setShowPassword(
                    (
                      previousValue
                    ) =>
                      !previousValue
                  )
                }
                placeholder="Minimum 8 characters"
                disabled={
                  submitting
                }
              />

              <OrganizationPassword
                id="organization-confirm-password"
                name="confirm_password"
                label="Confirm Password"
                value={
                  formData.confirm_password
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.confirm_password
                  )
                }
                show={
                  showConfirmPassword
                }
                onToggle={() =>
                  setShowConfirmPassword(
                    (
                      previousValue
                    ) =>
                      !previousValue
                  )
                }
                placeholder="Re-enter password"
                disabled={
                  submitting
                }
              />
            </div>

            <div
              className={`inmba-org-member-declaration ${
                getErrorText(
                  fieldErrors.declaration
                )
                  ? "inmba-org-member-declaration-error"
                  : ""
              }`}
            >
              <label htmlFor="organization-declaration">
                <input
                  id="organization-declaration"
                  type="checkbox"
                  name="declaration"
                  checked={
                    formData.declaration
                  }
                  onChange={
                    handleInputChange
                  }
                  disabled={
                    submitting
                  }
                />

                <span>
                  <i
                    className="fas fa-check"
                    aria-hidden="true"
                  ></i>
                </span>

                <p>
                  I confirm that all submitted details are accurate,
                  valid and authorized for this membership
                  registration.
                </p>
              </label>

              {getErrorText(
                fieldErrors.declaration
              ) && (
                <small>
                  {getErrorText(
                    fieldErrors.declaration
                  )}
                </small>
              )}
            </div>
          </OrganizationSection>

          {/* =================================
              ACTIONS
          ================================= */}

          <section className="inmba-org-member-actions">
            <Link to="/membership-type">
              <i
                className="fas fa-arrow-left"
                aria-hidden="true"
              ></i>

              Membership Types
            </Link>

            <button
              type="submit"
              disabled={
                submitting
              }
            >
              {submitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    aria-hidden="true"
                  ></span>

                  Creating Membership...
                </>
              ) : (
                <>
                  Submit Registration

                  <i
                    className="fas fa-arrow-right"
                    aria-hidden="true"
                  ></i>
                </>
              )}
            </button>
          </section>
        </form>
      </div>
    </main>
  );
}

/* ========================================
   SECTION COMPONENT
======================================== */

function OrganizationSection({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section className="inmba-org-member-section">
      <header>
        <span>
          <i
            className={icon}
            aria-hidden="true"
          ></i>
        </span>

        <div>
          <h2>
            {title}
          </h2>

          <p>
            {description}
          </p>
        </div>
      </header>

      {children}
    </section>
  );
}

/* ========================================
   FIELD COMPONENT
======================================== */

function OrganizationField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  error,
  required = false,
  optional = false,
  ...inputProperties
}) {
  return (
    <div className="inmba-org-member-field">
      <label htmlFor={id}>
        {label}

        {required && (
          <span>
            *
          </span>
        )}

        {optional && (
          <small>
            Optional
          </small>
        )}
      </label>

      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={
          error
            ? "inmba-org-member-input-error"
            : ""
        }
        {...inputProperties}
      />

      {error && (
        <small className="inmba-org-member-field-error">
          {error}
        </small>
      )}
    </div>
  );
}

/* ========================================
   SELECT COMPONENT
======================================== */

function OrganizationSelect({
  id,
  name,
  label,
  value,
  onChange,
  error,
  options,
  placeholder,
  required = false,
  disabled = false,
}) {
  return (
    <div className="inmba-org-member-field">
      <label htmlFor={id}>
        {label}

        {required && (
          <span>
            *
          </span>
        )}
      </label>

      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={
          error
            ? "inmba-org-member-input-error"
            : ""
        }
      >
        <option value="">
          {placeholder}
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
              {option.label}
            </option>
          )
        )}
      </select>

      {error && (
        <small className="inmba-org-member-field-error">
          {error}
        </small>
      )}
    </div>
  );
}

/* ========================================
   PASSWORD COMPONENT
======================================== */

function OrganizationPassword({
  id,
  name,
  label,
  value,
  onChange,
  error,
  show,
  onToggle,
  placeholder,
  disabled,
}) {
  return (
    <div className="inmba-org-member-field">
      <label htmlFor={id}>
        {label}

        <span>
          *
        </span>
      </label>

      <div className="inmba-org-member-password">
        <input
          id={id}
          type={
            show
              ? "text"
              : "password"
          }
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="new-password"
          disabled={disabled}
          className={
            error
              ? "inmba-org-member-input-error"
              : ""
          }
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={
            show
              ? "Hide password"
              : "Show password"
          }
        >
          <i
            className={
              show
                ? "fas fa-eye-slash"
                : "fas fa-eye"
            }
            aria-hidden="true"
          ></i>
        </button>
      </div>

      {error && (
        <small className="inmba-org-member-field-error">
          {error}
        </small>
      )}
    </div>
  );
}