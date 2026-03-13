"use client";

import { useState, useTransition } from "react";
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
  const router = useRouter();

  function handleReturn() {
    startTransition(async () => {
      const result = await returnEquipment(loanId);
      if (result.error) {
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
