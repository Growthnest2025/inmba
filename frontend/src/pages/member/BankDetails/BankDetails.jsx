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
  getBankForm,
  getLegalEntityPath,
  submitBankDetails,
} from "../../../services/kyc.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./BankDetails.css";
import { toText } from "../../../utils/commonHelpers";

/* =========================================================
   INITIAL FORM
========================================================= */

const INITIAL_FORM = {
  account_holder: "",
  bank_name: "",
  branch_name: "",
  account_number1: "",
  account_number2: "",
  ifsc: "",
  bank_proof: null,
};

/* =========================================================
   TEXT
========================================================= */

/* =========================================================
   CREATE FORM FROM API
========================================================= */

const createBankForm = (
  bank = {}
) => {
  const accountNumber =
    toText(
      bank.account_number ??
        bank.account_number1
    );

  return {
    account_holder:
      toText(
        bank.account_holder
      ),

    bank_name:
      toText(
        bank.bank_name
      ),

    branch_name:
      toText(
        bank.branch_name ??
          bank.branch
      ),

    account_number1:
      accountNumber,

    account_number2:
      accountNumber,

    ifsc:
      toText(
        bank.ifsc
      ),

    bank_proof:
      null,
  };
};

/* =========================================================
   BANK DETAILS
========================================================= */

