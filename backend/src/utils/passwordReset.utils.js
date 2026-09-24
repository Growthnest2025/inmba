const crypto = require("crypto");

/* =========================
   OTP CONFIGURATION
========================= */

const OTP_LENGTH = 6;

const OTP_EXPIRY_MINUTES = 5;

/* =========================
   GENERATE OTP
========================= */

const generateOtp = () => {
  const minimum = 10 ** (OTP_LENGTH - 1);

  const maximum =
    10 ** OTP_LENGTH - 1;

  return crypto
    .randomInt(
      minimum,
      maximum + 1
    )
    .toString();
};

/* =========================
   HASH OTP
========================= */

const hashOtp = (otp) => {
  if (!otp) {
    throw new Error(
      "OTP is required for hashing."
    );
  }

  return crypto
    .createHash("sha256")
    .update(String(otp))
    .digest("hex");
};

/* =========================
   VERIFY OTP HASH
========================= */

const verifyOtpHash = (
  enteredOtp,
  storedOtpHash
) => {
  if (
    !enteredOtp ||
    !storedOtpHash
  ) {
    return false;
  }

  const enteredOtpHash =
    hashOtp(enteredOtp);

  const enteredBuffer =
    Buffer.from(
      enteredOtpHash,
      "hex"
    );

  const storedBuffer =
    Buffer.from(
      storedOtpHash,
      "hex"
    );

  if (
    enteredBuffer.length !==
    storedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    enteredBuffer,
    storedBuffer
  );
};

/* =========================
   CREATE OTP EXPIRY
========================= */

const createOtpExpiry = () => {
  return new Date(
    Date.now() +
      OTP_EXPIRY_MINUTES *
        60 *
        1000
  );
};

/* =========================
   CHECK OTP EXPIRY
========================= */

const isOtpExpired = (
  expiresAt
) => {
  if (!expiresAt) {
    return true;
  }

  const expiryTime =
    new Date(expiresAt).getTime();

  if (
    Number.isNaN(expiryTime)
  ) {
    return true;
  }

  return Date.now() > expiryTime;
};

/* =========================
   SAFE OTP RESPONSE
========================= */

const getDevelopmentOtp = (
  otp
) => {
  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    return undefined;
  }

  return otp;
};

module.exports = {
  OTP_LENGTH,
  OTP_EXPIRY_MINUTES,
  generateOtp,
  hashOtp,
  verifyOtpHash,
  createOtpExpiry,
  isOtpExpired,
  getDevelopmentOtp,
};