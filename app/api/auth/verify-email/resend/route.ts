import { NextResponse } from "next/server";
import { isValidEmailAddress, normalizeEmailAddress } from "@/lib/auth-validation";
import { canSendVerificationEmails, sendVerificationEmail } from "@/lib/email-verification";
import { findUserByEmail } from "@/lib/user-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  const email = normalizeEmailAddress(String((payload as { email?: string })?.email ?? ""));
  if (!isValidEmailAddress(email)) {
    return NextResponse.json({ message: "Invalid email address." }, { status: 400 });
  }

  if (!canSendVerificationEmails()) {
    return NextResponse.json(
      { message: "Email delivery is not configured yet." },
      { status: 503 }
    );
  }

  let user = null;
  try {
    user = await findUserByEmail(email);
  } catch {
    user = null;
  }

  if (!user || user.emailVerified !== false || !user.passwordHash) {
    return NextResponse.json({
      message: "If that trainer account exists and still needs confirmation, a new email has been sent."
    });
  }

  try {
    await sendVerificationEmail(user);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to send a new verification email right now."
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    message: "A new verification email is on the way."
  });
}
