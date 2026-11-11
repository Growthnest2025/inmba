const crypto =
  require(
    "crypto"
  );

const sgMail =
  require(
    "@sendgrid/mail"
  );

const ApiError =
  require(
    "../utils/apiError"
  );

const {
  findActionMemberById,
  findMemberByReferralId,
  updateMemberStatusById,
  updateMemberFieldsById,
  softDeleteMemberById,
  restoreMemberById,
  findDeletedMembers,
  countDeletedMembers,
  ensureDeletedBackupTable,
  insertDeletedMemberBackup,
  permanentlyDeleteMemberById,
} = require(
  "../repositories/adminMemberAction.repository"
);

/* =========================
   PAYMENT FIELDS
========================= */

const PAYMENT_FIELDS = [
  "payment_method",
  "transaction_id",
  "amount",
  "account_holder",
  "bank_name",
  "account_number",
  "ifsc",
];

/* =========================
   ROLE HELPERS
========================= */

const normalizeRole =
  (
    role
  ) => {
    return String(
      role ||
        ""
    )
      .trim()
      .toLowerCase();
  };

/* =========================
   RESULT HELPER
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

/* =========================
   PAYMENT CHECK
========================= */

const hasPaymentDetails =
  (
    member
  ) => {
    return PAYMENT_FIELDS.some(
      (
        fieldName
      ) => {
        const value =
          member?.[
            fieldName
          ];

        if (
          value === null ||
          value === undefined
        ) {
          return false;
        }

        if (
          fieldName ===
          "amount"
        ) {
          return (
            Number(
              value
            ) >
            0
          );
        }

        return (
          String(
            value
          ).trim() !==
          ""
        );
      }
    );
  };

/* =========================
   REFERRAL GENERATOR
========================= */

const generateReferralCode =
  () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    const randomBytes =
      crypto.randomBytes(
        8
      );

    let referralId =
      "";

    for (
      let index = 0;
      index <
      randomBytes.length;
      index += 1
    ) {
      referralId +=
        characters[
          randomBytes[
            index
          ] %
          characters.length
        ];
    }

    return referralId;
  };

const generateUniqueReferralId =
  async (
    connection =
      null
  ) => {
    for (
      let attempt = 0;
      attempt < 25;
      attempt += 1
    ) {
      const referralId =
        generateReferralCode();

      const existingMember =
        await findMemberByReferralId(
          referralId,
          connection
        );

      if (
        !existingMember
      ) {
        return referralId;
      }
    }

    throw new ApiError(
      500,
      "Unable to generate a unique referral ID."
    );
  };

/* =========================
   REFERRAL EMAIL
========================= */

