/* =========================
   LEGACY PAGE MAP
========================= */

const LEGACY_PAGE_MAP =
  Object.freeze({
    "/":
      "/",

    "/about":
      "/about",

    "/membership":
      "/membership",

    "/organization_member":
      "/organization_member",

    "/student":
      "/student",

    "/professional":
      "/professional",

    "/commercial":
      "/commercial",

    "/contact":
      "/contact",

    "/events":
      "/events",

    "/programs":
      "/programs",

    "/foundation":
      "/foundation",

    "/chatbot":
      "/chatbot",

    "/organization":
      "/organization",

    "/network":
      "/network",

    "/members":
      "/members",

    "/policy":
      "/policy",

    "/success":
      "/success",

    "/membership-type":
      "/membership-type",

    "/commercial-membership":
      "/commercial-membership",

    "/membership/civilian":
      "/membership/civilian",

    "/membership/commercial":
      "/membership/commercial",
  });

/* =========================
   NORMALIZE BASE URL
========================= */

const removeTrailingSlash =
  (
    value
  ) => {
    return String(
      value ||
        ""
    ).replace(
      /\/+$/,
      ""
    );
  };

/* =========================
   FRONTEND BASE URL
========================= */

const getFrontendBaseUrl =
  () => {
    return removeTrailingSlash(
      process.env
        .FRONTEND_BASE_URL ||
        "http://localhost:5173"
    );
  };

/* =========================
   NORMALIZE REQUEST PATH
========================= */

const normalizeLegacyPath =
  (
    pathValue
  ) => {
    let normalizedPath =
      String(
        pathValue ||
          "/"
      ).trim();

    if (
      !normalizedPath
        .startsWith(
          "/"
        )
    ) {
      normalizedPath =
        `/${normalizedPath}`;
    }

    if (
      normalizedPath.length >
      1
    ) {
      normalizedPath =
        normalizedPath.replace(
          /\/+$/,
          ""
        );
    }

    return normalizedPath;
  };

/* =========================
   REACT PAGE PATH
========================= */

const getReactPagePath =
  (
    legacyPath
  ) => {
    const normalizedPath =
      normalizeLegacyPath(
        legacyPath
      );

    return (
      LEGACY_PAGE_MAP[
        normalizedPath
      ] ||
      null
    );
  };

/* =========================
   SAFE QUERY KEY
========================= */

const isSafeQueryKey =
  (
    key
  ) => {
    return (
      /^[A-Za-z0-9_.-]{1,80}$/.test(
        String(
          key ||
            ""
        )
      )
    );
  };

/* =========================
   QUERY VALUE
========================= */

const normalizeQueryValue =
  (
    value
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(
      value
    ).slice(
      0,
      1000
    );
  };

/* =========================
   APPEND QUERY
========================= */

const appendQueryParameters =
  (
    targetUrl,
    query = {}
  ) => {
    const entries =
      Object.entries(
        query ||
          {}
      ).slice(
        0,
        30
      );

    for (
      const [
        key,
        rawValue,
      ] of entries
    ) {
      if (
        !isSafeQueryKey(
          key
        )
      ) {
        continue;
      }

      const values =
        Array.isArray(
          rawValue
        )
          ? rawValue
          : [
              rawValue,
            ];

      for (
        const value of values
          .slice(
            0,
            10
          )
      ) {
        targetUrl
          .searchParams
          .append(
            key,
            normalizeQueryValue(
              value
            )
          );
      }
    }

    return targetUrl;
  };

/* =========================
   BUILD FRONTEND URL
========================= */

const buildFrontendPageUrl =
  (
    legacyPath,
    query = {}
  ) => {
    const normalizedPath =
      normalizeLegacyPath(
        legacyPath
      );

    const reactPath =
      getReactPagePath(
        normalizedPath
      );

    if (
      !reactPath
    ) {
      return null;
    }

    const frontendBaseUrl =
      getFrontendBaseUrl();

    const targetUrl =
      new URL(
        reactPath,
        `${frontendBaseUrl}/`
      );

    appendQueryParameters(
      targetUrl,
      query
    );

    return targetUrl
      .toString();
  };

/* =========================
   REDIRECT DETAILS
========================= */

const getLegacyPageRedirect =
  (
    legacyPath,
    query = {}
  ) => {
    const normalizedPath =
      normalizeLegacyPath(
        legacyPath
      );

    const reactPath =
      getReactPagePath(
        normalizedPath
      );

    if (
      !reactPath
    ) {
      return null;
    }

    return {
      legacy_path:
        normalizedPath,

      react_path:
        reactPath,

      frontend_base_url:
        getFrontendBaseUrl(),

      redirect_url:
        buildFrontendPageUrl(
          normalizedPath,
          query
        ),
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  LEGACY_PAGE_MAP,
  removeTrailingSlash,
  getFrontendBaseUrl,
  normalizeLegacyPath,
  getReactPagePath,
  isSafeQueryKey,
  normalizeQueryValue,
  appendQueryParameters,
  buildFrontendPageUrl,
  getLegacyPageRedirect,
};