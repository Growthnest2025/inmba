import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  registerProfessionalMember,
  validateProfessionalDob,
  validateProfessionalEmail,
  validateProfessionalMobile,
  validateProfessionalProfilePhoto,
} from "../../../services/professionalRegistration.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "@fortawesome/fontawesome-free/css/all.min.css";
import "./ProfessionalRegistration.css";
import { toText } from "../../../utils/commonHelpers";

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM_DATA = {
  full_name: "",
  phone: "",
  email: "",
  dob: "",
  password: "",
  referral: "",
  profile_photo: null,
};

/* =========================================================
   HELPERS
========================================================= */

const getErrorText = (
  value
) => {
  if (Array.isArray(value)) {
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

  return toText(
    value
  );
};

/* =========================================================
   GET LOGIN ID FROM ERROR MESSAGE
========================================================= */

const extractLoginIdFromMessage = (
  message
) => {
  const text = toText(
    message
  );

  if (!text) {
    return "";
  }

  const match = text.match(
    /login\s*id\s*(?:is|:)?\s*([a-zA-Z0-9_-]+)/i
  );

  return toText(
    match?.[1]
  );
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ProfessionalRegistration() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] =
    useSearchParams();

  const fileInputRef =
    useRef(null);

  /* =======================================================
     REFERRAL FROM URL
  ======================================================= */

  const referralFromUrl =
    useMemo(
      () =>
        toText(
          searchParams.get(
            "ref"
          ) ??
            searchParams.get(
              "referral"
            )
        ),
      [
        searchParams,
      ]
    );

  /* =======================================================
     FORM STATE
  ======================================================= */

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
    photoPreview,
    setPhotoPreview,
  ] =
    useState("");

  /* =======================================================
     CLEAN PREVIEW
  ======================================================= */

  useEffect(
    () => {
      return () => {
        if (
          photoPreview
        ) {
          URL.revokeObjectURL(
            photoPreview
          );
        }
      };
    },
    [
      photoPreview,
    ]
  );

  /* =======================================================
     INPUT CHANGE
  ======================================================= */

  const handleInputChange =
    (
      event
    ) => {
      const {
        name,
        value,
      } =
        event.target;

      let nextValue =
        value;

      if (
        name ===
        "phone"
      ) {
        nextValue =
          value
            .replace(
              /\D/g,
              ""
            )
            .slice(
              0,
              10
            );
      }

      if (
        name ===
        "referral"
      ) {
        nextValue =
          value
            .replace(
              /\s/g,
              ""
            )
            .slice(
              0,
              50
            );
      }

      setFormData(
        (
          previous
        ) => ({
          ...previous,

          [name]:
            nextValue,
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

      setFormError("");
    };

  /* =======================================================
     PROFILE PHOTO
  ======================================================= */

  const handleProfilePhotoChange =
    (
      event
    ) => {
      const file =
        event.target
          .files?.[0] ||
        null;

      if (!file) {
        return;
      }

      const validation =
        validateProfessionalProfilePhoto(
          file
        );

      if (
        !validation.valid
      ) {
        setFieldErrors(
          (
            previous
          ) => ({
            ...previous,

            profile_photo:
              validation.error,
          })
        );

        event.target.value =
          "";

        return;
      }

      if (
        photoPreview
      ) {
        URL.revokeObjectURL(
          photoPreview
        );
      }

      const preview =
        URL.createObjectURL(
          file
        );

      setPhotoPreview(
        preview
      );

      setFormData(
        (
          previous
        ) => ({
          ...previous,

          profile_photo:
            file,
        })
      );

      setFieldErrors(
        (
          previous
        ) => ({
          ...previous,

          profile_photo:
            "",
        })
      );

      setFormError("");
    };

  /* =======================================================
     REMOVE PROFILE PHOTO
  ======================================================= */

  const handleRemovePhoto =
    () => {
      if (
        photoPreview
      ) {
        URL.revokeObjectURL(
          photoPreview
        );
      }

      setPhotoPreview("");

      setFormData(
        (
          previous
        ) => ({
          ...previous,

          profile_photo:
            null,
        })
      );

      if (
        fileInputRef.current
      ) {
        fileInputRef
          .current
          .value =
          "";
      }
    };

  /* =======================================================
     VALIDATE FORM
  ======================================================= */

  const validateForm =
    () => {
      const errors = {};

      /* FULL NAME */

      if (
        !toText(
          formData.full_name
        )
      ) {
        errors.full_name =
          "Full name is required.";
      } else if (
        toText(
          formData.full_name
        ).length < 2
      ) {
        errors.full_name =
          "Enter a valid full name.";
      }

      /* MOBILE */

      const mobileValidation =
        validateProfessionalMobile(
          formData.phone
        );

      if (
        !mobileValidation.valid
      ) {
        errors.phone =
          mobileValidation.error;
      }

      /* ===============================================
         EMAIL - OPTIONAL
      =============================================== */

      if (
        toText(
          formData.email
        )
      ) {
        const emailValidation =
          validateProfessionalEmail(
            formData.email
          );

        if (
          !emailValidation.valid
        ) {
          errors.email =
            emailValidation.error;
        }
      }

      /* ===============================================
         DOB - OPTIONAL
      =============================================== */

      if (
        toText(
          formData.dob
        )
      ) {
        const dobValidation =
          validateProfessionalDob(
            formData.dob
          );

        if (
          !dobValidation.valid
        ) {
          errors.dob =
            dobValidation.error;
        }
      }

      /* PASSWORD */

      if (
        !formData.password
      ) {
        errors.password =
          "Password / PIN is required.";
      } else if (
        String(
          formData.password
        ).length < 5
      ) {
        errors.password =
          "Password must contain at least 5 characters.";
      }

      /* PHOTO */

      const photoValidation =
        validateProfessionalProfilePhoto(
          formData.profile_photo
        );

      if (
        !photoValidation.valid
      ) {
        errors.profile_photo =
          photoValidation.error;
      }

      setFieldErrors(
        errors
      );

      if (
        Object.keys(
          errors
        ).length > 0
      ) {
        setFormError(
          "Please correct the highlighted fields."
        );

        return false;
      }

      setFormError("");

      return true;
    };

  /* =======================================================
     GO TO PROFESSIONAL LOGIN
     
     EXISTING ACCOUNT ONLY
  ======================================================= */

  const goToProfessionalLogin =
    (
      loginId = "",
      options = {}
    ) => {
      const normalizedLoginId =
        toText(
          loginId
        );

      const accountExists =
        Boolean(
          options.accountExists
        );

      if (
        normalizedLoginId
      ) {
        sessionStorage.setItem(
          "inmba_existing_professional_login_id",
          normalizedLoginId
        );

        sessionStorage.setItem(
          "inmba_professional_login_id",
          normalizedLoginId
        );
      }

      const loginMessage =
        accountExists
          ? normalizedLoginId
            ? `Professional account already exists. Login with ID ${normalizedLoginId} to continue.`
            : "Professional account already exists. Please login with your existing Professional account."
          : "Please login to continue.";

      sessionStorage.setItem(
        "inmba_professional_login_message",
        loginMessage
      );

      const targetUrl =
        normalizedLoginId
          ? `/professional-login?loginId=${encodeURIComponent(
              normalizedLoginId
            )}`
          : "/professional-login";

      navigate(
        targetUrl,
        {
          replace: true,

          state: {
            loginId:
              normalizedLoginId,

            prefillId:
              normalizedLoginId,

            accountExists,

            message:
              loginMessage,

            from:
              "professional-registration",
          },
        }
      );
    };

  /* =======================================================
     EXISTING ACCOUNT
     → PROFESSIONAL LOGIN
  ======================================================= */

  const redirectExistingAccountToLogin =
    (
      error
    ) => {
      const backendData =
        error?.response?.data ||
        {};

      const backendInnerData =
        backendData?.data ||
        {};

      const errorMessage =
        toText(
          error?.apiMessage ??
            backendData?.message ??
            error?.message
        );

      let existingLoginId =
        toText(
          error?.existingLoginId ??
            error?.loginId ??
            error
              ?.registrationResult
              ?.loginId ??
            error
              ?.registrationResult
              ?.member
              ?.login_id ??
            backendInnerData
              ?.loginId ??
            backendInnerData
              ?.login_id ??
            backendInnerData
              ?.member
              ?.login_id
        );

      if (
        !existingLoginId
      ) {
        existingLoginId =
          extractLoginIdFromMessage(
            errorMessage
          );
      }

      if (
        existingLoginId
      ) {
        sessionStorage.setItem(
          "inmba_existing_professional_login_id",
          existingLoginId
        );

        sessionStorage.setItem(
          "inmba_professional_login_id",
          existingLoginId
        );

        sessionStorage.setItem(
          "professional_registration_login_id",
          existingLoginId
        );
      }

      navigate(
        "/professional-registration-success",
        {
          replace: true,

          state: {
            registrationSuccess: true,
            accountExists: true,
            loginId: existingLoginId,
            login_id: existingLoginId,
            generatedLoginId: existingLoginId,
            membershipType: "Professional Member",
            loginPath: "/professional-login",
            nextPath: "/professional-membership",
            message: existingLoginId
              ? `Professional account already exists. Your Login ID is ${existingLoginId}. Continue to Professional Login.`
              : "Professional account already exists. Continue to Professional Login.",

            registration: {
              loginId: existingLoginId,
              login_id: existingLoginId,
              generatedLoginId: existingLoginId,
              accountExists: true,
              loginRoute: "/professional-login",
              nextPath: "/professional-membership",
              membershipType: "Professional Member",
            },
          },
        }
      );
    };

  /* =======================================================
     SUBMIT
  ======================================================= */

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

      if (
        !validateForm()
      ) {
        return;
      }

      try {
        setSubmitting(
          true
        );

        setFormError("");

        const result =
          await registerProfessionalMember(
            formData
          );

        /* ===============================================
           DUPLICATE SAFETY
        =============================================== */

        if (
          result?.alreadyRegistered ||
          result?.existingAccount
        ) {
          const duplicateError =
            new Error(
              result?.message ||
                "Professional account already exists."
            );

          duplicateError.alreadyRegistered =
            true;

          duplicateError.existingAccount =
            true;

          duplicateError.loginId =
            result?.loginId;

          duplicateError.existingLoginId =
            result?.loginId;

          duplicateError.registrationResult =
            result;

          redirectExistingAccountToLogin(
            duplicateError
          );

          return;
        }

        /* ===============================================
           NEW REGISTRATION
        =============================================== */

        const loginId =
          toText(
            result?.loginId ??
              result?.login_id ??
              result?.member
                ?.login_id ??
              result?.data
                ?.loginId ??
              result?.data
                ?.login_id ??
              result?.data
                ?.member
                ?.login_id
          );

        if (
          !loginId
        ) {
          throw new Error(
            "Professional registration completed but Login ID was not returned."
          );
        }

        /* ===============================================
           SAVE GENERATED LOGIN ID
        =============================================== */

        sessionStorage.setItem(
          "inmba_professional_login_id",
          loginId
        );

        sessionStorage.setItem(
          "professional_registration_login_id",
          loginId
        );

        sessionStorage.setItem(
          "inmba_professional_login_message",
          "Professional registration completed successfully. Please login to continue."
        );

        /* ===============================================
           NEW PROFESSIONAL
           
           BASIC KYC
                ↓
           LOGIN ID SUCCESS PAGE
        =============================================== */

        navigate(
          "/professional-registration-success",
          {
            replace:
              true,

            state: {
              registrationSuccess:
                true,

              loginId,

              login_id:
                loginId,

              generatedLoginId:
                loginId,

              membershipType:
                "Professional Member",

              loginPath:
                "/professional-login",

              nextPath:
                "/professional-membership",

              message:
                "Professional registration completed successfully. Save your generated Login ID.",

              registration: {
                ...result,

                loginId,

                login_id:
                  loginId,

                generatedLoginId:
                  loginId,

                loginRoute:
                  "/professional-login",

                nextPath:
                  "/professional-membership",

                membershipType:
                  "Professional Member",

                message:
                  "Professional registration completed successfully. Save your generated Login ID.",
              },
            },
          }
        );
      } catch (
        error
      ) {
        console.error(
          "Professional Registration Error:",
          error
        );

        const backendData =
          error?.response?.data ||
          {};

        const backendInnerData =
          backendData?.data ||
          {};

        const errorMessage =
          toText(
            error?.apiMessage ??
              backendData?.message ??
              error?.message
          );

        const errorCode =
          toText(
            error?.code ??
              backendData?.errorCode ??
              backendData?.code
          );

        /* ===============================================
           ACCOUNT ALREADY EXISTS
        =============================================== */

        const alreadyRegistered =
          Boolean(
            error?.alreadyRegistered ||
              error?.existingAccount ||
              backendInnerData
                ?.alreadyRegistered ||
              backendInnerData
                ?.existingAccount ||
              errorCode ===
                "PROFESSIONAL_ACCOUNT_EXISTS" ||
              errorMessage
                .toLowerCase()
                .includes(
                  "professional account already exists"
                ) ||
              errorMessage
                .toLowerCase()
                .includes(
                  "already linked to a professional account"
                )
          );

        if (
          alreadyRegistered
        ) {
          redirectExistingAccountToLogin(
            error
          );

          return;
        }

        /* ===============================================
           FIELD ERRORS
        =============================================== */

        if (
          error?.fieldErrors &&
          typeof error.fieldErrors ===
            "object"
        ) {
          setFieldErrors(
            error.fieldErrors
          );
        }

        const message =
          getApiErrorMessage(
            error,
            error?.apiMessage ||
              "Unable to complete Professional registration."
          );

        setFormError(
          message
        );

        window.scrollTo({
          top: 0,
          behavior:
            "smooth",
        });
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* =======================================================
     EXISTING ACCOUNT LOGIN BUTTON
  ======================================================= */

  const handleExistingAccountLogin =
    () => {
      const existingLoginId =
        toText(
          sessionStorage.getItem(
            "inmba_existing_professional_login_id"
          ) ||
            sessionStorage.getItem(
              "inmba_professional_login_id"
            )
        );

      goToProfessionalLogin(
        existingLoginId,
        {
          accountExists:
            true,
        }
      );
    };

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <main className="professional-registration-page">
      {/* =================================================
          LEFT
      ================================================= */}

      <section className="professional-registration-left">
        <div className="professional-registration-left-pattern" />

        <div className="professional-registration-brand">
          <div className="professional-registration-brand-icon">
            <i
              className="fas fa-user-tie"
              aria-hidden="true"
            />
          </div>

          <div>
            <span>
              INMBA
            </span>

            <strong>
              Professional
            </strong>
          </div>
        </div>

        <div className="professional-registration-left-content">
          <span className="professional-registration-eyebrow">
            PROFESSIONAL MEMBERSHIP
          </span>

          <h1>
            Build Your
            Professional
            Identity
          </h1>

          <p>
            Create your INMBA
            Professional account and
            continue your complete
            Professional KYC journey.
          </p>

          <div className="professional-registration-benefits">
            <div>
              <span>
                <i className="fas fa-user-check" />
              </span>

              <div>
                <strong>
                  Verified Identity
                </strong>

                <p>
                  Complete your
                  Professional KYC
                  securely.
                </p>
              </div>
            </div>

            <div>
              <span>
                <i className="fas fa-network-wired" />
              </span>

              <div>
                <strong>
                  Professional Network
                </strong>

                <p>
                  Connect with the INMBA
                  member ecosystem.
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
                  Your personal KYC data
                  remains protected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          RIGHT
      ================================================= */}

      <section className="professional-registration-right">
        <div className="professional-registration-form-wrapper">
          {/* HEADING */}

          <div className="professional-registration-heading">
            <span className="professional-registration-heading-icon">
              <i className="fas fa-user-tie" />
            </span>

            <div>
              <h2>
                Professional Basic KYC
              </h2>

              <p>
                Create your Professional
                Membership account.
              </p>
            </div>
          </div>

          {/* ERROR */}

          {formError && (
            <div
              className="professional-registration-alert"
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
            className="professional-registration-form"
            onSubmit={
              handleSubmit
            }
            noValidate
          >
            {/* FULL NAME */}

            <div className="professional-registration-field">
              <label htmlFor="professional-full-name">
                Full Name

                <em>
                  *
                </em>
              </label>

              <div className="professional-registration-input">
                <i className="fas fa-user" />

                <input
                  id="professional-full-name"
                  name="full_name"
                  type="text"
                  value={
                    formData.full_name
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter Full Name"
                  autoComplete="name"
                  disabled={
                    submitting
                  }
                />
              </div>

              {getErrorText(
                fieldErrors.full_name
              ) && (
                <small className="professional-registration-field-error">
                  {getErrorText(
                    fieldErrors.full_name
                  )}
                </small>
              )}
            </div>

            {/* MOBILE */}

            <div className="professional-registration-field">
              <label htmlFor="professional-mobile">
                Mobile Number

                <em>
                  *
                </em>
              </label>

              <div className="professional-registration-input">
                <i className="fas fa-mobile-screen-button" />

                <input
                  id="professional-mobile"
                  name="phone"
                  type="tel"
                  value={
                    formData.phone
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="10-digit Mobile Number"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  disabled={
                    submitting
                  }
                />
              </div>

              {getErrorText(
                fieldErrors.phone
              ) && (
                <small className="professional-registration-field-error">
                  {getErrorText(
                    fieldErrors.phone
                  )}
                </small>
              )}
            </div>

            {/* EMAIL - OPTIONAL */}

            <div className="professional-registration-field">
              <div className="professional-registration-label-row">
                <label htmlFor="professional-email">
                  Email ID
                </label>

                <span>
                  Optional
                </span>
              </div>

              <div className="professional-registration-input">
                <i className="fas fa-envelope" />

                <input
                  id="professional-email"
                  name="email"
                  type="email"
                  value={
                    formData.email
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter Email ID (Optional)"
                  autoComplete="email"
                  disabled={
                    submitting
                  }
                />
              </div>

              {getErrorText(
                fieldErrors.email
              ) && (
                <small className="professional-registration-field-error">
                  {getErrorText(
                    fieldErrors.email
                  )}
                </small>
              )}
            </div>

            {/* DOB - OPTIONAL */}

            <div className="professional-registration-field">
              <div className="professional-registration-label-row">
                <label htmlFor="professional-dob">
                  Date of Birth
                </label>

                <span>
                  Optional
                </span>
              </div>

              <div className="professional-registration-input">
                <i className="fas fa-calendar-days" />

                <input
                  id="professional-dob"
                  name="dob"
                  type="date"
                  value={
                    formData.dob
                  }
                  onChange={
                    handleInputChange
                  }
                  disabled={
                    submitting
                  }
                />
              </div>

              {getErrorText(
                fieldErrors.dob
              ) && (
                <small className="professional-registration-field-error">
                  {getErrorText(
                    fieldErrors.dob
                  )}
                </small>
              )}
            </div>

            {/* PASSWORD */}

            <div className="professional-registration-field">
              <label htmlFor="professional-password">
                Password / PIN Setup

                <em>
                  *
                </em>
              </label>

              <div className="professional-registration-input">
                <i className="fas fa-lock" />

                <input
                  id="professional-password"
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
                  disabled={
                    submitting
                  }
                />

                <button
                  type="button"
                  className="professional-registration-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (
                        previous
                      ) =>
                        !previous
                    )
                  }
                  disabled={
                    submitting
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

              {getErrorText(
                fieldErrors.password
              ) && (
                <small className="professional-registration-field-error">
                  {getErrorText(
                    fieldErrors.password
                  )}
                </small>
              )}
            </div>

            {/* REFERRAL */}

            <div className="professional-registration-field">
              <div className="professional-registration-label-row">
                <label htmlFor="professional-referral">
                  Referral ID
                </label>

                <span>
                  Optional
                </span>
              </div>

              <div className="professional-registration-input">
                <i className="fas fa-user-plus" />

                <input
                  id="professional-referral"
                  name="referral"
                  type="text"
                  value={
                    formData.referral
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter Referral ID"
                  disabled={
                    submitting
                  }
                />
              </div>
            </div>

            {/* PROFILE PHOTO */}

            <div className="professional-registration-field full-width">
              <div className="professional-registration-label-row">
                <label>
                  Profile Photo
                </label>

                <span>
                  Optional
                </span>
              </div>

              {!formData.profile_photo ? (
                <button
                  type="button"
                  className="professional-registration-upload"
                  onClick={() =>
                    fileInputRef
                      .current
                      ?.click()
                  }
                  disabled={
                    submitting
                  }
                >
                  <span className="professional-registration-upload-icon">
                    <i className="fas fa-user" />
                  </span>

                  <div>
                    <strong>
                      Upload your profile
                      photo
                    </strong>

                    <small>
                      You can also add or
                      change this later.
                    </small>
                  </div>

                  <span className="professional-registration-upload-button">
                    <i className="fas fa-cloud-arrow-up" />

                    Choose Photo
                  </span>
                </button>
              ) : (
                <div className="professional-registration-photo-selected">
                  <div className="professional-registration-photo-preview">
                    {photoPreview && (
                      <img
                        src={
                          photoPreview
                        }
                        alt="Profile preview"
                      />
                    )}
                  </div>

                  <div className="professional-registration-photo-details">
                    <strong>
                      {
                        formData
                          .profile_photo
                          .name
                      }
                    </strong>

                    <span>
                      Profile photo
                      selected
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleRemovePhoto
                    }
                    disabled={
                      submitting
                    }
                  >
                    <i className="fas fa-xmark" />
                  </button>
                </div>
              )}

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                onChange={
                  handleProfilePhotoChange
                }
                hidden
              />

              {getErrorText(
                fieldErrors.profile_photo
              ) && (
                <small className="professional-registration-field-error">
                  {getErrorText(
                    fieldErrors.profile_photo
                  )}
                </small>
              )}
            </div>

            {/* SECURITY */}

            <div className="professional-registration-security-note full-width">
              <i className="fas fa-shield-halved" />

              <span>
                Your registration
                details are securely
                processed by INMBA.
              </span>
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              className="professional-registration-submit"
              disabled={
                submitting
              }
            >
              {submitting ? (
                <>
                  <i className="fas fa-circle-notch fa-spin" />

                  <span>
                    Submitting...
                  </span>
                </>
              ) : (
                <>
                  <span>
                    Submit Basic KYC
                  </span>

                  <i className="fas fa-arrow-right" />
                </>
              )}
            </button>
          </form>

          {/* EXISTING LOGIN */}

          <div className="professional-registration-login">
            <span>
              Already have a
              Professional account?
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

          <div className="professional-registration-home">
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