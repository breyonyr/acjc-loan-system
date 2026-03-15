import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import type { Equipment } from "@/lib/types";

const categoryIcons: Record<string, string> = {
  audio: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8",
  visual: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  cables: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  other: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
};

const categoryColors: Record<string, string> = {
  audio: "bg-[var(--color-audio-bg)] text-[var(--color-audio)]",
  visual: "bg-[var(--color-visual-bg)] text-[var(--color-visual)]",
  cables: "bg-[var(--color-cables-bg)] text-[var(--color-cables)]",
  other: "bg-[var(--color-other-bg)] text-[var(--color-other)]",
};

export function EquipmentCard({ equipment }: { equipment: Equipment }) {
  const iconPath = categoryIcons[equipment.category || "other"] || categoryIcons.other;

  return (
    <Link
      href={`/equipment/${equipment.id}`}
      className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-primary/5 hover:border-primary/20"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${categoryColors[equipment.category || "other"] || categoryColors.other}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={iconPath} />
        </svg>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground truncate">
            {equipment.name}
          </h3>
          {equipment.description && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              {equipment.description}
            </p>
          )}
        </div>
        <StatusBadge status={equipment.status} />
      </div>
    </Link>
  );
}
