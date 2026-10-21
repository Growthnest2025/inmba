import axios from "axios";
import { toText, asObject } from "../utils/commonHelpers";

/* =========================================================
   KYC ROOT API

   KYC routes are ROOT routes.

   /bank_form/:token
   /bank_submit/:token

   /legal_entity/:token
   /legal_entity_submit/:token

   /pan/:token
   /pan_submit/:token

   /profile_picture/:token

   /acknowledgement/:token

   /save_signature/:token
========================================================= */

const kycApi =
  axios.create({
    baseURL: "/",

    withCredentials:
      true,

    timeout:
      45000,

    headers: {
      Accept:
        "application/json",
    },
  });

/* =========================================================
   REQUEST INTERCEPTOR
========================================================= */

kycApi.interceptors.request.use(
  (
    config
  ) => {
    config.withCredentials =
      true;

    const isFormData =
      typeof FormData !==
        "undefined" &&
      config.data instanceof
        FormData;

    /*
      Browser automatically adds
      multipart boundary.
    */

    if (
      isFormData &&
      config.headers
    ) {
      delete config.headers[
        "Content-Type"
      ];
    }

    return config;
  },

  (
    error
  ) => {
    return Promise.reject(
      error
    );
  }
);

/* =========================================================
   RESPONSE INTERCEPTOR
========================================================= */

kycApi.interceptors.response.use(
  (
    response
  ) => {
    return response;
  },

  (
    error
  ) => {
    const statusCode =
      Number(
        error?.response
          ?.status ||
          0
      );

    const responseData =
      error?.response
        ?.data;

    error.statusCode =
      statusCode;

    if (
      responseData &&
      typeof responseData ===
        "object"
    ) {
      error.apiMessage =
        responseData.message ||
        responseData.error ||
        error?.message ||
        "KYC request failed.";

      error.validationErrors =
        responseData.errors ||
        responseData.validationErrors ||
        responseData.fieldErrors ||
        null;
    } else {
      error.apiMessage =
        error?.message ||
        "KYC request failed.";

      error.validationErrors =
        null;
    }

    error.sessionExpired =
      statusCode ===
      401;

    error.unauthorized =
      statusCode ===
      401;

    error.forbidden =
      statusCode ===
      403;

    error.isForbidden =
      statusCode ===
      403;

    error.notFound =
      statusCode ===
      404;

    error.isNotFound =
      statusCode ===
      404;

    error.validationError =
      statusCode ===
        400 ||
      statusCode ===
        422;

    error.isValidationError =
      error.validationError;

    error.isNetworkError =
      !error?.response;

    return Promise.reject(
      error
    );
  }
);

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   TEXT
========================================================= */

/* =========================================================
   TOKEN
========================================================= */

const normalizeToken = (
  token
) => {
  const normalizedToken =
    toText(
      token
    );

  if (
    !normalizedToken
  ) {
    const error =
      new Error(
        "KYC token is required."
      );

    error.statusCode =
      400;

    throw error;
  }

  return normalizedToken;
};

/* =========================================================
   RESPONSE BODY
========================================================= */

const getResponseBody = (
  response
) => {
  const responseBody =
    response?.data;

  /*
    React KYC expects JSON from Node backend.
  */

  if (
    typeof responseBody ===
      "string"
  ) {
    const error =
      new Error(
        "KYC API returned an invalid HTML response."
      );

    error.statusCode =
      500;

    throw error;
  }

  return asObject(
    responseBody
  );
};

/* =========================================================
   RESPONSE DATA
========================================================= */

const getResponseData = (
  response
) => {
  const responseBody =
    getResponseBody(
      response
    );

  return asObject(
    responseBody.data ||
      responseBody
  );
};

/* =========================================================
   NORMALIZE RESPONSE
========================================================= */

