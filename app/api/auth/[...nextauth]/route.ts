import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const runtime = "nodejs";

const configuredNextAuthUrl = String(process.env.NEXTAUTH_URL ?? "").trim().toLowerCase();
const hasLocalhostNextAuthUrl =
  configuredNextAuthUrl.includes("localhost") || configuredNextAuthUrl.includes("127.0.0.1");

if (
  process.env.NODE_ENV === "production" &&
  !process.env.AUTH_TRUST_HOST &&
  (!configuredNextAuthUrl || hasLocalhostNextAuthUrl)
) {
  // Allow NextAuth to derive the real host from forwarded headers behind a proxy.
  process.env.AUTH_TRUST_HOST = "true";
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
