const express =
  require(
    "express"
  );

const {
  getCommercialKycController,

  getCommercialKycSectionController,

  getCommercialKycProgressController,

  getCommercialNetworkController,

  saveCommercialKycSectionController,

  saveSectionAController,

  saveSectionBController,

  saveSectionCController,

  saveSectionDController,

  saveSectionEController,

  saveSectionFController,

  saveSectionGController,

  saveCommercialKycConsentController,

  submitCommercialKycController,

  reopenCommercialKycController,

  markCommercialKycUnderReviewController,

  approveCommercialKycController,

  rejectCommercialKycController,

  updateCommercialSystemNetworkController,
} =
  require(
    "../controllers/commercialKyc.controller"
  );

const {
  parseCommercialKycUpload,

  parseCommercialKycSectionUpload,
} =
  require(
    "../middleware/commercialKycUpload.middleware"
  );

const {
  requireAdmin,
} =
  require(
    "../middleware/adminAuth.middleware"
  );

const router =
  express.Router();

/* =========================================================
   COMMERCIAL KYC ROUTES

   BASE URL

   /api/commercial-kyc

   COMMERCIAL FULL KYC:
   A - G

   SUPPORTS:

   - Logged-in Commercial Member session
   - Commercial token-based KYC flow
   - JSON requests
   - multipart/form-data
   - Commercial private document uploads
   - Commercial public media uploads
   - Admin review / approve / reject
========================================================= */


/* =========================================================
   MODULE INFO

   GET
   /api/commercial-kyc/info
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
          "Commercial KYC module is available.",

        data: {
          membershipType:
            "Commercial Member",

          profileUpgrade: {
            planId:
              "profile_upgrade",

            amount:
              1500,

            currency:
              "INR",
          },

          sections: [
            "A",
            "B",
            "C",
            "D",
            "E",
            "F",
            "G",
          ],

          sectionTitles: {
            A:
              "Owner Identity & KYC",

            B:
              "Business Legal & Registration",

            C:
              "Business Contact & Address",

            D:
              "Financial & Bank",

            E:
              "Business Profile & Achievements",

            F:
              "Network / Royalty Details",

            G:
              "Emergency & Nominee",
          },
        },
      });
  }
);


/* =========================================================
   SESSION-BASED COMMERCIAL MEMBER ROUTES
========================================================= */


/* =========================================================
   GET FULL COMMERCIAL KYC

   GET
   /api/commercial-kyc
========================================================= */

router.get(
  "/",

  getCommercialKycController
);


/* =========================================================
   GET COMMERCIAL KYC PROGRESS

   GET
   /api/commercial-kyc/progress
========================================================= */

router.get(
  "/progress",

  getCommercialKycProgressController
);


/* =========================================================
   GET COMMERCIAL NETWORK / ROYALTY

   GET
   /api/commercial-kyc/network
========================================================= */

router.get(
  "/network",

  getCommercialNetworkController
);


/* =========================================================
   GET SINGLE SECTION

   GET
   /api/commercial-kyc/sections/A

   ...

   GET
   /api/commercial-kyc/sections/G
========================================================= */

router.get(
  "/sections/:section",

  getCommercialKycSectionController
);


/* =========================================================
   GENERIC SAVE SECTION

   PATCH
   /api/commercial-kyc/sections/:section

   EXAMPLE JSON:

   {
     "values": {
       ...
     },

     "completed": false
   }

   completed false
   ----------------
   Save Draft

   completed true
   ----------------
   Validate section
   Mark complete
   Move next section
========================================================= */

router.patch(
  "/sections/:section",

  parseCommercialKycUpload,

  saveCommercialKycSectionController
);


/* =========================================================
   SECTION A
   OWNER IDENTITY & KYC

   PRIVATE UPLOADS:

   aadhaar_front
   aadhaar_back
   pan_card_scan

   PATCH
   /api/commercial-kyc/sections/A/save
========================================================= */

router.patch(
  "/sections/A/save",

  parseCommercialKycSectionUpload(
    "A"
  ),

  saveSectionAController
);

router.patch(
  "/sections/a/save",

  parseCommercialKycSectionUpload(
    "A"
  ),

  saveSectionAController
);


/* =========================================================
   SECTION B
   BUSINESS LEGAL & REGISTRATION

   PRIVATE UPLOADS:

   gst_certificate
   shop_establishment_license
   trade_license
   industry_specific_license
   incorporation_certificate
   partnership_deed_moa_aoa
   authorized_signatory_id_proof

   PATCH
   /api/commercial-kyc/sections/B/save
========================================================= */

router.patch(
  "/sections/B/save",

  parseCommercialKycSectionUpload(
    "B"
  ),

  saveSectionBController
);

router.patch(
  "/sections/b/save",

  parseCommercialKycSectionUpload(
    "B"
  ),

  saveSectionBController
);


