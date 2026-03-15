import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  // Fetch loan stats in parallel
  const [
    { count: totalLoans },
    { count: activeLoans },
    { count: returnedLoans },
    { count: overdueLoans },
  ] = await Promise.all([
    supabaseAdmin
      .from("loans")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabaseAdmin
      .from("loans")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active"),
    supabaseAdmin
      .from("loans")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "returned"),
    supabaseAdmin
      .from("loans")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "overdue"),
  ]);

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const stats = [
    { label: "Total Loans", value: totalLoans || 0, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30", border: "border-indigo-200 dark:border-indigo-800" },
    { label: "Active", value: activeLoans || 0, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-800" },
    { label: "Returned", value: returnedLoans || 0, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" },
    { label: "Overdue", value: overdueLoans || 0, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-800" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-lg font-semibold tracking-tight">Profile</h1>

      {/* User info card */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Avatar className="h-16 w-16 border-2 border-border">
            <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col items-center gap-1 sm:items-start">
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  user.role === "admin"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {user.role}
              </span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  user.status === "active"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                    : user.status === "banned"
                    ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                }`}
              >
                {user.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Joined {format(new Date(user.created_at), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
      </div>

      {/* Borrowing stats */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Borrowing Stats
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`rounded-lg border ${stat.border} ${stat.bg} p-4 shadow-sm`}>
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              <p className={`mt-1 text-2xl font-semibold tabular-nums ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
