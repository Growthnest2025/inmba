const fs =
  require(
    "fs"
  );

const path =
  require(
    "path"
  );

const ApiError =
  require(
    "../utils/apiError"
  );

const {
  getSessionMemberId,
} = require(
  "./dashboard.controller"
);

const {
  getProfessionalKycByMemberId,
} = require(
  "../repositories/professionalKyc.repository"
);

const {
  createCurrentMemberQrJpeg,
  createLegacyQrJpeg,
  sendTemporaryDownload,
} = require(
  "../services/download.service"
);

/* =========================================================
   TEXT
========================================================= */

const toText = (
  value
) => {
  return String(
    value ?? ""
  ).trim();
};

/* =========================================================
   PROFESSIONAL PRIVATE DOCUMENT FIELDS

   IMPORTANT:

   These documents must NOT be exposed publicly.

   The logged-in owner can view only files stored
   against their own Professional KYC record.
========================================================= */

const PROFESSIONAL_PRIVATE_DOCUMENT_FIELDS =
  Object.freeze([
    /* SECTION A */

    "aadhar_front",
    "aadhar_back",
    "pan_front",

    /* SECTION B */

    "address_proof",

    /* SECTION C */

    "professional_license_document",
    "council_registration_document",
    "professional_indemnity_insurance",
    "firm_pan_document",
    "professional_gst_document",

    /* SECTION D */

    "education_certificate",

    /* SECTION F */

    "resume_cv",

    /* SECTION H */

    "bank_proof",
    "income_tax_declaration",
    "nomini_id_document",
  ]);

/* =========================================================
   NORMALIZE PRIVATE URL / PATH
========================================================= */

const normalizePrivateDocumentPath = (
  value
) => {
  const text =
    toText(
      value
    );

  if (
    !text
  ) {
    return "";
  }

  /* =======================================================
     FULL URL SUPPORT

     Example:

     http://127.0.0.1:5000/private/professional-kyc/...
  ======================================================= */

  if (
    text.startsWith(
      "http://"
    ) ||
    text.startsWith(
      "https://"
    )
  ) {
    try {
      const parsedUrl =
        new URL(
          text
        );

      return parsedUrl.pathname;
    } catch {
      return "";
    }
  }

  let normalized =
    text
      .replace(
        /\\/g,
        "/"
      )
      .trim();

  if (
    !normalized.startsWith(
      "/"
    )
  ) {
    normalized =
      `/${normalized}`;
  }

  return normalized;
};

/* =========================================================
   GET MEMBER PRIVATE DOCUMENT PATHS
========================================================= */

const getMemberPrivateDocumentPaths = (
  member
) => {
  const paths =
    new Set();

  for (
    const field
    of PROFESSIONAL_PRIVATE_DOCUMENT_FIELDS
  ) {
    const value =
      normalizePrivateDocumentPath(
        member?.[field]
      );

    if (
      value
    ) {
      paths.add(
        value
      );
    }
  }

  return paths;
};

/* =========================================================
   FILE EXISTS
========================================================= */

const fileExists =
  async (
    filePath
  ) => {
    try {
      const stats =
        await fs.promises
          .stat(
            filePath
          );

      return stats.isFile();
    } catch {
      return false;
    }
  };

/* =========================================================
   RESOLVE PRIVATE KYC FILE

   Saved DB path example:

   /private/professional-kyc/2026/08/file.pdf

   Existing Professional KYC upload implementations may
   place the physical file under slightly different private
   storage roots.

   We support safe known backend locations only.
========================================================= */