const normalizeKycResponse = (
  response
) => {
  const responseBody =
    getResponseBody(
      response
    );

  const responseData =
    getResponseData(
      response
    );

  /* =======================================================
     MEMBER
  ======================================================= */

  const member =
    asObject(
      responseData.member ||
        responseData.user ||
        responseData.profile ||
        responseData.kyc_member ||
        responseData.kycMember ||
        responseBody.member ||
        responseBody.user
    );

  /* =======================================================
     EXISTING FORM DATA
  ======================================================= */

  const explicitDetails =
    asObject(
      responseData.details ||
        responseData.formData ||
        responseData.form_data ||
        responseData.kyc ||
        responseData.bank ||
        responseData.legalEntity ||
        responseData.legal_entity ||
        responseData.pan ||
        responseData.profileDetails ||
        responseData.profile_details ||
        responseBody.details ||
        responseBody.bank ||
        responseBody.legalEntity ||
        responseBody.legal_entity ||
        responseBody.pan
    );

  const existingData =
    Object.keys(
      explicitDetails
    ).length >
    0
      ? explicitDetails
      : member;

  /* =======================================================
     TOKEN
  ======================================================= */

  const token =
    toText(
      responseData.token ||
        responseData.user_token ||
        responseData.userToken ||
        responseBody.token ||
        responseBody.user_token
    );

  /* =======================================================
     NEXT ROUTE
  ======================================================= */

  const nextRoute =
    toText(
      responseData.next_route ||
        responseData.nextRoute ||
        responseData.next_path ||
        responseData.nextPath ||
        responseData.redirect_url ||
        responseData.redirectUrl ||
        responseData.redirectTo ||
        responseData
          ?.nextAction
          ?.path ||
        responseBody.next_route ||
        responseBody.nextRoute ||
        responseBody.next_path ||
        responseBody.nextPath ||
        responseBody.redirect_url ||
        responseBody.redirectUrl ||
        responseBody.redirectTo ||
        responseBody
          ?.nextAction
          ?.path
    );

  /* =======================================================
     SUCCESS
  ======================================================= */

  const success =
    responseBody.success !==
      false &&
    responseData.success !==
      false;

  return {
    success,

    response:
      responseBody,

    data:
      responseData,

    member,

    existingData,

    /*
      Compatibility aliases.
    */

    bank:
      existingData,

    legalEntity:
      existingData,

    legal_entity:
      existingData,

    pan:
      existingData,

    profile:
      existingData,

    acknowledgement:
      existingData,

    token,

    nextRoute,

    nextPath:
      nextRoute,

    redirectTo:
      nextRoute,

    message:
      toText(
        responseBody.message ||
          responseData.message
      ),
  };
};

/* =========================================================
   FORM DATA HELPERS
========================================================= */

const appendText = (
  formData,
  key,
  value,
  {
    allowEmpty = false,
  } = {}
) => {
  const normalizedValue =
    toText(
      value
    );

  if (
    normalizedValue ||
    allowEmpty
  ) {
    formData.append(
      key,
      normalizedValue
    );
  }
};

/* =========================================================
   FILE
========================================================= */

const appendFile = (
  formData,
  key,
  file
) => {
  if (
    typeof File !==
      "undefined" &&
    file instanceof
      File
  ) {
    formData.append(
      key,
      file
    );
  }
};

/* =========================================================
   ROUTE PATH HELPERS
========================================================= */

export const getBankFormPath =
  (
    token
  ) => {
    const safeToken =
      toText(
        token
      );

    if (!safeToken) {
      return "";
    }

    return `/bank_form/${encodeURIComponent(
      safeToken
    )}`;
  };

/* =========================================================
   LEGAL ENTITY PATH
========================================================= */

export const getLegalEntityPath =
  (
    token
  ) => {
    const safeToken =
      toText(
        token
      );

    if (!safeToken) {
      return "";
    }

    return `/legal_entity/${encodeURIComponent(
      safeToken
    )}`;
  };

/* =========================================================
   PAN PATH
========================================================= */

export const getPanPath =
  (
    token
  ) => {
    const safeToken =
      toText(
        token
      );

    if (!safeToken) {
      return "";
    }

    return `/pan/${encodeURIComponent(
      safeToken
    )}`;
  };

