"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseConfig } from "@/lib/supabase/env";

export function createClient() {
  const { publishableKey, url } = requireSupabaseConfig();

  return createBrowserClient(url, publishableKey);
}
