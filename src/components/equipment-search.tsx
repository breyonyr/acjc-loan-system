"use client";

import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { cn } from "@/lib/utils";

interface EquipmentSearchProps {
  initialQuery: string;
  initialStatus: string;
}

export function EquipmentSearch({ initialQuery, initialStatus }: EquipmentSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateSearch = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
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
            onClick={() => updateSearch("status", option.value)}
            className={cn(
              "rounded-[5px] px-3 py-1 text-xs font-medium transition-all",
              initialStatus === option.value
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
  );
}
