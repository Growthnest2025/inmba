const repository = require(
  "../repositories/civilianKyc.repository"
);

const FILE_FIELDS = new Set([
  "aadhaar_front",
  "aadhaar_back",
  "pan_card_scan",
  "address_proof",
  "bank_proof",
  "nominee_id",
  "education_certificate",
  "profile_photo",
  "cover_photo",
  "gallery_photos",
  "intro_video",
]);

const FILE_SECTIONS = {
  aadhaar_front: "A",
  aadhaar_back: "A",
  pan_card_scan: "A",

  address_proof: "B",

  bank_proof: "C",
  nominee_id: "C",

  education_certificate: "D",

  profile_photo: "F",
  cover_photo: "F",
  gallery_photos: "F",
  intro_video: "F",
};

const VALID_CIVILIAN_PLANS = new Set([
  "300",
  "1500",
]);

const toText = (value) =>
  String(
    value ?? ""
  ).trim();

/* =========================================================
   SECTIONS
========================================================= */

const buildSections = (row) => {
  const output = {};

  for (
    const section
    of repository.CIVILIAN_KYC_SECTIONS
  ) {
    output[section] = {
      completed:
        Boolean(
          row?.[
            repository.completionColumn(
              section
            )
          ]
        ),
    };
  }

  return output;
};

/* =========================================================
   FILES
========================================================= */

const buildFiles = (row) => {
  const output = {};

  FILE_FIELDS.forEach(
    (field) => {
      if (
        row?.[field]
      ) {
        output[field] =
          row[field];
      }
    }
  );

  return output;
};

/* =========================================================
   PUBLIC / EDITABLE VALUES
========================================================= */

const publicValues = (
  row,
  member
) => {
  const values = {
    ...(row || {}),
  };

  [
    "id",
    "member_id",
    "created_at",
    "updated_at",
    "submitted_at",

    "section_a_completed",
    "section_b_completed",
    "section_c_completed",
    "section_d_completed",
    "section_e_completed",
    "section_f_completed",
    "section_g_completed",
    "section_h_completed",
  ].forEach(
    (key) =>
      delete values[key]
  );

  FILE_FIELDS.forEach(
    (field) =>
      delete values[field]
  );

  /* =====================================================
     BASIC KYC FALLBACK VALUES
  ===================================================== */

  if (
    !values.full_legal_name
  ) {
    values.full_legal_name =
      toText(
        member?.name
      ) ||
      [
        toText(
          member?.first_name
        ),
        toText(
          member?.last_name
        ),
      ]
        .filter(
          Boolean
        )
        .join(
          " "
        );
  }

  if (
    !values.primary_email
  ) {
    values.primary_email =
      toText(
        member?.email
      );
  }

  if (
    !values.primary_mobile
  ) {
    values.primary_mobile =
      toText(
        member?.phone ??
        member?.mobile
      );
  }

  /* =====================================================
     SYSTEM GENERATED NETWORK VALUES
  ===================================================== */

  values.sponsor_referral_id =
    toText(
      member?.referral_id ??
      member?.referred_by
    );

  values.network_level_rank =
    toText(
      member?.network_level
    );

  values.team_size =
    Number(
      member?.direct_network ||
      0
    ) +
    Number(
      member?.indirect_network ||
      0
    );

  values.royalty_slab_category =
    toText(
      member?.royalty_slab_category
    );

  return values;
};

/* =========================================================
   GET FULL KYC
========================================================= */

const getFullKyc =
  async (
    memberId
  ) => {
    const [
      row,
      member,
    ] =
      await Promise.all([
        repository.getByMemberId(
          memberId
        ),

        repository.findMemberById(
          memberId
        ),
      ]);

    const selectedPlan =
      toText(
        row?.selected_plan
      );

    return {
      values:
        publicValues(
          row,
          member
        ),

      files:
        buildFiles(
          row
        ),

      sections:
        buildSections(
          row
        ),

      status:
        row?.status ||
        "draft",

      selectedPlan:
        VALID_CIVILIAN_PLANS.has(
          selectedPlan
        )
          ? selectedPlan
          : "",

      selected_plan:
        VALID_CIVILIAN_PLANS.has(
          selectedPlan
        )
          ? selectedPlan
          : null,

      planSelectedAt:
        row?.plan_selected_at ||
        null,
    };
  };

/* =========================================================
   GET SINGLE SECTION
========================================================= */

const getSection =
  async (
    memberId,
    section
  ) => {
    repository.normalizeSection(
      section
    );

    return getFullKyc(
      memberId
    );
  };

/* =========================================================
   SAVE SELECTED CIVILIAN PLAN
========================================================= */

const savePlan =
  async (
    memberId,
    selectedPlan
  ) => {
    const normalizedPlan =
      toText(
        selectedPlan
      );

    if (
      !VALID_CIVILIAN_PLANS.has(
        normalizedPlan
      )
    ) {
      const error =
        new Error(
          "Invalid Civilian plan. Please select 300 or 1500."
        );

      error.statusCode =
        422;

      error.errorCode =
        "INVALID_CIVILIAN_PLAN";

      throw error;
    }

    /*
      IMPORTANT:
      memberId comes only from authenticated session
      in controller.

      Client cannot choose another member id.
    */

    await repository.savePlan(
      memberId,
      normalizedPlan
    );

    return getFullKyc(
      memberId
    );
  };

