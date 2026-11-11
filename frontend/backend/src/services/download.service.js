const fs =
  require("fs");

const fsPromises =
  require("fs/promises");

const path =
  require("path");

const crypto =
  require("crypto");

const sharp =
  require("sharp");

const QRCode =
  require("qrcode");

const ApiError =
  require(
    "../utils/apiError"
  );

const {
  findDownloadMemberById,
  findDownloadMemberByLoginId,
  findDownloadMemberByToken,
  toSafeDownloadMember,
} = require(
  "../repositories/download.repository"
);

/* =========================
   STORAGE DIRECTORIES
========================= */

const QR_CODE_ROOT =
  path.resolve(
    process.cwd(),
    process.env
      .QR_CODE_ROOT ||
      "storage/qrcodes"
  );

const TEMP_ROOT =
  path.resolve(
    process.cwd(),
    process.env
      .TEMP_ROOT ||
      "storage/temp"
  );

const LEGACY_QR_ROOT =
  path.resolve(
    process.cwd(),
    "static/qr"
  );

/* =========================
   DIRECTORY HELPER
========================= */

const ensureDownloadDirectories =
  async () => {
    await Promise.all([
      fsPromises.mkdir(
        QR_CODE_ROOT,
        {
          recursive:
            true,
        }
      ),

      fsPromises.mkdir(
        TEMP_ROOT,
        {
          recursive:
            true,
        }
      ),
    ]);
  };

/* =========================
   FILE EXISTS
========================= */

const fileExists =
  async (
    filePath
  ) => {
    try {
      const stats =
        await fsPromises.stat(
          filePath
        );

      return stats.isFile();
    } catch {
      return false;
    }
  };

/* =========================
   SAFE PATH CHECK
========================= */

const ensurePathInside = (
  rootDirectory,
  targetPath
) => {
  const normalizedRoot =
    path.resolve(
      rootDirectory
    );

  const normalizedTarget =
    path.resolve(
      targetPath
    );

  const relativePath =
    path.relative(
      normalizedRoot,
      normalizedTarget
    );

  if (
    relativePath.startsWith(
      ".."
    ) ||
    path.isAbsolute(
      relativePath
    )
  ) {
    throw new ApiError(
      400,
      "Invalid file path."
    );
  }

  return normalizedTarget;
};

/* =========================
   FRONTEND PROFILE URL
========================= */

const getPublicProfileUrl = (
  loginId
) => {
  const frontendBaseUrl =
    String(
      process.env
        .FRONTEND_BASE_URL ||
        "http://localhost:5173"
    ).replace(
      /\/+$/,
      ""
    );

  return (
    `${frontendBaseUrl}` +
    `/user-profile/` +
    encodeURIComponent(
      loginId
    )
  );
};

/* =========================
   CANONICAL QR FILENAME
========================= */

const createCanonicalQrFilename = (
  loginId
) => {
  const normalizedLoginId =
    String(loginId || "")
      .trim()
      .replace(
        /[^A-Za-z0-9_-]/g,
        ""
      );

  if (!normalizedLoginId) {
    throw new ApiError(
      422,
      "Member login ID is unavailable."
    );
  }

  return (
    `INMBA_QR_` +
    `${normalizedLoginId}.png`
  );
};

/* =========================
   QR LOGIN ID FROM FILENAME
========================= */

const extractLoginIdFromQrFilename = (
  filename
) => {
  const match =
    String(filename || "")
      .match(
        /^INMBA_QR_([A-Za-z0-9_-]+)\.png$/i
      );

  return match
    ? match[1]
    : null;
};

/* =========================
   FILE STEM
========================= */

const getFilenameStem = (
  filename
) => {
  return path.parse(
    filename
  ).name;
};

/* =========================
   FIND LEGACY QR SOURCE
========================= */

const findExistingQrSource =
  async (
    filename
  ) => {
    const newQrPath =
      ensurePathInside(
        QR_CODE_ROOT,
        path.join(
          QR_CODE_ROOT,
          filename
        )
      );

    if (
      await fileExists(
        newQrPath
      )
    ) {
      return newQrPath;
    }

    const legacyQrPath =
      ensurePathInside(
        LEGACY_QR_ROOT,
        path.join(
          LEGACY_QR_ROOT,
          filename
        )
      );

    if (
      await fileExists(
        legacyQrPath
      )
    ) {
      return legacyQrPath;
    }

    return null;
  };

/* =========================
   GENERATE QR PNG
========================= */

const generateMemberQrPng =
  async (
    member,
    requestedFilename = null
  ) => {
    await ensureDownloadDirectories();

    if (
      !member ||
      !member.login_id
    ) {
      throw new ApiError(
        404,
        "Member details were not found."
      );
    }

    const filename =
      requestedFilename ||
      createCanonicalQrFilename(
        member.login_id
      );

    const outputPath =
      ensurePathInside(
        QR_CODE_ROOT,
        path.join(
          QR_CODE_ROOT,
          filename
        )
      );

    const profileUrl =
      getPublicProfileUrl(
        member.login_id
      );

    await QRCode.toFile(
      outputPath,
      profileUrl,
      {
        type:
          "png",

        width:
          900,

        margin:
          2,

        errorCorrectionLevel:
          "H",

        color: {
          dark:
            "#000000",

          light:
            "#FFFFFF",
        },
      }
    );

    return {
      filename,
      outputPath,
      profileUrl,
    };
  };

