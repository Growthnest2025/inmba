const express =
  require("express");

const {
  registerProfessionalMember,
} =
  require(
    "../controllers/professionalRegistration.controller"
  );

const router =
  express.Router();

router.post(
  "/",
  registerProfessionalMember
);

module.exports =
  router;