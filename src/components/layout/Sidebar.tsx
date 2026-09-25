"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Boxes, 
  TrendingUp, 
  AlertTriangle,
  PanelLeftClose
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

const navigation = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Boxes },
  { name: "Analytics & DRR", href: "/analytics", icon: TrendingUp },
  { name: "Alerts & Reorder", href: "/alerts", icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    if (isCollapsed) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (isCollapsed) {
      setIsHovered(false);
    }
  };

  const isExpanded = !isCollapsed || isHovered;

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "bg-white text-slate-700 h-screen sticky top-0 flex flex-col border-r border-slate-200/90 shrink-0 select-none overflow-hidden transition-[width] duration-200 ease-in-out z-20",
        isExpanded ? "w-64" : "w-16"
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          "h-14 border-b border-slate-200/80 flex items-center shrink-0",
          !isExpanded ? "justify-center px-2" : "justify-between px-4"
        )}
      >
        {!isExpanded ? (
          <button
            onClick={toggleSidebar}
            title="Expand sidebar ([)"
            className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Boxes className="w-5 h-5 text-white" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm shrink-0">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <div className="overflow-hidden">
                <h1 className="font-bold text-sm tracking-tight text-slate-900 leading-none truncate">Warehouse</h1>
                <p className="text-xs text-slate-500 font-medium mt-1 truncate">Inventory & Sourcing</p>
              </div>
            </div>

            <button
              onClick={toggleSidebar}
              title="Collapse sidebar ([)"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {isExpanded && (
          <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspaces
          </div>
        )}
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={!isExpanded ? item.name : undefined}
              onClick={() => {
                if (isCollapsed) {
                  setIsHovered(false);
                }
              }}
              className={cn(
                "group flex items-center rounded-lg text-sm font-medium transition-colors duration-100",
                !isExpanded
                  ? "justify-center p-3 relative"
                  : "justify-between px-3 py-2.5",
                isActive
                  ? "bg-indigo-50/90 text-indigo-700 font-semibold border border-indigo-200/80 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                {isExpanded && <span className="truncate">{item.name}</span>}
              </div>
              {isActive && (
                !isExpanded ? (
                  <div className="absolute right-1 w-1.5 h-4 rounded-full bg-indigo-600" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                )
              )}
            </Link>
          );
        })}
      </nav>

      {/* Operational Source Footer (Minimal & clean, no explanatory text) */}
      <div
        className={cn(
          "shrink-0 transition-all duration-150",
          !isExpanded
            ? "p-3 flex justify-center border-t border-slate-200/80"
            : "p-3 m-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between"
        )}
      >
        {!isExpanded ? (
          <div title="Live Mirror Active" className="flex items-center justify-center p-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-700">Live Mirror</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">15m cron</span>
          </>
        )}
      </div>
    </aside>
  );
}
