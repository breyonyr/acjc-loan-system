import { createSupabaseServer } from "./supabase-server";
import { supabaseAdmin } from "./supabase";
import type { User } from "./types";

export async function getSession() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUser(): Promise<User | null> {
  const authUser = await getSession();
  if (!authUser?.email) {
    return null;
  }

  const { data } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", authUser.email)
    .single();

  return data as User | null;
}
