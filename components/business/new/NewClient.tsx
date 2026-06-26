"use client";

import { useState } from "react";
import { Receipt, ArrowRightLeft } from "lucide-react";
import { ExpenseForm } from "@/components/business/expense/ExpenseForm";
import { PaymentCreateForm } from "@/components/business/payment/PaymentCreateForm";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { cn } from "@/lib/utils/cn";
import type { Dictionary } from "@/lib/i18n";

type Tab = "expense" | "payment";

type UserOption = {
  id: string;
  name: string;
};

type Props = {
  locale: string;
  t: Dictionary;
  users: UserOption[];
  currentUserId: string;
  currentUserName: string;
  createExpense: (formData: FormData) => void;
  createPayment: (formData: FormData) => void;
};

export function NewClient({
  locale,
  t,
  users,
  currentUserId,
  currentUserName,
  createExpense,
  createPayment,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("expense");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "expense", label: t.expenses, icon: <Receipt className="h-4 w-4" /> },
    { id: "payment", label: t.payments, icon: <ArrowRightLeft className="h-4 w-4" /> },
  ];

  return (
    <PageContainer title={t.new}>
      <div className="mb-6 inline-flex rounded-lg border bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "expense" && (
        <ExpenseForm
          users={users}
          action={createExpense}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          locale={locale}
          t={t}
        />
      )}

      {activeTab === "payment" && (
        <PaymentCreateForm
          users={users}
          action={createPayment}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          locale={locale}
          t={t}
        />
      )}
    </PageContainer>
  );
}
