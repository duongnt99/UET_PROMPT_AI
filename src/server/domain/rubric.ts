import { toContentSlug } from "@/lib/utils";
import { rubricWeightsSumTo100, sumNormalizedScores, toDecimal } from "@/server/domain/scoring";

export type RubricStage = "AUDITION" | "FINAL";

export type RubricCriterionInput = {
  id?: string;
  code: string;
  titleVi: string;
  titleEn: string;
  description: string;
  guidance: string;
  weight: string;
  minScore: string;
  maxScore: string;
  scoreStep: string;
  isRequired: boolean;
};

export function parseRubricStage(value: string): RubricStage {
  if (value === "AUDITION" || value === "FINAL") return value;
  throw new Error("Vòng chấm không hợp lệ.");
}

export function criterionCodeFromTitle(titleVi: string, index: number): string {
  const slug = toContentSlug(titleVi).replace(/-/g, "_").toUpperCase().slice(0, 32);
  return slug || `CRITERION_${index + 1}`;
}

export function parseRubricCriteriaJson(value: string): RubricCriterionInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Dữ liệu tiêu chí không hợp lệ.");
  }
  if (!Array.isArray(parsed)) throw new Error("Dữ liệu tiêu chí không hợp lệ.");
  return parsed.map((row, index) => {
    if (!row || typeof row !== "object") {
      throw new Error(`Tiêu chí #${index + 1} không hợp lệ.`);
    }
    const item = row as Record<string, unknown>;
    return {
      id: typeof item.id === "string" ? item.id.trim() : "",
      code: String(item.code ?? ""),
      titleVi: String(item.titleVi ?? ""),
      titleEn: String(item.titleEn ?? ""),
      description: String(item.description ?? ""),
      guidance: String(item.guidance ?? ""),
      weight: String(item.weight ?? ""),
      minScore: String(item.minScore ?? "0"),
      maxScore: String(item.maxScore ?? "10"),
      scoreStep: String(item.scoreStep ?? "0.5"),
      isRequired: item.isRequired !== false,
    };
  });
}

function normalizeCode(code: string, titleVi: string, index: number): string {
  const raw = (code.trim() || criterionCodeFromTitle(titleVi, index))
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return raw || `CRITERION_${index + 1}`;
}

export function assertRubricCriteria(criteria: RubricCriterionInput[]): RubricCriterionInput[] {
  if (criteria.length < 1) throw new Error("Cần ít nhất một tiêu chí.");
  const seen = new Set<string>();
  const normalized = criteria.map((item, index) => {
    const titleVi = item.titleVi.trim();
    if (titleVi.length < 2) throw new Error(`Tiêu chí #${index + 1}: cần tên tiếng Việt.`);
    const code = uniquify(normalizeCode(item.code, titleVi, index), seen);
    seen.add(code);
    let weight;
    let minScore;
    let maxScore;
    let scoreStep;
    try {
      weight = toDecimal(item.weight);
      minScore = toDecimal(item.minScore);
      maxScore = toDecimal(item.maxScore);
      scoreStep = toDecimal(item.scoreStep);
    } catch {
      throw new Error(`Tiêu chí “${titleVi}”: trọng số / thang điểm không hợp lệ.`);
    }
    if (weight.lte(0)) throw new Error(`Tiêu chí “${titleVi}”: trọng số phải lớn hơn 0.`);
    if (maxScore.lte(minScore)) throw new Error(`Tiêu chí “${titleVi}”: điểm tối đa phải lớn hơn điểm tối thiểu.`);
    if (scoreStep.lte(0)) throw new Error(`Tiêu chí “${titleVi}”: bước điểm phải lớn hơn 0.`);
    return {
      id: item.id?.trim() || undefined,
      code,
      titleVi,
      titleEn: item.titleEn.trim() || titleVi,
      description: item.description.trim(),
      guidance: item.guidance.trim(),
      weight: weight.toString(),
      minScore: minScore.toString(),
      maxScore: maxScore.toString(),
      scoreStep: scoreStep.toString(),
      isRequired: item.isRequired !== false,
    };
  });
  if (!rubricWeightsSumTo100(normalized.map((item) => item.weight))) {
    const sum = sumNormalizedScores(normalized.map((item) => item.weight)).toString();
    throw new Error(`Tổng trọng số phải bằng 100%. Hiện tại: ${sum}%.`);
  }
  return normalized;
}

function uniquify(code: string, seen: Set<string>): string {
  if (!seen.has(code)) return code;
  let n = 2;
  while (seen.has(`${code}_${n}`)) n += 1;
  return `${code}_${n}`;
}
