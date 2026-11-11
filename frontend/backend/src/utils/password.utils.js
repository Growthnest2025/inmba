const crypto =
  require("crypto");

/*
  Existing Flask member password format:

  hashlib.sha256(
    password.encode()
  ).hexdigest()

  Result:
  64-character lowercase hexadecimal string.
*/
const hashLegacyMemberPassword =
  (password) => {
    if (
      typeof password !==
        "string" ||
      password.length === 0
    ) {
      throw new TypeError(
        "Password must be a non-empty string."
      );
    }

    return crypto
      .createHash("sha256")
      .update(
        password,
        "utf8"
      )
      .digest("hex");
  };

/*
  Stored value valid SHA-256 hexadecimal
  hash-ஆ இருக்கிறதா என்று check செய்கிறது.
*/
const isLegacySha256Hash =
  (value) => {
    return /^[a-f0-9]{64}$/i.test(
      String(value || "")
    );
  };

/*
  Existing Flask member password
  verification-compatible method.

  timingSafeEqual பயன்படுத்துவதால்
  normal string comparison-ஐ விட
  timing attack risk குறையும்.
*/
const verifyLegacyMemberPassword =
  (
    plainPassword,
    storedPasswordHash
  ) => {
    if (
      typeof plainPassword !==
      "string"
    ) {
      return false;
    }

    if (
      !isLegacySha256Hash(
        storedPasswordHash
      )
    ) {
      return false;
    }

    const calculatedHash =
      hashLegacyMemberPassword(
        plainPassword
      );

    const calculatedBuffer =
      Buffer.from(
        calculatedHash,
        "hex"
      );

    const storedBuffer =
      Buffer.from(
        String(
          storedPasswordHash
        ).toLowerCase(),
        "hex"
      );

    if (
      calculatedBuffer.length !==
      storedBuffer.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      calculatedBuffer,
      storedBuffer
    );
  };

/*
  Existing Flask student registration code:

  password =
    hashlib.sha256(
      secrets.token_hex(8).encode()
    ).hexdigest()

  secrets.token_hex(8)
  = 8 random bytes
  = 16 hexadecimal characters.

  Flask code plaintext temporary value-ஐ
  return அல்லது email செய்யவில்லை.

  Exact database compatibility-க்காக
  இந்த function final stored hash மட்டும்
  return செய்கிறது.
*/
const generateLegacyStudentPasswordHash =
  () => {
    const randomHexValue =
      crypto
        .randomBytes(8)
        .toString("hex");

    return hashLegacyMemberPassword(
      randomHexValue
    );
  };

module.exports = {
  hashLegacyMemberPassword,
  verifyLegacyMemberPassword,
  isLegacySha256Hash,
  generateLegacyStudentPasswordHash,
};