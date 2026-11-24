const {
  executeQuery,
} = require(
  "./auth.repository"
);

/* =========================
   NORMALIZE LOGIN ID
========================= */

const normalizeLoginId =
  (
    loginId
  ) => {
    const normalized =
      String(
        loginId ||
          ""
      ).trim();

    if (
      !normalized ||
      normalized.length >
        100
    ) {
      return null;
    }

    return normalized;
  };

/* =========================
   FIND PUBLIC MEMBER
========================= */

const findPublicMemberByLoginId =
  async (
    loginId,
    connection =
      null
  ) => {
    const normalizedLoginId =
      normalizeLoginId(
        loginId
      );

    if (
      !normalizedLoginId
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            id,
            first_name,
            last_name,
            email,
            phone,
            gender,
            dob,
            occupation,
            education,
            educational_qualification,
            profile_pic,
            login_id,
            referral_id,
            network_level,
            bio,
            membership_type,
            payment_status,
            direct_network,
            indirect_network,
            city,
            district,
            state,
            created_at,
            is_deleted
          FROM
            kyc_members
          WHERE
            login_id = ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0
            AND LOWER(
              TRIM(
                COALESCE(
                  payment_status,
                  ''
                )
              )
            ) = 'approved'
          LIMIT 1
        `,
        [
          normalizedLoginId,
        ],
        connection
      );

    const member = Array.isArray(
      rows
    )
      ? rows[0] ||
          null
      : null;

    if (member && member.id) {
      try {
        const kycRows = await executeQuery(
          `
            SELECT *
            FROM civilian_full_kyc
            WHERE member_id = ?
            LIMIT 1
          `,
          [member.id],
          connection
        );

        if (Array.isArray(kycRows) && kycRows[0]) {
          const kyc = kycRows[0];
          member.highest_qualification = kyc.highest_qualification || member.educational_qualification || member.education;
          member.school_college_name = kyc.school_college_name;
          member.degree_year = kyc.degree_year;
          member.additional_certifications = kyc.additional_certifications;
          member.language_skills = kyc.language_skills;
          member.skills = kyc.skills || member.skills;
          member.interest_categories = kyc.interest_categories;
          member.hobbies = kyc.hobbies;
          member.preferred_industry = kyc.preferred_industry;
          member.awards_recognitions = kyc.awards_recognitions;
          member.publications = kyc.publications;
          member.professional_certifications = kyc.professional_certifications;
          member.key_milestones = kyc.key_milestones;
          member.media_mentions = kyc.media_mentions;
          member.testimonials = kyc.testimonials;
          member.facebook_url = kyc.facebook_url;
          member.instagram_url = kyc.instagram_url;
          member.linkedin_url = kyc.linkedin_url;
          member.youtube_url = kyc.youtube_url;
          member.website_portfolio = kyc.website_portfolio;
          if (kyc.bio) member.bio = kyc.bio;
          if (kyc.profile_photo) member.profile_pic = kyc.profile_photo;
          if (kyc.cover_photo) member.cover_photo = kyc.cover_photo;
          if (kyc.current_address) member.current_address = kyc.current_address;
          if (kyc.permanent_address) member.permanent_address = kyc.permanent_address;
          if (kyc.district) member.district = kyc.district;
          if (kyc.state) member.state = kyc.state;
          if (kyc.pincode) member.pincode = kyc.pincode;
        }
      } catch (err) {
        // Non-blocking
      }
    }

    return member;
  };

/* =========================
   PUBLIC-SAFE MEMBER
========================= */

const toPublicProfileMember =
  (
    member
  ) => {
    if (
      !member
    ) {
      return null;
    }

    const firstName =
      member.first_name ||
      "";

    const lastName =
      member.last_name ||
      "";

    const directNetwork =
      Number(
        member.direct_network ||
          0
      );

    const indirectNetwork =
      Number(
        member.indirect_network ||
          0
      );

    return {
      id:
        member.id,

      login_id:
        member.login_id ||
        "",

      first_name:
        firstName,

      last_name:
        lastName,

      full_name:
        [
          firstName,
          lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),

      email:
        member.email ||
        "",

      phone:
        member.phone ||
        "",

      gender:
        member.gender ||
        "",

      dob:
        member.dob ||
        null,

      occupation:
        member.occupation ||
        "",

      education:
        member.education ||
        "",

      educational_qualification:
        member
          .educational_qualification ||
        "",

      profile_pic:
        member.profile_pic ||
        null,

      membership_type:
        member.membership_type ||
        "",

      referral_id:
        member.referral_id ||
        "",

      network_level:
        member.network_level ||
        "",

      network_rank:
        member.network_level ||
        "",

      rank:
        member.network_level ||
        "",

      bio:
        member.bio ||
        "",

      direct_network:
        directNetwork,

      direct_members:
        directNetwork,

      indirect_network:
        indirectNetwork,

      total_network:
        directNetwork +
        indirectNetwork,

      payment_status:
        member.payment_status ||
        "approved",

      location: {
        city:
          member.city ||
          "",

        district:
          member.district ||
          "",

        state:
          member.state ||
          "",
      },

      network: {
        direct:
          directNetwork,

        indirect:
          indirectNetwork,

        total:
          directNetwork +
          indirectNetwork,
      },

      highest_qualification:
        member.highest_qualification ||
        member.educational_qualification ||
        member.education ||
        "",

      school_college_name:
        member.school_college_name ||
        "",

      degree_year:
        member.degree_year ||
        "",

      additional_certifications:
        member.additional_certifications ||
        "",

      language_skills:
        member.language_skills ||
        "",

      skills:
        member.skills ||
        "",

      interest_categories:
        member.interest_categories ||
        "",

      hobbies:
        member.hobbies ||
        "",

      preferred_industry:
        member.preferred_industry ||
        "",

      awards_recognitions:
        member.awards_recognitions ||
        "",

      publications:
        member.publications ||
        "",

      professional_certifications:
        member.professional_certifications ||
        "",

      key_milestones:
        member.key_milestones ||
        "",

      media_mentions:
        member.media_mentions ||
        "",

      testimonials:
        member.testimonials ||
        "",

      facebook_url:
        member.facebook_url ||
        "",

      instagram_url:
        member.instagram_url ||
        "",

      linkedin_url:
        member.linkedin_url ||
        "",

      youtube_url:
        member.youtube_url ||
        "",

      website_portfolio:
        member.website_portfolio ||
        "",

      current_address:
        member.current_address ||
        "",

      permanent_address:
        member.permanent_address ||
        "",

      pincode:
        member.pincode ||
        "",

      cover_photo:
        member.cover_photo ||
        null,

      member_since:
        member.created_at ||
        null,
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  normalizeLoginId,
  findPublicMemberByLoginId,
  toPublicProfileMember,
};