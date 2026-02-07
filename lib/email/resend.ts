import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const getEmailFrom = () => process.env.EMAIL_FROM ?? "";

export const isEmailEnabled = (flag: "PENDING" | "DECISIONS") => {
  if (flag === "PENDING") {
    return process.env.EMAIL_NOTIFICATIONS_PENDING === "true";
  }
  return process.env.EMAIL_NOTIFICATIONS_DECISIONS === "true";
};

export const getAppBaseUrl = () => {
  return (
    process.env.APP_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
};
