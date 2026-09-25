"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Boxes, 
  TrendingUp, 
  AlertTriangle,
  PanelLeftClose,
  Pin
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
  const { isCollapsed, toggleSidebar, setIsCollapsed } = useSidebar();
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const handleMouseEnter = () => {
    if (!isCollapsed) return;
    clearTimers();
    setIsHoverExpanded(true);

    // Auto-collapse after 5 seconds if user doesn't manually pin or collapse
    timerRef.current = setTimeout(() => {
      setIsHoverExpanded(false);
    }, 5000);
  };

  const handleMouseLeave = () => {
    if (!isCollapsed || !isHoverExpanded) return;
    // When mouse exits the sidebar, gracefully collapse after a short grace period (800ms)
    leaveTimerRef.current = setTimeout(() => {
      setIsHoverExpanded(false);
      clearTimers();
    }, 800);
  };

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearTimers();
    setIsHoverExpanded(false);
    setIsCollapsed(false); // Permanently expanded
  };

  const isExpanded = !isCollapsed || isHoverExpanded;

  return (
    <div
      className={cn(
        "relative shrink-0 select-none transition-all duration-200 ease-out z-30",
        isCollapsed ? "w-16" : "w-60"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <aside
        className={cn(
          "bg-[#090d16] text-slate-300 h-screen flex flex-col border-r select-none transition-all duration-200 ease-out",
          isCollapsed
            ? isHoverExpanded
              ? "fixed top-0 left-0 w-60 z-50 shadow-2xl shadow-black/80 border-slate-700/80"
              : "w-16 border-slate-800/80 sticky top-0"
            : "w-60 border-slate-800/80 sticky top-0"
        )}
      >
        {/* 5-second countdown indicator bar when hover-expanded */}
        {isCollapsed && isHoverExpanded && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-slate-800 overflow-hidden z-50">
            <div className="h-full bg-indigo-500 animate-collapse-timer" />
          </div>
        )}

        {/* Brand Header */}
        <div
          className={cn(
            "h-14 border-b border-slate-800/80 flex items-center shrink-0",
            !isExpanded ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {!isExpanded ? (
            <button
              onClick={toggleSidebar}
              title="Expand sidebar ([) • Or hover to preview"
              className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <Boxes className="w-4 h-4 text-white" />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm shrink-0">
                  <Boxes className="w-4 h-4 text-white" />
                </div>
                <div className="overflow-hidden">
                  <h1 className="font-semibold text-xs tracking-tight text-white leading-none truncate">Warehouse</h1>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">Inventory & Sourcing</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isCollapsed && isHoverExpanded ? (
                  <button
                    onClick={handlePin}
                    title="Pin sidebar open permanently ([)"
                    className="flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-mono text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                  >
                    <Pin className="w-3 h-3 text-indigo-400" />
                    <span>Pin</span>
                  </button>
                ) : (
                  <button
                    onClick={toggleSidebar}
                    title="Collapse sidebar ([)"
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {isExpanded && (
            <div className="flex items-center justify-between px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Workspaces</span>
              {isCollapsed && isHoverExpanded && (
                <span className="text-[9px] text-indigo-400 font-normal lowercase">auto-closing in 5s</span>
              )}
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
                    clearTimers();
                    setIsHoverExpanded(false);
                  }
                }}
                className={cn(
                  "group flex items-center rounded-md text-[13px] font-medium transition-colors duration-100",
                  !isExpanded
                    ? "justify-center p-2.5 relative"
                    : "justify-between px-3 py-2",
                  isActive
                    ? "bg-slate-800/90 text-white font-semibold border border-slate-700/60 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                  {isExpanded && <span className="truncate">{item.name}</span>}
                </div>
                {isActive && (
                  !isExpanded ? (
                    <div className="absolute right-1 w-1 h-3 rounded-full bg-indigo-500" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  )
                )}
              </Link>
            );
          })}
        </nav>

        {/* Operational Source Footer */}
        <div
          className={cn(
            "shrink-0 transition-all duration-150",
            !isExpanded
              ? "p-3 flex justify-center border-t border-slate-800/80"
              : "p-3 m-3 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-400 space-y-2"
          )}
        >
          {!isExpanded ? (
            <div
              title="Live Mirror (15m cron) • Source: Google Sheets"
              className="flex items-center justify-center cursor-help p-1"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
