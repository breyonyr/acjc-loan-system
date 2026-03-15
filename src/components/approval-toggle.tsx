"use client";

import { useState, useTransition } from "react";
import { toggleApprovalMode } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ApprovalToggle({ enabled }: { enabled: boolean }) {
  const [checked, setChecked] = useState(enabled);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle() {
    const newValue = !checked;
    setChecked(newValue);
    startTransition(async () => {
      const result = await toggleApprovalMode(newValue);
      if (!result.success) {
        toast.error(result.error);
        setChecked(!newValue); // revert
      } else {
        toast.success(
          newValue
            ? "Approval mode enabled. New users will need admin approval."
            : "Approval mode disabled. New users can borrow immediately."
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
      <div>
        <p className="text-sm font-medium">Require approval for new users</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {checked
            ? "New users must be approved by an admin before they can borrow."
            : "Anyone with an @acjc.edu.sg account can borrow immediately."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={isPending}
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-foreground" : "bg-muted"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
