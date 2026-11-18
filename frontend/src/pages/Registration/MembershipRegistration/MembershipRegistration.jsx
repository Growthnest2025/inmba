import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import {
  registerMember,
  validateRegistrationEmail,
  validateRegistrationPhone,
} from "../../../services/registration.service";
import { getApiErrorMessage, getFieldErrors } from "../../../utils/apiError";
import { toText, asObject } from "../../../utils/commonHelpers";

import "@fortawesome/fontawesome-free/css/all.min.css";
import "./MembershipRegistration.css";

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM_DATA = {
  full_name: "",
  phone: "",
  email: "",
  dob: "",
  aadhar: "",
  pan: "",
  password: "",
  referral: "",
  profile_pic: null,
};

/* =========================================================
   HELPERS
========================================================= */

const getErrorText = (value) => {
  if (Array.isArray(value)) {
    return toText(value[0]);
  }
  if (value && typeof value === "object") {
    return toText(value.message ?? value.msg ?? value.error);
  }
  return toText(value);
};

/* =========================================================
   MEMBERSHIP REGISTRATION COMPONENT (CIVILIAN)
========================================================= */

export default function MembershipRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const pageRef = useRef(null);

  const scrollToTop = () => {
    if (pageRef.current && typeof pageRef.current.scrollTo === "function") {
      pageRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* =======================================================
     REFERRAL FROM URL
  ======================================================= */

  const referralFromUrl = useMemo(() => {
    const ref = searchParams.get("ref") ?? searchParams.get("referral");
    return toText(ref).replace(/\s/g, "").slice(0, 50);
  }, [searchParams]);

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [formData, setFormData] = useState({
    ...INITIAL_FORM_DATA,
    referral: referralFromUrl,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  /* =======================================================
     PHOTO HANDLERS
  ======================================================= */

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors((prev) => ({
          ...prev,
          profile_pic: "Photo size must be less than 5 MB.",
        }));
        return;
      }
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoPreview(URL.createObjectURL(file));
      setFormData((prev) => ({
        ...prev,
        profile_pic: file,
      }));
      setFieldErrors((prev) => ({
        ...prev,
        profile_pic: "",
      }));
    }
  };

  const handleRemovePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview("");
    setFormData((prev) => ({
      ...prev,
      profile_pic: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =======================================================
     INPUT CHANGE
  ======================================================= */

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    let nextValue = value;
    if (name === "phone") {
      nextValue = value.replace(/\D/g, "").slice(0, 10);
    }
    if (name === "aadhar") {
      nextValue = value.replace(/\D/g, "").slice(0, 12);
    }
    if (name === "pan") {
      nextValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    }
    if (name === "referral") {
      nextValue = value.replace(/\s/g, "").slice(0, 50);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setFormError("");
  };

  /* =======================================================
     FORM VALIDATION
  ======================================================= */

  const validateForm = () => {
    const errors = {};

    if (!toText(formData.full_name)) {
      errors.full_name = "Full name is required.";
    }

    const phoneValidation = validateRegistrationPhone(formData.phone);
    if (!phoneValidation.valid) {
      errors.phone = phoneValidation.error;
    }

    if (formData.email) {
      const emailValidation = validateRegistrationEmail(formData.email);
      if (!emailValidation.valid) {
        errors.email = emailValidation.error;
      }
    }

    if (formData.dob) {
      const selectedDate = new Date(`${formData.dob}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (Number.isNaN(selectedDate.getTime()) || selectedDate >= today) {
        errors.dob = "Enter a valid date of birth.";
      }
    }

    if (formData.aadhar) {
      if (!/^\d{12}$/.test(formData.aadhar)) {
        errors.aadhar = "Aadhaar must be a 12-digit number.";
      }
    }

    if (formData.pan) {
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
        errors.pan = "Enter a valid 10-character PAN (e.g. ABCDE1234F).";
      }
    }

    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 5) {
      errors.password = "Password must contain at least 5 characters.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError("Please correct the highlighted fields.");
      return false;
    }

    setFormError("");
    return true;
  };

  /* =======================================================
     HANDLE SUBMIT
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setFormError("");

    if (!validateForm()) {
      scrollToTop();
      return;
    }

    try {
      setSubmitting(true);
      setFieldErrors({});

      const result = await registerMember({
        full_name: formData.full_name,
        first_name: formData.full_name,
        last_name: "",
        father_name: "",
        dob: formData.dob || "",
        email: formData.email || "",
        phone: formData.phone,
        gender: "",
        marital_status: "",
        nationality: "Indian",
        occupation: "",
        education: "",
        membership_type: "Civilian Member",
        referral: formData.referral || "",
        aadhar: formData.aadhar || "",
        aadhar_number: formData.aadhar || "",
        pan: formData.pan || "",
        pan_number: formData.pan || "",
        password: formData.password,
        confirm_password: formData.password,
        profile_pic: formData.profile_pic,
      });

      toast.success(
        result.message || "Civilian registration completed successfully!"
      );

      const newLoginId = toText(
        result.loginId ||
          result.login_id ||
          result.member?.login_id ||
          result.data?.loginId ||
          result.data?.login_id ||
          result.data?.member?.login_id,
        ""
      );

      if (newLoginId && typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem("civilian_login_id", newLoginId);
          window.localStorage.setItem("civilian_login_id", newLoginId);
          window.sessionStorage.setItem("inmba_civilian_login_id", newLoginId);
          window.sessionStorage.setItem("last_registered_login_id", newLoginId);
        } catch {
          // Storage fallback
        }
      }

      navigate(
        `/success${newLoginId ? `?loginId=${encodeURIComponent(newLoginId)}` : ""}`,
        {
          state: {
            loginId: newLoginId,
            registration: result,
            registrationResult: result,
          },
        }
      );
    } catch (requestError) {
      const apiFieldErrors = asObject(requestError.fieldErrors);
      const utilityErrors = asObject(getFieldErrors(requestError));

      setFieldErrors({
        ...utilityErrors,
        ...apiFieldErrors,
      });

      setFormError(
        getApiErrorMessage(
          requestError,
          "Unable to complete Civilian registration."
        )
      );

      scrollToTop();
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <main ref={pageRef} className="civilian-registration-page">
      <div className="civilian-registration-container">
        {/* TOP BRAND BAR */}
        <header className="civilian-registration-top-header">
          <Link to="/" className="civilian-registration-top-brand">
            <span className="civilian-registration-brand-icon">
              <i className="fas fa-id-card-clip" aria-hidden="true" />
            </span>
            <div className="civilian-registration-brand-text">
              <span>INMBA</span>
              <strong>Civilian Member</strong>
            </div>
          </Link>

          <div className="civilian-registration-top-actions">
            <span>Already have an account?</span>
            <Link to="/login" className="civilian-top-login-btn">
              Login
            </Link>
          </div>
        </header>

        {/* HERO TITLE CENTER */}
        <section className="civilian-registration-hero-center">
          <h1>INMBA Civilian Membership (Basic)</h1>
          <p>
            Enter the details required to create your basic civilian membership
            account. Mobile OTP verification is not required.
          </p>
        </section>

        {/* TOGGLE BUTTON FOR REGISTRATION DETAILS & BENEFITS */}
        <div className="civilian-guide-toggle-wrap">
          <button
            type="button"
            className="civilian-guide-toggle-btn"
            onClick={() => setShowGuide((prev) => !prev)}
            aria-expanded={showGuide}
          >
            <span className="civilian-guide-toggle-icon">
              <i className="fas fa-circle-info" aria-hidden="true" />
            </span>
            <span>
              {showGuide
                ? "Hide Registration Details & Benefits"
                : "View Registration Details & Benefits"}
            </span>
            <i
              className={`fas fa-chevron-${showGuide ? "up" : "down"} civilian-guide-toggle-arrow`}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* COLLAPSIBLE GUIDE CARD */}
        {showGuide && (
          <section className="civilian-guide-card">
            <div className="civilian-guide-benefits-grid">
              <div className="civilian-guide-benefit-item">
                <span className="civilian-guide-benefit-icon">
                  <i className="fas fa-mobile-screen-button" aria-hidden="true" />
                </span>
                <div>
                  <strong>No OTP Required</strong>
                  <p>Register with just your mobile number.</p>
                </div>
              </div>

              <div className="civilian-guide-benefit-item">
                <span className="civilian-guide-benefit-icon">
                  <i className="fas fa-users" aria-hidden="true" />
                </span>
                <div>
                  <strong>Up to 3 Accounts per Number</strong>
                  <p>Up to 3 Civilian accounts can share one mobile number.</p>
                </div>
              </div>

              <div className="civilian-guide-benefit-item">
                <span className="civilian-guide-benefit-icon">
                  <i className="fas fa-id-card" aria-hidden="true" />
                </span>
                <div>
                  <strong>No KYC for Basic</strong>
                  <p>Aadhaar, PAN and bank details are asked only when you upgrade.</p>
                </div>
              </div>
            </div>

            <div className="civilian-guide-steps-grid">
              <div className="civilian-guide-box">
                <h3>How it works</h3>
                <ol className="civilian-guide-steps-list">
                  <li>
                    <span>1</span>
                    <div>
                      <strong>Fill in your details</strong>
                      <p>Enter your name and mobile number.</p>
                    </div>
                  </li>
                  <li>
                    <span>2</span>
                    <div>
                      <strong>Set a password / PIN</strong>
                      <p>Create the password you will use to log in.</p>
                    </div>
                  </li>
                  <li>
                    <span>3</span>
                    <div>
                      <strong>Submit your registration</strong>
                      <p>Your Civilian login ID is generated for you.</p>
                    </div>
                  </li>
                  <li>
                    <span>4</span>
                    <div>
                      <strong>Log in</strong>
                      <p>Use your login ID and password to open your account.</p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="civilian-guide-box">
                <h3>What you need</h3>
                <ul className="civilian-guide-need-list">
                  <li>
                    <i className="fas fa-circle-check" aria-hidden="true" />
                    <span>A 10-digit mobile number</span>
                  </li>
                  <li>
                    <i className="fas fa-circle-check" aria-hidden="true" />
                    <span>A password or PIN (minimum 5 characters)</span>
                  </li>
                  <li>
                    <i className="fas fa-circle-check" aria-hidden="true" />
                    <span>Optional: email, date of birth, photo, referral ID</span>
                  </li>
                </ul>

                <p className="civilian-guide-helpline">
                  <i className="fas fa-headset" aria-hidden="true" />
                  <span>
                    Need help? Call Admin:{" "}
                    <a href="tel:+918940369361">+91 89403 69361</a>
                  </span>
                </p>
              </div>
            </div>
          </section>
        )}

        {/* MAIN FORM CARD */}
        <div className="civilian-registration-form-unified">
          <div className="civilian-registration-form-wrapper">
            {/* HEADING */}
            <div className="civilian-registration-heading">
              <span className="civilian-registration-heading-icon">
                <i className="fas fa-id-card" aria-hidden="true" />
              </span>
              <div>
                <h2>Civilian Basic KYC</h2>
                <p>Create your Civilian Membership account.</p>
              </div>
            </div>

            {/* 90-DAY POLICY NOTICE */}
            <div
              className="civilian-registration-policy-banner"
              style={{
                backgroundColor: "#eff6ff",
                border: "1px solid #93c5fd",
                borderRadius: "10px",
                padding: "14px 16px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                color: "#1e40af",
              }}
            >
              <i
                className="fas fa-shield-halved"
                style={{ fontSize: "1.3rem", marginTop: "2px", color: "#2563eb", flexShrink: 0 }}
                aria-hidden="true"
              />
              <div>
                <strong style={{ display: "block", marginBottom: "3px", fontSize: "0.95rem" }}>
                  Important Aadhaar Policy (90-Day Notice)
                </strong>
                <span style={{ fontSize: "0.85rem", lineHeight: "1.45", display: "block" }}>
                  Aadhaar entry is optional during registration, but <strong>mandatory within 90 days</strong> of joining. Accounts without Aadhaar verification after 90 days will be permanently terminated. One mobile number can be used to register up to 3 civilian accounts with separate login IDs.
                </span>
              </div>
            </div>

            {/* REFERRAL NOTICE */}
            {referralFromUrl && (
              <div className="civilian-registration-referral-notice">
                <i className="fas fa-user-plus" aria-hidden="true" />
                <div>
                  <strong>Referral Applied</strong>
                  <span>
                    Referral ID <b>{referralFromUrl}</b> was added from your
                    membership link.
                  </span>
                </div>
              </div>
            )}

            {/* FORM ERROR */}
            {formError && (
              <div className="civilian-registration-alert" role="alert">
                <i className="fas fa-circle-exclamation" aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            {/* FORM */}
            <form
              className="civilian-registration-form"
              onSubmit={handleSubmit}
              noValidate
            >
              {/* FULL NAME */}
              <div className="civilian-registration-field">
                <label htmlFor="civilian-full-name">
                  Full Name
                  <em>*</em>
                </label>
                <div className="civilian-registration-input">
                  <i className="fas fa-user" aria-hidden="true" />
                  <input
                    id="civilian-full-name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter Full Name"
                    autoComplete="name"
                    disabled={submitting}
                  />
                </div>
                {getErrorText(fieldErrors.full_name) && (
                  <small className="civilian-registration-field-error">
                    {getErrorText(fieldErrors.full_name)}
                  </small>
                )}
              </div>

              {/* MOBILE NUMBER */}
              <div className="civilian-registration-field">
                <label htmlFor="civilian-mobile">
                  Mobile Number
                  <em>*</em>
                </label>
                <div className="civilian-registration-input">
                  <i className="fas fa-mobile-screen-button" aria-hidden="true" />
                  <input
                    id="civilian-mobile"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="10-digit Mobile Number"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    disabled={submitting}
                  />
                </div>
                {getErrorText(fieldErrors.phone) && (
                  <small className="civilian-registration-field-error">
                    {getErrorText(fieldErrors.phone)}
                  </small>
                )}
              </div>

              {/* EMAIL ID - OPTIONAL */}
              <div className="civilian-registration-field">
                <div className="civilian-registration-label-row">
                  <label htmlFor="civilian-email">Email ID</label>
                  <span>Optional</span>
                </div>
                <div className="civilian-registration-input">
                  <i className="fas fa-envelope" aria-hidden="true" />
                  <input
                    id="civilian-email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter Email ID (Optional)"
                    autoComplete="email"
                    disabled={submitting}
                  />
                </div>
                {getErrorText(fieldErrors.email) && (
                  <small className="civilian-registration-field-error">
                    {getErrorText(fieldErrors.email)}
                  </small>
                )}
              </div>

              {/* DATE OF BIRTH - OPTIONAL */}
              <div className="civilian-registration-field">
                <div className="civilian-registration-label-row">
                  <label htmlFor="civilian-dob">Date of Birth</label>
                  <span>Optional</span>
                </div>
                <div className="civilian-registration-input">
                  <i className="fas fa-calendar-days" aria-hidden="true" />
                  <input
                    id="civilian-dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split("T")[0]}
                    disabled={submitting}
                  />
                </div>
                {getErrorText(fieldErrors.dob) && (
                  <small className="civilian-registration-field-error">
                    {getErrorText(fieldErrors.dob)}
                  </small>
                )}
              </div>

              {/* AADHAAR CARD - OPTIONAL (FORMAT VALIDATED) */}
              <div className="civilian-registration-field">
                <div className="civilian-registration-label-row">
                  <label htmlFor="civilian-aadhar">Aadhaar Card Number</label>
                  <span>Optional (Mandatory within 90 days)</span>
                </div>
                <div className="civilian-registration-input">
                  <i className="fas fa-id-card" aria-hidden="true" />
                  <input
                    id="civilian-aadhar"
                    name="aadhar"
                    type="text"
                    inputMode="numeric"
                    value={formData.aadhar}
                    onChange={handleInputChange}
                    placeholder="12-digit Aadhaar Number"
                    maxLength={12}
                    disabled={submitting}
                  />
                </div>
                {getErrorText(fieldErrors.aadhar) && (
                  <small className="civilian-registration-field-error">
                    {getErrorText(fieldErrors.aadhar)}
                  </small>
                )}
              </div>

              {/* PAN CARD - OPTIONAL (FORMAT VALIDATED) */}
              <div className="civilian-registration-field">
                <div className="civilian-registration-label-row">
                  <label htmlFor="civilian-pan">PAN Card Number</label>
                  <span>Optional</span>
                </div>
                <div className="civilian-registration-input">
                  <i className="fas fa-credit-card" aria-hidden="true" />
                  <input
                    id="civilian-pan"
                    name="pan"
                    type="text"
                    value={formData.pan}
                    onChange={handleInputChange}
                    placeholder="10-character PAN (e.g. ABCDE1234F)"
                    maxLength={10}
                    style={{ textTransform: "uppercase" }}
                    disabled={submitting}
                  />
                </div>
                {getErrorText(fieldErrors.pan) && (
                  <small className="civilian-registration-field-error">
                    {getErrorText(fieldErrors.pan)}
                  </small>
                )}
              </div>

              {/* PASSWORD / PIN SETUP */}
              <div className="civilian-registration-field">
                <label htmlFor="civilian-password">
                  Password / PIN Setup
                  <em>*</em>
                </label>
                <div className="civilian-registration-input">
                  <i className="fas fa-lock" aria-hidden="true" />
                  <input
                    id="civilian-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Minimum 5 characters"
                    autoComplete="new-password"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="civilian-registration-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={submitting}
                  >
                    <i
                      className={showPassword ? "far fa-eye-slash" : "far fa-eye"}
                      aria-hidden="true"
                    />
                  </button>
                </div>
                {getErrorText(fieldErrors.password) && (
                  <small className="civilian-registration-field-error">
                    {getErrorText(fieldErrors.password)}
                  </small>
                )}
              </div>

              {/* REFERRAL ID - OPTIONAL */}
              <div className="civilian-registration-field">
                <div className="civilian-registration-label-row">
                  <label htmlFor="civilian-referral">Referral ID</label>
                  <span>Optional</span>
                </div>
                <div className="civilian-registration-input">
                  <i className="fas fa-user-plus" aria-hidden="true" />
                  <input
                    id="civilian-referral"
                    name="referral"
                    type="text"
                    value={formData.referral}
                    onChange={handleInputChange}
                    placeholder="Enter Referral ID"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* PROFILE PHOTO - OPTIONAL (FULL WIDTH) */}
              <div className="civilian-registration-field full-width">
                <div className="civilian-registration-label-row">
                  <label>Profile Photo</label>
                  <span>Optional</span>
                </div>

                {!formData.profile_pic ? (
                  <button
                    type="button"
                    className="civilian-registration-upload"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={submitting}
                  >
                    <span className="civilian-registration-upload-icon">
                      <i className="fas fa-user" aria-hidden="true" />
                    </span>
                    <div>
                      <strong>Upload your profile photo</strong>
                      <small>You can also add or change this later.</small>
                    </div>
                    <span className="civilian-registration-upload-button">
                      <i className="fas fa-cloud-arrow-up" aria-hidden="true" />
                      Choose Photo
                    </span>
                  </button>
                ) : (
                  <div className="civilian-registration-photo-selected">
                    <div className="civilian-registration-photo-preview">
                      {photoPreview && (
                        <img src={photoPreview} alt="Profile preview" />
                      )}
                    </div>
                    <div className="civilian-registration-photo-details">
                      <strong>{formData.profile_pic.name}</strong>
                      <span>Profile photo selected</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={submitting}
                      aria-label="Remove photo"
                    >
                      <i className="fas fa-xmark" aria-hidden="true" />
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  hidden
                />

                {getErrorText(fieldErrors.profile_pic) && (
                  <small className="civilian-registration-field-error">
                    {getErrorText(fieldErrors.profile_pic)}
                  </small>
                )}
              </div>

              {/* SECURITY NOTE (FULL WIDTH) */}
              <div className="civilian-registration-security-note full-width">
                <i className="fas fa-shield-halved" aria-hidden="true" />
                <span>
                  Your registration details are securely processed by INMBA.
                </span>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="civilian-registration-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <i
                      className="fas fa-circle-notch fa-spin"
                      aria-hidden="true"
                    />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Basic KYC</span>
                    <i className="fas fa-arrow-right" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {/* EXISTING ACCOUNT LOGIN */}
            <div className="civilian-registration-login">
              <span>Already have a Civilian account?</span>
              <Link to="/login">Login</Link>
            </div>

            {/* BACK TO HOME */}
            <div className="civilian-registration-home">
              <Link to="/">
                <i className="fas fa-arrow-left" aria-hidden="true" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
