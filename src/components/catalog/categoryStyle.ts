import {
  ArrowRightLeft,
  Boxes,
  Cable,
  CircuitBoard,
  Cpu,
  Cylinder,
  Droplet,
  Factory,
  Funnel,
  Gauge,
  Radar,
  Wind,
  type LucideIcon,
} from "lucide-react";

/**
 * An icon per top-level family and per product type, so the families and the types inside them differ by shape,
 * not only by name. Deliberately no colour per family: the palette is graphite and brass, and a category is not
 * a meaning that deserves its own hue.
 */
const familyIcons: Record<string, LucideIcon> = {
  "phu-tung-may-nen-khi": Wind,
  "thiet-bi-tu-dong-hoa": Cpu,
  "vat-tu-cong-nghiep-khac": Factory,
};

const typeIcons: Record<string, LucideIcon> = {
  "loc-dau": Droplet,
  "loc-gio": Wind,
  "loc-tach-dau": Funnel,
  "xy-lanh-khi-nen": Cylinder,
  "cam-bien": Radar,
  "van-dien-tu": ArrowRightLeft,
  "cap-ket-noi": Cable,
  "plc-va-module": CircuitBoard,
  "bien-tan": Gauge,
};

/** The icon for a category: its own if it is a known type, else its family's, else a neutral box. */
export function categoryIcon(slug: string, familySlug?: string): LucideIcon {
  return typeIcons[slug] ?? familyIcons[slug] ?? (familySlug && familyIcons[familySlug]) ?? Boxes;
}
