import { describe, expect, it } from "vitest";
import { pageWindow } from "./Pagination";

describe("pageWindow", () => {
  it("shows every page when there are few", () => {
    expect(pageWindow(0, 4)).toEqual([0, 1, 2, 3]);
  });

  it("keeps the first and last page reachable, with a gap in between", () => {
    expect(pageWindow(10, 20)).toEqual([0, null, 8, 9, 10, 11, 12, null, 19]);
  });

  it("fills a gap of a single page rather than hiding it behind an ellipsis", () => {
    // Page 6 is the only one outside the window, so it is shown instead of a "…" of the same width.
    expect(pageWindow(3, 8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});
