import type { PaperSection } from "@/lib/internal/types";

/**
 * Converts the stored text of a trade document to the editor's document and back.
 *
 * The platform keeps sections as plain text (see `PaperSection.java`): one paragraph per line, "- " for a bullet,
 * `**bold**`, `*italic*` and `{{NAME}}` for what is filled in on export; a block placeholder stands alone on a line.
 * The editor shows the same thing as one rich page: a section heading is a level-2 heading, a placeholder is a chip.
 * The inline syntax is read the way `PaperworkComposer.runs` reads it, so what the editor shows is what gets printed.
 *
 * Bilingual documents mark a line of English with "[EN] " ("[EN] # " for the English heading of an article). In the
 * editor it is a paragraph or heading with `lang: "en"`; an English heading does not start a new section.
 */

/** The subset of Tiptap's JSONContent the paperwork editor uses. */
export interface PaperNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PaperNode[];
  marks?: { type: string }[];
  text?: string;
}

export const PLACEHOLDER_NODE = "variable";
export const PLACEHOLDER_BLOCK_NODE = "variableBlock";

const PLACEHOLDER = /\{\{\s*([A-Z_]+)\s*\}\}/g;
const PLACEHOLDER_ALONE = /^\{\{\s*([A-Z_]+)\s*\}\}$/;
const BULLET = /^(?:- |• )/;
export const ENGLISH = "[EN]";
const EN = { lang: "en" } as const;

/** The editor document for these sections. `blocks` names the placeholders that stand for a whole block. */
export function sectionsToDoc(sections: PaperSection[], blocks: ReadonlySet<string>): PaperNode {
  const content: PaperNode[] = [];
  for (const section of sections) {
    const heading = section.heading?.trim();
    if (heading) {
      content.push({ type: "heading", attrs: { level: 2 }, content: inline(heading, false) });
    }
    let bullets: PaperNode | null = null;
    for (const raw of section.body.split("\n")) {
      let line = raw.trim();
      const english = line.startsWith(ENGLISH);
      if (english) line = line.slice(ENGLISH.length).trim();
      if (!line) continue;
      const alone = PLACEHOLDER_ALONE.exec(line);
      if (alone && blocks.has(alone[1])) {
        bullets = null;
        content.push({ type: PLACEHOLDER_BLOCK_NODE, attrs: { name: alone[1] } });
        continue;
      }
      if (english && line.startsWith("# ")) {
        bullets = null;
        content.push({
          type: "heading",
          attrs: { level: 2, ...EN },
          content: inline(line.slice(2).trim(), false),
        });
        continue;
      }
      if (BULLET.test(line)) {
        if (!bullets) {
          bullets = { type: "bulletList", content: [] };
          content.push(bullets);
        }
        bullets.content!.push({
          type: "listItem",
          content: [paragraph(line.slice(2).trim(), english)],
        });
        continue;
      }
      bullets = null;
      content.push(paragraph(line, english));
    }
  }
  if (content.length === 0) content.push({ type: "paragraph" });
  return { type: "doc", content };
}

/** The sections of an editor document: each heading starts one, text before the first heading has none. */
export function docToSections(doc: PaperNode): PaperSection[] {
  const sections: { heading: string | null; lines: string[] }[] = [];
  const current = () => {
    if (sections.length === 0) sections.push({ heading: null, lines: [] });
    return sections[sections.length - 1];
  };
  for (const node of doc.content ?? []) {
    switch (node.type) {
      case "heading":
        if (isEnglish(node)) {
          const text = serializeInline(node.content ?? [], false).trim();
          if (text) current().lines.push(`${ENGLISH} # ${text}`);
          break;
        }
        sections.push({
          heading: serializeInline(node.content ?? [], false).trim() || null,
          lines: [],
        });
        break;
      case "bulletList":
        for (const item of node.content ?? []) {
          const children = item.content ?? [];
          const text = children
            .map((child) => serializeInline(child.content ?? [], true).trim())
            .filter(Boolean)
            .join(" ");
          const prefix = children.some(isEnglish) ? `${ENGLISH} ` : "";
          if (text) current().lines.push(`${prefix}- ${text}`);
        }
        break;
      case PLACEHOLDER_BLOCK_NODE:
        current().lines.push(`{{${String(node.attrs?.name)}}}`);
        break;
      default: {
        const text = serializeInline(node.content ?? [], true).trim();
        if (text) current().lines.push(isEnglish(node) ? `${ENGLISH} ${text}` : text);
      }
    }
  }
  return sections
    .filter((section) => section.heading !== null || section.lines.length > 0)
    .map((section) => ({ heading: section.heading, body: section.lines.join("\n") }));
}

