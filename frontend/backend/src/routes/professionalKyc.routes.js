const express =
  require(
    "express"
  );

const {
  getProfessionalKycController,

  getProfessionalKycSectionController,

  getProfessionalKycProgressController,

  getProfessionalNetworkController,

  saveProfessionalKycPlanController,

  saveProfessionalKycSectionController,

  saveSectionAController,

  saveSectionBController,

  saveSectionCController,

  saveSectionDController,

  saveSectionEController,

  saveSectionFController,

  saveSectionGController,

  saveSectionHController,

  saveSectionIController,

  saveSectionJController,

  saveProfessionalKycConsentController,

  submitProfessionalKycController,

  reopenProfessionalKycController,
} =
  require(
    "../controllers/professionalKyc.controller"
  );

const {
  parseProfessionalKycUpload,

  parseProfessionalKycSectionUpload,
} =
  require(
    "../middleware/professionalKycUpload.middleware"
  );

const router =
  express.Router();

/* =========================================================
   PROFESSIONAL KYC ROUTES

   Base URL:

   /api/professional-kyc

   Supports:
   - Logged-in member session
   - Existing token-based KYC flow
   - JSON requests
   - multipart/form-data file uploads
========================================================= */


/* =========================================================
   MODULE INFO

   GET
   /api/professional-kyc/info
========================================================= */

router.get(
  "/info",
  (
    req,
    res
  ) => {
    return res
      .status(
        200
      )
      .json({
        success:
          true,

        statusCode:
          200,

        message:
          "Professional KYC module is available.",

        data: {
          membershipType:
            "Professional Member",

          sections: [
            "A",
            "B",
            "C",
            "D",
            "E",
            "F",
            "G",
            "H",
            "I",
            "J",
          ],

          sectionTitles: {
            A:
              "Identity & KYC",

            B:
              "Contact & Address",

            C:
              "Legal & Professional Compliance",

            D:
              "Education & Qualification",

            E:
              "Achievements & Certifications",

            F:
              "Work Experience & Portfolio",

            G:
              "Interest, Skills & Bio",

            H:
              "Financial & Bank",

            I:
              "Network / Royalty Details",

            J:
              "Emergency & Nominee",
          },
        },
      });
  }
);


/* =========================================================
   SESSION-BASED MEMBER ROUTES
========================================================= */


/* =========================================================
   GET FULL PROFESSIONAL KYC

   GET
   /api/professional-kyc
========================================================= */

router.get(
  "/",
  getProfessionalKycController
);


/* =========================================================
   GET PROFESSIONAL KYC PROGRESS

   GET
   /api/professional-kyc/progress
========================================================= */

router.get(
  "/progress",
  getProfessionalKycProgressController
);


/* =========================================================
   GET NETWORK / ROYALTY

   GET
   /api/professional-kyc/network
========================================================= */

router.get(
  "/network",
  getProfessionalNetworkController
);


/* =========================================================
   SAVE PROFESSIONAL MEMBERSHIP PLAN

   PATCH
   /api/professional-kyc/plan
========================================================= */

router.patch(
  "/plan",
  saveProfessionalKycPlanController
);


/* =========================================================
   GET SINGLE SECTION

   GET
   /api/professional-kyc/sections/A

   GET
   /api/professional-kyc/sections/B

   ...

   GET
   /api/professional-kyc/sections/J
========================================================= */

router.get(
  "/sections/:section",
  getProfessionalKycSectionController
);


/* =========================================================
   GENERIC SAVE SECTION

   PATCH
   /api/professional-kyc/sections/:section

   Supports:
   - application/json
   - multipart/form-data

   JSON Example:

   {
     "values": {
       "first_name": "Vignesh"
     },
     "completed": false
   }

   Multipart:
   - text fields
   - values JSON field
   - document uploads

   completed false:
   Save Draft

   completed true:
   Save & Next
========================================================= */

router.patch(
  "/sections/:section",

  parseProfessionalKycUpload,

  saveProfessionalKycSectionController
);


/* =========================================================
   SECTION A
   IDENTITY & KYC

   Upload fields:

   aadhar_front
   aadhar_back
   pan_front

   PATCH
   /api/professional-kyc/sections/A/save
========================================================= */

router.patch(
  "/sections/A/save",

  parseProfessionalKycSectionUpload(
    "A"
  ),

  saveSectionAController
);

router.patch(
  "/sections/a/save",

  parseProfessionalKycSectionUpload(
    "A"
  ),

  saveSectionAController
);


/* =========================================================
   SECTION B
   CONTACT & ADDRESS

   Upload:

   address_proof
========================================================= */

router.patch(
  "/sections/B/save",

  parseProfessionalKycSectionUpload(
    "B"
  ),

  saveSectionBController
);

router.patch(
  "/sections/b/save",

  parseProfessionalKycSectionUpload(
    "B"
  ),

  saveSectionBController
);


/* =========================================================
   SECTION C
   LEGAL & PROFESSIONAL COMPLIANCE

   Uploads:

   professional_license_document
   council_registration_document
   professional_indemnity_insurance
   firm_pan_document
   professional_gst_document
========================================================= */