/* =========================================================
   SECTION C
   BUSINESS CONTACT & ADDRESS

   No document upload required.

   Multipart text request still supported.

   PATCH
   /api/commercial-kyc/sections/C/save
========================================================= */

router.patch(
  "/sections/C/save",

  parseCommercialKycSectionUpload(
    "C"
  ),

  saveSectionCController
);

router.patch(
  "/sections/c/save",

  parseCommercialKycSectionUpload(
    "C"
  ),

  saveSectionCController
);


/* =========================================================
   SECTION D
   FINANCIAL & BANK

   PRIVATE UPLOADS:

   bank_proof
   nominee_id_document

   PATCH
   /api/commercial-kyc/sections/D/save
========================================================= */

router.patch(
  "/sections/D/save",

  parseCommercialKycSectionUpload(
    "D"
  ),

  saveSectionDController
);

router.patch(
  "/sections/d/save",

  parseCommercialKycSectionUpload(
    "D"
  ),

  saveSectionDController
);


/* =========================================================
   SECTION E
   BUSINESS PROFILE & ACHIEVEMENTS

   PUBLIC MEDIA:

   business_logo
   gallery_photos
   promo_video

   PATCH
   /api/commercial-kyc/sections/E/save
========================================================= */

router.patch(
  "/sections/E/save",

  parseCommercialKycSectionUpload(
    "E"
  ),

  saveSectionEController
);

router.patch(
  "/sections/e/save",

  parseCommercialKycSectionUpload(
    "E"
  ),

  saveSectionEController
);


/* =========================================================
   SECTION F
   NETWORK / ROYALTY DETAILS

   SYSTEM CONTROLLED:

   sponsor / referral
   network level / rank
   team size
   royalty slab

   MEMBER EDITABLE:

   preferred payout cycle

   PATCH
   /api/commercial-kyc/sections/F/save
========================================================= */

router.patch(
  "/sections/F/save",

  parseCommercialKycSectionUpload(
    "F"
  ),

  saveSectionFController
);

router.patch(
  "/sections/f/save",

  parseCommercialKycSectionUpload(
    "F"
  ),

  saveSectionFController
);


/* =========================================================
   SECTION G
   EMERGENCY & NOMINEE

   PATCH
   /api/commercial-kyc/sections/G/save
========================================================= */

router.patch(
  "/sections/G/save",

  parseCommercialKycSectionUpload(
    "G"
  ),

  saveSectionGController
);

router.patch(
  "/sections/g/save",

  parseCommercialKycSectionUpload(
    "G"
  ),

  saveSectionGController
);


/* =========================================================
   PRIVACY CONSENT + DECLARATION

   PATCH
   /api/commercial-kyc/consent

   BODY:

   {
     "privacyConsent": true,
     "declarationAccepted": true
   }
========================================================= */

router.patch(
  "/consent",

  saveCommercialKycConsentController
);


/* =========================================================
   FINAL COMMERCIAL KYC SUBMIT

   POST
   /api/commercial-kyc/submit

   BODY:

   {
     "privacyConsent": true,
     "declarationAccepted": true
   }

   SUCCESS NEXT:

   Commercial ₹1500 Payment
========================================================= */

router.post(
  "/submit",

  submitCommercialKycController
);


/* =========================================================
   REOPEN REJECTED COMMERCIAL KYC

   POST
   /api/commercial-kyc/reopen
========================================================= */

router.post(
  "/reopen",

  reopenCommercialKycController
);


/* =========================================================
   TOKEN-BASED COMMERCIAL KYC

   Existing INMBA Professional token flow pattern
   mirrored separately for Commercial.

   BASE:

   /api/commercial-kyc/token/:token
========================================================= */


/* =========================================================
   GET FULL KYC BY TOKEN

   GET
   /api/commercial-kyc/token/:token
========================================================= */

router.get(
  "/token/:token",

  getCommercialKycController
);


/* =========================================================
   GET PROGRESS BY TOKEN

   GET
   /api/commercial-kyc/token/:token/progress
========================================================= */

router.get(
  "/token/:token/progress",

  getCommercialKycProgressController
);


/* =========================================================
   GET NETWORK BY TOKEN

   GET
   /api/commercial-kyc/token/:token/network
========================================================= */

router.get(
  "/token/:token/network",

  getCommercialNetworkController
);


/* =========================================================
   GET SECTION BY TOKEN

   GET
   /api/commercial-kyc/token/:token/sections/A
========================================================= */

router.get(
  "/token/:token/sections/:section",

  getCommercialKycSectionController
);


/* =========================================================
   GENERIC SAVE SECTION BY TOKEN

   PATCH
   /api/commercial-kyc/token/:token/sections/:section
========================================================= */

router.patch(
  "/token/:token/sections/:section",

  parseCommercialKycUpload,

  saveCommercialKycSectionController
);


