"use client";

import Bold from "@tiptap/extension-bold";
import Document from "@tiptap/extension-document";
import Heading from "@tiptap/extension-heading";
import Italic from "@tiptap/extension-italic";
import { BulletList, ListItem } from "@tiptap/extension-list";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { Dropcursor, Placeholder, UndoRedo } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import {
  Bold as BoldIcon,
  Braces,
  Heading2,
  Italic as ItalicIcon,
  Languages,
  List,
  Pilcrow,
  Redo2,
  Search,
  Undo2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Language,
  SlashCommands,
  Variable,
  VariableBlock,
  insertPlaceholder,
  isEnglishLine,
  placeholderLabel,
  toggleEnglishLine,
} from "@/components/internal/paper-editor/extensions";
import type { SlashItem } from "@/components/internal/paper-editor/SlashMenu";
import { cn } from "@/lib/cn";
import { docToSections, sectionsToDoc } from "@/lib/internal/paper-text";
import type { PaperPlaceholder, PaperSection } from "@/lib/internal/types";

/**
 * The text of a contract or letter, edited as one page like in Confluence: "Tiêu đề điều khoản" starts an article,
 * bold, italic and bullets look as they print, and what the platform fills in on export shows as a chip. Typing "/"
 * opens a menu for all of it. The text is still stored as sections of plain text (see `paper-text.ts`).
 *
 * A bilingual document also marks lines as English ("EN"): each Vietnamese line is followed by its translation.
 */
export function PaperSectionsEditor({
  sections,
  placeholders,
  onChange,
  disabled = false,
  bilingual = false,
}: {
  sections: PaperSection[];
  placeholders: PaperPlaceholder[];
  onChange: (sections: PaperSection[]) => void;
  disabled?: boolean;
  bilingual?: boolean;
}) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const byName = useMemo(
    () => new Map(placeholders.map((placeholder) => [placeholder.name, placeholder])),
    [placeholders],
  );

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      Document,
      Paragraph,
      Text,
      // One heading level: a heading is the title of an article, and starts a new section.
      Heading.extend({ marks: "" }).configure({ levels: [2] }),
      Bold,
      Italic,
      BulletList,
      // Flat bullets only; the printed paper has no nested lists.
      ListItem.extend({ content: "paragraph" }),
      UndoRedo,
      Dropcursor.configure({ color: "var(--color-action-500)", width: 2 }),
      Placeholder.configure({
        placeholder: ({ editor: current }) =>
          current.isEmpty ? "Nhập nội dung, gõ / để chèn tiêu đề, danh sách hoặc biến…" : "",
      }),
      Variable.configure({ placeholders: byName }),
      VariableBlock.configure({ placeholders: byName }),
      Language,
      SlashCommands.configure({ items: (query) => slashItems(placeholders, query, bilingual) }),
    ],
    content: sectionsToDoc(sections, blockNames(placeholders)),
    editorProps: {
      attributes: {
        class: "paper-doc",
        "aria-label": "Nội dung chứng từ",
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    // Only real edits count: Tiptap also emits "update" for things like switching editable, which would mark the
    // form dirty and lock the export buttons.
    onUpdate: ({ editor: current, transaction }) => {
      if (transaction.docChanged) onChangeRef.current(docToSections(current.getJSON()));
    },
  });

  useEffect(() => {
    if (editor && editor.isEditable === disabled) editor.setEditable(!disabled, false);
  }, [editor, disabled]);

  return (
    <div className="overflow-hidden rounded-md border border-line bg-surface">
      {editor && !disabled && (
        <Toolbar editor={editor} placeholders={placeholders} bilingual={bilingual} />
      )}
      <div className="max-h-[75vh] overflow-y-auto px-3 py-4 sm:px-6">
        <div className="mx-auto max-w-[52rem] rounded-sm bg-page px-5 py-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.08)] sm:px-12 sm:py-10">
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <div className="h-64 animate-pulse rounded bg-surface" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
}

function blockNames(placeholders: PaperPlaceholder[]) {
  return new Set(placeholders.filter((item) => item.block).map((item) => item.name));
}

function matches(query: string, ...texts: string[]) {
  const wanted = fold(query.trim());
  return !wanted || texts.some((text) => fold(text).includes(wanted));
}

