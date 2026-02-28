import { NextResponse } from "next/server";
import { jsonErrorResponse } from "@/lib/api-error-response";
import { getServerAuthUser } from "@/lib/auth-session";
import type { AdminUserUpdatePayload } from "@/lib/admin-types";
import { getOrCreateUserProfile, updateUserProfileByAdmin } from "@/lib/profile-service";
import { sanitizeDisplayName, sanitizeBio, normalizeProfileVisibility } from "@/lib/profile-validation";
import { getAdminUsersPayload, listAdminUserRows, resolveUserRoleById } from "@/lib/role-service";
import { normalizeUserRole } from "@/lib/roles";
import { updateStoredUserAdminFields } from "@/lib/user-store";

export const runtime = "nodejs";

function forbidden() {
  return NextResponse.json({ message: "Forbidden." }, { status: 403 });
}

export async function GET() {
  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!user.permissions.accessAdmin) {
    return forbidden();
  }

  try {
    return NextResponse.json(await getAdminUsersPayload());
  } catch (error) {
    return jsonErrorResponse(error, "Unable to load users.", 500);
  }
}

export async function PATCH(request: Request) {
  const user = await getServerAuthUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!user.permissions.accessAdmin || !user.permissions.manageUsers) {
    return forbidden();
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const body = (payload ?? {}) as AdminUserUpdatePayload;
  const userId = String(body.userId ?? "").trim();
  if (!userId) {
    return NextResponse.json({ message: "Missing user id." }, { status: 400 });
  }

  try {
    const currentProfile = await getOrCreateUserProfile(userId);
    const role = body.role ? normalizeUserRole(body.role) : undefined;
    const suspendedAt = body.suspend === true ? new Date().toISOString() : body.suspend === false ? null : undefined;

    await updateStoredUserAdminFields(userId, {
      email: body.email,
      name: body.displayName,
      image: body.avatarUrl,
      role,
      suspendedAt,
      suspensionReason:
        body.suspend !== undefined
          ? body.suspend === true
            ? "Suspended by admin console."
            : null
          : undefined
    });

    await updateUserProfileByAdmin(userId, {
      displayName: body.displayName ? sanitizeDisplayName(body.displayName, currentProfile.displayName) : undefined,
      bio: body.bio !== undefined ? sanitizeBio(body.bio) : undefined,
      avatarUrl: body.avatarUrl,
      visibility:
        body.visibility !== undefined
          ? normalizeProfileVisibility(body.visibility, currentProfile.visibility)
          : undefined,
      showFavoritesOnPublic:
        typeof body.showFavoritesOnPublic === "boolean"
          ? body.showFavoritesOnPublic
          : undefined
    });

    const rows = await listAdminUserRows();
    const updated = rows.find((entry) => entry.uid === userId) ?? null;
    if (!updated) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      user: {
        ...updated,
        role: await resolveUserRoleById(updated.uid, updated.role)
      }
    });
  } catch (error) {
    return jsonErrorResponse(error, "Unable to update user.", 400);
  }
}
