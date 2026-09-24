import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  updatePublicProfile,
  uploadProfessionalCoverPhoto,
  uploadProfessionalGalleryPhoto,
  uploadProfessionalIntroVideo,
} from "../../../services/publicProfile.service";

import {
  uploadOwnProfilePhoto,
} from "../../../services/profile.service";

import {
  BACKEND_URL,
} from "../../../api/api";

import "./ProfessionalPublicProfile.css";
/* =========================================================
   HELPERS
========================================================= */

const text = (
  value,
  fallback = ""
) => {
  const result =
    String(
      value ?? ""
    ).trim();

  return result ||
    fallback;
};

const list = (
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
          String(
            item ??
              ""
          ).trim()
      )
      .filter(
        Boolean
      );
  }

  if (!value) {
    return [];
  }

  if (
    typeof value ===
      "string"
  ) {
    const normalized =
      value.trim();

    if (
      !normalized
    ) {
      return [];
    }

    try {
      const parsed =
        JSON.parse(
          normalized
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
              String(
                item ??
                  ""
              ).trim()
          )
          .filter(
            Boolean
          );
      }
    } catch {
      // Existing DB values may be comma / pipe / newline separated.
    }

    return normalized
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

const listToText = (
  value
) =>
  list(
    value
  ).join(", ");

const buildLocation = (
  profile
) =>
  [
    profile?.city,
    profile?.district,
    profile?.state,
  ]
    .filter(
      Boolean
    )
    .join(", ");

const IMAGE_BACKEND_URL =
  String(
    BACKEND_URL ||
    process.env.REACT_APP_BACKEND_URL ||
    "http://127.0.0.1:5000"
  ).replace(/\/+$/, "");

const safeUrl = (
  value
) => {
  const result =
    text(
      value
    );

  if (!result) {
    return "";
  }

  // Local preview
  if (
    result.startsWith("blob:") ||
    result.startsWith("data:")
  ) {
    return result;
  }

  // Already stored upload path
  if (
    result.startsWith(
      "/uploads/"
    )
  ) {
    return `${IMAGE_BACKEND_URL}${result}`;
  }

  if (
    result.startsWith(
      "uploads/"
    )
  ) {
    return `${IMAGE_BACKEND_URL}/${result}`;
  }

  /*
    OLD backend IP URL இருந்தாலும்
    pathname மட்டும் எடுத்து
    current local backend use பண்ணும்.
  */
  if (
    result.startsWith(
      "http://"
    ) ||
    result.startsWith(
      "https://"
    )
  ) {
    try {
      const parsedUrl =
        new URL(
          result
        );

      if (
        parsedUrl.pathname
          .startsWith(
            "/uploads/"
          )
      ) {
        return `${IMAGE_BACKEND_URL}${parsedUrl.pathname}`;
      }

      return result;
    } catch {
      return result;
    }
  }

  // Old DB filename only
  if (
    /\.(jpg|jpeg|png|webp)$/i.test(
      result
    )
  ) {
    return `${IMAGE_BACKEND_URL}/uploads/profile/${encodeURIComponent(
      result
    )}`;
  }

  return result;
};
const getProfileImage = (
  profile
) =>
  text(
    profile?.profile_pic ||
      profile?.profile_pic_url ||
      profile?.profile_photo_url ||
      profile?.profile_image_url
  );
const getCoverImage = (
  profile
) =>
  text(
    profile?.cover_photo
  );

const normalizeSalutation = (
  value
) => {
  const raw =
    text(
      value
    ).replace(
      /\.$/,
      ""
    );

  const canonical = {
    mr: "Mr",
    mrs: "Mrs",
    ms: "Ms",
    dr: "Dr",
  }[
    raw.toLowerCase()
  ] || "";

  const allowed =
    new Set([
      "Mr",
      "Mrs",
      "Ms",
      "Dr",
    ]);

  return allowed.has(
    canonical
  )
    ? canonical
    : "";
};

const buildDisplayHeading = (
  profile
) => {
  const salutation =
    normalizeSalutation(
      profile?.salutation
    );

  const name =
    text(
      profile?.display_name ||
        profile?.full_name ||
        [
          profile?.first_name,
          profile?.last_name,
        ]
          .filter(
            Boolean
          )
          .join(" "),
      "INMBA Professional"
    );

  const degree =
    text(
      profile?.educational_qualification ||
        profile?.education ||
        profile?.qualification ||
        profile?.degree ||
        profile?.ug_degree ||
        profile?.pg_degree
    );

  const prefix =
    salutation
      ? `${salutation}. `
      : "";

  const suffix =
    degree
      ? `, ${degree}`
      : "";

  return `${prefix}${name}${suffix}`;
};

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function ProfileCard({
  title,
  icon,
  children,
  isOwner,
  onEdit,
  empty = false,
  className = "",
}) {
  return (
    <section
      className={`pro-public-card ${className}`.trim()}
    >
      <div className="pro-public-card-header">
        <div className="pro-public-card-title">
          <span className="pro-public-card-icon">
            <i
              className={icon}
              aria-hidden="true"
            />
          </span>

          <h2>
            {title}
          </h2>
        </div>

        {isOwner && onEdit && (
          <button
            type="button"
            className="pro-public-card-edit"
            onClick={onEdit}
          >
            <i
              className={
                empty
                  ? "fas fa-plus"
                  : "fas fa-pen"
              }
              aria-hidden="true"
            />

            {empty
              ? "Add Details"
              : "Edit"}
          </button>
        )}
      </div>

      {children}
    </section>
  );
}

function EmptyState({
  isOwner,
  onAdd,
  message =
    "No information added yet.",
}) {
  return (
    <div className="pro-public-empty">
      <div>
        {message}
      </div>

      {isOwner && onAdd && (
        <button
          type="button"
          onClick={onAdd}
        >
          <i
            className="fas fa-plus"
            aria-hidden="true"
          />

          Add Details
        </button>
      )}
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  rows = 4,
  options = [],
  note = "",
}) {
  return (
    <label className="pro-edit-field">
      <span>
        {label}
      </span>

      {type ===
      "textarea" ? (
        <textarea
          value={value ?? ""}
          rows={rows}
          placeholder={placeholder}
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
        />
      ) : type ===
        "select" ? (
        <select
          value={value ?? ""}
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
        >
          {options.map(
            (
              option
            ) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            )
          )}
        </select>
      ) : (
        <input
          type={type}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
        />
      )}

      {note && (
        <small className="pro-edit-note">
          {note}
        </small>
      )}
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
  note = "",
}) {
  return (
    <label className="pro-edit-toggle">
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
            event.target.checked
          )
        }
      />

      <span>
        {label}

        {note && (
          <small>
            {note}
          </small>
        )}
      </span>
    </label>
  );
}

function InfoRow({
  label,
  value,
}) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  return (
    <div className="pro-info-row">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function ContactRow({
  icon,
  value,
  link,
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="pro-contact-row">
      <i
        className={icon}
        aria-hidden="true"
      />

      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
        >
          {value}
        </a>
      ) : (
        <span>
          {value}
        </span>
      )}
    </div>
  );
}

function ListBlock({
  values,
  className =
    "pro-public-bullet-list",
}) {
  if (
    !values?.length
  ) {
    return null;
  }

  return (
    <ul className={className}>
      {values.map(
        (
          item,
          index
        ) => (
          <li
            key={`${item}-${index}`}
          >
            {item}
          </li>
        )
      )}
    </ul>
  );
}

const EDIT_TITLES = {
  overview:
    "Edit Public Profile",
  about:
    "Edit About Me & Interests",
  professional:
    "Edit Professional Information",
  education:
    "Edit Education",
  skills:
    "Edit Skills & Expertise",
  certifications:
    "Edit Certifications",
  achievements:
    "Edit Achievements & Publications",
  portfolio:
    "Edit Portfolio & Experience",
  media:
    "Edit Media",
  contact:
    "Edit Contact & Social Links",
  privacy:
    "Privacy & Visibility",
};

const PRIVACY_SECTIONS = [
  {
    value: "identity",
    label:
      "Basic Identity / Salutation",
  },
  {
    value: "location",
    label:
      "Area Location",
  },
  {
    value: "professional",
    label:
      "Professional Information",
  },
  {
    value: "education",
    label:
      "Education",
  },
  {
    value: "achievements",
    label:
      "Achievements & Certifications",
  },
  {
    value: "experience",
    label:
      "Experience & Portfolio",
  },
  {
    value: "bio",
    label:
      "About, Skills & Interests",
  },
  {
    value: "social",
    label:
      "Social & Website Links",
  },
  {
    value: "network",
    label:
      "Public Network Badge / Summary",
  },
];

/* =========================================================
   MAIN
========================================================= */

