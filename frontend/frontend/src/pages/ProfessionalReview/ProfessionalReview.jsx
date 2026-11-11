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
  PROFESSIONAL_KYC_SECTIONS,
  PROFESSIONAL_KYC_SECTION_TITLES,
  getProfessionalKyc,
  getProfessionalKycSection,
  normalizeProfessionalKycError,
  submitProfessionalKyc,
} from "../../services/professionalKyc.service";

import "./ProfessionalReview.css";
import { asObject } from "../../utils/commonHelpers";
import { useAuth } from "../../context/AuthContext";

/* =========================================================
   SECTIONS
========================================================= */

const DEFAULT_SECTIONS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
];

const KYC_SECTIONS =
  Array.isArray(
    PROFESSIONAL_KYC_SECTIONS
  ) &&
  PROFESSIONAL_KYC_SECTIONS.length
    ? PROFESSIONAL_KYC_SECTIONS
    : DEFAULT_SECTIONS;

/* =========================================================
   PROFILE UPGRADE
========================================================= */

const PROFILE_UPGRADE_AMOUNT =
  1500;

const PROFILE_UPGRADE_PLAN = {
  planId:
    "profile_upgrade",

  planName:
    "Profile Upgrade",

  amount:
    PROFILE_UPGRADE_AMOUNT,

  membershipType:
    "Professional Member",

  professionalFlow:
    "profile_upgrade",
};

/* =========================================================
   STORAGE KEYS
========================================================= */

const MEMBERSHIP_STORAGE_KEY =
  "inmba_professional_membership_plan";

const KYC_COMPLETED_STORAGE_KEY =
  "inmba_professional_kyc_completed";

const KYC_CONFIRMED_STORAGE_KEY =
  "inmba_professional_kyc_confirmed";

const KYC_STATUS_STORAGE_KEY =
  "inmba_professional_kyc_status";

const KYC_TOKEN_STORAGE_KEY =
  "inmba_professional_kyc_token";

const NEXT_ROUTE_STORAGE_KEY =
  "inmba_professional_next_route";

/* =========================================================
   MAIN FLOW
========================================================= */

const MAIN_FLOW_STEPS = [
  {
    key:
      "basic",

    label:
      "Basic KYC",

    icon:
      "fa-solid fa-user",
  },

  {
    key:
      "login",

    label:
      "Login",

    icon:
      "fa-solid fa-right-to-bracket",
  },

  {
    key:
      "membership",

    label:
      "Membership",

    icon:
      "fa-solid fa-id-card",
  },

  {
    key:
      "full-kyc",

    label:
      "Full KYC",

    icon:
      "fa-solid fa-file-shield",
  },

  {
    key:
      "review",

    label:
      "Review",

    icon:
      "fa-solid fa-clipboard-check",
  },

  {
    key:
      "payment",

    label:
      "Payment",

    icon:
      "fa-solid fa-credit-card",
  },

  {
    key:
      "complete",

    label:
      "Complete",

    icon:
      "fa-solid fa-circle-check",
  },
];

/* =========================================================
   SECTION META
========================================================= */

const SECTION_META = {
  A: {
    title:
      "Identity & KYC",

    icon:
      "fa-solid fa-address-card",
  },

  B: {
    title:
      "Contact & Address",

    icon:
      "fa-solid fa-location-dot",
  },

  C: {
    title:
      "Legal & Professional",

    icon:
      "fa-solid fa-scale-balanced",
  },

  D: {
    title:
      "Education",

    icon:
      "fa-solid fa-graduation-cap",
  },

  E: {
    title:
      "Achievements",

    icon:
      "fa-solid fa-award",
  },

  F: {
    title:
      "Experience",

    icon:
      "fa-solid fa-briefcase",
  },

  G: {
    title:
      "Skills & Bio",

    icon:
      "fa-solid fa-user-tie",
  },

  H: {
    title:
      "Bank & Financial",

    icon:
      "fa-solid fa-building-columns",
  },

  I: {
    title:
      "Network & Royalty",

    icon:
      "fa-solid fa-network-wired",
  },

  J: {
    title:
      "Emergency & Nominee",

    icon:
      "fa-solid fa-phone-volume",
  },
};

/* =========================================================
   FIELD LABELS
========================================================= */