/* =========================================================
   TOKEN SECTION A
========================================================= */

router.patch(
  "/token/:token/sections/A/save",

  parseCommercialKycSectionUpload(
    "A"
  ),

  saveSectionAController
);

router.patch(
  "/token/:token/sections/a/save",

  parseCommercialKycSectionUpload(
    "A"
  ),

  saveSectionAController
);


/* =========================================================
   TOKEN SECTION B
========================================================= */

router.patch(
  "/token/:token/sections/B/save",

  parseCommercialKycSectionUpload(
    "B"
  ),

  saveSectionBController
);

router.patch(
  "/token/:token/sections/b/save",

  parseCommercialKycSectionUpload(
    "B"
  ),

  saveSectionBController
);


/* =========================================================
   TOKEN SECTION C
========================================================= */

router.patch(
  "/token/:token/sections/C/save",

  parseCommercialKycSectionUpload(
    "C"
  ),

  saveSectionCController
);

router.patch(
  "/token/:token/sections/c/save",

  parseCommercialKycSectionUpload(
    "C"
  ),

  saveSectionCController
);


/* =========================================================
   TOKEN SECTION D
========================================================= */

router.patch(
  "/token/:token/sections/D/save",

  parseCommercialKycSectionUpload(
    "D"
  ),

  saveSectionDController
);

router.patch(
  "/token/:token/sections/d/save",

  parseCommercialKycSectionUpload(
    "D"
  ),

  saveSectionDController
);


/* =========================================================
   TOKEN SECTION E
========================================================= */

router.patch(
  "/token/:token/sections/E/save",

  parseCommercialKycSectionUpload(
    "E"
  ),

  saveSectionEController
);

router.patch(
  "/token/:token/sections/e/save",

  parseCommercialKycSectionUpload(
    "E"
  ),

  saveSectionEController
);


/* =========================================================
   TOKEN SECTION F
========================================================= */

router.patch(
  "/token/:token/sections/F/save",

  parseCommercialKycSectionUpload(
    "F"
  ),

  saveSectionFController
);

router.patch(
  "/token/:token/sections/f/save",

  parseCommercialKycSectionUpload(
    "F"
  ),

  saveSectionFController
);


/* =========================================================
   TOKEN SECTION G
========================================================= */

router.patch(
  "/token/:token/sections/G/save",

  parseCommercialKycSectionUpload(
    "G"
  ),

  saveSectionGController
);

router.patch(
  "/token/:token/sections/g/save",

  parseCommercialKycSectionUpload(
    "G"
  ),

  saveSectionGController
);


/* =========================================================
   TOKEN CONSENT

   PATCH
   /api/commercial-kyc/token/:token/consent
========================================================= */

router.patch(
  "/token/:token/consent",

  saveCommercialKycConsentController
);


/* =========================================================
   TOKEN FINAL SUBMIT

   POST
   /api/commercial-kyc/token/:token/submit
========================================================= */

router.post(
  "/token/:token/submit",

  submitCommercialKycController
);


/* =========================================================
   TOKEN REOPEN REJECTED KYC

   POST
   /api/commercial-kyc/token/:token/reopen
========================================================= */

router.post(
  "/token/:token/reopen",

  reopenCommercialKycController
);


/* =========================================================
   ADMIN COMMERCIAL KYC

   IMPORTANT:

   Every route below requires authenticated ADMIN session.

   Member / token cannot access these APIs.
========================================================= */


/* =========================================================
   MARK UNDER REVIEW

   PATCH
   /api/commercial-kyc/admin/members/:memberId/under-review
========================================================= */

router.patch(
  "/admin/members/:memberId/under-review",

  requireAdmin,

  markCommercialKycUnderReviewController
);


/* =========================================================
   APPROVE COMMERCIAL KYC

   PATCH
   /api/commercial-kyc/admin/members/:memberId/approve
========================================================= */

router.patch(
  "/admin/members/:memberId/approve",

  requireAdmin,

  approveCommercialKycController
);


/* =========================================================
   REJECT COMMERCIAL KYC

   PATCH
   /api/commercial-kyc/admin/members/:memberId/reject

   BODY:

   {
     "rejectionReason": "Reason..."
   }
========================================================= */

router.patch(
  "/admin/members/:memberId/reject",

  requireAdmin,

  rejectCommercialKycController
);


/* =========================================================
   UPDATE SYSTEM NETWORK VALUES

   PATCH
   /api/commercial-kyc/admin/members/:memberId/network

   ADMIN CONTROLLED:

   networkLevel
   royaltySlabCategory

   BODY:

   {
     "networkLevel": "Level 2",
     "royaltySlabCategory": "Silver"
   }
========================================================= */

router.patch(
  "/admin/members/:memberId/network",

  requireAdmin,

  updateCommercialSystemNetworkController
);


/* =========================================================
   EXPORT
========================================================= */

module.exports =
  router;