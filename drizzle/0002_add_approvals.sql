CREATE TABLE "expense_approvals" (
  "expense_id" uuid NOT NULL REFERENCES "expenses" ("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users" ("id"),
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "decided_at" timestamp,
  CONSTRAINT "expense_approvals_pk" PRIMARY KEY ("expense_id", "user_id")
);

CREATE TABLE "payment_approvals" (
  "payment_id" uuid NOT NULL REFERENCES "payments" ("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users" ("id"),
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "decided_at" timestamp,
  CONSTRAINT "payment_approvals_pk" PRIMARY KEY ("payment_id", "user_id")
);

CREATE TABLE "approval_notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users" ("id"),
  "entity_type" varchar(16) NOT NULL,
  "entity_id" uuid NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "resolved_at" timestamp
);

CREATE UNIQUE INDEX "approval_notifications_unique"
  ON "approval_notifications" ("user_id", "entity_type", "entity_id");
