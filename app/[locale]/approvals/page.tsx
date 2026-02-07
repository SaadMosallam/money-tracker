import { redirect } from "next/navigation";
import { Locale } from "@/lib/i18n";

type ApprovalsPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ApprovalsPage({ params }: ApprovalsPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/account?tab=approvals`);
}
