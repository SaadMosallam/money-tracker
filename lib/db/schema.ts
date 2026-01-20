import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";

/* ================= USERS ================= */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
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
});
