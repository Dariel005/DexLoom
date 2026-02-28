import { NextResponse } from "next/server";
import { getAdminOverview } from "@/lib/analytics-service";
import { jsonErrorResponse } from "@/lib/api-error-response";
import { getServerAuthUser } from "@/lib/auth-session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!user.permissions.accessAdmin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    return NextResponse.json(await getAdminOverview());
  } catch (error) {
    return jsonErrorResponse(error, "Unable to load admin overview.", 500);
  }
}
