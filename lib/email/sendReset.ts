import { resend, getEmailFrom, getAppBaseUrl } from "@/lib/email/resend";

const canSend = () => Boolean(resend && getEmailFrom());

export const sendPasswordResetEmail = async (
  toEmail: string,
  data: { recipientName: string; token: string; locale?: string }
) => {
  if (!canSend()) return;
  const locale = data.locale ?? "en";
  const resetUrl = `${getAppBaseUrl()}/${locale}/reset-password?token=${data.token}`;

  const subject = "Reset your password";
  const text = `Hi ${data.recipientName},\n\nUse this link to reset your password:\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.\n\nMoney Tracker`;
  const html = `
    <p>Hi ${data.recipientName},</p>
    <p>Use this link to reset your password:</p>
    <p><a href="${resetUrl}">Reset password</a></p>
    <p>If you didn't request this, you can ignore this email.</p>
    <p>Money Tracker</p>
  `;

  await resend!.emails.send({
    from: getEmailFrom(),
    to: toEmail,
    subject,
    text,
    html,
  });
};
