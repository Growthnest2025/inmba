const ApiError =
  require(
    "../utils/apiError"
  );

/* =========================
   CLEAN TEXT
========================= */

const cleanText =
  (
    value
  ) => {
    const firstValue =
      Array.isArray(
        value
      )
        ? value[0]
        : value;

    if (
      firstValue === null ||
      firstValue ===
        undefined
    ) {
      return "";
    }

    return String(
      firstValue
    ).trim();
  };

/* =========================
   MEMBER ID
========================= */

const normalizeMemberId =
  (
    value
  ) => {
    const memberId =
      Number(
        value
      );

    if (
      !Number.isInteger(
        memberId
      ) ||
      memberId <= 0
    ) {
      return null;
    }

    return memberId;
  };

/* =========================
   QUERY VALIDATION
========================= */

const validateAdminMemberQuery =
  (
    request,
    response,
    next
  ) => {
    try {
      const allowedStatuses =
        new Set([
          "all",
          "approved",
          "pending",
          "rejected",
          "unpaid",
        ]);

      const requestedStatus =
        cleanText(
          request.query
            .status ||
            "all"
        ).toLowerCase();

      const status =
        allowedStatuses.has(
          requestedStatus
        )
          ? requestedStatus
          : "all";

      const search =
        cleanText(
          request.query
            .search
        ).slice(
          0,
          150
        );

      const requestedPage =
        Number(
          request.query
            .page
        );

      const requestedLimit =
        Number(
          request.query
            .limit
        );

      const page =
        Number.isInteger(
          requestedPage
        ) &&
        requestedPage >
          0
          ? requestedPage
          : 1;

      const limit =
        Number.isInteger(
          requestedLimit
        ) &&
        requestedLimit >
          0
          ? Math.min(
              requestedLimit,
              100
            )
          : 25;

      request
        .validatedAdminMemberQuery =
        {
          status,
          search,
          page,
          limit,
        };

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   ROUTE MEMBER ID
========================= */

const validateAdminMemberId =
  (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        normalizeMemberId(
          request.params
            .id ||
          request.params
            .userId
        );

      if (
        !memberId
      ) {
        throw new ApiError(
          400,
          "Valid member ID is required."
        );
      }

      request
        .validatedAdminMemberId =
        memberId;

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   USER OTP BODY
========================= */

const validateAdminUserOtp =
  (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        normalizeMemberId(
          request.body
            ?.user_id ||
          request.body
            ?.userId
        );

      const otp =
        cleanText(
          request.body
            ?.otp
        ).replace(
          /\D/g,
          ""
        );

      if (
        !memberId
      ) {
        throw new ApiError(
          422,
          "Valid user_id is required."
        );
      }

      if (
        !/^[0-9]{6}$/.test(
          otp
        )
      ) {
        throw new ApiError(
          422,
          "OTP must contain exactly 6 digits."
        );
      }

      request
        .validatedAdminUserOtp =
        {
          user_id:
            memberId,

          otp,
        };

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  cleanText,
  normalizeMemberId,
  validateAdminMemberQuery,
  validateAdminMemberId,
  validateAdminUserOtp,
};