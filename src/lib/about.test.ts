import { describe, expect, it } from "vitest";
import { groupSections } from "./about";

const section = (title: string, body: string) => ({ title, body });

describe("groupSections", () => {
  it("opens with the lead, pairs one-paragraph sections and turns term lists into items", () => {
    const blocks = groupSections([
      section("Về Kim Long", "Đoạn một.\n\nĐoạn hai."),
      section("Tầm nhìn", "Trở thành đối tác được tin chọn."),
      section("Sứ mệnh", "Giúp nhà máy vận hành ổn định."),
      section(
        "Giá trị cốt lõi",
        "Chính hãng: Nguồn gốc rõ ràng.\n\nChính xác: Đúng mã ngay lần đầu.",
      ),
      section("Lĩnh vực ứng dụng", "Nhiều ngành: thực phẩm, dệt may.\n\nVà các ngành khác."),
    ]);

    expect(blocks.map((block) => block.kind)).toEqual(["lead", "statements", "items", "prose"]);
    expect(blocks[1]).toMatchObject({ sections: [{ title: "Tầm nhìn" }, { title: "Sứ mệnh" }] });
    expect(blocks[2]).toMatchObject({
      items: [
        { term: "Chính hãng", text: "Nguồn gốc rõ ràng." },
        { term: "Chính xác", text: "Đúng mã ngay lần đầu." },
      ],
    });
  });

  it("does not take a long sentence with a colon for a term", () => {
    const blocks = groupSections([
      section("Lead", "Một."),
      section(
        "Prose",
        "Phụ tùng và thiết bị do Kim Long cung ứng phục vụ nhiều ngành sản xuất: thực phẩm.\n\nCâu thứ hai: không phải mục.",
      ),
    ]);

    expect(blocks[1]?.kind).toBe("prose");
  });

  it("shows a lone one-paragraph section as prose, not as half a row of cards", () => {
    const blocks = groupSections([
      section("Lead", "Một."),
      section("Giá trị", "Chính hãng: một.\n\nChính xác: hai."),
      section("Lĩnh vực ứng dụng", "Một đoạn duy nhất."),
    ]);

    expect(blocks.map((block) => block.kind)).toEqual(["lead", "items", "prose"]);
  });
});