export default function BankDetails() {
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
    selectedFileName,
    setSelectedFileName,
  ] =
    useState(
      ""
    );

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
     LOAD BANK PAGE
  ======================================================= */

  const loadBankDetails =
    useCallback(
      async ({
        signal,
      } = {}) => {
        if (
          !safeToken
        ) {
          setPageError(
            "Member token is missing."
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
            await getBankForm(
              safeToken,
              {
                signal,
              }
            );

          setForm(
            createBankForm(
              result.bank
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

          const message =
            getApiErrorMessage(
              requestError,
              requestError
                ?.apiMessage ||
                "Unable to load bank details."
            );

          setPageError(
            message
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

      loadBankDetails({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadBankDetails,
    ]
  );

  /* =======================================================
     INPUT CHANGE
  ======================================================= */

  const handleChange = (
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
      name === "ifsc"
    ) {
      nextValue =
        value
          .toUpperCase()
          .replace(
            /\s/g,
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

    if (
      name ===
        "account_number1" ||
      name ===
        "account_number2"
    ) {
      setFieldErrors(
        (
          previous
        ) => ({
          ...previous,

          account_number1:
            "",

          account_number2:
            "",
        })
      );
    }

    setPageError(
      ""
    );
  };

  /* =======================================================
     FILE CHANGE
  ======================================================= */

  const handleFileChange = (
    event
  ) => {
    const file =
      event.target
        .files?.[0] ||
      null;

    setForm(
      (
        previous
      ) => ({
        ...previous,

        bank_proof:
          file,
      })
    );

    setSelectedFileName(
      file?.name ||
        ""
    );

    setFieldErrors(
      (
        previous
      ) => ({
        ...previous,

        bank_proof:
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

      if (
        !toText(
          form.account_holder
        )
      ) {
        errors.account_holder =
          "Account holder name is required.";
      }

      if (
        !toText(
          form.bank_name
        )
      ) {
        errors.bank_name =
          "Bank name is required.";
      }

      if (
        !toText(
          form.branch_name
        )
      ) {
        errors.branch_name =
          "Branch name is required.";
      }

      const account1 =
        toText(
          form.account_number1
        );

      const account2 =
        toText(
          form.account_number2
        );

      /*
        Original Flask source:
        Account number optional.

        But if either value exists,
        values must match.
      */

      if (
        account1 ||
        account2
      ) {
        if (
          account1 !==
          account2
        ) {
          errors.account_number2 =
            "Account numbers do not match.";
        }
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
          "Please check the bank details."
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
          await submitBankDetails(
            safeToken,
            form
          );

        toast.success(
          result.message ||
            "Bank details saved successfully."
        );

        const nextPath =
          result.nextPath ||
          result.redirectTo ||
          getLegalEntityPath(
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
            requestError
              ?.apiMessage ||
              "Unable to save bank details."
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
      <main className="inmba-bank-page">
        <div className="inmba-bank-state">
          <span className="inmba-bank-spinner"></span>

          <h2>
            Loading Bank Details
          </h2>

          <p>
            Please wait while we validate your KYC session.
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     INVALID TOKEN
  ======================================================= */

  if (
    pageError &&
    !safeToken
  ) {
    return (
      <main className="inmba-bank-page">
        <div className="inmba-bank-state inmba-bank-error-state">
          <i className="fas fa-circle-exclamation"></i>

          <h2>
            Bank Details Unavailable
          </h2>

          <p>
            {pageError}
          </p>

          <Link to="/dashboard">
            Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="inmba-bank-page">
      <div className="inmba-bank-container">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="inmba-bank-header">
          <div className="inmba-bank-header-icon">
            <i
              className="fas fa-building-columns"
              aria-hidden="true"
            ></i>
          </div>

          <div>
            <span>
              INMBA KYC
            </span>

            <h1>
              Bank Details
            </h1>

            <p>
              Enter your bank account information to continue your
              membership verification.
            </p>
          </div>

          <div className="inmba-bank-step">
            <small>
              KYC Step
            </small>

            <strong>
              Bank
            </strong>
          </div>
        </header>

        {/* =================================================
            FLOW
        ================================================= */}

        <div className="inmba-bank-progress">
          <div className="inmba-bank-progress-complete">
            <span>
              <i className="fas fa-check"></i>
            </span>

            <small>
              Payment
            </small>
          </div>

          <div className="inmba-bank-progress-line"></div>

          <div className="inmba-bank-progress-active">
            <span>
              2
            </span>

            <small>
              Bank
            </small>
          </div>

          <div className="inmba-bank-progress-line"></div>

          <div>
            <span>
              3
            </span>

            <small>
              Aadhaar
            </small>
          </div>

          <div className="inmba-bank-progress-line"></div>

          <div>
            <span>
              4
            </span>

            <small>
              PAN
            </small>
          </div>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {pageError && (
          <div
            className="inmba-bank-error"
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
          className="inmba-bank-form"
          onSubmit={
            handleSubmit
          }
          noValidate
        >
          <section className="inmba-bank-card">
            <div className="inmba-bank-card-header">
              <span>
                <i className="fas fa-user"></i>
              </span>

              <div>
                <h2>
                  Account Information
                </h2>

                <p>
                  Add the bank account holder and bank branch details.
                </p>
              </div>
            </div>

            <div className="inmba-bank-grid">
              {/* ACCOUNT HOLDER */}

              <BankField
                label="Account Holder Name"
                name="account_holder"
                value={
                  form.account_holder
                }
                onChange={
                  handleChange
                }
                error={
                  fieldErrors.account_holder
                }
                placeholder="Enter account holder name"
                required
                disabled={
                  submitting
                }
              />

              {/* BANK */}

              <BankField
                label="Bank Name"
                name="bank_name"
                value={
                  form.bank_name
                }
                onChange={
                  handleChange
                }
                error={
                  fieldErrors.bank_name
                }
                placeholder="Enter bank name"
                required
                disabled={
                  submitting
                }
              />

              {/* BRANCH */}

              <BankField
                label="Branch Name"
                name="branch_name"
                value={
                  form.branch_name
                }
                onChange={
                  handleChange
                }
                error={
                  fieldErrors.branch_name
                }
                placeholder="Enter branch name"
                required
                disabled={
                  submitting
                }
              />

              {/* IFSC */}

              <BankField
                label="IFSC Code"
                name="ifsc"
                value={
                  form.ifsc
                }
                onChange={
                  handleChange
                }
                error={
                  fieldErrors.ifsc
                }
                placeholder="Example: SBIN0001234"
                disabled={
                  submitting
                }
                optional
              />
            </div>
          </section>

          {/* =================================================
              ACCOUNT NUMBER
          ================================================= */}

          <section className="inmba-bank-card">
            <div className="inmba-bank-card-header">
              <span>
                <i className="fas fa-credit-card"></i>
              </span>

              <div>
                <h2>
                  Account Number
                </h2>

                <p>
                  Account number is optional in the original KYC
                  workflow. When entered, confirm it correctly.
                </p>
              </div>
            </div>

            <div className="inmba-bank-grid">
              <BankField
                label="Account Number"
                name="account_number1"
                value={
                  form.account_number1
                }
                onChange={
                  handleChange
                }
                error={
                  fieldErrors.account_number1
                }
                placeholder="Enter account number"
                inputMode="numeric"
                disabled={
                  submitting
                }
                optional
              />

              <BankField
                label="Confirm Account Number"
                name="account_number2"
                value={
                  form.account_number2
                }
                onChange={
                  handleChange
                }
                error={
                  fieldErrors.account_number2
                }
                placeholder="Re-enter account number"
                inputMode="numeric"
                disabled={
                  submitting
                }
                optional
              />
            </div>
          </section>

          {/* =================================================
              BANK PROOF
          ================================================= */}

          <section className="inmba-bank-card">
            <div className="inmba-bank-card-header">
              <span>
                <i className="fas fa-file-shield"></i>
              </span>

              <div>
                <h2>
                  Bank Proof
                </h2>

                <p>
                  Upload your bank proof document when available.
                </p>
              </div>
            </div>

            <div className="inmba-bank-upload">
              <input
                id="inmba-bank-proof"
                type="file"
                accept="image/*,.pdf"
                onChange={
                  handleFileChange
                }
                disabled={
                  submitting
                }
              />

              <label htmlFor="inmba-bank-proof">
                <span className="inmba-bank-upload-icon">
                  <i className="fas fa-cloud-arrow-up"></i>
                </span>

                <div>
                  <strong>
                    {selectedFileName ||
                      "Choose Bank Proof"}
                  </strong>

                  <small>
                    Image or PDF • Optional
                  </small>
                </div>

                <span className="inmba-bank-upload-button">
                  Browse
                </span>
              </label>

              {fieldErrors.bank_proof && (
                <small className="inmba-bank-field-error">
                  {fieldErrors.bank_proof}
                </small>
              )}
            </div>
          </section>

          {/* =================================================
              INFO
          ================================================= */}

          <div className="inmba-bank-note">
            <i className="fas fa-shield-halved"></i>

            <div>
              <strong>
                Your bank information is part of your INMBA KYC
                record.
              </strong>

              <p>
                Account holder name, bank name and branch are required
                to continue.
              </p>
            </div>
          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <footer className="inmba-bank-actions">
            <Link
              to="/payment"
              className="inmba-bank-back"
            >
              <i className="fas fa-arrow-left"></i>

              Back to Payment
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
   FIELD COMPONENT
========================================================= */

function BankField({
  label,
  name,
  value,
  onChange,
  error = "",
  placeholder = "",
  inputMode,
  required = false,
  optional = false,
  disabled = false,
}) {
  return (
    <div
      className={`inmba-bank-field ${
        error
          ? "inmba-bank-field-invalid"
          : ""
      }`}
    >
      <label htmlFor={`bank-${name}`}>
        {label}

        {required && (
          <span>
            *
          </span>
        )}

        {optional && (
          <small>
            Optional
          </small>
        )}
      </label>

      <input
        id={`bank-${name}`}
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputMode={inputMode}
        disabled={disabled}
        autoComplete="off"
      />

      {error && (
        <small className="inmba-bank-field-error">
          <i className="fas fa-circle-exclamation"></i>

          {error}
        </small>
      )}
    </div>
  );
}