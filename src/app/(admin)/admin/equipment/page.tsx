import { supabaseAdmin } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { AddEquipmentDialog } from "@/components/add-equipment-dialog";
import { EquipmentActions } from "@/components/equipment-actions";
import type { Equipment } from "@/lib/types";
import { format } from "date-fns";
import Link from "next/link";

export default async function AdminEquipmentPage() {
  const { data: equipment } = await supabaseAdmin
    .from("equipment")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Admin
            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <h1 className="text-lg font-bold tracking-tight sm:text-2xl">Equipment</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Add, edit, and manage equipment inventory.
          </p>
        </div>
        <AddEquipmentDialog />
      </div>

      {equipment && equipment.length > 0 ? (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(equipment as Equipment[]).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.category && (
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {item.category}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(item.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <EquipmentActions equipment={item} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No equipment added yet. Click &quot;Add Equipment&quot; to get started.
          </p>
        </div>
      )}
    </div>
  );
}
