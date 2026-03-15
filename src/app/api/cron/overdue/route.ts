import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// This endpoint marks active loans as overdue when past due date.
// Can be called by Vercel Cron or Supabase pg_cron.
// Protected by a simple auth check — only service-level calls.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("loans")
    .update({ status: "overdue" })
    .eq("status", "active")
    .lt("due_date", now)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    updated: data?.length || 0,
    timestamp: now,
  });
}
