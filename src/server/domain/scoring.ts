import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export type ScoreInput = string | number | Decimal;

export function toDecimal(value: ScoreInput): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}

export function normalizeCriterionScore(params: {
  rawScore: ScoreInput;
  minScore: ScoreInput;
  maxScore: ScoreInput;
  weight: ScoreInput;
}): Decimal {
  const raw = toDecimal(params.rawScore);
  const min = toDecimal(params.minScore);
  const max = toDecimal(params.maxScore);
  const weight = toDecimal(params.weight);
  if (max.eq(min)) {
    throw new Error("Criterion maxScore must differ from minScore");
  }
  if (raw.lt(min) || raw.gt(max)) {
    throw new Error("Raw score is outside the allowed range");
  }
  return raw.minus(min).div(max.minus(min)).times(weight);
}

export function sumNormalizedScores(scores: ScoreInput[]): Decimal {
  return scores.reduce<Decimal>((acc, score) => acc.plus(toDecimal(score)), new Decimal(0));
}

export function aggregateScores(totals: ScoreInput[]): Decimal {
  if (totals.length === 0) {
    throw new Error("Cannot aggregate an empty score list");
  }
  const sum = sumNormalizedScores(totals);
  return sum.div(totals.length);
}

export function formatScoreDisplay(value: ScoreInput, digits = 2): string {
  return toDecimal(value).toFixed(digits, Decimal.ROUND_HALF_UP);
}

export function scoresAreTied(a: ScoreInput, b: ScoreInput): boolean {
  return toDecimal(a).eq(toDecimal(b));
}

export function rubricWeightsSumTo100(
  weights: ScoreInput[],
  tolerance: ScoreInput = "0.0001",
): boolean {
  const sum = sumNormalizedScores(weights);
  return sum.minus(100).abs().lte(toDecimal(tolerance));
}

export type TieHandlingMode = "UNDECIDED" | "MANUAL_VERDICT" | "NEEDS_VERDICT";

export function resolveTieState(params: {
  aggregateA: ScoreInput;
  aggregateB: ScoreInput;
  tieHandlingMode: TieHandlingMode;
}): "A" | "B" | "TIE_REVIEW" | "NEEDS_VERDICT" {
  const a = toDecimal(params.aggregateA);
  const b = toDecimal(params.aggregateB);
  if (a.gt(b)) return "A";
  if (b.gt(a)) return "B";
  if (params.tieHandlingMode === "UNDECIDED") return "NEEDS_VERDICT";
  return params.tieHandlingMode === "NEEDS_VERDICT" ? "NEEDS_VERDICT" : "TIE_REVIEW";
}
