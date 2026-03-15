"use client";

import { useState, useTransition, useOptimistic } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { returnEquipment } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ReturnButton({
  loanId,
  equipmentName,
}: {
  loanId: string;
  equipmentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticReturned, setOptimisticReturned] = useOptimistic(false);
  const router = useRouter();

  if (optimisticReturned) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Returned
      </span>
    );
  }

  function handleReturn() {
    startTransition(async () => {
      setOptimisticReturned(true);
      const result = await returnEquipment(loanId);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(`${result.equipmentName || equipmentName} returned`);
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="shrink-0 h-9"
      >
        Return
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Return {equipmentName}?</DialogTitle>
            <DialogDescription>
              This will mark the item as returned and make it available for others.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleReturn} disabled={isPending}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Returning...
                </span>
              ) : (
                "Confirm return"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
