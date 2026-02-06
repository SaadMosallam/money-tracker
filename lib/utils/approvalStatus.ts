export type ApprovalStatus = "pending" | "approved" | "rejected";

export const computeApprovalStatus = (
  approvals: { status: string }[]
): ApprovalStatus => {
  if (approvals.length === 0) return "approved";
  if (approvals.some((approval) => approval.status === "rejected")) {
    return "rejected";
  }
  if (approvals.every((approval) => approval.status === "approved")) {
    return "approved";
  }
  return "pending";
};
