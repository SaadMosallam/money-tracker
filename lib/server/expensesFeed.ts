import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getExpenseApprovalsByExpenseIds, getExpenseParticipantsByExpenseIds } from "@/lib/db/queries/approvals";
import { getExpenses } from "@/lib/db/queries/balances";
import { getUsers } from "@/lib/db/queries/users";
import { computeApprovalStatus } from "@/lib/utils/approvalStatus";
import { buildUserNameById } from "@/lib/utils/userNameById";

export const EXPENSES_PAGE_SIZE = 20;

export type ExpenseFeedRow = {
  id: string;
  title: string;
  amount: number;
  paidByName: string;
  participants: Array<{
    name: string;
    imageUrl?: string | null;
    label: string;
  }>;
  isSettled: boolean;
  createdAt: string | null;
  approvalStatus: "pending" | "approved" | "rejected";
  canApprove: boolean;
};

export const getExpenseFeedChunk = async ({
  offset,
  limit = EXPENSES_PAGE_SIZE,
}: {
  offset: number;
  limit?: number;
}) => {
  const queryLimit = limit + 1;
  const [expensesRaw, users, session] = await Promise.all([
    getExpenses(queryLimit, offset),
    getUsers(),
    getServerSession(authOptions),
  ]);

  const hasMore = expensesRaw.length > limit;
  const expenses = expensesRaw.slice(0, limit);
  const expenseIds = expenses.map((expense) => expense.id);

  const [participants, approvals] = await Promise.all([
    getExpenseParticipantsByExpenseIds(expenseIds),
    getExpenseApprovalsByExpenseIds(expenseIds),
  ]);

  const currentUserId = session?.user?.id ?? "";
  const userNameById = buildUserNameById(users);
  const userAvatarById = new Map(users.map((user) => [user.id, user.avatarUrl ?? null]));

  const approvalsByExpense = new Map<string, typeof approvals>();
  for (const approval of approvals) {
    const list = approvalsByExpense.get(approval.expenseId) ?? [];
    list.push(approval);
    approvalsByExpense.set(approval.expenseId, list);
  }

  const participantsByExpense = new Map<string, typeof participants>();
  for (const participant of participants) {
    const list = participantsByExpense.get(participant.expenseId) ?? [];
    list.push(participant);
    participantsByExpense.set(participant.expenseId, list);
  }

  const percentFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const rows: ExpenseFeedRow[] = expenses.map((expense) => {
    const list = participantsByExpense.get(expense.id) ?? [];
    const totalWeight = list.reduce((sum, p) => sum + p.weight, 0);
    const hasEqualShares =
      list.length > 0 && list.every((p) => p.weight === list[0].weight);

    const mappedParticipants = list.map((p) => {
      const name = userNameById[p.userId] ?? p.userId;
      const percent = totalWeight > 0 ? (p.weight / totalWeight) * 100 : 0;
      const percentLabel =
        percent > 0 && percent < 0.01
          ? "<0.01%"
          : `${percentFormatter.format(percent)}%`;
      const label = hasEqualShares ? name : `${name} (${percentLabel})`;
      return {
        name,
        imageUrl: userAvatarById.get(p.userId) ?? null,
        label,
      };
    });

    const approvalList = approvalsByExpense.get(expense.id) ?? [];
    const approvalStatus = computeApprovalStatus(approvalList);
    const userApproval = approvalList.find(
      (approval) => approval.userId === currentUserId
    );

    return {
      id: expense.id,
      title: expense.title,
      amount: expense.amount,
      paidByName: userNameById[expense.paidById] ?? expense.paidById,
      participants: mappedParticipants,
      isSettled: expense.isSettled,
      createdAt: expense.createdAt ? expense.createdAt.toISOString() : null,
      approvalStatus,
      canApprove: userApproval?.status === "pending",
    };
  });

  return { rows, hasMore };
};