/* =========================================================
   SAVE SECTION
========================================================= */

const saveSection =
  async (
    memberId,
    section,
    values,
    files,
    completed
  ) => {
    const normalized =
      repository.normalizeSection(
        section
      );

    const source = {
      ...(values || {}),
    };

    /* =====================================================
       ADD UPLOADED FILE VALUES
    ===================================================== */

    for (
      const [
        field,
        storedValue,
      ]
      of Object.entries(
        files || {}
      )
    ) {
      if (
        FILE_SECTIONS[
          field
        ] ===
        normalized
      ) {
        source[field] =
          storedValue;
      }
    }

    /* =====================================================
       SECTION G SYSTEM VALUES MUST NOT BE USER EDITABLE
    ===================================================== */

    if (
      normalized ===
      "G"
    ) {
      [
        "sponsor_referral_id",
        "network_level_rank",
        "team_size",
        "royalty_slab_category",
      ].forEach(
        (field) =>
          delete source[
            field
          ]
      );
    }

    /*
      selected_plan must ONLY be changed
      through /civilian-kyc/plan.

      Do not allow section payload to overwrite it.
    */

    delete source.selected_plan;
    delete source.selectedPlan;
    delete source.plan_selected_at;

    if (normalized === "A" && completed) {
      const existing = await repository.getByMemberId(memberId);
      if (toText(existing?.selected_plan) === "300") {
        const aadhaar = toText(
          source.aadhaar_number ?? existing?.aadhaar_number
        ).replace(/\s/g, "");

        if (!/^\d{12}$/.test(aadhaar)) {
          const error = new Error(
            aadhaar
              ? "Enter a valid 12 digit Aadhaar Number for the ₹300 plan."
              : "Aadhaar Number is required for the ₹300 plan."
          );
          error.statusCode = 422;
          error.errorCode = "CIVILIAN_AADHAAR_REQUIRED";
          throw error;
        }
      }
    }

    await repository.updateSection(
      memberId,
      normalized,
      source,
      Boolean(
        completed
      )
    );

    return getFullKyc(
      memberId
    );
  };

/* =========================================================
   PROGRESS
========================================================= */

const progress =
  async (
    memberId
  ) => {
    const data =
      await getFullKyc(
        memberId
      );

    const completed =
      Object.values(
        data.sections
      ).filter(
        (item) =>
          item.completed
      ).length;

    return {
      ...data,

      completionPercent:
        Math.round(
          (
            completed /
            repository
              .CIVILIAN_KYC_SECTIONS
              .length
          ) *
          100
        ),
    };
  };

/* =========================================================
   SUBMIT FULL KYC
========================================================= */

const submit =
  async (
    memberId
  ) => {
    const data =
      await progress(
        memberId
      );

    /*
      Plan must be selected before
      Civilian Full KYC submission.
    */

    if (
      !VALID_CIVILIAN_PLANS.has(
        toText(
          data.selectedPlan
        )
      )
    ) {
      const error =
        new Error(
          "Please select the Civilian ₹300 or ₹1500 plan before submitting Full KYC."
        );

      error.statusCode =
        422;

      error.errorCode =
        "CIVILIAN_PLAN_REQUIRED";

      throw error;
    }

    if (toText(data.selectedPlan) === "300") {
      const aadhaar = toText(
        data.values?.aadhaar_number
      ).replace(/\s/g, "");

      if (!/^\d{12}$/.test(aadhaar)) {
        const error = new Error(
          aadhaar
            ? "Enter a valid 12 digit Aadhaar Number for the ₹300 plan."
            : "Aadhaar Number is required for the ₹300 plan."
        );
        error.statusCode = 422;
        error.errorCode = "CIVILIAN_AADHAAR_REQUIRED";
        throw error;
      }
    }

    const incomplete =
      Object.entries(
        data.sections
      )
        .filter(
          (
            [
              ,
              value,
            ]
          ) =>
            !value.completed
        )
        .map(
          (
            [
              section,
            ]
          ) =>
            section
        );

    if (
      incomplete.length
    ) {
      const error =
        new Error(
          `Complete Civilian KYC sections ${incomplete.join(
            ", "
          )} before submission.`
        );

      error.statusCode =
        422;

      error.errorCode =
        "CIVILIAN_KYC_INCOMPLETE";

      throw error;
    }

    await repository.submit(
      memberId
    );

    return getFullKyc(
      memberId
    );
  };

/* =========================================================
   REOPEN
========================================================= */

const reopen =
  async (
    memberId
  ) => {
    await repository.reopen(
      memberId
    );

    return getFullKyc(
      memberId
    );
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getFullKyc,
  getSection,

  savePlan,

  saveSection,
  progress,
  submit,
  reopen,
}