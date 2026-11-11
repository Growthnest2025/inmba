const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const formidablePackage = require("formidable");

const ApiError = require("../utils/apiError");

const {
  UPLOAD_ROOT,
  UPLOAD_PUBLIC_PATH,
} = require("../services/fileStorage.service");

const createForm =
  formidablePackage.formidable ||
  formidablePackage;

/* =========================================================
   DIRECTORIES
========================================================= */

const TEMP_DIRECTORY =
  path.resolve(
    process.cwd(),
    "storage",
    "temp"
  );

const COVER_DIRECTORY =
  path.join(
    UPLOAD_ROOT,
    "professional-cover"
  );

const GALLERY_DIRECTORY =
  path.join(
    UPLOAD_ROOT,
    "professional-gallery"
  );

const VIDEO_DIRECTORY =
  path.join(
    UPLOAD_ROOT,
    "professional-video"
  );

/* =========================================================
   LIMITS
========================================================= */

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const MAX_VIDEO_SIZE =
  50 * 1024 * 1024;

/* =========================================================
   ALLOWED MIME TYPES
========================================================= */

const IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ]);

const VIDEO_TYPES =
  new Set([
    "video/mp4",
    "video/webm",
  ]);

/* =========================================================
   GET FIRST FILE
========================================================= */

const getFirstFile = (value) => {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
};

/* =========================================================
   REMOVE TEMP FILE
========================================================= */

const removeTemporaryFile =
  async (file) => {
    if (!file?.filepath) {
      return;
    }

    try {
      await fs.unlink(
        file.filepath
      );
    } catch {
      /*
        Ignore.
        File may already be moved.
      */
    }
  };

/* =========================================================
   GET SAFE EXTENSION
========================================================= */

const getSafeExtension =
  (file) => {
    const originalName =
      String(
        file?.originalFilename ||
        ""
      );

    const originalExtension =
      path
        .extname(originalName)
        .toLowerCase();

    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".mp4",
      ".webm",
    ];

    if (
      allowedExtensions.includes(
        originalExtension
      )
    ) {
      return originalExtension;
    }

    switch (file?.mimetype) {
      case "image/png":
        return ".png";

      case "image/webp":
        return ".webp";

      case "video/mp4":
        return ".mp4";

      case "video/webm":
        return ".webm";

      case "image/jpeg":
      case "image/jpg":
      default:
        return ".jpg";
    }
  };

/* =========================================================
   BUILD PUBLIC PATH
========================================================= */

const buildPublicPath =
  (
    folderName,
    fileName
  ) => {
    const publicRoot =
      String(
        UPLOAD_PUBLIC_PATH ||
        "/uploads"
      ).replace(
        /\/+$/,
        ""
      );

    return `${publicRoot}/${folderName}/${fileName}`;
  };

/* =========================================================
   MOVE FILE TO PERMANENT STORAGE
========================================================= */

const moveFileToPermanentStorage =
  async (
    temporaryFile,
    folderName,
    destinationDirectory
  ) => {
    if (
      !temporaryFile ||
      !temporaryFile.filepath
    ) {
      throw new ApiError(
        400,
        "Uploaded file is missing."
      );
    }

    await fs.mkdir(
      destinationDirectory,
      {
        recursive: true,
      }
    );

    const extension =
      getSafeExtension(
        temporaryFile
      );

    const fileName =
      `${Date.now()}-${crypto.randomUUID()}${extension}`;

    const destinationPath =
      path.join(
        destinationDirectory,
        fileName
      );

    try {
      await fs.rename(
        temporaryFile.filepath,
        destinationPath
      );
    } catch (error) {
      /*
        Sometimes temp + upload directory
        can be on different filesystem.

        EXDEV fallback:
        copy file then delete temp.
      */

      if (
        error?.code ===
        "EXDEV"
      ) {
        await fs.copyFile(
          temporaryFile.filepath,
          destinationPath
        );

        await removeTemporaryFile(
          temporaryFile
        );
      } else {
        throw new ApiError(
          500,
          error?.message ||
            "Unable to store uploaded file."
        );
      }
    }

    return {
      fileName,

      absolutePath:
        destinationPath,

      publicPath:
        buildPublicPath(
          folderName,
          fileName
        ),
    };
  };

/* =========================================================
   GENERIC SINGLE FILE PARSER
========================================================= */

