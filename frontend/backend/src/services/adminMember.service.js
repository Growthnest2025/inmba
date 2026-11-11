const sgMail =
  require(
    "@sendgrid/mail"
  );

const ApiError =
  require(
    "../utils/apiError"
  );

const {
  findAdminMembers,
  countAdminMembers,
  findAdminStatusCounts,
  countDeletedMembers,
  findAdminMemberById,
  findAdminMemberFullDetails,
  removePrivateMemberFields,
} = require(
  "../repositories/adminMember.repository"
);

const {
  findAdminById,
  updateAdminOtp,
  clearAdminOtp,
} = require(
  "../repositories/adminAuth.repository"
);

const {
  generateAdminOtp,
  createOtpExpiry,
  secureCompare,
} = require(
  "./adminAuth.service"
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
  "payment_status",
  "subscription_year",
  "payment_proof",
];

/* =========================
   NORMALIZE ROLE
========================= */

const normalizeAdminRole =
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
   HIDE PAYMENT DATA
========================= */

const hidePaymentFields =
  (
    member
  ) => {
    const safeMember = {
      ...member,
    };

    PAYMENT_FIELDS.forEach(
      (
        field
      ) => {
        if (
          Object.prototype
            .hasOwnProperty
            .call(
              safeMember,
              field
            )
        ) {
          safeMember[
            field
          ] = null;
        }
      }
    );

    return safeMember;
  };

/* =========================
   APPLY ROLE VISIBILITY
========================= */

const applyMemberVisibility =
  (
    member,
    adminRole
  ) => {
    const safeMember =
      removePrivateMemberFields(
        member
      );

    if (
      !safeMember
    ) {
      return null;
    }

    normalizeAdminRole(
      adminRole
    );

    /*
      Admin member details must show payment amount,
      payment mode, transaction ID and payment status.
      Only credential/private authentication fields are removed.
    */

    return safeMember;
  };

/* =========================
   LIST MEMBERS
========================= */

const getAdminMembers =
  async (
    query,
    adminRole,
    options = {},
    connection =
      null
  ) => {
    const paidOnly =
      Boolean(
        options.paidOnly
      );

    const listQuery = {
      ...query,
      paidOnly,
    };

    const [
      members,
      total,
    ] =
      await Promise.all([
        findAdminMembers(
          listQuery,
          connection
        ),

        countAdminMembers(
          listQuery,
          connection
        ),
      ]);

    const page =
      query.page ||
      1;

    const limit =
      query.limit ||
      25;

    return {
      members:
        members
          .map(
            (
              member
            ) =>
              applyMemberVisibility(
                member,
                adminRole
              )
          )
          .filter(Boolean),

      pagination: {
        page,
        limit,
        total,

        total_pages:
          total === 0
            ? 0
            : Math.ceil(
                total /
                  limit
              ),

        has_next:
          page *
            limit <
          total,

        has_previous:
          page > 1,
      },

      filters: {
        status:
          paidOnly
            ? "paid"
            : query.status,

        search:
          query.search ||
          "",
      },
    };
  };

/* =========================
   ADMIN DASHBOARD
========================= */

const getAdminDashboard =
  async (
    query,
    adminRole,
    connection =
      null
  ) => {
    const [
      membersResult,
      statusCounts,
      deletedCount,
    ] =
      await Promise.all([
        getAdminMembers(
          query,
          adminRole,
          {},
          connection
        ),

        findAdminStatusCounts(
          connection
        ),

        countDeletedMembers(
          connection
        ),
      ]);

    return {
      summary: {
        ...statusCounts,

        deleted:
          deletedCount,
      },

      selected_status:
        query.status,

      ...membersResult,
    };
  };

/* =========================
   GET MEMBER DETAILS
========================= */

const getAdminMemberDetails =
  async (
    memberId,
    adminRole,
    verifiedUsers = {},
    connection =
      null
  ) => {
    const role =
      normalizeAdminRole(
        adminRole
      );

    if (
      role ===
      "subadmin"
    ) {
      const isVerified =
        Boolean(
          verifiedUsers[
            String(
              memberId
            )
          ]
        );

      if (
        !isVerified
      ) {
        const error =
          new ApiError(
            403,
            "OTP verification required to view this member's details."
          );

        error.errorCode =
          "USER_OTP_REQUIRED";

        throw error;
      }
    }

    const details =
      await findAdminMemberFullDetails(
        memberId,
        connection
      );

    if (
      !details
    ) {
      throw new ApiError(
        404,
        "Member not found."
      );
    }

    const safeMember =
      applyMemberVisibility(
        details.member,
        role
      );

    if (!safeMember) {
      throw new ApiError(
        404,
        "Member not found."
      );
    }

    const cleanNestedRecord =
      (value) => {
        if (
          !value ||
          typeof value !==
            "object" ||
          Array.isArray(value)
        ) {
          return value ?? null;
        }

        return removePrivateMemberFields(
          value
        );
      };

    return {
      member:
        safeMember,

      membership_type:
        details.membership_type,

      civilianKyc:
        cleanNestedRecord(
          details.civilianKyc
        ),

      professionalKyc:
        cleanNestedRecord(
          details.professionalKyc
        ),

      commercialKyc:
        cleanNestedRecord(
          details.commercialKyc
        ),

      payment:
        details.payment ||
        null,
    };
  };

/* =========================
   SEND USER ACCESS OTP
========================= */

