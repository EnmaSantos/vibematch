import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/app";
  }

  return next;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    const redirectUrl = new URL("/login", requestUrl.origin);

    redirectUrl.searchParams.set(
      "error",
      "Supabase is not configured yet. Add your project URL and publishable key to .env.local.",
    );

    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  const redirectUrl = new URL("/login", requestUrl.origin);

  redirectUrl.searchParams.set(
    "error",
    "We could not confirm that account. Try signing in again.",
  );

  return NextResponse.redirect(redirectUrl);
}
