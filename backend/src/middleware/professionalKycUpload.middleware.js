const fs =
  require(
    "fs"
  );

const path =
  require(
    "path"
  );

const crypto =
  require(
    "crypto"
  );

const formidablePackage =
  require(
    "formidable"
  );

const {
  UPLOAD_ROOT,
  UPLOAD_PUBLIC_PATH,
} =
  require(
    "../services/fileStorage.service"
  );

/* =========================================================
   FORMIDABLE CREATOR

   Supports common Formidable export formats.
========================================================= */

const createFormidable =
  formidablePackage.formidable ||
  formidablePackage.default ||
  formidablePackage;

/* =========================================================
   PROFESSIONAL KYC STORAGE

   IMPORTANT:

   PRIVATE_ROOT
   ------------
   Aadhaar / PAN / Bank / Govt ID / Resume etc.
   NEVER exposed using express.static().

   PUBLIC_ROOT
   -----------
   Profile photo / cover / gallery / intro video.
========================================================= */

const PRIVATE_ROOT =
  path.resolve(
    __dirname,
    "../../storage/private/professional-kyc"
  );

const PRIVATE_TEMP_ROOT =
  path.join(
    PRIVATE_ROOT,
    ".tmp"
  );

const PUBLIC_ROOT =
  path.join(
    UPLOAD_ROOT,
    "professional-kyc",
    "public"
  );

/* =========================================================
   LIMITS
========================================================= */

const MB =
  1024 *
  1024;

const DEFAULT_DOCUMENT_MAX_SIZE =
  5 * MB;

const RESUME_MAX_SIZE =
  10 * MB;

const WORK_SAMPLE_MAX_SIZE =
  10 * MB;

const IMAGE_MAX_SIZE =
  5 * MB;

const VIDEO_MAX_SIZE =
  50 * MB;

const MAX_TOTAL_FILE_SIZE =
  100 * MB;

const MAX_FILES =
  20;

const MAX_FIELDS =
  150;

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

const RESUME_MIME_TYPES =
  new Set([
    "application/pdf",

    "application/msword",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

const WORK_SAMPLE_MIME_TYPES =
  new Set([
    "application/pdf",

    "image/jpeg",

    "image/png",

    "image/webp",

    "application/msword",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]);

const VIDEO_MIME_TYPES =
  new Set([
    "video/mp4",

    "video/webm",

    "video/quicktime",
  ]);

/* =========================================================
   MIME -> SAFE EXTENSION

   Never trust the client filename extension
   when creating the stored filename.
========================================================= */

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

    "application/msword":
      ".doc",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      ".docx",

    "video/mp4":
      ".mp4",

    "video/webm":
      ".webm",

    "video/quicktime":
      ".mov",
  });

/* =========================================================
   FILE FIELD POLICIES

   privacy:
   - private => never public static storage
   - public  => public profile media storage

   multiple:
   - true => multiple files supported

   maxFiles:
   - per-field limit
========================================================= */

