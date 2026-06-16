import Link from "next/link";
import { redirect } from "next/navigation";
import { Film, User, Settings, LayoutDashboard, Search } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  // Fetch or auto-create the user profile to check onboarding completion
  let onboardingCompleted = false;
  let profile = null;

  try {
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError || !existingProfile) {
      // Profile does not exist (trigger didn't run or delay), let's create it
      const displayName = data.user.user_metadata?.display_name || data.user.email?.split("@")[0] || "movie matcher";
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          display_name: displayName,
          email: data.user.email || "",
          onboarding_completed: false,
        })
        .select()
        .single();

      if (!insertError && newProfile) {
        profile = newProfile;
        onboardingCompleted = false;
      }
    } else {
      profile = existingProfile;
      onboardingCompleted = existingProfile.onboarding_completed;
    }
  } catch (err) {
    console.error("Error checking user profile onboarding:", err);
  }

  if (!onboardingCompleted) {
    redirect("/onboarding");
  }

  const email = data.user.email || "movie matcher";
  const displayName = profile?.display_name || data.user.user_metadata?.display_name || email.split("@")[0];

  return (
    <div className="flex min-h-screen flex-col bg-[#090b11] text-[#fff8ee]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0c111a]/95 backdrop-blur-md px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-6 sm:gap-10">
            <Link href="/app" className="inline-flex items-center gap-2 font-black">
              <span className="flex size-9 items-center justify-center rounded-lg bg-[#f0b44c] text-[#18100b]">
                <Film className="size-5" aria-hidden="true" />
              </span>
              VibeMatch
            </Link>
            
            <nav className="hidden items-center gap-1 text-sm font-bold text-[#aeb7c7] md:flex">
              <Link
                href="/app"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[#fff8ee] transition hover:bg-white/5"
              >
                <LayoutDashboard className="size-4" />
                Dashboard
              </Link>
              <Link
                href="/app/search"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-[#fff8ee]"
              >
                <Search className="size-4" />
                Find Movies
              </Link>
              <Link
                href="/app/profile"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-[#fff8ee]"
              >
                <User className="size-4" />
                Profile
              </Link>
              <Link
                href="/app/settings"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-[#fff8ee]"
              >
                <Settings className="size-4" />
                Settings
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold text-[#f0b44c]">{displayName}</p>
              <p className="text-[10px] text-[#687386]">{email}</p>
            </div>
            
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Mobile navigation bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-white/10 bg-[#0c111a]/95 backdrop-blur-md md:hidden">
        <Link
          href="/app"
          className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold text-[#aeb7c7] transition hover:text-[#fff8ee]"
        >
          <LayoutDashboard className="size-5" />
          Dashboard
        </Link>
        <Link
          href="/app/search"
          className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold text-[#aeb7c7] transition hover:text-[#fff8ee]"
        >
          <Search className="size-5" />
          Find
        </Link>
        <Link
          href="/app/profile"
          className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold text-[#aeb7c7] transition hover:text-[#fff8ee]"
        >
          <User className="size-5" />
          Profile
        </Link>
        <Link
          href="/app/settings"
          className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold text-[#aeb7c7] transition hover:text-[#fff8ee]"
        >
          <Settings className="size-5" />
          Settings
        </Link>
      </nav>

      <div className="flex-1 pb-20 md:pb-8">{children}</div>
    </div>
  );
}