const sendReferralEmail =
  async (
    member,
    referralId
  ) => {
    const apiKey =
      String(
        process.env
          .SENDGRID_API_KEY ||
          ""
      ).trim();

    const fromEmail =
      String(
        process.env
          .EMAIL_FROM ||
          ""
      ).trim();

    if (
      !member.email ||
      !apiKey ||
      !fromEmail ||
      apiKey ===
        "PASTE_OLD_SENDGRID_KEY_HERE"
    ) {
      return {
        sent:
          false,

        reason:
          "Email configuration is unavailable.",
      };
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

    const referralLink =
      `${frontendBaseUrl}` +
      `/membership?ref=` +
      encodeURIComponent(
        referralId
      );

    try {
      sgMail.setApiKey(
        apiKey
      );

      await sgMail.send({
        to:
          member.email,

        from:
          fromEmail,

        subject:
          "Your INMBA Referral Link",

        text:
          `Your INMBA referral code is ${referralId}. Referral link: ${referralLink}`,

        html:
          `
            <div style="font-family:Arial,sans-serif;padding:20px">
              <h2 style="color:#0f4d0f">
                Your INMBA Referral is Ready
              </h2>

              <p>
                Referral code:
                <strong>${referralId}</strong>
              </p>

              <p>
                <a href="${referralLink}">
                  Open referral registration
                </a>
              </p>
            </div>
          `,
      });

      return {
        sent:
          true,

        referral_link:
          referralLink,
      };
    } catch (error) {
      console.error(
        "Referral email error:",
        error.message
      );

      return {
        sent:
          false,

        reason:
          "Referral email delivery failed.",
      };
    }
  };

/* =========================
   STATUS UPDATE
========================= */

const updateMemberVerification =
  async (
    memberId,
    statusData,
    admin,
    connection =
      null
  ) => {
    const member =
      await findActionMemberById(
        memberId,
        false,
        connection
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Member not found."
      );
    }

    let referralId =
      statusData
        .referral_id ||
      member.referral_id ||
      null;

    if (
      statusData.status ===
      "approved"
    ) {
      if (
        !hasPaymentDetails(
          member
        )
      ) {
        throw new ApiError(
          422,
          "Cannot approve this member until payment details are recorded."
        );
      }

      if (
        referralId
      ) {
        const referralOwner =
          await findMemberByReferralId(
            referralId,
            connection
          );

        if (
          referralOwner &&
          Number(
            referralOwner.id
          ) !==
          Number(
            member.id
          )
        ) {
          throw new ApiError(
            409,
            "Referral ID is already assigned to another member."
          );
        }
      } else {
        referralId =
          await generateUniqueReferralId(
            connection
          );
      }
    }

    const updateResult =
      await updateMemberStatusById(
        member.id,
        statusData.status,
        referralId,
        connection
      );

    if (
      getAffectedRows(
        updateResult
      ) === 0
    ) {
      throw new ApiError(
        404,
        "Member could not be updated."
      );
    }

    let notification = {
      method:
        statusData
          .send_method,

      sent:
        false,
    };

    if (
      statusData.status ===
        "approved" &&
      statusData
        .send_method ===
        "email"
    ) {
      notification =
        {
          method:
            "email",

          ...(
            await sendReferralEmail(
              member,
              referralId
            )
          ),
        };
    }

    if (
      statusData.status ===
        "approved" &&
      statusData
        .send_method ===
        "otp"
    ) {
      const otp =
        String(
          crypto.randomInt(
            100000,
            1000000
          )
        );

      notification = {
        method:
          "otp",

        sent:
          false,

        phone:
          member.phone ||
          null,

        reason:
          "SMS service is not configured.",
      };

      if (
        process.env
          .NODE_ENV !==
        "production"
      ) {
        notification
          .debug_otp =
          otp;
      }
    }

    const updatedMember =
      await findActionMemberById(
        member.id,
        false,
        connection
      );

    return {
      member: {
        id:
          updatedMember.id,

        login_id:
          updatedMember
            .login_id,

        full_name:
          [
            updatedMember
              .first_name,
            updatedMember
              .last_name,
          ]
            .filter(Boolean)
            .join(" ")
            .trim(),

        payment_status:
          updatedMember
            .payment_status,

        referral_id:
          updatedMember
            .referral_id,
      },

      notification,

      updated_by: {
        id:
          admin.id,

        username:
          admin.username,

        role:
          admin.role,
      },
    };
  };

/* =========================
   EDIT MEMBER
========================= */

const editAdminMember =
  async (
    memberId,
    updateData,
    admin,
    connection =
      null
  ) => {
    const member =
      await findActionMemberById(
        memberId,
        false,
        connection
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Member not found."
      );
    }

    const adminRole =
      normalizeRole(
        admin.role
      );

    const finalUpdate = {
      ...updateData,
    };

    const adminRestrictedFields =
      new Set([
        ...PAYMENT_FIELDS,
        "payment_status",
        "subscription_year",
        "payment_proof",
      ]);

    if (
      adminRole ===
      "admin"
    ) {
      for (
        const fieldName of adminRestrictedFields
      ) {
        delete finalUpdate[
          fieldName
        ];
      }
    }

    if (
      Object.keys(
        finalUpdate
      ).length === 0
    ) {
      throw new ApiError(
        403,
        "No fields are available for this admin role to update."
      );
    }

    const requestedStatus =
      finalUpdate
        .payment_status
        ? String(
            finalUpdate
              .payment_status
          ).toLowerCase()
        : null;

    if (
      requestedStatus ===
      "approved"
    ) {
      const mergedMember = {
        ...member,
        ...finalUpdate,
      };

      if (
        !hasPaymentDetails(
          mergedMember
        )
      ) {
        throw new ApiError(
          422,
          "Cannot approve this member until payment details are recorded."
        );
      }

      if (
        !mergedMember
          .referral_id
      ) {
        finalUpdate
          .referral_id =
          await generateUniqueReferralId(
            connection
          );
      }
    }

    if (
      finalUpdate
        .referral_id
    ) {
      const referralOwner =
        await findMemberByReferralId(
          finalUpdate
            .referral_id,
          connection
        );

      if (
        referralOwner &&
        Number(
          referralOwner.id
        ) !==
        Number(
          member.id
        )
      ) {
        throw new ApiError(
          409,
          "Referral ID is already assigned to another member."
        );
      }
    }

    const updateResult =
      await updateMemberFieldsById(
        member.id,
        finalUpdate,
        connection
      );

    if (
      getAffectedRows(
        updateResult
      ) === 0
    ) {
      throw new ApiError(
        404,
        "Member could not be updated."
      );
    }

    const updatedMember =
      await findActionMemberById(
        member.id,
        false,
        connection
      );

    const safeMember = {
      ...updatedMember,
    };

    delete safeMember
      .password;

    delete safeMember
      .otp;

    delete safeMember
      .otp_expires;

    delete safeMember
      .token;

    return {
      member:
        safeMember,

      updated_fields:
        Object.keys(
          finalUpdate
        ),

      updated_by: {
        id:
          admin.id,

        username:
          admin.username,

        role:
          admin.role,
      },
    };
  };

