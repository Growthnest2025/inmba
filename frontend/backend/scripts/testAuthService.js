require(
  "dotenv"
).config();

const assert =
  require(
    "node:assert/strict"
  );

const {
  authRepository,
} = require(
  "../src/repositories"
);

const {
  MEMBER_LOGIN_SUCCESS_MESSAGE,
  INVALID_LOGIN_MESSAGE,
  INACTIVE_ACCOUNT_MESSAGE,

  hashLegacyPassword,
  isValidSha256Hash,
  comparePasswordHashes,
  verifyLegacyPassword,

  normalizeLoginCredentials,
  createAuthService,
} = require(
  "../src/services/auth.service"
);

const TEST_PASSWORD =
  "Test@123";

const TEST_PASSWORD_HASH =
  hashLegacyPassword(
    TEST_PASSWORD
  );

const createTestMember =
  (
    overrides = {}
  ) => {
    return {
      id:
        999001,

      first_name:
        "Auth",

      last_name:
        "Test Member",

      email:
        "auth-test@example.com",

      phone:
        "9876543210",

      login_id:
        "7654321",

      password:
        TEST_PASSWORD_HASH,

      token:
        "auth-test-member-token",

      membership_type:
        "Civilian Member",

      payment_status:
        "pending",

      profile_pic:
        null,

      referral_id:
        "AUTHTEST",

      direct_network:
        0,

      indirect_network:
        0,

      is_deleted:
        0,

      created_at:
        "2026-08-02 22:00:00",

      ...overrides,
    };
  };

