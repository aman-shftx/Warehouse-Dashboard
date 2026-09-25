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
      title: "Total SKUs",
      value: formatNumber(totalSKUs),
      subtext: "Monitored inventory items",
      icon: Boxes,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
    {
      title: "Total Units in Stock",
      value: formatNumber(totalStock),
      subtext: "Current physical inventory",
      icon: PackageCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      title: "Out of Stock",
      value: formatNumber(outOfStock),
      subtext: "SKUs with 0 quantity",
      icon: AlertOctagon,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
    },
    {
      title: "Low Stock Alert",
      value: formatNumber(lowStock),
      subtext: "Stock below required target",
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      title: "Categories",
      value: formatNumber(categoriesCount),
      subtext: "Active product categories",
      icon: Layers,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      title: "Last Sync Time",
      value: lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Never",
      subtext: lastSyncedAt ? formatDate(lastSyncedAt) : "Click Sync Sheet Now",
      icon: Clock,
      color: "text-slate-600",
      bg: "bg-slate-100",
      border: "border-slate-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`p-5 rounded-xl bg-white border ${card.border} shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">{card.value}</div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
