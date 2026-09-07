import { describe, expect, it } from "vitest";
import { registrationCredentialsSchema } from "@/server/domain/auth-registration";

describe("registration credentials", () => {
  it("rejects a missing or invalid email with a Vietnamese message", () => {
    const missing = registrationCredentialsSchema.safeParse({
      email: "   ", password: "StrongPassword123!", confirmPassword: "StrongPassword123!",
    });
    const invalid = registrationCredentialsSchema.safeParse({
      email: "not-an-email", password: "StrongPassword123!", confirmPassword: "StrongPassword123!",
    });
    expect(missing.success).toBe(false);
    expect(invalid.success).toBe(false);
    if (!missing.success) expect(missing.error.issues[0]?.message).toBe("Vui lòng nhập email.");
    if (!invalid.success) expect(invalid.error.issues[0]?.message).toBe("Email không hợp lệ.");
  });

  it("accepts email, password, and a matching confirmation", () => {
    const result = registrationCredentialsSchema.safeParse({
      email: "  Student@Example.edu.vn ",
      password: "  StrongPassword123! ",
      confirmPassword: "StrongPassword123!",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("student@example.edu.vn");
      expect(result.data.password).toBe("StrongPassword123!");
    }
  });

  it("rejects a different confirmation password", () => {
    const result = registrationCredentialsSchema.safeParse({
      email: "student@example.edu.vn",
      password: "StrongPassword123!",
      confirmPassword: "DifferentPassword123!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Mật khẩu xác nhận không khớp.");
    }
  });
});
