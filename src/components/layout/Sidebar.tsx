"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Boxes, 
  TrendingUp, 
  AlertTriangle, 
  Database,
  ArrowUpRight,
  Sheet
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Boxes },
  { name: "Analytics & DRR", href: "/analytics", icon: TrendingUp },
  { name: "Alerts & Reorder", href: "/alerts", icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-[#090d16] text-slate-300 min-h-screen flex flex-col border-r border-slate-800/80 shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm">
            <Boxes className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-xs tracking-tight text-white leading-none">Warehouse</h1>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Inventory & Sourcing</p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Workspaces
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-100",
                isActive
                  ? "bg-slate-800/90 text-white font-semibold border border-slate-700/60 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                <span>{item.name}</span>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Operational Source Footer */}
      <div className="p-3 m-3 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-400 space-y-2">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-slate-200 font-semibold">Live Mirror</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">15m cron</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-tight">
          Operational truth: Google Sheets. Queries served from Supabase mirror.
        </p>
      </div>
    </aside>
  );
}
