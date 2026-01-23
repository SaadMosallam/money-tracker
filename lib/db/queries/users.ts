import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const getUsers = async () => {
  const usersRows = await db.select().from(users);
  return usersRows.map((user) => ({ id: user.id, name: user.name }));
};