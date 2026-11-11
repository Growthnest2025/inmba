require(
  "dotenv"
).config();

const {
  validateMemberRegistration,
} = require(
  "../src/validators/registration.validator"
);

const {
  validateStudentRegistration,
} = require(
  "../src/validators/studentRegistration.validator"
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
        "VALIDATION_TEST_FAILED";

      throw error;
    }
  };

const runValidationTest =
  async () => {
    try {
      console.log(
        "Starting registration validation test..."
      );

      /*
        Normal member success.
      */
      console.log("");
      console.log(
        "Testing valid member registration..."
      );

      const validMember =
        validateMemberRegistration({
          first_name:
            "Vignesh",

          last_name:
            "M",

          email:
            "VIGNESH@EXAMPLE.COM",

          phone:
            "9876543210",

          membership_type:
            "Civilian Member",

          referral:
            "ab12cd34",

          password:
            "Test@123",

          confirm_password:
            "Test@123",
        });

      assert(
        validMember.valid ===
          true,
        "Valid member registration was rejected."
      );

      assert(
        validMember.data
          .email ===
          "vignesh@example.com",
        "Member email normalization failed."
      );

      assert(
        validMember.data
          .referral ===
          "AB12CD34",
        "Referral normalization failed."
      );

      console.log(
        "Valid member registration: passed"
      );

      /*
        Password mismatch.
      */
      console.log("");
      console.log(
        "Testing password mismatch..."
      );

      const mismatchMember =
        validateMemberRegistration({
          membership_type:
            "Civilian Member",

          password:
            "Test@123",

          confirm_password:
            "Wrong@123",
        });

      assert(
        mismatchMember.valid ===
          false,
        "Password mismatch was accepted."
      );

      assert(
        mismatchMember.errors
          .some(
            (error) =>
              error.code ===
              "PASSWORD_MISMATCH"
          ),
        "Password mismatch error missing."
      );

      console.log(
        "Password mismatch rejection: passed"
      );

      /*
        Honor membership block.
      */
      console.log("");
      console.log(
        "Testing Honor membership blocking..."
      );

      const honorMember =
        validateMemberRegistration({
          membership_type:
            "Honour Member",

          password:
            "Test@123",

          confirm_password:
            "Test@123",
        });

      assert(
        honorMember.valid ===
          false,
        "Honor membership was accepted."
      );

      assert(
        honorMember.errors
          .some(
            (error) =>
              error.code ===
              "HONOR_MEMBERSHIP_BLOCKED"
          ),
        "Honor membership error missing."
      );

      console.log(
        "Honor membership blocking: passed"
      );

      /*
        Member password required.
      */
      console.log("");
      console.log(
        "Testing missing password..."
      );

      const missingPassword =
        validateMemberRegistration({
          membership_type:
            "Civilian Member",
        });

      assert(
        missingPassword.valid ===
          false,
        "Missing password was accepted."
      );

      assert(
        missingPassword.errors
          .some(
            (error) =>
              error.code ===
              "PASSWORD_REQUIRED"
          ),
        "Password-required error missing."
      );

      console.log(
        "Missing password rejection: passed"
      );

      /*
        Student success.
      */
      console.log("");
      console.log(
        "Testing valid student registration..."
      );

      const validStudent =
        validateStudentRegistration({
          fullname:
            "Vignesh M Kumar",

          email:
            "STUDENT@EXAMPLE.COM",

          mobile:
            "9876543210",

          education_level:
            "UG",

          ug_college:
            "Example College",

          referral_token:
            "xy12za90",
        });

      assert(
        validStudent.valid ===
          true,
        "Valid student registration was rejected."
      );

      assert(
        validStudent.data
          .first_name ===
          "Vignesh",
        "Student first-name split failed."
      );

      assert(
        validStudent.data
          .last_name ===
          "M Kumar",
        "Student last-name split failed."
      );

      assert(
        validStudent.data
          .membership_type ===
          "Student Member",
        "Student membership type failed."
      );

      assert(
        validStudent.data
          .payment_status ===
          "pending",
        "Student payment status failed."
      );

      console.log(
        "Valid student registration: passed"
      );

      /*
        Student required fields.
      */
      console.log("");
      console.log(
        "Testing student required fields..."
      );

      const invalidStudent =
        validateStudentRegistration({
          education_level:
            "UG",
        });

      assert(
        invalidStudent.valid ===
          false,
        "Student without name/email/mobile was accepted."
      );

      assert(
        invalidStudent.errors
          .length === 3,
        "Student required-field error count must be 3."
      );

      console.log(
        "Student required fields: passed"
      );

      /*
        Formidable array field support.
      */
      console.log("");
      console.log(
        "Testing Formidable array fields..."
      );

      const formidableStudent =
        validateStudentRegistration({
          fullname: [
            "Student Name",
          ],

          email: [
            "student@example.com",
          ],

          mobile: [
            "9000000000",
          ],

          skills: [
            "React, Node.js",
          ],
        });

      assert(
        formidableStudent.valid ===
          true,
        "Formidable array field validation failed."
      );

      assert(
        formidableStudent.data
          .skills ===
          "React, Node.js",
        "Formidable field normalization failed."
      );

      console.log(
        "Formidable array fields: passed"
      );

      console.log("");
      console.log(
        "Registration validation test completed successfully."
      );

      console.log(
        "No database records were inserted, updated or deleted."
      );
    } catch (error) {
      console.error("");
      console.error(
        "Registration validation test failed."
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
    }
  };

runValidationTest();