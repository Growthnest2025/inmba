require(
  "dotenv"
).config();

const crypto =
  require("crypto");

const {
  pool,
  testDatabaseConnection,
  closeDatabaseConnection,
} = require(
  "../src/database/connection"
);

const {
  registrationRepository,
} = require(
  "../src/repositories"
);

const {
  registrationService,
} = require(
  "../src/services"
);

const {
  generateUniqueLoginId,
  generateUniqueReferralId,
} = require(
  "../src/utils/memberId.utils"
);

const {
  generateMemberToken,
} = require(
  "../src/utils/token.utils"
);

const {
  hashLegacyMemberPassword,
} = require(
  "../src/utils/password.utils"
);

const assert =
  (
    condition,
    message
  ) => {
    if (!condition) {
      const error =
        new Error(
          message
        );

      error.code =
        "REGISTRATION_SERVICE_TEST_FAILED";

      throw error;
    }
  };

const expectServiceError =
  async (
    callback,
    expectedCode
  ) => {
    try {
      await callback();
    } catch (error) {
      assert(
        error.code ===
          expectedCode,
        `Expected error ${expectedCode}, received ${error.code || "UNKNOWN"}.`
      );

      return error;
    }

    const error =
      new Error(
        `Expected service error ${expectedCode}, but no error was thrown.`
      );

    error.code =
      "EXPECTED_SERVICE_ERROR_MISSING";

    throw error;
  };

const createRunToken =
  () => {
    return crypto
      .randomBytes(6)
      .toString("hex");
  };

const createTestEmail =
  (
    label,
    runToken
  ) => {
    return `${label}.${runToken}@service-test.invalid`;
  };

const createTestPhone =
  (
    label,
    runToken
  ) => {
    return `${label}${runToken}`
      .slice(0, 25);
  };

/*
  Outer transaction எப்போதும் rollback.

  Test records database-ல்
  permanently save ஆகாது.
*/
const withRollbackOnlyTransaction =
  async (
    callback
  ) => {
    const connection =
      await pool.getConnection();

    try {
      await connection
        .beginTransaction();

      const result =
        await callback(
          connection
        );

      await connection
        .rollback();

      return result;
    } catch (error) {
      try {
        await connection
          .rollback();
      } catch (
        rollbackError
      ) {
        console.error(
          "Test rollback failed:",
          rollbackError.message
        );
      }

      throw error;
    } finally {
      connection.release();
    }
  };

/*
  Service-க்கு already-open test
  transaction connection கொடுக்கும்.

  Service commit/rollback செய்யாது.
  Outer test transaction final-ஆ
  rollback செய்யும்.
*/
const createExistingConnectionExecutor =
  (
    connection
  ) => {
    return async (
      callback
    ) => {
      return callback(
        connection
      );
    };
  };

const createSeedMember =
  async (
    {
      connection,
      runToken,
      label,

      email,
      phone,

      referredBy = null,
      referralId = null,
      aadhar = null,
    }
  ) => {
    const loginId =
      await generateUniqueLoginId({
        connection,
      });

    const insertResult =
      await registrationRepository
        .insertMemberRegistration(
          {
            first_name:
              "Service",

            last_name:
              label,

            email:
              email ||
              createTestEmail(
                label.toLowerCase(),
                runToken
              ),

            phone:
              phone ||
              createTestPhone(
                label,
                runToken
              ),

            membership_type:
              "Civilian Member",

            referred_by:
              referredBy,

            aadhar,

            token:
              generateMemberToken(),

            login_id:
              loginId,

            passwordHash:
              hashLegacyMemberPassword(
                "Test@123"
              ),
          },
          connection
        );

    let finalReferralId =
      referralId;

    if (
      referralId ===
      "GENERATE"
    ) {
      finalReferralId =
        await generateUniqueReferralId({
          connection,
        });
    }

    if (
      finalReferralId
    ) {
      await connection.query(
        `
          UPDATE
            kyc_members
          SET
            referral_id = ?
          WHERE
            id = ?
        `,
        [
          finalReferralId,
          insertResult.insertId,
        ]
      );
    }

    return {
      id:
        insertResult.insertId,

      loginId,

      referralId:
        finalReferralId,
    };
  };

const getTotalMemberCount =
  async () => {
    const [rows] =
      await pool.query(
        `
          SELECT
            COUNT(*) AS total
          FROM
            kyc_members
        `
      );

    return Number(
      rows[0]
        ?.total ||
      0
    );
  };

