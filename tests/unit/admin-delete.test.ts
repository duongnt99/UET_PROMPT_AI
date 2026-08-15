import { describe, expect, it } from "vitest";
import { assertDeleteConfirmation, assertStaffRole } from "@/server/domain/admin-delete";

describe("delete confirmation", () => {
  it("requires typing XOA and a reason", () => {
    expect(() => assertDeleteConfirmation({ confirm: "xoa", reason: "Trùng hồ sơ test" })).not.toThrow();
    expect(() => assertDeleteConfirmation({ confirm: "xóa", reason: "Trùng hồ sơ test" })).toThrow(/XOA/);
    expect(() => assertDeleteConfirmation({ confirm: "XOA", reason: "ok" })).toThrow(/lý do/i);
  });
});

describe("staff roles", () => {
  it("accepts judge and reviewer only", () => {
    expect(assertStaffRole("JUDGE")).toBe("JUDGE");
    expect(assertStaffRole("REVIEWER")).toBe("REVIEWER");
    expect(() => assertStaffRole("ADMIN")).toThrow(/không hợp lệ/i);
  });
});
