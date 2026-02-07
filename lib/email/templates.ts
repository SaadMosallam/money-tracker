const formatAmount = (cents: number) => {
  const value = (cents / 100).toFixed(2);
  return `${value} EGP`;
};

export type PendingApprovalEmail = {
  recipientName: string;
  entityType: "expense" | "payment";
  title?: string;
  amountCents: number;
  paidByName?: string;
  fromName?: string;
  toName?: string;
  approvalsUrl: string;
};

export type DecisionEmail = {
  recipientName: string;
  entityType: "expense" | "payment";
  decision: "approved" | "rejected";
  amountCents: number;
  title?: string;
  paidByName?: string;
  fromName?: string;
  toName?: string;
  decidedByName: string;
  detailsUrl: string;
};

export const buildPendingApprovalEmail = (data: PendingApprovalEmail) => {
  const subject =
    data.entityType === "expense"
      ? "Approval needed: New expense"
      : "Approval needed: New payment";

  const amount = formatAmount(data.amountCents);
  const details =
    data.entityType === "expense"
      ? `Expense: ${data.title ?? "Untitled"}\nPaid by: ${data.paidByName ?? "—"}`
      : `Payment: ${data.fromName ?? "—"} → ${data.toName ?? "—"}`;

  const text = `Hi ${data.recipientName},\n\nYou have a new ${
    data.entityType
  } waiting for your approval.\n\n${details}\nAmount: ${amount}\n\nReview and approve here: ${
    data.approvalsUrl
  }\n\nThanks,\nMoney Tracker`;

  const html = `
    <p>Hi ${data.recipientName},</p>
    <p>You have a new ${data.entityType} waiting for your approval.</p>
    <p><strong>${details.replace("\n", "<br />")}</strong><br />
    Amount: <strong>${amount}</strong></p>
    <p><a href="${data.approvalsUrl}">Review and approve</a></p>
    <p>Thanks,<br />Money Tracker</p>
  `;

  return { subject, text, html };
};

export const buildDecisionEmail = (data: DecisionEmail) => {
  const subject =
    data.entityType === "expense"
      ? `Expense ${data.decision}`
      : `Payment ${data.decision}`;

  const amount = formatAmount(data.amountCents);
  const details =
    data.entityType === "expense"
      ? `Expense: ${data.title ?? "Untitled"}\nPaid by: ${data.paidByName ?? "—"}`
      : `Payment: ${data.fromName ?? "—"} → ${data.toName ?? "—"}`;

  const text = `Hi ${data.recipientName},\n\nYour ${
    data.entityType
  } was ${data.decision} by ${data.decidedByName}.\n\n${details}\nAmount: ${amount}\n\nView details: ${
    data.detailsUrl
  }\n\nThanks,\nMoney Tracker`;

  const html = `
    <p>Hi ${data.recipientName},</p>
    <p>Your ${data.entityType} was <strong>${data.decision}</strong> by ${
    data.decidedByName
  }.</p>
    <p><strong>${details.replace("\n", "<br />")}</strong><br />
    Amount: <strong>${amount}</strong></p>
    <p><a href="${data.detailsUrl}">View details</a></p>
    <p>Thanks,<br />Money Tracker</p>
  `;

  return { subject, text, html };
};
