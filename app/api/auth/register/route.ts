import { NextResponse } from "next/server";
import {
  isValidEmailAddress,
  isValidPassword,
  normalizeEmailAddress,
  sanitizeDisplayName
} from "@/lib/auth-validation";
import { canSendVerificationEmails, sendVerificationEmail } from "@/lib/email-verification";
import { hashPassword } from "@/lib/password";
import { findUserByEmail, registerCredentialsUser } from "@/lib/user-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  const body = payload as {
    email?: string;
    password?: string;
    name?: string;
  };

  const email = normalizeEmailAddress(String(body.email ?? ""));
  const password = String(body.password ?? "");
  const name = sanitizeDisplayName(String(body.name ?? ""), email);

  if (!isValidEmailAddress(email)) {
    return NextResponse.json(
      { message: "Invalid email address." },
      { status: 400 }
    );
  }

  if (!isValidPassword(password)) {
    return NextResponse.json(
      { message: "Password must be at least 8 characters long." },
      { status: 400 }
    );
  }

  let existingUser = null;
  try {
    existingUser = await findUserByEmail(email);
  } catch {
    existingUser = null;
  }

  const requiresConfiguredVerificationEmail =
    !existingUser || existingUser.emailVerified === false;

  if (requiresConfiguredVerificationEmail && !canSendVerificationEmails()) {
    return NextResponse.json(
      {
        message:
          "Email verification is not configured yet. Add SMTP settings before creating password accounts."
      },
      { status: 503 }
    );
  }

  const passwordHash = await hashPassword(password);
  let result;
  try {
    result = await registerCredentialsUser({
      email,
      passwordHash,
      name
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create account right now. Try again in a moment."
      },
      { status: 503 }
    );
  }

  if (result.status === "exists") {
    return NextResponse.json(
      { message: "An account with this email already exists." },
      { status: 409 }
    );
  }

  if (result.status === "created" || result.status === "verification_pending") {
    try {
      await sendVerificationEmail(result.user);
    } catch (error) {
      return NextResponse.json(
        {
          message:
            error instanceof Error
              ? error.message
              : "Account created, but the verification email could not be sent."
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        message:
          result.status === "verification_pending"
            ? "Verification email sent again. Confirm your inbox to unlock password login."
            : "Account created. Check your email to verify your DexLoom account before signing in.",
        requiresEmailVerification: true,
        email: result.user.email
      },
      { status: result.status === "created" ? 201 : 200 }
    );
  }

  return NextResponse.json(
    {
      message:
        result.status === "updated"
          ? "Account upgraded with password credentials."
          : "Account created successfully.",
      requiresEmailVerification: false
    },
    { status: 201 }
  );
}
