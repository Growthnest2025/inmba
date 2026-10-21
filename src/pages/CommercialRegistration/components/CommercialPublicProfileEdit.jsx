import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../../../api/api";

import {
  BACKEND_URL,
} from "../../../api/api";

import {
  uploadOwnProfilePhoto,
} from "../../../services/profile.service";

import "./CommercialPublicProfileEdit.css";

/* =========================================================
   FORM
========================================================= */

const EMPTY_FORM = {
  business_name: "",
  business_legal_type: "",
  business_category: "",

  city: "",
  district: "",
  state: "",
  branch_locations: "",

  business_contact_number: "",
  business_email: "",
  business_website: "",
  business_google_map_location: "",

  business_year_established: "",
  business_number_of_employees: "",

  products_services_offered: "",
  business_category_tags: "",
  business_awards_certifications: "",
  business_client_testimonials: "",
  business_bio: "",

  business_logo: "",
  business_gallery_photos: "",
  business_promo_video: "",
  business_social_media_links: "",
};

/* =========================================================
   HELPERS
========================================================= */

const toText = (
  value
) =>
  String(
    value ?? ""
  ).trim();

const profilePhotoUrl = (
  value
) => {
  const photo =
    toText(value);

  if (!photo) {
    return "";
  }

  if (
    /^https?:\/\//i.test(photo) ||
    photo.startsWith("data:") ||
    photo.startsWith("blob:")
  ) {
    return photo;
  }

  return `${BACKEND_URL}/${photo.replace(/^\/+/, "")}`;
};

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
            typeof item ===
              "object"
              ? item?.url ??
                item?.name ??
                item?.label
              : item
          )
      )
      .filter(
        Boolean
      );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    return Object.values(
      value
    )
      .map(
        toText
      )
      .filter(
        Boolean
      );
  }

  const text =
    toText(
      value
    );

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
      ) ||
      (
        parsed &&
        typeof parsed ===
          "object"
      )
    ) {
      return toArray(
        parsed
      );
    }
  } catch {
    // Use comma, pipe or newline parsing.
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
};

const toFormList = (
  value
) =>
  toArray(
    value
  ).join(
    ", "
  );

const extractProfile = (
  response
) =>
  response
    ?.data
    ?.data
    ?.profile ||
  response
    ?.data
    ?.data
    ?.member ||
  response
    ?.data
    ?.profile ||
  response
    ?.data
    ?.member ||
  response
    ?.data
    ?.data ||
  response
    ?.data ||
  null;

const errorMessage = (
  error,
  fallback
) =>
  error
    ?.response
    ?.data
    ?.message ||
  error
    ?.apiMessage ||
  error
    ?.message ||
  fallback;

/* =========================================================
   BACKEND PROFILE -> FORM
========================================================= */

const profileToForm = (
  profile = {}
) => ({
  business_name:
    toText(
      profile
        .business_name
    ),

  business_legal_type:
    toText(
      profile
        .business_legal_type ??
      profile
        .business_type
    ),

  business_category:
    toText(
      profile
        .business_category
    ),

  city:
    toText(
      profile.city
    ),

  district:
    toText(
      profile.district
    ),

  state:
    toText(
      profile.state
    ),

  branch_locations:
    toFormList(
      profile
        .branch_locations
    ),

  business_contact_number:
    toText(
      profile
        .business_contact_number
    ),

  business_email:
    toText(
      profile
        .business_email
    ),

  business_website:
    toText(
      profile
        .business_website
    ),

  business_google_map_location:
    toText(
      profile
        .business_google_map_location ??
      profile
        .google_map_location
    ),

  business_year_established:
    toText(
      profile
        .business_year_established ??
      profile
        .year_established
    ),

  business_number_of_employees:
    toText(
      profile
        .business_number_of_employees ??
      profile
        .number_of_employees
    ),

  products_services_offered:
    toFormList(
      profile
        .products_services_offered
    ),

  business_category_tags:
    toFormList(
      profile
        .business_category_tags
    ),

  business_awards_certifications:
    toFormList(
      profile
        .business_awards_certifications ??
      profile
        .awards_certifications
    ),

  business_client_testimonials:
    toFormList(
      profile
        .business_client_testimonials ??
      profile
        .client_testimonials
    ),

  business_bio:
    toText(
      profile
        .business_bio
    ),

  business_logo:
    toText(
      profile
        .business_logo
    ),

  business_gallery_photos:
    toFormList(
      profile
        .business_gallery_photos ??
      profile
        .gallery_photos
    ),

  business_promo_video:
    toText(
      profile
        .business_promo_video ??
      profile
        .promo_video
    ),

  business_social_media_links:
    toFormList(
      profile
        .business_social_media_links ??
      profile
        .social_media_links
    ),
});

