import { NextResponse } from "next/server";
import { getServerAuthUser } from "@/lib/auth-session";
import { isProfileFeatureEnabled } from "@/lib/firebase-admin";
import { processAvatarUpload } from "@/lib/profile-avatar";
import { updateUserAvatar } from "@/lib/profile-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isProfileFeatureEnabled()) {
    return NextResponse.json({ message: "Profile feature is disabled." }, { status: 404 });
  }

  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid multipart payload." }, { status: 400 });
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return NextResponse.json({ message: "Missing avatar file." }, { status: 400 });
  }

  const mimeType = String(fileEntry.type ?? "").toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    return NextResponse.json(
      { message: "Unsupported file type. Use jpg, png, or webp." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(fileEntry.size) || fileEntry.size <= 0 || fileEntry.size > 2 * 1024 * 1024) {
    return NextResponse.json(
      { message: "Avatar must be 2MB or less." },
      { status: 400 }
    );
  }

  const fileBuffer = Buffer.from(await fileEntry.arrayBuffer());
  const { avatarUrl } = await processAvatarUpload({
    userId: user.id,
    fileBuffer,
    mimeType
  });

  await updateUserAvatar(user.id, avatarUrl);
  return NextResponse.json({ avatarUrl });
}
