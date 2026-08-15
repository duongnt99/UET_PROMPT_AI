export function assertDeleteConfirmation(params: { confirm: string; reason: string }) {
  if (params.confirm.trim().toUpperCase() !== "XOA") {
    throw new Error("Gõ XOA (không dấu) để xác nhận xóa.");
  }
  if (params.reason.trim().length < 3) {
    throw new Error("Cần ghi lý do (audit) khi xóa.");
  }
  return params.reason.trim();
}

export type StaffRole = "JUDGE" | "REVIEWER";

export function assertStaffRole(value: string): StaffRole {
  if (value === "JUDGE" || value === "REVIEWER") return value;
  throw new Error("Vai trò staff không hợp lệ.");
}

export function staffRoleLabel(role: StaffRole) {
  return role === "JUDGE" ? "giám khảo" : "reviewer";
}
