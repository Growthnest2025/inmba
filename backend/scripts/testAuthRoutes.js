require(
  "dotenv"
).config();

const assert =
  require(
    "node:assert/strict"
  );

const BASE_URL =
  String(
    process.env
      .BACKEND_URL ||
      "http://127.0.0.1:5000"
  ).replace(
    /\/+$/,
    ""
  );

const request =
  async (
    path,
    options = {}
  ) => {
    const response =
      await fetch(
        `${BASE_URL}${path}`,
        options
      );

    const text =
      await response.text();

    let data =
      null;

    if (text) {
      try {
        data =
          JSON.parse(
            text
          );
      } catch {
        data =
          text;
      }
    }

    return {
      response,
      data,
      text,
    };
  };

const run =
  async () => {
    console.log(
      "Starting auth route test..."
    );

    console.log(
      `Backend URL: ${BASE_URL}`
    );

    /*
      /api/me without login
    */
    console.log(
      "\nTesting unauthenticated /api/me..."
    );

    const meResult =
      await request(
        "/api/me"
      );

    assert.equal(
      meResult.response
        .status,
      200
    );

    assert.equal(
      meResult.data
        .login_id,
      null
    );

    assert.equal(
      meResult.data
        .authenticated,
      false
    );

    console.log(
      "Unauthenticated /api/me: passed"
    );

    /*
      GET login state
    */
    console.log(
      "\nTesting GET /api/login..."
    );

    const loginStateResult =
      await request(
        "/api/login"
      );

    assert.equal(
      loginStateResult
        .response.status,
      200
    );

    assert.equal(
      loginStateResult
        .data.success,
      true
    );

    assert.ok(
      Object.prototype
        .hasOwnProperty.call(
          loginStateResult
            .data.data,
          "prefillId"
        )
    );

    console.log(
      "GET /api/login state: passed"
    );

    /*
      Missing login fields
    */
    console.log(
      "\nTesting missing login credentials..."
    );

    const missingResult =
      await request(
        "/api/login",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              {}
            ),
        }
      );

    assert.equal(
      missingResult
        .response.status,
      400
    );

    assert.equal(
      missingResult
        .data.errorCode,
      "VALIDATION_ERROR"
    );

    console.log(
      "Missing login credentials: passed"
    );

    /*
      Invalid credentials
    */
    console.log(
      "\nTesting invalid login credentials..."
    );

    const invalidResult =
      await request(
        "/api/login",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              login_id:
                "0000000",

              password:
                "Wrong@123",
            }),
        }
      );

    assert.equal(
      invalidResult
        .response.status,
      401
    );

    assert.equal(
      invalidResult
        .data.message,
      "Invalid login ID or password."
    );

    assert.equal(
      invalidResult
        .data.errorCode,
      "INVALID_CREDENTIALS"
    );

    console.log(
      "Invalid login credentials: passed"
    );

    /*
      API logout without an active session
      should still return success.
    */
    console.log(
      "\nTesting POST /api/logout..."
    );

    const logoutResult =
      await request(
        "/api/logout",
        {
          method:
            "POST",
        }
      );

    assert.equal(
      logoutResult
        .response.status,
      200
    );

    assert.equal(
      logoutResult
        .data.success,
      true
    );

    assert.equal(
      logoutResult
        .data.data
        .authenticated,
      false
    );

    assert.equal(
      logoutResult
        .data.data
        .redirectTo,
      "/login"
    );

    console.log(
      "POST /api/logout: passed"
    );

    /*
      Legacy logout redirect.
    */
    console.log(
      "\nTesting legacy GET /logout..."
    );

    const legacyLogoutResult =
      await request(
        "/logout",
        {
          redirect:
            "manual",
        }
      );

    assert.equal(
      legacyLogoutResult
        .response.status,
      302
    );

    const location =
      legacyLogoutResult
        .response.headers
        .get(
          "location"
        );

    assert.ok(
      location
    );

    assert.ok(
      location.endsWith(
        "/login"
      )
    );

    console.log(
      "Legacy GET /logout redirect: passed"
    );

    console.log(
      "\nAuth route test completed successfully."
    );

    console.log(
      "No database records were inserted, updated or deleted."
    );
  };

run()
  .catch(
    (error) => {
      console.error(
        "\nAuth route test failed:"
      );

      console.error(
        error
      );

      process.exitCode =
        1;
    }
  );