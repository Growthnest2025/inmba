/* =========================
   CLEAN TEXT
========================= */

const cleanDirectoryText =
  (
    value,
    maxLength =
      100
  ) => {
    const firstValue =
      Array.isArray(
        value
      )
        ? value[0]
        : value;

    if (
      firstValue === null ||
      firstValue ===
        undefined
    ) {
      return "";
    }

    return String(
      firstValue
    )
      .trim()
      .slice(
        0,
        maxLength
      );
  };

/* =========================
   POSITIVE INTEGER
========================= */

const normalizePositiveInteger =
  (
    value,
    defaultValue
  ) => {
    const numberValue =
      Number(
        value
      );

    if (
      !Number.isInteger(
        numberValue
      ) ||
      numberValue <= 0
    ) {
      return defaultValue;
    }

    return numberValue;
  };

/* =========================
   DIRECTORY QUERY
========================= */

const validateMemberDirectoryQuery =
  (
    request,
    response,
    next
  ) => {
    try {
      const allowedSorts =
        new Set([
          "newest",
          "oldest",
          "name_asc",
          "name_desc",
          "network_desc",
        ]);

      const requestedSort =
        cleanDirectoryText(
          request.query
            ?.sort,
          30
        ).toLowerCase();

      const page =
        normalizePositiveInteger(
          request.query
            ?.page,
          1
        );

      const requestedLimit =
        normalizePositiveInteger(
          request.query
            ?.limit,
          20
        );

      const limit =
        Math.min(
          requestedLimit,
          50
        );

      request
        .validatedMemberDirectoryQuery =
        {
          search:
            cleanDirectoryText(
              request.query
                ?.search,
              150
            ),

          membership_type:
            cleanDirectoryText(
              request.query
                ?.membership_type ||
              request.query
                ?.membershipType ||
              request.query
                ?.type,
              100
            ),

          city:
            cleanDirectoryText(
              request.query
                ?.city,
              100
            ),

          district:
            cleanDirectoryText(
              request.query
                ?.district,
              100
            ),

          state:
            cleanDirectoryText(
              request.query
                ?.state,
              100
            ),

          sort:
            allowedSorts.has(
              requestedSort
            )
              ? requestedSort
              : "newest",

          page,
          limit,
        };

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

module.exports = {
  cleanDirectoryText,
  normalizePositiveInteger,
  validateMemberDirectoryQuery,
};