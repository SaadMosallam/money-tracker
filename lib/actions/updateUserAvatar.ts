"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";

export async function setUserAvatarUrl(avatarUrl: string) {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    throw new Error("You must be signed in to update your avatar.");
  }

  if (!avatarUrl || typeof avatarUrl !== "string") {
    throw new Error("Avatar URL is required.");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionUserId))
    .limit(1);

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.avatarUrl && user.avatarUrl !== avatarUrl) {
    await del(user.avatarUrl);
  }

  await db
    .update(users)
    .set({ avatarUrl })
    .where(eq(users.id, sessionUserId));

  revalidatePath("/account");
  revalidatePath("/");

  return { avatarUrl };
}

export async function deleteUserAvatar() {
  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id;
  if (!sessionUserId) {
    throw new Error("You must be signed in to update your avatar.");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionUserId))
    .limit(1);

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.avatarUrl) {
    await del(user.avatarUrl);
  }

  await db
    .update(users)
    .set({ avatarUrl: null })
    .where(eq(users.id, sessionUserId));

  revalidatePath("/account");
  revalidatePath("/");

  return { avatarUrl: null };
}
