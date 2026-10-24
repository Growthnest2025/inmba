import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  getProfilePictureForm,
  submitProfilePictureDetails,
  validateKycImage,
} from "../../../services/kyc.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./ProfilePicture.css";
import { toText } from "../../../utils/commonHelpers";

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM = {
  profile_pic: null,

  educational_qualification: "",

  contact_number: "",

  whatsapp_number: "",

  nomini_name: "",

  nomini_dob: "",

  nomini_relationship: "",

  nomini_aadhar: "",

  witness_name: "",

  witness_phone: "",

  witness_inmba_id: "",

  social_links: [""],

  declaration: false,
};

/* =========================================================
   TEXT
========================================================= */

/* =========================================================
   SOCIAL LINKS
========================================================= */

const normalizeSocialLinks = (
  value
) => {
  if (
    Array.isArray(
      value
    )
  ) {
    const links =
      value
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

    return links.length
      ? links
      : [""];
  }

  const text =
    toText(
      value
    );

  if (!text) {
    return [""];
  }

  const links =
    text
      .split(",")
      .map(
        (
          item
        ) =>
          item.trim()
      )
      .filter(
        Boolean
      );

  return links.length
    ? links
    : [""];
};

/* =========================================================
   CREATE FORM
========================================================= */

const createForm = (
  data = {}
) => ({
  profile_pic:
    null,

  educational_qualification:
    toText(
      data.educational_qualification
    ),

  contact_number:
    toText(
      data.contact_number
    ),

  whatsapp_number:
    toText(
      data.whatsapp_number
    ),

  nomini_name:
    toText(
      data.nomini_name
    ),

  nomini_dob:
    data.nomini_dob
      ? String(
          data.nomini_dob
        ).slice(
          0,
          10
        )
      : "",

  nomini_relationship:
    toText(
      data.nomini_relationship
    ),

  nomini_aadhar:
    toText(
      data.nomini_aadhar
    ),

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

  social_links:
    normalizeSocialLinks(
      data.social_link ??
        data.social_links
    ),

  declaration:
    false,
});

/* =========================================================
   PROFILE PICTURE PAGE
========================================================= */

