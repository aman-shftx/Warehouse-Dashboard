"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface Props {
  fallbackHref?: string;
  label?: string;
}

export function ProductBackButton({ fallbackHref = "/", label = "Back" }: Props) {
  const router = useRouter();

  const handleBack = () => {
    // If the user navigated from another page in this session, return to that exact page & scroll position
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 font-medium text-xs text-slate-600 hover:text-indigo-600 transition-colors duration-100 cursor-pointer group"
      title="Go back to previous page"
    >
      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
      <span>{label}</span>
    </button>
  );
}
