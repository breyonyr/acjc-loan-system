"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

const statusFilters = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "banned", label: "Banned" },
];

const roleFilters = [
  { value: "all", label: "All roles" },
  { value: "student", label: "Student" },
  { value: "admin", label: "Admin" },
];

interface UserFilterProps {
  initialQuery: string;
  initialStatus: string;
  initialRole: string;
}

export function UserFilter({ initialQuery, initialStatus, initialRole }: UserFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateSearch = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/admin/users?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateSearch("q", value);
      }, 300);
    },
    [updateSearch]
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search input */}
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
        <input
          type="search"
          defaultValue={initialQuery}
          onChange={(e) => debouncedSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Status filter */}
      <div className="flex rounded-md border border-border bg-muted/50 p-0.5">
        {statusFilters.map((option) => (
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

      {/* Role filter */}
      <div className="flex rounded-md border border-border bg-muted/50 p-0.5">
        {roleFilters.map((option) => (
          <button
            key={option.value}
            onClick={() => updateSearch("role", option.value)}
            className={cn(
              "rounded-[5px] px-3 py-1 text-xs font-medium transition-all",
              initialRole === option.value
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
