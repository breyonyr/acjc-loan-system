"use client";

import dynamic from "next/dynamic";
import type { Equipment } from "@/lib/types";

const BorrowForm = dynamic(
  () => import("@/components/borrow-form").then((mod) => ({ default: mod.BorrowForm })),
  {
    loading: () => (
      <div className="flex flex-col gap-8">
        <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-32 w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-40 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    ),
    ssr: false,
  }
);

interface BorrowFormLoaderProps {
  user: { name: string; email: string };
  availableEquipment: Equipment[];
}

export function BorrowFormLoader({ user, availableEquipment }: BorrowFormLoaderProps) {
  return <BorrowForm user={user} availableEquipment={availableEquipment} />;
}