router.patch(
  "/sections/C/save",

  parseProfessionalKycSectionUpload(
    "C"
  ),

  saveSectionCController
);

router.patch(
  "/sections/c/save",

  parseProfessionalKycSectionUpload(
    "C"
  ),

  saveSectionCController
);


/* =========================================================
   SECTION D
   EDUCATION & QUALIFICATION

   Upload:

   education_certificate
========================================================= */

router.patch(
  "/sections/D/save",

  parseProfessionalKycSectionUpload(
    "D"
  ),

  saveSectionDController
);

router.patch(
  "/sections/d/save",

  parseProfessionalKycSectionUpload(
    "D"
  ),

  saveSectionDController
);


/* =========================================================
   SECTION E
   ACHIEVEMENTS & CERTIFICATIONS

   Upload:

   reference_letters
========================================================= */

router.patch(
  "/sections/E/save",

  parseProfessionalKycSectionUpload(
    "E"
  ),

  saveSectionEController
);

router.patch(
  "/sections/e/save",

  parseProfessionalKycSectionUpload(
    "E"
  ),

  saveSectionEController
);


/* =========================================================
   SECTION F
   WORK EXPERIENCE & PORTFOLIO

   Uploads:

   work_samples
   resume_cv
========================================================= */

router.patch(
  "/sections/F/save",

  parseProfessionalKycSectionUpload(
    "F"
  ),

  saveSectionFController
);

router.patch(
  "/sections/f/save",

  parseProfessionalKycSectionUpload(
    "F"
  ),

  saveSectionFController
);


/* =========================================================
   SECTION G
   INTEREST, SKILLS & BIO

   PUBLIC MEDIA:

   profile_pic
   cover_photo
   gallery_photos
   intro_video
========================================================= */

router.patch(
  "/sections/G/save",

  parseProfessionalKycSectionUpload(
    "G"
  ),

  saveSectionGController
);

router.patch(
  "/sections/g/save",

  parseProfessionalKycSectionUpload(
    "G"
  ),

  saveSectionGController
);


/* =========================================================
   SECTION H
   FINANCIAL & BANK

   PRIVATE UPLOADS:

   bank_proof
   income_tax_declaration
   nomini_id_document
========================================================= */

router.patch(
  "/sections/H/save",

  parseProfessionalKycSectionUpload(
    "H"
  ),

  saveSectionHController
);

router.patch(
  "/sections/h/save",

  parseProfessionalKycSectionUpload(
    "H"
  ),

  saveSectionHController
);


/* =========================================================
   SECTION I
   NETWORK / ROYALTY

   No file upload fields.

   Multipart text requests are still parsed safely.
   Any unsupported file will be rejected.
========================================================= */

router.patch(
  "/sections/I/save",

  parseProfessionalKycSectionUpload(
    "I"
  ),

  saveSectionIController
);

router.patch(
  "/sections/i/save",

  parseProfessionalKycSectionUpload(
    "I"
  ),

  saveSectionIController
);


/* =========================================================
   SECTION J
   EMERGENCY & NOMINEE

   No file uploads required.
========================================================= */

router.patch(
  "/sections/J/save",

  parseProfessionalKycSectionUpload(
    "J"
  ),

  saveSectionJController
);

router.patch(
  "/sections/j/save",

  parseProfessionalKycSectionUpload(
    "J"
  ),

  saveSectionJController
);


/* =========================================================
   SAVE PRIVACY + DECLARATION CONSENT

   PATCH
   /api/professional-kyc/consent

   Body:

   {
     "privacyConsent": true,
     "declarationAccepted": true
   }
========================================================= */

router.patch(
  "/consent",
  saveProfessionalKycConsentController
);


/* =========================================================
   FINAL SUBMIT

   POST
   /api/professional-kyc/submit

   Body:

   {
     "privacyConsent": true,
     "declarationAccepted": true
   }
========================================================= */

router.post(
  "/submit",
  submitProfessionalKycController
);


/* =========================================================
   REOPEN REJECTED PROFESSIONAL KYC

   POST
   /api/professional-kyc/reopen
========================================================= */

router.post(
  "/reopen",
  reopenProfessionalKycController
);


/* =========================================================
   TOKEN-BASED PROFESSIONAL KYC ROUTES

   Existing INMBA token flow.

   Example:

   /api/professional-kyc/token/:token
========================================================= */


/* =========================================================
   GET FULL KYC BY TOKEN

   GET
   /api/professional-kyc/token/:token
========================================================= */

router.get(
  "/token/:token",

  getProfessionalKycController
);


/* =========================================================
   GET PROGRESS BY TOKEN

   GET
   /api/professional-kyc/token/:token/progress
========================================================= */

router.get(
  "/token/:token/progress",

  getProfessionalKycProgressController
);


/* =========================================================
   GET NETWORK BY TOKEN

   GET
   /api/professional-kyc/token/:token/network
========================================================= */

router.get(
  "/token/:token/network",

  getProfessionalNetworkController
);


/* =========================================================
   SAVE PLAN BY TOKEN

   PATCH
   /api/professional-kyc/token/:token/plan
========================================================= */

