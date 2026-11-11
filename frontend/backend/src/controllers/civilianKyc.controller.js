const civilianKycService = require(
  "../services/civilianKyc.service"
);

const civilianKycRepository = require(
  "../repositories/civilianKyc.repository"
);

const toText = (value) =>
  String(
    value ?? ""
  ).trim();

const toPositiveInteger = (value) => {
  const number =
    Number(
      value
    );

  return (
    Number.isInteger(
      number
    ) &&
    number > 0
  )
    ? number
    : null;
};

/* =========================================================
   GET MEMBER ID FROM SESSION
========================================================= */

const getSessionMemberId = (req) => {
  const candidates = [
    req?.member?.id,

    req?.user?.id,

    req?.auth?.memberId,

    req?.auth?.member_id,

    req?.session?.memberId,

    req?.session?.member_id,

    req?.session?.userId,

    req?.session?.user_id,
  ];

  for (const candidate of candidates) {
    const id =
      toPositiveInteger(
        candidate
      );

    if (id) {
      return id;
    }
  }

  return null;
};

/* =========================================================
   GET LOGIN ID FROM SESSION
========================================================= */

const getSessionLoginId = (req) => {
  const candidates = [
    req?.member?.login_id,

    req?.member?.loginId,

    req?.user?.login_id,

    req?.user?.loginId,

    req?.auth?.loginId,

    req?.auth?.login_id,

    req?.session?.loginId,

    req?.session?.login_id,

    req?.session?.userLoginId,
  ];

  for (const candidate of candidates) {
    const value =
      toText(
        candidate
      );

    if (value) {
      return value;
    }
  }

  return "";
};

/* =========================================================
   RESOLVE AUTHENTICATED MEMBER ID
========================================================= */

const resolveMemberId = async (req) => {
  const direct =
    getSessionMemberId(
      req
    );

  if (direct) {
    return direct;
  }

  const loginId =
    getSessionLoginId(
      req
    );

  if (loginId) {
    const member =
      await civilianKycRepository.findMemberByLoginId(
        loginId
      );

    if (
      member?.id
    ) {
      return Number(
        member.id
      );
    }
  }

  const error =
    new Error(
      "Member session not found. Please login again."
    );

  error.statusCode =
    401;

  error.errorCode =
    "CIVILIAN_KYC_AUTH_REQUIRED";

  throw error;
};

/* =========================================================
   SUCCESS RESPONSE
========================================================= */

const send = (
  res,
  message,
  data,
  statusCode = 200
) =>
  res
    .status(
      statusCode
    )
    .json({
      success:
        true,

      statusCode,

      message,

      data,
    });

/* =========================================================
   ASYNC CONTROLLER WRAPPER
========================================================= */

const asyncController =
  (handler) =>
    (
      req,
      res,
      next
    ) =>
      Promise.resolve(
        handler(
          req,
          res,
          next
        )
      ).catch(
        next
      );

/* =========================================================
   GET FULL CIVILIAN KYC
========================================================= */

exports.getCivilianKycController =
  asyncController(
    async (
      req,
      res
    ) => {
      const memberId =
        await resolveMemberId(
          req
        );

      const data =
        await civilianKycService.getFullKyc(
          memberId
        );

      return send(
        res,
        "Civilian Full KYC loaded.",
        data
      );
    }
  );

/* =========================================================
   GET CIVILIAN KYC PROGRESS
========================================================= */

exports.getCivilianKycProgressController =
  asyncController(
    async (
      req,
      res
    ) => {
      const memberId =
        await resolveMemberId(
          req
        );

      const data =
        await civilianKycService.progress(
          memberId
        );

      return send(
        res,
        "Civilian Full KYC progress loaded.",
        data
      );
    }
  );

/* =========================================================
   GET CIVILIAN KYC SECTION
========================================================= */

exports.getCivilianKycSectionController =
  asyncController(
    async (
      req,
      res
    ) => {
      const memberId =
        await resolveMemberId(
          req
        );

      const data =
        await civilianKycService.getSection(
          memberId,
          req.params.section
        );

      return send(
        res,
        `Civilian KYC section ${req.params.section} loaded.`,
        data
      );
    }
  );

/* =========================================================
   SAVE CIVILIAN KYC SECTION
========================================================= */

exports.saveCivilianKycSectionController =
  asyncController(
    async (
      req,
      res
    ) => {
      const memberId =
        await resolveMemberId(
          req
        );

      const completed =
        [
          "true",
          "1",
          "yes",
          "completed",
          "complete",
          "save_and_next",
        ].includes(
          toText(
            req.body?.completed
          ).toLowerCase()
        );

      const values = {
        ...(req.body || {}),
      };

      delete values.completed;

      /*
        Do not allow section payload to modify
        the selected Civilian plan.
      */

      delete values.selected_plan;
      delete values.selectedPlan;
      delete values.plan_selected_at;

      const data =
        await civilianKycService.saveSection(
          memberId,
          req.params.section,
          values,
          req.civilianKycFiles || {},
          completed
        );

      return send(
        res,
        `Civilian KYC section ${req.params.section} saved.`,
        data
      );
    }
  );

/* =========================================================
   SAVE CIVILIAN SELECTED PLAN

   PATCH /api/civilian-kyc/plan

   Body:
   {
     "selected_plan": "300"
   }

   OR

   {
     "selected_plan": "1500"
   }
========================================================= */

exports.saveCivilianPlanController =
  asyncController(
    async (
      req,
      res
    ) => {
      const memberId =
        await resolveMemberId(
          req
        );

      const selectedPlan =
        toText(
          req.body?.selected_plan ??
          req.body?.selectedPlan
        );

      if (
        ![
          "300",
          "1500",
        ].includes(
          selectedPlan
        )
      ) {
        const error =
          new Error(
            "Please select a valid Civilian plan: 300 or 1500."
          );

        error.statusCode =
          422;

        error.errorCode =
          "INVALID_CIVILIAN_PLAN";

        throw error;
      }

      const data =
        await civilianKycService.savePlan(
          memberId,
          selectedPlan
        );

      return send(
        res,
        `Civilian ₹${selectedPlan} plan selected successfully.`,
        data
      );
    }
  );

/* =========================================================
   SUBMIT CIVILIAN FULL KYC
========================================================= */

exports.submitCivilianKycController =
  asyncController(
    async (
      req,
      res
    ) => {
      const memberId =
        await resolveMemberId(
          req
        );

      const data =
        await civilianKycService.submit(
          memberId
        );

      return send(
        res,
        "Civilian Full KYC submitted successfully.",
        data
      );
    }
  );

/* =========================================================
   REOPEN CIVILIAN KYC
========================================================= */

exports.reopenCivilianKycController =
  asyncController(
    async (
      req,
      res
    ) => {
      const memberId =
        await resolveMemberId(
          req
        );

      const data =
        await civilianKycService.reopen(
          memberId
        );

      return send(
        res,
        "Civilian Full KYC reopened.",
        data
      );
    }
  );