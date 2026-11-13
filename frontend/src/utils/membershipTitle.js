/* =========================================================
   INMBA MEMBERSHIP TITLE HELPER
   - 299 / 300 plan: "INMBA Network Member"
   - 2999 / 1500 plan: "INMBA Network Royalty Member"
   - Default / starting: "INMBA Member"
========================================================= */

export function getMembershipTitle(profileOrPlan, fallback = "INMBA Member") {
  if (!profileOrPlan && !fallback) return "INMBA Member";

  let plan = "";
  let memberType = "";

  if (typeof profileOrPlan === "object" && profileOrPlan !== null) {
    plan = String(
      profileOrPlan.selected_plan ??
      profileOrPlan.plan ??
      profileOrPlan.plan_amount ??
      profileOrPlan.membership_plan ??
      profileOrPlan.selectedPlan ??
      ""
    ).trim();

    memberType = String(
      profileOrPlan.membership_title ??
      profileOrPlan.membership_type ??
      profileOrPlan.user_type ??
      ""
    ).trim();
  } else {
    plan = String(profileOrPlan || "").trim();
  }

  const cleanDigits = plan.replace(/[^0-9]/g, "");

  if (
    cleanDigits === "299" ||
    cleanDigits === "300" ||
    /network\s*member/i.test(memberType) ||
    /network\s*member/i.test(plan)
  ) {
    return "INMBA Network Member";
  }

  if (
    cleanDigits === "2999" ||
    cleanDigits === "1500" ||
    /royalt/i.test(memberType) ||
    /royalt/i.test(plan)
  ) {
    return "INMBA Network Royalty Member";
  }

  if (/royalt/i.test(memberType)) return "INMBA Network Royalty Member";
  if (/network\s*member/i.test(memberType)) return "INMBA Network Member";

  return fallback || "INMBA Member";
}

export default getMembershipTitle;
