import type { Metadata } from "next";
import { PageHeader, Panel } from "@/components/internal/PageHeader";
import { getMe } from "@/lib/internal/api";

export const metadata: Metadata = { title: "Tổng quan" };

export default async function DashboardPage() {
  const me = await getMe();
  return (
    <>
      <PageHeader title="Tổng quan" description={`Xin chào, ${me.name}.`} />
      <Panel>
        <p className="text-sm text-body">Các chỉ số kinh doanh sẽ hiển thị ở đây.</p>
      </Panel>
    </>
  );
}
