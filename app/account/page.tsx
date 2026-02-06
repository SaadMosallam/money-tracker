import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/db/queries/users";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { UserProfileForm } from "@/components/business/account/UserProfileForm";
import { updateUserProfile } from "@/lib/actions/updateUserProfile";
import {
  setUserAvatarUrl,
  deleteUserAvatar,
} from "@/lib/actions/updateUserAvatar";
import ApprovalsPanel from "@/components/business/account/ApprovalsPanel";
import { ApprovalsClientWrapper } from "@/components/business/account/ApprovalsClientWrapper";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { db } from "@/lib/db";
import { approvalNotifications } from "@/lib/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

type AccountPageProps = {
  searchParams?: Promise<{
    tab?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(approvalNotifications)
    .where(
      and(
        eq(approvalNotifications.userId, user.id),
        isNull(approvalNotifications.resolvedAt)
      )
    );
  const approvalCount = countRow?.count ?? 0;
  const activeTab =
    params?.tab === "approvals" ? "approvals" : "profile";

  return (
    <PageContainer title="Account" maxWidthClassName="max-w-6xl">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              activeTab === "profile"
                ? "bg-foreground text-background"
                : "bg-muted text-foreground hover:bg-muted/80"
            )}
          >
            Profile
          </Link>
          <Link
            href="/account?tab=approvals"
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              activeTab === "approvals"
                ? "bg-foreground text-background"
                : "bg-muted text-foreground hover:bg-muted/80"
            )}
          >
            <span className="flex items-center gap-2">
              Approvals
              {approvalCount > 0 && (
                <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-white">
                  {approvalCount}
                </span>
              )}
            </span>
          </Link>
        </div>

        {activeTab === "approvals" ? (
          <ApprovalsClientWrapper>
            <ApprovalsPanel userId={user.id} />
          </ApprovalsClientWrapper>
        ) : (
          <UserProfileForm
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              avatarUrl: user.avatarUrl,
            }}
            action={updateUserProfile}
            setAvatarAction={setUserAvatarUrl}
            deleteAvatarAction={deleteUserAvatar}
          />
        )}
      </div>
    </PageContainer>
  );
}
