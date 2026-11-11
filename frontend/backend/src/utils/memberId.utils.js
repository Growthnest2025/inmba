const crypto =
  require("crypto");

const {
  pool,
} = require(
  "../database/connection"
);

const LOGIN_ID_MIN =
  1000000;

const LOGIN_ID_MAX_EXCLUSIVE =
  10000000;

const REFERRAL_ID_LENGTH =
  8;

const REFERRAL_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const DEFAULT_MAX_ATTEMPTS =
  100;

/*
  Flask:

  random.randint(
    1000000,
    9999999
  )

  Node crypto.randomInt max value
  exclusive என்பதால் 10000000.
*/
const generateLoginIdCandidate =
  () => {
    return String(
      crypto.randomInt(
        LOGIN_ID_MIN,
        LOGIN_ID_MAX_EXCLUSIVE
      )
    );
  };

/*
  Database-ல் login_id already
  இருக்கிறதா check செய்கிறது.
*/
const loginIdExists =
  async (
    loginId,
    connection = pool
  ) => {
    const normalizedLoginId =
      String(loginId || "")
        .trim();

    if (
      !normalizedLoginId
    ) {
      return false;
    }

    const [rows] =
      await connection.query(
        `
          SELECT
            id
          FROM
            kyc_members
          WHERE
            login_id = ?
          LIMIT 1
        `,
        [
          normalizedLoginId,
        ]
      );

    return rows.length > 0;
  };

/*
  Flask generate_unique_login_id()
  equivalent.

  Database-ல் இல்லாத 7-digit
  login ID return செய்கிறது.
*/
const generateUniqueLoginId =
  async ({
    connection = pool,
    maxAttempts =
      DEFAULT_MAX_ATTEMPTS,
  } = {}) => {
    for (
      let attempt = 1;
      attempt <= maxAttempts;
      attempt += 1
    ) {
      const loginId =
        generateLoginIdCandidate();

      const exists =
        await loginIdExists(
          loginId,
          connection
        );

      if (!exists) {
        return loginId;
      }
    }

    const error =
      new Error(
        "Unable to generate a unique member login ID."
      );

    error.code =
      "LOGIN_ID_GENERATION_FAILED";

    throw error;
  };

/*
  Flask:

  string.ascii_uppercase
  +
  string.digits

  random.choices(..., k=8)
*/
const generateReferralIdCandidate =
  () => {
    let referralId =
      "";

    for (
      let index = 0;
      index <
        REFERRAL_ID_LENGTH;
      index += 1
    ) {
      const characterIndex =
        crypto.randomInt(
          0,
          REFERRAL_CHARACTERS
            .length
        );

      referralId +=
        REFERRAL_CHARACTERS[
          characterIndex
        ];
    }

    return referralId;
  };

/*
  Database-ல் referral_id
  already இருக்கிறதா check.
*/
const referralIdExists =
  async (
    referralId,
    connection = pool
  ) => {
    const normalizedReferralId =
      String(referralId || "")
        .trim()
        .toUpperCase();

    if (
      !normalizedReferralId
    ) {
      return false;
    }

    const [rows] =
      await connection.query(
        `
          SELECT
            id
          FROM
            kyc_members
          WHERE
            referral_id = ?
          LIMIT 1
        `,
        [
          normalizedReferralId,
        ]
      );

    return rows.length > 0;
  };

/*
  Flask generate_unique_referral_id()
  equivalent.

  Database-ல் இல்லாத uppercase
  8-character referral ID return.
*/
const generateUniqueReferralId =
  async ({
    connection = pool,
    maxAttempts =
      DEFAULT_MAX_ATTEMPTS,
  } = {}) => {
    for (
      let attempt = 1;
      attempt <= maxAttempts;
      attempt += 1
    ) {
      const referralId =
        generateReferralIdCandidate();

      const exists =
        await referralIdExists(
          referralId,
          connection
        );

      if (!exists) {
        return referralId;
      }
    }

    const error =
      new Error(
        "Unable to generate a unique referral ID."
      );

    error.code =
      "REFERRAL_ID_GENERATION_FAILED";

    throw error;
  };

const isValidLoginIdFormat =
  (loginId) => {
    return /^\d{7}$/.test(
      String(loginId || "")
    );
  };

const isValidReferralIdFormat =
  (referralId) => {
    return /^[A-Z0-9]{8}$/.test(
      String(referralId || "")
        .trim()
        .toUpperCase()
    );
  };

module.exports = {
  LOGIN_ID_MIN,
  LOGIN_ID_MAX_EXCLUSIVE,

  REFERRAL_ID_LENGTH,
  REFERRAL_CHARACTERS,

  generateLoginIdCandidate,
  generateUniqueLoginId,
  loginIdExists,

  generateReferralIdCandidate,
  generateUniqueReferralId,
  referralIdExists,

  isValidLoginIdFormat,
  isValidReferralIdFormat,
};