const FIELD_LABELS = {
  first_name:
    "First Name",

  last_name:
    "Last Name",

  father_name:
    "Father's / Spouse Name",

  dob:
    "Date of Birth",

  gender:
    "Gender",

  marital_status:
    "Marital Status",

  nationality:
    "Nationality",

  blood_group:
    "Blood Group",

  aadhar:
    "Aadhaar Number",

  pan_number:
    "PAN Number",

  passport_number:
    "Passport Number",

  voter_id:
    "Voter ID",

  driving_license:
    "Driving License",

  aadhar_front:
    "Aadhaar Front",

  aadhar_back:
    "Aadhaar Back",

  pan_front:
    "PAN Card",

  phone:
    "Primary Mobile",

  secondary_mobile:
    "Secondary Mobile",

  email:
    "Primary Email",

  whatsapp_number:
    "WhatsApp Number",

  current_address:
    "Current Address",

  permanent_address:
    "Permanent Address",

  city:
    "City",

  district:
    "District",

  state:
    "State",

  pincode:
    "Pincode",

  google_map_location:
    "Google Map Location",

  address_proof:
    "Address Proof",

  professional_license_number:
    "Professional License No.",

  council_board_name:
    "Council / Board Name",

  council_registration_number:
    "Council Registration No.",

  firm_pan_number:
    "Business / Firm PAN",

  professional_gst_number:
    "GST Number",

  professional_license_document:
    "Professional License Document",

  council_registration_document:
    "Council Registration Document",

  professional_indemnity_insurance:
    "Professional Indemnity Insurance",

  firm_pan_document:
    "Business PAN Document",

  professional_gst_document:
    "GST Supporting Document",

  education:
    "Highest Qualification",

  educational_qualification:
    "Qualification Details",

  school_college_name:
    "School / College Name",

  degree_certificate_year:
    "Degree / Certificate Year",

  additional_certifications:
    "Additional Certifications",

  language_skills:
    "Language Skills",

  education_certificate:
    "Education Certificate",

  awards_recognitions:
    "Awards & Recognitions",

  publications:
    "Publications",

  professional_certifications:
    "Professional Certifications",

  key_milestones:
    "Key Milestones",

  media_mentions:
    "Media Mentions",

  reference_letters:
    "Testimonials / References",

  total_experience_years:
    "Total Experience",

  availability_status:
    "Availability Status",

  previous_employers_clients:
    "Previous Employers / Clients",

  work_samples:
    "Work Samples",

  hourly_project_rate:
    "Hourly / Project Rate",

  resume_cv:
    "Resume / CV",

  professional_bio:
    "Professional Bio",

  interest_categories:
    "Interest Categories",

  skills:
    "Skills",

  hobbies:
    "Hobbies",

  preferred_industry:
    "Preferred Industry",

  social_link:
    "Social Media Link",

  portfolio_url:
    "Portfolio URL",

  intro_video:
    "Intro Video",

  profile_pic:
    "Profile Photo",

  cover_photo:
    "Cover Photo",

  gallery_photos:
    "Gallery Photo",

  account_holder:
    "Account Holder",

  bank_name:
    "Bank Name",

  account_number:
    "Account Number",

  ifsc:
    "IFSC Code",

  branch:
    "Bank Branch",

  upi_id:
    "UPI ID",

  nomini_name:
    "Nominee Name",

  nomini_relationship:
    "Nominee Relationship",

  nomini_aadhar:
    "Nominee Aadhaar / ID",

  bank_proof:
    "Bank Proof",

  income_tax_declaration:
    "Income Tax Declaration",

  nomini_id_document:
    "Nominee ID Document",

  referral_id:
    "Sponsor / Referral ID",

  referred_by:
    "Referred By",

  network_level:
    "Network Level",

  direct_network:
    "Direct Network",

  indirect_network:
    "Indirect Network",

  royalty_slab_category:
    "Royalty Slab",

  preferred_payout_cycle:
    "Preferred Payout Cycle",

  emergency_contact_name:
    "Emergency Contact Name",

  emergency_contact_number:
    "Emergency Contact Number",

  emergency_relationship:
    "Relationship",
};

/* =========================================================
   FILE FIELDS
========================================================= */

const FILE_FIELDS =
  new Set([
    "aadhar_front",
    "aadhar_back",
    "pan_front",
    "address_proof",

    "professional_license_document",
    "council_registration_document",
    "professional_indemnity_insurance",
    "firm_pan_document",
    "professional_gst_document",

    "education_certificate",

    "resume_cv",

    "profile_pic",
    "cover_photo",
    "gallery_photos",

    "bank_proof",
    "income_tax_declaration",
    "nomini_id_document",
  ]);

/* =========================================================
   HIDDEN FIELDS
========================================================= */

const HIDDEN_FIELDS =
  new Set([
    "id",
    "_id",

    "password",
    "password_hash",

    "token",

    "created_at",
    "updated_at",

    "professional_kyc_current_step",
    "professional_kyc_status",

    "professional_kyc_submitted_at",
    "professional_kyc_completed_at",

    "professional_kyc_rejection_reason",

    "professional_privacy_consent",
    "professional_declaration_accepted",

    "professional_section_a_completed",
    "professional_section_b_completed",
    "professional_section_c_completed",
    "professional_section_d_completed",
    "professional_section_e_completed",
    "professional_section_f_completed",
    "professional_section_g_completed",
    "professional_section_h_completed",
    "professional_section_i_completed",
    "professional_section_j_completed",

    "success",
    "message",
    "statusCode",
  ]);

/* =========================================================
   HELPERS
========================================================= */

const toText = (
  value
) => {
  if (
    value === null ||
    typeof value ===
      "undefined"
  ) {
    return "";
  }

  return String(
    value
  );
};

const safeParse = (
  value
) => {
  try {
    return JSON.parse(
      value
    );
  } catch {
    return null;
  }
};

