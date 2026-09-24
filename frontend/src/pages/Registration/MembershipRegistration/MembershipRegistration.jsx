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
  validateRegistrationEmail,
  validateRegistrationPhone,
} from "../../../services/registration.service";

import {
  getApiErrorMessage,
  getFieldErrors,
} from "../../../utils/apiError";

import inmbaLogo from "../../../assets/images/inmba_logo.jpg";

import "./MembershipRegistration.css";

/* ========================================
   MEMBERSHIP TYPES
======================================== */

const DEFAULT_MEMBERSHIP_TYPE =
  "Civilian Member";

const ALLOWED_MEMBERSHIP_TYPES =
  new Set([
    "Civilian Member",
    "Commercial Member",
  ]);

/* ========================================
   INITIAL FORM
======================================== */

const INITIAL_FORM_DATA = {
  full_name: "",
  first_name: "",
  last_name: "",
  father_name: "",
  dob: "",
  email: "",
  phone: "",
  gender: "",
  marital_status: "",
  nationality: "Indian",
  occupation: "",
  education: "",

  membership_type:
    DEFAULT_MEMBERSHIP_TYPE,

  referral: "",
  password: "",
  confirm_password: "",
  profile_pic: null,
  termsAccepted: false,
};

/* ========================================
   OPTIONS
======================================== */

const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Other",
];

const MARITAL_OPTIONS = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
];

const EDUCATION_OPTIONS = [
  "10th",
  "12th",
  "Diploma",
  "Graduate",
  "Post Graduate",
  "Doctorate",
  "Other",
];

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
    String(
      value ?? ""
    ).trim();

  return (
    normalizedValue ||
    fallback
  );
};

