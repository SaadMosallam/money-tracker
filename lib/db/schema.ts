import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ================= USERS ================= */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  avatarUrl: varchar("avatar_url", { length: 1024 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ================= EXPENSES ================= */

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  amount: integer("amount").notNull(), // cents
  paidById: uuid("paid_by_id")
    .notNull()
    .references(() => users.id),
  isSettled: boolean("is_settled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* ================= EXPENSE PARTICIPANTS ================= */

export const expenseParticipants = pgTable(
  "expense_participants",
  {
    expenseId: uuid("expense_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),

    weight: integer("weight").default(1).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.expenseId, table.userId] }),
  })
);

/* ================= PAYMENTS ================= */

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  fromUserId: uuid("from_user_id")
    .notNull()
    .references(() => users.id),

  toUserId: uuid("to_user_id")
    .notNull()
    .references(() => users.id),

  amount: integer("amount").notNull(), // cents
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isSettled: boolean("is_settled").default(false).notNull(),
});

/* ================= PASSWORD RESETS ================= */

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userTokenIdx: index("password_reset_user_idx").on(table.userId),
  })
);

/* ================= APPROVALS ================= */

export const expenseApprovals = pgTable(
  "expense_approvals",
  {
    expenseId: uuid("expense_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    status: varchar("status", { length: 16 }).default("pending").notNull(),
    decidedAt: timestamp("decided_at"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.expenseId, table.userId] }),
  })
);

export const paymentApprovals = pgTable(
  "payment_approvals",
  {
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    status: varchar("status", { length: 16 }).default("pending").notNull(),
    decidedAt: timestamp("decided_at"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.paymentId, table.userId] }),
  })
);

export const approvalNotifications = pgTable(
  "approval_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    entityType: varchar("entity_type", { length: 16 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => ({
    unique: uniqueIndex("approval_notifications_unique").on(
      table.userId,
      table.entityType,
      table.entityId
    ),
  })
);
