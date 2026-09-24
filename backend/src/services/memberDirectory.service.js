const {
  findPublicMembers,
  countPublicMembers,
  getMemberDirectorySummary,
} = require(
  "../repositories/memberDirectory.repository"
);

const {
  createPublicProfilePhotoUrl,
} = require(
  "./publicProfile.service"
);

/* =========================
   FRONTEND BASE URL
========================= */

const getMemberDirectoryFrontendUrl =
  () => {
    return String(
      process.env
        .FRONTEND_BASE_URL ||
        "http://localhost:5173"
    ).replace(
      /\/+$/,
      ""
    );
  };

/* =========================
   MEMBER PROFILE URL
========================= */

const createMemberProfileUrl =
  (
    loginId
  ) => {
    if (
      !loginId
    ) {
      return null;
    }

    return (
      `${getMemberDirectoryFrontendUrl()}` +
      `/user-profile/` +
      encodeURIComponent(
        loginId
      )
    );
  };

/* =========================
   SAFE DIRECTORY MEMBER
========================= */

const toDirectoryMember =
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
        Number(
          member.id
        ),

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

      membership_type:
        member.membership_type ||
        "",

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

      city:
        member.city ||
        "",

      district:
        member.district ||
        "",

      state:
        member.state ||
        "",

      profile_pic:
        member.profile_pic ||
        null,

      profile_photo_url:
        createPublicProfilePhotoUrl(
          member.profile_pic
        ),

      public_profile_url:
        createMemberProfileUrl(
          member.login_id
        ),

      direct_network:
        directNetwork,

      indirect_network:
        indirectNetwork,

      total_network:
        directNetwork +
        indirectNetwork,

      member_since:
        member.created_at ||
        null,
    };
  };

/* =========================
   GET MEMBER DIRECTORY
========================= */

const getPublicMemberDirectory =
  async (
    query,
    connection =
      null
  ) => {
    const [
      rows,
      total,
      summary,
    ] =
      await Promise.all([
        findPublicMembers(
          query,
          connection
        ),

        countPublicMembers(
          query,
          connection
        ),

        getMemberDirectorySummary(
          connection
        ),
      ]);

    const members =
      rows
        .map(
          toDirectoryMember
        )
        .filter(Boolean);

    return {
      members,

      summary,

      pagination: {
        page:
          query.page,

        limit:
          query.limit,

        total,

        total_pages:
          total === 0
            ? 0
            : Math.ceil(
                total /
                  query.limit
              ),

        has_next:
          query.page *
            query.limit <
          total,

        has_previous:
          query.page >
          1,
      },

      filters: {
        search:
          query.search,

        membership_type:
          query
            .membership_type,

        city:
          query.city,

        district:
          query.district,

        state:
          query.state,

        sort:
          query.sort,
      },
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  getMemberDirectoryFrontendUrl,
  createMemberProfileUrl,
  toDirectoryMember,
  getPublicMemberDirectory,
};