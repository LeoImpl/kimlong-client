import { describe, expect, it } from "vitest";
import { docToSections, inline, sectionsToDoc } from "./paper-text";

const BLOCKS = new Set(["BANG_HANG_HOA", "THONG_TIN_CAC_BEN"]);

describe("paper text", () => {
  it("reads headings, paragraphs, bullets and block placeholders", () => {
    const doc = sectionsToDoc(
      [
        { heading: null, body: "- Căn cứ A;\n- Căn cứ B.\nHôm nay:\n{{THONG_TIN_CAC_BEN}}" },
        { heading: "ĐIỀU 1. HÀNG HÓA", body: "Như sau:\n\n{{BANG_HANG_HOA}}" },
      ],
      BLOCKS,
    );
    expect(doc.content!.map((node) => node.type)).toEqual([
      "bulletList",
      "paragraph",
      "variableBlock",
      "heading",
      "paragraph",
      "variableBlock",
    ]);
    expect(doc.content![0].content).toHaveLength(2);
  });

  it("keeps an unknown placeholder alone on a line inline", () => {
    const doc = sectionsToDoc([{ heading: null, body: "{{SO}}" }], BLOCKS);
    expect(doc.content![0]).toEqual({
      type: "paragraph",
      content: [{ type: "variable", attrs: { name: "SO" } }],
    });
  });

  it("reads emphasis and placeholders inside a line", () => {
    expect(inline("Tổng **{{TONG_GIA_TRI}} đồng** (*{{CHU}}*)", true)).toEqual([
      { type: "text", text: "Tổng " },
      { type: "variable", attrs: { name: "TONG_GIA_TRI" }, marks: [{ type: "bold" }] },
      { type: "text", text: " đồng", marks: [{ type: "bold" }] },
      { type: "text", text: " (" },
      { type: "variable", attrs: { name: "CHU" }, marks: [{ type: "italic" }] },
      { type: "text", text: ")" },
    ]);
  });

  it("reads bold and italic together", () => {
    expect(inline("***cả hai*** thường", true)).toEqual([
      { type: "text", text: "cả hai", marks: [{ type: "bold" }, { type: "italic" }] },
      { type: "text", text: " thường" },
    ]);
  });

  it("leaves unpaired markers as typed", () => {
    expect(inline("3 * 4 = 12", true)).toEqual([{ type: "text", text: "3 * 4 = 12" }]);
  });

  it.each([
    "Tổng giá trị là **{{TONG_GIA_TRI}} đồng** (Bằng chữ: *{{TONG_GIA_TRI_BANG_CHU}}*), đã gồm thuế.",
    "**Đậm** rồi *nghiêng* rồi ***cả hai***.",
    "*nghiêng **và đậm***",
    "Không có định dạng.",
  ])("writes back what it read: %s", (line) => {
    const sections = [
      { heading: null, body: `${line}\n- ${line}` },
      { heading: "ĐIỀU {{SO}}", body: "{{BANG_HANG_HOA}}" },
      { heading: "ĐIỀU 2", body: "" },
    ];
    expect(docToSections(sectionsToDoc(sections, BLOCKS))).toEqual(sections);
  });

  it("reads and writes the English lines of a bilingual contract", () => {
    const sections = [
      { heading: null, body: "Hôm nay:\n[EN] Today:\n- Căn cứ;\n[EN] - Pursuant to;" },
      { heading: "ĐIỀU I: HÀNG HÓA", body: "[EN] # ARTICLE I: GOODS\n{{BANG_HANG_HOA}}" },
    ];
    const doc = sectionsToDoc(sections, BLOCKS);
    expect(doc.content!.map((node) => [node.type, node.attrs?.lang ?? "vi"])).toEqual([
      ["paragraph", "vi"],
      ["paragraph", "en"],
      ["bulletList", "vi"],
      ["heading", "vi"],
      ["heading", "en"],
      ["variableBlock", "vi"],
    ]);
    expect(doc.content![2].content![1].content![0].attrs).toEqual({ lang: "en" });
    expect(docToSections(doc)).toEqual(sections);
  });

  it("drops empty paragraphs and starts a section at each heading", () => {
    const sections = docToSections({
      type: "doc",
      content: [
        { type: "paragraph" },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: " ĐIỀU 1 " }] },
        { type: "paragraph", content: [{ type: "text", text: "  " }] },
        { type: "paragraph", content: [{ type: "text", text: "Nội dung" }] },
      ],
    });
    expect(sections).toEqual([{ heading: "ĐIỀU 1", body: "Nội dung" }]);
  });
});
