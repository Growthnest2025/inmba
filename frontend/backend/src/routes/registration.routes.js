const express = require("express");
const {
  registerMemberController,
  registerStudentController,
} = require("../controllers/registration.controller");
const { validateRequest } = require("../middleware/validation.middleware");
const {
  parseMemberRegistrationForm,
  parseStudentRegistrationForm,
} = require("../middleware/fileUpload.middleware");
const {
  validateMemberRegistration,
} = require("../validators/registration.validator");
const {
  validateStudentRegistration,
} = require("../validators/studentRegistration.validator");

const router = express.Router();

router.post(
  "/register",
  parseMemberRegistrationForm,
  validateRequest(validateMemberRegistration),
  registerMemberController
);

router.post(
  "/student",
  parseStudentRegistrationForm,
  validateRequest(validateStudentRegistration),
  registerStudentController
);

module.exports = router;
