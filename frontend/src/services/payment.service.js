import axios from "axios";

import api from "../api/api";

/* =========================================================
   ROOT PAYMENT API

   Routes:

   GET  /payment
   POST /payment_submit
========================================================= */

const paymentApi =
  axios.create({
    baseURL: "/",

    withCredentials:
      true,

    timeout:
      45000,

    headers: {
      Accept:
        "application/json",
    },
  });

/* =========================================================
   REQUEST INTERCEPTOR
========================================================= */

paymentApi.interceptors.request.use(
  (config) => {
    config.withCredentials =
      true;

    const isFormData =
      typeof FormData !==
        "undefined" &&
      config.data instanceof
        FormData;

    /*
      FormData request-க்கு
      Content-Type manually set
      பண்ணக்கூடாது.

      Browser multipart boundary
      automatically add பண்ணும்.
    */

    if (
      isFormData &&
      config.headers
    ) {
      delete config.headers[
        "Content-Type"
      ];
    }

    return config;
  },

  (error) => {
    return Promise.reject(
      error
    );
  }
);

/* =========================================================
   HELPERS
========================================================= */

const asObject = (
  value
) => {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {
    return value;
  }

  return {};
};

/* =========================================================
   TEXT
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const text =
    String(
      value ?? ""
    ).trim();

  return (
    text ||
    fallback
  );
};

/* =========================================================
   HTML CHECK
========================================================= */

const isHtmlResponse = (
  value
) => {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }

  const text =
    value
      .trim()
      .toLowerCase();

  return (
    text.startsWith(
      "<!doctype html"
    ) ||
    text.startsWith(
      "<html"
    )
  );
};

/* =========================================================
   RESPONSE URL
========================================================= */

const getResponseUrl = (
  response
) => {
  return toText(
    response
      ?.request
      ?.responseURL
  );
};

/* =========================================================
   INTERNAL REACT ROUTE
========================================================= */

const getInternalRoute = (
  value
) => {
  const route =
    toText(
      value
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
    const parsed =
      new URL(
        route
      );

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return "";
  }
};

/* =========================================================
   EXTRACT RESPONSE DATA
========================================================= */

const extractData = (
  responseData
) => {
  const root =
    asObject(
      responseData
    );

  const data =
    asObject(
      root.data
    );

  if (
    Object.keys(
      data
    ).length >
    0
  ) {
    return data;
  }

  return root;
};

/* =========================================================
   NORMALIZE PAYMENT ERROR
========================================================= */

const normalizePaymentError =
  async (
    error,
    fallback
  ) => {
    const response =
      error?.response;

    let responseData =
      response?.data;

    /* =====================================================
       BLOB ERROR
    ===================================================== */

    if (
      typeof Blob !==
        "undefined" &&
      responseData instanceof
        Blob
    ) {
      try {
        const text =
          await responseData.text();

        try {
          responseData =
            JSON.parse(
              text
            );
        } catch {
          responseData = {
            message:
              text,
          };
        }
      } catch {
        responseData =
          {};
      }
    }

    const data =
      asObject(
        responseData
      );

    error.statusCode =
      Number(
        response?.status ||
          error?.statusCode ||
          0
      );

    error.apiMessage =
      toText(
        data.message ??
          data.error ??
          error?.message,
        fallback
      );

    error.validationErrors =
      data.errors ??
      data.validationErrors ??
      data.fieldErrors ??
      null;

    if (
      error.statusCode ===
      401
    ) {
      error.unauthorized =
        true;

      error.sessionExpired =
        true;
    }

    if (
      error.statusCode ===
      403
    ) {
      error.forbidden =
        true;
    }

    if (
      error.statusCode ===
      404
    ) {
      error.notFound =
        true;
    }

    if (
      error.statusCode ===
        400 ||
      error.statusCode ===
        422
    ) {
      error.validationError =
        true;

      error.isValidationError =
        true;
    }

    error.isNetworkError =
      !error?.response;

    return error;
  };

/* =========================================================
   NORMALIZE PAYMENT DETAILS
========================================================= */

