import {
  resend,
  getEmailFrom,
  isEmailEnabled,
  getAppBaseUrl,
} from "@/lib/email/resend";
import {
  buildDecisionEmail,
  buildPendingApprovalEmail,
  DecisionEmail,
  PendingApprovalEmail,
} from "@/lib/email/templates";
import { isValidEmail } from "@/lib/validation/email";

const canSend = () => Boolean(resend && getEmailFrom());

export const sendPendingApprovalEmail = async (
  toEmail: string,
  data: Omit<PendingApprovalEmail, "approvalsUrl"> & { locale?: string }
) => {
  if (!isEmailEnabled("PENDING") || !canSend()) return;
  if (!isValidEmail(toEmail)) return;

  const locale = data.locale ?? "en";
  const approvalsUrl = `${getAppBaseUrl()}/${locale}/account?tab=approvals`;
  const { subject, text, html } = buildPendingApprovalEmail({
    ...data,
    approvalsUrl,
  });

  await resend!.emails.send({
    from: getEmailFrom(),
    to: toEmail,
    subject,
    text,
    html,
  });
};

export const sendDecisionEmail = async (
  toEmail: string,
  data: Omit<DecisionEmail, "detailsUrl"> & { locale?: string }
) => {
  if (!isEmailEnabled("DECISIONS") || !canSend()) return;
  if (!isValidEmail(toEmail)) return;

  const locale = data.locale ?? "en";
  const detailsUrl = `${getAppBaseUrl()}/${locale}/account?tab=approvals`;
  const { subject, text, html } = buildDecisionEmail({
    ...data,
    detailsUrl,
  });

  await resend!.emails.send({
    from: getEmailFrom(),
    to: toEmail,
    subject,
    text,
    html,
  });
};
