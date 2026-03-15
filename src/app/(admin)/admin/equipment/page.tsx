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
import { EquipmentPagination } from "@/components/equipment-pagination";
import type { Equipment } from "@/lib/types";
import { format } from "date-fns";
import Link from "next/link";

const PAGE_SIZE = 20;

export default async function AdminEquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const { data: equipment, count } = await supabaseAdmin
    .from("equipment")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
            {totalCount > 0 && (
              <span className="ml-1">({totalCount} items)</span>
            )}
          </p>
        </div>
        <AddEquipmentDialog />
      </div>

      {equipment && equipment.length > 0 ? (
        <>
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
                        <span className="text-xs font-semibold text-muted-foreground">
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

          {totalPages > 1 && (
            <EquipmentPagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
            />
          )}
        </>
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
