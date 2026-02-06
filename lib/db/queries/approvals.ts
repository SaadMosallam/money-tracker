import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  approvalNotifications,
  expenseApprovals,
  paymentApprovals,
  expenses,
  payments,
  expenseParticipants,
} from "@/lib/db/schema";

export const getExpenseApprovalsByExpenseIds = async (expenseIds: string[]) => {
  if (expenseIds.length === 0) return [];
  return db
    .select()
    .from(expenseApprovals)
    .where(inArray(expenseApprovals.expenseId, expenseIds));
};

export const getPaymentApprovalsByPaymentIds = async (paymentIds: string[]) => {
  if (paymentIds.length === 0) return [];
  return db
    .select()
    .from(paymentApprovals)
    .where(inArray(paymentApprovals.paymentId, paymentIds));
};

export const getApprovalNotificationsByUser = async (userId: string) => {
  return db
    .select()
    .from(approvalNotifications)
    .where(and(eq(approvalNotifications.userId, userId), isNull(approvalNotifications.resolvedAt)))
    .orderBy(desc(approvalNotifications.createdAt));
};

export const getExpensesByIds = async (expenseIds: string[]) => {
  if (expenseIds.length === 0) return [];
  return db
    .select()
    .from(expenses)
    .where(inArray(expenses.id, expenseIds));
};

export const getPaymentsByIds = async (paymentIds: string[]) => {
  if (paymentIds.length === 0) return [];
  return db
    .select()
    .from(payments)
    .where(inArray(payments.id, paymentIds));
};

export const getExpenseParticipantsByExpenseIds = async (expenseIds: string[]) => {
  if (expenseIds.length === 0) return [];
  return db
    .select()
    .from(expenseParticipants)
    .where(inArray(expenseParticipants.expenseId, expenseIds));
};
