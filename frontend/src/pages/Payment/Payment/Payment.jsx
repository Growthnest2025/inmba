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
  useSearchParams,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  BACKEND_URL,
} from "../../../api/api";

import {
  useAuth,
} from "../../../context/AuthContext";

import {
  getPaymentDetails,
  submitMemberPayment,
  validatePaymentProof,
} from "../../../services/payment.service";

import {
  getApiErrorMessage,
  getFieldErrors,
} from "../../../utils/apiError";

import "./Payment.css";

/* =========================
   FORM INITIAL STATE
========================= */

const INITIAL_FORM_DATA = {
  payment_method: "",
  subscription_year: "",
  amount: "",
  transaction_id: "",
  payment_proof: null,
};

/* =========================
   PAYMENT METHODS
========================= */

const PAYMENT_METHODS = [
  {
    value: "Account",
    label: "Bank Account",
    description: "Transfer using bank account details.",
    icon: "fas fa-building-columns",
  },
  {
    value: "UPI",
    label: "UPI Payment",
    description: "Pay through any supported UPI application.",
    icon: "fas fa-mobile-screen-button",
  },
  {
    value: "QR",
    label: "Scan QR",
    description: "Scan the payment QR using your mobile.",
    icon: "fas fa-qrcode",
  },
];

/* =========================
   SUBSCRIPTION OPTIONS
========================= */

const SUBSCRIPTION_OPTIONS = [
  {
    value: "1",
    label: "1 Year",
  },
  {
    value: "2",
    label: "2 Years",
  },
  {
    value: "3",
    label: "3 Years",
  },
];

/* =========================
   COMMON HELPERS
========================= */

const asObject = (
  value
) => {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
};

const toText = (
  value,
  fallback = ""
) => {
  const normalizedValue =
    String(
      value ?? ""
    ).trim();

  return normalizedValue || fallback;
};

const toNumber = (
  value
) => {
  const parsedValue =
    Number(value);

  return Number.isFinite(
    parsedValue
  )
    ? parsedValue
    : 0;
};

/* =========================
   CURRENCY FORMATTER
========================= */

const formatCurrency = (
  value
) => {
  const amount =
    toNumber(value);

  if (amount <= 0) {
    return "Not provided";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }
  ).format(amount);
};

/* =========================
   DATE FORMATTER
========================= */

const formatDate = (
  value
) => {
  if (!value) {
    return "Not available";
  }

  const normalizedValue =
    typeof value === "string"
      ? value.replace(
          " ",
          "T"
        )
      : value;

  const date =
    new Date(
      normalizedValue
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return toText(
      value,
      "Not available"
    );
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
};

/* =========================
   ASSET URL
========================= */

const getAssetUrl = (
  value,
  fallbackPath = ""
) => {
  const filePath =
    toText(
      value,
      fallbackPath
    );

  if (!filePath) {
    return "";
  }

  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://") ||
    filePath.startsWith("data:") ||
    filePath.startsWith("blob:")
  ) {
    return filePath;
  }

  if (
    filePath.startsWith("/")
  ) {
    return `${BACKEND_URL}${filePath}`;
  }

  return `${BACKEND_URL}/${filePath}`;
};

/* =========================
   PAYMENT PROOF URL
========================= */

const getPaymentProofUrl = (
  payment
) => {
  const proofValue =
    toText(
      payment?.payment_proof_url ??
        payment?.paymentProofUrl ??
        payment?.payment_proof ??
        payment?.paymentProof,
      ""
    );

  if (!proofValue) {
    return "";
  }

  if (
    proofValue.startsWith("http://") ||
    proofValue.startsWith("https://") ||
    proofValue.startsWith("data:") ||
    proofValue.startsWith("blob:")
  ) {
    return proofValue;
  }

  if (
    proofValue.startsWith("/")
  ) {
    return `${BACKEND_URL}${proofValue}`;
  }

  if (
    proofValue.startsWith("static/")
  ) {
    return `${BACKEND_URL}/${proofValue}`;
  }

  return `${BACKEND_URL}/static/uploads/${encodeURIComponent(
    proofValue
  )}`;
};

