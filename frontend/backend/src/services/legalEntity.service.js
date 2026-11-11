const crypto =
  require(
    "crypto"
  );

const fs =
  require(
    "fs/promises"
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
  normalizeMemberId,
  normalizeToken,
  findLegalEntityMemberById,
  findLegalEntityMemberByToken,
  findDuplicateEntityAadhar,
  updateLegalEntityKycById,
  toSafeLegalEntityMember,
} = require(
  "../repositories/legalEntity.repository"
);

const LEGAL_ENTITY_UPLOAD_DIRECTORY =
  path.resolve(
    process.cwd(),
    "storage",
    "uploads",
    "kyc"
  );

/* =========================
   HELPERS
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

const getBackendBaseUrl =
  () => {
    return removeTrailingSlash(
      process.env
        .BACKEND_URL ||
        "http://127.0.0.1:5000"
    );
  };

const createKycFileUrl =
  (
    filename
  ) => {
    if (!filename) {
      return null;
    }

    const value =
      String(
        filename
      ).trim();

    if (
      /^https?:\/\//i.test(
        value
      )
    ) {
      return value;
    }

    if (
      value.startsWith(
        "/uploads/"
      )
    ) {
      return (
        `${getBackendBaseUrl()}` +
        value
      );
    }

    return (
      `${getBackendBaseUrl()}` +
      `/uploads/kyc/` +
      encodeURIComponent(
        path.basename(
          value
        )
      )
    );
  };

const getImageExtension =
  (
    file
  ) => {
    const originalExtension =
      path.extname(
        file
          .originalFilename ||
          ""
      ).toLowerCase();

    const allowedExtensions =
      new Set([
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
      ]);

    if (
      allowedExtensions.has(
        originalExtension
      )
    ) {
      return originalExtension ===
        ".jpeg"
        ? ".jpg"
        : originalExtension;
    }

    const mimeExtensions = {
      "image/jpeg":
        ".jpg",

      "image/png":
        ".png",

      "image/webp":
        ".webp",
    };

    return (
      mimeExtensions[
        file.mimetype
      ] ||
      ".jpg"
    );
  };

const removeFileSafely =
  async (
    filePath
  ) => {
    if (!filePath) {
      return;
    }

    try {
      await fs.unlink(
        filePath
      );
    } catch {
      // File may not exist.
    }
  };

const maskAadharNumber =
  (
    value
  ) => {
    const digits =
      String(
        value ||
        ""
      ).replace(
        /\D/g,
        ""
      );

    if (
      digits.length !==
      12
    ) {
      return "";
    }

    return (
      `XXXX XXXX ` +
      digits.slice(-4)
    );
  };

const isLegalEntityKycComplete =
  (
    member
  ) => {
    if (!member) {
      return false;
    }

    const requiredFields = [
      member
        .entity_house_no,
      member
        .entity_street,
      member
        .entity_area,
      member
        .entity_city,
      member
        .entity_district,
      member
        .entity_state,
      member
        .entity_pincode,
      member
        .entity_aadhar_front,
      member
        .entity_aadhar_back,
      member
        .entity_aadhar_selfie,
    ];

    return requiredFields.every(
      (
        value
      ) =>
        value !== null &&
        value !== undefined &&
        String(
          value
        ).trim() !==
          ""
    );
  };

const createLegalEntityResponse =
  (
    member
  ) => {
    const safeMember =
      toSafeLegalEntityMember(
        member
      );

    if (!safeMember) {
      return null;
    }

    return {
      member: {
        id:
          safeMember.id,

        login_id:
          safeMember
            .login_id,

        full_name:
          safeMember
            .full_name,

        email:
          safeMember.email,

        phone:
          safeMember.phone,
      },

      legal_entity: {
        entity_aadhar_number:
          safeMember
            .entity_aadhar_number,

        masked_aadhar_number:
          maskAadharNumber(
            safeMember
              .entity_aadhar_number
          ),

        entity_house_no:
          safeMember
            .entity_house_no,

        entity_street:
          safeMember
            .entity_street,

        entity_area:
          safeMember
            .entity_area,

        entity_city:
          safeMember
            .entity_city,

        entity_district:
          safeMember
            .entity_district,

        entity_state:
          safeMember
            .entity_state,

        entity_pincode:
          safeMember
            .entity_pincode,

        entity_aadhar_front:
          safeMember
            .entity_aadhar_front,

        entity_aadhar_back:
          safeMember
            .entity_aadhar_back,

        entity_aadhar_selfie:
          safeMember
            .entity_aadhar_selfie,

        entity_aadhar_front_url:
          createKycFileUrl(
            safeMember
              .entity_aadhar_front
          ),

        entity_aadhar_back_url:
          createKycFileUrl(
            safeMember
              .entity_aadhar_back
          ),

        entity_aadhar_selfie_url:
          createKycFileUrl(
            safeMember
              .entity_aadhar_selfie
          ),
      },

      kyc_completed:
        isLegalEntityKycComplete(
          safeMember
        ),

      payment_status:
        safeMember
          .payment_status,
    };
  };

/* =========================
   REQUIRE MEMBER BY ID
========================= */

const requireLegalEntityMemberById =
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
      await findLegalEntityMemberById(
        normalizedMemberId,
        connection
      );

    if (!member) {
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

const requireLegalEntityMemberByToken =
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
      await findLegalEntityMemberByToken(
        normalizedToken,
        connection
      );

    if (!member) {
      throw new ApiError(
        404,
        "Invalid member token."
      );
    }

    return member;
  };

/* =========================
   GET KYC
========================= */

