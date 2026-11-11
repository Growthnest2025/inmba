require(
  "dotenv"
).config();

const {
  inspectSchema,
} = require(
  "../src/database/schemaBootstrap"
);

const check = async () => {
  try {
    const report =
      await inspectSchema();

    console.log(
      JSON.stringify(
        report,
        null,
        2
      )
    );

    process.exit(
      report.ready
        ? 0
        : 1
    );
  } catch (error) {
    console.error(
      error.stack ||
      error.message
    );

    process.exit(
      1
    );
  }
};

check();