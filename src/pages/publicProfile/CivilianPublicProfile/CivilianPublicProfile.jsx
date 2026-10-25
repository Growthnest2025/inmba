import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../../api/api";

import {
  createPublicAssetUrl,
  createPublicProfilePhotoUrl,
  getPublicProfile,
} from "../../../services/publicProfile.service";

import {
  updateMyProfile,
  uploadOwnProfilePhoto,
} from "../../../services/profile.service";

import "./CivilianPublicProfile.css";

/* =========================================================
   HELPERS
========================================================= */

const text = (
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

const firstValue = (
  ...values
) => {
  for (
    const value of
    values
  ) {
    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !==
        ""
    ) {
      return value;
    }
  }

  return "";
};

const bool = (
  value
) => {
  if (
    value === true ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  return [
    "true",
    "yes",
    "approved",
    "active",
    "verified",
  ].includes(
    text(value)
      .toLowerCase()
  );
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
        (item) =>
          text(item)
      )
      .filter(Boolean);
  }

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  const raw =
    String(value).trim();

  if (!raw) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(raw);

    if (
      Array.isArray(
        parsed
      )
    ) {
      return parsed
        .map(
          (item) =>
            text(item)
        )
        .filter(Boolean);
    }
  } catch {
    // Normal text.
  }

  return raw
    .split(
      /[,|\n]/
    )
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean);
};

const listToText = (
  value
) =>
  list(value).join(", ");

const safeUrl = (
  value
) => {
  const url =
    text(value);

  if (!url) {
    return "";
  }

  if (
    /^(https?:\/\/|blob:|data:)/i.test(
      url
    )
  ) {
    return url;
  }

  return `https://${url}`;
};

const normalizeUrlForSave = (
  value
) => {
  const raw =
    text(value);

  if (!raw) {
    return "";
  }

  if (
    raw.startsWith(
      "/uploads/"
    ) ||
    raw.startsWith(
      "uploads/"
    )
  ) {
    return raw;
  }

  if (
    /^https?:\/\//i.test(
      raw
    )
  ) {
    return raw;
  }

  if (
    raw.startsWith(
      "www."
    ) ||
    /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(
      raw
    )
  ) {
    return `https://${raw}`;
  }

  return "";
};

const assetUrl = (
  value
) => {
  const raw =
    text(value);

  if (!raw) {
    return "";
  }

  if (
    /^(https?:\/\/|blob:|data:)/i.test(
      raw
    )
  ) {
    return raw;
  }

  return createPublicAssetUrl(
    raw
  );
};

const photoUrl = (
  profile
) => {
  const raw =
    text(
      firstValue(
        profile?.profile_image_url,
        profile?.profile_pic_url,
        profile?.profile_photo_url,
        profile?.profile_pic,
        profile?.profile_photo,
        profile?.photo_url
      )
    );

  if (!raw) {
    return "";
  }

  if (
    /^(https?:\/\/|blob:|data:)/i.test(
      raw
    )
  ) {
    return raw;
  }

  return createPublicProfilePhotoUrl(
    raw
  );
};

const normalizePublic = (
  response
) => {
  const root =
    response?.data ??
    response ??
    {};

  return (
    root?.profile ||
    root?.member ||
    root?.user ||
    root?.public_profile ||
    root?.data?.profile ||
    root?.data?.member ||
    root?.data?.user ||
    root?.data?.public_profile ||
    root?.data ||
    root
  );
};

const getBaseName = (
  profile
) => {
  return text(
    firstValue(
      profile?.display_name,

      `${text(
        profile?.first_name
      )} ${text(
        profile?.last_name
      )}`.trim()
    ),
    "Civilian Member"
  );
};

const getDisplayName = (
  profile
) => {
  const salutation =
    text(
      profile?.salutation
    );

  const name =
    getBaseName(
      profile
    );

  return [
    salutation,
    name,
  ]
    .filter(Boolean)
    .join(" ");
};

const getDegree = (
  profile
) => {
  return text(
    firstValue(
      profile
        ?.educational_qualification,
      profile?.ug_degree,
      profile?.pg_degree,
      profile?.education
    )
  );
};

const getUsername = (
  profile
) => {
  return text(
    firstValue(
      profile?.username,
      profile?.user_name,
      profile?.public_username,
      profile?.handle
    )
  );
};

const initials = (
  profile
) => {
  return getBaseName(
    profile
  )
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase()
    )
    .join("");
};

const formatDate = (
  value
) => {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      month: "short",
      year: "numeric",
    }
  );
};


const DEFAULT_PUBLIC_FIELDS = [
  "profile_photo",
  "location",
  "phone",
  "rank",
  "education",
  "achievements",
  "skills",
  "bio",
  "social",
  "media",
  "website",
];

/* =========================================================
   SMALL UI
========================================================= */

function Empty({
  textValue =
    "Not added yet",
}) {
  return (
    <span className="civ-empty">
      {textValue}
    </span>
  );
}

function Tags({
  value,
}) {
  const items =
    list(value);

  if (!items.length) {
    return <Empty />;
  }

  return (
    <div className="civ-tags">
      {items.map(
        (
          item,
          index
        ) => (
          <span
            key={`${item}-${index}`}
          >
            {item}
          </span>
        )
      )}
    </div>
  );
}

function EditButton({
  onClick,
  label = "Edit",
}) {
  return (
    <button
      type="button"
      className="civ-edit-button"
      onClick={onClick}
    >
      <i className="fas fa-pen" />

      {label}
    </button>
  );
}

