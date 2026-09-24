const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const formidablePackage = require("formidable");

const {
  UPLOAD_ROOT,
  UPLOAD_PUBLIC_PATH,
} = require(
  "../services/fileStorage.service"
);

const createFormidable =
  formidablePackage.formidable ||
  formidablePackage.default ||
  formidablePackage;

/* =========================================================
   COMMERCIAL KYC STORAGE

   PRIVATE_ROOT
   ------------
   Owner KYC / PAN / Legal / Bank / Nominee documents.
   NEVER expose through express.static().

   PUBLIC_ROOT
   -----------
   Business logo / gallery / promo video only.
========================================================= */

const PRIVATE_ROOT =
  path.resolve(
    __dirname,
    "../../storage/private/commercial-kyc"
  );

const PRIVATE_TEMP_ROOT =
  path.join(
    PRIVATE_ROOT,
    ".tmp"
  );

const PUBLIC_ROOT =
  path.join(
    UPLOAD_ROOT,
    "commercial-kyc",
    "public"
  );

/* =========================================================
   LIMITS
========================================================= */

const MB =
  1024 * 1024;

const DOCUMENT_MAX_SIZE =
  5 * MB;

const IMAGE_MAX_SIZE =
  5 * MB;

const VIDEO_MAX_SIZE =
  50 * MB;

const MAX_TOTAL_FILE_SIZE =
  110 * MB;

const MAX_FILES =
  25;

const MAX_FIELDS =
  180;

const MAX_FIELDS_SIZE =
  2 * MB;

/* =========================================================
   MIME GROUPS
========================================================= */

const DOCUMENT_MIME_TYPES =
  new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
  ]);

const IMAGE_MIME_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

const VIDEO_MIME_TYPES =
  new Set([
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ]);

const MIME_EXTENSION_MAP =
  Object.freeze({
    "application/pdf":
      ".pdf",

    "image/jpeg":
      ".jpg",

    "image/png":
      ".png",

    "image/webp":
      ".webp",

    "video/mp4":
      ".mp4",

    "video/webm":
      ".webm",

    "video/quicktime":
      ".mov",
  });

/* =========================================================
   FILE POLICIES

   PRIVATE:
   - Owner KYC
   - Business legal docs
   - Bank docs
   - Nominee docs

   PUBLIC:
   - Business Logo
   - Gallery
   - Promo Video
========================================================= */

