import { redirect } from "next/navigation";

export default async function ApprovalsPage() {
  redirect("/account?tab=approvals");
}
