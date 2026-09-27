import { describe, expect, it } from "vitest";
import { anchor, readingMinutes } from "./ArticleBody";

describe("anchor", () => {
  it("drops Vietnamese diacritics and punctuation", () => {
    expect(anchor("Khi nào cần thay lọc dầu máy nén khí Atlas Copco?")).toBe(
      "khi-nao-can-thay-loc-dau-may-nen-khi-atlas-copco",
    );
  });

  it("turns đ into d", () => {
    expect(anchor("Đặc điểm nổi bật của IES230:")).toBe("dac-diem-noi-bat-cua-ies230");
  });
});

describe("readingMinutes", () => {
  it("counts the words of every text block at 200 a minute", () => {
    const words = (count: number) => Array.from({ length: count }, () => "chữ").join(" ");
    expect(
      readingMinutes([
        { type: "paragraph", text: words(300) },
        { type: "list", ordered: false, items: [words(50), words(50)] },
        { type: "image", imageUrl: "/a.jpg", caption: null },
      ]),
    ).toBe(2);
  });

  it("is never less than a minute", () => {
    expect(readingMinutes([{ type: "heading", level: 2, text: "Kết luận" }])).toBe(1);
  });
});
