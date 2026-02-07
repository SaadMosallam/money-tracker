import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/db/queries/users";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { UserProfileForm } from "@/components/business/account/UserProfileForm";
import {
  updateUserInfo,
  updateUserPassword,
} from "@/lib/actions/updateUserProfile";
import {
  setUserAvatarUrl,
  deleteUserAvatar,
} from "@/lib/actions/updateUserAvatar";
import ApprovalsPanel from "@/components/business/account/ApprovalsPanel";
import { ApprovalsClientWrapper } from "@/components/business/account/ApprovalsClientWrapper";
import Link from "next/link";
import { db } from "@/lib/db";
import { approvalNotifications } from "@/lib/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDictionary, Locale } from "@/lib/i18n";
import { AccountTabsBar } from "@/components/business/account/AccountTabsBar";

type AccountPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams?: Promise<{
    tab?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AccountPage({
  params,
  searchParams,
}: AccountPageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const search = await searchParams;
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
    search?.tab === "approvals" ? "approvals" : "profile";
  const t = getDictionary(locale);
  const switchLocale = locale === "ar" ? "en" : "ar";
  const switchLocaleHref = `/${switchLocale}/account?tab=${activeTab}`;
  const switchLocaleLabel =
    switchLocale === "ar" ? t.switchToArabic : t.switchToEnglish;

  return (
    <PageContainer title={t.account} maxWidthClassName="max-w-6xl">
      <div className="space-y-6">
        <AccountTabsBar
          locale={locale}
          activeTab={activeTab}
          approvalCount={approvalCount}
          switchLocaleHref={switchLocaleHref}
          switchLocaleLabel={switchLocaleLabel}
          t={t}
        />

        {activeTab === "approvals" ? (
          <ApprovalsClientWrapper>
            <ApprovalsPanel userId={user.id} locale={locale} t={t} />
          </ApprovalsClientWrapper>
        ) : (
          <UserProfileForm
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              avatarUrl: user.avatarUrl,
            }}
            locale={locale}
            t={t}
            updateProfileAction={updateUserInfo}
            updatePasswordAction={updateUserPassword}
            setAvatarAction={setUserAvatarUrl}
            deleteAvatarAction={deleteUserAvatar}
          />
        )}
      </div>
    </PageContainer>
  );
}