const getErrorText = (
  value
) => {
  if (
    Array.isArray(value)
  ) {
    return toText(
      value[0]
    );
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
   INTERNAL ROUTE
======================================== */

const getInternalRoute = (
  value
) => {
  const route =
    toText(value);

  if (!route) {
    return "";
  }

  if (
    route.startsWith("/")
  ) {
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
   MEMBERSHIP REGISTRATION
======================================== */

export default function MembershipRegistration({
  membershipType =
    DEFAULT_MEMBERSHIP_TYPE,
}) {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] =
    useSearchParams();

  /* ========================================
     ACTIVE MEMBERSHIP TYPE
  ======================================== */

  const activeMembershipType =
    useMemo(
      () => {
        const normalizedType =
          toText(
            membershipType,
            DEFAULT_MEMBERSHIP_TYPE
          );

        return ALLOWED_MEMBERSHIP_TYPES.has(
          normalizedType
        )
          ? normalizedType
          : DEFAULT_MEMBERSHIP_TYPE;
      },
      [
        membershipType,
      ]
    );

  const isCommercialMembership =
    activeMembershipType ===
    "Commercial Member";

  /* ========================================
     REFERRAL FROM URL
  ======================================== */

  const referralFromUrl =
    useMemo(
      () =>
        toText(
          searchParams.get(
            "ref"
          )
        ),
      [
        searchParams,
      ]
    );

  /* ========================================
     FORM STATE
  ======================================== */

  const [
    formData,
    setFormData,
  ] =
    useState({
      ...INITIAL_FORM_DATA,

      membership_type:
        activeMembershipType,

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

  const [
    civilianLanguage,
    setCivilianLanguage,
  ] =
    useState("en");

  const civilianText =
    useMemo(
      () => {
        const tamil =
          civilianLanguage === "ta";

        return {
          eyebrow: tamil
            ? "சிவிலியன் உறுப்பினர் · அடிப்படை திட்டம்"
            : "Civilian Membership · Basic Plan",
          title: tamil
            ? "INMBA சிவிலியன் உறுப்பினர் (அடிப்படை)"
            : "INMBA Civilian Membership (Basic)",
          description: tamil
            ? "உங்கள் அடிப்படை உறுப்பினர் கணக்கை உருவாக்க தேவையான விவரங்களை உள்ளிடுங்கள். மொபைல் OTP சரிபார்ப்பு தேவையில்லை."
            : "Enter the details required to create your basic civilian membership account. Mobile OTP verification is not required.",
          personalTitle: tamil
            ? "தனிப்பட்ட விவரங்கள்"
            : "Personal Information",
          personalDescription: tamil
            ? "உங்கள் முழுப் பெயர் மற்றும் பிறந்த தேதியை உள்ளிடுங்கள்."
            : "Enter your full name and date of birth.",
          fullName: tamil
            ? "முழுப் பெயர்"
            : "Full Name",
          fullNamePlaceholder: tamil
            ? "உங்கள் முழுப் பெயரை உள்ளிடுங்கள்"
            : "Enter your full name",
          dob: tamil
            ? "பிறந்த தேதி"
            : "Date of Birth",
          contactTitle: tamil
            ? "தொடர்பு மற்றும் பரிந்துரை விவரங்கள்"
            : "Contact & Referral Details",
          contactDescription: tamil
            ? "உங்கள் மொபைல் எண்ணை உள்ளிடுங்கள். பிறந்த தேதி, மின்னஞ்சல் மற்றும் பரிந்துரை ID விருப்பத்தேர்வுகள்."
            : "Enter your mobile number. Date of Birth, Email and Referral ID are optional.",
          email: tamil
            ? "மின்னஞ்சல் முகவரி"
            : "Email ID",
          mobile: tamil
            ? "மொபைல் எண்"
            : "Mobile Number",
          mobilePlaceholder: tamil
            ? "10 இலக்க மொபைல் எண்"
            : "10-digit mobile number",
          mobileHelp: tamil
            ? "OTP தேவையில்லை. ஒரே மொபைல் எண்ணில் அதிகபட்சம் 3 சிவிலியன் கணக்குகள் பதிவு செய்யலாம்."
            : "No OTP required. A maximum of 3 Civilian accounts can be registered with the same mobile number.",
          referral: tamil
            ? "பரிந்துரை ID"
            : "Referral ID",
          referralPlaceholder: tamil
            ? "விருப்பத்தேர்வு பரிந்துரை ID"
            : "Optional referral ID",
          optional: tamil
            ? "விருப்பத்தேர்வு"
            : "Optional",
          photoTitle: tamil
            ? "சுயவிவரப் புகைப்படம்"
            : "Profile Photo",
          photoDescription: tamil
            ? "இப்போது புகைப்படம் சேர்க்கலாம் அல்லது தவிர்த்து தொடரலாம்."
            : "Add a profile photo now or skip it and continue.",
          photoHelp: tamil
            ? "JPG, PNG அல்லது WEBP. அதிகபட்சம் 5 MB."
            : "JPG, PNG or WEBP. Maximum 5 MB.",
          securityTitle: tamil
            ? "கணக்கு பாதுகாப்பு"
            : "Account Security",
          securityDescription: tamil
            ? "உங்கள் Login ID உடன் பயன்படுத்த கடவுச்சொல் அல்லது PIN அமைக்கவும்."
            : "Set up the password or PIN used with your generated login ID.",
          password: tamil
            ? "கடவுச்சொல் / PIN"
            : "Password / PIN",
          confirmPassword: tamil
            ? "கடவுச்சொல் / PIN உறுதிப்படுத்தவும்"
            : "Confirm Password / PIN",
          declaration: tamil
            ? "இந்த உறுப்பினர் விண்ணப்பத்தில் நான் வழங்கிய அனைத்து தகவல்களும் உண்மையானவை மற்றும் சரியானவை என்பதை உறுதிப்படுத்துகிறேன்."
            : "I confirm that all information provided in this membership application is true and correct.",
          back: tamil
            ? "உறுப்பினர் வகைகள்"
            : "Membership Types",
          submit: tamil
            ? "பதிவைச் சமர்ப்பிக்கவும்"
            : "Submit Registration",
          submitting: tamil
            ? "உறுப்பினர் கணக்கு உருவாக்கப்படுகிறது..."
            : "Creating Membership...",
        };
      },
      [
        civilianLanguage,
      ]
    );

  /* ========================================
     PAGE CONTENT
  ======================================== */

  const pageContent =
    useMemo(
      () => {
        if (
          isCommercialMembership
        ) {
          return {
            eyebrow:
              "Commercial Membership",

            title:
              "Register Your Commercial Membership",

            description:
              "Complete the registration form to create your commercial membership application and receive your unique login ID.",

            typeIcon:
              "fas fa-store",

            professionTitle:
              "Business & Qualification",

            professionDescription:
              "Add your current educational qualification and commercial occupation.",
          };
        }

        return {
          eyebrow:
            civilianText.eyebrow,

          title:
            civilianText.title,

          description:
            civilianText.description,

          typeIcon:
            "fas fa-user-tie",

          professionTitle:
            "Education & Profession",

          professionDescription:
            "Add your current qualification and occupation.",
        };
      },
      [
        isCommercialMembership,
        civilianText,
      ]
    );

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
      files,
    } =
      event.target;

    let nextValue =
      type === "file"
        ? files?.[0] || null
        : type === "checkbox"
        ? checked
        : value;

    if (
      name === "phone"
    ) {
      nextValue =
        value
          .replace(/\D/g, "")
          .slice(0, 10);
    }

    if (
      name === "referral"
    ) {
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

        ...(name ===
        "password"
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
     FORM VALIDATION
  ======================================== */

  const validateForm = () => {
    const errors = {};

    if (!isCommercialMembership && !toText(formData.full_name)) {
      errors.full_name = "Full name is required.";
    }

    if (isCommercialMembership && !toText(formData.first_name)) {
      errors.first_name = "First name is required.";
    }

    if (isCommercialMembership && !toText(formData.last_name)) {
      errors.last_name = "Last name is required.";
    }

    if (
      isCommercialMembership &&
      !toText(
        formData.father_name
      )
    ) {
      errors.father_name =
        "Father or guardian name is required.";
    }

    /*
      Civilian Basic Registration:
      DOB is optional.

      Commercial Registration:
      DOB remains required.

      If a Civilian user enters DOB, the date is still validated.
    */
    if (
      isCommercialMembership &&
      !formData.dob
    ) {
      errors.dob =
        "Date of birth is required.";
    } else if (
      formData.dob
    ) {
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

    if (
      (isCommercialMembership || formData.email) &&
      !emailValidation.valid
    ) {
      errors.email =
        emailValidation.error;
    }

    const phoneValidation =
      validateRegistrationPhone(
        formData.phone
      );

    if (
      !phoneValidation.valid
    ) {
      errors.phone =
        phoneValidation.error;
    }

    if (isCommercialMembership && !formData.gender) {
      errors.gender =
        "Gender is required.";
    }

    if (
      isCommercialMembership && !formData.marital_status
    ) {
      errors.marital_status =
        "Marital status is required.";
    }

    if (
      isCommercialMembership && !toText(
        formData.nationality
      )
    ) {
      errors.nationality =
        "Nationality is required.";
    }

    if (
      isCommercialMembership && !toText(
        formData.occupation
      )
    ) {
      errors.occupation =
        "Occupation is required.";
    }

    if (
      isCommercialMembership && !formData.education
    ) {
      errors.education =
        "Education is required.";
    }

if (
  !formData.password
) {
  errors.password =
    "Password is required.";
} else if (
  formData.password.length < 5
) {
  errors.password =
    "Password must contain at least 5 characters.";
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
      !formData.termsAccepted
    ) {
      errors.termsAccepted =
        "Please accept the membership declaration.";
    }

    setFieldErrors(errors);

    if (
      Object.keys(errors)
        .length > 0
    ) {
      setFormError(
        "Please complete all required membership details."
      );

      return false;
    }

    return true;
  };

  /* ========================================
     REGISTER MEMBER

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
            full_name:
              formData.full_name,
            first_name:
              isCommercialMembership
                ? formData.first_name
                : formData.full_name,

            last_name:
              isCommercialMembership
                ? formData.last_name
                : "",

            father_name:
              isCommercialMembership
                ? formData.father_name
                : "",

            dob:
              formData.dob,

            email:
              formData.email,

            phone:
              formData.phone,

            gender:
              isCommercialMembership
                ? formData.gender
                : "",

            marital_status:
              isCommercialMembership
                ? formData.marital_status
                : "",

            nationality:
              isCommercialMembership
                ? formData.nationality
                : "",

            occupation:
              isCommercialMembership
                ? formData.occupation
                : "",

            education:
              isCommercialMembership
                ? formData.education
                : "",

            /*
              Exact backend membership
              value maintained here.
            */

            membership_type:
              activeMembershipType,

            referral:
              formData.referral,

            password:
              formData.password,

            confirm_password:
              formData.confirm_password,

            profile_pic:
              formData.profile_pic,
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
        const apiFieldErrors =
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
          ...apiFieldErrors,
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
    <main
      className={`inmba-register-page ${
        isCommercialMembership
          ? ""
          : "inmba-register-page--civilian"
      }`}
    >
      <div className="inmba-register-container">
        <div className="inmba-register-split-layout">
          <aside className="inmba-register-side-panel">
        {/* =================================
            HEADER
        ================================= */}

        <header className="inmba-register-header">
          <Link
            to="/"
            className="inmba-register-brand"
          >
            <img
              className="inmba-register-brand-logo"
              src={inmbaLogo}
              alt="INMBA logo"
            />

            <div>
              <strong>
                INMBA
              </strong>

              <small>
                International Network of
                Management & Business
                Administration
              </small>
            </div>
          </Link>

          <div>
            <span>
              Already registered?
            </span>

            <Link to="/login">
              Member Login
            </Link>
          </div>
        </header>

        {/* =================================
            HERO
        ================================= */}

        <section className="inmba-register-hero">
          <div>
            <p>
              {pageContent.eyebrow}
            </p>

            <h1>
              {pageContent.title}
            </h1>

            <span>
              {
                pageContent.description
              }
            </span>

            {!isCommercialMembership && (
              <div className="inmba-register-benefits">
                <span>
                  <i className="fas fa-mobile-screen-button" aria-hidden="true"></i>
                  {civilianLanguage === "ta" ? "OTP தேவையில்லை" : "No OTP Required"}
                </span>
                <span>
                  <i className="fas fa-users" aria-hidden="true"></i>
                  {civilianLanguage === "ta" ? "ஒரே எண்ணில் 3 கணக்குகள் வரை" : "Up to 3 Accounts per Number"}
                </span>
              </div>
            )}
          </div>

          <div className="inmba-register-type-card">
            <i
              className={
                pageContent.typeIcon
              }
              aria-hidden="true"
            ></i>

            <span>
              Membership Type
            </span>

            <strong>
              {activeMembershipType}
            </strong>

            {!isCommercialMembership && (
              <b>Basic</b>
            )}
          </div>
        </section>
          </aside>

          <section className="inmba-register-content-panel">
            {!isCommercialMembership && (
              <header className="inmba-register-content-heading">
                <span>
                  <i className="fas fa-user" aria-hidden="true"></i>
                </span>

                <div>
                  <h2>
                    {civilianLanguage === "ta"
                      ? "சிவிலியன் அடிப்படை பதிவு"
                      : "Civilian Basic Registration"}
                  </h2>
                  <p>
                    {civilianLanguage === "ta"
                      ? "உங்கள் INMBA Civilian Membership கணக்கை உருவாக்குங்கள்."
                      : "Create your INMBA Civilian Membership account."}
                  </p>
                </div>
              </header>
            )}

        {!isCommercialMembership && (
          <section className="inmba-register-language" aria-label="Form language">
            <div>
              <i className="fas fa-language" aria-hidden="true"></i>
              <span>Form Language / படிவ மொழி</span>
            </div>

            <div className="inmba-register-language-options">
              <button
                type="button"
                className={civilianLanguage === "ta" ? "active" : ""}
                onClick={() => setCivilianLanguage("ta")}
              >
                தமிழ்
              </button>

              <button
                type="button"
                className={civilianLanguage === "en" ? "active" : ""}
                onClick={() => setCivilianLanguage("en")}
              >
                English
              </button>
            </div>
          </section>
        )}

        {/* =================================
            REFERRAL NOTICE
        ================================= */}

        {referralFromUrl && (
          <section className="inmba-register-referral-notice">
            <i
              className="fas fa-user-plus"
              aria-hidden="true"
            ></i>

            <div>
              <strong>
                Referral Applied
              </strong>

              <span>
                Referral ID{" "}
                <b>
                  {referralFromUrl}
                </b>{" "}
                was added from your membership link.
              </span>
            </div>
          </section>
        )}

        {/* =================================
            FORM ERROR
        ================================= */}

        {formError && (
          <div
            className="inmba-register-alert"
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
          className="inmba-register-form"
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          {/* =================================
              PERSONAL
          ================================= */}

          <RegistrationSection
            icon="fas fa-user"
            title={
              isCommercialMembership
                ? "Personal Information"
                : civilianText.personalTitle
            }
            description={
              isCommercialMembership
                ? "Enter your identity and basic personal details."
                : civilianText.personalDescription
            }
          >
            <div className="inmba-register-grid">
              {!isCommercialMembership && (
                <RegistrationField
                  id="register-full-name"
                  name="full_name"
                  label={civilianText.fullName}
                  value={formData.full_name}
                  onChange={handleInputChange}
                  error={getErrorText(fieldErrors.full_name)}
                  placeholder={civilianText.fullNamePlaceholder}
                  autoComplete="name"
                  required
                  disabled={submitting}
                />
              )}

              {isCommercialMembership && (<>
              <RegistrationField
                id="register-first-name"
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

              <RegistrationField
                id="register-last-name"
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

              <RegistrationField
                id="register-father-name"
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
              </>)}

              <RegistrationField
                id="register-dob"
                name="dob"
                label={
                  isCommercialMembership
                    ? "Date of Birth"
                    : civilianText.dob
                }
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
                required={
                  isCommercialMembership
                }
                optional={
                  !isCommercialMembership
                }
                disabled={
                  submitting
                }
              />

              {isCommercialMembership && (<>
              <RegistrationSelect
                id="register-gender"
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

              <RegistrationSelect
                id="register-marital"
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
                  MARITAL_OPTIONS
                }
                placeholder="Select marital status"
                required
                disabled={
                  submitting
                }
              />

              <RegistrationField
                id="register-nationality"
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
              </>)}

            </div>
          </RegistrationSection>

          {/* =================================
              CONTACT
          ================================= */}

          <RegistrationSection
            icon="fas fa-address-book"
            title={
              isCommercialMembership
                ? "Contact & Location"
                : civilianText.contactTitle
            }
            description={
              isCommercialMembership
                ? "Provide your registered communication details."
                : civilianText.contactDescription
            }
          >
            <div className="inmba-register-grid">
              <RegistrationField
                id="register-email"
                name="email"
                label={
                  isCommercialMembership
                    ? "Email Address"
                    : civilianText.email
                }
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
                placeholder="example@email.com"
                autoComplete="email"
                required={isCommercialMembership}
                optional={!isCommercialMembership}
                disabled={
                  submitting
                }
              />

              <RegistrationField
                id="register-phone"
                name="phone"
                label={
                  isCommercialMembership
                    ? "Mobile Number"
                    : civilianText.mobile
                }
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
                placeholder={
                  isCommercialMembership
                    ? "10-digit mobile number"
                    : civilianText.mobilePlaceholder
                }
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                required
                disabled={
                  submitting
                }
                helperText={
                  !isCommercialMembership
                    ? civilianText.mobileHelp
                    : ""
                }
              />

              <RegistrationField
                id="register-referral"
                name="referral"
                label={
                  isCommercialMembership
                    ? "Referral ID"
                    : civilianText.referral
                }
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
                placeholder={
                  isCommercialMembership
                    ? "Optional referral ID"
                    : civilianText.referralPlaceholder
                }
                disabled={
                  submitting
                }
                optional
              />
            </div>
          </RegistrationSection>

          {/* =================================
              EDUCATION / PROFESSION
          ================================= */}

          {isCommercialMembership && (
          <RegistrationSection
            icon={
              isCommercialMembership
                ? "fas fa-building"
                : "fas fa-briefcase"
            }
            title={
              pageContent.professionTitle
            }
            description={
              pageContent.professionDescription
            }
          >
            <div className="inmba-register-grid">
              <RegistrationSelect
                id="register-education"
                name="education"
                label="Education"
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
                placeholder="Select education"
                required
                disabled={
                  submitting
                }
              />

              <RegistrationField
                id="register-occupation"
                name="occupation"
                label={
                  isCommercialMembership
                    ? "Business / Occupation"
                    : "Occupation"
                }
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
                placeholder={
                  isCommercialMembership
                    ? "Enter business or occupation"
                    : "Enter occupation"
                }
                required
                disabled={
                  submitting
                }
              />
            </div>
          </RegistrationSection>
          )}

          {!isCommercialMembership && (
            <RegistrationSection
              icon="fas fa-camera"
              title={civilianText.photoTitle}
              description={civilianText.photoDescription}
            >
              <div className="inmba-register-grid">
                <div className="inmba-register-field">
                  <label htmlFor="register-profile-pic">
                    {civilianText.photoTitle} <small>({civilianText.optional})</small>
                  </label>
                  <input
                    id="register-profile-pic"
                    name="profile_pic"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                  <small>{civilianText.photoHelp}</small>
                </div>
              </div>
            </RegistrationSection>
          )}

          {/* =================================
              SECURITY
          ================================= */}

          <RegistrationSection
            icon="fas fa-shield-halved"
            title={
              isCommercialMembership
                ? "Account Security"
                : civilianText.securityTitle
            }
            description={
              isCommercialMembership
                ? "Create the password used with your generated login ID."
                : civilianText.securityDescription
            }
          >
            <div className="inmba-register-grid">
              <PasswordField
                id="register-password"
                name="password"
                label={
                  isCommercialMembership
                    ? "Password"
                    : civilianText.password
                }
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
                placeholder="Minimum 5 characters"
                disabled={
                  submitting
                }
              />

              <PasswordField
                id="register-confirm-password"
                name="confirm_password"
                label={
                  isCommercialMembership
                    ? "Confirm Password"
                    : civilianText.confirmPassword
                }
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
              className={`inmba-register-declaration ${
                getErrorText(
                  fieldErrors.termsAccepted
                )
                  ? "inmba-register-declaration-error"
                  : ""
              }`}
            >
              <label htmlFor="register-terms">
                <input
                  id="register-terms"
                  type="checkbox"
                  name="termsAccepted"
                  checked={
                    formData.termsAccepted
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
                  {isCommercialMembership
                    ? "I confirm that all information provided in this membership application is true and correct."
                    : civilianText.declaration}
                </p>
              </label>

              {getErrorText(
                fieldErrors.termsAccepted
              ) && (
                <small>
                  {getErrorText(
                    fieldErrors.termsAccepted
                  )}
                </small>
              )}
            </div>
          </RegistrationSection>

          {!isCommercialMembership && (
            <section className="inmba-register-upgrade-note">
              <span>
                <i className="fas fa-circle-info" aria-hidden="true"></i>
              </span>

              <div>
                <strong>
                  {civilianLanguage === "ta" ? "கூடுதல் KYC எப்போது தேவை?" : "When is additional KYC required?"}
                </strong>
                <p>
                  {civilianLanguage === "ta"
                    ? "Network / Royalty Level-க்கு Upgrade செய்யும்போது மட்டும் Aadhaar, PAN மற்றும் Bank Account விவரங்கள் போன்ற கூடுதல் KYC தகவல்கள் கேட்கப்படும். Basic Civilian registration-க்கு அவை தேவையில்லை."
                    : "Aadhaar, PAN and Bank Account details are required only when upgrading to the Network / Royalty Level. They are not required for Basic Civilian registration."}
                </p>
              </div>
            </section>
          )}

          {/* =================================
              ACTIONS
          ================================= */}

          <section className="inmba-register-actions">
            <Link to="/membership-type">
              <i
                className="fas fa-arrow-left"
                aria-hidden="true"
              ></i>

              {isCommercialMembership
                ? "Membership Types"
                : civilianText.back}
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

                  {isCommercialMembership
                    ? "Creating Membership..."
                    : civilianText.submitting}
                </>
              ) : (
                <>
                  {isCommercialMembership
                    ? "Submit Registration"
                    : civilianText.submit}

                  <i
                    className="fas fa-arrow-right"
                    aria-hidden="true"
                  ></i>
                </>
              )}
            </button>
          </section>
        </form>
          </section>
        </div>
      </div>
    </main>
  );
}

/* ========================================
   SECTION COMPONENT
======================================== */

function RegistrationSection({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section className="inmba-register-section">
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
   INPUT COMPONENT
======================================== */

function RegistrationField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  error,
  required = false,
  optional = false,
  helperText = "",
  ...inputProps
}) {
  return (
    <div className="inmba-register-field">
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
            ? "inmba-register-input-error"
            : ""
        }
        {...inputProps}
      />

      {error && (
        <small className="inmba-register-field-error">
          {error}
        </small>
      )}

      {!error && helperText && (
        <small className="inmba-register-field-help">
          {helperText}
        </small>
      )}
    </div>
  );
}

/* ========================================
   SELECT COMPONENT
======================================== */

function RegistrationSelect({
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
    <div className="inmba-register-field">
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
            ? "inmba-register-input-error"
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
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}
      </select>

      {error && (
        <small className="inmba-register-field-error">
          {error}
        </small>
      )}
    </div>
  );
}

/* ========================================
   PASSWORD COMPONENT
======================================== */

function PasswordField({
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
    <div className="inmba-register-field">
      <label htmlFor={id}>
        {label}

        <span>
          *
        </span>
      </label>

      <div className="inmba-register-password-shell">
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
              ? "inmba-register-input-error"
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
        <small className="inmba-register-field-error">
          {error}
        </small>
      )}
    </div>
  );
}