function paragraph(text: string, english = false): PaperNode {
  const content = inline(text, true);
  const node: PaperNode = { type: "paragraph" };
  if (english) node.attrs = { ...EN };
  if (content.length > 0) node.content = content;
  return node;
}

function isEnglish(node: PaperNode) {
  return node.attrs?.lang === "en";
}

type Token =
  | { kind: "bold" }
  | { kind: "italic" }
  | { kind: "placeholder"; name: string }
  | { kind: "text"; text: string };

/**
 * Text and placeholder nodes for one line. "**" toggles bold and "*" italic; markers that are not paired stay as
 * typed, like the platform does.
 */
export function inline(text: string, emphasis: boolean): PaperNode[] {
  const tokens = tokenize(text);
  const balanced = (kind: "bold" | "italic") =>
    emphasis && tokens.filter((token) => token.kind === kind).length % 2 === 0;
  const boldOn = balanced("bold");
  const italicOn = balanced("italic");
  const nodes: PaperNode[] = [];
  let bold = false;
  let italic = false;
  const marks = () => {
    const list = [];
    if (bold) list.push({ type: "bold" });
    if (italic) list.push({ type: "italic" });
    return list.length > 0 ? { marks: list } : {};
  };
  const pushText = (value: string) => {
    if (!value) return;
    const last = nodes[nodes.length - 1];
    const current = marks();
    if (last?.type === "text" && sameMarks(last.marks, current.marks)) {
      last.text += value;
    } else {
      nodes.push({ type: "text", text: value, ...current });
    }
  };
  for (const token of tokens) {
    if (token.kind === "bold") {
      if (boldOn) bold = !bold;
      else pushText("**");
    } else if (token.kind === "italic") {
      if (italicOn) italic = !italic;
      else pushText("*");
    } else if (token.kind === "placeholder") {
      nodes.push({ type: PLACEHOLDER_NODE, attrs: { name: token.name }, ...marks() });
    } else {
      pushText(token.text);
    }
  }
  return nodes;
}

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let plain = "";
  const flush = () => {
    if (plain) tokens.push({ kind: "text", text: plain });
    plain = "";
  };
  let index = 0;
  while (index < text.length) {
    PLACEHOLDER.lastIndex = index;
    const placeholder = text.startsWith("{{", index) ? PLACEHOLDER.exec(text) : null;
    if (placeholder && placeholder.index === index) {
      flush();
      tokens.push({ kind: "placeholder", name: placeholder[1] });
      index += placeholder[0].length;
    } else if (text.startsWith("**", index)) {
      flush();
      tokens.push({ kind: "bold" });
      index += 2;
    } else if (text[index] === "*") {
      flush();
      tokens.push({ kind: "italic" });
      index += 1;
    } else {
      plain += text[index];
      index += 1;
    }
  }
  flush();
  return tokens;
}

/** The stored text of a paragraph or heading. Without `emphasis`, bold and italic are dropped. */
function serializeInline(nodes: PaperNode[], emphasis: boolean): string {
  let out = "";
  let bold = false;
  let italic = false;
  const switchTo = (nextBold: boolean, nextItalic: boolean) => {
    // Close the inner mark first, then open from the outside in, so the markers nest like "**bold *both***".
    if (italic && !nextItalic) out += "*";
    if (bold && !nextBold) out += "**";
    if (!bold && nextBold) out += "**";
    if (!italic && nextItalic) out += "*";
    bold = nextBold;
    italic = nextItalic;
  };
  for (const node of nodes) {
    const has = (type: string) => emphasis && (node.marks ?? []).some((mark) => mark.type === type);
    const text =
      node.type === PLACEHOLDER_NODE ? `{{${String(node.attrs?.name)}}}` : (node.text ?? "");
    if (!text) continue;
    switchTo(has("bold"), has("italic"));
    out += text;
  }
  switchTo(false, false);
  return out;
}

function sameMarks(a: { type: string }[] | undefined, b: { type: string }[] | undefined) {
  const left = (a ?? []).map((mark) => mark.type).join();
  const right = (b ?? []).map((mark) => mark.type).join();
  return left === right;
}
