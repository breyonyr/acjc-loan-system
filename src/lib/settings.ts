import { supabaseAdmin } from "@/lib/supabase";

export async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return data?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await supabaseAdmin
    .from("app_settings")
    .upsert({ key, value }, { onConflict: "key" });
}

export async function isApprovalRequired(): Promise<boolean> {
  const value = await getSetting("approval_required");
  return value === "true";
}
