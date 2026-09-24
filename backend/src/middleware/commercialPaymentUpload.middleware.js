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
  formidablePackage
    .default ||
  formidablePackage;

/* =========================================================
   COMMERCIAL PAYMENT TEMP STORAGE

   Final proof storage is handled by:
   commercialPayment.service.js

   This middleware only parses multipart form data and
   keeps the proof temporarily until the service stores it.
========================================================= */

const COMMERCIAL_PAYMENT_TEMP_DIRECTORY =
  path.resolve(
    process.cwd(),
    "storage",
    "temp",
    "commercial-payment"
  );

const MAX_COMMERCIAL_PAYMENT_FILE_SIZE =
  Number(
    process.env
      .MAX_DOCUMENT_SIZE ||
      10 * 1024 * 1024
  );

const ALLOWED_COMMERCIAL_PAYMENT_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]);

/* =========================================================
   HELPERS
========================================================= */

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

    return (
      value ||
      null
    );
  };

const getAllUploadedFiles =
  (
    files = {}
  ) => {
    const result =
      [];

    for (
      const fileValue
      of Object.values(
        files || {}
      )
    ) {
      if (
        Array.isArray(
          fileValue
        )
      ) {
        result.push(
          ...fileValue.filter(
            Boolean
          )
        );
      } else if (
        fileValue
      ) {
        result.push(
          fileValue
        );
      }
    }

    return result;
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
    } catch (
      error
    ) {
      if (
        error?.code !==
        "ENOENT"
      ) {
        console.error(
          "Commercial payment temporary file cleanup failed:",
          error.message
        );
      }
    }
  };

const removeTemporaryFiles =
  async (
    files = {}
  ) => {
    const uploadedFiles =
      getAllUploadedFiles(
        files
      );

    await Promise.allSettled(
      uploadedFiles.map(
        removeTemporaryFile
      )
    );
  };

const createCommercialPaymentUploadError =
  (
    statusCode,
    message,
    errorCode,
    field = null
  ) => {
    const errors =
      field
        ? [
            {
              field,

              message,

              code:
                errorCode,
            },
          ]
        : [];

    const error =
      new ApiError(
        statusCode,
        message,
        errors
      );

    error.errorCode =
      errorCode;

    return error;
  };

/* =========================================================
   MULTIPART CHECK
========================================================= */

const isMultipartRequest =
  (
    request
  ) => {
    const contentType =
      String(
        request?.headers?.[
          "content-type"
        ] ||
          ""
      ).toLowerCase();

    return contentType.includes(
      "multipart/form-data"
    );
  };

/* =========================================================
   FAILURE CLEANUP

   Validator/controller 4xx/5xx return பண்ணினா
   temp payment proof automatically delete ஆகும்.
========================================================= */

const registerFailureCleanup =
  (
    response,
    uploadedFile
  ) => {
    if (
      !uploadedFile ||
      !uploadedFile.filepath
    ) {
      return;
    }

    let handled =
      false;

    response.once(
      "finish",
      () => {
        if (
          handled
        ) {
          return;
        }

        handled =
          true;

        if (
          response.statusCode <
          400
        ) {
          return;
        }

        removeTemporaryFile(
          uploadedFile
        ).catch(
          () => {}
        );
      }
    );
  };

/* =========================================================
   PARSE COMMERCIAL PAYMENT FORM

   Accepted multipart fields:

   plan_id
   payment_method
   amount
   transaction_id
   payment_proof
========================================================= */

