"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Boxes, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  Database,
  ArrowDownLeft,
  ArrowUpRight
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
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col border-r border-slate-800 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
          <Boxes className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-wide text-white">LogisticsHub</h1>
          <p className="text-xs text-slate-400 font-medium">Warehouse Inventory</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Data Source Badge */}
      <div className="p-4 m-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-medium text-slate-200">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Architecture Status</span>
        </div>
        <div className="text-[11px] text-slate-400 leading-relaxed">
          Google Sheets ➔ Supabase Mirror ➔ Next.js Fast UI
        </div>
        <div className="pt-1 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Mode:</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Read-Only Fast
          </span>
        </div>
      </div>
    </aside>
  );
}
