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
import { getDictionary, Locale } from "@/lib/i18n";
import { Languages } from "lucide-react";

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
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/${locale}/account`}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              activeTab === "profile"
                ? "bg-foreground text-background"
                : "bg-muted text-foreground hover:bg-muted/80"
            )}
          >
            {t.profile}
          </Link>
          <Link
            href={`/${locale}/account?tab=approvals`}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              activeTab === "approvals"
                ? "bg-foreground text-background"
                : "bg-muted text-foreground hover:bg-muted/80"
            )}
          >
            <span className="flex items-center gap-2">
              {t.approvals}
              {approvalCount > 0 && (
                <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-white">
                  {approvalCount}
                </span>
              )}
            </span>
          </Link>
          <Link
            href={switchLocaleHref}
            aria-label={switchLocaleLabel}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <Languages className="h-4 w-4" />
            {switchLocaleLabel}
          </Link>
        </div>

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
            action={updateUserProfile}
            setAvatarAction={setUserAvatarUrl}
            deleteAvatarAction={deleteUserAvatar}
          />
        )}
      </div>
    </PageContainer>
  );
}
