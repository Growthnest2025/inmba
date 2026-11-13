import { getMembershipLevel } from "./membershipLevel";

export function buildDefaultBio({
  name = "",
  membershipLabel = "",
  plan = "",
  membershipType = "",
} = {}) {
  const cleanName = String(name || "").trim() || "Member";
  const cleanPlan = String(plan || "").trim();
  const planTier = cleanPlan
    ? getMembershipLevel({
        selectedPlan: cleanPlan,
        paymentStatus: "approved",
      })
    : "";

  const resolvedLabel =
    String(membershipLabel || "").trim() ||
    (planTier && planTier !== "INMBA Member" ? planTier : "") ||
    String(membershipType || "").trim() ||
    "INMBA Member";

  return `Hi, I am ${cleanName}, an ${resolvedLabel} affiliated with the Indian Medical & Business Association (INMBA).`;
}

export default buildDefaultBio;
