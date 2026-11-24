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
import { toText, asObject, toNumber } from "../../../utils/commonHelpers";
import PaymentDetailsCard from "../../../components/PaymentDetailsCard/PaymentDetailsCard";
import RazorpayCard from "../../../components/RazorpayCheckout/RazorpayCard";

/* =========================
   FORM INITIAL STATE
========================= */

const INITIAL_FORM_DATA = {
  payment_method: "QR",
  subscription_year: "1",
  selected_plan_option: "299_1",
  amount: "299",
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
    value: "299_1",
    label: "₹299 — 1 Year (Network Member)",
    amount: "299",
    years: "1",
  },
  {
    value: "299_2",
    label: "₹598 — 2 Years (Network Member)",
    amount: "598",
    years: "2",
  },
  {
    value: "299_3",
    label: "₹897 — 3 Years (Network Member)",
    amount: "897",
    years: "3",
  },
  {
    value: "2999_1",
    label: "₹2,999 — 1 Year (Royalty Member)",
    amount: "2999",
    years: "1",
  },
  {
    value: "2999_2",
    label: "₹5,998 — 2 Years (Royalty Member)",
    amount: "5998",
    years: "2",
  },
  {
    value: "2999_3",
    label: "₹8,997 — 3 Years (Royalty Member)",
    amount: "8997",
    years: "3",
  },
];