const FILE_POLICIES =
  Object.freeze({
    /* =====================================================
       A. IDENTITY & KYC
    ===================================================== */

    aadhar_front: {
      section:
        "A",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DEFAULT_DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    aadhar_back: {
      section:
        "A",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DEFAULT_DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    pan_front: {
      section:
        "A",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DEFAULT_DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    /* =====================================================
       B. CONTACT & ADDRESS
    ===================================================== */

    address_proof: {
      section:
        "B",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DEFAULT_DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    /* =====================================================
       C. LEGAL & PROFESSIONAL COMPLIANCE
    ===================================================== */

    professional_license_document: {
      section:
        "C",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DEFAULT_DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    council_registration_document: {
      section:
        "C",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DEFAULT_DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    professional_indemnity_insurance: {
      section:
        "C",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DEFAULT_DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    firm_pan_document: {
      section:
        "C",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DEFAULT_DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    professional_gst_document: {
      section:
        "C",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DEFAULT_DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    /* =====================================================
       D. EDUCATION & QUALIFICATION
    ===================================================== */

    education_certificate: {
      section:
        "D",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DEFAULT_DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    /* =====================================================
       E. ACHIEVEMENTS & CERTIFICATIONS
    ===================================================== */

    reference_letters: {
      section:
        "E",

      /*
        Kept private by default.

        Public sharing can later be handled
        explicitly from the public-profile module.
      */

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DEFAULT_DOCUMENT_MAX_SIZE,

      multiple:
        true,

      maxFiles:
        5,
    },

    /* =====================================================
       F. WORK EXPERIENCE & PORTFOLIO
    ===================================================== */

    work_samples: {
      section:
        "F",

      /*
        Private-by-default storage.

        User can explicitly publish selected work
        later through the public profile module.
      */

      privacy:
        "private",

      types:
        WORK_SAMPLE_MIME_TYPES,

      maxSize:
        WORK_SAMPLE_MAX_SIZE,

      multiple:
        true,

      maxFiles:
        5,
    },

    resume_cv: {
      section:
        "F",

      privacy:
        "private",

      types:
        RESUME_MIME_TYPES,

      maxSize:
        RESUME_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    /* =====================================================
       G. INTEREST, SKILLS & BIO
    ===================================================== */

    profile_pic: {
      section:
        "G",

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

    cover_photo: {
      section:
        "G",

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
        "G",

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

    intro_video: {
      section:
        "G",

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

    /* =====================================================
       H. FINANCIAL & BANK
    ===================================================== */

    bank_proof: {
      section:
        "H",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DEFAULT_DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    income_tax_declaration: {
      section:
        "H",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DEFAULT_DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },

    nomini_id_document: {
      section:
        "H",

      privacy:
        "private",

      types:
        DOCUMENT_MIME_TYPES,

      maxSize:
        DEFAULT_DOCUMENT_MAX_SIZE,

      multiple:
        false,

      maxFiles:
        1,
    },
  });

/* =========================================================
   SECTION FILE FIELD MAP
========================================================= */

const SECTION_FILE_FIELDS =
  Object.freeze({
    A: [
      "aadhar_front",
      "aadhar_back",
      "pan_front",
    ],

    B: [
      "address_proof",
    ],

    C: [
      "professional_license_document",
      "council_registration_document",
      "professional_indemnity_insurance",
      "firm_pan_document",
      "professional_gst_document",
    ],

    D: [
      "education_certificate",
    ],

    E: [
      "reference_letters",
    ],

    F: [
      "work_samples",
      "resume_cv",
    ],

    G: [
      "profile_pic",
      "cover_photo",
      "gallery_photos",
      "intro_video",
    ],

    H: [
      "bank_proof",
      "income_tax_declaration",
      "nomini_id_document",
    ],

    I: [],

    J: [],
  });

/* =========================================================
   DIRECTORY HELPERS
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

const ensureProfessionalStorage =
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
   TEXT HELPER
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const normalized =
    String(
      value ?? ""
    ).trim();

  return (
    normalized ||
    fallback
  );
};

/* =========================================================
   SECTION NORMALIZER
========================================================= */

const normalizeSection =
  (
    value
  ) => {
    const section =
      toText(
        value
      ).toUpperCase();

    if (
      ![
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
      ].includes(
        section
      )
    ) {
      return "";
    }

    return section;
  };

/* =========================================================
   ERROR CREATOR
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
   PUBLIC PATH NORMALIZER
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
   DATE DIRECTORY
========================================================= */

const getDateDirectory =
  () => {
    const now =
      new Date();

    const year =
      String(
        now.getFullYear()
      );

    const month =
      String(
        now.getMonth() +
          1
      ).padStart(
        2,
        "0"
      );

    return {
      year,
      month,
    };
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
   SAFE FIELD PREFIX
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
        50
      );
  };

/* =========================================================
   SAFE STORED FILE NAME
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

        "Unsupported file type.",

        "PROFESSIONAL_KYC_UNSUPPORTED_FILE_TYPE",

        {
          field:
            fieldName,
        }
      );
    }

    const safeField =
      sanitizeFieldName(
        fieldName
      );

    const uniqueId =
      createUniqueId();

    return `${safeField}-${Date.now()}-${uniqueId}${extension}`;
  };

/* =========================================================
   ARRAY NORMALIZER
========================================================= */

const asArray =
  (
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

/* =========================================================
   NORMALIZE FORM FIELD

   Formidable frequently returns field values
   as arrays.
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

/* =========================================================
   NORMALIZE ALL FORM FIELDS
========================================================= */

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
   PARSE "values" JSON

   Frontend may send:

   values = JSON.stringify({...})

   together with files.
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

        "Invalid Professional KYC form values.",

        "INVALID_PROFESSIONAL_KYC_VALUES"
      );
    }
  };

/* =========================================================
   GET FILE MIME
========================================================= */

const getFileMimeType =
  (
    file
  ) => {
    return toText(
      file?.mimetype
    )
      .toLowerCase();
  };

/* =========================================================
   GET FILE SIZE
========================================================= */

const getFileSize =
  (
    file
  ) => {
    return Number(
      file?.size ||
        0
    );
  };

/* =========================================================
   GET TEMP FILE PATH
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

/* =========================================================
   VALIDATE ONE FILE
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

        "PROFESSIONAL_KYC_FILE_PATH_MISSING",

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

        "PROFESSIONAL_KYC_INVALID_FILE_TYPE",

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
      fileSize <= 0
    ) {
      throw createUploadError(
        400,

        "Empty files are not allowed.",

        "PROFESSIONAL_KYC_EMPTY_FILE",

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

        "PROFESSIONAL_KYC_FILE_TOO_LARGE",

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
   FIELD DISPLAY NAMES
========================================================= */

const FIELD_DISPLAY_NAMES =
  Object.freeze({
    aadhar_front:
      "Aadhaar front",

    aadhar_back:
      "Aadhaar back",

    pan_front:
      "PAN card",

    address_proof:
      "Address proof",

    professional_license_document:
      "Professional license document",

    council_registration_document:
      "Council registration document",

    professional_indemnity_insurance:
      "Professional indemnity insurance",

    firm_pan_document:
      "Firm PAN document",

    professional_gst_document:
      "GST document",

    education_certificate:
      "Education certificate",

    reference_letters:
      "Reference letter",

    work_samples:
      "Work sample",

    resume_cv:
      "Resume / CV",

    profile_pic:
      "Profile photo",

    cover_photo:
      "Cover photo",

    gallery_photos:
      "Gallery photo",

    intro_video:
      "Intro video",

    bank_proof:
      "Bank proof",

    income_tax_declaration:
      "Income tax declaration",

    nomini_id_document:
      "Nominee ID document",
  });

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
   TYPE ERROR MESSAGE
========================================================= */

const getAllowedTypeMessage =
  (
    fieldName
  ) => {
    if (
      [
        "profile_pic",
        "cover_photo",
        "gallery_photos",
      ].includes(
        fieldName
      )
    ) {
      return `${getFieldDisplayName(
        fieldName
      )} must be JPG, PNG or WEBP.`;
    }

    if (
      fieldName ===
      "intro_video"
    ) {
      return "Intro video must be MP4, WEBM or MOV.";
    }

    if (
      fieldName ===
      "resume_cv"
    ) {
      return "Resume / CV must be PDF, DOC or DOCX.";
    }

    if (
      fieldName ===
      "work_samples"
    ) {
      return "Work samples must be PDF, JPG, PNG, WEBP, DOC or DOCX.";
    }

    return `${getFieldDisplayName(
      fieldName
    )} must be PDF, JPG or PNG.`;
  };

/* =========================================================
   MOVE FILE

   rename() normally works.

   EXDEV fallback handles cross-device storage.
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
          "[Professional KYC Upload Cleanup]",
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
            toText
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
   FLATTEN FORMIDABLE FILES

   Result:

   [
     {
       fieldName,
       file
     }
   ]
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
   GET ALL FORMIDABLE TEMP PATHS
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
   VALIDATE FIELD EXISTS
========================================================= */

const getFilePolicy =
  (
    fieldName
  ) => {
    const policy =
      FILE_POLICIES[
        fieldName
      ];

    if (
      !policy
    ) {
      throw createUploadError(
        400,

        `Unsupported Professional KYC upload field: ${fieldName}`,

        "PROFESSIONAL_KYC_INVALID_FILE_FIELD",

        {
          field:
            fieldName,
        }
      );
    }

    return policy;
  };

/* =========================================================
   VALIDATE SECTION FIELD

   Example:
   section A cannot upload bank_proof.
========================================================= */

const validateSectionFile =
  (
    section,
    fieldName,
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
          fieldName
        )} does not belong to Professional KYC Section ${section}.`,

        "PROFESSIONAL_KYC_FILE_SECTION_MISMATCH",

        {
          field:
            fieldName,

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
   VALIDATE PER-FIELD FILE COUNT
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

        "PROFESSIONAL_KYC_TOO_MANY_FIELD_FILES",

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

        "PROFESSIONAL_KYC_MULTIPLE_FILES_NOT_ALLOWED",

        {
          field:
            fieldName,
        }
      );
    }
  };

/* =========================================================
   BUILD DESTINATION

   Public example:
   /uploads/professional-kyc/public/2026/08/file.jpg

   Private DB storage key:
   private/professional-kyc/2026/08/file.pdf
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
        `${publicPrefix}/professional-kyc/public/${year}/${month}/${filename}`;

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

    /*
      Never store an absolute machine path
      in the database.

      Later secure-download controller can map
      this private storage key to PRIVATE_ROOT.
    */

    const savedPath =
      `private/professional-kyc/${year}/${month}/${filename}`;

    return {
      absolutePath,

      savedPath,

      privacy:
        "private",
    };
  };

/* =========================================================
   STORE ONE FILE
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
   PARSE FORMIDABLE
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
          return reject(
            error
          );
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
                .professionalParsedFiles =
                files ||
                {};

              return reject(
                error
              );
            }

            return resolve({
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
   FORMAT FORMIDABLE ERROR
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
      )
        .toLowerCase();

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

        "Professional KYC upload exceeds the allowed file size or upload limit.",

        "PROFESSIONAL_KYC_UPLOAD_LIMIT_EXCEEDED"
      );
    }

    return createUploadError(
      400,

      "Unable to process Professional KYC file upload.",

      "PROFESSIONAL_KYC_MULTIPART_PARSE_FAILED",

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
   IS MULTIPART REQUEST
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
   REGISTER ERROR RESPONSE CLEANUP

   If controller/service/database later fails,
   newly stored files must not remain orphaned.

   2xx / 3xx:
   Keep files.

   4xx / 5xx:
   Remove files saved by this request.
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
              "[Professional KYC Response Cleanup]",
              error
            );
          }
        );
      }
    );
  };

/* =========================================================
   MAIN PROFESSIONAL KYC UPLOAD MIDDLEWARE

   JSON request:
   ------------
   untouched -> next()

   multipart/form-data:
   --------------------
   formidable parse
   validate
   store
   req.body
   req.uploadedFiles
========================================================= */

const parseProfessionalKycUpload =
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
      return next();
    }

    let parsedFiles = {};

    const movedAbsolutePaths =
      [];

    try {
      await ensureProfessionalStorage();

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

      /* ===================================================
         GLOBAL COUNT
      =================================================== */

      if (
        flattenedFiles.length >
        MAX_FILES
      ) {
        throw createUploadError(
          400,

          `A maximum of ${MAX_FILES} files can be uploaded in one Professional KYC request.`,

          "PROFESSIONAL_KYC_TOO_MANY_FILES"
        );
      }

      /* ===================================================
         GROUP FILES BY FIELD
      =================================================== */

      const filesByField =
        new Map();

      for (
        const {
          fieldName,
          file,
        }
        of flattenedFiles
      ) {
        if (
          !filesByField.has(
            fieldName
          )
        ) {
          filesByField.set(
            fieldName,
            []
          );
        }

        filesByField
          .get(
            fieldName
          )
          .push(
            file
          );
      }

      const uploadedFiles =
        {};

      /* ===================================================
         VALIDATE + MOVE
      =================================================== */

      for (
        const [
          fieldName,
          fieldFiles,
        ]
        of filesByField.entries()
      ) {
        const policy =
          getFilePolicy(
            fieldName
          );

        validateSectionFile(
          section,
          fieldName,
          policy
        );

        validateFileCount(
          fieldName,
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
              fieldName,
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

        if (
          policy.multiple
        ) {
          uploadedFiles[
            fieldName
          ] =
            storedFiles;
        } else {
          uploadedFiles[
            fieldName
          ] =
            storedFiles[0] ||
            null;
        }
      }

      /* ===================================================
         REQUEST VALUES
      =================================================== */

      req.body =
        normalizedFields;

      req.uploadedFiles =
        uploadedFiles;

      /* ===================================================
         METADATA

         Useful later for secure download / audit logging.
      =================================================== */

      req.professionalKycUploadMeta = {
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
         MANUAL CLEANUP HELPER

         Controller can call this if necessary.
      =================================================== */

      req.cleanupProfessionalKycUploads =
        async () => {
          await cleanupFilePaths(
            movedAbsolutePaths
          );
        };

      /*
        Automatic cleanup if downstream request
        returns an error.
      */

      registerFailureCleanup(
        res,
        movedAbsolutePaths
      );

      return next();
    } catch (
      error
    ) {
      const temporaryPaths =
        getTemporaryFilePaths(
          parsedFiles
        );

      await cleanupFilePaths([
        ...temporaryPaths,

        ...movedAbsolutePaths,
      ]);

      return next(
        normalizeFormidableError(
          error
        )
      );
    }
  };

/* =========================================================
   OPTIONAL SECTION-SPECIFIC WRAPPER

   Usage example:

   parseProfessionalKycSectionUpload("A")
========================================================= */

const parseProfessionalKycSectionUpload =
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
        "A valid Professional KYC section is required."
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
        return next(
          createUploadError(
            400,

            `Expected Professional KYC Section ${normalizedExpected}.`,

            "PROFESSIONAL_KYC_SECTION_MISMATCH"
          )
        );
      }

      /*
        Fixed section routes such as:
        /sections/A/save

        Ensure middleware validates uploaded fields
        against A even if route implementation changes.
      */

      if (
        !req.params
      ) {
        req.params = {};
      }

      req.params.section =
        normalizedExpected;

      return parseProfessionalKycUpload(
        req,
        res,
        next
      );
    };
  };

/* =========================================================
   SECURE PRIVATE STORAGE KEY CHECK

   Later private-document download controller
   can reuse this helper.
========================================================= */

const isProfessionalPrivateStorageKey =
  (
    value
  ) => {
    const key =
      toText(
        value
      )
        .replace(
          /\\/g,
          "/"
        );

    return (
      key.startsWith(
        "private/professional-kyc/"
      ) &&
      !key.includes(
        ".."
      )
    );
  };

/* =========================================================
   PRIVATE STORAGE KEY -> ABSOLUTE PATH

   IMPORTANT:
   Use only after authenticated / authorized
   member or admin access check.
========================================================= */

const resolveProfessionalPrivateStoragePath =
  (
    storageKey
  ) => {
    if (
      !isProfessionalPrivateStorageKey(
        storageKey
      )
    ) {
      throw createUploadError(
        400,

        "Invalid private Professional KYC document path.",

        "INVALID_PROFESSIONAL_PRIVATE_FILE_PATH"
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
          /^private\/professional-kyc\//,
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

        "Invalid private Professional KYC document path.",

        "INVALID_PROFESSIONAL_PRIVATE_FILE_PATH"
      );
    }

    return resolvedPath;
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  /* =========================
     MAIN MIDDLEWARE
  ========================= */

  parseProfessionalKycUpload,

  parseProfessionalKycSectionUpload,

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

  SECTION_FILE_FIELDS,

  /* =========================
     PRIVATE FILE HELPERS
  ========================= */

  isProfessionalPrivateStorageKey,

  resolveProfessionalPrivateStoragePath,

  /* =========================
     CLEANUP
  ========================= */

  cleanupProfessionalKycUploadedFiles:
    async (
      req
    ) => {
      if (
        typeof req
          ?.cleanupProfessionalKycUploads ===
        "function"
      ) {
        await req
          .cleanupProfessionalKycUploads();
      }
    },
};