import axios from "axios";
import { toText, asObject } from "../utils/commonHelpers";

/* =========================================================
   MEMBERS API

   Source:
   GET /members
========================================================= */

const membersApi =
  axios.create({
    baseURL: "/",

    withCredentials:
      true,

    timeout:
      45000,

    headers: {
      Accept:
        "application/json",
    },
  });

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   EXTRACT MEMBERS
========================================================= */

const extractMembers = (
  responseData
) => {
  if (
    Array.isArray(
      responseData
    )
  ) {
    return responseData;
  }

  const root =
    asObject(
      responseData
    );

  const data =
    root.data;

  if (
    Array.isArray(
      root.members
    )
  ) {
    return root.members;
  }

  if (
    Array.isArray(
      root.users
    )
  ) {
    return root.users;
  }

  if (
    Array.isArray(
      root.results
    )
  ) {
    return root.results;
  }

  if (
    Array.isArray(
      data
    )
  ) {
    return data;
  }

  const nested =
    asObject(
      data
    );

  if (
    Array.isArray(
      nested.members
    )
  ) {
    return nested.members;
  }

  if (
    Array.isArray(
      nested.users
    )
  ) {
    return nested.users;
  }

  return [];
};

/* =========================================================
   NORMALIZE MEMBER
========================================================= */

export const normalizeMemberListItem =
  (
    value,
    index = 0
  ) => {
    const member =
      asObject(
        value
      );

    return {
      ...member,

      id:
        member.id ??
        member.user_id ??
        index +
          1,

      first_name:
        toText(
          member.first_name ??
            member.firstName
        ),

      last_name:
        toText(
          member.last_name ??
            member.lastName
        ),

      email:
        toText(
          member.email
        ),

      phone:
        toText(
          member.phone ??
            member.mobile ??
            member.contact_number
        ),

      membership_type:
        toText(
          member.membership_type ??
            member.membershipType,
          "Member"
        ),

      login_id:
        toText(
          member.login_id ??
            member.loginId
        ),

      payment_status:
        toText(
          member.payment_status ??
            member.paymentStatus,
          "pending"
        ).toLowerCase(),
    };
  };

/* =========================================================
   GET MEMBERS

   GET /members
========================================================= */

export const getMembers =
  async ({
    signal,
  } = {}) => {
    try {
      const response =
        await membersApi.get(
          "/members",
          {
            signal,

            headers: {
              Accept:
                "application/json",

              "X-Requested-With":
                "XMLHttpRequest",
            },
          }
        );

      if (
        typeof response.data ===
        "string"
      ) {
        throw new Error(
          "Members API returned HTML instead of JSON."
        );
      }

      const members =
        extractMembers(
          response.data
        ).map(
          (
            member,
            index
          ) =>
            normalizeMemberListItem(
              member,
              index
            )
        );

      return {
        success:
          true,

        members,

        total:
          members.length,

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      error.statusCode =
        Number(
          error?.response
            ?.status ||
            error
              ?.statusCode ||
            0
        );

      const responseData =
        asObject(
          error?.response
            ?.data
        );

      error.apiMessage =
        toText(
          responseData.message ??
            responseData.error ??
            error.message,
          "Unable to load members."
        );

      error.sessionExpired =
        error.statusCode ===
        401;

      error.unauthorized =
        error.statusCode ===
        401;

      throw error;
    }
  };

/* =========================================================
   COMPATIBILITY
========================================================= */

export const fetchMembers =
  getMembers;

export const getAllMembers =
  getMembers;

export const fetchAllMembers =
  getMembers;

/* =========================================================
   DEFAULT
========================================================= */

const membersService = {
  getMembers,
  fetchMembers,
  getAllMembers,
  fetchAllMembers,
  normalizeMemberListItem,
};

export default membersService;