const parseCommercialPaymentForm =
  async (
    request,
    response,
    next
  ) => {
    if (
      !isMultipartRequest(
        request
      )
    ) {
      return next();
    }

    let parsedFiles =
      {};

    let uploadedFile =
      null;

    try {
      await fs.mkdir(
        COMMERCIAL_PAYMENT_TEMP_DIRECTORY,
        {
          recursive:
            true,
        }
      );

      const form =
        createForm({
          uploadDir:
            COMMERCIAL_PAYMENT_TEMP_DIRECTORY,

          keepExtensions:
            true,

          multiples:
            false,

          allowEmptyFiles:
            false,

          maxFiles:
            1,

          maxFileSize:
            MAX_COMMERCIAL_PAYMENT_FILE_SIZE,

          maxTotalFileSize:
            MAX_COMMERCIAL_PAYMENT_FILE_SIZE,
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
                parsedFiles =
                  files || {};

                if (
                  error
                ) {
                  return reject(
                    error
                  );
                }

                return resolve({
                  fields:
                    fields || {},

                  files:
                    files || {},
                });
              }
            );
          }
        );

      /* ===================================================
         ONLY payment_proof FILE FIELD ALLOWED
      =================================================== */

      const fileFieldNames =
        Object.keys(
          parsedData.files ||
            {}
        ).filter(
          (
            fieldName
          ) => {
            return Boolean(
              getFirstFile(
                parsedData.files[
                  fieldName
                ]
              )
            );
          }
        );

      const unsupportedFileField =
        fileFieldNames.find(
          (
            fieldName
          ) =>
            fieldName !==
            "payment_proof"
        );

      if (
        unsupportedFileField
      ) {
        throw createCommercialPaymentUploadError(
          400,

          `Unsupported Commercial payment upload field: ${unsupportedFileField}`,

          "COMMERCIAL_PAYMENT_INVALID_FILE_FIELD",

          unsupportedFileField
        );
      }

      uploadedFile =
        getFirstFile(
          parsedData.files
            .payment_proof
        );

      /* ===================================================
         PAYMENT PROOF VALIDATION
      =================================================== */

      if (
        uploadedFile
      ) {
        const mimeType =
          String(
            uploadedFile.mimetype ||
              ""
          ).toLowerCase();

        if (
          !ALLOWED_COMMERCIAL_PAYMENT_TYPES.has(
            mimeType
          )
        ) {
          throw createCommercialPaymentUploadError(
            415,

            "Payment proof must be JPG, PNG, WEBP or PDF.",

            "COMMERCIAL_PAYMENT_INVALID_PROOF_TYPE",

            "payment_proof"
          );
        }

        const fileSize =
          Number(
            uploadedFile.size ||
              0
          );

        if (
          !Number.isFinite(
            fileSize
          ) ||
          fileSize <=
            0
        ) {
          throw createCommercialPaymentUploadError(
            400,

            "Payment proof file is empty or invalid.",

            "COMMERCIAL_PAYMENT_INVALID_PROOF_FILE",

            "payment_proof"
          );
        }

        if (
          fileSize >
          MAX_COMMERCIAL_PAYMENT_FILE_SIZE
        ) {
          throw createCommercialPaymentUploadError(
            413,

            "Payment proof exceeds the allowed file size.",

            "COMMERCIAL_PAYMENT_PROOF_TOO_LARGE",

            "payment_proof"
          );
        }
      }

      /* ===================================================
         NORMALIZE BODY
      =================================================== */

      request.body = {
        ...(request.body ||
          {}),

        plan_id:
          getFirstValue(
            parsedData.fields
              .plan_id ??
            parsedData.fields
              .planId ??
            parsedData.fields
              .plan
          ),

        payment_method:
          getFirstValue(
            parsedData.fields
              .payment_method ??
            parsedData.fields
              .paymentMethod
          ),

        amount:
          getFirstValue(
            parsedData.fields
              .amount
          ),

        transaction_id:
          getFirstValue(
            parsedData.fields
              .transaction_id ??
            parsedData.fields
              .transactionId
          ),
      };

      /* ===================================================
         CONTROLLER EXPECTS THIS
      =================================================== */

      request.uploadedCommercialPaymentProof =
        uploadedFile;

      /* ===================================================
         OPTIONAL MANUAL CLEANUP
      =================================================== */

      request.cleanupCommercialPaymentTempProof =
        async () => {
          await removeTemporaryFile(
            uploadedFile
          );
        };

      /* ===================================================
         DOWNSTREAM FAILURE CLEANUP
      =================================================== */

      registerFailureCleanup(
        response,
        uploadedFile
      );

      return next();
    } catch (
      error
    ) {
      await removeTemporaryFiles(
        parsedFiles
      );

      if (
        error instanceof
        ApiError
      ) {
        return next(
          error
        );
      }

      const message =
        String(
          error?.message ||
            ""
        ).toLowerCase();

      if (
        message.includes(
          "maxfilesize"
        ) ||
        message.includes(
          "max file size"
        ) ||
        message.includes(
          "max total file size"
        )
      ) {
        return next(
          createCommercialPaymentUploadError(
            413,

            "Payment proof exceeds the allowed file size.",

            "COMMERCIAL_PAYMENT_PROOF_TOO_LARGE",

            "payment_proof"
          )
        );
      }

      return next(
        createCommercialPaymentUploadError(
          400,

          "Unable to process Commercial payment form.",

          "COMMERCIAL_PAYMENT_MULTIPART_PARSE_FAILED"
        )
      );
    }
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  COMMERCIAL_PAYMENT_TEMP_DIRECTORY,

  MAX_COMMERCIAL_PAYMENT_FILE_SIZE,

  ALLOWED_COMMERCIAL_PAYMENT_TYPES,

  getFirstValue,

  getFirstFile,

  removeTemporaryFile,

  removeTemporaryFiles,

  parseCommercialPaymentForm,
};