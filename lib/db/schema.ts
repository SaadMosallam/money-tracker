import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  primaryKey,
  uniqueIndex,
  index,
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
  }),
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
  }),
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
  }),
);

/* ================= PAYMENT APPROVALS ================= */

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
  }),
);

/* ================= CHOCOLATE BARS ================= */

// Dimensions are stored as integer hundredths (decimal input × 100).
// area = width * height, an integer in units of 1/10000 — no floats, mirroring cents.
export const chocolateBars = pgTable("chocolate_bars", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  cost: integer("cost").notNull(), // cents
  buyerId: uuid("buyer_id")
    .notNull()
    .references(() => users.id),
  width: integer("width").notNull(), // hundredths
  height: integer("height").notNull(), // hundredths
  area: integer("area").notNull(), // width * height, units of 1/10000
  createdAt: timestamp("created_at").defaultNow().notNull(),
  settledAt: timestamp("settled_at"), // set when the last participant marks settled
});

/* ================= CHOCOLATE BAR PARTICIPANTS ================= */

export const chocolateBarParticipants = pgTable(
  "chocolate_bar_participants",
  {
    barId: uuid("bar_id")
      .notNull()
      .references(() => chocolateBars.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.barId, table.userId] }),
  }),
);

/* ================= CHOCOLATE BAR APPROVALS ================= */

export const chocolateBarApprovals = pgTable(
  "chocolate_bar_approvals",
  {
    barId: uuid("bar_id")
      .notNull()
      .references(() => chocolateBars.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    status: varchar("status", { length: 16 }).default("pending").notNull(),
    decidedAt: timestamp("decided_at"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.barId, table.userId] }),
  }),
);

/* ================= CHOCOLATE PIECES ================= */

// Append-only log of pieces eaten. area = width * height (units of 1/10000).
export const chocolatePieces = pgTable(
  "chocolate_pieces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    barId: uuid("bar_id")
      .notNull()
      .references(() => chocolateBars.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    width: integer("width").notNull(), // hundredths
    height: integer("height").notNull(), // hundredths
    area: integer("area").notNull(), // width * height, units of 1/10000
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    barIdx: index("chocolate_pieces_bar_idx").on(table.barId),
  }),
);

/* ================= CHOCOLATE BAR SETTLEMENTS ================= */

// One row per participant who has marked the bar settled.
// Reset (delete all rows for a bar) whenever a new piece is logged.
export const chocolateBarSettlements = pgTable(
  "chocolate_bar_settlements",
  {
    barId: uuid("bar_id")
      .notNull()
      .references(() => chocolateBars.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    settledAt: timestamp("settled_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.barId, table.userId] }),
  }),
);

/* ================= APPROVAL NOTIFICATIONS ================= */

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
      table.entityId,
    ),
  }),
);
