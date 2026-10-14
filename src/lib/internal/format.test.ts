import { describe, expect, it } from "vitest";
import {
  formatCompactVnd,
  formatDay,
  formatFileSize,
  formatInstant,
  formatNumber,
  formatPercent,
  formatVnd,
  todayIso,
} from "./format";

describe("internal formats", () => {
  it("groups amounts the Vietnamese way", () => {
    expect(formatNumber(1250000)).toBe("1.250.000");
    expect(formatVnd(0)).toBe("0 ₫");
    expect(formatVnd(12651100)).toBe("12.651.100 ₫");
  });

  it("shortens large amounts for charts", () => {
    expect(formatCompactVnd(1_250_000_000)).toBe("1,3 tỷ");
    expect(formatCompactVnd(850_000_000)).toBe("850 tr");
    expect(formatCompactVnd(12_500_000)).toBe("12,5 tr");
    expect(formatCompactVnd(900)).toBe("900");
  });

  it("writes percentages with at most one decimal", () => {
    expect(formatPercent(30)).toBe("30%");
    expect(formatPercent(29.54)).toBe("29,5%");
  });

  it("reformats document dates as text, without a time zone shifting the day", () => {
    expect(formatDay("2026-10-11")).toBe("11/10/2026");
    expect(formatDay("2026-01-01")).toBe("01/01/2026");
    expect(formatDay(null)).toBe("");
  });

  it("shows instants and today's date in Vietnam's time zone", () => {
    // 17:30 UTC on 31 December is 00:30 on 1 January in Vietnam.
    const lateEvening = new Date("2026-12-31T17:30:00Z");
    expect(todayIso(lateEvening)).toBe("2027-01-01");
    expect(formatInstant("2026-12-31T17:30:00Z")).toContain("01/01/2027");
  });

  it("sizes files in KB and MB", () => {
    expect(formatFileSize(46_300)).toBe("45 KB");
    expect(formatFileSize(3 * 1024 * 1024)).toBe("3 MB");
    expect(formatFileSize(10)).toBe("1 KB");
  });
});
