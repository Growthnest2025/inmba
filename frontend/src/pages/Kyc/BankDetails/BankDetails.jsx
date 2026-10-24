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
  useParams,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  BACKEND_URL,
} from "../../../api/api";

import {
  getBankDetails,
  submitBankDetails,
  validateKycImage,
} from "../../../services/kyc.service";

import {
  getApiErrorMessage,
  getFieldErrors,
} from "../../../utils/apiError";

import "./BankDetails.css";
import { toText, asObject } from "../../../utils/commonHelpers";

/* =========================
   INITIAL FORM
========================= */

const INITIAL_FORM_DATA = {
  account_holder: "",
  bank_name: "",
  account_number1: "",
  account_number2: "",
  ifsc: "",
  branch_name: "",
  bank_proof: null,
};

/* =========================
   COMMON HELPERS
========================= */

/* =========================
   EXISTING FILE URL
========================= */

const getFileUrl = (
  value
) => {
  const filePath =
    toText(
      value,
      ""
    );

  if (!filePath) {
    return "";
  }

  if (
    filePath.startsWith(
      "http://"
    ) ||
    filePath.startsWith(
      "https://"
    ) ||
    filePath.startsWith(
      "data:"
    ) ||
    filePath.startsWith(
      "blob:"
    )
  ) {
    return filePath;
  }

  if (
    filePath.startsWith("/")
  ) {
    return `${BACKEND_URL}${filePath}`;
  }

  if (
    filePath.startsWith(
      "static/"
    )
  ) {
    return `${BACKEND_URL}/${filePath}`;
  }

  return `${BACKEND_URL}/static/uploads/${encodeURIComponent(
    filePath
  )}`;
};

/* =========================
   INTERNAL ROUTE
========================= */