export const normalizePaymentDetails =
  (
    value
  ) => {
    const data =
      asObject(
        value
      );

    const amount =
      Number(
        data.amount ??
          0
      );

    return {
      ...data,

      payment_method:
        toText(
          data.payment_method ??
            data.paymentMethod
        ),

      subscription_year:
        toText(
          data.subscription_year ??
            data.subscriptionYear
        ),

      transaction_id:
        toText(
          data.transaction_id ??
            data.transactionId
        ),

      amount:
        Number.isFinite(
          amount
        )
          ? amount
          : 0,

      payment_proof:
        toText(
          data.payment_proof ??
            data.paymentProof
        ),

      payment_status:
        toText(
          data.payment_status ??
            data.paymentStatus,
          "pending"
        ),

      token:
        toText(
          data.token ??
            data.user_token ??
            data.userToken
        ),
    };
  };

/* =========================================================
   PAYMENT PROOF VALIDATION

   payment_proof optional.

   Allowed:
   JPG / JPEG
   PNG
   WEBP
   PDF

   Default max:
   5 MB
========================================================= */

export const validatePaymentProof =
  (
    file,
    {
      required = false,
      maxSizeMb = 5,
    } = {}
  ) => {
    /* =====================================================
       NO FILE
    ===================================================== */

    if (!file) {
      if (
        required
      ) {
        return {
          valid:
            false,

          error:
            "Payment proof is required.",
        };
      }

      return {
        valid:
          true,

        error:
          "",
      };
    }

    /* =====================================================
       FILE OBJECT
    ===================================================== */

    if (
      typeof File ===
        "undefined" ||
      !(file instanceof File)
    ) {
      return {
        valid:
          false,

        error:
          "Please select a valid payment proof file.",
      };
    }

    /* =====================================================
       EMPTY FILE
    ===================================================== */

    if (
      file.size <=
      0
    ) {
      return {
        valid:
          false,

        error:
          "Selected payment proof file is empty.",
      };
    }

    /* =====================================================
       TYPE VALIDATION
    ===================================================== */

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      return {
        valid:
          false,

        error:
          "Payment proof must be JPG, PNG, WEBP or PDF.",
      };
    }

    /* =====================================================
       SIZE VALIDATION
    ===================================================== */

    const safeMaxSizeMb =
      Number(
        maxSizeMb
      );

    const maximumSize =
      Number.isFinite(
        safeMaxSizeMb
      ) &&
      safeMaxSizeMb >
        0
        ? safeMaxSizeMb *
          1024 *
          1024
        : 0;

    if (
      maximumSize >
        0 &&
      file.size >
        maximumSize
    ) {
      return {
        valid:
          false,

        error:
          `Payment proof must be below ${safeMaxSizeMb} MB.`,
      };
    }

    /* =====================================================
       VALID
    ===================================================== */

    return {
      valid:
        true,

      error:
        "",

      file,
    };
  };

/* =========================================================
   GET PAYMENT PAGE

   GET /payment
========================================================= */

export const getPaymentPage =
  async ({
    signal,
  } = {}) => {
    try {
      const response =
        await paymentApi.get(
          "/payment",
          {
            signal,

            headers: {
              Accept:
                "application/json",

              "X-Requested-With":
                "XMLHttpRequest",
            },
          }
        );

      /* ===================================================
         NODE JSON RESPONSE
      =================================================== */

      if (
        !isHtmlResponse(
          response.data
        )
      ) {
        const data =
          extractData(
            response.data
          );

        const member =
          asObject(
            data.member ??
              data.user ??
              data.profile
          );

        const paymentSource =
          data.payment &&
          typeof data.payment ===
            "object"
            ? data.payment
            : Object.keys(
                member
              ).length >
              0
            ? member
            : data;

        const payment =
          normalizePaymentDetails(
            paymentSource
          );

        const token =
          toText(
            data.token ??
              data.user_token ??
              data.userToken ??
              member.token ??
              member.user_token ??
              member.userToken
          );

        return {
          success:
            true,

          data,

          payment,

          member,

          token:

            token ||
            payment.token,

          raw:
            response.data,
        };
      }

      /* ===================================================
         LEGACY HTML FALLBACK

         /api/me is used to obtain
         active member information.
      =================================================== */

      const sessionResponse =
        await api.get(
          "/me",
          {
            signal,
          }
        );

      const root =
        asObject(
          sessionResponse.data
        );

      const data =
        asObject(
          root.data
        );

      const member =
        asObject(
          data.member ??
            root.member ??
            data.user ??
            root.user ??
            data.profile ??
            root.profile
        );

      const token =
        toText(
          data.token ??
            root.token ??
            data.user_token ??
            root.user_token ??
            data.userToken ??
            root.userToken ??
            member.token ??
            member.user_token
        );

      return {
        success:
          true,

        data: {
          member,

          token,
        },

        payment:
          normalizePaymentDetails(
            member
          ),

        member,

        token,

        raw:
          sessionResponse.data,
      };
    } catch (
      error
    ) {
      throw await normalizePaymentError(
        error,
        "Unable to load payment details."
      );
    }
  };

