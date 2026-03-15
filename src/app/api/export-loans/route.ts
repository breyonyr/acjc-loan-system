import { getUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { format } from "date-fns";

const CHUNK_SIZE = 1000;

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  const headers = [
    "Loan ID",
    "Student Name",
    "Student Email",
    "Item",
    "Quantity",
    "Status",
    "Checked Out",
    "Due Date",
    "Returned At",
    "Notes",
  ];

  function formatRow(loan: Record<string, unknown>): string {
    const eq = loan.equipment as { name?: string } | null;
    const usr = loan.user as { name?: string; email?: string } | null;
    const cells = [
      loan.id,
      usr?.name || "Unknown",
      usr?.email || "Unknown",
      eq?.name || (loan.custom_item_name as string) || "Unknown",
      String((loan.custom_item_quantity as number) || 1),
      loan.status,
      loan.checked_out_at
        ? format(new Date(loan.checked_out_at as string), "yyyy-MM-dd HH:mm")
        : "",
      loan.due_date
        ? format(new Date(loan.due_date as string), "yyyy-MM-dd")
        : "",
      loan.returned_at
        ? format(new Date(loan.returned_at as string), "yyyy-MM-dd HH:mm")
        : "",
      (loan.notes as string) || "",
    ];
    return cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",");
  }

  // Stream CSV in chunks to avoid loading all data into memory
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(headers.join(",") + "\n"));

      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: loans, error } = await supabaseAdmin
          .from("loans")
          .select("*, equipment(name), user:users!loans_user_id_fkey(name, email)")
          .order("created_at", { ascending: false })
          .range(offset, offset + CHUNK_SIZE - 1);

        if (error) {
          controller.error(new Error("Failed to fetch loans"));
          return;
        }

        if (!loans || loans.length === 0) {
          hasMore = false;
        } else {
          const chunk = loans.map(formatRow).join("\n") + "\n";
          controller.enqueue(encoder.encode(chunk));
          offset += CHUNK_SIZE;
          if (loans.length < CHUNK_SIZE) hasMore = false;
        }
      }

      controller.close();
    },
  });

  const filename = `loans-export-${format(new Date(), "yyyy-MM-dd")}.csv`;

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