/* =========================
   COMMON HELPERS
========================= */

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
          "299",
          "2999",
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
    useState(() => ({
      ...INITIAL_FORM_DATA,
      subscription_year: "1",
      selected_plan_option: civilianPlan === "2999" ? "2999_1" : "299_1",
      amount: civilianPlan === "2999" ? "2999" : "299",
    }));

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

          const existingYear = toText(
            payment.subscription_year ??
              payment.subscriptionYear,
            ""
          ) || "1";

          let defaultPlan = "299_1";
          let defaultAmount = "299";
          let defaultYear = ["1", "2", "3"].includes(existingYear) ? existingYear : "1";

          if (civilianPlan === "2999") {
            defaultPlan = `2999_${defaultYear}`;
            defaultAmount = String(2999 * Number(defaultYear));
          } else if (civilianPlan === "299") {
            defaultPlan = `299_${defaultYear}`;
            defaultAmount = String(299 * Number(defaultYear));
          } else if (payment.amount) {
            defaultAmount = String(payment.amount);
            const match = SUBSCRIPTION_OPTIONS.find((o) => o.amount === defaultAmount);
            if (match) {
              defaultPlan = match.value;
              defaultYear = match.years;
            }
          }

          setFormData({
            payment_method:
              toText(
                payment.payment_method ??
                  payment.paymentMethod,
                "QR"
              ) || "QR",

            subscription_year: defaultYear,

            selected_plan_option: defaultPlan,

            amount: defaultAmount,

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
      "hprabha785@oksbi"
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
          name === "subscription_year" ||
          name === "selected_plan_option"
        ) {
          const selected = SUBSCRIPTION_OPTIONS.find(
            (opt) => opt.value === value || opt.amount === value
          );
          if (selected) {
            nextData.selected_plan_option = selected.value;
            nextData.subscription_year = selected.years;
            nextData.amount = selected.amount;
          } else if (value === "1" || value === "2" || value === "3") {
            nextData.subscription_year = value;
            const isRoyalty =
              civilianPlan === "2999" ||
              nextData.selected_plan_option?.startsWith("2999") ||
              Number(nextData.amount) >= 2999;
            const baseRate = isRoyalty ? 2999 : 299;
            nextData.amount = String(baseRate * Number(value));
            nextData.selected_plan_option = `${baseRate}_${value}`;
          }
        } else if (name === "amount") {
          const cleanAmt = String(value).trim();
          const match = SUBSCRIPTION_OPTIONS.find(
            (opt) => opt.amount === cleanAmt
          );
          if (match) {
            nextData.selected_plan_option = match.value;
            nextData.subscription_year = match.years;
          }
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
        subscription_year: "",
        amount: "",
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

  const handleProofChange = async (
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

    // Instant client-side check if same screenshot file was already submitted
    if (window.crypto && window.crypto.subtle) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const fileHashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

        const storedHashes = JSON.parse(
          sessionStorage.getItem("inmba_submitted_proof_hashes") || "[]"
        );
        if (storedHashes.includes(fileHashHex)) {
          const errorMsg =
            "Invalid payment proof: Same screenshot cannot be uploaded again. This payment proof has already been submitted.";
          toast.error(errorMsg);
          setFieldErrors((prev) => ({
            ...prev,
            payment_proof: errorMsg,
          }));
          setFormError(errorMsg);
          return;
        }
      } catch {}
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

    if (!formData.payment_method) {
      formData.payment_method = "QR";
    }

    if (!formData.subscription_year) {
      formData.subscription_year = "1";
    }

    const VALID_PLAN_AMOUNTS = [299, 598, 897, 2999, 5998, 8997];
    const numAmt = Number(formData.amount);
    if (!formData.amount || !VALID_PLAN_AMOUNTS.includes(numAmt)) {
      errors.amount =
        "Invalid payment amount. Only official membership plan fees (₹299, ₹598, ₹897 for Network Member or ₹2,999, ₹5,998, ₹8,997 for Royalty Member) are accepted.";
    }

    if (formData.payment_proof) {
      const proofValidation = validatePaymentProof(
        formData.payment_proof
      );

      if (!proofValidation.valid) {
        errors.payment_proof = proofValidation.error;
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFormError(
        Object.values(errors).join(" ") || "Please complete the required payment information."
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
              formData.payment_method || "QR",

            subscription_year:
              formData.subscription_year || "1",

            amount:
              formData.amount || "299",

            transaction_id:
              formData.transaction_id,

            payment_proof:
              formData.payment_proof,
          });

        if (!civilianPlan) {
          await checkMemberSession();
        }

        // Cache submitted proof hash in sessionStorage so re-uploading the same file immediately shows invalid
        if (formData.payment_proof && window.crypto && window.crypto.subtle) {
          try {
            const arrayBuffer = await formData.payment_proof.arrayBuffer();
            const hashBuffer = await window.crypto.subtle.digest("SHA-256", arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const fileHashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
            const stored = JSON.parse(
              sessionStorage.getItem("inmba_submitted_proof_hashes") || "[]"
            );
            if (!stored.includes(fileHashHex)) {
              stored.push(fileHashHex);
              sessionStorage.setItem("inmba_submitted_proof_hashes", JSON.stringify(stored));
            }
          } catch {}
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

        const rawErrorMessage = getApiErrorMessage(
          submitError,
          "Unable to submit payment."
        );

        if (
          statusCode === 409 ||
          statusCode === 422 ||
          rawErrorMessage.toLowerCase().includes("same screenshot") ||
          rawErrorMessage.toLowerCase().includes("duplicate") ||
          rawErrorMessage.toLowerCase().includes("already been submitted") ||
          rawErrorMessage.toLowerCase().includes("payment verification failed") ||
          rawErrorMessage.toLowerCase().includes("mismatch") ||
          rawErrorMessage.toLowerCase().includes("requires ₹")
        ) {
          setFieldErrors((prev) => ({
            ...prev,
            payment_proof: rawErrorMessage,
          }));
          setFormError(rawErrorMessage);
          toast.error(rawErrorMessage);
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
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

  const handleRazorpaySuccess = async (verifyResult, rzpResponse) => {
    const paymentId = rzpResponse.razorpay_payment_id;
    setFormData((prev) => ({
      ...prev,
      payment_method: "Razorpay",
      transaction_id: paymentId,
    }));

    try {
      setSubmitting(true);
      const result = await submitMemberPayment({
        payment_method: "Razorpay",
        subscription_year: formData.subscription_year || 1,
        amount: formData.amount || 299,
        transaction_id: paymentId,
        payment_proof: null,
      });

      if (!civilianPlan) {
        await checkMemberSession();
      }

      toast.success(result?.response?.message || "Payment completed and verified via Razorpay!");

      const acknowledgementToken = toText(
        result?.token ?? result?.response?.token ?? result?.data?.token ?? result?.response?.data?.token,
        sessionStorage.getItem("inmba_civilian_token") || ""
      );

      if (civilianPlan && acknowledgementToken) {
        navigate(`/civilian-acknowledgement/${encodeURIComponent(acknowledgementToken)}`, { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.warn("Auto submit after razorpay error:", err);
      toast.success("Payment verified! Transaction ID: " + paymentId);
    } finally {
      setSubmitting(false);
    }
  };

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

            {/* ========================================================
                1. SUBMIT PAYMENT PROOF (IMG PART MOVED TO TOP)
                ======================================================== */}
            <div style={{ textAlign: "center", margin: "16px 0 24px 0", position: "relative" }}>
              <hr style={{ border: "none", borderTop: "1px solid #cbd5e1", margin: 0 }} />
              <span style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "#ffffff", padding: "0 14px", color: "#166534", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                SUBMIT PAYMENT PROOF (AFTER BANK / UPI / QR TRANSFER)
              </span>
            </div>

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
                    formData.selected_plan_option ||
                    (Number(formData.amount) >= 2999 ? "2999_1" : "299_1")
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

                  <optgroup label="INMBA Network Member Plans (₹299/yr)">
                    <option value="299_1">₹299 — 1 Year (Network Member)</option>
                    <option value="299_2">₹598 — 2 Years (Network Member)</option>
                    <option value="299_3">₹897 — 3 Years (Network Member)</option>
                  </optgroup>

                  <optgroup label="INMBA Royalty Member Plans (₹2,999/yr)">
                    <option value="2999_1">₹2,999 — 1 Year (Royalty Member)</option>
                    <option value="2999_2">₹5,998 — 2 Years (Royalty Member)</option>
                    <option value="2999_3">₹8,997 — 3 Years (Royalty Member)</option>
                  </optgroup>
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
                    type="text"
                    name="amount"
                    value={
                      formData.amount
                        ? Number(formData.amount).toLocaleString("en-IN")
                        : "299"
                    }
                    readOnly
                    tabIndex="-1"
                    style={{
                      backgroundColor: "#f8fafc",
                      fontWeight: 700,
                      color: "#166534",
                      cursor: "not-allowed",
                      border: "1px solid #cbd5e1",
                    }}
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

                <small style={{ display: "block", marginTop: "5px", fontSize: "0.76rem", color: "#64748b" }}>
                  <i className="fa-solid fa-lock" style={{ marginRight: "4px", color: "#166534" }} />
                  Amount is locked to the selected membership plan ({formData.subscription_year || 1} Year).
                </small>

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

            {/* ========================================================
                2. PAYMENT METHODS (FOLLOWING THE IMG PART)
                ======================================================== */}
            {/* PAYMENT METHOD SELECTION */}
            <div className="inmba-payment-form-group" style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e3a1e", marginBottom: "10px" }}>
                Select Payment Method Used <span>*</span>
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "10px",
                }}
              >
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = (formData.payment_method || "QR") === method.value;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      className={`inmba-payment-method ${
                        isSelected ? "inmba-payment-method-selected" : ""
                      }`}
                      onClick={() => handlePaymentMethodChange(method.value)}
                      disabled={submitting || isApproved}
                      style={{
                        cursor: "pointer",
                        border: isSelected ? "2px solid #166534" : "1px solid #d1d5db",
                        backgroundColor: isSelected ? "#f0fdf4" : "#ffffff",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isSelected ? "#166534" : "#f1f5f9",
                          color: isSelected ? "#ffffff" : "#166534",
                          flexShrink: 0,
                        }}
                      >
                        <i className={method.icon} aria-hidden="true" />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong
                          style={{
                            display: "block",
                            fontSize: "0.85rem",
                            color: isSelected ? "#14532d" : "#1f2937",
                          }}
                        >
                          {method.label}
                        </strong>
                        <small
                          style={{
                            display: "block",
                            fontSize: "0.72rem",
                            color: "#6b7280",
                            lineHeight: 1.2,
                            marginTop: "2px",
                          }}
                        >
                          {method.description}
                        </small>
                      </div>
                      <i
                        className={isSelected ? "fas fa-circle-check" : "far fa-circle"}
                        style={{
                          color: isSelected ? "#166534" : "#9ca3af",
                          fontSize: "1rem",
                        }}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DIVIDER: OFFICIAL PAYMENT METHODS */}
            <div className="inmba-payment-section-divider">
              <span className="inmba-payment-section-divider-text">
                OFFICIAL PAYMENT DETAILS (BANK / UPI / QR CODE)
              </span>
            </div>

            {/* 1. OFFICIAL PAYMENT DETAILS CARD (BANK & QR) */}
            <PaymentDetailsCard
              amount={formData.amount || 299}
              upiId={upiId}
              accountNumber={bankAccountNumber}
              ifsc={bankIfsc}
              accountName="INMBA ORGANIZATION"
              bankName="Bank of Baroda"
              branch="Chitlapakkam Branch, Chennai"
              qrUrl="/inmba-qr.png"
            />

            {/* DIVIDER: OR PAY VIA RAZORPAY */}
            <div className="inmba-payment-section-divider">
              <span className="inmba-payment-section-divider-text">
                OR PAY INSTANTLY ONLINE (RAZORPAY)
              </span>
            </div>

            {/* 2. RAZORPAY INSTANT ONLINE PAYMENT */}
            <RazorpayCard
              amount={formData.amount || (civilianPlan ? 299 : 299)}
              name="INMBA Membership"
              description={`INMBA Membership Plan - ${formData.subscription_year || 1} Year`}
              prefill={{
                name: fullName,
                email: member?.email || "",
                contact: member?.phone || member?.mobile || "",
              }}
              notes={{
                member_id: member?.id || "",
                login_id: loginId || "",
                plan_name: "INMBA Membership",
              }}
              onSuccess={handleRazorpaySuccess}
              onFailure={(err) => {
                toast.error(err.message || "Payment cancelled or failed.");
              }}
              transactionId={formData.transaction_id}
              disabled={submitting || isApproved || !Number(formData.amount)}
            />

            {/* DISCLAIMER */}

            <div className="inmba-payment-disclaimer-box">
              <div className="inmba-payment-disclaimer-header">
                <i className="fas fa-triangle-exclamation" aria-hidden="true" />
                <strong>Membership Payment Disclaimer (₹299 / ₹2999)</strong>
              </div>
              <p>
                Membership fee payments of ₹299 (Network Member) and ₹2,999 (Network Royalty Member) are strictly non-refundable one-time processing charges.
                Digital Member ID, QR code, Public Profile, and Royalty Privileges are activated following administrative review and verification of submitted Full KYC documents.
              </p>
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