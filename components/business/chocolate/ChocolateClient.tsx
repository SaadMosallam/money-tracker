"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  Cookie as PhCookie,
  ShoppingCart as PhShoppingCart,
  ForkKnife as PhForkKnife,
  ChartBar as PhChartBar,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { PageContainer } from "@/components/business/layout/PageContainer";
import { BalanceTable } from "@/components/business/balance/BalanceTable";
import { PairwiseDebts } from "@/components/business/balance/PairwiseDebts";
import { Money } from "@/components/business/primitives/Money";
import { parseCurrencyToCents, sanitizeCurrencyInput } from "@/lib/utils/currency";
import { isNextRedirect } from "@/lib/utils/isRedirectError";
import type { Dictionary } from "@/lib/i18n";
import type { BalanceByUserId } from "@/lib/types/expensesTypes";
import type { ChocolateBarRow } from "@/lib/db/queries/chocolate";
import {
  createChocolateBar,
  logChocolatePiece,
  settleChocolateBar,
  unsettleChocolateBar,
  approveChocolateBar,
  rejectChocolateBar,
} from "@/lib/actions/chocolate";

type Tab = "bars" | "buy" | "eat" | "balances";

type UserOption = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type Props = {
  locale: string;
  t: Dictionary;
  users: UserOption[];
  bars: ChocolateBarRow[];
  balances: BalanceByUserId;
  currentUserId: string;
  currentUserName: string;
};

const formatArea = (area: number) => {
  // area = width_hundredths * height_hundredths, so real area = area / 10000
  return (area / 10000).toFixed(2);
};

const formatDim = (hundredths: number) => (hundredths / 100).toFixed(2);

export function ChocolateClient({
  locale,
  t,
  users,
  bars,
  balances,
  currentUserId,
  currentUserName,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("bars");

  const tabs: { id: Tab; label: string; Icon: PhosphorIcon }[] = [
    { id: "bars", label: t.chocolateBars, Icon: PhCookie },
    { id: "buy", label: t.buyBar, Icon: PhShoppingCart },
    { id: "eat", label: t.eatPiece, Icon: PhForkKnife },
    { id: "balances", label: t.chocolateBalances, Icon: PhChartBar },
  ];

  const userById = Object.fromEntries(users.map((u) => [u.id, u]));
  const userName = (id: string) => userById[id]?.name ?? id;

  const balanceRows = users.map((u) => ({
    userId: u.id,
    name: u.name,
    imageUrl: u.avatarUrl ?? null,
    balance: balances[u.id] ?? 0,
  }));

  return (
    <PageContainer title={t.chocolate}>
      <div className="mb-6 inline-flex flex-wrap rounded-xl border bg-muted p-1.5 gap-1.5">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer",
                active
                  ? "bg-background text-foreground shadow-md ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
              )}
            >
              <tab.Icon
                size={18}
                weight={active ? "fill" : "regular"}
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "bars" && (
        <BarsTab
          bars={bars}
          currentUserId={currentUserId}
          userName={userName}
          locale={locale}
          t={t}
        />
      )}
      {activeTab === "buy" && (
        <BuyTab
          users={users}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          locale={locale}
          t={t}
        />
      )}
      {activeTab === "eat" && (
        <EatTab
          bars={bars}
          currentUserId={currentUserId}
          t={t}
        />
      )}
      {activeTab === "balances" && (
        <div className="space-y-6">
          <BalanceTable rows={balanceRows} t={t} locale={locale} />
          <PairwiseDebts balances={balances} userById={userById} t={t} locale={locale} />
        </div>
      )}
    </PageContainer>
  );
}

// ─── Bars Tab ────────────────────────────────────────────────────────────────

function BarsTab({
  bars,
  currentUserId,
  userName,
  locale,
  t,
}: {
  bars: ChocolateBarRow[];
  currentUserId: string;
  userName: (id: string) => string;
  locale: string;
  t: Dictionary;
}) {
  if (bars.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.noChocolateBarsYet}</p>;
  }

  return (
    <div className="space-y-4">
      {bars.map((bar) => (
        <BarCard
          key={bar.id}
          bar={bar}
          currentUserId={currentUserId}
          userName={userName}
          locale={locale}
          t={t}
        />
      ))}
    </div>
  );
}

