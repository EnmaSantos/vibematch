import { randomInt } from "node:crypto";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/env";
import { getAvatarInitials, getUserDisplayName } from "@/lib/auth/user-profile";
import { fetchMoviesForSession } from "@/lib/tmdb";
import { buildDynamicMatches, buildMovieMap, filtersFromProfile, filtersFromUnknown, normalizeSessionCode } from "@/lib/vibe-session";
import type { MediaItem } from "@/lib/vibematch-data";
import { MobileError, bearerToken, durationFromBody, readBody, requiredString, requireLiveSession, swipeIntent } from "./validation";

const sessionFields = "id, code, title, creator_id, status, duration_seconds, expires_at, filters";

type CachedMovieRow = {
  id: string; tmdb_id: number; title: string;
  imdb_id?: string | null; overview?: string | null; poster_url?: string | null;
  backdrop_url?: string | null; release_date?: string | null; runtime_minutes?: number | null;
  genres?: string[] | null; tmdb_rating?: number | null; imdb_rating?: number | null;
  created_at?: string | null; updated_at?: string | null;
  poster_theme?: MediaItem["posterTheme"] | null;
  watch_providers?: MediaItem["watch_providers"] | null;
};

function mediaItemFromRow(row: CachedMovieRow): MediaItem {
  const now = new Date().toISOString();
  return {
    id: row.id, tmdb_id: row.tmdb_id, imdb_id: row.imdb_id ?? "", title: row.title,
    overview: row.overview ?? "", poster_url: row.poster_url ?? "",
    backdrop_url: row.backdrop_url ?? "", release_date: row.release_date ?? "",
    runtime_minutes: row.runtime_minutes ?? 0, genres: row.genres ?? [],
    tmdb_rating: Number(row.tmdb_rating ?? 0), imdb_rating: Number(row.imdb_rating ?? 0),
    created_at: row.created_at ?? now, updated_at: row.updated_at ?? now,
    posterTheme: row.poster_theme ?? { from: "#0f172a", via: "#1e293b", to: "#475569" },
    watch_providers: row.watch_providers ?? [],
  };
}

function client(token?: string) {
  const config = getSupabaseConfig();
  if (!config.isConfigured) throw new MobileError(503, "The server is not configured yet.");
  return createClient(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
  });
}

function check(error: { message: string } | null) {
  if (error) throw new MobileError(502, "Could not save or load your data. Please try again.");
}

function movieDTO(movie: MediaItem) {
  return {
    id: movie.id, title: movie.title, overview: movie.overview,
    posterUrl: movie.poster_url.startsWith("https://") ? movie.poster_url : null,
    year: movie.release_date.slice(0, 4), runtimeMinutes: movie.runtime_minutes,
    genres: movie.genres, rating: movie.tmdb_rating,
    providers: movie.watch_providers.map((provider) => ({
      name: provider.provider_name, type: provider.provider_type,
      lastCheckedAt: provider.last_checked_at,
    })),
  };
}

async function profileFor(db: SupabaseClient, user: User) {
  const { data, error } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();
  check(error);
  if (data) return data;
  const displayName = getUserDisplayName(user);
  const { data: created, error: createError } = await db.from("profiles").upsert({
    id: user.id, email: user.email ?? "", display_name: displayName,
    avatar_initials: getAvatarInitials(displayName), onboarding_completed: false,
  }, { onConflict: "id", ignoreDuplicates: true }).select("*").maybeSingle();
  check(createError);
  if (created) return created;
  const { data: concurrent, error: readError } = await db.from("profiles").select("*").eq("id", user.id).single();
  check(readError);
  return concurrent;
}

function sessionDTO(session: Record<string, unknown>, saved: boolean, userId: string) {
  return {
    id: session.id, code: session.code, title: session.title,
    status: session.status, expiresAt: session.expires_at,
    durationSeconds: session.duration_seconds,
    filters: filtersFromUnknown(session.filters), saved, isHost: session.creator_id === userId,
  };
}

