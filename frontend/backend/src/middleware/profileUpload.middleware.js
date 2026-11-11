const fs =
  require(
    "fs/promises"
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

const ApiError =
  require(
    "../utils/apiError"
  );

const {
  UPLOAD_ROOT,
  UPLOAD_PUBLIC_PATH,
} = require(
  "../services/fileStorage.service"
);

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

const PROFILE_DIRECTORY =
  path.join(
    UPLOAD_ROOT,
    "profile"
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
   TYPES
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
   HELPERS
========================================================= */

const firstFile =
  (value) => {
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

const deleteTempFile =
  async (
    file
  ) => {
    if (
      !file?.filepath
    ) {
      return;
    }

    try {
      await fs.unlink(
        file.filepath
      );
    } catch {
      // Ignore cleanup errors.
    }
  };

const getExtension =
  (
    file
  ) => {
    const originalExtension =
      path
        .extname(
          String(
            file?.originalFilename ||
            ""
          )
        )
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

    switch (
      file?.mimetype
    ) {
      case "image/png":
        return ".png";

      case "image/webp":
        return ".webp";

      case "video/mp4":
        return ".mp4";

      case "video/webm":
        return ".webm";

      default:
        return ".jpg";
    }
  };

const buildPublicPath =
  (
    folder,
    fileName
  ) => {
    const root =
      String(
        UPLOAD_PUBLIC_PATH ||
        "/uploads"
      ).replace(
        /\/+$/,
        ""
      );

    return `${root}/${folder}/${fileName}`;
  };

/* =========================================================
   STORE FILE
========================================================= */

const storePermanentFile =
  async (
    temporaryFile,
    folderName,
    directory
  ) => {
    if (
      !temporaryFile?.filepath
    ) {
      throw new ApiError(
        400,
        "Uploaded file is missing."
      );
    }

    await fs.mkdir(
      directory,
      {
        recursive: true,
      }
    );

    const extension =
      getExtension(
        temporaryFile
      );

    const fileName =
      `${Date.now()}-${crypto.randomUUID()}${extension}`;

    const destination =
      path.join(
        directory,
        fileName
      );

    try {
      /*
        fs.rename() may fail when temp and permanent folders
        are on different drives/filesystems.

        Try rename first. If it fails with EXDEV,
        copy the file and remove the temp file.
      */

      try {
        await fs.rename(
          temporaryFile.filepath,
          destination
        );
      } catch (
        renameError
      ) {
        if (
          renameError?.code ===
          "EXDEV"
        ) {
          await fs.copyFile(
            temporaryFile.filepath,
            destination
          );

          await fs.unlink(
            temporaryFile.filepath
          );
        } else {
          throw renameError;
        }
      }
    } catch (
      error
    ) {
      throw new ApiError(
        500,
        error?.message ||
        "Unable to store uploaded file."
      );
    }

    return {
      fileName,

      absolutePath:
        destination,

      publicPath:
        buildPublicPath(
          folderName,
          fileName
        ),
    };
  };

/* =========================================================
   GENERIC PARSER
========================================================= */

const parseSingleUpload =
  ({
    fieldNames,
    allowedTypes,
    maxFileSize,
    requestProperty,
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
                if (
                  error
                ) {
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
          firstFile(
            files?.[
              fieldName
            ]
          );

        if (
          uploadedFile
        ) {
          break;
        }
      }

      if (
        !uploadedFile
      ) {
        throw new ApiError(
          400,
          "Upload file is required."
        );
      }

      if (
        !allowedTypes.has(
          uploadedFile.mimetype
        )
      ) {
        await deleteTempFile(
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
        await deleteTempFile(
          uploadedFile
        );

        throw new ApiError(
          413,
          "Uploaded file is too large."
        );
      }

      request[
        requestProperty
      ] =
        uploadedFile;

      return next();
    } catch (
      error
    ) {
      await deleteTempFile(
        uploadedFile
      );

      return next(
        error
      );
    }
  };

/* =========================================================
   PROFILE PHOTO PARSER
========================================================= */

const parseProfilePhoto =
  parseSingleUpload({
    fieldNames: [
      "photo",
      "profile_pic",
      "profile_photo",
      "profile_image",
    ],

    allowedTypes:
      IMAGE_TYPES,

    maxFileSize:
      MAX_IMAGE_SIZE,

    requestProperty:
      "uploadedProfilePhoto",
  });

/* =========================================================
   OTHER PARSERS
========================================================= */

const parseCoverPhoto =
  parseSingleUpload({
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
  });

const parseGalleryPhoto =
  parseSingleUpload({
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
  });

const parseIntroVideo =
  parseSingleUpload({
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
  });

/* =========================================================
   PROFILE PHOTO MOVE
========================================================= */

const moveProfilePhotoToPermanentStorage =
  (
    file
  ) =>
    storePermanentFile(
      file,
      "profile",
      PROFILE_DIRECTORY
    );

/* =========================================================
   OTHER MOVE HELPERS
========================================================= */

const moveCoverPhoto =
  (
    file
  ) =>
    storePermanentFile(
      file,
      "professional-cover",
      COVER_DIRECTORY
    );

const moveGalleryPhoto =
  (
    file
  ) =>
    storePermanentFile(
      file,
      "professional-gallery",
      GALLERY_DIRECTORY
    );

const moveIntroVideo =
  (
    file
  ) =>
    storePermanentFile(
      file,
      "professional-video",
      VIDEO_DIRECTORY
    );

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  /* PROFILE PHOTO */

  parseProfilePhoto,

  moveProfilePhotoToPermanentStorage,

  /* COVER */

  parseCoverPhoto,

  moveCoverPhoto,

  /* GALLERY */

  parseGalleryPhoto,

  moveGalleryPhoto,

  /* VIDEO */

  parseIntroVideo,

  moveIntroVideo,
};