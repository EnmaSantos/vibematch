import { KeyRound, User, Settings, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { changePasswordFromSettings, updateProfileSettings } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import AnimatedSubmit from "@/components/AnimatedSubmit";

type SettingsPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    message?: string | string[];
  }>;
};

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = (await searchParams) ?? {};
  const error = firstString(params.error);
  const message = firstString(params.message);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const email = user?.email || "movie matcher";
  const displayName = user?.user_metadata?.display_name || email.split("@")[0];

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-[#f0b44c] text-[#18100b]">
          <Settings className="size-5" />
        </span>
        <div>
          <h1 className="text-3xl font-black text-[#fff8ee]">Settings</h1>
          <p className="text-sm text-[#8f9bad]">Manage your account details and security settings.</p>
        </div>
      </div>

      {message ? (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-4 text-emerald-100">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
          <p className="text-sm leading-6">{message}</p>
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-rose-300/25 bg-rose-300/10 p-4 text-rose-100">
          <ShieldAlert className="size-5 shrink-0 text-rose-400" />
          <p className="text-sm leading-6">{error}</p>
        </div>
      ) : null}

      <div className="space-y-6">
        {/* Profile Settings Card */}
        <section className="rounded-xl border border-white/12 bg-[#101722] p-5 sm:p-6">
          <h2 className="text-xl font-black text-[#fff8ee] flex items-center gap-2">
            <User className="size-5 text-[#f0b44c]" />
            Profile details
          </h2>
          <p className="mt-1 text-xs text-[#8f9bad]">Choose how you appear to friends during swipe sessions.</p>
          
          <form action={updateProfileSettings} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-[#f0b44c]" htmlFor="displayName">
                Display name
              </label>
              <div className="flex h-12 items-center gap-2 rounded-lg border border-white/12 bg-black/20 px-3 max-w-md">
                <User className="size-4 text-[#8f9bad]" aria-hidden="true" />
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  defaultValue={displayName}
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#fff8ee] outline-none placeholder:text-[#687386]"
                  placeholder="Enma"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-[#687386]">
                Email address (cannot be changed)
              </label>
              <p className="text-sm font-bold text-[#aeb7c7] px-1">{email}</p>
            </div>

            <AnimatedSubmit
              className="h-10 rounded-lg bg-[#f0b44c] px-5 text-sm font-bold text-[#18100b] hover:bg-[#ffd06f]"
            >
              Update display name
            </AnimatedSubmit>
          </form>
        </section>

        {/* Security Settings Card */}
        <section className="rounded-xl border border-white/12 bg-[#101722] p-5 sm:p-6">
          <h2 className="text-xl font-black text-[#fff8ee] flex items-center gap-2">
            <KeyRound className="size-5 text-[#f0b44c]" />
            Security & password
          </h2>
          <p className="mt-1 text-xs text-[#8f9bad]">Change your account password securely.</p>
          
          <form action={changePasswordFromSettings} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
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
                    required
                    minLength={6}
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#fff8ee] outline-none placeholder:text-[#687386]"
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#f0b44c]" htmlFor="confirmPassword">
                  Confirm new password
                </label>
                <div className="flex h-12 items-center gap-2 rounded-lg border border-white/12 bg-black/20 px-3">
                  <KeyRound className="size-4 text-[#8f9bad]" aria-hidden="true" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    className="min-w-0 flex-1 bg-transparent text-sm text-[#fff8ee] outline-none placeholder:text-[#687386]"
                    placeholder="Repeat password"
                  />
                </div>
              </div>
            </div>

            <AnimatedSubmit
              className="h-10 rounded-lg bg-[#f0b44c] px-5 text-sm font-bold text-[#18100b] hover:bg-[#ffd06f]"
            >
              Change password
            </AnimatedSubmit>
          </form>
        </section>
      </div>
    </main>
  );
}
