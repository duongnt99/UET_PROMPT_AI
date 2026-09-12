import { describe, expect, it } from "vitest";
import { computePublicMatchScores, formatMatchDurationLabel } from "@/server/domain/public-match-scoring";

const criteria = [
  { id: "c1", titleVi: "Tính khả thi", weight: 40 },
  { id: "c2", titleVi: "Tính sáng tạo", weight: 30 },
  { id: "c3", titleVi: "Tiềm năng tác động", weight: 30 },
];

describe("computePublicMatchScores", () => {
  it("returns incomplete when not enough judges", () => {
    const result = computePublicMatchScores({
      numberOfJudgesPerMatch: 3,
      competitorAId: "a",
      competitorBId: "b",
      criteria,
      judgeAssignments: [
        {
          status: "SUBMITTED",
          scores: [
            {
              competitorId: "a",
              status: "SUBMITTED",
              totalNormalized: "80",
              items: [{ criterionId: "c1", rawScore: 8 }],
            },
          ],
        },
      ],
    });
    expect(result.scoresComplete).toBe(false);
    expect(result.totals).toBeNull();
    expect(result.scoreBreakdown).toEqual([]);
  });

  it("returns complete aggregate scores when judges submitted", () => {
    const judgeScore = (competitorId: string, total: string, raw: number) => ({
      competitorId,
      status: "SUBMITTED",
      totalNormalized: total,
      items: criteria.map((criterion, index) => ({
        criterionId: criterion.id,
        rawScore: raw + index,
      })),
    });

    const result = computePublicMatchScores({
      numberOfJudgesPerMatch: 2,
      competitorAId: "a",
      competitorBId: "b",
      criteria,
      judgeAssignments: [
        {
          status: "SUBMITTED",
          scores: [judgeScore("a", "82", 8), judgeScore("b", "78", 7)],
        },
        {
          status: "SUBMITTED",
          scores: [judgeScore("a", "84", 9), judgeScore("b", "76", 6)],
        },
      ],
    });

    expect(result.scoresComplete).toBe(true);
    expect(result.scoreBreakdown).toHaveLength(3);
    expect(result.totals).toEqual({ teamA: "83.00", teamB: "77.00" });
    expect(result.scoreBreakdown[0]?.teamAScore).toBe("8.50");
  });

  it("does not expose partial scores when criterion data missing", () => {
    const result = computePublicMatchScores({
      numberOfJudgesPerMatch: 1,
      competitorAId: "a",
      competitorBId: "b",
      criteria,
      judgeAssignments: [
        {
          status: "SUBMITTED",
          scores: [
            {
              competitorId: "a",
              status: "SUBMITTED",
              totalNormalized: "80",
              items: [{ criterionId: "c1", rawScore: 8 }],
            },
            {
              competitorId: "b",
              status: "SUBMITTED",
              totalNormalized: "70",
              items: [],
            },
          ],
        },
      ],
    });
    expect(result.scoresComplete).toBe(false);
    expect(result.scoreBreakdown).toEqual([]);
  });
});

describe("formatMatchDurationLabel", () => {
  it("formats seconds and minutes", () => {
    expect(formatMatchDurationLabel(45_000)).toBe("45 giây");
    expect(formatMatchDurationLabel(125_000)).toBe("2 phút 5 giây");
    expect(formatMatchDurationLabel(null)).toBeNull();
  });
});
