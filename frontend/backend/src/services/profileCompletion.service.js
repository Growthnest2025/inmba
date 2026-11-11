const fsPromises =
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

const ApiError =
  require(
    "../utils/apiError"
  );

const {
  ensureProfileCompletionColumns,
  findProfileCompletionMemberByToken,
  updateProfileCompletionByToken,
} = require(
  "../repositories/profileCompletion.repository"
);

/* =========================
   PROFILE DIRECTORY
========================= */

const PROFILE_UPLOAD_ROOT =
  path.resolve(
    process.cwd(),
    process.env
      .UPLOAD_ROOT ||
      "storage/uploads",
    "profile"
  );

/* =========================
   SAFE MEMBER
========================= */

const formatDateValue =
  (
    value
  ) => {
    if (
      !value
    ) {
      return null;
    }

    if (
      value instanceof
        Date &&
      !Number.isNaN(
        value.getTime()
      )
    ) {
      return value
        .toISOString()
        .slice(
          0,
          10
        );
    }

    const stringValue =
      String(
        value
      ).trim();

    if (
      /^\d{4}-\d{2}-\d{2}/.test(
        stringValue
      )
    ) {
      return stringValue.slice(
        0,
        10
      );
    }

    return stringValue;
  };

const parseSocialLinks =
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

    const stringValue =
      String(
        value ||
          ""
      ).trim();

    if (
      !stringValue
    ) {
      return [];
    }

    return stringValue
      .split(",")
      .map(
        (
          item
        ) =>
          item.trim()
      )
      .filter(Boolean);
  };

const buildStoredProfileUrl =
  (
    storedPath
  ) => {
    if (
      !storedPath
    ) {
      return null;
    }

    if (
      /^https?:\/\//i.test(
        storedPath
      )
    ) {
      return storedPath;
    }

    const backendUrl =
      String(
        process.env
          .BACKEND_URL ||
          "http://127.0.0.1:5000"
      ).replace(
        /\/+$/,
        ""
      );

    const cleanPath =
      String(
        storedPath
      )
        .replace(
          /\\/g,
          "/"
        )
        .replace(
          /^\/+/,
          ""
        )
        .replace(
          /^uploads\//,
          ""
        );

    return (
      `${backendUrl}/uploads/` +
      cleanPath
    );
  };

const toProfileCompletionMember =
  (
    member
  ) => {
    if (
      !member
    ) {
      return null;
    }

    return {
      id:
        Number(
          member.id
        ),

      first_name:
        member.first_name ||
        "",

      last_name:
        member.last_name ||
        "",

      full_name:
        [
          member.first_name,
          member.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),

      email:
        member.email ||
        "",

      phone:
        member.phone ||
        "",

      login_id:
        member.login_id ||
        "",

      token:
        member.token ||
        "",

      membership_type:
        member.membership_type ||
        "",

      profile_pic:
        member.profile_pic ||
        null,

      profile_photo_url:
        buildStoredProfileUrl(
          member.profile_pic
        ),

      contact_number:
        member.contact_number ||
        "",

      whatsapp_number:
        member.whatsapp_number ||
        "",

      nomini_name:
        member.nomini_name ||
        "",

      nomini_dob:
        formatDateValue(
          member.nomini_dob
        ),

      nomini_relationship:
        member.nomini_relationship ||
        "",

      nomini_aadhar:
        member.nomini_aadhar ||
        "",

      witness_name:
        member.witness_name ||
        "",

      witness_phone:
        member.witness_phone ||
        "",

      witness_inmba_id:
        member.witness_inmba_id ||
        "",

      social_link:
        member.social_link ||
        "",

      social_links:
        parseSocialLinks(
          member.social_link
        ),

      educational_qualification:
        member
          .educational_qualification ||
        "",

      payment_status:
        member.payment_status ||
        "",

      created_at:
        member.created_at ||
        null,
    };
  };

/* =========================
   FILE EXTENSION
========================= */

const getImageExtension =
  (
    file
  ) => {
    const mimeType =
      String(
        file?.mimetype ||
          ""
      ).toLowerCase();

    if (
      mimeType ===
      "image/png"
    ) {
      return ".png";
    }

    if (
      mimeType ===
      "image/webp"
    ) {
      return ".webp";
    }

    return ".jpg";
  };

/* =========================
   SAFE FILE MOVE
========================= */

const moveFile =
  async (
    sourcePath,
    targetPath
  ) => {
    try {
      await fsPromises.rename(
        sourcePath,
        targetPath
      );
    } catch (error) {
      if (
        error?.code !==
        "EXDEV"
      ) {
        throw error;
      }

      await fsPromises.copyFile(
        sourcePath,
        targetPath
      );

      await fsPromises.unlink(
        sourcePath
      );
    }
  };