/* =========================================================
   PROFILE PICTURE PATH
========================================================= */

export const getProfilePicturePath =
  (
    token
  ) => {
    const safeToken =
      toText(
        token
      );

    if (!safeToken) {
      return "";
    }

    return `/profile_picture/${encodeURIComponent(
      safeToken
    )}`;
  };

/* =========================================================
   ACKNOWLEDGEMENT PATH
========================================================= */

export const getAcknowledgementPath =
  (
    token
  ) => {
    const safeToken =
      toText(
        token
      );

    if (!safeToken) {
      return "";
    }

    return `/acknowledgement/${encodeURIComponent(
      safeToken
    )}`;
  };

/* =========================================================
   IMAGE VALIDATION
========================================================= */

export const validateKycImage = (
  file,
  {
    required = false,
    maxSizeMb = 5,
  } = {}
) => {
  if (!file) {
    if (
      required
    ) {
      return {
        valid:
          false,

        error:
          "Image file is required.",
      };
    }

    return {
      valid:
        true,

      error:
        "",
    };
  }

  if (
    typeof File ===
      "undefined" ||
    !(file instanceof File)
  ) {
    return {
      valid:
        false,

      error:
        "Invalid image file.",
    };
  }

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  if (
    !allowedTypes.includes(
      file.type
    )
  ) {
    return {
      valid:
        false,

      error:
        "Only JPG and PNG images are allowed.",
    };
  }

  const maximumSize =
    Number(
      maxSizeMb
    ) *
    1024 *
    1024;

  if (
    maximumSize >
      0 &&
    file.size >
      maximumSize
  ) {
    return {
      valid:
        false,

      error:
        `Image size must be below ${maxSizeMb} MB.`,
    };
  }

  return {
    valid:
      true,

    error:
      "",
  };
};

/* =========================================================
   AADHAAR VALIDATION
========================================================= */

export const validateAadhaarNumber = (
  value
) => {
  const aadhaarNumber =
    toText(
      value
    ).replace(
      /\s+/g,
      ""
    );

  if (
    !aadhaarNumber
  ) {
    return {
      valid:
        false,

      error:
        "Aadhaar number is required.",
    };
  }

  if (
    !/^\d{12}$/.test(
      aadhaarNumber
    )
  ) {
    return {
      valid:
        false,

      error:
        "Enter a valid 12-digit Aadhaar number.",
    };
  }

  return {
    valid:
      true,

    error:
      "",

    value:
      aadhaarNumber,
  };
};

/* =========================================================
   PINCODE VALIDATION
========================================================= */

export const validatePincode = (
  value
) => {
  const pincode =
    toText(
      value
    ).replace(
      /\s+/g,
      ""
    );

  if (
    !pincode
  ) {
    return {
      valid:
        false,

      error:
        "Pincode is required.",
    };
  }

  if (
    !/^\d{6}$/.test(
      pincode
    )
  ) {
    return {
      valid:
        false,

      error:
        "Enter a valid 6-digit pincode.",
    };
  }

  return {
    valid:
      true,

    error:
      "",

    value:
      pincode,
  };
};

/* =========================================================
   PAN VALIDATION

   PAN optional.
========================================================= */

export const validatePanNumber = (
  value
) => {
  const panNumber =
    toText(
      value
    ).toUpperCase();

  if (
    !panNumber
  ) {
    return {
      valid:
        true,

      error:
        "",

      value:
        "",
    };
  }

  if (
    !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
      panNumber
    )
  ) {
    return {
      valid:
        false,

      error:
        "Enter a valid PAN number. Example: ABCDE1234F",
    };
  }

  return {
    valid:
      true,

    error:
      "",

    value:
      panNumber,
  };
};

/* =========================================================
   PHONE VALIDATION
========================================================= */

