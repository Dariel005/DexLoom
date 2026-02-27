import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { normalizeEmailAddress } from "@/lib/auth-validation";
import { resolveAbsoluteUrl } from "@/lib/site-url";

interface EmailVerificationTokenPayload {
  v: 1;
  uid: string;
  email: string;
  exp: number;
  nonce: string;
}

type EmailVerificationTokenResult =
  | { ok: true; payload: EmailVerificationTokenPayload }
  | { ok: false; reason: "invalid" | "expired" };

function getEmailVerificationSecret() {
  const secret =
    String(process.env.EMAIL_VERIFICATION_SECRET ?? "").trim() ||
    String(process.env.NEXTAUTH_SECRET ?? "").trim();

  if (!secret) {
    throw new Error(
      "Email verification secret is missing. Set EMAIL_VERIFICATION_SECRET or NEXTAUTH_SECRET."
    );
  }

  return secret;
}

function getTokenTtlMs() {
  const ttlHours = Number(process.env.EMAIL_VERIFICATION_TOKEN_TTL_HOURS ?? "24");
  if (!Number.isFinite(ttlHours) || ttlHours <= 0) {
    return 24 * 60 * 60 * 1000;
  }
  return ttlHours * 60 * 60 * 1000;
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getEmailVerificationSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createEmailVerificationToken(input: {
  userId: string;
  email: string;
}) {
  const payload: EmailVerificationTokenPayload = {
    v: 1,
    uid: String(input.userId ?? "").trim(),
    email: normalizeEmailAddress(input.email),
    exp: Date.now() + getTokenTtlMs(),
    nonce: randomUUID()
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyEmailVerificationToken(token: string): EmailVerificationTokenResult {
  const normalizedToken = String(token ?? "").trim();
  const separatorIndex = normalizedToken.lastIndexOf(".");
  if (separatorIndex <= 0) {
    return { ok: false, reason: "invalid" };
  }

  const encodedPayload = normalizedToken.slice(0, separatorIndex);
  const signature = normalizedToken.slice(separatorIndex + 1);
  const expectedSignature = signPayload(encodedPayload);

  if (!safeCompare(signature, expectedSignature)) {
    return { ok: false, reason: "invalid" };
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<EmailVerificationTokenPayload>;
    const email = normalizeEmailAddress(payload.email ?? "");
    const userId = String(payload.uid ?? "").trim();
    const exp = Number(payload.exp);
    const nonce = String(payload.nonce ?? "").trim();

    if (payload.v !== 1 || !email || !userId || !nonce || !Number.isFinite(exp)) {
      return { ok: false, reason: "invalid" };
    }

    if (Date.now() > exp) {
      return { ok: false, reason: "expired" };
    }

    return {
      ok: true,
      payload: {
        v: 1,
        uid: userId,
        email,
        exp,
        nonce
      }
    };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export function buildEmailVerificationUrl(token: string) {
  return resolveAbsoluteUrl(`/verify-email?token=${encodeURIComponent(token)}`);
}
