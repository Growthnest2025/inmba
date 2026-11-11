const {
  getProfessionalKycByMemberId,
  getProfessionalNetworkSnapshot,
} = require(
  "../repositories/professionalKyc.repository"
);

/* =========================================================
   PROFESSIONAL OWNER PROFILE CONTROLLER

   PURPOSE
   ---------------------------------------------------------

   Logged-in Professional Member:
   -> Can see their OWN full Professional information.

   Public QR visitor:
   -> Cannot use this endpoint.

   Another logged-in member:
   -> Cannot request somebody else's profile because
      this endpoint DOES NOT accept memberId/loginId.

   Ownership comes only from server-side session.

========================================================= */

/* =========================================================
   TEXT HELPER
========================================================= */

const toText =
  (
    value,
    fallback = ""
  ) => {
    const text =
      String(
        value ?? ""
      ).trim();

    return (
      text ||
      fallback
    );
  };

/* =========================================================
   NUMBER HELPER
========================================================= */

const toNumber =
  (
    value,
    fallback = 0
  ) => {
    const number =
      Number(
        value
      );

    if (
      Number.isNaN(
        number
      )
    ) {
      return fallback;
    }

    return number;
  };

/* =========================================================
   BOOLEAN HELPER
========================================================= */

const toBoolean =
  (
    value
  ) => {
    return (
      value === true ||
      value === 1 ||
      value === "1" ||
      String(
        value ?? ""
      )
        .trim()
        .toLowerCase() ===
        "true"
    );
  };

/* =========================================================
   ARRAY / JSON HELPER
========================================================= */

const toArray =
  (
    value
  ) => {
    if (
      Array.isArray(
        value
      )
    ) {
      return value;
    }

    if (
      value === null ||
      typeof value ===
        "undefined" ||
      value === ""
    ) {
      return [];
    }

    if (
      typeof value ===
        "string"
    ) {
      const text =
        value.trim();

      if (!text) {
        return [];
      }

      try {
        const parsed =
          JSON.parse(
            text
          );

        if (
          Array.isArray(
            parsed
          )
        ) {
          return parsed;
        }
      } catch {
        /*
          Comma / pipe / newline separated
          legacy data.
        */
      }

      return text
        .split(
          /[,|\n]/
        )
        .map(
          (
            item
          ) =>
            item.trim()
        )
        .filter(
          Boolean
        );
    }

    return [];
  };

/* =========================================================
   GET AUTHENTICATED MEMBER ID

   IMPORTANT:

   URL / query / body supplied memberId is NOT used.

   Only authenticated server-side context.
========================================================= */

const getAuthenticatedMemberId =
  (
    request
  ) => {
    const candidates = [
      request
        ?.session
        ?.user
        ?.id,

      request
        ?.session
        ?.member
        ?.id,

      request
        ?.session
        ?.user_id,

      request
        ?.session
        ?.member_id,

      request
        ?.user
        ?.id,

      request
        ?.member
        ?.id,
    ];

    for (
      const candidate
      of candidates
    ) {
      const value =
        toText(
          candidate
        );

      if (
        value
      ) {
        return value;
      }
    }

    return "";
  };

/* =========================================================
   PROFESSIONAL MEMBERSHIP CHECK
========================================================= */

const isProfessionalMember =
  (
    value
  ) => {
    const membershipType =
      toText(
        value
      )
        .toLowerCase()
        .replace(
          /\s+/g,
          " "
        );

    return [
      "professional",
      "professional member",
      "professional membership",
    ].includes(
      membershipType
    );
  };

/* =========================================================
   OWNER RESPONSE BUILDER

   IMPORTANT:

   Owner can see full membership/KYC/private data.

   BUT authentication secrets MUST NEVER be returned:

   password
   password_hash
   token
   reset_token
   otp
   session identifiers
   internal auth secrets

========================================================= */

