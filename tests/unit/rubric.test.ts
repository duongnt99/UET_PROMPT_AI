import { describe, expect, it } from "vitest";
import { assertRubricCriteria, criterionCodeFromTitle, parseRubricCriteriaJson } from "@/server/domain/rubric";

const base = {
  code: "",
  titleEn: "",
  description: "",
  guidance: "",
  minScore: "0",
  maxScore: "10",
  scoreStep: "0.5",
  isRequired: true,
};

describe("rubric criteria", () => {
  it("accepts weights that sum to 100 and fills codes", () => {
    const result = assertRubricCriteria([
      { ...base, titleVi: "Tính khả thi", weight: "40" },
      { ...base, titleVi: "Tính sáng tạo", weight: "30" },
      { ...base, titleVi: "Tiềm năng tác động", weight: "30" },
    ]);
    expect(result.map((item) => item.code)).toEqual(["TINH_KHA_THI", "TINH_SANG_TAO", "TIEM_NANG_TAC_DONG"]);
    expect(result).toHaveLength(3);
  });

  it("rejects weights that do not sum to 100", () => {
    expect(() =>
      assertRubricCriteria([
        { ...base, titleVi: "Tiêu chí A", weight: "50" },
        { ...base, titleVi: "Tiêu chí B", weight: "30" },
      ]),
    ).toThrow(/100/);
  });

  it("rejects empty criteria", () => {
    expect(() => assertRubricCriteria([])).toThrow(/ít nhất/);
  });

  it("uniquifies duplicate codes", () => {
    const result = assertRubricCriteria([
      { ...base, code: "IMPACT", titleVi: "Một", weight: "50" },
      { ...base, code: "IMPACT", titleVi: "Hai", weight: "50" },
    ]);
    expect(result.map((item) => item.code)).toEqual(["IMPACT", "IMPACT_2"]);
  });

  it("parses criteria JSON from the admin form", () => {
    const parsed = parseRubricCriteriaJson(
      JSON.stringify([{ titleVi: "A", weight: "100", minScore: 0, maxScore: 10, scoreStep: 0.5 }]),
    );
    expect(parsed[0]?.titleVi).toBe("A");
    expect(parsed[0]?.weight).toBe("100");
  });

  it("builds a code from Vietnamese title", () => {
    expect(criterionCodeFromTitle("Tính khả thi", 0)).toBe("TINH_KHA_THI");
  });
});
