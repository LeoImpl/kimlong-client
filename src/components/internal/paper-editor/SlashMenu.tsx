"use client";

import type { Editor, Range } from "@tiptap/core";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface SlashItem {
  key: string;
  group: string;
  label: string;
  hint?: string;
  run: (editor: Editor, range: Range) => void;
}

export interface SlashMenuHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

/** The popup of the "/" menu; arrows move, Enter or Tab picks, Escape closes. */
export const SlashMenu = forwardRef<
  SlashMenuHandle,
  { items: SlashItem[]; command: (item: SlashItem) => void }
>(function SlashMenu({ items, command }, ref) {
  const [active, setActive] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const [previousItems, setPreviousItems] = useState(items);
  if (items !== previousItems) {
    setPreviousItems(items);
    setActive(0);
  }

  useEffect(() => {
    list.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  useImperativeHandle(ref, () => ({
    onKeyDown(event) {
      if (items.length === 0) return false;
      if (event.key === "ArrowDown") {
        setActive((index) => (index + 1) % items.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        setActive((index) => (index - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        command(items[active]);
        return true;
      }
      return false;
    },
  }));

  return (
    <div
      ref={list}
      role="listbox"
      aria-label="Chèn vào nội dung"
      className="z-50 max-h-80 w-80 overflow-y-auto rounded-lg border border-line bg-page p-1 shadow-lg"
    >
      {items.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted">Không tìm thấy</p>
      ) : (
        items.map((item, index) => (
          <div key={item.key}>
            {(index === 0 || items[index - 1].group !== item.group) && (
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-muted uppercase">
                {item.group}
              </p>
            )}
            <button
              type="button"
              role="option"
              aria-selected={index === active}
              data-index={index}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                command(item);
              }}
              className={cn(
                "block w-full rounded px-3 py-1.5 text-left",
                index === active ? "bg-action-50" : "hover:bg-surface",
              )}
            >
              <span className="block text-sm text-ink">{item.label}</span>
              {item.hint && <span className="block text-xs text-muted">{item.hint}</span>}
            </button>
          </div>
        ))
      )}
    </div>
  );
});