const buildProfessionalOwnerProfile =
  (
    member,
    network
  ) => {
    if (
      !member ||
      typeof member !==
        "object"
    ) {
      return null;
    }

    return {
      /* ===================================================
         INTERNAL MEMBER IDENTITY
      =================================================== */

      id:
        member.id ??
        null,

      login_id:
        member.login_id ??
        null,

      username:
        member.username ??
        member.user_name ??
        null,

      display_name:
        member.display_name ??
        null,

      membership_type:
        member.membership_type ??
        "Professional Member",

      created_at:
        member.created_at ??
        null,

      updated_at:
        member.updated_at ??
        null,

      /* ===================================================
         A. IDENTITY & KYC
      =================================================== */

      first_name:
        member.first_name ??
        null,

      last_name:
        member.last_name ??
        null,

      father_name:
        member.father_name ??
        null,

      dob:
        member.dob ??
        null,

      gender:
        member.gender ??
        null,

      marital_status:
        member.marital_status ??
        null,

      nationality:
        member.nationality ??
        null,

      aadhar:
        member.aadhar ??
        null,

      aadhar_front:
        member.aadhar_front ??
        null,

      aadhar_back:
        member.aadhar_back ??
        null,

      pan_number:
        member.pan_number ??
        null,

      pan_front:
        member.pan_front ??
        null,

      passport_number:
        member.passport_number ??
        null,

      voter_id:
        member.voter_id ??
        null,

      driving_license:
        member.driving_license ??
        null,

      blood_group:
        member.blood_group ??
        null,

      /* ===================================================
         B. CONTACT & ADDRESS
      =================================================== */

      phone:
        member.phone ??
        null,

      secondary_mobile:
        member.secondary_mobile ??
        null,

      email:
        member.email ??
        null,

      whatsapp_number:
        member.whatsapp_number ??
        null,

      contact_number:
        member.contact_number ??
        null,

      current_address:
        member.current_address ??
        null,

      permanent_address:
        member.permanent_address ??
        null,

      address_proof:
        member.address_proof ??
        null,

      city:
        member.city ??
        null,

      district:
        member.district ??
        null,

      state:
        member.state ??
        null,

      pincode:
        member.pincode ??
        null,

      country:
        member.country ??
        null,

      google_map_location:
        member.google_map_location ??
        null,

      entity_house_no:
        member.entity_house_no ??
        null,

      entity_street:
        member.entity_street ??
        null,

      entity_area:
        member.entity_area ??
        null,

      entity_city:
        member.entity_city ??
        null,

      entity_district:
        member.entity_district ??
        null,

      entity_state:
        member.entity_state ??
        null,

      entity_pincode:
        member.entity_pincode ??
        null,

      /* ===================================================
         C. PROFESSIONAL COMPLIANCE
      =================================================== */

      occupation:
        member.occupation ??
        null,

      professional_license_number:
        member
          .professional_license_number ??
        null,

      professional_license_document:
        member
          .professional_license_document ??
        null,

      council_board_name:
        member.council_board_name ??
        null,

      council_registration_number:
        member
          .council_registration_number ??
        null,

      council_registration_document:
        member
          .council_registration_document ??
        null,

      professional_indemnity_insurance:
        member
          .professional_indemnity_insurance ??
        null,

      firm_pan_number:
        member.firm_pan_number ??
        null,

      firm_pan_document:
        member.firm_pan_document ??
        null,

      professional_gst_number:
        member
          .professional_gst_number ??
        null,

      professional_gst_document:
        member
          .professional_gst_document ??
        null,

      /* ===================================================
         D. EDUCATION
      =================================================== */

      education:
        member.education ??
        null,

      educational_qualification:
        member
          .educational_qualification ??
        null,

      school_college_name:
        member.school_college_name ??
        null,

      degree_certificate_year:
        member
          .degree_certificate_year ??
        null,

      education_certificate:
        member
          .education_certificate ??
        null,

      additional_certifications:
        toArray(
          member
            .additional_certifications
        ),

      language_skills:
        toArray(
          member.language_skills
        ),

      /* ===================================================
         E. ACHIEVEMENTS
      =================================================== */

      awards_recognitions:
        toArray(
          member
            .awards_recognitions
        ),

      publications:
        toArray(
          member.publications
        ),

      professional_certifications:
        toArray(
          member
            .professional_certifications
        ),

      key_milestones:
        toArray(
          member.key_milestones
        ),

      media_mentions:
        toArray(
          member.media_mentions
        ),

      reference_letters:
        toArray(
          member.reference_letters
        ),

      /* ===================================================
         F. WORK EXPERIENCE
      =================================================== */

      total_experience_years:
        member
          .total_experience_years ??
        null,

      previous_employers_clients:
        toArray(
          member
            .previous_employers_clients
        ),

      work_samples:
        toArray(
          member.work_samples
        ),

      resume_cv:
        member.resume_cv ??
        null,

      hourly_project_rate:
        member
          .hourly_project_rate ??
        null,

      availability_status:
        member
          .availability_status ??
        null,

      /* ===================================================
         G. INTEREST / BIO / MEDIA
      =================================================== */

      professional_bio:
        member.professional_bio ??
        member.bio ??
        null,

      bio:
        member.bio ??
        null,

      interest_categories:
        toArray(
          member
            .interest_categories
        ),

      skills:
        toArray(
          member.skills
        ),

      hobbies:
        toArray(
          member.hobbies
        ),

      preferred_industry:
        member
          .preferred_industry ??
        null,

      profile_pic:
        member.profile_pic ??
        null,

      cover_photo:
        member.cover_photo ??
        null,

      gallery_photos:
        toArray(
          member.gallery_photos
        ),

      intro_video:
        member.intro_video ??
        null,

      social_link:
        member.social_link ??
        member.social_links ??
        null,

      social_links:
        member.social_links ??
        member.social_link ??
        null,

      social_instagram:
        member.social_instagram ??
        null,

      social_linkedin:
        member.social_linkedin ??
        null,

      social_twitter:
        member.social_twitter ??
        null,

      social_facebook:
        member.social_facebook ??
        null,

      social_youtube:
        member.social_youtube ??
        null,

      portfolio_url:
        member.portfolio_url ??
        null,

      /* ===================================================
         H. BANK / FINANCIAL
      =================================================== */

      account_holder:
        member.account_holder ??
        null,

      bank_name:
        member.bank_name ??
        null,

      account_number:
        member.account_number ??
        null,

      ifsc:
        member.ifsc ??
        null,

      branch:
        member.branch ??
        null,

      bank_proof:
        member.bank_proof ??
        null,

      upi_id:
        member.upi_id ??
        null,

      income_tax_declaration:
        member
          .income_tax_declaration ??
        null,

      nomini_name:
        member.nomini_name ??
        null,

      nomini_relationship:
        member
          .nomini_relationship ??
        null,

      nomini_aadhar:
        member.nomini_aadhar ??
        null,

      nomini_id_document:
        member
          .nomini_id_document ??
        null,

      /* ===================================================
         PAYMENT DETAILS
      =================================================== */

      payment_status:
        member.payment_status ??
        null,

      payment_method:
        member.payment_method ??
        null,

      transaction_id:
        member.transaction_id ??
        null,

      amount:
        member.amount ??
        null,

      subscription_year:
        member.subscription_year ??
        null,

      /* ===================================================
         I. NETWORK / ROYALTY

         Owner can see private network details.
      =================================================== */

      referral_id:
        network?.referral_id ??
        member.referral_id ??
        null,

      referred_by:
        network?.referred_by ??
        member.referred_by ??
        null,

      direct_network:
        toNumber(
          network
            ?.direct_network ??
          member.direct_network,
          0
        ),

      indirect_network:
        toNumber(
          network
            ?.indirect_network ??
          member.indirect_network,
          0
        ),

      team_size:
        toNumber(
          network?.team_size ??
          member.team_size,
          toNumber(
            member.direct_network,
            0
          ) +
          toNumber(
            member.indirect_network,
            0
          )
        ),

      network_level:
        network?.network_level ??
        member.network_level ??
        null,

      royalty_slab_category:
        network
          ?.royalty_slab_category ??
        member
          .royalty_slab_category ??
        null,

      preferred_payout_cycle:
        network
          ?.preferred_payout_cycle ??
        member
          .preferred_payout_cycle ??
        null,

      /* ===================================================
         J. EMERGENCY
      =================================================== */

      emergency_contact_name:
        member
          .emergency_contact_name ??
        null,

      emergency_contact_number:
        member
          .emergency_contact_number ??
        null,

      emergency_relationship:
        member
          .emergency_relationship ??
        null,

      /* ===================================================
         PROFESSIONAL KYC WORKFLOW
      =================================================== */

      professional_kyc_current_step:
        member
          .professional_kyc_current_step ??
        "A",

      professional_kyc_status:
        member
          .professional_kyc_status ??
        "draft",

      professional_kyc_submitted_at:
        member
          .professional_kyc_submitted_at ??
        null,

      professional_kyc_completed_at:
        member
          .professional_kyc_completed_at ??
        null,

      professional_kyc_rejection_reason:
        member
          .professional_kyc_rejection_reason ??
        null,

      /* ===================================================
         SECTION COMPLETION
      =================================================== */

      professional_section_a_completed:
        toBoolean(
          member
            .professional_section_a_completed
        ),

      professional_section_b_completed:
        toBoolean(
          member
            .professional_section_b_completed
        ),

      professional_section_c_completed:
        toBoolean(
          member
            .professional_section_c_completed
        ),

      professional_section_d_completed:
        toBoolean(
          member
            .professional_section_d_completed
        ),

      professional_section_e_completed:
        toBoolean(
          member
            .professional_section_e_completed
        ),

      professional_section_f_completed:
        toBoolean(
          member
            .professional_section_f_completed
        ),

      professional_section_g_completed:
        toBoolean(
          member
            .professional_section_g_completed
        ),

      professional_section_h_completed:
        toBoolean(
          member
            .professional_section_h_completed
        ),

      professional_section_i_completed:
        toBoolean(
          member
            .professional_section_i_completed
        ),

      professional_section_j_completed:
        toBoolean(
          member
            .professional_section_j_completed
        ),

      /* ===================================================
         CONSENT

         Owner can see their own consent status.
      =================================================== */

      professional_privacy_consent:
        toBoolean(
          member
            .professional_privacy_consent
        ),

      professional_declaration_accepted:
        toBoolean(
          member
            .professional_declaration_accepted
        ),

      professional_declaration_at:
        member
          .professional_declaration_at ??
        null,

      /* ===================================================
         PUBLIC PROFILE SETTINGS

         Owner needs these to control public visibility.
      =================================================== */

      public_profile_sections:
        toArray(
          member
            .public_profile_sections
        ),

      public_profile_fields:
        toArray(
          member
            .public_profile_fields
        ),
    };
  };