export const validatePhoneNumber = (
  value,
  {
    required = true,
  } = {}
) => {
  const phoneNumber =
    toText(
      value
    ).replace(
      /\D/g,
      ""
    );

  if (
    !phoneNumber
  ) {
    return {
      valid:
        !required,

      error:
        required
          ? "Phone number is required."
          : "",

      value:
        "",
    };
  }

  if (
    !/^[6-9]\d{9}$/.test(
      phoneNumber
    )
  ) {
    return {
      valid:
        false,

      error:
        "Enter a valid 10-digit mobile number.",

      value:
        phoneNumber,
    };
  }

  return {
    valid:
      true,

    error:
      "",

    value:
      phoneNumber,
  };
};

/* =========================================================
   BANK FORM DATA

   Exact fields:

   account_holder
   bank_name
   branch_name
   account_number1
   account_number2
   ifsc
   bank_proof
========================================================= */

export const createBankFormData = (
  bankData = {}
) => {
  if (
    bankData instanceof
      FormData
  ) {
    return bankData;
  }

  const source =
    asObject(
      bankData
    );

  const formData =
    new FormData();

  appendText(
    formData,
    "account_holder",
    source.account_holder ??
      source.accountHolder
  );

  appendText(
    formData,
    "bank_name",
    source.bank_name ??
      source.bankName
  );

  appendText(
    formData,
    "branch_name",
    source.branch_name ??
      source.branchName ??
      source.branch
  );

  appendText(
    formData,
    "account_number1",
    source.account_number1 ??
      source.accountNumber1 ??
      source.accountNumber ??
      source.account_number,
    {
      allowEmpty:
        true,
    }
  );

  appendText(
    formData,
    "account_number2",
    source.account_number2 ??
      source.accountNumber2 ??
      source.confirmAccountNumber ??
      source.confirm_account_number ??
      source.accountNumber ??
      source.account_number,
    {
      allowEmpty:
        true,
    }
  );

  appendText(
    formData,
    "ifsc",
    toText(
      source.ifsc ??
        source.ifsc_code ??
        source.ifscCode
    ).toUpperCase(),
    {
      allowEmpty:
        true,
    }
  );

  appendFile(
    formData,
    "bank_proof",
    source.bank_proof ??
      source.bankProof
  );

  return formData;
};

/* =========================================================
   LEGAL ENTITY FORM DATA
========================================================= */

export const createLegalEntityFormData =
  (
    legalEntityData = {}
  ) => {
    if (
      legalEntityData instanceof
        FormData
    ) {
      return legalEntityData;
    }

    const source =
      asObject(
        legalEntityData
      );

    const formData =
      new FormData();

    appendText(
      formData,
      "entity_aadhar_number",
      source.entity_aadhar_number ??
        source.aadhaarNumber ??
        source.aadharNumber
    );

    appendText(
      formData,
      "entity_house_no",
      source.entity_house_no ??
        source.houseNumber ??
        source.houseNo
    );

    appendText(
      formData,
      "entity_street",
      source.entity_street ??
        source.street
    );

    appendText(
      formData,
      "entity_area",
      source.entity_area ??
        source.area
    );

    appendText(
      formData,
      "entity_city",
      source.entity_city ??
        source.city
    );

    appendText(
      formData,
      "entity_district",
      source.entity_district ??
        source.district
    );

    appendText(
      formData,
      "entity_state",
      source.entity_state ??
        source.state
    );

    appendText(
      formData,
      "entity_pincode",
      source.entity_pincode ??
        source.pincode
    );

    appendFile(
      formData,
      "entity_aadhar_front",
      source.entity_aadhar_front ??
        source.aadhaarFront ??
        source.aadharFront
    );

    appendFile(
      formData,
      "entity_aadhar_back",
      source.entity_aadhar_back ??
        source.aadhaarBack ??
        source.aadharBack
    );

    appendFile(
      formData,
      "entity_aadhar_selfie",
      source.entity_aadhar_selfie ??
        source.aadhaarSelfie ??
        source.aadharSelfie
    );

    return formData;
  };

/* =========================================================
   PAN FORM DATA
========================================================= */

