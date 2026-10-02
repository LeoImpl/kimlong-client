import type { CompanySection } from "@/lib/api/types";

export type AboutBlock =
  | { kind: "lead" | "prose"; section: CompanySection }
  | { kind: "statements"; sections: CompanySection[] }
  | { kind: "items"; section: CompanySection; items: { term: string; text: string }[] };

/** "Term: explanation" — a short term, so an ordinary sentence with a colon in it is not mistaken for one. */
const TERM = /^([^:\n]{2,40}):\s+([\s\S]+)$/;

export function paragraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function groupSections(sections: CompanySection[]): AboutBlock[] {
  const blocks: AboutBlock[] = [];
  sections.forEach((section, index) => {
    const parts = paragraphs(section.body);
    if (index === 0) {
      blocks.push({ kind: "lead", section });
      return;
    }
    const terms = parts.map((part) => TERM.exec(part));
    if (parts.length >= 2 && terms.every(Boolean)) {
      const items = terms.map((match) => ({ term: match![1].trim(), text: match![2].trim() }));
      blocks.push({ kind: "items", section, items });
      return;
    }
    if (parts.length === 1) {
      const previous = blocks.at(-1);
      if (previous?.kind === "statements") previous.sections.push(section);
      else blocks.push({ kind: "statements", sections: [section] });
      return;
    }
    blocks.push({ kind: "prose", section });
  });
  // A statement card on its own leaves half a row empty: a lone one-paragraph section reads better as prose.
  return blocks.map((block) =>
    block.kind === "statements" && block.sections.length === 1
      ? { kind: "prose", section: block.sections[0]! }
      : block,
  );
}
