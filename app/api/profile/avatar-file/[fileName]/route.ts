import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const AVATAR_DIR = path.resolve(process.cwd(), "public", "images", "avatars");
const SAFE_FILE_NAME_REGEX = /^[a-zA-Z0-9._-]+$/;
const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg"
};

function forbiddenResponse() {
  return NextResponse.json({ message: "Invalid avatar file path." }, { status: 400 });
}

function notFoundResponse() {
  return NextResponse.json({ message: "Avatar file not found." }, { status: 404 });
}

function isPathInsideAvatarDir(filePath: string) {
  const relative = path.relative(AVATAR_DIR, filePath);
  return relative.length > 0 && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export async function GET(
  _request: Request,
  context: { params: { fileName?: string } }
) {
  const rawFileName = context.params.fileName ?? "";
  let decodedFileName = rawFileName;
  try {
    decodedFileName = decodeURIComponent(rawFileName);
  } catch {
    return forbiddenResponse();
  }

  if (!decodedFileName || !SAFE_FILE_NAME_REGEX.test(decodedFileName)) {
    return forbiddenResponse();
  }

  const extension = path.extname(decodedFileName).toLowerCase();
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) {
    return forbiddenResponse();
  }

  const filePath = path.resolve(AVATAR_DIR, decodedFileName);
  if (!isPathInsideAvatarDir(filePath)) {
    return forbiddenResponse();
  }

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return notFoundResponse();
  }
}
