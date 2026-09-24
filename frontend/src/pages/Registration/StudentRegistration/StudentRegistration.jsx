import React, {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  submitStudentRegistration,
  validateStudentDocument,
  validateStudentEmail,
  validateStudentMobile,
} from "../../../services/studentRegistration.service";

import {
  getApiErrorMessage,
  getFieldErrors,
} from "../../../utils/apiError";

import "./StudentRegistration.css";

/* ========================================
   EDUCATION LEVELS
======================================== */

const EDUCATION_LEVELS = [
  {
    value: "School",
    label: "School Student",
    icon: "fas fa-school",
  },
  {
    value: "Under Graduate",
    label: "Under Graduate",
    icon: "fas fa-graduation-cap",
  },
  {
    value: "Post Graduate",
    label: "Post Graduate",
    icon: "fas fa-user-graduate",
  },
];

/* ========================================
   INITIAL DATA
======================================== */

const INITIAL_FORM_DATA = {
  fullname: "",
  dob: "",
  gender: "",
  mobile: "",
  email: "",

  education_level: "",

  school_name: "",
  school_class: "",
  board: "",
  school_city: "",

  ug_college: "",
  ug_degree: "",
  ug_department: "",
  ug_year: "",

  pg_college: "",
  pg_degree: "",
  pg_specialization: "",
  pg_semester: "",

  skills: "",
  student_id: "",

  marksheet: null,
  bonafide: null,
  govt_id: null,

  declaration: false,
};

/* ========================================
   HELPERS
======================================== */