async function memberSession(db: SupabaseClient, userId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new MobileError(400, "Invalid session ID.");
  const { data: member, error } = await db.from("session_participants")
    .select("saved_at").eq("session_id", id).eq("user_id", userId).maybeSingle();
  check(error);
  if (!member) throw new MobileError(403, "Join this session before opening it.");
  const { data: session, error: sessionError } = await db.from("sessions")
    .select(sessionFields).eq("id", id).maybeSingle();
  check(sessionError);
  if (!session) throw new MobileError(404, "Session not found.");
  return { session, member };
}

async function snapshot(db: SupabaseClient, userId: string, id: string, includeMovies: boolean) {
  const { session, member } = await memberSession(db, userId, id);
  const [participantsResult, swipesResult] = await Promise.all([
    db.from("session_participants").select("user_id").eq("session_id", id),
    db.from("swipes").select("user_id, movie_id, intent").eq("session_id", id),
  ]);
  check(participantsResult.error); check(swipesResult.error);
  const participants = participantsResult.data ?? [];
  const participantIds = new Set(participants.map((row) => row.user_id));
  const swipes = (swipesResult.data ?? []).filter((swipe) => participantIds.has(swipe.user_id));
  const likedIds = [...new Set(swipes.filter((row) => row.intent === "like").map((row) => row.movie_id))];
  const { data: rows, error } = likedIds.length
    ? await db.from("movies").select("*").in("id", likedIds)
    : { data: [], error: null };
  check(error);
  const matches = buildDynamicMatches({
    currentUserId: userId, movieMap: buildMovieMap((rows ?? []).map(mediaItemFromRow)),
    participants: participants.map((row) => ({ id: row.user_id, displayName: row.user_id === userId ? "You" : "Your partner" })),
    swipes,
  }).filter((match) => match.movie).map((match) => ({
    movie: movieDTO(match.movie!), kind: match.matchType, reason: match.reason,
  }));
  const active = session.status === "live" && Date.parse(session.expires_at) > Date.now();
  const movies = includeMovies && active ? await fetchMoviesForSession(filtersFromUnknown(session.filters), {
    cacheClient: db,
    excludedMovieIds: swipes.filter((row) => row.user_id === userId).map((row) => row.movie_id),
    seed: session.code, limit: 24,
  }) : [];
  return { session: sessionDTO(session, Boolean(member.saved_at), userId), participantCount: participants.length, movies: movies.map(movieDTO), matches };
}

export async function handleMobileRequest(request: Request, path: string[]) {
  try {
    const result = await dispatch(request, path);
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const known = error instanceof MobileError;
    if (!known) console.error("Mobile API request failed", error instanceof Error ? error.name : "Unknown error");
    return Response.json({ error: known ? error.message : "Something went wrong. Please try again." }, {
      status: known ? error.status : 500, headers: { "Cache-Control": "private, no-store" },
    });
  }
}

