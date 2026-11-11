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
  validateLoginData,
} = require(
  "../src/validators/auth.validator"
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
      "Starting auth foundation test..."
    );

    /*
      VALIDATION TESTS
    */
    console.log(
      "\nTesting login validation..."
    );

    const emptyResult =
      validateLoginData(
        {}
      );

    assert.equal(
      emptyResult.isValid,
      false
    );

    assert.equal(
      emptyResult.message,
      "Please provide both Login ID and password."
    );

    assert.equal(
      emptyResult.errors.length,
      2
    );

    console.log(
      "Empty login validation: passed"
    );

    const missingPasswordResult =
      validateLoginData({
        login_id:
          "6668717",
      });

    assert.equal(
      missingPasswordResult.isValid,
      false
    );

    assert.equal(
      missingPasswordResult.errors[0]
        .code,
      "PASSWORD_REQUIRED"
    );

    console.log(
      "Missing password validation: passed"
    );

    const validResult =
      validateLoginData({
        loginId:
          " 6668717 ",

        password:
          "Test@123",
      });

    assert.equal(
      validResult.isValid,
      true
    );

    assert.equal(
      validResult.data.login_id,
      "6668717"
    );

    assert.equal(
      validResult.data.password,
      "Test@123"
    );

    console.log(
      "Valid login normalization: passed"
    );

    /*
      REPOSITORY TESTS
    */
    console.log(
      "\nTesting auth repository..."
    );

    const sampleMember =
      await authRepository
        .findFirstLoginMember();

    assert.ok(
      sampleMember,
      "At least one active member is required for the auth repository test."
    );

    assert.ok(
      sampleMember.id
    );

    assert.ok(
      sampleMember.login_id
    );

    console.log(
      "Authentication sample found:"
    );

    console.log({
      id:
        sampleMember.id,

      login_id:
        sampleMember.login_id,

      membership_type:
        sampleMember.membership_type,

      payment_status:
        sampleMember.payment_status,

      is_deleted:
        sampleMember.is_deleted,
    });

    const memberByLoginId =
      await authRepository
        .findMemberByLoginId(
          sampleMember.login_id
        );

    assert.ok(
      memberByLoginId
    );

    assert.equal(
      String(
        memberByLoginId.login_id
      ),
      String(
        sampleMember.login_id
      )
    );

    console.log(
      "Find member by Login ID: passed"
    );

    const activeMember =
      await authRepository
        .findActiveMemberByLoginId(
          sampleMember.login_id
        );

    assert.ok(
      activeMember
    );

    assert.equal(
      Number(
        activeMember.is_deleted ||
        0
      ),
      0
    );

    console.log(
      "Find active login member: passed"
    );

    const memberById =
      await authRepository
        .findMemberById(
          sampleMember.id
        );

    assert.ok(
      memberById
    );

    assert.equal(
      Number(
        memberById.id
      ),
      Number(
        sampleMember.id
      )
    );

    console.log(
      "Find member by ID: passed"
    );

    const missingMember =
      await authRepository
        .findMemberByLoginId(
          "0000000"
        );

    assert.equal(
      missingMember,
      null
    );

    console.log(
      "Unknown Login ID query: passed"
    );

    const safeMember =
      authRepository
        .toSafeAuthMember(
          memberByLoginId
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
          "token"
        ),
      false
    );

    console.log(
      "Sensitive member filtering: passed"
    );

    const sessionMember =
      authRepository
        .toAuthSessionMember(
          memberByLoginId
        );

    assert.equal(
      Number(
        sessionMember.id
      ),
      Number(
        sampleMember.id
      )
    );

    assert.equal(
      String(
        sessionMember.login_id
      ),
      String(
        sampleMember.login_id
      )
    );

    assert.equal(
      Object.prototype
        .hasOwnProperty.call(
          sessionMember,
          "password"
        ),
      false
    );

    console.log(
      "Session member mapping: passed"
    );

    console.log(
      "\nAuth foundation test completed successfully."
    );

    console.log(
      "No database records were inserted, updated or deleted."
    );
  };

run()
  .catch(
    (error) => {
      console.error(
        "\nAuth foundation test failed:"
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