const runRegistrationServiceTest =
  async () => {
    const runToken =
      createRunToken();

    try {
      console.log(
        "Starting registration service test..."
      );

      await testDatabaseConnection();

      const beforeMemberCount =
        await getTotalMemberCount();

      console.log("");
      console.log(
        `Existing member count before test: ${beforeMemberCount}`
      );

      await withRollbackOnlyTransaction(
        async (
          connection
        ) => {
          const transactionExecutor =
            createExistingConnectionExecutor(
              connection
            );

          /*
            Create grand-referrer.
          */
          console.log("");
          console.log(
            "Creating temporary referral network..."
          );

          const grandReferrer =
            await createSeedMember({
              connection,
              runToken,
              label:
                "GrandReferrer",

              referralId:
                "GENERATE",
            });

          /*
            Create direct referrer.
          */
          const directReferrer =
            await createSeedMember({
              connection,
              runToken,
              label:
                "DirectReferrer",

              referredBy:
                grandReferrer
                  .referralId,

              referralId:
                "GENERATE",
            });

          assert(
            grandReferrer
              .referralId,
            "Grand-referrer referral ID missing."
          );

          assert(
            directReferrer
              .referralId,
            "Direct-referrer referral ID missing."
          );

          console.log(
            "Temporary referral network: created"
          );

          /*
            Successful normal member
            registration.
          */
          console.log("");
          console.log(
            "Testing successful member registration..."
          );

          const memberResult =
            await registrationService
              .registerMember(
                {
                  first_name:
                    "Registration",

                  last_name:
                    "Service Member",

                  father_name:
                    "Test Father",

                  dob:
                    "2000-01-01",

                  email:
                    createTestEmail(
                      "member",
                      runToken
                    ),

                  phone:
                    createTestPhone(
                      "MEM",
                      runToken
                    ),

                  pincode:
                    "625001",

                  gender:
                    "Male",

                  marital_status:
                    "Single",

                  nationality:
                    "Indian",

                  occupation:
                    "Developer",

                  education:
                    "Graduate",

                  membership_type:
                    "Civilian Member",

                  referral:
                    directReferrer
                      .referralId,

                  aadhar:
                    `AADHAAR-MEMBER-${runToken}`,

                  password:
                    "Test@123",

                  confirm_password:
                    "Test@123",
                },
                {
                  transactionExecutor,
                }
              );

          assert(
            memberResult.success ===
              true,
            "Member registration did not return success."
          );

          assert(
            /^\d{7}$/.test(
              memberResult.loginId
            ),
            "Member Login ID is invalid."
          );

          assert(
            memberResult
              .sessionData
              ?.new_login_id ===
              memberResult.loginId,
            "new_login_id session data is missing."
          );

          assert(
            memberResult
              .referral
              .referrerFound ===
              true,
            "Valid referrer was not found."
          );

          assert(
            memberResult
              .referral
              .directNetworkUpdated ===
              true,
            "Direct network was not updated."
          );

          assert(
            memberResult
              .referral
              .grandReferrerFound ===
              true,
            "Grand-referrer was not found."
          );

          assert(
            memberResult
              .referral
              .indirectNetworkUpdated ===
              true,
            "Indirect network was not updated."
          );

          assert(
            !Object.prototype
              .hasOwnProperty
              .call(
                memberResult.member,
                "token"
              ),
            "Member token leaked in service result."
          );

          assert(
            !Object.prototype
              .hasOwnProperty
              .call(
                memberResult.member,
                "password"
              ),
            "Member password leaked in service result."
          );

          const directSummary =
            await registrationRepository
              .findRegistrationSummaryById(
                directReferrer.id,
                connection
              );

          const grandSummary =
            await registrationRepository
              .findRegistrationSummaryById(
                grandReferrer.id,
                connection
              );

          assert(
            Number(
              directSummary
                .direct_network
            ) === 1,
            "Direct-referrer direct_network must be 1."
          );

          assert(
            Number(
              grandSummary
                .indirect_network
            ) === 1,
            "Grand-referrer indirect_network must be 1."
          );

          console.log(
            "Successful member registration: passed"
          );

          console.log(
            "new_login_id return data: passed"
          );

          console.log(
            "Direct network update: passed"
          );

          console.log(
            "Indirect network update: passed"
          );

          console.log(
            "Sensitive response filtering: passed"
          );

          /*
            Invalid referral should not
            block registration.
          */
          console.log("");
          console.log(
            "Testing invalid referral compatibility..."
          );

          const invalidReferralResult =
            await registrationService
              .registerMember(
                {
                  first_name:
                    "Invalid",

                  last_name:
                    "Referral Member",

                  email:
                    createTestEmail(
                      "invalid-referral",
                      runToken
                    ),

                  phone:
                    createTestPhone(
                      "INV",
                      runToken
                    ),

                  membership_type:
                    "Civilian Member",

                  referral:
                    "ZZZZZZZZ",

                  password:
                    "Test@123",

                  confirm_password:
                    "Test@123",
                },
                {
                  transactionExecutor,
                }
              );

          assert(
            invalidReferralResult
              .success ===
              true,
            "Invalid referral incorrectly blocked registration."
          );

          assert(
            invalidReferralResult
              .referral
              .referralProvided ===
              true,
            "Invalid referral submission was not recorded."
          );

          assert(
            invalidReferralResult
              .referral
              .referrerFound ===
              false,
            "Invalid referral unexpectedly found a member."
          );

          console.log(
            "Invalid referral registration success: passed"
          );

          /*
            Student registration.
          */
          console.log("");
          console.log(
            "Testing student registration..."
          );

          const studentResult =
            await registrationService
              .registerStudent(
                {
                  fullname:
                    "Registration Service Student",

                  first_name:
                    "Registration",

                  last_name:
                    "Service Student",

                  dob:
                    "2003-08-07",

                  gender:
                    "Male",

                  email:
                    createTestEmail(
                      "student",
                      runToken
                    ),

                  mobile:
                    createTestPhone(
                      "STU",
                      runToken
                    ),

                  phone:
                    createTestPhone(
                      "STU",
                      runToken
                    ),

                  education_level:
                    "UG",

                  school_name:
                    null,

                  school_class:
                    null,

                  board:
                    null,

                  school_city:
                    null,

                  ug_college:
                    "Service Test College",

                  ug_degree:
                    "BE",

                  ug_department:
                    "ECE",

                  ug_year:
                    "2025",

                  pg_college:
                    null,

                  pg_degree:
                    null,

                  pg_specialization:
                    null,

                  pg_semester:
                    null,

                  skills:
                    "React, Node.js",

                  student_id:
                    `STU-${runToken}`,

                  membership_type:
                    "Student Member",

                  payment_status:
                    "pending",
                },
                {
                  transactionExecutor,

                  uploadedFiles: {
                    marksheet: {
                      storedName:
                        `${runToken}_marksheet.pdf`,
                    },

                    bonafide: [
                      {
                        newFilename:
                          `${runToken}_bonafide.pdf`,
                      },
                    ],

                    govt_id: {
                      filepath:
                        `D:\\temporary\\${runToken}_govt-id.pdf`,
                    },
                  },
                }
              );

          assert(
            studentResult.success ===
              true,
            "Student registration did not return success."
          );

          assert(
            studentResult
              .member
              .membership_type ===
              "Student Member",
            "Student membership type is incorrect."
          );

          assert(
            studentResult
              .member
              .payment_status ===
              "pending",
            "Student payment status must be pending."
          );

          assert(
            studentResult
              .sessionData ===
              null,
            "Student registration should not create new_login_id session data."
          );

          assert(
            studentResult
              .uploadedFiles
              .marksheet ===
              `${runToken}_marksheet.pdf`,
            "Marksheet filename mapping failed."
          );

          assert(
            studentResult
              .uploadedFiles
              .bonafide ===
              `${runToken}_bonafide.pdf`,
            "Bonafide filename mapping failed."
          );

          assert(
            studentResult
              .uploadedFiles
              .govt_id ===
              `${runToken}_govt-id.pdf`,
            "Government ID filename mapping failed."
          );

          const [
            studentFileRows,
          ] =
            await connection.query(
              `
                SELECT
                  marksheet,
                  bonafide,
                  govt_id
                FROM
                  kyc_members
                WHERE
                  id = ?
                LIMIT 1
              `,
              [
                studentResult
                  .member
                  .id,
              ]
            );

          assert(
            studentFileRows[0]
              .marksheet ===
              `${runToken}_marksheet.pdf`,
            "Marksheet filename was not saved."
          );

          assert(
            studentFileRows[0]
              .bonafide ===
              `${runToken}_bonafide.pdf`,
            "Bonafide filename was not saved."
          );

          assert(
            studentFileRows[0]
              .govt_id ===
              `${runToken}_govt-id.pdf`,
            "Government ID filename was not saved."
          );

          console.log(
            "Student registration: passed"
          );

          console.log(
            "Student pending payment status: passed"
          );

          console.log(
            "Student upload filename mapping: passed"
          );

          /*
            Duplicate Aadhaar.
          */
          console.log("");
          console.log(
            "Testing duplicate Aadhaar rejection..."
          );

          const duplicateAadhar =
            `AADHAAR-DUPLICATE-${runToken}`;

          await createSeedMember({
            connection,
            runToken,
            label:
              "AadhaarSeed",

            aadhar:
              duplicateAadhar,
          });

          const duplicateAadharError =
            await expectServiceError(
              () =>
                registrationService
                  .registerMember(
                    {
                      first_name:
                        "Duplicate",

                      last_name:
                        "Aadhaar",

                      email:
                        createTestEmail(
                          "duplicate-aadhaar",
                          runToken
                        ),

                      phone:
                        createTestPhone(
                          "AAD",
                          runToken
                        ),

                      membership_type:
                        "Civilian Member",

                      aadhar:
                        duplicateAadhar,

                      password:
                        "Test@123",

                      confirm_password:
                        "Test@123",
                    },
                    {
                      transactionExecutor,
                    }
                  ),

              "AADHAAR_ALREADY_REGISTERED"
            );

          assert(
            duplicateAadharError
              .statusCode ===
              409,
            "Duplicate Aadhaar status code must be 409."
          );

          console.log(
            "Duplicate Aadhaar rejection: passed"
          );

          /*
            Account limit:
            same email + phone = 3 records.
          */
          console.log("");
          console.log(
            "Testing three-account limit..."
          );

          const limitedEmail =
            createTestEmail(
              "limited",
              runToken
            );

          const limitedPhone =
            createTestPhone(
              "LIM",
              runToken
            );

          for (
            let accountIndex = 1;
            accountIndex <= 3;
            accountIndex += 1
          ) {
            await createSeedMember({
              connection,
              runToken,
              label:
                `Limited${accountIndex}`,

              email:
                limitedEmail,

              phone:
                limitedPhone,
            });
          }

          const accountLimitError =
            await expectServiceError(
              () =>
                registrationService
                  .registerMember(
                    {
                      first_name:
                        "Fourth",

                      last_name:
                        "Account",

                      email:
                        limitedEmail,

                      phone:
                        limitedPhone,

                      membership_type:
                        "Civilian Member",

                      password:
                        "Test@123",

                      confirm_password:
                        "Test@123",
                    },
                    {
                      transactionExecutor,
                    }
                  ),

              "ACCOUNT_LIMIT_EXCEEDED"
            );

          assert(
            accountLimitError
              .statusCode ===
              409,
            "Account-limit status code must be 409."
          );

          console.log(
            "Three-account limit rejection: passed"
          );
        }
      );

      /*
        Outer transaction rollback
        முடிந்த பிறகு original count
        unchanged இருக்க வேண்டும்.
      */
      const afterMemberCount =
        await getTotalMemberCount();

      assert(
        afterMemberCount ===
          beforeMemberCount,
        `Member count changed from ${beforeMemberCount} to ${afterMemberCount}.`
      );

      console.log("");
      console.log(
        "Rollback cleanup verification: passed"
      );

      console.log(
        `Existing member count after test: ${afterMemberCount}`
      );

      console.log("");
      console.log(
        "Registration service test completed successfully."
      );

      console.log(
        "No test records remain in the database."
      );
    } catch (error) {
      console.error("");
      console.error(
        "Registration service test failed."
      );

      console.error(
        `Code: ${
          error.code ||
          "UNKNOWN"
        }`
      );

      console.error(
        `Status: ${
          error.statusCode ||
          "UNKNOWN"
        }`
      );

      console.error(
        `Message: ${error.message}`
      );

      if (
        Array.isArray(
          error.errors
        ) &&
        error.errors.length
      ) {
        console.dir(
          error.errors,
          {
            depth:
              null,
          }
        );
      }

      process.exitCode =
        1;
    } finally {
      await closeDatabaseConnection();
    }
  };

runRegistrationServiceTest();