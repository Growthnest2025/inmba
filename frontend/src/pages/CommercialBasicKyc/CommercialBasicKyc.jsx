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
  registerCommercialMember,
} from "../../services/commercialRegistration.service";

import "@fortawesome/fontawesome-free/css/all.min.css";

import "./CommercialBasicKyc.css";

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM_DATA = {
  business_name: "",
  owner_full_name: "",
  phone: "",
  email: "",
  business_category: "",
  city: "",
  business_address: "",
  password: "",
  referral: "",
};

/* =========================================================
   HELPERS
========================================================= */

const text = (value) =>
  String(value ?? "").trim();

const phoneOnly = (value) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);

const errorText = (value) => {
  if (Array.isArray(value)) {
    return text(value[0]);
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return text(
      value.message ??
        value.msg ??
        value.error
    );
  }

  return text(value);
};

/* =========================================================
   COMMERCIAL BASIC KYC
========================================================= */

export default function CommercialBasicKyc() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] =
    useSearchParams();

  /* =====================================================
     REFERRAL FROM URL
  ===================================================== */

  const referralFromUrl =
    useMemo(
      () =>
        text(
          searchParams.get("ref") ??
            searchParams.get(
              "referral"
            )
        )
          .replace(/\s/g, "")
          .slice(0, 50)
          .toUpperCase(),
      [searchParams]
    );

  /* =====================================================
     FORM STATE
  ===================================================== */

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

  /* =====================================================
     REGISTRATION SUCCESS STATE
  ===================================================== */

  const [
    registrationSuccess,
    setRegistrationSuccess,
  ] =
    useState(false);

  const [
    createdLoginId,
    setCreatedLoginId,
  ] =
    useState("");

  const [
    registrationMessage,
    setRegistrationMessage,
  ] =
    useState("");

  /* =====================================================
     INPUT CHANGE
  ===================================================== */

  const handleInputChange = (
    event
  ) => {
    const {
      name,
      value,
    } =
      event.target;

    let nextValue =
      value;

    /* -------------------------
       PHONE
    ------------------------- */

    if (
      name === "phone"
    ) {
      nextValue =
        phoneOnly(value);
    }

    /* -------------------------
       REFERRAL
    ------------------------- */

    if (
      name === "referral"
    ) {
      nextValue =
        value
          .replace(/\s/g, "")
          .slice(0, 50)
          .toUpperCase();
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
      })
    );

    setFormError("");
  };

  /* =====================================================
     VALIDATION
  ===================================================== */

  const validateForm =
    () => {
      const errors = {};

      /* BUSINESS NAME */

      if (
        text(
          formData.business_name
        ).length < 2
      ) {
        errors.business_name =
          "Business / Shop Name is required.";
      }

      /* OWNER */

      if (
        text(
          formData.owner_full_name
        ).length < 2
      ) {
        errors.owner_full_name =
          "Owner Full Name is required.";
      }

      /* PHONE */

      const normalizedPhone =
        phoneOnly(
          formData.phone
        );

      if (
        !/^[6-9]\d{9}$/.test(
          normalizedPhone
        )
      ) {
        errors.phone =
          "Enter a valid 10-digit Mobile Number.";
      }

      /* EMAIL */

      const email =
        text(
          formData.email
        ).toLowerCase();

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
          email
        )
      ) {
        errors.email =
          "Enter a valid Email ID.";
      }

      /* CATEGORY */

      if (
        ![
          "Retail",
          "Service",
          "Wholesale",
        ].includes(
          formData.business_category
        )
      ) {
        errors.business_category =
          "Select a Business Category.";
      }

      /* CITY */

      if (
        !text(
          formData.city
        )
      ) {
        errors.city =
          "City / Location is required.";
      }

      /* ADDRESS */

      if (
        text(
          formData.business_address
        ).length < 5
      ) {
        errors.business_address =
          "Business Address is required.";
      }

      /* PASSWORD */

const password =
  String(
    formData.password ?? ""
  );