const sendUserAccessOtpEmail =
  async (
    admin,
    otp,
    memberId
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
      !apiKey ||
      apiKey ===
        "PASTE_OLD_SENDGRID_KEY_HERE" ||
      !fromEmail ||
      !admin.email
    ) {
      return {
        sent:
          false,

        reason:
          "Email configuration is unavailable.",
      };
    }

    try {
      sgMail.setApiKey(
        apiKey
      );

      await sgMail.send({
        to:
          admin.email,

        from:
          fromEmail,

        subject:
          "INMBA Member Access OTP",

        text:
          `Your OTP for accessing member #${memberId} is ${otp}. It expires in 5 minutes.`,

        html:
          `
            <div style="font-family:Arial,sans-serif;padding:20px">
              <h2 style="color:#0f4d0f">
                INMBA Member Access
              </h2>

              <p>
                Your OTP for accessing member
                <strong>#${memberId}</strong>
                is:
              </p>

              <div style="
                display:inline-block;
                padding:12px 20px;
                border:1px solid #0f4d0f;
                border-radius:8px;
                font-size:24px;
                font-weight:700;
                letter-spacing:6px;
                color:#0f4d0f;
                background:#eef7ee;
              ">
                ${otp}
              </div>

              <p style="margin-top:18px">
                This OTP expires in 5 minutes.
              </p>
            </div>
          `,
      });

      return {
        sent:
          true,
      };
    } catch (error) {
      console.error(
        "Member access OTP email failed:",
        error.message
      );

      return {
        sent:
          false,

        reason:
          "Unable to send OTP email.",
      };
    }
  };

/* =========================
   REQUEST SUBADMIN OTP
========================= */

const requestSubadminMemberOtp =
  async (
    adminSession,
    memberId,
    connection =
      null
  ) => {
    const role =
      normalizeAdminRole(
        adminSession
          ?.role
      );

    if (
      role !==
      "subadmin"
    ) {
      throw new ApiError(
        400,
        "Member access OTP is applicable only to Subadmin accounts."
      );
    }

    const member =
      await findAdminMemberById(
        memberId,
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

    const admin =
      await findAdminById(
        adminSession.id,
        connection
      );

    if (
      !admin
    ) {
      throw new ApiError(
        404,
        "Subadmin account not found."
      );
    }

    if (
      !admin.email
    ) {
      throw new ApiError(
        422,
        "No registered email is available for this Subadmin."
      );
    }

    const otp =
      generateAdminOtp();

    const otpExpires =
      createOtpExpiry();

    await updateAdminOtp(
      admin.id,
      otp,
      otpExpires,
      connection
    );

    const emailResult =
      await sendUserAccessOtpEmail(
        admin,
        otp,
        memberId
      );

    const result = {
      user_id:
        memberId,

      otp_expires_at:
        otpExpires
          .toISOString(),

      otp_email_sent:
        emailResult.sent,

      nextAction: {
        type:
          "VERIFY_USER_OTP",

        path:
          "/admin/member-otp",
      },
    };

    if (
      process.env.NODE_ENV !==
      "production"
    ) {
      result.debug_otp =
        otp;
    }

    return result;
  };

/* =========================
   VERIFY SUBADMIN OTP
========================= */

const verifySubadminMemberOtp =
  async (
    adminSession,
    pendingOtp,
    otpData,
    connection =
      null
  ) => {
    const role =
      normalizeAdminRole(
        adminSession
          ?.role
      );

    if (
      role !==
      "subadmin"
    ) {
      throw new ApiError(
        400,
        "Member access OTP verification is applicable only to Subadmin accounts."
      );
    }

    if (
      !pendingOtp ||
      Number(
        pendingOtp.admin_id
      ) !==
        Number(
          adminSession.id
        ) ||
      Number(
        pendingOtp.user_id
      ) !==
        Number(
          otpData.user_id
        )
    ) {
      throw new ApiError(
        401,
        "Member OTP request is missing or expired. Request a new OTP."
      );
    }

    const admin =
      await findAdminById(
        adminSession.id,
        connection
      );

    if (
      !admin ||
      !admin.otp
    ) {
      throw new ApiError(
        404,
        "No OTP found. Request a new OTP."
      );
    }

    const expiresAt =
      admin.otp_expires
        ? new Date(
            admin.otp_expires
          )
        : null;

    if (
      !expiresAt ||
      Number.isNaN(
        expiresAt.getTime()
      ) ||
      new Date() >
        expiresAt
    ) {
      await clearAdminOtp(
        admin.id,
        connection
      );

      throw new ApiError(
        401,
        "OTP expired. Request a new OTP."
      );
    }

    if (
      !secureCompare(
        String(
          admin.otp
        ),
        String(
          otpData.otp
        )
      )
    ) {
      throw new ApiError(
        401,
        "Invalid OTP."
      );
    }

    const member =
      await findAdminMemberById(
        otpData.user_id,
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

    await clearAdminOtp(
      admin.id,
      connection
    );

    return {
      verified:
        true,

      user_id:
        otpData.user_id,

      member: {
        id:
          member.id,

        login_id:
          member.login_id,

        full_name:
          [
            member.first_name,
            member.last_name,
          ]
            .filter(Boolean)
            .join(" ")
            .trim(),
      },
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  PAYMENT_FIELDS,
  normalizeAdminRole,
  hidePaymentFields,
  applyMemberVisibility,
  getAdminMembers,
  getAdminDashboard,
  getAdminMemberDetails,
  sendUserAccessOtpEmail,
  requestSubadminMemberOtp,
  verifySubadminMemberOtp,
};