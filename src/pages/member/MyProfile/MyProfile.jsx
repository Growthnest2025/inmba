import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  BACKEND_URL,
} from "../../../api/api";

import {
  getMyProfile,
  updateMyProfile,
  uploadMyProfilePhoto,
} from "../../../services/profile.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./MyProfile.css";
import { toText } from "../../../utils/commonHelpers";

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   FILE URL
========================================================= */

const getFileUrl = (
  value
) => {
  const path =
    toText(
      value
    );

  if (!path) {
    return "";
  }

  if (
    path.startsWith(
      "http://"
    ) ||
    path.startsWith(
      "https://"
    ) ||
    path.startsWith(
      "data:"
    ) ||
    path.startsWith(
      "blob:"
    )
  ) {
    return path;
  }

  if (
    path.startsWith(
      "/"
    )
  ) {
    return `${BACKEND_URL}${path}`;
  }

  /*
    Source stores profile_pic as filename.
  */

  if (
    !path.includes(
      "/"
    )
  ) {
    return `${BACKEND_URL}/static/uploads/profile/${encodeURIComponent(
      path
    )}`;
  }

  return `${BACKEND_URL}/${path}`;
};

/* =========================================================
   INITIAL FORM
========================================================= */

const createForm = (
  member = {}
) => ({
  first_name:
    toText(
      member.first_name
    ),

  last_name:
    toText(
      member.last_name
    ),

  father_name:
    toText(
      member.father_name
    ),

  dob:
    toText(
      member.dob
    ).slice(
      0,
      10
    ),

  gender:
    toText(
      member.gender
    ),

  marital_status:
    toText(
      member.marital_status
    ),

  nationality:
    toText(
      member.nationality
    ),

  email:
    toText(
      member.email
    ),

  phone:
    toText(
      member.phone
    ),

  whatsapp_number:
    toText(
      member.whatsapp_number
    ),

  contact_number:
    toText(
      member.contact_number
    ),

  address:
    toText(
      member.address
    ),

  city:
    toText(
      member.city
    ),

  district:
    toText(
      member.district
    ),

  state:
    toText(
      member.state
    ),

  pincode:
    toText(
      member.pincode
    ),

  country:
    toText(
      member.country
    ),

  entity_house_no:
    toText(
      member.entity_house_no
    ),

  entity_street:
    toText(
      member.entity_street
    ),

  entity_area:
    toText(
      member.entity_area
    ),

  entity_city:
    toText(
      member.entity_city
    ),

  entity_district:
    toText(
      member.entity_district
    ),

  entity_state:
    toText(
      member.entity_state
    ),

  entity_pincode:
    toText(
      member.entity_pincode
    ),

  occupation:
    toText(
      member.occupation
    ),

  profession:
    toText(
      member.profession
    ),

  education:
    toText(
      member.education
    ),

  educational_qualification:
    toText(
      member.educational_qualification
    ),

  skills:
    toText(
      member.skills
    ),

  bio:
    toText(
      member.bio
    ),

  social_link:
    toText(
      member.social_link
    ),

  nomini_name:
    toText(
      member.nomini_name
    ),

  nomini_dob:
    toText(
      member.nomini_dob
    ).slice(
      0,
      10
    ),

  nomini_relationship:
    toText(
      member.nomini_relationship
    ),

  nomini_aadhar:
    toText(
      member.nomini_aadhar
    ),
});

/* =========================================================
   INPUT
========================================================= */

