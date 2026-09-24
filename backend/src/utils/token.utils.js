const crypto =
  require("crypto");

/*
  Flask:

  token = str(
    uuid.uuid4()
  )

  Node equivalent:
  crypto.randomUUID()
*/
const generateMemberToken =
  () => {
    return crypto.randomUUID();
  };

const isValidUuidV4 =
  (value) => {
    const uuidV4Pattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return uuidV4Pattern.test(
      String(value || "")
    );
  };

/*
  Upload files, signature files,
  proof files போன்றவற்றுக்கு Flask:

  secrets.token_hex(8)

  பயன்படுத்துகிறது.

  8 bytes = 16 hexadecimal chars.
*/
const generateLegacyFileToken =
  () => {
    return crypto
      .randomBytes(8)
      .toString("hex");
  };

/*
  Forgot password அல்லது temporary
  security process-க்கு generic
  secure token தேவைப்பட்டால்.
*/
const generateSecureToken =
  (
    byteLength = 32
  ) => {
    const normalizedByteLength =
      Number(byteLength);

    if (
      !Number.isInteger(
        normalizedByteLength
      ) ||
      normalizedByteLength < 1
    ) {
      throw new TypeError(
        "Token byte length must be a positive integer."
      );
    }

    return crypto
      .randomBytes(
        normalizedByteLength
      )
      .toString("hex");
  };

module.exports = {
  generateMemberToken,
  isValidUuidV4,

  generateLegacyFileToken,
  generateSecureToken,
};