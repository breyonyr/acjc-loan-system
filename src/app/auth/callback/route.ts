import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED_DOMAIN = "acjc.edu.sg";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    const email = data.user.email;

    // Validate domain
    if (!email || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${origin}/login?error=invalid_domain`
      );
    }

    // Create or update user record
    const name =
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.name ||
      email.split("@")[0];
    const image =
      data.user.user_metadata?.avatar_url ||
      data.user.user_metadata?.picture ||
      null;

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      // Update name/image for existing user (don't touch status)
      await supabaseAdmin
        .from("users")
        .update({ name, image })
        .eq("id", existingUser.id);
    } else {
      // New user — check if approval mode is enabled
      const { isApprovalRequired } = await import("@/lib/settings");
      const approvalRequired = await isApprovalRequired();

      await supabaseAdmin.from("users").insert({
        email,
        name,
        image,
        status: approvalRequired ? "pending" : "active",
      });
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
