import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Container, SectionHeading } from "@/components/ui/Container";
import { Alert, EmptyState, Skeleton } from "@/components/ui/Feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { PartNumber } from "@/components/ui/PartNumber";
import { Price } from "@/components/ui/Price";
import { SpecList, Table, TableWrap, Td, Th } from "@/components/ui/Table";
import { routes } from "@/lib/routes";

/**
 * Component gallery. Not part of the site: it exists so the design system can be reviewed on one screen and so a
 * change to a primitive is visible everywhere at once. Kept out of search engines and out of the sitemap.
 */
export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

export default function ComponentGallery() {
  return (
    <Container className="space-y-12 py-10">
      <div>
        <Badge tone="warning">Nội bộ</Badge>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Design system</h1>
        <p className="mt-2 max-w-2xl text-body">
          Mọi thành phần giao diện dùng chung. Trang này không được lập chỉ mục và không nằm trong
          sitemap.
        </p>
      </div>

      <Section title="Màu sắc" description="Một màu nhấn duy nhất trên nền trung tính.">
        {/* Written out rather than generated: Tailwind scans the source text, so `bg-brand-${step}` produces
            nothing at all. */}
        <div className="flex flex-wrap gap-3">
          <Swatch label="brand-50" className="bg-brand-50" />
          <Swatch label="brand-100" className="bg-brand-100" />
          <Swatch label="brand-200" className="bg-brand-200" />
          <Swatch label="brand-300" className="bg-brand-300" />
          <Swatch label="brand-400" className="bg-brand-400" />
          <Swatch label="brand-500" className="bg-brand-500" />
          <Swatch label="brand-600" className="bg-brand-600" />
          <Swatch label="brand-700" className="bg-brand-700" />
          <Swatch label="brand-800" className="bg-brand-800" />
          <Swatch label="brand-900" className="bg-brand-900" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Swatch label="page" className="bg-page border border-line" />
          <Swatch label="surface" className="bg-surface" />
          <Swatch label="line" className="bg-line" />
          <Swatch label="ink" className="bg-ink" />
          <Swatch label="body" className="bg-body" />
          <Swatch label="success" className="bg-success" />
          <Swatch label="warning" className="bg-warning" />
          <Swatch label="danger" className="bg-danger" />
        </div>
      </Section>

      <Section
        title="Chữ"
        description="Be Vietnam Pro cho giao diện, JetBrains Mono cho mã sản phẩm."
      >
        <p className="text-3xl font-bold text-ink">Phụ tùng máy nén khí chính hãng</p>
        <p className="mt-1 text-body">Lọc dầu, lọc gió, lọc tách dầu — giao hàng toàn quốc.</p>
        <p className="mt-3 font-mono text-ink">DSBC-32-50-PPVA-N3 · 1613900100 · 0981577876</p>
      </Section>

      <Section title="Nút">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Yêu cầu báo giá</Button>
          <Button variant="secondary">Thêm vào giỏ</Button>
          <Button variant="ghost">Xem chi tiết</Button>
          <Button variant="danger">Xóa</Button>
          <Button disabled>Đang gửi…</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm">Nhỏ</Button>
          <Button size="md">Vừa</Button>
          <Button size="lg">Lớn</Button>
          <ButtonLink href={routes.products} variant="secondary">
            Liên kết dạng nút
          </ButtonLink>
        </div>
      </Section>

      <Section title="Nhãn và giá">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Còn hàng</Badge>
          <Badge tone="brand">Chính hãng</Badge>
          <Badge tone="success">Đã gửi</Badge>
          <Badge tone="warning">Đặt hàng</Badge>
          <Badge tone="danger">Ngừng kinh doanh</Badge>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          <Price price={{ type: "CONTACT_FOR_PRICE", amount: null, currency: null }} />
          <Price price={{ type: "FIXED", amount: 1250000, currency: "VND" }} />
          <PartNumber value="DSBC-32-50-PPVA-N3" />
          <PartNumber value="1613900100" />
        </div>
      </Section>

      <Section title="Biểu mẫu">
        <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
          <Field id="demo-name" label="Họ và tên" required>
            <Input id="demo-name" placeholder="Nguyễn Văn A" />
          </Field>
          <Field
            id="demo-phone"
            label="Số điện thoại"
            required
            error="Vui lòng nhập số điện thoại."
          >
            <Input id="demo-phone" invalid aria-describedby="demo-phone-error" />
          </Field>
          <Field id="demo-unit" label="Đơn vị" hint="Mặc định là cái.">
            <Select id="demo-unit" defaultValue="cai">
              <option value="cai">Cái</option>
              <option value="bo">Bộ</option>
              <option value="met">Mét</option>
            </Select>
          </Field>
          <Field id="demo-note" label="Ghi chú" className="sm:col-span-2">
            <Textarea id="demo-note" placeholder="Model máy, số lượng dự kiến…" />
          </Field>
        </div>
      </Section>

      <Section title="Thẻ, bảng và thông số">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Lọc dầu Atlas Copco</CardTitle>
            </CardHeader>
            <CardBody className="text-sm">
              <SpecList
                items={[
                  { name: "Xuất xứ", value: "Chính hãng Atlas Copco" },
                  { name: "Bảo hành", value: "12 tháng" },
                  { name: "Tình trạng", value: "Mới 100%" },
                ]}
              />
            </CardBody>
          </Card>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Mã sản phẩm</Th>
                  <Th>Mô tả</Th>
                  <Th>Giá</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <Td>
                    <PartNumber value="1030047700" />
                  </Td>
                  <Td>Lọc dầu GA 22</Td>
                  <Td>
                    <Price price={{ type: "CONTACT_FOR_PRICE", amount: null, currency: null }} />
                  </Td>
                </tr>
                <tr>
                  <Td>
                    <PartNumber value="1092100700" />
                  </Td>
                  <Td>Lọc dầu GA 37</Td>
                  <Td>
                    <Price price={{ type: "FIXED", amount: 890000, currency: "VND" }} />
                  </Td>
                </tr>
              </tbody>
            </Table>
          </TableWrap>
        </div>
      </Section>

      <Section title="Điều hướng">
        <Breadcrumb
          items={[
            { name: "Trang chủ", href: routes.home },
            { name: "Phụ tùng máy nén khí", href: routes.category("phu-tung-may-nen-khi") },
            { name: "Lọc dầu Atlas Copco" },
          ]}
        />
        <div className="mt-6">
          <Pagination page={3} totalPages={9} buildHref={(page) => `?page=${page}`} />
        </div>
      </Section>

      <Section title="Trạng thái">
        <div className="space-y-3">
          <Alert tone="info" title="Giá tham khảo">
            Hầu hết sản phẩm được báo giá theo yêu cầu.
          </Alert>
          <Alert tone="success" title="Đã gửi yêu cầu">
            Mã yêu cầu của bạn là RFQ-2026-000045.
          </Alert>
          <Alert tone="warning" title="Bạn đã gửi khá nhiều yêu cầu">
            Vui lòng thử lại sau 10 phút hoặc gọi 0981 577 876.
          </Alert>
          <Alert tone="danger" title="Không gửi được">
            Vui lòng kiểm tra lại thông tin liên hệ.
          </Alert>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <EmptyState
            title="Không tìm thấy sản phẩm nào"
            description="Thử tìm bằng mã sản phẩm, ví dụ 1613900100, hoặc gọi cho chúng tôi."
            action={<ButtonLink href={routes.contact}>Liên hệ</ButtonLink>}
          />
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </Section>
    </Container>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <SectionHeading title={title} description={description} className="mb-4" />
      {children}
    </section>
  );
}

function Swatch({ label, className }: { label: string; className: string }) {
  return (
    <div className="w-24">
      <div className={`h-12 rounded-md ${className}`} />
      <p className="mt-1 font-mono text-[11px] text-muted">{label}</p>
    </div>
  );
}
