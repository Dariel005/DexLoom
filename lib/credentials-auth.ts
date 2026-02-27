import { normalizeEmailAddress } from "@/lib/auth-validation";
import { verifyPassword } from "@/lib/password";
import { findUserByEmail, type StoredUser } from "@/lib/user-store";

export type CredentialsValidationResult =
  | { status: "success"; user: StoredUser }
  | { status: "invalid" }
  | { status: "unverified"; user: StoredUser };

export async function validateCredentialsLogin(input: {
  email: string;
  password: string;
}): Promise<CredentialsValidationResult> {
  const email = normalizeEmailAddress(String(input.email ?? ""));
  const password = String(input.password ?? "");

  if (!email || !password) {
    return { status: "invalid" };
  }

  let user = null;
  try {
    user = await findUserByEmail(email);
  } catch {
    return { status: "invalid" };
  }

  if (!user?.passwordHash) {
    return { status: "invalid" };
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return { status: "invalid" };
  }

  if (user.emailVerified === false) {
    return { status: "unverified", user };
  }

  return { status: "success", user };
}