/* =========================================================
   SAVE PAYLOAD
========================================================= */

const buildPayload = (
  form
) => ({
  business_name:
    toText(
      form.business_name
    ),

  business_legal_type:
    toText(
      form
        .business_legal_type
    ),

  business_category:
    toText(
      form
        .business_category
    ),

  city:
    toText(
      form.city
    ),

  district:
    toText(
      form.district
    ),

  state:
    toText(
      form.state
    ),

  branch_locations:
    toArray(
      form
        .branch_locations
    ),

  business_contact_number:
    toText(
      form
        .business_contact_number
    ),

  business_email:
    toText(
      form
        .business_email
    ),

  business_website:
    toText(
      form
        .business_website
    ),

  business_google_map_location:
    toText(
      form
        .business_google_map_location
    ),

  business_year_established:
    toText(
      form
        .business_year_established
    ),

  business_number_of_employees:
    toText(
      form
        .business_number_of_employees
    ),

  products_services_offered:
    toArray(
      form
        .products_services_offered
    ),

  business_category_tags:
    toArray(
      form
        .business_category_tags
    ),

  business_awards_certifications:
    toArray(
      form
        .business_awards_certifications
    ),

  business_client_testimonials:
    toArray(
      form
        .business_client_testimonials
    ),

  business_bio:
    toText(
      form.business_bio
    ),

  business_logo:
    toText(
      form.business_logo
    ),

  business_gallery_photos:
    toArray(
      form
        .business_gallery_photos
    ),

  business_promo_video:
    toText(
      form
        .business_promo_video
    ),

  business_social_media_links:
    toArray(
      form
        .business_social_media_links
    ),
});

/* =========================================================
   COMPONENT
========================================================= */

