import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { assertCanUseUnsafeLocalPersistence } from "@/lib/durable-storage";
import { getFirebaseStorageBucket, isFirebaseProfileSyncEnabled } from "@/lib/firebase-admin";
import { resolveAvatarStoreDir } from "@/lib/runtime-storage";

const AVATAR_DIR = resolveAvatarStoreDir();
const AVATAR_BASE_PATH = "/images/avatars";
const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function sanitizeUserId(userId: string) {
  return userId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "trainer";
}

export function isValidAvatarMimeType(mimeType: string) {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function isValidAvatarSize(size: number) {
  return Number.isFinite(size) && size > 0 && size <= MAX_AVATAR_FILE_SIZE;
}

export async function processAvatarUpload(input: {
  userId: string;
  fileBuffer: Buffer;
  mimeType: string;
}) {
  if (!isValidAvatarMimeType(input.mimeType)) {
    throw new Error("Avatar must be jpg, png, or webp.");
  }

  if (!isValidAvatarSize(input.fileBuffer.byteLength)) {
    throw new Error("Avatar size must be 2MB or less.");
  }

  const sanitizedUserId = sanitizeUserId(input.userId);
  const fileName = `${sanitizedUserId}-${Date.now()}-${randomUUID().slice(0, 8)}.webp`;
  const outputBuffer = await sharp(input.fileBuffer)
    .rotate()
    .resize(512, 512, {
      fit: "cover",
      position: "centre"
    })
    .webp({ quality: 82 })
    .toBuffer();

  const remotePath = `avatars/${sanitizedUserId}/${fileName}`;
  let hasCloudCopy = false;

  if (isFirebaseProfileSyncEnabled()) {
    const bucket = getFirebaseStorageBucket();
    if (bucket) {
      try {
        const file = bucket.file(remotePath);
        await file.save(outputBuffer, {
          contentType: "image/webp",
          resumable: false,
          metadata: {
            cacheControl: "public, max-age=31536000, immutable"
          }
        });
        hasCloudCopy = true;
      } catch {
        // Cloud avatar upload failed; continue with local mirror fallback.
      }
    }
  }

  // Keep a best-effort local mirror for local development and optional hot caching.
  let hasLocalCopy = false;
  if (hasCloudCopy) {
    return {
      avatarUrl: `${AVATAR_BASE_PATH}/${fileName}`
    };
  }

  assertCanUseUnsafeLocalPersistence(
    "Persistent avatar storage is unavailable. Your avatar was not saved."
  );

  try {
    await mkdir(AVATAR_DIR, { recursive: true });
    const outputPath = path.join(AVATAR_DIR, fileName);
    await writeFile(outputPath, outputBuffer);
    hasLocalCopy = true;
  } catch {
    // Ignore local mirror failures in serverless runtimes.
  }

  if (!hasCloudCopy && !hasLocalCopy) {
    throw new Error("Unable to persist avatar file.");
  }

  return {
    avatarUrl: `${AVATAR_BASE_PATH}/${fileName}`
  };
}
