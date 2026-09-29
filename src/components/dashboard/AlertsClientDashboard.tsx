"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertOctagon,
  AlertTriangle,
  ShoppingCart,
  Download,
  Search,
  X,
  ArrowRight,
  Filter,
  Flame,
  CheckCircle2,
  Clock,
  Ban,
  FileText,
  RotateCcw,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  Building2,
  Check
} from "lucide-react";
import { formatNumber, formatDate, cn } from "@/lib/utils";
import { EnrichedSKUItem, POIssuedRecord, AlertsState } from "@/types";

interface Props {
  items: EnrichedSKUItem[];
}

export function AlertsClientDashboard({ items }: Props) {
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter"); // "out_of_stock" | "reorder" | "critical" | "ignored" | "po_issued" | null

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    "all" | "out_of_stock" | "critical" | "reorder" | "po_issued" | "ignored"
  >(
    urlFilter === "out_of_stock"
      ? "out_of_stock"
      : urlFilter === "critical"
      ? "critical"
      : urlFilter === "reorder"
      ? "reorder"
      : urlFilter === "po_issued"
      ? "po_issued"
      : urlFilter === "ignored"
      ? "ignored"
      : "out_of_stock"
  );

  // Sync state if URL search param changes
  useEffect(() => {
    if (urlFilter === "out_of_stock") setActiveTab("out_of_stock");
    else if (urlFilter === "critical") setActiveTab("critical");
    else if (urlFilter === "reorder") setActiveTab("reorder");
    else if (urlFilter === "po_issued") setActiveTab("po_issued");
    else if (urlFilter === "ignored") setActiveTab("ignored");
  }, [urlFilter]);

  // Search and Sourcing Channel filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSourcing, setSelectedSourcing] = useState<string>("ALL");

  // Persistent alerts state (Ignored SKUs and PO Issued records)
  const [ignoredSKUs, setIgnoredSKUs] = useState<Set<string>>(new Set());
  const [poIssuedRecords, setPoIssuedRecords] = useState<Record<string, POIssuedRecord>>({});
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modal state for issuing/editing a Purchase Order
  const [poModalItem, setPoModalItem] = useState<EnrichedSKUItem | null>(null);
  const [poForm, setPoForm] = useState<{
    po_no: string;
    po_date: string;
    qty_ordered: number;
    expected_inward: string;
    notes: string;
  }>({
    po_no: "",
    po_date: "",
    qty_ordered: 0,
    expected_inward: "",
    notes: ""
  });

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // 1. Initial Load of Alerts State (localStorage instant cache + Supabase backend)
  useEffect(() => {
    try {
      const cached = localStorage.getItem("warehouse_alerts_actions_v1");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.ignored)) setIgnoredSKUs(new Set(parsed.ignored));
        if (typeof parsed.poIssued === "object" && parsed.poIssued !== null) {
          setPoIssuedRecords(parsed.poIssued);
        }
      }
    } catch (e) {
      // ignore
    }

    fetch("/api/alerts-actions")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          if (Array.isArray(data.ignored)) setIgnoredSKUs(new Set(data.ignored));
          if (typeof data.poIssued === "object" && data.poIssued !== null) {
            setPoIssuedRecords(data.poIssued);
          }
          try {
            localStorage.setItem("warehouse_alerts_actions_v1", JSON.stringify(data));
          } catch (e) {}
        }
      })
      .catch((err) => console.error("Error loading alerts actions:", err));
  }, []);

  // Sync state changes to localStorage
  const updateLocalCache = (ignored: string[], poIssued: Record<string, POIssuedRecord>) => {
    try {
      localStorage.setItem("warehouse_alerts_actions_v1", JSON.stringify({ ignored, poIssued }));
    } catch (e) {}
  };

  // Calculations: 30-Day DRR, Target Qty ((30 DRR * 30) - In-Stock), and Cover Days
  const getTargetQty = (item: EnrichedSKUItem): number => {
    const required30D = Math.round((item.drr_30d || 0) * 30);
    return Math.max(0, required30D - (item.current_stock || 0));
  };

  const getCoverDays30D = (item: EnrichedSKUItem): number => {
    if (item.current_stock === 0) return 0;
    if (item.drr_30d > 0) {
      return parseFloat((item.current_stock / item.drr_30d).toFixed(1));
    }
    return 999;
  };

  // Distinct sourcing options
  const sourcingOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.sourcing) set.add(i.sourcing);
    });
    return Array.from(set).sort();
  }, [items]);

  // Alert Category Lists
  // 1. Out of stock (0 qty in inventory, not ignored, no active PO)
  const outOfStockList = useMemo(() => {
    return items.filter(
      (i) => i.current_stock === 0 && !ignoredSKUs.has(i.sku_code) && !poIssuedRecords[i.sku_code]
    );
  }, [items, ignoredSKUs, poIssuedRecords]);

  // 2. Critically Required (< 15 days cover, not ignored, no active PO)
  const criticallyRequiredList = useMemo(() => {
    return items.filter((i) => {
      if (ignoredSKUs.has(i.sku_code) || poIssuedRecords[i.sku_code]) return false;
      if (i.current_stock <= 0) return false;
      const cover = getCoverDays30D(i);
      return cover < 15;
    });
  }, [items, ignoredSKUs, poIssuedRecords]);

  // 3. Reorder Required (< 30 days cover, not ignored, no active PO)
  const reorderRequiredList = useMemo(() => {
    return items.filter((i) => {
      if (ignoredSKUs.has(i.sku_code) || poIssuedRecords[i.sku_code]) return false;
      if (i.current_stock <= 0) return false;
      const cover = getCoverDays30D(i);
      return cover < 30;
    });
  }, [items, ignoredSKUs, poIssuedRecords]);

  // 4. Ignored SKUs (marked as ignore)
  const ignoredList = useMemo(() => {
    return items.filter((i) => ignoredSKUs.has(i.sku_code));
  }, [items, ignoredSKUs]);

  // 5. PO Issued SKUs (PO given, marked by user)
  const poIssuedList = useMemo(() => {
    return items.filter((i) => !!poIssuedRecords[i.sku_code]);
  }, [items, poIssuedRecords]);

  // Action Handlers
  // 1. Ignore SKU: marks SKU as ignored and removes from all active alerts
  const handleIgnoreSKU = async (sku_code: string) => {
    setIsSyncing(true);
    const updatedIgnored = new Set(ignoredSKUs);
    updatedIgnored.add(sku_code);
    setIgnoredSKUs(updatedIgnored);

    const updatedPO = { ...poIssuedRecords };
    delete updatedPO[sku_code];
    setPoIssuedRecords(updatedPO);

    updateLocalCache(Array.from(updatedIgnored), updatedPO);
    showToast(`SKU ${sku_code} moved to Ignored SKUs.`);

    try {
      await fetch("/api/alerts-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ignore", sku_code })
      });
    } catch (err) {
      console.error("Failed to persist ignore action:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Unignore SKU: restores SKU back to active alerts
  const handleUnignoreSKU = async (sku_code: string) => {
    setIsSyncing(true);
    const updatedIgnored = new Set(ignoredSKUs);
    updatedIgnored.delete(sku_code);
    setIgnoredSKUs(updatedIgnored);

    updateLocalCache(Array.from(updatedIgnored), poIssuedRecords);
    showToast(`SKU ${sku_code} restored to active alerts.`);

    try {
      await fetch("/api/alerts-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unignore", sku_code })
      });
    } catch (err) {
      console.error("Failed to persist unignore action:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. Open PO Modal: prepares default values for PO form
  const handleOpenPOModal = (item: EnrichedSKUItem) => {
    const existing = poIssuedRecords[item.sku_code];
    const target = getTargetQty(item);
    const defaultQty = existing ? existing.qty_ordered : target > 0 ? target : Math.round((item.drr_30d || 0) * 30) || 1000;

    setPoModalItem(item);
    setPoForm({
      po_no: existing ? existing.po_no : "",
      po_date: existing ? existing.po_date : "",
      qty_ordered: defaultQty,
      expected_inward: existing ? existing.expected_inward : "",
      notes: existing ? existing.notes || "" : ""
    });
  };

  // 4. Submit PO Modal: saves PO record and moves SKU to PO Issued
  const handleSubmitPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poModalItem) return;

    if (!poForm.po_no.trim()) {
      alert("Please enter a valid Purchase Order number.");
      return;
    }
    if (!poForm.qty_ordered || poForm.qty_ordered <= 0) {
      alert("Please enter a quantity greater than zero.");
      return;
    }

    setIsSyncing(true);
    const newRecord: POIssuedRecord = {
      sku_code: poModalItem.sku_code,
      po_no: poForm.po_no.trim(),
      po_date: poForm.po_date || new Date().toISOString().substring(0, 10),
      qty_ordered: Number(poForm.qty_ordered),
      expected_inward: poForm.expected_inward,
      notes: poForm.notes,
      created_at: new Date().toISOString()
    };

    const updatedPO = { ...poIssuedRecords, [poModalItem.sku_code]: newRecord };
    setPoIssuedRecords(updatedPO);

    const updatedIgnored = new Set(ignoredSKUs);
    updatedIgnored.delete(poModalItem.sku_code);
    setIgnoredSKUs(updatedIgnored);

    updateLocalCache(Array.from(updatedIgnored), updatedPO);
    showToast(`PO ${newRecord.po_no} issued for ${poModalItem.sku_code}. Moved to PO Issued.`);
    setPoModalItem(null);

    try {
      await fetch("/api/alerts-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "issue_po", po: newRecord })
      });
    } catch (err) {
      console.error("Failed to persist PO issuance:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 5. Cancel / Delete PO: restores SKU back to active alerts
  const handleCancelPO = async (sku_code: string) => {
    if (!confirm(`Cancel Purchase Order for ${sku_code} and restore to active alerts?`)) {
      return;
    }

    setIsSyncing(true);
    const updatedPO = { ...poIssuedRecords };
    delete updatedPO[sku_code];
    setPoIssuedRecords(updatedPO);

    updateLocalCache(Array.from(ignoredSKUs), updatedPO);
    showToast(`PO cancelled for ${sku_code}. Restored to alerts.`);

    try {
      await fetch("/api/alerts-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel_po", sku_code })
      });
    } catch (err) {
      console.error("Failed to persist cancel PO:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered List based on tab, sourcing filter, and search
  const filteredList = useMemo(() => {
    let list: EnrichedSKUItem[] = [];
    if (activeTab === "out_of_stock") {
      list = outOfStockList;
    } else if (activeTab === "critical") {
      list = criticallyRequiredList;
    } else if (activeTab === "reorder") {
      list = reorderRequiredList;
    } else if (activeTab === "po_issued") {
      list = poIssuedList;
    } else if (activeTab === "ignored") {
      list = ignoredList;
    } else {
      // "all" active alerts
      const set = new Set<string>();
      list = [];
      [...outOfStockList, ...criticallyRequiredList, ...reorderRequiredList].forEach((i) => {
        if (!set.has(i.sku_code)) {
          set.add(i.sku_code);
          list.push(i);
        }
      });
    }

    if (selectedSourcing !== "ALL") {
      list = list.filter((i) => i.sourcing === selectedSourcing);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.sku_code.toLowerCase().includes(q) ||
          (i.name && i.name.toLowerCase().includes(q)) ||
          (i.category && i.category.toLowerCase().includes(q)) ||
          (i.brand && i.brand.toLowerCase().includes(q))
      );
    }

    // Sort order:
    // If PO Issued, sort by Expected Inward or Date
    if (activeTab === "po_issued") {
      return list.sort((a, b) => {
        const poA = poIssuedRecords[a.sku_code]?.po_date || "";
        const poB = poIssuedRecords[b.sku_code]?.po_date || "";
        return poB.localeCompare(poA);
      });
    }

    // Otherwise sort by highest 30D DRR, then OOS first
    return list.sort((a, b) => {
      if (a.current_stock === 0 && b.current_stock > 0) return -1;
      if (b.current_stock === 0 && a.current_stock > 0) return 1;
      return (b.drr_30d || 0) - (a.drr_30d || 0);
    });
  }, [
    activeTab,
    outOfStockList,
    criticallyRequiredList,
    reorderRequiredList,
    poIssuedList,
    ignoredList,
    selectedSourcing,
    searchQuery,
    poIssuedRecords
  ]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "SKU Code",
      "Product Name",
      "Category",
      "Sourcing",
      "Current Stock",
      "30D DRR",
      "Target Qty (30D DRR x 30)",
      "Cover Days (30D)",
      "Status",
      "PO Number",
      "PO Date",
      "PO Qty Ordered",
      "Expected Inward"
    ];

    const rows = filteredList.map((item) => {
      const po = poIssuedRecords[item.sku_code];
      const target = getTargetQty(item);
      const cover = getCoverDays30D(item);
      return [
        `"${item.sku_code}"`,
        `"${(item.name || "").replace(/"/g, '""')}"`,
        `"${item.category || ""}"`,
        `"${item.sourcing || ""}"`,
        item.current_stock,
        item.drr_30d || 0,
        target,
        cover >= 999 ? "N/A" : `${cover}d`,
        po ? "PO ISSUED" : ignoredSKUs.has(item.sku_code) ? "IGNORED" : item.current_stock === 0 ? "OUT OF STOCK" : cover < 15 ? "CRITICAL" : "REORDER",
        po ? `"${po.po_no}"` : '""',
        po ? `"${po.po_date}"` : '""',
        po ? po.qty_ordered : '""',
        po ? `"${po.expected_inward}"` : '""'
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `alerts-${activeTab}-${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-[1700px] mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg border border-slate-800 text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-950 tracking-tight">
            Warehouse - Alerts & Replenishment
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Operational replenishment schedule, zero-inventory stockouts, 30-day run-rate targets, and procurement pipeline.
          </p>
        </div>
      </div>

      {/* 1. UPPER 5 DECISION KPI CARDS (Total Deficit Units Removed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* Card 1: Out of Stock */}
        <button
          type="button"
          onClick={() => setActiveTab("out_of_stock")}
          className={cn(
            "text-left p-3.5 rounded-lg border transition-all relative overflow-hidden group shadow-2xs cursor-pointer flex flex-col justify-between",
            activeTab === "out_of_stock"
              ? "bg-rose-50/40 border-rose-500 ring-2 ring-rose-500/20"
              : "bg-white border-slate-200 hover:border-slate-400"
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Out of Stock</span>
              <span className="w-2 h-2 rounded-full bg-rose-600" />
            </div>
            <div className="text-3xl font-bold font-mono text-slate-950 mt-1.5">
              {outOfStockList.length} <span className="text-xs font-bold text-slate-700 uppercase">SKUs</span>
            </div>
            <div className="text-xs font-mono text-slate-700 mt-1 font-medium">
              Zero inventory on hand
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Click to view stockouts</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Card 2: Critically Required (< 15 Days) */}
        <button
          type="button"
          onClick={() => setActiveTab("critical")}
          className={cn(
            "text-left p-3.5 rounded-lg border transition-all relative overflow-hidden group shadow-2xs cursor-pointer flex flex-col justify-between",
            activeTab === "critical"
              ? "bg-orange-50/40 border-orange-500 ring-2 ring-orange-500/20"
              : "bg-white border-slate-200 hover:border-slate-400"
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Critically Required</span>
              <span className="w-2 h-2 rounded-full bg-orange-500" />
            </div>
            <div className="text-3xl font-bold font-mono text-slate-950 mt-1.5">
              {criticallyRequiredList.length} <span className="text-xs font-bold text-slate-700 uppercase">SKUs</span>
            </div>
            <div className="text-xs font-mono text-slate-700 mt-1 font-medium">
              Cover &lt; 15 days run-rate
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Click to view critical items</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Card 3: Reorder Required (< 30 Days) */}
        <button
          type="button"
          onClick={() => setActiveTab("reorder")}
          className={cn(
            "text-left p-3.5 rounded-lg border transition-all relative overflow-hidden group shadow-2xs cursor-pointer flex flex-col justify-between",
            activeTab === "reorder"
              ? "bg-amber-50/40 border-amber-500 ring-2 ring-amber-500/20"
              : "bg-white border-slate-200 hover:border-slate-400"
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Reorder Required</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div className="text-3xl font-bold font-mono text-slate-950 mt-1.5">
              {reorderRequiredList.length} <span className="text-xs font-bold text-slate-700 uppercase">SKUs</span>
            </div>
            <div className="text-xs font-mono text-slate-700 mt-1 font-medium">
              Cover &lt; 30 days run-rate
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Click to view reorder items</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Card 4: Ignored SKU */}
        <button
          type="button"
          onClick={() => setActiveTab("ignored")}
          className={cn(
            "text-left p-3.5 rounded-lg border transition-all relative overflow-hidden group shadow-2xs cursor-pointer flex flex-col justify-between",
            activeTab === "ignored"
              ? "bg-slate-100 border-slate-700 ring-2 ring-slate-700/20"
              : "bg-white border-slate-200 hover:border-slate-400"
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ignored SKU</span>
              <span className="w-2 h-2 rounded-full bg-slate-500" />
            </div>
            <div className="text-3xl font-bold font-mono text-slate-950 mt-1.5">
              {ignoredList.length} <span className="text-xs font-bold text-slate-700 uppercase">SKUs</span>
            </div>
            <div className="text-xs font-mono text-slate-700 mt-1 font-medium">
              Excluded from alert queues
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Click to view ignored</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>

        {/* Card 5: PO Issued SKU */}
        <button
          type="button"
          onClick={() => setActiveTab("po_issued")}
          className={cn(
            "text-left p-3.5 rounded-lg border transition-all relative overflow-hidden group shadow-2xs cursor-pointer flex flex-col justify-between",
            activeTab === "po_issued"
              ? "bg-indigo-50/40 border-indigo-500 ring-2 ring-indigo-500/20"
              : "bg-white border-slate-200 hover:border-slate-400"
          )}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">PO Issued SKU</span>
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
            </div>
            <div className="text-3xl font-bold font-mono text-slate-950 mt-1.5">
              {poIssuedList.length} <span className="text-xs font-bold text-slate-700 uppercase">SKUs</span>
            </div>
            <div className="text-xs font-mono text-slate-700 mt-1 font-medium">
              PO placed by warehouse
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Click to view PO pipeline</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>

      {/* 2. NAVIGATION TABS & FILTER BAR */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("out_of_stock")}
              className={cn(
                "px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                activeTab === "out_of_stock"
                  ? "bg-rose-700 text-white shadow-2xs"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-200"
              )}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Out of Stock ({outOfStockList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("critical")}
              className={cn(
                "px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                activeTab === "critical"
                  ? "bg-orange-600 text-white shadow-2xs"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-200"
              )}
            >
              <Flame className="w-4 h-4" />
              <span>Critical (&lt;15D) ({criticallyRequiredList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("reorder")}
              className={cn(
                "px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                activeTab === "reorder"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-200"
              )}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Reorder (&lt;30D) ({reorderRequiredList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("po_issued")}
              className={cn(
                "px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                activeTab === "po_issued"
                  ? "bg-indigo-700 text-white shadow-2xs"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-200"
              )}
            >
              <FileText className="w-4 h-4" />
              <span>PO Issued ({poIssuedList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("ignored")}
              className={cn(
                "px-3.5 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                activeTab === "ignored"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-700 hover:text-slate-950 hover:bg-slate-200"
              )}
            >
              <Ban className="w-4 h-4" />
              <span>Ignored SKUs ({ignoredList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-3 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === "all"
                  ? "bg-slate-950 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-200"
              )}
            >
              <span>All Active ({outOfStockList.length + criticallyRequiredList.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Search & Channel Filter Bar */}
        <div className="p-3 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by SKU code, product title, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900 placeholder:text-slate-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedSourcing}
              onChange={(e) => setSelectedSourcing(e.target.value)}
              className="h-8 px-2.5 text-xs border border-slate-300 rounded-md bg-white font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950"
            >
              <option value="ALL">All Sourcing Channels</option>
              {sourcingOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <span className="text-xs font-mono font-bold text-slate-800">
              Showing {filteredList.length} items
            </span>
          </div>
        </div>

        {/* 3. TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left min-w-[1050px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-800 select-none">
              <tr>
                <th className="py-2.5 px-3 w-[4%]">#</th>
                <th className="py-2.5 px-3 w-[13%]">Status</th>
                <th className="py-2.5 px-3 w-[29%]">Product Name & SKU</th>
                <th className="py-2.5 px-3 w-[10%]">Sourcing</th>
                <th className="py-2.5 px-3 text-right w-[10%]">DRR 30 Days</th>
                {activeTab !== "out_of_stock" && (
                  <th className="py-2.5 px-3 text-right w-[9%]">Current Stock</th>
                )}
                <th className="py-2.5 px-3 text-right w-[11%]">Target Qty</th>
                <th className="py-2.5 px-3 text-right w-[14%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px] leading-5">
              {filteredList.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab !== "out_of_stock" ? 8 : 7}
                    className="py-12 text-center text-xs text-slate-500 font-mono"
                  >
                    No items found under {activeTab.replace(/_/g, " ").toUpperCase()} with active filters.
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const targetQty = getTargetQty(item);
                  const coverDays = getCoverDays30D(item);
                  const isOOS = item.current_stock === 0;
                  const poRecord = poIssuedRecords[item.sku_code];
                  const isIgnored = ignoredSKUs.has(item.sku_code);

                  return (
                    <tr
                      key={item.sku_code}
                      className="hover:bg-slate-50/80 transition-colors group h-12"
                    >
                      {/* # Index */}
                      <td className="py-2 px-3 font-mono text-xs text-slate-500 align-middle">
                        #{idx + 1}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 overflow-hidden align-middle">
                        {poRecord ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-indigo-50 text-indigo-900 border border-indigo-200">
                              <FileText className="w-3 h-3 text-indigo-700" />
                              PO ISSUED
                            </span>
                            <span className="text-[10px] font-mono text-slate-600 truncate">
                              {poRecord.po_no} ({formatNumber(poRecord.qty_ordered)} u)
                            </span>
                          </div>
                        ) : isIgnored ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                            <Ban className="w-3 h-3 text-slate-500" />
                            IGNORED
                          </span>
                        ) : isOOS ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-50 text-rose-900 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                            OUT OF STOCK
                          </span>
                        ) : coverDays < 15 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-orange-50 text-orange-950 border border-orange-200">
                            <Flame className="w-3 h-3 text-orange-600" />
                            CRITICAL ({coverDays}d)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-50 text-amber-950 border border-amber-200">
                            REORDER ({coverDays}d)
                          </span>
                        )}
                      </td>

                      {/* Product Name & SKU */}
                      <td className="py-2 px-3 overflow-hidden align-middle">
                        <div className="flex flex-col min-w-0">
                          <Link
                            href={`/product/${encodeURIComponent(item.sku_code)}`}
                            className="truncate block font-semibold text-slate-950 text-[13px] hover:text-indigo-600 hover:underline transition-colors leading-snug"
                            title={item.name}
                          >
                            {item.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs text-slate-700 font-medium">
                              {item.sku_code}
                            </span>
                            <span className="text-xs font-sans text-slate-600">
                              • {item.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Sourcing */}
                      <td className="py-2 px-3 overflow-hidden align-middle">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {item.sourcing || "MARKET"}
                        </span>
                      </td>

                      {/* DRR 30 Days */}
                      <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-bold text-[13px] text-slate-950">
                        {item.drr_30d || 0}
                        <span className="font-normal text-xs text-slate-600 ml-0.5">/d</span>
                      </td>

                      {/* Current Stock (Hidden on OOS tab to adhere to strict schema) */}
                      {activeTab !== "out_of_stock" && (
                        <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-bold text-slate-950 text-[13px]">
                          {isOOS ? (
                            <span className="text-rose-700 font-bold">0</span>
                          ) : (
                            formatNumber(item.current_stock)
                          )}
                        </td>
                      )}

                      {/* Target Qty (30 DRR * 30) */}
                      <td className="py-2 px-3 text-right overflow-hidden align-middle font-mono font-bold text-[13px] text-slate-950">
                        {targetQty > 0 ? (
                          formatNumber(targetQty)
                        ) : (
                          <span className="text-slate-400 font-normal">—</span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-2 px-3 text-right overflow-hidden align-middle">
                        {isIgnored ? (
                          <button
                            type="button"
                            onClick={() => handleUnignoreSKU(item.sku_code)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors shadow-2xs cursor-pointer"
                            title="Restore SKU back to active alerts"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                        ) : poRecord ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenPOModal(item)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                              title="Edit PO details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelPO(item.sku_code)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs cursor-pointer"
                              title="Cancel PO and move back to active alerts"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleIgnoreSKU(item.sku_code)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                              title="Ignore this SKU from alerts"
                            >
                              <Ban className="w-3.5 h-3.5 text-slate-500" />
                              <span>Ignore</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenPOModal(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                              title="Mark Purchase Order as issued"
                            >
                              <FileText className="w-3.5 h-3.5 text-white" />
                              <span>Issue PO</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. PO ISSUED MODAL DIALOG */}
      {poModalItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950">
                  {poIssuedRecords[poModalItem.sku_code] ? "Edit Purchase Order" : "Issue Purchase Order (PO)"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPoModalItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1 transition-colors rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitPO} className="p-5 space-y-4">
              {/* Product Context Banner */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col gap-1">
                <div className="text-xs font-bold text-slate-950 line-clamp-1">{poModalItem.name}</div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
                  <span className="font-bold text-indigo-700">{poModalItem.sku_code}</span>
                  <span>•</span>
                  <span>{poModalItem.sourcing || "MARKET"}</span>
                  <span>•</span>
                  <span>Stock: {formatNumber(poModalItem.current_stock)}</span>
                  <span>•</span>
                  <span>30D DRR: {poModalItem.drr_30d}/d</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* PO Number */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    PO Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={poForm.po_no}
                    onChange={(e) => setPoForm({ ...poForm, po_no: e.target.value })}
                    placeholder="e.g. PO-CBL-0929"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-950 font-mono font-bold text-slate-950"
                  />
                </div>

                {/* PO Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    PO Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={poForm.po_date}
                    onChange={(e) => setPoForm({ ...poForm, po_date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-950 font-mono text-slate-950"
                  />
                </div>

                {/* Quantity Ordered */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Quantity Ordered <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={poForm.qty_ordered || ""}
                    onChange={(e) =>
                      setPoForm({ ...poForm, qty_ordered: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-950 font-mono font-bold text-slate-950"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Suggested replenishment target: {formatNumber(getTargetQty(poModalItem))} units (30D DRR requirement − in-stock)
                  </span>
                </div>

                {/* Expected Inward Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                    Expected Inward Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={poForm.expected_inward}
                    onChange={(e) => setPoForm({ ...poForm, expected_inward: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-950 font-mono text-slate-950"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
                  Procurement Remarks / Supplier (Optional)
                </label>
                <textarea
                  rows={2}
                  value={poForm.notes}
                  onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                  placeholder="Supplier name, advance payment details, shipment notes..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-950 text-slate-900"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPoModalItem(null)}
                  className="px-3.5 py-1.5 rounded-md border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="px-4 py-1.5 rounded-md bg-slate-950 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>
                    {poIssuedRecords[poModalItem.sku_code] ? "Update PO" : "Submit & Move to PO Issued"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
