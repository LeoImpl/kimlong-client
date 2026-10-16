"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Ban, Banknote, PackageCheck, Save, Truck, Undo2 } from "lucide-react";
import {
  cancelOrderAction,
  changeDeliveryAction,
  recordPaymentAction,
  reviseOrderAction,
} from "@/app/(internal)/noi-bo/(app)/don-hang/actions";
import { FormMessage } from "@/components/internal/FormMessage";
import { InternalCostFields } from "@/components/internal/InternalCostFields";
import {
  emptyLine,
  isBlank,
  LineGrid,
  priced,
  toGridLine,
  toLineInput,
  type GridLine,
} from "@/components/internal/LineGrid";
import { Panel } from "@/components/internal/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import type { ActionResult } from "@/lib/internal/action-result";
import {
  formatDay,
  formatInstant,
  formatNumber,
  formatPercent,
  formatVnd,
  paymentMethods,
  vatRates,
} from "@/lib/internal/format";
import {
  analyse,
  basisPointsToPercent,
  parseAmount,
  percentOf,
  subtotal,
  typedSellingCosts,
  vatAmount,
} from "@/lib/internal/pricing";
import type { PaymentMethod, SalesOrder, SalesSettings } from "@/lib/internal/types";

/**
 * Everything that happens to an order after it is won: correcting what was actually sold, following the delivery,
 * recording payments, and cancelling it while nothing has moved. Each action carries the version on screen; the
 * page is refreshed inside the same transition, so the next click always uses the new one.
 */
