import Link from "next/link";
import { redirect } from "next/navigation";
import { Film, User, Heart, Sparkles, Flame, Play, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { matches, movieRatings, watchedTogether, movies } from "@/lib/vibematch-data";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch user profile details from the database
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_initials")
    .eq("id", user.id)
    .maybeSingle();

  const email = user.email || "movie matcher";
  const displayName = profile?.display_name || user.user_metadata?.display_name || email.split("@")[0];
  const avatarInitials = profile?.avatar_initials || displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  // 2. Fetch stats dynamically from the database
  const [{ count: totalSwipesCount }, { data: participantRows }] = await Promise.all([
    supabase
      .from("swipes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("session_participants")
      .select("session_id")
      .eq("user_id", user.id),
  ]);

  const sessionIds = [...new Set((participantRows ?? []).map((row) => row.session_id))];
  const { data: sessions } = sessionIds.length
    ? await supabase
        .from("sessions")
        .select("id, status")
        .in("id", sessionIds)
    : { data: [] };

  const totalSwipes = totalSwipesCount ?? 0;
  const sessionsCompleted = sessions?.filter((s) => s.status === "complete").length ?? 0;
  const hoursSaved = Math.max(Math.round((sessionsCompleted * 20) / 60), 1);

  // Calculate perfect matches count dynamically
  let perfectMatches = 0;
  const { data: myLikes } = await supabase
    .from("swipes")
    .select("session_id, movie_id")
    .eq("user_id", user.id)
    .eq("intent", "like");

  if (myLikes && myLikes.length > 0) {
    const likeSessionIds = [...new Set(myLikes.map((l) => l.session_id))];
    const { data: otherLikes } = await supabase
      .from("swipes")
      .select("session_id, movie_id")
      .in("session_id", likeSessionIds)
      .eq("intent", "like")
      .neq("user_id", user.id);

    if (otherLikes && otherLikes.length > 0) {
      const myLikeKeys = new Set(myLikes.map((l) => `${l.session_id}-${l.movie_id}`));
      const matchedMovies = new Set<string>();
      
      for (const ol of otherLikes) {
        const key = `${ol.session_id}-${ol.movie_id}`;
        if (myLikeKeys.has(key)) {
          matchedMovies.add(key);
        }
      }
      perfectMatches = matchedMovies.size;
    }
  }

  const stats = {
    totalSwipes,
    perfectMatches,
    sessionsCompleted,
    hoursSaved,
  };

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      {/* Profile Header */}
      <section className="relative overflow-hidden rounded-2xl border border-white/12 bg-[#101722] p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 size-48 rounded-full bg-[#f0b44c]/10 blur-3xl" />
        
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#f0b44c_0%,#d97706_100%)] text-2xl font-black text-[#18100b]">
            {avatarInitials}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#f0b44c]/25 bg-[#f0b44c]/10 px-2.5 py-1 text-xs font-bold text-[#ffd98a]">
              <Flame className="size-3.5" />
              Active Matcher
            </div>
            <h1 className="text-3xl font-black text-[#fff8ee] sm:text-4xl">{displayName}</h1>
            <p className="mt-1 text-sm text-[#8f9bad]">{email}</p>
            <p className="mt-4 text-xs font-bold text-[#687386]">Member since June 2026</p>
          </div>
          <Link
            href="/app/settings"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-white/12 bg-white/8 px-4 text-sm font-bold text-[#fff8ee] transition hover:bg-white/12"
          >
            Edit Profile
          </Link>
        </div>
      </section>

      {/* Matching Stats Grid */}
      <section className="mt-8 grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: "Total Swipes", value: stats.totalSwipes, icon: Play, color: "text-[#ffd98a]" },
          { label: "Perfect Matches", value: stats.perfectMatches, icon: Heart, color: "text-rose-400" },
          { label: "Completed Rounds", value: stats.sessionsCompleted, icon: Sparkles, color: "text-emerald-400" },
          { label: "Negotiation Hours Saved", value: `~${stats.hoursSaved}h`, icon: Clock, color: "text-violet-400" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-white/12 bg-[#101722]/60 p-5">
              <span className={`inline-block mb-3 ${stat.color}`}>
                <Icon className="size-5" />
              </span>
              <p className="text-2xl font-black text-[#fff8ee]">{stat.value}</p>
              <p className="mt-1 text-xs font-bold text-[#8f9bad]">{stat.label}</p>
            </div>
          );
        })}
      </section>

      {/* History Sections */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Watch History */}
        <section className="rounded-xl border border-white/12 bg-[#101722] p-5 sm:p-6">
          <h2 className="text-xl font-black mb-4">Watched Together</h2>
          {watchedTogether.length > 0 ? (
            <div className="space-y-4">
              {watchedTogether.map((item) => {
                const movie = movies.find((m) => m.id === item.media_item_id);
                return (
                  <div key={item.id} className="rounded-lg bg-black/20 p-4 border border-white/5">
                    <h3 className="font-bold text-[#fff8ee]">{movie?.title || "Elvis"}</h3>
                    <p className="text-xs text-[#8f9bad] mt-1">Shared Rating: {item.shared_rating}/10</p>
                    <p className="text-xs text-[#c5cedc] mt-2 italic">"{item.notes}"</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.vibe_tags.map((tag) => (
                        <span key={tag} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[#aeb7c7]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#8f9bad] italic">No watched together records yet.</p>
          )}
        </section>

        {/* Ratings/Reviews */}
        <section className="rounded-xl border border-white/12 bg-[#101722] p-5 sm:p-6">
          <h2 className="text-xl font-black mb-4">Your Private Ratings</h2>
          {movieRatings.length > 0 ? (
            <div className="space-y-4">
              {movieRatings.map((rating) => {
                const movie = movies.find((m) => m.id === rating.media_item_id);
                return (
                  <div key={rating.id} className="rounded-lg bg-black/20 p-4 border border-white/5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-[#fff8ee]">{movie?.title || "Past Lives"}</h3>
                      <span className="text-xs font-black text-[#f0b44c]">{rating.rating}/10</span>
                    </div>
                    <p className="text-xs text-[#c5cedc] mt-2">"{rating.notes}"</p>
                    <p className="text-[10px] text-[#687386] mt-3">Rated on June 12, 2026</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#8f9bad] italic">You haven't rated any movies yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
