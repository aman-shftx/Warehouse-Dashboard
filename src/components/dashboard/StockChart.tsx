"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatNumber } from "@/lib/utils";

interface DataPoint {
  date: string;
  quantity: number;
}

interface Props {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
}

export function StockChart({ 
  data, 
  title = "Historical Inventory Trend",
  subtitle = "Recorded daily stock volume" 
}: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs bg-white rounded-lg border border-dashed border-slate-200">
        <span>No historical trend data available.</span>
      </div>
    );
  }

  const latestVal = data[data.length - 1]?.quantity || 0;
  const firstVal = data[0]?.quantity || 0;
  const diff = latestVal - firstVal;

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200/80">
      {/* Chart Header - Rule: Headline with the takeaway, not just the metric */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-xs font-semibold text-slate-900 tracking-tight">{title}</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-base font-bold tabular-nums text-slate-900">
            {formatNumber(latestVal)} <span className="text-[11px] font-normal text-slate-500">units</span>
          </div>
          <div className="text-[10px] text-slate-400 tabular-nums">
            {data.length} recorded dates (since {data[0]?.date})
          </div>
        </div>
      </div>

      {/* Chart Area - Rule: High Data-Ink ratio, zero-baseline, clean 45-degree slope */}
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickFormatter={(v) => {
                const parts = v.split("-");
                return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : v;
              }}
            />
            {/* Rule: Start y-axis at zero on bar and area charts */}
            <YAxis
              domain={[0, 'auto']}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#090d16] text-white text-xs px-2.5 py-1.5 rounded-md border border-slate-800 shadow-md">
                      <div className="text-slate-400 text-[10px] font-mono">{label}</div>
                      <div className="font-semibold text-indigo-400 tabular-nums text-xs">
                        {formatNumber(payload[0].value as number)} units
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="quantity"
              stroke="#4f46e5"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#chartGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
