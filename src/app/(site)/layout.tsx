import { SiteChrome } from "@/components/layout/SiteChrome";

/** The public storefront. The staff area (`(internal)/noi-bo`) has its own frame and shares none of this. */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <SiteChrome>{children}</SiteChrome>;
}
