"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { bulkApproveUsers } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function BulkApproveButton({ pendingCount }: { pendingCount: number }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleBulkApprove() {
    startTransition(async () => {
      const result = await bulkApproveUsers();
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(`Approved ${result.count} ${result.count === 1 ? "user" : "users"}.`);
        setConfirmOpen(false);
        router.refresh();
      }
    });
  }

  if (pendingCount === 0) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/30"
      >
        Approve all ({pendingCount})
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve All Pending Users</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            <p>
              Are you sure you want to approve{" "}
              <strong className="text-foreground">
                {pendingCount} pending {pendingCount === 1 ? "user" : "users"}
              </strong>
              ? They will be able to borrow equipment immediately.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkApprove} disabled={isPending}>
              {isPending ? "Approving..." : `Approve ${pendingCount} ${pendingCount === 1 ? "user" : "users"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