/* =========================
   STATUS NORMALIZER
========================= */

const getPaymentStatus = (
  value
) => {
  const status =
    toText(
      value,
      "pending"
    ).toLowerCase();

  if (
    status === "approved" ||
    status === "paid"
  ) {
    return {
      value: "approved",
      label: "Approved",
      title: "Payment Approved",
      description:
        "Your payment has been verified and approved by INMBA.",
      icon: "fas fa-circle-check",
    };
  }

  if (
    status === "rejected"
  ) {
    return {
      value: "rejected",
      label: "Rejected",
      title: "Payment Rejected",
      description:
        "Your payment was not approved. Check the details and submit again.",
      icon: "fas fa-circle-xmark",
    };
  }

  if (
    status === "submitted"
  ) {
    return {
      value: "submitted",
      label: "Submitted",
      title: "Payment Submitted",
      description:
        "Your payment has been submitted and is waiting for verification.",
      icon: "fas fa-clock",
    };
  }

  return {
    value: "pending",
    label: "Pending",
    title: "Payment Pending",
    description:
      "Complete the payment information and submit the proof for verification.",
    icon: "fas fa-clock",
  };
};

/* =========================
   FIELD ERROR HELPER
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
   INTERNAL ROUTE NORMALIZER
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
   PAYMENT PAGE
========================= */

