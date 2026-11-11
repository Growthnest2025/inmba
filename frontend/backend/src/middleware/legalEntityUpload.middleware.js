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

const LEGAL_ENTITY_TEMP_DIRECTORY =
  path.resolve(
    process.cwd(),
    "storage",
    "temp"
  );

const MAX_KYC_IMAGE_SIZE =
  Number(
    process.env
      .MAX_IMAGE_SIZE ||
      5 * 1024 * 1024
  );

const ALLOWED_KYC_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
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

const removeTemporaryFiles =
  async (
    files
  ) => {
    if (
      !files ||
      typeof files !==
        "object"
    ) {
      return;
    }

    await Promise.all(
      Object.values(
        files
      ).map(
        (
          file
        ) =>
          removeTemporaryFile(
            file
          )
      )
    );
  };

const validateKycFile =
  (
    file,
    label
  ) => {
    if (!file) {
      return;
    }

    if (
      !ALLOWED_KYC_IMAGE_TYPES
        .has(
          file.mimetype
        )
    ) {
      throw new ApiError(
        415,
        `${label} must be JPG, PNG or WEBP.`
      );
    }

    if (
      Number(
        file.size ||
          0
      ) >
      MAX_KYC_IMAGE_SIZE
    ) {
      throw new ApiError(
        413,
        `${label} exceeds the allowed file size.`
      );
    }
  };

/* =========================
   PARSE KYC FORM
========================= */

const parseLegalEntityForm =
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
      request
        .uploadedLegalEntityFiles =
        {};

      return next();
    }

    let uploadedFiles = {};

    try {
      await fs.mkdir(
        LEGAL_ENTITY_TEMP_DIRECTORY,
        {
          recursive:
            true,
        }
      );

      const form =
        createForm({
          uploadDir:
            LEGAL_ENTITY_TEMP_DIRECTORY,

          keepExtensions:
            true,

          multiples:
            false,

          maxFiles:
            3,

          maxFileSize:
            MAX_KYC_IMAGE_SIZE,
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

      uploadedFiles = {
        entity_aadhar_front:
          getFirstFile(
            parsedData.files
              .entity_aadhar_front
          ),

        entity_aadhar_back:
          getFirstFile(
            parsedData.files
              .entity_aadhar_back
          ),

        entity_aadhar_selfie:
          getFirstFile(
            parsedData.files
              .entity_aadhar_selfie
          ),
      };

      validateKycFile(
        uploadedFiles
          .entity_aadhar_front,
        "Aadhaar front image"
      );

      validateKycFile(
        uploadedFiles
          .entity_aadhar_back,
        "Aadhaar back image"
      );

      validateKycFile(
        uploadedFiles
          .entity_aadhar_selfie,
        "Aadhaar selfie"
      );

      request.body = {
        ...(request.body ||
          {}),

        entity_aadhar_number:
          getFirstValue(
            parsedData.fields
              .entity_aadhar_number
          ),

        entity_house_no:
          getFirstValue(
            parsedData.fields
              .entity_house_no
          ),

        entity_street:
          getFirstValue(
            parsedData.fields
              .entity_street
          ),

        entity_area:
          getFirstValue(
            parsedData.fields
              .entity_area
          ),

        entity_city:
          getFirstValue(
            parsedData.fields
              .entity_city
          ),

        entity_district:
          getFirstValue(
            parsedData.fields
              .entity_district
          ),

        entity_state:
          getFirstValue(
            parsedData.fields
              .entity_state
          ),

        entity_pincode:
          getFirstValue(
            parsedData.fields
              .entity_pincode
          ),
      };

      request
        .uploadedLegalEntityFiles =
        uploadedFiles;

      return next();
    } catch (error) {
      await removeTemporaryFiles(
        uploadedFiles
      );

      return next(
        error
      );
    }
  };

module.exports = {
  LEGAL_ENTITY_TEMP_DIRECTORY,
  MAX_KYC_IMAGE_SIZE,
  ALLOWED_KYC_IMAGE_TYPES,
  getFirstValue,
  getFirstFile,
  removeTemporaryFile,
  removeTemporaryFiles,
  validateKycFile,
  parseLegalEntityForm,
};