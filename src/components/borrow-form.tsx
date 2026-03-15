"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { borrowEquipment } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import type { Equipment, CartItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BorrowFormProps {
  user: { name: string; email: string };
  availableEquipment: Equipment[];
}

function QuantityInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => {
    setRaw(String(value));
  }, [value]);

  return (
    <Input
      type="number"
      inputMode="numeric"
      min={1}
      max={99}
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={() => {
        const num = parseInt(raw);
        if (isNaN(num) || num < 1) {
          setRaw("1");
          onChange(1);
        } else {
          const clamped = Math.max(1, Math.min(99, num));
          setRaw(String(clamped));
          onChange(clamped);
        }
      }}
      className="h-10 w-[4.5rem] text-center text-sm"
    />
  );
}

export function BorrowForm({ user, availableEquipment }: BorrowFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ items: CartItem[]; dueDate: string; count: number } | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const defaultDue = format(addDays(new Date(), 3), "yyyy-MM-dd");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loanDate, setLoanDate] = useState(today);
  const [dueDate, setDueDate] = useState(defaultDue);
  const [notes, setNotes] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Filter inventory: exclude items already in cart, match search
  const filteredEquipment = availableEquipment.filter((item) => {
    const inCart = cart.some(
      (c) => c.type === "inventory" && c.equipmentId === item.id
    );
    if (inCart) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q)
    );
  });

  // Group filtered inventory by category
  const grouped = filteredEquipment.reduce<Record<string, Equipment[]>>(
    (acc, item) => {
      const cat = item.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {}
  );

  // Show "add custom item" option when query doesn't exactly match an inventory item
  const hasExactMatch = availableEquipment.some(
    (item) => item.name.toLowerCase() === searchQuery.trim().toLowerCase()
  );
  const showCustomOption = searchQuery.trim().length > 0 && !hasExactMatch;

  function addInventoryItem(item: Equipment) {
    setCart((prev) => [
      ...prev,
      {
        type: "inventory",
        equipmentId: item.id,
        name: item.name,
        description: item.description,
        category: item.category,
      },
    ]);
    setSearchQuery("");
    setShowDropdown(false);
  }

  function addCustomItem(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed.length > 100) {
      toast.error("Item name is too long (max 100 characters)");
      return;
    }
    const exists = cart.some(
      (c) => c.type === "custom" && c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      toast.error("This item is already in your list");
      return;
    }
    setCart((prev) => [...prev, { type: "custom", name: trimmed, quantity: 1 }]);
    setSearchQuery("");
    setShowDropdown(false);
  }

  function removeCartItem(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCustomQty(index: number, qty: number) {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== index || item.type !== "custom") return item;
        return { ...item, quantity: Math.max(1, Math.min(99, qty)) };
      })
    );
  }

  function handleSubmit() {
    if (cart.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    if (!dueDate) {
      toast.error("Set a due date");
      return;
    }
    if (new Date(dueDate) <= new Date(loanDate)) {
      toast.error("Due date must be after loan date");
      return;
    }
    setShowConfirm(true);
  }

  function confirmBorrow() {
    startTransition(async () => {
      const inventoryIds = cart
        .filter((c): c is Extract<CartItem, { type: "inventory" }> => c.type === "inventory")
        .map((c) => c.equipmentId);

      const customItems = cart
        .filter((c): c is Extract<CartItem, { type: "custom" }> => c.type === "custom")
        .map((c) => ({ name: c.name, quantity: c.quantity }));

      const result = await borrowEquipment({
        equipmentIds: inventoryIds,
        customItems,
        loanDate: `${loanDate}T00:00:00`,
        dueDate: `${dueDate}T23:59:59`,
        notes: notes || undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        setShowConfirm(false);
      } else {
        setSuccessData({ items: [...cart], dueDate, count: result.count });
        setShowConfirm(false);
        setShowSuccess(true);
        setCart([]);
        setNotes("");
        setDueDate(format(addDays(new Date(), 3), "yyyy-MM-dd"));
      }
    });
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        {/* ── Add Items ── */}
        <section>
          <Label className="text-sm font-medium">Add items</Label>
          <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
            Search existing inventory or type a custom item name.
          </p>

          <div ref={dropdownRef} className="relative">
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <Input
                ref={inputRef}
                placeholder="Search inventory or type a custom item..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && showCustomOption) {
                    e.preventDefault();
                    addCustomItem(searchQuery);
                  }
                  if (e.key === "Escape") {
                    setShowDropdown(false);
                  }
                }}
                className="pl-9"
              />
            </div>

            {/* Dropdown */}
            {showDropdown &&
              (searchQuery.trim() || filteredEquipment.length > 0) && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[50vh] overflow-y-auto rounded-lg border border-border bg-popover shadow-md">
                  {/* Inventory matches */}
                  {Object.entries(grouped).map(([category, items]) => (
                    <div key={category}>
                      <p className="px-3 pt-2 pb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {category}
                      </p>
                      {items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addInventoryItem(item)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50"
                        >
                          <span className="font-medium">{item.name}</span>
                          {item.description && (
                            <span className="text-xs text-muted-foreground truncate">
                              {item.description}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}

                  {/* Custom item option */}
                  {showCustomOption && (
                    <>
                      {filteredEquipment.length > 0 && (
                        <div className="border-t border-border" />
                      )}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addCustomItem(searchQuery)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/50"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0 text-muted-foreground"
                        >
                          <path d="M12 5v14" />
                          <path d="M5 12h14" />
                        </svg>
                        <span>
                          Add custom item:{" "}
                          <strong className="text-foreground">
                            &ldquo;{searchQuery.trim()}&rdquo;
                          </strong>
                        </span>
                      </button>
                    </>
                  )}

                  {/* No results */}
                  {filteredEquipment.length === 0 && !showCustomOption && (
                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                      No matching equipment. Type a name and press Enter to add
                      a custom item.
                    </p>
                  )}
                </div>
              )}
          </div>
        </section>

        {/* ── Cart ── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <Label className="text-sm font-medium">
              Your items
            </Label>
            {cart.length > 0 && (
              <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {cart.length}
              </span>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No items added yet. Use the search above to add equipment.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {cart.map((item, index) => (
                <div
                  key={
                    item.type === "inventory"
                      ? item.equipmentId
                      : `custom-${index}`
                  }
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
                >
                  {/* Item info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {item.name}
                      </p>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                          item.type === "inventory"
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                            : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                        )}
                      >
                        {item.type === "inventory" ? "Inventory" : "Custom"}
                      </span>
                    </div>
                    {item.type === "inventory" && item.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Quantity for custom items */}
                  {item.type === "custom" && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Qty</span>
                      <QuantityInput
                        value={item.quantity}
                        onChange={(qty) => updateCustomQty(index, qty)}
                      />
                    </div>
                  )}

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeCartItem(index)}
                    className="shrink-0 rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    aria-label={`Remove ${item.name}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Loan Details ── */}
        <section>
          <Label className="text-sm font-medium mb-3 block">Loan details</Label>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Borrower */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Borrower</Label>
              <div className="rounded-md border border-border bg-muted/50 px-3 py-2">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>

            {/* Loan date */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="loanDate" className="text-xs text-muted-foreground">
                Loan date
              </Label>
              <Input
                id="loanDate"
                type="date"
                value={loanDate}
                onChange={(e) => setLoanDate(e.target.value)}
              />
            </div>

            {/* Due date */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dueDate" className="text-xs text-muted-foreground">
                Due date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                min={loanDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="notes" className="text-xs text-muted-foreground">
                Notes{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="e.g. For drama rehearsal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
        </section>

        {/* ── Submit ── */}
        <Button
          onClick={handleSubmit}
          disabled={cart.length === 0}
          className="w-full sm:w-auto"
          size="lg"
        >
          {cart.length > 0
            ? `Borrow ${cart.length} ${cart.length === 1 ? "item" : "items"}`
            : "Borrow equipment"}
        </Button>
      </div>

      {/* ── Confirmation Dialog ── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm loan</DialogTitle>
            <DialogDescription>
              Review the details before submitting.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Borrower</span>
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Loan date</span>
              <span className="font-medium">
                {format(new Date(loanDate), "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due date</span>
              <span className="font-medium">
                {format(new Date(dueDate), "MMM d, yyyy")}
              </span>
            </div>
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-muted-foreground">
                {cart.length} {cart.length === 1 ? "item" : "items"}
              </p>
              <ul className="flex flex-col gap-1.5">
                {cart.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="font-medium min-w-0 break-words">{item.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {item.type === "custom"
                        ? `x${item.quantity} · Custom`
                        : "Inventory"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {notes && (
              <div className="border-t border-border pt-3">
                <p className="text-muted-foreground">Notes</p>
                <p className="mt-0.5 font-medium">{notes}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={confirmBorrow} disabled={isPending}>
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Submitting...
                </span>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Success Dialog ── */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600 dark:text-green-400"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <DialogTitle className="text-center">Equipment borrowed!</DialogTitle>
            <DialogDescription className="text-center">
              {successData?.count === 1
                ? "Your item has been checked out."
                : `${successData?.count} items have been checked out.`}
            </DialogDescription>
          </DialogHeader>

          {successData && (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due date</span>
                <span className="font-medium">
                  {format(new Date(successData.dueDate), "MMM d, yyyy")}
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <p className="mb-2 text-xs text-muted-foreground uppercase tracking-wider">Items</p>
                <ul className="flex flex-col gap-1.5">
                  {successData.items.map((item, index) => (
                    <li key={index} className="flex items-center justify-between gap-3">
                      <span className="font-medium min-w-0 break-words">{item.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {item.type === "custom" ? `x${item.quantity}` : "Inventory"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="sm:flex-col gap-2">
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              View my loans
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSuccess(false)}
              className="w-full"
            >
              Borrow more
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