const getInternalRoute = (
  value
) => {
  const route =
    toText(
      value,
      ""
    );

  if (!route) {
    return "";
  }

  if (
    route.startsWith("/")
  ) {
    return route;
  }

  try {
    const parsedUrl =
      new URL(route);

    return `${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return "";
  }
};

/* =========================
   FIELD ERROR
========================= */

const getErrorText = (
  value
) => {
  if (
    Array.isArray(value)
  ) {
    return toText(
      value[0],
      ""
    );
  }

  if (
    value &&
    typeof value === "object"
  ) {
    return toText(
      value.message ??
        value.msg ??
        value.error,
      ""
    );
  }

  return toText(
    value,
    ""
  );
};

/* =========================
   BANK DETAILS PAGE
========================= */

export default function BankDetails() {
  const navigate =
    useNavigate();

  const {
    token,
  } =
    useParams();

  const fileInputRef =
    useRef(null);

  const [
    member,
    setMember,
  ] =
    useState({});

  const [
    formData,
    setFormData,
  ] =
    useState({
      ...INITIAL_FORM_DATA,
    });

  const [
    proofPreview,
    setProofPreview,
  ] =
    useState("");

  const [
    existingProof,
    setExistingProof,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    pageError,
    setPageError,
  ] =
    useState("");

  const [
    formError,
    setFormError,
  ] =
    useState("");

  const [
    fieldErrors,
    setFieldErrors,
  ] =
    useState({});

  const normalizedToken =
    useMemo(
      () =>
        toText(
          token,
          ""
        ),
      [
        token,
      ]
    );

  /* =========================
     LOAD BANK DETAILS

     GET /bank_form/:token
  ========================= */

  const loadBankDetails =
    useCallback(
      async (
        {
          signal,
        } = {}
      ) => {
        if (
          !normalizedToken
        ) {
          setPageError(
            "Invalid KYC token."
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
            await getBankDetails(
              normalizedToken,
              {
                signal,
              }
            );

          const receivedMember =
            asObject(
              result.member
            );

          const receivedDetails =
            asObject(
              result.existingData
            );

          /*
            சில backend responses-ல்
            bank fields member object-ல் வரும்.

            சில responses-ல் details object-ல் வரும்.
          */

          const existingData = {
            ...receivedMember,
            ...receivedDetails,
          };

          setMember(
            receivedMember
          );

          const accountNumber =
            toText(
              existingData.account_number ??
                existingData.accountNumber ??
                existingData.account_number1,
              ""
            );

          setFormData({
            account_holder:
              toText(
                existingData.account_holder ??
                  existingData.accountHolder,
                ""
              ),

            bank_name:
              toText(
                existingData.bank_name ??
                  existingData.bankName,
                ""
              ),

            account_number1:
              accountNumber,

            account_number2:
              accountNumber,

            ifsc:
              toText(
                existingData.ifsc ??
                  existingData.ifsc_code ??
                  existingData.ifscCode,
                ""
              ).toUpperCase(),

            branch_name:
              toText(
                existingData.branch ??
                  existingData.branch_name ??
                  existingData.branchName,
                ""
              ),

            bank_proof: null,
          });

          const currentProof =
            getFileUrl(
              existingData.bank_proof ??
                existingData.bankProof ??
                existingData.bank_proof_url
            );

          setExistingProof(
            currentProof
          );

          setProofPreview(
            currentProof
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

          if (cancelled) {
            return;
          }

          const statusCode =
            Number(
              requestError?.response
                ?.status ||
                requestError?.statusCode ||
                0
            );

          if (
            statusCode === 401 ||
            requestError?.sessionExpired
          ) {
            navigate(
              "/login",
              {
                replace: true,

                state: {
                  from:
                    `/bank_form/${normalizedToken}`,

                  error:
                    "Your session has expired. Please login again.",
                },
              }
            );

            return;
          }

          console.error(
            "Bank details API error:",
            requestError
          );

          setPageError(
            getApiErrorMessage(
              requestError,
              "Unable to load bank details."
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
        normalizedToken,
      ]
    );

  /* =========================
     INITIAL LOAD
  ========================= */

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

  /* =========================
     BLOB PREVIEW CLEANUP
  ========================= */

  useEffect(
    () => {
      return () => {
        if (
          proofPreview.startsWith(
            "blob:"
          )
        ) {
          URL.revokeObjectURL(
            proofPreview
          );
        }
      };
    },
    [
      proofPreview,
    ]
  );

  /* =========================
     MEMBER INFORMATION
  ========================= */

  const firstName =
    toText(
      member.first_name ??
        member.firstName,
      "Member"
    );

  const lastName =
    toText(
      member.last_name ??
        member.lastName,
      ""
    );

  const fullName =
    `${firstName} ${lastName}`
      .trim();

  const loginId =
    toText(
      member.login_id ??
        member.loginId,
      "Not available"
    );

  /* =========================
     INPUT CHANGE
  ========================= */

  const handleInputChange = (
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
      "account_number1" ||
      name ===
      "account_number2"
    ) {
      nextValue =
        value
          .replace(
            /\D/g,
            ""
          )
          .slice(
            0,
            20
          );
    }

    if (
      name === "ifsc"
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
            11
          );
    }

    setFormData(
      (
        previousData
      ) => ({
        ...previousData,

        [name]:
          nextValue,
      })
    );

    setFormError(
      ""
    );

    setFieldErrors(
      (
        previousErrors
      ) => ({
        ...previousErrors,

        [name]: "",
      })
    );
  };

  /* =========================
     OPEN FILE INPUT
  ========================= */

  const handleOpenProofInput =
    () => {
      if (
        submitting
      ) {
        return;
      }

      fileInputRef.current?.click();
    };

  /* =========================
     PROOF CHANGE
  ========================= */

  const handleProofChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value =
      "";

    if (!file) {
      return;
    }

    const validation =
      validateKycImage(
        file,
        {
          required: false,
          maxSizeMb: 5,
        }
      );

    if (
      !validation.valid
    ) {
      setFieldErrors(
        (
          previousErrors
        ) => ({
          ...previousErrors,

          bank_proof:
            validation.error,
        })
      );

      toast.error(
        validation.error
      );

      return;
    }

    if (
      proofPreview.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        proofPreview
      );
    }

    const nextPreview =
      URL.createObjectURL(
        file
      );

    setFormData(
      (
        previousData
      ) => ({
        ...previousData,

        bank_proof:
          file,
      })
    );

    setProofPreview(
      nextPreview
    );

    setFieldErrors(
      (
        previousErrors
      ) => ({
        ...previousErrors,

        bank_proof: "",
      })
    );
  };

  /* =========================
     REMOVE NEW PROOF
  ========================= */

  const handleRemoveProof = (
    event
  ) => {
    event.stopPropagation();

    if (
      proofPreview.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        proofPreview
      );
    }

    setFormData(
      (
        previousData
      ) => ({
        ...previousData,

        bank_proof: null,
      })
    );

    setProofPreview(
      existingProof
    );

    setFieldErrors(
      (
        previousErrors
      ) => ({
        ...previousErrors,

        bank_proof: "",
      })
    );
  };

  /* =========================
     VALIDATE FORM
  ========================= */

  const validateForm = () => {
    const errors = {};

    const accountHolder =
      toText(
        formData.account_holder,
        ""
      );

    const bankName =
      toText(
        formData.bank_name,
        ""
      );

    const branchName =
      toText(
        formData.branch_name,
        ""
      );

    const accountNumber1 =
      toText(
        formData.account_number1,
        ""
      );

    const accountNumber2 =
      toText(
        formData.account_number2,
        ""
      );

    const ifsc =
      toText(
        formData.ifsc,
        ""
      ).toUpperCase();

    if (!accountHolder) {
      errors.account_holder =
        "Account holder name is required.";
    } else if (
      accountHolder.length < 3
    ) {
      errors.account_holder =
        "Enter a valid account holder name.";
    }

    if (!bankName) {
      errors.bank_name =
        "Bank name is required.";
    }

    if (!branchName) {
      errors.branch_name =
        "Branch name is required.";
    }

    /*
      Account number optional.

      ஆனால் ஒரு account field
      fill செய்தால் இரண்டு fields-ம்
      match ஆக வேண்டும்.
    */

    if (
      accountNumber1 ||
      accountNumber2
    ) {
      if (
        !accountNumber1
      ) {
        errors.account_number1 =
          "Enter the account number.";
      } else if (
        !/^\d{6,20}$/.test(
          accountNumber1
        )
      ) {
        errors.account_number1 =
          "Account number must contain 6 to 20 digits.";
      }

      if (
        !accountNumber2
      ) {
        errors.account_number2 =
          "Confirm the account number.";
      } else if (
        accountNumber1 !==
        accountNumber2
      ) {
        errors.account_number2 =
          "Account numbers do not match.";
      }
    }

    /*
      IFSC optional.

      Value கொடுத்தால் valid format
      ஆக இருக்க வேண்டும்.
    */

    if (
      ifsc &&
      !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
        ifsc
      )
    ) {
      errors.ifsc =
        "Enter a valid 11-character IFSC code.";
    }

    if (
      formData.bank_proof
    ) {
      const proofValidation =
        validateKycImage(
          formData.bank_proof,
          {
            required: false,
            maxSizeMb: 5,
          }
        );

      if (
        !proofValidation.valid
      ) {
        errors.bank_proof =
          proofValidation.error;
      }
    }

    setFieldErrors(
      errors
    );

    if (
      Object.keys(
        errors
      ).length > 0
    ) {
      setFormError(
        "Please correct the highlighted bank details."
      );

      return false;
    }

    return true;
  };

  /* =========================
     SUBMIT BANK DETAILS

     POST /bank_submit/:token
  ========================= */

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

      setFormError(
        ""
      );

      if (
        !validateForm()
      ) {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });

        return;
      }

      try {
        setSubmitting(
          true
        );

        setFieldErrors(
          {}
        );

        const result =
          await submitBankDetails(
            normalizedToken,
            {
              account_holder:
                formData.account_holder,

              bank_name:
                formData.bank_name,

              account_number1:
                formData.account_number1,

              account_number2:
                formData.account_number2,

              ifsc:
                formData.ifsc,

              branch_name:
                formData.branch_name,

              bank_proof:
                formData.bank_proof,
            }
          );

        toast.success(
          result.message ||
            "Bank details saved successfully."
        );

        const responseToken =
          toText(
            result.token,
            normalizedToken
          );

        const responseRoute =
          getInternalRoute(
            result.nextRoute
          );

        if (
          responseRoute
        ) {
          navigate(
            responseRoute
          );

          return;
        }

        navigate(
          `/legal_entity/${encodeURIComponent(
            responseToken
          )}`
        );
      } catch (
        submitError
      ) {
        const statusCode =
          Number(
            submitError?.response
              ?.status ||
              submitError?.statusCode ||
              0
          );

        if (
          statusCode === 401 ||
          submitError?.sessionExpired
        ) {
          navigate(
            "/login",
            {
              replace: true,

              state: {
                from:
                  `/bank_form/${normalizedToken}`,

                error:
                  "Your session has expired. Please login again.",
              },
            }
          );

          return;
        }

        const apiErrors =
          asObject(
            getFieldErrors(
              submitError
            )
          );

        setFieldErrors(
          apiErrors
        );

        setFormError(
          getApiErrorMessage(
            submitError,
            "Unable to save bank details."
          )
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="inmba-bank-page">
        <div className="inmba-bank-state">
          <div
            className="spinner-border"
            role="status"
            aria-label="Loading bank details"
          ></div>

          <h1>
            Loading Bank Details
          </h1>

          <p>
            Preparing your KYC bank information.
          </p>
        </div>
      </main>
    );
  }

  /* =========================
     PAGE ERROR
  ========================= */

  if (pageError) {
    return (
      <main className="inmba-bank-page">
        <div className="inmba-bank-state inmba-bank-error-state">
          <span className="inmba-bank-state-icon">
            <i
              className="fas fa-building-columns"
              aria-hidden="true"
            ></i>
          </span>

          <h1>
            Bank Form Unavailable
          </h1>

          <p>
            {pageError}
          </p>

          <div className="inmba-bank-state-actions">
            <Link
              to="/dashboard"
              className="inmba-bank-secondary-button"
            >
              Dashboard
            </Link>

            <button
              type="button"
              className="inmba-bank-primary-button"
              onClick={() =>
                loadBankDetails()
              }
            >
              <i
                className="fas fa-rotate-right"
                aria-hidden="true"
              ></i>

              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="inmba-bank-page">
      <div className="inmba-bank-container">
        {/* =====================
            HEADER
        ===================== */}

        <header className="inmba-bank-header">
          <div>
            <p>
              INMBA Member KYC
            </p>

            <h1>
              Bank Details
            </h1>

            <span>
              Add your bank information to continue the membership
              verification process.
            </span>
          </div>

          <Link
            to="/dashboard"
            className="inmba-bank-header-button"
          >
            <i
              className="fas fa-arrow-left"
              aria-hidden="true"
            ></i>

            Dashboard
          </Link>
        </header>

        {/* =====================
            KYC PROGRESS
        ===================== */}

        <section className="inmba-bank-progress">
          <article className="inmba-bank-progress-active">
            <span>
              1
            </span>

            <div>
              <strong>
                Bank
              </strong>

              <small>
                Current
              </small>
            </div>
          </article>

          <div></div>

          <article>
            <span>
              2
            </span>

            <div>
              <strong>
                Aadhaar
              </strong>

              <small>
                Next
              </small>
            </div>
          </article>

          <div></div>

          <article>
            <span>
              3
            </span>

            <div>
              <strong>
                PAN
              </strong>

              <small>
                Pending
              </small>
            </div>
          </article>

          <div></div>

          <article>
            <span>
              4
            </span>

            <div>
              <strong>
                Profile
              </strong>

              <small>
                Pending
              </small>
            </div>
          </article>

          <div></div>

          <article>
            <span>
              5
            </span>

            <div>
              <strong>
                Sign
              </strong>

              <small>
                Pending
              </small>
            </div>
          </article>
        </section>

        {/* =====================
            MEMBER SUMMARY
        ===================== */}

        <section className="inmba-bank-member-card">
          <span className="inmba-bank-avatar">
            {firstName
              .charAt(0)
              .toUpperCase()}
          </span>

          <div>
            <p>
              KYC application for
            </p>

            <h2>
              {fullName}
            </h2>

            <span>
              Login ID:{" "}
              {loginId}
            </span>
          </div>

          <strong>
            Step 1 of 5
          </strong>
        </section>

        {formError && (
          <div
            className="inmba-bank-alert"
            role="alert"
          >
            <i
              className="fas fa-circle-exclamation"
              aria-hidden="true"
            ></i>

            <span>
              {formError}
            </span>
          </div>
        )}

        <div className="inmba-bank-layout">
          {/* =====================
              BANK FORM
          ===================== */}

          <form
            className="inmba-bank-form-card"
            onSubmit={
              handleSubmit
            }
            noValidate
          >
            <header className="inmba-bank-card-header">
              <span>
                <i
                  className="fas fa-building-columns"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <h2>
                  Account Information
                </h2>

                <p>
                  Enter the bank details exactly as shown in your
                  account records.
                </p>
              </div>
            </header>

            <div className="inmba-bank-form-group">
              <label htmlFor="bank-account-holder">
                Account Holder Name
                <span>
                  *
                </span>
              </label>

              <input
                id="bank-account-holder"
                type="text"
                name="account_holder"
                value={
                  formData.account_holder
                }
                onChange={
                  handleInputChange
                }
                placeholder="Enter account holder name"
                maxLength={150}
                autoComplete="name"
                disabled={
                  submitting
                }
                className={
                  getErrorText(
                    fieldErrors.account_holder
                  )
                    ? "inmba-bank-input-error"
                    : ""
                }
              />

              {getErrorText(
                fieldErrors.account_holder
              ) && (
                <small className="inmba-bank-field-error">
                  {getErrorText(
                    fieldErrors.account_holder
                  )}
                </small>
              )}
            </div>

            <div className="inmba-bank-form-row">
              <div className="inmba-bank-form-group">
                <label htmlFor="bank-name">
                  Bank Name
                  <span>
                    *
                  </span>
                </label>

                <input
                  id="bank-name"
                  type="text"
                  name="bank_name"
                  value={
                    formData.bank_name
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter bank name"
                  maxLength={150}
                  autoComplete="organization"
                  disabled={
                    submitting
                  }
                  className={
                    getErrorText(
                      fieldErrors.bank_name
                    )
                      ? "inmba-bank-input-error"
                      : ""
                  }
                />

                {getErrorText(
                  fieldErrors.bank_name
                ) && (
                  <small className="inmba-bank-field-error">
                    {getErrorText(
                      fieldErrors.bank_name
                    )}
                  </small>
                )}
              </div>

              <div className="inmba-bank-form-group">
                <label htmlFor="bank-branch-name">
                  Branch Name
                  <span>
                    *
                  </span>
                </label>

                <input
                  id="bank-branch-name"
                  type="text"
                  name="branch_name"
                  value={
                    formData.branch_name
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Enter branch name"
                  maxLength={150}
                  disabled={
                    submitting
                  }
                  className={
                    getErrorText(
                      fieldErrors.branch_name
                    )
                      ? "inmba-bank-input-error"
                      : ""
                  }
                />

                {getErrorText(
                  fieldErrors.branch_name
                ) && (
                  <small className="inmba-bank-field-error">
                    {getErrorText(
                      fieldErrors.branch_name
                    )}
                  </small>
                )}
              </div>
            </div>

            <div className="inmba-bank-form-row">
              <div className="inmba-bank-form-group">
                <label htmlFor="bank-account-number">
                  Account Number
                  <small>
                    Optional
                  </small>
                </label>

                <div className="inmba-bank-icon-input">
                  <i
                    className="fas fa-hashtag"
                    aria-hidden="true"
                  ></i>

                  <input
                    id="bank-account-number"
                    type="text"
                    name="account_number1"
                    value={
                      formData.account_number1
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Enter account number"
                    inputMode="numeric"
                    autoComplete="off"
                    disabled={
                      submitting
                    }
                    className={
                      getErrorText(
                        fieldErrors.account_number1
                      )
                        ? "inmba-bank-input-error"
                        : ""
                    }
                  />
                </div>

                {getErrorText(
                  fieldErrors.account_number1
                ) && (
                  <small className="inmba-bank-field-error">
                    {getErrorText(
                      fieldErrors.account_number1
                    )}
                  </small>
                )}
              </div>

              <div className="inmba-bank-form-group">
                <label htmlFor="bank-confirm-account-number">
                  Confirm Account Number
                  <small>
                    Optional
                  </small>
                </label>

                <div className="inmba-bank-icon-input">
                  <i
                    className="fas fa-circle-check"
                    aria-hidden="true"
                  ></i>

                  <input
                    id="bank-confirm-account-number"
                    type="text"
                    name="account_number2"
                    value={
                      formData.account_number2
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Re-enter account number"
                    inputMode="numeric"
                    autoComplete="off"
                    disabled={
                      submitting
                    }
                    className={
                      getErrorText(
                        fieldErrors.account_number2
                      )
                        ? "inmba-bank-input-error"
                        : ""
                    }
                  />
                </div>

                {getErrorText(
                  fieldErrors.account_number2
                ) && (
                  <small className="inmba-bank-field-error">
                    {getErrorText(
                      fieldErrors.account_number2
                    )}
                  </small>
                )}
              </div>
            </div>

            <div className="inmba-bank-form-group">
              <label htmlFor="bank-ifsc">
                IFSC Code
                <small>
                  Optional
                </small>
              </label>

              <div className="inmba-bank-icon-input">
                <i
                  className="fas fa-code"
                  aria-hidden="true"
                ></i>

                <input
                  id="bank-ifsc"
                  type="text"
                  name="ifsc"
                  value={
                    formData.ifsc
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Example: SBIN0001234"
                  maxLength={11}
                  autoComplete="off"
                  disabled={
                    submitting
                  }
                  className={
                    getErrorText(
                      fieldErrors.ifsc
                    )
                      ? "inmba-bank-input-error"
                      : ""
                  }
                />
              </div>

              {getErrorText(
                fieldErrors.ifsc
              ) && (
                <small className="inmba-bank-field-error">
                  {getErrorText(
                    fieldErrors.ifsc
                  )}
                </small>
              )}
            </div>

            {/* BANK PROOF */}

            <div className="inmba-bank-form-group">
              <label>
                Bank Proof
                <small>
                  Optional — JPG/PNG, maximum 5 MB
                </small>
              </label>

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="inmba-bank-hidden-input"
                onChange={
                  handleProofChange
                }
              />

              <button
                type="button"
                className={`inmba-bank-upload ${
                  getErrorText(
                    fieldErrors.bank_proof
                  )
                    ? "inmba-bank-upload-error"
                    : ""
                }`}
                onClick={
                  handleOpenProofInput
                }
                disabled={
                  submitting
                }
              >
                <div className="inmba-bank-upload-content">
                  <span>
                    <i
                      className="fas fa-cloud-arrow-up"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <div>
                    <strong>
                      {formData.bank_proof
                        ? formData.bank_proof.name
                        : proofPreview
                        ? "Bank proof available"
                        : "Upload bank proof"}
                    </strong>

                    <small>
                      Passbook, cancelled cheque or bank statement
                    </small>
                  </div>
                </div>

                {proofPreview && (
                  <div className="inmba-bank-proof-preview">
                    <img
                      src={
                        proofPreview
                      }
                      alt="Bank proof preview"
                    />

                    {formData.bank_proof && (
                      <span
                        role="button"
                        tabIndex="0"
                        aria-label="Remove newly selected bank proof"
                        onClick={
                          handleRemoveProof
                        }
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                              "Enter" ||
                            event.key ===
                              " "
                          ) {
                            handleRemoveProof(
                              event
                            );
                          }
                        }}
                      >
                        <i
                          className="fas fa-xmark"
                          aria-hidden="true"
                        ></i>
                      </span>
                    )}
                  </div>
                )}
              </button>

              {getErrorText(
                fieldErrors.bank_proof
              ) && (
                <small className="inmba-bank-field-error">
                  {getErrorText(
                    fieldErrors.bank_proof
                  )}
                </small>
              )}
            </div>

            <div className="inmba-bank-form-actions">
              <Link
                to="/payment"
                className="inmba-bank-secondary-button"
              >
                <i
                  className="fas fa-arrow-left"
                  aria-hidden="true"
                ></i>

                Payment
              </Link>

              <button
                type="submit"
                className="inmba-bank-primary-button"
                disabled={
                  submitting
                }
              >
                {submitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      aria-hidden="true"
                    ></span>

                    Saving Details...
                  </>
                ) : (
                  <>
                    Save and Continue

                    <i
                      className="fas fa-arrow-right"
                      aria-hidden="true"
                    ></i>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* =====================
              SIDE INFORMATION
          ===================== */}

          <aside className="inmba-bank-side-column">
            <section className="inmba-bank-help-card">
              <header>
                <span>
                  <i
                    className="fas fa-shield-halved"
                    aria-hidden="true"
                  ></i>
                </span>

                <div>
                  <h2>
                    Secure Bank Details
                  </h2>

                  <p>
                    Follow these instructions carefully.
                  </p>
                </div>
              </header>

              <ul>
                <li>
                  Enter the account holder name exactly as shown in
                  bank records.
                </li>

                <li>
                  Recheck the account number before continuing.
                </li>

                <li>
                  IFSC code contains 11 characters.
                </li>

                <li>
                  Upload only a clear JPG or PNG bank proof.
                </li>
              </ul>
            </section>

            <section className="inmba-bank-document-card">
              <span>
                <i
                  className="fas fa-file-shield"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <h3>
                  Accepted Proof
                </h3>

                <p>
                  Passbook front page, cancelled cheque or recent bank
                  statement.
                </p>
              </div>
            </section>

            <section className="inmba-bank-next-card">
              <p>
                Next KYC Step
              </p>

              <i
                className="fas fa-id-card"
                aria-hidden="true"
              ></i>

              <h3>
                Aadhaar and Address
              </h3>

              <span>
                After saving bank details, you will continue to Legal
                Entity verification.
              </span>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}