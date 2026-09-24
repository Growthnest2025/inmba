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
  getPanForm,
  getProfilePicturePath,
  submitPanDetails,
  validateKycImage,
  validatePanNumber,
} from "../../../services/kyc.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./PanDetails.css";

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM = {
  pan_number: "",
  pan_name: "",
  pan_front: null,
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
) => ({
  pan_number:
    toText(
      data.pan_number ??
        data.panNumber
    ).toUpperCase(),

  pan_name:
    toText(
      data.pan_name ??
        data.panName
    ),

  pan_front:
    null,
});

/* =========================================================
   PAN PAGE
========================================================= */

export default function PanDetails() {
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
    preview,
    setPreview,
  ] =
    useState(
      ""
    );

  const [
    selectedFileName,
    setSelectedFileName,
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
     LOAD PAN
  ======================================================= */

  const loadPanDetails =
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
            await getPanForm(
              safeToken,
              {
                signal,
              }
            );

          const existingData =
            result.pan ||
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
                "Unable to load PAN details."
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

      loadPanDetails({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadPanDetails,
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
     INPUT CHANGE
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

      if (
        name ===
        "pan_number"
      ) {
        nextValue =
          value
            .toUpperCase()
            .replace(
              /[^A-Z0-9]/g,
              ""
            )
            .slice(
              0,
              10
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
     PAN IMAGE CHANGE
  ======================================================= */

  const handleFileChange =
    (
      event
    ) => {
      const file =
        event.target
          .files?.[0] ||
        null;

      event.target.value =
        "";

      if (
        !file
      ) {
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

            pan_front:
              validation.error,
          })
        );

        toast.error(
          validation.error
        );

        return;
      }

      if (
        preview
      ) {
        URL.revokeObjectURL(
          preview
        );
      }

      const nextPreview =
        URL.createObjectURL(
          file
        );

      setPreview(
        nextPreview
      );

      setSelectedFileName(
        file.name
      );

      setForm(
        (
          previous
        ) => ({
          ...previous,

          pan_front:
            file,
        })
      );

      setFieldErrors(
        (
          previous
        ) => ({
          ...previous,

          pan_front:
            "",
        })
      );
    };

  /* =======================================================
     REMOVE FILE
  ======================================================= */

  const removeFile =
    () => {
      if (
        preview
      ) {
        URL.revokeObjectURL(
          preview
        );
      }

      setPreview(
        ""
      );

      setSelectedFileName(
        ""
      );

      setForm(
        (
          previous
        ) => ({
          ...previous,

          pan_front:
            null,
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

      /*
        PAN is optional.

        But when entered,
        format must be correct.
      */

      const panValidation =
        validatePanNumber(
          form.pan_number
        );

      if (
        !panValidation.valid
      ) {
        errors.pan_number =
          panValidation.error;
      }

      /*
        pan_name source-ல் optional.
      */

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
          "Please check the PAN details."
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
          await submitPanDetails(
            safeToken,
            {
              pan_number:
                toText(
                  form.pan_number
                ).toUpperCase(),

              pan_name:
                toText(
                  form.pan_name
                ),

              pan_front:
                form.pan_front,
            }
          );

        toast.success(
          result.message ||
            "PAN details saved successfully."
        );

        const nextPath =
          result.nextPath ||
          result.nextRoute ||
          result.redirectTo ||
          getProfilePicturePath(
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
              "Unable to save PAN details."
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
      <main className="pan-details-page">
        <div className="pan-details-state">
          <span className="pan-details-spinner"></span>

          <h2>
            Loading PAN Details
          </h2>

          <p>
            Please wait while we load your KYC information.
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="pan-details-page">
      <div className="pan-details-container">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="pan-details-header">
          <div className="pan-details-header-icon">
            <i
              className="fas fa-id-card-clip"
              aria-hidden="true"
            ></i>
          </div>

          <div>
            <span>
              INMBA KYC
            </span>

            <h1>
              PAN Card Details
            </h1>

            <p>
              Add your PAN details to continue your membership KYC.
            </p>
          </div>

          <div className="pan-details-step">
            <small>
              KYC Step
            </small>

            <strong>
              PAN
            </strong>
          </div>
        </header>

        {/* =================================================
            PROGRESS
        ================================================= */}

        <div className="pan-details-progress">
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
            number="✓"
            label="Aadhaar"
            completed
          />

          <ProgressLine />

          <ProgressItem
            number="4"
            label="PAN"
            active
          />
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {pageError && (
          <div
            className="pan-details-error"
            role="alert"
          >
            <i
              className="fas fa-triangle-exclamation"
              aria-hidden="true"
            ></i>

            <span>
              {pageError}
            </span>
          </div>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        <form
          className="pan-details-form"
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          <section className="pan-details-card">
            <div className="pan-details-card-header">
              <span>
                <i
                  className="fas fa-address-card"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <h2>
                  PAN Information
                </h2>

                <p>
                  PAN number and name are optional in this KYC step.
                </p>
              </div>
            </div>

            <div className="pan-details-grid">
              {/* PAN NUMBER */}

              <div
                className={`pan-details-field ${
                  fieldErrors.pan_number
                    ? "pan-details-field-error"
                    : ""
                }`}
              >
                <label htmlFor="pan-number">
                  PAN Number

                  <small>
                    Optional
                  </small>
                </label>

                <input
                  id="pan-number"
                  type="text"
                  name="pan_number"
                  value={
                    form.pan_number
                  }
                  onChange={
                    handleChange
                  }
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  autoComplete="off"
                  disabled={
                    submitting
                  }
                />

                {fieldErrors.pan_number && (
                  <small className="pan-details-field-message">
                    <i className="fas fa-circle-exclamation"></i>

                    {fieldErrors.pan_number}
                  </small>
                )}
              </div>

              {/* PAN NAME */}

              <div className="pan-details-field">
                <label htmlFor="pan-name">
                  Name on PAN

                  <small>
                    Optional
                  </small>
                </label>

                <input
                  id="pan-name"
                  type="text"
                  name="pan_name"
                  value={
                    form.pan_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter name as shown on PAN"
                  autoComplete="off"
                  disabled={
                    submitting
                  }
                />
              </div>
            </div>
          </section>

          {/* =================================================
              PAN DOCUMENT
          ================================================= */}

          <section className="pan-details-card">
            <div className="pan-details-card-header">
              <span>
                <i
                  className="fas fa-file-image"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <h2>
                  PAN Card Image
                </h2>

                <p>
                  Upload the front side of your PAN card when
                  available.
                </p>
              </div>
            </div>

            <div className="pan-details-upload-wrapper">
              <input
                id="pan-front"
                type="file"
                accept="image/jpeg,image/png"
                onChange={
                  handleFileChange
                }
                disabled={
                  submitting
                }
              />

              <label
                htmlFor="pan-front"
                className={
                  fieldErrors.pan_front
                    ? "pan-details-upload-error"
                    : ""
                }
              >
                {preview ? (
                  <div className="pan-details-preview">
                    <img
                      src={
                        preview
                      }
                      alt="PAN Preview"
                    />

                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();

                        event.stopPropagation();

                        removeFile();
                      }}
                    >
                      <i className="fas fa-xmark"></i>
                    </button>
                  </div>
                ) : (
                  <span className="pan-details-upload-icon">
                    <i className="fas fa-cloud-arrow-up"></i>
                  </span>
                )}

                <div>
                  <strong>
                    {selectedFileName ||
                      "Upload PAN Card"}
                  </strong>

                  <small>
                    JPG or PNG • Optional
                  </small>
                </div>

                <span className="pan-details-browse">
                  Browse
                </span>
              </label>

              {fieldErrors.pan_front && (
                <small className="pan-details-field-message">
                  {fieldErrors.pan_front}
                </small>
              )}
            </div>
          </section>

          {/* =================================================
              INFO
          ================================================= */}

          <div className="pan-details-note">
            <i
              className="fas fa-circle-info"
              aria-hidden="true"
            ></i>

            <div>
              <strong>
                PAN is optional
              </strong>

              <p>
                You may continue without entering PAN details. When a
                PAN number is provided, it must be a valid PAN and
                cannot already belong to another INMBA member.
              </p>
            </div>
          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <footer className="pan-details-actions">
            <Link
              to={`/legal_entity/${encodeURIComponent(
                safeToken
              )}`}
            >
              <i className="fas fa-arrow-left"></i>

              Back to Aadhaar
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
   PROGRESS ITEM
========================================================= */

function ProgressItem({
  number,
  label,
  active = false,
  completed = false,
}) {
  return (
    <div
      className={`pan-progress-item ${
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

/* =========================================================
   PROGRESS LINE
========================================================= */

function ProgressLine() {
  return (
    <div className="pan-progress-line"></div>
  );
}