export const createPanFormData = (
  panData = {}
) => {
  if (
    panData instanceof
      FormData
  ) {
    return panData;
  }

  const source =
    asObject(
      panData
    );

  const formData =
    new FormData();

  const panNumber =
    toText(
      source.pan_number ??
        source.panNumber
    ).toUpperCase();

  appendText(
    formData,
    "pan_number",
    panNumber,
    {
      allowEmpty:
        true,
    }
  );

  appendText(
    formData,
    "pan_name",
    source.pan_name ??
      source.panName,
    {
      allowEmpty:
        true,
    }
  );

  appendFile(
    formData,
    "pan_front",
    source.pan_front ??
      source.panFront
  );

  return formData;
};

/* =========================================================
   PROFILE PICTURE FORM DATA
========================================================= */

export const createProfilePictureFormData =
  (
    profileData = {}
  ) => {
    if (
      profileData instanceof
        FormData
    ) {
      return profileData;
    }

    const source =
      asObject(
        profileData
      );

    const formData =
      new FormData();

    /* PROFILE PHOTO */

    appendFile(
      formData,
      "profile_pic",
      source.profile_pic ??
        source.profilePic ??
        source.profilePhoto
    );

    /* EDUCATION */

    appendText(
      formData,
      "educational_qualification",
      source.educational_qualification ??
        source.educationalQualification
    );

    /* CONTACT */

    appendText(
      formData,
      "contact_number",
      source.contact_number ??
        source.contactNumber
    );

    appendText(
      formData,
      "whatsapp_number",
      source.whatsapp_number ??
        source.whatsappNumber
    );

    /* NOMINEE */

    appendText(
      formData,
      "nomini_name",
      source.nomini_name ??
        source.nomineeName
    );

    appendText(
      formData,
      "nomini_dob",
      source.nomini_dob ??
        source.nomineeDob
    );

    appendText(
      formData,
      "nomini_relationship",
      source.nomini_relationship ??
        source.nomineeRelationship
    );

    appendText(
      formData,
      "nomini_aadhar",
      source.nomini_aadhar ??
        source.nomineeAadhaar ??
        source.nomineeAadhar,
      {
        allowEmpty:
          true,
      }
    );

    /* WITNESS */

    appendText(
      formData,
      "witness_name",
      source.witness_name ??
        source.witnessName
    );

    appendText(
      formData,
      "witness_phone",
      source.witness_phone ??
        source.witnessPhone
    );

    appendText(
      formData,
      "witness_inmba_id",
      source.witness_inmba_id ??
        source.witnessInmbaId,
      {
        allowEmpty:
          true,
      }
    );

    /* DECLARATION */

    const declaration =
      source.declaration ===
        true ||
      source.declaration ===
        "on" ||
      source.declaration ===
        "true" ||
      source.declaration ===
        1;

    if (
      declaration
    ) {
      formData.append(
        "declaration",
        "on"
      );
    }

    /* SOCIAL LINKS */

    const socialLinks =
      source.social_links ??
      source.socialLinks ??
      source[
        "social_link[]"
      ] ??
      source.social_link ??
      [];

    const normalizedSocialLinks =
      Array.isArray(
        socialLinks
      )
        ? socialLinks
        : [
            socialLinks,
          ];

    normalizedSocialLinks
      .map(
        (
          link
        ) =>
          toText(
            link
          )
      )
      .filter(
        Boolean
      )
      .forEach(
        (
          link
        ) => {
          formData.append(
            "social_link[]",
            link
          );
        }
      );

    return formData;
  };

/* =========================================================
   GET BANK DETAILS

   GET /bank_form/:token
========================================================= */

export const getBankDetails =
  async (
    token,
    {
      signal,
    } = {}
  ) => {
    const safeToken =
      normalizeToken(
        token
      );

    const response =
      await kycApi.get(
        `/bank_form/${encodeURIComponent(
          safeToken
        )}`,
        {
          signal,

          headers: {
            "X-Requested-With":
              "XMLHttpRequest",
          },
        }
      );

    const normalized =
      normalizeKycResponse(
        response
      );

    return {
      ...normalized,

      token:
        normalized.token ||
        safeToken,

      bank:
        normalized.existingData,
    };
  };

