import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Panel } from "@/components/internal/PageHeader";
import { PlaceholderHelp } from "@/components/internal/PaperSectionsEditor";
import { PaperSettingsForm, PaperTemplateEditor } from "@/components/internal/PaperTemplateEditor";
import { cn } from "@/lib/cn";
import {
  getMe,
  getPaperSettings,
  listPaperPlaceholders,
  listPaperTemplates,
} from "@/lib/internal/api";
import { internalRoutes, param } from "@/lib/internal/routes";

export const metadata: Metadata = { title: "Mẫu chứng từ" };

export const instant = false;

export default async function PaperTemplatesPage({
  searchParams,
}: PageProps<"/noi-bo/mau-chung-tu">) {
  const [templates, placeholders, settings, me] = await Promise.all([
    listPaperTemplates(),
    listPaperPlaceholders(),
    getPaperSettings(),
    getMe(),
  ]);
  const kind = param((await searchParams).loai);
  const template = templates.find((candidate) => candidate.kind === kind) ?? templates[0];

  return (
    <>
      <PageHeader
        title="Mẫu chứng từ"
        description="Nội dung chuẩn của hợp đồng, phụ lục, đề nghị thanh toán và biên bản giao hàng. Chứng từ mới bắt đầu từ mẫu này."
        crumbs={[{ label: "Mẫu chứng từ" }]}
      />
      <nav aria-label="Loại chứng từ" className="mb-4 flex flex-wrap gap-1 border-b border-line">
        {templates.map((item) => (
          <Link
            key={item.kind}
            href={internalRoutes.paperTemplate(item.kind)}
            aria-current={item.kind === template.kind ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
              item.kind === template.kind
                ? "border-action-600 text-action-700"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {/* Remounted for another kind or version, so the editor starts from what is stored. */}
          <PaperTemplateEditor
            key={`${template.kind}-${template.version}`}
            template={template}
            placeholders={placeholders}
            admin={me.admin}
          />
          <PaperSettingsForm key={settings.version} settings={settings} admin={me.admin} />
        </div>
        <aside>
          <Panel title="Cách soạn">
            <PlaceholderHelp placeholders={placeholders} />
          </Panel>
        </aside>
      </div>
    </>
  );
}
