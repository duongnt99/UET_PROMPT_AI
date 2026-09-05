import { describe, expect, it } from "vitest";
import { defaultCompetitionSettings, parseCompetitionSettings } from "@/config/competition-settings";
import { formatDurationLabel, formatTimerClock } from "@/server/domain/match-setup";
import { matchProblemForDisplay, normalizeMatchProblem } from "@/server/domain/match-problem";

describe("competition format defaults", () => {
  it("uses 8 teams, no byes, 5-minute sprint and 60-second pitch", () => {
    const settings = defaultCompetitionSettings();
    expect(settings.finalistCount).toBe(8);
    expect(settings.allowByes).toBe(false);
    expect(settings.sprintDurationSeconds).toBe(300);
    expect(settings.pitchDurationSeconds).toBe(60);
  });

  it("fills missing settings from defaults without dropping stored values", () => {
    const parsed = parseCompetitionSettings({ finalistCount: 8, sprintDurationSeconds: 600 });
    expect(parsed.finalistCount).toBe(8);
    expect(parsed.sprintDurationSeconds).toBe(600);
    expect(parsed.pitchDurationSeconds).toBe(60);
    expect(parsed.allowByes).toBe(false);
  });
});

describe("duration labels", () => {
  it("formats clocks and minute labels", () => {
    expect(formatTimerClock(300)).toBe("05:00");
    expect(formatTimerClock(60)).toBe("01:00");
    expect(formatDurationLabel(300)).toBe("5 phút");
    expect(formatDurationLabel(60)).toBe("1 phút");
  });
});

describe("shared match problem", () => {
  it("requires title and prompt", () => {
    expect(() => normalizeMatchProblem({ title: " ", prompt: "Build a campus helper" })).toThrow(/tiêu đề/i);
    expect(() => normalizeMatchProblem({ title: "Campus", prompt: "" })).toThrow(/nội dung/i);
  });

  it("trims display payload and hides empty problems", () => {
    expect(matchProblemForDisplay({ title: "  ", prompt: "" })).toBeNull();
    expect(matchProblemForDisplay({ title: " A ", prompt: " B " })).toEqual({ title: "A", prompt: "B" });
  });
});