/* =========================================================
   BUILD PAYMENT FORM DATA

   Exact fields:

   payment_method
   subscription_year
   amount
   transaction_id
   payment_proof
========================================================= */

export const buildPaymentFormData =
  (
    values = {}
  ) => {
    if (
      typeof FormData !==
        "undefined" &&
      values instanceof
        FormData
    ) {
      return values;
    }

    const source =
      asObject(
        values
      );

    /* =====================================================
       PAYMENT METHOD
    ===================================================== */

    const paymentMethod =
      toText(
        source.payment_method ??
          source.paymentMethod
      );

    /* =====================================================
       YEAR
    ===================================================== */

    const subscriptionYear =
      toText(
        source.subscription_year ??
          source.subscriptionYear
      );

    /* =====================================================
       TRANSACTION
    ===================================================== */

    const transactionId =
      toText(
        source.transaction_id ??
          source.transactionId
      );

    /* =====================================================
       AMOUNT
    ===================================================== */

    const numericAmount =
      Number(
        source.amount
      );

    /* =====================================================
       PAYMENT PROOF
    ===================================================== */

    const paymentProof =
      source.payment_proof ??
      source.paymentProof ??
      null;

    /* =====================================================
       REQUIRED VALIDATION
    ===================================================== */

    if (
      !paymentMethod
    ) {
      const error =
        new Error(
          "Payment method is required."
        );

      error.statusCode =
        400;

      throw error;
    }

    if (
      !subscriptionYear
    ) {
      const error =
        new Error(
          "Subscription year is required."
        );

      error.statusCode =
        400;

      throw error;
    }

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <=
        0
    ) {
      const error =
        new Error(
          "Amount must be greater than 0."
        );

      error.statusCode =
        400;

      throw error;
    }

    /* =====================================================
       PAYMENT PROOF VALIDATION
    ===================================================== */

    const proofValidation =
      validatePaymentProof(
        paymentProof
      );

    if (
      !proofValidation.valid
    ) {
      const error =
        new Error(
          proofValidation.error
        );

      error.statusCode =
        400;

      throw error;
    }

    /* =====================================================
       CREATE FORM DATA
    ===================================================== */

    const formData =
      new FormData();

    formData.append(
      "payment_method",
      paymentMethod
    );

    formData.append(
      "subscription_year",
      subscriptionYear
    );

    formData.append(
      "amount",
      String(
        numericAmount
      )
    );

    /*
      transaction_id can be empty.
    */

    formData.append(
      "transaction_id",
      transactionId
    );

    /*
      payment_proof optional.
    */

    if (
      typeof File !==
        "undefined" &&
      paymentProof instanceof
        File
    ) {
      formData.append(
        "payment_proof",
        paymentProof
      );
    }

    return formData;
  };

/* =========================================================
   BANK FORM PATH
========================================================= */

export const getBankFormPath =
  (
    token
  ) => {
    const safeToken =
      toText(
        token
      );

    if (
      !safeToken
    ) {
      return "";
    }

    return `/bank_form/${encodeURIComponent(
      safeToken
    )}`;
  };

/* =========================================================
   SUBMIT PAYMENT

   POST /payment_submit

   Success:
   /bank_form/:token
========================================================= */

