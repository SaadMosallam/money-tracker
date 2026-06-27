import "dotenv/config";
import postgres from "postgres";
import { hashPassword } from "@/lib/auth/password";

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error("Usage: tsx scripts/reset-password.ts <email> <new-password>");
  process.exit(1);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");

  const sql = postgres(url, { ssl: "require", max: 1 });
  const hash = hashPassword(newPassword);

  const result = await sql`
    UPDATE users
    SET password_hash = ${hash}
    WHERE email = ${email}
    RETURNING id, name, email
  `;

  if (result.length === 0) {
    console.error(`No user found with email: ${email}`);
    await sql.end();
    process.exit(1);
  }

  console.log(`✅ Password reset for ${result[0].name} (${result[0].email})`);
  await sql.end();
}

main().catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
