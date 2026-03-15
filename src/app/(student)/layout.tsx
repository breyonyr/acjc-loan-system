import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { RealtimeProvider } from "@/components/realtime-provider";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  if (user.status === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex max-w-md flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-amber-600 dark:text-amber-400"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Awaiting Approval</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Your account is pending approval from a teacher. You&apos;ll be able to access the system once an admin approves your account.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={{ name: user.name, email: user.email, image: user.image, role: user.role }} />
      <RealtimeProvider>
        <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:pb-6">{children}</main>
      </RealtimeProvider>
    </div>
  );
}
