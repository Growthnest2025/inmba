import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getCommercialKyc,
  submitCommercialKyc,
} from "../../../services/commercialKyc.service";

import "./CommercialReview.css";

import CommercialFlowTopbar
  from "./CommercialFlowTopbar";

/* =========================================================
   SECTIONS
========================================================= */

const SECTIONS = [
  {
    id: "A",
    title: "Owner Identity & KYC",
  },
  {
    id: "B",
    title: "Business Legal & Registration",
  },
  {
    id: "C",
    title: "Business Contact & Address",
  },
  {
    id: "D",
    title: "Financial & Bank",
  },
  {
    id: "E",
    title: "Business Profile & Achievements",
  },
  {
    id: "F",
    title: "Network / Royalty",
  },
  {
    id: "G",
    title: "Emergency & Nominee",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const unwrapServiceResult = (
  result
) => {
  if (
    result?.data &&
    typeof result.data ===
      "object" &&
    !Array.isArray(
      result.data
    )
  ) {
    return result.data;
  }

  if (
    result &&
    typeof result ===
      "object"
  ) {
    return result;
  }

  return {};
};

const toText = (
  value
) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (
    Array.isArray(
      value
    )
  ) {
    return (
      value.join(
        ", "
      ) ||
      "—"
    );
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value
      ? "Yes"
      : "No";
  }

  if (
    typeof value ===
    "object"
  ) {
    return "Available";
  }

  return String(
    value
  );
};

/* =========================================================
   MASK
========================================================= */

const maskValue = (
  value,
  visible = 4
) => {
  const text =
    String(
      value || ""
    )
      .replace(
        /\s/g,
        ""
      )
      .trim();

  if (!text) {
    return "—";
  }

  if (
    text.length <=
    visible
  ) {
    return "••••";
  }

  return `${"•".repeat(
    Math.max(
      4,
      text.length -
        visible
    )
  )}${text.slice(
    -visible
  )}`;
};

/* =========================================================
   FILE STATUS
========================================================= */

const fileStatus = (
  value
) => {
  if (
    Array.isArray(
      value
    )
  ) {
    if (
      value.length ===
      0
    ) {
      return "—";
    }

    return `${value.length} File(s) Uploaded`;
  }

  if (
    typeof value ===
      "string" &&
    value.trim()
  ) {
    return "Uploaded";
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    return "Uploaded";
  }

  return "—";
};

/* =========================================================
   REVIEW ROW
========================================================= */

function ReviewRow({
  label,
  value,
  full = false,
}) {
  return (
    <div
      className={[
        "commercial-review-row",

        full
          ? "commercial-review-row-full"
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
        {label}
      </span>

      <strong>
        {value || "—"}
      </strong>
    </div>
  );
}

/* =========================================================
   SELECTED COMMERCIAL PLAN

   Supports:
   basic           -> ₹300
   profile_upgrade -> ₹1500
========================================================= */

const COMMERCIAL_PLAN_MAP = {
  basic: {
    id: "basic",
    plan_id: "basic",
    planId: "basic",
    name: "Commercial Membership",
    amount: 300,
    requiresFullKyc: true,
    requires_full_kyc: true,
  },

  profile_upgrade: {
    id: "profile_upgrade",
    plan_id: "profile_upgrade",
    planId: "profile_upgrade",
    name: "Commercial Profile Upgrade",
    amount: 1500,
    requiresFullKyc: true,
    requires_full_kyc: true,
  },
};

const readStoredJson = (
  storage,
  key
) => {
  try {
    const value =
      storage?.getItem(
        key
      );

    if (!value) {
      return null;
    }

    const parsed =
      JSON.parse(
        value
      );

    return (
      parsed &&
      typeof parsed ===
        "object"
    )
      ? parsed
      : null;
  } catch {
    return null;
  }
};

const resolveCommercialSelectedPlan =
  () => {
    const sessionPlan =
      readStoredJson(
        sessionStorage,
        "commercial_selected_plan"
      );

    const storedPlanId =
      String(
        sessionPlan?.id ??
        sessionPlan?.planId ??
        sessionPlan?.plan_id ??
        localStorage.getItem(
          "commercialSelectedPlanId"
        ) ??
        ""
      )
        .trim()
        .toLowerCase();

    const storedAmount =
      Number(
        sessionPlan?.amount ??
        localStorage.getItem(
          "commercialSelectedPlanAmount"
        ) ??
        0
      );

    if (
      storedPlanId &&
      COMMERCIAL_PLAN_MAP[
        storedPlanId
      ]
    ) {
      return {
        ...COMMERCIAL_PLAN_MAP[
          storedPlanId
        ],
      };
    }

    if (
      storedAmount ===
      300
    ) {
      return {
        ...COMMERCIAL_PLAN_MAP.basic,
      };
    }

    if (
      storedAmount ===
      1500
    ) {
      return {
        ...COMMERCIAL_PLAN_MAP
          .profile_upgrade,
      };
    }

    /*
      Safe fallback for older ₹1500 flow.
      Normally Membership page should already
      have stored the selected plan.
    */
    return {
      ...COMMERCIAL_PLAN_MAP
        .profile_upgrade,
    };
  };

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function CommercialReview() {
  const navigate =
    useNavigate();

  const selectedPlan =
    useMemo(
      () =>
        resolveCommercialSelectedPlan(),
      []
    );

  const [
    kyc,
    setKyc,
  ] =
    useState(
      null
    );

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
    error,
    setError,
  ] =
    useState(
      ""
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

  /* =======================================================
     LOAD KYC
  ======================================================= */

  useEffect(
    () => {
      let mounted =
        true;

      const load =
        async () => {
          try {
            setLoading(
              true
            );

            setError(
              ""
            );

            const result =
              await getCommercialKyc();

            if (
              !mounted
            ) {
              return;
            }

            const data =
              unwrapServiceResult(
                result
              );

            setKyc(
              data
            );

            /*
              If consent already exists,
              restore it.
            */

            if (
              data
                ?.progress
                ?.privacyConsent !==
              undefined
            ) {
              setPrivacyConsent(
                Boolean(
                  data
                    .progress
                    .privacyConsent
                )
              );
            }

            if (
              data
                ?.progress
                ?.declarationAccepted !==
              undefined
            ) {
              setDeclarationAccepted(
                Boolean(
                  data
                    .progress
                    .declarationAccepted
                )
              );
            }
          } catch (
            requestError
          ) {
            if (
              !mounted
            ) {
              return;
            }

            setError(
              requestError
                ?.apiMessage ||
                "Unable to load Commercial KYC preview."
            );
          } finally {
            if (
              mounted
            ) {
              setLoading(
                false
              );
            }
          }
        };

      load();

      return () => {
        mounted =
          false;
      };
    },
    []
  );

  /* =======================================================
     DATA
  ======================================================= */

  const sections =
    kyc?.sections ||
    {};

const progress =
  useMemo(
    () =>
      kyc?.progress ||
      {},
    [
      kyc?.progress,
    ]
  );

  const network =
    kyc?.network ||
    {};

  /* =======================================================
     COMPLETED COUNT
  ======================================================= */

  const completedCount =
    useMemo(
      () => {
        return SECTIONS.reduce(
          (
            total,
            section
          ) => {
            return (
              total +
              (
                progress
                  ?.sections
                  ?.[
                    section.id
                  ]
                  ? 1
                  : 0
              )
            );
          },
          0
        );
      },
      [
        progress,
      ]
    );

  /* =======================================================
     PROGRESS %
  ======================================================= */

  const progressPercentage =
    useMemo(
      () => {
        return Math.round(
          (
            completedCount /
            7
          ) *
            100
        );
      },
      [
        completedCount,
      ]
    );

  /* =======================================================
     100% COMPLETE?
  ======================================================= */

  const isKyc100PercentComplete =
    completedCount ===
    7;

  /* =======================================================
     FIRST INCOMPLETE
  ======================================================= */

  const firstIncompleteSection =
    useMemo(
      () => {
        return (
          SECTIONS.find(
            (
              section
            ) =>
              !Boolean(
                progress
                  ?.sections
                  ?.[
                    section.id
                  ]
              )
          ) || null
        );
      },
      [
        progress,
      ]
    );

  /* =======================================================
     FINAL SUBMIT
  ======================================================= */

  const goToPayment =
    () => {
      sessionStorage.setItem(
        "commercial_selected_plan",
        JSON.stringify(
          selectedPlan
        )
      );

      localStorage.setItem(
        "commercialSelectedPlanId",
        selectedPlan.id
      );

      localStorage.setItem(
        "commercialSelectedPlanAmount",
        String(
          selectedPlan.amount
        )
      );

      localStorage.setItem(
        "commercialSelectedPlanName",
        selectedPlan.name
      );

      localStorage.setItem(
        "commercialRequiresFullKyc",
        "true"
      );

      navigate(
        "/commercial/payment",
        {
          replace:
            true,

          state: {
            fromCommercialReview:
              true,

            plan:
              selectedPlan,

            planId:
              selectedPlan.id,

            selectedPlanId:
              selectedPlan.id,

            selected_plan_id:
              selectedPlan.id,

            amount:
              selectedPlan.amount,

            planAmount:
              selectedPlan.amount,

            selectedPlanAmount:
              selectedPlan.amount,

            selected_plan_amount:
              selectedPlan.amount,

            requiresFullKyc:
              true,

            requires_full_kyc:
              true,
          },
        }
      );
    };

  const handleSubmit =
    async () => {
      if (
        !isKyc100PercentComplete
      ) {
        setError(
          "Complete all Commercial KYC sections A-G before final submission."
        );

        return;
      }

      if (
        !privacyConsent ||
        !declarationAccepted
      ) {
        setError(
          "Please accept Privacy Consent and Declaration."
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        setError(
          ""
        );

        /*
          IMPORTANT:
          Do NOT call saveCommercialKycConsent()
          before final submit.

          submitCommercialKyc() already sends
          privacyConsent + declarationAccepted
          to the backend final-submit endpoint.
        */

        await submitCommercialKyc({
          privacyConsent:
            true,

          declarationAccepted:
            true,
        });

        goToPayment();
      } catch (
        requestError
      ) {
        const errorCode =
          String(
            requestError
              ?.errorCode ||
            ""
          )
            .trim()
            .toUpperCase();

        const message =
          String(
            requestError
              ?.apiMessage ||
            requestError
              ?.message ||
            ""
          );

        /*
          Retry-safe:
          If a previous click already completed
          KYC submission, do not try to edit/save
          KYC again. Continue to Payment.
        */
        if (
          errorCode ===
            "COMMERCIAL_KYC_ALREADY_SUBMITTED" ||
          /already been submitted/i
            .test(
              message
            )
        ) {
          goToPayment();

          return;
        }

        setError(
          message ||
          "Unable to submit Commercial KYC."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* =======================================================
     CONTINUE KYC
  ======================================================= */

  const handleContinueKyc =
    () => {
      navigate(
        "/commercial/profile-upgrade",
        {
          state: {
            section:
              firstIncompleteSection
                ?.id ||
              "A",
          },
        }
      );
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <main className="commercial-review-page">
        <CommercialFlowTopbar />
        <div className="commercial-review-loading">
          <span className="commercial-review-spinner" />

          Loading
          Commercial KYC
          Preview...
        </div>
      </main>
    );
  }

  /* =======================================================
     SECTION VALUES
  ======================================================= */

  const A =
    sections.A ||
    {};

  const B =
    sections.B ||
    {};

  const C =
    sections.C ||
    {};

  const D =
    sections.D ||
    {};

  const E =
    sections.E ||
    {};

  const F =
    sections.F ||
    {};

  const G =
    sections.G ||
    {};

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="commercial-review-page">
      <div className="commercial-review-shell">

        {/* =================================================
            TOPBAR
        ================================================= */}

        <div className="commercial-review-topbar">
          <div className="commercial-review-brand">
            <div className="commercial-review-brand-icon">
              <i className="fa-solid fa-store" />
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

          <button
            type="button"
            className="commercial-review-edit-top"
            disabled={
              submitting
            }
            onClick={() =>
              navigate(
                "/commercial/profile-upgrade"
              )
            }
          >
            <i className="fa-solid fa-arrow-left" />

            Edit KYC
          </button>
        </div>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="commercial-review-hero">
          <div>
            <span className="commercial-review-eyebrow">
              ₹{selectedPlan.amount}
              {" "}
              {selectedPlan.id ===
              "basic"
                ? "COMMERCIAL MEMBERSHIP"
                : "PROFILE UPGRADE"}
            </span>

            <h1>
              Commercial KYC
              Preview
            </h1>

            <p>
              Review your saved
              Commercial details.
              Final KYC submission
              will be available only
              after all seven
              sections are 100%
              complete.
            </p>
          </div>

          <div className="commercial-review-progress-card">
            <span>
              KYC Progress
            </span>

            <strong>
              {
                progressPercentage
              }
              %
            </strong>

            <small>
              {
                completedCount
              }
              /7 Sections
              Complete
            </small>
          </div>
        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="commercial-review-error">
            <i className="fa-solid fa-circle-exclamation" />

            <span>
              {error}
            </span>
          </div>
        )}

        {/* =================================================
            PROGRESS STATUS
        ================================================= */}

        {!isKyc100PercentComplete && (
          <section className="commercial-review-card">
            <div className="commercial-review-section-title">
              <b>
                <i className="fa-solid fa-clock" />
              </b>

              <div>
                <span>
                  Commercial KYC
                  Incomplete
                </span>

                <small>
                  Complete all
                  A-G sections
                  before final
                  submission.
                </small>
              </div>
            </div>

            <div className="commercial-review-incomplete">
              <strong>
                {
                  progressPercentage
                }
                % Complete
              </strong>

              <p>
                {
                  completedCount
                }
                {" "}
                of 7 sections
                are completed.
              </p>

              {firstIncompleteSection && (
                <p>
                  Next incomplete
                  section:{" "}
                  <strong>
                    {
                      firstIncompleteSection.id
                    }
                    {" - "}
                    {
                      firstIncompleteSection.title
                    }
                  </strong>
                </p>
              )}

              <button
                type="button"
                className="commercial-review-button primary"
                onClick={
                  handleContinueKyc
                }
              >
                <i className="fa-solid fa-pen-to-square" />

                Continue
                Commercial KYC
              </button>
            </div>
          </section>
        )}

        {/* =================================================
            SECTION A
        ================================================= */}

        <section className="commercial-review-card">
          <div className="commercial-review-section-title">
            <b>
              A
            </b>

            <div>
              <span>
                Owner Identity
                & KYC
              </span>

              <small>
                Sensitive values
                are masked.
              </small>
            </div>
          </div>

          <div className="commercial-review-grid">
            <ReviewRow
              label="Owner Full Legal Name"
              value={
                toText(
                  A.owner_full_legal_name
                )
              }
            />

            <ReviewRow
              label="Father / Spouse Name"
              value={
                toText(
                  A.father_spouse_name
                )
              }
            />

            <ReviewRow
              label="Date of Birth"
              value={
                toText(
                  A.date_of_birth
                )
              }
            />

            <ReviewRow
              label="Gender"
              value={
                toText(
                  A.gender
                )
              }
            />

            <ReviewRow
              label="Marital Status"
              value={
                toText(
                  A.marital_status
                )
              }
            />

            <ReviewRow
              label="Nationality"
              value={
                toText(
                  A.nationality
                )
              }
            />

            <ReviewRow
              label="Aadhaar Number"
              value={
                maskValue(
                  A.aadhaar_number
                )
              }
            />

            <ReviewRow
              label="PAN Number"
              value={
                maskValue(
                  A.pan_number
                )
              }
            />

            <ReviewRow
              label="Aadhaar Front"
              value={
                fileStatus(
                  A.aadhaar_front
                )
              }
            />

            <ReviewRow
              label="Aadhaar Back"
              value={
                fileStatus(
                  A.aadhaar_back
                )
              }
            />

            <ReviewRow
              label="PAN Card"
              value={
                fileStatus(
                  A.pan_card_scan
                )
              }
            />
          </div>
        </section>

        {/* =================================================
            SECTION B
        ================================================= */}

        <section className="commercial-review-card">
          <div className="commercial-review-section-title">
            <b>
              B
            </b>

            <div>
              <span>
                Business Legal
                & Registration
              </span>

              <small>
                Business legal
                information.
              </small>
            </div>
          </div>

          <div className="commercial-review-grid">
            <ReviewRow
              label="Business / Company Name"
              value={
                toText(
                  B.business_company_name
                )
              }
            />

            <ReviewRow
              label="Business Type"
              value={
                toText(
                  B.business_type
                )
              }
            />

            <ReviewRow
              label="Registration Number"
              value={
                toText(
                  B.business_registration_number
                )
              }
            />

            <ReviewRow
              label="Company PAN / TAN"
              value={
                maskValue(
                  B.company_pan_tan
                )
              }
            />

            <ReviewRow
              label="GST Applicable"
              value={
                toText(
                  B.gst_applicable
                )
              }
            />

            <ReviewRow
              label="GST Certificate"
              value={
                fileStatus(
                  B.gst_certificate
                )
              }
            />

            <ReviewRow
              label="Authorized Signatory ID"
              value={
                fileStatus(
                  B.authorized_signatory_id_proof
                )
              }
            />
          </div>
        </section>

        {/* =================================================
            SECTION C
        ================================================= */}

        <section className="commercial-review-card">
          <div className="commercial-review-section-title">
            <b>
              C
            </b>

            <div>
              <span>
                Business Contact
                & Address
              </span>

              <small>
                Contact and
                location details.
              </small>
            </div>
          </div>

          <div className="commercial-review-grid">
            <ReviewRow
              label="Business Contact"
              value={
                toText(
                  C.business_contact_number
                )
              }
            />

            <ReviewRow
              label="Business Email"
              value={
                toText(
                  C.business_email
                )
              }
            />

            <ReviewRow
              label="Business Website"
              value={
                toText(
                  C.business_website
                )
              }
            />

            <ReviewRow
              label="Google Map Location"
              value={
                toText(
                  C.google_map_location
                )
              }
            />

            <ReviewRow
              label="Registered Business Address"
              value={
                toText(
                  C.registered_business_address
                )
              }
              full
            />

            <ReviewRow
              label="Branch Locations"
              value={
                toText(
                  C.branch_locations
                )
              }
              full
            />
          </div>
        </section>

        {/* =================================================
            SECTION D
        ================================================= */}

        <section className="commercial-review-card">
          <div className="commercial-review-section-title">
            <b>
              D
            </b>

            <div>
              <span>
                Financial &
                Bank
              </span>

              <small>
                Sensitive bank
                values are masked.
              </small>
            </div>
          </div>

          <div className="commercial-review-grid">
            <ReviewRow
              label="Bank Account"
              value={
                maskValue(
                  D.bank_account_number
                )
              }
            />

            <ReviewRow
              label="IFSC Code"
              value={
                toText(
                  D.ifsc_code
                )
              }
            />

            <ReviewRow
              label="Bank Branch"
              value={
                toText(
                  D.bank_branch_name
                )
              }
            />

            <ReviewRow
              label="UPI ID"
              value={
                toText(
                  D.upi_id
                )
              }
            />

            <ReviewRow
              label="GST Number"
              value={
                toText(
                  D.gst_number
                )
              }
            />

            <ReviewRow
              label="Nominee Name"
              value={
                toText(
                  D.nominee_name
                )
              }
            />

            <ReviewRow
              label="Nominee Relationship"
              value={
                toText(
                  D.nominee_relationship
                )
              }
            />

            <ReviewRow
              label="Bank Proof"
              value={
                fileStatus(
                  D.bank_proof
                )
              }
            />
          </div>
        </section>

        {/* =================================================
            SECTION E
        ================================================= */}

        <section className="commercial-review-card">
          <div className="commercial-review-section-title">
            <b>
              E
            </b>

            <div>
              <span>
                Business Profile
                & Achievements
              </span>

              <small>
                Public-facing
                business profile.
              </small>
            </div>
          </div>

          <div className="commercial-review-grid">
            <ReviewRow
              label="Year Established"
              value={
                toText(
                  E.year_established
                )
              }
            />

            <ReviewRow
              label="Number of Employees"
              value={
                toText(
                  E.number_of_employees
                )
              }
            />

            <ReviewRow
              label="Annual Turnover"
              value={
                toText(
                  E.annual_turnover_slab
                )
              }
            />

            <ReviewRow
              label="Business Categories"
              value={
                toText(
                  E.business_category_tags
                )
              }
            />

            <ReviewRow
              label="Products / Services"
              value={
                toText(
                  E.products_services_offered
                )
              }
              full
            />

            <ReviewRow
              label="Awards / Certifications"
              value={
                toText(
                  E.awards_certifications
                )
              }
              full
            />

            <ReviewRow
              label="Client Testimonials"
              value={
                toText(
                  E.client_testimonials
                )
              }
              full
            />

            <ReviewRow
              label="Business Bio"
              value={
                toText(
                  E.business_bio
                )
              }
              full
            />

            <ReviewRow
              label="Social Media"
              value={
                toText(
                  E.social_media_links
                )
              }
              full
            />

            <ReviewRow
              label="Business Logo"
              value={
                fileStatus(
                  E.business_logo
                )
              }
            />

            <ReviewRow
              label="Gallery Photos"
              value={
                fileStatus(
                  E.gallery_photos
                )
              }
            />

            <ReviewRow
              label="Promo Video"
              value={
                fileStatus(
                  E.promo_video
                )
              }
            />
          </div>
        </section>

        {/* =================================================
            SECTION F
        ================================================= */}

        <section className="commercial-review-card">
          <div className="commercial-review-section-title">
            <b>
              F
            </b>

            <div>
              <span>
                Network /
                Royalty
              </span>

              <small>
                INMBA network
                information.
              </small>
            </div>
          </div>

          <div className="commercial-review-grid">
            <ReviewRow
              label="Referral ID"
              value={
                toText(
                  network.referral_id ||
                  network.referralId
                )
              }
            />

            <ReviewRow
              label="Network Rank"
              value={
                toText(
                  network.commercial_network_level ||
                  network.networkLevelRank
                )
              }
            />

            <ReviewRow
              label="Team Size"
              value={
                toText(
                  network.team_size ??
                  network.teamSize
                )
              }
            />

            <ReviewRow
              label="Royalty Slab"
              value={
                toText(
                  network.commercial_royalty_slab_category ||
                  network.royaltySlabCategory
                )
              }
            />

            <ReviewRow
              label="Preferred Payout Cycle"
              value={
                toText(
                  F.preferred_payout_cycle
                )
              }
            />
          </div>
        </section>

        {/* =================================================
            SECTION G
        ================================================= */}

        <section className="commercial-review-card">
          <div className="commercial-review-section-title">
            <b>
              G
            </b>

            <div>
              <span>
                Emergency &
                Nominee
              </span>

              <small>
                Emergency contact
                information.
              </small>
            </div>
          </div>

          <div className="commercial-review-grid">
            <ReviewRow
              label="Emergency Contact Name"
              value={
                toText(
                  G.emergency_contact_name
                )
              }
            />

            <ReviewRow
              label="Emergency Contact Number"
              value={
                toText(
                  G.emergency_contact_number
                )
              }
            />

            <ReviewRow
              label="Relationship"
              value={
                toText(
                  G.relationship
                )
              }
            />
          </div>
        </section>

        {/* =================================================
            NOT 100%
        ================================================= */}

        {!isKyc100PercentComplete && (
          <div className="commercial-review-actions">
            <button
              type="button"
              className="commercial-review-button secondary"
              onClick={() =>
                navigate(
                  "/commercial/profile-upgrade"
                )
              }
            >
              <i className="fa-solid fa-pen" />

              Edit KYC
            </button>

            <button
              type="button"
              className="commercial-review-button primary"
              onClick={
                handleContinueKyc
              }
            >
              Continue KYC

              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        )}

        {/* =================================================
            100% COMPLETE ONLY
        ================================================= */}

        {isKyc100PercentComplete && (
          <>
            <section className="commercial-review-card commercial-review-consent-card">
              <div className="commercial-review-section-title">
                <b>
                  <i className="fa-solid fa-shield-halved" />
                </b>

                <div>
                  <span>
                    Final
                    Declaration
                  </span>

                  <small>
                    Your KYC is
                    100% complete.
                  </small>
                </div>
              </div>

              <label className="commercial-review-consent">
                <input
                  type="checkbox"
                  checked={
                    privacyConsent
                  }
                  disabled={
                    submitting
                  }
                  onChange={(
                    event
                  ) => {
                    setPrivacyConsent(
                      event
                        .target
                        .checked
                    );

                    setError(
                      ""
                    );
                  }}
                />

                <span>
                  I agree to the
                  Privacy Policy
                  and consent to
                  secure Commercial
                  KYC processing.
                </span>
              </label>

              <label className="commercial-review-consent">
                <input
                  type="checkbox"
                  checked={
                    declarationAccepted
                  }
                  disabled={
                    submitting
                  }
                  onChange={(
                    event
                  ) => {
                    setDeclarationAccepted(
                      event
                        .target
                        .checked
                    );

                    setError(
                      ""
                    );
                  }}
                />

                <span>
                  I confirm that
                  all Commercial
                  information shown
                  above is accurate.
                </span>
              </label>
            </section>

            <div className="commercial-review-actions">
              <button
                type="button"
                className="commercial-review-button secondary"
                disabled={
                  submitting
                }
                onClick={() =>
                  navigate(
                    "/commercial/profile-upgrade"
                  )
                }
              >
                <i className="fa-solid fa-pen" />

                Edit KYC
              </button>

              <button
                type="button"
                className="commercial-review-button primary"
                disabled={
                  submitting ||
                  !privacyConsent ||
                  !declarationAccepted
                }
                onClick={
                  handleSubmit
                }
              >
                {submitting ? (
                  <>
                    <span className="commercial-review-button-spinner" />

                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Full
                    Commercial KYC

                    <i className="fa-solid fa-arrow-right" />
                  </>
                )}
              </button>
            </div>
          </>
        )}

        <p className="commercial-review-security-note">
          <i className="fa-solid fa-lock" />

          Aadhaar, PAN and
          bank account values
          are masked on this
          preview screen.
        </p>
      </div>
    </main>
  );
}