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

import {
  completeCommercialKycSection,
  getCommercialKyc,
  saveCommercialKycDraft,
} from "../../../services/commercialKyc.service";

import {
  getSelectedCommercialMembership,
} from "../../../services/commercialMembership.service";

import "./CommercialProfileUpgrade.css";

import CommercialFlowTopbar
  from "./CommercialFlowTopbar";

/* =========================================================
   CONFIG
========================================================= */

const SECTIONS = [
  {
    id: "A",
    title: "Owner Identity & KYC",
    icon: "fa-solid fa-user-shield",
  },
  {
    id: "B",
    title: "Business Legal & Registration",
    icon: "fa-solid fa-building-shield",
  },
  {
    id: "C",
    title: "Business Contact & Address",
    icon: "fa-solid fa-location-dot",
  },
  {
    id: "D",
    title: "Financial & Bank",
    icon: "fa-solid fa-building-columns",
  },
  {
    id: "E",
    title: "Business Profile & Achievements",
    icon: "fa-solid fa-store",
  },
  {
    id: "F",
    title: "Network / Royalty",
    icon: "fa-solid fa-network-wired",
  },
  {
    id: "G",
    title: "Emergency & Nominee",
    icon: "fa-solid fa-phone-volume",
  },
];

/* =========================================================
   PLAN CONFIG

   BOTH PLANS REQUIRE FULL COMMERCIAL KYC A-G
========================================================= */

const COMMERCIAL_PLAN_CONFIG = {
  basic: {
    id: "basic",
    plan_id: "basic",
    name: "Commercial Membership",
    amount: 300,
    requiresFullKyc: true,
    requires_full_kyc: true,
  },

  profile_upgrade: {
    id: "profile_upgrade",
    plan_id: "profile_upgrade",
    name: "Commercial Profile Upgrade",
    amount: 1500,
    requiresFullKyc: true,
    requires_full_kyc: true,
  },
};

const STORAGE_KEYS = {
  planId:
    "commercialSelectedPlanId",

  amount:
    "commercialSelectedPlanAmount",

  planName:
    "commercialSelectedPlanName",

  requiresFullKyc:
    "commercialRequiresFullKyc",

  sessionPlan:
    "commercial_selected_plan",
};

/* =========================================================
   EMPTY FORM
========================================================= */

const EMPTY_FORM = {
  A: {
    owner_full_legal_name: "",
    father_spouse_name: "",
    date_of_birth: "",
    gender: "",
    marital_status: "",
    nationality: "Indian",

    aadhaar_number: "",
    pan_number: "",

    passport_number: "",
    voter_id: "",
    driving_license: "",
    blood_group: "",
  },

  B: {
    business_company_name: "",
    business_type: "",

    business_registration_number: "",
    company_pan_tan: "",

    gst_applicable: false,

    shop_establishment_license_required:
      false,

    industry_license_required:
      false,
  },

  C: {
    registered_business_address: "",
    branch_locations: "",

    business_contact_number: "",
    business_email: "",

    business_website: "",
    google_map_location: "",
  },

  D: {
    bank_account_number: "",
    ifsc_code: "",
    bank_branch_name: "",

    upi_id: "",

    gst_applicable: false,
    gst_number: "",

    income_tax_declaration: "",

    nominee_name: "",
    nominee_relationship: "",
    nominee_aadhaar_id: "",
  },

  E: {
    year_established: "",
    number_of_employees: "",

    annual_turnover_slab: "",

    products_services_offered: "",
    business_category_tags: "",

    awards_certifications: "",
    client_testimonials: "",

    business_bio: "",
    social_media_links: "",
  },

  F: {
    preferred_payout_cycle: "",
  },

  G: {
    emergency_contact_name: "",
    emergency_contact_number: "",
    relationship: "",
  },
};

/* =========================================================
   EMPTY FILES
========================================================= */

const EMPTY_FILES = {
  A: {},
  B: {},
  C: {},
  D: {},
  E: {},
  F: {},
  G: {},
};

/* =========================================================
   ACCEPT TYPES
========================================================= */

const DOCUMENT_ACCEPT =
  ".pdf,.jpg,.jpeg,.png";

const IMAGE_ACCEPT =
  ".jpg,.jpeg,.png,.webp";

const VIDEO_ACCEPT =
  ".mp4,.webm,.mov";

/* =========================================================
   HELPERS
========================================================= */

