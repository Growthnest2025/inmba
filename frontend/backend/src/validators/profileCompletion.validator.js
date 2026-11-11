const fsPromises =
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

/* =========================
   UPLOAD SETTINGS
========================= */

const PROFILE_TEMP_ROOT =
  path.resolve(
    process.cwd(),
    process.env
      .TEMP_ROOT ||
      "storage/temp",
    "profile-completion"
  );

const MAX_PROFILE_FILE_SIZE =
  5 *
  1024 *
  1024;

const ALLOWED_PROFILE_MIME_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

/* =========================
   FORMIDABLE FACTORY
========================= */

const getFormidableFactory =
  () => {
    return (
      formidablePackage
        .formidable ||
      formidablePackage
        .default ||
      formidablePackage
    );
  };

/* =========================
   FIRST VALUE
========================= */

const getFirstValue =
  (
    value
  ) => {
    if (
      Array.isArray(
        value
      )
    ) {
      return value[0];
    }

    return value;
  };

/* =========================
   CLEAN TEXT
========================= */

const cleanText =
  (
    value,
    maxLength =
      1000
  ) => {
    const firstValue =
      getFirstValue(
        value
      );

    if (
      firstValue === null ||
      firstValue ===
        undefined
    ) {
      return "";
    }

    return String(
      firstValue
    )
      .trim()
      .slice(
        0,
        maxLength
      );
  };

/* =========================
   TOKEN VALIDATION
========================= */

const validateProfileCompletionToken =
  (
    request,
    response,
    next
  ) => {
    try {
      const token =
        cleanText(
          request.params
            ?.token,
          255
        );

      if (
        !token
      ) {
        throw new ApiError(
          400,
          "Valid member token is required."
        );
      }

      request
        .validatedProfileToken =
        token;

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   FILE HELPERS
========================= */

const getFirstFile =
  (
    value
  ) => {
    if (
      Array.isArray(
        value
      )
    ) {
      return value[0] ||
        null;
    }

    return value ||
      null;
  };

const collectFiles =
  (
    files = {}
  ) => {
    return Object.values(
      files ||
        {}
    ).flatMap(
      (
        fileValue
      ) =>
        Array.isArray(
          fileValue
        )
          ? fileValue
          : [
              fileValue,
            ]
    ).filter(Boolean);
  };

const removeTemporaryFile =
  async (
    filePath
  ) => {
    if (
      !filePath
    ) {
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
          "Profile temporary file cleanup failed:",
          error.message
        );
      }
    }
  };

const cleanupFileCollection =
  async (
    files = {}
  ) => {
    const allFiles =
      collectFiles(
        files
      );

    await Promise.all(
      allFiles.map(
        (
          file
        ) =>
          removeTemporaryFile(
            file.filepath
          )
      )
    );
  };

const cleanupProfileCompletionFile =
  async (
    request
  ) => {
    const profilePic =
      request
        .validatedProfileCompletion
        ?.profile_pic ||
      getFirstFile(
        request
          .profileCompletionFiles
          ?.profile_pic
      );

    if (
      profilePic?.filepath
    ) {
      await removeTemporaryFile(
        profilePic.filepath
      );
    }
  };

/* =========================
   MULTIPART PARSER
========================= */