export default function Payment() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] =
    useSearchParams();

  const civilianPlan =
    useMemo(
      () => {
        const plan =
          String(
            searchParams.get(
              "plan"
            ) || ""
          ).trim();

        return [
          "300",
          "1500",
        ].includes(
          plan
        )
          ? plan
          : "";
      },
      [
        searchParams,
      ]
    );

  const civilianBaseAmount =
    useMemo(
      () => {
        const amount =
          Number(
            civilianPlan
          );

        return Number.isFinite(
          amount
        )
          ? amount
          : 0;
      },
      [
        civilianPlan,
      ]
    );

  const getCivilianAmountForYears =
    useCallback(
      (
        years
      ) => {
        const yearCount =
          Number(
            years
          );

        if (
          !civilianBaseAmount ||
          !Number.isFinite(
            yearCount
          ) ||
          yearCount <= 0
        ) {
          return "";
        }

        return String(
          civilianBaseAmount *
            yearCount
        );
      },
      [
        civilianBaseAmount,
      ]
    );

  const fileInputRef =
    useRef(null);

  const {
    member:
      sessionMember,

    clearMemberSession,
    checkMemberSession,
  } =
    useAuth();

  const [
    paymentData,
    setPaymentData,
  ] =
    useState({
      member: {},
      payment: {},
      paymentConfig: {},
    });

  const [
    formData,
    setFormData,
  ] =
    useState({
      ...INITIAL_FORM_DATA,
    });

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
    error,
    setError,
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

  const [
    proofPreview,
    setProofPreview,
  ] =
    useState("");

  const [
    qrImageError,
    setQrImageError,
  ] =
    useState(false);

  /* =========================
     LOAD PAYMENT DETAILS

     GET /payment
  ========================= */

  const loadPaymentDetails =
    useCallback(
      async (
        {
          signal,
        } = {}
      ) => {
        try {
          setLoading(true);
          setError("");

          const result =
            await getPaymentDetails({
              signal,
            });

          const member =
            asObject(
              result.member
            );

          const payment =
            asObject(
              result.payment
            );

          const paymentConfig =
            asObject(
              result.paymentConfig
            );

          setPaymentData({
            member,
            payment,
            paymentConfig,
          });

          setFormData({
            payment_method:
              toText(
                payment.payment_method ??
                  payment.paymentMethod,
                ""
              ),

            subscription_year:
              toText(
                payment.subscription_year ??
                  payment.subscriptionYear,
                ""
              ),

            amount:
              civilianPlan
                ? getCivilianAmountForYears(
                    toText(
                      payment.subscription_year ??
                        payment.subscriptionYear,
                      ""
                    )
                  )
                : toText(
                    payment.amount,
                    ""
                  ),

            transaction_id:
              toText(
                payment.transaction_id ??
                  payment.transactionId,
                ""
              ),

            payment_proof: null,
          });

          setProofPreview(
            getPaymentProofUrl(
              payment
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

          if (cancelled) {
            return;
          }

          const statusCode =
            Number(
              requestError?.response?.status ||
                requestError?.statusCode ||
                0
            );

          if (
            statusCode === 401 ||
            requestError?.sessionExpired
          ) {
            clearMemberSession();

            navigate(
              "/login",
              {
                replace: true,

                state: {
                  from: "/payment",

                  error:
                    "Your session has expired. Please login again.",
                },
              }
            );

            return;
          }

          console.error(
            "Payment API Error:",
            requestError
          );

          setError(
            getApiErrorMessage(
              requestError,
              "Unable to load payment information."
            )
          );
        } finally {
          if (!signal?.aborted) {
            setLoading(false);
          }
        }
      },
      [
        clearMemberSession,
        navigate,
        civilianPlan,
        getCivilianAmountForYears,
      ]
    );

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(() => {
    const controller =
      new AbortController();

    loadPaymentDetails({
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [loadPaymentDetails]);

  /* =========================
     PREVIEW CLEANUP
  ========================= */

  useEffect(() => {
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
  }, [proofPreview]);

  /* =========================
     MERGED MEMBER
  ========================= */

  const member =
    useMemo(
      () => ({
        ...asObject(
          sessionMember
        ),

        ...asObject(
          paymentData.member
        ),
      }),
      [
        sessionMember,
        paymentData.member,
      ]
    );

  const payment =
    asObject(
      paymentData.payment
    );

  const paymentConfig =
    asObject(
      paymentData.paymentConfig
    );

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
    `${firstName} ${lastName}`.trim();

  const loginId =
    toText(
      member.login_id ??
        member.loginId,
      "Not available"
    );

  const membershipType =
    toText(
      member.membership_type ??
        member.membershipType,
      "INMBA Member"
    );

  const paymentStatus =
    getPaymentStatus(
      payment.payment_status ??
        payment.paymentStatus ??
        member.payment_status ??
        member.paymentStatus
    );

  const isApproved =
    paymentStatus.value ===
    "approved";

  const existingSubmission =
    Boolean(
      toText(
        payment.payment_method,
        ""
      ) ||
        toNumber(
          payment.amount
        ) > 0 ||
        toText(
          payment.transaction_id,
          ""
        ) ||
        getPaymentProofUrl(
          payment
        )
    );

  /* =========================
     BANK / UPI DETAILS
  ========================= */

  const bankAccountNumber =
    toText(
      paymentConfig.account_number ??
        paymentConfig.accountNumber,
      "70340200001467"
    );

  const bankIfsc =
    toText(
      paymentConfig.ifsc ??
        paymentConfig.ifsc_code ??
        paymentConfig.ifscCode,
      "BARB0VJPACO"
    );

  const upiId =
    toText(
      paymentConfig.upi_id ??
        paymentConfig.upiId,
      "robertsonraja@barodampay"
    );

  const paymentQrUrl =
    getAssetUrl(
      paymentConfig.qr_image_url ??
        paymentConfig.qrImageUrl ??
        paymentConfig.qr_image,
      "/static/images/qr.jpeg"
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

    setFormData(
      (
        previousData
      ) => {
        const nextData = {
          ...previousData,
          [name]: value,
        };

        if (
          civilianPlan &&
          name ===
            "subscription_year"
        ) {
          nextData.amount =
            getCivilianAmountForYears(
              value
            );
        }

        return nextData;
      }
    );

    setFormError("");

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
     PAYMENT METHOD CHANGE
  ========================= */

  const handlePaymentMethodChange = (
    method
  ) => {
    setFormData(
      (
        previousData
      ) => ({
        ...previousData,
        payment_method: method,
      })
    );

    setFieldErrors(
      (
        previousErrors
      ) => ({
        ...previousErrors,
        payment_method: "",
      })
    );

    setFormError("");
  };

  /* =========================
     OPEN PROOF INPUT
  ========================= */

  const handleOpenProofInput =
    () => {
      if (
        submitting ||
        isApproved
      ) {
        return;
      }

      fileInputRef.current?.click();
    };

  /* =========================
     PAYMENT PROOF CHANGE
  ========================= */

  const handleProofChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const validation =
      validatePaymentProof(
        file
      );

    if (
      !validation.valid
    ) {
      toast.error(
        validation.error
      );

      setFieldErrors(
        (
          previousErrors
        ) => ({
          ...previousErrors,
          payment_proof:
            validation.error,
        })
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
        payment_proof: file,
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
        payment_proof: "",
      })
    );
  };

  /* =========================
     REMOVE PROOF
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
        payment_proof: null,
      })
    );

    setProofPreview("");

    setFieldErrors(
      (
        previousErrors
      ) => ({
        ...previousErrors,
        payment_proof: "",
      })
    );
  };

  /* =========================
     FORM VALIDATION
  ========================= */

  const validateForm = () => {
    const errors = {};

    if (
      !formData.payment_method
    ) {
      errors.payment_method =
        "Select a payment method.";
    }

    if (
      !formData.subscription_year
    ) {
      errors.subscription_year =
        "Select a subscription plan.";
    }

    const amount =
      Number(
        formData.amount
      );

    if (
      !formData.amount
    ) {
      errors.amount =
        "Payment amount is required.";
    } else if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      errors.amount =
        "Enter a valid amount greater than zero.";
    }

    if (
      formData.payment_proof
    ) {
      const proofValidation =
        validatePaymentProof(
          formData.payment_proof
        );

      if (
        !proofValidation.valid
      ) {
        errors.payment_proof =
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
        "Please complete the required payment information."
      );

      return false;
    }

    return true;
  };

  /* =========================
     SUBMIT PAYMENT

     POST /payment_submit
  ========================= */

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        submitting ||
        isApproved
      ) {
        return;
      }

      setFormError("");

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
        setSubmitting(true);
        setFieldErrors({});

        const result =
          await submitMemberPayment({
            payment_method:
              formData.payment_method,

            subscription_year:
              formData.subscription_year,

            amount:
              formData.amount,

            transaction_id:
              formData.transaction_id,

            payment_proof:
              formData.payment_proof,
          });

        if (!civilianPlan) {
          await checkMemberSession();
        }

        toast.success(
          result?.response?.message ||
            "Payment submitted successfully."
        );

        /* =====================================================
           CIVILIAN PAYMENT -> ACKNOWLEDGEMENT

           Civilian payment must always open the acknowledgement
           page before the user continues to admin-approval status.
        ===================================================== */

        if (
          civilianPlan
        ) {
          const acknowledgementToken =
            toText(
              result?.token ??
                result?.response?.token ??
                result?.data?.token ??
                result?.response?.data?.token,
              ""
            );

          if (
            acknowledgementToken
          ) {
            navigate(
              `/civilian-acknowledgement/${encodeURIComponent(
                acknowledgementToken
              )}`,
              {
                replace: true,
              }
            );

            return;
          }

          /*
             Some backend versions may already return the complete
             Civilian acknowledgement route in nextRoute.
          */

          const civilianResponseRoute =
            getInternalRoute(
              result?.nextRoute
            );

          if (
            civilianResponseRoute.startsWith(
              "/civilian-acknowledgement/"
            )
          ) {
            navigate(
              civilianResponseRoute,
              {
                replace: true,
              }
            );

            return;
          }

          console.error(
            "Civilian acknowledgement token missing:",
            result
          );

          setFormError(
            "Payment submitted successfully, but the acknowledgement page could not be opened. Please contact INMBA support."
          );

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });

          return;
        }

        /* =====================================================
           PROFESSIONAL / COMMERCIAL EXISTING FLOW
        ===================================================== */

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

        if (
          result.token
        ) {
          navigate(
            `/bank_form/${encodeURIComponent(
              result.token
            )}`
          );

          return;
        }

        navigate(
          "/dashboard"
        );
      } catch (
        submitError
      ) {
        const statusCode =
          Number(
            submitError?.response?.status ||
              submitError?.statusCode ||
              0
          );

        if (
          statusCode === 401 ||
          submitError?.sessionExpired
        ) {
          clearMemberSession();

          navigate(
            "/login",
            {
              replace: true,

              state: {
                from: "/payment",

                error:
                  "Your session has expired. Please login again.",
              },
            }
          );

          return;
        }

        const apiFieldErrors =
          getFieldErrors(
            submitError
          );

        setFieldErrors(
          asObject(
            apiFieldErrors
          )
        );

        setFormError(
          getApiErrorMessage(
            submitError,
            "Unable to submit payment."
          )
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } finally {
        setSubmitting(false);
      }
    };

  /* =========================
     LOADING STATE
  ========================= */

  if (loading) {
    return (
      <main className="inmba-payment-page">
        <div className="inmba-payment-state">
          <div
            className="spinner-border"
            role="status"
            aria-label="Loading payment page"
          ></div>

          <h1>
            Loading Payment
          </h1>

          <p>
            Preparing your membership payment information.
          </p>
        </div>
      </main>
    );
  }

  /* =========================
     ERROR STATE
  ========================= */

  if (error) {
    return (
      <main className="inmba-payment-page">
        <div className="inmba-payment-state inmba-payment-error-state">
          <div className="inmba-payment-state-icon">
            <i
              className="fas fa-credit-card"
              aria-hidden="true"
            ></i>
          </div>

          <h1>
            Payment Page Unavailable
          </h1>

          <p>
            {error}
          </p>

          <div className="inmba-payment-state-actions">
            <Link
              to="/dashboard"
              className="inmba-payment-secondary-button"
            >
              Dashboard
            </Link>

            <button
              type="button"
              className="inmba-payment-primary-button"
              onClick={() =>
                loadPaymentDetails()
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
    <main className="inmba-payment-page">
      <div className="inmba-payment-container">
        {/* =====================
            PAGE HEADER
        ===================== */}

        <header className="inmba-payment-header">
          <div>
            <p>
              INMBA Member Portal
            </p>

            <h1>
              Membership Payment
            </h1>

            <span>
              Complete your payment and upload the transaction proof.
            </span>
          </div>

          <Link
            to="/dashboard"
            className="inmba-payment-header-button"
          >
            <i
              className="fas fa-arrow-left"
              aria-hidden="true"
            ></i>

            Dashboard
          </Link>
        </header>

        {/* =====================
            MEMBER SUMMARY
        ===================== */}

        <section className="inmba-payment-member-summary">
          <div className="inmba-payment-member-avatar">
            {firstName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <p>
              Payment for
            </p>

            <h2>
              {fullName}
            </h2>

            <span>
              Login ID:{" "}
              {loginId}
            </span>
          </div>

          <div className="inmba-payment-membership-badge">
            <i
              className="fas fa-crown"
              aria-hidden="true"
            ></i>

            {membershipType}
          </div>
        </section>

        {/* =====================
            PAYMENT STATUS
        ===================== */}

        <section
          className={`inmba-payment-status-card inmba-payment-status-${paymentStatus.value}`}
        >
          <div className="inmba-payment-status-icon">
            <i
              className={
                paymentStatus.icon
              }
              aria-hidden="true"
            ></i>
          </div>

          <div>
            <p>
              Current Payment Status
            </p>

            <h2>
              {paymentStatus.title}
            </h2>

            <span>
              {paymentStatus.description}
            </span>
          </div>

          <strong>
            {paymentStatus.label}
          </strong>
        </section>

        {formError && (
          <div
            className="inmba-payment-alert"
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

        {/* =====================
            EXISTING PAYMENT
        ===================== */}

        {existingSubmission && (
          <section className="inmba-payment-existing-card">
            <header>
              <div>
                <i
                  className="fas fa-receipt"
                  aria-hidden="true"
                ></i>
              </div>

              <div>
                <h2>
                  Submitted Payment Details
                </h2>

                <p>
                  Your previously saved payment information.
                </p>
              </div>
            </header>

            <div className="inmba-payment-existing-grid">
              <div>
                <span>
                  Payment Method
                </span>

                <strong>
                  {toText(
                    payment.payment_method,
                    "Not provided"
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Subscription
                </span>

                <strong>
                  {payment.subscription_year
                    ? `${payment.subscription_year} Year${
                        String(
                          payment.subscription_year
                        ) === "1"
                          ? ""
                          : "s"
                      }`
                    : "Not provided"}
                </strong>
              </div>

              <div>
                <span>
                  Amount
                </span>

                <strong>
                  {formatCurrency(
                    payment.amount
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Transaction ID
                </span>

                <strong>
                  {toText(
                    payment.transaction_id,
                    "Not provided"
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Submitted Date
                </span>

                <strong>
                  {formatDate(
                    payment.payment_date ??
                      payment.updated_at ??
                      payment.created_at
                  )}
                </strong>
              </div>

              {getPaymentProofUrl(
                payment
              ) && (
                <div>
                  <span>
                    Payment Proof
                  </span>

                  <a
                    href={getPaymentProofUrl(
                      payment
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Proof
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="inmba-payment-main-grid">
          {/* =====================
              PAYMENT FORM
          ===================== */}

          <form
            className="inmba-payment-form-card"
            onSubmit={
              handleSubmit
            }
            noValidate
          >
            <header className="inmba-payment-card-header">
              <div>
                <i
                  className="fas fa-credit-card"
                  aria-hidden="true"
                ></i>
              </div>

              <div>
                <h2>
                  Complete Payment
                </h2>

                <p>
                  Enter the transaction details correctly.
                </p>
              </div>
            </header>

            {/* PAYMENT METHOD */}

            <div className="inmba-payment-form-group">
              <label>
                Select Payment Method
                <span>
                  *
                </span>
              </label>

              <div className="inmba-payment-method-grid">
                {PAYMENT_METHODS.map(
                  (
                    method
                  ) => {
                    const selected =
                      formData.payment_method ===
                      method.value;

                    return (
                      <button
                        key={
                          method.value
                        }
                        type="button"
                        className={`inmba-payment-method ${
                          selected
                            ? "inmba-payment-method-selected"
                            : ""
                        }`}
                        onClick={() =>
                          handlePaymentMethodChange(
                            method.value
                          )
                        }
                        disabled={
                          submitting ||
                          isApproved
                        }
                      >
                        <span>
                          <i
                            className={
                              method.icon
                            }
                            aria-hidden="true"
                          ></i>
                        </span>

                        <div>
                          <strong>
                            {method.label}
                          </strong>

                          <small>
                            {method.description}
                          </small>
                        </div>

                        <i
                          className={
                            selected
                              ? "fas fa-circle-check"
                              : "far fa-circle"
                          }
                          aria-hidden="true"
                        ></i>
                      </button>
                    );
                  }
                )}
              </div>

              {getErrorText(
                fieldErrors.payment_method
              ) && (
                <small className="inmba-payment-field-error">
                  {getErrorText(
                    fieldErrors.payment_method
                  )}
                </small>
              )}
            </div>

            {/* METHOD INFORMATION */}

            {formData.payment_method && (
              <div className="inmba-payment-selected-details">
                {formData.payment_method ===
                  "Account" && (
                  <>
                    <div className="inmba-payment-selected-icon">
                      <i
                        className="fas fa-building-columns"
                        aria-hidden="true"
                      ></i>
                    </div>

                    <div>
                      <p>
                        Bank Transfer Details
                      </p>

                      <span>
                        Account Number
                      </span>

                      <strong>
                        {bankAccountNumber}
                      </strong>

                      <span>
                        IFSC Code
                      </span>

                      <strong>
                        {bankIfsc}
                      </strong>
                    </div>
                  </>
                )}

                {formData.payment_method ===
                  "UPI" && (
                  <>
                    <div className="inmba-payment-selected-icon">
                      <i
                        className="fas fa-mobile-screen-button"
                        aria-hidden="true"
                      ></i>
                    </div>

                    <div>
                      <p>
                        UPI Payment Details
                      </p>

                      <span>
                        UPI ID
                      </span>

                      <strong>
                        {upiId}
                      </strong>
                    </div>
                  </>
                )}

                {formData.payment_method ===
                  "QR" && (
                  <div className="inmba-payment-qr-details">
                    <div>
                      <p>
                        Scan and Pay
                      </p>

                      <span>
                        Scan using any UPI-supported payment application.
                      </span>
                    </div>

                    {!qrImageError &&
                    paymentQrUrl ? (
                      <img
                        src={
                          paymentQrUrl
                        }
                        alt="INMBA payment QR code"
                        onError={() =>
                          setQrImageError(
                            true
                          )
                        }
                      />
                    ) : (
                      <div className="inmba-payment-qr-placeholder">
                        <i
                          className="fas fa-qrcode"
                          aria-hidden="true"
                        ></i>

                        <span>
                          Payment QR
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SUBSCRIPTION */}

            <div className="inmba-payment-form-row">
              <div className="inmba-payment-form-group">
                <label htmlFor="payment-subscription-year">
                  Subscription Plan
                  <span>
                    *
                  </span>
                </label>

                <select
                  id="payment-subscription-year"
                  name="subscription_year"
                  value={
                    formData.subscription_year
                  }
                  onChange={
                    handleInputChange
                  }
                  disabled={
                    submitting ||
                    isApproved
                  }
                  className={
                    getErrorText(
                      fieldErrors.subscription_year
                    )
                      ? "inmba-payment-input-error"
                      : ""
                  }
                >
                  <option value="">
                    Select Plan
                  </option>

                  {SUBSCRIPTION_OPTIONS.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>

                {getErrorText(
                  fieldErrors.subscription_year
                ) && (
                  <small className="inmba-payment-field-error">
                    {getErrorText(
                      fieldErrors.subscription_year
                    )}
                  </small>
                )}
              </div>

              <div className="inmba-payment-form-group">
                <label htmlFor="payment-amount">
                  Amount
                  <span>
                    *
                  </span>
                </label>

                <div className="inmba-payment-amount-input">
                  <span>
                    ₹
                  </span>

                  <input
                    id="payment-amount"
                    type="number"
                    name="amount"
                    value={
                      formData.amount
                    }
                    onChange={
                      handleInputChange
                    }
                    readOnly={
                      Boolean(
                        civilianPlan
                      )
                    }
                    min="1"
                    step="0.01"
                    placeholder="Enter amount"
                    inputMode="decimal"
                    disabled={
                      submitting ||
                      isApproved
                    }
                    className={
                      getErrorText(
                        fieldErrors.amount
                      )
                        ? "inmba-payment-input-error"
                        : ""
                    }
                  />
                </div>

                {getErrorText(
                  fieldErrors.amount
                ) && (
                  <small className="inmba-payment-field-error">
                    {getErrorText(
                      fieldErrors.amount
                    )}
                  </small>
                )}
              </div>
            </div>

            {/* TRANSACTION ID */}

            <div className="inmba-payment-form-group">
              <label htmlFor="payment-transaction-id">
                Transaction ID
                <small>
                  Optional
                </small>
              </label>

              <input
                id="payment-transaction-id"
                type="text"
                name="transaction_id"
                value={
                  formData.transaction_id
                }
                onChange={
                  handleInputChange
                }
                placeholder="Enter payment transaction ID"
                maxLength={150}
                disabled={
                  submitting ||
                  isApproved
                }
                className={
                  getErrorText(
                    fieldErrors.transaction_id
                  )
                    ? "inmba-payment-input-error"
                    : ""
                }
              />

              {getErrorText(
                fieldErrors.transaction_id
              ) && (
                <small className="inmba-payment-field-error">
                  {getErrorText(
                    fieldErrors.transaction_id
                  )}
                </small>
              )}
            </div>

            {/* PROOF UPLOAD */}

            <div className="inmba-payment-form-group">
              <label>
                Payment Proof
                <small>
                  JPG / PNG, maximum 1 MB
                </small>
              </label>

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="inmba-payment-hidden-input"
                onChange={
                  handleProofChange
                }
              />

              <button
                type="button"
                className={`inmba-payment-upload-box ${
                  getErrorText(
                    fieldErrors.payment_proof
                  )
                    ? "inmba-payment-upload-error"
                    : ""
                }`}
                onClick={
                  handleOpenProofInput
                }
                disabled={
                  submitting ||
                  isApproved
                }
              >
                <div className="inmba-payment-upload-content">
                  <span>
                    <i
                      className="fas fa-cloud-arrow-up"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <div>
                    <strong>
                      {formData.payment_proof
                        ? formData.payment_proof.name
                        : proofPreview
                        ? "Payment proof selected"
                        : "Upload payment screenshot"}
                    </strong>

                    <small>
                      Click here to choose a JPG or PNG image
                    </small>
                  </div>
                </div>

                {proofPreview && (
                  <div className="inmba-payment-proof-preview">
                    <img
                      src={
                        proofPreview
                      }
                      alt="Payment proof preview"
                    />

                    {!isApproved && (
                      <span
                        role="button"
                        tabIndex="0"
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
                        aria-label="Remove payment proof"
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
                fieldErrors.payment_proof
              ) && (
                <small className="inmba-payment-field-error">
                  {getErrorText(
                    fieldErrors.payment_proof
                  )}
                </small>
              )}
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              className="inmba-payment-submit-button"
              disabled={
                submitting ||
                isApproved
              }
            >
              {submitting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    aria-hidden="true"
                  ></span>

                  Submitting Payment...
                </>
              ) : isApproved ? (
                <>
                  <i
                    className="fas fa-circle-check"
                    aria-hidden="true"
                  ></i>

                  Payment Approved
                </>
              ) : (
                <>
                  <i
                    className="fas fa-shield-halved"
                    aria-hidden="true"
                  ></i>

                  Confirm Payment
                </>
              )}
            </button>

            <p className="inmba-payment-verification-note">
              <i
                className="fas fa-clock"
                aria-hidden="true"
              ></i>

              Payment will be verified by the admin within 24 hours.
            </p>
          </form>

          {/* =====================
              PAYMENT HELP
          ===================== */}

          <aside className="inmba-payment-side-column">
            <section className="inmba-payment-help-card">
              <header>
                <span>
                  <i
                    className="fas fa-shield-halved"
                    aria-hidden="true"
                  ></i>
                </span>

                <div>
                  <h2>
                    Secure Payment
                  </h2>

                  <p>
                    Follow the steps before submitting.
                  </p>
                </div>
              </header>

              <div className="inmba-payment-help-steps">
                <article>
                  <span>
                    1
                  </span>

                  <div>
                    <h3>
                      Select Method
                    </h3>

                    <p>
                      Choose Account, UPI or QR payment.
                    </p>
                  </div>
                </article>

                <article>
                  <span>
                    2
                  </span>

                  <div>
                    <h3>
                      Complete Payment
                    </h3>

                    <p>
                      Transfer the correct membership amount.
                    </p>
                  </div>
                </article>

                <article>
                  <span>
                    3
                  </span>

                  <div>
                    <h3>
                      Upload Proof
                    </h3>

                    <p>
                      Add a readable payment screenshot.
                    </p>
                  </div>
                </article>

                <article>
                  <span>
                    4
                  </span>

                  <div>
                    <h3>
                      Admin Verification
                    </h3>

                    <p>
                      Wait for payment review and approval.
                    </p>
                  </div>
                </article>
              </div>
            </section>

            <section className="inmba-payment-security-card">
              <span>
                <i
                  className="fas fa-lock"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <h3>
                  Protected Information
                </h3>

                <p>
                  Your payment information is submitted through your
                  authenticated member session.
                </p>
              </div>
            </section>

            <section className="inmba-payment-support-card">
              <i
                className="fas fa-headset"
                aria-hidden="true"
              ></i>

              <h3>
                Need Payment Help?
              </h3>

              <p>
                Contact INMBA support when your payment is not updated
                after verification.
              </p>

              <Link to="/contact">
                Contact Support
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}