const toText = (
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

  if (
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

  return String(
    value
  );
};

const normalizePlanId = (
  value
) => {
  const planId =
    String(
      value ?? ""
    ).trim();

  return [
    "basic",
    "profile_upgrade",
  ].includes(
    planId
  )
    ? planId
    : "";
};

const normalizePlanAmount = (
  value
) => {
  const amount =
    Number(
      value
    );

  return [
    300,
    1500,
  ].includes(
    amount
  )
    ? amount
    : null;
};


const safeParseJson = (
  value
) => {
  if (
    !value
  ) {
    return null;
  }

  try {
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

const inferPlanIdFromAmount = (
  value
) => {
  const amount =
    normalizePlanAmount(
      value
    );

  if (
    amount ===
    300
  ) {
    return "basic";
  }

  if (
    amount ===
    1500
  ) {
    return "profile_upgrade";
  }

  return "";
};

const normalizeSelectedMembershipResult = (
  result
) => {
  const source =
    result?.selectedPlan ||
    result?.plan ||
    result?.data?.selectedPlan ||
    result?.data?.plan ||
    result?.data ||
    result ||
    null;

  if (
    !source ||
    typeof source !==
      "object"
  ) {
    return null;
  }

  const amount =
    normalizePlanAmount(
      source.amount ??
      source.plan_amount ??
      source.selected_plan_amount
    );

  const planId =
    normalizePlanId(
      source.id ||
      source.plan_id ||
      source.selectedPlanId ||
      source.selected_plan_id ||
      source.selected_plan
    ) ||
    inferPlanIdFromAmount(
      amount
    );

  if (
    !planId
  ) {
    return null;
  }

  const config =
    COMMERCIAL_PLAN_CONFIG[
      planId
    ];

  if (
    !config
  ) {
    return null;
  }

  return {
    ...config,

    amount:
      config.amount,

    selected_plan:
      config.id,

    selected_plan_id:
      config.id,
  };
};

/* =========================================================
   SERVICE RESPONSE HELPER
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

/* =========================================================
   SERVER SECTION MERGE
========================================================= */

const mergeServerSections = (
  sections = {}
) => {
  const result = {};

  SECTIONS.forEach(
    ({
      id,
    }) => {
      const source =
        sections?.[id] ||
        {};

      result[id] = {
        ...EMPTY_FORM[id],
      };

      Object.keys(
        EMPTY_FORM[id]
      ).forEach(
        (
          key
        ) => {
          if (
            source[key] !==
              null &&
            source[key] !==
              undefined
          ) {
            result[id][key] =
              typeof EMPTY_FORM[
                id
              ][key] ===
              "boolean"
                ? Boolean(
                    source[
                      key
                    ]
                  )
                : toText(
                    source[
                      key
                    ]
                  );
          }
        }
      );
    }
  );

  return result;
};

/* =========================================================
   SMALL COMPONENT
========================================================= */

function Field({
  label,
  name,
  value,
  onChange,

  type = "text",

  placeholder = "",

  required = false,

  options = null,

  error = "",
}) {
  return (
    <div className="commercial-kyc-field">
      <label
        htmlFor={
          name
        }
      >
        {label}

        {required && (
          <span>
            *
          </span>
        )}
      </label>

      {options ? (
        <select
          id={
            name
          }
          value={
            value
          }
          onChange={(
            event
          ) =>
            onChange(
              name,
              event
                .target
                .value
            )
          }
        >
          <option value="">
            Select
          </option>

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
      ) : (
        <input
          id={
            name
          }
          type={
            type
          }
          value={
            value
          }
          placeholder={
            placeholder
          }
          onChange={(
            event
          ) =>
            onChange(
              name,
              event
                .target
                .value
            )
          }
        />
      )}

      {error && (
        <small className="commercial-kyc-field-error">
          {error}
        </small>
      )}
    </div>
  );
}

/* =========================================================
   TEXT AREA
========================================================= */

function TextAreaField({
  label,
  name,
  value,
  onChange,

  placeholder = "",

  required = false,

  error = "",
}) {
  return (
    <div className="commercial-kyc-field commercial-kyc-field-full">
      <label
        htmlFor={
          name
        }
      >
        {label}

        {required && (
          <span>
            *
          </span>
        )}
      </label>

      <textarea
        id={
          name
        }
        value={
          value
        }
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            name,
            event
              .target
              .value
          )
        }
      />

      {error && (
        <small className="commercial-kyc-field-error">
          {error}
        </small>
      )}
    </div>
  );
}

/* =========================================================
   TOGGLE FIELD
========================================================= */

function ToggleField({
  label,
  name,
  checked,
  onChange,
}) {
  return (
    <label className="commercial-kyc-toggle">
      <input
        type="checkbox"
        checked={
          Boolean(
            checked
          )
        }
        onChange={(
          event
        ) =>
          onChange(
            name,
            event
              .target
              .checked
          )
        }
      />

      <span>
        {label}
      </span>
    </label>
  );
}

/* =========================================================
   FILE FIELD
========================================================= */

function FileField({
  label,
  name,
  accept,

  multiple = false,

  required = false,

  selected,
  existing,

  onChange,

  error = "",

  description = "",
}) {
  const selectedLabel =
    Array.isArray(
      selected
    )
      ? selected
          .map(
            (
              file
            ) =>
              file.name
          )
          .join(
            ", "
          )
      : selected?.name ||
        "";

  return (
    <div className="commercial-kyc-file-field">
      <label>
        {label}

        {required && (
          <span>
            *
          </span>
        )}
      </label>

      <input
        type="file"
        accept={
          accept
        }
        multiple={
          multiple
        }
        onChange={(
          event
        ) =>
          onChange(
            name,

            multiple
              ? Array.from(
                  event
                    .target
                    .files ||
                    []
                )
              : event
                  .target
                  .files?.[0] ||
                null
          )
        }
      />

      {description && (
        <small>
          {description}
        </small>
      )}

      {selectedLabel && (
        <div className="commercial-kyc-file-status">
          <i className="fa-solid fa-circle-check" />

          New file:{" "}
          {
            selectedLabel
          }
        </div>
      )}

      {!selectedLabel &&
        existing && (
          <div className="commercial-kyc-file-status existing">
            <i className="fa-solid fa-file-shield" />

            Already uploaded
          </div>
        )}

      {error && (
        <small className="commercial-kyc-field-error">
          {error}
        </small>
      )}
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function CommercialProfileUpgrade() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  /* =======================================================
     BACKEND PLAN FALLBACK STATE
  ======================================================= */

  const [
    backendSelectedPlan,
    setBackendSelectedPlan,
  ] =
    useState(
      null
    );

  const [
    planResolving,
    setPlanResolving,
  ] =
    useState(
      true
    );

  /* =======================================================
     QUERY
  ======================================================= */

  const queryParams =
    useMemo(
      () =>
        new URLSearchParams(
          location.search
        ),
      [
        location.search,
      ]
    );

  /* =======================================================
     SESSION PLAN FALLBACK
  ======================================================= */

  const sessionSelectedPlan =
    useMemo(
      () =>
        safeParseJson(
          window.sessionStorage.getItem(
            STORAGE_KEYS.sessionPlan
          )
        ),
      [
        location.key,
      ]
    );

  /* =======================================================
     SELECTED PLAN

     Resolve from:
     1. URL query
     2. Route state
     3. localStorage
     4. sessionStorage
     5. Backend selected membership

     Also infer:
     amount 300  -> basic
     amount 1500 -> profile_upgrade
  ======================================================= */

  const selectedPlanId =
    useMemo(
      () => {
        const queryPlan =
          normalizePlanId(
            queryParams.get(
              "plan"
            )
          );

        const statePlan =
          normalizePlanId(
            location.state
              ?.selectedPlanId ||
            location.state
              ?.selected_plan_id ||
            location.state
              ?.selectedPlan ||
            location.state
              ?.selected_plan ||
            location.state
              ?.planId ||
            location.state
              ?.plan?.id ||
            location.state
              ?.plan?.plan_id
          );

        const storagePlan =
          normalizePlanId(
            window.localStorage.getItem(
              STORAGE_KEYS.planId
            )
          );

        const sessionPlan =
          normalizePlanId(
            sessionSelectedPlan
              ?.id ||
            sessionSelectedPlan
              ?.plan_id ||
            sessionSelectedPlan
              ?.selected_plan_id ||
            sessionSelectedPlan
              ?.selected_plan
          );

        const backendPlan =
          normalizePlanId(
            backendSelectedPlan
              ?.id ||
            backendSelectedPlan
              ?.plan_id ||
            backendSelectedPlan
              ?.selected_plan_id ||
            backendSelectedPlan
              ?.selected_plan
          );

        const amountHint =
          queryParams.get(
            "amount"
          ) ??
          location.state
            ?.selectedPlanAmount ??
          location.state
            ?.selected_plan_amount ??
          location.state
            ?.planAmount ??
          location.state
            ?.amount ??
          location.state
            ?.plan?.amount ??
          window.localStorage.getItem(
            STORAGE_KEYS.amount
          ) ??
          sessionSelectedPlan
            ?.amount ??
          backendSelectedPlan
            ?.amount;

        return (
          queryPlan ||
          statePlan ||
          storagePlan ||
          sessionPlan ||
          backendPlan ||
          inferPlanIdFromAmount(
            amountHint
          ) ||
          ""
        );
      },
      [
        backendSelectedPlan,
        location.state,
        queryParams,
        sessionSelectedPlan,
      ]
    );

  const selectedAmount =
    useMemo(
      () => {
        const fromQuery =
          normalizePlanAmount(
            queryParams.get(
              "amount"
            )
          );

        const fromState =
          normalizePlanAmount(
            location.state
              ?.selectedPlanAmount ??
            location.state
              ?.selected_plan_amount ??
            location.state
              ?.planAmount ??
            location.state
              ?.amount ??
            location.state
              ?.plan?.amount
          );

        const fromStorage =
          normalizePlanAmount(
            window.localStorage.getItem(
              STORAGE_KEYS.amount
            )
          );

        const fromSession =
          normalizePlanAmount(
            sessionSelectedPlan
              ?.amount
          );

        const fromBackend =
          normalizePlanAmount(
            backendSelectedPlan
              ?.amount
          );

        const fromPlan =
          COMMERCIAL_PLAN_CONFIG[
            selectedPlanId
          ]?.amount ||
          null;

        /*
          Plan ID is authoritative for the expected amount.
          This prevents:
          basic + 1500
          profile_upgrade + 300
        */

        if (
          fromPlan
        ) {
          return fromPlan;
        }

        return (
          fromQuery ||
          fromState ||
          fromStorage ||
          fromSession ||
          fromBackend ||
          null
        );
      },
      [
        backendSelectedPlan,
        location.state,
        queryParams,
        selectedPlanId,
        sessionSelectedPlan,
      ]
    );

  const selectedPlan =
    useMemo(
      () => {
        const config =
          COMMERCIAL_PLAN_CONFIG[
            selectedPlanId
          ];

        if (
          !config
        ) {
          return null;
        }

        return {
          ...config,

          amount:
            config.amount,

          selected_plan:
            config.id,

          selected_plan_id:
            config.id,
        };
      },
      [
        selectedPlanId,
      ]
    );

  /* =======================================================
     BACKEND SELECTED MEMBERSHIP FALLBACK

     This fixes direct refresh / old navigation cases where
     query/state/localStorage were not populated.
  ======================================================= */

  useEffect(
    () => {
      let mounted =
        true;

      const resolvePlan =
        async () => {
          /*
            If frontend already has a valid plan, no backend
            fallback is needed.
          */

          if (
            selectedPlan
          ) {
            if (
              mounted
            ) {
              setPlanResolving(
                false
              );
            }

            return;
          }

          try {
            setPlanResolving(
              true
            );

            const result =
              await getSelectedCommercialMembership();

            if (
              !mounted
            ) {
              return;
            }

            const resolved =
              normalizeSelectedMembershipResult(
                result
              );

            if (
              resolved
            ) {
              setBackendSelectedPlan(
                resolved
              );

              window.localStorage.setItem(
                STORAGE_KEYS.planId,
                resolved.id
              );

              window.localStorage.setItem(
                STORAGE_KEYS.amount,
                String(
                  resolved.amount
                )
              );

              window.localStorage.setItem(
                STORAGE_KEYS.planName,
                resolved.name
              );

              window.localStorage.setItem(
                STORAGE_KEYS.requiresFullKyc,
                "true"
              );

              window.sessionStorage.setItem(
                STORAGE_KEYS.sessionPlan,
                JSON.stringify(
                  resolved
                )
              );
            }
          } catch (
            requestError
          ) {
            /*
              Do not replace the real KYC error here.
              The LOAD effect below shows a clear message
              only after all plan sources have been tried.
            */

            console.error(
              "Unable to resolve selected Commercial Membership:",
              requestError
            );
          } finally {
            if (
              mounted
            ) {
              setPlanResolving(
                false
              );
            }
          }
        };

      resolvePlan();

      return () => {
        mounted =
          false;
      };
    },
    [
      selectedPlan,
    ]
  );

  /* =======================================================
     SAVE PLAN CONTEXT

     Refresh-safe and keeps URL canonical.
  ======================================================= */

  useEffect(
    () => {
      if (
        !selectedPlan
      ) {
        return;
      }

      window.localStorage.setItem(
        STORAGE_KEYS.planId,
        selectedPlan.id
      );

      window.localStorage.setItem(
        STORAGE_KEYS.amount,
        String(
          selectedPlan.amount
        )
      );

      window.localStorage.setItem(
        STORAGE_KEYS.planName,
        selectedPlan.name
      );

      window.localStorage.setItem(
        STORAGE_KEYS.requiresFullKyc,
        "true"
      );

      window.sessionStorage.setItem(
        STORAGE_KEYS.sessionPlan,
        JSON.stringify(
          selectedPlan
        )
      );

      const queryPlan =
        normalizePlanId(
          queryParams.get(
            "plan"
          )
        );

      const queryAmount =
        normalizePlanAmount(
          queryParams.get(
            "amount"
          )
        );

      /*
        If page was opened from an old route with no query,
        normalize the URL without reloading the page.
      */

      if (
        queryPlan !==
          selectedPlan.id ||
        queryAmount !==
          selectedPlan.amount
      ) {
        const query =
          new URLSearchParams({
            plan:
              selectedPlan.id,

            amount:
              String(
                selectedPlan.amount
              ),
          });

        navigate(
          `/commercial/profile-upgrade?${query.toString()}`,
          {
            replace:
              true,

            state: {
              ...(location.state ||
                {}),

              selectedPlanId:
                selectedPlan.id,

              selected_plan_id:
                selectedPlan.id,

              selectedPlanAmount:
                selectedPlan.amount,

              selected_plan_amount:
                selectedPlan.amount,

              amount:
                selectedPlan.amount,

              plan:
                selectedPlan,

              requiresFullKyc:
                true,

              requires_full_kyc:
                true,
            },
          }
        );
      }
    },
    [
      location.state,
      navigate,
      queryParams,
      selectedPlan,
    ]
  );

  const [
    activeSection,
    setActiveSection,
  ] =
    useState(
      "A"
    );

  const [
    form,
    setForm,
  ] =
    useState(
      EMPTY_FORM
    );

  const [
    files,
    setFiles,
  ] =
    useState(
      EMPTY_FILES
    );

  const [
    serverSections,
    setServerSections,
  ] =
    useState(
      {}
    );

  const [
    progress,
    setProgress,
  ] =
    useState({
      sections:
        {},

      completedCount:
        0,

      totalSections:
        7,
    });

  const [
    network,
    setNetwork,
  ] =
    useState(
      null
    );

  const [
    status,
    setStatus,
  ] =
    useState(
      "draft"
    );

  const [
    canEdit,
    setCanEdit,
  ] =
    useState(
      true
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    saving,
    setSaving,
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
    success,
    setSuccess,
  ] =
    useState(
      ""
    );

  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState(
      {}
    );

  /* =======================================================
     REVIEW EDIT MODE

     submitted / under_review:
     editable only when opened from Review.

     approved:
     always locked.
  ======================================================= */

  const fromReview =
    location.state
      ?.fromReview ===
    true;

  const normalizedStatus =
    String(
      status || ""
    ).toLowerCase();

  const locked =
    normalizedStatus ===
      "approved" ||
    (
      !fromReview &&
      [
        "submitted",
        "under_review",
      ].includes(
        normalizedStatus
      )
    );

  const effectiveCanEdit =
    !locked &&
    (
      canEdit ||
      (
        fromReview &&
        [
          "submitted",
          "under_review",
        ].includes(
          normalizedStatus
        )
      )
    );

  /* =======================================================
     APPLY SERVER DATA
  ======================================================= */

  const applyServerData =
    useCallback(
      (
        rawData
      ) => {
        const data =
          unwrapServiceResult(
            rawData
          );

        if (
          !data
        ) {
          return;
        }

        if (
          data.sections
        ) {
          setServerSections(
            data.sections
          );

          setForm(
            mergeServerSections(
              data.sections
            )
          );
        }

        if (
          data.progress
        ) {
          setProgress(
            data.progress
          );
        }

        if (
          data.network
        ) {
          setNetwork(
            data.network
          );
        }

        setStatus(
          data.status ||
            "draft"
        );

        setCanEdit(
          data.canEdit !==
            false
        );
      },
      []
    );

  /* =======================================================
     LOAD
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

            if (
              planResolving
            ) {
              return;
            }

            if (
              !selectedPlan
            ) {
              setError(
                "No Commercial Membership plan is selected. Please return to Commercial Membership and select ₹300 or ₹1500."
              );

              return;
            }

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

            applyServerData(
              data
            );

            /*
              Review page can send:
              editSection

              Other pages can send:
              section
            */

            const requestedSection =
              String(
                location
                  ?.state
                  ?.editSection ||
                location
                  ?.state
                  ?.section ||
                ""
              ).toUpperCase();

            if (
              SECTIONS.some(
                (
                  item
                ) =>
                  item.id ===
                  requestedSection
              )
            ) {
              setActiveSection(
                requestedSection
              );
            } else if (
              data.currentStep &&
              SECTIONS.some(
                (
                  item
                ) =>
                  item.id ===
                  data.currentStep
              )
            ) {
              setActiveSection(
                data.currentStep
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
              403
            ) {
              setError(
                "Your selected Commercial Membership does not currently have access to Full Commercial KYC. Backend must allow both ₹300 and ₹1500 plans."
              );
            } else if (
              statusCode ===
              401
            ) {
              setError(
                "Your login session has expired. Please login again."
              );
            } else {
              setError(
                requestError
                  ?.apiMessage ||
                requestError
                  ?.message ||
                "Unable to load Commercial KYC."
              );
            }
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
    [
      applyServerData,
      location.state,
      planResolving,
      selectedPlan,
    ]
  );

  /* =======================================================
     PROGRESS
  ======================================================= */

  const completedCount =
    useMemo(
      () => {
        return SECTIONS.reduce(
          (
            total,
            section
          ) => {
            const sectionProgress =
              progress
                ?.sections
                ?.[
                  section.id
                ];

            const completed =
              typeof sectionProgress ===
                "object"
                ? Boolean(
                    sectionProgress
                      ?.completed ??
                    sectionProgress
                      ?.isCompleted ??
                    sectionProgress
                      ?.complete
                  )
                : Boolean(
                    sectionProgress
                  );

            return (
              total +
              (
                completed
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

  const progressPercentage =
    useMemo(
      () => {
        return Math.round(
          (
            completedCount /
            SECTIONS.length
          ) *
            100
        );
      },
      [
        completedCount,
      ]
    );

  /* =======================================================
     VALUE UPDATE
  ======================================================= */

  const updateValue =
    (
      name,
      value
    ) => {
      setForm(
        (
          previous
        ) => ({
          ...previous,

          [activeSection]:
            {
              ...previous[
                activeSection
              ],

              [name]:
                value,
            },
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

      setError(
        ""
      );
    };

  /* =======================================================
     FILE UPDATE
  ======================================================= */

  const updateFile =
    (
      name,
      value
    ) => {
      setFiles(
        (
          previous
        ) => ({
          ...previous,

          [activeSection]:
            {
              ...previous[
                activeSection
              ],

              [name]:
                value,
            },
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

      setError(
        ""
      );
    };

  /* =======================================================
     GO TO REVIEW
  ======================================================= */

  const goToReview =
    useCallback(
      (
        extraState = {}
      ) => {
        if (
          !selectedPlan
        ) {
          setError(
            "Commercial Membership plan information is unavailable. Please select the plan again."
          );

          return;
        }

        const query =
          new URLSearchParams({
            plan:
              selectedPlan.id,

            amount:
              String(
                selectedPlan.amount
              ),
          });

        navigate(
          `/commercial/profile-upgrade/review?${query.toString()}`,
          {
            state: {
              fromCommercialKyc:
                true,

              selectedPlanId:
                selectedPlan.id,

              selected_plan_id:
                selectedPlan.id,

              selectedPlan:
                selectedPlan.id,

              selected_plan:
                selectedPlan.id,

              selectedPlanAmount:
                selectedPlan.amount,

              selected_plan_amount:
                selectedPlan.amount,

              amount:
                selectedPlan.amount,

              plan:
                selectedPlan,

              requiresFullKyc:
                true,

              requires_full_kyc:
                true,

              ...extraState,
            },
          }
        );
      },
      [
        navigate,
        selectedPlan,
      ]
    );

  /* =======================================================
     SAVE DRAFT / SAVE & CONTINUE

     A -> B
     B -> C
     C -> D
     D -> E
     E -> F
     F -> G
     G -> REVIEW
  ======================================================= */

  const handleSave =
    async (
      completed
    ) => {
      if (
        !effectiveCanEdit
      ) {
        setError(
          normalizedStatus ===
            "approved"
            ? "Approved Commercial KYC cannot be edited."
            : "Commercial KYC is currently locked."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        setError(
          ""
        );

        setSuccess(
          ""
        );

        setFieldErrors(
          {}
        );

        const values =
          form[
            activeSection
          ] || {};

        const uploadFiles =
          files[
            activeSection
          ] || {};

        let result;

        if (
          completed
        ) {
          result =
            await completeCommercialKycSection(
              activeSection,
              {
                values,

                files:
                  uploadFiles,
              }
            );
        } else {
          result =
            await saveCommercialKycDraft(
              activeSection,
              {
                values,

                files:
                  uploadFiles,
              }
            );
        }

        const data =
          unwrapServiceResult(
            result
          );

        applyServerData(
          data
        );

        setFiles(
          (
            previous
          ) => ({
            ...previous,

            [activeSection]:
              {},
          })
        );

        if (
          selectedPlan
        ) {
          window.sessionStorage.setItem(
            STORAGE_KEYS.sessionPlan,
            JSON.stringify(
              selectedPlan
            )
          );
        }

        if (
          completed
        ) {
          const currentIndex =
            SECTIONS.findIndex(
              (
                section
              ) =>
                section.id ===
                activeSection
            );

          const nextSection =
            SECTIONS[
              currentIndex + 1
            ];

          if (
            nextSection
          ) {
            setActiveSection(
              nextSection.id
            );

            setSuccess(
              `Section ${activeSection} completed successfully.`
            );

            setError(
              ""
            );

            setFieldErrors(
              {}
            );

            window.scrollTo({
              top:
                0,

              behavior:
                "smooth",
            });

            return;
          }

          /*
            SECTION G COMPLETED
            -> REVIEW PAGE

            NO DIRECT PAYMENT.
          */

          goToReview({
            commercialKycCompleted:
              true,

            savedSection:
              activeSection,

            sectionCompleted:
              true,
          });

          return;
        }

        setSuccess(
          `Section ${activeSection} draft saved successfully.`
        );

        window.scrollTo({
          top:
            0,

          behavior:
            "smooth",
        });
      } catch (
        requestError
      ) {
        setFieldErrors(
          requestError
            ?.fieldErrors ||
            {}
        );

        setError(
          requestError
            ?.apiMessage ||
          requestError
            ?.message ||
          (
            completed
              ? `Please complete Section ${activeSection} correctly before continuing.`
              : `Unable to save Section ${activeSection} draft.`
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

  /* =======================================================
     SECTION CONTENT
  ======================================================= */

  const renderSection =
    () => {
      const values =
        form[
          activeSection
        ] ||
        {};

      const sectionFiles =
        files[
          activeSection
        ] ||
        {};

      const existing =
        serverSections[
          activeSection
        ] ||
        {};

      /* ===================================================
         SECTION A
      =================================================== */

      if (
        activeSection ===
        "A"
      ) {
        return (
          <>
            <div className="commercial-kyc-form-grid">
              <Field
                label="Owner Full Legal Name"
                name="owner_full_legal_name"
                value={
                  values.owner_full_legal_name
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.owner_full_legal_name
                }
              />

              <Field
                label="Father / Spouse Name"
                name="father_spouse_name"
                value={
                  values.father_spouse_name
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.father_spouse_name
                }
              />

              <Field
                label="Date of Birth"
                name="date_of_birth"
                type="date"
                value={
                  values.date_of_birth
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.date_of_birth
                }
              />

              <Field
                label="Gender"
                name="gender"
                value={
                  values.gender
                }
                onChange={
                  updateValue
                }
                options={[
                  "Male",
                  "Female",
                  "Other",
                ]}
              />

              <Field
                label="Marital Status"
                name="marital_status"
                value={
                  values.marital_status
                }
                onChange={
                  updateValue
                }
                options={[
                  "Single",
                  "Married",
                  "Other",
                ]}
              />

              <Field
                label="Nationality"
                name="nationality"
                value={
                  values.nationality
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.nationality
                }
              />

              <Field
                label="Aadhaar Number"
                name="aadhaar_number"
                value={
                  values.aadhaar_number
                }
                onChange={
                  updateValue
                }
                placeholder="12 digit Aadhaar"
                required
                error={
                  fieldErrors.aadhaar_number
                }
              />

              <Field
                label="PAN Number"
                name="pan_number"
                value={
                  values.pan_number
                }
                onChange={
                  updateValue
                }
                placeholder="ABCDE1234F"
                required
                error={
                  fieldErrors.pan_number
                }
              />

              <Field
                label="Passport Number"
                name="passport_number"
                value={
                  values.passport_number
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Voter ID"
                name="voter_id"
                value={
                  values.voter_id
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Driving License"
                name="driving_license"
                value={
                  values.driving_license
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Blood Group"
                name="blood_group"
                value={
                  values.blood_group
                }
                onChange={
                  updateValue
                }
                options={[
                  "A+",
                  "A-",
                  "B+",
                  "B-",
                  "AB+",
                  "AB-",
                  "O+",
                  "O-",
                ]}
              />
            </div>

            <div className="commercial-kyc-upload-grid">
              <FileField
                label="Aadhaar Front"
                name="aadhaar_front"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.aadhaar_front
                }
                existing={
                  existing.aadhaar_front
                }
                onChange={
                  updateFile
                }
                required
                error={
                  fieldErrors.aadhaar_front
                }
                description="PDF, JPG or PNG · Max 5 MB"
              />

              <FileField
                label="Aadhaar Back"
                name="aadhaar_back"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.aadhaar_back
                }
                existing={
                  existing.aadhaar_back
                }
                onChange={
                  updateFile
                }
                required
                error={
                  fieldErrors.aadhaar_back
                }
                description="PDF, JPG or PNG · Max 5 MB"
              />

              <FileField
                label="PAN Card Scan"
                name="pan_card_scan"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.pan_card_scan
                }
                existing={
                  existing.pan_card_scan
                }
                onChange={
                  updateFile
                }
                required
                error={
                  fieldErrors.pan_card_scan
                }
                description="PDF, JPG or PNG · Max 5 MB"
              />
            </div>
          </>
        );
      }

      /* ===================================================
         SECTION B
      =================================================== */

      if (
        activeSection ===
        "B"
      ) {
        return (
          <>
            <div className="commercial-kyc-form-grid">
              <Field
                label="Business / Company Name"
                name="business_company_name"
                value={
                  values.business_company_name
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.business_company_name
                }
              />

              <Field
                label="Business Type"
                name="business_type"
                value={
                  values.business_type
                }
                onChange={
                  updateValue
                }
                options={[
                  "Proprietorship",
                  "Partnership",
                  "Pvt Ltd",
                  "LLP",
                ]}
                required
                error={
                  fieldErrors.business_type
                }
              />

              <Field
                label="Udyam / MSME Registration No."
                name="business_registration_number"
                value={
                  values.business_registration_number
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.business_registration_number
                }
              />

              <Field
                label="Company PAN / TAN"
                name="company_pan_tan"
                value={
                  values.company_pan_tan
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.company_pan_tan
                }
              />
            </div>

            <div className="commercial-kyc-toggle-list">
              <ToggleField
                label="GST applicable to this business"
                name="gst_applicable"
                checked={
                  values.gst_applicable
                }
                onChange={
                  updateValue
                }
              />

              <ToggleField
                label="Shop & Establishment License required"
                name="shop_establishment_license_required"
                checked={
                  values.shop_establishment_license_required
                }
                onChange={
                  updateValue
                }
              />

              <ToggleField
                label="FSSAI / Industry License required"
                name="industry_license_required"
                checked={
                  values.industry_license_required
                }
                onChange={
                  updateValue
                }
              />
            </div>

            <div className="commercial-kyc-upload-grid">
              <FileField
                label="GST Certificate"
                name="gst_certificate"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.gst_certificate
                }
                existing={
                  existing.gst_certificate
                }
                onChange={
                  updateFile
                }
                required={
                  values.gst_applicable
                }
                error={
                  fieldErrors.gst_certificate
                }
              />

              <FileField
                label="Shop & Establishment License"
                name="shop_establishment_license"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.shop_establishment_license
                }
                existing={
                  existing.shop_establishment_license
                }
                onChange={
                  updateFile
                }
                error={
                  fieldErrors.shop_establishment_license
                }
              />

              <FileField
                label="Trade License"
                name="trade_license"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.trade_license
                }
                existing={
                  existing.trade_license
                }
                onChange={
                  updateFile
                }
              />

              <FileField
                label="FSSAI / Industry License"
                name="industry_specific_license"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.industry_specific_license
                }
                existing={
                  existing.industry_specific_license
                }
                onChange={
                  updateFile
                }
                error={
                  fieldErrors.industry_specific_license
                }
              />

              <FileField
                label="Incorporation Certificate"
                name="incorporation_certificate"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.incorporation_certificate
                }
                existing={
                  existing.incorporation_certificate
                }
                onChange={
                  updateFile
                }
                error={
                  fieldErrors.incorporation_certificate
                }
              />

              <FileField
                label="Partnership Deed / MOA-AOA"
                name="partnership_deed_moa_aoa"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.partnership_deed_moa_aoa
                }
                existing={
                  existing.partnership_deed_moa_aoa
                }
                onChange={
                  updateFile
                }
                error={
                  fieldErrors.partnership_deed_moa_aoa
                }
              />

              <FileField
                label="Authorized Signatory ID Proof"
                name="authorized_signatory_id_proof"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.authorized_signatory_id_proof
                }
                existing={
                  existing.authorized_signatory_id_proof
                }
                onChange={
                  updateFile
                }
                required
                error={
                  fieldErrors.authorized_signatory_id_proof
                }
              />
            </div>
          </>
        );
      }

      /* ===================================================
         SECTION C
      =================================================== */

      if (
        activeSection ===
        "C"
      ) {
        return (
          <div className="commercial-kyc-form-grid">
            <TextAreaField
              label="Registered Business Address"
              name="registered_business_address"
              value={
                values.registered_business_address
              }
              onChange={
                updateValue
              }
              required
              error={
                fieldErrors.registered_business_address
              }
            />

            <TextAreaField
              label="Branch Locations"
              name="branch_locations"
              value={
                values.branch_locations
              }
              onChange={
                updateValue
              }
              placeholder="Separate multiple branches using comma"
            />

            <Field
              label="Business Contact Number"
              name="business_contact_number"
              value={
                values.business_contact_number
              }
              onChange={
                updateValue
              }
              required
              error={
                fieldErrors.business_contact_number
              }
            />

            <Field
              label="Business Email"
              name="business_email"
              type="email"
              value={
                values.business_email
              }
              onChange={
                updateValue
              }
              required
              error={
                fieldErrors.business_email
              }
            />

            <Field
              label="Business Website"
              name="business_website"
              value={
                values.business_website
              }
              onChange={
                updateValue
              }
              placeholder="https://example.com"
              error={
                fieldErrors.business_website
              }
            />

            <Field
              label="Google Map Location / Pin"
              name="google_map_location"
              value={
                values.google_map_location
              }
              onChange={
                updateValue
              }
            />
          </div>
        );
      }

      /* ===================================================
         SECTION D
      =================================================== */

      if (
        activeSection ===
        "D"
      ) {
        return (
          <>
            <div className="commercial-kyc-form-grid">
              <Field
                label="Bank Account Number"
                name="bank_account_number"
                value={
                  values.bank_account_number
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.bank_account_number
                }
              />

              <Field
                label="IFSC Code"
                name="ifsc_code"
                value={
                  values.ifsc_code
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.ifsc_code
                }
              />

              <Field
                label="Bank Branch Name"
                name="bank_branch_name"
                value={
                  values.bank_branch_name
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.bank_branch_name
                }
              />

              <Field
                label="UPI ID"
                name="upi_id"
                value={
                  values.upi_id
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="GST Number"
                name="gst_number"
                value={
                  values.gst_number
                }
                onChange={
                  updateValue
                }
                error={
                  fieldErrors.gst_number
                }
              />

              <Field
                label="Income Tax / 15G-15H"
                name="income_tax_declaration"
                value={
                  values.income_tax_declaration
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Nominee Name"
                name="nominee_name"
                value={
                  values.nominee_name
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Nominee Relationship"
                name="nominee_relationship"
                value={
                  values.nominee_relationship
                }
                onChange={
                  updateValue
                }
              />

              <Field
                label="Nominee Aadhaar / ID"
                name="nominee_aadhaar_id"
                value={
                  values.nominee_aadhaar_id
                }
                onChange={
                  updateValue
                }
              />
            </div>

            <div className="commercial-kyc-upload-grid">
              <FileField
                label="Passbook / Cancelled Cheque"
                name="bank_proof"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.bank_proof
                }
                existing={
                  existing.bank_proof
                }
                onChange={
                  updateFile
                }
                required
                error={
                  fieldErrors.bank_proof
                }
                description="PDF, JPG or PNG · Max 5 MB"
              />

              <FileField
                label="Nominee ID Document"
                name="nominee_id_document"
                accept={
                  DOCUMENT_ACCEPT
                }
                selected={
                  sectionFiles.nominee_id_document
                }
                existing={
                  existing.nominee_id_document
                }
                onChange={
                  updateFile
                }
              />
            </div>
          </>
        );
      }

      /* ===================================================
         SECTION E
      =================================================== */

      if (
        activeSection ===
        "E"
      ) {
        return (
          <>
            <div className="commercial-kyc-form-grid">
              <Field
                label="Year Established"
                name="year_established"
                type="number"
                value={
                  values.year_established
                }
                onChange={
                  updateValue
                }
                error={
                  fieldErrors.year_established
                }
              />

              <Field
                label="Number of Employees"
                name="number_of_employees"
                type="number"
                value={
                  values.number_of_employees
                }
                onChange={
                  updateValue
                }
                error={
                  fieldErrors.number_of_employees
                }
              />

              <Field
                label="Annual Turnover Slab"
                name="annual_turnover_slab"
                value={
                  values.annual_turnover_slab
                }
                onChange={
                  updateValue
                }
                options={[
                  "Below ₹5 Lakh",
                  "₹5 Lakh - ₹10 Lakh",
                  "₹10 Lakh - ₹25 Lakh",
                  "₹25 Lakh - ₹50 Lakh",
                  "₹50 Lakh - ₹1 Crore",
                  "₹1 Crore - ₹5 Crore",
                  "Above ₹5 Crore",
                ]}
              />

              <Field
                label="Business Category Tags"
                name="business_category_tags"
                value={
                  values.business_category_tags
                }
                onChange={
                  updateValue
                }
                placeholder="Retail, Technology, Services..."
                required
                error={
                  fieldErrors.business_category_tags
                }
              />

              <TextAreaField
                label="Products / Services Offered"
                name="products_services_offered"
                value={
                  values.products_services_offered
                }
                onChange={
                  updateValue
                }
                required
                error={
                  fieldErrors.products_services_offered
                }
              />

              <TextAreaField
                label="Awards / Certifications"
                name="awards_certifications"
                value={
                  values.awards_certifications
                }
                onChange={
                  updateValue
                }
              />

              <TextAreaField
                label="Client Testimonials"
                name="client_testimonials"
                value={
                  values.client_testimonials
                }
                onChange={
                  updateValue
                }
              />

              <TextAreaField
                label="Business Bio / About Us"
                name="business_bio"
                value={
                  values.business_bio
                }
                onChange={
                  updateValue
                }
              />

              <TextAreaField
                label="Social Media Links"
                name="social_media_links"
                value={
                  values.social_media_links
                }
                onChange={
                  updateValue
                }
                placeholder="Instagram, Facebook, LinkedIn..."
              />
            </div>

            <div className="commercial-kyc-upload-grid">
              <FileField
                label="Business Logo / Photo"
                name="business_logo"
                accept={
                  IMAGE_ACCEPT
                }
                selected={
                  sectionFiles.business_logo
                }
                existing={
                  existing.business_logo
                }
                onChange={
                  updateFile
                }
                required
                error={
                  fieldErrors.business_logo
                }
                description="JPG, PNG or WEBP · Max 5 MB"
              />

              <FileField
                label="Gallery Photos"
                name="gallery_photos"
                accept={
                  IMAGE_ACCEPT
                }
                selected={
                  sectionFiles.gallery_photos
                }
                existing={
                  existing.gallery_photos
                }
                onChange={
                  updateFile
                }
                multiple
                description="Maximum 10 photos · 5 MB each"
              />

              <FileField
                label="Promo Video"
                name="promo_video"
                accept={
                  VIDEO_ACCEPT
                }
                selected={
                  sectionFiles.promo_video
                }
                existing={
                  existing.promo_video
                }
                onChange={
                  updateFile
                }
                description="MP4, WEBM or MOV · Max 50 MB"
              />
            </div>
          </>
        );
      }

      /* ===================================================
         SECTION F
      =================================================== */

      if (
        activeSection ===
        "F"
      ) {
        return (
          <>
            <div className="commercial-kyc-network-panel">
              <div>
                <span>
                  Referral ID
                </span>

                <strong>
                  {
                    network
                      ?.referral_id ||
                    network
                      ?.referralId ||
                    "System Generated"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Network Rank
                </span>

                <strong>
                  {
                    network
                      ?.commercial_network_level ||
                    network
                      ?.networkLevelRank ||
                    "Not assigned"
                  }
                </strong>
              </div>

              <div>
                <span>
                  Team Size
                </span>

                <strong>
                  {
                    network
                      ?.team_size ??
                    network
                      ?.teamSize ??
                    0
                  }
                </strong>
              </div>

              <div>
                <span>
                  Royalty Slab
                </span>

                <strong>
                  {
                    network
                      ?.commercial_royalty_slab_category ||
                    network
                      ?.royaltySlabCategory ||
                    "Not assigned"
                  }
                </strong>
              </div>
            </div>

            <div className="commercial-kyc-form-grid">
              <Field
                label="Preferred Payout Cycle"
                name="preferred_payout_cycle"
                value={
                  values.preferred_payout_cycle
                }
                onChange={
                  updateValue
                }
                options={[
                  "Monthly",
                  "Quarterly",
                ]}
              />
            </div>

            <p className="commercial-kyc-readonly-note">
              <i className="fa-solid fa-lock" />

              Referral, rank, team size and royalty slab are controlled by the INMBA system.
            </p>
          </>
        );
      }

      /* ===================================================
         SECTION G
      =================================================== */

      return (
        <div className="commercial-kyc-form-grid">
          <Field
            label="Emergency Contact Name"
            name="emergency_contact_name"
            value={
              values.emergency_contact_name
            }
            onChange={
              updateValue
            }
            required
            error={
              fieldErrors.emergency_contact_name
            }
          />

          <Field
            label="Emergency Contact Number"
            name="emergency_contact_number"
            value={
              values.emergency_contact_number
            }
            onChange={
              updateValue
            }
            required
            error={
              fieldErrors.emergency_contact_number
            }
          />

          <Field
            label="Relationship"
            name="relationship"
            value={
              values.relationship
            }
            onChange={
              updateValue
            }
            required
            error={
              fieldErrors.relationship
            }
          />
        </div>
      );
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading ||
    planResolving
  ) {
    return (
      <div className="commercial-kyc-loading">
        Loading Commercial KYC...
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="commercial-kyc-page">
      <CommercialFlowTopbar />

      <section className="commercial-kyc-shell">
        {/* HEADER */}

        <header className="commercial-kyc-header">
          <span>
            COMMERCIAL FULL KYC
            {selectedPlan
              ? ` · ₹${Number(
                  selectedPlan.amount
                ).toLocaleString(
                  "en-IN"
                )}`
              : ""}
          </span>

          <h1>
            Complete your Business KYC
          </h1>

          <p>
            Complete Commercial KYC Sections A–G,
            review your business information and
            continue with your selected membership
            payment.
          </p>

          {selectedPlan && (
            <div className="commercial-kyc-plan-summary">
              <i className="fa-solid fa-receipt" />

              <span>
                Selected plan:
              </span>

              <strong>
                {selectedPlan.name}
                {" · "}
                ₹
                {Number(
                  selectedPlan.amount
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>
          )}

          <div className="commercial-kyc-progress-wrap">
            <div>
              <span>
                {
                  progressPercentage
                }
                % Complete
              </span>

              <strong>
                {
                  completedCount
                }
                /7 Sections
              </strong>
            </div>

            <div className="commercial-kyc-progress-track">
              <span
                style={{
                  width:
                    `${progressPercentage}%`,
                }}
              />
            </div>
          </div>
        </header>

        {/* STEPS */}

        <div className="commercial-kyc-steps">
          {SECTIONS.map(
            (
              section
            ) => {
              const sectionProgress =
                progress
                  ?.sections
                  ?.[
                    section.id
                  ];

              const completed =
                typeof sectionProgress ===
                  "object"
                  ? Boolean(
                      sectionProgress
                        ?.completed ??
                      sectionProgress
                        ?.isCompleted ??
                      sectionProgress
                        ?.complete
                    )
                  : Boolean(
                      sectionProgress
                    );

              return (
                <button
                  key={
                    section.id
                  }
                  type="button"
                  className={[
                    activeSection ===
                    section.id
                      ? "active"
                      : "",

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
                  onClick={() => {
                    setActiveSection(
                      section.id
                    );

                    setError(
                      ""
                    );

                    setSuccess(
                      ""
                    );

                    setFieldErrors(
                      {}
                    );
                  }}
                >
                  <b>
                    {completed ? (
                      <i className="fa-solid fa-check" />
                    ) : (
                      section.id
                    )}
                  </b>

                  <span>
                    {
                      section.title
                    }
                  </span>
                </button>
              );
            }
          )}
        </div>

        {/* ERROR */}

        {error && (
          <div className="commercial-kyc-error">
            <i className="fa-solid fa-circle-exclamation" />

            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="commercial-kyc-success">
            <i className="fa-solid fa-circle-check" />

            {success}
          </div>
        )}

        {/* LOCKED */}

        {locked ? (
          <section className="commercial-kyc-card commercial-kyc-locked-card">
            <i className="fa-solid fa-file-circle-check" />

            <h2>
              Commercial KYC{" "}
              {
                normalizedStatus ===
                "approved"
                  ? "Approved"
                  : "Submitted"
              }
            </h2>

            <p>
              {normalizedStatus ===
              "approved"
                ? "Your Commercial KYC has been approved and is now locked."
                : "Your Commercial KYC has been submitted. Review your saved details before continuing to payment."}
            </p>

            {normalizedStatus !==
              "approved" && (
              <button
                type="button"
                className="commercial-kyc-next"
                onClick={() =>
                  goToReview({
                    commercialKycSubmitted:
                      true,
                  })
                }
              >
                Review KYC

                <i className="fa-solid fa-arrow-right" />
              </button>
            )}
          </section>
        ) : (
          <section className="commercial-kyc-card">
            {/* SECTION HEADING */}

            <div className="commercial-kyc-section-heading">
              <span>
                SECTION{" "}
                {
                  activeSection
                }
              </span>

              <h2>
                {
                  SECTIONS.find(
                    (
                      item
                    ) =>
                      item.id ===
                      activeSection
                  )?.title
                }
              </h2>
            </div>

            {/* REVIEW EDIT NOTICE */}

            {fromReview && (
              <div className="commercial-kyc-review-edit-note">
                <i className="fa-solid fa-pen-to-square" />

                <span>
                  You are editing Commercial KYC from the Review page.
                  Save your changes and return to Review.
                </span>
              </div>
            )}

            {/* SECTION CONTENT */}

            {renderSection()}

            {/* ACTIONS */}

            <div className="commercial-kyc-actions">
              <button
                type="button"
                className="commercial-kyc-draft"
                disabled={
                  saving ||
                  !effectiveCanEdit
                }
                onClick={() =>
                  handleSave(
                    false
                  )
                }
              >
                <i className="fa-regular fa-floppy-disk" />

                {
                  saving
                    ? "Saving..."
                    : "Save Draft"
                }
              </button>

              <button
                type="button"
                className="commercial-kyc-next"
                disabled={
                  saving ||
                  !effectiveCanEdit
                }
                onClick={() =>
                  handleSave(
                    true
                  )
                }
              >
                {
                  saving
                    ? "Saving..."
                    : activeSection ===
                        "G"
                      ? "Save & Review"
                      : "Save & Continue"
                }

                {!saving && (
                  <i className="fa-solid fa-arrow-right" />
                )}
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
