"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RotateCcw, Save } from "lucide-react";
import {
  resetPaperTemplateAction,
  savePaperSettingsAction,
  savePaperTemplateAction,
} from "@/app/(internal)/noi-bo/(app)/chung-tu/actions";
import { FormMessage } from "@/components/internal/FormMessage";
import { Panel } from "@/components/internal/PageHeader";
import { PaperSectionsEditor } from "@/components/internal/PaperSectionsEditor";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import type { ActionResult } from "@/lib/internal/action-result";
import { formatInstant } from "@/lib/internal/format";
import type { PaperPlaceholder, PaperSettings, PaperTemplate } from "@/lib/internal/types";

/**
 * The standard text of one kind of document. New documents start as a copy of it; documents already made keep
 * their own text. Only administrators can change it — salespeople see it read-only.
 */
export function PaperTemplateEditor({
  template,
  placeholders,
  admin,
}: {
  template: PaperTemplate;
  placeholders: PaperPlaceholder[];
  admin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sections, setSections] = useState(template.sections);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const response = await action();
      setResult(response);
      if (!response.ok) return;
      setDirty(false);
      startTransition(() => router.refresh());
    });
  }

  return (
    <Panel
      title={`Mẫu ${template.label.toLowerCase()}`}
      actions={
        <span className="text-xs text-muted">
          {template.customized
            ? `Đã sửa bởi ${template.changedBy ?? "admin"} lúc ${formatInstant(template.changedAt)}`
            : "Mẫu chuẩn có sẵn"}
        </span>
      }
      bodyClassName="space-y-4"
    >
      <PaperSectionsEditor
        sections={sections}
        placeholders={placeholders}
        bilingual={template.kind === "SALE_CONTRACT_BILINGUAL"}
        disabled={!admin || pending}
        onChange={(next) => {
          setSections(next);
          setDirty(true);
        }}
      />
      {admin ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            disabled={pending || !dirty}
            onClick={() =>
              run(() => savePaperTemplateAction(template.kind, template.version, sections))
            }
          >
            <Save className="size-4" strokeWidth={1.75} aria-hidden />
            Lưu mẫu
          </Button>
          {template.customized && (
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => run(() => resetPaperTemplateAction(template.kind))}
            >
              <RotateCcw className="size-4" strokeWidth={1.75} aria-hidden />
              Khôi phục mẫu chuẩn
            </Button>
          )}
          {dirty && <span className="text-sm text-muted">Có thay đổi chưa lưu</span>}
          <span className="text-xs text-muted">
            Chỉ áp dụng cho chứng từ tạo mới; chứng từ đã tạo giữ nội dung của nó.
          </span>
          <FormMessage result={result} className="basis-full" />
        </div>
      ) : (
        <p className="text-sm text-muted">Chỉ admin sửa được mẫu chuẩn.</p>
      )}
    </Panel>
  );
}

/** Who signs for Kim Long on contracts and letters, and the city printed in dates. */
export function PaperSettingsForm({
  settings,
  admin,
}: {
  settings: PaperSettings;
  admin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(settings);
  const [result, setResult] = useState<ActionResult | null>(null);

  function set<K extends keyof PaperSettings>(key: K, value: PaperSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <Panel title="Người ký và nơi lập">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const response = await savePaperSettingsAction(form);
            setResult(response);
            if (response.ok) startTransition(() => router.refresh());
          });
        }}
      >
        <fieldset disabled={!admin || pending} className="grid gap-3 md:grid-cols-2">
          <Field id="signatoryName" label="Người ký (đại diện Kim Long)" required>
            <Input
              id="signatoryName"
              value={form.signatoryName}
              maxLength={100}
              onChange={(event) => set("signatoryName", event.target.value)}
            />
          </Field>
          <Field id="signatoryTitle" label="Chức vụ" required>
            <Input
              id="signatoryTitle"
              value={form.signatoryTitle}
              maxLength={100}
              onChange={(event) => set("signatoryTitle", event.target.value)}
            />
          </Field>
          <Field id="signatorySalutation" label="Danh xưng">
            <Select
              id="signatorySalutation"
              value={form.signatorySalutation ?? ""}
              onChange={(event) => set("signatorySalutation", event.target.value || null)}
            >
              <option value="">—</option>
              <option value="Ông">Ông</option>
              <option value="Bà">Bà</option>
            </Select>
          </Field>
          <Field id="city" label="Thành phố (in ở ngày lập, nơi giải quyết tranh chấp)" required>
            <Input
              id="city"
              value={form.city}
              maxLength={100}
              onChange={(event) => set("city", event.target.value)}
            />
          </Field>
          <p className="pt-2 text-xs font-semibold tracking-wide text-muted uppercase md:col-span-2">
            Tiếng Anh (hợp đồng song ngữ)
          </p>
          <Field id="companyNameEn" label="Tên Kim Long (tiếng Anh)" className="md:col-span-2">
            <Input
              id="companyNameEn"
              value={form.companyNameEn ?? ""}
              maxLength={200}
              onChange={(event) => set("companyNameEn", event.target.value || null)}
            />
          </Field>
          <Field id="companyAddressEn" label="Địa chỉ (tiếng Anh)" className="md:col-span-2">
            <Input
              id="companyAddressEn"
              value={form.companyAddressEn ?? ""}
              maxLength={300}
              onChange={(event) => set("companyAddressEn", event.target.value || null)}
            />
          </Field>
          <Field id="signatoryTitleEn" label="Chức vụ người ký (tiếng Anh)">
            <Input
              id="signatoryTitleEn"
              value={form.signatoryTitleEn ?? ""}
              maxLength={100}
              onChange={(event) => set("signatoryTitleEn", event.target.value || null)}
            />
          </Field>
          <Field id="cityEn" label="Thành phố (tiếng Anh)">
            <Input
              id="cityEn"
              value={form.cityEn ?? ""}
              maxLength={100}
              onChange={(event) => set("cityEn", event.target.value || null)}
            />
          </Field>
        </fieldset>
        {admin && (
          <Button size="sm" type="submit" disabled={pending}>
            <Save className="size-4" strokeWidth={1.75} aria-hidden />
            Lưu
          </Button>
        )}
        <p className="text-xs text-muted">
          Áp dụng cho chứng từ tạo mới. Địa chỉ, MST, điện thoại và tài khoản ngân hàng của Kim Long
          lấy từ hồ sơ công ty và cấu hình, như trên báo giá.
        </p>
        <FormMessage result={result} />
      </form>
    </Panel>
  );
}
