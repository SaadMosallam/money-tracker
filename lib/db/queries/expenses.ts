import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const getExpenses = async (limit?: number, offset = 0) => {
  const query = db.select().from(expenses).orderBy(desc(expenses.createdAt));
  if (typeof limit === "number") {
    return query.limit(limit).offset(offset);
  }
  return query;
};
