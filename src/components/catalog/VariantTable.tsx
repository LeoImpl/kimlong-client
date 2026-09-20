import { PartNumber } from "@/components/ui/PartNumber";
import { Price } from "@/components/ui/Price";
import { Table, TableWrap, Td, Th } from "@/components/ui/Table";
import type { Variant } from "@/lib/api/types";

/**
 * The part-number table — the reason most visitors are on the page. Columns that no variant fills are left out
 * entirely, because a table of empty cells reads as missing data rather than as "not applicable here".
 */
export function VariantTable({ variants }: { variants: Variant[] }) {
  if (variants.length === 0) return null;

  const specNames = [...new Set(variants.flatMap((v) => v.specifications.map((s) => s.name)))];
  const showLabel = variants.some((v) => v.label);
  const showOrderCode = variants.some((v) => v.orderCode);
  const showPrice = variants.some((v) => v.price);

  return (
    <TableWrap>
      <Table>
        <caption className="sr-only">Danh sách mã sản phẩm</caption>
        <thead>
          <tr>
            <Th scope="col">Mã sản phẩm</Th>
            {showLabel && <Th scope="col">Mô tả</Th>}
            {showOrderCode && <Th scope="col">Mã đặt hàng</Th>}
            {specNames.map((name) => (
              <Th key={name} scope="col">
                {name}
              </Th>
            ))}
            {showPrice && <Th scope="col">Giá</Th>}
          </tr>
        </thead>
        <tbody>
          {variants.map((variant) => (
            <tr key={variant.partNumber} className="hover:bg-surface">
              <Td>
                <PartNumber value={variant.partNumber} />
              </Td>
              {showLabel && <Td>{variant.label ?? "—"}</Td>}
              {showOrderCode && <Td className="font-mono text-xs">{variant.orderCode ?? "—"}</Td>}
              {specNames.map((name) => (
                <Td key={name}>
                  {variant.specifications.find((s) => s.name === name)?.value ?? "—"}
                </Td>
              ))}
              {showPrice && (
                <Td>
                  <Price price={variant.price} className="text-sm" />
                </Td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </TableWrap>
  );
}
