"use server";

import { createClient } from "@/lib/supabase/server";

/** Yönetici panelindeki "çevrim içi" için son görülme zamanını günceller. Hata kullanıcıya gösterilmez. */
export async function touchLastSeen(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("touch_last_seen");
}
