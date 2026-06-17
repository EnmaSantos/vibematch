import { redirect } from "next/navigation";
import { ArrowRight, KeyRound, Sparkles } from "lucide-react";
import { updatePassword } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import AnimatedSubmit from "@/components/AnimatedSubmit";
import VibeMatchLogo from "@/components/VibeMatchLogo";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    message?: string | string[];
  }>;
};

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function requireResetSession() {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    const params = new URLSearchParams({
      error: "Open the latest password reset email before setting a new password.",
    });

    redirect(`/login?${params.toString()}`);
  }
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  await requireResetSession();

  const params = (await searchParams) ?? {};
  const error = firstString(params.error);
  const message = firstString(params.message);
  const isConfigured = isSupabaseConfigured();

  return (
    <main className="min-h-screen overflow-hidden bg-[#090b11] text-[#fff8ee]">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#2b1117_0%,#0a111d_48%,#11120d_100%)]" />
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 overflow-hidden px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.7fr)]">
        <div className="min-w-0 w-full max-w-[350px] sm:max-w-2xl">
          <VibeMatchLogo className="mb-8" />
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[#f0b44c]/25 bg-[#f0b44c]/10 px-3 py-2 text-xs font-bold text-[#ffd98a]">
            <Sparkles className="size-4" aria-hidden="true" />
            Secure reset.
          </div>
          <h1 className="max-w-xl text-4xl font-black leading-[1.05] sm:text-6xl">
            Set a new password.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#c5cedc]">
            Choose a fresh password, then sign in and get back to your movie
            matches.
          </p>
        </div>

        <div className="min-w-0 w-full max-w-[350px] overflow-hidden rounded-lg border border-white/12 bg-[#101722] p-5 shadow-2xl shadow-black/30 sm:max-w-none sm:p-6">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase text-[#f0b44c]">
              Account recovery
            </p>
            <h2 className="mt-2 text-2xl font-black">New password</h2>
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

          <form action={updatePassword} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-[#f0b44c]" htmlFor="password">
                New password
              </label>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-white/12 bg-black/20 px-3">
                <KeyRound className="size-4 text-[#8f9bad]" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#fff8ee] outline-none placeholder:text-[#687386]"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[#f0b44c]" htmlFor="confirmPassword">
                Confirm password
              </label>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-white/12 bg-black/20 px-3">
                <KeyRound className="size-4 text-[#8f9bad]" aria-hidden="true" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#fff8ee] outline-none placeholder:text-[#687386]"
                  placeholder="Repeat password"
                />
              </div>
            </div>

            <AnimatedSubmit
              className="h-12 w-full rounded-lg bg-[#f0b44c] px-5 text-sm font-bold text-[#18100b] hover:bg-[#ffd06f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f0b44c]"
            >
              <ArrowRight className="size-4" aria-hidden="true" />
              Update password
            </AnimatedSubmit>
          </form>
        </div>
      </section>
    </main>
  );
}
