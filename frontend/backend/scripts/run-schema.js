require(
  "dotenv"
).config();

const {
  runSchemaBootstrap,
} = require(
  "../src/database/schemaBootstrap"
);

const run = async () => {
  try {
    const report =
      await runSchemaBootstrap();

    console.log(
      JSON.stringify(
        report,
        null,
        2
      )
    );

    process.exit(
      0
    );
  } catch (error) {
    console.error(
      "Schema migration failed:"
    );

    console.error(
      error.stack ||
      error.message
    );

    if (
      error.schemaReport
    ) {
      console.error(
        JSON.stringify(
          error.schemaReport,
          null,
          2
        )
      );
    }

    process.exit(
      1
    );
  }
};

run();