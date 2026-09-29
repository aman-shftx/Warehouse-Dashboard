import Link from "next/link";
import { Boxes, PackageCheck, AlertOctagon, AlertTriangle, Layers, Clock, ArrowRight } from "lucide-react";
import { formatNumber, formatDate, cn } from "@/lib/utils";

interface StatsProps {
  totalSKUs: number;
  totalStock: number;
  outOfStock: number;
  lowStock: number;
  categoriesCount: number;
  lastSyncedAt: string | null;
}

export function StatsCards({
  totalSKUs,
  totalStock,
  outOfStock,
  lowStock,
  categoriesCount,
  lastSyncedAt,
}: StatsProps) {
  const cards = [
    {
      title: "Active Catalog",
      value: formatNumber(totalSKUs),
      subtext: "Unique SKUs tracked",
      icon: Boxes,
      iconColor: "text-slate-600",
      iconBg: "bg-slate-100/80",
    },
    {
      title: "Warehouse Inventory",
      value: formatNumber(totalStock),
      subtext: "Total units in stock",
      icon: PackageCheck,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50",
    },
    {
      title: "Out of Stock",
      value: formatNumber(outOfStock),
      subtext: "Items with zero units",
      icon: AlertOctagon,
      iconColor: outOfStock > 0 ? "text-rose-600" : "text-slate-400",
      iconBg: outOfStock > 0 ? "bg-rose-50" : "bg-slate-50",
      highlight: outOfStock > 0 ? "text-rose-700" : "",
      href: "/alerts?filter=out_of_stock&from=/inventory",
      hoverBorder: "hover:border-rose-300 hover:ring-2 hover:ring-rose-500/10 hover:bg-rose-50/20",
    },
    {
      title: "Reorder Required",
      value: formatNumber(lowStock),
      subtext: "Below target threshold",
      icon: AlertTriangle,
      iconColor: lowStock > 0 ? "text-amber-600" : "text-slate-400",
      iconBg: lowStock > 0 ? "bg-amber-50" : "bg-slate-50",
      highlight: lowStock > 0 ? "text-amber-700" : "",
      href: "/alerts?filter=reorder&from=/inventory",
      hoverBorder: "hover:border-amber-300 hover:ring-2 hover:ring-amber-500/10 hover:bg-amber-50/20",
    },
    {
      title: "Categories",
      value: formatNumber(categoriesCount),
      subtext: "Product families",
      icon: Layers,
      iconColor: "text-slate-600",
      iconBg: "bg-slate-100/80",
    },
    {
      title: "Last Sync",
      value: lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Pending",
      subtext: lastSyncedAt ? formatDate(lastSyncedAt) : "15m background sync",
      icon: Clock,
      iconColor: "text-slate-500",
      iconBg: "bg-slate-100/80",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const cardContent = (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-md ${card.iconBg}`}>
                <Icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
              </div>
            </div>
            <div>
              <div className={`text-xl font-bold tracking-tight tabular-nums text-slate-900 ${card.highlight || ""}`}>
                {card.value}
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[11px] text-slate-400">{card.subtext}</p>
                {card.href && (
                  <span className="text-[10px] font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-0.5">
                    View <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
              </div>
            </div>
          </>
        );

        if (card.href) {
          return (
            <Link
              key={card.title}
              href={card.href}
              prefetch={true}
              className={cn(
                "p-3.5 rounded-lg bg-white border border-slate-200/80 transition-all duration-100 flex flex-col justify-between group cursor-pointer shadow-2xs hover:shadow-xs",
                card.hoverBorder
              )}
              title={`View ${card.title} in Alerts & Reorders`}
            >
              {cardContent}
            </Link>
          );
        }

        return (
          <div
            key={card.title}
            className="p-3.5 rounded-lg bg-white border border-slate-200/80 hover:border-slate-300 transition-colors duration-100 flex flex-col justify-between shadow-2xs"
          >
            {cardContent}
          </div>
        );
      })}
    </div>
  );
}
