/*
  Flask split_full_name():

  Empty:
    [None, None]

  One word:
    first_name = word
    last_name = None

  Multiple words:
    first_name = first word
    last_name = remaining words
*/
const splitFullName =
  (fullName) => {
    const normalizedName =
      String(fullName || "")
        .trim()
        .replace(
          /\s+/g,
          " "
        );

    if (
      !normalizedName
    ) {
      return {
        firstName: null,
        lastName: null,
      };
    }

    const parts =
      normalizedName.split(" ");

    if (
      parts.length === 1
    ) {
      return {
        firstName:
          parts[0],

        lastName:
          null,
      };
    }

    return {
      firstName:
        parts[0],

      lastName:
        parts
          .slice(1)
          .join(" "),
    };
  };

const joinMemberName =
  (
    firstName,
    lastName
  ) => {
    return [
      firstName,
      lastName,
    ]
      .map(
        (value) =>
          String(value || "")
            .trim()
      )
      .filter(Boolean)
      .join(" ");
  };

module.exports = {
  splitFullName,
  joinMemberName,
};