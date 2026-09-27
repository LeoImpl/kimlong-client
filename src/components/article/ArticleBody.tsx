import Image from "next/image";
import type { ArticleBlock, SpecRow } from "@/lib/api/types";
import { cn } from "@/lib/cn";

/**
 * An article body, block by block. The type is set for reading, not scanning: 20px text on a measure of about 70
 * characters with generous leading, because many readers are older engineers reading on a desktop at arm's
 * length. Headings get ids so a section can be linked from a chat message.
 */
export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="max-w-[68ch] text-lg leading-[1.8] text-body">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? (
        <h2
          id={anchor(block.text)}
          className="mt-12 scroll-mt-28 text-[1.75rem] leading-tight first:mt-0 sm:text-[2rem]"
        >
          {block.text}
          <span className="mt-2 block h-1 w-14 rounded-full bg-brand-500" aria-hidden />
        </h2>
      ) : (
        <h3 id={anchor(block.text)} className="mt-8 scroll-mt-28 text-[1.375rem] leading-snug">
          {block.text}
        </h3>
      );
    case "paragraph":
      return <p className="mt-4">{block.text}</p>;
    case "list":
      return block.ordered ? (
        <NumberedList items={block.items} />
      ) : (
        <BulletList items={block.items} />
      );
    case "image":
      return (
        <figure className="mt-6">
          <div className="overflow-hidden rounded-lg border border-line bg-page p-2">
            <Image
              src={block.imageUrl}
              alt={block.caption ?? ""}
              width={1200}
              height={900}
              sizes="(max-width: 1024px) 100vw, 760px"
              className="h-auto max-h-[560px] w-full object-contain"
            />
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-center text-base text-muted">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "specs":
      return <SpecTable rows={block.rows} />;
  }
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3">
          {/* A brass square, like a rivet head: visible at a glance, unlike a small round bullet. */}
          <span className="mt-[0.7em] size-2 shrink-0 rounded-[1px] bg-brand-500" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** A checklist: large numbers in blue discs, so "bước 3" can be found again at a glance. */
function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="mt-5 space-y-3">
      {items.map((item, index) => (
        <li key={item} className="flex gap-3.5 rounded-lg border border-line bg-page px-4 py-3">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-action-600 font-display text-lg font-bold text-white"
            aria-hidden
          >
            {index + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

/** Technical data as a real table: readable by search engines and screen readers, and it scales with the text. */
function SpecTable({ rows }: { rows: SpecRow[] }) {
  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-line bg-page">
      <table className="w-full text-left text-base">
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.label} className={cn(index % 2 === 1 && "bg-surface")}>
              <th scope="row" className="w-[45%] px-4 py-3 align-top font-medium text-muted">
                {row.label}
              </th>
              <td className="px-4 py-3 align-top font-semibold text-ink">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** "Khi nào cần thay lọc dầu?" becomes "khi-nao-can-thay-loc-dau", the same way the platform builds slugs. */
export function anchor(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Minutes to read at a comfortable 200 words a minute, never less than one. */
export function readingMinutes(blocks: ArticleBlock[]): number {
  const words = blocks
    .flatMap((block) =>
      block.type === "list"
        ? block.items
        : block.type === "specs"
          ? block.rows.flatMap((row) => [row.label, row.value])
          : block.type === "image"
            ? []
            : [block.text],
    )
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