/* =========================================================
   GET OWN PROFESSIONAL PROFILE

   Planned endpoint:

   GET /api/me/professional-profile

   NO:
   :loginId
   ?memberId
   body.memberId

   Session ID only.
========================================================= */

const getOwnProfessionalProfileController =
  async (
    request,
    response,
    next
  ) => {
    try {
      /* ===================================================
         AUTHENTICATION
      =================================================== */

      const memberId =
        getAuthenticatedMemberId(
          request
        );

      if (
        !memberId
      ) {
        return response
          .status(401)
          .json({
            success:
              false,

            message:
              "Please login to view your Professional profile.",

            code:
              "MEMBER_AUTH_REQUIRED",
          });
      }

      /* ===================================================
         LOAD CURRENT SESSION MEMBER ONLY
      =================================================== */

      const member =
        await getProfessionalKycByMemberId(
          memberId
        );

      if (
        !member
      ) {
        return response
          .status(404)
          .json({
            success:
              false,

            message:
              "Professional member profile not found.",

            code:
              "PROFESSIONAL_MEMBER_NOT_FOUND",
          });
      }

      /* ===================================================
         DEFENSE CHECK
      =================================================== */

      if (
        !isProfessionalMember(
          member.membership_type
        )
      ) {
        return response
          .status(403)
          .json({
            success:
              false,

            message:
              "Professional membership is required.",

            code:
              "PROFESSIONAL_MEMBERSHIP_REQUIRED",
          });
      }

      /* ===================================================
         NETWORK / ROYALTY OWNER DETAILS
      =================================================== */

      const network =
        await getProfessionalNetworkSnapshot(
          memberId
        );

      /* ===================================================
         BUILD OWNER-SAFE FULL RESPONSE

         Full KYC/private information:
         YES

         Password / auth tokens:
         NO
      =================================================== */

      const profile =
        buildProfessionalOwnerProfile(
          member,
          network
        );

      /* ===================================================
         PRIVATE DATA MUST NEVER CACHE
      =================================================== */

      response.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
      );

      response.set(
        "Pragma",
        "no-cache"
      );

      response.set(
        "Expires",
        "0"
      );

      /* ===================================================
         SUCCESS
      =================================================== */

      return response
        .status(200)
        .json({
          success:
            true,

          owner:
            true,

          visibility:
            "private",

          profileType:
            "professional",

          profile,

          /*
            Compatibility alias.
            Same safe owner profile.
          */

          member:
            profile,
        });
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  getOwnProfessionalProfileController,

  buildProfessionalOwnerProfile,
};