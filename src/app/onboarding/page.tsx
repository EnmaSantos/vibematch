import { redirect } from "next/navigation";
import { Film } from "lucide-react";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  // Double check if they already completed onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", data.user.id)
    .single();

  if (profile?.onboarding_completed) {
    redirect("/app");
  }

  return (
    <main className="relative min-h-screen bg-[#090b11] text-[#fff8ee]">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#2b1117_0%,#0a111d_48%,#11120d_100%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-24 bg-[repeating-linear-gradient(90deg,rgba(255,248,238,0.08)_0,rgba(255,248,238,0.08)_1px,transparent_1px,transparent_34px)] opacity-30" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2 font-black text-[#fff8ee]">
          <span className="flex size-9 items-center justify-center rounded-lg bg-[#f0b44c] text-[#18100b]">
            <Film className="size-5" aria-hidden="true" />
          </span>
          VibeMatch
        </Link>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-4xl flex-col justify-center px-5 py-8 sm:px-8">
        <OnboardingClient userEmail={data.user.email || ""} />
      </section>
    </main>
  );
}
