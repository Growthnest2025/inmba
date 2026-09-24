const ApiError =
  require(
    "../utils/apiError"
  );

const {
  getSessionMemberId,
} = require(
  "./dashboard.controller"
);

const {
  getPublicUser,
  updateOwnPublicProfile,
} = require(
  "../services/publicProfileOwner.service"
);

/* =========================
   SAVE SESSION
========================= */

const saveMemberSession =
  (
    request
  ) => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        request.session.save(
          (
            error
          ) => {
            if (
              error
            ) {
              return reject(
                error
              );
            }

            return resolve();
          }
        );
      }
    );
  };

/* =========================
   GET PUBLIC USER
========================= */

const getPublicUserController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const profile =
        await getPublicUser(
          request.params
            .loginId
        );

      /*
        Top-level profile fields:
        Legacy React compatibility.

        data.profile:
        Standard API response.
      */

      return response
        .status(200)
        .json({
          ...profile,

          statusCode:
            200,

          data: {
            profile,
          },

          message:
            "Public member profile loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   UPDATE OWN PUBLIC PROFILE
========================= */

const updatePublicUserController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        getSessionMemberId(
          request
        );

      if (
        !memberId
      ) {
        throw new ApiError(
          401,
          "Authentication required."
        );
      }

      const result =
        await updateOwnPublicProfile(
          memberId,
          request
            .validatedPublicProfileUpdate
        );

      /*
        Update user session values
        after profile edit.
      */

      if (
        request.session
          .user &&
        typeof request.session
          .user ===
          "object"
      ) {
        request.session.user = {
          ...request.session.user,

          ...result
            .session_member,
        };
      }

      /*
        Some existing routes may use
        request.session.member.
      */

      if (
        request.session
          .member &&
        typeof request.session
          .member ===
          "object"
      ) {
        request.session.member = {
          ...request.session.member,

          ...result
            .session_member,
        };
      }

      /*
        Some legacy authentication
        code may store direct session
        values instead of user/member.
      */

      if (
        result
          .session_member
      ) {
        request.session.user_id =
          result
            .session_member
            .id;

        request.session.member_id =
          result
            .session_member
            .id;

        request.session.login_id =
          result
            .session_member
            .login_id;

        request.session.first_name =
          result
            .session_member
            .first_name;

        request.session.last_name =
          result
            .session_member
            .last_name;

        request.session.email =
          result
            .session_member
            .email;

        request.session.phone =
          result
            .session_member
            .phone;

        request.session.membership_type =
          result
            .session_member
            .membership_type;

        request.session.profile_pic =
          result
            .session_member
            .profile_pic;

        request.session.profile_image_url =
          result
            .session_member
            .profile_image_url;
      }

      await saveMemberSession(
        request
      );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data: {
            /*
              Complete owner profile.
              Private fields may be included
              because this is the logged-in
              member's own response.
            */

            profile:
              result.profile,

            /*
              Privacy-filtered profile.
              This is what another public
              visitor will see.
            */

            public_profile:
              result
                .public_profile,

            updated_fields:
              result
                .updated_fields,

            skipped_fields:
              result
                .skipped_fields,

            changed:
              result.changed,
          },

          /*
            React compatibility:
            response.profile
          */

          profile:
            result.profile,

          /*
            Public preview compatibility:
            response.public_profile
          */

          public_profile:
            result
              .public_profile,

          /*
            Some React components may
            read response.user.
          */

          user:
            result.profile,

          updated_fields:
            result
              .updated_fields,

          skipped_fields:
            result
              .skipped_fields,

          changed:
            result.changed,

          message:
            "Profile updated successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  saveMemberSession,
  getPublicUserController,
  updatePublicUserController,
};