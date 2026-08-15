import { describe, expect, it } from "vitest";
import { toContentSlug } from "@/lib/utils";

describe("toContentSlug", () => {
  it("strips Vietnamese diacritics", () => {
    expect(toContentSlug("Thể lệ cuộc thi")).toBe("the-le-cuoc-thi");
  });

  it("maps đ to d", () => {
    expect(toContentSlug("Đăng ký đội")).toBe("dang-ky-doi");
  });
});
