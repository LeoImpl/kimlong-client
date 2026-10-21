import { Extension, InputRule, Node, mergeAttributes, type Editor, type Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import { PLACEHOLDER_BLOCK_NODE, PLACEHOLDER_NODE } from "@/lib/internal/paper-text";
import type { PaperPlaceholder } from "@/lib/internal/types";
import { SlashMenu, type SlashItem, type SlashMenuHandle } from "./SlashMenu";

/** How a placeholder reads to the person editing: its description without remarks and examples. */
export function placeholderLabel(placeholder: PaperPlaceholder | undefined, name: string) {
  if (!placeholder) return `{{${name}}}`;
  return placeholder.description
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/,?\s*ví dụ.*$/, "")
    .trim();
}

interface VariableOptions {
  placeholders: ReadonlyMap<string, PaperPlaceholder>;
}

/** An inline placeholder, shown as a chip; it prints as the value, so bold and italic apply to it. */
export const Variable = Node.create<VariableOptions>({
  name: PLACEHOLDER_NODE,
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return { placeholders: new Map() };
  },

  addAttributes() {
    return { name: { default: "" } };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-variable]",
        getAttrs: (element) => ({ name: element.getAttribute("data-variable") }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-variable": node.attrs.name }),
      `{{${node.attrs.name}}}`,
    ];
  },

  renderText({ node }) {
    return `{{${node.attrs.name}}}`;
  },

  addNodeView() {
    return ({ node }) => {
      const name = String(node.attrs.name);
      const placeholder = this.options.placeholders.get(name);
      const dom = document.createElement("span");
      dom.dataset.variable = name;
      dom.className =
        placeholder && !placeholder.block ? "paper-variable" : "paper-variable is-unknown";
      dom.textContent = placeholderLabel(placeholder, name);
      dom.title = placeholder
        ? `{{${name}}} — ${placeholder.description}`
        : `{{${name}}} — biến không có, sẽ bị từ chối khi lưu`;
      return { dom };
    };
  },

  addInputRules() {
    // Typing {{TEN_BIEN}} by hand turns it into a chip, as pasting it does on reload.
    return [
      new InputRule({
        find: /\{\{([A-Z_]+)\}\}$/,
        handler: ({ state, range, match }) => {
          state.tr.replaceWith(range.from, range.to, this.type.create({ name: match[1] }));
        },
      }),
    ];
  },
});

/** A placeholder standing for a whole block (the items table, the parties), shown as a card. */
export const VariableBlock = Node.create<VariableOptions>({
  name: PLACEHOLDER_BLOCK_NODE,
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return { placeholders: new Map() };
  },

  addAttributes() {
    return { name: { default: "" } };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-variable-block]",
        getAttrs: (element) => ({ name: element.getAttribute("data-variable-block") }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-variable-block": node.attrs.name }),
      `{{${node.attrs.name}}}`,
    ];
  },

  renderText({ node }) {
    return `{{${node.attrs.name}}}`;
  },

  addNodeView() {
    return ({ node }) => {
      const name = String(node.attrs.name);
      const placeholder = this.options.placeholders.get(name);
      const dom = document.createElement("div");
      dom.dataset.variableBlock = name;
      dom.className = "paper-variable-block";
      dom.contentEditable = "false";
      const title = document.createElement("span");
      title.className = "paper-variable-block-title";
      title.textContent = placeholderLabel(placeholder, name);
      const hint = document.createElement("span");
      hint.className = "paper-variable-block-hint";
      hint.textContent = "Tự động điền khi xuất file";
      dom.append(title, hint);
      return { dom };
    };
  },
});

interface SlashOptions {
  items: (query: string) => SlashItem[];
}

/** The "/" menu: formatting and every placeholder, filtered by what is typed after the slash. */
export const SlashCommands = Extension.create<SlashOptions>({
  name: "slashCommands",

  addOptions() {
    return { items: () => [] };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        char: "/",
        allowSpaces: true,
        items: ({ query }) => this.options.items(query),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => {
          let renderer: ReactRenderer<SlashMenuHandle> | null = null;
          let unmount: (() => void) | null = null;
          return {
            onStart: (props) => {
              renderer = new ReactRenderer(SlashMenu, { props, editor: props.editor });
              unmount = props.mount(renderer.element);
            },
            onUpdate: (props) => renderer?.updateProps(props),
            onKeyDown: (props) => {
              if (props.event.key === "Escape") return false;
              return renderer?.ref?.onKeyDown(props.event) ?? false;
            },
            onExit: () => {
              unmount?.();
              renderer?.destroy();
              renderer = null;
              unmount = null;
            },
          };
        },
      }),
    ];
  },
});

/**
 * The language of a paragraph or heading in a bilingual document: `lang: "en"` marks the English translation of the
 * line above it ("[EN] " in the stored text). A new line after an English one starts in Vietnamese again.
 */
export const Language = Extension.create({
  name: "language",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          lang: {
            default: null,
            keepOnSplit: false,
            parseHTML: (element) => (element.getAttribute("lang") === "en" ? "en" : null),
            renderHTML: (attributes) =>
              attributes.lang === "en" ? { lang: "en", "data-lang": "en" } : {},
          },
        },
      },
    ];
  },
});

export function isEnglishLine(editor: Editor) {
  return editor.isActive("paragraph", { lang: "en" }) || editor.isActive("heading", { lang: "en" });
}

/** Marks the current line as English, or back to Vietnamese. */
export function toggleEnglishLine(editor: Editor, range?: Range) {
  const lang = isEnglishLine(editor) ? null : "en";
  const chain = editor.chain().focus();
  if (range) chain.deleteRange(range);
  chain.updateAttributes("paragraph", { lang }).updateAttributes("heading", { lang }).run();
}

/** Inserts a placeholder at the range, as a card on its own line for a block one. */
export function insertPlaceholder(
  editor: Editor,
  range: Range | null,
  placeholder: PaperPlaceholder,
) {
  const chain = editor.chain().focus();
  if (range) chain.deleteRange(range);
  if (placeholder.block) {
    chain.insertContent({ type: PLACEHOLDER_BLOCK_NODE, attrs: { name: placeholder.name } });
  } else {
    chain.insertContent([
      { type: PLACEHOLDER_NODE, attrs: { name: placeholder.name } },
      { type: "text", text: " " },
    ]);
  }
  chain.run();
}