const FILE_POLICIES =
  Object.freeze({
    /* =====================================================
       A. OWNER IDENTITY & KYC
    ===================================================== */

    aadhaar_front: {
      section:
        "A",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    aadhaar_back: {
      section:
        "A",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    pan_card_scan: {
      section:
        "A",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    /* =====================================================
       B. BUSINESS LEGAL & REGISTRATION
    ===================================================== */

    gst_certificate: {
      section:
        "B",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    shop_establishment_license: {
      section:
        "B",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    trade_license: {
      section:
        "B",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    industry_specific_license: {
      section:
        "B",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    incorporation_certificate: {
      section:
        "B",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    partnership_deed_moa_aoa: {
      section:
        "B",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    authorized_signatory_id_proof: {
      section:
        "B",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    /* =====================================================
       D. FINANCIAL & BANK
    ===================================================== */

    bank_proof: {
      section:
        "D",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    nominee_id_document: {
      section:
        "D",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    /* =====================================================
       E. BUSINESS PROFILE & ACHIEVEMENTS
    ===================================================== */

    business_logo: {
      section:
        "E",

      privacy:
        "public",

      types:
        IMAGE_MIME_TYPES,

      maxSize:
        IMAGE_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    gallery_photos: {
      section:
        "E",

      privacy:
        "public",

      types:
        IMAGE_MIME_TYPES,

      maxSize:
        IMAGE_MAX_SIZE,

      multiple:
        true,

      maxFiles:
        10,
    },

    promo_video: {
      section:
        "E",

      privacy:
        "public",

      types:
        VIDEO_MIME_TYPES,

      maxSize:
        VIDEO_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },
  });

/* =========================================================
   FILE FIELD ALIASES

   Frontend alternate names accepted.
   Stored internally using canonical names.
========================================================= */

const FILE_FIELD_ALIASES =
  Object.freeze({
    aadhar_front:
      "aadhaar_front",

    aadhar_back:
      "aadhaar_back",

    pan_document:
      "pan_card_scan",

    business_gst_certificate:
      "gst_certificate",

    fssai_industry_license:
      "industry_specific_license",

    passbook_cancelled_cheque:
      "bank_proof",

    commercial_bank_proof:
      "bank_proof",

    commercial_nominee_id_document:
      "nominee_id_document",

    business_photo:
      "business_logo",

    business_gallery_photos:
      "gallery_photos",

    business_promo_video:
      "promo_video",
  });

/* =========================================================
   SECTION FILE FIELDS
========================================================= */

const SECTION_FILE_FIELDS =
  Object.freeze({
    A: [
      "aadhaar_front",
      "aadhaar_back",
      "pan_card_scan",
    ],

    B: [
      "gst_certificate",
      "shop_establishment_license",
      "trade_license",
      "industry_specific_license",
      "incorporation_certificate",
      "partnership_deed_moa_aoa",
      "authorized_signatory_id_proof",
    ],

    C: [],

    D: [
      "bank_proof",
      "nominee_id_document",
    ],

    E: [
      "business_logo",
      "gallery_photos",
      "promo_video",
    ],

    F: [],

    G: [],
  });

/* =========================================================
   DISPLAY NAMES
========================================================= */

const FIELD_DISPLAY_NAMES =
  Object.freeze({
    aadhaar_front:
      "Aadhaar front",

    aadhaar_back:
      "Aadhaar back",

    pan_card_scan:
      "PAN card scan",

    gst_certificate:
      "GST certificate",

    shop_establishment_license:
      "Shop & Establishment license",

    trade_license:
      "Trade license",

    industry_specific_license:
      "FSSAI / industry-specific license",

    incorporation_certificate:
      "Incorporation certificate",

    partnership_deed_moa_aoa:
      "Partnership Deed / MOA-AOA",

    authorized_signatory_id_proof:
      "Authorized Signatory ID proof",

    bank_proof:
      "Passbook / Cancelled Cheque",

    nominee_id_document:
      "Nominee ID document",

    business_logo:
      "Business logo / photo",

    gallery_photos:
      "Gallery photo",

    promo_video:
      "Promo video",
  });

/* =========================================================
   BASIC HELPERS
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

const asArray = (
  value
) => {
  if (
    Array.isArray(
      value
    )
  ) {
    return value;
  }

  if (
    value === null ||
    typeof value ===
      "undefined"
  ) {
    return [];
  }

  return [
    value,
  ];
};

const normalizeSection = (
  value
) => {
  const section =
    toText(
      value
    ).toUpperCase();

  return [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
  ].includes(
    section
  )
    ? section
    : "";
};

const normalizeCanonicalFieldName =
  (
    value
  ) => {
    const fieldName =
      toText(
        value
      );

    return (
      FILE_FIELD_ALIASES[
        fieldName
      ] ||
      fieldName
    );
  };

/* =========================================================
   ERROR
========================================================= */

const createUploadError =
  (
    statusCode,
    message,
    errorCode,
    {
      field = null,
      details = null,
    } = {}
  ) => {
    const error =
      new Error(
        message
      );

    error.statusCode =
      statusCode;

    error.errorCode =
      errorCode;

    error.code =
      errorCode;

    if (
      field
    ) {
      error.fieldErrors = {
        [field]:
          message,
      };

      error.errors = [
        {
          field,

          message,

          code:
            errorCode,
        },
      ];
    }

    if (
      details
    ) {
      error.details =
        details;
    }

    return error;
  };

/* =========================================================
   DIRECTORY
========================================================= */

const ensureDirectory =
  async (
    directory
  ) => {
    await fs.promises.mkdir(
      directory,
      {
        recursive:
          true,
      }
    );
  };

/* =========================================================
   INITIALIZE STORAGE
========================================================= */

const ensureCommercialStorage =
  async () => {
    await Promise.all([
      ensureDirectory(
        PRIVATE_ROOT
      ),

      ensureDirectory(
        PRIVATE_TEMP_ROOT
      ),

      ensureDirectory(
        PUBLIC_ROOT
      ),
    ]);
  };

/* =========================================================
   PUBLIC PATH PREFIX
========================================================= */

const normalizePublicPathPrefix =
  (
    value
  ) => {
    let prefix =
      toText(
        value,
        "/uploads"
      );

    if (
      !prefix.startsWith(
        "/"
      )
    ) {
      prefix =
        `/${prefix}`;
    }

    return prefix.replace(
      /\/+$/,
      ""
    );
  };

/* =========================================================
   UNIQUE ID
========================================================= */

const createUniqueId =
  () => {
    if (
      typeof crypto.randomUUID ===
      "function"
    ) {
      return crypto
        .randomUUID()
        .replace(
          /-/g,
          ""
        );
    }

    return crypto
      .randomBytes(
        16
      )
      .toString(
        "hex"
      );
  };

/* =========================================================
   SAFE FIELD NAME
========================================================= */

const sanitizeFieldName =
  (
    value
  ) => {
    return toText(
      value,
      "file"
    )
      .toLowerCase()
      .replace(
        /[^a-z0-9_-]/g,
        "-"
      )
      .replace(
        /-+/g,
        "-"
      )
      .slice(
        0,
        60
      );
  };

/* =========================================================
   STORED FILE NAME
========================================================= */

const createStoredFilename =
  (
    fieldName,
    mimeType
  ) => {
    const extension =
      MIME_EXTENSION_MAP[
        mimeType
      ];

    if (
      !extension
    ) {
      throw createUploadError(
        415,

        "Unsupported Commercial KYC file type.",

        "COMMERCIAL_KYC_UNSUPPORTED_FILE_TYPE",

        {
          field:
            fieldName,
        }
      );
    }

    return (
      `${sanitizeFieldName(
        fieldName
      )}-${Date.now()}-${createUniqueId()}${extension}`
    );
  };

/* =========================================================
   YEAR / MONTH DIRECTORY
========================================================= */

const getDateDirectory =
  () => {
    const now =
      new Date();

    return {
      year:
        String(
          now.getFullYear()
        ),

      month:
        String(
          now.getMonth() +
            1
        ).padStart(
          2,
          "0"
        ),
    };
  };

/* =========================================================
   FORM FIELD NORMALIZATION
========================================================= */

const normalizeFieldValue =
  (
    value
  ) => {
    if (
      !Array.isArray(
        value
      )
    ) {
      return value;
    }

    if (
      value.length ===
      0
    ) {
      return "";
    }

    if (
      value.length ===
      1
    ) {
      return value[0];
    }

    return value;
  };

const normalizeFields =
  (
    fields
  ) => {
    const result = {};

    for (
      const [
        key,
        value,
      ]
      of Object.entries(
        fields ||
          {}
      )
    ) {
      result[
        key
      ] =
        normalizeFieldValue(
          value
        );
    }

    return result;
  };

/* =========================================================
   VALUES JSON
========================================================= */

const parseValuesField =
  (
    fields
  ) => {
    const normalized = {
      ...fields,
    };

    if (
      !Object.prototype
        .hasOwnProperty
        .call(
          normalized,
          "values"
        )
    ) {
      return normalized;
    }

    const rawValues =
      normalized.values;

    if (
      rawValues &&
      typeof rawValues ===
        "object" &&
      !Array.isArray(
        rawValues
      )
    ) {
      return normalized;
    }

    const valuesText =
      toText(
        Array.isArray(
          rawValues
        )
          ? rawValues[0]
          : rawValues
      );

    if (
      !valuesText
    ) {
      normalized.values =
        {};

      return normalized;
    }

    try {
      const parsed =
        JSON.parse(
          valuesText
        );

      if (
        !parsed ||
        typeof parsed !==
          "object" ||
        Array.isArray(
          parsed
        )
      ) {
        throw new Error(
          "values must be an object"
        );
      }

      normalized.values =
        parsed;

      return normalized;
    } catch {
      throw createUploadError(
        400,

        "Invalid Commercial KYC form values.",

        "INVALID_COMMERCIAL_KYC_VALUES"
      );
    }
  };

/* =========================================================
   FILE HELPERS
========================================================= */

const getFilePath =
  (
    file
  ) => {
    return toText(
      file?.filepath ??
        file?.path
    );
  };

const getFileMimeType =
  (
    file
  ) => {
    return toText(
      file?.mimetype
    ).toLowerCase();
  };

const getFileSize =
  (
    file
  ) => {
    return Number(
      file?.size ||
        0
    );
  };

const getFieldDisplayName =
  (
    fieldName
  ) => {
    return (
      FIELD_DISPLAY_NAMES[
        fieldName
      ] ||
      "File"
    );
  };

/* =========================================================
   FILE TYPE MESSAGE
========================================================= */

const getAllowedTypeMessage =
  (
    fieldName
  ) => {
    if (
      [
        "business_logo",
        "gallery_photos",
      ].includes(
        fieldName
      )
    ) {
      return (
        `${getFieldDisplayName(
          fieldName
        )} must be JPG, PNG or WEBP.`
      );
    }

    if (
      fieldName ===
      "promo_video"
    ) {
      return (
        "Promo video must be MP4, WEBM or MOV."
      );
    }

    return (
      `${getFieldDisplayName(
        fieldName
      )} must be PDF, JPG or PNG.`
    );
  };

/* =========================================================
   FILE POLICY
========================================================= */

const getFilePolicy =
  (
    fieldName
  ) => {
    const canonicalFieldName =
      normalizeCanonicalFieldName(
        fieldName
      );

    const policy =
      FILE_POLICIES[
        canonicalFieldName
      ];

    if (
      !policy
    ) {
      throw createUploadError(
        400,

        `Unsupported Commercial KYC upload field: ${fieldName}`,

        "COMMERCIAL_KYC_INVALID_FILE_FIELD",

        {
          field:
            fieldName,
        }
      );
    }

    return {
      canonicalFieldName,
      policy,
    };
  };

/* =========================================================
   SECTION VALIDATION
========================================================= */

const validateSectionFile =
  (
    section,
    canonicalFieldName,
    policy
  ) => {
    if (
      !section
    ) {
      return;
    }

    if (
      policy.section !==
      section
    ) {
      throw createUploadError(
        400,

        `${getFieldDisplayName(
          canonicalFieldName
        )} does not belong to Commercial KYC Section ${section}.`,

        "COMMERCIAL_KYC_FILE_SECTION_MISMATCH",

        {
          field:
            canonicalFieldName,

          details: {
            requestedSection:
              section,

            expectedSection:
              policy.section,
          },
        }
      );
    }
  };

/* =========================================================
   FILE COUNT
========================================================= */

const validateFileCount =
  (
    fieldName,
    count,
    policy
  ) => {
    if (
      count >
      policy.maxFiles
    ) {
      throw createUploadError(
        400,

        `${getFieldDisplayName(
          fieldName
        )} allows a maximum of ${policy.maxFiles} file${
          policy.maxFiles ===
          1
            ? ""
            : "s"
        }.`,

        "COMMERCIAL_KYC_TOO_MANY_FIELD_FILES",

        {
          field:
            fieldName,

          details: {
            maximum:
              policy.maxFiles,

            received:
              count,
          },
        }
      );
    }

    if (
      !policy.multiple &&
      count > 1
    ) {
      throw createUploadError(
        400,

        `Only one ${getFieldDisplayName(
          fieldName
        )} can be uploaded.`,

        "COMMERCIAL_KYC_MULTIPLE_FILES_NOT_ALLOWED",

        {
          field:
            fieldName,
        }
      );
    }
  };

/* =========================================================
   VALIDATE FILE
========================================================= */

const validateFile =
  (
    fieldName,
    file,
    policy
  ) => {
    const tempPath =
      getFilePath(
        file
      );

    if (
      !tempPath
    ) {
      throw createUploadError(
        400,

        "Uploaded file could not be processed.",

        "COMMERCIAL_KYC_FILE_PATH_MISSING",

        {
          field:
            fieldName,
        }
      );
    }

    const mimeType =
      getFileMimeType(
        file
      );

    if (
      !mimeType ||
      !policy.types.has(
        mimeType
      )
    ) {
      throw createUploadError(
        415,

        getAllowedTypeMessage(
          fieldName
        ),

        "COMMERCIAL_KYC_INVALID_FILE_TYPE",

        {
          field:
            fieldName,

          details: {
            mimeType,
          },
        }
      );
    }

    const fileSize =
      getFileSize(
        file
      );

    if (
      fileSize <=
      0
    ) {
      throw createUploadError(
        400,

        "Empty files are not allowed.",

        "COMMERCIAL_KYC_EMPTY_FILE",

        {
          field:
            fieldName,
        }
      );
    }

    if (
      fileSize >
      policy.maxSize
    ) {
      throw createUploadError(
        413,

        `${getFieldDisplayName(
          fieldName
        )} must be below ${Math.round(
          policy.maxSize /
            MB
        )} MB.`,

        "COMMERCIAL_KYC_FILE_TOO_LARGE",

        {
          field:
            fieldName,

          details: {
            maxSizeBytes:
              policy.maxSize,

            fileSizeBytes:
              fileSize,
          },
        }
      );
    }

    return {
      mimeType,
      fileSize,
      tempPath,
    };
  };

/* =========================================================
   MOVE FILE
========================================================= */

const moveFile =
  async (
    source,
    destination
  ) => {
    try {
      await fs.promises.rename(
        source,
        destination
      );
    } catch (
      error
    ) {
      if (
        error?.code !==
        "EXDEV"
      ) {
        throw error;
      }

      await fs.promises.copyFile(
        source,
        destination
      );

      await fs.promises.unlink(
        source
      );
    }
  };

/* =========================================================
   SAFE DELETE
========================================================= */

const safeDeleteFile =
  async (
    filePath
  ) => {
    const safePath =
      toText(
        filePath
      );

    if (
      !safePath
    ) {
      return;
    }

    try {
      await fs.promises.unlink(
        safePath
      );
    } catch (
      error
    ) {
      if (
        error?.code !==
        "ENOENT"
      ) {
        console.error(
          "[Commercial KYC Upload Cleanup]",
          error
        );
      }
    }
  };

/* =========================================================
   CLEANUP FILE LIST
========================================================= */

const cleanupFilePaths =
  async (
    filePaths
  ) => {
    const uniquePaths = [
      ...new Set(
        asArray(
          filePaths
        )
          .map(
            (
              value
            ) =>
              toText(
                value
              )
          )
          .filter(
            Boolean
          )
      ),
    ];

    await Promise.allSettled(
      uniquePaths.map(
        safeDeleteFile
      )
    );
  };

/* =========================================================
   FLATTEN FILES
========================================================= */

const flattenFiles =
  (
    files
  ) => {
    const result = [];

    for (
      const [
        fieldName,
        fileValue,
      ]
      of Object.entries(
        files ||
          {}
      )
    ) {
      for (
        const file
        of asArray(
          fileValue
        )
      ) {
        if (
          !file
        ) {
          continue;
        }

        result.push({
          fieldName,
          file,
        });
      }
    }

    return result;
  };

/* =========================================================
   TEMP FILE PATHS
========================================================= */

const getTemporaryFilePaths =
  (
    files
  ) => {
    return flattenFiles(
      files
    )
      .map(
        ({
          file,
        }) =>
          getFilePath(
            file
          )
      )
      .filter(
        Boolean
      );
  };

/* =========================================================
   DESTINATION

   Public:
   /uploads/commercial-kyc/public/YYYY/MM/file.jpg

   Private:
   private/commercial-kyc/YYYY/MM/file.pdf
========================================================= */

const buildDestination =
  async (
    fieldName,
    policy,
    mimeType
  ) => {
    const {
      year,
      month,
    } =
      getDateDirectory();

    const filename =
      createStoredFilename(
        fieldName,
        mimeType
      );

    if (
      policy.privacy ===
      "public"
    ) {
      const directory =
        path.join(
          PUBLIC_ROOT,
          year,
          month
        );

      await ensureDirectory(
        directory
      );

      const absolutePath =
        path.join(
          directory,
          filename
        );

      const publicPrefix =
        normalizePublicPathPrefix(
          UPLOAD_PUBLIC_PATH
        );

      const savedPath =
        `${publicPrefix}/commercial-kyc/public/${year}/${month}/${filename}`;

      return {
        absolutePath,
        savedPath,
        privacy:
          "public",
      };
    }

    const directory =
      path.join(
        PRIVATE_ROOT,
        year,
        month
      );

    await ensureDirectory(
      directory
    );

    const absolutePath =
      path.join(
        directory,
        filename
      );

    const savedPath =
      `private/commercial-kyc/${year}/${month}/${filename}`;

    return {
      absolutePath,
      savedPath,
      privacy:
        "private",
    };
  };

/* =========================================================
   STORE FILE
========================================================= */

const storeFile =
  async (
    fieldName,
    file,
    policy
  ) => {
    const {
      mimeType,
      fileSize,
      tempPath,
    } =
      validateFile(
        fieldName,
        file,
        policy
      );

    const destination =
      await buildDestination(
        fieldName,
        policy,
        mimeType
      );

    await moveFile(
      tempPath,
      destination
        .absolutePath
    );

    return {
      fieldName,

      originalFilename:
        toText(
          file?.originalFilename
        ) ||
        null,

      mimetype:
        mimeType,

      size:
        fileSize,

      privacy:
        destination
          .privacy,

      savedPath:
        destination
          .savedPath,

      absolutePath:
        destination
          .absolutePath,
    };
  };

/* =========================================================
   PARSE MULTIPART
========================================================= */

const parseMultipartForm =
  (
    req
  ) => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        let form;

        try {
          form =
            createFormidable({
              uploadDir:
                PRIVATE_TEMP_ROOT,

              keepExtensions:
                false,

              allowEmptyFiles:
                false,

              multiples:
                true,

              maxFiles:
                MAX_FILES,

              maxFileSize:
                VIDEO_MAX_SIZE,

              maxTotalFileSize:
                MAX_TOTAL_FILE_SIZE,

              maxFields:
                MAX_FIELDS,

              maxFieldsSize:
                MAX_FIELDS_SIZE,
            });
        } catch (
          error
        ) {
          reject(
            error
          );

          return;
        }

        form.parse(
          req,
          (
            error,
            fields,
            files
          ) => {
            if (
              error
            ) {
              error
                .commercialParsedFiles =
                files ||
                {};

              reject(
                error
              );

              return;
            }

            resolve({
              fields:
                fields ||
                {},

              files:
                files ||
                {},
            });
          }
        );
      }
    );
  };

/* =========================================================
   FORMIDABLE ERROR
========================================================= */

const normalizeFormidableError =
  (
    error
  ) => {
    if (
      error?.statusCode
    ) {
      return error;
    }

    const code =
      Number(
        error?.code
      );

    const message =
      toText(
        error?.message
      ).toLowerCase();

    if (
      message.includes(
        "maxfilesize"
      ) ||
      message.includes(
        "max file size"
      ) ||
      message.includes(
        "maxfiles"
      ) ||
      message.includes(
        "max total file size"
      ) ||
      code === 1009 ||
      code === 1016
    ) {
      return createUploadError(
        413,

        "Commercial KYC upload exceeds the allowed file size or upload limit.",

        "COMMERCIAL_KYC_UPLOAD_LIMIT_EXCEEDED"
      );
    }

    return createUploadError(
      400,

      "Unable to process Commercial KYC file upload.",

      "COMMERCIAL_KYC_MULTIPART_PARSE_FAILED",

      {
        details: {
          originalMessage:
            toText(
              error?.message
            ),
        },
      }
    );
  };

/* =========================================================
   MULTIPART CHECK
========================================================= */

const isMultipartRequest =
  (
    req
  ) => {
    return Boolean(
      req?.is?.(
        "multipart/form-data"
      )
    );
  };

/* =========================================================
   FAILURE CLEANUP

   2xx / 3xx -> keep
   4xx / 5xx -> delete newly uploaded files
========================================================= */

const registerFailureCleanup =
  (
    res,
    storedAbsolutePaths
  ) => {
    let handled =
      false;

    res.once(
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
          res.statusCode <
          400
        ) {
          return;
        }

        cleanupFilePaths(
          storedAbsolutePaths
        ).catch(
          (
            error
          ) => {
            console.error(
              "[Commercial KYC Response Cleanup]",
              error
            );
          }
        );
      }
    );
  };

/* =========================================================
   MAIN COMMERCIAL KYC UPLOAD MIDDLEWARE
========================================================= */

const parseCommercialKycUpload =
  async (
    req,
    res,
    next
  ) => {
    if (
      !isMultipartRequest(
        req
      )
    ) {
      next();
      return;
    }

    let parsedFiles =
      {};

    const movedAbsolutePaths =
      [];

    try {
      await ensureCommercialStorage();

      const parsed =
        await parseMultipartForm(
          req
        );

      parsedFiles =
        parsed.files;

      const normalizedFields =
        parseValuesField(
          normalizeFields(
            parsed.fields
          )
        );

      const section =
        normalizeSection(
          req?.params
            ?.section ??
            normalizedFields
              ?.section
        );

      const flattenedFiles =
        flattenFiles(
          parsed.files
        );

      if (
        flattenedFiles.length >
        MAX_FILES
      ) {
        throw createUploadError(
          400,

          `A maximum of ${MAX_FILES} files can be uploaded in one Commercial KYC request.`,

          "COMMERCIAL_KYC_TOO_MANY_FILES"
        );
      }

      /* ===================================================
         GROUP BY CANONICAL FIELD NAME
      =================================================== */

      const filesByField =
        new Map();

      for (
        const {
          fieldName:
            rawFieldName,

          file,
        }
        of flattenedFiles
      ) {
        const canonicalFieldName =
          normalizeCanonicalFieldName(
            rawFieldName
          );

        if (
          !filesByField.has(
            canonicalFieldName
          )
        ) {
          filesByField.set(
            canonicalFieldName,
            []
          );
        }

        filesByField
          .get(
            canonicalFieldName
          )
          .push(
            file
          );
      }

      const uploadedFiles =
        {};

      /* ===================================================
         VALIDATE + STORE
      =================================================== */

      for (
        const [
          canonicalFieldName,
          fieldFiles,
        ]
        of filesByField.entries()
      ) {
        const {
          policy,
        } =
          getFilePolicy(
            canonicalFieldName
          );

        validateSectionFile(
          section,
          canonicalFieldName,
          policy
        );

        validateFileCount(
          canonicalFieldName,
          fieldFiles.length,
          policy
        );

        const storedFiles =
          [];

        for (
          const file
          of fieldFiles
        ) {
          const stored =
            await storeFile(
              canonicalFieldName,
              file,
              policy
            );

          storedFiles.push(
            stored
          );

          movedAbsolutePaths.push(
            stored
              .absolutePath
          );
        }

        uploadedFiles[
          canonicalFieldName
        ] =
          policy.multiple
            ? storedFiles
            : storedFiles[0] ||
              null;
      }

      /* ===================================================
         REQUEST DATA
      =================================================== */

      req.body =
        normalizedFields;

      req.uploadedFiles =
        uploadedFiles;

      /* ===================================================
         UPLOAD META
      =================================================== */

      req.commercialKycUploadMeta = {
        section:
          section ||
          null,

        uploadedFieldNames:
          Object.keys(
            uploadedFiles
          ),

        fileCount:
          movedAbsolutePaths
            .length,
      };

      /* ===================================================
         MANUAL CLEANUP
      =================================================== */

      req.cleanupCommercialKycUploads =
        async () => {
          await cleanupFilePaths(
            movedAbsolutePaths
          );
        };

      /* ===================================================
         ERROR RESPONSE CLEANUP
      =================================================== */

      registerFailureCleanup(
        res,
        movedAbsolutePaths
      );

      next();
    } catch (
      error
    ) {
      const temporaryPaths =
        getTemporaryFilePaths(
          error
            ?.commercialParsedFiles ||
            parsedFiles
        );

      await cleanupFilePaths([
        ...temporaryPaths,

        ...movedAbsolutePaths,
      ]);

      next(
        normalizeFormidableError(
          error
        )
      );
    }
  };

/* =========================================================
   SECTION SPECIFIC WRAPPER

   Example:
   parseCommercialKycSectionUpload("A")
========================================================= */

const parseCommercialKycSectionUpload =
  (
    expectedSection
  ) => {
    const normalizedExpected =
      normalizeSection(
        expectedSection
      );

    if (
      !normalizedExpected
    ) {
      throw new Error(
        "A valid Commercial KYC section is required."
      );
    }

    return async (
      req,
      res,
      next
    ) => {
      const requestSection =
        normalizeSection(
          req?.params
            ?.section
        );

      if (
        requestSection &&
        requestSection !==
          normalizedExpected
      ) {
        next(
          createUploadError(
            400,

            `Expected Commercial KYC Section ${normalizedExpected}.`,

            "COMMERCIAL_KYC_SECTION_MISMATCH"
          )
        );

        return;
      }

      if (
        !req.params
      ) {
        req.params =
          {};
      }

      req.params.section =
        normalizedExpected;

      await parseCommercialKycUpload(
        req,
        res,
        next
      );
    };
  };

/* =========================================================
   PRIVATE STORAGE KEY CHECK
========================================================= */

const isCommercialPrivateStorageKey =
  (
    value
  ) => {
    const key =
      toText(
        value
      ).replace(
        /\\/g,
        "/"
      );

    return (
      key.startsWith(
        "private/commercial-kyc/"
      ) &&
      !key.includes(
        ".."
      )
    );
  };

/* =========================================================
   PRIVATE STORAGE KEY -> ABSOLUTE PATH

   Only use after authenticated/authorized check.
========================================================= */

const resolveCommercialPrivateStoragePath =
  (
    storageKey
  ) => {
    if (
      !isCommercialPrivateStorageKey(
        storageKey
      )
    ) {
      throw createUploadError(
        400,

        "Invalid private Commercial KYC document path.",

        "INVALID_COMMERCIAL_PRIVATE_FILE_PATH"
      );
    }

    const relativePath =
      toText(
        storageKey
      )
        .replace(
          /\\/g,
          "/"
        )
        .replace(
          /^private\/commercial-kyc\//,
          ""
        );

    const resolvedPath =
      path.resolve(
        PRIVATE_ROOT,
        relativePath
      );

    const normalizedRoot =
      path.resolve(
        PRIVATE_ROOT
      );

    if (
      resolvedPath !==
        normalizedRoot &&
      !resolvedPath.startsWith(
        `${normalizedRoot}${path.sep}`
      )
    ) {
      throw createUploadError(
        400,

        "Invalid private Commercial KYC document path.",

        "INVALID_COMMERCIAL_PRIVATE_FILE_PATH"
      );
    }

    return resolvedPath;
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  /* =========================
     MAIN
  ========================= */

  parseCommercialKycUpload,

  parseCommercialKycSectionUpload,

  /* =========================
     STORAGE
  ========================= */

  PRIVATE_ROOT,

  PRIVATE_TEMP_ROOT,

  PUBLIC_ROOT,

  /* =========================
     POLICY
  ========================= */

  FILE_POLICIES,

  FILE_FIELD_ALIASES,

  SECTION_FILE_FIELDS,

  /* =========================
     PRIVATE FILE
  ========================= */

  isCommercialPrivateStorageKey,

  resolveCommercialPrivateStoragePath,

  /* =========================
     CLEANUP
  ========================= */

  cleanupCommercialKycUploadedFiles:
    async (
      req
    ) => {
      if (
        typeof req
          ?.cleanupCommercialKycUploads ===
        "function"
      ) {
        await req
          .cleanupCommercialKycUploads();
      }
    },
};