export function OrderWorkspace({
  order,
  settings,
  today,
}: {
  order: SalesOrder;
  settings: SalesSettings;
  today: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [lines, setLines] = useState<GridLine[]>(() => order.lines.map(toGridLine));
  const [orderDate, setOrderDate] = useState(order.orderDate);
  const [note, setNote] = useState(order.note ?? "");
  const [costsForm, setCostsForm] = useState({
    commissionPercent: order.commissionPercent
      ? String(order.commissionPercent).replace(".", ",")
      : "",
    shippingCost: order.shippingCost ? formatNumber(order.shippingCost) : "",
  });
  const [dirty, setDirty] = useState(false);
  const [deliveredOn, setDeliveredOn] = useState(order.deliveredOn ?? today);
  const [payment, setPayment] = useState({
    amount: "",
    paidOn: today,
    method: "BANK_TRANSFER" as PaymentMethod,
    reference: "",
  });
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  function run(action: () => Promise<ActionResult>, after?: () => void) {
    startTransition(async () => {
      const response = await action();
      setResult(response);
      if (!response.ok) return;
      after?.();
      startTransition(() => router.refresh());
    });
  }

  const { costs: sellingCosts, commissionInvalid } = typedSellingCosts(costsForm);
  const filled = useMemo(() => lines.filter((line) => !isBlank(line)).map(priced), [lines]);
  const percent = vatRates[order.vatRate].percent;
  const analysis = analyse(
    filled,
    sellingCosts,
    settings.targetMarginPercent,
    settings.priceRounding,
  );
  // While editing, the totals follow the grid; otherwise they are the stored ones.
  const net = dirty ? subtotal(filled) : order.subtotal;
  const vat = dirty ? vatAmount(net, percent) : order.vatAmount;
  const commission = dirty ? analysis.commission : order.commission;
  const profit = dirty ? analysis.grossProfit : order.profit;
  const margin = percentOf(profit, net);
  const canCancel =
    !order.cancelled && order.deliveryStatus === "NOT_DELIVERED" && order.payments.length === 0;

  return (
    <div className="space-y-4">
      <FormMessage result={result} />

      {!order.cancelled && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Giao hàng" bodyClassName="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              {order.deliveryStatus === "NOT_DELIVERED" && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    run(() => changeDeliveryAction(order.id, order.version, "DELIVERING"))
                  }
                >
                  <Truck className="size-4" strokeWidth={1.75} aria-hidden />
                  Bắt đầu giao
                </Button>
              )}
              {order.deliveryStatus !== "DELIVERED" && (
                <>
                  <label>
                    <span className="mb-1 block text-xs font-medium text-muted">
                      Ngày giao xong
                    </span>
                    <Input
                      type="date"
                      value={deliveredOn}
                      onChange={(event) => setDeliveredOn(event.target.value)}
                      className="w-44"
                    />
                  </label>
                  <Button
                    size="sm"
                    variant="dark"
                    disabled={pending || dirty}
                    title={dirty ? "Lưu thay đổi dòng hàng trước" : undefined}
                    onClick={() =>
                      run(() =>
                        changeDeliveryAction(order.id, order.version, "DELIVERED", deliveredOn),
                      )
                    }
                  >
                    <PackageCheck className="size-4" strokeWidth={1.75} aria-hidden />
                    Đã giao xong
                  </Button>
                </>
              )}
              {order.deliveryStatus !== "NOT_DELIVERED" && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      changeDeliveryAction(
                        order.id,
                        order.version,
                        order.deliveryStatus === "DELIVERED" ? "DELIVERING" : "NOT_DELIVERED",
                      ),
                    )
                  }
                >
                  <Undo2 className="size-4" strokeWidth={1.75} aria-hidden />
                  Lùi một bước
                </Button>
              )}
            </div>
            <p className="text-xs text-muted">
              {order.deliveryStatus === "DELIVERED"
                ? `Đã giao ngày ${formatDay(order.deliveredOn)}. Đơn đã giao không sửa được dòng hàng.`
                : "Sau khi giao xong, số lượng và giá bán của đơn được khóa."}
            </p>
          </Panel>

          <Panel title="Thanh toán" bodyClassName="space-y-3">
            {order.outstanding > 0 ? (
              <div className="flex flex-wrap items-end gap-2">
                <label className="w-40">
                  <span className="mb-1 block text-xs font-medium text-muted">Số tiền thu (₫)</span>
                  <Input
                    inputMode="numeric"
                    className="text-right font-mono"
                    value={payment.amount}
                    placeholder={formatNumber(order.outstanding)}
                    onChange={(event) => {
                      const parsed = parseAmount(event.target.value);
                      setPayment({
                        ...payment,
                        amount: parsed === null ? "" : formatNumber(parsed),
                      });
                    }}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-muted">Ngày thu</span>
                  <Input
                    type="date"
                    value={payment.paidOn}
                    onChange={(event) => setPayment({ ...payment, paidOn: event.target.value })}
                    className="w-44"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-muted">Hình thức</span>
                  <Select
                    value={payment.method}
                    onChange={(event) =>
                      setPayment({ ...payment, method: event.target.value as PaymentMethod })
                    }
                    className="w-40 text-sm"
                  >
                    {Object.entries(paymentMethods).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="min-w-40 flex-1">
                  <span className="mb-1 block text-xs font-medium text-muted">Số tham chiếu</span>
                  <Input
                    value={payment.reference}
                    onChange={(event) => setPayment({ ...payment, reference: event.target.value })}
                    maxLength={100}
                    placeholder="Mã giao dịch, số phiếu thu"
                  />
                </label>
                <Button
                  size="sm"
                  disabled={pending || dirty}
                  title={dirty ? "Lưu thay đổi dòng hàng trước" : undefined}
                  onClick={() =>
                    run(
                      () =>
                        recordPaymentAction(order.id, order.version, {
                          ...payment,
                          // An empty field means "the rest": the common case is one transfer for the whole order.
                          amount: parseAmount(payment.amount) ?? order.outstanding,
                        }),
                      () => setPayment({ ...payment, amount: "", reference: "" }),
                    )
                  }
                >
                  <Banknote className="size-4" strokeWidth={1.75} aria-hidden />
                  Ghi nhận thu tiền
                </Button>
              </div>
            ) : (
              <p className="text-sm font-medium text-success">Đơn hàng đã thu đủ tiền.</p>
            )}
            {order.payments.length > 0 && (
              <ul className="divide-y divide-line rounded-md border border-line text-sm">
                {order.payments.map((item, index) => (
                  <li
                    key={index}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                  >
                    <span>
                      <span className="font-mono text-ink">{formatDay(item.paidOn)}</span> ·{" "}
                      {paymentMethods[item.method]}
                      {item.reference ? ` · ${item.reference}` : ""}
                      <span className="block text-xs text-muted">
                        {item.recordedBy.name} ghi lúc {formatInstant(item.recordedAt)}
                      </span>
                    </span>
                    <span className="font-mono font-semibold text-ink">
                      {formatVnd(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}

      <div>
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg">Hàng hóa và giá bán thực tế</h2>
          {order.editable && (
            <p className="text-xs text-muted">
              Chép từ báo giá {order.quotationNumber}; sửa được số lượng và đơn giá cho đến khi giao
              xong.
            </p>
          )}
        </div>
        <fieldset disabled={pending}>
          <LineGrid
            lines={lines.length > 0 ? lines : [emptyLine()]}
            onChange={(next) => {
              setLines(next);
              setDirty(true);
            }}
            targetMarginPercent={settings.targetMarginPercent}
            priceRounding={settings.priceRounding}
            sellingCosts={sellingCosts}
            disabled={!order.editable}
            showLeadTime={false}
          />
        </fieldset>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <Panel title="Thông tin đơn hàng" bodyClassName="space-y-3">
          <div className="flex flex-wrap gap-3">
            <label>
              <span className="mb-1 block text-xs font-medium text-muted">Ngày đặt hàng</span>
              <Input
                type="date"
                value={orderDate}
                disabled={!order.editable || pending}
                onChange={(event) => {
                  setOrderDate(event.target.value);
                  setDirty(true);
                }}
                className="w-44"
              />
            </label>
            <label className="min-w-64 flex-1">
              <span className="mb-1 block text-xs font-medium text-muted">Ghi chú</span>
              <Input
                value={note}
                disabled={!order.editable || pending}
                maxLength={2000}
                onChange={(event) => {
                  setNote(event.target.value);
                  setDirty(true);
                }}
              />
            </label>
          </div>
          <p className="text-xs text-muted">
            Doanh thu của đơn được tính vào ngày đặt hàng. Lập bởi {order.createdBy.name} lúc{" "}
            {formatInstant(order.createdAt)}.
          </p>
          {order.editable && (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                disabled={pending || !dirty || commissionInvalid}
                onClick={() =>
                  run(
                    () =>
                      reviseOrderAction(order.id, order.version, {
                        lines: lines.filter((line) => !isBlank(line)).map(toLineInput),
                        orderDate,
                        note,
                        commissionPercent: basisPointsToPercent(sellingCosts.commissionBasisPoints),
                        shippingCost: sellingCosts.shippingCost,
                      }),
                    () => setDirty(false),
                  )
                }
              >
                <Save className="size-4" strokeWidth={1.75} aria-hidden />
                {pending ? "Đang lưu…" : "Lưu thay đổi đơn hàng"}
              </Button>
              {dirty && <span className="text-sm text-muted">Có thay đổi chưa lưu</span>}
            </div>
          )}
          {canCancel && !cancelling && (
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => setCancelling(true)}
            >
              <Ban className="size-4" strokeWidth={1.75} aria-hidden />
              Hủy đơn hàng
            </Button>
          )}
          {cancelling && (
            <div className="flex flex-wrap items-end gap-2 rounded-md border border-danger/20 bg-danger-soft p-3">
              <label className="min-w-64 flex-1">
                <span className="mb-1 block text-xs font-medium text-danger">
                  Lý do hủy (không bắt buộc). Báo giá gốc sẽ quay về &ldquo;Đang thương
                  lượng&rdquo;.
                </span>
                <Input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={500}
                  autoFocus
                />
              </label>
              <Button
                size="sm"
                variant="danger"
                disabled={pending}
                onClick={() =>
                  run(
                    () => cancelOrderAction(order.id, order.version, reason),
                    () => setCancelling(false),
                  )
                }
              >
                Xác nhận hủy đơn
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => setCancelling(false)}
              >
                Thôi
              </Button>
            </div>
          )}
        </Panel>

        <Panel title="Tổng cộng" bodyClassName="space-y-3">
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-body">Doanh thu trước VAT</dt>
              <dd className="font-mono text-ink">{formatVnd(net)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-body">Thuế GTGT ({vatRates[order.vatRate].label})</dt>
              <dd className="font-mono text-ink">{percent === null ? "—" : formatVnd(vat)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
              <dt className="font-semibold text-ink">Doanh thu sau VAT</dt>
              <dd className="font-mono text-lg font-semibold text-ink">{formatVnd(net + vat)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-body">Đã thu</dt>
              <dd className="font-mono text-ink">{formatVnd(order.paid)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-body">Còn phải thu</dt>
              <dd className="font-mono font-semibold text-ink">
                {formatVnd(net + vat - order.paid)}
              </dd>
            </div>
          </dl>
          <InternalCostFields
            commissionPercent={costsForm.commissionPercent}
            shippingCost={costsForm.shippingCost}
            commissionInvalid={commissionInvalid}
            disabled={!order.editable || pending}
            onCommissionChange={(value) => {
              setCostsForm((current) => ({ ...current, commissionPercent: value }));
              setDirty(true);
            }}
            onShippingChange={(value) => {
              setCostsForm((current) => ({ ...current, shippingCost: value }));
              setDirty(true);
            }}
          />
          <dl className="space-y-1.5 rounded-md bg-brand-50 px-3 py-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-brand-800">Hoa hồng khách hàng</dt>
              <dd className="font-mono text-ink">{formatVnd(commission)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-brand-800">Chi phí vận chuyển</dt>
              <dd className="font-mono text-ink">{formatVnd(sellingCosts.shippingCost)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-brand-100 pt-1.5">
              <dt className="text-brand-800">Lợi nhuận gộp (nội bộ)</dt>
              <dd className="font-mono text-ink">{profit === null ? "—" : formatVnd(profit)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-brand-800">Biên lợi nhuận</dt>
              <dd className="font-mono text-ink">
                {margin === null ? "—" : formatPercent(margin)}
              </dd>
            </div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}
