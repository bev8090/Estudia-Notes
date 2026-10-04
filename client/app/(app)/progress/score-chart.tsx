"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { DIFFICULTY_LABEL, percent, shortDate } from "@/lib/format";
import type { ProgressStats } from "@/lib/types";

type Point = ProgressStats["history"][number];

// Chart tokens (validated: the series blue passes contrast and band checks on white).
const SERIES = "#2a78d6";
const GRID = "#e4e4e7"; // hairline gridlines
const MUTED = "#71717a"; // axis text
const INK = "#18181b"; // value labels
const SURFACE = "#ffffff";

const HEIGHT = 220;
const M = { top: 16, right: 44, bottom: 28, left: 40 };
const Y_TICKS = [0, 0.25, 0.5, 0.75, 1];

// One series (score per attempt, oldest to newest), so no legend: the heading names it.
// Points are spaced by attempt, not by date, so bursts of practice stay readable.
export function ScoreChart({ points }: { points: Point[] }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  // Render at the container's real pixel width so text never gets stretched.
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const plotW = Math.max(width - M.left - M.right, 0);
  const plotH = HEIGHT - M.top - M.bottom;
  const x = (i: number) => M.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (score: number) => M.top + (1 - score) * plotH;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.score)}`).join(" ");
  const area = points.length > 1 ? `${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z` : "";
  const last = points.length - 1;

  // The crosshair finds the nearest attempt; the reader never has to hit the 2px line.
  function onPointerMove(e: PointerEvent<SVGRectElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = points.length === 1 ? 0 : Math.round((px / rect.width) * (points.length - 1));
    setActive(Math.min(Math.max(i, 0), last));
  }

  function onKeyDown(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const step = e.key === "ArrowRight" ? 1 : -1;
      setActive((cur) => Math.min(Math.max((cur ?? last) + step, 0), last));
    }
  }

  const activePoint = active != null ? points[active] : null;
  // Keep the tooltip inside the chart: flip it to the left of the crosshair near the right edge.
  const tooltipLeft = active != null ? x(active) : 0;
  const flip = active != null && tooltipLeft > width - 180;

  return (
    <div>
      <div ref={wrapper} className="relative">
        {width > 0 && (
          <svg
            width={width}
            height={HEIGHT}
            role="img"
            aria-label={`Exam scores over your last ${points.length} attempts, latest ${percent(points[last].score)}. Use the left and right arrow keys to read each attempt.`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onFocus={() => setActive((cur) => cur ?? last)}
            onBlur={() => setActive(null)}
            className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            {Y_TICKS.map((t) => (
              <g key={t}>
                <line x1={M.left} x2={M.left + plotW} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
                <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={MUTED} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {percent(t)}
                </text>
              </g>
            ))}

            <text x={x(0)} y={HEIGHT - 8} textAnchor={points.length === 1 ? "middle" : "start"} fontSize={11} fill={MUTED}>
              {shortDate(points[0].submittedAt)}
            </text>
            {points.length > 1 && (
              <text x={x(last)} y={HEIGHT - 8} textAnchor="end" fontSize={11} fill={MUTED}>
                {shortDate(points[last].submittedAt)}
              </text>
            )}

            {area && <path d={area} fill={SERIES} fillOpacity={0.1} />}
            {points.length > 1 && (
              <path d={line} fill="none" stroke={SERIES} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            )}

            {active != null && (
              <line x1={x(active)} x2={x(active)} y1={M.top} y2={M.top + plotH} stroke={MUTED} strokeWidth={1} />
            )}

            {points.map((p, i) => (
              <circle
                key={p.attemptId}
                cx={x(i)}
                cy={y(p.score)}
                r={i === active ? 5.5 : 4}
                fill={SERIES}
                stroke={SURFACE}
                strokeWidth={2}
              />
            ))}

            {/* Direct label on the latest point only; the axis and tooltip carry the rest. */}
            <text x={x(last) + 9} y={y(points[last].score)} dy="0.32em" fontSize={12} fontWeight={600} fill={INK}>
              {percent(points[last].score)}
            </text>

            {/* Transparent hit area over the whole plot. */}
            <rect
              x={M.left}
              y={M.top}
              width={plotW}
              height={plotH}
              fill="transparent"
              onPointerMove={onPointerMove}
              onPointerLeave={() => setActive(null)}
            />
          </svg>
        )}

        {activePoint && active != null && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 w-44 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-md"
            style={{
              top: Math.max(y(activePoint.score) - 70, 0),
              left: flip ? tooltipLeft - 12 : tooltipLeft + 12,
              transform: flip ? "translateX(-100%)" : undefined,
            }}
          >
            <p className="text-base font-semibold text-zinc-900">{percent(activePoint.score)}</p>
            <p className="mt-0.5 text-zinc-600">
              {DIFFICULTY_LABEL[activePoint.difficulty]} · {activePoint.questionCount} questions
            </p>
            <p className="truncate text-zinc-500">{activePoint.noteTitle}</p>
            <p className="text-zinc-400">{shortDate(activePoint.submittedAt)}</p>
          </div>
        )}
      </div>

      {/* Every value is also reachable without hovering. */}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-zinc-500 hover:text-zinc-800">View as table</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-zinc-500">
              <tr>
                <th className="py-1.5 pr-4 font-medium">Date</th>
                <th className="py-1.5 pr-4 font-medium">Notes</th>
                <th className="py-1.5 pr-4 font-medium">Exam</th>
                <th className="py-1.5 text-right font-medium">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100" style={{ fontVariantNumeric: "tabular-nums" }}>
              {[...points].reverse().map((p) => (
                <tr key={p.attemptId}>
                  <td className="py-1.5 pr-4 text-zinc-600">{shortDate(p.submittedAt)}</td>
                  <td className="py-1.5 pr-4 text-zinc-800">{p.noteTitle}</td>
                  <td className="py-1.5 pr-4 text-zinc-600">
                    {DIFFICULTY_LABEL[p.difficulty]} · {p.questionCount}
                  </td>
                  <td className="py-1.5 text-right font-medium text-zinc-900">{percent(p.score)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
