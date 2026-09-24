import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  getAdminUserById,
  updateAdminUser,
} from "../../../services/admin.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./AdminMemberEdit.css";

/* =========================================================
   BASIC HELPERS
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const normalized =
    String(
      value ?? ""
    ).trim();

  return (
    normalized ||
    fallback
  );
};

/* =========================================================
   DATE INPUT VALUE
========================================================= */

const toDateInputValue = (
  value
) => {
  if (!value) {
    return "";
  }

  const text =
    String(
      value
    ).trim();

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    return text;
  }

  const date =
    new Date(
      text.replace(
        " ",
        "T"
      )
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
};

/* =========================================================
   HONOR MEMBERSHIP CHECK

   Backend blocks:
   Honor
   Honor Member
========================================================= */

const isHonorMembership = (
  value
) => {
  const normalized =
    toText(
      value
    ).toLowerCase();

  return (
    normalized ===
      "honor" ||
    normalized ===
      "honor member"
  );
};

/* =========================================================
   FORM DATA FROM MEMBER
========================================================= */

const createFormData = (
  member
) => {
  const data =
    member || {};

  return {
    /* PERSONAL */

    first_name:
      toText(
        data.first_name
      ),

    last_name:
      toText(
        data.last_name
      ),

    father_name:
      toText(
        data.father_name
      ),

    dob:
      toDateInputValue(
        data.dob
      ),

    gender:
      toText(
        data.gender
      ),

    marital_status:
      toText(
        data.marital_status
      ),

    nationality:
      toText(
        data.nationality
      ),

    /* CONTACT */

    email:
      toText(
        data.email
      ),

    phone:
      toText(
        data.phone
      ),

    whatsapp_number:
      toText(
        data.whatsapp_number
      ),

    contact_number:
      toText(
        data.contact_number
      ),

    social_link:
      toText(
        data.social_link ??
          data.social_links
      ),

    /* MEMBERSHIP */

    membership_type:
      toText(
        data.membership_type
      ),

    referral_id:
      toText(
        data.referral_id
      ),

    /* NORMAL ADDRESS */

    city:
      toText(
        data.city
      ),

    district:
      toText(
        data.district
      ),

    state:
      toText(
        data.state
      ),

    pincode:
      toText(
        data.pincode
      ),

    /* ENTITY ADDRESS */

    entity_house_no:
      toText(
        data.entity_house_no
      ),

    entity_street:
      toText(
        data.entity_street
      ),

    entity_area:
      toText(
        data.entity_area
      ),

    entity_city:
      toText(
        data.entity_city
      ),

    entity_district:
      toText(
        data.entity_district
      ),

    entity_state:
      toText(
        data.entity_state
      ),

    entity_pincode:
      toText(
        data.entity_pincode
      ),

    /* EDUCATION */

    education:
      toText(
        data.education
      ),

    educational_qualification:
      toText(
        data.educational_qualification
      ),

    occupation:
      toText(
        data.occupation
      ),

    education_level:
      toText(
        data.education_level
      ),

    /* SCHOOL */

    school_name:
      toText(
        data.school_name
      ),

    school_class:
      toText(
        data.school_class
      ),

    board:
      toText(
        data.board
      ),

    school_city:
      toText(
        data.school_city
      ),

    /* UG */

    ug_college:
      toText(
        data.ug_college
      ),

    ug_degree:
      toText(
        data.ug_degree
      ),

    ug_department:
      toText(
        data.ug_department
      ),

    ug_year:
      toText(
        data.ug_year
      ),

    /* PG */

    pg_college:
      toText(
        data.pg_college
      ),

    pg_degree:
      toText(
        data.pg_degree
      ),

    pg_specialization:
      toText(
        data.pg_specialization
      ),

    pg_semester:
      toText(
        data.pg_semester
      ),

    skills:
      toText(
        data.skills
      ),

    student_id:
      toText(
        data.student_id
      ),

    /* NOMINEE */

    nomini_name:
      toText(
        data.nomini_name
      ),

    nomini_dob:
      toDateInputValue(
        data.nomini_dob
      ),

    nomini_relationship:
      toText(
        data.nomini_relationship
      ),

    nomini_aadhar:
      toText(
        data.nomini_aadhar
      ),

    /* WITNESS */

    witness_name:
      toText(
        data.witness_name
      ),

    witness_phone:
      toText(
        data.witness_phone
      ),

    witness_inmba_id:
      toText(
        data.witness_inmba_id
      ),

    /* KYC */

    pan_number:
      toText(
        data.pan_number
      ),

    pan_name:
      toText(
        data.pan_name
      ),

    entity_aadhar_number:
      toText(
        data.entity_aadhar_number
      ),

    /* PAYMENT */

    payment_method:
      toText(
        data.payment_method
      ),

    transaction_id:
      toText(
        data.transaction_id
      ),

    amount:
      data.amount ===
        null ||
      data.amount ===
        undefined
        ? ""
        : String(
            data.amount
          ),

    subscription_year:
      data.subscription_year ===
        null ||
      data.subscription_year ===
        undefined
        ? ""
        : String(
            data.subscription_year
          ),

    /* BANK */

    account_holder:
      toText(
        data.account_holder
      ),

    bank_name:
      toText(
        data.bank_name
      ),

    account_number:
      toText(
        data.account_number
      ),

    ifsc:
      toText(
        data.ifsc
      ),
  };
};

