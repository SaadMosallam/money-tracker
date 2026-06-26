CREATE TABLE "chocolate_bars" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" varchar(255) NOT NULL,
  "cost" integer NOT NULL,
  "buyer_id" uuid NOT NULL REFERENCES "users" ("id"),
  "width" integer NOT NULL,
  "height" integer NOT NULL,
  "area" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "settled_at" timestamp
);

CREATE TABLE "chocolate_bar_participants" (
  "bar_id" uuid NOT NULL REFERENCES "chocolate_bars" ("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users" ("id"),
  CONSTRAINT "chocolate_bar_participants_pk" PRIMARY KEY ("bar_id", "user_id")
);

CREATE TABLE "chocolate_bar_approvals" (
  "bar_id" uuid NOT NULL REFERENCES "chocolate_bars" ("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users" ("id"),
  "status" varchar(16) NOT NULL DEFAULT 'pending',
  "decided_at" timestamp,
  CONSTRAINT "chocolate_bar_approvals_pk" PRIMARY KEY ("bar_id", "user_id")
);

CREATE TABLE "chocolate_pieces" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "bar_id" uuid NOT NULL REFERENCES "chocolate_bars" ("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users" ("id"),
  "width" integer NOT NULL,
  "height" integer NOT NULL,
  "area" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "chocolate_pieces_bar_idx" ON "chocolate_pieces" ("bar_id");

CREATE TABLE "chocolate_bar_settlements" (
  "bar_id" uuid NOT NULL REFERENCES "chocolate_bars" ("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users" ("id"),
  "settled_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "chocolate_bar_settlements_pk" PRIMARY KEY ("bar_id", "user_id")
);
