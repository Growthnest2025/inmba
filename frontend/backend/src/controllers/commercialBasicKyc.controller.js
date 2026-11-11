const commercialBasicKycService =
  require("../services/commercialBasicKyc.service");


function sendError(res, error) {
  const statusCode =
    error?.statusCode || 500;

  return res
    .status(statusCode)
    .json({
      success: false,
      message:
        error?.message ||
        "Something went wrong.",
      errors:
        error?.errors || null,
    });
}


/* =========================================================
   CREATE / SAVE BASIC KYC
========================================================= */

async function saveCommercialBasicKyc(
  req,
  res
) {
  try {
    const result =
      await commercialBasicKycService
        .saveCommercialBasicKyc(
          req.body || {}
        );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Commercial Basic KYC saved successfully.",
        data: {
          commercialBasicKyc:
            result,
        },
      });
  } catch (error) {
    console.error(
      "Commercial Basic KYC save error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}


/* =========================================================
   GET BY LOGIN ID
========================================================= */

async function getByLoginId(
  req,
  res
) {
  try {
    const {
      loginId,
    } =
      req.params;

    const result =
      await commercialBasicKycService
        .getByLoginId(
          loginId
        );

    if (!result) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Commercial Basic KYC not found.",
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        data: {
          commercialBasicKyc:
            result,
        },
      });
  } catch (error) {
    console.error(
      "Commercial Basic KYC get error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}


/* =========================================================
   GET BY MOBILE
========================================================= */

async function getByMobile(
  req,
  res
) {
  try {
    const {
      mobile,
    } =
      req.params;

    const result =
      await commercialBasicKycService
        .getByMobile(
          mobile
        );

    if (!result) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Commercial Basic KYC not found.",
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        data: {
          commercialBasicKyc:
            result,
        },
      });
  } catch (error) {
    console.error(
      "Commercial Basic KYC mobile lookup error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}


/* =========================================================
   UPDATE STATUS
========================================================= */

async function updateStatus(
  req,
  res
) {
  try {
    const {
      id,
    } =
      req.params;

    const {
      status,
    } =
      req.body || {};

    const result =
      await commercialBasicKycService
        .updateStatus(
          id,
          status
        );

    return res
      .status(200)
      .json({
        success: true,
        message:
          "Commercial Basic KYC status updated successfully.",
        data: {
          commercialBasicKyc:
            result,
        },
      });
  } catch (error) {
    console.error(
      "Commercial Basic KYC status update error:",
      error
    );

    return sendError(
      res,
      error
    );
  }
}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  saveCommercialBasicKyc,
  getByLoginId,
  getByMobile,
  updateStatus,
};