/* =========================================================
   PAYMENT FIELDS

   Backend blocks these fields for role=admin.
========================================================= */

const PAYMENT_FIELDS =
  new Set([
    "payment_method",
    "transaction_id",
    "amount",
    "subscription_year",
    "account_holder",
    "bank_name",
    "account_number",
    "ifsc",
  ]);

/* =========================================================
   CHANGED PAYLOAD ONLY

   Important:

   முழு form object அனுப்பாமல் changed fields மட்டும்
   backend-க்கு அனுப்புறோம்.

   இதனால் unnecessary NULL update / Honor membership
   validation side effects avoid ஆகும்.
========================================================= */

const buildChangedPayload = (
  formData,
  originalFormData,
  canEditPayment
) => {
  const payload = {};

  Object.keys(
    formData
  ).forEach(
    (
      field
    ) => {
      if (
        !canEditPayment &&
        PAYMENT_FIELDS.has(
          field
        )
      ) {
        return;
      }

      const currentValue =
        String(
          formData[field] ??
            ""
        ).trim();

      const originalValue =
        String(
          originalFormData[
            field
          ] ?? ""
        ).trim();

      if (
        currentValue !==
        originalValue
      ) {
        payload[field] =
          currentValue;
      }
    }
  );

  return payload;
};

/* =========================================================
   ADMIN MEMBER EDIT
========================================================= */

