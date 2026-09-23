import {
  ArrowRightLeft,
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

export interface CategoryStyle {
  icon: LucideIcon;
  /** Icon tile: tinted background and icon colour. */
  tile: string;
  /** Gradient for the card's top accent bar. */
  bar: string;
  /** Hover tint for child chips. */
  chip: string;
}

/**
 * A colour and an icon per top-level category, so the three families read apart at a glance: air (indigo),
 * automation (cyan), general industrial supplies (amber). Unknown categories get the neutral indigo.
 */
const styles: Record<string, CategoryStyle> = {
  "phu-tung-may-nen-khi": {
    icon: Wind,
    tile: "bg-brand-50 text-brand-700 ring-brand-100",
    bar: "from-brand-600 to-brand-400",
    chip: "hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800",
  },
  "thiet-bi-tu-dong-hoa": {
    icon: Cpu,
    tile: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    bar: "from-cyan-600 to-sky-400",
    chip: "hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800",
  },
  "vat-tu-cong-nghiep-khac": {
    icon: Factory,
    tile: "bg-amber-50 text-amber-700 ring-amber-100",
    bar: "from-amber-500 to-orange-400",
    chip: "hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800",
  },
};

/** Icons for individual product types, so the types of a family also differ by shape, not only by name. */
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

/** The icon for a type inside a family, falling back to the family's own. */
export function typeIcon(slug: string, family: CategoryStyle): LucideIcon {
  return typeIcons[slug] ?? family.icon;
}

export function categoryStyle(slug: string): CategoryStyle {
  return styles[slug] ?? styles["phu-tung-may-nen-khi"];
}
