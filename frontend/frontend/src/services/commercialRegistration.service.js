import api from "../api/api";

/* =========================================================
   NORMALIZERS
========================================================= */

const normalizePhone = (value) => {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(-10);
};

const normalizeText = (value) => {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeReferral = (value) => {
  return String(value ?? "")
    .replace(/\s/g, "")
    .trim()
    .toUpperCase();
};

/* =========================================================
   API ERROR NORMALIZER
========================================================= */

const normalizeError = (
  error,
  fallbackMessage
) => {
  const body =
    error?.response?.data || {};

  error.apiMessage =
    body?.message ||
    body?.data?.message ||
    error?.message ||
    fallbackMessage;

  const errors =
    body?.errors ||
    body?.fieldErrors ||
    body?.data?.errors ||
    body?.data?.fieldErrors;

  if (Array.isArray(errors)) {
    error.fieldErrors = {};

    errors.forEach((item) => {
      const field =
        item?.field ||
        item?.param ||
        item?.path;

      const message =
        item?.message ||
        item?.msg ||
        item?.error;

      if (
        field &&
        message
      ) {
        error.fieldErrors[field] =
          message;
      }
    });
  } else if (
    errors &&
    typeof errors === "object"
  ) {
    error.fieldErrors =
      errors;
  }

  return error;
};

/* =========================================================
   MOBILE VALIDATION
========================================================= */

export const validateCommercialMobile = (
  value
) => {
  const phone =
    normalizePhone(value);

  if (
    !/^[6-9]\d{9}$/.test(
      phone
    )
  ) {
    return {
      valid: false,

      value: phone,

      error:
        "Enter a valid 10-digit Indian mobile number.",
    };
  }

  return {
    valid: true,

    value: phone,

    error: "",
  };
};

/* =========================================================
   REQUEST COMMERCIAL REGISTRATION OTP

   POST:
   /api/commercial-register/request-otp

   IMPORTANT:
   Backend field = phone
========================================================= */

export const requestCommercialRegistrationOtp =
  async (
    phoneValue
  ) => {
    const validation =
      validateCommercialMobile(
        phoneValue
      );

    if (
      !validation.valid
    ) {
      const error =
        new Error(
          validation.error
        );

      error.apiMessage =
        validation.error;

      error.fieldErrors = {
        phone:
          validation.error,
      };

      throw error;
    }

    try {
      const response =
        await api.post(
          "/commercial-register/request-otp",
          {
            phone:
              validation.value,
          },
          {
            skipSessionExpiredHandling:
              true,
          }
        );

      const body =
        response?.data || {};

      const data =
        body?.data || body;

      return {
        message:
          body?.message ||
          data?.message ||
          "OTP sent successfully.",

        developmentOtp:
          data?.developmentOtp ||
          data?.development_otp ||
          data?.debugOtp ||
          data?.debug_otp ||
          "",

        phone:
          data?.phone ||
          validation.value,
      };
    } catch (error) {
      throw normalizeError(
        error,
        "Unable to send OTP."
      );
    }
  };

/* =========================================================
   VERIFY COMMERCIAL REGISTRATION OTP

   POST:
   /api/commercial-register/verify-otp
========================================================= */

export const verifyCommercialRegistrationOtp =
  async ({
    phone,
    otp,
  }) => {
    const validation =
      validateCommercialMobile(
        phone
      );

    if (
      !validation.valid
    ) {
      const error =
        new Error(
          validation.error
        );

      error.apiMessage =
        validation.error;

      error.fieldErrors = {
        phone:
          validation.error,
      };

      throw error;
    }

    const normalizedOtp =
      String(otp ?? "")
        .replace(/\D/g, "")
        .slice(0, 6);

    if (
      !/^\d{6}$/.test(
        normalizedOtp
      )
    ) {
      const message =
        "Enter a valid 6-digit OTP.";

      const error =
        new Error(message);

      error.apiMessage =
        message;

      error.fieldErrors = {
        otp: message,
      };

      throw error;
    }

    try {
      const response =
        await api.post(
          "/commercial-register/verify-otp",
          {
            phone:
              validation.value,

            otp:
              normalizedOtp,
          },
          {
            skipSessionExpiredHandling:
              true,
          }
        );

      const body =
        response?.data || {};

      const data =
        body?.data || body;

      const verified =
        data?.verified === true ||
        data?.otpVerified === true ||
        data?.otp_verified === true ||
        body?.verified === true;

      return {
        verified,

        phone:
          data?.phone ||
          validation.value,

        message:
          body?.message ||
          data?.message ||
          "Mobile number verified successfully.",
      };
    } catch (error) {
      throw normalizeError(
        error,
        "Unable to verify OTP."
      );
    }
  };

/* =========================================================
   REGISTER COMMERCIAL MEMBER

   POST:
   /api/commercial-register
========================================================= */

export const registerCommercialMember =
  async (
    values = {}
  ) => {
    const phoneValidation =
      validateCommercialMobile(
        values.phone
      );

    if (
      !phoneValidation.valid
    ) {
      const error =
        new Error(
          phoneValidation.error
        );

      error.apiMessage =
        phoneValidation.error;

      error.fieldErrors = {
        phone:
          phoneValidation.error,
      };

      throw error;
    }

    const payload = {
      business_name:
        normalizeText(
          values.business_name
        ),

      owner_full_name:
        normalizeText(
          values.owner_full_name
        ),

      phone:
        phoneValidation.value,

      email:
        normalizeText(
          values.email
        ).toLowerCase(),

      business_category:
        normalizeText(
          values.business_category
        ),

      city:
        normalizeText(
          values.city
        ),

      business_address:
        normalizeText(
          values.business_address
        ),

      password:
        String(
          values.password ?? ""
        ),

      membership_type:
        "Commercial Member",
    };

    const referral =
      normalizeReferral(
        values.referral
      );

    if (referral) {
      payload.referral =
        referral;
    }

    try {
      const response =
        await api.post(
          "/commercial-register",
          payload,
          {
            skipSessionExpiredHandling:
              true,
          }
        );

      const body =
        response?.data || {};

      const data =
        body?.data || body;

      const member =
        data?.member ||
        body?.member ||
        null;

      const loginId =
        data?.loginId ||
        data?.login_id ||
        member?.login_id ||
        member?.loginId ||
        "";

      return {
        message:
          body?.message ||
          data?.message ||
          "Commercial registration completed successfully.",

        loginId,

        member,

        nextRoute:
          data?.nextAction?.path ||
          data?.nextRoute ||
          "/login/commercial",
      };
    } catch (error) {
      throw normalizeError(
        error,
        "Unable to complete Commercial registration."
      );
    }
  };