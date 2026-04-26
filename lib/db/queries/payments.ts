import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const getPayments = async (limit?: number, offset = 0) => {
  const query = db.select().from(payments).orderBy(desc(payments.createdAt));
  if (typeof limit === "number") {
    return query.limit(limit).offset(offset);
  }
  return query;
};