export default function ProfessionalPublicProfile({
  profile = {},
  isOwner = false,
  onProfileUpdated,
}) {
  const navigate =
    useNavigate();

  const avatarPhotoInputRef =
    useRef(null);

  const [
    activeSection,
    setActiveSection,
  ] = useState(
    "overview"
  );

  const [
    editingSection,
    setEditingSection,
  ] = useState(
    null
  );

  const [
    saving,
    setSaving,
  ] = useState(
    false
  );

  const [
    saveError,
    setSaveError,
  ] = useState(
    ""
  );

  const [
    saveSuccess,
    setSaveSuccess,
  ] = useState(
    ""
  );

  const [
    localProfile,
    setLocalProfile,
  ] = useState(
    profile
  );

  const [
    formData,
    setFormData,
  ] = useState(
    {}
  );

  useEffect(
    () => {
      setLocalProfile(
        profile
      );
    },
    [
      profile,
    ]
  );

  const displayHeading =
    buildDisplayHeading(
      localProfile
    );

  const displayName =
    text(
      localProfile.display_name ||
        localProfile.full_name ||
        [
          localProfile.first_name,
          localProfile.last_name,
        ]
          .filter(
            Boolean
          )
          .join(" "),
      "INMBA Professional"
    );

  const degree =
    text(
      localProfile.educational_qualification ||
        localProfile.education ||
        localProfile.qualification ||
        localProfile.degree ||
        localProfile.ug_degree ||
        localProfile.pg_degree
    );

  const profession =
    text(
      localProfile.professional_role ||
        localProfile.occupation,
      "Professional Member"
    );

  const location =
    buildLocation(
      localProfile
    );

  const profileImage =
    getProfileImage(
      localProfile
    );

  const coverImage =
    getCoverImage(
      localProfile
    );

  const skills =
    useMemo(
      () =>
        list(
          localProfile.skills
        ),
      [
        localProfile.skills,
      ]
    );

  const interestCategories =
    useMemo(
      () =>
        list(
          localProfile.interest_categories
        ),
      [
        localProfile.interest_categories,
      ]
    );

  const hobbies =
    useMemo(
      () =>
        list(
          localProfile.hobbies
        ),
      [
        localProfile.hobbies,
      ]
    );

  const languageSkills =
    useMemo(
      () =>
        list(
          localProfile.language_skills
        ),
      [
        localProfile.language_skills,
      ]
    );

  const certifications =
    useMemo(
      () =>
        list(
          localProfile.professional_certifications
        ),
      [
        localProfile.professional_certifications,
      ]
    );

  const additionalCertifications =
    useMemo(
      () =>
        list(
          localProfile.additional_certifications
        ),
      [
        localProfile.additional_certifications,
      ]
    );

  const awards =
    useMemo(
      () =>
        list(
          localProfile.awards_recognitions
        ),
      [
        localProfile.awards_recognitions,
      ]
    );

  const publications =
    useMemo(
      () =>
        list(
          localProfile.publications
        ),
      [
        localProfile.publications,
      ]
    );

  const milestones =
    useMemo(
      () =>
        list(
          localProfile.key_milestones
        ),
      [
        localProfile.key_milestones,
      ]
    );

  const mediaMentions =
    useMemo(
      () =>
        list(
          localProfile.media_mentions
        ),
      [
        localProfile.media_mentions,
      ]
    );

  const referenceLetters =
    useMemo(
      () =>
        list(
          localProfile.reference_letters
        ),
      [
        localProfile.reference_letters,
      ]
    );

  const employers =
    useMemo(
      () =>
        list(
          localProfile.previous_employers_clients
        ),
      [
        localProfile.previous_employers_clients,
      ]
    );

  const workSamples =
    useMemo(
      () =>
        list(
          localProfile.work_samples
        ),
      [
        localProfile.work_samples,
      ]
    );

  const galleryPhotos =
    useMemo(
      () =>
        list(
          localProfile.gallery_photos
        ),
      [
        localProfile.gallery_photos,
      ]
    );

  const selectedPublicSections =
    useMemo(
      () =>
        list(
          localProfile.public_profile_sections
        ),
      [
        localProfile.public_profile_sections,
      ]
    );

  const bio =
    text(
      localProfile.professional_bio ||
        localProfile.bio
    );

  const experience =
    localProfile
      ?.total_experience_years ??
    localProfile
      ?.years_of_experience;

  const showPhone =
    Boolean(
      localProfile.phone
    ) &&
    (
      isOwner ||
      localProfile
        .phone_public ===
        true ||
      localProfile
        .phone_public ===
        1
    );

  const showRate =
    Boolean(
      localProfile.hourly_project_rate
    ) &&
    (
      isOwner ||
      localProfile
        .hourly_project_rate_public ===
        true ||
      localProfile
        .hourly_project_rate_public ===
        1
    );

  const menuItems = [
    {
      key:
        "overview",
      label:
        "My Public Profile",
      icon:
        "fas fa-user",
    },
    {
      key:
        "about",
      label:
        "About Me",
      icon:
        "far fa-user",
    },
    {
      key:
        "professional",
      label:
        "Professional Info",
      icon:
        "fas fa-briefcase",
    },
    {
      key:
        "education",
      label:
        "Education",
      icon:
        "fas fa-graduation-cap",
    },
    {
      key:
        "skills",
      label:
        "Skills & Interests",
      icon:
        "fas fa-lightbulb",
    },
    {
      key:
        "certifications",
      label:
        "Certifications",
      icon:
        "fas fa-award",
    },
    {
      key:
        "achievements",
      label:
        "Achievements",
      icon:
        "fas fa-trophy",
    },
    {
      key:
        "portfolio",
      label:
        "Portfolio / Experience",
      icon:
        "fas fa-briefcase",
    },
    {
      key:
        "media",
      label:
        "Media",
      icon:
        "fas fa-image",
    },
    {
      key:
        "contact",
      label:
        "Contact & Social",
      icon:
        "fas fa-link",
    },
    ...(isOwner
      ? [
          {
            key:
              "privacy",
            label:
              "Privacy & Visibility",
            icon:
              "fas fa-shield-halved",
          },
        ]
      : []),
  ];

  const openEditor = (
    section
  ) => {
    if (!isOwner) {
      return;
    }

    setSaveError(
      ""
    );

    setSaveSuccess(
      ""
    );

    setFormData({
      salutation:
        normalizeSalutation(
          localProfile.salutation
        ),

      display_name:
        text(
          localProfile.display_name ||
            displayName
        ),

      professional_role:
        text(
          localProfile.professional_role ||
            localProfile.occupation
        ),

      occupation:
        text(
          localProfile.occupation
        ),

      profession:
        text(
          localProfile.profession
        ),

      current_status:
        text(
          localProfile.current_status
        ),

      educational_qualification:
        text(
          localProfile.educational_qualification ||
            localProfile.education
        ),

      school_college_name:
        text(
          localProfile.school_college_name
        ),

      degree_certificate_year:
        text(
          localProfile.degree_certificate_year
        ),

      city:
        text(
          localProfile.city
        ),

      district:
        text(
          localProfile.district
        ),

      state:
        text(
          localProfile.state
        ),

      pincode:
        text(
          localProfile.pincode
        ),

      professional_bio:
        text(
          localProfile.professional_bio ||
            localProfile.bio
        ),

      interest_categories:
        listToText(
          localProfile.interest_categories
        ),

      skills:
        listToText(
          localProfile.skills
        ),

      hobbies:
        listToText(
          localProfile.hobbies
        ),

      preferred_industry:
        text(
          localProfile.preferred_industry
        ),

      additional_certifications:
        listToText(
          localProfile.additional_certifications
        ),

      language_skills:
        listToText(
          localProfile.language_skills
        ),

      professional_certifications:
        listToText(
          localProfile.professional_certifications
        ),

      awards_recognitions:
        listToText(
          localProfile.awards_recognitions
        ),

      publications:
        listToText(
          localProfile.publications
        ),

      key_milestones:
        listToText(
          localProfile.key_milestones
        ),

      media_mentions:
        listToText(
          localProfile.media_mentions
        ),

      reference_letters:
        listToText(
          localProfile.reference_letters
        ),

      total_experience_years:
        text(
          experience
        ),

      previous_employers_clients:
        listToText(
          localProfile.previous_employers_clients
        ),

      work_samples:
        listToText(
          localProfile.work_samples
        ),

      hourly_project_rate:
        text(
          localProfile.hourly_project_rate
        ),

      availability_status:
        text(
          localProfile.availability_status
        ),

      profile_image_url:
        text(
          localProfile.profile_image_url
        ),

      cover_photo:
        text(
          localProfile.cover_photo
        ),

      gallery_photos:
        listToText(
          localProfile.gallery_photos
        ),

      intro_video:
        text(
          localProfile.intro_video
        ),

      social_link:
        text(
          localProfile.social_link
        ),

      social_instagram:
        text(
          localProfile.social_instagram
        ),

      social_linkedin:
        text(
          localProfile.social_linkedin
        ),

      social_twitter:
        text(
          localProfile.social_twitter
        ),

      social_facebook:
        text(
          localProfile.social_facebook
        ),

      social_youtube:
        text(
          localProfile.social_youtube
        ),

      portfolio_url:
        text(
          localProfile.portfolio_url
        ),

      qualification_public:
        localProfile
          .qualification_public !==
        false,

      phone_public:
        localProfile
          .phone_public ===
          true ||
        localProfile
          .phone_public ===
          1,

      hourly_project_rate_public:
        localProfile
          .hourly_project_rate_public ===
          true ||
        localProfile
          .hourly_project_rate_public ===
          1,

      public_profile_sections:
        list(
          localProfile.public_profile_sections
        ),

      public_profile_fields:
        list(
          localProfile.public_profile_fields
        ),
    });

    setEditingSection(
      section
    );
  };

  const uploadAndSaveMedia =
    async ({
      file,
      upload,
      fieldName,
      successMessage,
    }) => {
      if (!file) {
        return;
      }

      try {
        setSaving(true);
        setSaveError("");
        setSaveSuccess("");

        const uploaded =
          await upload(file);

        if (!uploaded?.path) {
          throw new Error(
            "Uploaded media path was not returned."
          );
        }

        await updatePublicProfile({
          [fieldName]:
            uploaded.path,
        });

        setLocalProfile(
          (current) => ({
            ...current,
            [fieldName]:
              uploaded.path,
          })
        );

        setSaveSuccess(
          successMessage
        );
      } catch (error) {
        setSaveError(
          error?.apiMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Unable to upload media."
        );
      } finally {
        setSaving(false);
      }
    };

  const handleCoverPhotoUpload =
    async (event) => {
      const file =
        event.target.files?.[0];

      await uploadAndSaveMedia({
        file,
        upload:
          uploadProfessionalCoverPhoto,
        fieldName:
          "cover_photo",
        successMessage:
          "Cover photo updated successfully.",
      });

      event.target.value = "";
    };

  const handleGalleryPhotoUpload =
    async (event) => {
      const files =
        Array.from(
          event.target.files || []
        );

      if (!files.length) {
        return;
      }

      try {
        setSaving(true);
        setSaveError("");
        setSaveSuccess("");

        const uploadedPaths = [];

        for (const file of files) {
          const uploaded =
            await uploadProfessionalGalleryPhoto(
              file
            );

          if (uploaded?.path) {
            uploadedPaths.push(
              uploaded.path
            );
          }
        }

        const galleryPhotos = [
          ...list(
            localProfile.gallery_photos
          ),
          ...uploadedPaths,
        ];

        await updatePublicProfile({
          gallery_photos:
            galleryPhotos,
        });

        setLocalProfile(
          (current) => ({
            ...current,
            gallery_photos:
              galleryPhotos,
          })
        );

        setSaveSuccess(
          "Gallery photos updated successfully."
        );
      } catch (error) {
        setSaveError(
          error?.apiMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Unable to upload gallery photos."
        );
      } finally {
        setSaving(false);
        event.target.value = "";
      }
    };

  const handleIntroVideoUpload =
    async (event) => {
      const file =
        event.target.files?.[0];

      await uploadAndSaveMedia({
        file,
        upload:
          uploadProfessionalIntroVideo,
        fieldName:
          "intro_video",
        successMessage:
          "Intro video updated successfully.",
      });

      event.target.value = "";
    };

  const closeEditor = () => {
    if (saving) {
      return;
    }

    setEditingSection(
      null
    );

    setSaveError(
      ""
    );
  };

  const updateField = (
    fieldName,
    value
  ) => {
    setFormData(
      (
        current
      ) => ({
        ...current,
        [fieldName]:
          value,
      })
    );
  };

  const togglePublicSection = (
    sectionName,
    checked
  ) => {
    const current =
      new Set(
        list(
          formData.public_profile_sections
        )
      );

    if (checked) {
      current.add(
        sectionName
      );
    } else {
      current.delete(
        sectionName
      );
    }

    updateField(
      "public_profile_sections",
      Array.from(
        current
      )
    );
  };

  const getPayload = () => {
    switch (
      editingSection
    ) {
      case "overview":
        return {
          salutation:
            normalizeSalutation(
              formData.salutation
            ),

          display_name:
            text(
              formData.display_name
            ),

          professional_role:
            text(
              formData.professional_role
            ),

          city:
            text(
              formData.city
            ),

          district:
            text(
              formData.district
            ),

          state:
            text(
              formData.state
            ),

          pincode:
            text(
              formData.pincode
            ),
        };

      case "about":
        return {
          professional_bio:
            text(
              formData.professional_bio
            ),

          interest_categories:
            list(
              formData.interest_categories
            ),

          hobbies:
            list(
              formData.hobbies
            ),

          preferred_industry:
            text(
              formData.preferred_industry
            ),
        };

      case "professional":
        return {
          occupation:
            text(
              formData.occupation
            ),

          profession:
            text(
              formData.profession
            ),

          professional_role:
            text(
              formData.professional_role
            ),

          current_status:
            text(
              formData.current_status
            ),

          total_experience_years:
            formData.total_experience_years ===
            ""
              ? null
              : Number(
                  formData.total_experience_years
                ),

          hourly_project_rate:
            text(
              formData.hourly_project_rate
            ),

          hourly_project_rate_public:
            Boolean(
              formData.hourly_project_rate_public
            ),

          availability_status:
            text(
              formData.availability_status
            ),

          preferred_industry:
            text(
              formData.preferred_industry
            ),
        };

      case "education":
        return {
          educational_qualification:
            text(
              formData.educational_qualification
            ),

          school_college_name:
            text(
              formData.school_college_name
            ),

          degree_certificate_year:
            text(
              formData.degree_certificate_year
            ),

          additional_certifications:
            list(
              formData.additional_certifications
            ),

          language_skills:
            list(
              formData.language_skills
            ),

          qualification_public:
            Boolean(
              formData.qualification_public
            ),
        };

      case "skills":
        return {
          skills:
            list(
              formData.skills
            ),

          interest_categories:
            list(
              formData.interest_categories
            ),

          hobbies:
            list(
              formData.hobbies
            ),

          preferred_industry:
            text(
              formData.preferred_industry
            ),
        };

      case "certifications":
        return {
          professional_certifications:
            list(
              formData.professional_certifications
            ),

          additional_certifications:
            list(
              formData.additional_certifications
            ),
        };

      case "achievements":
        return {
          awards_recognitions:
            list(
              formData.awards_recognitions
            ),

          publications:
            list(
              formData.publications
            ),

          key_milestones:
            list(
              formData.key_milestones
            ),

          media_mentions:
            list(
              formData.media_mentions
            ),

          reference_letters:
            list(
              formData.reference_letters
            ),
        };

      case "portfolio":
        return {
          previous_employers_clients:
            list(
              formData.previous_employers_clients
            ),

          work_samples:
            list(
              formData.work_samples
            ),

          portfolio_url:
            text(
              formData.portfolio_url
            ),

          availability_status:
            text(
              formData.availability_status
            ),
        };

      case "media":
        return {
          profile_image_url:
            text(
              formData.profile_image_url
            ),

          cover_photo:
            text(
              formData.cover_photo
            ),

          gallery_photos:
            list(
              formData.gallery_photos
            ),

          intro_video:
            text(
              formData.intro_video
            ),
        };

      case "contact":
        return {
          phone_public:
            Boolean(
              formData.phone_public
            ),

          social_link:
            text(
              formData.social_link
            ),

          social_instagram:
            text(
              formData.social_instagram
            ),

          social_linkedin:
            text(
              formData.social_linkedin
            ),

          social_twitter:
            text(
              formData.social_twitter
            ),

          social_facebook:
            text(
              formData.social_facebook
            ),

          social_youtube:
            text(
              formData.social_youtube
            ),

          portfolio_url:
            text(
              formData.portfolio_url
            ),
        };

      case "privacy":
        return {
          phone_public:
            Boolean(
              formData.phone_public
            ),

          qualification_public:
            Boolean(
              formData.qualification_public
            ),

          hourly_project_rate_public:
            Boolean(
              formData.hourly_project_rate_public
            ),

          public_profile_sections:
            list(
              formData.public_profile_sections
            ),

          public_profile_fields:
            list(
              formData.public_profile_fields
            ),
        };

      default:
        return {};
    }
  };

  const handleSave =
    async () => {
      if (
        !editingSection ||
        saving
      ) {
        return;
      }

      try {
        setSaving(
          true
        );

        setSaveError(
          ""
        );

        setSaveSuccess(
          ""
        );

        const payload =
          getPayload();

        if (
          Object.keys(
            payload
          ).length ===
          0
        ) {
          throw new Error(
            "No profile changes were provided."
          );
        }

        const response =
          await updatePublicProfile(
            payload
          );

        const responseProfile =
          response?.profile ||
          response?.data
            ?.profile ||
          null;

        const nextProfile = {
          ...localProfile,
          ...payload,
          ...(responseProfile &&
          typeof responseProfile ===
            "object"
            ? responseProfile
            : {}),
        };

        setLocalProfile(
          nextProfile
        );

        if (
          typeof onProfileUpdated ===
          "function"
        ) {
          onProfileUpdated(
            nextProfile
          );
        }

        setEditingSection(
          null
        );

        setSaveSuccess(
          "Public profile updated successfully."
        );

        window.setTimeout(
          () => {
            setSaveSuccess(
              ""
            );
          },
          3000
        );
      } catch (
        error
      ) {
        console.error(
          "Professional public profile update error:",
          error
        );

        setSaveError(
          error?.apiMessage ||
            error?.response
              ?.data?.message ||
            error?.message ||
            "Unable to update your public profile."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  const previewPublicView =
    () => {
      if (
        !localProfile.login_id
      ) {
        return;
      }

      navigate(
        `/user-profile/${encodeURIComponent(
          localProfile.login_id
        )}`
      );
    };

  const scrollToSection = (
    key
  ) => {
    setActiveSection(
      key
    );

    document
      .getElementById(
        `pro-${key}`
      )
      ?.scrollIntoView({
        behavior:
          "auto",
        block:
          "start",
      });
  };

const handleProfilePhotoUpload =
  async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
      TYPE VALIDATION
    */

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setSaveError(
        "Only JPG, PNG and WEBP images are allowed."
      );

      event.target.value =
        "";

      return;
    }

    /*
      SIZE VALIDATION
      Max 5 MB
    */

    const maxSize =
      5 *
      1024 *
      1024;

    if (
      file.size >
      maxSize
    ) {
      setSaveError(
        "Profile photo must be below 5 MB."
      );

      event.target.value =
        "";

      return;
    }

    try {
      setSaving(
        true
      );

      setSaveError(
        ""
      );

      setSaveSuccess(
        ""
      );

      /*
        ACTUAL BACKEND UPLOAD

        POST
        /api/profile/photo
      */

      await uploadOwnProfilePhoto(
        file
      );

      /*
        Immediate local preview.

        Backend permanent path will
        be loaded next time profile
        is fetched.
      */

      const previewUrl =
        URL.createObjectURL(
          file
        );

      setLocalProfile(
        (
          current
        ) => ({
          ...current,

          profile_pic:
            previewUrl,

          profile_pic_url:
            previewUrl,

          profile_photo_url:
            previewUrl,

          profile_image_url:
            previewUrl,
        })
      );

      /*
        Refresh owner profile if
        parent provides reload handler.
      */

      if (
        typeof onProfileUpdated ===
        "function"
      ) {
        await onProfileUpdated();
      }

      setSaveSuccess(
        "Profile photo uploaded successfully."
      );

      window.setTimeout(
        () => {
          setSaveSuccess(
            ""
          );
        },
        3000
      );
    } catch (
      error
    ) {
      console.error(
        "Profile photo upload error:",
        error
      );

      setSaveError(
        error?.apiMessage ||
        error?.response?.data
          ?.message ||
        error?.message ||
        "Unable to upload profile photo."
      );
    } finally {
      setSaving(
        false
      );

      event.target.value =
        "";
    }
  };
  return (
    <main className="pro-public-page">
      <div className="pro-public-layout">
        {/* ===================== SIDEBAR ===================== */}

        <aside className="pro-public-sidebar">
          <nav>
            {menuItems.map(
              (
                item
              ) => (
                <button
                  key={
                    item.key
                  }
                  type="button"
                  className={
                    activeSection ===
                    item.key
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    scrollToSection(
                      item.key
                    )
                  }
                >
                  <i
                    className={
                      item.icon
                    }
                    aria-hidden="true"
                  />

                  <span>
                    {
                      item.label
                    }
                  </span>
                </button>
              )
            )}
          </nav>

          <div className="pro-public-membership-box">
            <div className="membership-icon">
              <i
                className="fas fa-shield-halved"
                aria-hidden="true"
              />
            </div>

            <h3>
              Membership Status
            </h3>

            <span className="membership-verified">
              Verified Professional
            </span>

            {isOwner &&
              localProfile
                .login_id && (
                <>
                  <small>
                    Member ID
                  </small>

                  <strong>
                    {
                      localProfile.login_id
                    }
                  </strong>
                </>
              )}
          </div>
        </aside>

        {/* ===================== CONTENT ===================== */}

        <div className="pro-public-main">
          {saveSuccess && (
            <div className="pro-profile-message pro-profile-message-success">
              <i
                className="fas fa-circle-check"
                aria-hidden="true"
              />

              {
                saveSuccess
              }
            </div>
          )}

          {saveError && (
            <div className="pro-profile-message pro-profile-message-error">
              <i
                className="fas fa-circle-exclamation"
                aria-hidden="true"
              />

              {saveError}
            </div>
          )}

          {/* ===================== HERO ===================== */}

          <section
            id="pro-overview"
            className="pro-public-hero"
          >
            {coverImage && (
              <div className="pro-public-cover">
                <img
                  src={
                    safeUrl(
                      coverImage
                    )
                  }
                  alt=""
                />
              </div>
            )}

            <div className="pro-public-avatar-wrap">
              <div className="pro-public-avatar">
                {profileImage ? (
                  <img
                    src={
                      safeUrl(
                        profileImage
                      )
                    }
                    alt={
                      displayName
                    }
                  />
                ) : (
                  <span>
                    {displayName
                      .charAt(
                        0
                      )
                      .toUpperCase()}
                  </span>
                )}
              </div>

              {isOwner && (
                <>
                  <button
                    type="button"
                    className="pro-public-avatar-upload"
                    onClick={() =>
                      avatarPhotoInputRef.current?.click()
                    }
                    disabled={saving}
                    title="Update profile photo"
                    aria-label="Update profile photo"
                  >
                    <i className="fas fa-camera" />
                  </button>

                  <input
                    ref={avatarPhotoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProfilePhotoUpload}
                    disabled={saving}
                    hidden
                  />
                </>
              )}
            </div>

            <div className="pro-public-hero-content">
              <div className="pro-public-name-line">
                <h1>
                  {
                    displayHeading
                  }
                </h1>

                {localProfile
                  ?.kyc_verified && (
                  <i
                    className="fas fa-circle-check verified-icon"
                    title="Verified"
                    aria-hidden="true"
                  />
                )}
              </div>

              <h2>
                {profession}
              </h2>

              <div className="pro-public-hero-badges">
                <span className="verified">
                  <i
                    className="fas fa-shield-halved"
                    aria-hidden="true"
                  />

                  Verified Professional
                </span>

                {isOwner &&
                  localProfile
                    ?.login_id && (
                    <span>
                      <i
                        className="far fa-id-card"
                        aria-hidden="true"
                      />

                      {
                        localProfile.login_id
                      }
                    </span>
                  )}

                {location && (
                  <span>
                    <i
                      className="fas fa-location-dot"
                      aria-hidden="true"
                    />

                    {
                      location
                    }
                  </span>
                )}
              </div>

              <div className="pro-public-hero-meta">
                {localProfile
                  ?.network_level && (
                  <span>
                    <i
                      className="fas fa-ranking-star"
                      aria-hidden="true"
                    />

                    Level{" "}
                    {
                      localProfile.network_level
                    }
                  </span>
                )}

                {localProfile
                  ?.availability_status && (
                  <span>
                    <i
                      className="fas fa-briefcase"
                      aria-hidden="true"
                    />

                    {
                      localProfile.availability_status
                    }
                  </span>
                )}
              </div>
            </div>

            {isOwner && (
              <div className="pro-public-owner-actions">
                <button
                  type="button"
                  className="primary"
                  onClick={() =>
                    openEditor(
                      "overview"
                    )
                  }
                >
                  <i
                    className="fas fa-pen"
                    aria-hidden="true"
                  />

                  Edit Public Profile
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={
                    previewPublicView
                  }
                >
                  <i
                    className="fas fa-eye"
                    aria-hidden="true"
                  />

                  Preview Public View
                </button>
              </div>
            )}
          </section>

          <div className="pro-public-content-grid">
            {/* ===================== ABOUT ===================== */}

            <div
              id="pro-about"
              className="pro-span-1"
            >
              <ProfileCard
                title="About Me"
                icon="fas fa-user"
                isOwner={isOwner}
                empty={
                  !bio &&
                  interestCategories
                    .length ===
                    0 &&
                  hobbies.length ===
                    0
                }
                onEdit={() =>
                  openEditor(
                    "about"
                  )
                }
              >
                {bio ? (
                  <p className="pro-public-about">
                    {bio}
                  </p>
                ) : (
                  <EmptyState
                    isOwner={
                      isOwner
                    }
                    onAdd={() =>
                      openEditor(
                        "about"
                      )
                    }
                  />
                )}

                {interestCategories
                  .length >
                  0 && (
                  <>
                    <h3 className="pro-mini-heading">
                      Interest Categories
                    </h3>

                    <div className="pro-public-tags">
                      {interestCategories.map(
                        (
                          item,
                          index
                        ) => (
                          <span
                            key={`${item}-${index}`}
                          >
                            {
                              item
                            }
                          </span>
                        )
                      )}
                    </div>
                  </>
                )}

                {hobbies.length >
                  0 && (
                  <>
                    <h3 className="pro-mini-heading">
                      Hobbies
                    </h3>

                    <div className="pro-public-tags">
                      {hobbies.map(
                        (
                          item,
                          index
                        ) => (
                          <span
                            key={`${item}-${index}`}
                          >
                            {
                              item
                            }
                          </span>
                        )
                      )}
                    </div>
                  </>
                )}
              </ProfileCard>
            </div>

            {/* ===================== PROFESSIONAL ===================== */}

            <div id="pro-professional">
              <ProfileCard
                title="Professional Information"
                icon="fas fa-briefcase"
                isOwner={isOwner}
                onEdit={() =>
                  openEditor(
                    "professional"
                  )
                }
              >
                <div className="pro-info-list">
                  <InfoRow
                    label="Occupation"
                    value={
                      localProfile.occupation
                    }
                  />

                  <InfoRow
                    label="Profession"
                    value={
                      localProfile.profession
                    }
                  />

                  <InfoRow
                    label="Professional Role"
                    value={
                      localProfile.professional_role
                    }
                  />

                  <InfoRow
                    label="Current Status"
                    value={
                      localProfile.current_status
                    }
                  />

                  <InfoRow
                    label="Preferred Industry"
                    value={
                      localProfile.preferred_industry
                    }
                  />

                  <InfoRow
                    label="Experience"
                    value={
                      experience !==
                        null &&
                      experience !==
                        undefined &&
                      experience !==
                        ""
                        ? `${experience} Years`
                        : ""
                    }
                  />

                  <InfoRow
                    label="Availability"
                    value={
                      localProfile.availability_status
                    }
                  />

                  {showRate && (
                    <InfoRow
                      label="Hourly / Project Rate"
                      value={
                        localProfile.hourly_project_rate
                      }
                    />
                  )}
                </div>

                <div className="pro-public-verification-row">
                  {localProfile
                    ?.professional_license_badge && (
                    <span>
                      <i className="fas fa-certificate" />
                      Professional License Verified
                    </span>
                  )}

                  {localProfile
                    ?.council_registration_badge && (
                    <span>
                      <i className="fas fa-building-columns" />
                      Council Registration Verified
                    </span>
                  )}

                  {localProfile
                    ?.gst_badge && (
                    <span>
                      <i className="fas fa-file-circle-check" />
                      GST Verified
                    </span>
                  )}
                </div>
              </ProfileCard>
            </div>

            {/* ===================== EDUCATION ===================== */}

            <div id="pro-education">
              <ProfileCard
                title="Education"
                icon="fas fa-graduation-cap"
                isOwner={isOwner}
                onEdit={() =>
                  openEditor(
                    "education"
                  )
                }
              >
                <div className="pro-info-list">
                  <InfoRow
                    label="Highest Qualification"
                    value={
                      degree
                    }
                  />

                  <InfoRow
                    label="Institution"
                    value={
                      localProfile.school_college_name
                    }
                  />

                  <InfoRow
                    label="Degree / Certificate Year"
                    value={
                      localProfile.degree_certificate_year
                    }
                  />
                </div>

                {languageSkills
                  .length >
                  0 && (
                  <>
                    <h3 className="pro-mini-heading">
                      Language Skills
                    </h3>

                    <div className="pro-public-tags">
                      {languageSkills.map(
                        (
                          item,
                          index
                        ) => (
                          <span
                            key={`${item}-${index}`}
                          >
                            {
                              item
                            }
                          </span>
                        )
                      )}
                    </div>
                  </>
                )}

                {additionalCertifications
                  .length >
                  0 && (
                  <>
                    <h3 className="pro-mini-heading">
                      Additional Certifications
                    </h3>

                    <ListBlock
                      values={
                        additionalCertifications
                      }
                    />
                  </>
                )}
              </ProfileCard>
            </div>

            {/* ===================== SKILLS ===================== */}

            <div id="pro-skills">
              <ProfileCard
                title="Skills & Interests"
                icon="far fa-lightbulb"
                isOwner={isOwner}
                empty={
                  skills.length ===
                    0 &&
                  interestCategories
                    .length ===
                    0 &&
                  hobbies.length ===
                    0
                }
                onEdit={() =>
                  openEditor(
                    "skills"
                  )
                }
              >
                {skills.length >
                0 ? (
                  <>
                    <h3 className="pro-mini-heading">
                      Skills
                    </h3>

                    <div className="pro-public-tags">
                      {skills.map(
                        (
                          skill,
                          index
                        ) => (
                          <span
                            key={`${skill}-${index}`}
                          >
                            {
                              skill
                            }
                          </span>
                        )
                      )}
                    </div>
                  </>
                ) : (
                  <EmptyState
                    isOwner={
                      isOwner
                    }
                    onAdd={() =>
                      openEditor(
                        "skills"
                      )
                    }
                  />
                )}
              </ProfileCard>
            </div>

            {/* ===================== CERTIFICATIONS ===================== */}

            <div id="pro-certifications">
              <ProfileCard
                title="Certifications"
                icon="fas fa-award"
                isOwner={isOwner}
                empty={
                  certifications
                    .length ===
                    0 &&
                  additionalCertifications
                    .length ===
                    0
                }
                onEdit={() =>
                  openEditor(
                    "certifications"
                  )
                }
              >
                {[
                  ...certifications,
                  ...additionalCertifications,
                ].length >
                0 ? (
                  <ListBlock
                    values={[
                      ...certifications,
                      ...additionalCertifications,
                    ]}
                  />
                ) : (
                  <EmptyState
                    isOwner={
                      isOwner
                    }
                    onAdd={() =>
                      openEditor(
                        "certifications"
                      )
                    }
                  />
                )}
              </ProfileCard>
            </div>

            {/* ===================== ACHIEVEMENTS ===================== */}

            <div id="pro-achievements">
              <ProfileCard
                title="Achievements, Publications & Recognition"
                icon="fas fa-trophy"
                isOwner={isOwner}
                empty={
                  awards.length ===
                    0 &&
                  publications
                    .length ===
                    0 &&
                  milestones.length ===
                    0 &&
                  mediaMentions
                    .length ===
                    0 &&
                  referenceLetters
                    .length ===
                    0
                }
                onEdit={() =>
                  openEditor(
                    "achievements"
                  )
                }
              >
                {awards.length >
                  0 && (
                  <>
                    <h3 className="pro-mini-heading">
                      Awards / Recognitions
                    </h3>
                    <ListBlock
                      values={
                        awards
                      }
                      className="pro-public-achievements"
                    />
                  </>
                )}

                {publications
                  .length >
                  0 && (
                  <>
                    <h3 className="pro-mini-heading">
                      Publications / Published Work
                    </h3>
                    <ListBlock
                      values={
                        publications
                      }
                    />
                  </>
                )}

                {milestones.length >
                  0 && (
                  <>
                    <h3 className="pro-mini-heading">
                      Key Milestones
                    </h3>
                    <ListBlock
                      values={
                        milestones
                      }
                    />
                  </>
                )}

                {mediaMentions
                  .length >
                  0 && (
                  <>
                    <h3 className="pro-mini-heading">
                      Media Mentions / Press Coverage
                    </h3>
                    <ListBlock
                      values={
                        mediaMentions
                      }
                    />
                  </>
                )}

                {referenceLetters
                  .length >
                  0 && (
                  <>
                    <h3 className="pro-mini-heading">
                      Testimonials / Reference Letters
                    </h3>
                    <ListBlock
                      values={
                        referenceLetters
                      }
                    />
                  </>
                )}

                {awards.length ===
                  0 &&
                  publications
                    .length ===
                    0 &&
                  milestones.length ===
                    0 &&
                  mediaMentions
                    .length ===
                    0 &&
                  referenceLetters
                    .length ===
                    0 && (
                    <EmptyState
                      isOwner={
                        isOwner
                      }
                      onAdd={() =>
                        openEditor(
                          "achievements"
                        )
                      }
                    />
                  )}
              </ProfileCard>
            </div>

            {/* ===================== PORTFOLIO ===================== */}

            <div
              id="pro-portfolio"
              className="pro-span-2"
            >
              <ProfileCard
                title="Work Experience & Portfolio"
                icon="fas fa-briefcase"
                isOwner={isOwner}
                empty={
                  workSamples
                    .length ===
                    0 &&
                  employers.length ===
                    0 &&
                  !localProfile
                    .portfolio_url
                }
                onEdit={() =>
                  openEditor(
                    "portfolio"
                  )
                }
              >
                {employers.length >
                  0 && (
                  <>
                    <h3 className="pro-mini-heading">
                      Previous Employers / Clients
                    </h3>

                    <div className="pro-employers">
                      {employers.map(
                        (
                          employer,
                          index
                        ) => (
                          <span
                            key={`${employer}-${index}`}
                          >
                            <i
                              className="fas fa-building"
                              aria-hidden="true"
                            />

                            {
                              employer
                            }
                          </span>
                        )
                      )}
                    </div>
                  </>
                )}

                {workSamples.length >
                  0 && (
                  <>
                    <h3 className="pro-mini-heading">
                      Work Samples
                    </h3>

                    <div className="pro-public-portfolio">
                      {workSamples.map(
                        (
                          item,
                          index
                        ) => (
                          <article
                            key={`${item}-${index}`}
                          >
                            {/^https?:\/\//i.test(
                              item
                            ) ? (
                              <a
                                href={
                                  safeUrl(
                                    item
                                  )
                                }
                                target="_blank"
                                rel="noreferrer"
                              >
                                {
                                  item
                                }
                              </a>
                            ) : (
                              <h4>
                                {
                                  item
                                }
                              </h4>
                            )}
                          </article>
                        )
                      )}
                    </div>
                  </>
                )}

                {localProfile
                  .portfolio_url && (
                  <a
                    className="pro-public-portfolio-link"
                    href={
                      safeUrl(
                        localProfile.portfolio_url
                      )
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i
                      className="fas fa-arrow-up-right-from-square"
                      aria-hidden="true"
                    />

                    View Website / Portfolio
                  </a>
                )}

                {workSamples
                  .length ===
                  0 &&
                  employers.length ===
                    0 &&
                  !localProfile
                    .portfolio_url && (
                    <EmptyState
                      isOwner={
                        isOwner
                      }
                      onAdd={() =>
                        openEditor(
                          "portfolio"
                        )
                      }
                    />
                  )}
              </ProfileCard>
            </div>

            {/* ===================== MEDIA ===================== */}

            <div
              id="pro-media"
              className="pro-span-2"
            >
              <ProfileCard
                title="Media"
                icon="fas fa-image"
                isOwner={isOwner}
                empty={
                  !profileImage &&
                  !coverImage &&
                  galleryPhotos
                    .length ===
                    0 &&
                  !localProfile
                    .intro_video
                }
                onEdit={() =>
                  openEditor(
                    "media"
                  )
                }
              >
                <div className="pro-media-grid">
                  {profileImage && (
                    <div className="pro-media-item">
                      <span>
                        Profile Photo
                      </span>

                      <img
                        src={
                          safeUrl(
                            profileImage
                          )
                        }
                        alt={`${displayName} profile`}
                      />
                    </div>
                  )}

                  {coverImage && (
                    <div className="pro-media-item pro-media-wide">
                      <span>
                        Cover Photo
                      </span>

                      <img
                        src={
                          safeUrl(
                            coverImage
                          )
                        }
                        alt=""
                      />
                    </div>
                  )}

                  {galleryPhotos.map(
                    (
                      photo,
                      index
                    ) => (
                      <div
                        className="pro-media-item"
                        key={`${photo}-${index}`}
                      >
                        <span>
                          Gallery{" "}
                          {index +
                            1}
                        </span>

                        <img
                          src={
                            safeUrl(
                              photo
                            )
                          }
                          alt=""
                        />
                      </div>
                    )
                  )}
                </div>

                {localProfile
                  .intro_video && (
                  <a
                    className="pro-public-portfolio-link"
                    href={
                      safeUrl(
                        localProfile.intro_video
                      )
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="fas fa-circle-play" />
                    View Intro Video
                  </a>
                )}

                {!profileImage &&
                  !coverImage &&
                  galleryPhotos
                    .length ===
                    0 &&
                  !localProfile
                    .intro_video && (
                    <EmptyState
                      isOwner={
                        isOwner
                      }
                      onAdd={() =>
                        openEditor(
                          "media"
                        )
                      }
                    />
                  )}
              </ProfileCard>
            </div>

            {/* ===================== CONTACT / SOCIAL ===================== */}

            <div
              id="pro-contact"
              className="pro-span-2"
            >
              <ProfileCard
                title="Contact, Social & Website"
                icon="fas fa-link"
                isOwner={isOwner}
                empty={
                  !showPhone &&
                  !localProfile
                    .portfolio_url &&
                  !localProfile
                    .social_link &&
                  !localProfile
                    .social_instagram &&
                  !localProfile
                    .social_linkedin &&
                  !localProfile
                    .social_facebook &&
                  !localProfile
                    .social_youtube &&
                  !localProfile
                    .social_twitter
                }
                onEdit={() =>
                  openEditor(
                    "contact"
                  )
                }
              >
                <div className="pro-contact-list">
                  {showPhone && (
                    <ContactRow
                      icon="fas fa-phone"
                      value={
                        localProfile.phone
                      }
                    />
                  )}

                  {location && (
                    <ContactRow
                      icon="fas fa-location-dot"
                      value={
                        location
                      }
                    />
                  )}

                  {localProfile
                    ?.portfolio_url && (
                    <ContactRow
                      icon="fas fa-globe"
                      value={
                        localProfile.portfolio_url
                      }
                      link={
                        safeUrl(
                          localProfile.portfolio_url
                        )
                      }
                    />
                  )}
                </div>

                <div className="pro-social-icons">
                  {localProfile
                    ?.social_linkedin && (
                    <a
                      href={
                        safeUrl(
                          localProfile.social_linkedin
                        )
                      }
                      target="_blank"
                      rel="noreferrer"
                      aria-label="LinkedIn"
                    >
                      <i className="fab fa-linkedin-in" />
                    </a>
                  )}

                  {localProfile
                    ?.social_instagram && (
                    <a
                      href={
                        safeUrl(
                          localProfile.social_instagram
                        )
                      }
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                    >
                      <i className="fab fa-instagram" />
                    </a>
                  )}

                  {localProfile
                    ?.social_facebook && (
                    <a
                      href={
                        safeUrl(
                          localProfile.social_facebook
                        )
                      }
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Facebook"
                    >
                      <i className="fab fa-facebook-f" />
                    </a>
                  )}

                  {localProfile
                    ?.social_youtube && (
                    <a
                      href={
                        safeUrl(
                          localProfile.social_youtube
                        )
                      }
                      target="_blank"
                      rel="noreferrer"
                      aria-label="YouTube"
                    >
                      <i className="fab fa-youtube" />
                    </a>
                  )}

                  {localProfile
                    ?.social_twitter && (
                    <a
                      href={
                        safeUrl(
                          localProfile.social_twitter
                        )
                      }
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Twitter / X"
                    >
                      <i className="fab fa-x-twitter" />
                    </a>
                  )}

                  {localProfile
                    ?.social_link && (
                    <a
                      href={
                        safeUrl(
                          localProfile.social_link
                        )
                      }
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Professional social link"
                    >
                      <i className="fas fa-link" />
                    </a>
                  )}
                </div>
              </ProfileCard>
            </div>

            {/* ===================== PRIVACY ===================== */}

            {isOwner && (
              <div
                id="pro-privacy"
                className="pro-span-2"
              >
                <ProfileCard
                  title="Privacy & Visibility"
                  icon="fas fa-shield-halved"
                  isOwner={isOwner}
                  onEdit={() =>
                    openEditor(
                      "privacy"
                    )
                  }
                >
                  <div className="pro-privacy-summary">
                    <div>
                      <i className="fas fa-phone" />
                      Phone:
                      <strong>
                        {localProfile
                          .phone_public
                          ? " Public"
                          : " Private"}
                      </strong>
                    </div>

                    <div>
                      <i className="fas fa-graduation-cap" />
                      Qualification:
                      <strong>
                        {localProfile
                          .qualification_public !==
                        false
                          ? " Public"
                          : " Private"}
                      </strong>
                    </div>

                    <div>
                      <i className="fas fa-indian-rupee-sign" />
                      Rate:
                      <strong>
                        {localProfile
                          .hourly_project_rate_public
                          ? " Public"
                          : " Private"}
                      </strong>
                    </div>

                    <div>
                      <i className="fas fa-layer-group" />
                      Custom public sections:
                      <strong>
                        {" "}
                        {
                          selectedPublicSections.length
                        }
                      </strong>
                    </div>
                  </div>

                  <p className="pro-public-about">
                    Aadhaar, PAN, DOB, bank details, nominee details,
                    KYC document files and other private identity data
                    are not shown on this public profile.
                  </p>
                </ProfileCard>
              </div>
            )}
          </div>

          <footer className="pro-public-footer-note">
            <i
              className="fas fa-lock"
              aria-hidden="true"
            />

            Private information remains protected.
            Only approved public information is shown
            on this profile.
          </footer>
        </div>
      </div>

      {/* ===================== EDIT MODAL ===================== */}

      {isOwner &&
        editingSection && (
          <div
            className="pro-edit-overlay"
            role="presentation"
            onMouseDown={
              closeEditor
            }
          >
            <section
              className="pro-edit-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="professional-public-edit-title"
              onMouseDown={(
                event
              ) =>
                event.stopPropagation()
              }
            >
              <div className="pro-edit-modal-header">
                <div>
                  <p>
                    Owner Public Profile
                  </p>

                  <h2 id="professional-public-edit-title">
                    {
                      EDIT_TITLES[
                        editingSection
                      ] ||
                      "Edit Public Profile"
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  className="pro-edit-close"
                  onClick={
                    closeEditor
                  }
                  disabled={
                    saving
                  }
                  aria-label="Close editor"
                >
                  <i
                    className="fas fa-xmark"
                    aria-hidden="true"
                  />
                </button>
              </div>

              <div className="pro-edit-modal-body">
                {/* OVERVIEW */}

                {editingSection ===
                  "overview" && (
                  <>
                    <EditField
                      label="Salutation"
                      type="select"
                      value={
                        formData.salutation ||
                        ""
                      }
                      options={[
                        {
                          value:
                            "",
                          label:
                            "Select",
                        },
                        {
                          value:
                            "Mr",
                          label:
                            "Mr",
                        },
                        {
                          value:
                            "Mrs",
                          label:
                            "Mrs",
                        },
                        {
                          value:
                            "Ms",
                          label:
                            "Ms",
                        },
                        {
                          value:
                            "Dr",
                          label:
                            "Dr",
                        },
                      ]}
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "salutation",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Display Name"
                      value={
                        formData.display_name ||
                        ""
                      }
                      placeholder="Arul Prakash"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "display_name",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Professional Title"
                      value={
                        formData.professional_role ||
                        ""
                      }
                      placeholder="Business Consultant"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "professional_role",
                          value
                        )
                      }
                    />

                    <div className="pro-edit-grid-2">
                      <EditField
                        label="City"
                        value={
                          formData.city ||
                          ""
                        }
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "city",
                            value
                          )
                        }
                      />

                      <EditField
                        label="District"
                        value={
                          formData.district ||
                          ""
                        }
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "district",
                            value
                          )
                        }
                      />

                      <EditField
                        label="State"
                        value={
                          formData.state ||
                          ""
                        }
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "state",
                            value
                          )
                        }
                      />

                      <EditField
                        label="Pincode"
                        value={
                          formData.pincode ||
                          ""
                        }
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "pincode",
                            value
                          )
                        }
                      />
                    </div>
                  </>
                )}

                {/* ABOUT */}

                {editingSection ===
                  "about" && (
                  <>
                    <EditField
                      label="About Me / Professional Bio"
                      type="textarea"
                      rows={6}
                      value={
                        formData.professional_bio ||
                        ""
                      }
                      placeholder="Write a professional introduction..."
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "professional_bio",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Interest Categories"
                      type="textarea"
                      rows={3}
                      value={
                        formData.interest_categories ||
                        ""
                      }
                      placeholder="Consulting, Technology, Finance"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "interest_categories",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Hobbies"
                      type="textarea"
                      rows={3}
                      value={
                        formData.hobbies ||
                        ""
                      }
                      placeholder="Reading, Travel, Sports"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "hobbies",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Preferred Industry / Sector"
                      value={
                        formData.preferred_industry ||
                        ""
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "preferred_industry",
                          value
                        )
                      }
                    />
                  </>
                )}

                {/* PROFESSIONAL */}

                {editingSection ===
                  "professional" && (
                  <>
                    <div className="pro-edit-grid-2">
                      <EditField
                        label="Occupation"
                        value={
                          formData.occupation ||
                          ""
                        }
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "occupation",
                            value
                          )
                        }
                      />

                      <EditField
                        label="Profession"
                        value={
                          formData.profession ||
                          ""
                        }
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "profession",
                            value
                          )
                        }
                      />

                      <EditField
                        label="Professional Role / Title"
                        value={
                          formData.professional_role ||
                          ""
                        }
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "professional_role",
                            value
                          )
                        }
                      />

                      <EditField
                        label="Current Status"
                        value={
                          formData.current_status ||
                          ""
                        }
                        placeholder="Working / Freelancer / Business Owner"
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "current_status",
                            value
                          )
                        }
                      />

                      <EditField
                        label="Total Years of Experience"
                        type="number"
                        value={
                          formData.total_experience_years ||
                          ""
                        }
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "total_experience_years",
                            value
                          )
                        }
                      />

                      <EditField
                        label="Hourly / Project Rate"
                        value={
                          formData.hourly_project_rate ||
                          ""
                        }
                        placeholder="₹2,000/hour or ₹25,000/project"
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "hourly_project_rate",
                            value
                          )
                        }
                      />

                      <EditField
                        label="Availability Status"
                        value={
                          formData.availability_status ||
                          ""
                        }
                        placeholder="Available / Busy / Open to projects"
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "availability_status",
                            value
                          )
                        }
                      />

                      <EditField
                        label="Preferred Industry"
                        value={
                          formData.preferred_industry ||
                          ""
                        }
                        onChange={(
                          value
                        ) =>
                          updateField(
                            "preferred_industry",
                            value
                          )
                        }
                      />
                    </div>

                    <ToggleField
                      label="Show hourly / project rate on public profile"
                      checked={
                        formData.hourly_project_rate_public
                      }
                      onChange={(
                        checked
                      ) =>
                        updateField(
                          "hourly_project_rate_public",
                          checked
                        )
                      }
                    />
                  </>
                )}

                {/* EDUCATION */}

                {editingSection ===
                  "education" && (
                  <>
                    <EditField
                      label="Highest Qualification"
                      value={
                        formData.educational_qualification ||
                        ""
                      }
                      placeholder="MBA, B.E., M.Com..."
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "educational_qualification",
                          value
                        )
                      }
                    />

                    <EditField
                      label="School / College / Institution"
                      value={
                        formData.school_college_name ||
                        ""
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "school_college_name",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Degree / Certificate Year"
                      value={
                        formData.degree_certificate_year ||
                        ""
                      }
                      placeholder="2026"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "degree_certificate_year",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Additional Certifications"
                      type="textarea"
                      rows={4}
                      value={
                        formData.additional_certifications ||
                        ""
                      }
                      placeholder="Separate values with commas"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "additional_certifications",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Language Skills"
                      type="textarea"
                      rows={3}
                      value={
                        formData.language_skills ||
                        ""
                      }
                      placeholder="Tamil, English, Hindi"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "language_skills",
                          value
                        )
                      }
                    />

                    <ToggleField
                      label="Show qualification on public profile"
                      checked={
                        formData.qualification_public
                      }
                      onChange={(
                        checked
                      ) =>
                        updateField(
                          "qualification_public",
                          checked
                        )
                      }
                    />
                  </>
                )}

                {/* SKILLS */}

                {editingSection ===
                  "skills" && (
                  <>
                    <EditField
                      label="Skills"
                      type="textarea"
                      rows={4}
                      value={
                        formData.skills ||
                        ""
                      }
                      placeholder="Business Strategy, Consulting, Leadership"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "skills",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Interest Categories"
                      type="textarea"
                      rows={3}
                      value={
                        formData.interest_categories ||
                        ""
                      }
                      placeholder="Separate values with commas"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "interest_categories",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Hobbies"
                      type="textarea"
                      rows={3}
                      value={
                        formData.hobbies ||
                        ""
                      }
                      placeholder="Separate values with commas"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "hobbies",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Preferred Industry / Sector"
                      value={
                        formData.preferred_industry ||
                        ""
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "preferred_industry",
                          value
                        )
                      }
                    />
                  </>
                )}

                {/* CERTIFICATIONS */}

                {editingSection ===
                  "certifications" && (
                  <>
                    <EditField
                      label="Professional Certifications"
                      type="textarea"
                      rows={4}
                      value={
                        formData.professional_certifications ||
                        ""
                      }
                      placeholder="Separate values with commas"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "professional_certifications",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Additional Certifications"
                      type="textarea"
                      rows={4}
                      value={
                        formData.additional_certifications ||
                        ""
                      }
                      placeholder="Separate values with commas"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "additional_certifications",
                          value
                        )
                      }
                    />
                  </>
                )}

                {/* ACHIEVEMENTS */}

                {editingSection ===
                  "achievements" && (
                  <>
                    <EditField
                      label="Awards / Recognitions"
                      type="textarea"
                      rows={3}
                      value={
                        formData.awards_recognitions ||
                        ""
                      }
                      placeholder="Separate values with commas"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "awards_recognitions",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Publications / Published Work"
                      type="textarea"
                      rows={3}
                      value={
                        formData.publications ||
                        ""
                      }
                      placeholder="Separate values with commas"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "publications",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Key Milestones / Achievements"
                      type="textarea"
                      rows={3}
                      value={
                        formData.key_milestones ||
                        ""
                      }
                      placeholder="Separate values with commas"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "key_milestones",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Media Mentions / Press Coverage"
                      type="textarea"
                      rows={3}
                      value={
                        formData.media_mentions ||
                        ""
                      }
                      placeholder="Separate values with commas"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "media_mentions",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Testimonials / Reference Letters"
                      type="textarea"
                      rows={4}
                      value={
                        formData.reference_letters ||
                        ""
                      }
                      placeholder="Add short testimonials or public reference text"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "reference_letters",
                          value
                        )
                      }
                    />
                  </>
                )}

                {/* PORTFOLIO */}

                {editingSection ===
                  "portfolio" && (
                  <>
                    <EditField
                      label="Previous Employers / Clients"
                      type="textarea"
                      rows={4}
                      value={
                        formData.previous_employers_clients ||
                        ""
                      }
                      placeholder="Separate values with commas"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "previous_employers_clients",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Work Samples"
                      type="textarea"
                      rows={4}
                      value={
                        formData.work_samples ||
                        ""
                      }
                      placeholder="Add titles or URLs separated with commas"
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "work_samples",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Website / Portfolio URL"
                      value={
                        formData.portfolio_url ||
                        ""
                      }
                      placeholder="https://..."
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "portfolio_url",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Availability Status"
                      value={
                        formData.availability_status ||
                        ""
                      }
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "availability_status",
                          value
                        )
                      }
                    />
                  </>
                )}

                {/* MEDIA */}

