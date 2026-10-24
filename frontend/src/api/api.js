import axios from "axios";

/* =========================
   DEFAULT URLS
========================= */

const isLocalhostUrl = (url) => /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(String(url || ""));

const DEFAULT_BACKEND_URL =
  process.env.NODE_ENV === "production"
    ? "https://inmba-auth-staging.venkatgrowthnest.workers.dev"
    : "http://127.0.0.1:5000";

/*
  URL முடிவில் இருக்கும் unnecessary
  slash-ஐ remove செய்யும்.

  Example:

  http://localhost:5000/
  becomes
  http://localhost:5000
*/

const normalizeUrl = (value) => {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "");
};

/* =========================
   BACKEND BASE URL
========================= */

const rawBackendUrl =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_API_URL ||
  "";

export const BACKEND_URL = normalizeUrl(
  process.env.NODE_ENV === "production" && (!rawBackendUrl || isLocalhostUrl(rawBackendUrl))
    ? DEFAULT_BACKEND_URL
    : (rawBackendUrl || DEFAULT_BACKEND_URL)
);

/* =========================
   API BASE URL
========================= */

const rawApiUrl = process.env.REACT_APP_API_BASE_URL || "";

export const API_BASE_URL = normalizeUrl(
  process.env.NODE_ENV === "production" && (!rawApiUrl || isLocalhostUrl(rawApiUrl))
    ? `${BACKEND_URL}/api`
    : (rawApiUrl || `${BACKEND_URL}/api`)
);

/* =========================
   AXIOS INSTANCE
========================= */

const api = axios.create({
  baseURL: API_BASE_URL,

  /*
    Backend session cookie browser-ல்
    receive மற்றும் send செய்ய இது
    கண்டிப்பாக true இருக்க வேண்டும்.
  */

  withCredentials: true,

  timeout: 20000,

  headers: {
    Accept:
      "application/json",
  },
});

/* =========================
   REQUEST INTERCEPTOR
========================= */

api.interceptors.request.use(
  (config) => {
    /*
      எல்லா requests-க்கும் session
      cookie send செய்யப்படுகிறது.
    */

    config.withCredentials = true;
    try {
      if (typeof localStorage !== "undefined") {
        const token = localStorage.getItem("inmba_session_token");
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      if (typeof sessionStorage !== "undefined" || typeof localStorage !== "undefined") {
        const loginId =
          (typeof sessionStorage !== "undefined" && (sessionStorage.getItem("commercial_login_id") || sessionStorage.getItem("inmba_commercial_login_id") || sessionStorage.getItem("inmba_login_id"))) ||
          (typeof localStorage !== "undefined" && (localStorage.getItem("commercial_login_id") || localStorage.getItem("login_id") || localStorage.getItem("inmba_login_id")));
        if (loginId && !config.headers["X-Login-Id"]) {
          config.headers["X-Login-Id"] = String(loginId).trim();
        }
      }
    } catch {}

    /*
      FormData upload request என்றால்
      Content-Type manual-a set செய்யக்கூடாது.

      Browser தானாக boundary value
      சேர்த்து multipart/form-data
      header உருவாக்கும்.
    */

    const isFormData =
      typeof FormData !==
        "undefined" &&
      config.data instanceof
        FormData;

    if (isFormData) {
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

/* =========================
   RESPONSE INTERCEPTOR
========================= */

api.interceptors.response.use(
  (response) => {
    try {
      if (typeof localStorage !== "undefined" && response?.data?.token) {
        localStorage.setItem("inmba_session_token", response.data.token);
      }
    } catch {}
    return response;
  },

  (error) => {
    const statusCode =
      error.response?.status ||
      0;

    const responseData =
      error.response?.data;

    /*
      Common values error object-ல்
      attach செய்யப்படுகிறது.

      Pages-ல்:

      error.statusCode
      error.apiMessage
      error.sessionExpired

      என்று பயன்படுத்தலாம்.
    */

    error.statusCode =
      statusCode;

    error.apiMessage =
      responseData?.message ||
      responseData?.error ||
      error.message ||
      "Something went wrong.";

    /*
      Login API போன்ற requests-ல்
      invalid password காரணமாக 401 வரும்.

      அந்த request config-ல்:

      skipSessionExpiredHandling: true

      கொடுத்தால் sessionExpired false
      ஆக இருக்கும்.
    */

    const skipSessionHandling =
      Boolean(
        error.config
          ?.skipSessionExpiredHandling
      );

    error.sessionExpired =
      statusCode === 401 &&
      !skipSessionHandling;

    error.isForbidden =
      statusCode === 403;

    error.isNotFound =
      statusCode === 404;

    error.isValidationError =
      statusCode === 400 ||
      statusCode === 422;

    error.isNetworkError =
      !error.response;

    return Promise.reject(
      error
    );
  }
);

/* =========================
   EXPORT
========================= */

export default api;