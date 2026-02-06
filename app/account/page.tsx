import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/db/queries/users";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { UserProfileForm } from "@/components/business/account/UserProfileForm";
import { updateUserProfile } from "@/lib/actions/updateUserProfile";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    redirect("/login");
  }

  return (
    <PageContainer title="Account" maxWidthClassName="max-w-2xl">
      <UserProfileForm
        user={{ name: user.name, email: user.email }}
        action={updateUserProfile}
      />
    </PageContainer>
  );
}
