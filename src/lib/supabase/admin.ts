import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requireSupabaseConfig } from "@/lib/supabase/env";

export function createAdminClient() {
  const { url } = requireSupabaseConfig();
  const secretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "";

  if (!secretKey) {
    throw new Error(
      "Supabase admin access is not configured. Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
