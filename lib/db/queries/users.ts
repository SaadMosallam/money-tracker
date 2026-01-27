import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const getUsers = async () => {
  const usersRows = await db.select().from(users);
  return usersRows.map((user) => ({ id: user.id, name: user.name }));
};

export const getUserByEmail = async (email: string) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user ?? null;
};