export default function ProfilePicture() {
  const {
    token,
  } =
    useParams();

  const navigate =
    useNavigate();

  const [
    form,
    setForm,
  ] =
    useState(
      INITIAL_FORM
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
    pageError,
    setPageError,
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

  const [
    profilePreview,
    setProfilePreview,
  ] =
    useState(
      ""
    );

  /* =======================================================
     TOKEN
  ======================================================= */

  const safeToken =
    useMemo(
      () =>
        toText(
          token
        ),
      [
        token,
      ]
    );

  /* =======================================================
     LOAD
  ======================================================= */

  const loadProfileDetails =
    useCallback(
      async ({
        signal,
      } = {}) => {
        if (
          !safeToken
        ) {
          setPageError(
            "KYC token is missing."
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

          setPageError(
            ""
          );

          const result =
            await getProfilePictureForm(
              safeToken,
              {
                signal,
              }
            );

          const existingData =
            result.profile ||
            result.existingData ||
            result.member ||
            result.data ||
            {};

          setForm(
            createForm(
              existingData
            )
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

          if (
            cancelled
          ) {
            return;
          }

          setPageError(
            getApiErrorMessage(
              requestError,
              requestError?.apiMessage ||
                "Unable to load profile details."
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
        safeToken,
      ]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadProfileDetails({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadProfileDetails,
    ]
  );

  /* =======================================================
     PREVIEW CLEANUP
  ======================================================= */

  useEffect(
    () => {
      return () => {
        if (
          profilePreview
        ) {
          URL.revokeObjectURL(
            profilePreview
          );
        }
      };
    },
    [
      profilePreview,
    ]
  );

  /* =======================================================
     INPUT CHANGE
  ======================================================= */

  const handleChange =
    (
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
        type ===
        "checkbox"
          ? checked
          : value;

      /* NUMERIC FIELDS */

      if (
        [
          "contact_number",
          "whatsapp_number",
          "nomini_aadhar",
          "witness_phone",
        ].includes(
          name
        )
      ) {
        nextValue =
          value.replace(
            /\D/g,
            ""
          );
      }

      setForm(
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

      setPageError(
        ""
      );
    };

  /* =======================================================
     PROFILE PHOTO
  ======================================================= */

  const handleProfilePhoto =
    (
      event
    ) => {
      const file =
        event.target
          .files?.[0] ||
        null;

      event.target.value =
        "";

      if (!file) {
        return;
      }

      const validation =
        validateKycImage(
          file,
          {
            required:
              false,

            maxSizeMb:
              5,
          }
        );

      if (
        !validation.valid
      ) {
        setFieldErrors(
          (
            previous
          ) => ({
            ...previous,

            profile_pic:
              validation.error,
          })
        );

        toast.error(
          validation.error
        );

        return;
      }

      if (
        profilePreview
      ) {
        URL.revokeObjectURL(
          profilePreview
        );
      }

      const nextPreview =
        URL.createObjectURL(
          file
        );

      setProfilePreview(
        nextPreview
      );

      setForm(
        (
          previous
        ) => ({
          ...previous,

          profile_pic:
            file,
        })
      );

      setFieldErrors(
        (
          previous
        ) => ({
          ...previous,

          profile_pic:
            "",
        })
      );
    };

  /* =======================================================
     REMOVE PHOTO
  ======================================================= */

  const removeProfilePhoto =
    () => {
      if (
        profilePreview
      ) {
        URL.revokeObjectURL(
          profilePreview
        );
      }

      setProfilePreview(
        ""
      );

      setForm(
        (
          previous
        ) => ({
          ...previous,

          profile_pic:
            null,
        })
      );
    };

  /* =======================================================
     SOCIAL LINK CHANGE
  ======================================================= */

  const handleSocialLinkChange =
    (
      index,
      value
    ) => {
      setForm(
        (
          previous
        ) => {
          const links = [
            ...previous.social_links,
          ];

          links[index] =
            value;

          return {
            ...previous,

            social_links:
              links,
          };
        }
      );
    };

  /* =======================================================
     ADD SOCIAL LINK
  ======================================================= */

  const addSocialLink =
    () => {
      setForm(
        (
          previous
        ) => ({
          ...previous,

          social_links: [
            ...previous.social_links,
            "",
          ],
        })
      );
    };

  /* =======================================================
     REMOVE SOCIAL LINK
  ======================================================= */

  const removeSocialLink =
    (
      index
    ) => {
      setForm(
        (
          previous
        ) => {
          const links =
            previous.social_links.filter(
              (
                _,
                itemIndex
              ) =>
                itemIndex !==
                index
            );

          return {
            ...previous,

            social_links:
              links.length
                ? links
                : [""],
          };
        }
      );
    };

  /* =======================================================
     VALIDATE

     Original Flask backend only explicitly
     requires declaration.
  ======================================================= */

  const validateForm =
    () => {
      const errors =
        {};

      if (
        !form.declaration
      ) {
        errors.declaration =
          "Please accept the declaration.";
      }

      setFieldErrors(
        errors
      );

      return (
        Object.keys(
          errors
        ).length ===
        0
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
        toast.error(
          "Please accept the declaration."
        );

        return;
      }

      try {
        setSubmitting(
          true
        );

        setPageError(
          ""
        );

        const result =
          await submitProfilePictureDetails(
            safeToken,
            {
              ...form,

              social_links:
                form.social_links
                  .map(
                    (
                      link
                    ) =>
                      toText(
                        link
                      )
                  )
                  .filter(
                    Boolean
                  ),
            }
          );

        toast.success(
          result.message ||
            "Profile details saved successfully."
        );

navigate(
  `/civilian-acknowledgement/${encodeURIComponent(
    safeToken
  )}`,
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
            requestError?.apiMessage ||
              "Unable to save profile details."
          );

        setPageError(
          message
        );

        toast.error(
          message
        );
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
      <main className="kyc-profile-page">
        <div className="kyc-profile-state">
          <span className="kyc-profile-spinner"></span>

          <h2>
            Loading Profile Details
          </h2>

          <p>
            Please wait while we load your KYC profile.
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="kyc-profile-page">
      <div className="kyc-profile-container">
        {/* HEADER */}

        <header className="kyc-profile-header">
          <div className="kyc-profile-header-icon">
            <i className="fas fa-user-check"></i>
          </div>

          <div>
            <span>
              INMBA KYC
            </span>

            <h1>
              Complete Your Profile
            </h1>

            <p>
              Add your profile, nominee and witness details before
              acknowledgement.
            </p>
          </div>
        </header>

        {/* ERROR */}

        {pageError && (
          <div className="kyc-profile-error">
            <i className="fas fa-triangle-exclamation"></i>

            {pageError}
          </div>
        )}

        <form
          className="kyc-profile-form"
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          {/* PROFILE PHOTO */}

          <section className="kyc-profile-card">
            <SectionHeader
              icon="fas fa-camera"
              title="Profile Photo (Optional)"
              text="Upload your INMBA profile photograph."
            />

            <div className="kyc-profile-photo-area">
              <div className="kyc-profile-photo-preview">
                {profilePreview ? (
                  <img
                    src={
                      profilePreview
                    }
                    alt="Profile preview"
                  />
                ) : (
                  <i className="fas fa-user"></i>
                )}
              </div>

              <div>
                <input
                  id="kyc-profile-photo"
                  type="file"
                  accept="image/jpeg,image/png"
                  hidden
                  disabled={
                    submitting
                  }
                  onChange={
                    handleProfilePhoto
                  }
                />

                <label
                  htmlFor="kyc-profile-photo"
                  className="kyc-profile-upload-button"
                >
                  <i className="fas fa-cloud-arrow-up"></i>

                  Choose Photo
                </label>

                {profilePreview && (
                  <button
                    type="button"
                    className="kyc-profile-remove-button"
                    onClick={
                      removeProfilePhoto
                    }
                  >
                    Remove
                  </button>
                )}

                <p>
                  JPG or PNG. Profile photo is optional.
                </p>

                {fieldErrors.profile_pic && (
                  <small className="kyc-profile-field-error">
                    {fieldErrors.profile_pic}
                  </small>
                )}
              </div>
            </div>
          </section>

          {/* CONTACT */}

          <section className="kyc-profile-card">
            <SectionHeader
              icon="fas fa-address-book"
              title="Contact & Education"
              text="Provide your current contact and qualification details."
            />

            <div className="kyc-profile-grid">
              <Field
                label="Educational Qualification"
                name="educational_qualification"
                value={
                  form.educational_qualification
                }
                onChange={
                  handleChange
                }
                disabled={
                  submitting
                }
              />

              <Field
                label="Contact Number"
                name="contact_number"
                value={
                  form.contact_number
                }
                onChange={
                  handleChange
                }
                inputMode="numeric"
                maxLength={15}
                disabled={
                  submitting
                }
              />

              <Field
                label="WhatsApp Number"
                name="whatsapp_number"
                value={
                  form.whatsapp_number
                }
                onChange={
                  handleChange
                }
                inputMode="numeric"
                maxLength={15}
                disabled={
                  submitting
                }
              />
            </div>
          </section>

          {/* NOMINEE */}

          <section className="kyc-profile-card">
            <SectionHeader
              icon="fas fa-user-shield"
              title="Nominee Details"
              text="Add nominee information for your membership record."
            />

            <div className="kyc-profile-grid">
              <Field
                label="Nominee Name"
                name="nomini_name"
                value={
                  form.nomini_name
                }
                onChange={
                  handleChange
                }
                disabled={
                  submitting
                }
              />

              <Field
                label="Nominee DOB"
                name="nomini_dob"
                value={
                  form.nomini_dob
                }
                type="date"
                onChange={
                  handleChange
                }
                disabled={
                  submitting
                }
              />

              <Field
                label="Relationship"
                name="nomini_relationship"
                value={
                  form.nomini_relationship
                }
                onChange={
                  handleChange
                }
                disabled={
                  submitting
                }
              />

              <Field
                label="Nominee Aadhaar"
                name="nomini_aadhar"
                value={
                  form.nomini_aadhar
                }
                onChange={
                  handleChange
                }
                inputMode="numeric"
                maxLength={12}
                disabled={
                  submitting
                }
              />
            </div>
          </section>

          {/* WITNESS */}

          <section className="kyc-profile-card">
            <SectionHeader
              icon="fas fa-users"
              title="Witness Details"
              text="Enter witness information when applicable."
            />

            <div className="kyc-profile-grid">
              <Field
                label="Witness Name"
                name="witness_name"
                value={
                  form.witness_name
                }
                onChange={
                  handleChange
                }
                disabled={
                  submitting
                }
              />

              <Field
                label="Witness Phone"
                name="witness_phone"
                value={
                  form.witness_phone
                }
                onChange={
                  handleChange
                }
                inputMode="numeric"
                maxLength={15}
                disabled={
                  submitting
                }
              />

              <Field
                label="Witness INMBA ID"
                name="witness_inmba_id"
                value={
                  form.witness_inmba_id
                }
                onChange={
                  handleChange
                }
                disabled={
                  submitting
                }
              />
            </div>
          </section>

          {/* SOCIAL LINKS */}

          <section className="kyc-profile-card">
            <SectionHeader
              icon="fas fa-share-nodes"
              title="Social Links (Optional)"
              text="Add one or more social profile links."
            />

            <div className="kyc-profile-social-list">
              {form.social_links.map(
                (
                  link,
                  index
                ) => (
                  <div
                    className="kyc-profile-social-row"
                    key={index}
                  >
                    <input
                      type="url"
                      value={
                        link
                      }
                      placeholder="https://..."
                      disabled={
                        submitting
                      }
                      onChange={(event) =>
                        handleSocialLinkChange(
                          index,
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeSocialLink(
                          index
                        )
                      }
                      disabled={
                        submitting
                      }
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                )
              )}

              <button
                type="button"
                className="kyc-profile-add-social"
                onClick={
                  addSocialLink
                }
                disabled={
                  submitting
                }
              >
                <i className="fas fa-plus"></i>

                Add Social Link
              </button>
            </div>
          </section>

          {/* DECLARATION */}

          <section className="kyc-profile-declaration">
            <label>
              <input
                type="checkbox"
                name="declaration"
                checked={
                  form.declaration
                }
                onChange={
                  handleChange
                }
                disabled={
                  submitting
                }
              />

              <span>
                <strong>
                  (Required) 
                </strong>

                I hereby declare that the information furnished above
                is true and correct to the best of my knowledge.
              </span>
            </label>

            {fieldErrors.declaration && (
              <small>
                <i className="fas fa-circle-exclamation"></i>

                {fieldErrors.declaration}
              </small>
            )}
          </section>

          {/* ACTIONS */}

          <footer className="kyc-profile-actions">
            <Link
              to={`/pan/${encodeURIComponent(
                safeToken
              )}`}
            >
              <i className="fas fa-arrow-left"></i>

              Back to PAN
            </Link>

            <button
              type="submit"
              disabled={
                submitting
              }
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>

                  Saving...
                </>
              ) : (
                <>
                  Save & Continue

                  <i className="fas fa-arrow-right"></i>
                </>
              )}
            </button>
          </footer>
        </form>
      </div>
    </main>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  title,
  text,
}) {
  return (
    <div className="kyc-profile-card-header">
      <span>
        <i className={icon}></i>
      </span>

      <div>
        <h2>
          {title}
        </h2>

        <p>
          {text}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  inputMode,
  maxLength,
  disabled,
}) {
  return (
    <div className="kyc-profile-field">
      <label htmlFor={`kyc-${name}`}>
        {label}

        <span>
          {" "}
          (Optional)
        </span>
      </label>

      <input
        id={`kyc-${name}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        inputMode={inputMode}
        maxLength={maxLength}
        disabled={disabled}
        autoComplete="off"
      />
    </div>
  );
}