const removeSavedFile =
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
          "Saved profile file cleanup failed:",
          error.message
        );
      }
    }
  };

/* =========================
   SAVE PROFILE IMAGE
========================= */

const saveProfilePicture =
  async (
    file,
    member
  ) => {
    if (
      !file
    ) {
      return {
        storedPath:
          member.profile_pic ||
          null,

        absolutePath:
          null,

        uploaded:
          false,
      };
    }

    await fsPromises.mkdir(
      PROFILE_UPLOAD_ROOT,
      {
        recursive:
          true,
      }
    );

    const extension =
      getImageExtension(
        file
      );

    const loginId =
      String(
        member.login_id ||
          member.id
      )
        .trim()
        .replace(
          /[^A-Za-z0-9_-]/g,
          ""
        ) ||
      String(
        member.id
      );

    const randomPart =
      crypto
        .randomBytes(
          10
        )
        .toString(
          "hex"
        );

    const filename =
      `${randomPart}_${loginId}${extension}`;

    const absolutePath =
      path.join(
        PROFILE_UPLOAD_ROOT,
        filename
      );

    await moveFile(
      file.filepath,
      absolutePath
    );

    return {
      storedPath:
        `uploads/profile/${filename}`,

      absolutePath,

      uploaded:
        true,
    };
  };

/* =========================
   GET PROFILE COMPLETION
========================= */

const getProfileCompletion =
  async (
    token,
    connection =
      null
  ) => {
    await ensureProfileCompletionColumns(
      connection
    );

    const member =
      await findProfileCompletionMemberByToken(
        token,
        connection
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Invalid or expired member token."
      );
    }

    const profile =
      toProfileCompletionMember(
        member
      );

    return {
      profile,

      declaration_required:
        true,

      upload_rules: {
        field:
          "profile_pic",

        accepted_types: [
          "image/jpeg",
          "image/png",
          "image/webp",
        ],

        max_size_mb:
          5,
      },

      completed:
        Boolean(
          member.profile_pic ||
          member.contact_number ||
          member.whatsapp_number
        ),

      nextAction: {
        type:
          "SUBMIT_FORM",

        method:
          "POST",

        path:
          `/api/kyc/profile/${encodeURIComponent(
            token
          )}`,
      },
    };
  };

/* =========================
   SUBMIT PROFILE COMPLETION
========================= */

const submitProfileCompletion =
  async (
    token,
    completionData,
    connection =
      null
  ) => {
    await ensureProfileCompletionColumns(
      connection
    );

    const member =
      await findProfileCompletionMemberByToken(
        token,
        connection
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Invalid or expired member token."
      );
    }

    let savedPicture = {
      storedPath:
        member.profile_pic ||
        null,

      absolutePath:
        null,

      uploaded:
        false,
    };

    try {
      savedPicture =
        await saveProfilePicture(
          completionData
            .profile_pic,
          member
        );

      const finalData = {
        ...completionData,

        profile_pic:
          savedPicture
            .storedPath,
      };

      await updateProfileCompletionByToken(
        token,
        finalData,
        connection
      );

      const updatedMember =
        await findProfileCompletionMemberByToken(
          token,
          connection
        );

      if (
        !updatedMember
      ) {
        throw new ApiError(
          404,
          "Updated member details could not be loaded."
        );
      }

      const frontendBaseUrl =
        String(
          process.env
            .FRONTEND_BASE_URL ||
            "http://localhost:5173"
        ).replace(
          /\/+$/,
          ""
        );

      return {
        profile:
          toProfileCompletionMember(
            updatedMember
          ),

        declaration_accepted:
          true,

        profile_picture_uploaded:
          savedPicture.uploaded,

        payment_status:
          updatedMember
            .payment_status,

        redirectTo:
          `/acknowledgement/${encodeURIComponent(
            token
          )}`,

        acknowledgementUrl:
          `${frontendBaseUrl}` +
          `/acknowledgement/` +
          encodeURIComponent(
            token
          ),

        nextAction: {
          type:
            "NAVIGATE",

          path:
            `/acknowledgement/${encodeURIComponent(
              token
            )}`,
        },
      };
    } catch (error) {
      /*
        Remove only the newly moved file
        when database update fails.
      */

      if (
        savedPicture.uploaded &&
        savedPicture.absolutePath
      ) {
        await removeSavedFile(
          savedPicture
            .absolutePath
        );
      }

      throw error;
    }
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  PROFILE_UPLOAD_ROOT,
  formatDateValue,
  parseSocialLinks,
  buildStoredProfileUrl,
  toProfileCompletionMember,
  getImageExtension,
  moveFile,
  removeSavedFile,
  saveProfilePicture,
  getProfileCompletion,
  submitProfileCompletion,
};