function ProfileField({
  label,
  name,
  value,
  onChange,
  type = "text",
  options,
  readOnly = false,
  placeholder = "",
}) {
  return (
    <div className="my-profile-field">
      <label htmlFor={`my-profile-${name}`}>
        {label}
      </label>

      {options ? (
        <select
          id={`my-profile-${name}`}
          name={name}
          value={value}
          onChange={onChange}
          disabled={readOnly}
        >
          <option value="">
            Select
          </option>

          {options.map(
            (
              option
            ) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            )
          )}
        </select>
      ) : (
        <input
          id={`my-profile-${name}`}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

/* =========================================================
   MY PROFILE
========================================================= */

export default function MyProfile() {
  const navigate =
    useNavigate();

  const fileInputRef =
    useRef(
      null
    );

  const [
    member,
    setMember,
  ] =
    useState(
      null
    );

  const [
    form,
    setForm,
  ] =
    useState(
      createForm()
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
    uploading,
    setUploading,
  ] =
    useState(
      false
    );

  const [
    editing,
    setEditing,
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
    preview,
    setPreview,
  ] =
    useState(
      ""
    );

  /* =======================================================
     LOAD PROFILE
  ======================================================= */

  const loadProfile =
    useCallback(
      async ({
        signal,
      } = {}) => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const result =
            await getMyProfile({
              signal,
            });

          setMember(
            result.member
          );

          setForm(
            createForm(
              result.member
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

          if (
            requestError
              ?.unauthorized ||
            Number(
              requestError
                ?.statusCode
            ) ===
              401
          ) {
            navigate(
              "/login",
              {
                replace:
                  true,

                state: {
                  from:
                    "/my_profile",

                  error:
                    "Please login to access your profile.",
                },
              }
            );

            return;
          }

          setError(
            getApiErrorMessage(
              requestError,
              requestError
                ?.apiMessage ||
                "Unable to load your profile."
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

      loadProfile({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadProfile,
    ]
  );

  /* =======================================================
     PREVIEW CLEANUP
  ======================================================= */

  useEffect(
    () => {
      return () => {
        if (
          preview
        ) {
          URL.revokeObjectURL(
            preview
          );
        }
      };
    },
    [
      preview,
    ]
  );

  /* =======================================================
     MEMBER DETAILS
  ======================================================= */

  const fullName =
    useMemo(
      () =>
        `${toText(
          member?.first_name,
          "Member"
        )} ${toText(
          member?.last_name
        )}`.trim(),
      [
        member,
      ]
    );

  const profileImage =
    preview ||
    getFileUrl(
      member?.profile_pic
    );

  const approved =
    toText(
      member?.payment_status
    ).toLowerCase() ===
    "approved";

  /* =======================================================
     CHANGE
  ======================================================= */

  const handleChange =
    (
      event
    ) => {
      const {
        name,
        value,
      } =
        event.target;

      setForm(
        (
          previous
        ) => ({
          ...previous,

          [name]:
            value,
        })
      );
    };

  /* =======================================================
     BEGIN EDIT
  ======================================================= */

  const beginEdit =
    () => {
      setForm(
        createForm(
          member
        )
      );

      setEditing(
        true
      );

      setError(
        ""
      );
    };

  /* =======================================================
     CANCEL EDIT
  ======================================================= */

  const cancelEdit =
    () => {
      setForm(
        createForm(
          member
        )
      );

      setEditing(
        false
      );

      setError(
        ""
      );
    };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        saving
      ) {
        return;
      }

      if (
        !toText(
          form.first_name
        )
      ) {
        toast.error(
          "First name is required."
        );

        return;
      }

      if (
        !toText(
          form.email
        )
      ) {
        toast.error(
          "Email is required."
        );

        return;
      }

      if (
        !toText(
          form.phone
        )
      ) {
        toast.error(
          "Phone number is required."
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

        const result =
          await updateMyProfile(
            form
          );

        toast.success(
          result.message ||
            "Profile updated successfully."
        );

        setEditing(
          false
        );

        await loadProfile();
      } catch (
        requestError
      ) {
        if (
          requestError
            ?.unauthorized
        ) {
          navigate(
            "/login",
            {
              replace:
                true,

              state: {
                from:
                  "/my_profile",
              },
            }
          );

          return;
        }

        const message =
          getApiErrorMessage(
            requestError,
            requestError
              ?.apiMessage ||
              "Unable to update profile."
          );

        setError(
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
     PHOTO SELECT
  ======================================================= */

  const handlePhotoChange =
    async (
      event
    ) => {
      const file =
        event.target
          .files?.[0];

      event.target.value =
        "";

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        toast.error(
          "Please select an image file."
        );

        return;
      }

      const nextPreview =
        URL.createObjectURL(
          file
        );

      if (
        preview
      ) {
        URL.revokeObjectURL(
          preview
        );
      }

      setPreview(
        nextPreview
      );

      try {
        setUploading(
          true
        );

        const result =
          await uploadMyProfilePhoto(
            file
          );

        toast.success(
          result.message ||
            "Profile photo updated successfully."
        );

        await loadProfile();

        URL.revokeObjectURL(
          nextPreview
        );

        setPreview(
          ""
        );
      } catch (
        requestError
      ) {
        const message =
          getApiErrorMessage(
            requestError,
            requestError
              ?.apiMessage ||
              "Unable to upload profile photo."
          );

        toast.error(
          message
        );
      } finally {
        setUploading(
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
      <main className="my-profile-page">
        <div className="my-profile-state">
          <span className="my-profile-spinner"></span>

          <h2>
            Loading Profile
          </h2>

          <p>
            Please wait while we load your member profile.
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR WITHOUT MEMBER
  ======================================================= */

  if (
    error &&
    !member
  ) {
    return (
      <main className="my-profile-page">
        <div className="my-profile-state">
          <i className="fas fa-triangle-exclamation"></i>

          <h2>
            Profile Unavailable
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              loadProfile()
            }
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="my-profile-page">
      <div className="my-profile-container">
        {/* =================================================
            HEADER
        ================================================= */}

        <section className="my-profile-hero">
          <div className="my-profile-avatar-wrap">
            <div className="my-profile-avatar">
              {profileImage ? (
                <img
                  src={
                    profileImage
                  }
                  alt={
                    fullName
                  }
                />
              ) : (
                <span>
                  {toText(
                    member?.first_name,
                    "M"
                  )
                    .charAt(
                      0
                    )
                    .toUpperCase()}
                </span>
              )}

              {uploading && (
                <div className="my-profile-avatar-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                </div>
              )}
            </div>

            <button
              type="button"
              className="my-profile-photo-button"
              onClick={() =>
                fileInputRef
                  .current
                  ?.click()
              }
              disabled={
                uploading
              }
            >
              <i className="fas fa-camera"></i>

              {uploading
                ? "Uploading..."
                : "Change Photo"}
            </button>

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept="image/*"
              hidden
              onChange={
                handlePhotoChange
              }
            />
          </div>

          <div className="my-profile-hero-info">
            <p>
              INMBA Member Profile
            </p>

            <div className="my-profile-name-row">
              <h1>
                {fullName}
              </h1>

              {approved && (
                <span className="my-profile-approved">
                  <i className="fas fa-circle-check"></i>

                  Approved
                </span>
              )}
            </div>

            <div className="my-profile-meta">
              <span>
                <i className="fas fa-id-badge"></i>

                {toText(
                  member?.login_id,
                  "No Login ID"
                )}
              </span>

              <span>
                <i className="fas fa-id-card"></i>

                {toText(
                  member?.membership_type,
                  "INMBA Member"
                )}
              </span>

              <span>
                <i className="fas fa-location-dot"></i>

                {toText(
                  member?.district ??
                    member?.entity_district,
                  "Location not added"
                )}
              </span>
            </div>
          </div>

          <div className="my-profile-hero-actions">
            {!editing ? (
              <button
                type="button"
                className="my-profile-primary"
                onClick={
                  beginEdit
                }
              >
                <i className="fas fa-user-pen"></i>

                Edit Profile
              </button>
            ) : (
              <button
                type="button"
                className="my-profile-secondary"
                onClick={
                  cancelEdit
                }
                disabled={
                  saving
                }
              >
                Cancel Editing
              </button>
            )}

            {member?.login_id && (
              <Link
                to={`/user-profile/${encodeURIComponent(
                  member.login_id
                )}`}
                className="my-profile-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fas fa-arrow-up-right-from-square"></i>

                Public Profile
              </Link>
            )}

            <Link
              to="/dashboard"
              className="my-profile-secondary"
            >
              Dashboard
            </Link>
          </div>
        </section>

        {error && (
          <div className="my-profile-error">
            <i className="fas fa-circle-exclamation"></i>

            {error}
          </div>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        <form
          className="my-profile-form"
          onSubmit={
            handleSave
          }
        >
          {/* PERSONAL */}

          <ProfileSection
            title="Personal Information"
            icon="fas fa-user"
          >
            <ProfileField
              label="First Name"
              name="first_name"
              value={
                form.first_name
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="Last Name"
              name="last_name"
              value={
                form.last_name
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="Father Name"
              name="father_name"
              value={
                form.father_name
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="Date of Birth"
              name="dob"
              type="date"
              value={
                form.dob
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="Gender"
              name="gender"
              value={
                form.gender
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
              options={[
                "Male",
                "Female",
                "Other",
              ]}
            />

            <ProfileField
              label="Marital Status"
              name="marital_status"
              value={
                form.marital_status
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
              options={[
                "Single",
                "Married",
                "Divorced",
                "Widowed",
              ]}
            />

            <ProfileField
              label="Nationality"
              name="nationality"
              value={
                form.nationality
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />
          </ProfileSection>

          {/* CONTACT */}

          <ProfileSection
            title="Contact Information"
            icon="fas fa-address-book"
          >
            <ProfileField
              label="Email"
              name="email"
              type="email"
              value={
                form.email
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="Phone"
              name="phone"
              type="tel"
              value={
                form.phone
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="WhatsApp Number"
              name="whatsapp_number"
              value={
                form.whatsapp_number
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="Contact Number"
              name="contact_number"
              value={
                form.contact_number
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />
          </ProfileSection>

          {/* ADDRESS */}

          <ProfileSection
            title="Address"
            icon="fas fa-location-dot"
          >
            <ProfileField
              label="Address"
              name="address"
              value={
                form.address
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="City"
              name="city"
              value={
                form.city
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="District"
              name="district"
              value={
                form.district
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="State"
              name="state"
              value={
                form.state
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="Pincode"
              name="pincode"
              value={
                form.pincode
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />
          </ProfileSection>

          {/* PROFESSIONAL */}

          <ProfileSection
            title="Professional Details"
            icon="fas fa-briefcase"
          >
            <ProfileField
              label="Occupation"
              name="occupation"
              value={
                form.occupation
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="Education"
              name="education"
              value={
                form.education
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="Educational Qualification"
              name="educational_qualification"
              value={
                form.educational_qualification
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="Skills"
              name="skills"
              value={
                form.skills
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />
          </ProfileSection>

          {/* SOCIAL */}

          <ProfileSection
            title="Profile & Social"
            icon="fas fa-globe"
          >
            <div className="my-profile-field my-profile-field-full">
              <label htmlFor="my-profile-bio">
                Bio
              </label>

              <textarea
                id="my-profile-bio"
                name="bio"
                rows={5}
                value={
                  form.bio
                }
                onChange={
                  handleChange
                }
                readOnly={
                  !editing
                }
                placeholder="Tell people about yourself..."
              />
            </div>

            <ProfileField
              label="Social Link"
              name="social_link"
              type="url"
              value={
                form.social_link
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
              placeholder="https://..."
            />
          </ProfileSection>

          {/* NOMINEE */}

          <ProfileSection
            title="Nominee Details"
            icon="fas fa-user-shield"
          >
            <ProfileField
              label="Nominee Name"
              name="nomini_name"
              value={
                form.nomini_name
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="Nominee DOB"
              name="nomini_dob"
              type="date"
              value={
                form.nomini_dob
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="Relationship"
              name="nomini_relationship"
              value={
                form.nomini_relationship
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />

            <ProfileField
              label="Nominee Aadhaar"
              name="nomini_aadhar"
              value={
                form.nomini_aadhar
              }
              onChange={
                handleChange
              }
              readOnly={
                !editing
              }
            />
          </ProfileSection>

          {/* SAVE */}

          {editing && (
            <div className="my-profile-save-bar">
              <div>
                <strong>
                  Save Profile Changes
                </strong>

                <p>
                  Changes will update your INMBA member profile.
                </p>
              </div>

              <div>
                <button
                  type="button"
                  className="my-profile-secondary"
                  onClick={
                    cancelEdit
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="my-profile-primary"
                  disabled={
                    saving
                  }
                >
                  <i
                    className={
                      saving
                        ? "fas fa-spinner fa-spin"
                        : "fas fa-floppy-disk"
                    }
                  ></i>

                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

/* =========================================================
   SECTION
========================================================= */

function ProfileSection({
  title,
  icon,
  children,
}) {
  return (
    <section className="my-profile-section">
      <header>
        <span>
          <i className={icon}></i>
        </span>

        <h2>
          {title}
        </h2>
      </header>

      <div className="my-profile-grid">
        {children}
      </div>
    </section>
  );
}