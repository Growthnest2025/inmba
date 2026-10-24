import React, {
  useEffect,
  useState,
} from "react";

import {
  toast,
} from "react-toastify";

import {
  updatePublicProfile,
} from "../../../services/publicProfile.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./ProfessionalVisibility.css";
import { toText } from "../../../utils/commonHelpers";

/* =========================================================
   HELPERS
========================================================= */

const toArray = (
  value
) => {
  if (
    Array.isArray(
      value
    )
  ) {
    return value
      .map(
        (
          item
        ) =>
          toText(
            item
          )
      )
      .filter(
        Boolean
      );
  }

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  if (
    typeof value ===
    "string"
  ) {
    const text =
      value.trim();

    if (
      !text
    ) {
      return [];
    }

    try {
      const parsed =
        JSON.parse(
          text
        );

      if (
        Array.isArray(
          parsed
        )
      ) {
        return parsed
          .map(
            (
              item
            ) =>
              toText(
                item
              )
          )
          .filter(
            Boolean
          );
      }
    } catch {
      /*
        Legacy comma separated values.
      */
    }

    return text
      .split(
        /[,|\n]/
      )
      .map(
        (
          item
        ) =>
          item.trim()
      )
      .filter(
        Boolean
      );
  }

  return [];
};

/* =========================================================
   VISIBILITY OPTIONS

   IMPORTANT:

   These are the ONLY optional Professional fields
   currently allowed by backend.

   Qualification uses both DB aliases.
========================================================= */

const VISIBILITY_OPTIONS = [
  {
    id:
      "phone",

    title:
      "Primary Mobile",

    description:
      "Allow visitors to see your primary mobile number.",

    icon:
      "fas fa-phone",

    fields: [
      "phone",
    ],

    getValue:
      (
        profile
      ) =>
        toText(
          profile?.phone,
          "Not provided"
        ),
  },

  {
    id:
      "qualification",

    title:
      "Highest Qualification",

    description:
      "Show your highest educational qualification publicly.",

    icon:
      "fas fa-graduation-cap",

    fields: [
      "education",
      "educational_qualification",
    ],

    getValue:
      (
        profile
      ) =>
        toText(
          profile
            ?.educational_qualification ??
          profile
            ?.education,
          "Not provided"
        ),
  },

  {
    id:
      "rate",

    title:
      "Hourly / Project Rate",

    description:
      "Allow visitors to see your professional service rate.",

    icon:
      "fas fa-indian-rupee-sign",

    fields: [
      "hourly_project_rate",
    ],

    getValue:
      (
        profile
      ) =>
        toText(
          profile
            ?.hourly_project_rate,
          "Not provided"
        ),
  },
];

/* =========================================================
   NORMALIZE SAVED SETTINGS

   Old aliases are supported while reading.

   Saving always writes canonical field names.
========================================================= */

