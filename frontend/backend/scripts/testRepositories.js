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
  memberRepository,
  adminRepository,
  eventRepository,
} = require(
  "../src/repositories"
);

const runRepositoryTest =
  async () => {
    try {
      console.log(
        "Starting INMBA repository test..."
      );

      await testDatabaseConnection();

      console.log("");
      console.log(
        "Testing member repository..."
      );

      const memberCounts =
        await memberRepository
          .getMemberCounts();

      const memberSample =
        await memberRepository
          .findFirstMemberSummary();

      console.log(
        "Member counts:"
      );

      console.dir(
        memberCounts,
        {
          depth:
            null,
        }
      );

      console.log(
        "Safe member sample:"
      );

      console.dir(
        memberSample,
        {
          depth:
            null,
        }
      );

      console.log("");
      console.log(
        "Testing admin repository..."
      );

      const adminCounts =
        await adminRepository
          .getAdminCounts();

      const adminSample =
        await adminRepository
          .findFirstAdminSummary();

      console.log(
        "Admin counts:"
      );

      console.dir(
        adminCounts,
        {
          depth:
            null,
        }
      );

      console.log(
        "Safe admin sample:"
      );

      console.dir(
        adminSample,
        {
          depth:
            null,
        }
      );

      console.log("");
      console.log(
        "Testing event repository..."
      );

      const eventCount =
        await eventRepository
          .getEventCount();

      const eventSample =
        await eventRepository
          .findFirstEventSummary();

      console.log(
        "Event count:"
      );

      console.log(
        eventCount
      );

      console.log(
        "Safe event sample:"
      );

      console.dir(
        eventSample,
        {
          depth:
            null,
        }
      );

      console.log("");
      console.log(
        "Repository test completed successfully."
      );

      console.log(
        "No database records were changed."
      );
    } catch (error) {
      console.error("");
      console.error(
        "Repository test failed."
      );

      console.error(
        `Code: ${
          error.code ||
          "UNKNOWN"
        }`
      );

      console.error(
        `Message: ${
          error.message
        }`
      );

      process.exitCode =
        1;
    } finally {
      await closeDatabaseConnection();
    }
  };

runRepositoryTest();