export const submitPayment =
  async (
    values
  ) => {
    const formData =
      buildPaymentFormData(
        values
      );

    try {
      const response =
        await paymentApi.post(
          "/payment_submit",
          formData,
          {
            headers: {
              Accept:
                "application/json",

              "X-Requested-With":
                "XMLHttpRequest",
            },
          }
        );

      /* ===================================================
         JSON RESPONSE
      =================================================== */

      if (
        !isHtmlResponse(
          response.data
        )
      ) {
        const root =
          asObject(
            response.data
          );

        const data =
          extractData(
            response.data
          );

        /* =================================================
           FAILED RESPONSE
        ================================================= */

        if (
          root.success ===
            false ||
          data.success ===
            false
        ) {
          const requestError =
            new Error(
              toText(
                root.message ??
                  root.error ??
                  data.message ??
                  data.error,
                "Unable to submit payment."
              )
            );

          requestError.response =
            response;

          throw requestError;
        }

        /* =================================================
           TOKEN
        ================================================= */

        const token =
          toText(
            data.token ??
              root.token ??
              data.user_token ??
              root.user_token ??
              data.userToken ??
              root.userToken
          );

        /* =================================================
           NEXT PATH
        ================================================= */

        let nextPath =
          getInternalRoute(
            data.nextPath ??
              data.next_path ??
              data.nextRoute ??
              data.next_route ??
              data.redirect ??
              data.redirectTo ??
              data.redirect_url ??
              data.redirectUrl ??
              root.nextPath ??
              root.next_path ??
              root.nextRoute ??
              root.next_route ??
              root.redirect ??
              root.redirectTo ??
              root.redirect_url ??
              root.redirectUrl ??
              data.nextAction
                ?.path ??
              root.nextAction
                ?.path
          );

        /* =================================================
           FALLBACK BANK PATH
        ================================================= */

        if (
          !nextPath &&
          token
        ) {
          nextPath =
            getBankFormPath(
              token
            );
        }

        return {
          success:
            true,

          message:
            toText(
              root.message ??
                data.message,
              "Payment details submitted successfully."
            ),

          token,

          nextPath,

          nextRoute:
            nextPath,

          redirectTo:
            nextPath,

          data,

          raw:
            response.data,
        };
      }

      /* ===================================================
         LEGACY HTML / REDIRECT RESPONSE
      =================================================== */

      const responseUrl =
        getResponseUrl(
          response
        );

      const nextPath =
        getInternalRoute(
          responseUrl
        );

      return {
        success:
          true,

        message:
          "Payment details submitted successfully.",

        token:
          "",

        nextPath,

        nextRoute:
          nextPath,

        redirectTo:
          nextPath,

        data:
          {},

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw await normalizePaymentError(
        error,
        "Unable to submit payment."
      );
    }
  };

/* =========================================================
   COMPATIBILITY EXPORTS

   Existing Payment.jsx imports
   old/new names.

   Keep all names available.
========================================================= */

/* =========================================================
   GET COMPATIBILITY
========================================================= */

export const getPayment =
  getPaymentPage;

export const fetchPayment =
  getPaymentPage;

export const getPaymentDetails =
  getPaymentPage;

export const fetchPaymentDetails =
  getPaymentPage;

export const getMemberPayment =
  getPaymentPage;

export const fetchMemberPayment =
  getPaymentPage;

/* =========================================================
   SUBMIT COMPATIBILITY
========================================================= */

export const submitPaymentDetails =
  submitPayment;

export const submitMemberPayment =
  submitPayment;

export const savePayment =
  submitPayment;

export const savePaymentDetails =
  submitPayment;

export const saveMemberPayment =
  submitPayment;

/* =========================================================
   DEFAULT EXPORT
========================================================= */

const paymentService = {
  /* =======================================================
     GET
  ======================================================= */

  getPaymentPage,

  getPayment,

  fetchPayment,

  getPaymentDetails,

  fetchPaymentDetails,

  getMemberPayment,

  fetchMemberPayment,

  /* =======================================================
     SUBMIT
  ======================================================= */

  submitPayment,

  submitPaymentDetails,

  submitMemberPayment,

  savePayment,

  savePaymentDetails,

  saveMemberPayment,

  /* =======================================================
     VALIDATION
  ======================================================= */

  validatePaymentProof,

  /* =======================================================
     HELPERS
  ======================================================= */

  buildPaymentFormData,

  normalizePaymentDetails,

  getBankFormPath,
};

export default paymentService;