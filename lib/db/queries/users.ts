import { eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const getUsers = async () => {
  const usersRows = await db.select().from(users);
  return usersRows.map((user) => ({
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl ?? null,
  }));
};

export const getUserByEmail = async (email: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user ?? null;
};

export const getUserByLogin = async (identifier: string) => {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  const [user] = await db
    .select()
    .from(users)
    .where(
      or(
        ilike(users.email, trimmed),
        ilike(users.name, trimmed)
      )
    )
    .limit(1);
  return user ?? null;
};

export const getUserById = async (id: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user ?? null;
};
