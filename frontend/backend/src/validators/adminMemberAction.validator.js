const ApiError =
  require(
    "../utils/apiError"
  );

const {
  ADMIN_EDITABLE_FIELDS,
} = require(
  "../repositories/adminMemberAction.repository"
);

/* =========================
   CLEAN VALUE
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

const validateActionMemberId =
  (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        Number(
          request.params.id ||
          request.params
            .userId
        );

      if (
        !Number.isInteger(
          memberId
        ) ||
        memberId <= 0
      ) {
        throw new ApiError(
          400,
          "Valid member ID is required."
        );
      }

      request
        .validatedActionMemberId =
        memberId;

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   STATUS VALIDATION
========================= */

const validateMemberStatus =
  (
    request,
    response,
    next
  ) => {
    try {
      const status =
        cleanText(
          request.body
            ?.status
        ).toLowerCase();

      const referralId =
        cleanText(
          request.body
            ?.referral_id
        ).toUpperCase();

      const sendMethod =
        cleanText(
          request.body
            ?.send_method ||
            "email"
        ).toLowerCase();

      if (
        ![
          "approved",
          "pending",
          "rejected",
        ].includes(
          status
        )
      ) {
        throw new ApiError(
          422,
          "Status must be approved, pending or rejected."
        );
      }

      if (
        referralId &&
        !/^[A-Z0-9]{4,30}$/.test(
          referralId
        )
      ) {
        throw new ApiError(
          422,
          "Referral ID contains invalid characters."
        );
      }

      if (
        ![
          "email",
          "otp",
          "none",
        ].includes(
          sendMethod
        )
      ) {
        throw new ApiError(
          422,
          "send_method must be email, otp or none."
        );
      }

      request
        .validatedMemberStatus =
        {
          status,

          referral_id:
            referralId ||
            null,

          send_method:
            sendMethod,
        };

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   EDIT VALUE
========================= */

const normalizeEditValue =
  (
    fieldName,
    value
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    if (
      fieldName ===
      "amount"
    ) {
      const amount =
        Number(
          value
        );

      if (
        !Number.isFinite(
          amount
        ) ||
        amount < 0
      ) {
        throw new ApiError(
          422,
          "Amount must be a valid non-negative number."
        );
      }

      return amount;
    }

    const normalized =
      typeof value ===
      "string"
        ? value.trim()
        : value;

    return normalized ===
      ""
      ? null
      : normalized;
  };

/* =========================
   EDIT VALIDATION
========================= */

const validateAdminMemberEdit =
  (
    request,
    response,
    next
  ) => {
    try {
      const payload = {
        ...(
          request.body ||
          {}
        ),
      };

      if (
        Object.prototype
          .hasOwnProperty
          .call(
            payload,
            "social_links"
          ) &&
        !Object.prototype
          .hasOwnProperty
          .call(
            payload,
            "social_link"
          )
      ) {
        payload.social_link =
          payload.social_links;
      }

      delete payload
        .social_links;

      const updateData =
        {};

      for (
        const [
          fieldName,
          value,
        ] of Object.entries(
          payload
        )
      ) {
        if (
          !ADMIN_EDITABLE_FIELDS
            .has(
              fieldName
            )
        ) {
          continue;
        }

        updateData[
          fieldName
        ] =
          normalizeEditValue(
            fieldName,
            value
          );
      }

      if (
        Object.keys(
          updateData
        ).length === 0
      ) {
        throw new ApiError(
          422,
          "No valid member fields were provided."
        );
      }

      if (
        updateData
          .payment_status &&
        ![
          "approved",
          "pending",
          "rejected",
        ].includes(
          String(
            updateData
              .payment_status
          ).toLowerCase()
        )
      ) {
        throw new ApiError(
          422,
          "payment_status must be approved, pending or rejected."
        );
      }

      if (
        updateData.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          updateData.email
        )
      ) {
        throw new ApiError(
          422,
          "Valid email address is required."
        );
      }

      if (
        updateData.phone
      ) {
        const phone =
          String(
            updateData.phone
          ).replace(
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
            "Phone number must contain 10 to 15 digits."
          );
        }

        updateData.phone =
          phone;
      }

      request
        .validatedAdminMemberEdit =
        updateData;

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   DELETED LIST QUERY
========================= */

const validateDeletedMemberQuery =
  (
    request,
    response,
    next
  ) => {
    try {
      const requestedPage =
        Number(
          request.query
            ?.page
        );

      const requestedLimit =
        Number(
          request.query
            ?.limit
        );

      request
        .validatedDeletedMemberQuery =
        {
          page:
            Number.isInteger(
              requestedPage
            ) &&
            requestedPage >
              0
              ? requestedPage
              : 1,

          limit:
            Number.isInteger(
              requestedLimit
            ) &&
            requestedLimit >
              0
              ? Math.min(
                  requestedLimit,
                  100
                )
              : 25,
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
  validateActionMemberId,
  validateMemberStatus,
  normalizeEditValue,
  validateAdminMemberEdit,
  validateDeletedMemberQuery,
};