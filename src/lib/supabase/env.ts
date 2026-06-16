export type SupabaseConfig = {
  isConfigured: boolean;
  publishableKey: string;
  url: string;
};

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";

  return {
    isConfigured: Boolean(url && publishableKey),
    publishableKey,
    url,
  };
}

export function isSupabaseConfigured() {
  return getSupabaseConfig().isConfigured;
}

export function requireSupabaseConfig() {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return config as SupabaseConfig & {
    isConfigured: true;
    publishableKey: string;
    url: string;
  };
}
