"use client";

import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { cn } from "@/lib/utils";

interface EquipmentSearchProps {
  initialQuery: string;
  initialStatus: string;
  initialCategory: string;
}

const categories = [
  { value: "all", label: "All" },
  { value: "audio", label: "Audio", color: "bg-[var(--color-audio)]" },
  { value: "visual", label: "Visual", color: "bg-[var(--color-visual)]" },
  { value: "cables", label: "Cables", color: "bg-[var(--color-cables)]" },
  { value: "other", label: "Other", color: "bg-[var(--color-other)]" },
];

export function EquipmentSearch({ initialQuery, initialStatus, initialCategory }: EquipmentSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateSearch = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`/equipment?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <Input
            type="search"
            placeholder="Search..."
            defaultValue={initialQuery}
            onChange={(e) => updateSearch("q", e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex rounded-md border border-border bg-muted/50 p-0.5">
          {[
            { value: "available", label: "Available" },
            { value: "all", label: "All" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => updateSearch("status", option.value === "available" ? "" : option.value)}
              className={cn(
                "rounded-[5px] px-3 py-1 text-xs font-medium transition-all",
                (option.value === "available" && !initialStatus) || initialStatus === option.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        {isPending && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        )}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => updateSearch("category", cat.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
              initialCategory === cat.value
                ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {cat.color && (
              <span className={cn("h-2 w-2 rounded-full", cat.color)} />
            )}
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
