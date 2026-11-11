const fs =
  require(
    "fs/promises"
  );

const path =
  require(
    "path"
  );

const formidablePackage =
  require(
    "formidable"
  );

const ApiError =
  require(
    "../utils/apiError"
  );

const createForm =
  formidablePackage
    .formidable ||
  formidablePackage;

const PAYMENT_TEMP_DIRECTORY =
  path.resolve(
    process.cwd(),
    "storage",
    "temp"
  );

const MAX_PAYMENT_FILE_SIZE =
  Number(
    process.env
      .MAX_DOCUMENT_SIZE ||
      10 * 1024 * 1024
  );

const ALLOWED_PAYMENT_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]);

const getFirstValue =
  (
    value
  ) => {
    if (
      Array.isArray(
        value
      )
    ) {
      return (
        value[0] ??
        null
      );
    }

    return (
      value ??
      null
    );
  };

const getFirstFile =
  (
    value
  ) => {
    if (
      Array.isArray(
        value
      )
    ) {
      return (
        value[0] ||
        null
      );
    }

    return value || null;
  };

const removeTemporaryFile =
  async (
    file
  ) => {
    if (
      !file ||
      !file.filepath
    ) {
      return;
    }

    try {
      await fs.unlink(
        file.filepath
      );
    } catch {
      // File may already
      // be removed.
    }
  };

/* =========================
   PARSE PAYMENT FORM
========================= */

const parsePaymentForm =
  async (
    request,
    response,
    next
  ) => {
    const contentType =
      String(
        request.headers[
          "content-type"
        ] ||
          ""
      ).toLowerCase();

    if (
      !contentType.includes(
        "multipart/form-data"
      )
    ) {
      return next();
    }

    let uploadedFile =
      null;

    try {
      await fs.mkdir(
        PAYMENT_TEMP_DIRECTORY,
        {
          recursive:
            true,
        }
      );

      const form =
        createForm({
          uploadDir:
            PAYMENT_TEMP_DIRECTORY,

          keepExtensions:
            true,

          multiples:
            false,

          maxFiles:
            1,

          maxFileSize:
            MAX_PAYMENT_FILE_SIZE,
        });

      const parsedData =
        await new Promise(
          (
            resolve,
            reject
          ) => {
            form.parse(
              request,
              (
                error,
                fields,
                files
              ) => {
                if (error) {
                  return reject(
                    error
                  );
                }

                return resolve({
                  fields,
                  files,
                });
              }
            );
          }
        );

      uploadedFile =
        getFirstFile(
          parsedData.files
            .payment_proof
        );

      if (
        uploadedFile &&
        !ALLOWED_PAYMENT_TYPES.has(
          uploadedFile.mimetype
        )
      ) {
        throw new ApiError(
          415,
          "Payment proof must be JPG, PNG, WEBP or PDF."
        );
      }

      if (
        uploadedFile &&
        Number(
          uploadedFile.size ||
            0
        ) >
          MAX_PAYMENT_FILE_SIZE
      ) {
        throw new ApiError(
          413,
          "Payment proof exceeds the allowed file size."
        );
      }

      request.body = {
        ...(request.body ||
          {}),

        payment_method:
          getFirstValue(
            parsedData.fields
              .payment_method
          ),

        subscription_year:
          getFirstValue(
            parsedData.fields
              .subscription_year
          ),

        amount:
          getFirstValue(
            parsedData.fields
              .amount
          ),

        transaction_id:
          getFirstValue(
            parsedData.fields
              .transaction_id
          ),
      };

      request.uploadedPaymentProof =
        uploadedFile;

      return next();
    } catch (error) {
      await removeTemporaryFile(
        uploadedFile
      );

      return next(
        error
      );
    }
  };

module.exports = {
  PAYMENT_TEMP_DIRECTORY,
  MAX_PAYMENT_FILE_SIZE,
  ALLOWED_PAYMENT_TYPES,
  getFirstValue,
  getFirstFile,
  removeTemporaryFile,
  parsePaymentForm,
};