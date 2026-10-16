"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Field";
import type { PaperPlaceholder, PaperSection } from "@/lib/internal/types";

/**
 * The articles of a contract or the passages of a letter, edited as plain text: one paragraph per line, "- " for a
 * bullet, **đậm**, *nghiêng*, and {{BIẾN}} for what the platform fills in on export.
 */
export function PaperSectionsEditor({
  sections,
  onChange,
  disabled = false,
}: {
  sections: PaperSection[];
  onChange: (sections: PaperSection[]) => void;
  disabled?: boolean;
}) {
  function update(index: number, changes: Partial<PaperSection>) {
    onChange(
      sections.map((section, position) =>
        position === index ? { ...section, ...changes } : section,
      ),
    );
  }

  function move(index: number, by: number) {
    const target = index + by;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {sections.map((section, index) => (
        <div key={index} className="rounded-md border border-line bg-page p-3">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={`section-heading-${index}`} className="sr-only">
              Tiêu đề mục {index + 1}
            </label>
            <Input
              id={`section-heading-${index}`}
              value={section.heading ?? ""}
              onChange={(event) => update(index, { heading: event.target.value || null })}
              placeholder="Tiêu đề (để trống nếu là đoạn mở đầu)"
              maxLength={200}
              disabled={disabled}
              className="h-9 min-w-64 flex-1 text-sm font-semibold"
            />
            {!disabled && (
              <div className="flex items-center gap-1">
                <IconButton label={`Đưa mục ${index + 1} lên`} onClick={() => move(index, -1)}>
                  <ArrowUp className="size-4" strokeWidth={1.75} aria-hidden />
                </IconButton>
                <IconButton label={`Đưa mục ${index + 1} xuống`} onClick={() => move(index, 1)}>
                  <ArrowDown className="size-4" strokeWidth={1.75} aria-hidden />
                </IconButton>
                <IconButton
                  label={`Xóa mục ${index + 1}`}
                  danger
                  onClick={() => onChange(sections.filter((_, position) => position !== index))}
                >
                  <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
                </IconButton>
              </div>
            )}
          </div>
          <label htmlFor={`section-body-${index}`} className="sr-only">
            Nội dung mục {index + 1}
          </label>
          <Textarea
            id={`section-body-${index}`}
            value={section.body}
            onChange={(event) => update(index, { body: event.target.value })}
            disabled={disabled}
            maxLength={20000}
            rows={Math.min(18, Math.max(3, section.body.split("\n").length + 1))}
            className="mt-2 font-mono text-[13px] leading-relaxed"
          />
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={() => onChange([...sections, { heading: null, body: "" }])}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-action-600 hover:text-action-700"
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden />
          Thêm mục
        </button>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        "inline-flex size-9 items-center justify-center rounded text-muted " +
        (danger
          ? "hover:bg-danger-soft hover:text-danger"
          : "hover:bg-action-50 hover:text-action-700")
      }
    >
      {children}
    </button>
  );
}

/** What the text of a document may use; shown next to the editor. */
export function PlaceholderHelp({ placeholders }: { placeholders: PaperPlaceholder[] }) {
  const blocks = placeholders.filter((placeholder) => placeholder.block);
  const values = placeholders.filter((placeholder) => !placeholder.block);
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="font-medium text-ink">Cách soạn</p>
        <ul className="mt-1 space-y-0.5 text-xs text-body">
          <li>Mỗi dòng là một đoạn văn.</li>
          <li>
            Dòng bắt đầu bằng <code className="font-mono">- </code> là gạch đầu dòng.
          </li>
          <li>
            <code className="font-mono">**chữ đậm**</code>,{" "}
            <code className="font-mono">*chữ nghiêng*</code>.
          </li>
          <li>Biến trong {"{{ }}"} được điền khi xuất file.</li>
        </ul>
      </div>
      <PlaceholderList title="Khối (đặt một mình trên một dòng)" items={blocks} />
      <PlaceholderList title="Giá trị" items={values} />
    </div>
  );
}

function PlaceholderList({ title, items }: { title: string; items: PaperPlaceholder[] }) {
  return (
    <div>
      <p className="font-medium text-ink">{title}</p>
      <dl className="mt-1 space-y-1">
        {items.map((item) => (
          <div key={item.name}>
            <dt className="font-mono text-xs font-semibold text-brand-800 select-all">{`{{${item.name}}}`}</dt>
            <dd className="text-xs text-muted">{item.description}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
