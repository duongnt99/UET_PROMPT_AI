import { describe, expect, it } from "vitest";
import { isDeadlinePassed, isWithinWindow, remainingMs } from "@/server/domain/deadlines";

const now = new Date("2026-09-20T10:00:00.000Z");

describe("deadline calculation", () => {
  it("accepts a timestamp inside the configured window", () => {
    expect(
      isWithinWindow({
        now,
        openAt: "2026-09-15T00:00:00.000Z",
        closeAt: "2026-10-05T16:59:59.000Z",
      }),
    ).toBe(true);
  });

  it("rejects timestamps after close", () => {
    expect(
      isDeadlinePassed({
        now: new Date("2026-10-05T17:00:00.000Z"),
        closeAt: "2026-10-05T16:59:59.000Z",
      }),
    ).toBe(true);
  });

  it("uses server override deadline when present", () => {
    expect(
      isDeadlinePassed({
        now: new Date("2026-10-06T10:00:00.000Z"),
        closeAt: "2026-10-05T16:59:59.000Z",
        overrideDeadline: "2026-10-08T16:59:59.000Z",
      }),
    ).toBe(false);
  });

  it("computes remaining milliseconds from server time", () => {
    expect(
      remainingMs({
        now,
        closeAt: "2026-09-20T10:01:00.000Z",
      }),
    ).toBe(60_000);
  });
});
