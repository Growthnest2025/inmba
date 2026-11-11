require(
  "dotenv"
).config();

const {
  testDatabaseConnection,
  closeDatabaseConnection,
} = require(
  "../src/database/connection"
);

const {
  hashLegacyMemberPassword,
  verifyLegacyMemberPassword,
  isLegacySha256Hash,
  generateLegacyStudentPasswordHash,
} = require(
  "../src/utils/password.utils"
);

const {
  generateUniqueLoginId,
  generateUniqueReferralId,
  loginIdExists,
  referralIdExists,
  isValidLoginIdFormat,
  isValidReferralIdFormat,
} = require(
  "../src/utils/memberId.utils"
);

const {
  generateMemberToken,
  isValidUuidV4,
  generateLegacyFileToken,
} = require(
  "../src/utils/token.utils"
);

const {
  generateSixDigitOtp,
  isValidSixDigitOtp,
  createOtpExpiry,
  isOtpExpired,
} = require(
  "../src/utils/otp.utils"
);

const {
  splitFullName,
  joinMemberName,
} = require(
  "../src/utils/name.utils"
);

const assert =
  (
    condition,
    message
  ) => {
    if (!condition) {
      const error =
        new Error(message);

      error.code =
        "UTILITY_TEST_FAILED";

      throw error;
    }
  };

const runUtilityTest =
  async () => {
    try {
      console.log(
        "Starting registration utility test..."
      );

      await testDatabaseConnection();

      /*
        Password test
      */
      console.log("");
      console.log(
        "Testing legacy password utilities..."
      );

      const samplePassword =
        "Test@123";

      const passwordHash =
        hashLegacyMemberPassword(
          samplePassword
        );

      assert(
        passwordHash.length === 64,
        "Password hash must contain 64 characters."
      );

      assert(
        isLegacySha256Hash(
          passwordHash
        ),
        "Password hash format is invalid."
      );

      assert(
        verifyLegacyMemberPassword(
          samplePassword,
          passwordHash
        ),
        "Correct password verification failed."
      );

      assert(
        !verifyLegacyMemberPassword(
          "WrongPassword",
          passwordHash
        ),
        "Wrong password was incorrectly accepted."
      );

      console.log(
        "Password SHA-256 format: valid"
      );

      console.log(
        "Correct password verification: valid"
      );

      console.log(
        "Wrong password rejection: valid"
      );

      /*
        Student legacy password
      */
      const studentPasswordHash =
        generateLegacyStudentPasswordHash();

      assert(
        isLegacySha256Hash(
          studentPasswordHash
        ),
        "Student password hash format is invalid."
      );

      console.log(
        "Student legacy password hash: valid"
      );

      /*
        Login ID test
      */
      console.log("");
      console.log(
        "Testing login ID generation..."
      );

      const loginId =
        await generateUniqueLoginId();

      const loginIdAlreadyExists =
        await loginIdExists(
          loginId
        );

      assert(
        isValidLoginIdFormat(
          loginId
        ),
        "Generated login ID must be exactly 7 digits."
      );

      assert(
        loginIdAlreadyExists ===
          false,
        "Generated login ID already exists."
      );

      console.log(
        `Generated login ID: ${loginId}`
      );

      console.log(
        "Login ID format: valid"
      );

      console.log(
        "Login ID database uniqueness: valid"
      );

      /*
        Referral ID test
      */
      console.log("");
      console.log(
        "Testing referral ID generation..."
      );

      const referralId =
        await generateUniqueReferralId();

      const referralIdAlreadyExists =
        await referralIdExists(
          referralId
        );

      assert(
        isValidReferralIdFormat(
          referralId
        ),
        "Generated referral ID format is invalid."
      );

      assert(
        referralIdAlreadyExists ===
          false,
        "Generated referral ID already exists."
      );

      console.log(
        `Generated referral ID: ${referralId}`
      );

      console.log(
        "Referral ID format: valid"
      );

      console.log(
        "Referral ID database uniqueness: valid"
      );

      /*
        UUID token test
      */
      console.log("");
      console.log(
        "Testing member token generation..."
      );

      const memberToken =
        generateMemberToken();

      assert(
        isValidUuidV4(
          memberToken
        ),
        "Member token is not a valid UUID v4."
      );

      console.log(
        `Generated member token: ${memberToken}`
      );

      console.log(
        "Member UUID v4 format: valid"
      );

      /*
        File token test
      */
      const fileToken =
        generateLegacyFileToken();

      assert(
        /^[a-f0-9]{16}$/.test(
          fileToken
        ),
        "Legacy file token must contain 16 hexadecimal characters."
      );

      console.log(
        "Legacy file token format: valid"
      );

      /*
        OTP test
      */
      console.log("");
      console.log(
        "Testing OTP utilities..."
      );

      const otp =
        generateSixDigitOtp();

      const otpExpiry =
        createOtpExpiry(5);

      assert(
        isValidSixDigitOtp(
          otp
        ),
        "OTP must contain exactly 6 digits."
      );

      assert(
        !isOtpExpired(
          otpExpiry
        ),
        "New OTP expiry is already expired."
      );

      console.log(
        `Generated OTP: ${otp}`
      );

      console.log(
        "OTP format: valid"
      );

      console.log(
        "OTP expiry: valid"
      );

      /*
        Name test
      */
      console.log("");
      console.log(
        "Testing full-name split..."
      );

      const singleName =
        splitFullName(
          "Vignesh"
        );

      const fullName =
        splitFullName(
          "Vignesh M Kumar"
        );

      assert(
        singleName.firstName ===
          "Vignesh" &&
          singleName.lastName ===
            null,
        "Single-name split failed."
      );

      assert(
        fullName.firstName ===
          "Vignesh" &&
          fullName.lastName ===
            "M Kumar",
        "Full-name split failed."
      );

      assert(
        joinMemberName(
          fullName.firstName,
          fullName.lastName
        ) ===
          "Vignesh M Kumar",
        "Member name join failed."
      );

      console.dir(
        {
          input:
            "Vignesh M Kumar",

          output:
            fullName,
        },
        {
          depth:
            null,
        }
      );

      console.log("");
      console.log(
        "Registration utility test completed successfully."
      );

      console.log(
        "No database records were inserted, updated or deleted."
      );
    } catch (error) {
      console.error("");
      console.error(
        "Registration utility test failed."
      );

      console.error(
        `Code: ${
          error.code ||
          "UNKNOWN"
        }`
      );

      console.error(
        `Message: ${error.message}`
      );

      process.exitCode =
        1;
    } finally {
      await closeDatabaseConnection();
    }
  };

runUtilityTest();