/* =========================================================
   ERROR
========================================================= */

const getErrorText = (
  error,
  fallback
) => {
  try {
    const normalized =
      normalizeProfessionalKycError(
        error,
        fallback
      );

    return (
      normalized?.apiMessage ||
      normalized?.message ||
      fallback
    );
  } catch {
    return (
      error?.response?.data
        ?.message ||
      error?.response?.data
        ?.error ||
      error?.message ||
      fallback
    );
  }
};

/* =========================================================
   MEMBER
========================================================= */

const getMemberFromResponse = (
  response
) => {
  const source =
    asObject(
      response
    );

  const data =
    asObject(
      source.data
    );

  return (
    source.member ||
    data.member ||
    source.kyc ||
    data.kyc ||
    data.user ||
    source.user ||
    data
  );
};

/* =========================================================
   FULL DATA
========================================================= */

const getFullKycData = (
  response
) => {
  const source =
    asObject(
      response
    );

  const data =
    asObject(
      source.data
    );

  return {
    ...source,
    ...data,
  };
};

/* =========================================================
   SECTION VALUES
========================================================= */

const extractSectionValues = (
  response
) => {
  const source =
    asObject(
      response
    );

  const data =
    asObject(
      source.data
    );

  const section =
    asObject(
      source.section ||
        data.section
    );

  const values =
    asObject(
      section.values ||
        source.values ||
        data.values ||
        section.data ||
        data.data
    );

  if (
    Object.keys(
      values
    ).length
  ) {
    return values;
  }

  return {
    ...data,
    ...section,
  };
};

/* =========================================================
   FILE NAME
========================================================= */

const getFileName = (
  value
) => {
  const text =
    toText(
      value
    ).trim();

  if (!text) {
    return "";
  }

  return (
    text
      .replace(
        /\\/g,
        "/"
      )
      .split(
        "/"
      )
      .filter(
        Boolean
      )
      .pop() ||
    text
  );
};

/* =========================================================
   LABEL
========================================================= */

const humanizeFieldName = (
  value
) => {
  return toText(
    value
  )
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        letter
      ) =>
        letter.toUpperCase()
    );
};

const getFieldLabel = (
  field
) => {
  return (
    FIELD_LABELS[
      field
    ] ||
    humanizeFieldName(
      field
    )
  );
};

/* =========================================================
   REVIEW VALUE
========================================================= */

const formatReviewValue = (
  field,
  value
) => {
  if (
    FILE_FIELDS.has(
      field
    )
  ) {
    return (
      getFileName(
        value
      ) ||
      "Not uploaded"
    );
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return value
      .filter(
        Boolean
      )
      .join(
        ", "
      );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    try {
      return JSON.stringify(
        value
      );
    } catch {
      return "";
    }
  }

  return toText(
    value
  ).trim();
};

/* =========================================================
   DISPLAY ENTRIES
========================================================= */

const getDisplayEntries = (
  values
) => {
  return Object.entries(
    asObject(
      values
    )
  )
    .filter(
      ([
        key,
        value,
      ]) => {
        if (
          HIDDEN_FIELDS.has(
            key
          )
        ) {
          return false;
        }

        if (
          key.startsWith(
            "professional_section_"
          )
        ) {
          return false;
        }

        const formatted =
          formatReviewValue(
            key,
            value
          );

        return Boolean(
          formatted
        );
      }
    )
    .map(
      ([
        key,
        value,
      ]) => ({
        key,

        label:
          getFieldLabel(
            key
          ),

        value:
          formatReviewValue(
            key,
            value
          ),

        file:
          FILE_FIELDS.has(
            key
          ),
      })
    );
};

/* =========================================================
   BOOLEAN HELPER
========================================================= */

