import type { Metadata } from "next";
import { PageHeader, Panel } from "@/components/internal/PageHeader";
import { getMe } from "@/lib/internal/api";

export const metadata: Metadata = { title: "Tổng quan" };

/**
 * Internal pages read the session and private data, so a navigation waits for the server (behind the area's
 * `loading.tsx`); they are deliberately not validated as "instant".
 */
export const instant = false;

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
