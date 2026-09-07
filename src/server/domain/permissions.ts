export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "TECH_OPERATOR"
  | "REVIEWER"
  | "JUDGE"
  | "PARTICIPANT"
  | "PUBLIC";

export const PERMISSIONS = {
  "settings:read": ["SUPER_ADMIN", "ADMIN", "TECH_OPERATOR"],
  "settings:write": ["SUPER_ADMIN", "ADMIN"],
  "roles:manage": ["SUPER_ADMIN"],
  "users:manage": ["SUPER_ADMIN", "ADMIN"],
  "content:manage": ["SUPER_ADMIN", "ADMIN"],
  "email:manage": ["SUPER_ADMIN", "ADMIN"],
  "registration:manage": ["SUPER_ADMIN", "ADMIN"],
  "submission:manage": ["SUPER_ADMIN", "ADMIN"],
  "review:assign": ["SUPER_ADMIN", "ADMIN"],
  "review:score": ["REVIEWER", "SUPER_ADMIN", "ADMIN"],
  "finalist:manage": ["SUPER_ADMIN", "ADMIN"],
  "bracket:manage": ["SUPER_ADMIN", "ADMIN"],
  "judge:assign": ["SUPER_ADMIN", "ADMIN"],
  "judge:score": ["JUDGE", "SUPER_ADMIN", "ADMIN"],
  "score:publish": ["SUPER_ADMIN", "ADMIN"],
  "score:reopen": ["SUPER_ADMIN"],
  "operations:control": ["SUPER_ADMIN", "ADMIN", "TECH_OPERATOR"],
  "incident:write": ["SUPER_ADMIN", "ADMIN", "TECH_OPERATOR"],
  "audit:read": ["SUPER_ADMIN", "ADMIN"],
  "export:pii": ["SUPER_ADMIN", "ADMIN"],
  "pii:view": ["SUPER_ADMIN", "ADMIN"],
  "stage:control": ["SUPER_ADMIN", "ADMIN", "TECH_OPERATOR"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(roles: Role[], permission: Permission): boolean {
  if (roles.includes("SUPER_ADMIN")) return true;
  const allowed = PERMISSIONS[permission] as readonly Role[];
  return roles.some((role) => allowed.includes(role));
}

export function canChangeRole(params: {
  actorRoles: Role[];
  targetCurrentRoles: Role[];
  nextRole: Role;
}): { ok: boolean; message?: string } {
  const actorIsSuper = params.actorRoles.includes("SUPER_ADMIN");
  const actorIsAdmin = params.actorRoles.includes("ADMIN");
  if (params.targetCurrentRoles.includes("SUPER_ADMIN") && !actorIsSuper) {
    return { ok: false, message: "ADMIN không được thay đổi SUPER_ADMIN." };
  }
  if (params.nextRole === "SUPER_ADMIN" && !actorIsSuper) {
    return { ok: false, message: "Chỉ SUPER_ADMIN mới được gán quyền SUPER_ADMIN." };
  }
  if (!actorIsSuper && !actorIsAdmin) {
    return { ok: false, message: "Không có quyền thay đổi vai trò." };
  }
  return { ok: true };
}

export function canViewPii(roles: Role[]): boolean {
  return hasPermission(roles, "pii:view");
}

const ROLE_HOMES: { role: Role; path: string }[] = [
  { role: "SUPER_ADMIN", path: "/admin" },
  { role: "ADMIN", path: "/admin" },
  { role: "TECH_OPERATOR", path: "/admin" },
  { role: "JUDGE", path: "/judge" },
  { role: "REVIEWER", path: "/reviewer" },
  { role: "PARTICIPANT", path: "/dashboard" },
];

const PATH_GATES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/dashboard", roles: ["PARTICIPANT", "ADMIN", "SUPER_ADMIN", "REVIEWER", "JUDGE", "TECH_OPERATOR"] },
  { prefix: "/admin", roles: ["ADMIN", "SUPER_ADMIN", "TECH_OPERATOR"] },
  { prefix: "/reviewer", roles: ["REVIEWER", "ADMIN", "SUPER_ADMIN"] },
  { prefix: "/judge", roles: ["JUDGE", "ADMIN", "SUPER_ADMIN"] },
  { prefix: "/stage", roles: ["ADMIN", "SUPER_ADMIN", "TECH_OPERATOR"] },
];

export function homePathForRoles(roles: Role[]): string {
  for (const item of ROLE_HOMES) {
    if (roles.includes(item.role)) return item.path;
  }
  return "/";
}

export function canAccessPath(path: string, roles: Role[]): boolean {
  if (roles.includes("SUPER_ADMIN")) return true;
  const gate = PATH_GATES.find((item) => path === item.prefix || path.startsWith(`${item.prefix}/`));
  if (!gate) return path.startsWith("/") && !path.startsWith("//");
  return roles.some((role) => gate.roles.includes(role));
}

export function resolvePostLoginPath(from: string | null | undefined, roles: Role[]): string {
  const home = homePathForRoles(roles);
  const path = String(from ?? "").trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || path.includes("://")) {
    return home;
  }
  const isParticipantArea = path === "/dashboard" || path.startsWith("/dashboard/");
  if (isParticipantArea && !roles.includes("PARTICIPANT")) {
    return home;
  }
  if (path === "/dang-ky") return home;
  if (!canAccessPath(path, roles)) return home;
  return path;
}
