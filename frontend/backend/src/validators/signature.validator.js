const ApiError =
  require(
    "../utils/apiError"
  );

const MAX_SIGNATURE_DATA_LENGTH =
  Number(
    process.env
      .MAX_SIGNATURE_DATA_LENGTH ||
      7 * 1024 * 1024
  );

/* =========================
   NORMALIZE SIGNATURE DATA
========================= */

const normalizeSignatureData =
  (
    value
  ) => {
    const firstValue =
      Array.isArray(
        value
      )
        ? value[0]
        : value;

    return String(
      firstValue ||
        ""
    ).trim();
  };

/* =========================
   PARSE DATA URL
========================= */

const parseSignatureDataUrl =
  (
    signatureData
  ) => {
    const normalized =
      normalizeSignatureData(
        signatureData
      );

    const match =
      normalized.match(
        /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\r\n]+)$/
      );

    if (!match) {
      return null;
    }

    const rawExtension =
      match[1]
        .toLowerCase();

    const extension =
      rawExtension ===
        "jpeg"
        ? "jpg"
        : rawExtension;

    const mimeType =
      extension ===
        "jpg"
        ? "image/jpeg"
        : `image/${extension}`;

    const base64Data =
      match[2].replace(
        /\s+/g,
        ""
      );

    return {
      extension,
      mimeType,
      base64Data,
    };
  };

/* =========================
   VALIDATE SIGNATURE
========================= */

const validateSignatureData =
  (
    payload = {}
  ) => {
    const errors = [];

    const signatureData =
      normalizeSignatureData(
        payload
          .signature_data ||
        payload
          .signatureData ||
        payload
          .signature
      );

    if (
      !signatureData
    ) {
      errors.push(
        "Signature data is required."
      );
    }

    if (
      signatureData.length >
      MAX_SIGNATURE_DATA_LENGTH
    ) {
      errors.push(
        "Signature image exceeds the allowed size."
      );
    }

    const parsedSignature =
      signatureData
        ? parseSignatureDataUrl(
            signatureData
          )
        : null;

    if (
      signatureData &&
      !parsedSignature
    ) {
      errors.push(
        "Signature must be a valid PNG, JPG or WEBP image."
      );
    }

    let imageBuffer =
      null;

    if (
      parsedSignature
    ) {
      try {
        imageBuffer =
          Buffer.from(
            parsedSignature
              .base64Data,
            "base64"
          );

        if (
          imageBuffer.length ===
          0
        ) {
          errors.push(
            "Signature image is empty."
          );
        }
      } catch {
        errors.push(
          "Signature image data is invalid."
        );
      }
    }

    return {
      isValid:
        errors.length ===
        0,

      errors,

      data: {
        signature_data:
          signatureData,

        extension:
          parsedSignature
            ?.extension ||
          null,

        mime_type:
          parsedSignature
            ?.mimeType ||
          null,

        image_buffer:
          imageBuffer,
      },
    };
  };

/* =========================
   EXPRESS MIDDLEWARE
========================= */

const validateSignature =
  (
    request,
    response,
    next
  ) => {
    try {
      const result =
        validateSignatureData(
          request.body ||
            {}
        );

      if (
        !result.isValid
      ) {
        const error =
          new ApiError(
            422,
            result.errors[0]
          );

        error.errors =
          result.errors;

        throw error;
      }

      request.validatedSignature =
        result.data;

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

module.exports = {
  MAX_SIGNATURE_DATA_LENGTH,
  normalizeSignatureData,
  parseSignatureDataUrl,
  validateSignatureData,
  validateSignature,
};