/* =========================
   CONVERT PNG TO JPEG
========================= */

const convertQrPngToJpeg =
  async (
    pngPath,
    preferredName = null
  ) => {
    await ensureDownloadDirectories();

    if (
      !pngPath ||
      !(
        await fileExists(
          pngPath
        )
      )
    ) {
      throw new ApiError(
        404,
        "QR PNG file not found."
      );
    }

    const sourceStem =
      preferredName
        ? path.parse(
            preferredName
          ).name
        : path.parse(
            pngPath
          ).name;

    const randomSuffix =
      crypto
        .randomBytes(6)
        .toString("hex");

    const jpegFilename =
      `${sourceStem}_${randomSuffix}.jpg`;

    const jpegPath =
      ensurePathInside(
        TEMP_ROOT,
        path.join(
          TEMP_ROOT,
          jpegFilename
        )
      );

    await sharp(
      pngPath
    )
      .flatten({
        background:
          "#FFFFFF",
      })
      .jpeg({
        quality:
          92,

        chromaSubsampling:
          "4:4:4",
      })
      .toFile(
        jpegPath
      );

    return {
      jpegPath,

      jpegFilename:
        `${sourceStem}.jpg`,
    };
  };

/* =========================
   CURRENT MEMBER QR DOWNLOAD
========================= */

const createCurrentMemberQrJpeg =
  async (
    memberId,
    connection = null
  ) => {
    const member =
      await findDownloadMemberById(
        memberId,
        connection
      );

    if (!member) {
      throw new ApiError(
        404,
        "Member account not found."
      );
    }

    const canonicalFilename =
      createCanonicalQrFilename(
        member.login_id
      );

    let pngPath =
      await findExistingQrSource(
        canonicalFilename
      );

    let profileUrl =
      getPublicProfileUrl(
        member.login_id
      );

    if (!pngPath) {
      const generatedQr =
        await generateMemberQrPng(
          member,
          canonicalFilename
        );

      pngPath =
        generatedQr.outputPath;

      profileUrl =
        generatedQr.profileUrl;
    }

    const jpeg =
      await convertQrPngToJpeg(
        pngPath,
        canonicalFilename
      );

    return {
      ...jpeg,

      source_png:
        canonicalFilename,

      profile_url:
        profileUrl,

      member:
        toSafeDownloadMember(
          member
        ),
    };
  };

/* =========================
   LEGACY MEMBER RESOLUTION
========================= */

const resolveLegacyQrMember =
  async (
    filename,
    connection = null
  ) => {
    const loginId =
      extractLoginIdFromQrFilename(
        filename
      );

    if (loginId) {
      const member =
        await findDownloadMemberByLoginId(
          loginId,
          connection
        );

      if (member) {
        return member;
      }
    }

    const tokenCandidate =
      getFilenameStem(
        filename
      );

    if (tokenCandidate) {
      const member =
        await findDownloadMemberByToken(
          tokenCandidate,
          connection
        );

      if (member) {
        return member;
      }
    }

    return null;
  };

/* =========================
   LEGACY QR JPEG DOWNLOAD
========================= */

const createLegacyQrJpeg =
  async (
    filename,
    connection = null
  ) => {
    await ensureDownloadDirectories();

    let pngPath =
      await findExistingQrSource(
        filename
      );

    let member =
      null;

    if (!pngPath) {
      member =
        await resolveLegacyQrMember(
          filename,
          connection
        );

      if (!member) {
        throw new ApiError(
          404,
          "QR file not found."
        );
      }

      const generatedQr =
        await generateMemberQrPng(
          member,
          filename
        );

      pngPath =
        generatedQr.outputPath;
    } else {
      member =
        await resolveLegacyQrMember(
          filename,
          connection
        );
    }

    const jpeg =
      await convertQrPngToJpeg(
        pngPath,
        filename
      );

    return {
      ...jpeg,

      source_png:
        filename,

      member:
        toSafeDownloadMember(
          member
        ),
    };
  };

/* =========================
   TEMP FILE CLEANUP
========================= */

const removeTemporaryFile =
  async (
    filePath
  ) => {
    if (!filePath) {
      return;
    }

    try {
      await fsPromises.unlink(
        filePath
      );
    } catch (error) {
      if (
        error?.code !==
        "ENOENT"
      ) {
        console.error(
          "Temporary download cleanup failed:",
          error.message
        );
      }
    }
  };

/* =========================
   DOWNLOAD RESPONSE
========================= */

const sendTemporaryDownload =
  (
    response,
    filePath,
    downloadName
  ) => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        response.download(
          filePath,
          downloadName,
          async (
            error
          ) => {
            await removeTemporaryFile(
              filePath
            );

            if (error) {
              return reject(
                error
              );
            }

            return resolve();
          }
        );
      }
    );
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  QR_CODE_ROOT,
  TEMP_ROOT,
  LEGACY_QR_ROOT,
  ensureDownloadDirectories,
  fileExists,
  ensurePathInside,
  getPublicProfileUrl,
  createCanonicalQrFilename,
  extractLoginIdFromQrFilename,
  getFilenameStem,
  findExistingQrSource,
  generateMemberQrPng,
  convertQrPngToJpeg,
  createCurrentMemberQrJpeg,
  resolveLegacyQrMember,
  createLegacyQrJpeg,
  removeTemporaryFile,
  sendTemporaryDownload,
};