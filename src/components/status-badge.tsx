import { cn } from "@/lib/utils";

const statusConfig = {
  available: {
    label: "Available",
    dotClass: "bg-green-500",
    textClass: "text-green-700",
    bgClass: "bg-green-50",
    borderClass: "border-green-200",
  },
  checked_out: {
    label: "Checked Out",
    dotClass: "bg-slate-400",
    textClass: "text-slate-600",
    bgClass: "bg-slate-50",
    borderClass: "border-slate-200",
  },
  maintenance: {
    label: "Maintenance",
    dotClass: "bg-amber-500",
    textClass: "text-amber-700",
    bgClass: "bg-amber-50",
    borderClass: "border-amber-200",
  },
  active: {
    label: "Active",
    dotClass: "bg-blue-500",
    textClass: "text-blue-700",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
  },
  returned: {
    label: "Returned",
    dotClass: "bg-green-500",
    textClass: "text-green-700",
    bgClass: "bg-green-50",
    borderClass: "border-green-200",
  },
  overdue: {
    label: "Overdue",
    dotClass: "bg-red-500",
    textClass: "text-red-700",
    bgClass: "bg-red-50",
    borderClass: "border-red-200",
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