/* =========================================================
   SUBMIT BANK DETAILS

   POST /bank_submit/:token
========================================================= */

export const submitBankDetails =
  async (
    token,
    bankData
  ) => {
    const safeToken =
      normalizeToken(
        token
      );

    const formData =
      createBankFormData(
        bankData
      );

const response =
  await kycApi.post(
    `/bank_submit/${encodeURIComponent(
      safeToken
    )}`,
    {
      account_holder:
        bankData.account_holder?.trim() || "",

      bank_name:
        bankData.bank_name?.trim() || "",

      account_number:
        bankData.account_number1?.trim() || "",

      ifsc:
        bankData.ifsc?.trim().toUpperCase() || "",
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With":
          "XMLHttpRequest",
      },
    }
  );

    const normalized =
      normalizeKycResponse(
        response
      );

    const nextPath =
      normalized.nextPath ||
      getLegalEntityPath(
        safeToken
      );

    return {
      ...normalized,

      success:
        true,

      token:
        normalized.token ||
        safeToken,

      nextRoute:
        nextPath,

      nextPath,

      redirectTo:
        nextPath,
    };
  };

/* =========================================================
   GET LEGAL ENTITY

   GET /legal_entity/:token
========================================================= */

export const getLegalEntityDetails =
  async (
    token,
    {
      signal,
    } = {}
  ) => {
    const safeToken =
      normalizeToken(
        token
      );

    const response =
      await kycApi.get(
        `/legal_entity/${encodeURIComponent(
          safeToken
        )}`,
        {
          signal,

          headers: {
            "X-Requested-With":
              "XMLHttpRequest",
          },
        }
      );

    const normalized =
      normalizeKycResponse(
        response
      );

    return {
      ...normalized,

      token:
        normalized.token ||
        safeToken,

      legalEntity:
        normalized.existingData,

      legal_entity:
        normalized.existingData,
    };
  };

/* =========================================================
   SUBMIT LEGAL ENTITY

   POST /legal_entity_submit/:token
========================================================= */

export const submitLegalEntityDetails =
  async (
    token,
    legalEntityData
  ) => {
    const safeToken =
      normalizeToken(
        token
      );

    const formData =
      createLegalEntityFormData(
        legalEntityData
      );

    const response =
      await kycApi.post(
        `/legal_entity_submit/${encodeURIComponent(
          safeToken
        )}`,
        formData,
        {
          headers: {
            "X-Requested-With":
              "XMLHttpRequest",
          },
        }
      );

    const normalized =
      normalizeKycResponse(
        response
      );

    const nextPath =
      normalized.nextPath ||
      getPanPath(
        safeToken
      );

    return {
      ...normalized,

      success:
        true,

      token:
        normalized.token ||
        safeToken,

      nextRoute:
        nextPath,

      nextPath,

      redirectTo:
        nextPath,
    };
  };

/* =========================================================
   GET PAN DETAILS

   GET /pan/:token
========================================================= */

export const getPanDetails =
  async (
    token,
    {
      signal,
    } = {}
  ) => {
    const safeToken =
      normalizeToken(
        token
      );

    const response =
      await kycApi.get(
        `/pan/${encodeURIComponent(
          safeToken
        )}`,
        {
          signal,

          headers: {
            "X-Requested-With":
              "XMLHttpRequest",
          },
        }
      );

    const normalized =
      normalizeKycResponse(
        response
      );

    return {
      ...normalized,

      token:
        normalized.token ||
        safeToken,

      pan:
        normalized.existingData,
    };
  };

/* =========================================================
   SUBMIT PAN DETAILS

   POST /pan_submit/:token
========================================================= */