const resolveProfessionalPrivateFile =
  async (
    storedPath
  ) => {
    const normalizedPath =
      normalizePrivateDocumentPath(
        storedPath
      );

    if (
      !normalizedPath ||
      !normalizedPath.startsWith(
        "/private/professional-kyc/"
      )
    ) {
      return null;
    }

    /* =====================================================
       Prevent traversal

       Route-generated stored path should never contain:

       ../
       ..\
    ===================================================== */

    if (
      normalizedPath.includes(
        ".."
      )
    ) {
      return null;
    }

    const backendRoot =
      path.resolve(
        __dirname,
        "../.."
      );

    const relativePrivatePath =
      normalizedPath.replace(
        /^\/private\//,
        ""
      );

    /*
      Candidate 1:

      backend/private/professional-kyc/...
    */

    const candidateOne =
      path.resolve(
        backendRoot,
        `.${normalizedPath}`
      );

    /*
      Candidate 2:

      backend/storage/private/professional-kyc/...
    */

    const candidateTwo =
      path.resolve(
        backendRoot,
        "storage",
        "private",
        relativePrivatePath
          .replace(
            /^professional-kyc\//,
            "professional-kyc/"
          )
      );

    /*
      Candidate 3:

      backend/storage/uploads/private/professional-kyc/...
    */

    const candidateThree =
      path.resolve(
        backendRoot,
        "storage",
        "uploads",
        "private",
        relativePrivatePath
      );

    /*
      Candidate 4:

      backend/uploads/private/professional-kyc/...
    */

    const candidateFour =
      path.resolve(
        backendRoot,
        "uploads",
        "private",
        relativePrivatePath
      );

    /*
      Candidate 5:

      If upload service stores:

      backend/storage/uploads/professional-kyc/...
    */

    const candidateFive =
      path.resolve(
        backendRoot,
        "storage",
        "uploads",
        relativePrivatePath
      );

    const candidates = [
      candidateOne,
      candidateTwo,
      candidateThree,
      candidateFour,
      candidateFive,
    ];

    for (
      const candidate
      of candidates
    ) {
      if (
        await fileExists(
          candidate
        )
      ) {
        return candidate;
      }
    }

    return null;
  };

/* =========================================================
   CONTENT TYPE
========================================================= */

const getDocumentContentType = (
  filename
) => {
  const extension =
    path.extname(
      filename
    )
      .toLowerCase();

  switch (
    extension
  ) {
    case ".pdf":
      return "application/pdf";

    case ".jpg":
    case ".jpeg":
      return "image/jpeg";

    case ".png":
      return "image/png";

    case ".webp":
      return "image/webp";

    default:
      return "application/octet-stream";
  }
};

/* =========================================================
   SECURE PROFESSIONAL KYC DOCUMENT VIEW

   GET

   /private/professional-kyc/:year/:month/:filename

   SECURITY FLOW:

   Session
       ↓
   Logged-in Member ID
       ↓
   Professional DB row
       ↓
   Requested path must EXACTLY exist in that member's
   private KYC document fields
       ↓
   Physical file
       ↓
   Inline PDF/Image response
========================================================= */

