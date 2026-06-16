import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const allowedOtpTypes = new Set([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
]);

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/app";
  }

  return next;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") ?? "email";
  const next = safeNextPath(requestUrl.searchParams.get("next"));
  const supabaseError =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error");

  if (!isSupabaseConfigured()) {
    const redirectUrl = new URL("/login", requestUrl.origin);

    redirectUrl.searchParams.set(
      "error",
      "Supabase is not configured yet. Add your project URL and publishable key to .env.local.",
    );

    return NextResponse.redirect(redirectUrl);
  }

  if (supabaseError) {
    const redirectUrl = new URL("/login", requestUrl.origin);

    redirectUrl.searchParams.set("error", supabaseError);

    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  if (tokenHash && allowedOtpTypes.has(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  const redirectUrl = new URL("/login", requestUrl.origin);

  redirectUrl.searchParams.set(
    "message",
    "If Supabase confirmed your email, sign in to continue. If not, request a new confirmation email.",
  );

  return NextResponse.redirect(redirectUrl);
}
