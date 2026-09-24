import axios from "axios";

/* ========================================
   STUDENT REGISTRATION API

   Exact backend route:
   POST /student

   Referral support:
   POST /student?ref=REFERRAL_ID
======================================== */

const studentRegistrationApi =
  axios.create({
    baseURL: "/",

    withCredentials: true,

    timeout: 60000,

    headers: {
      Accept: "application/json",
    },
  });

/* ========================================
   COMMON HELPERS
======================================== */

const asObject = (value) => {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
};

const toText = (
  value,
  fallback = ""
) => {
  const normalizedValue =
    String(value ?? "").trim();

  return normalizedValue || fallback;
};

const normalizeDigits = (
  value,
  maximumLength
) => {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, maximumLength);
};

/* ========================================
   EMAIL VALIDATION
======================================== */

export const validateStudentEmail = (
  value
) => {
  const email =
    toText(value)
      .toLowerCase();

  if (!email) {
    return {
      valid: false,

      error:
        "Email address is required.",
    };
  }

  const pattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!pattern.test(email)) {
    return {
      valid: false,

      error:
        "Enter a valid email address.",
    };
  }

  return {
    valid: true,

    error: "",

    value: email,
  };
};

/* ========================================
   MOBILE VALIDATION
======================================== */

export const validateStudentMobile = (
  value
) => {
  const mobile =
    normalizeDigits(
      value,
      10
    );

  if (!mobile) {
    return {
      valid: false,

      error:
        "Mobile number is required.",
    };
  }

  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return {
      valid: false,

      error:
        "Enter a valid 10-digit Indian mobile number.",
    };
  }

  return {
    valid: true,

    error: "",

    value: mobile,
  };
};

/* ========================================
   FILE VALIDATION

   Backend fields:
   marksheet
   bonafide
   govt_id
======================================== */

export const validateStudentDocument = (
  file,
  {
    required = false,
    maxSizeMb = 5,
  } = {}
) => {
  if (!file) {
    return {
      valid: !required,

      error: required
        ? "Document is required."
        : "",
    };
  }

  const allowedTypes = [
    "application/pdf",
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
      valid: false,

      error:
        "Upload a PDF, JPG or PNG document.",
    };
  }

  const maximumSize =
    maxSizeMb *
    1024 *
    1024;

  if (
    file.size >
    maximumSize
  ) {
    return {
      valid: false,

      error:
        `Document size must be below ${maxSizeMb} MB.`,
    };
  }

  return {
    valid: true,

    error: "",
  };
};

/* ========================================
   CREATE EXACT FORMDATA

   Exact backend fields are preserved.
======================================== */

export const createStudentFormData = (
  values
) => {
  const source =
    asObject(values);

  const formData =
    new FormData();

  const appendText = (
    fieldName,
    value
  ) => {
    formData.append(
      fieldName,
      toText(value)
    );
  };

  appendText(
    "fullname",
    source.fullname
  );

  appendText(
    "dob",
    source.dob
  );

  appendText(
    "gender",
    source.gender
  );

  appendText(
    "mobile",
    normalizeDigits(
      source.mobile,
      10
    )
  );

  appendText(
    "email",
    toText(
      source.email
    ).toLowerCase()
  );

  appendText(
    "education_level",
    source.education_level
  );

  appendText(
    "school_name",
    source.school_name
  );

  appendText(
    "school_class",
    source.school_class
  );

  appendText(
    "board",
    source.board
  );

  appendText(
    "school_city",
    source.school_city
  );

  appendText(
    "ug_college",
    source.ug_college
  );

  appendText(
    "ug_degree",
    source.ug_degree
  );

  appendText(
    "ug_department",
    source.ug_department
  );

  appendText(
    "ug_year",
    source.ug_year
  );

  appendText(
    "pg_college",
    source.pg_college
  );

  appendText(
    "pg_degree",
    source.pg_degree
  );

  appendText(
    "pg_specialization",
    source.pg_specialization
  );

  appendText(
    "pg_semester",
    source.pg_semester
  );

  appendText(
    "skills",
    source.skills
  );

  appendText(
    "student_id",
    source.student_id
  );

  if (
    source.marksheet instanceof File
  ) {
    formData.append(
      "marksheet",
      source.marksheet
    );
  }

  if (
    source.bonafide instanceof File
  ) {
    formData.append(
      "bonafide",
      source.bonafide
    );
  }

  if (
    source.govt_id instanceof File
  ) {
    formData.append(
      "govt_id",
      source.govt_id
    );
  }

  return formData;
};

