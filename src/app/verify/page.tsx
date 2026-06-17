import Link from "next/link";
import { ArrowRight, KeyRound, Mail, Sparkles, Sliders } from "lucide-react";
import { verifyOtpCode } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  OTP_CODE_MAX_LENGTH,
  OTP_CODE_MIN_LENGTH,
  OTP_CODE_PATTERN,
  OTP_CODE_PLACEHOLDER,
  OTP_CODE_REQUIREMENT,
} from "@/lib/auth/otp-code";
import AnimatedSubmit from "@/components/AnimatedSubmit";
import VibeMatchLogo from "@/components/VibeMatchLogo";

type VerifyPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    email?: string | string[];
    type?: string | string[];
  }>;
};

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = (await searchParams) ?? {};
  const error = firstString(params.error);
  const email = firstString(params.email) || "";
  const type = firstString(params.type) || "signup";
  const isConfigured = isSupabaseConfigured();

  return (
    <main className="min-h-screen overflow-hidden bg-[#090b11] text-[#fff8ee]">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#2b1117_0%,#0a111d_48%,#11120d_100%)]" />
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 overflow-hidden px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.7fr)]">
        <div className="min-w-0 w-full max-w-[350px] sm:max-w-2xl">
          <VibeMatchLogo className="mb-8" />
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-[#f0b44c]/25 bg-[#f0b44c]/10 px-3 py-2 text-xs font-bold text-[#ffd98a]">
            <Sparkles className="size-4" aria-hidden="true" />
            Verification Center.
          </div>
          <h1 className="max-w-xl text-4xl font-black leading-[1.05] sm:text-6xl">
            Enter your email code.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#c5cedc]">
            If you received a one-time code instead of a confirmation link, enter it here to activate your account, verify your email, or reset your password.
          </p>
        </div>

        <div className="min-w-0 w-full max-w-[350px] overflow-hidden rounded-lg border border-white/12 bg-[#101722] p-5 shadow-2xl shadow-black/30 sm:max-w-none sm:p-6">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase text-[#f0b44c]">
              One-Time Password
            </p>
            <h2 className="mt-2 text-2xl font-black">Verify Code</h2>
          </div>

          {!isConfigured ? (
            <p className="mb-5 max-w-full break-words rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
              Supabase env vars are missing. Add the public URL and publishable
              key in <code className="font-mono text-xs">.env.local</code>.
            </p>
          ) : null}

          {error ? (
            <p className="mb-5 rounded-lg border border-rose-300/25 bg-rose-300/10 p-3 text-sm leading-6 text-rose-100">
              {error}
            </p>
          ) : null}

          <form action={verifyOtpCode} className="space-y-4">
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
                  defaultValue={email}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#fff8ee] outline-none placeholder:text-[#687386]"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[#f0b44c]" htmlFor="token">
                Verification code
              </label>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-white/12 bg-black/20 px-3">
                <KeyRound className="size-4 text-[#8f9bad]" aria-hidden="true" />
                <input
                  id="token"
                  name="token"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern={OTP_CODE_PATTERN}
                  minLength={OTP_CODE_MIN_LENGTH}
                  maxLength={OTP_CODE_MAX_LENGTH}
                  title={`Enter the ${OTP_CODE_REQUIREMENT} from your email.`}
                  required
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#ffd98a] font-mono tracking-widest outline-none placeholder:text-[#687386] placeholder:font-sans placeholder:tracking-normal"
                  placeholder={OTP_CODE_PLACEHOLDER}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[#f0b44c]" htmlFor="type">
                Verification Type
              </label>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-white/12 bg-black/20 px-3">
                <Sliders className="size-4 text-[#8f9bad]" aria-hidden="true" />
                <select
                  id="type"
                  name="type"
                  defaultValue={type}
                  className="flex-1 bg-transparent text-sm text-[#fff8ee] outline-none border-none cursor-pointer [color-scheme:dark]"
                >
                  <option value="signup" className="bg-[#101722] text-[#fff8ee]">Confirm Sign Up</option>
                  <option value="recovery" className="bg-[#101722] text-[#fff8ee]">Password Reset (Recovery)</option>
                  <option value="magiclink" className="bg-[#101722] text-[#fff8ee]">Magic Link Sign-In</option>
                  <option value="email_change" className="bg-[#101722] text-[#fff8ee]">Email Change Confirmation</option>
                </select>
              </div>
            </div>

            <AnimatedSubmit
              className="h-12 w-full rounded-lg bg-[#f0b44c] px-5 text-sm font-bold text-[#18100b] hover:bg-[#ffd06f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f0b44c]"
            >
              <ArrowRight className="size-4" aria-hidden="true" />
              Verify Code
            </AnimatedSubmit>
          </form>

          <p className="mt-5 text-center text-sm text-[#aeb7c7]">
            Did not receive a code?{" "}
            <Link className="font-bold text-[#f0b44c]" href="/login">
              Back to Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