const getLegalEntityKyc =
  async (
    memberId,
    connection =
      null
  ) => {
    const member =
      await requireLegalEntityMemberById(
        memberId,
        connection
      );

    return createLegalEntityResponse(
      member
    );
  };

/* =========================
   GET KYC BY TOKEN
========================= */

const getLegalEntityKycByToken =
  async (
    token,
    connection =
      null
  ) => {
    const member =
      await requireLegalEntityMemberByToken(
        token,
        connection
      );

    return createLegalEntityResponse(
      member
    );
  };

/* =========================
   SAVE ONE UPLOAD
========================= */

const saveUploadedKycFile =
  async (
    memberId,
    fieldName,
    file
  ) => {
    if (
      !file ||
      !file.filepath
    ) {
      return null;
    }

    await fs.mkdir(
      LEGAL_ENTITY_UPLOAD_DIRECTORY,
      {
        recursive:
          true,
      }
    );

    const extension =
      getImageExtension(
        file
      );

    const filename =
      [
        fieldName,
        memberId,
        crypto
          .randomBytes(8)
          .toString("hex"),
      ].join("_") +
      extension;

    const destinationPath =
      path.join(
        LEGAL_ENTITY_UPLOAD_DIRECTORY,
        filename
      );

    await fs.copyFile(
      file.filepath,
      destinationPath
    );

    await removeFileSafely(
      file.filepath
    );

    return {
      filename,
      destinationPath,
    };
  };

/* =========================
   SAVE KYC
========================= */

const saveLegalEntityKyc =
  async (
    memberId,
    data,
    files = {},
    connection =
      null
  ) => {
    const member =
      await requireLegalEntityMemberById(
        memberId,
        connection
      );

    const duplicateAadhar =
      await findDuplicateEntityAadhar(
        data
          .entity_aadhar_number,
        member.id,
        connection
      );

    if (
      duplicateAadhar
    ) {
      throw new ApiError(
        409,
        "This Aadhaar number is already registered."
      );
    }

    const savedFiles = {};

    try {
      for (
        const fieldName of [
          "entity_aadhar_front",
          "entity_aadhar_back",
          "entity_aadhar_selfie",
        ]
      ) {
        const savedFile =
          await saveUploadedKycFile(
            member.id,
            fieldName,
            files[fieldName]
          );

        if (savedFile) {
          savedFiles[fieldName] =
            savedFile;
        }
      }

      const finalFiles = {
        entity_aadhar_front:
          savedFiles
            .entity_aadhar_front
            ?.filename ||
          member
            .entity_aadhar_front ||
          null,

        entity_aadhar_back:
          savedFiles
            .entity_aadhar_back
            ?.filename ||
          member
            .entity_aadhar_back ||
          null,

        entity_aadhar_selfie:
          savedFiles
            .entity_aadhar_selfie
            ?.filename ||
          member
            .entity_aadhar_selfie ||
          null,
      };

      if (
        !finalFiles
          .entity_aadhar_front
      ) {
        throw new ApiError(
          422,
          "Aadhaar front image is required."
        );
      }

      if (
        !finalFiles
          .entity_aadhar_back
      ) {
        throw new ApiError(
          422,
          "Aadhaar back image is required."
        );
      }

      if (
        !finalFiles
          .entity_aadhar_selfie
      ) {
        throw new ApiError(
          422,
          "Aadhaar selfie is required."
        );
      }

      await updateLegalEntityKycById(
        member.id,
        {
          ...data,
          ...finalFiles,
        },
        connection
      );

      const oldFileFields = [
        "entity_aadhar_front",
        "entity_aadhar_back",
        "entity_aadhar_selfie",
      ];

      for (
        const fieldName of oldFileFields
      ) {
        if (
          savedFiles[fieldName] &&
          member[fieldName]
        ) {
          const oldFilePath =
            path.join(
              LEGAL_ENTITY_UPLOAD_DIRECTORY,
              path.basename(
                member[fieldName]
              )
            );

          if (
            oldFilePath !==
            savedFiles[fieldName]
              .destinationPath
          ) {
            await removeFileSafely(
              oldFilePath
            );
          }
        }
      }

      const updatedMember =
        await findLegalEntityMemberById(
          member.id,
          connection
        );

      const kyc =
        createLegalEntityResponse(
          updatedMember
        );

      const redirectTo =
        `/pan/${encodeURIComponent(
          member.token
        )}`;

      return {
        ...kyc,

        redirectTo,

        nextAction: {
          type:
            "NAVIGATE",

          path:
            redirectTo,
        },
      };
    } catch (error) {
      for (
        const savedFile of Object.values(
          savedFiles
        )
      ) {
        await removeFileSafely(
          savedFile
            .destinationPath
        );
      }

      for (
        const file of Object.values(
          files ||
            {}
        )
      ) {
        await removeFileSafely(
          file?.filepath
        );
      }

      throw error;
    }
  };

/* =========================
   SAVE KYC BY TOKEN
========================= */

const saveLegalEntityKycByToken =
  async (
    token,
    data,
    files = {},
    connection =
      null
  ) => {
    const member =
      await requireLegalEntityMemberByToken(
        token,
        connection
      );

    return saveLegalEntityKyc(
      member.id,
      data,
      files,
      connection
    );
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  LEGAL_ENTITY_UPLOAD_DIRECTORY,
  getBackendBaseUrl,
  createKycFileUrl,
  getImageExtension,
  removeFileSafely,
  maskAadharNumber,
  isLegalEntityKycComplete,
  createLegalEntityResponse,
  requireLegalEntityMemberById,
  requireLegalEntityMemberByToken,
  getLegalEntityKyc,
  getLegalEntityKycByToken,
  saveUploadedKycFile,
  saveLegalEntityKyc,
  saveLegalEntityKycByToken,
};
