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
  findSignatureMemberById,
  findSignatureMemberByToken,
  updateSignatureImageById,
  toSafeSignatureMember,
} = require(
  "../repositories/signature.repository"
);

const SIGNATURE_UPLOAD_DIRECTORY =
  path.resolve(
    process.cwd(),
    "storage",
    "uploads",
    "signature"
  );

/* =========================
   HELPERS
========================= */

const getAffectedRows =
  (
    result
  ) => {
    return Number(
      result?.affectedRows ??
        result?.[0]
          ?.affectedRows ??
        0
    );
  };

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

const createSignatureUrl =
  (
    signatureImage
  ) => {
    if (
      !signatureImage
    ) {
      return null;
    }

    const value =
      String(
        signatureImage
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
      `/uploads/signature/` +
      encodeURIComponent(
        path.basename(
          value
        )
      )
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

const createSignatureResponse =
  (
    member
  ) => {
    const safeMember =
      toSafeSignatureMember(
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
      },

      signature: {
        signature_image:
          safeMember
            .signature_image,

        signature_url:
          createSignatureUrl(
            safeMember
              .signature_image
          ),

        signature_uploaded:
          Boolean(
            safeMember
              .signature_image
          ),
      },

      payment_status:
        safeMember
          .payment_status,
    };
  };

/* =========================
   REQUIRE MEMBER BY ID
========================= */

const requireSignatureMemberById =
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
      await findSignatureMemberById(
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

const requireSignatureMemberByToken =
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
      await findSignatureMemberByToken(
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
   GET SIGNATURE
========================= */

const getMemberSignature =
  async (
    memberId,
    connection =
      null
  ) => {
    const member =
      await requireSignatureMemberById(
        memberId,
        connection
      );

    return createSignatureResponse(
      member
    );
  };

/* =========================
   SAVE SIGNATURE
========================= */

const saveMemberSignature =
  async (
    memberId,
    signatureData,
    connection =
      null
  ) => {
    const member =
      await requireSignatureMemberById(
        memberId,
        connection
      );

    if (
      !signatureData
        ?.image_buffer ||
      !signatureData
        ?.extension
    ) {
      throw new ApiError(
        422,
        "Valid signature image is required."
      );
    }

    await fs.mkdir(
      SIGNATURE_UPLOAD_DIRECTORY,
      {
        recursive:
          true,
      }
    );

    const filename =
      [
        "signature",
        member.id,
        crypto
          .randomBytes(8)
          .toString(
            "hex"
          ),
      ].join("_") +
      `.${signatureData.extension}`;

    const destinationPath =
      path.join(
        SIGNATURE_UPLOAD_DIRECTORY,
        filename
      );

    try {
      await fs.writeFile(
        destinationPath,
        signatureData
          .image_buffer
      );

      const updateResult =
        await updateSignatureImageById(
          member.id,
          filename,
          connection
        );

      if (
        getAffectedRows(
          updateResult
        ) === 0
      ) {
        await removeFileSafely(
          destinationPath
        );

        throw new ApiError(
          404,
          "Member account not found."
        );
      }

      if (
        member.signature_image
      ) {
        const oldFilePath =
          path.join(
            SIGNATURE_UPLOAD_DIRECTORY,
            path.basename(
              member
                .signature_image
            )
          );

        if (
          oldFilePath !==
          destinationPath
        ) {
          await removeFileSafely(
            oldFilePath
          );
        }
      }

      const updatedMember =
        await findSignatureMemberById(
          member.id,
          connection
        );

      const result =
        createSignatureResponse(
          updatedMember
        );

      const redirectTo =
        `/download_ack/${encodeURIComponent(
          member.token
        )}`;

      return {
        ...result,

        redirectTo,

        nextAction: {
          type:
            "NAVIGATE",

          path:
            redirectTo,
        },
      };
    } catch (error) {
      await removeFileSafely(
        destinationPath
      );

      throw error;
    }
  };

/* =========================
   GET BY TOKEN
========================= */

const getMemberSignatureByToken =
  async (
    token,
    connection =
      null
  ) => {
    const member =
      await requireSignatureMemberByToken(
        token,
        connection
      );

    return createSignatureResponse(
      member
    );
  };

/* =========================
   SAVE BY TOKEN
========================= */

const saveMemberSignatureByToken =
  async (
    token,
    signatureData,
    connection =
      null
  ) => {
    const member =
      await requireSignatureMemberByToken(
        token,
        connection
      );

    return saveMemberSignature(
      member.id,
      signatureData,
      connection
    );
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  SIGNATURE_UPLOAD_DIRECTORY,
  getAffectedRows,
  getBackendBaseUrl,
  createSignatureUrl,
  removeFileSafely,
  createSignatureResponse,
  requireSignatureMemberById,
  requireSignatureMemberByToken,
  getMemberSignature,
  saveMemberSignature,
  getMemberSignatureByToken,
  saveMemberSignatureByToken,
};