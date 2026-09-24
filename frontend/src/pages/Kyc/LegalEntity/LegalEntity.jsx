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
  getLegalEntityForm,
  getPanPath,
  submitLegalEntityDetails,
  validateAadhaarNumber,
  validateKycImage,
  validatePincode,
} from "../../../services/kyc.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./LegalEntity.css";

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM = {
  entity_aadhar_number: "",

  entity_house_no: "",
  entity_street: "",
  entity_area: "",
  entity_city: "",
  entity_district: "",
  entity_state: "",
  entity_pincode: "",

  entity_aadhar_front: null,
  entity_aadhar_back: null,
  entity_aadhar_selfie: null,
};

/* =========================================================
   TEXT
========================================================= */

const toText = (
  value
) => {
  return String(
    value ?? ""
  ).trim();
};

/* =========================================================
   CREATE FORM
========================================================= */

const createForm = (
  data = {}
) => {
  return {
    entity_aadhar_number:
      toText(
        data.entity_aadhar_number
      ),

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

    entity_aadhar_front:
      null,

    entity_aadhar_back:
      null,

    entity_aadhar_selfie:
      null,
  };
};

/* =========================================================
   COMPRESS IMAGE

   Legacy legalentity.html behavior:
   maximum width = 600
   output JPEG
   quality = 0.6
========================================================= */

const compressImage = (
  file
) => {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const reader =
        new FileReader();

      reader.onerror =
        () => {
          reject(
            new Error(
              "Unable to read image."
            )
          );
        };

      reader.onload =
        (
          event
        ) => {
          const image =
            new Image();

          image.onerror =
            () => {
              reject(
                new Error(
                  "Unable to process image."
                )
              );
            };

          image.onload =
            () => {
              let width =
                image.width;

              let height =
                image.height;

              const maxWidth =
                600;

              if (
                width >
                maxWidth
              ) {
                height =
                  height *
                  (
                    maxWidth /
                    width
                  );

                width =
                  maxWidth;
              }

              const canvas =
                document.createElement(
                  "canvas"
                );

              canvas.width =
                width;

              canvas.height =
                height;

              const context =
                canvas.getContext(
                  "2d"
                );

              if (
                !context
              ) {
                reject(
                  new Error(
                    "Unable to process image."
                  )
                );

                return;
              }

              context.drawImage(
                image,
                0,
                0,
                width,
                height
              );

              canvas.toBlob(
                (
                  blob
                ) => {
                  if (
                    !blob
                  ) {
                    reject(
                      new Error(
                        "Unable to compress image."
                      )
                    );

                    return;
                  }

                  const compressedFile =
                    new File(
                      [
                        blob,
                      ],
                      file.name,
                      {
                        type:
                          "image/jpeg",

                        lastModified:
                          Date.now(),
                      }
                    );

                  resolve(
                    compressedFile
                  );
                },
                "image/jpeg",
                0.6
              );
            };

          image.src =
            event.target.result;
        };

      reader.readAsDataURL(
        file
      );
    }
  );
};

/* =========================================================
   LEGAL ENTITY
========================================================= */