export default function CommercialPublicProfileEdit() {
  const navigate =
    useNavigate();

  const profilePhotoInputRef =
    useRef(null);

  const [
    form,
    setForm,
  ] =
    useState(
      EMPTY_FORM
    );

  const [
    loginId,
    setLoginId,
  ] =
    useState("");

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
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    profilePhoto,
    setProfilePhoto,
  ] =
    useState("");

  const [
    uploadingPhoto,
    setUploadingPhoto,
  ] =
    useState(false);

  /* =======================================================
     LOAD
  ======================================================= */

  const loadProfile =
    useCallback(
      async (
        signal
      ) => {
        try {
          setLoading(
            true
          );

          setError("");

          const response =
            await api.get(
              "/commercial-profile/public-edit",
              {
                signal,
              }
            );

          const profile =
            extractProfile(
              response
            );

          if (
            !profile
          ) {
            throw new Error(
              "Commercial public profile details were not returned."
            );
          }

          setForm(
            profileToForm(
              profile
            )
          );

          setLoginId(
            toText(
              profile
                .login_id
            )
          );

          let ownerProfile = {};

          try {
            const ownerResponse =
              await api.get(
                "/profile",
                {
                  signal,
                }
              );

            ownerProfile =
              extractProfile(
                ownerResponse
              ) || {};
          } catch (
            ownerRequestError
          ) {
            if (
              signal?.aborted
            ) {
              return;
            }

            try {
              const sessionResponse =
                await api.get(
                  "/me",
                  {
                    signal,
                  }
                );

              ownerProfile =
                extractProfile(
                  sessionResponse
                ) || {};
            } catch (
              sessionRequestError
            ) {
              ownerProfile = {};
            }
          }

          setProfilePhoto(
            profilePhotoUrl(
              profile.profile_pic ||
              profile.profile_pic_url ||
              profile.profile_image_url ||
              profile.profile_photo_url ||
              profile.photo_url ||
              ownerProfile.profile_pic ||
              ownerProfile.profile_pic_url ||
              ownerProfile.profile_image_url ||
              ownerProfile.profile_photo_url ||
              ownerProfile.photo_url
            )
          );
        } catch (
          requestError
        ) {
          if (
            signal
              ?.aborted ||
            requestError
              ?.name ===
              "CanceledError" ||
            requestError
              ?.name ===
              "AbortError"
          ) {
            return;
          }

          if (
            Number(
              requestError
                ?.response
                ?.status
            ) === 401
          ) {
            navigate(
              "/login/commercial",
              {
                replace:
                  true,
              }
            );

            return;
          }

          setError(
            errorMessage(
              requestError,
              "Unable to load Commercial public profile."
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        navigate,
      ]
    );

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadProfile(
        controller.signal
      );

      return () =>
        controller.abort();
    },
    [
      loadProfile,
    ]
  );

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

      setError("");

      setSuccess("");
    };

  /* =======================================================
     PROFILE PHOTO UPLOAD
  ======================================================= */

  const handleProfilePhotoChange =
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

      try {
        setUploadingPhoto(true);
        setError("");
        setSuccess("");

        const result =
          await uploadOwnProfilePhoto(
            file
          );

        const uploadedPhoto =
          profilePhotoUrl(
            result?.photoUrl ??
            result?.photo_url ??
            result?.profile_pic ??
            result?.profile_pic_url ??
            result?.profile_image_url
          );

        if (uploadedPhoto) {
          setProfilePhoto(
            uploadedPhoto
          );
        }

        setSuccess(
          result?.message ||
          "Profile picture updated successfully."
        );
      } catch (
        uploadError
      ) {
        setError(
          errorMessage(
            uploadError,
            "Unable to upload profile picture."
          )
        );
      } finally {
        setUploadingPhoto(false);
      }
    };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSubmit =
    async (
      event
    ) => {
      event
        .preventDefault();

      if (
        !toText(
          form.business_name
        )
      ) {
        setError(
          "Business name is required."
        );

        return;
      }

      if (
        form.business_email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          form.business_email
        )
      ) {
        setError(
          "Enter a valid business email."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        setError("");

        setSuccess("");

        const response =
          await api.patch(
            "/commercial-profile/public-edit",
            buildPayload(
              form
            )
          );

        const profile =
          extractProfile(
            response
          );

        if (
          profile
        ) {
          setForm(
            profileToForm(
              profile
            )
          );

          setLoginId(
            toText(
              profile
                .login_id
            )
          );
        }

        setSuccess(
          response
            ?.data
            ?.message ||
          "Commercial public profile updated successfully."
        );
      } catch (
        saveError
      ) {
        setError(
          errorMessage(
            saveError,
            "Unable to update Commercial public profile."
          )
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  if (
    loading
  ) {
    return (
      <main className="cppe-page">
        <div className="cppe-loading-card">
          <span className="cppe-spinner" />

          <h2>
            Loading Public Profile
          </h2>
        </div>
      </main>
    );
  }

  return (
    <main className="cppe-page">
      <header className="cppe-header">
        <div>
          <p>
            INMBA Commercial
          </p>

          <h1>
            Edit Public Profile
          </h1>

          <span>
            Update the details visible to public visitors.
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              "/commercial/full-profile"
            )
          }
        >
          <i className="fa-solid fa-arrow-left" />

          Owner Profile
        </button>
      </header>

      <section className="cppe-security-note">
        <i className="fa-solid fa-shield-halved" />

        <div>
          <strong>
            Public business details only
          </strong>

          <p>
            Login ID, verification, payment, network and private KYC details cannot be changed here.
          </p>
        </div>
      </section>

      <section
        className="cppe-card"
        style={{
          width: "calc(100% - 40px)",
          maxWidth: "1180px",
          boxSizing: "border-box",
          margin: "0 auto 24px",
        }}
      >
        <div className="cppe-card-heading">
          <i className="fa-solid fa-camera" />

          <div>
            <h2>
              Profile Picture
            </h2>

            <p>
              Upload a JPG, PNG or WEBP image below 5 MB.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "24px",
            padding: "24px 0 4px",
          }}
        >
          <div
            style={{
              width: "112px",
              height: "112px",
              borderRadius: "50%",
              overflow: "hidden",
              display: "grid",
              placeItems: "center",
              background: "#fee2e2",
              color: "#991b1b",
              fontSize: "32px",
              fontWeight: 800,
              border: "4px solid #ffffff",
              boxShadow: "0 8px 24px rgba(127, 29, 29, 0.16)",
            }}
          >
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Commercial profile"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <i className="fa-solid fa-building-user" />
            )}
          </div>

          <div>
            <input
              ref={profilePhotoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleProfilePhotoChange}
              style={{
                display: "none",
              }}
            />

            <button
              type="button"
              disabled={uploadingPhoto}
              onClick={() =>
                profilePhotoInputRef
                  .current
                  ?.click()
              }
              style={{
                minWidth: "170px",
                minHeight: "46px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "9px",
                padding: "11px 18px",
                border: "1px solid #be123c",
                borderRadius: "12px",
                background: uploadingPhoto
                  ? "#e5e7eb"
                  : "linear-gradient(135deg, #be123c, #991b1b)",
                color: uploadingPhoto
                  ? "#6b7280"
                  : "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                lineHeight: 1,
                cursor: uploadingPhoto
                  ? "not-allowed"
                  : "pointer",
                boxShadow: uploadingPhoto
                  ? "none"
                  : "0 8px 18px rgba(153, 27, 27, 0.2)",
              }}
            >
              <i className="fa-solid fa-camera" />{" "}

              {uploadingPhoto
                ? "Uploading..."
                : profilePhoto
                  ? "Change Picture"
                  : "Upload Picture"}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="cppe-message cppe-error">
          <i className="fa-solid fa-circle-exclamation" />

          {error}
        </div>
      )}

      {success && (
        <div className="cppe-message cppe-success">
          <i className="fa-solid fa-circle-check" />

          {success}
        </div>
      )}

      <form
        className="cppe-form"
        onSubmit={
          handleSubmit
        }
      >
        <FormSection
          icon="fa-solid fa-building"
          title="Business Identity"
          subtitle="Public business name, type and category"
        >
          <Field
            label="Business Name"
            name="business_name"
            value={
              form.business_name
            }
            onChange={
              handleChange
            }
            required
          />

          <Field
            label="Business Type"
            name="business_legal_type"
            value={
              form
                .business_legal_type
            }
            onChange={
              handleChange
            }
          />

          <Field
            label="Business Category"
            name="business_category"
            value={
              form
                .business_category
            }
            onChange={
              handleChange
            }
          />

          <Field
            label="Business Logo URL"
            name="business_logo"
            type="url"
            value={
              form.business_logo
            }
            onChange={
              handleChange
            }
          />
        </FormSection>

        <FormSection
          icon="fa-solid fa-location-dot"
          title="Location and Contact"
          subtitle="Public area-level location and contact information"
        >
          <Field
            label="City"
            name="city"
            value={
              form.city
            }
            onChange={
              handleChange
            }
          />

          <Field
            label="District"
            name="district"
            value={
              form.district
            }
            onChange={
              handleChange
            }
          />

          <Field
            label="State"
            name="state"
            value={
              form.state
            }
            onChange={
              handleChange
            }
          />

          <Field
            label="Business Contact Number"
            name="business_contact_number"
            value={
              form
                .business_contact_number
            }
            onChange={
              handleChange
            }
          />

          <Field
            label="Business Email"
            name="business_email"
            type="email"
            value={
              form.business_email
            }
            onChange={
              handleChange
            }
          />

          <Field
            label="Business Website"
            name="business_website"
            type="url"
            value={
              form.business_website
            }
            onChange={
              handleChange
            }
          />

          <Field
            label="Google Map URL"
            name="business_google_map_location"
            type="url"
            value={
              form
                .business_google_map_location
            }
            onChange={
              handleChange
            }
          />

          <TextArea
            label="Branch Locations"
            name="branch_locations"
            value={
              form.branch_locations
            }
            onChange={
              handleChange
            }
          />
        </FormSection>

        <FormSection
          icon="fa-solid fa-briefcase"
          title="Business Information"
          subtitle="Services, achievements and public introduction"
        >
          <Field
            label="Year Established"
            name="business_year_established"
            type="number"
            value={
              form
                .business_year_established
            }
            onChange={
              handleChange
            }
          />

          <Field
            label="Number of Employees"
            name="business_number_of_employees"
            type="number"
            value={
              form
                .business_number_of_employees
            }
            onChange={
              handleChange
            }
          />

          <TextArea
            label="Products / Services Offered"
            name="products_services_offered"
            value={
              form
                .products_services_offered
            }
            onChange={
              handleChange
            }
          />

          <TextArea
            label="Business Category Tags"
            name="business_category_tags"
            value={
              form
                .business_category_tags
            }
            onChange={
              handleChange
            }
          />

          <TextArea
            label="Awards & Certifications"
            name="business_awards_certifications"
            value={
              form
                .business_awards_certifications
            }
            onChange={
              handleChange
            }
          />

          <TextArea
            label="Client Testimonials"
            name="business_client_testimonials"
            value={
              form
                .business_client_testimonials
            }
            onChange={
              handleChange
            }
          />

          <TextArea
            label="Business Bio"
            name="business_bio"
            value={
              form.business_bio
            }
            onChange={
              handleChange
            }
            full
          />
        </FormSection>

        <FormSection
          icon="fa-solid fa-photo-film"
          title="Media and Social Links"
          subtitle="Public gallery, promotional video and social profiles"
        >
          <TextArea
            label="Business Gallery Image URLs"
            name="business_gallery_photos"
            value={
              form
                .business_gallery_photos
            }
            onChange={
              handleChange
            }
          />

          <Field
            label="Promotional Video URL"
            name="business_promo_video"
            type="url"
            value={
              form
                .business_promo_video
            }
            onChange={
              handleChange
            }
          />

          <TextArea
            label="Social Media Links"
            name="business_social_media_links"
            value={
              form
                .business_social_media_links
            }
            onChange={
              handleChange
            }
          />
        </FormSection>

        <div className="cppe-actions">
          <button
            type="button"
            className="cppe-cancel"
            disabled={
              saving
            }
            onClick={() =>
              navigate(
                "/commercial/full-profile"
              )
            }
          >
            Cancel
          </button>

          {loginId && (
            <button
              type="button"
              className="cppe-preview"
              disabled={
                saving
              }
              onClick={() =>
                navigate(
                  `/commercial/public-profile/${encodeURIComponent(
                    loginId
                  )}`
                )
              }
            >
              Preview Public Profile
            </button>
          )}

          <button
            type="submit"
            className="cppe-save"
            disabled={
              saving
            }
          >
            {saving
              ? "Saving..."
              : "Save Public Profile"}
          </button>
        </div>
      </form>
    </main>
  );
}

/* =========================================================
   FORM SECTION
========================================================= */

function FormSection({
  icon,
  title,
  subtitle,
  children,
}) {
  return (
    <section className="cppe-card">
      <div className="cppe-card-heading">
        <i className={icon} />

        <div>
          <h2>
            {title}
          </h2>

          <p>
            {subtitle}
          </p>
        </div>
      </div>

      <div className="cppe-grid">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   INPUT
========================================================= */

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <label className="cppe-field">
      <span>
        {label}

        {required && (
          <b>
            *
          </b>
        )}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        min={
          type ===
          "number"
            ? "0"
            : undefined
        }
      />
    </label>
  );
}

/* =========================================================
   TEXTAREA
========================================================= */

function TextArea({
  label,
  name,
  value,
  onChange,
  full = false,
}) {
  return (
    <label
      className={
        full
          ? "cppe-field cppe-field-full"
          : "cppe-field"
      }
    >
      <span>
        {label}
      </span>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={
          full
            ? 6
            : 4
        }
      />

      <small>
        Multiple values can be separated using commas or new lines.
      </small>
    </label>
  );
}