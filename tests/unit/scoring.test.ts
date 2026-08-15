import { describe, expect, it } from "vitest";
import {
  aggregateScores,
  formatScoreDisplay,
  normalizeCriterionScore,
  resolveTieState,
  rubricWeightsSumTo100,
  scoresAreTied,
  sumNormalizedScores,
} from "@/server/domain/scoring";

describe("score normalization", () => {
  it("maps max raw score to full weight", () => {
    const score = normalizeCriterionScore({
      rawScore: 10,
      minScore: 0,
      maxScore: 10,
      weight: 40,
    });
    expect(score.toString()).toBe("40");
  });

  it("maps min raw score to zero", () => {
    const score = normalizeCriterionScore({
      rawScore: 0,
      minScore: 0,
      maxScore: 10,
      weight: 30,
    });
    expect(score.toString()).toBe("0");
  });

  it("normalizes mid-range scores without binary floating error", () => {
    const score = normalizeCriterionScore({
      rawScore: "7.5",
      minScore: 0,
      maxScore: 10,
      weight: 30,
    });
    expect(score.toString()).toBe("22.5");
  });

  it("rejects out-of-range scores", () => {
    expect(() =>
      normalizeCriterionScore({ rawScore: 11, minScore: 0, maxScore: 10, weight: 40 }),
    ).toThrow();
  });
});

describe("rubric weights", () => {
  it("accepts the default 40/30/30 split", () => {
    expect(rubricWeightsSumTo100([40, 30, 30])).toBe(true);
  });

  it("rejects weights that do not sum to 100", () => {
    expect(rubricWeightsSumTo100([50, 30, 30])).toBe(false);
  });
});

describe("aggregates and display rounding", () => {
  it("averages submitted reviewer totals", () => {
    const total = aggregateScores(["82.5", "77.5"]);
    expect(total.toString()).toBe("80");
  });

  it("only rounds at display time", () => {
    const value = sumNormalizedScores(["10.125", "10.125"]);
    expect(value.toString()).toBe("20.25");
    expect(formatScoreDisplay(value)).toBe("20.25");
    expect(formatScoreDisplay("10.126")).toBe("10.13");
  });
});

describe("tie handling", () => {
  it("does not auto-break a tie", () => {
    expect(scoresAreTied("80.00", "80")).toBe(true);
    expect(
      resolveTieState({
        aggregateA: "80",
        aggregateB: "80",
        tieHandlingMode: "MANUAL_VERDICT",
      }),
    ).toBe("TIE_REVIEW");
  });

  it("returns NEEDS_VERDICT when tie rule is undecided", () => {
    expect(
      resolveTieState({
        aggregateA: 50,
        aggregateB: 50,
        tieHandlingMode: "UNDECIDED",
      }),
    ).toBe("NEEDS_VERDICT");
  });

  it("selects the higher aggregate when scores differ", () => {
    expect(
      resolveTieState({
        aggregateA: "81.25",
        aggregateB: "80",
        tieHandlingMode: "MANUAL_VERDICT",
      }),
    ).toBe("A");
  });
});