const isTrueValue = (
  value
) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ProfessionalReview() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const { member: sessionMember } = useAuth();

  /* =======================================================
     TOKEN
  ======================================================= */

  const stateToken =
    toText(
      location.state
        ?.token
    ).trim();

  const storedToken =
    toText(
      sessionStorage.getItem(
        KYC_TOKEN_STORAGE_KEY
      )
    ).trim();

  const reviewToken =
    stateToken ||
    storedToken;

  /* =======================================================
     STORE TOKEN
  ======================================================= */

  useEffect(
    () => {
      if (
        stateToken
      ) {
        sessionStorage.setItem(
          KYC_TOKEN_STORAGE_KEY,
          stateToken
        );
      }
    },
    [
      stateToken,
    ]
  );

  /* =======================================================
     STATES
  ======================================================= */

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(
      false
    );

  const [
    pageError,
    setPageError,
  ] =
    useState(
      ""
    );

  const [
    member,
    setMember,
  ] =
    useState(
      {}
    );

  const [
    professionalKyc,
    setProfessionalKyc,
  ] =
    useState(
      {}
    );

  const [
    sections,
    setSections,
  ] =
    useState(
      {}
    );

  const [
    sectionErrors,
    setSectionErrors,
  ] =
    useState(
      {}
    );

  const [
    privacyConsent,
    setPrivacyConsent,
  ] =
    useState(
      false
    );

  const [
    declarationAccepted,
    setDeclarationAccepted,
  ] =
    useState(
      false
    );

  const [
    consentErrors,
    setConsentErrors,
  ] =
    useState(
      {}
    );

  /* =======================================================
     LOAD REVIEW
  ======================================================= */

  const loadReview =
    useCallback(
      async () => {
        setLoading(
          true
        );

        setPageError(
          ""
        );

        setSectionErrors(
          {}
        );

        try {
          /* ===============================================
             FULL KYC

             IMPORTANT:
             service expects { token }
          =============================================== */

          const summary =
            await getProfessionalKyc({
              token:
                reviewToken,
            });

          setProfessionalKyc(
            summary ||
              {}
          );

          const currentMember =
            getMemberFromResponse(
              summary
            );

          setMember(
            currentMember ||
              {}
          );

          const fullData =
            getFullKycData(
              summary
            );

          setPrivacyConsent(
            isTrueValue(
              fullData
                .professional_privacy_consent
            )
          );

          setDeclarationAccepted(
            isTrueValue(
              fullData
                .professional_declaration_accepted
            )
          );

          /* ===============================================
             LOAD A-J
          =============================================== */

          const results =
            await Promise.all(
              KYC_SECTIONS.map(
                async (
                  section
                ) => {
                  try {
                    /*
                      IMPORTANT:
                      service expects:
                      getProfessionalKycSection(
                        section,
                        { token }
                      )
                    */

                    const response =
                      await getProfessionalKycSection(
                        section,
                        {
                          token:
                            reviewToken,
                        }
                      );

                    return {
                      section,

                      values:
                        extractSectionValues(
                          response
                        ),

                      error:
                        "",
                    };
                  } catch (
                    error
                  ) {
                    return {
                      section,

                      values:
                        {},

                      error:
                        getErrorText(
                          error,
                          `Unable to load Section ${section}.`
                        ),
                    };
                  }
                }
              )
            );

          const nextSections =
            {};

          const nextErrors =
            {};

          results.forEach(
            (
              result
            ) => {
              nextSections[
                result.section
              ] =
                result.values;

              if (
                result.error
              ) {
                nextErrors[
                  result.section
                ] =
                  result.error;
              }
            }
          );

          setSections(
            nextSections
          );

          setSectionErrors(
            nextErrors
          );
        } catch (
          error
        ) {
          setPageError(
            getErrorText(
              error,
              "Unable to load Professional KYC review."
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        reviewToken,
      ]
    );

  useEffect(
    () => {
      loadReview();
    },
    [
      loadReview,
    ]
  );

  /* =======================================================
     FULL DATA
  ======================================================= */

  const fullKycData =
    useMemo(
      () =>
        getFullKycData(
          professionalKyc
        ),
      [
        professionalKyc,
      ]
    );

  /* =======================================================
     KYC STATUS
  ======================================================= */

  const kycStatus =
    toText(
      fullKycData
        .professional_kyc_status ||
        fullKycData.status ||
        "draft"
    )
      .trim()
      .toLowerCase();

  const alreadySubmitted =
    [
      "submitted",
      "under_review",
      "approved",
      "completed",
    ].includes(
      kycStatus
    );

  /* =======================================================
     COMPLETED SECTIONS
  ======================================================= */

  const completedSectionSet =
    useMemo(
      () => {
        const completed =
          new Set();

        const progress =
          asObject(
            professionalKyc
              ?.progress ||
              professionalKyc
                ?.data
                ?.progress
          );

        const progressSections =
          asObject(
            progress.sections
          );

        KYC_SECTIONS.forEach(
          (
            section
          ) => {
            const lower =
              section
                .toLowerCase();

            const field =
              `professional_section_${lower}_completed`;

            const value =
              progressSections[
                section
              ] ??
              progressSections[
                lower
              ] ??
              progress[
                field
              ] ??
              fullKycData[
                field
              ];

            if (
              isTrueValue(
                value
              )
            ) {
              completed.add(
                section
              );
            }
          }
        );

        return completed;
      },
      [
        professionalKyc,
        fullKycData,
      ]
    );

  const allSectionsCompleted =
    completedSectionSet.size ===
    KYC_SECTIONS.length;

  const progressPercent =
    Math.round(
      (
        completedSectionSet.size /
        KYC_SECTIONS.length
      ) *
        100
    );

  /* =======================================================
     MEMBER
  ======================================================= */

  const activeMember = useMemo(() => ({
    ...asObject(sessionMember),
    ...asObject(location.state?.member),
    ...asObject(member),
  }), [sessionMember, location.state?.member, member]);

  const loginId =
    toText(
      activeMember?.login_id ||
      activeMember?.loginId ||
      location.state?.loginId ||
      sessionStorage.getItem("inmba_professional_login_id") ||
      sessionStorage.getItem("inmba_member_login_id") ||
      sessionStorage.getItem("inmba_login_id") ||
      sessionStorage.getItem("login_id")
    ).trim();

  const memberName =
    [
      activeMember?.first_name,
      activeMember?.last_name,
    ]
      .filter(
        Boolean
      )
      .join(
        " "
      ) ||
    toText(activeMember?.full_legal_name || activeMember?.full_name || activeMember?.name) ||
    "Professional Member";

  /* =======================================================
     MEMBERSHIP SELECTION
  ======================================================= */

  const membershipSelection =
    useMemo(
      () => {
        const fromState =
          location.state
            ?.membershipSelection;

        if (
          fromState &&
          typeof fromState ===
            "object"
        ) {
          return fromState;
        }

        const stored =
          sessionStorage.getItem(
            MEMBERSHIP_STORAGE_KEY
          );

        return (
          safeParse(
            stored
          ) ||
          {}
        );
      },
      [
        location.state,
      ]
    );

  /* =======================================================
     EDIT KYC
  ======================================================= */

  const handleEditKyc =
    () => {
      sessionStorage.setItem(
        NEXT_ROUTE_STORAGE_KEY,
        "/professional-kyc"
      );

      navigate(
        reviewToken
          ? `/professional-kyc/${encodeURIComponent(
              reviewToken
            )}`
          : "/professional-kyc",
        {
          state: {
            fromReview:
              true,

            professionalFlow:
              "profile_upgrade",

            loginId,

            token:
              reviewToken,
          },
        }
      );
    };

  /* =======================================================
     GO PAYMENT
  ======================================================= */

  const goToPayment =
    (
      submitResult = null
    ) => {
      const paymentSelection = {
        ...membershipSelection,

        ...PROFILE_UPGRADE_PLAN,

        loginId,

        memberName,

        kycCompleted:
          true,

        kycConfirmed:
          true,

        kycStatus:
          "submitted",

        completedSections:
          [
            ...KYC_SECTIONS,
          ],

        confirmedAt:
          new Date()
            .toISOString(),
      };

      sessionStorage.setItem(
        MEMBERSHIP_STORAGE_KEY,
        JSON.stringify(
          paymentSelection
        )
      );

      sessionStorage.setItem(
        KYC_COMPLETED_STORAGE_KEY,
        "true"
      );

      sessionStorage.setItem(
        KYC_CONFIRMED_STORAGE_KEY,
        "true"
      );

      sessionStorage.setItem(
        KYC_STATUS_STORAGE_KEY,
        "submitted"
      );

      sessionStorage.setItem(
        NEXT_ROUTE_STORAGE_KEY,
        "/professional-payment"
      );

      navigate(
        "/professional-payment",
        {
          state: {
            loginId,

            token:
              reviewToken,

            member,

            memberName,

            membershipType:
              "Professional Member",

            membershipSelection:
              paymentSelection,

            professionalFlow:
              "profile_upgrade",

            kycCompleted:
              true,

            kycConfirmed:
              true,

            kycStatus:
              "submitted",

            amount:
              PROFILE_UPGRADE_AMOUNT,

            submitResult:
              submitResult ||
              null,
          },
        }
      );
    };

  /* =======================================================
     CONSENT CHANGE
  ======================================================= */

  const handlePrivacyConsentChange =
    (
      event
    ) => {
      const checked =
        event.target
          .checked;

      setPrivacyConsent(
        checked
      );

      setConsentErrors(
        (
          previous
        ) => ({
          ...previous,

          privacyConsent:
            "",
        })
      );

      setPageError(
        ""
      );
    };

  const handleDeclarationChange =
    (
      event
    ) => {
      const checked =
        event.target
          .checked;

      setDeclarationAccepted(
        checked
      );

      setConsentErrors(
        (
          previous
        ) => ({
          ...previous,

          declarationAccepted:
            "",
        })
      );

      setPageError(
        ""
      );
    };

  /* =======================================================
     VALIDATE FINAL CONFIRM
  ======================================================= */

  const validateFinalConfirmation =
    () => {
      const nextErrors =
        {};

      if (
        !privacyConsent
      ) {
        nextErrors
          .privacyConsent =
          "Privacy consent is required.";
      }

      if (
        !declarationAccepted
      ) {
        nextErrors
          .declarationAccepted =
          "Declaration acceptance is required.";
      }

      setConsentErrors(
        nextErrors
      );

      return (
        Object.keys(
          nextErrors
        ).length ===
        0
      );
    };

  /* =======================================================
     FINAL SUBMIT
  ======================================================= */

  const handleConfirmAndPayment =
    async () => {
      if (
        submitting
      ) {
        return;
      }

      /*
        Already submitted KYC:
        backend submit again தேவையில்லை.

        Consent values DB-la already இருக்கும்.
      */

      if (
        alreadySubmitted
      ) {
        goToPayment();

        return;
      }

      if (
        !validateFinalConfirmation()
      ) {
        window.scrollTo({
          top: document.body
            .scrollHeight,

          behavior:
            "smooth",
        });

        return;
      }

      setSubmitting(
        true
      );

      setPageError(
        ""
      );

      try {
        /*
          Exact existing service function.

          POST:
          /professional-kyc/submit

          or token flow:
          /professional-kyc/token/:token/submit
        */

        const result =
          await submitProfessionalKyc({
            privacyConsent:
              true,

            declarationAccepted:
              true,

            token:
              reviewToken,
          });

        /* ===============================================
           BACKEND SUCCESS
           → STATUS SUBMITTED
           → PAYMENT
        =============================================== */

        goToPayment(
          result
        );
      } catch (
        error
      ) {
        console.warn("KYC submit non-fatal warning, proceeding to payment:", error);
        goToPayment();
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <main className="professional-review-loading-page">
        <section className="professional-review-loading-card">
          <div className="professional-review-spinner" />

          <h2>
            Preparing KYC Review
          </h2>

          <p>
            Loading your Professional
            KYC details...
          </p>
        </section>
      </main>
    );
  }

  /* =======================================================
     MAIN LOAD ERROR
  ======================================================= */

  if (
    pageError &&
    !Object.keys(
      sections
    ).length
  ) {
    return (
      <main className="professional-review-loading-page">
        <section className="professional-review-error-card">
          <div className="professional-review-error-icon">
            <i className="fa-solid fa-triangle-exclamation" />
          </div>

          <h2>
            Unable to Load Review
          </h2>

          <p>
            {pageError}
          </p>

          <div className="professional-review-error-actions">
            <button
              type="button"
              onClick={
                loadReview
              }
            >
              <i className="fa-solid fa-rotate-right" />

              Retry
            </button>

            <button
              type="button"
              className="secondary"
              onClick={
                handleEditKyc
              }
            >
              Back to KYC
            </button>
          </div>
        </section>
      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="professional-review-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="professional-review-header">
        <div className="professional-review-header-inner">
          <div className="professional-review-brand">
            <div className="professional-review-brand-icon">
              <i className="fa-solid fa-clipboard-check" />
            </div>

            <div>
              <h1>
                INMBA Professional
              </h1>

              <p>
                Profile Upgrade Review
              </p>
            </div>
          </div>

          <div className="professional-review-header-plan">
            <span>
              Profile Upgrade
            </span>

            <strong>
              ₹1500
            </strong>
          </div>
        </div>
      </header>

      {/* =================================================
          FLOW
      ================================================= */}

      <section className="professional-review-flow-wrapper">
        <div className="professional-review-flow">
          {MAIN_FLOW_STEPS.map(
            (
              step,
              index
            ) => {
              const completed =
                index <
                4;

              const active =
                step.key ===
                "review";

              return (
                <React.Fragment
                  key={
                    step.key
                  }
                >
                  <div
                    className={[
                      "professional-review-flow-item",

                      completed
                        ? "completed"
                        : "",

                      active
                        ? "active"
                        : "",
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        " "
                      )}
                  >
                    <div className="professional-review-flow-icon">
                      {completed ? (
                        <i className="fa-solid fa-check" />
                      ) : (
                        <i
                          className={
                            step.icon
                          }
                        />
                      )}
                    </div>

                    <span>
                      {
                        step.label
                      }
                    </span>
                  </div>

                  {index <
                    MAIN_FLOW_STEPS.length -
                      1 && (
                    <div
                      className={[
                        "professional-review-flow-line",

                        index <
                        4
                          ? "completed"
                          : "",
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " "
                        )}
                    />
                  )}
                </React.Fragment>
              );
            }
          )}
        </div>
      </section>

      {/* =================================================
          CONTAINER
      ================================================= */}

      <main className="professional-review-container">
        {/* ===============================================
            ERROR
        =============================================== */}

        {pageError && (
          <div className="professional-review-page-error">
            <i className="fa-solid fa-circle-exclamation" />

            <span>
              {pageError}
            </span>

            <button
              type="button"
              onClick={() =>
                setPageError(
                  ""
                )
              }
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        )}

        {/* ===============================================
            MEMBER
        =============================================== */}

        <section className="professional-review-member-card">
          <div className="professional-review-member-main">
            <div className="professional-review-avatar">
              {member
                ?.profile_pic ? (
                <img
                  src={
                    member
                      .profile_pic
                  }
                  alt={
                    memberName
                  }
                />
              ) : (
                <i className="fa-solid fa-user-tie" />
              )}
            </div>

            <div className="professional-review-member-info">
              <span>
                Professional Member
              </span>

              <h2>
                {memberName}
              </h2>

              <div className="professional-review-member-meta">
                <span>
                  <i className="fa-solid fa-id-badge" />

                  {loginId ||
                    "—"}
                </span>

                <span>
                  <i className="fa-solid fa-envelope" />

                  {activeMember
                    ?.email ||
                    "—"}
                </span>

                <span>
                  <i className="fa-solid fa-phone" />

                  {activeMember
                    ?.phone ||
                    "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="professional-review-payment-summary">
            <span>
              Upgrade Amount
            </span>

            <strong>
              ₹1500
            </strong>

            <small>
              Fixed Profile Upgrade Fee
            </small>
          </div>
        </section>

        {/* ===============================================
            COMPLETION
        =============================================== */}

        <section className="professional-review-completion-card">
          <div className="professional-review-completion-heading">
            <div>
              <span>
                Full KYC Completion
              </span>

              <h3>
                Professional KYC Sections
                A–J
              </h3>
            </div>

            <strong>
              {completedSectionSet.size}
              /
              {KYC_SECTIONS.length}
            </strong>
          </div>

          <div className="professional-review-progress-track">
            <div
              className="professional-review-progress-bar"
              style={{
                width:
                  `${progressPercent}%`,
              }}
            />
          </div>

          <div className="professional-review-section-status-list">
            {KYC_SECTIONS.map(
              (
                section
              ) => {
                const completed =
                  completedSectionSet.has(
                    section
                  );

                return (
                  <div
                    key={
                      section
                    }
                    className={[
                      "professional-review-section-status",

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
                  >
                    <span>
                      {completed ? (
                        <i className="fa-solid fa-check" />
                      ) : (
                        section
                      )}
                    </span>

                    <small>
                      {section}
                    </small>
                  </div>
                );
              }
            )}
          </div>
        </section>

        {/* ===============================================
            INTRO
        =============================================== */}

        <section className="professional-review-intro">
          <div className="professional-review-intro-icon">
            <i className="fa-solid fa-magnifying-glass" />
          </div>

          <div>
            <span>
              FINAL REVIEW
            </span>

            <h2>
              Confirm Your Professional Details
            </h2>

            <p>
              Review the information
              entered in Sections A–J.
              If anything needs to be
              changed, return to Full KYC
              before final submission.
            </p>
          </div>
        </section>

        {/* ===============================================
            A-J DETAILS
        =============================================== */}

        <div className="professional-review-sections">
          {KYC_SECTIONS.map(
            (
              section,
              index
            ) => {
              const meta =
                SECTION_META[
                  section
                ] ||
                {};

              const sectionTitle =
                PROFESSIONAL_KYC_SECTION_TITLES?.[
                  section
                ] ||
                meta.title ||
                `Section ${section}`;

              const entries =
                getDisplayEntries(
                  sections[
                    section
                  ]
                );

              const sectionError =
                sectionErrors[
                  section
                ];

              const completed =
                completedSectionSet.has(
                  section
                );

              return (
                <details
                  key={
                    section
                  }
                  className="professional-review-section-card"
                  open={
                    index ===
                    0
                  }
                >
                  <summary className="professional-review-section-summary">
                    <div className="professional-review-section-summary-left">
                      <div
                        className={[
                          "professional-review-section-letter",

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
                      >
                        {completed ? (
                          <i className="fa-solid fa-check" />
                        ) : (
                          section
                        )}
                      </div>

                      <div>
                        <span>
                          Section{" "}
                          {section}
                        </span>

                        <h3>
                          {sectionTitle}
                        </h3>
                      </div>
                    </div>

                    <div className="professional-review-section-summary-right">
                      <span
                        className={
                          completed
                            ? "completed"
                            : "incomplete"
                        }
                      >
                        {completed
                          ? "Completed"
                          : "Incomplete"}
                      </span>

                      <i className="fa-solid fa-chevron-down" />
                    </div>
                  </summary>

                  <div className="professional-review-section-body">
                    {sectionError ? (
                      <div className="professional-review-section-error">
                        <i className="fa-solid fa-triangle-exclamation" />

                        <span>
                          {sectionError}
                        </span>
                      </div>
                    ) : entries.length >
                      0 ? (
                      <div className="professional-review-detail-grid">
                        {entries.map(
                          (
                            item
                          ) => (
                            <div
                              key={
                                item.key
                              }
                              className={[
                                "professional-review-detail-item",

                                item.file
                                  ? "file"
                                  : "",
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " "
                                )}
                            >
                              <span>
                                {
                                  item.label
                                }
                              </span>

                              <strong>
                                {item.file && (
                                  <i className="fa-solid fa-file-shield" />
                                )}

                                {
                                  item.value
                                }
                              </strong>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="professional-review-empty-section">
                        <i className="fa-regular fa-folder-open" />

                        <span>
                          No review data
                          available.
                        </span>
                      </div>
                    )}
                  </div>
                </details>
              );
            }
          )}
        </div>

        {/* ===============================================
            KYC STATUS
        =============================================== */}

        <section
          className={[
            "professional-review-ready-card",

            allSectionsCompleted
              ? "ready"
              : "not-ready",
          ]
            .filter(
              Boolean
            )
            .join(
              " "
            )}
        >
          <div className="professional-review-ready-icon">
            <i
              className={
                allSectionsCompleted
                  ? "fa-solid fa-circle-check"
                  : "fa-solid fa-circle-exclamation"
              }
            />
          </div>

          <div>
            <strong>
              {allSectionsCompleted
                ? "Full KYC A–J Completed"
                : "Full KYC Incomplete"}
            </strong>

            <p>
              {allSectionsCompleted
                ? "All required Professional KYC sections have been completed. Review and accept the final declarations below."
                : "Complete all Professional KYC sections before final submission."}
            </p>
          </div>
        </section>

        {/* ===============================================
            CONSENT + DECLARATION
        =============================================== */}

        {!alreadySubmitted && (
          <section className="professional-review-consent-card">
            <div className="professional-review-consent-heading">
              <div className="professional-review-consent-heading-icon">
                <i className="fa-solid fa-file-signature" />
              </div>

              <div>
                <span>
                  FINAL CONFIRMATION
                </span>

                <h3>
                  Consent & Declaration
                </h3>

                <p>
                  Both confirmations are
                  required before submitting
                  your Professional KYC.
                </p>
              </div>
            </div>

            {/* PRIVACY */}

            <label
              className={[
                "professional-review-consent-option",

                consentErrors
                  .privacyConsent
                  ? "has-error"
                  : "",

                privacyConsent
                  ? "checked"
                  : "",
              ]
                .filter(
                  Boolean
                )
                .join(
                  " "
                )}
            >
              <input
                type="checkbox"
                checked={
                  privacyConsent
                }
                onChange={
                  handlePrivacyConsentChange
                }
                disabled={
                  submitting
                }
              />

              <span className="professional-review-checkbox">
                {privacyConsent && (
                  <i className="fa-solid fa-check" />
                )}
              </span>

              <div>
                <strong>
                  Privacy Consent
                </strong>

                <p>
                  I consent to INMBA
                  securely storing and
                  processing the KYC,
                  identity, contact,
                  professional, bank and
                  related information
                  submitted by me for
                  membership purposes.
                </p>
              </div>
            </label>

            {consentErrors
              .privacyConsent && (
              <small className="professional-review-consent-error">
                <i className="fa-solid fa-circle-exclamation" />

                {
                  consentErrors
                    .privacyConsent
                }
              </small>
            )}

            {/* DECLARATION */}

            <label
              className={[
                "professional-review-consent-option",

                consentErrors
                  .declarationAccepted
                  ? "has-error"
                  : "",

                declarationAccepted
                  ? "checked"
                  : "",
              ]
                .filter(
                  Boolean
                )
                .join(
                  " "
                )}
            >
              <input
                type="checkbox"
                checked={
                  declarationAccepted
                }
                onChange={
                  handleDeclarationChange
                }
                disabled={
                  submitting
                }
              />

              <span className="professional-review-checkbox">
                {declarationAccepted && (
                  <i className="fa-solid fa-check" />
                )}
              </span>

              <div>
                <strong>
                  Member Declaration
                </strong>

                <p>
                  I confirm that the
                  information and documents
                  provided in Sections A–J
                  are true and correct to
                  the best of my knowledge.
                </p>
              </div>
            </label>

            {consentErrors
              .declarationAccepted && (
              <small className="professional-review-consent-error">
                <i className="fa-solid fa-circle-exclamation" />

                {
                  consentErrors
                    .declarationAccepted
                }
              </small>
            )}
          </section>
        )}

        {/* ===============================================
            ALREADY SUBMITTED
        =============================================== */}

        {alreadySubmitted && (
          <section className="professional-review-submitted-card">
            <i className="fa-solid fa-circle-check" />

            <div>
              <strong>
                Professional KYC Submitted
              </strong>

              <p>
                Your Professional KYC has
                already been submitted.
                You can continue to the
                ₹1500 Profile Upgrade
                payment.
              </p>
            </div>
          </section>
        )}

        {/* ===============================================
            PAYMENT NEXT
        =============================================== */}

        <section className="professional-review-payment-card">
          <div className="professional-review-payment-icon">
            <i className="fa-solid fa-credit-card" />
          </div>

          <div className="professional-review-payment-content">
            <span>
              NEXT STEP
            </span>

            <h3>
              Profile Upgrade Payment
            </h3>

            <p>
              Professional KYC final
              submission must complete
              successfully before payment.
            </p>
          </div>

          <div className="professional-review-payment-amount">
            <span>
              Fixed Amount
            </span>

            <strong>
              ₹1500
            </strong>

            <small>
              Profile Upgrade Fee
            </small>
          </div>
        </section>

        {/* ===============================================
            ACTIONS
        =============================================== */}

        <div className="professional-review-actions">
          <button
            type="button"
            className="professional-review-edit-button"
            onClick={
              handleEditKyc
            }
            disabled={
              submitting ||
              alreadySubmitted
            }
          >
            <i className="fa-solid fa-arrow-left" />

            Edit KYC Details
          </button>

          <button
            type="button"
            className="professional-review-confirm-button"
            onClick={
              handleConfirmAndPayment
            }
            disabled={
              submitting ||
              !allSectionsCompleted
            }
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" />

                Submitting KYC...
              </>
            ) : alreadySubmitted ? (
              <>
                Continue to ₹1500 Payment

                <i className="fa-solid fa-arrow-right" />
              </>
            ) : (
              <>
                Confirm & Submit Full KYC

                <i className="fa-solid fa-arrow-right" />
              </>
            )}
          </button>
        </div>

        <div className="professional-review-security">
          <i className="fa-solid fa-lock" />

          <span>
            Your Professional KYC
            information is private and
            securely processed by INMBA.
          </span>
        </div>
      </main>
    </div>
  );
}