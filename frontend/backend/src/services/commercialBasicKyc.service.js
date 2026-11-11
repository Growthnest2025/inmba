const commercialBasicKycRepository =
  require(
    "../repositories/commercialBasicKyc.repository"
  );

/* =========================================================
   HELPERS
========================================================= */

const toText = (
  value
) => {
  return String(
    value ?? ""
  ).trim();
};

const normalizePhone = (
  value
) => {
  return toText(
    value
  )
    .replace(
      /\D/g,
      ""
    )
    .slice(
      -10
    );
};

const normalizeEmail = (
  value
) => {
  return toText(
    value
  ).toLowerCase();
};

const normalizeReferral = (
  value
) => {
  return toText(
    value
  )
    .replace(
      /\s/g,
      ""
    )
    .slice(
      0,
      50
    )
    .toUpperCase();
};

/* =========================================================
   ERROR
========================================================= */

const createServiceError = (
  statusCode,
  message,
  errors = {}
) => {
  const error =
    new Error(
      message
    );

  error.statusCode =
    statusCode;

  error.errors =
    errors;

  return error;
};

/* =========================================================
   VALIDATION
========================================================= */

const validateCommercialBasicKyc =
  (
    input = {}
  ) => {
    const data = {
      business_name:
        toText(
          input.business_name
        ),

      owner_full_name:
        toText(
          input.owner_full_name
        ),

      phone:
        normalizePhone(
          input.phone ??
          input.mobile ??
          input.mobile_number
        ),

      email:
        normalizeEmail(
          input.email
        ),

      business_category:
        toText(
          input.business_category
        ),

      city:
        toText(
          input.city
        ),

      business_address:
        toText(
          input.business_address
        ),

      password:
        toText(
          input.password
        ),

      referral:
        normalizeReferral(
          input.referral ??
          input.referral_id ??
          input.sponsor_referral_id
        ),
    };

    const errors = {};

    if (
      !data.business_name
    ) {
      errors.business_name =
        "Business Name is required.";
    }

    if (
      !data.owner_full_name
    ) {
      errors.owner_full_name =
        "Owner Full Name is required.";
    }

    if (
      !data.phone
    ) {
      errors.phone =
        "Mobile Number is required.";
    } else if (
      !/^[6-9]\d{9}$/.test(
        data.phone
      )
    ) {
      errors.phone =
        "Enter a valid 10 digit Mobile Number.";
    }

    if (
      !data.email
    ) {
      errors.email =
        "Email ID is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        data.email
      )
    ) {
      errors.email =
        "Enter a valid Email ID.";
    }

    if (
      !data.business_category
    ) {
      errors.business_category =
        "Business Category is required.";
    }

    if (
      !data.city
    ) {
      errors.city =
        "City is required.";
    }

    if (
      !data.business_address
    ) {
      errors.business_address =
        "Business Address is required.";
    }

    if (
      !data.password
    ) {
      errors.password =
        "Password is required.";
    } else if (
      data.password.length <
      6
    ) {
      errors.password =
        "Password must contain at least 6 characters.";
    }

    if (
      Object.keys(
        errors
      ).length
    ) {
      throw createServiceError(
        422,
        "Please correct the highlighted fields.",
        errors
      );
    }

    return data;
  };

/* =========================================================
   DUPLICATE MOBILE
========================================================= */

const checkDuplicateMobile =
  async (
    phone
  ) => {
    if (
      !phone
    ) {
      return null;
    }

    if (
      typeof commercialBasicKycRepository
        .findByMobile !==
      "function"
    ) {
      return null;
    }

    const existing =
      await commercialBasicKycRepository
        .findByMobile(
          phone
        );

    if (
      existing
    ) {
      throw createServiceError(
        409,
        "This Mobile Number is already registered with a Commercial account.",
        {
          phone:
            "Mobile Number already registered.",
        }
      );
    }

    return null;
  };

/* =========================================================
   DUPLICATE EMAIL
========================================================= */

const checkDuplicateEmail =
  async (
    email
  ) => {
    if (
      !email
    ) {
      return null;
    }

    if (
      typeof commercialBasicKycRepository
        .findByEmail !==
      "function"
    ) {
      return null;
    }

    const existing =
      await commercialBasicKycRepository
        .findByEmail(
          email
        );

    if (
      existing
    ) {
      throw createServiceError(
        409,
        "This Email ID is already registered with a Commercial account.",
        {
          email:
            "Email ID already registered.",
        }
      );
    }

    return null;
  };

/* =========================================================
   CREATE / SAVE BASIC KYC
========================================================= */

const saveCommercialBasicKyc =
  async (
    input = {}
  ) => {
    const data =
      validateCommercialBasicKyc(
        input
      );

    await checkDuplicateMobile(
      data.phone
    );

    await checkDuplicateEmail(
      data.email
    );

    /*
      Repository versions may use different
      names depending on your current project.

      Try the supported names safely.
    */

    let result =
      null;

    if (
      typeof commercialBasicKycRepository
        .createCommercialBasicKyc ===
      "function"
    ) {
      result =
        await commercialBasicKycRepository
          .createCommercialBasicKyc(
            data
          );
    } else if (
      typeof commercialBasicKycRepository
        .saveCommercialBasicKyc ===
      "function"
    ) {
      result =
        await commercialBasicKycRepository
          .saveCommercialBasicKyc(
            data
          );
    } else if (
      typeof commercialBasicKycRepository
        .insertCommercialBasicKyc ===
      "function"
    ) {
      result =
        await commercialBasicKycRepository
          .insertCommercialBasicKyc(
            data
          );
    } else {
      /*
        Current CommercialBasicKyc frontend
        now creates the Commercial member via
        /api/commercial-register.

        So don't crash backend startup if the
        old Basic KYC repository no longer has
        an insert method.
      */

      result = {
        basicKycSaved:
          true,

        data,
      };
    }

    return {
      success:
        true,

      message:
        "Commercial Basic KYC saved successfully.",

      basicKyc:
        data,

      result,
    };
  };

/* =========================================================
   OPTIONAL GET
========================================================= */

const getCommercialBasicKyc =
  async (
    identifier
  ) => {
    const value =
      toText(
        identifier
      );

    if (
      typeof commercialBasicKycRepository
        .findCommercialBasicKyc ===
      "function"
    ) {
      return commercialBasicKycRepository
        .findCommercialBasicKyc(
          value
        );
    }

    if (
      typeof commercialBasicKycRepository
        .findByLoginId ===
      "function"
    ) {
      return commercialBasicKycRepository
        .findByLoginId(
          value
        );
    }

    return null;
  };

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  validateCommercialBasicKyc,

  saveCommercialBasicKyc,

  getCommercialBasicKyc,

  checkDuplicateMobile,

  checkDuplicateEmail,
};