export default function AdminMemberEdit() {
  const {
    id,
  } =
    useParams();

  const navigate =
    useNavigate();

  const outletContext =
    useOutletContext();

  const admin =
    outletContext?.admin ||
    {};

  const adminRole =
    toText(
      admin.role
    ).toLowerCase();

  /* =======================================================
     PAYMENT PERMISSION

     Exact backend behaviour:

     admin:
     cannot edit payment/bank fields.

     super_admin / subadmin:
     backend does not apply this stripping rule.
  ======================================================= */

  const canEditPayment =
    adminRole !==
    "admin";

  const [
    member,
    setMember,
  ] =
    useState(null);

  const [
    formData,
    setFormData,
  ] =
    useState(null);

  const [
    originalFormData,
    setOriginalFormData,
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
    error,
    setError,
  ] =
    useState("");

  const [
    formError,
    setFormError,
  ] =
    useState("");

  /* =======================================================
     LOAD MEMBER
  ======================================================= */

  const loadMember =
    useCallback(
      async ({
        signal,
      } = {}) => {
        if (!id) {
          setError(
            "Member ID is required."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          setLoading(
            true
          );

          setError("");

          const result =
            await getAdminUserById(
              id,
              {
                signal,
              }
            );

          const currentMember =
            result.member;

          const nextFormData =
            createFormData(
              currentMember
            );

          setMember(
            currentMember
          );

          setFormData(
            nextFormData
          );

          setOriginalFormData(
            nextFormData
          );
        } catch (
          requestError
        ) {
          const cancelled =
            requestError?.code ===
              "ERR_CANCELED" ||
            requestError?.name ===
              "CanceledError" ||
            signal?.aborted;

          if (cancelled) {
            return;
          }

          /*
            Subadmin direct edit route வந்தால்,
            member OTP verification first required.
          */

          if (
            requestError
              ?.otpRequired
          ) {
            toast.info(
              "Verify member access OTP before editing this member."
            );

            navigate(
              `/admin/member/${id}`,
              {
                replace: true,
              }
            );

            return;
          }

          const statusCode =
            Number(
              requestError
                ?.statusCode ||
                requestError
                  ?.response
                  ?.status ||
                0
            );

          if (
            statusCode ===
            401
          ) {
            navigate(
              "/admin_login",
              {
                replace: true,

                state: {
                  from:
                    `/admin/member/${id}/edit`,
                },
              }
            );

            return;
          }

          setMember(null);

          setFormData(null);

          setOriginalFormData(
            null
          );

          setError(
            getApiErrorMessage(
              requestError,
              requestError
                ?.apiMessage ||
                "Unable to load member details."
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
        id,
        navigate,
      ]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadMember({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadMember,
    ]
  );

  /* =======================================================
     MEMBER NAME
  ======================================================= */

  const memberName =
    useMemo(
      () => {
        if (!formData) {
          return "";
        }

        return (
          [
            formData.first_name,
            formData.last_name,
          ]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          member?.login_id ||
          "INMBA Member"
        );
      },
      [
        formData,
        member,
      ]
    );

  /* =======================================================
     CHANGES COUNT
  ======================================================= */

  const changedPayload =
    useMemo(
      () => {
        if (
          !formData ||
          !originalFormData
        ) {
          return {};
        }

        return buildChangedPayload(
          formData,
          originalFormData,
          canEditPayment
        );
      },
      [
        formData,
        originalFormData,
        canEditPayment,
      ]
    );

  const changedCount =
    Object.keys(
      changedPayload
    ).length;

  /* =======================================================
     FIELD CHANGE
  ======================================================= */

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
        previous
      ) => ({
        ...previous,

        [name]:
          value,
      })
    );

    setFormError("");
  };

  /* =======================================================
     RESET
  ======================================================= */

  const handleReset =
    () => {
      if (
        !originalFormData
      ) {
        return;
      }

      setFormData({
        ...originalFormData,
      });

      setFormError("");

      toast.info(
        "Unsaved changes have been reset."
      );
    };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm =
    () => {
      if (
        !toText(
          formData
            ?.first_name
        )
      ) {
        return "First name is required.";
      }

      if (
        !toText(
          formData?.email
        )
      ) {
        return "Email is required.";
      }

      if (
        !toText(
          formData?.phone
        )
      ) {
        return "Phone number is required.";
      }

      /*
        Existing Honor member unchanged என்றால்
        save block பண்ணமாட்டோம்.

        Honor membership-க்கு மாற்ற முயன்றால் மட்டும்
        frontend-லும் block.
      */

      const membershipChanged =
        toText(
          formData
            ?.membership_type
        ) !==
        toText(
          originalFormData
            ?.membership_type
        );

      if (
        membershipChanged &&
        isHonorMembership(
          formData
            ?.membership_type
        )
      ) {
        return "Honor membership cannot be assigned through the Admin Member Edit page.";
      }

      return "";
    };

  /* =======================================================
     SAVE MEMBER

     POST /api/admin/user/:id/edit
  ======================================================= */

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        saving ||
        !formData
      ) {
        return;
      }

      const validationError =
        validateForm();

      if (
        validationError
      ) {
        setFormError(
          validationError
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      const payload =
        buildChangedPayload(
          formData,
          originalFormData,
          canEditPayment
        );

      if (
        Object.keys(
          payload
        ).length ===
        0
      ) {
        setFormError(
          "No changes were made."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        setFormError("");

        const result =
          await updateAdminUser(
            id,
            payload
          );

        toast.success(
          result.message ||
            "Member updated successfully."
        );

        navigate(
          `/admin/member/${id}`,
          {
            replace: true,
          }
        );
      } catch (
        requestError
      ) {
        const message =
          getApiErrorMessage(
            requestError,
            requestError
              ?.apiMessage ||
              "Unable to update member."
          );

        setFormError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <section className="inmba-admin-edit-state">
        <span className="inmba-admin-edit-spinner"></span>

        <h2>
          Loading Member
        </h2>

        <p>
          Preparing member information for editing...
        </p>
      </section>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error ||
    !member ||
    !formData
  ) {
    return (
      <section className="inmba-admin-edit-state">
        <span className="inmba-admin-edit-error-icon">
          <i
            className="fas fa-triangle-exclamation"
            aria-hidden="true"
          ></i>
        </span>

        <h2>
          Unable to Edit Member
        </h2>

        <p>
          {error ||
            "Member details are unavailable."}
        </p>

        <div>
          <button
            type="button"
            onClick={() =>
              loadMember()
            }
          >
            Try Again
          </button>

          <Link
            to={`/admin/member/${id}`}
          >
            Back
          </Link>
        </div>
      </section>
    );
  }

  /* =======================================================
     EDIT PAGE
  ======================================================= */

  return (
    <section className="inmba-admin-edit-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="inmba-admin-edit-header">
        <div>
          <Link
            to={`/admin/member/${id}`}
            className="inmba-admin-edit-back"
          >
            <i
              className="fas fa-arrow-left"
              aria-hidden="true"
            ></i>

            Back to Member
          </Link>

          <p>
            Member Management
          </p>

          <h2>
            Edit Member
          </h2>

          <span>
            Update member profile and administrative details.
          </span>
        </div>

        <div className="inmba-admin-edit-member-chip">
          <span>
            {toText(
              formData.first_name,
              "M"
            )
              .charAt(0)
              .toUpperCase()}
          </span>

          <div>
            <strong>
              {memberName}
            </strong>

            <small>
              {member.login_id ||
                `Member #${id}`}
            </small>
          </div>
        </div>
      </header>

      {/* =================================================
          ADMIN PAYMENT RESTRICTION
      ================================================= */}

      {!canEditPayment && (
        <div className="inmba-admin-edit-warning">
          <i
            className="fas fa-lock"
            aria-hidden="true"
          ></i>

          <div>
            <strong>
              Payment & Bank Editing Restricted
            </strong>

            <p>
              Your current Admin role cannot edit payment,
              transaction or bank fields. The backend also blocks
              these fields for this role.
            </p>
          </div>
        </div>
      )}

      {/* =================================================
          STATUS NOTE
      ================================================= */}

      <div className="inmba-admin-edit-information">
        <i
          className="fas fa-circle-info"
          aria-hidden="true"
        ></i>

        <div>
          <strong>
            Membership Status
          </strong>

          <p>
            Approve, Pending and Reject actions remain in the Member
            Verification section. This edit page does not bypass
            that verification workflow.
          </p>
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {formError && (
        <div
          className="inmba-admin-edit-form-error"
          role="alert"
        >
          <i
            className="fas fa-triangle-exclamation"
            aria-hidden="true"
          ></i>

          <span>
            {formError}
          </span>
        </div>
      )}

      {/* =================================================
          FORM
      ================================================= */}

      <form
        className="inmba-admin-edit-form"
        onSubmit={
          handleSubmit
        }
      >
        {/* =================================================
            PERSONAL
        ================================================= */}

        <EditSection
          icon="fas fa-user"
          title="Personal Details"
          description="Basic member identity information."
        >
          <EditField
            label="First Name"
            name="first_name"
            value={
              formData.first_name
            }
            onChange={
              handleChange
            }
            required
          />

          <EditField
            label="Last Name"
            name="last_name"
            value={
              formData.last_name
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Father / Guardian"
            name="father_name"
            value={
              formData.father_name
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Date of Birth"
            name="dob"
            type="date"
            value={
              formData.dob
            }
            onChange={
              handleChange
            }
          />

          <EditSelect
            label="Gender"
            name="gender"
            value={
              formData.gender
            }
            onChange={
              handleChange
            }
            options={[
              "Male",
              "Female",
              "Other",
            ]}
          />

          <EditSelect
            label="Marital Status"
            name="marital_status"
            value={
              formData.marital_status
            }
            onChange={
              handleChange
            }
            options={[
              "Single",
              "Married",
              "Divorced",
              "Widowed",
            ]}
          />

          <EditField
            label="Nationality"
            name="nationality"
            value={
              formData.nationality
            }
            onChange={
              handleChange
            }
          />
        </EditSection>

        {/* =================================================
            CONTACT
        ================================================= */}

        <EditSection
          icon="fas fa-address-book"
          title="Contact Details"
          description="Email, phone and communication details."
        >
          <EditField
            label="Email"
            name="email"
            type="email"
            value={
              formData.email
            }
            onChange={
              handleChange
            }
            required
          />

          <EditField
            label="Phone"
            name="phone"
            type="tel"
            value={
              formData.phone
            }
            onChange={
              handleChange
            }
            required
          />

          <EditField
            label="Contact Number"
            name="contact_number"
            type="tel"
            value={
              formData.contact_number
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="WhatsApp Number"
            name="whatsapp_number"
            type="tel"
            value={
              formData.whatsapp_number
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Social Link"
            name="social_link"
            value={
              formData.social_link
            }
            onChange={
              handleChange
            }
            placeholder="https://..."
            full
          />
        </EditSection>

        {/* =================================================
            MEMBERSHIP
        ================================================= */}

        <EditSection
          icon="fas fa-id-card"
          title="Membership Details"
          description="Membership type and generated referral ID."
        >
          <EditField
            label="Membership Type"
            name="membership_type"
            value={
              formData.membership_type
            }
            onChange={
              handleChange
            }
            placeholder="Civilian Member"
          />

          <EditField
            label="Referral ID"
            name="referral_id"
            value={
              formData.referral_id
            }
            onChange={
              handleChange
            }
          />

          <div className="inmba-admin-edit-inline-note">
            <i
              className="fas fa-circle-info"
              aria-hidden="true"
            ></i>

            <span>
              Honor membership cannot be assigned using this admin
              edit route.
            </span>
          </div>
        </EditSection>

        {/* =================================================
            GENERAL ADDRESS
        ================================================= */}

        <EditSection
          icon="fas fa-location-dot"
          title="General Address"
          description="Basic city, district, state and pincode."
        >
          <EditField
            label="City"
            name="city"
            value={
              formData.city
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="District"
            name="district"
            value={
              formData.district
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="State"
            name="state"
            value={
              formData.state
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Pincode"
            name="pincode"
            value={
              formData.pincode
            }
            onChange={
              handleChange
            }
          />
        </EditSection>

        {/* =================================================
            ENTITY ADDRESS
        ================================================= */}

        <EditSection
          icon="fas fa-map-location-dot"
          title="Entity / KYC Address"
          description="Address captured during legal entity KYC."
        >
          <EditField
            label="House No"
            name="entity_house_no"
            value={
              formData.entity_house_no
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Street"
            name="entity_street"
            value={
              formData.entity_street
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Area"
            name="entity_area"
            value={
              formData.entity_area
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="City"
            name="entity_city"
            value={
              formData.entity_city
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="District"
            name="entity_district"
            value={
              formData.entity_district
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="State"
            name="entity_state"
            value={
              formData.entity_state
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Pincode"
            name="entity_pincode"
            value={
              formData.entity_pincode
            }
            onChange={
              handleChange
            }
          />
        </EditSection>

        {/* =================================================
            EDUCATION
        ================================================= */}

        <EditSection
          icon="fas fa-graduation-cap"
          title="Education & Profession"
          description="General educational and professional details."
        >
          <EditField
            label="Education"
            name="education"
            value={
              formData.education
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Qualification"
            name="educational_qualification"
            value={
              formData.educational_qualification
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Occupation"
            name="occupation"
            value={
              formData.occupation
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Education Level"
            name="education_level"
            value={
              formData.education_level
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Student ID"
            name="student_id"
            value={
              formData.student_id
            }
            onChange={
              handleChange
            }
          />

          <EditTextarea
            label="Skills"
            name="skills"
            value={
              formData.skills
            }
            onChange={
              handleChange
            }
            full
          />
        </EditSection>

        {/* =================================================
            SCHOOL
        ================================================= */}

        <EditSection
          icon="fas fa-school"
          title="School Details"
          description="Student school information."
        >
          <EditField
            label="School Name"
            name="school_name"
            value={
              formData.school_name
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Class"
            name="school_class"
            value={
              formData.school_class
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Board"
            name="board"
            value={
              formData.board
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="School City"
            name="school_city"
            value={
              formData.school_city
            }
            onChange={
              handleChange
            }
          />
        </EditSection>

        {/* =================================================
            UG
        ================================================= */}

        <EditSection
          icon="fas fa-building-columns"
          title="UG Details"
          description="Undergraduate educational details."
        >
          <EditField
            label="College"
            name="ug_college"
            value={
              formData.ug_college
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Degree"
            name="ug_degree"
            value={
              formData.ug_degree
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Department"
            name="ug_department"
            value={
              formData.ug_department
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Year"
            name="ug_year"
            value={
              formData.ug_year
            }
            onChange={
              handleChange
            }
          />
        </EditSection>

        {/* =================================================
            PG
        ================================================= */}

        <EditSection
          icon="fas fa-user-graduate"
          title="PG Details"
          description="Postgraduate educational details."
        >
          <EditField
            label="College"
            name="pg_college"
            value={
              formData.pg_college
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Degree"
            name="pg_degree"
            value={
              formData.pg_degree
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Specialization"
            name="pg_specialization"
            value={
              formData.pg_specialization
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Semester"
            name="pg_semester"
            value={
              formData.pg_semester
            }
            onChange={
              handleChange
            }
          />
        </EditSection>

        {/* =================================================
            KYC
        ================================================= */}

        <EditSection
          icon="fas fa-address-card"
          title="KYC Identity"
          description="Editable PAN and Aadhaar text information."
        >
          <EditField
            label="PAN Number"
            name="pan_number"
            value={
              formData.pan_number
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Name on PAN"
            name="pan_name"
            value={
              formData.pan_name
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Entity Aadhaar Number"
            name="entity_aadhar_number"
            value={
              formData.entity_aadhar_number
            }
            onChange={
              handleChange
            }
          />

          <div className="inmba-admin-edit-inline-note">
            <i
              className="fas fa-image"
              aria-hidden="true"
            ></i>

            <span>
              Aadhaar/PAN document uploads are not supported by this
              admin edit endpoint.
            </span>
          </div>
        </EditSection>

        {/* =================================================
            NOMINEE
        ================================================= */}

        <EditSection
          icon="fas fa-user-group"
          title="Nominee Details"
          description="Member nominee information."
        >
          <EditField
            label="Nominee Name"
            name="nomini_name"
            value={
              formData.nomini_name
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Nominee DOB"
            name="nomini_dob"
            type="date"
            value={
              formData.nomini_dob
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Relationship"
            name="nomini_relationship"
            value={
              formData.nomini_relationship
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Nominee Aadhaar"
            name="nomini_aadhar"
            value={
              formData.nomini_aadhar
            }
            onChange={
              handleChange
            }
          />
        </EditSection>

        {/* =================================================
            WITNESS
        ================================================= */}

        <EditSection
          icon="fas fa-user-check"
          title="Witness Details"
          description="Member witness information."
        >
          <EditField
            label="Witness Name"
            name="witness_name"
            value={
              formData.witness_name
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Witness Phone"
            name="witness_phone"
            type="tel"
            value={
              formData.witness_phone
            }
            onChange={
              handleChange
            }
          />

          <EditField
            label="Witness INMBA ID"
            name="witness_inmba_id"
            value={
              formData.witness_inmba_id
            }
            onChange={
              handleChange
            }
          />
        </EditSection>

        {/* =================================================
            PAYMENT

            admin role-க்கு render செய்யவில்லை.
        ================================================= */}

        {canEditPayment && (
          <EditSection
            icon="fas fa-credit-card"
            title="Payment Details"
            description="Payment and subscription information."
          >
            <EditField
              label="Payment Method"
              name="payment_method"
              value={
                formData.payment_method
              }
              onChange={
                handleChange
              }
            />

            <EditField
              label="Transaction ID"
              name="transaction_id"
              value={
                formData.transaction_id
              }
              onChange={
                handleChange
              }
            />

            <EditField
              label="Amount"
              name="amount"
              type="number"
              value={
                formData.amount
              }
              onChange={
                handleChange
              }
              min="0"
              step="0.01"
            />

            <EditField
              label="Subscription Year"
              name="subscription_year"
              value={
                formData.subscription_year
              }
              onChange={
                handleChange
              }
            />
          </EditSection>
        )}

        {/* =================================================
            BANK
        ================================================= */}

        {canEditPayment && (
          <EditSection
            icon="fas fa-building-columns"
            title="Bank Details"
            description="Member bank information."
          >
            <EditField
              label="Account Holder"
              name="account_holder"
              value={
                formData.account_holder
              }
              onChange={
                handleChange
              }
            />

            <EditField
              label="Bank Name"
              name="bank_name"
              value={
                formData.bank_name
              }
              onChange={
                handleChange
              }
            />

            <EditField
              label="Account Number"
              name="account_number"
              value={
                formData.account_number
              }
              onChange={
                handleChange
              }
            />

            <EditField
              label="IFSC"
              name="ifsc"
              value={
                formData.ifsc
              }
              onChange={
                handleChange
              }
            />
          </EditSection>
        )}

        {/* =================================================
            SAVE BAR
        ================================================= */}

        <footer className="inmba-admin-edit-save-bar">
          <div>
            <small>
              Unsaved Changes
            </small>

            <strong>
              {changedCount}
            </strong>

            <span>
              {changedCount ===
              1
                ? "field changed"
                : "fields changed"}
            </span>
          </div>

          <div>
            <button
              type="button"
              className="inmba-admin-edit-reset"
              onClick={
                handleReset
              }
              disabled={
                saving ||
                changedCount ===
                  0
              }
            >
              <i
                className="fas fa-rotate-left"
                aria-hidden="true"
              ></i>

              Reset
            </button>

            <Link
              to={`/admin/member/${id}`}
              className="inmba-admin-edit-cancel"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inmba-admin-edit-save"
              disabled={
                saving ||
                changedCount ===
                  0
              }
            >
              {saving ? (
                <>
                  <i
                    className="fas fa-spinner fa-spin"
                    aria-hidden="true"
                  ></i>

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
        </footer>
      </form>
    </section>
  );
}

/* =========================================================
   EDIT SECTION
========================================================= */

function EditSection({
  icon,
  title,
  description,
  children,
}) {
  return (
    <section className="inmba-admin-edit-section">
      <header>
        <span>
          <i
            className={
              icon
            }
            aria-hidden="true"
          ></i>
        </span>

        <div>
          <h3>
            {title}
          </h3>

          <p>
            {description}
          </p>
        </div>
      </header>

      <div className="inmba-admin-edit-fields">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   EDIT FIELD
========================================================= */

function EditField({
  label,
  full = false,
  required = false,
  ...inputProps
}) {
  return (
    <div
      className={`inmba-admin-edit-field ${
        full
          ? "inmba-admin-edit-field-full"
          : ""
      }`}
    >
      <label
        htmlFor={`admin-edit-${inputProps.name}`}
      >
        {label}

        {required && (
          <span>
            *
          </span>
        )}
      </label>

      <input
        id={`admin-edit-${inputProps.name}`}
        required={
          required
        }
        {...inputProps}
      />
    </div>
  );
}

/* =========================================================
   SELECT
========================================================= */

function EditSelect({
  label,
  options,
  ...inputProps
}) {
  const currentValue =
    toText(
      inputProps.value
    );

  const hasCurrentOption =
    options.some(
      (
        option
      ) =>
        option ===
        currentValue
    );

  return (
    <div className="inmba-admin-edit-field">
      <label
        htmlFor={`admin-edit-${inputProps.name}`}
      >
        {label}
      </label>

      <select
        id={`admin-edit-${inputProps.name}`}
        {...inputProps}
      >
        <option value="">
          Select
        </option>

        {currentValue &&
          !hasCurrentOption && (
            <option
              value={
                currentValue
              }
            >
              {currentValue}
            </option>
          )}

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
    </div>
  );
}

/* =========================================================
   TEXTAREA
========================================================= */

function EditTextarea({
  label,
  full = false,
  ...textareaProps
}) {
  return (
    <div
      className={`inmba-admin-edit-field ${
        full
          ? "inmba-admin-edit-field-full"
          : ""
      }`}
    >
      <label
        htmlFor={`admin-edit-${textareaProps.name}`}
      >
        {label}
      </label>

      <textarea
        id={`admin-edit-${textareaProps.name}`}
        rows={4}
        {...textareaProps}
      ></textarea>
    </div>
  );
}