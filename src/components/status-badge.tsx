import { cn } from "@/lib/utils";

const statusConfig = {
  available: {
    label: "Available",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700 dark:text-emerald-300",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/50",
    borderClass: "border-emerald-300 dark:border-emerald-700",
  },
  checked_out: {
    label: "Checked Out",
    dotClass: "bg-indigo-400",
    textClass: "text-indigo-700 dark:text-indigo-300",
    bgClass: "bg-indigo-50 dark:bg-indigo-950/50",
    borderClass: "border-indigo-200 dark:border-indigo-700",
  },
  maintenance: {
    label: "Maintenance",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700 dark:text-amber-300",
    bgClass: "bg-amber-50 dark:bg-amber-950/50",
    borderClass: "border-amber-300 dark:border-amber-700",
  },
  active: {
    label: "Active",
    dotClass: "bg-blue-500",
    textClass: "text-blue-700 dark:text-blue-300",
    bgClass: "bg-blue-50 dark:bg-blue-950/50",
    borderClass: "border-blue-300 dark:border-blue-700",
  },
  returned: {
    label: "Returned",
    dotClass: "bg-emerald-500",
    textClass: "text-emerald-700 dark:text-emerald-300",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/50",
    borderClass: "border-emerald-300 dark:border-emerald-700",
  },
  overdue: {
    label: "Overdue",
    dotClass: "bg-red-500",
    textClass: "text-red-700 dark:text-red-300",
    bgClass: "bg-red-50 dark:bg-red-950/50",
    borderClass: "border-red-300 dark:border-red-700",
  },
} as const;

type StatusType = keyof typeof statusConfig;

export function StatusBadge({ status }: { status: StatusType }) {
  const config = statusConfig[status];
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.bgClass,
        config.textClass,
        config.borderClass
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </span>
  );
}