/** Lower case without Vietnamese accents, so "tong gia" finds "Tổng giá trị". */
function fold(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function slashItems(
  placeholders: PaperPlaceholder[],
  query: string,
  bilingual: boolean,
): SlashItem[] {
  const formats: SlashItem[] = [
    {
      key: "heading",
      group: "Định dạng",
      label: "Tiêu đề điều khoản",
      hint: "Bắt đầu một điều mới, ví dụ ĐIỀU 3. THANH TOÁN",
      run: (editor, range) =>
        editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
    },
    {
      key: "paragraph",
      group: "Định dạng",
      label: "Đoạn văn",
      run: (editor, range) => editor.chain().focus().deleteRange(range).setParagraph().run(),
    },
    {
      key: "bullets",
      group: "Định dạng",
      label: "Danh sách gạch đầu dòng",
      run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    ...(bilingual
      ? [
          {
            key: "english",
            group: "Định dạng",
            label: "Dòng tiếng Anh",
            hint: "Bản dịch của dòng tiếng Việt ngay trên, in nghiêng",
            run: (editor: Editor, range: { from: number; to: number }) =>
              toggleEnglishLine(editor, range),
          },
        ]
      : []),
  ];
  const toItem = (group: string) => (placeholder: PaperPlaceholder) => {
    const label = placeholderLabel(placeholder, placeholder.name);
    return {
      key: placeholder.name,
      group,
      label,
      hint: placeholder.description !== label ? placeholder.description : undefined,
      run: (editor: Editor, range: { from: number; to: number }) =>
        insertPlaceholder(editor, range, placeholder),
    };
  };
  return [
    ...formats.filter((item) => matches(query, item.label, item.key)),
    ...placeholders
      .filter((item) => !item.block && matches(query, item.description, item.name))
      .map(toItem("Giá trị điền tự động")),
    ...placeholders
      .filter((item) => item.block && matches(query, item.description, item.name))
      .map(toItem("Khối điền tự động")),
  ];
}

function Toolbar({
  editor,
  placeholders,
  bilingual,
}: {
  editor: Editor;
  placeholders: PaperPlaceholder[];
  bilingual: boolean;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      english: isEnglishLine(current),
      heading: current.isActive("heading"),
      bold: current.isActive("bold"),
      italic: current.isActive("italic"),
      bullets: current.isActive("bulletList"),
      canEmphasize: !current.isActive("heading"),
      canUndo: current.can().undo(),
      canRedo: current.can().redo(),
    }),
  });

  return (
    <div
      role="toolbar"
      aria-label="Định dạng"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-line bg-page px-2 py-1.5"
    >
      <ToolButton
        label="Đoạn văn"
        active={!state.heading && !state.bullets}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <Pilcrow className="size-4" strokeWidth={1.75} aria-hidden />
        <span className="hidden sm:inline">Đoạn văn</span>
      </ToolButton>
      <ToolButton
        label="Tiêu đề điều khoản"
        active={state.heading}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" strokeWidth={1.75} aria-hidden />
        <span className="hidden sm:inline">Tiêu đề điều khoản</span>
      </ToolButton>
      <Divider />
      <ToolButton
        label="Đậm (Ctrl+B)"
        active={state.bold}
        disabled={!state.canEmphasize}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="size-4" strokeWidth={2} aria-hidden />
      </ToolButton>
      <ToolButton
        label="Nghiêng (Ctrl+I)"
        active={state.italic}
        disabled={!state.canEmphasize}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="size-4" strokeWidth={2} aria-hidden />
      </ToolButton>
      <ToolButton
        label="Gạch đầu dòng"
        active={state.bullets}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" strokeWidth={1.75} aria-hidden />
      </ToolButton>
      {bilingual && (
        <ToolButton
          label="Dòng tiếng Anh (bản dịch của dòng trên)"
          active={state.english}
          onClick={() => toggleEnglishLine(editor)}
        >
          <Languages className="size-4" strokeWidth={1.75} aria-hidden />
          <span className="text-xs font-semibold">EN</span>
        </ToolButton>
      )}
      <Divider />
      <PlaceholderPicker editor={editor} placeholders={placeholders} />
      <Divider />
      <ToolButton
        label="Hoàn tác (Ctrl+Z)"
        disabled={!state.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="size-4" strokeWidth={1.75} aria-hidden />
      </ToolButton>
      <ToolButton
        label="Làm lại (Ctrl+Shift+Z)"
        disabled={!state.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="size-4" strokeWidth={1.75} aria-hidden />
      </ToolButton>
      <span className="ml-auto hidden text-xs text-muted lg:inline">
        Gõ <kbd className="rounded border border-line px-1 font-mono">/</kbd> để chèn nhanh
      </span>
    </div>
  );
}

/** "Chèn biến": a searchable list of what the platform fills in, inserted at the cursor. */
function PlaceholderPicker({
  editor,
  placeholders,
}: {
  editor: Editor;
  placeholders: PaperPlaceholder[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const shown = placeholders.filter((item) => matches(query, item.description, item.name));
  const groups = [
    { title: "Giá trị (chèn vào trong câu)", items: shown.filter((item) => !item.block) },
    {
      title: "Khối (bảng, danh sách, đứng riêng một dòng)",
      items: shown.filter((item) => item.block),
    },
  ];

  return (
    <div ref={box} className="relative">
      <ToolButton label="Chèn biến" active={open} onClick={() => setOpen((value) => !value)}>
        <Braces className="size-4" strokeWidth={1.75} aria-hidden />
        <span className="hidden sm:inline">Chèn biến</span>
      </ToolButton>
      {open && (
        <div
          className="absolute top-full left-0 z-20 mt-1 w-80 rounded-lg border border-line bg-page shadow-lg"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              editor.commands.focus();
            }
          }}
        >
          <div className="flex items-center gap-2 border-b border-line px-3">
            <Search className="size-4 text-muted" strokeWidth={1.75} aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm biến, ví dụ: tổng giá trị"
              aria-label="Tìm biến"
              className="h-10 w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="max-h-80 overflow-y-auto p-1">
            {groups.map(
              (group) =>
                group.items.length > 0 && (
                  <div key={group.title}>
                    <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">
                      {group.title}
                    </p>
                    {group.items.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => {
                          insertPlaceholder(editor, null, item);
                          setOpen(false);
                          setQuery("");
                        }}
                        className="block w-full rounded px-3 py-1.5 text-left hover:bg-action-50"
                      >
                        <span className="block text-sm text-ink">
                          {placeholderLabel(item, item.name)}
                        </span>
                        {item.description !== placeholderLabel(item, item.name) && (
                          <span className="block text-xs text-muted">{item.description}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ),
            )}
            {shown.length === 0 && <p className="px-3 py-2 text-sm text-muted">Không tìm thấy</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded px-2 text-sm text-body",
        "hover:bg-surface disabled:pointer-events-none disabled:opacity-40",
        active && "bg-action-50 text-action-700 hover:bg-action-100",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-line" />;
}

/** A short guide next to the editor. */
export function PlaceholderHelp({ placeholders }: { placeholders: PaperPlaceholder[] }) {
  const blocks = placeholders.filter((placeholder) => placeholder.block).length;
  return (
    <div className="space-y-2 text-sm">
      <ul className="space-y-1.5 text-xs text-body">
        <li>
          Gõ <kbd className="rounded border border-line px-1 font-mono">/</kbd> ở bất kỳ đâu để chèn
          tiêu đề điều khoản, gạch đầu dòng hoặc biến.
        </li>
        <li>
          <span className="paper-variable">Biến</span> được thay bằng số liệu thật khi xuất file. Rê
          chuột lên biến để xem giải thích.
        </li>
        <li>
          {blocks} khối như bảng hàng hóa, thông tin các bên được vẽ tự động; kéo thả để đổi vị trí.
        </li>
        <li>
          <kbd className="rounded border border-line px-1 font-mono">Ctrl+B</kbd> đậm,{" "}
          <kbd className="rounded border border-line px-1 font-mono">Ctrl+I</kbd> nghiêng,{" "}
          <kbd className="rounded border border-line px-1 font-mono">Ctrl+Z</kbd> hoàn tác.
        </li>
        <li>Mỗi lần Enter là một đoạn mới trong file Word/PDF; chữ tự xuống dòng theo khổ giấy.</li>
      </ul>
    </div>
  );
}
