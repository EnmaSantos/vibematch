import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Film, KeyRound, Mail, RefreshCw, Sparkles } from "lucide-react";
import { login, resendConfirmation } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import AnimatedSubmit from "@/components/AnimatedSubmit";

type AuthPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    message?: string | string[];
  }>;
};

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function redirectIfSignedIn() {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (data?.claims && !error) {
    redirect("/app");
  }
}

export default async function LoginPage({ searchParams }: AuthPageProps) {
  await redirectIfSignedIn();

  const params = (await searchParams) ?? {};
  const error = firstString(params.error);
  const message = firstString(params.message);
  const isConfigured = isSupabaseConfigured();

  return (
    <main className="min-h-screen overflow-hidden bg-[#090b11] text-[#fff8ee]">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#2b1117_0%,#0a111d_48%,#11120d_100%)]" />
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 overflow-hidden px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.7fr)]">
        <div className="min-w-0 w-full max-w-[350px] sm:max-w-2xl">
          <Link
            href="/"
            className="mb-8 flex w-fit items-center gap-2 font-black text-[#fff8ee]"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#f0b44c] text-[#18100b]">
              <Film className="size-5" aria-hidden="true" />
            </span>
            VibeMatch
          </Link>
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[#f0b44c]/25 bg-[#f0b44c]/10 px-3 py-2 text-xs font-bold text-[#ffd98a]">
            <Sparkles className="size-4" aria-hidden="true" />
            Friends first. Movies only.
          </div>
          <h1 className="max-w-xl text-4xl font-black leading-[1.05] sm:text-6xl">
            Sign in and get back to the match.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#c5cedc]">
            Your private likes, live rounds, friends, and shared movie matches
            stay tied to your Supabase account.
          </p>
        </div>

        <div className="min-w-0 w-full max-w-[350px] overflow-hidden rounded-lg border border-white/12 bg-[#101722] p-5 shadow-2xl shadow-black/30 sm:max-w-none sm:p-6">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase text-[#f0b44c]">
              Email login
            </p>
            <h2 className="mt-2 text-2xl font-black">Welcome back</h2>
          </div>

          {!isConfigured ? (
            <p className="mb-5 max-w-full break-words rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
              Supabase env vars are missing. Add the public URL and publishable
              key in <code className="font-mono text-xs">.env.local</code>.
            </p>
          ) : null}

          {message ? (
            <p className="mb-5 rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-3 text-sm leading-6 text-emerald-100">
              {message}
            </p>
          ) : null}

          {error ? (
            <p className="mb-5 rounded-lg border border-rose-300/25 bg-rose-300/10 p-3 text-sm leading-6 text-rose-100">
              {error}
            </p>
          ) : null}

          <form action={login} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-[#f0b44c]" htmlFor="email">
                Email
              </label>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-white/12 bg-black/20 px-3">
                <Mail className="size-4 text-[#8f9bad]" aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#fff8ee] outline-none placeholder:text-[#687386]"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-xs font-bold text-[#f0b44c]" htmlFor="password">
                  Password
                </label>
                <Link
                  className="text-xs font-bold text-[#f0b44c] hover:text-[#ffd06f]"
                  href="/forgot-password"
                >
                  Forgot?
                </Link>
              </div>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-white/12 bg-black/20 px-3">
                <KeyRound className="size-4 text-[#8f9bad]" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#fff8ee] outline-none placeholder:text-[#687386]"
                  placeholder="Your password"
                />
              </div>
            </div>

            <AnimatedSubmit
              className="h-12 w-full rounded-lg bg-[#f0b44c] px-5 text-sm font-bold text-[#18100b] hover:bg-[#ffd06f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f0b44c]"
            >
              <ArrowRight className="size-4" aria-hidden="true" />
              Sign in
            </AnimatedSubmit>
          </form>

          <p className="mt-5 text-center text-sm text-[#aeb7c7] flex flex-col gap-2">
            <span>
              New here?{" "}
              <Link className="font-bold text-[#f0b44c]" href="/signup">
                Create an account
              </Link>
            </span>
            <span>
              Have a 6-digit verification code?{" "}
              <Link className="font-bold text-[#f0b44c]" href="/verify">
                Verify here
              </Link>
            </span>
          </p>

          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-sm font-bold text-[#fff8ee]">
              Did not get the confirmation email?
            </p>
            <form action={resendConfirmation} className="mt-3 space-y-3">
              <label className="sr-only" htmlFor="resend-email">
                Email for confirmation resend
              </label>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-white/12 bg-black/20 px-3">
                <Mail className="size-4 text-[#8f9bad]" aria-hidden="true" />
                <input
                  id="resend-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#fff8ee] outline-none placeholder:text-[#687386]"
                  placeholder="you@example.com"
                />
              </div>
              <AnimatedSubmit
                className="h-11 w-full rounded-lg border border-white/12 px-4 text-sm font-bold text-[#fff8ee] hover:border-[#f0b44c]/70 hover:text-[#ffd06f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f0b44c]"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Resend confirmation
              </AnimatedSubmit>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
