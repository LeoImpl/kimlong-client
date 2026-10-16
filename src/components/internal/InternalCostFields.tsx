"use client";

import { Field, Input } from "@/components/ui/Field";
import { formatNumber } from "@/lib/internal/format";
import { parseAmount } from "@/lib/internal/pricing";

/**
 * The customer's commission and the shipping cost of a quotation or order. Internal: tinted like the cost columns and
 * never printed on what the customer receives.
 */
export function InternalCostFields({
  commissionPercent,
  shippingCost,
  commissionInvalid,
  onCommissionChange,
  onShippingChange,
  disabled = false,
}: {
  commissionPercent: string;
  shippingCost: string;
  commissionInvalid: boolean;
  onCommissionChange: (value: string) => void;
  onShippingChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-md bg-brand-50 px-3 py-3">
      <Field
        id="commissionPercent"
        label="Hoa hồng KH (%)"
        error={commissionInvalid ? "Từ 0 đến 50, tối đa 2 số lẻ" : undefined}
      >
        <Input
          id="commissionPercent"
          value={commissionPercent}
          onChange={(event) => onCommissionChange(event.target.value)}
          inputMode="decimal"
          placeholder="0"
          maxLength={6}
          invalid={commissionInvalid}
          disabled={disabled}
          className="text-right font-mono"
        />
      </Field>
      <Field id="shippingCost" label="CP vận chuyển (₫)">
        <Input
          id="shippingCost"
          value={shippingCost}
          onChange={(event) => {
            // Grouped as it is typed, like the amounts of the line grid.
            const parsed = parseAmount(event.target.value);
            onShippingChange(parsed === null ? "" : formatNumber(parsed));
          }}
          inputMode="numeric"
          placeholder="0"
          disabled={disabled}
          className="text-right font-mono"
        />
      </Field>
      <p className="col-span-2 text-xs text-brand-800">
        Hoa hồng tính trên tổng giá bán chưa VAT. Chỉ nội bộ thấy, không in ra báo giá.
      </p>
    </div>
  );
}
