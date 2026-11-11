export const getMembershipLevel = ({
  selectedPlan,
  paymentStatus,
}) => {
  const plan = String(
    selectedPlan ?? ""
  ).trim();

  const status = String(
    paymentStatus ?? ""
  )
    .trim()
    .toLowerCase();

  if (status !== "approved") {
    return "INMBA Member";
  }

  if (plan === "300") {
    return "INMBA Network Member";
  }

  if (plan === "1500") {
    return "INMBA Network Royalty Member";
  }

  return "INMBA Member";
};