"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface EquipmentPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export function EquipmentPagination({
  currentPage,
  totalPages,
  totalCount,
}: EquipmentPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page > 1) {
        params.set("page", String(page));
      } else {
        params.delete("page");
      }
      startTransition(() => {
        router.push(`/admin/equipment?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="flex items-center justify-between border-t border-border pt-4">
      <p className="text-sm text-muted-foreground">
        {totalCount} {totalCount === 1 ? "item" : "items"} total
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