export default function LegalEntity() {
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
    previews,
    setPreviews,
  ] =
    useState({
      entity_aadhar_front:
        "",

      entity_aadhar_back:
        "",

      entity_aadhar_selfie:
        "",
    });

  /* =======================================================
     SAFE TOKEN
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
     LOAD LEGAL ENTITY
  ======================================================= */

  const loadLegalEntity =
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
            await getLegalEntityForm(
              safeToken,
              {
                signal,
              }
            );

          const existingData =
            result.legalEntity ||
            result.legal_entity ||
            result.existingData ||
            result.member ||
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
                "Unable to load Aadhaar KYC details."
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

      loadLegalEntity({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadLegalEntity,
    ]
  );

  /* =======================================================
     CLEAN PREVIEW URLS
  ======================================================= */

  useEffect(
    () => {
      return () => {
        Object.values(
          previews
        ).forEach(
          (
            url
          ) => {
            if (
              url
            ) {
              URL.revokeObjectURL(
                url
              );
            }
          }
        );
      };
    },
    [
      previews,
    ]
  );

  /* =======================================================
     TEXT CHANGE
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

      let nextValue =
        value;

      /* AADHAAR */

      if (
        name ===
        "entity_aadhar_number"
      ) {
        nextValue =
          value
            .replace(
              /\D/g,
              ""
            )
            .slice(
              0,
              12
            );
      }

      /* PINCODE */

      if (
        name ===
        "entity_pincode"
      ) {
        nextValue =
          value
            .replace(
              /\D/g,
              ""
            )
            .slice(
              0,
              6
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
     IMAGE CHANGE
  ======================================================= */

  const handleImageChange =
    async (
      event,
      fieldName
    ) => {
      const selectedFile =
        event.target
          .files?.[0];

      event.target.value =
        "";

      if (
        !selectedFile
      ) {
        return;
      }

      /* ===================================================
         TYPE VALIDATION

         Original page accepts:
         image/jpeg
         image/png
      =================================================== */

      const validation =
        validateKycImage(
          selectedFile,
          {
            required:
              true,

            /*
              Original source has no
              explicit size limit.
            */

            maxSizeMb:
              0,
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

            [fieldName]:
              validation.error,
          })
        );

        toast.error(
          validation.error
        );

        return;
      }

      try {
        const compressedFile =
          await compressImage(
            selectedFile
          );

        /* ===============================================
           REMOVE OLD PREVIEW
        =============================================== */

        const oldPreview =
          previews[
            fieldName
          ];

        if (
          oldPreview
        ) {
          URL.revokeObjectURL(
            oldPreview
          );
        }

        const previewUrl =
          URL.createObjectURL(
            compressedFile
          );

        setForm(
          (
            previous
          ) => ({
            ...previous,

            [fieldName]:
              compressedFile,
          })
        );

        setPreviews(
          (
            previous
          ) => ({
            ...previous,

            [fieldName]:
              previewUrl,
          })
        );

        setFieldErrors(
          (
            previous
          ) => ({
            ...previous,

            [fieldName]:
              "",
          })
        );
      } catch (
        imageError
      ) {
        toast.error(
          imageError.message ||
            "Unable to process image."
        );
      }
    };

  /* =======================================================
     REMOVE IMAGE
  ======================================================= */

  const removeImage =
    (
      fieldName
    ) => {
      const previewUrl =
        previews[
          fieldName
        ];

      if (
        previewUrl
      ) {
        URL.revokeObjectURL(
          previewUrl
        );
      }

      setForm(
        (
          previous
        ) => ({
          ...previous,

          [fieldName]:
            null,
        })
      );

      setPreviews(
        (
          previous
        ) => ({
          ...previous,

          [fieldName]:
            "",
        })
      );
    };

  /* =======================================================
     VALIDATE
  ======================================================= */

  const validateForm =
    () => {
      const errors =
        {};

      /* AADHAAR */

      const aadhaarNumber =
        toText(
          form.entity_aadhar_number
        );

      if (
        aadhaarNumber
      ) {
        const aadhaarValidation =
          validateAadhaarNumber(
            aadhaarNumber
          );

        if (
          !aadhaarValidation.valid
        ) {
          errors.entity_aadhar_number =
            aadhaarValidation.error;
        }
      }

      /* ADDRESS */

      if (
        !toText(
          form.entity_house_no
        )
      ) {
        errors.entity_house_no =
          "House number / building is required.";
      }

      if (
        !toText(
          form.entity_street
        )
      ) {
        errors.entity_street =
          "Street / road is required.";
      }

      if (
        !toText(
          form.entity_area
        )
      ) {
        errors.entity_area =
          "Area / locality is required.";
      }

      if (
        !toText(
          form.entity_city
        )
      ) {
        errors.entity_city =
          "City is required.";
      }

      if (
        !toText(
          form.entity_district
        )
      ) {
        errors.entity_district =
          "District is required.";
      }

      if (
        !toText(
          form.entity_state
        )
      ) {
        errors.entity_state =
          "State is required.";
      }

      const pincodeValidation =
        validatePincode(
          form.entity_pincode
        );

      if (
        !pincodeValidation.valid
      ) {
        errors.entity_pincode =
          pincodeValidation.error;
      }

      /* AADHAAR FRONT */

      const frontValidation =
        validateKycImage(
          form.entity_aadhar_front,
          {
            required:
              true,

            maxSizeMb:
              0,
          }
        );

      if (
        !frontValidation.valid
      ) {
        errors.entity_aadhar_front =
          "Aadhaar front image is required.";
      }

      /* AADHAAR BACK */

      const backValidation =
        validateKycImage(
          form.entity_aadhar_back,
          {
            required:
              true,

            maxSizeMb:
              0,
          }
        );

      if (
        !backValidation.valid
      ) {
        errors.entity_aadhar_back =
          "Aadhaar back image is required.";
      }

      /* SELFIE */

      const selfieValidation =
        validateKycImage(
          form.entity_aadhar_selfie,
          {
            required:
              true,

            maxSizeMb:
              0,
          }
        );

      if (
        !selfieValidation.valid
      ) {
        errors.entity_aadhar_selfie =
          "Aadhaar selfie is required.";
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
          "Please complete all Aadhaar KYC details."
        );

        window.scrollTo({
          top:
            0,

          behavior:
            "smooth",
        });

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
          await submitLegalEntityDetails(
            safeToken,
            form
          );

        toast.success(
          result.message ||
            "Aadhaar KYC details saved successfully."
        );

        const nextPath =
          result.nextPath ||
          result.nextRoute ||
          result.redirectTo ||
          getPanPath(
            safeToken
          );

        navigate(
          nextPath
        );
      } catch (
        requestError
      ) {
        const message =
          getApiErrorMessage(
            requestError,
            requestError?.apiMessage ||
              "Unable to save Aadhaar KYC details."
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
      <main className="legal-entity-page">
        <div className="legal-entity-state">
          <span className="legal-entity-spinner"></span>

          <h2>
            Loading Aadhaar KYC
          </h2>

          <p>
            Please wait while we validate your KYC session.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="legal-entity-page">
      <div className="legal-entity-container">
        {/* HEADER */}

        <header className="legal-entity-header">
          <div className="legal-entity-header-icon">
            <i className="fas fa-id-card"></i>
          </div>

          <div>
            <span>
              INMBA KYC
            </span>

            <h1>
              Aadhaar & Address Details
            </h1>

            <p>
              Enter your legal identity and residential address
              information.
            </p>
          </div>

          <div className="legal-entity-step">
            <small>
              KYC Step
            </small>

            <strong>
              Aadhaar
            </strong>
          </div>
        </header>

        {/* PROGRESS */}

        <div className="legal-entity-progress">
          <ProgressItem
            number="✓"
            label="Payment"
            completed
          />

          <ProgressLine />

          <ProgressItem
            number="✓"
            label="Bank"
            completed
          />

          <ProgressLine />

          <ProgressItem
            number="3"
            label="Aadhaar"
            active
          />

          <ProgressLine />

          <ProgressItem
            number="4"
            label="PAN"
          />
        </div>

        {/* ERROR */}

        {pageError && (
          <div className="legal-entity-error">
            <i className="fas fa-triangle-exclamation"></i>

            <span>
              {pageError}
            </span>
          </div>
        )}

        <form
          className="legal-entity-form"
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          {/* AADHAAR NUMBER */}

          <section className="legal-entity-card">
            <div className="legal-entity-card-header">
              <span>
                <i className="fas fa-fingerprint"></i>
              </span>

              <div>
                <h2>
                  Aadhaar Information
                </h2>

                <p>
                  Enter your 12-digit Aadhaar number (optional).
                </p>
              </div>
            </div>

            <div className="legal-entity-grid">
              <LegalField
                label="Aadhaar Number"
                name="entity_aadhar_number"
                value={
                  form.entity_aadhar_number
                }
                onChange={
                  handleChange
                }
                error={
                  fieldErrors.entity_aadhar_number
                }
                placeholder="Enter Aadhaar number (optional)"
                inputMode="numeric"
                maxLength={12}
                disabled={
                  submitting
                }
              />
            </div>
          </section>

          {/* AADHAAR DOCUMENTS */}

          <section className="legal-entity-card">
            <div className="legal-entity-card-header">
              <span>
                <i className="fas fa-file-image"></i>
              </span>

              <div>
                <h2>
                  Aadhaar Documents
                </h2>

                <p>
                  Upload Aadhaar front, back and Aadhaar selfie.
                  JPG or PNG only.
                </p>
              </div>
            </div>

            <div className="legal-entity-upload-grid">
              <ImageUpload
                label="Aadhaar Front"
                icon="fas fa-id-card"
                fieldName="entity_aadhar_front"
                preview={
                  previews.entity_aadhar_front
                }
                file={
                  form.entity_aadhar_front
                }
                error={
                  fieldErrors.entity_aadhar_front
                }
                onChange={
                  handleImageChange
                }
                onRemove={
                  removeImage
                }
                disabled={
                  submitting
                }
              />

              <ImageUpload
                label="Aadhaar Back"
                icon="fas fa-address-card"
                fieldName="entity_aadhar_back"
                preview={
                  previews.entity_aadhar_back
                }
                file={
                  form.entity_aadhar_back
                }
                error={
                  fieldErrors.entity_aadhar_back
                }
                onChange={
                  handleImageChange
                }
                onRemove={
                  removeImage
                }
                disabled={
                  submitting
                }
              />

              <ImageUpload
                label="Aadhaar Selfie"
                icon="fas fa-camera"
                fieldName="entity_aadhar_selfie"
                preview={
                  previews.entity_aadhar_selfie
                }
                file={
                  form.entity_aadhar_selfie
                }
                error={
                  fieldErrors.entity_aadhar_selfie
                }
                onChange={
                  handleImageChange
                }
                onRemove={
                  removeImage
                }
                disabled={
                  submitting
                }
              />
            </div>
          </section>

          {/* ADDRESS */}

          <section className="legal-entity-card">
            <div className="legal-entity-card-header">
              <span>
                <i className="fas fa-house"></i>
              </span>

              <div>
                <h2>
                  Residential Address
                </h2>

                <p>
                  Enter the address associated with your legal
                  identity.
                </p>
              </div>
            </div>

            <div className="legal-entity-grid">
              <LegalField
                label="House No / Building"
                name="entity_house_no"
                value={
                  form.entity_house_no
                }
                onChange={
                  handleChange
                }
                error={
                  fieldErrors.entity_house_no
                }
                required
                disabled={
                  submitting
                }
              />

              <LegalField
                label="Street / Road"
                name="entity_street"
                value={
                  form.entity_street
                }
                onChange={
                  handleChange
                }
                error={
                  fieldErrors.entity_street
                }
                required
                disabled={
                  submitting
                }
              />

              <LegalField
                label="Area / Locality"
                name="entity_area"
                value={
                  form.entity_area
                }
                onChange={
                  handleChange
                }
                error={
                  fieldErrors.entity_area
                }
                required
                disabled={
                  submitting
                }
              />

              <LegalField
                label="City"
                name="entity_city"
                value={
                  form.entity_city
                }
                onChange={
                  handleChange
                }
                error={
                  fieldErrors.entity_city
                }
                required
                disabled={
                  submitting
                }
              />

              <LegalField
                label="District"
                name="entity_district"
                value={
                  form.entity_district
                }
                onChange={
                  handleChange
                }
                error={
                  fieldErrors.entity_district
                }
                required
                disabled={
                  submitting
                }
              />

              <LegalField
                label="State"
                name="entity_state"
                value={
                  form.entity_state
                }
                onChange={
                  handleChange
                }
                error={
                  fieldErrors.entity_state
                }
                required
                disabled={
                  submitting
                }
              />

              <LegalField
                label="Pincode"
                name="entity_pincode"
                value={
                  form.entity_pincode
                }
                onChange={
                  handleChange
                }
                error={
                  fieldErrors.entity_pincode
                }
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit pincode"
                required
                disabled={
                  submitting
                }
              />
            </div>
          </section>

          {/* NOTE */}

          <div className="legal-entity-note">
            <i className="fas fa-shield-halved"></i>

            <div>
              <strong>
                Identity verification
              </strong>

              <p>
                Your Aadhaar documents are stored as part of the
                INMBA KYC verification process.
              </p>
            </div>
          </div>

          {/* ACTION */}

          <footer className="legal-entity-actions">
            <Link
              to={`/bank_form/${encodeURIComponent(
                safeToken
              )}`}
            >
              <i className="fas fa-arrow-left"></i>

              Back to Bank
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
   FIELD
========================================================= */

function LegalField({
  label,
  name,
  value,
  onChange,
  error,
  placeholder = "",
  inputMode,
  maxLength,
  required = false,
  disabled = false,
}) {
  return (
    <div
      className={`legal-entity-field ${
        error
          ? "legal-entity-field-error"
          : ""
      }`}
    >
      <label htmlFor={`legal-${name}`}>
        {label}

        {required && (
          <span>
            *
          </span>
        )}
      </label>

      <input
        id={`legal-${name}`}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        disabled={disabled}
        autoComplete="off"
      />

      {error && (
        <small>
          <i className="fas fa-circle-exclamation"></i>

          {error}
        </small>
      )}
    </div>
  );
}

/* =========================================================
   IMAGE UPLOAD
========================================================= */

function ImageUpload({
  label,
  icon,
  fieldName,
  preview,
  file,
  error,
  onChange,
  onRemove,
  disabled,
}) {
  return (
    <div
      className={`legal-entity-upload ${
        error
          ? "legal-entity-upload-error"
          : ""
      }`}
    >
      <label htmlFor={`upload-${fieldName}`}>
        {preview ? (
          <div className="legal-entity-preview">
            <img
              src={preview}
              alt={label}
            />

            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();

                event.stopPropagation();

                onRemove(
                  fieldName
                );
              }}
            >
              <i className="fas fa-xmark"></i>
            </button>
          </div>
        ) : (
          <span className="legal-entity-upload-icon">
            <i className={icon}></i>
          </span>
        )}

        <div>
          <strong>
            {label}
          </strong>

          <small>
            {file?.name ||
              "JPG or PNG image"}
          </small>
        </div>

        <span className="legal-entity-browse">
          Browse
        </span>
      </label>

      <input
        id={`upload-${fieldName}`}
        type="file"
        accept="image/jpeg,image/png"
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event,
            fieldName
          )
        }
      />

      {error && (
        <small className="legal-entity-upload-message">
          <i className="fas fa-circle-exclamation"></i>

          {error}
        </small>
      )}
    </div>
  );
}

/* =========================================================
   PROGRESS
========================================================= */

function ProgressItem({
  number,
  label,
  active = false,
  completed = false,
}) {
  return (
    <div
      className={`legal-progress-item ${
        active
          ? "active"
          : ""
      } ${
        completed
          ? "completed"
          : ""
      }`}
    >
      <span>
        {number}
      </span>

      <small>
        {label}
      </small>
    </div>
  );
}

function ProgressLine() {
  return (
    <div className="legal-progress-line"></div>
  );
}