const createSingleFileParser =
  ({
    fieldNames,
    allowedTypes,
    maxFileSize,
    requestProperty,
    missingMessage,
  }) =>
  async (
    request,
    response,
    next
  ) => {
    let uploadedFile =
      null;

    try {
      await fs.mkdir(
        TEMP_DIRECTORY,
        {
          recursive: true,
        }
      );

      const form =
        createForm({
          uploadDir:
            TEMP_DIRECTORY,

          keepExtensions:
            true,

          multiples:
            false,

          maxFiles:
            1,

          maxFileSize,

          minFileSize:
            1,

          allowEmptyFiles:
            false,
        });

      const {
        files,
      } =
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
                parsedFiles
              ) => {
                if (error) {
                  return reject(
                    error
                  );
                }

                return resolve({
                  fields:
                    fields ||
                    {},

                  files:
                    parsedFiles ||
                    {},
                });
              }
            );
          }
        );

      for (
        const fieldName of
        fieldNames
      ) {
        uploadedFile =
          getFirstFile(
            files?.[fieldName]
          );

        if (uploadedFile) {
          break;
        }
      }

      if (!uploadedFile) {
        throw new ApiError(
          400,
          missingMessage
        );
      }

      if (
        !allowedTypes.has(
          uploadedFile.mimetype
        )
      ) {
        await removeTemporaryFile(
          uploadedFile
        );

        throw new ApiError(
          415,
          "Unsupported file format."
        );
      }

      if (
        Number(
          uploadedFile.size ||
          0
        ) >
        maxFileSize
      ) {
        await removeTemporaryFile(
          uploadedFile
        );

        throw new ApiError(
          413,
          "Uploaded file exceeds the allowed file size."
        );
      }

      request[
        requestProperty
      ] =
        uploadedFile;

      return next();
    } catch (error) {
      await removeTemporaryFile(
        uploadedFile
      );

      if (
        error?.code ===
          1009 ||
        error?.code ===
          "LIMIT_FILE_SIZE"
      ) {
        return next(
          new ApiError(
            413,
            "Uploaded file exceeds the allowed file size."
          )
        );
      }

      return next(
        error
      );
    }
  };

/* =========================================================
   COVER PHOTO PARSER
========================================================= */

const parseCoverPhoto =
  createSingleFileParser({
    fieldNames: [
      "cover_photo",
      "cover",
    ],

    allowedTypes:
      IMAGE_TYPES,

    maxFileSize:
      MAX_IMAGE_SIZE,

    requestProperty:
      "uploadedCoverPhoto",

    missingMessage:
      "Cover photo is required.",
  });

/* =========================================================
   GALLERY PHOTO PARSER
========================================================= */

const parseGalleryPhoto =
  createSingleFileParser({
    fieldNames: [
      "gallery_photo",
      "gallery",
    ],

    allowedTypes:
      IMAGE_TYPES,

    maxFileSize:
      MAX_IMAGE_SIZE,

    requestProperty:
      "uploadedGalleryPhoto",

    missingMessage:
      "Gallery photo is required.",
  });

/* =========================================================
   INTRO VIDEO PARSER
========================================================= */

const parseIntroVideo =
  createSingleFileParser({
    fieldNames: [
      "intro_video",
      "video",
    ],

    allowedTypes:
      VIDEO_TYPES,

    maxFileSize:
      MAX_VIDEO_SIZE,

    requestProperty:
      "uploadedIntroVideo",

    missingMessage:
      "Intro video is required.",
  });

/* =========================================================
   MOVE COVER PHOTO
========================================================= */

const moveCoverPhoto =
  async (file) => {
    return moveFileToPermanentStorage(
      file,
      "professional-cover",
      COVER_DIRECTORY
    );
  };

/* =========================================================
   MOVE GALLERY PHOTO
========================================================= */

const moveGalleryPhoto =
  async (file) => {
    return moveFileToPermanentStorage(
      file,
      "professional-gallery",
      GALLERY_DIRECTORY
    );
  };

/* =========================================================
   MOVE INTRO VIDEO
========================================================= */

const moveIntroVideo =
  async (file) => {
    return moveFileToPermanentStorage(
      file,
      "professional-video",
      VIDEO_DIRECTORY
    );
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  TEMP_DIRECTORY,

  COVER_DIRECTORY,

  GALLERY_DIRECTORY,

  VIDEO_DIRECTORY,

  MAX_IMAGE_SIZE,

  MAX_VIDEO_SIZE,

  IMAGE_TYPES,

  VIDEO_TYPES,

  getFirstFile,

  removeTemporaryFile,

  getSafeExtension,

  buildPublicPath,

  moveFileToPermanentStorage,

  parseCoverPhoto,

  parseGalleryPhoto,

  parseIntroVideo,

  moveCoverPhoto,

  moveGalleryPhoto,

  moveIntroVideo,
};