/* ========================================
   RESPONSE NORMALIZER
======================================== */

const normalizeStudentResponse = (
  response
) => {
  const responseBody =
    response?.data;

  if (
    typeof responseBody ===
    "string"
  ) {
    const invalidResponseError =
      new Error(
        responseBody
          .toLowerCase()
          .includes("<html")
          ? "Student registration API returned HTML instead of JSON."
          : "Student registration API returned an invalid response."
      );

    invalidResponseError.statusCode =
      Number(
        response?.status || 0
      );

    invalidResponseError.apiMessage =
      invalidResponseError.message;

    throw invalidResponseError;
  }

  const body =
    asObject(responseBody);

  const data =
    asObject(body.data);

  const member =
    asObject(
      data.member ??
        body.member
    );

  const nextAction =
    asObject(
      data.nextAction ??
        body.nextAction
    );

  return {
    success:
      body.success !== false,

    statusCode:
      Number(
        body.statusCode ??
          response?.status ??
          201
      ),

    message:
      toText(
        body.message ??
          data.message,
        "Your student membership application has been submitted. Admin will review it."
      ),

    loginId:
      toText(
        data.loginId ??
          data.login_id ??
          body.loginId ??
          body.login_id ??
          member.login_id
      ),

    token:
      toText(
        data.token ??
          body.token ??
          member.token
      ),

    membershipType:
      toText(
        member.membership_type ??
          data.membership_type,
        "Student Member"
      ),

    paymentStatus:
      toText(
        member.payment_status ??
          data.payment_status,
        "pending"
      ),

    nextRoute:
      toText(
        nextAction.path ??
          data.nextRoute ??
          body.nextRoute
      ),

    member,

    raw: body,
  };
};

/* ========================================
   ERROR NORMALIZER
======================================== */

const normalizeStudentError = (
  error
) => {
  const responseData =
    asObject(
      error?.response?.data
    );

  error.statusCode =
    Number(
      error?.response?.status ||
        error?.statusCode ||
        0
    );

  error.apiMessage =
    toText(
      responseData.message ??
        responseData.error ??
        error?.message,
      "Unable to submit student membership application."
    );

  error.fieldErrors =
    asObject(
      responseData.errors ??
        responseData.fieldErrors
    );

  return error;
};

/* ========================================
   SUBMIT STUDENT REGISTRATION

   Exact API:
   POST /student

   Referral:
   POST /student?ref=REFERRAL_ID
======================================== */

export const submitStudentRegistration =
  async (
    values,
    {
      signal,
      referral = "",
    } = {}
  ) => {
    const formData =
      createStudentFormData(
        values
      );

    const normalizedReferral =
      toText(referral);

    const endpoint =
      normalizedReferral
        ? `/student?ref=${encodeURIComponent(
            normalizedReferral
          )}`
        : "/student";

    try {
      const response =
        await studentRegistrationApi.post(
          endpoint,
          formData,
          {
            signal,

            /*
              Content-Type manually set
              செய்யக்கூடாது.

              Browser multipart boundary
              automatically add செய்யும்.
            */
          }
        );

      return normalizeStudentResponse(
        response
      );
    } catch (error) {
      throw normalizeStudentError(
        error
      );
    }
  };

/* ========================================
   COMPATIBILITY EXPORTS
======================================== */

export const registerStudent =
  submitStudentRegistration;

export const registerStudentMember =
  submitStudentRegistration;

/* ========================================
   DEFAULT EXPORT
======================================== */

const studentRegistrationService = {
  submitStudentRegistration,
  registerStudent,
  registerStudentMember,

  createStudentFormData,

  validateStudentEmail,
  validateStudentMobile,
  validateStudentDocument,
};

export default studentRegistrationService;