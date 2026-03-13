import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { RealtimeProvider } from "@/components/realtime-provider";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={{ name: user.name, email: user.email, image: user.image, role: user.role }} />
      <RealtimeProvider>
        <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:pb-6">{children}</main>
      </RealtimeProvider>
    </div>
  );
}
