class ApiResponse {
  constructor(
    statusCode,
    data = null,
    message = "Request completed successfully."
  ) {
    this.success =
      statusCode >= 200 &&
      statusCode < 400;

    this.statusCode = statusCode;

    this.message = message;

    this.data = data;
  }
}

module.exports = ApiResponse;