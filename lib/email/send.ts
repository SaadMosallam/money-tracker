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

const canSend = () => Boolean(resend && getEmailFrom());

const isValidEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return false;

  const blockedDomains = new Set([
    "example.com",
    "example.org",
    "example.net",
    "test.com",
    "test.org",
    "test.net",
    "invalid",
    "invalid.com",
    "localhost",
  ]);

  const domain = normalized.split("@")[1];
  if (!domain) return false;
  if (blockedDomains.has(domain)) return false;
  return true;
};

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