/* =========================
   SOFT DELETE
========================= */

const softDeleteAdminMember =
  async (
    memberId,
    admin,
    connection =
      null
  ) => {
    const member =
      await findActionMemberById(
        memberId,
        false,
        connection
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Active member not found."
      );
    }

    const result =
      await softDeleteMemberById(
        member.id,
        connection
      );

    if (
      getAffectedRows(
        result
      ) === 0
    ) {
      throw new ApiError(
        404,
        "Member could not be deactivated."
      );
    }

    return {
      member_id:
        member.id,

      login_id:
        member.login_id,

      is_deleted:
        true,

      deleted_permanently:
        false,

      action_by:
        admin,
    };
  };

/* =========================
   RESTORE MEMBER
========================= */

const restoreAdminMember =
  async (
    memberId,
    admin,
    connection =
      null
  ) => {
    const member =
      await findActionMemberById(
        memberId,
        true,
        connection
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Member not found."
      );
    }

    if (
      Number(
        member.is_deleted ||
          0
      ) !== 1
    ) {
      throw new ApiError(
        409,
        "Member is already active."
      );
    }

    const result =
      await restoreMemberById(
        member.id,
        connection
      );

    if (
      getAffectedRows(
        result
      ) === 0
    ) {
      throw new ApiError(
        404,
        "Member could not be restored."
      );
    }

    return {
      member_id:
        member.id,

      login_id:
        member.login_id,

      is_deleted:
        false,

      restored:
        true,

      action_by:
        admin,
    };
  };

/* =========================
   DELETED MEMBER LIST
========================= */

const getDeletedAdminMembers =
  async (
    query,
    connection =
      null
  ) => {
    const [
      members,
      total,
    ] =
      await Promise.all([
        findDeletedMembers(
          query.page,
          query.limit,
          connection
        ),

        countDeletedMembers(
          connection
        ),
      ]);

    return {
      members,

      pagination: {
        page:
          query.page,

        limit:
          query.limit,

        total,

        total_pages:
          total === 0
            ? 0
            : Math.ceil(
                total /
                query.limit
              ),
      },
    };
  };

/* =========================
   SAFE JSON BACKUP
========================= */

const serializeMemberBackup =
  (
    member
  ) => {
    return JSON.stringify(
      member,
      (
        key,
        value
      ) => {
        if (
          typeof value ===
          "bigint"
        ) {
          return value.toString();
        }

        if (
          value instanceof
          Date
        ) {
          return value
            .toISOString();
        }

        return value;
      }
    );
  };

/* =========================
   PERMANENT DELETE
========================= */

const permanentlyDeleteAdminMember =
  async (
    memberId,
    admin,
    connection =
      null
  ) => {
    if (
      normalizeRole(
        admin.role
      ) !==
      "super_admin"
    ) {
      throw new ApiError(
        403,
        "Only Super Admin can permanently delete a member."
      );
    }

    const member =
      await findActionMemberById(
        memberId,
        true,
        connection
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Member not found."
      );
    }

    await ensureDeletedBackupTable(
      connection
    );

    const backupData =
      serializeMemberBackup(
        member
      );

    const backupResult =
      await insertDeletedMemberBackup(
        member,
        backupData,
        connection
      );

    const backupId =
      Number(
        backupResult
          ?.insertId ??
        backupResult
          ?.[0]
          ?.insertId ??
        0
      );

    const deleteResult =
      await permanentlyDeleteMemberById(
        member.id,
        connection
      );

    if (
      getAffectedRows(
        deleteResult
      ) === 0
    ) {
      throw new ApiError(
        500,
        "Member backup was created, but permanent deletion failed."
      );
    }

    return {
      member_id:
        member.id,

      login_id:
        member.login_id,

      backup_id:
        backupId ||
        null,

      backup_created:
        true,

      deleted_permanently:
        true,

      action_by:
        admin,
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  PAYMENT_FIELDS,
  normalizeRole,
  getAffectedRows,
  hasPaymentDetails,
  generateReferralCode,
  generateUniqueReferralId,
  sendReferralEmail,
  updateMemberVerification,
  editAdminMember,
  softDeleteAdminMember,
  restoreAdminMember,
  getDeletedAdminMembers,
  serializeMemberBackup,
  permanentlyDeleteAdminMember,
};