export const submitPanDetails =
  async (
    token,
    panData
  ) => {
    const safeToken =
      normalizeToken(
        token
      );

    const formData =
      createPanFormData(
        panData
      );

    const response =
      await kycApi.post(
        `/pan_submit/${encodeURIComponent(
          safeToken
        )}`,
        formData,
        {
          headers: {
            "X-Requested-With":
              "XMLHttpRequest",
          },
        }
      );

    const normalized =
      normalizeKycResponse(
        response
      );

    const nextPath =
      normalized.nextPath ||
      getProfilePicturePath(
        safeToken
      );

    return {
      ...normalized,

      success:
        true,

      token:
        normalized.token ||
        safeToken,

      nextRoute:
        nextPath,

      nextPath,

      redirectTo:
        nextPath,
    };
  };

/* =========================================================
   GET PROFILE PICTURE DETAILS

   GET /profile_picture/:token
========================================================= */

export const getProfilePictureDetails =
  async (
    token,
    {
      signal,
    } = {}
  ) => {
    const safeToken =
      normalizeToken(
        token
      );

    const response =
await kycApi.get(
  `/api/kyc/profile/${encodeURIComponent(
    safeToken
  )}`,
        {
          signal,

          headers: {
            "X-Requested-With":
              "XMLHttpRequest",
          },
        }
      );

    const normalized =
      normalizeKycResponse(
        response
      );

    return {
      ...normalized,

      token:
        normalized.token ||
        safeToken,

      profile:
        normalized.existingData,
    };
  };

/* =========================================================
   SUBMIT PROFILE PICTURE DETAILS

   POST /profile_picture/:token
========================================================= */

export const submitProfilePictureDetails =
  async (
    token,
    profileData
  ) => {
    const safeToken =
      normalizeToken(
        token
      );

    const formData =
      createProfilePictureFormData(
        profileData
      );

    const response =
await kycApi.post(
  `/api/kyc/profile/${encodeURIComponent(
    safeToken
  )}`,
        formData,
        {
          headers: {
            "X-Requested-With":
              "XMLHttpRequest",
          },
        }
      );

    const normalized =
      normalizeKycResponse(
        response
      );

    const nextPath =
      normalized.nextPath ||
      getAcknowledgementPath(
        safeToken
      );

    return {
      ...normalized,

      success:
        true,

      token:
        normalized.token ||
        safeToken,

      nextRoute:
        nextPath,

      nextPath,

      redirectTo:
        nextPath,
    };
  };

/* =========================================================
   GET ACKNOWLEDGEMENT

   GET /acknowledgement/:token
========================================================= */

export const getAcknowledgementDetails =
  async (
    token,
    {
      signal,
    } = {}
  ) => {
    const safeToken =
      normalizeToken(
        token
      );

    const response =
      await kycApi.get(
        `/acknowledgement/${encodeURIComponent(
          safeToken
        )}`,
        {
          signal,

          headers: {
            "X-Requested-With":
              "XMLHttpRequest",
          },
        }
      );

    const normalized =
      normalizeKycResponse(
        response
      );

    return {
      ...normalized,

      token:
        normalized.token ||
        safeToken,

      acknowledgement:
        normalized.existingData,
    };
  };

/* =========================================================
   SAVE MEMBER SIGNATURE

   POST /save_signature/:token

   signature_data:
   data:image/png;base64,...
========================================================= */

export const saveMemberSignature =
  async (
    token,
    signatureData
  ) => {
    const safeToken =
      normalizeToken(
        token
      );

    const normalizedSignature =
      toText(
        signatureData
      );

    if (
      !normalizedSignature
    ) {
      const error =
        new Error(
          "Signature is required."
        );

      error.statusCode =
        400;

      throw error;
    }

    if (
      !normalizedSignature.startsWith(
        "data:image/"
      )
    ) {
      const error =
        new Error(
          "Invalid signature image."
        );

      error.statusCode =
        400;

      throw error;
    }

    const formData =
      new FormData();

    formData.append(
      "signature_data",
      normalizedSignature
    );

    const response =
      await kycApi.post(
        `/save_signature/${encodeURIComponent(
          safeToken
        )}`,
        formData,
        {
          headers: {
            "X-Requested-With":
              "XMLHttpRequest",
          },
        }
      );

    const normalized =
      normalizeKycResponse(
        response
      );

    return {
      ...normalized,

      success:
        true,

      token:
        normalized.token ||
        safeToken,
    };
  };

