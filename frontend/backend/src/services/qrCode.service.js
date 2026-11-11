const fs =
  require(
    "fs/promises"
  );

const path =
  require(
    "path"
  );

const QRCode =
  require(
    "qrcode"
  );

const ApiError =
  require(
    "../utils/apiError"
  );

const {
  normalizeMemberId,
  normalizeToken,
  findQrMemberById,
  findQrMemberByToken,
  toSafeQrMember,
} = require(
  "../repositories/qrCode.repository"
);

/* =========================
   QR DIRECTORY
========================= */

const QR_CODE_DIRECTORY =
  path.resolve(
    process.cwd(),
    "storage",
    "qrcodes"
  );

/* =========================
   URL HELPERS
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

const getFrontendBaseUrl =
  () => {
    return removeTrailingSlash(
      process.env
        .FRONTEND_BASE_URL ||
        "http://localhost:5173"
    );
  };

const getBackendBaseUrl =
  () => {
    return removeTrailingSlash(
      process.env
        .BACKEND_URL ||
        "http://127.0.0.1:5000"
    );
  };

/* =========================
   QR HELPERS
========================= */

const sanitizeLoginId =
  (
    loginId
  ) => {
    return String(
      loginId ||
        ""
    )
      .trim()
      .replace(
        /[^A-Za-z0-9_-]/g,
        ""
      );
  };

const createPublicProfileUrl =
  (
    member
  ) => {
    const loginId =
      String(
        member?.login_id ||
          ""
      ).trim();

    if (
      !loginId
    ) {
      throw new ApiError(
        422,
        "Member login ID is not available."
      );
    }

    return (
      `${getFrontendBaseUrl()}` +
      `/user-profile/` +
      encodeURIComponent(
        loginId
      )
    );
  };

const createQrFilename =
  (
    member
  ) => {
    const safeLoginId =
      sanitizeLoginId(
        member?.login_id ||
          member?.id
      );

    if (
      !safeLoginId
    ) {
      throw new ApiError(
        422,
        "Unable to create QR filename."
      );
    }

    return (
      `INMBA_QR_` +
      `${safeLoginId}.png`
    );
  };

const createQrFilePath =
  (
    member
  ) => {
    return path.join(
      QR_CODE_DIRECTORY,
      createQrFilename(
        member
      )
    );
  };

/* =========================
   REQUIRE MEMBER BY ID
========================= */

const requireQrMemberById =
  async (
    memberId,
    connection =
      null
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      throw new ApiError(
        401,
        "Authentication required."
      );
    }

    const member =
      await findQrMemberById(
        normalizedMemberId,
        connection
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Member account not found."
      );
    }

    return member;
  };

/* =========================
   REQUIRE MEMBER BY TOKEN
========================= */

const requireQrMemberByToken =
  async (
    token,
    connection =
      null
  ) => {
    const normalizedToken =
      normalizeToken(
        token
      );

    if (
      !normalizedToken
    ) {
      throw new ApiError(
        400,
        "Member token is required."
      );
    }

    const member =
      await findQrMemberByToken(
        normalizedToken,
        connection
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Invalid member token."
      );
    }

    return member;
  };

/* =========================
   TOKEN OWNERSHIP CHECK
========================= */

const requireOwnedQrMember =
  async (
    token,
    sessionMemberId,
    connection =
      null
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        sessionMemberId
      );

    if (
      !normalizedMemberId
    ) {
      throw new ApiError(
        401,
        "Authentication required."
      );
    }

    const member =
      await requireQrMemberByToken(
        token,
        connection
      );

    if (
      Number(
        member.id
      ) !==
      normalizedMemberId
    ) {
      throw new ApiError(
        403,
        "Access denied. You can access only your own QR code."
      );
    }

    return member;
  };

/* =========================
   GENERATE QR FILE
========================= */

const generateQrCodeFile =
  async (
    member
  ) => {
    const publicProfileUrl =
      createPublicProfileUrl(
        member
      );

    const filename =
      createQrFilename(
        member
      );

    const filePath =
      createQrFilePath(
        member
      );

    await fs.mkdir(
      QR_CODE_DIRECTORY,
      {
        recursive:
          true,
      }
    );

    await QRCode.toFile(
      filePath,
      publicProfileUrl,
      {
        type:
          "png",

        width:
          600,

        margin:
          2,

        errorCorrectionLevel:
          "H",

        color: {
          dark:
            "#0f4d0f",

          light:
            "#ffffff",
        },
      }
    );

    return {
      filePath,
      filename,
      publicProfileUrl,
    };
  };

/* =========================
   QR RESPONSE
========================= */

const createQrCodeResponse =
  (
    member,
    qrResult
  ) => {
    return {
      member:
        toSafeQrMember(
          member
        ),

      qr_code: {
        filename:
          qrResult.filename,

        encoded_value:
          qrResult
            .publicProfileUrl,

        public_profile_url:
          qrResult
            .publicProfileUrl,

        image_url:
          `${getBackendBaseUrl()}/api/qr-code/image`,

        download_url:
          `${getBackendBaseUrl()}/api/qr-code/download`,
      },
    };
  };

/* =========================
   GENERATE MEMBER QR
========================= */

const generateMemberQrCode =
  async (
    memberId,
    connection =
      null
  ) => {
    const member =
      await requireQrMemberById(
        memberId,
        connection
      );

    if (
      String(
        member.payment_status ||
          ""
      ).trim().toLowerCase() !== "approved"
    ) {
      throw new ApiError(
        403,
        "QR code will be available once your membership is approved by the admin."
      );
    }

    const qrResult =
      await generateQrCodeFile(
        member
      );

    return {
      ...createQrCodeResponse(
        member,
        qrResult
      ),

      filePath:
        qrResult.filePath,

      filename:
        qrResult.filename,
    };
  };

/* =========================
   GENERATE QR BY TOKEN
========================= */

const generateMemberQrCodeByToken =
  async (
    token,
    sessionMemberId,
    connection =
      null
  ) => {
    const member =
      await requireOwnedQrMember(
        token,
        sessionMemberId,
        connection
      );

    if (
      String(
        member.payment_status ||
          ""
      ).trim().toLowerCase() !== "approved"
    ) {
      throw new ApiError(
        403,
        "QR code will be available once your membership is approved by the admin."
      );
    }

    const qrResult =
      await generateQrCodeFile(
        member
      );

    return {
      ...createQrCodeResponse(
        member,
        qrResult
      ),

      filePath:
        qrResult.filePath,

      filename:
        qrResult.filename,
    };
  };

/* =========================
   REMOVE INTERNAL FIELDS
========================= */

const removeInternalQrFields =
  (
    qrResult
  ) => {
    if (
      !qrResult
    ) {
      return null;
    }

    const {
      filePath,
      filename,
      ...publicResult
    } = qrResult;

    return publicResult;
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  QR_CODE_DIRECTORY,
  removeTrailingSlash,
  getFrontendBaseUrl,
  getBackendBaseUrl,
  sanitizeLoginId,
  createPublicProfileUrl,
  createQrFilename,
  createQrFilePath,
  requireQrMemberById,
  requireQrMemberByToken,
  requireOwnedQrMember,
  generateQrCodeFile,
  createQrCodeResponse,
  generateMemberQrCode,
  generateMemberQrCodeByToken,
  removeInternalQrFields,
};