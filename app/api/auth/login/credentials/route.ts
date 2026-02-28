import { NextResponse } from "next/server";
import { validateCredentialsLogin } from "@/lib/credentials-auth";

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
  };

  const result = await validateCredentialsLogin({
    email: String(body.email ?? ""),
    password: String(body.password ?? "")
  });

  if (result.status === "unverified") {
    return NextResponse.json(
      {
        code: "EMAIL_UNVERIFIED",
        message: "Verify your email before signing in with your password."
      },
      { status: 403 }
    );
  }

  if (result.status === "suspended") {
    return NextResponse.json(
      {
        code: "ACCOUNT_SUSPENDED",
        message: "This account has been permanently suspended."
      },
      { status: 403 }
    );
  }

  if (result.status !== "success") {
    return NextResponse.json(
      { code: "INVALID_CREDENTIALS", message: "Invalid email or password." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
