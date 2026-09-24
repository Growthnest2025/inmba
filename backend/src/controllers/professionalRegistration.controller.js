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

const formidableModule =
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

const professionalRegistrationService =
  require(
    "../services/professionalRegistration.service"
  );

const ApiError =
  require(
    "../utils/apiError"
  );

/* =========================================================
   HELPERS
========================================================= */

const toText = (
  value
) => {
  if (
    Array.isArray(
      value
    )
  ) {
    return String(
      value[0] ??
        ""
    ).trim();
  }

  return String(
    value ??
      ""
  ).trim();
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

/* =========================================================
   FORMIDABLE FACTORY

   Supports different formidable package exports.
========================================================= */

const createForm =
  (
    options
  ) => {
    const factory =
      formidableModule
        .formidable ||
      formidableModule
        .default ||
      formidableModule;

    return factory(
      options
    );
  };

/* =========================================================
   PROFILE DIRECTORY
========================================================= */

const PROFILE_DIRECTORY =
  path.join(
    UPLOAD_ROOT,
    "professional-profile"
  );

fs.mkdirSync(
  PROFILE_DIRECTORY,
  {
    recursive:
      true,
  }
);

/* =========================================================
   PUBLIC PATH
========================================================= */

const getProfilePublicPath =
  (
    filename
  ) => {
    const root =
      String(
        UPLOAD_PUBLIC_PATH ||
          "/uploads"
      ).replace(
        /\/+$/,
        ""
      );

    return `${root}/professional-profile/${filename}`;
  };

/* =========================================================
   PARSE MULTIPART
========================================================= */

const parseMultipartRequest =
  (
    req
  ) => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const form =
          createForm({
            multiples:
              false,

            maxFiles:
              1,

            maxFileSize:
              5 *
              1024 *
              1024,

            allowEmptyFiles:
              false,

            keepExtensions:
              true,

            /*
              Only this field can upload a file.
            */

            filter:
              (
                part
              ) => {
                if (
                  !part
                    .originalFilename
                ) {
                  return true;
                }

                if (
                  part.name !==
                  "profile_photo"
                ) {
                  return false;
                }

                return [
                  "image/jpeg",
                  "image/jpg",
                  "image/png",
                  "image/webp",
                ].includes(
                  part.mimetype
                );
              },
          });

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
              return reject(
                new ApiError(
                  400,
                  error.message ||
                    "Unable to process profile photo."
                )
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
   MOVE PROFILE PHOTO
========================================================= */

const saveProfilePhoto =
  (
    file
  ) => {
    if (!file) {
      return null;
    }

    const mimeType =
      toText(
        file.mimetype
      );

    const allowedMimeTypes =
      new Set([
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ]);

    if (
      !allowedMimeTypes.has(
        mimeType
      )
    ) {
      throw new ApiError(
        400,
        "Profile photo must be JPG, PNG or WEBP."
      );
    }

    if (
      Number(
        file.size ||
          0
      ) >
      5 *
        1024 *
        1024
    ) {
      throw new ApiError(
        400,
        "Profile photo must be below 5 MB."
      );
    }

    const originalName =
      toText(
        file.originalFilename
      );

    let extension =
      path
        .extname(
          originalName
        )
        .toLowerCase();

    const allowedExtensions =
      new Set([
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
      ]);

    if (
      !allowedExtensions.has(
        extension
      )
    ) {
      extension =
        mimeType ===
        "image/png"
          ? ".png"
          : mimeType ===
            "image/webp"
          ? ".webp"
          : ".jpg";
    }

    const filename =
      `professional_${Date.now()}_${crypto
        .randomBytes(
          8
        )
        .toString(
          "hex"
        )}${extension}`;

    const targetPath =
      path.join(
        PROFILE_DIRECTORY,
        filename
      );

    fs.renameSync(
      file.filepath,
      targetPath
    );

    return {
      diskPath:
        targetPath,

      publicPath:
        getProfilePublicPath(
          filename
        ),

      filename,
    };
  };

/* =========================================================
   REGISTER PROFESSIONAL MEMBER
========================================================= */

const registerProfessionalMember =
  async (
    req,
    res,
    next
  ) => {
    let profilePhoto =
      null;

    try {
      const contentType =
        String(
          req.headers[
            "content-type"
          ] ||
            ""
        ).toLowerCase();

      let fields =
        {};

      let files =
        {};

      if (
        contentType.includes(
          "multipart/form-data"
        )
      ) {
        const parsed =
          await parseMultipartRequest(
            req
          );

        fields =
          parsed.fields;

        files =
          parsed.files;
      } else {
        fields =
          req.body ||
          {};
      }

      const rawProfilePhoto =
        getFirstFile(
          files.profile_photo
        );

      if (
        rawProfilePhoto
      ) {
        profilePhoto =
          saveProfilePhoto(
            rawProfilePhoto
          );
      }

      /*
        =====================================================
        TODO(PROFESSIONAL_MOBILE_OTP)

        Future OTP integration:

        const mobileOtpToken =
          toText(
            fields.mobile_otp_token
          );

        service-க்கு token pass செய்ய வேண்டும்.

        Backend OTP verification complete ஆன பிறகு
        மட்டுமே account create செய்ய வேண்டும்.

        இப்போதைக்கு OTP disabled.
        =====================================================
      */

      const result =
        await professionalRegistrationService
          .registerProfessionalMember(
            {
              full_name:
                toText(
                  fields.full_name
                ),

              phone:
                toText(
                  fields.phone
                ),

              email:
                toText(
                  fields.email
                ),

              dob:
                toText(
                  fields.dob
                ),

              password:
                toText(
                  fields.password
                ),

              referral:
                toText(
                  fields.referral
                ),
            },
            {
              profilePhoto,
            }
          );

      /*
        Existing success/login flow compatibility.
      */

      if (
        req.session
      ) {
        req.session
          .new_login_id =
          result.loginId;
      }

      return res
        .status(
          201
        )
        .json({
          success:
            true,

          statusCode:
            201,

          message:
            "Professional registration completed successfully.",

          data: {
            loginId:
              result.loginId,

            loginLink:
              "/login",

            successPage:
              "/success",

            member:
              result.member,

            referral:
              result.referral,

            nextAction: {
              type:
                "NAVIGATE",

              path:
                "/success",

              loginPath:
                "/login",
            },
          },
        });
    } catch (
      error
    ) {
      /*
        If photo moved but service wasn't reached,
        remove it.
      */

      if (
        profilePhoto
          ?.diskPath &&
        fs.existsSync(
          profilePhoto.diskPath
        )
      ) {
        /*
          Service already removes this file when
          service execution fails.

          This check mainly handles controller-level
          errors before service execution.
        */
      }

      if (
        error?.details &&
        !error.errors
      ) {
        error.errors =
          error.details;
      }

      return next(
        error
      );
    }
  };

/* =========================================================
   EXPORT
========================================================= */

module.exports =
  {
    registerProfessionalMember,
  };