/* =========================================================
   COMPATIBILITY EXPORTS

   BANK
========================================================= */

export const getBankForm =
  getBankDetails;

export const getBankDetailsPage =
  getBankDetails;

export const fetchBankDetails =
  getBankDetails;

export const submitBank =
  submitBankDetails;

export const submitBankForm =
  submitBankDetails;

export const saveBankDetails =
  submitBankDetails;

/* =========================================================
   LEGAL ENTITY
========================================================= */

export const getLegalEntityForm =
  getLegalEntityDetails;

export const getLegalEntityPage =
  getLegalEntityDetails;

export const fetchLegalEntityDetails =
  getLegalEntityDetails;

export const submitLegalEntity =
  submitLegalEntityDetails;

export const submitLegalEntityForm =
  submitLegalEntityDetails;

export const saveLegalEntityDetails =
  submitLegalEntityDetails;

/* =========================================================
   PAN
========================================================= */

export const getPanForm =
  getPanDetails;

export const fetchPanDetails =
  getPanDetails;

export const submitPan =
  submitPanDetails;

export const submitPanForm =
  submitPanDetails;

export const savePanDetails =
  submitPanDetails;

/* =========================================================
   PROFILE PICTURE
========================================================= */

export const getProfilePictureForm =
  getProfilePictureDetails;

export const fetchProfilePictureDetails =
  getProfilePictureDetails;

export const submitProfilePicture =
  submitProfilePictureDetails;

export const saveProfilePicture =
  submitProfilePictureDetails;

/* =========================================================
   ACKNOWLEDGEMENT
========================================================= */

export const getAcknowledgement =
  getAcknowledgementDetails;

export const fetchAcknowledgement =
  getAcknowledgementDetails;

/* =========================================================
   SIGNATURE
========================================================= */

export const saveSignature =
  saveMemberSignature;

export const submitSignature =
  saveMemberSignature;

/* =========================================================
   DEFAULT EXPORT
========================================================= */

const kycService = {
  /* VALIDATION */

  validateKycImage,

  validateAadhaarNumber,

  validatePincode,

  validatePanNumber,

  validatePhoneNumber,

  /* PATHS */

  getBankFormPath,

  getLegalEntityPath,

  getPanPath,

  getProfilePicturePath,

  getAcknowledgementPath,

  /* FORM DATA */

  createBankFormData,

  createLegalEntityFormData,

  createPanFormData,

  createProfilePictureFormData,

  /* BANK */

  getBankDetails,

  getBankForm,

  getBankDetailsPage,

  fetchBankDetails,

  submitBankDetails,

  submitBank,

  submitBankForm,

  saveBankDetails,

  /* LEGAL ENTITY */

  getLegalEntityDetails,

  getLegalEntityForm,

  getLegalEntityPage,

  fetchLegalEntityDetails,

  submitLegalEntityDetails,

  submitLegalEntity,

  submitLegalEntityForm,

  saveLegalEntityDetails,

  /* PAN */

  getPanDetails,

  getPanForm,

  fetchPanDetails,

  submitPanDetails,

  submitPan,

  submitPanForm,

  savePanDetails,

  /* PROFILE PICTURE */

  getProfilePictureDetails,

  getProfilePictureForm,

  fetchProfilePictureDetails,

  submitProfilePictureDetails,

  submitProfilePicture,

  saveProfilePicture,

  /* ACKNOWLEDGEMENT */

  getAcknowledgementDetails,

  getAcknowledgement,

  fetchAcknowledgement,

  /* SIGNATURE */

  saveMemberSignature,

  saveSignature,

  submitSignature,
};

export default kycService;