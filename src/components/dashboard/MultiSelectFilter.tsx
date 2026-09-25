"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Check, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  counts?: Record<string, number>;
  placeholder?: string;
}

export function MultiSelectFilter({
  title,
  options,
  selected,
  onChange,
  counts = {},
  placeholder,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((item) => item !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const selectAll = () => {
    onChange([...options]);
  };

  const clearAll = () => {
    onChange([]);
  };

  const filteredOptions = useMemo(() => {
    if (!filterSearch.trim()) return options;
    const q = filterSearch.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, filterSearch]);

  const isAllSelected = selected.length === options.length && options.length > 0;
  const isNoneSelected = selected.length === 0;

  // Label text on the button
  const buttonLabel = useMemo(() => {
    if (isNoneSelected || isAllSelected) {
      return `All ${title} (${options.length})`;
    }
    if (selected.length === 1) {
      return selected[0];
    }
    return `${title} (${selected.length})`;
  }, [isNoneSelected, isAllSelected, selected, title, options.length]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-8 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-2 transition-all duration-100 outline-none select-none",
          selected.length > 0 && !isAllSelected
            ? "bg-indigo-50/90 border-indigo-300 text-indigo-700 font-semibold"
            : "bg-white border-slate-300/80 text-slate-700 hover:bg-slate-50"
        )}
      >
        <span className="truncate max-w-[150px]">{buttonLabel}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-150", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 rounded-lg bg-white border border-slate-200/90 shadow-xl z-50 p-2 text-xs flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-100">
          {/* Header row: title and select all / clear */}
          <div className="flex items-center justify-between px-1.5 pb-1 border-b border-slate-100">
            <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
              {title}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Select all
              </button>
              <span className="text-slate-200">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] text-slate-400 hover:text-slate-700 font-medium"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Search box if options > 6 */}
          {options.length > 6 && (
            <div className="relative px-1 pt-0.5">
              <Search className="w-3 h-3 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder={placeholder || `Filter ${title.toLowerCase()}...`}
                className="w-full pl-7 pr-6 py-1 text-xs rounded border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {filterSearch && (
                <button
                  type="button"
                  onClick={() => setFilterSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 py-0.5 pr-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = selected.includes(opt);
                const count = counts[opt];

                return (
                  <label
                    key={opt}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleOption(opt);
                    }}
                    className={cn(
                      "flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors select-none",
                      isChecked ? "bg-indigo-50/70 text-indigo-900 font-medium" : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        className={cn(
                          "w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors",
                          isChecked
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-slate-300 bg-white"
                        )}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <span className="truncate">{opt}</span>
                    </div>
                    {count !== undefined && (
                      <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                        {count}
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
