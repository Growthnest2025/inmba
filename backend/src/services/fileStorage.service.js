const fs =
  require("fs/promises");

const fsSync =
  require("fs");

const path =
  require("path");

const {
  generateLegacyFileToken,
} = require(
  "../utils/token.utils"
);

/*
  Upload root:

  backend/storage/uploads
*/
const UPLOAD_ROOT =
  path.resolve(
    process.cwd(),
    process.env.UPLOAD_ROOT ||
      "storage/uploads"
  );

const UPLOAD_PUBLIC_PATH =
  String(
    process.env
      .UPLOAD_PUBLIC_PATH ||
      "/uploads"
  ).replace(
    /\/+$/,
    ""
  );

/*
  App startup/import நேரத்தில்
  upload directory available
  இருப்பதை உறுதி செய்கிறது.
*/
const ensureUploadDirectorySync =
  () => {
    if (
      !fsSync.existsSync(
        UPLOAD_ROOT
      )
    ) {
      fsSync.mkdirSync(
        UPLOAD_ROOT,
        {
          recursive:
            true,
        }
      );
    }

    return UPLOAD_ROOT;
  };

const ensureUploadDirectory =
  async () => {
    await fs.mkdir(
      UPLOAD_ROOT,
      {
        recursive:
          true,
      }
    );

    return UPLOAD_ROOT;
  };

/*
  Werkzeug secure_filename behavior-க்கு
  equivalent safe filename conversion.

  Directory traversal characters,
  spaces மற்றும் unsafe symbols remove.
*/
const sanitizeOriginalFilename =
  (
    originalFilename
  ) => {
    const rawFilename =
      path.basename(
        String(
          originalFilename ||
          "upload"
        )
      );

    const parsedFilename =
      path.parse(
        rawFilename
      );

    const safeBaseName =
      parsedFilename.name
        .normalize("NFKD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .replace(
          /[^a-zA-Z0-9_-]+/g,
          "_"
        )
        .replace(
          /^_+|_+$/g,
          ""
        )
        .slice(
          0,
          150
        ) ||
      "upload";

    const safeExtension =
      parsedFilename.ext
        .toLowerCase()
        .replace(
          /[^a-z0-9.]/g,
          ""
        )
        .slice(
          0,
          20
        );

    return (
      safeBaseName +
      safeExtension
    );
  };

/*
  Flask filename format:

  secrets.token_hex(8)
  +
  "_"
  +
  secure_filename(file.filename)

  generateLegacyFileToken()
  = 16 hex characters.
*/
const generateStoredFilename =
  (
    originalFilename
  ) => {
    const safeFilename =
      sanitizeOriginalFilename(
        originalFilename
      );

    return (
      `${generateLegacyFileToken()}_` +
      safeFilename
    );
  };

const getFirstFile =
  (
    fileValue
  ) => {
    if (
      Array.isArray(
        fileValue
      )
    ) {
      return (
        fileValue[0] ||
        null
      );
    }

    return (
      fileValue ||
      null
    );
  };

const normalizeUploadedFile =
  (
    fileValue
  ) => {
    const file =
      getFirstFile(
        fileValue
      );

    if (!file) {
      return null;
    }

    return {
      storedName:
        file.newFilename ||
        path.basename(
          file.filepath ||
          ""
        ) ||
        null,

      originalName:
        file.originalFilename ||
        null,

      filepath:
        file.filepath ||
        null,

      mimeType:
        file.mimetype ||
        null,

      size:
        Number(
          file.size ||
          0
        ),

      lastModified:
        file.mtime ||
        null,
    };
  };

const normalizeUploadedFiles =
  (
    files = {}
  ) => {
    const normalizedFiles =
      {};

    for (
      const [
        fieldName,
        fileValue,
      ] of Object.entries(
        files ||
        {}
      )
    ) {
      const normalizedFile =
        normalizeUploadedFile(
          fileValue
        );

      if (
        normalizedFile
      ) {
        normalizedFiles[
          fieldName
        ] =
          normalizedFile;
      }
    }

    return normalizedFiles;
  };

/*
  Object அல்லது array உள்ளே இருக்கும்
  எல்லா file paths-ஐ collect செய்கிறது.
*/
const collectUploadedFilePaths =
  (
    value,
    collectedPaths =
      []
  ) => {
    if (!value) {
      return collectedPaths;
    }

    if (
      Array.isArray(value)
    ) {
      for (
        const item of value
      ) {
        collectUploadedFilePaths(
          item,
          collectedPaths
        );
      }

      return collectedPaths;
    }

    if (
      typeof value ===
      "object"
    ) {
      if (
        typeof value.filepath ===
          "string" &&
        value.filepath
      ) {
        collectedPaths.push(
          value.filepath
        );

        return collectedPaths;
      }

      for (
        const nestedValue of
        Object.values(value)
      ) {
        collectUploadedFilePaths(
          nestedValue,
          collectedPaths
        );
      }

      return collectedPaths;
    }

    return collectedPaths;
  };

/*
  Validation அல்லது database error
  வந்தால் already uploaded files
  server-ல் orphan files-ஆ இருக்காமல்
  remove செய்கிறது.
*/
const cleanupUploadedFiles =
  async (
    files
  ) => {
    const filePaths =
      [
        ...new Set(
          collectUploadedFilePaths(
            files
          )
        ),
      ];

    const cleanupResults =
      await Promise.allSettled(
        filePaths.map(
          async (
            filePath
          ) => {
            try {
              await fs.unlink(
                filePath
              );

              return {
                filePath,
                deleted:
                  true,
              };
            } catch (error) {
              if (
                error.code ===
                "ENOENT"
              ) {
                return {
                  filePath,
                  deleted:
                    false,

                  reason:
                    "not_found",
                };
              }

              throw error;
            }
          }
        )
      );

    return cleanupResults;
  };

const buildUploadPublicUrl =
  (
    storedFilename
  ) => {
    if (
      !storedFilename
    ) {
      return null;
    }

    return (
      `${UPLOAD_PUBLIC_PATH}/` +
      encodeURIComponent(
        storedFilename
      )
    );
  };

ensureUploadDirectorySync();

module.exports = {
  UPLOAD_ROOT,
  UPLOAD_PUBLIC_PATH,

  ensureUploadDirectory,
  ensureUploadDirectorySync,

  sanitizeOriginalFilename,
  generateStoredFilename,

  getFirstFile,
  normalizeUploadedFile,
  normalizeUploadedFiles,

  collectUploadedFilePaths,
  cleanupUploadedFiles,

  buildUploadPublicUrl,
};