import api from "../api/api";

export const CIVILIAN_KYC_BASE_URL =
  "/civilian-kyc";

export const CIVILIAN_KYC_SECTIONS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
];

export const CIVILIAN_KYC_SECTION_TITLES = {
  A: "Identity & KYC",
  B: "Contact & Address",
  C: "Financial & Bank",
  D: "Education & Qualification",
  E: "Achievements & Certifications",
  F: "Interest, Skills & Bio",
  G: "Network / Royalty Details",
  H: "Emergency Contact",
};

const dataOf = (response) =>
  response?.data?.data ??
  response?.data ??
  null;

/* =========================================================
   GET FULL CIVILIAN KYC
========================================================= */

export async function getCivilianKyc() {
  const response =
    await api.get(
      CIVILIAN_KYC_BASE_URL
    );

  return dataOf(
    response
  );
}

/* =========================================================
   GET CIVILIAN KYC PROGRESS
========================================================= */

export async function getCivilianKycProgress() {
  const response =
    await api.get(
      `${CIVILIAN_KYC_BASE_URL}/progress`
    );

  return dataOf(
    response
  );
}

/* =========================================================
   GET SINGLE CIVILIAN KYC SECTION
========================================================= */

export async function getCivilianKycSection(
  section
) {
  const normalizedSection =
    String(
      section
    ).toUpperCase();

  const response =
    await api.get(
      `${CIVILIAN_KYC_BASE_URL}/sections/${normalizedSection}`
    );

  return dataOf(
    response
  );
}

/* =========================================================
   SAVE CIVILIAN SELECTED PLAN

   PATCH /api/civilian-kyc/plan

   Body:
   {
     selected_plan: "300"
   }

   OR

   {
     selected_plan: "1500"
   }

   IMPORTANT:
   Backend DB is the source of truth.
========================================================= */

export async function saveCivilianKycPlan(
  selectedPlan
) {
  const plan =
    String(
      selectedPlan ?? ""
    ).trim();

  if (
    ![
      "300",
      "1500",
    ].includes(
      plan
    )
  ) {
    throw new Error(
      "Invalid Civilian plan. Please select ₹300 or ₹1500."
    );
  }

  const response =
    await api.patch(
      `${CIVILIAN_KYC_BASE_URL}/plan`,
      {
        selected_plan:
          plan,
      }
    );

  return dataOf(
    response
  );
}

/* =========================================================
   BUILD FORM DATA
========================================================= */

const buildFormData = (
  values = {},
  completed = false
) => {
  const formData =
    new FormData();

  formData.append(
    "completed",
    completed
      ? "true"
      : "false"
  );

  Object.entries(
    values
  ).forEach(
    (
      [
        key,
        value,
      ]
    ) => {
      if (
        value === undefined ||
        value === null
      ) {
        return;
      }

      /* =====================================================
         FILE LIST
      ===================================================== */

      if (
        typeof FileList !== "undefined" &&
        value instanceof FileList
      ) {
        Array.from(
          value
        ).forEach(
          (file) => {
            formData.append(
              key,
              file
            );
          }
        );

        return;
      }

      /* =====================================================
         SINGLE FILE
      ===================================================== */

      if (
        typeof File !== "undefined" &&
        value instanceof File
      ) {
        formData.append(
          key,
          value
        );

        return;
      }

      /* =====================================================
         ARRAY
      ===================================================== */

      if (
        Array.isArray(
          value
        )
      ) {
        formData.append(
          key,
          JSON.stringify(
            value
          )
        );

        return;
      }

      /* =====================================================
         NORMAL VALUE
      ===================================================== */

      formData.append(
        key,
        String(
          value
        )
      );
    }
  );

  return formData;
};

/* =========================================================
   SAVE CIVILIAN KYC SECTION
========================================================= */

export async function saveCivilianKycSection(
  section,
  values,
  completed = false
) {
  const normalizedSection =
    String(
      section
    ).toUpperCase();

  const formData =
    buildFormData(
      values,
      completed
    );

  const response =
    await api.patch(
      `${CIVILIAN_KYC_BASE_URL}/sections/${normalizedSection}`,
      formData
    );

  return dataOf(
    response
  );
}

/* =========================================================
   SUBMIT CIVILIAN FULL KYC
========================================================= */

export async function submitCivilianKyc() {
  const response =
    await api.post(
      `${CIVILIAN_KYC_BASE_URL}/submit`
    );

  return dataOf(
    response
  );
}

/* =========================================================
   REOPEN CIVILIAN FULL KYC
========================================================= */

export async function reopenCivilianKyc() {
  const response =
    await api.post(
      `${CIVILIAN_KYC_BASE_URL}/reopen`
    );

  return dataOf(
    response
  );
}