router.patch(
  "/token/:token/plan",

  saveProfessionalKycPlanController
);


/* =========================================================
   GET SECTION BY TOKEN

   GET
   /api/professional-kyc/token/:token/sections/A
========================================================= */

router.get(
  "/token/:token/sections/:section",

  getProfessionalKycSectionController
);


/* =========================================================
   GENERIC SAVE SECTION BY TOKEN

   PATCH
   /api/professional-kyc/token/:token/sections/A

   Supports JSON + multipart.
========================================================= */

router.patch(
  "/token/:token/sections/:section",

  parseProfessionalKycUpload,

  saveProfessionalKycSectionController
);


/* =========================================================
   TOKEN SECTION A

   Aadhaar + PAN
========================================================= */

router.patch(
  "/token/:token/sections/A/save",

  parseProfessionalKycSectionUpload(
    "A"
  ),

  saveSectionAController
);

router.patch(
  "/token/:token/sections/a/save",

  parseProfessionalKycSectionUpload(
    "A"
  ),

  saveSectionAController
);


/* =========================================================
   TOKEN SECTION B

   Address Proof
========================================================= */

router.patch(
  "/token/:token/sections/B/save",

  parseProfessionalKycSectionUpload(
    "B"
  ),

  saveSectionBController
);

router.patch(
  "/token/:token/sections/b/save",

  parseProfessionalKycSectionUpload(
    "B"
  ),

  saveSectionBController
);


/* =========================================================
   TOKEN SECTION C

   Legal / Compliance Documents
========================================================= */

router.patch(
  "/token/:token/sections/C/save",

  parseProfessionalKycSectionUpload(
    "C"
  ),

  saveSectionCController
);

router.patch(
  "/token/:token/sections/c/save",

  parseProfessionalKycSectionUpload(
    "C"
  ),

  saveSectionCController
);


/* =========================================================
   TOKEN SECTION D

   Education Certificate
========================================================= */

router.patch(
  "/token/:token/sections/D/save",

  parseProfessionalKycSectionUpload(
    "D"
  ),

  saveSectionDController
);

router.patch(
  "/token/:token/sections/d/save",

  parseProfessionalKycSectionUpload(
    "D"
  ),

  saveSectionDController
);


/* =========================================================
   TOKEN SECTION E

   Reference Letters
========================================================= */

router.patch(
  "/token/:token/sections/E/save",

  parseProfessionalKycSectionUpload(
    "E"
  ),

  saveSectionEController
);

router.patch(
  "/token/:token/sections/e/save",

  parseProfessionalKycSectionUpload(
    "E"
  ),

  saveSectionEController
);


/* =========================================================
   TOKEN SECTION F

   Work Samples + Resume
========================================================= */

router.patch(
  "/token/:token/sections/F/save",

  parseProfessionalKycSectionUpload(
    "F"
  ),

  saveSectionFController
);

router.patch(
  "/token/:token/sections/f/save",

  parseProfessionalKycSectionUpload(
    "F"
  ),

  saveSectionFController
);


/* =========================================================
   TOKEN SECTION G

   Profile / Cover / Gallery / Intro Video
========================================================= */

router.patch(
  "/token/:token/sections/G/save",

  parseProfessionalKycSectionUpload(
    "G"
  ),

  saveSectionGController
);

router.patch(
  "/token/:token/sections/g/save",

  parseProfessionalKycSectionUpload(
    "G"
  ),

  saveSectionGController
);


/* =========================================================
   TOKEN SECTION H

   Bank / Tax / Nominee Documents
========================================================= */

router.patch(
  "/token/:token/sections/H/save",

  parseProfessionalKycSectionUpload(
    "H"
  ),

  saveSectionHController
);

router.patch(
  "/token/:token/sections/h/save",

  parseProfessionalKycSectionUpload(
    "H"
  ),

  saveSectionHController
);


/* =========================================================
   TOKEN SECTION I

   Network / Royalty
========================================================= */

router.patch(
  "/token/:token/sections/I/save",

  parseProfessionalKycSectionUpload(
    "I"
  ),

  saveSectionIController
);

router.patch(
  "/token/:token/sections/i/save",

  parseProfessionalKycSectionUpload(
    "I"
  ),

  saveSectionIController
);


/* =========================================================
   TOKEN SECTION J

   Emergency
========================================================= */

router.patch(
  "/token/:token/sections/J/save",

  parseProfessionalKycSectionUpload(
    "J"
  ),

  saveSectionJController
);

router.patch(
  "/token/:token/sections/j/save",

  parseProfessionalKycSectionUpload(
    "J"
  ),

  saveSectionJController
);


/* =========================================================
   TOKEN CONSENT
========================================================= */

router.patch(
  "/token/:token/consent",

  saveProfessionalKycConsentController
);


/* =========================================================
   TOKEN FINAL SUBMIT
========================================================= */

router.post(
  "/token/:token/submit",

  submitProfessionalKycController
);


/* =========================================================
   TOKEN REOPEN
========================================================= */

router.post(
  "/token/:token/reopen",

  reopenProfessionalKycController
);


/* =========================================================
   EXPORT
========================================================= */

module.exports =
  router;