{/* MEDIA */}

{editingSection ===
  "media" && (
  <>
    <div className="pro-edit-info-box">
      <i
        className="fas fa-circle-info"
        aria-hidden="true"
      />

      <span>
        Profile photo, cover photo, gallery photos and
        intro video can be uploaded directly.
      </span>
    </div>

    {/* PROFILE PHOTO */}

    <div className="pro-edit-field">
      <span>
        Profile Photo
      </span>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={saving}
        onChange={
          handleProfilePhotoUpload
        }
      />

      <small className="pro-edit-note">
        JPG, PNG or WEBP. Maximum 5 MB.
      </small>
    </div>

    {/* COVER PHOTO */}

    <div className="pro-edit-field">
      <span>
        Cover Photo
      </span>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={saving}
        onChange={handleCoverPhotoUpload}
      />

      <small className="pro-edit-note">
        JPG, PNG or WEBP. Maximum 5 MB.
      </small>
    </div>

    {/* GALLERY */}

    <div className="pro-edit-field">
      <span>
        Gallery Photos
      </span>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={saving}
        onChange={handleGalleryPhotoUpload}
      />

      <small className="pro-edit-note">
        Multiple JPG, PNG or WEBP images can be selected.
      </small>
    </div>

    {/* INTRO VIDEO */}

    <div className="pro-edit-field">
      <span>
        Intro Video
      </span>

      <input
        type="file"
        accept="video/mp4,video/webm"
        disabled={saving}
        onChange={handleIntroVideoUpload}
      />

      <small className="pro-edit-note">
        MP4 or WEBM. Maximum 50 MB.
      </small>
    </div>
  </>
)}
                {/* CONTACT */}

                {editingSection ===
                  "contact" && (
                  <>
                    <div className="pro-edit-info-box">
                      <i className="fas fa-lock" />
                      <span>
                        Phone number content is taken from the authenticated
                        private profile/KYC. இந்த page-ல் phone visibility மட்டும்
                        control பண்ணலாம்.
                      </span>
                    </div>

                    <ToggleField
                      label="Show phone number on public profile"
                      checked={
                        formData.phone_public
                      }
                      onChange={(
                        checked
                      ) =>
                        updateField(
                          "phone_public",
                          checked
                        )
                      }
                    />

                    <EditField
                      label="General Professional / Social Link"
                      value={
                        formData.social_link ||
                        ""
                      }
                      placeholder="https://..."
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "social_link",
                          value
                        )
                      }
                    />

                    <EditField
                      label="LinkedIn"
                      value={
                        formData.social_linkedin ||
                        ""
                      }
                      placeholder="https://linkedin.com/in/..."
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "social_linkedin",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Instagram"
                      value={
                        formData.social_instagram ||
                        ""
                      }
                      placeholder="https://instagram.com/..."
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "social_instagram",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Facebook"
                      value={
                        formData.social_facebook ||
                        ""
                      }
                      placeholder="https://facebook.com/..."
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "social_facebook",
                          value
                        )
                      }
                    />

                    <EditField
                      label="YouTube"
                      value={
                        formData.social_youtube ||
                        ""
                      }
                      placeholder="https://youtube.com/..."
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "social_youtube",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Twitter / X"
                      value={
                        formData.social_twitter ||
                        ""
                      }
                      placeholder="https://x.com/..."
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "social_twitter",
                          value
                        )
                      }
                    />

                    <EditField
                      label="Website / Portfolio URL"
                      value={
                        formData.portfolio_url ||
                        ""
                      }
                      placeholder="https://..."
                      onChange={(
                        value
                      ) =>
                        updateField(
                          "portfolio_url",
                          value
                        )
                      }
                    />
                  </>
                )}

                {/* PRIVACY */}

                {editingSection ===
                  "privacy" && (
                  <>
                    <ToggleField
                      label="Show phone number"
                      checked={
                        formData.phone_public
                      }
                      onChange={(
                        checked
                      ) =>
                        updateField(
                          "phone_public",
                          checked
                        )
                      }
                    />

                    <ToggleField
                      label="Show qualification"
                      checked={
                        formData.qualification_public
                      }
                      onChange={(
                        checked
                      ) =>
                        updateField(
                          "qualification_public",
                          checked
                        )
                      }
                    />

                    <ToggleField
                      label="Show hourly / project rate"
                      checked={
                        formData.hourly_project_rate_public
                      }
                      onChange={(
                        checked
                      ) =>
                        updateField(
                          "hourly_project_rate_public",
                          checked
                        )
                      }
                    />

                    <div className="pro-privacy-editor">
                      <h3>
                        Public Sections
                      </h3>

                      <p>
                        Select which profile sections may be included in the
                        public QR profile. Backend privacy rules still override
                        these options for sensitive data.
                      </p>

                      {PRIVACY_SECTIONS.map(
                        (
                          item
                        ) => (
                          <ToggleField
                            key={
                              item.value
                            }
                            label={
                              item.label
                            }
                            checked={list(
                              formData.public_profile_sections
                            ).includes(
                              item.value
                            )}
                            onChange={(
                              checked
                            ) =>
                              togglePublicSection(
                                item.value,
                                checked
                              )
                            }
                          />
                        )
                      )}
                    </div>

                    <div className="pro-edit-info-box">
                      <i className="fas fa-shield-halved" />
                      <span>
                        Aadhaar, PAN, DOB, bank account, nominee, private
                        address, Resume/CV and KYC document files do not get
                        public visibility controls here.
                      </span>
                    </div>
                  </>
                )}

                {saveError && (
                  <div className="pro-edit-error">
                    <i
                      className="fas fa-circle-exclamation"
                      aria-hidden="true"
                    />

                    {
                      saveError
                    }
                  </div>
                )}
              </div>

              <div className="pro-edit-modal-footer">
                <button
                  type="button"
                  className="pro-edit-cancel"
                  onClick={
                    closeEditor
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="pro-edit-save"
                  onClick={
                    handleSave
                  }
                  disabled={
                    saving
                  }
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i
                        className="fas fa-floppy-disk"
                        aria-hidden="true"
                      />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
        )}
    </main>
  );
}
