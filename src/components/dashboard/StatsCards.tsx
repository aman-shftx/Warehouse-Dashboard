import { Boxes, PackageCheck, AlertOctagon, AlertTriangle, Layers, Clock } from "lucide-react";
import { formatNumber, formatDate } from "@/lib/utils";

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
    },
    {
      title: "Reorder Required",
      value: formatNumber(lowStock),
      subtext: "Below target threshold",
      icon: AlertTriangle,
      iconColor: lowStock > 0 ? "text-amber-600" : "text-slate-400",
      iconBg: lowStock > 0 ? "bg-amber-50" : "bg-slate-50",
      highlight: lowStock > 0 ? "text-amber-700" : "",
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
        return (
          <div
            key={card.title}
            className="p-3.5 rounded-lg bg-white border border-slate-200/80 hover:border-slate-300 transition-colors duration-100 flex flex-col justify-between"
          >
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
              <p className="text-[11px] text-slate-400 mt-0.5">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
