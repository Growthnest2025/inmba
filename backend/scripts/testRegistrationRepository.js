require(
  "dotenv"
).config();

const crypto =
  require("crypto");

const {
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
  generateUniqueLoginId,
  generateReferralIdCandidate,
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
  generateLegacyStudentPasswordHash,
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
        "REGISTRATION_REPOSITORY_TEST_FAILED";

      throw error;
    }
  };

const createTestEmail =
  (
    label,
    runToken
  ) => {
    return `${label}.${runToken}@repository-test.invalid`;
  };

const createTestPhone =
  (
    suffix
  ) => {
    return `TEST${suffix}`;
  };

const runRepositoryTest =
  async () => {
    const runToken =
      crypto
        .randomBytes(5)
        .toString("hex");

    const createdLoginIds =
      [];

    try {
      console.log(
        "Starting registration repository test..."
      );

      await testDatabaseConnection();

      /*
        Read-only account-limit test.
      */
      console.log("");
      console.log(
        "Testing account count query..."
      );

      const unknownAccountCount =
        await registrationRepository
          .countAccountsByEmailAndPhone({
            email:
              createTestEmail(
                "account",
                runToken
              ),

            phone:
              createTestPhone(
                runToken
              ),
          });

      assert(
        unknownAccountCount ===
          0,
        "Unknown email and phone count must be zero."
      );

      console.log(
        "Account count query: passed"
      );

      /*
        Read-only Aadhaar duplicate query.
      */
      console.log("");
      console.log(
        "Testing Aadhaar duplicate query..."
      );

      const unknownAadhar =
        `TEST-AADHAAR-${runToken}`;

      const aadharMember =
        await registrationRepository
          .findMemberByAadhar(
            unknownAadhar
          );

      assert(
        aadharMember ===
          null,
        "Unknown Aadhaar should not return a member."
      );

      console.log(
        "Aadhaar duplicate query: passed"
      );

      /*
        Unknown referral should not fail.
      */
      console.log("");
      console.log(
        "Testing unknown referral query..."
      );

      const unknownReferral =
        await registrationRepository
          .findReferrerByReferralId(
            `ZZ${runToken}`
              .slice(0, 8)
              .toUpperCase()
          );

      assert(
        unknownReferral ===
          null,
        "Unknown referral should return null."
      );

      console.log(
        "Unknown referral query: passed"
      );

      /*
        Full insert + referral network +
        student insert transaction test.

        Final error intentional.
        Repository transaction rollback
        செய்ய வேண்டும்.
      */
      console.log("");
      console.log(
        "Testing transaction inserts and referral network..."
      );

      try {
        await registrationRepository
          .withRegistrationTransaction(
            async (
              connection
            ) => {
              /*
                Temporary grand-referrer.
              */
              const grandLoginId =
                await generateUniqueLoginId({
                  connection,
                });

              createdLoginIds.push(
                grandLoginId
              );

              const grandInsert =
                await registrationRepository
                  .insertMemberRegistration(
                    {
                      first_name:
                        "Repository",

                      last_name:
                        "Grand Referrer",

                      email:
                        createTestEmail(
                          "grand",
                          runToken
                        ),

                      phone:
                        createTestPhone(
                          `G${runToken}`
                        ),

                      membership_type:
                        "Civilian Member",

                      token:
                        generateMemberToken(),

                      login_id:
                        grandLoginId,

                      passwordHash:
                        hashLegacyMemberPassword(
                          "Test@123"
                        ),
                    },
                    connection
                  );

              const grandReferralId =
                generateReferralIdCandidate();

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
                  grandReferralId,
                  grandInsert
                    .insertId,
                ]
              );

              /*
                Temporary direct referrer.
              */
              const referrerLoginId =
                await generateUniqueLoginId({
                  connection,
                });

              createdLoginIds.push(
                referrerLoginId
              );

              const referrerInsert =
                await registrationRepository
                  .insertMemberRegistration(
                    {
                      first_name:
                        "Repository",

                      last_name:
                        "Direct Referrer",

                      email:
                        createTestEmail(
                          "referrer",
                          runToken
                        ),

                      phone:
                        createTestPhone(
                          `R${runToken}`
                        ),

                      membership_type:
                        "Civilian Member",

                      referred_by:
                        grandReferralId,

                      token:
                        generateMemberToken(),

                      login_id:
                        referrerLoginId,

                      passwordHash:
                        hashLegacyMemberPassword(
                          "Test@123"
                        ),
                    },
                    connection
                  );

              const referrerReferralId =
                generateReferralIdCandidate();

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
                  referrerReferralId,
                  referrerInsert
                    .insertId,
                ]
              );

              /*
                Temporary newly registered
                normal member.
              */
              const memberLoginId =
                await generateUniqueLoginId({
                  connection,
                });

              createdLoginIds.push(
                memberLoginId
              );

              const memberInsert =
                await registrationRepository
                  .insertMemberRegistration(
                    {
                      first_name:
                        "Repository",

                      last_name:
                        "New Member",

                      dob:
                        "2000-01-01",

                      email:
                        createTestEmail(
                          "member",
                          runToken
                        ),

                      phone:
                        createTestPhone(
                          `M${runToken}`
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
                        "Testing",

                      education:
                        "Graduate",

                      membership_type:
                        "Civilian Member",

                      referred_by:
                        referrerReferralId,

                      aadhar:
                        null,

                      token:
                        generateMemberToken(),

                      login_id:
                        memberLoginId,

                      passwordHash:
                        hashLegacyMemberPassword(
                          "Test@123"
                        ),
                    },
                    connection
                  );

              assert(
                memberInsert
                  .insertId > 0,
                "Normal member insert failed."
              );

              const networkResult =
                await registrationRepository
                  .applyReferralNetworkUpdates(
                    referrerReferralId,
                    connection
                  );

              assert(
                networkResult
                  .referrerFound ===
                  true,
                "Direct referrer was not found."
              );

              assert(
                networkResult
                  .directNetworkUpdated ===
                  true,
                "Direct network count was not updated."
              );

              assert(
                networkResult
                  .grandReferrerFound ===
                  true,
                "Grand-referrer was not found."
              );

              assert(
                networkResult
                  .indirectNetworkUpdated ===
                  true,
                "Indirect network count was not updated."
              );

              const referrerSummary =
                await registrationRepository
                  .findRegistrationSummaryById(
                    referrerInsert
                      .insertId,
                    connection
                  );

              const grandSummary =
                await registrationRepository
                  .findRegistrationSummaryById(
                    grandInsert
                      .insertId,
                    connection
                  );

              assert(
                Number(
                  referrerSummary
                    .direct_network
                ) === 1,
                "Referrer direct_network must be 1."
              );

              assert(
                Number(
                  grandSummary
                    .indirect_network
                ) === 1,
                "Grand-referrer indirect_network must be 1."
              );

              /*
                Temporary student insert.
              */
              const studentLoginId =
                await generateUniqueLoginId({
                  connection,
                });

              createdLoginIds.push(
                studentLoginId
              );

              const studentInsert =
                await registrationRepository
                  .insertStudentRegistration(
                    {
                      first_name:
                        "Repository",

                      last_name:
                        "Student",

                      dob:
                        "2003-08-07",

                      email:
                        createTestEmail(
                          "student",
                          runToken
                        ),

                      phone:
                        createTestPhone(
                          `S${runToken}`
                        ),

                      gender:
                        "Male",

                      education_level:
                        "UG",

                      ug_college:
                        "Repository Test College",

                      ug_degree:
                        "BE",

                      ug_department:
                        "ECE",

                      ug_year:
                        "2025",

                      skills:
                        "React, Node.js",

                      student_id:
                        `STU-${runToken}`,

                      membership_type:
                        "Student Member",

                      token:
                        generateMemberToken(),

                      login_id:
                        studentLoginId,

                      passwordHash:
                        generateLegacyStudentPasswordHash(),

                      payment_status:
                        "pending",

                      marksheet:
                        null,

                      bonafide:
                        null,

                      govt_id:
                        null,
                    },
                    connection
                  );

              assert(
                studentInsert
                  .insertId > 0,
                "Student member insert failed."
              );

              const studentSummary =
                await registrationRepository
                  .findRegistrationSummaryById(
                    studentInsert
                      .insertId,
                    connection
                  );

              assert(
                studentSummary
                  .membership_type ===
                  "Student Member",
                "Student membership type was not saved."
              );

              assert(
                studentSummary
                  .payment_status ===
                  "pending",
                "Student payment status was not saved."
              );

              /*
                Intentional error:
                transaction rollback test.
              */
              const rollbackError =
                new Error(
                  "Intentional registration repository test rollback."
                );

              rollbackError.code =
                "EXPECTED_TEST_ROLLBACK";

              throw rollbackError;
            }
          );

        throw new Error(
          "Transaction should have rolled back but it committed."
        );
      } catch (error) {
        if (
          error.code !==
          "EXPECTED_TEST_ROLLBACK"
        ) {
          throw error;
        }

        console.log(
          "Intentional transaction rollback: passed"
        );
      }

      /*
        Rollback பிறகு temporary records
        database-ல் இருக்கக்கூடாது.
      */
      for (
        const loginId of
        createdLoginIds
      ) {
        const member =
          await registrationRepository
            .findRegistrationSummaryByLoginId(
              loginId
            );

        assert(
          member === null,
          `Rolled-back member ${loginId} still exists.`
        );
      }

      console.log(
        "Normal member insert: passed"
      );

      console.log(
        "Student member insert: passed"
      );

      console.log(
        "Direct network update: passed"
      );

      console.log(
        "Indirect network update: passed"
      );

      console.log(
        "Rollback cleanup verification: passed"
      );

      console.log("");
      console.log(
        "Registration repository test completed successfully."
      );

      console.log(
        "No test records remain in the database."
      );
    } catch (error) {
      console.error("");
      console.error(
        "Registration repository test failed."
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

runRepositoryTest();