if (
  password.length < 5
) {
  errors.password =
    "Password / PIN must contain at least 5 characters.";
}

      setFieldErrors(
        errors
      );

      return (
        Object.keys(
          errors
        ).length === 0
      );
    };

  /* =====================================================
     CREATE COMMERCIAL ACCOUNT
  ===================================================== */

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        submitting
      ) {
        return;
      }

      setFormError("");

      if (
        !validateForm()
      ) {
        setFormError(
          "Please complete the required fields correctly."
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        const payload = {
          ...formData,

          phone:
            phoneOnly(
              formData.phone
            ),

          email:
            text(
              formData.email
            ).toLowerCase(),

          referral:
            text(
              formData.referral
            )
              .replace(/\s/g, "")
              .slice(0, 50)
              .toUpperCase(),
        };

        const result =
          await registerCommercialMember(
            payload
          );
        /* =================================================
           LOGIN ID FROM BACKEND
        ================================================= */
const newLoginId =
  text(
    result?.commercialBasicKyc?.login_id ||
      result?.commercialBasicKyc?.loginId ||
      result?.data?.commercialBasicKyc?.login_id ||
      result?.data?.commercialBasicKyc?.loginId ||
      result?.data?.login_id ||
      result?.data?.loginId ||
      result?.login_id ||
      result?.loginId
  );

if (!newLoginId) {
  throw new Error(
    "Commercial Login ID was not returned by the server."
  );
}
        /* =================================================
           STORE LOGIN ID
        ================================================= */

        if (
          newLoginId
        ) {
          sessionStorage.setItem(
            "inmba_commercial_login_id",
            newLoginId
          );
          sessionStorage.setItem(
            "commercial_login_id",
            newLoginId
          );
          localStorage.setItem(
            "commercial_login_id",
            newLoginId
          );
          localStorage.setItem(
            "inmba_commercial_login_id",
            newLoginId
          );
        }

        if (result?.token) {
          localStorage.setItem("inmba_auth_token", result.token);
          sessionStorage.setItem("inmba_auth_token", result.token);
          localStorage.setItem("inmba_session_token", result.token);
          sessionStorage.setItem("inmba_session_token", result.token);
        }

        /* =================================================
           SHOW SUCCESS SCREEN
        ================================================= */

        setCreatedLoginId(
          newLoginId
        );

        setRegistrationMessage(
          result?.message ||
            "Your Commercial Membership account has been created successfully."
        );

        setRegistrationSuccess(
          true
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } catch (
        error
      ) {
        console.error(
          "Commercial Registration Error:",
          error
        );

        setFormError(
          error?.apiMessage ||
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "Unable to complete Commercial registration."
        );

        setFieldErrors(
          (
            previousErrors
          ) => ({
            ...previousErrors,

            ...(error?.fieldErrors ||
              error?.response?.data
                ?.fieldErrors ||
              {}),
          })
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* =====================================================
     EXISTING ACCOUNT LOGIN
  ===================================================== */

  const handleExistingAccountLogin =
    () => {
      navigate(
        "/login/commercial",
        {
          state: {
            loginId:
              sessionStorage.getItem(
                "commercial_login_id"
              ) || "",
          },
        }
      );
    };

  /* =====================================================
     GO TO MEMBERSHIP PLAN
  ===================================================== */
const handleContinueMembership = () => {
  const loginId =
    createdLoginId ||
    sessionStorage.getItem(
      "commercial_login_id"
    ) ||
    localStorage.getItem(
      "commercial_login_id"
    );

  if (!loginId) {
    setFormError(
      "Commercial Login ID is missing. Please register again."
    );
    return;
  }

  sessionStorage.setItem(
    "commercial_login_id",
    loginId
  );

  sessionStorage.setItem(
    "inmba_commercial_login_id",
    loginId
  );

  localStorage.setItem(
    "commercial_login_id",
    loginId
  );

  sessionStorage.setItem(
    "commercial_from_registration",
    "true"
  );

  navigate(
    "/login/commercial",
    {
      replace: true,
      state: {
        loginId,
        prefillId: loginId,
        fromNewRegistration: true,
        registrationSuccess: true,
        nextPath: "/commercial/membership-plan",
        message: `Commercial account registered successfully! Your Login ID is ${loginId}. Please login to select your membership plan.`,
      },
    }
  );
};
      /*
        IMPORTANT:
        If your AppRoutes route uses a different URL,
        change ONLY this route string.


  /* =====================================================
     SUCCESS PAGE
  ===================================================== */

  if (
    registrationSuccess
  ) {
    return (
      <main className="commercial-success-page">
        <section className="commercial-success-card">
          {/* SUCCESS ICON */}

          <div className="commercial-success-icon">
            <i className="fas fa-check" />
          </div>

          {/* BADGE */}

          <span className="commercial-success-badge">
            COMMERCIAL MEMBERSHIP
          </span>

          {/* TITLE */}

          <h1>
            Registration Successful!
          </h1>

          <p className="commercial-success-description">
            {registrationMessage}
          </p>

          {/* LOGIN ID */}

          <div className="commercial-success-login-card">
            <div className="commercial-success-login-icon">
              <i className="fas fa-id-card" />
            </div>

            <div className="commercial-success-login-content">
              <span>
                Your Commercial Login ID
              </span>

              <strong>
                {createdLoginId ||
                  "Login ID Generated"}
              </strong>

              <small>
                Please save this Login ID.
                You will need it for your
                Commercial Membership account.
              </small>
            </div>
          </div>

          {/* INFO */}

          <div className="commercial-success-info">
            <i className="fas fa-circle-info" />

            <p>
              Your Commercial Basic KYC has been
              completed successfully. Continue to
              Membership Plan selection and choose
              Basic ₹300 or Profile Upgrade ₹1500.
            </p>
          </div>

          {/* ACTION BUTTONS */}

          <div className="commercial-success-actions">
            <button
              type="button"
              className="commercial-success-dashboard-button"
              onClick={() => {
                navigate(
                  "/commercial"
                );
              }}
            >
              <i className="fas fa-arrow-left" />

              <span>
                Back
              </span>
            </button>

            <button
              type="button"
              className="commercial-success-login-button"
              onClick={
                handleContinueMembership
              }
            >
              <span>
                Continue to Commercial Login
              </span>

              <i className="fas fa-arrow-right" />
            </button>
          </div>

          {/* SECURITY */}

          <div className="commercial-success-footer">
            <i className="fas fa-shield-halved" />

            <span>
              Commercial registration secured by INMBA
            </span>
          </div>
        </section>
      </main>
    );
  }

  /* =====================================================
     REGISTRATION UI
  ===================================================== */

  return (
    <main className="commercial-registration-page">
      {/* =================================================
          LEFT SIDE
      ================================================= */}

      <section className="commercial-registration-left">
        <div className="commercial-registration-left-pattern" />

        {/* BRAND */}

        <div className="commercial-registration-brand">
          <div className="commercial-registration-brand-icon">
            <i className="fas fa-store" />
          </div>

          <div>
            <span>
              INMBA
            </span>

            <strong>
              Commercial
            </strong>
          </div>
        </div>

        {/* CONTENT */}

        <div className="commercial-registration-left-content">
          <span className="commercial-registration-eyebrow">
            COMMERCIAL MEMBERSHIP
          </span>

          <h1>
            Build Your Commercial Identity
          </h1>

          <p>
            Create your INMBA Commercial account and
            choose the membership plan that matches
            your business requirements.
          </p>

          {/* BENEFITS */}

          <div className="commercial-registration-benefits">
            <div>
              <span>
                <i className="fas fa-store" />
              </span>

              <div>
                <strong>
                  Commercial Account
                </strong>

                <p>
                  Create your Commercial Membership account securely.
                </p>
              </div>
            </div>

            <div>
              <span>
                <i className="fas fa-network-wired" />
              </span>

              <div>
                <strong>
                  Commercial Network
                </strong>

                <p>
                  Connect with the INMBA business ecosystem.
                </p>
              </div>
            </div>

            <div>
              <span>
                <i className="fas fa-shield-halved" />
              </span>

              <div>
                <strong>
                  Secure Membership
                </strong>

                <p>
                  Your business information remains protected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          RIGHT SIDE
      ================================================= */}

      <section className="commercial-registration-right">
        <div className="commercial-registration-form-wrapper">
          {/* HEADER */}

          <div className="commercial-registration-heading">
            <div className="commercial-registration-heading-icon">
              <i className="fas fa-store" />
            </div>

            <div>
              <h2>
                Commercial Basic KYC
              </h2>

              <p>
                Create your Commercial Membership account.
              </p>
            </div>
          </div>

          {/* ERROR */}

          {formError && (
            <div
              className="commercial-registration-alert"
              role="alert"
            >
              <i className="fas fa-circle-exclamation" />

              <span>
                {formError}
              </span>
            </div>
          )}

          {/* FORM */}

          <form
            className="commercial-registration-form"
            onSubmit={
              handleSubmit
            }
            noValidate
          >
            {/* BUSINESS NAME */}

            <Field
              label="Business / Shop Name"
              name="business_name"
              value={
                formData.business_name
              }
              onChange={
                handleInputChange
              }
              error={
                fieldErrors.business_name
              }
              icon="fas fa-store"
              placeholder="Enter Business / Shop Name"
              disabled={
                submitting
              }
            />

            {/* OWNER */}

            <Field
              label="Owner Full Name"
              name="owner_full_name"
              value={
                formData.owner_full_name
              }
              onChange={
                handleInputChange
              }
              error={
                fieldErrors.owner_full_name
              }
              icon="fas fa-user"
              placeholder="Enter Owner Full Name"
              disabled={
                submitting
              }
            />

            {/* PHONE */}

            <div className="commercial-registration-field">
              <label htmlFor="commercial-phone">
                Mobile Number{" "}
                <em>
                  *
                </em>
              </label>

              <div className="commercial-registration-input">
                <i className="fas fa-mobile-screen-button" />

                <input
                  id="commercial-phone"
                  name="phone"
                  type="tel"
                  value={
                    formData.phone
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="10-digit Mobile Number"
                  maxLength={10}
                  inputMode="numeric"
                  autoComplete="tel"
                  disabled={
                    submitting
                  }
                />
              </div>

              {errorText(
                fieldErrors.phone
              ) && (
                <small className="commercial-registration-field-error">
                  {errorText(
                    fieldErrors.phone
                  )}
                </small>
              )}
            </div>

            {/* EMAIL */}

            <Field
              label="Email ID"
              name="email"
              type="email"
              value={
                formData.email
              }
              onChange={
                handleInputChange
              }
              error={
                fieldErrors.email
              }
              icon="fas fa-envelope"
              placeholder="Enter Email ID"
              autoComplete="email"
              disabled={
                submitting
              }
            />

            {/* BUSINESS CATEGORY */}

            <div className="commercial-registration-field">
              <label htmlFor="commercial-business-category">
                Business Category / Type{" "}
                <em>
                  *
                </em>
              </label>

              <div className="commercial-registration-input commercial-registration-select-wrap">
                <i className="fas fa-briefcase" />

                <select
                  id="commercial-business-category"
                  name="business_category"
                  value={
                    formData.business_category
                  }
                  onChange={
                    handleInputChange
                  }
                  disabled={
                    submitting
                  }
                >
                  <option value="">
                    Select Business Category
                  </option>

                  <option value="Retail">
                    Retail
                  </option>

                  <option value="Service">
                    Service
                  </option>

                  <option value="Wholesale">
                    Wholesale
                  </option>
                </select>
              </div>

              {errorText(
                fieldErrors.business_category
              ) && (
                <small className="commercial-registration-field-error">
                  {errorText(
                    fieldErrors.business_category
                  )}
                </small>
              )}
            </div>

            {/* CITY */}

            <Field
              label="City / Location"
              name="city"
              value={
                formData.city
              }
              onChange={
                handleInputChange
              }
              error={
                fieldErrors.city
              }
              icon="fas fa-location-dot"
              placeholder="Enter City / Location"
              disabled={
                submitting
              }
            />

            {/* ADDRESS */}

            <div className="commercial-registration-field full-width">
              <label htmlFor="commercial-address">
                Business Address{" "}
                <em>
                  *
                </em>
              </label>

              <div className="commercial-registration-textarea-wrap">
                <i className="fas fa-map-location-dot" />

                <textarea
                  id="commercial-address"
                  name="business_address"
                  value={
                    formData.business_address
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter Business Address"
                  rows={3}
                  disabled={
                    submitting
                  }
                />
              </div>

              {errorText(
                fieldErrors.business_address
              ) && (
                <small className="commercial-registration-field-error">
                  {errorText(
                    fieldErrors.business_address
                  )}
                </small>
              )}
            </div>

            {/* PASSWORD */}

            <div className="commercial-registration-field">
              <label htmlFor="commercial-password">
                Password / PIN Setup{" "}
                <em>
                  *
                </em>
              </label>

              <div className="commercial-registration-input">
                <i className="fas fa-lock" />

                <input
                  id="commercial-password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    formData.password
                  }
                  onChange={
                    handleInputChange
                  }
placeholder="Minimum 5 characters"
autoComplete="new-password"
minLength={5}
                  disabled={
                    submitting
                  }
                />

                <button
                  type="button"
                  className="commercial-registration-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (
                        previousValue
                      ) =>
                        !previousValue
                    )
                  }
                  disabled={
                    submitting
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  <i
                    className={
                      showPassword
                        ? "far fa-eye-slash"
                        : "far fa-eye"
                    }
                  />
                </button>
              </div>

              {errorText(
                fieldErrors.password
              ) && (
                <small className="commercial-registration-field-error">
                  {errorText(
                    fieldErrors.password
                  )}
                </small>
              )}
            </div>

            {/* REFERRAL */}

            <div className="commercial-registration-field">
              <div className="commercial-registration-label-row">
                <label htmlFor="commercial-referral">
                  Referral ID
                </label>

                <span>
                  Optional
                </span>
              </div>

              <div className="commercial-registration-input">
                <i className="fas fa-user-plus" />

                <input
                  id="commercial-referral"
                  name="referral"
                  type="text"
                  value={
                    formData.referral
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter Referral ID"
                  maxLength={50}
                  disabled={
                    submitting ||
                    Boolean(
                      referralFromUrl
                    )
                  }
                />
              </div>

              {errorText(
                fieldErrors.referral
              ) && (
                <small className="commercial-registration-field-error">
                  {errorText(
                    fieldErrors.referral
                  )}
                </small>
              )}
            </div>

            {/* SECURITY NOTE */}

            <div className="commercial-registration-security-note full-width">
              <i className="fas fa-shield-halved" />

              <span>
                Your Commercial registration details are securely
                processed by INMBA.
              </span>
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              className="commercial-registration-submit"
              disabled={
                submitting
              }
            >
              {submitting ? (
                <>
                  <i className="fas fa-circle-notch fa-spin" />

                  <span>
                    Creating Account...
                  </span>
                </>
              ) : (
                <>
                  <span>
                    Create Commercial Account
                  </span>

                  <i className="fas fa-arrow-right" />
                </>
              )}
            </button>
          </form>

          {/* LOGIN */}

          <div className="commercial-registration-login">
            <span>
              Already have a Commercial account?
            </span>

            <button
              type="button"
              onClick={
                handleExistingAccountLogin
              }
              disabled={
                submitting
              }
            >
              Login
            </button>
          </div>

          {/* HOME */}

          <div className="commercial-registration-home">
            <Link to="/">
              <i className="fas fa-arrow-left" />

              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   FIELD COMPONENT
========================================================= */

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  icon,
  placeholder,
  ...props
}) {
  return (
    <div className="commercial-registration-field">
      <label
        htmlFor={`commercial-${name}`}
      >
        {label}{" "}
        <em>
          *
        </em>
      </label>

      <div className="commercial-registration-input">
        <i className={icon} />

        <input
          id={`commercial-${name}`}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={
            placeholder
          }
          {...props}
        />
      </div>

      {errorText(error) && (
        <small className="commercial-registration-field-error">
          {errorText(
            error
          )}
        </small>
      )}
    </div>
  );
}