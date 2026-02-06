import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Avatar file is required." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Avatar must be an image file." }, { status: 400 });
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json({ error: "Avatar must be 4MB or smaller." }, { status: 400 });
  }

  const blob = await put(
    `avatars/${session.user.id}/${file.name}`,
    file,
    {
      access: "public",
      addRandomSuffix: true,
    }
  );

  return NextResponse.json({ url: blob.url });
}
