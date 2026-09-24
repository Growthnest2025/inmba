const path =
  require("path");

const ApiError =
  require(
    "../utils/apiError"
  );

/* =========================
   SAFE QR FILENAME
========================= */

const normalizeQrFilename = (
  value
) => {
  const rawFilename =
    String(value || "")
      .trim();

  if (!rawFilename) {
    return null;
  }

  /*
    basename prevents:

    ../
    ..\
    nested/path
  */

  const filename =
    path.basename(rawFilename);

  if (
    filename !== rawFilename
  ) {
    return null;
  }

  if (
    !/^[A-Za-z0-9._-]{1,255}\.png$/i
      .test(filename)
  ) {
    return null;
  }

  return filename;
};

/* =========================
   LEGACY FILENAME VALIDATION
========================= */

const validateLegacyQrFilename =
  (
    request,
    response,
    next
  ) => {
    try {
      const filename =
        normalizeQrFilename(
          request.params
            ?.filename
        );

      if (!filename) {
        throw new ApiError(
          400,
          "Valid PNG QR filename is required."
        );
      }

      request
        .validatedQrFilename =
        filename;

      return next();
    } catch (error) {
      return next(error);
    }
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  normalizeQrFilename,
  validateLegacyQrFilename,
};