const parseProfileCompletionForm =
  async (
    request,
    response,
    next
  ) => {
    try {
      const contentType =
        String(
          request.headers[
            "content-type"
          ] ||
            ""
        ).toLowerCase();

      if (
        !contentType.startsWith(
          "multipart/form-data"
        )
      ) {
        request
          .profileCompletionFields =
          request.body ||
          {};

        request
          .profileCompletionFiles =
          {};

        return next();
      }

      await fsPromises.mkdir(
        PROFILE_TEMP_ROOT,
        {
          recursive:
            true,
        }
      );

      const createForm =
        getFormidableFactory();

      const form =
        createForm({
          uploadDir:
            PROFILE_TEMP_ROOT,

          keepExtensions:
            true,

          multiples:
            true,

          allowEmptyFiles:
            false,

          maxFiles:
            1,

          maxFileSize:
            MAX_PROFILE_FILE_SIZE,

          maxTotalFileSize:
            MAX_PROFILE_FILE_SIZE,

          filter:
            (
              part
            ) => {
              if (
                part.name !==
                "profile_pic" &&
                part.name !==
                  "profilePicture"
              ) {
                return true;
              }

              return (
                !part.mimetype ||
                ALLOWED_PROFILE_MIME_TYPES
                  .has(
                    part.mimetype
                  )
              );
            },
        });

      form.parse(
        request,
        async (
          error,
          fields,
          files
        ) => {
          if (
            error
          ) {
            await cleanupFileCollection(
              files
            );

            const statusCode =
              error?.code ===
                1009 ||
              error?.httpCode ===
                413
                ? 413
                : 400;

            return next(
              new ApiError(
                statusCode,
                statusCode ===
                  413
                  ? "Profile image cannot exceed 5 MB."
                  : "Unable to parse profile completion form."
              )
            );
          }

          request
            .profileCompletionFields =
            fields ||
            {};

          request
            .profileCompletionFiles =
            files ||
            {};

          return next();
        }
      );
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   BOOLEAN VALUE
========================= */

const normalizeBoolean =
  (
    value
  ) => {
    const normalized =
      cleanText(
        value,
        30
      ).toLowerCase();

    return [
      "true",
      "1",
      "yes",
      "on",
      "accepted",
      "accept",
    ].includes(
      normalized
    );
  };

/* =========================
   PHONE VALUE
========================= */

const normalizePhone =
  (
    value,
    fieldLabel
  ) => {
    const inputValue =
      cleanText(
        value,
        30
      );

    if (
      !inputValue
    ) {
      return null;
    }

    const phone =
      inputValue.replace(
        /\D/g,
        ""
      );

    if (
      !/^[0-9]{10,15}$/.test(
        phone
      )
    ) {
      throw new ApiError(
        422,
        `${fieldLabel} must contain 10 to 15 digits.`
      );
    }

    return phone;
  };

/* =========================
   DATE VALUE
========================= */

const normalizeDate =
  (
    value,
    fieldLabel
  ) => {
    const dateValue =
      cleanText(
        value,
        20
      );

    if (
      !dateValue
    ) {
      return null;
    }

    const match =
      dateValue.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (
      !match
    ) {
      throw new ApiError(
        422,
        `${fieldLabel} must use YYYY-MM-DD format.`
      );
    }

    const year =
      Number(
        match[1]
      );

    const month =
      Number(
        match[2]
      );

    const day =
      Number(
        match[3]
      );

    const parsedDate =
      new Date(
        Date.UTC(
          year,
          month - 1,
          day
        )
      );

    const validDate =
      parsedDate
        .getUTCFullYear() ===
        year &&
      parsedDate
        .getUTCMonth() ===
        month - 1 &&
      parsedDate
        .getUTCDate() ===
        day;

    if (
      !validDate
    ) {
      throw new ApiError(
        422,
        `${fieldLabel} contains an invalid date.`
      );
    }

    if (
      parsedDate >
      new Date()
    ) {
      throw new ApiError(
        422,
        `${fieldLabel} cannot be a future date.`
      );
    }

    return dateValue;
  };

/* =========================
   SOCIAL LINKS
========================= */

const flattenFieldValues =
  (
    value
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return [];
    }

    if (
      Array.isArray(
        value
      )
    ) {
      return value.flatMap(
        flattenFieldValues
      );
    }

    return [
      value,
    ];
  };

const normalizeSocialLinks =
  (
    fields
  ) => {
    const candidates = [
      fields[
        "social_link[]"
      ],
      fields.social_link,
      fields.social_links,
    ];

    const normalizedLinks = [];

    for (
      const candidate of candidates
    ) {
      for (
        const rawValue of flattenFieldValues(
          candidate
        )
      ) {
        const stringValue =
          String(
            rawValue ||
              ""
          ).trim();

        if (
          !stringValue
        ) {
          continue;
        }

        let values = [
          stringValue,
        ];

        try {
          const parsedValue =
            JSON.parse(
              stringValue
            );

          if (
            Array.isArray(
              parsedValue
            )
          ) {
            values =
              parsedValue;
          }
        } catch {
          values =
            stringValue.split(
              ","
            );
        }

        for (
          const value of values
        ) {
          const link =
            String(
              value ||
                ""
            ).trim();

          if (
            !link
          ) {
            continue;
          }

          if (
            link.length >
            500
          ) {
            throw new ApiError(
              422,
              "A social media link is too long."
            );
          }

          let parsedUrl;

          try {
            parsedUrl =
              new URL(
                link
              );
          } catch {
            throw new ApiError(
              422,
              `Invalid social media URL: ${link}`
            );
          }

          if (
            ![
              "http:",
              "https:",
            ].includes(
              parsedUrl.protocol
            )
          ) {
            throw new ApiError(
              422,
              "Social media links must use HTTP or HTTPS."
            );
          }

          normalizedLinks.push(
            link
          );
        }
      }
    }

    return Array.from(
      new Set(
        normalizedLinks
      )
    )
      .slice(
        0,
        10
      )
      .join(
        ", "
      ) ||
      null;
  };

/* =========================
   PROFILE IMAGE
========================= */

const validateProfileImage =
  (
    files
  ) => {
    const profilePic =
      getFirstFile(
        files.profile_pic ||
        files.profilePicture
      );

    if (
      !profilePic
    ) {
      return null;
    }

    if (
      !profilePic.filepath
    ) {
      throw new ApiError(
        422,
        "Uploaded profile image is invalid."
      );
    }

    if (
      Number(
        profilePic.size ||
          0
      ) >
      MAX_PROFILE_FILE_SIZE
    ) {
      throw new ApiError(
        413,
        "Profile image cannot exceed 5 MB."
      );
    }

    const mimeType =
      String(
        profilePic.mimetype ||
          ""
      ).toLowerCase();

    if (
      !ALLOWED_PROFILE_MIME_TYPES
        .has(
          mimeType
        )
    ) {
      throw new ApiError(
        422,
        "Profile image must be JPG, PNG or WEBP."
      );
    }

    return profilePic;
  };

/* =========================
   COMPLETION VALIDATION
========================= */

const validateProfileCompletionData =
  async (
    request,
    response,
    next
  ) => {
    try {
      const fields =
        request
          .profileCompletionFields ||
        {};

      const files =
        request
          .profileCompletionFiles ||
        {};

      const declaration =
        normalizeBoolean(
          fields.declaration
        );

      if (
        !declaration
      ) {
        throw new ApiError(
          422,
          "Please accept the declaration."
        );
      }

      const nomineeAadhaarValue =
        cleanText(
          fields.nomini_aadhar,
          20
        ).replace(
          /\D/g,
          ""
        );

      if (
        nomineeAadhaarValue &&
        !/^[0-9]{12}$/.test(
          nomineeAadhaarValue
        )
      ) {
        throw new ApiError(
          422,
          "Nominee Aadhaar number must contain exactly 12 digits."
        );
      }

      const witnessInmbaId =
        cleanText(
          fields.witness_inmba_id,
          100
        ) ||
        null;

      const completionData = {
        declaration:
          true,

        contact_number:
          normalizePhone(
            fields.contact_number,
            "Contact number"
          ),

        whatsapp_number:
          normalizePhone(
            fields.whatsapp_number,
            "WhatsApp number"
          ),

        nomini_name:
          cleanText(
            fields.nomini_name,
            255
          ) ||
          null,

        nomini_dob:
          normalizeDate(
            fields.nomini_dob,
            "Nominee date of birth"
          ),

        nomini_relationship:
          cleanText(
            fields
              .nomini_relationship,
            150
          ) ||
          null,

        nomini_aadhar:
          nomineeAadhaarValue ||
          null,

        witness_name:
          cleanText(
            fields.witness_name,
            255
          ) ||
          null,

        witness_phone:
          normalizePhone(
            fields.witness_phone,
            "Witness phone number"
          ),

        witness_inmba_id:
          witnessInmbaId,

        social_link:
          normalizeSocialLinks(
            fields
          ),

        educational_qualification:
          cleanText(
            fields
              .educational_qualification,
            500
          ) ||
          null,

        profile_pic:
          validateProfileImage(
            files
          ),
      };

      request
        .validatedProfileCompletion =
        completionData;

      return next();
    } catch (error) {
      await cleanupProfileCompletionFile(
        request
      );

      return next(
        error
      );
    }
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  PROFILE_TEMP_ROOT,
  MAX_PROFILE_FILE_SIZE,
  ALLOWED_PROFILE_MIME_TYPES,
  getFormidableFactory,
  getFirstValue,
  cleanText,
  validateProfileCompletionToken,
  getFirstFile,
  collectFiles,
  removeTemporaryFile,
  cleanupFileCollection,
  cleanupProfileCompletionFile,
  parseProfileCompletionForm,
  normalizeBoolean,
  normalizePhone,
  normalizeDate,
  flattenFieldValues,
  normalizeSocialLinks,
  validateProfileImage,
  validateProfileCompletionData,
};