function BarCard({
  bar,
  currentUserId,
  userName,
  locale,
  t,
}: {
  bar: ChocolateBarRow;
  currentUserId: string;
  userName: (id: string) => string;
  locale: string;
  t: Dictionary;
}) {
  const [isPending, startTransition] = useTransition();
  const remaining = Math.max(0, bar.area - bar.totalEaten);
  const isParticipant = bar.participantIds.includes(currentUserId);
  const hasSettled = bar.settledByUserIds.includes(currentUserId);
  const myApproval = bar.approvals.find((a) => a.userId === currentUserId);

  const statusBadge = {
    pending_approval: <Badge variant="outline">{t.pendingApproval}</Badge>,
    active: <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">{t.active}</Badge>,
    settled: <Badge className="bg-blue-100 text-blue-800 border-blue-200">{t.barSettled}</Badge>,
  }[bar.status];

  const handleSettle = () => {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("barId", bar.id);
        await settleChocolateBar(fd);
        toast.success(t.markSettled);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t.somethingWentWrong);
      }
    });
  };

  const handleUnsettle = () => {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("barId", bar.id);
        await unsettleChocolateBar(fd);
        toast.success(t.unmarkSettled);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t.somethingWentWrong);
      }
    });
  };

  const handleApprove = () => {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("barId", bar.id);
        await approveChocolateBar(fd);
        toast.success(t.approved);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t.somethingWentWrong);
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.set("barId", bar.id);
        await rejectChocolateBar(fd);
        toast.success(t.rejected);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t.somethingWentWrong);
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{bar.title}</CardTitle>
          {statusBadge}
        </div>
        <div className="text-sm text-muted-foreground">
          {t.paidBy}: {userName(bar.buyerId)} · <Money cents={bar.cost} locale={locale} /> {t.egp}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-4">
          <span className="text-muted-foreground">
            {formatDim(bar.width)} × {formatDim(bar.height)} = {formatArea(bar.area)} u²
          </span>
          <span className="text-muted-foreground">
            {t.totalEaten}: {formatArea(bar.totalEaten)} u²
          </span>
          {bar.status !== "settled" && (
            <span className="text-muted-foreground">
              {t.remainingArea}: {formatArea(remaining)} u²
            </span>
          )}
        </div>

        {/* Per-user eaten */}
        {Object.keys(bar.eatenByUser).length > 0 && (
          <div className="text-xs text-muted-foreground space-y-0.5">
            {Object.entries(bar.eatenByUser).map(([uid, area]) => (
              <div key={uid}>
                {userName(uid)}: {formatArea(area)} u²
                {uid === currentUserId && ` (${t.eatenByYou})`}
              </div>
            ))}
          </div>
        )}

        {/* Settle progress */}
        {bar.status === "active" && (
          <div className="text-xs text-muted-foreground">
            {t.settleProgress}: {bar.settledByUserIds.map(userName).join(", ") || "—"} / {bar.participantIds.map(userName).join(", ")}
          </div>
        )}

        {/* Approval actions */}
        {myApproval?.status === "pending" && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleApprove} disabled={isPending} className="cursor-pointer">
              {t.approve}
            </Button>
            <Button size="sm" variant="outline" onClick={handleReject} disabled={isPending} className="cursor-pointer">
              {t.reject}
            </Button>
          </div>
        )}

        {/* Settle/unsettle */}
        {bar.status === "active" && isParticipant && (
          <div className="pt-1">
            {hasSettled ? (
              <Button size="sm" variant="outline" onClick={handleUnsettle} disabled={isPending} className="cursor-pointer">
                <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-600" />
                {t.unmarkSettled}
              </Button>
            ) : (
              <Button size="sm" onClick={handleSettle} disabled={isPending} className="cursor-pointer">
                {t.markSettled}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Buy Tab ─────────────────────────────────────────────────────────────────

function BuyTab({
  users,
  currentUserId,
  currentUserName,
  locale,
  t,
}: {
  users: UserOption[];
  currentUserId: string;
  currentUserName: string;
  locale: string;
  t: Dictionary;
}) {
  const [isPending, startTransition] = useTransition();
  const [cost, setCost] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [participantIds, setParticipantIds] = useState<Set<string>>(
    new Set(users.map((u) => u.id)),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const toggleParticipant = (id: string) => {
    if (id === currentUserId) return; // buyer always included
    setParticipantIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    startTransition(async () => {
      try {
        setFieldErrors({});
        const errors: Record<string, string> = {};
        const title = String(new FormData(form).get("title") ?? "").trim();
        if (!title) errors.title = t.expenseTitleRequired;
        if (!parseCurrencyToCents(cost)) errors.cost = t.expenseAmountRequired;
        if (!parseCurrencyToCents(width)) errors.width = t.enterValidAmount;
        if (!parseCurrencyToCents(height)) errors.height = t.enterValidAmount;
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          toast.error(t.fixHighlightedFields);
          return;
        }

        const fd = new FormData(form);
        fd.set("cost", String(parseCurrencyToCents(cost)));
        fd.set("width", String(parseCurrencyToCents(width)));
        fd.set("height", String(parseCurrencyToCents(height)));
        fd.set("participantIds", JSON.stringify(Array.from(participantIds)));
        fd.set("locale", locale);
        await createChocolateBar(fd);
        toast.success(t.createBar);
        form.reset();
        setCost("");
        setWidth("");
        setHeight("");
      } catch (err) {
        if (isNextRedirect(err)) return;
        toast.error(err instanceof Error ? err.message : t.somethingWentWrong);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.buyBar}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="locale" value={locale} />
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">
                {t.barTitle} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="title"
                  name="title"
                  placeholder={t.barTitlePlaceholder}
                  className={fieldErrors.title ? "border-destructive" : undefined}
                />
              </FieldContent>
              {fieldErrors.title && <FieldError>{fieldErrors.title}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="cost">
                {t.barCost} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="cost"
                  type="text"
                  inputMode="decimal"
                  placeholder={t.amountPlaceholder}
                  value={cost}
                  onChange={(e) => setCost(sanitizeCurrencyInput(e.target.value))}
                  className={fieldErrors.cost ? "border-destructive" : undefined}
                />
              </FieldContent>
              <FieldDescription>{t.amountHelp}</FieldDescription>
              {fieldErrors.cost && <FieldError>{fieldErrors.cost}</FieldError>}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="width">
                  {t.width} <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="width"
                    type="text"
                    inputMode="decimal"
                    placeholder="10.00"
                    value={width}
                    onChange={(e) => setWidth(sanitizeCurrencyInput(e.target.value))}
                    className={fieldErrors.width ? "border-destructive" : undefined}
                  />
                </FieldContent>
                {fieldErrors.width && <FieldError>{fieldErrors.width}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="height">
                  {t.height} <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="height"
                    type="text"
                    inputMode="decimal"
                    placeholder="5.00"
                    value={height}
                    onChange={(e) => setHeight(sanitizeCurrencyInput(e.target.value))}
                    className={fieldErrors.height ? "border-destructive" : undefined}
                  />
                </FieldContent>
                {fieldErrors.height && <FieldError>{fieldErrors.height}</FieldError>}
              </Field>
            </div>
            <FieldDescription>{t.dimensionsHelp}</FieldDescription>

            <Field>
              <FieldLabel>{t.paidByLabel}</FieldLabel>
              <FieldContent>
                <Input value={currentUserName} readOnly />
              </FieldContent>
              <FieldDescription>{t.paidByHelp}</FieldDescription>
            </Field>
          </FieldGroup>

          <FieldSet>
            <FieldLegend>
              {t.participantsLabel} <span className="text-destructive">*</span>
            </FieldLegend>
            <FieldGroup>
              {users.map((user) => (
                <Field key={user.id} orientation="horizontal" className="items-center">
                  <FieldLabel className="cursor-pointer">
                    <Checkbox
                      checked={participantIds.has(user.id)}
                      disabled={user.id === currentUserId}
                      onCheckedChange={() => toggleParticipant(user.id)}
                      id={`participant-${user.id}`}
                    />
                    <span>{user.name}</span>
                    {user.id === currentUserId && (
                      <span className="text-xs text-muted-foreground">({t.paidByLabel})</span>
                    )}
                  </FieldLabel>
                </Field>
              ))}
            </FieldGroup>
          </FieldSet>

          <Button type="submit" disabled={isPending} className="cursor-pointer">
            {isPending ? t.creating : t.createBar}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Eat Tab ─────────────────────────────────────────────────────────────────

function EatTab({
  bars,
  currentUserId,
  t,
}: {
  bars: ChocolateBarRow[];
  currentUserId: string;
  t: Dictionary;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedBarId, setSelectedBarId] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const eligibleBars = bars.filter(
    (b) =>
      b.status === "active" &&
      b.participantIds.includes(currentUserId),
  );

  const selectedBar = eligibleBars.find((b) => b.id === selectedBarId);
  const remaining = selectedBar
    ? Math.max(0, selectedBar.area - selectedBar.totalEaten)
    : null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        setFieldErrors({});
        const errors: Record<string, string> = {};
        if (!selectedBarId) errors.bar = t.selectBar;
        const w = parseCurrencyToCents(width);
        const h = parseCurrencyToCents(height);
        if (!w || w <= 0) errors.width = t.enterValidAmount;
        if (!h || h <= 0) errors.height = t.enterValidAmount;
        if (w && h && selectedBar && w * h > selectedBar.area - selectedBar.totalEaten) {
          errors.width = t.pieceTooBig;
        }
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          toast.error(t.fixHighlightedFields);
          return;
        }

        const fd = new FormData();
        fd.set("barId", selectedBarId);
        fd.set("width", String(w));
        fd.set("height", String(h));
        await logChocolatePiece(fd);
        toast.success(t.logPiece);
        setWidth("");
        setHeight("");
      } catch (err) {
        if (isNextRedirect(err)) return;
        toast.error(err instanceof Error ? err.message : t.somethingWentWrong);
      }
    });
  };

  if (eligibleBars.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t.noChocolateBarsYet}</p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.eatPiece}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="bar-select">
                {t.selectBar} <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <select
                  id="bar-select"
                  value={selectedBarId}
                  onChange={(e) => setSelectedBarId(e.target.value)}
                  className={cn(
                    "w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    fieldErrors.bar ? "border-destructive" : "border-input",
                  )}
                >
                  <option value="">{t.selectBar}</option>
                  {eligibleBars.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} — {t.remainingArea}: {formatArea(Math.max(0, b.area - b.totalEaten))} u²
                    </option>
                  ))}
                </select>
              </FieldContent>
              {fieldErrors.bar && <FieldError>{fieldErrors.bar}</FieldError>}
            </Field>

            {remaining !== null && (
              <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                {t.remainingArea}: {formatArea(remaining)} u²
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="piece-width">
                  {t.width} <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="piece-width"
                    type="text"
                    inputMode="decimal"
                    placeholder="2.00"
                    value={width}
                    onChange={(e) => setWidth(sanitizeCurrencyInput(e.target.value))}
                    className={fieldErrors.width ? "border-destructive" : undefined}
                  />
                </FieldContent>
                {fieldErrors.width && <FieldError>{fieldErrors.width}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="piece-height">
                  {t.height} <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="piece-height"
                    type="text"
                    inputMode="decimal"
                    placeholder="2.00"
                    value={height}
                    onChange={(e) => setHeight(sanitizeCurrencyInput(e.target.value))}
                    className={fieldErrors.height ? "border-destructive" : undefined}
                  />
                </FieldContent>
                {fieldErrors.height && <FieldError>{fieldErrors.height}</FieldError>}
              </Field>
            </div>
            <FieldDescription>{t.dimensionsHelp}</FieldDescription>
          </FieldGroup>

          <Button type="submit" disabled={isPending} className="cursor-pointer">
            {isPending ? t.creating : t.logPiece}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
