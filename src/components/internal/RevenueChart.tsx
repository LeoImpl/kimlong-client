"use client";

import { useState } from "react";
import { formatCompactVnd, formatNumber, formatVnd, periodLabel } from "@/lib/internal/format";
import type { RevenuePoint } from "@/lib/internal/types";

const WIDTH = 960;
const HEIGHT = 300;
const MARGIN = { top: 28, right: 12, bottom: 34, left: 64 };

/** A "nice" axis maximum: 1, 2, 2.5 or 5 times a power of ten, at or above the largest value. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((factor) => factor * magnitude >= value) ?? 10;
  return step * magnitude;
}

/**
 * Revenue per period as bars: one measure, one axis, one colour ramp (deep blue rising into sky, the staff area's
 * gradient; the bar under the pointer lights up warm). The number of orders is not a second axis — it is
 * in the tooltip and in the table under the chart, which also is the chart's accessible form.
 */
export function RevenueChart({
  points,
  measure,
  title,
}: {
  points: RevenuePoint[];
  measure: "revenueNet" | "revenueGross";
  title: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const values = points.map((point) => point[measure]);
  const max = niceMax(Math.max(...values, 0));
  const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const band = plotWidth / Math.max(points.length, 1);
  // Thin bars with air between them; never wider than 56px however few periods there are.
  const barWidth = Math.min(56, band * 0.62);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((share) => share * max);
  const y = (value: number) => MARGIN.top + plotHeight - (value / max) * plotHeight;
  const highest = values.indexOf(Math.max(...values));
  const empty = values.every((value) => value === 0);
  const shown = active !== null ? points[active] : null;

  return (
    <figure className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${title}. Số liệu chi tiết ở bảng bên dưới.`}
        className="h-auto w-full"
        onMouseLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id="revenue-bar" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id="revenue-bar-active" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={y(tick)}
              y2={y(tick)}
              className={tick === 0 ? "stroke-line-strong" : "stroke-line"}
              strokeWidth={1}
            />
            <text
              x={MARGIN.left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              className="fill-muted text-[11px]"
            >
              {formatCompactVnd(tick)}
            </text>
          </g>
        ))}
        {points.map((point, index) => {
          const value = point[measure];
          const x = MARGIN.left + band * index + (band - barWidth) / 2;
          const top = y(value);
          const height = MARGIN.top + plotHeight - top;
          const radius = Math.min(6, height);
          return (
            <g key={point.period}>
              {value > 0 && (
                // Rounded at the data end only; the bar stands square on the baseline.
                <path
                  d={`M${x},${top + height} V${top + radius} Q${x},${top} ${x + radius},${top} H${x + barWidth - radius} Q${x + barWidth},${top} ${x + barWidth},${top + radius} V${top + height} Z`}
                  fill={active === index ? "url(#revenue-bar-active)" : "url(#revenue-bar)"}
                  className="transition-[fill] duration-150"
                />
              )}
              {/* The peak is labelled directly; every other value is one hover away. */}
              {value > 0 && index === highest && active === null && (
                <text
                  x={x + barWidth / 2}
                  y={top - 8}
                  textAnchor="middle"
                  className="fill-ink text-[11px] font-semibold"
                >
                  {formatCompactVnd(value)}
                </text>
              )}
              <text
                x={MARGIN.left + band * index + band / 2}
                y={HEIGHT - 12}
                textAnchor="middle"
                className={
                  active === index ? "fill-ink text-[12px] font-semibold" : "fill-muted text-[12px]"
                }
              >
                {periodLabel(point)}
              </text>
              {/* The whole column is the hover target, not just the bar. */}
              <rect
                x={MARGIN.left + band * index}
                y={MARGIN.top}
                width={band}
                height={plotHeight + MARGIN.bottom}
                fill="transparent"
                tabIndex={0}
                aria-label={`${periodLabel(point)}: ${formatVnd(value)}, ${point.orders} đơn`}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                className="outline-none"
              />
            </g>
          );
        })}
        {empty && (
          <text x={WIDTH / 2} y={HEIGHT / 2} textAnchor="middle" className="fill-muted text-[14px]">
            Chưa có doanh thu trong giai đoạn này
          </text>
        )}
      </svg>
      {shown && active !== null && (
        <div
          role="status"
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-action-200 bg-page/95 px-3 py-2 text-xs shadow-[0_12px_28px_-12px_rgb(37_99_235/0.5)] backdrop-blur-sm"
          style={{
            left: `${Math.min(88, Math.max(12, ((MARGIN.left + band * active + band / 2) / WIDTH) * 100))}%`,
          }}
        >
          <p className="font-semibold text-ink">
            {periodLabel(shown)}
            {shown.index !== null ? ` / ${shown.year}` : ""}
          </p>
          <p className="mt-1 text-body">
            Trước VAT <span className="font-mono text-ink">{formatVnd(shown.revenueNet)}</span>
          </p>
          <p className="text-body">
            Sau VAT <span className="font-mono text-ink">{formatVnd(shown.revenueGross)}</span>
          </p>
          <p className="text-body">
            Số đơn <span className="font-mono text-ink">{formatNumber(shown.orders)}</span>
          </p>
        </div>
      )}
    </figure>
  );
}
