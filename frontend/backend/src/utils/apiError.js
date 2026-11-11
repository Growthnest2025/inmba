class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong.",
    errors = [],
    stack = ""
  ) {
    super(message);

    this.name = "ApiError";

    this.statusCode = statusCode;

    this.success = false;

    this.data = null;

    this.errors = errors;

    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(
        this,
        this.constructor
      );
    }
  }
}

module.exports = ApiError;