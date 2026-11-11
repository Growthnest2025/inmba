const crypto =
  require("crypto");

/*
  Flask:

  str(
    random.randint(
      100000,
      999999
    )
  )

  Node crypto.randomInt max
  exclusive என்பதால் 1000000.
*/
const generateSixDigitOtp =
  () => {
    return String(
      crypto.randomInt(
        100000,
        1000000
      )
    );
  };

const isValidSixDigitOtp =
  (otp) => {
    return /^\d{6}$/.test(
      String(otp || "")
        .trim()
    );
  };

/*
  Default OTP expiration:
  existing forgot-password flow 5 minutes.
*/
const createOtpExpiry =
  (
    minutes = 5
  ) => {
    const normalizedMinutes =
      Number(minutes);

    if (
      !Number.isFinite(
        normalizedMinutes
      ) ||
      normalizedMinutes <= 0
    ) {
      throw new TypeError(
        "OTP expiry minutes must be greater than zero."
      );
    }

    return new Date(
      Date.now() +
        normalizedMinutes *
          60 *
          1000
    );
  };

const isOtpExpired =
  (expiryValue) => {
    if (!expiryValue) {
      return true;
    }

    const expiryDate =
      expiryValue instanceof Date
        ? expiryValue
        : new Date(
            expiryValue
          );

    if (
      Number.isNaN(
        expiryDate.getTime()
      )
    ) {
      return true;
    }

    return (
      expiryDate.getTime() <
      Date.now()
    );
  };

module.exports = {
  generateSixDigitOtp,
  isValidSixDigitOtp,
  createOtpExpiry,
  isOtpExpired,
};