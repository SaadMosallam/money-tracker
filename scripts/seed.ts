import "dotenv/config";
import { randomBytes, scryptSync } from "crypto";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users } from "../lib/db/schema";

type SeedUser = {
  name: string;
  email: string;
  password: string;
};

const seedUsers: SeedUser[] = [
  { name: "Saad", email: "saad@example.com", password: "password123" },
  { name: "Mido", email: "mido@example.com", password: "password123" },
  { name: "Said", email: "said@example.com", password: "password123" },
  { name: "Amer", email: "amer@example.com", password: "password123" },
];

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}.${hash}`;
};

const main = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(databaseUrl, { ssl: "require" });
  const db = drizzle(sql);

  try {
    await db
      .insert(users)
      .values(
        seedUsers.map((user) => ({
          name: user.name,
          email: user.email,
          passwordHash: hashPassword(user.password),
        }))
      )
      .onConflictDoNothing({ target: users.email });

    console.log(`Seeded users: ${seedUsers.map((u) => u.email).join(", ")}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
};

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
