require(
  "dotenv"
).config();

const assert =
  require(
    "node:assert/strict"
  );

const {
  passwordResetRepository,
} = require(
  "../src/repositories"
);

const {
  validateForgotPasswordData,
  validateVerifyOtpData,
  validateResetPasswordData,
} = require(
  "../src/validators/passwordReset.validator"
);

const database =
  require(
    "../src/database/connection"
  );

const closeDatabase =
  async () => {
    const possibleMethods = [
      "closeDatabasePool",
      "closePool",
      "close",
      "end",
    ];

    for (
      const methodName of
      possibleMethods
    ) {
      if (
        typeof database[
          methodName
        ] ===
        "function"
      ) {
        await database[
          methodName
        ]();

        return;
      }
    }

    if (
      database.pool &&
      typeof database.pool.end ===
        "function"
    ) {
      await database.pool.end();
    }
  };

const run =
  async () => {
    console.log(
      "Starting password-reset foundation test..."
    );

    /*
      =========================
      FORGOT PASSWORD VALIDATION
      =========================
    */

    console.log(
      "\nTesting forgot-password validation..."
    );

    const missingEmail =
      validateForgotPasswordData(
        {}
      );

    assert.equal(
      missingEmail.isValid,
      false
    );

    assert.equal(
      missingEmail.message,
      "Email is required"
    );

    assert.equal(
      missingEmail.errors[0].code,
      "EMAIL_REQUIRED"
    );

    console.log(
      "Missing email validation: passed"
    );

    const invalidEmail =
      validateForgotPasswordData({
        email:
          "invalid-email",
      });

    assert.equal(
      invalidEmail.isValid,
      false
    );

    assert.equal(
      invalidEmail.message,
      "Invalid email address"
    );

    console.log(
      "Invalid email validation: passed"
    );

    const validEmail =
      validateForgotPasswordData({
        email:
          " TEST@EXAMPLE.COM ",
      });

    assert.equal(
      validEmail.isValid,
      true
    );

    assert.equal(
      validEmail.data.email,
      "test@example.com"
    );

    console.log(
      "Email normalization: passed"
    );

    /*
      =========================
      OTP VALIDATION
      =========================
    */

    console.log(
      "\nTesting OTP validation..."
    );

    const missingOtp =
      validateVerifyOtpData(
        {}
      );

    assert.equal(
      missingOtp.isValid,
      false
    );

    assert.equal(
      missingOtp.errors[0].code,
      "OTP_REQUIRED"
    );

    const invalidOtp =
      validateVerifyOtpData({
        otp:
          "1234",
      });

    assert.equal(
      invalidOtp.isValid,
      false
    );

    assert.equal(
      invalidOtp.message,
      "Invalid OTP"
    );

    const validOtp =
      validateVerifyOtpData({
        otp:
          " 123456 ",
      });

    assert.equal(
      validOtp.isValid,
      true
    );

    assert.equal(
      validOtp.data.otp,
      "123456"
    );

    console.log(
      "OTP validation: passed"
    );

    /*
      =========================
      RESET PASSWORD VALIDATION
      =========================
    */

    console.log(
      "\nTesting reset-password validation..."
    );

    const missingPasswords =
      validateResetPasswordData(
        {}
      );

    assert.equal(
      missingPasswords.isValid,
      false
    );

    assert.equal(
      missingPasswords.message,
      "All fields required"
    );

    const mismatchPasswords =
      validateResetPasswordData({
        password:
          "New@123",

        confirm_password:
          "Wrong@123",
      });

    assert.equal(
      mismatchPasswords.isValid,
      false
    );

    assert.equal(
      mismatchPasswords.message,
      "Passwords do not match"
    );

    const validPasswords =
      validateResetPasswordData({
        password:
          "New@123",

        confirmPassword:
          "New@123",
      });

    assert.equal(
      validPasswords.isValid,
      true
    );

    console.log(
      "Reset-password validation: passed"
    );

    /*
      =========================
      REPOSITORY READ TEST
      =========================
    */

    console.log(
      "\nTesting password-reset repository..."
    );

    const rows =
      await passwordResetRepository
        .findMemberByEmail(
          "invalid-test-email@example.com"
        );

    assert.equal(
      rows,
      null
    );

    console.log(
      "Unknown email query: passed"
    );

    /*
      Existing member read-only sample.
    */
    const sampleQuery =
      await require(
        "../src/repositories/auth.repository"
      ).findFirstLoginMember();

    assert.ok(
      sampleQuery
    );

    assert.ok(
      sampleQuery.email
    );

    const memberByEmail =
      await passwordResetRepository
        .findMemberByEmail(
          sampleQuery.email
        );

    assert.ok(
      memberByEmail
    );

    assert.equal(
      Number(
        memberByEmail.id
      ),
      Number(
        sampleQuery.id
      )
    );

    console.log(
      "Find member by email: passed"
    );

    const otpRecord =
      await passwordResetRepository
        .findOtpRecordByEmail(
          sampleQuery.email
        );

    assert.ok(
      otpRecord
    );

    assert.equal(
      Number(
        otpRecord.id
      ),
      Number(
        sampleQuery.id
      )
    );

    console.log(
      "Find OTP record by email: passed"
    );

    const safeMember =
      passwordResetRepository
        .toSafePasswordResetMember(
          memberByEmail
        );

    assert.equal(
      Object.prototype
        .hasOwnProperty.call(
          safeMember,
          "password"
        ),
      false
    );

    assert.equal(
      Object.prototype
        .hasOwnProperty.call(
          safeMember,
          "otp"
        ),
      false
    );

    console.log(
      "Safe reset member mapping: passed"
    );

    console.log(
      "\nPassword-reset foundation test completed successfully."
    );

    console.log(
      "No database records were inserted, updated or deleted."
    );
  };

run()
  .catch(
    (error) => {
      console.error(
        "\nPassword-reset foundation test failed:"
      );

      console.error(
        error
      );

      process.exitCode =
        1;
    }
  )
  .finally(
    async () => {
      try {
        await closeDatabase();

        console.log(
          "MySQL connection pool closed."
        );
      } catch (error) {
        console.error(
          "Unable to close MySQL pool:",
          error.message
        );
      }
    }
  );