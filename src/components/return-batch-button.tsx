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
import { returnBatch } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ReturnBatchButton({
  batchId,
  itemCount,
  itemNames,
}: {
  batchId: string;
  itemCount: number;
  itemNames: string[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleReturn() {
    startTransition(async () => {
      const result = await returnBatch(batchId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${result.count} items returned`);
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
        Return all
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Return all {itemCount} items?</DialogTitle>
            <DialogDescription>
              This will mark all items as returned and make them available for others.
            </DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-1.5 px-1">
            {itemNames.map((name, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                {name}
              </li>
            ))}
          </ul>
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
                "Confirm return all"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