const viewProfessionalPrivateKycDocumentController =
  async (
    request,
    response,
    next
  ) => {
    try {
      /* ===================================================
         AUTH
      =================================================== */

      const memberId =
        getSessionMemberId(
          request
        );

      if (
        !memberId
      ) {
        throw new ApiError(
          401,
          "Member authentication required."
        );
      }

      /* ===================================================
         PARAMS
      =================================================== */

      const year =
        toText(
          request.params.year
        );

      const month =
        toText(
          request.params.month
        );

      const filename =
        toText(
          request.params.filename
        );

      /* ===================================================
         YEAR VALIDATION
      =================================================== */

      if (
        !/^\d{4}$/.test(
          year
        )
      ) {
        throw new ApiError(
          400,
          "Invalid document year."
        );
      }

      /* ===================================================
         MONTH VALIDATION
      =================================================== */

      if (
        !/^(0[1-9]|1[0-2])$/.test(
          month
        )
      ) {
        throw new ApiError(
          400,
          "Invalid document month."
        );
      }

      /* ===================================================
         FILENAME VALIDATION

         No directories.
         No traversal.
      =================================================== */

      if (
        !filename ||
        filename !==
          path.basename(
            filename
          ) ||
        filename.includes(
          ".."
        ) ||
        !/^[a-zA-Z0-9._-]+$/.test(
          filename
        )
      ) {
        throw new ApiError(
          400,
          "Invalid document filename."
        );
      }

      /* ===================================================
         LOAD PROFESSIONAL OWNER RECORD
      =================================================== */

      const member =
        await getProfessionalKycByMemberId(
          memberId
        );

      if (
        !member
      ) {
        throw new ApiError(
          404,
          "Professional member record not found."
        );
      }

      /* ===================================================
         REQUESTED DB PATH
      =================================================== */

      const requestedPath =
        `/private/professional-kyc/${year}/${month}/${filename}`;

      /* ===================================================
         OWNERSHIP CHECK

         The requested document path MUST be present in
         this logged-in member's DB row.

         User cannot modify URL and read another member's
         Aadhaar / bank / education certificate.
      =================================================== */

      const memberDocumentPaths =
        getMemberPrivateDocumentPaths(
          member
        );

      if (
        !memberDocumentPaths.has(
          requestedPath
        )
      ) {
        throw new ApiError(
          403,
          "You do not have access to this document."
        );
      }

      /* ===================================================
         FIND PHYSICAL FILE
      =================================================== */

      const filePath =
        await resolveProfessionalPrivateFile(
          requestedPath
        );

      if (
        !filePath
      ) {
        throw new ApiError(
          404,
          "Professional KYC document file not found."
        );
      }

      /* ===================================================
         PRIVATE CACHE HEADERS
      =================================================== */

      response.set(
        "Cache-Control",
        "private, no-store, no-cache, must-revalidate"
      );

      response.set(
        "Pragma",
        "no-cache"
      );

      response.set(
        "Expires",
        "0"
      );

      response.set(
        "X-Content-Type-Options",
        "nosniff"
      );

      /* ===================================================
         INLINE VIEW

         PDF -> browser PDF viewer
         JPG / PNG -> image viewer
      =================================================== */

      response.type(
        getDocumentContentType(
          filename
        )
      );

      response.set(
        "Content-Disposition",
        `inline; filename="${filename.replace(
          /"/g,
          ""
        )}"`
      );

      return response.sendFile(
        filePath,
        (
          error
        ) => {
          if (
            !error
          ) {
            return;
          }

          if (
            response.headersSent
          ) {
            return;
          }

          return next(
            error
          );
        }
      );
    } catch (
      error
    ) {
      if (
        response.headersSent
      ) {
        return;
      }

      return next(
        error
      );
    }
  };

/* =========================================================
   AUTHENTICATED QR JPEG
========================================================= */

const downloadCurrentMemberQrJpegController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        getSessionMemberId(
          request
        );

      if (
        !memberId
      ) {
        throw new ApiError(
          401,
          "Member authentication required."
        );
      }

      const result =
        await createCurrentMemberQrJpeg(
          memberId
        );

      response.set(
        "Cache-Control",
        "no-store"
      );

      response.set(
        "X-INMBA-Login-ID",
        result.member
          .login_id
      );

      await sendTemporaryDownload(
        response,
        result.jpegPath,
        result.jpegFilename
      );
    } catch (
      error
    ) {
      if (
        response.headersSent
      ) {
        return;
      }

      return next(
        error
      );
    }
  };

/* =========================================================
   LEGACY QR JPEG
========================================================= */

const downloadLegacyQrJpegController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await createLegacyQrJpeg(
          request
            .validatedQrFilename
        );

      response.set(
        "Cache-Control",
        "no-store"
      );

      await sendTemporaryDownload(
        response,
        result.jpegPath,
        result.jpegFilename
      );
    } catch (
      error
    ) {
      if (
        response.headersSent
      ) {
        return;
      }

      return next(
        error
      );
    }
  };

/* =========================================================
   DOWNLOAD INFORMATION
========================================================= */

const getDownloadInfoController =
  (
    request,
    response
  ) => {
    return response
      .status(
        200
      )
      .json({
        statusCode:
          200,

        data: {
          downloads: {
            acknowledgement_pdf:
              "/api/acknowledgement/download",

            qr_png:
              "/api/qr-code/download",

            qr_jpeg:
              "/api/downloads/qr/jpeg",

            professional_private_document:
              "/private/professional-kyc/:year/:month/:filename",
          },

          legacy: {
            acknowledgement_pdf:
              "/download_ack/:token",

            qr_jpeg:
              "/download_qr_jpeg/:filename",
          },
        },

        message:
          "Download endpoints loaded successfully.",

        success:
          true,
      });
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  viewProfessionalPrivateKycDocumentController,

  downloadCurrentMemberQrJpegController,

  downloadLegacyQrJpegController,

  getDownloadInfoController,
};