function Card({
  icon,
  title,
  owner = false,
  onEdit,
  children,
}) {
  const [
    opened,
    setOpened,
  ] =
    useState(
      title === "About Me"
    );

  return (
    <section
      className={`civ-card civ-pro-section ${
        opened
          ? "civ-pro-section-open"
          : ""
      }`}
    >
      <button
        type="button"
        className="civ-pro-section-header"
        onClick={() =>
          setOpened(
            (current) =>
              !current
          )
        }
        aria-expanded={
          opened
        }
      >
        <span className="civ-pro-section-icon">
          <i
            className={icon}
          />
        </span>

        <span className="civ-pro-section-heading">
          <strong>
            {title}
          </strong>

          <small>
            View profile details
          </small>
        </span>

        <span className="civ-pro-section-actions">
          {owner &&
            onEdit && (
              <span
                role="button"
                tabIndex={0}
                className="civ-pro-inline-edit"
                onClick={(
                  event
                ) => {
                  event.stopPropagation();
                  onEdit();
                }}
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                      "Enter" ||
                    event.key ===
                      " "
                  ) {
                    event.preventDefault();
                    event.stopPropagation();
                    onEdit();
                  }
                }}
              >
                <i className="fas fa-pen" />
                Edit
              </span>
            )}

          <i
            className={`fas fa-chevron-down civ-pro-section-arrow ${
              opened
                ? "is-open"
                : ""
            }`}
          />
        </span>
      </button>

      {opened && (
        <div className="civ-card-body civ-pro-section-content">
          {children}
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea = false,
  placeholder = "",
}) {
  return (
    <label className="civ-field">
      <span>
        {label}
      </span>

      {textarea ? (
        <textarea
          value={
            value ?? ""
          }
          placeholder={
            placeholder
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
        />
      ) : (
        <input
          value={
            value ?? ""
          }
          placeholder={
            placeholder
          }
          onChange={(
            event
          ) =>
            onChange(
              event.target.value
            )
          }
        />
      )}
    </label>
  );
}

function InfoRow({
  label,
  value,
}) {
  return (
    <div className="civ-private-row">
      <span>
        {label}
      </span>

      <strong>
        {text(
          value,
          "Not available"
        )}
      </strong>
    </div>
  );
}

/* =========================================================
   EDIT MODAL
========================================================= */

function EditModal({
  section,
  data,
  setData,
  saving,
  error,
  onSave,
  onClose,
}) {
  const change = (
    field,
    value
  ) => {
    setData(
      (
        current
      ) => ({
        ...current,

        [field]:
          value,
      })
    );
  };

  return (
    <div
      className="civ-modal-overlay"
      onMouseDown={
        onClose
      }
    >
      <section
        className="civ-modal"
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        <div className="civ-modal-header">
          <div>
            <small>
              CIVILIAN PUBLIC PROFILE
            </small>

            <h2>
              Edit Profile
            </h2>
          </div>

          <button
            type="button"
            className="civ-modal-close"
            onClick={
              onClose
            }
          >
            <i className="fas fa-xmark" />
          </button>
        </div>

        <div className="civ-modal-content">

          {/* OVERVIEW */}

          {section ===
            "overview" && (
            <>
              <label className="civ-field">
                <span>
                  Salutation
                </span>

                <select
                  value={
                    data.salutation ||
                    ""
                  }
                  onChange={(
                    event
                  ) =>
                    change(
                      "salutation",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Select
                  </option>

                  <option value="Mr">
                    Mr
                  </option>

                  <option value="Mrs">
                    Mrs
                  </option>

                  <option value="Ms">
                    Ms
                  </option>

                  <option value="Dr">
                    Dr
                  </option>
                </select>
              </label>

              <Field
                label="Display Name"
                value={
                  data.display_name
                }
                onChange={(
                  value
                ) =>
                  change(
                    "display_name",
                    value
                  )
                }
              />

              <Field
                label="Preferred Industry"
                value={
                  data.preferred_industry
                }
                onChange={(
                  value
                ) =>
                  change(
                    "preferred_industry",
                    value
                  )
                }
              />

              <div className="civ-form-grid">
                <Field
                  label="City"
                  value={
                    data.city
                  }
                  onChange={(
                    value
                  ) =>
                    change(
                      "city",
                      value
                    )
                  }
                />

                <Field
                  label="District"
                  value={
                    data.district
                  }
                  onChange={(
                    value
                  ) =>
                    change(
                      "district",
                      value
                    )
                  }
                />

                <Field
                  label="State"
                  value={
                    data.state
                  }
                  onChange={(
                    value
                  ) =>
                    change(
                      "state",
                      value
                    )
                  }
                />

                <Field
                  label="Pincode"
                  value={
                    data.pincode
                  }
                  onChange={(
                    value
                  ) =>
                    change(
                      "pincode",
                      value
                    )
                  }
                />
              </div>
            </>
          )}

          {/* ABOUT */}

          {section ===
            "about" && (
            <Field
              label="About Me / Bio"
              textarea
              value={
                data.bio
              }
              onChange={(
                value
              ) =>
                change(
                  "bio",
                  value
                )
              }
            />
          )}

          {/* EDUCATION */}

          {section ===
            "education" && (
            <>
              <Field
                label="Highest Qualification"
                value={
                  data
                    .educational_qualification
                }
                onChange={(
                  value
                ) =>
                  change(
                    "educational_qualification",
                    value
                  )
                }
              />

              <Field
                label="School / College"
                value={
                  data
                    .school_college_name
                }
                onChange={(
                  value
                ) =>
                  change(
                    "school_college_name",
                    value
                  )
                }
              />

              <Field
                label="Additional Diploma / Certifications"
                textarea
                placeholder="Separate multiple values using comma"
                value={
                  data
                    .additional_certifications
                }
                onChange={(
                  value
                ) =>
                  change(
                    "additional_certifications",
                    value
                  )
                }
              />

              <Field
                label="Languages"
                value={
                  data
                    .language_skills
                }
                placeholder="Tamil, English"
                onChange={(
                  value
                ) =>
                  change(
                    "language_skills",
                    value
                  )
                }
              />
            </>
          )}

          {/* ACHIEVEMENTS */}

          {section ===
            "achievements" && (
            <>
              <Field
                label="Awards & Recognitions"
                textarea
                value={
                  data
                    .awards_recognitions
                }
                onChange={(
                  value
                ) =>
                  change(
                    "awards_recognitions",
                    value
                  )
                }
              />

              <Field
                label="Publications"
                textarea
                value={
                  data.publications
                }
                onChange={(
                  value
                ) =>
                  change(
                    "publications",
                    value
                  )
                }
              />

              <Field
                label="Professional Certifications"
                textarea
                value={
                  data
                    .professional_certifications
                }
                onChange={(
                  value
                ) =>
                  change(
                    "professional_certifications",
                    value
                  )
                }
              />

              <Field
                label="Key Milestones"
                textarea
                value={
                  data
                    .key_milestones
                }
                onChange={(
                  value
                ) =>
                  change(
                    "key_milestones",
                    value
                  )
                }
              />

              <Field
                label="Media Mentions / Press Coverage"
                textarea
                value={
                  data
                    .media_mentions
                }
                onChange={(
                  value
                ) =>
                  change(
                    "media_mentions",
                    value
                  )
                }
              />

              <Field
                label="Testimonials / Reference Letters"
                textarea
                value={
                  data
                    .reference_letters
                }
                onChange={(
                  value
                ) =>
                  change(
                    "reference_letters",
                    value
                  )
                }
              />
            </>
          )}

          {/* SKILLS */}

          {section ===
            "skills" && (
            <>
              <Field
                label="Skills"
                value={
                  data.skills
                }
                placeholder="Skill 1, Skill 2"
                onChange={(
                  value
                ) =>
                  change(
                    "skills",
                    value
                  )
                }
              />

              <Field
                label="Interests"
                value={
                  data
                    .interest_categories
                }
                onChange={(
                  value
                ) =>
                  change(
                    "interest_categories",
                    value
                  )
                }
              />

              <Field
                label="Hobbies"
                value={
                  data.hobbies
                }
                onChange={(
                  value
                ) =>
                  change(
                    "hobbies",
                    value
                  )
                }
              />

              <Field
                label="Preferred Industry"
                value={
                  data
                    .preferred_industry
                }
                onChange={(
                  value
                ) =>
                  change(
                    "preferred_industry",
                    value
                  )
                }
              />
            </>
          )}

          {/* SOCIAL */}

          {section ===
            "social" && (
            <>
              <Field
                label="Website / Portfolio"
                value={
                  data.portfolio_url
                }
                placeholder="https://example.com"
                onChange={(
                  value
                ) =>
                  change(
                    "portfolio_url",
                    value
                  )
                }
              />

              <Field
                label="General Social Link"
                value={
                  data.social_link
                }
                placeholder="https://..."
                onChange={(
                  value
                ) =>
                  change(
                    "social_link",
                    value
                  )
                }
              />

              <Field
                label="LinkedIn"
                value={
                  data.social_linkedin
                }
                placeholder="https://linkedin.com/in/..."
                onChange={(
                  value
                ) =>
                  change(
                    "social_linkedin",
                    value
                  )
                }
              />

              <Field
                label="Instagram"
                value={
                  data.social_instagram
                }
                placeholder="https://instagram.com/..."
                onChange={(
                  value
                ) =>
                  change(
                    "social_instagram",
                    value
                  )
                }
              />

              <Field
                label="Facebook"
                value={
                  data.social_facebook
                }
                placeholder="https://facebook.com/..."
                onChange={(
                  value
                ) =>
                  change(
                    "social_facebook",
                    value
                  )
                }
              />

              <Field
                label="X / Twitter"
                value={
                  data.social_twitter
                }
                placeholder="https://x.com/..."
                onChange={(
                  value
                ) =>
                  change(
                    "social_twitter",
                    value
                  )
                }
              />

              <Field
                label="YouTube"
                value={
                  data.social_youtube
                }
                placeholder="https://youtube.com/..."
                onChange={(
                  value
                ) =>
                  change(
                    "social_youtube",
                    value
                  )
                }
              />
            </>
          )}

          {/* MEDIA */}

          {section ===
            "media" && (
            <>
              <Field
                label="Cover Photo URL / Path"
                value={
                  data.cover_photo
                }
                onChange={(
                  value
                ) =>
                  change(
                    "cover_photo",
                    value
                  )
                }
              />

              <Field
                label="Gallery Photos"
                textarea
                placeholder="https://image1..., https://image2..."
                value={
                  data.gallery_photos
                }
                onChange={(
                  value
                ) =>
                  change(
                    "gallery_photos",
                    value
                  )
                }
              />

              <Field
                label="Intro Video URL / Path"
                value={
                  data.intro_video
                }
                onChange={(
                  value
                ) =>
                  change(
                    "intro_video",
                    value
                  )
                }
              />
            </>
          )}

          {/* CONTACT */}

          {section ===
            "contact" && (
            <>
              <label className="civ-toggle-box">
                <div>
                  <strong>
                    Show Primary Mobile
                  </strong>

                  <small>
                    Enable this only if you want your primary mobile number visible publicly.
                  </small>
                </div>

                <input
                  type="checkbox"
                  checked={
                    Boolean(
                      data.phone_public
                    )
                  }
                  onChange={(
                    event
                  ) =>
                    change(
                      "phone_public",
                      event.target.checked
                    )
                  }
                />
              </label>

              <div className="civ-form-grid">
                <Field
                  label="District"
                  value={
                    data.district
                  }
                  onChange={(
                    value
                  ) =>
                    change(
                      "district",
                      value
                    )
                  }
                />

                <Field
                  label="State"
                  value={
                    data.state
                  }
                  onChange={(
                    value
                  ) =>
                    change(
                      "state",
                      value
                    )
                  }
                />

                <Field
                  label="Pincode"
                  value={
                    data.pincode
                  }
                  onChange={(
                    value
                  ) =>
                    change(
                      "pincode",
                      value
                    )
                  }
                />
              </div>
            </>
          )}


          {/* VISIBILITY */}

          {section ===
            "visibility" && (
            <div className="civ-visibility-list">
              {[
                ["profile_photo", "Profile Picture"],
                ["location", "Location"],
                ["phone", "Mobile Number"],
                ["rank", "Network Rank"],
                ["education", "Education"],
                ["achievements", "Achievements"],
                ["skills", "Skills, Interests & Hobbies"],
                ["bio", "About Me"],
                ["social", "Social Links"],
                ["media", "Gallery / Media"],
                ["website", "Website / Portfolio"],
              ].map(
                ([key, label]) => {
                  const current =
                    Array.isArray(
                      data.public_profile_fields
                    ) &&
                    data.public_profile_fields.length
                      ? data.public_profile_fields
                      : DEFAULT_PUBLIC_FIELDS;

                  const checked =
                    current.includes(
                      key
                    );

                  return (
                    <label
                      key={key}
                      className="civ-visibility-item"
                    >
                      <div>
                        <strong>
                          {label}
                        </strong>

                        <small>
                          {checked
                            ? "Visible on public profile"
                            : "Private"}
                        </small>
                      </div>

                      <input
                        type="checkbox"
                        checked={
                          checked
                        }
                        onChange={(
                          event
                        ) => {
                          const next =
                            event.target
                              .checked
                              ? [
                                  ...new Set([
                                    ...current,
                                    key,
                                  ]),
                                ]
                              : current.filter(
                                  (
                                    item
                                  ) =>
                                    item !==
                                    key
                                );

                          change(
                            "public_profile_fields",
                            next
                          );
                        }}
                      />
                    </label>
                  );
                }
              )}
            </div>
          )}

          {/* PRIVATE OWNER DETAILS */}

          {section ===
            "private" && (
            <>
              <div className="civ-private-edit-note">
                <i className="fas fa-lock" />

                <div>
                  <strong>
                    Owner-only private details
                  </strong>

                  <small>
                    These details are never shown on the public profile.
                    KYC document numbers/scans and bank verification fields
                    remain protected and should be managed through the KYC flow.
                  </small>
                </div>
              </div>

              <h3 className="civ-form-section-title">
                Personal
              </h3>

              <div className="civ-form-grid">
                <Field
                  label="First Name"
                  value={data.first_name}
                  onChange={(value) =>
                    change(
                      "first_name",
                      value
                    )
                  }
                />

                <Field
                  label="Last Name"
                  value={data.last_name}
                  onChange={(value) =>
                    change(
                      "last_name",
                      value
                    )
                  }
                />

                <Field
                  label="Father / Spouse Name"
                  value={data.father_name}
                  onChange={(value) =>
                    change(
                      "father_name",
                      value
                    )
                  }
                />

                <Field
                  label="Date of Birth"
                  value={data.dob}
                  onChange={(value) =>
                    change(
                      "dob",
                      value
                    )
                  }
                />

                <Field
                  label="Gender"
                  value={data.gender}
                  onChange={(value) =>
                    change(
                      "gender",
                      value
                    )
                  }
                />

                <Field
                  label="Marital Status"
                  value={data.marital_status}
                  onChange={(value) =>
                    change(
                      "marital_status",
                      value
                    )
                  }
                />

                <Field
                  label="Nationality"
                  value={data.nationality}
                  onChange={(value) =>
                    change(
                      "nationality",
                      value
                    )
                  }
                />
              </div>

              <h3 className="civ-form-section-title">
                Contact
              </h3>

              <div className="civ-form-grid">
                <Field
                  label="Email"
                  value={data.email}
                  onChange={(value) =>
                    change(
                      "email",
                      value
                    )
                  }
                />

                <Field
                  label="Primary Mobile"
                  value={data.phone}
                  onChange={(value) =>
                    change(
                      "phone",
                      value
                    )
                  }
                />

                <Field
                  label="Secondary Mobile"
                  value={data.secondary_mobile}
                  onChange={(value) =>
                    change(
                      "secondary_mobile",
                      value
                    )
                  }
                />

                <Field
                  label="WhatsApp Number"
                  value={data.whatsapp_number}
                  onChange={(value) =>
                    change(
                      "whatsapp_number",
                      value
                    )
                  }
                />
              </div>

              <h3 className="civ-form-section-title">
                Address
              </h3>

              <Field
                label="Current Address"
                textarea
                value={data.address}
                onChange={(value) =>
                  change(
                    "address",
                    value
                  )
                }
              />

              <div className="civ-form-grid">
                <Field
                  label="City"
                  value={data.city}
                  onChange={(value) =>
                    change(
                      "city",
                      value
                    )
                  }
                />

                <Field
                  label="District"
                  value={data.district}
                  onChange={(value) =>
                    change(
                      "district",
                      value
                    )
                  }
                />

                <Field
                  label="State"
                  value={data.state}
                  onChange={(value) =>
                    change(
                      "state",
                      value
                    )
                  }
                />

                <Field
                  label="Pincode"
                  value={data.pincode}
                  onChange={(value) =>
                    change(
                      "pincode",
                      value
                    )
                  }
                />

                <Field
                  label="Country"
                  value={data.country}
                  onChange={(value) =>
                    change(
                      "country",
                      value
                    )
                  }
                />
              </div>

              <h3 className="civ-form-section-title">
                Nominee
              </h3>

              <div className="civ-form-grid">
                <Field
                  label="Nominee Name"
                  value={data.nomini_name}
                  onChange={(value) =>
                    change(
                      "nomini_name",
                      value
                    )
                  }
                />

                <Field
                  label="Nominee DOB"
                  value={data.nomini_dob}
                  onChange={(value) =>
                    change(
                      "nomini_dob",
                      value
                    )
                  }
                />

                <Field
                  label="Nominee Relationship"
                  value={data.nomini_relationship}
                  onChange={(value) =>
                    change(
                      "nomini_relationship",
                      value
                    )
                  }
                />

                <Field
                  label="Nominee Aadhaar / ID"
                  value={data.nomini_aadhar}
                  onChange={(value) =>
                    change(
                      "nomini_aadhar",
                      value
                    )
                  }
                />
              </div>
            </>
          )}

          {error && (
            <div className="civ-modal-error">
              {error}
            </div>
          )}
        </div>

        <div className="civ-modal-footer">
          <button
            type="button"
            className="civ-button-light"
            disabled={
              saving
            }
            onClick={
              onClose
            }
          >
            Cancel
          </button>

          <button
            type="button"
            className="civ-button-green"
            disabled={
              saving
            }
            onClick={
              onSave
            }
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin" />

                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-check" />

                Save Changes
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function CivilianPublicProfile({
  publicViewOnly = false,
  ownerProfile = null,
  onOwnerProfileReload,
  onOwnerProfileChange,
}) {
  const navigate =
    useNavigate();

  const profilePhotoInputRef =
    useRef(null);

  const {
    loginId:
      routeLoginId,
  } =
    useParams();

  const isOwner =
    !publicViewOnly;

  const [
    profile,
    setProfile,
  ] =
    useState(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    editing,
    setEditing,
  ] =
    useState("");

  const [
    formData,
    setFormData,
  ] =
    useState({});

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    saveError,
    setSaveError,
  ] =
    useState("");

  /* =========================================================
     LOAD FULL CIVILIAN PROFILE
  ========================================================= */

  const loadProfile =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          let result =
            {};

          /* =========================
             PUBLIC VISITOR
          ========================= */

          if (
            publicViewOnly
          ) {
            if (
              !routeLoginId
            ) {
              throw new Error(
                "Login ID is required."
              );
            }

            const publicResponse =
              await getPublicProfile(
                routeLoginId
              );

            result =
              normalizePublic(
                publicResponse
              ) || {};
          }

          /* =========================
             OWNER
          ========================= */

          else {
            /*
              OWNER MODE

              Full authenticated Civilian data is loaded by
              CivilianPublicProfileOwner.jsx from:

              GET /api/me/civilian-profile

              Do not call /api/me here.
              Do not merge public profile over owner/private data.
            */

            if (
              ownerProfile &&
              typeof ownerProfile ===
                "object"
            ) {
              result = {
                ...ownerProfile,

                profile_type:
                  "civilian",

                is_owner:
                  true,

                can_edit:
                  true,
              };
            } else {
              throw new Error(
                "Civilian owner profile data is unavailable."
              );
            }
          }

          if (
            !result ||
            typeof result !==
              "object"
          ) {
            throw new Error(
              "Profile not found."
            );
          }

          setProfile(
            result
          );
        } catch (
          requestError
        ) {
          console.error(
            "Civilian profile load error:",
            requestError
          );

          setError(
            requestError
              ?.response
              ?.data
              ?.message ||
              requestError
                ?.response
                ?.data
                ?.error ||
              requestError
                ?.message ||
              "Unable to load profile."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        publicViewOnly,
        routeLoginId,
        ownerProfile,
      ]
    );

  /* =========================================================
     IMPORTANT — LOAD ON PAGE OPEN
  ========================================================= */

  useEffect(
    () => {
      loadProfile();
    },
    [
      loadProfile,
    ]
  );

  /* =========================================================
     EDIT
  ========================================================= */

  const openEdit = (
    section
  ) => {
    if (
      !isOwner
    ) {
      return;
    }

    setSaveError(
      ""
    );

    setFormData({
      ...profile,

      salutation:
        text(
          profile?.salutation
        ),

      display_name:
        text(
          profile?.display_name
        ),

      city:
        text(
          profile?.city
        ),

      district:
        text(
          profile?.district
        ),

      state:
        text(
          profile?.state
        ),

      pincode:
        text(
          profile?.pincode
        ),

      preferred_industry:
        text(
          profile
            ?.preferred_industry
        ),

      bio:
        text(
          profile?.bio
        ),

      educational_qualification:
        text(
          firstValue(
            profile
              ?.educational_qualification,
            profile?.education
          )
        ),

      school_college_name:
        text(
          profile
            ?.school_college_name
        ),

      additional_certifications:
        listToText(
          profile
            ?.additional_certifications
        ),

      language_skills:
        listToText(
          profile
            ?.language_skills
        ),

      awards_recognitions:
        listToText(
          profile
            ?.awards_recognitions
        ),

      publications:
        listToText(
          profile
            ?.publications
        ),

      professional_certifications:
        listToText(
          profile
            ?.professional_certifications
        ),

      key_milestones:
        listToText(
          profile
            ?.key_milestones
        ),

      media_mentions:
        listToText(
          profile
            ?.media_mentions
        ),

      reference_letters:
        listToText(
          profile
            ?.reference_letters
        ),

      skills:
        listToText(
          profile?.skills
        ),

      interest_categories:
        listToText(
          profile
            ?.interest_categories
        ),

      hobbies:
        listToText(
          profile?.hobbies
        ),

      first_name:
        text(
          profile?.first_name
        ),

      last_name:
        text(
          profile?.last_name
        ),

      father_name:
        text(
          firstValue(
            profile?.father_name,
            profile?.father_spouse_name
          )
        ),

      dob:
        text(
          firstValue(
            profile?.dob,
            profile?.date_of_birth
          )
        ),

      gender:
        text(
          profile?.gender
        ),

      marital_status:
        text(
          profile?.marital_status
        ),

      nationality:
        text(
          profile?.nationality
        ),

      email:
        text(
          profile?.email
        ),

      phone:
        text(
          firstValue(
            profile?.phone,
            profile?.contact_number,
            profile?.primary_mobile
          )
        ),

      secondary_mobile:
        text(
          profile?.secondary_mobile
        ),

      whatsapp_number:
        text(
          profile?.whatsapp_number
        ),

      address:
        text(
          firstValue(
            profile?.address,
            profile?.current_address
          )
        ),

      country:
        text(
          profile?.country
        ),

      nomini_name:
        text(
          firstValue(
            profile?.nomini_name,
            profile?.nominee_name
          )
        ),

      nomini_dob:
        text(
          profile?.nomini_dob
        ),

      nomini_relationship:
        text(
          firstValue(
            profile?.nomini_relationship,
            profile?.nominee_relationship
          )
        ),

      nomini_aadhar:
        text(
          firstValue(
            profile?.nomini_aadhar,
            profile?.nominee_aadhar
          )
        ),

      gallery_photos:
        listToText(
          profile
            ?.gallery_photos
        ),

      phone_public:
        bool(
          profile
            ?.phone_public
        ),

      portfolio_url:
        text(
          profile
            ?.portfolio_url
        ),

      social_link:
        text(
          profile
            ?.social_link
        ),

      social_linkedin:
        text(
          profile
            ?.social_linkedin
        ),

      social_instagram:
        text(
          profile
            ?.social_instagram
        ),

      social_facebook:
        text(
          profile
            ?.social_facebook
        ),

      social_twitter:
        text(
          profile
            ?.social_twitter
        ),

      social_youtube:
        text(
          profile
            ?.social_youtube
        ),

      cover_photo:
        text(
          profile
            ?.cover_photo
        ),

      intro_video:
        text(
          profile
            ?.intro_video
        ),

      public_profile_fields:
        Array.isArray(
          profile
            ?.public_profile_fields
        ) &&
        profile.public_profile_fields.length
          ? profile.public_profile_fields
          : DEFAULT_PUBLIC_FIELDS,
    });

    setEditing(
      section
    );
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const saveEdit =
    async () => {
      const fields = {
        overview: [
          "salutation",
          "display_name",
          "preferred_industry",
          "city",
          "district",
          "state",
          "pincode",
        ],

        about: [
          "bio",
        ],

        education: [
          "educational_qualification",
          "school_college_name",
          "additional_certifications",
          "language_skills",
        ],

        achievements: [
          "awards_recognitions",
          "publications",
          "professional_certifications",
          "key_milestones",
          "media_mentions",
          "reference_letters",
        ],

        skills: [
          "skills",
          "interest_categories",
          "hobbies",
          "preferred_industry",
        ],

        social: [
          "portfolio_url",
          "social_link",
          "social_linkedin",
          "social_instagram",
          "social_facebook",
          "social_twitter",
          "social_youtube",
        ],

        media: [
          "cover_photo",
          "gallery_photos",
          "intro_video",
        ],

        visibility: [
          "public_profile_fields",
        ],

        contact: [
          "phone_public",
          "district",
          "state",
          "pincode",
        ],

        private: [
          "first_name",
          "last_name",
          "father_name",
          "dob",
          "gender",
          "marital_status",
          "nationality",
          "email",
          "phone",
          "secondary_mobile",
          "whatsapp_number",
          "address",
          "city",
          "district",
          "state",
          "pincode",
          "country",
          "nomini_name",
          "nomini_dob",
          "nomini_relationship",
          "nomini_aadhar",
        ],


      };

      const arrayFields =
        new Set([
          "additional_certifications",
          "language_skills",

          "awards_recognitions",
          "publications",
          "professional_certifications",
          "key_milestones",
          "media_mentions",
          "reference_letters",

          "skills",
          "interest_categories",
          "hobbies",

          "gallery_photos",
          "public_profile_fields",
        ]);

      const booleanFields =
        new Set([
          "phone_public",
          "qualification_public",
        ]);

      const urlFields =
        new Set([
          "portfolio_url",
          "social_link",
          "social_linkedin",
          "social_instagram",
          "social_facebook",
          "social_twitter",
          "social_youtube",
          "cover_photo",
          "intro_video",
        ]);

      try {
        setSaving(
          true
        );

        setSaveError(
          ""
        );

        const payload =
          {};

        const currentFields =
          fields[
            editing
          ] || [];

        currentFields.forEach(
          (
            field
          ) => {
            const value =
              formData[
                field
              ];

            /* ARRAY */

            if (
              arrayFields.has(
                field
              )
            ) {
              if (
                field ===
                "gallery_photos"
              ) {
                payload[
                  field
                ] =
                  list(
                    value
                  )
                    .map(
                      normalizeUrlForSave
                    )
                    .filter(Boolean);
              } else {
                payload[
                  field
                ] =
                  list(
                    value
                  );
              }

              return;
            }

            /* BOOLEAN */

            if (
              booleanFields.has(
                field
              )
            ) {
              payload[
                field
              ] =
                bool(
                  value
                );

              return;
            }

            /* URL */

            if (
              urlFields.has(
                field
              )
            ) {
              payload[
                field
              ] =
                normalizeUrlForSave(
                  value
                );

              return;
            }

            /* NORMAL */

            payload[
              field
            ] =
              value === null ||
              value === undefined
                ? ""
                : String(
                    value
                  ).trim();
          }
        );

        if (
          Object.keys(
            payload
          ).length ===
          0
        ) {
          throw new Error(
            "No profile fields to save."
          );
        }

        if (
          editing ===
            "private"
        ) {
          const privateResult =
            await updateMyProfile(
              payload
            );

          setProfile(
            (
              current
            ) => ({
              ...current,
              ...payload,
            })
          );

          if (
            typeof onOwnerProfileChange ===
              "function"
          ) {
            onOwnerProfileChange(
              payload
            );
          }

          setEditing(
            ""
          );

          if (
            typeof onOwnerProfileReload ===
              "function"
          ) {
            try {
              await onOwnerProfileReload();
            } catch {
              // Keep local state if reload fails.
            }
          }

          return privateResult;
        }

        const response =
          await api.post(
            "/public/user/update",
            payload,
            {
              headers: {
                Accept:
                  "application/json",

                "Content-Type":
                  "application/json",

                "X-Requested-With":
                  "XMLHttpRequest",
              },
            }
          );

        const responseData =
          response
            ?.data ||
          {};

        if (
          responseData
            ?.success ===
          false
        ) {
          throw new Error(
            responseData
              ?.message ||
              responseData
                ?.error ||
              "Unable to save profile."
          );
        }

        const savedOwnerProfile =
          responseData
            ?.profile ||
          responseData
            ?.data
            ?.profile ||
          {};

        const savedPublicProfile =
          responseData
            ?.public_profile ||
          responseData
            ?.data
            ?.public_profile ||
          {};

        setProfile(
          (
            current
          ) => ({
            ...current,
            ...payload,
            ...savedOwnerProfile,
            ...savedPublicProfile,
          })
        );

        if (
          typeof onOwnerProfileChange ===
            "function"
        ) {
          onOwnerProfileChange({
            ...payload,
            ...savedOwnerProfile,
            ...savedPublicProfile,
          });
        }

        const loginId =
          text(
            firstValue(
              savedOwnerProfile
                ?.login_id,
              profile
                ?.login_id
            )
          );

        if (
          loginId
        ) {
          try {
            const publicResponse =
              await getPublicProfile(
                loginId
              );

            const refreshedPublicProfile =
              normalizePublic(
                publicResponse
              ) || {};

            setProfile(
              (
                current
              ) => ({
                ...current,
                ...payload,
                ...savedOwnerProfile,
                ...refreshedPublicProfile,

                id:
                  savedOwnerProfile
                    ?.id ??
                  current?.id,

                login_id:
                  savedOwnerProfile
                    ?.login_id ??
                  current
                    ?.login_id,

                membership_type:
                  savedOwnerProfile
                    ?.membership_type ??
                  current
                    ?.membership_type,

                email:
                  savedOwnerProfile
                    ?.email ??
                  current
                    ?.email,

                phone:
                  savedOwnerProfile
                    ?.phone ??
                  current
                    ?.phone,
              })
            );

            if (
              typeof onOwnerProfileChange ===
                "function"
            ) {
              onOwnerProfileChange({
                ...payload,
                ...savedOwnerProfile,
                ...refreshedPublicProfile,
              });
            }
          } catch (
            refreshError
          ) {
            console.error(
              "Civilian profile reload error:",
              refreshError
            );
          }
        }

        setEditing(
          ""
        );

        if (
          typeof onOwnerProfileReload ===
            "function"
        ) {
          try {
            await onOwnerProfileReload();
          } catch {
            // Local saved state is already available.
          }
        }
      } catch (
        requestError
      ) {
        console.error(
          "Civilian profile save error:",
          requestError
            ?.response
            ?.data ||
            requestError
        );

        setSaveError(
          requestError
            ?.response
            ?.data
            ?.message ||
          requestError
            ?.response
            ?.data
            ?.error ||
          requestError
            ?.message ||
          "Unable to save profile."
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =========================================================
     PROFILE PHOTO
  ========================================================= */

  const uploadPhoto =
    async (
      event
    ) => {
      const file =
        event.target
          .files?.[0];

      if (!file) {
        return;
      }

      if (
        ![
          "image/jpeg",
          "image/png",
          "image/webp",
        ].includes(
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

      if (
        file.size >
        5 *
          1024 *
          1024
      ) {
        setSaveError(
          "Profile photo must be below 5 MB."
        );

        event.target.value =
          "";

        return;
      }

      const localPreview =
        URL.createObjectURL(
          file
        );

      setProfile(
        (
          current
        ) => ({
          ...current,

          profile_image_url:
            localPreview,

          profile_pic_url:
            localPreview,
        })
      );

      try {
        setSaving(
          true
        );

        setSaveError(
          ""
        );

        const uploadResult =
          await uploadOwnProfilePhoto(
            file
          );

        const returnedPhoto =
          firstValue(
            uploadResult
              ?.photoUrl,
            uploadResult
              ?.photo_url,
            uploadResult
              ?.profile_pic_url,
            uploadResult
              ?.profile_image_url,
            uploadResult
              ?.profile_pic,
            uploadResult
              ?.data
              ?.photoUrl,
            uploadResult
              ?.data
              ?.photo_url,
            uploadResult
              ?.data
              ?.profile_pic_url,
            uploadResult
              ?.data
              ?.profile_image_url,
            uploadResult
              ?.data
              ?.profile_pic,
            uploadResult
              ?.raw
              ?.photo_url,
            uploadResult
              ?.raw
              ?.profile_pic_url,
            uploadResult
              ?.raw
              ?.profile_pic
          );

        if (
          returnedPhoto
        ) {
          setProfile(
            (
              current
            ) => ({
              ...current,

              profile_pic:
                returnedPhoto,

              profile_pic_url:
                returnedPhoto,

              profile_image_url:
                returnedPhoto,
            })
          );
        }

        if (
          typeof onOwnerProfileChange ===
            "function" &&
          returnedPhoto
        ) {
          onOwnerProfileChange({
            profile_pic:
              returnedPhoto,

            profile_pic_url:
              returnedPhoto,

            profile_image_url:
              returnedPhoto,
          });
        }

        if (
          typeof onOwnerProfileReload ===
            "function"
        ) {
          try {
            await onOwnerProfileReload();
          } catch {
            // Keep uploaded preview.
          }
        }
      } catch (
        requestError
      ) {
        console.error(
          "Profile photo upload error:",
          requestError
        );

        setSaveError(
          requestError
            ?.response
            ?.data
            ?.message ||
          requestError
            ?.message ||
          "Photo upload failed."
        );
      } finally {
        setSaving(
          false
        );

        event.target.value =
          "";
      }
    };

  /* =========================================================
     LOADING
  ========================================================= */

  if (
    loading
  ) {
    return (
      <div className="civ-state">
        <div className="civ-spinner" />

        <h2>
          Loading Profile
        </h2>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (
    error ||
    !profile
  ) {
    return (
      <div className="civ-state">
        <i className="fas fa-circle-exclamation" />

        <h2>
          Profile unavailable
        </h2>

        <p>
          {error ||
            "Unable to load profile."}
        </p>

        <button
          type="button"
          onClick={
            loadProfile
          }
        >
          Retry
        </button>
      </div>
    );
  }

  /* =========================================================
     VALUES
  ========================================================= */

  const p =
    profile;

  /* =======================================================
     PUBLIC VISIBILITY

     The previous component called isPublic(...) throughout
     the JSX without defining it, which caused a runtime
     ReferenceError. This helper supports both section names
     and the individual field names stored by the backend.
  ======================================================= */

  const configuredPublicFields =
    list(
      p.public_profile_fields
    );

  const publicFieldSet =
    new Set(
      configuredPublicFields.length
        ? configuredPublicFields
        : DEFAULT_PUBLIC_FIELDS
    );

  const publicFieldAliases = {
    profile_photo: [
      "profile_photo",
      "profile_image_url",
      "profile_pic",
      "profile_pic_url",
    ],

    location: [
      "location",
      "city",
      "district",
      "state",
      "pincode",
    ],

    rank: [
      "rank",
      "network",
      "network_level",
    ],

    phone: [
      "phone",
      "public_phone",
    ],

    social: [
      "social",
      "social_link",
      "social_linkedin",
      "social_instagram",
      "social_facebook",
      "social_twitter",
      "social_youtube",
      "portfolio_url",
    ],

    bio: [
      "bio",
      "professional_bio",
      "preferred_industry",
    ],

    education: [
      "education",
      "educational_qualification",
      "school_college_name",
      "additional_certifications",
      "language_skills",
    ],

    achievements: [
      "achievements",
      "awards_recognitions",
      "publications",
      "professional_certifications",
      "key_milestones",
      "media_mentions",
      "reference_letters",
    ],

    skills: [
      "skills",
      "interest_categories",
      "hobbies",
    ],

    media: [
      "media",
      "cover_photo",
      "gallery_photos",
      "intro_video",
    ],
  };

  const isPublic =
    (fieldName) => {
      if (isOwner) {
        return true;
      }

      const aliases =
        publicFieldAliases[
          fieldName
        ] || [fieldName];

      return aliases.some(
        (alias) =>
          publicFieldSet.has(
            alias
          )
      );
    };

  const displayName =
    getDisplayName(
      p
    );

  const degree =
    getDegree(
      p
    );

  const username =
    getUsername(
      p
    );

  const profilePhoto =
    photoUrl(
      p
    );

  const coverPhoto =
    assetUrl(
      firstValue(
        p.cover_photo,
        p.cover_photo_url
      )
    );

  const rank =
    text(
      firstValue(
        p.network_rank,
        p.network_level,
        p.rank
      ),
      "Civilian Member"
    );

  const location =
    [
      p.city,
      p.district,
      p.state,
      p.pincode,
    ]
      .filter(Boolean)
      .join(", ");

  const memberSince =
    formatDate(
      firstValue(
        p.member_since,
        p.created_at,
        p.joined_at
      )
    );

  const publicPhone =
    bool(
      p.phone_public
    )
      ? text(
          firstValue(
            p.public_phone,
            p.phone,
            p.mobile,
            p.primary_mobile
          )
        )
      : "";

  const gallery =
    list(
      p.gallery_photos
    )
      .map(
        assetUrl
      )
      .filter(Boolean);

  const introVideo =
    assetUrl(
      p.intro_video
    );

  const socialLinks =
    [
      {
        name:
          "LinkedIn",

        icon:
          "fab fa-linkedin-in",

        value:
          p.social_linkedin,
      },

      {
        name:
          "Instagram",

        icon:
          "fab fa-instagram",

        value:
          p.social_instagram,
      },

      {
        name:
          "Facebook",

        icon:
          "fab fa-facebook-f",

        value:
          p.social_facebook,
      },

      {
        name:
          "X",

        icon:
          "fab fa-x-twitter",

        value:
          p.social_twitter,
      },

      {
        name:
          "YouTube",

        icon:
          "fab fa-youtube",

        value:
          p.social_youtube,
      },
    ].filter(
      (
        item
      ) =>
        text(
          item.value
        )
    );

  const previewLoginId =
    text(
      firstValue(
        p.login_id,
        routeLoginId
      )
    );

  const isPro = Boolean(
    /professional/i.test(p?.membership_type || p?.membershipType || "") ||
    String(p?.login_id || p?.loginId || previewLoginId || routeLoginId || "").toUpperCase().startsWith("PRO")
  );

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="civ-page">
      <div className="civ-container">

        {/* OWNER BAR */}

        {isOwner && (
          <div className="civ-owner-toolbar">
            <div>
              <span>
                <i className="fas fa-lock" />

                Owner View
              </span>

              <small>
                Manage your {isPro ? "Professional" : "Civilian"} public profile
              </small>
            </div>

            <button
              type="button"
              onClick={() =>
                openEdit(
                  "visibility"
                )
              }
            >
              <i className="fas fa-eye-slash" />

              Privacy Settings
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  previewLoginId
                ) {
                  navigate(
                    `/public-profile/${encodeURIComponent(
                      previewLoginId
                    )}`
                  );
                }
              }}
            >
              <i className="fas fa-eye" />

              Preview Public View
            </button>
          </div>
        )}

        {/* HERO - Professional / Commercial style, Civilian fields unchanged */}

        <section className="civ-pro-hero">
          <div
            className="civ-pro-banner"
            style={
              coverPhoto
                ? {
                    backgroundImage:
                      `linear-gradient(
                        130deg,
                        rgba(15,77,15,.94) 0%,
                        rgba(44,138,44,.84) 55%,
                        rgba(72,168,72,.72) 100%
                      ),
                      url("${coverPhoto}")`,
                  }
                : isPro ? { background: "linear-gradient(130deg, #062759 0%, #0754b8 50%, #247af0 100%)" } : undefined
            }
          >
            <span />
            <span />
          </div>

          <div className="civ-pro-hero-body">
            <div className="civ-pro-avatar-wrap">
              <div className="civ-pro-avatar-ring">
                <div className="civ-pro-avatar">
                  {(isOwner ||
                    isPublic(
                      "profile_photo"
                    )) &&
                  profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt={displayName}
                    />
                  ) : (
                    <span>
                      {initials(p)}
                    </span>
                  )}
                </div>

                {isOwner && (
                  <>
                    <button
                      type="button"
                      className="civ-pro-camera-button"
                      onClick={() =>
                        profilePhotoInputRef
                          .current
                          ?.click()
                      }
                      disabled={saving}
                      aria-label="Edit profile picture"
                      title="Edit profile picture"
                    >
                      <i className="fas fa-camera" />
                    </button>

                    <input
                      ref={profilePhotoInputRef}
                      className="civ-pro-hidden-photo-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={uploadPhoto}
                    />
                  </>
                )}
              </div>

              <div className="civ-pro-avatar-side">
                <span
                  className="civ-pro-member-pill"
                  style={isPro ? { background: "#eff6ff", color: "#1d4ed8", borderColor: "#93c5fd" } : undefined}
                >
                  <span style={isPro ? { background: "#2563eb" } : undefined} />
                  {isPro ? "Professional Member" : "Civilian Member"}
                </span>
              </div>
            </div>

            <div className="civ-pro-title-row">
              <div>
                <h1 className="civ-pro-name">
                  {text(p.salutation) && (
                    <span className="civ-pro-salutation">
                      {text(p.salutation)}{" "}
                    </span>
                  )}

                  {getBaseName(p)}

                  {degree && (
                    <span className="civ-pro-degree">
                      , {degree}
                    </span>
                  )}
                </h1>

                {username && (
                  <div className="civ-pro-login">
                    {username.startsWith("@")
                      ? username
                      : `@${username}`}
                  </div>
                )}
              </div>

              {isOwner && (
                <EditButton
                  label="Edit Profile"
                  onClick={() =>
                    openEdit("overview")
                  }
                />
              )}
            </div>

            {text(
              p.preferred_industry
            ) && (
              <p className="civ-pro-bio">
                {text(
                  p.preferred_industry
                )}
              </p>
            )}

            <div className="civ-pro-chips">
              {location &&
                (isOwner ||
                  isPublic(
                    "location"
                  )) && (
                <span>
                  <i className="fas fa-location-dot" />
                  {location}
                </span>
              )}

              {memberSince && (
                <span>
                  <i className="far fa-calendar" />
                  Member Since {memberSince}
                </span>
              )}

              {isOwner && previewLoginId && (
                <span>
                  <i className="far fa-id-card" />
                  {previewLoginId}
                </span>
              )}
            </div>

            {isOwner && (
              <div className="civ-pro-owner-actions">
                <button
                  type="button"
                  className="civ-pro-media-button"
                  onClick={() =>
                    openEdit("media")
                  }
                >
                  <i className="fas fa-image" />
                  Edit Media
                </button>
              </div>
            )}
          </div>
        </section>

        {/* LAYOUT */}

        <div className="civ-layout civ-pro-sections-layout">

          {/* LEFT */}

          <aside className="civ-sidebar">

            {(isOwner ||
              isPublic(
                "rank"
              )) && (
            <section className="civ-rank-card">
              <div className="civ-rank-medal">
                <i className="fas fa-medal" />
              </div>

              <small>
                Civilian Network
              </small>

              <span className="civ-pro-rank-label">
                Network Rank
              </span>

              <h2>
                {rank}
              </h2>
            </section>
            )}

            <Card
              icon="fas fa-address-book"
              title="Contact (Public)"
              owner={
                isOwner
              }
              onEdit={() =>
                openEdit(
                  "contact"
                )
              }
            >
              <div className="civ-contact-list">
                {publicPhone &&
                (isOwner ||
                  isPublic(
                    "phone"
                  )) ? (
                  <a
                    href={`tel:${publicPhone}`}
                  >
                    <i className="fas fa-phone" />

                    <strong>
                      {publicPhone}
                    </strong>

                    <small>
                      Public
                    </small>
                  </a>
                ) : (
                  <div className="civ-muted-row">
                    <i className="fas fa-phone-slash" />

                    Mobile is private
                  </div>
                )}

                {p.city && (
                  <div className="civ-muted-row">
                    <i className="fas fa-city" />

                    City:{" "}
                    {p.city}
                  </div>
                )}

                {p.district && (
                  <div className="civ-muted-row">
                    <i className="fas fa-location-dot" />

                    District:{" "}
                    {p.district}
                  </div>
                )}

                {p.state && (
                  <div className="civ-muted-row">
                    <i className="fas fa-map" />

                    State:{" "}
                    {p.state}
                  </div>
                )}

                {p.pincode && (
                  <div className="civ-muted-row">
                    <i className="fas fa-location-crosshairs" />

                    Pincode:{" "}
                    {p.pincode}
                  </div>
                )}
              </div>
            </Card>

            <Card
              icon="fas fa-network-wired"
              title="About Network"
            >
              <div className="civ-network-list">
                <div>
                  <span>
                    Rank
                  </span>

                  <strong>
                    {rank}
                  </strong>
                </div>

                <div>
                  <span>
                    Membership
                  </span>

                  <strong>
                    Civilian
                  </strong>
                </div>
              </div>
            </Card>

            {(isOwner ||
              isPublic(
                "social"
              )) && (
            <Card
              icon="fas fa-share-nodes"
              title="Social Links"
              owner={
                isOwner
              }
              onEdit={() =>
                openEdit(
                  "social"
                )
              }
            >
              {socialLinks.length ? (
                <div className="civ-social-icons">
                  {socialLinks.map(
                    (
                      item
                    ) => (
                      <a
                        key={
                          item.name
                        }
                        href={
                          safeUrl(
                            item.value
                          )
                        }
                        target="_blank"
                        rel="noreferrer"
                        title={
                          item.name
                        }
                      >
                        <i
                          className={
                            item.icon
                          }
                        />
                      </a>
                    )
                  )}
                </div>
              ) : (
                <Empty />
              )}

              {p.portfolio_url && (
                <a
                  className="civ-website"
                  href={
                    safeUrl(
                      p.portfolio_url
                    )
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Website / Portfolio
                </a>
              )}
            </Card>
            )}

            {/* OWNER PRIVATE */}

            {isOwner && (
              <Card
                icon="fas fa-lock"
                title="Private KYC & Account"
                owner={
                  isOwner
                }
                onEdit={() =>
                  openEdit(
                    "private"
                  )
                }
              >
                <div className="civ-private-notice">
                  <i className="fas fa-shield-halved" />

                  Owner only · Private details are hidden from public visitors.
                </div>

                <InfoRow
                  label="Legal Name"
                  value={
                    firstValue(
                      p.full_legal_name,
                      p.legal_name,
                      `${text(
                        p.first_name
                      )} ${text(
                        p.last_name
                      )}`.trim()
                    )
                  }
                />

                <InfoRow
                  label="Father / Spouse"
                  value={
                    firstValue(
                      p.father_spouse_name,
                      p.father_name,
                      p.spouse_name
                    )
                  }
                />

                <InfoRow
                  label="Date of Birth"
                  value={
                    firstValue(
                      p.date_of_birth,
                      p.dob
                    )
                  }
                />

                <InfoRow
                  label="Gender"
                  value={
                    p.gender
                  }
                />

                <InfoRow
                  label="Marital Status"
                  value={
                    p.marital_status
                  }
                />

                <InfoRow
                  label="Nationality"
                  value={
                    p.nationality
                  }
                />

                <InfoRow
                  label="Blood Group"
                  value={
                    p.blood_group
                  }
                />

                <InfoRow
                  label="Email"
                  value={
                    p.email
                  }
                />

                <InfoRow
                  label="Primary Mobile"
                  value={
                    firstValue(
                      p.phone,
                      p.mobile,
                      p.primary_mobile
                    )
                  }
                />

                <InfoRow
                  label="Secondary Mobile"
                  value={
                    p.secondary_mobile
                  }
                />

                <InfoRow
                  label="WhatsApp"
                  value={
                    p.whatsapp_number
                  }
                />

                <InfoRow
                  label="Current Address"
                  value={
                    p.current_address
                  }
                />

                <InfoRow
                  label="Permanent Address"
                  value={
                    p.permanent_address
                  }
                />

                <InfoRow
                  label="Aadhaar"
                  value={
                    p.aadhaar_number
                  }
                />

                <InfoRow
                  label="PAN"
                  value={
                    p.pan_number
                  }
                />

                <InfoRow
                  label="Passport"
                  value={
                    p.passport_number
                  }
                />

                <InfoRow
                  label="Voter ID"
                  value={
                    p.voter_id
                  }
                />

                <InfoRow
                  label="Driving Licence"
                  value={
                    p.driving_license
                  }
                />

                <InfoRow
                  label="Bank Name"
                  value={
                    p.bank_name
                  }
                />

                <InfoRow
                  label="Account Number"
                  value={
                    p.bank_account_number
                  }
                />

                <InfoRow
                  label="IFSC"
                  value={
                    p.ifsc_code
                  }
                />

                <InfoRow
                  label="Branch"
                  value={
                    p.bank_branch
                  }
                />

                <InfoRow
                  label="UPI ID"
                  value={
                    p.upi_id
                  }
                />

                <InfoRow
                  label="GST Number"
                  value={
                    p.gst_number
                  }
                />

                <InfoRow
                  label="Nominee"
                  value={
                    firstValue(
                      p.nominee_name,
                      p.nominee
                    )
                  }
                />

                <InfoRow
                  label="Emergency Contact"
                  value={
                    firstValue(
                      p.emergency_contact_name,
                      p.emergency_contact
                    )
                  }
                />

                <InfoRow
                  label="Emergency Mobile"
                  value={
                    firstValue(
                      p.emergency_contact_number,
                      p.emergency_mobile
                    )
                  }
                />
              </Card>
            )}
          </aside>

          {/* RIGHT */}

          <div className="civ-content">

            {(isOwner ||
              isPublic(
                "bio"
              )) && (
            <Card
              icon="fas fa-user"
              title="About Me"
              owner={
                isOwner
              }
              onEdit={() =>
                openEdit(
                  "about"
                )
              }
            >
              {p.bio ? (
                <p className="civ-about">
                  {p.bio}
                </p>
              ) : (
                <Empty />
              )}
            </Card>
            )}

            {(isOwner ||
              isPublic(
                "education"
              )) && (
            <Card
              icon="fas fa-graduation-cap"
              title="Education"
              owner={
                isOwner
              }
              onEdit={() =>
                openEdit(
                  "education"
                )
              }
            >
              <div className="civ-detail-grid">
                <div>
                  <span>
                    Highest Qualification
                  </span>

                  <strong>
                    {text(
                      firstValue(
                        p
                          .educational_qualification,
                        p.education
                      ),
                      "Not added"
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    School / College
                  </span>

                  <strong>
                    {text(
                      p
                        .school_college_name,
                      "Not added"
                    )}
                  </strong>
                </div>
              </div>

              <div className="civ-subsection">
                <h4>
                  Additional Certifications
                </h4>

                <Tags
                  value={
                    p
                      .additional_certifications
                  }
                />
              </div>

              <div className="civ-subsection">
                <h4>
                  Languages
                </h4>

                <Tags
                  value={
                    p
                      .language_skills
                  }
                />
              </div>
            </Card>
            )}

            {(isOwner ||
              isPublic(
                "achievements"
              )) && (
            <Card
              icon="fas fa-trophy"
              title="Achievements & Recognition"
              owner={
                isOwner
              }
              onEdit={() =>
                openEdit(
                  "achievements"
                )
              }
            >
              <div className="civ-achievement-group">
                <h4>
                  Awards & Recognitions
                </h4>

                <Tags
                  value={
                    p.awards_recognitions
                  }
                />
              </div>

              <div className="civ-achievement-group">
                <h4>
                  Publications
                </h4>

                <Tags
                  value={
                    p.publications
                  }
                />
              </div>

              <div className="civ-achievement-group">
                <h4>
                  Professional Certifications
                </h4>

                <Tags
                  value={
                    p
                      .professional_certifications
                  }
                />
              </div>

              <div className="civ-achievement-group">
                <h4>
                  Key Milestones
                </h4>

                <Tags
                  value={
                    p.key_milestones
                  }
                />
              </div>

              <div className="civ-achievement-group">
                <h4>
                  Media Mentions
                </h4>

                <Tags
                  value={
                    p.media_mentions
                  }
                />
              </div>

              <div className="civ-achievement-group">
                <h4>
                  Testimonials / Reference Letters
                </h4>

                <Tags
                  value={
                    p.reference_letters
                  }
                />
              </div>
            </Card>
            )}

            {(isOwner ||
              isPublic(
                "skills"
              )) && (
            <Card
              icon="fas fa-lightbulb"
              title="Skills, Interests & Hobbies"
              owner={
                isOwner
              }
              onEdit={() =>
                openEdit(
                  "skills"
                )
              }
            >
              <div className="civ-subsection">
                <h4>
                  Skills
                </h4>

                <Tags
                  value={
                    p.skills
                  }
                />
              </div>

              <div className="civ-subsection">
                <h4>
                  Interests
                </h4>

                <Tags
                  value={
                    p
                      .interest_categories
                  }
                />
              </div>

              <div className="civ-subsection">
                <h4>
                  Hobbies
                </h4>

                <Tags
                  value={
                    p.hobbies
                  }
                />
              </div>

              <div className="civ-subsection">
                <h4>
                  Preferred Industry
                </h4>

                <p>
                  {text(
                    p.preferred_industry,
                    "Not added yet"
                  )}
                </p>
              </div>
            </Card>
            )}

            {(isOwner ||
              isPublic(
                "media"
              )) && (
            <Card
              icon="fas fa-photo-film"
              title="Media"
              owner={
                isOwner
              }
              onEdit={() =>
                openEdit(
                  "media"
                )
              }
            >
              {gallery.length ? (
                <div className="civ-gallery">
                  {gallery.map(
                    (
                      image,
                      index
                    ) => (
                      <img
                        key={`${image}-${index}`}
                        src={
                          image
                        }
                        alt={`Gallery ${index + 1}`}
                      />
                    )
                  )}
                </div>
              ) : (
                <Empty
                  textValue="No gallery photos added"
                />
              )}

              {introVideo && (
                <div className="civ-intro-video">
                  <a
                    href={
                      introVideo
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="fas fa-circle-play" />

                    View Intro Video
                  </a>
                </div>
              )}
            </Card>
            )}

          </div>
        </div>

        {/* EDIT MODAL */}

        {editing && (
          <EditModal
            section={
              editing
            }
            data={
              formData
            }
            setData={
              setFormData
            }
            saving={
              saving
            }
            error={
              saveError
            }
            onSave={
              saveEdit
            }
            onClose={() => {
              if (
                !saving
              ) {
                setEditing(
                  ""
                );

                setSaveError(
                  ""
                );
              }
            }}
          />
        )}
      </div>
    </main>
  );
}
