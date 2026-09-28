"use client";

import { useId } from "react";
import { formatNumber } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  type: "outward" | "inward";
  days?: number;
  width?: number;
  height?: number;
}

export function MovementSparkline({
  data,
  type,
  days = 14,
  width = 68,
  height = 22,
}: SparklineProps) {
  const gradientId = useId();
  const isOutward = type === "outward";

  const strokeColor = isOutward ? "#e11d48" : "#059669"; // rose-600 vs emerald-600
  const fillColor = isOutward ? "#f43f5e" : "#10b981";

  if (!data || data.length === 0) {
    return (
      <div className="w-[68px] h-[22px] flex items-center justify-center text-slate-300 text-[10px]">
        —
      </div>
    );
  }

  // If only 1 data point or all points identical
  const min = Math.min(...data);
  const max = Math.max(...data);
  const diff = max - min;

  const paddingX = 4;
  const paddingY = 3;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  let points: [number, number][] = [];

  if (diff === 0) {
    const y = height / 2;
    points = [
      [paddingX, y],
      [width - paddingX, y],
    ];
  } else {
    points = data.map((val, i) => {
      const x = paddingX + (i / (data.length - 1)) * usableWidth;
      const y = height - paddingY - ((val - min) / diff) * usableHeight;
      return [x, y];
    });
  }

  const polylinePoints = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  // Create closed polygon for area fill
  const firstX = points[0][0];
  const lastX = points[points.length - 1][0];
  const polygonPoints = `${polylinePoints} ${lastX.toFixed(1)},${height} ${firstX.toFixed(1)},${height}`;

  const lastPoint = points[points.length - 1];
  const startVal = data[0];
  const endVal = data[data.length - 1];
  const netDelta = endVal - startVal;

  return (
    <div
      className="inline-flex items-center justify-end group/spark relative cursor-default"
      title={`${days}D Trend: ${formatNumber(startVal)} → ${formatNumber(endVal)} (${netDelta > 0 ? "+" : ""}${formatNumber(netDelta)})`}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gradient Area Fill */}
        <polygon points={polygonPoints} fill={`url(#${gradientId})`} />

        {/* Trend Polyline */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current Endpoint Indicator */}
        <circle
          cx={lastPoint[0]}
          cy={lastPoint[1]}
          r="2"
          fill={strokeColor}
        />
      </svg>
    </div>
  );
}