const run =
  async () => {
    console.log(
      "Starting auth service test..."
    );

    /*
      HASH TESTS
    */
    console.log(
      "\nTesting legacy SHA-256 password utilities..."
    );

    assert.equal(
      TEST_PASSWORD_HASH.length,
      64
    );

    assert.equal(
      isValidSha256Hash(
        TEST_PASSWORD_HASH
      ),
      true
    );

    assert.equal(
      isValidSha256Hash(
        "invalid-hash"
      ),
      false
    );

    console.log(
      "Legacy password hashing: passed"
    );

    assert.equal(
      comparePasswordHashes(
        TEST_PASSWORD_HASH,
        TEST_PASSWORD_HASH
      ),
      true
    );

    assert.equal(
      comparePasswordHashes(
        TEST_PASSWORD_HASH,
        hashLegacyPassword(
          "Wrong@123"
        )
      ),
      false
    );

    console.log(
      "Timing-safe hash comparison: passed"
    );

    assert.equal(
      verifyLegacyPassword(
        TEST_PASSWORD,
        TEST_PASSWORD_HASH
      ),
      true
    );

    assert.equal(
      verifyLegacyPassword(
        "Wrong@123",
        TEST_PASSWORD_HASH
      ),
      false
    );

    assert.equal(
      verifyLegacyPassword(
        TEST_PASSWORD,
        "invalid-hash"
      ),
      false
    );

    console.log(
      "Legacy password verification: passed"
    );

    /*
      NORMALIZATION TEST
    */
    console.log(
      "\nTesting credential normalization..."
    );

    const normalizedCredentials =
      normalizeLoginCredentials({
        loginId:
          " 7654321 ",

        password:
          TEST_PASSWORD,
      });

    assert.deepEqual(
      normalizedCredentials,
      {
        login_id:
          "7654321",

        password:
          TEST_PASSWORD,
      }
    );

    console.log(
      "Login credential normalization: passed"
    );

    /*
      MOCK REPOSITORY

      No database insert/update/delete.
    */
    let currentMember =
      createTestMember();

    let receivedLoginId =
      null;

    let receivedOptions =
      null;

    const mockRepository = {
      ...authRepository,

      async findMemberByLoginId(
        loginId,
        options
      ) {
        receivedLoginId =
          loginId;

        receivedOptions =
          options;

        if (
          loginId !==
          currentMember?.login_id
        ) {
          return null;
        }

        return {
          ...currentMember,
        };
      },
    };

    const testAuthService =
      createAuthService({
        repository:
          mockRepository,
      });

    /*
      SUCCESSFUL LOGIN
    */
    console.log(
      "\nTesting successful member authentication..."
    );

    const loginResult =
      await testAuthService
        .authenticateMember({
          login_id:
            "7654321",

          password:
            TEST_PASSWORD,
        });

    assert.equal(
      receivedLoginId,
      "7654321"
    );

    assert.equal(
      receivedOptions
        .includeDeleted,
      true
    );

    assert.equal(
      loginResult.success,
      true
    );

    assert.equal(
      loginResult.message,
      MEMBER_LOGIN_SUCCESS_MESSAGE
    );

    assert.equal(
      loginResult.member.id,
      currentMember.id
    );

    assert.equal(
      loginResult.member.login_id,
      currentMember.login_id
    );

    assert.equal(
      loginResult.token,
      currentMember.token
    );

    assert.equal(
      loginResult.sessionData.user_id,
      currentMember.id
    );

    assert.equal(
      loginResult.sessionData.user_token,
      currentMember.token
    );

    assert.equal(
      loginResult.sessionData.token,
      currentMember.token
    );

    assert.equal(
      loginResult.nextAction.path,
      "/dashboard"
    );

    console.log(
      "Successful member authentication: passed"
    );

    /*
      SENSITIVE DATA FILTERING
    */
    assert.equal(
      Object.prototype
        .hasOwnProperty.call(
          loginResult.member,
          "password"
        ),
      false
    );

    assert.equal(
      Object.prototype
        .hasOwnProperty.call(
          loginResult.sessionUser,
          "password"
        ),
      false
    );

    assert.equal(
      Object.prototype
        .hasOwnProperty.call(
          loginResult.sessionData.user,
          "password"
        ),
      false
    );

    console.log(
      "Sensitive authentication data filtering: passed"
    );

    /*
      PENDING MEMBER LOGIN

      Existing Flask payment_status
      check செய்யவில்லை.
    */
    assert.equal(
      loginResult.member
        .payment_status,
      "pending"
    );

    console.log(
      "Pending member login compatibility: passed"
    );

    /*
      WRONG LOGIN ID
    */
    console.log(
      "\nTesting invalid Login ID..."
    );

    await assert.rejects(
      async () => {
        await testAuthService
          .authenticateMember({
            login_id:
              "0000000",

            password:
              TEST_PASSWORD,
          });
      },
      (error) => {
        assert.equal(
          error.statusCode,
          401
        );

        assert.equal(
          error.message,
          INVALID_LOGIN_MESSAGE
        );

        assert.equal(
          error.code,
          "INVALID_CREDENTIALS"
        );

        return true;
      }
    );

    console.log(
      "Invalid Login ID rejection: passed"
    );

    /*
      WRONG PASSWORD
    */
    console.log(
      "\nTesting invalid password..."
    );

    await assert.rejects(
      async () => {
        await testAuthService
          .authenticateMember({
            login_id:
              "7654321",

            password:
              "Wrong@123",
          });
      },
      (error) => {
        assert.equal(
          error.statusCode,
          401
        );

        assert.equal(
          error.message,
          INVALID_LOGIN_MESSAGE
        );

        assert.equal(
          error.code,
          "INVALID_CREDENTIALS"
        );

        return true;
      }
    );

    console.log(
      "Invalid password rejection: passed"
    );

    /*
      DELETED MEMBER
    */
    console.log(
      "\nTesting deleted member rejection..."
    );

    currentMember =
      createTestMember({
        is_deleted:
          1,
      });

    await assert.rejects(
      async () => {
        await testAuthService
          .authenticateMember({
            login_id:
              "7654321",

            password:
              TEST_PASSWORD,
          });
      },
      (error) => {
        assert.equal(
          error.statusCode,
          403
        );

        assert.equal(
          error.message,
          INACTIVE_ACCOUNT_MESSAGE
        );

        assert.equal(
          error.code,
          "ACCOUNT_INACTIVE"
        );

        return true;
      }
    );

    console.log(
      "Deleted member rejection: passed"
    );

    /*
      MISSING CREDENTIALS
    */
    console.log(
      "\nTesting missing credentials..."
    );

    await assert.rejects(
      async () => {
        await testAuthService
          .authenticateMember(
            {}
          );
      },
      (error) => {
        assert.equal(
          error.statusCode,
          400
        );

        assert.equal(
          error.message,
          "Please provide both Login ID and password."
        );

        assert.equal(
          error.code,
          "VALIDATION_ERROR"
        );

        assert.equal(
          error.errors.length,
          2
        );

        return true;
      }
    );

    console.log(
      "Missing credentials rejection: passed"
    );

    console.log(
      "\nAuth service test completed successfully."
    );

    console.log(
      "No database records were inserted, updated or deleted."
    );
  };

run()
  .catch(
    (error) => {
      console.error(
        "\nAuth service test failed:"
      );

      console.error(
        error
      );

      process.exitCode =
        1;
    }
  );