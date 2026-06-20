import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, KeyRound, Mail, RefreshCw, Sparkles } from "lucide-react";
import { login, resendConfirmation, signInWithGoogle, signInWithGithub } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import AnimatedSubmit from "@/components/AnimatedSubmit";
import VibeMatchLogo from "@/components/VibeMatchLogo";
import { safeNextPath } from "@/lib/auth/safe-next-path";

type AuthPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    message?: string | string[];
    next?: string | string[];
  }>;
};

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function redirectIfSignedIn(next: string) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (data.user && !error) {
    redirect(next);
  }
}

export default async function LoginPage({ searchParams }: AuthPageProps) {
  const params = (await searchParams) ?? {};
  const next = safeNextPath(firstString(params.next));
  await redirectIfSignedIn(next);

  const error = firstString(params.error);
  const message = firstString(params.message);
  const isConfigured = isSupabaseConfigured();

  return (
    <main className="min-h-screen overflow-hidden bg-[#090b11] text-[#fff8ee]">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#2b1117_0%,#0a111d_48%,#11120d_100%)]" />
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 overflow-hidden px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.7fr)]">
        <div className="min-w-0 w-full max-w-[350px] sm:max-w-2xl">
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <VibeMatchLogo className="mb-0" />
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#f0b44c]/25 bg-[#f0b44c]/10 px-3 py-2 text-xs font-bold text-[#ffd98a]">
              <Sparkles className="size-4" aria-hidden="true" />
              Friends first. Movies only.
            </div>
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
            <input type="hidden" name="next" value={next} />
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-[#101722] px-3 text-[#687386] font-bold">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <form action={signInWithGoogle} className="w-full">
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-xs font-bold text-[#fff8ee] hover:bg-white/10 transition active:scale-95"
              >
                <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </form>
            <form action={signInWithGithub} className="w-full">
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-xs font-bold text-[#fff8ee] hover:bg-white/10 transition active:scale-95"
              >
                <svg className="size-4 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                GitHub
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-[#aeb7c7] flex flex-col gap-2">
            <span>
              New here?{" "}
              <Link
                className="font-bold text-[#f0b44c]"
                href={next === "/app" ? "/signup" : `/signup?next=${encodeURIComponent(next)}`}
              >
                Create an account
              </Link>
            </span>
            <span>
              Have an email verification code?{" "}
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
