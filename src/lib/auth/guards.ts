import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission, type Permission, type Role } from "@/server/domain/permissions";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/dang-nhap");
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!hasPermission(user.roles as Role[], permission)) {
    redirect("/403");
  }
  return user;
}

export async function requireAnyRole(roles: Role[]) {
  const user = await requireUser();
  if (user.roles.includes("SUPER_ADMIN")) return user;
  if (!user.roles.some((role) => roles.includes(role))) {
    redirect("/403");
  }
  return user;
}
