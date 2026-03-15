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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { banUser, unbanUser, deleteUser, approveUser, promoteToAdmin, demoteToStudent } from "@/lib/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";

export function UserActions({
  user,
  activeLoansCount,
}: {
  user: User;
  activeLoansCount: number;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [promoteConfirmOpen, setPromoteConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isBanned = user.status === "banned";
  const isPendingApproval = user.status === "pending";
  const isAdmin = user.role === "admin";

  function handleToggleBan() {
    startTransition(async () => {
      const result = isBanned
        ? await unbanUser(user.id)
        : await banUser(user.id);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(
          isBanned
            ? `${user.name} has been unbanned.`
            : `${user.name} has been banned.`
        );
        setConfirmOpen(false);
        router.refresh();
      }
    });
  }

  function handleApprove() {
    startTransition(async () => {
      const result = await approveUser(user.id);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(`${user.name} has been approved.`);
        router.refresh();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUser(user.id);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(`${user.name} has been deleted.`);
        setDeleteConfirmOpen(false);
        router.refresh();
      }
    });
  }

  function handleToggleRole() {
    startTransition(async () => {
      const result = isAdmin
        ? await demoteToStudent(user.id)
        : await promoteToAdmin(user.id);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(
          isAdmin
            ? `${user.name} has been demoted to student.`
            : `${user.name} has been promoted to admin.`
        );
        setPromoteConfirmOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm hover:bg-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isAdmin ? (
            <>
              <DropdownMenuItem
                onClick={() => setPromoteConfirmOpen(true)}
                className="text-amber-600"
              >
                Demote to student
              </DropdownMenuItem>
            </>
          ) : (
            <>
              {isPendingApproval && (
                <DropdownMenuItem onClick={handleApprove}>
                  Approve user
                </DropdownMenuItem>
              )}
              {!isPendingApproval && !isBanned && (
                <DropdownMenuItem onClick={() => setPromoteConfirmOpen(true)}>
                  Promote to admin
                </DropdownMenuItem>
              )}
              {isBanned ? (
                <DropdownMenuItem onClick={() => setConfirmOpen(true)}>
                  Unban user
                </DropdownMenuItem>
              ) : !isPendingApproval ? (
                <DropdownMenuItem
                  onClick={() => setConfirmOpen(true)}
                  className="text-red-600"
                >
                  Ban user
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                onClick={() => setDeleteConfirmOpen(true)}
                className="text-red-600"
              >
                Delete user
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Ban/Unban Confirmation */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isBanned ? "Unban User" : "Ban User"}
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            {isBanned ? (
              <p>
                Are you sure you want to unban{" "}
                <strong className="text-foreground">{user.name}</strong>? They
                will be able to borrow equipment again.
              </p>
            ) : (
              <>
                <p>
                  Are you sure you want to ban{" "}
                  <strong className="text-foreground">{user.name}</strong>?
                </p>
                {activeLoansCount > 0 && (
                  <p className="mt-2 text-red-600 dark:text-red-400">
                    This will force-return their {activeLoansCount} active{" "}
                    {activeLoansCount === 1 ? "loan" : "loans"} and release
                    equipment back to inventory.
                  </p>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant={isBanned ? "default" : "destructive"}
              onClick={handleToggleBan}
              disabled={isPending}
            >
              {isPending
                ? isBanned
                  ? "Unbanning..."
                  : "Banning..."
                : isBanned
                ? "Unban"
                : "Ban User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            <p>
              Are you sure you want to permanently delete{" "}
              <strong className="text-foreground">{user.name}</strong>?
            </p>
            <p className="mt-2 text-red-600 dark:text-red-400">
              This will delete all their loan records and release any active equipment. This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote/Demote Confirmation */}
      <Dialog open={promoteConfirmOpen} onOpenChange={setPromoteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isAdmin ? "Demote to Student" : "Promote to Admin"}
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            {isAdmin ? (
              <p>
                Are you sure you want to demote{" "}
                <strong className="text-foreground">{user.name}</strong> from
                admin to student? They will lose access to the admin panel.
              </p>
            ) : (
              <p>
                Are you sure you want to promote{" "}
                <strong className="text-foreground">{user.name}</strong> to
                admin? They will gain full access to manage equipment, users,
                and loans.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPromoteConfirmOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleToggleRole}
              disabled={isPending}
            >
              {isPending
                ? isAdmin
                  ? "Demoting..."
                  : "Promoting..."
                : isAdmin
                ? "Demote to Student"
                : "Promote to Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