const getInitialFieldSet = (
  profile
) => {
  const storedFields =
    new Set(
      toArray(
        profile
          ?.public_profile_fields
      )
        .map(
          (
            field
          ) =>
            field
              .toLowerCase()
              .replace(
                /\s+/g,
                "_"
              )
        )
    );

  const result =
    new Set();

  /* =======================================================
     PHONE
  ======================================================= */

  if (
    storedFields.has(
      "phone"
    ) ||
    storedFields.has(
      "mobile"
    ) ||
    storedFields.has(
      "primary_mobile"
    ) ||
    storedFields.has(
      "contact_number"
    )
  ) {
    result.add(
      "phone"
    );
  }

  /* =======================================================
     QUALIFICATION
  ======================================================= */

  if (
    storedFields.has(
      "education"
    ) ||
    storedFields.has(
      "educational_qualification"
    ) ||
    storedFields.has(
      "qualification"
    ) ||
    storedFields.has(
      "highest_qualification"
    )
  ) {
    result.add(
      "education"
    );

    result.add(
      "educational_qualification"
    );
  }

  /* =======================================================
     RATE
  ======================================================= */

  if (
    storedFields.has(
      "hourly_project_rate"
    ) ||
    storedFields.has(
      "hourly_rate"
    ) ||
    storedFields.has(
      "project_rate"
    ) ||
    storedFields.has(
      "rate"
    )
  ) {
    result.add(
      "hourly_project_rate"
    );
  }

  return result;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ProfessionalVisibility({
  profile,
  onSaved,
}) {
  const [
    selectedFields,
    setSelectedFields,
  ] =
    useState(
      () =>
        getInitialFieldSet(
          profile
        )
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  /* =======================================================
     SYNC WHEN OWNER PROFILE RELOADS
  ======================================================= */

  useEffect(
    () => {
      setSelectedFields(
        getInitialFieldSet(
          profile
        )
      );
    },
    [
      profile,
    ]
  );

  /* =======================================================
     CHECK OPTION
  ======================================================= */

  const isOptionEnabled = (
    option
  ) => {
    return option.fields
      .some(
        (
          field
        ) =>
          selectedFields.has(
            field
          )
      );
  };

  /* =======================================================
     TOGGLE
  ======================================================= */

  const handleToggle = (
    option
  ) => {
    if (
      saving
    ) {
      return;
    }

    setSelectedFields(
      (
        previous
      ) => {
        const next =
          new Set(
            previous
          );

        const enabled =
          option.fields
            .some(
              (
                field
              ) =>
                next.has(
                  field
                )
            );

        if (
          enabled
        ) {
          option.fields
            .forEach(
              (
                field
              ) => {
                next.delete(
                  field
                );
              }
            );
        } else {
          option.fields
            .forEach(
              (
                field
              ) => {
                next.add(
                  field
                );
              }
            );
        }

        return next;
      }
    );
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave =
    async () => {
      if (
        saving
      ) {
        return;
      }

      try {
        setSaving(
          true
        );

        const result =
          await updatePublicProfile({
            public_profile_fields:
              Array.from(
                selectedFields
              ),
          });

        toast.success(
          result?.message ||
          "Public visibility updated successfully."
        );

        if (
          typeof onSaved ===
          "function"
        ) {
          await onSaved(
            result
          );
        }
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to update public profile visibility."
          )
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <section className="professional-visibility-card">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="professional-visibility-header">
        <div className="professional-visibility-header-icon">
          <i
            className="fas fa-eye"
            aria-hidden="true"
          ></i>
        </div>

        <div>
          <p>
            Professional Profile
          </p>

          <h2>
            Public Profile Visibility
          </h2>

          <span>
            Choose which optional details visitors can see
            when they scan your QR code.
          </span>
        </div>
      </div>

      {/* =================================================
          SECURITY NOTICE
      ================================================= */}

      <div className="professional-visibility-security">
        <i
          className="fas fa-shield-halved"
          aria-hidden="true"
        ></i>

        <div>
          <strong>
            Your sensitive information stays protected
          </strong>

          <p>
            Aadhaar, PAN, DOB, email, full address, bank,
            nominee, referral, royalty and emergency details
            cannot be made public from this page.
          </p>
        </div>
      </div>

      {/* =================================================
          OPTIONAL SETTINGS
      ================================================= */}

      <div className="professional-visibility-section-heading">
        <div>
          <h3>
            Optional Public Details
          </h3>

          <p>
            You control these three fields.
          </p>
        </div>
      </div>

      <div className="professional-visibility-options">
        {VISIBILITY_OPTIONS.map(
          (
            option
          ) => {
            const enabled =
              isOptionEnabled(
                option
              );

            const currentValue =
              option.getValue(
                profile
              );

            return (
              <article
                key={
                  option.id
                }
                className={`professional-visibility-option ${
                  enabled
                    ? "professional-visibility-option-enabled"
                    : ""
                }`}
              >
                <div className="professional-visibility-option-main">
                  <span className="professional-visibility-option-icon">
                    <i
                      className={
                        option.icon
                      }
                      aria-hidden="true"
                    ></i>
                  </span>

                  <div className="professional-visibility-option-content">
                    <div className="professional-visibility-option-title">
                      <h4>
                        {
                          option.title
                        }
                      </h4>

                      <span
                        className={
                          enabled
                            ? "professional-visibility-badge professional-visibility-badge-public"
                            : "professional-visibility-badge professional-visibility-badge-private"
                        }
                      >
                        {enabled
                          ? "Public"
                          : "Private"}
                      </span>
                    </div>

                    <p>
                      {
                        option.description
                      }
                    </p>

                    <div className="professional-visibility-current-value">
                      <span>
                        Current Value
                      </span>

                      <strong>
                        {currentValue}
                      </strong>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={`professional-visibility-toggle ${
                    enabled
                      ? "professional-visibility-toggle-on"
                      : ""
                  }`}
                  onClick={() =>
                    handleToggle(
                      option
                    )
                  }
                  disabled={
                    saving
                  }
                  aria-pressed={
                    enabled
                  }
                  aria-label={`${option.title}: ${
                    enabled
                      ? "Public"
                      : "Private"
                  }`}
                >
                  <span></span>
                </button>
              </article>
            );
          }
        )}
      </div>

      {/* =================================================
          ALWAYS PUBLIC
      ================================================= */}

      <div className="professional-visibility-summary-grid">
        <div className="professional-visibility-summary professional-visibility-summary-public">
          <div className="professional-visibility-summary-title">
            <i
              className="fas fa-earth-asia"
              aria-hidden="true"
            ></i>

            <h3>
              Public Profile Details
            </h3>
          </div>

          <p>
            These Professional profile details are designed
            for public display when information is available.
          </p>

          <div className="professional-visibility-tags">
            <span>
              Display Name
            </span>

            <span>
              Username
            </span>

            <span>
              District
            </span>

            <span>
              State
            </span>

            <span>
              Pincode
            </span>

            <span>
              School / College
            </span>

            <span>
              Certifications
            </span>

            <span>
              Languages
            </span>

            <span>
              Achievements
            </span>

            <span>
              Experience
            </span>

            <span>
              Skills
            </span>

            <span>
              Bio
            </span>

            <span>
              Availability
            </span>

            <span>
              Portfolio
            </span>

            <span>
              Network Rank
            </span>
          </div>
        </div>

        {/* =================================================
            ALWAYS PRIVATE
        ================================================= */}

        <div className="professional-visibility-summary professional-visibility-summary-private">
          <div className="professional-visibility-summary-title">
            <i
              className="fas fa-lock"
              aria-hidden="true"
            ></i>

            <h3>
              Always Private
            </h3>
          </div>

          <p>
            These details cannot be enabled for QR/public
            visitors.
          </p>

          <div className="professional-visibility-tags">
            <span>
              Legal Name
            </span>

            <span>
              DOB
            </span>

            <span>
              Aadhaar
            </span>

            <span>
              PAN
            </span>

            <span>
              Email
            </span>

            <span>
              Full Address
            </span>

            <span>
              KYC Documents
            </span>

            <span>
              Bank Details
            </span>

            <span>
              Nominee
            </span>

            <span>
              Referral ID
            </span>

            <span>
              Team Size
            </span>

            <span>
              Royalty
            </span>

            <span>
              Emergency Contact
            </span>
          </div>
        </div>
      </div>

      {/* =================================================
          SAVE
      ================================================= */}

      <div className="professional-visibility-actions">
        <div className="professional-visibility-help">
          <i
            className="fas fa-circle-info"
            aria-hidden="true"
          ></i>

          <span>
            Changes affect your QR/Public Profile only.
            Your own dashboard continues to show your full details.
          </span>
        </div>

        <button
          type="button"
          className="professional-visibility-save"
          onClick={
            handleSave
          }
          disabled={
            saving
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

              Save Visibility
            </>
          )}
        </button>
      </div>
    </section>
  );
}