async function dispatch(request: Request, path: string[]) {
  const route = path.join("/");
  const method = request.method;
  if (route === "auth/google/start" && method === "GET") {
    const params = new URL(request.url).searchParams;
    const platform = params.get("platform");
    const challenge = params.get("codeChallenge") ?? "";
    const redirects: Record<string, string> = {
      android: "com.vibematch.android://auth/callback",
      ios: "com.vibematch.ios://auth/callback",
    };
    if (!platform || !redirects[platform] || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) {
      throw new MobileError(400, "Invalid Google sign-in request.");
    }
    const config = getSupabaseConfig();
    if (!config.isConfigured) throw new MobileError(503, "The server is not configured yet.");
    const url = new URL("/auth/v1/authorize", config.url);
    url.searchParams.set("provider", "google");
    url.searchParams.set("redirect_to", redirects[platform]);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "s256");
    return { url: url.toString() };
  }
  if (route === "auth/google/exchange" && method === "POST") {
    const body = await readBody(request);
    const code = requiredString(body, "code", 2048);
    const verifier = requiredString(body, "codeVerifier", 128);
    if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) throw new MobileError(400, "Invalid Google sign-in request.");
    const config = getSupabaseConfig();
    if (!config.isConfigured) throw new MobileError(503, "The server is not configured yet.");
    const url = new URL("/auth/v1/token?grant_type=pkce", config.url);
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { apikey: config.publishableKey, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
        cache: "no-store",
      });
    } catch {
      throw new MobileError(502, "Google sign-in is temporarily unavailable. Please try again.");
    }
    if (response.status === 429) throw new MobileError(429, "Too many attempts. Try again later.");
    if (!response.ok) throw new MobileError(response.status >= 500 ? 502 : 401, "Google sign-in expired or could not finish. Please try again.");
    const session = await response.json();
    const expiresAt = typeof session.expires_at === "number" ? session.expires_at
      : typeof session.expires_in === "number" && session.expires_in > 0
        ? Math.floor(Date.now() / 1000) + session.expires_in : null;
    if (typeof session.access_token !== "string" || typeof session.refresh_token !== "string" || expiresAt === null) {
      throw new MobileError(502, "Google sign-in returned an invalid session.");
    }
    return { accessToken: session.access_token, refreshToken: session.refresh_token, expiresAt };
  }
  if (method === "POST" && ["auth/login", "auth/refresh"].includes(route)) {
    const body = await readBody(request);
    const db = client();
    const { data, error } = route === "auth/login"
      ? await db.auth.signInWithPassword({ email: requiredString(body, "email", 254).trim(), password: requiredString(body, "password", 1024) })
      : await db.auth.refreshSession({ refresh_token: requiredString(body, "refreshToken", 4096) });
    if (error?.status === 429) throw new MobileError(429, "Too many attempts. Try again later.");
    if (error && (!error.status || error.status >= 500)) throw new MobileError(502, "Sign-in is temporarily unavailable. Please try again.");
    if (error || !data.session) throw new MobileError(401, "Could not sign in. Check your details and email verification.");
    return { accessToken: data.session.access_token, refreshToken: data.session.refresh_token, expiresAt: data.session.expires_at };
  }

  const token = bearerToken(request);
  const db = client(token);
  const { data: { user }, error: userError } = await db.auth.getUser(token);
  if (userError || !user) throw new MobileError(401, "Please sign in again.");

  if (route === "auth/logout" && method === "POST") {
    const { error } = await db.auth.admin.signOut(token, "local");
    check(error);
    return { ok: true };
  }
  if (route === "bootstrap" && method === "GET") {
    const profile = await profileFor(db, user);
    return { profile: { id: user.id, displayName: profile.display_name, email: user.email ?? "" }, filters: filtersFromProfile(profile) };
  }
  if (route === "sessions" && method === "GET") {
    const { data: members, error } = await db.from("session_participants").select("session_id")
      .eq("user_id", user.id).not("saved_at", "is", null).order("saved_at", { ascending: false }).limit(20);
    check(error);
    if (!members?.length) return { sessions: [] };
    const { data, error: sessionError } = await db.from("sessions").select(sessionFields)
      .in("id", members.map((row) => row.session_id)).order("created_at", { ascending: false });
    check(sessionError);
    return { sessions: (data ?? []).map((session) => sessionDTO(session, true, user.id)) };
  }
  if (route === "sessions" && method === "POST") {
    const body = await readBody(request);
    const duration = durationFromBody(body);
    const title = requiredString({ title: body.title ?? "Movie night" }, "title", 80).trim();
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const now = new Date();
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = `VIBE-${Array.from({ length: 4 }, () => alphabet[randomInt(alphabet.length)]).join("")}`;
      const { data: session, error } = await db.from("sessions").insert({
        code, creator_id: user.id, title, status: "live", duration_seconds: duration,
        filters: filtersFromUnknown(body.filters), starts_at: now.toISOString(),
        expires_at: new Date(now.getTime() + duration * 1000).toISOString(),
      }).select(sessionFields).single();
      if (error?.code === "23505") continue;
      check(error);
      if (!session) throw new MobileError(502, "Could not create the session.");
      const { error: memberError } = await db.from("session_participants").upsert({
        session_id: session.id, user_id: user.id, role: "host", last_seen_at: now.toISOString(),
      }, { onConflict: "session_id,user_id", ignoreDuplicates: true });
      // Return the code on partial failure so the user can recover by joining it.
      if (memberError) throw new MobileError(502, `Your room was created. Join ${code} to reconnect.`);
      return { session: sessionDTO(session, false, user.id) };
    }
    throw new MobileError(503, "Could not allocate a room code. Please try again.");
  }
  if (route === "sessions/join" && method === "POST") {
    const body = await readBody(request);
    const code = normalizeSessionCode(requiredString(body, "code", 32));
    if (!/^VIBE-[A-Z0-9]{4}$/.test(code)) throw new MobileError(400, "Enter a code such as VIBE-ABCD.");
    const { data: session, error } = await db.from("sessions").select(sessionFields).eq("code", code).maybeSingle();
    check(error);
    if (!session) throw new MobileError(404, "No session found for that code.");
    // Existing members may reopen results after the round has ended.
    const { data: member, error: readError } = await db.from("session_participants")
      .select("saved_at").eq("session_id", session.id).eq("user_id", user.id).maybeSingle();
    check(readError);
    if (!member) {
      requireLiveSession(session);
      const { error: joinError } = await db.from("session_participants").upsert({
        session_id: session.id, user_id: user.id,
        role: session.creator_id === user.id ? "host" : "participant", last_seen_at: new Date().toISOString(),
      }, { onConflict: "session_id,user_id", ignoreDuplicates: true });
      check(joinError);
    }
    return { session: sessionDTO(session, Boolean(member?.saved_at), user.id) };
  }
  if (path[0] === "sessions" && path.length === 2 && method === "GET") {
    return snapshot(db, user.id, path[1], new URL(request.url).searchParams.get("includeMovies") !== "false");
  }
  if (path[0] === "sessions" && path.length === 3 && method === "POST") {
    const { session } = await memberSession(db, user.id, path[1]);
    const body = await readBody(request);
    if (path[2] === "swipes") {
      requireLiveSession(session);
      const movieId = requiredString(body, "movieId", 100);
      const intent = swipeIntent(body);
      const { data: movie, error: movieError } = await db.from("movies").select("id").eq("id", movieId).maybeSingle();
      check(movieError);
      if (!movie) throw new MobileError(404, "Movie is no longer available. Refresh the deck.");
      // First decision wins. Network retries never create duplicate swipes.
      const { error } = await db.from("swipes").upsert({
        session_id: session.id, user_id: user.id, movie_id: movieId, intent,
      }, { onConflict: "session_id,user_id,movie_id", ignoreDuplicates: true });
      check(error);
      return { ok: true };
    }
    if (path[2] === "save") {
      if (typeof body.saved !== "boolean") throw new MobileError(400, "saved must be a boolean.");
      const { data, error } = await db.from("session_participants").update({ saved_at: body.saved ? new Date().toISOString() : null })
        .eq("session_id", session.id).eq("user_id", user.id).select("session_id").maybeSingle();
      check(error);
      if (!data) throw new MobileError(403, "Could not update this session.");
      return { ok: true };
    }
    if (path[2] === "complete") {
      if (session.creator_id !== user.id) throw new MobileError(403, "Only the host can end this round.");
      const { data, error } = await db.from("sessions").update({ status: "complete", completed_at: new Date().toISOString() })
        .eq("id", session.id).eq("creator_id", user.id).select("id").maybeSingle();
      check(error);
      if (!data) throw new MobileError(403, "Could not end this session.");
      return { ok: true };
    }
  }
  throw new MobileError(404, "Endpoint not found.");
}
