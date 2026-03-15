import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const params = await searchParams;
  const errorMessage =
    params.error === "invalid_domain"
      ? "Only @acjc.edu.sg accounts are allowed. Please use your school email."
      : params.error === "auth_failed"
        ? "Authentication failed. Please try again."
        : null;

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-[image:var(--gradient-hero)] p-10 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white backdrop-blur-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.29 7 12 12 20.71 7" />
              <line x1="12" x2="12" y1="22" y2="12" />
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight">ACJC Equipment</span>
        </div>

        <div className="flex flex-col gap-6">
          <p className="text-xl/relaxed font-medium tracking-tight">
            Borrow mics, cables, speakers, and AV gear — all from your browser. No more sign-up sheets.
          </p>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-white/80">Anglo-Chinese Junior College</p>
            <p className="text-sm text-white/50">Audio &amp; Visual Equipment Loans</p>
          </div>
        </div>

        <p className="text-xs text-white/40">ACJC Equipment Loans</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <line x1="12" x2="12" y1="22" y2="12" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight">ACJC Equipment</span>
          </div>

          <div className="flex flex-col gap-2 mb-8">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Use your school Google account to continue.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <LoginForm />

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Restricted to @acjc.edu.sg accounts
          </p>
        </div>
      </div>
    </div>
  );
}