const asObject = (value) => {
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
   STUDENT REGISTRATION
======================================== */

export default function StudentRegistration() {
  const [
    searchParams,
  ] =
    useSearchParams();

  const marksheetInputRef =
    useRef(null);

  const bonafideInputRef =
    useRef(null);

  const govtIdInputRef =
    useRef(null);

  const referralId =
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

  const [
    formData,
    setFormData,
  ] =
    useState({
      ...INITIAL_FORM_DATA,
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
    successData,
    setSuccessData,
  ] =
    useState(null);

  /* ========================================
     CURRENT EDUCATION TYPE
  ======================================== */

  const isSchool =
    formData.education_level ===
    "School";

  const isUnderGraduate =
    formData.education_level ===
    "Under Graduate";

  const isPostGraduate =
    formData.education_level ===
    "Post Graduate";

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

    if (name === "mobile") {
      nextValue =
        value
          .replace(/\D/g, "")
          .slice(0, 10);
    }

    if (name === "student_id") {
      nextValue =
        value
          .replace(
            /[^A-Za-z0-9/_-]/g,
            ""
          )
          .slice(0, 100);
    }

    setFormData(
      (
        previousData
      ) => ({
        ...previousData,

        [name]: nextValue,

        /*
          Education level change ஆனதும்
          unrelated education fields clear
          செய்கிறோம்.
        */

        ...(name ===
        "education_level"
          ? {
              school_name: "",
              school_class: "",
              board: "",
              school_city: "",

              ug_college: "",
              ug_degree: "",
              ug_department: "",
              ug_year: "",

              pg_college: "",
              pg_degree: "",
              pg_specialization: "",
              pg_semester: "",
            }
          : {}),
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

  /* ========================================
     FILE CHANGE
  ======================================== */

  const handleFileChange = (
    fieldName,
    event
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const validation =
      validateStudentDocument(
        file,
        {
          required: false,
          maxSizeMb: 5,
        }
      );

    if (!validation.valid) {
      setFieldErrors(
        (
          previousErrors
        ) => ({
          ...previousErrors,

          [fieldName]:
            validation.error,
        })
      );

      toast.error(
        validation.error
      );

      return;
    }

    setFormData(
      (
        previousData
      ) => ({
        ...previousData,

        [fieldName]: file,
      })
    );

    setFieldErrors(
      (
        previousErrors
      ) => ({
        ...previousErrors,

        [fieldName]: "",
      })
    );
  };

  /* ========================================
     REMOVE FILE
  ======================================== */

  const handleRemoveFile = (
    fieldName
  ) => {
    setFormData(
      (
        previousData
      ) => ({
        ...previousData,

        [fieldName]: null,
      })
    );

    setFieldErrors(
      (
        previousErrors
      ) => ({
        ...previousErrors,

        [fieldName]: "",
      })
    );
  };

  /* ========================================
     FORM VALIDATION
  ======================================== */

  const validateForm = () => {
    const errors = {};

    if (
      !toText(
        formData.fullname
      )
    ) {
      errors.fullname =
        "Full name is required.";
    } else if (
      toText(
        formData.fullname
      ).length < 3
    ) {
      errors.fullname =
        "Enter a valid full name.";
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

    if (!formData.gender) {
      errors.gender =
        "Gender is required.";
    }

    const mobileValidation =
      validateStudentMobile(
        formData.mobile
      );

    if (!mobileValidation.valid) {
      errors.mobile =
        mobileValidation.error;
    }

    const emailValidation =
      validateStudentEmail(
        formData.email
      );

    if (!emailValidation.valid) {
      errors.email =
        emailValidation.error;
    }

    if (
      !formData.education_level
    ) {
      errors.education_level =
        "Education level is required.";
    }

    if (isSchool) {
      if (
        !toText(
          formData.school_name
        )
      ) {
        errors.school_name =
          "School name is required.";
      }

      if (
        !toText(
          formData.school_class
        )
      ) {
        errors.school_class =
          "Class is required.";
      }

      if (
        !toText(
          formData.board
        )
      ) {
        errors.board =
          "Education board is required.";
      }

      if (
        !toText(
          formData.school_city
        )
      ) {
        errors.school_city =
          "School city is required.";
      }
    }

    if (isUnderGraduate) {
      if (
        !toText(
          formData.ug_college
        )
      ) {
        errors.ug_college =
          "College name is required.";
      }

      if (
        !toText(
          formData.ug_degree
        )
      ) {
        errors.ug_degree =
          "Degree is required.";
      }

      if (
        !toText(
          formData.ug_department
        )
      ) {
        errors.ug_department =
          "Department is required.";
      }

      if (
        !toText(
          formData.ug_year
        )
      ) {
        errors.ug_year =
          "Study year is required.";
      }
    }

    if (isPostGraduate) {
      if (
        !toText(
          formData.pg_college
        )
      ) {
        errors.pg_college =
          "College name is required.";
      }

      if (
        !toText(
          formData.pg_degree
        )
      ) {
        errors.pg_degree =
          "Postgraduate degree is required.";
      }

      if (
        !toText(
          formData.pg_specialization
        )
      ) {
        errors.pg_specialization =
          "Specialization is required.";
      }

      if (
        !toText(
          formData.pg_semester
        )
      ) {
        errors.pg_semester =
          "Semester is required.";
      }
    }

    [
      "marksheet",
      "bonafide",
      "govt_id",
    ].forEach(
      (fieldName) => {
        if (
          formData[fieldName]
        ) {
          const validation =
            validateStudentDocument(
              formData[fieldName],
              {
                required: false,
                maxSizeMb: 5,
              }
            );

          if (!validation.valid) {
            errors[fieldName] =
              validation.error;
          }
        }
      }
    );

    if (
      !formData.declaration
    ) {
      errors.declaration =
        "Please accept the student membership declaration.";
    }

    setFieldErrors(errors);

    if (
      Object.keys(errors)
        .length > 0
    ) {
      setFormError(
        "Please complete all required student membership details."
      );

      return false;
    }

    return true;
  };

  /* ========================================
     SUBMIT

     Exact API:
     POST /student

     Referral:
     POST /student?ref=...
  ======================================== */

  const handleSubmit =
    async (event) => {
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
          await submitStudentRegistration(
            {
              fullname:
                formData.fullname,

              dob:
                formData.dob,

              gender:
                formData.gender,

              mobile:
                formData.mobile,

              email:
                formData.email,

              education_level:
                formData.education_level,

              school_name:
                formData.school_name,

              school_class:
                formData.school_class,

              board:
                formData.board,

              school_city:
                formData.school_city,

              ug_college:
                formData.ug_college,

              ug_degree:
                formData.ug_degree,

              ug_department:
                formData.ug_department,

              ug_year:
                formData.ug_year,

              pg_college:
                formData.pg_college,

              pg_degree:
                formData.pg_degree,

              pg_specialization:
                formData.pg_specialization,

              pg_semester:
                formData.pg_semester,

              skills:
                formData.skills,

              student_id:
                formData.student_id,

              marksheet:
                formData.marksheet,

              bonafide:
                formData.bonafide,

              govt_id:
                formData.govt_id,
            },
            {
              referral:
                referralId,
            }
          );

        setSuccessData(
          result
        );

        toast.success(
          result.message
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
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
            "Unable to submit student membership application."
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

  /* ========================================
     SUCCESS STATE
  ======================================== */

  if (successData) {
    return (
      <main className="inmba-student-page">
        <section className="inmba-student-success">
          <Link
            to="/"
            className="inmba-student-success-brand"
          >
            INMBA
          </Link>

          <span className="inmba-student-success-icon">
            <i
              className="fas fa-circle-check"
              aria-hidden="true"
            ></i>
          </span>

          <p>
            Student Application Submitted
          </p>

          <h1>
            Application Received
          </h1>

          <span className="inmba-student-success-message">
            {successData.message}
          </span>

          <div className="inmba-student-success-details">
            <article>
              <span>
                Membership
              </span>

              <strong>
                {successData.membershipType ||
                  "Student Member"}
              </strong>
            </article>

            <article>
              <span>
                Status
              </span>

              <strong>
                {successData.paymentStatus ||
                  "Pending"}
              </strong>
            </article>

            {successData.loginId && (
              <article className="inmba-student-success-login">
                <span>
                  Login ID
                </span>

                <strong>
                  {successData.loginId}
                </strong>
              </article>
            )}
          </div>

          <div className="inmba-student-success-note">
            <i
              className="fas fa-user-shield"
              aria-hidden="true"
            ></i>

            <p>
              INMBA administrator will review your student details
              and uploaded documents.
            </p>
          </div>

          <div className="inmba-student-success-actions">
            <Link
              to="/login"
              state={{
                prefillId:
                  successData.loginId ||
                  "",

                message:
                  successData.loginId
                    ? "Student application submitted. Login using your generated ID after approval."
                    : "Student application submitted successfully.",
              }}
            >
              Member Login
            </Link>

            <Link to="/">
              Back to Home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="inmba-student-page">
      <div className="inmba-student-container">
        {/* HEADER */}

        <header className="inmba-student-topbar">
          <Link
            to="/"
            className="inmba-student-brand"
          >
            <span>
              I
            </span>

            <div>
              <strong>
                INMBA
              </strong>

              <small>
                Student Membership
              </small>
            </div>
          </Link>

          <div>
            <span>
              Existing member?
            </span>

            <Link to="/login">
              Login
            </Link>
          </div>
        </header>

        {/* HERO */}

        <section className="inmba-student-hero">
          <div>
            <p>
              Learn • Connect • Grow
            </p>

            <h1>
              Student Membership Application
            </h1>

            <span>
              Join the INMBA student community and connect with
              professional learning, networking and career
              opportunities.
            </span>
          </div>

          <div className="inmba-student-hero-card">
            <i
              className="fas fa-graduation-cap"
              aria-hidden="true"
            ></i>

            <strong>
              Student Member
            </strong>

            <span>
              Verification required
            </span>
          </div>
        </section>

        {referralId && (
          <section className="inmba-student-referral">
            <i
              className="fas fa-user-plus"
              aria-hidden="true"
            ></i>

            <div>
              <strong>
                Referral Applied
              </strong>

              <span>
                Referral ID: {referralId}
              </span>
            </div>
          </section>
        )}

        {formError && (
          <div
            className="inmba-student-alert"
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
          className="inmba-student-form"
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          {/* PERSONAL DETAILS */}

          <StudentSection
            icon="fas fa-user"
            title="Personal Information"
            description="Enter the student's basic identity and contact details."
          >
            <div className="inmba-student-grid">
              <StudentField
                id="student-fullname"
                name="fullname"
                label="Full Name"
                value={
                  formData.fullname
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.fullname
                  )
                }
                placeholder="Enter student full name"
                autoComplete="name"
                required
                disabled={
                  submitting
                }
              />

              <StudentField
                id="student-dob"
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

              <StudentSelect
                id="student-gender"
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
                placeholder="Select gender"
                options={[
                  "Male",
                  "Female",
                  "Other",
                ]}
                required
                disabled={
                  submitting
                }
              />

              <StudentField
                id="student-mobile"
                name="mobile"
                label="Mobile Number"
                value={
                  formData.mobile
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.mobile
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

              <StudentField
                id="student-email"
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
                placeholder="student@email.com"
                autoComplete="email"
                required
                disabled={
                  submitting
                }
              />

              <StudentField
                id="student-id"
                name="student_id"
                label="Student ID"
                value={
                  formData.student_id
                }
                onChange={
                  handleInputChange
                }
                error={
                  getErrorText(
                    fieldErrors.student_id
                  )
                }
                placeholder="School or college student ID"
                optional
                disabled={
                  submitting
                }
              />
            </div>
          </StudentSection>

          {/* EDUCATION LEVEL */}

          <StudentSection
            icon="fas fa-book-open"
            title="Education Information"
            description="Select the current education level and complete the relevant details."
          >
            <div className="inmba-student-levels">
              {EDUCATION_LEVELS.map(
                (level) => (
                  <label
                    key={
                      level.value
                    }
                    className={
                      formData.education_level ===
                      level.value
                        ? "inmba-student-level-active"
                        : ""
                    }
                  >
                    <input
                      type="radio"
                      name="education_level"
                      value={
                        level.value
                      }
                      checked={
                        formData.education_level ===
                        level.value
                      }
                      onChange={
                        handleInputChange
                      }
                      disabled={
                        submitting
                      }
                    />

                    <i
                      className={
                        level.icon
                      }
                      aria-hidden="true"
                    ></i>

                    <span>
                      {level.label}
                    </span>
                  </label>
                )
              )}
            </div>

            {getErrorText(
              fieldErrors.education_level
            ) && (
              <small className="inmba-student-field-error">
                {getErrorText(
                  fieldErrors.education_level
                )}
              </small>
            )}

            {isSchool && (
              <div className="inmba-student-grid inmba-student-conditional">
                <StudentField
                  id="student-school-name"
                  name="school_name"
                  label="School Name"
                  value={
                    formData.school_name
                  }
                  onChange={
                    handleInputChange
                  }
                  error={
                    getErrorText(
                      fieldErrors.school_name
                    )
                  }
                  placeholder="Enter school name"
                  required
                  disabled={
                    submitting
                  }
                />

                <StudentField
                  id="student-school-class"
                  name="school_class"
                  label="Current Class"
                  value={
                    formData.school_class
                  }
                  onChange={
                    handleInputChange
                  }
                  error={
                    getErrorText(
                      fieldErrors.school_class
                    )
                  }
                  placeholder="Example: 12th Standard"
                  required
                  disabled={
                    submitting
                  }
                />

                <StudentField
                  id="student-board"
                  name="board"
                  label="Education Board"
                  value={
                    formData.board
                  }
                  onChange={
                    handleInputChange
                  }
                  error={
                    getErrorText(
                      fieldErrors.board
                    )
                  }
                  placeholder="State Board, CBSE, ICSE"
                  required
                  disabled={
                    submitting
                  }
                />

                <StudentField
                  id="student-school-city"
                  name="school_city"
                  label="School City"
                  value={
                    formData.school_city
                  }
                  onChange={
                    handleInputChange
                  }
                  error={
                    getErrorText(
                      fieldErrors.school_city
                    )
                  }
                  placeholder="Enter city"
                  required
                  disabled={
                    submitting
                  }
                />
              </div>
            )}

            {isUnderGraduate && (
              <div className="inmba-student-grid inmba-student-conditional">
                <StudentField
                  id="student-ug-college"
                  name="ug_college"
                  label="College Name"
                  value={
                    formData.ug_college
                  }
                  onChange={
                    handleInputChange
                  }
                  error={
                    getErrorText(
                      fieldErrors.ug_college
                    )
                  }
                  placeholder="Enter college name"
                  required
                  disabled={
                    submitting
                  }
                />

                <StudentField
                  id="student-ug-degree"
                  name="ug_degree"
                  label="Degree"
                  value={
                    formData.ug_degree
                  }
                  onChange={
                    handleInputChange
                  }
                  error={
                    getErrorText(
                      fieldErrors.ug_degree
                    )
                  }
                  placeholder="Example: B.E, B.Com, B.Sc"
                  required
                  disabled={
                    submitting
                  }
                />

                <StudentField
                  id="student-ug-department"
                  name="ug_department"
                  label="Department"
                  value={
                    formData.ug_department
                  }
                  onChange={
                    handleInputChange
                  }
                  error={
                    getErrorText(
                      fieldErrors.ug_department
                    )
                  }
                  placeholder="Enter department"
                  required
                  disabled={
                    submitting
                  }
                />

                <StudentField
                  id="student-ug-year"
                  name="ug_year"
                  label="Current Year"
                  value={
                    formData.ug_year
                  }
                  onChange={
                    handleInputChange
                  }
                  error={
                    getErrorText(
                      fieldErrors.ug_year
                    )
                  }
                  placeholder="Example: 3rd Year"
                  required
                  disabled={
                    submitting
                  }
                />
              </div>
            )}

            {isPostGraduate && (
              <div className="inmba-student-grid inmba-student-conditional">
                <StudentField
                  id="student-pg-college"
                  name="pg_college"
                  label="College / University"
                  value={
                    formData.pg_college
                  }
                  onChange={
                    handleInputChange
                  }
                  error={
                    getErrorText(
                      fieldErrors.pg_college
                    )
                  }
                  placeholder="Enter college or university"
                  required
                  disabled={
                    submitting
                  }
                />

                <StudentField
                  id="student-pg-degree"
                  name="pg_degree"
                  label="Postgraduate Degree"
                  value={
                    formData.pg_degree
                  }
                  onChange={
                    handleInputChange
                  }
                  error={
                    getErrorText(
                      fieldErrors.pg_degree
                    )
                  }
                  placeholder="Example: MBA, M.E, M.Sc"
                  required
                  disabled={
                    submitting
                  }
                />

                <StudentField
                  id="student-pg-specialization"
                  name="pg_specialization"
                  label="Specialization"
                  value={
                    formData.pg_specialization
                  }
                  onChange={
                    handleInputChange
                  }
                  error={
                    getErrorText(
                      fieldErrors.pg_specialization
                    )
                  }
                  placeholder="Enter specialization"
                  required
                  disabled={
                    submitting
                  }
                />

                <StudentField
                  id="student-pg-semester"
                  name="pg_semester"
                  label="Current Semester"
                  value={
                    formData.pg_semester
                  }
                  onChange={
                    handleInputChange
                  }
                  error={
                    getErrorText(
                      fieldErrors.pg_semester
                    )
                  }
                  placeholder="Example: Semester 2"
                  required
                  disabled={
                    submitting
                  }
                />
              </div>
            )}

            <div className="inmba-student-skills">
              <label htmlFor="student-skills">
                Skills

                <small>
                  Optional
                </small>
              </label>

              <textarea
                id="student-skills"
                name="skills"
                value={
                  formData.skills
                }
                onChange={
                  handleInputChange
                }
                placeholder="Example: Leadership, Coding, Communication, Design"
                rows={4}
                maxLength={1000}
                disabled={
                  submitting
                }
              ></textarea>
            </div>
          </StudentSection>

          {/* DOCUMENTS */}

          <StudentSection
            icon="fas fa-file-shield"
            title="Student Documents"
            description="Upload available academic and identity documents."
          >
            <div className="inmba-student-upload-grid">
              <StudentUpload
                title="Marksheet"
                description="Latest academic marksheet"
                fieldName="marksheet"
                file={
                  formData.marksheet
                }
                error={
                  getErrorText(
                    fieldErrors.marksheet
                  )
                }
                inputRef={
                  marksheetInputRef
                }
                onChange={
                  handleFileChange
                }
                onRemove={
                  handleRemoveFile
                }
                disabled={
                  submitting
                }
              />

              <StudentUpload
                title="Bonafide Certificate"
                description="Current institution bonafide"
                fieldName="bonafide"
                file={
                  formData.bonafide
                }
                error={
                  getErrorText(
                    fieldErrors.bonafide
                  )
                }
                inputRef={
                  bonafideInputRef
                }
                onChange={
                  handleFileChange
                }
                onRemove={
                  handleRemoveFile
                }
                disabled={
                  submitting
                }
              />

              <StudentUpload
                title="Government ID"
                description="Aadhaar or other government ID"
                fieldName="govt_id"
                file={
                  formData.govt_id
                }
                error={
                  getErrorText(
                    fieldErrors.govt_id
                  )
                }
                inputRef={
                  govtIdInputRef
                }
                onChange={
                  handleFileChange
                }
                onRemove={
                  handleRemoveFile
                }
                disabled={
                  submitting
                }
              />
            </div>

            <p className="inmba-student-upload-note">
              Supported files: PDF, JPG and PNG. Maximum 5 MB for
              each document.
            </p>
          </StudentSection>

          {/* DECLARATION */}

          <section
            className={`inmba-student-declaration ${
              getErrorText(
                fieldErrors.declaration
              )
                ? "inmba-student-declaration-error"
                : ""
            }`}
          >
            <label htmlFor="student-declaration">
              <input
                id="student-declaration"
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
                I confirm that the student information and uploaded
                documents are true, valid and correct.
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
          </section>

          {/* ACTIONS */}

          <section className="inmba-student-actions">
            <Link to="/">
              <i
                className="fas fa-arrow-left"
                aria-hidden="true"
              ></i>

              Cancel
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

                  Submitting Application...
                </>
              ) : (
                <>
                  Submit Student Application

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
   SECTION
======================================== */

function StudentSection({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section className="inmba-student-section">
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
   INPUT
======================================== */

function StudentField({
  id,
  name,
  label,
  value,
  onChange,
  error,
  type = "text",
  required = false,
  optional = false,
  ...inputProps
}) {
  return (
    <div className="inmba-student-field">
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
            ? "inmba-student-input-error"
            : ""
        }
        {...inputProps}
      />

      {error && (
        <small className="inmba-student-field-error">
          {error}
        </small>
      )}
    </div>
  );
}

/* ========================================
   SELECT
======================================== */

function StudentSelect({
  id,
  name,
  label,
  value,
  onChange,
  error,
  placeholder,
  options,
  required,
  disabled,
}) {
  return (
    <div className="inmba-student-field">
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
            ? "inmba-student-input-error"
            : ""
        }
      >
        <option value="">
          {placeholder}
        </option>

        {options.map(
          (option) => (
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
        <small className="inmba-student-field-error">
          {error}
        </small>
      )}
    </div>
  );
}

/* ========================================
   UPLOAD
======================================== */

function StudentUpload({
  title,
  description,
  fieldName,
  file,
  error,
  inputRef,
  onChange,
  onRemove,
  disabled,
}) {
  return (
    <article
      className={`inmba-student-upload ${
        error
          ? "inmba-student-upload-error"
          : ""
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/jpeg,image/jpg,image/png"
        onChange={(
          event
        ) =>
          onChange(
            fieldName,
            event
          )
        }
        disabled={disabled}
      />

      <button
        type="button"
        onClick={() =>
          inputRef.current?.click()
        }
        disabled={disabled}
      >
        <span>
          <i
            className={
              file
                ? "fas fa-file-circle-check"
                : "fas fa-cloud-arrow-up"
            }
            aria-hidden="true"
          ></i>
        </span>

        <strong>
          {title}
        </strong>

        <small>
          {file
            ? file.name
            : description}
        </small>
      </button>

      {file && (
        <button
          type="button"
          className="inmba-student-remove-file"
          onClick={() =>
            onRemove(
              fieldName
            )
          }
          disabled={disabled}
          aria-label={`Remove ${title}`}
        >
          <i
            className="fas fa-xmark"
            aria-hidden="true"
          ></i>
        </button>
      )}

      {error && (
        <small className="inmba-student-field-error">
          {error}
        </small>
      )}
    </article>
  );
}