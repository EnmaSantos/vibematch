import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { readFileSync } from "node:fs";
import { handleMobileRequest } from "../src/lib/mobile/api";
import { bearerToken, durationFromBody, readBody, requireLiveSession, swipeIntent } from "../src/lib/mobile/validation";

const originalFetch = globalThis.fetch;
const originalURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const userId = "00000000-0000-4000-8000-000000000001";
const sessionId = "00000000-0000-4000-8000-000000000002";

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalURL === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalURL;
  if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
});

function request(path: string, body?: unknown, token = "test-access-token") {
  return new Request(`https://app.example.com/api/mobile/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

function mockBackend(reply: (url: URL, init?: RequestInit) => unknown) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  const writes: string[] = [];
  globalThis.fetch = (async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.host, "project.supabase.co", "tests must never access a live server");
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer test-access-token");
    if (url.pathname === "/auth/v1/user") return Response.json({ id: userId, email: "test@example.com", user_metadata: {} });
    if (init?.method && init.method !== "GET") writes.push(`${init.method} ${url.pathname}`);
    return Response.json(reply(url, init));
  }) as typeof fetch;
  return writes;
}

test("private endpoints reject missing bearer tokens without contacting Supabase", async () => {
  globalThis.fetch = () => { throw new Error("must not fetch"); };
  const response = await handleMobileRequest(new Request("https://app.example.com/api/mobile/v1/bootstrap"), ["bootstrap"]);
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("rejects malformed tokens, invalid durations, malformed and oversized JSON", async () => {
  assert.throws(() => bearerToken(new Request("https://example.com", { headers: { Authorization: "Bearer token extra" } })));
  for (const durationSeconds of [0, 59, 901, "180", 60.5, NaN]) assert.throws(() => durationFromBody({ durationSeconds }));
  assert.equal(durationFromBody({}), 180);
  assert.throws(() => swipeIntent({ intent: "love" }));
  await assert.rejects(readBody(request("sessions", [])));
  await assert.rejects(readBody(request("sessions", { title: "x".repeat(17_000) })), /too large/);
  await assert.rejects(readBody(new Request("https://example.com", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" })), /valid JSON/);
});

test("expired, complete and malformed rounds cannot accept swipes", () => {
  for (const expires_at of [null, "invalid", "2020-01-01T00:00:00Z"]) assert.throws(() => requireLiveSession({ status: "live", expires_at }));
  assert.throws(() => requireLiveSession({ status: "complete", expires_at: "2999-01-01T00:00:00Z" }));
  assert.doesNotThrow(() => requireLiveSession({ status: "live", expires_at: "2999-01-01T00:00:00Z" }));
});

test("a non-member cannot read matches or write another session's swipes", async () => {
  const writes = mockBackend((url) => {
    assert.equal(url.pathname, "/rest/v1/session_participants");
    assert.equal(url.searchParams.get("user_id"), `eq.${userId}`);
    return null;
  });
  for (const [path, body] of [[`sessions/${sessionId}`, undefined], [`sessions/${sessionId}/swipes`, { movieId: "tmdb-329865", intent: "like" }]] as const) {
    const response = await handleMobileRequest(request(path, body), path.split("/"));
    assert.equal(response.status, 403);
  }
  assert.deepEqual(writes, []);
});

test("membership does not give a guest permission to end a host's round", async () => {
  const writes = mockBackend((url) => url.pathname.endsWith("session_participants") ? { saved_at: null } : { id: sessionId, creator_id: "another-user", status: "live" });
  const path = `sessions/${sessionId}/complete`;
  const response = await handleMobileRequest(request(path, {}), path.split("/"));
  assert.equal(response.status, 403);
  assert.deepEqual(writes, []);
});

test("the API rejects swipes when the server's session has expired", async () => {
  const writes = mockBackend((url) => url.pathname.endsWith("session_participants") ? { saved_at: null } : { id: sessionId, creator_id: userId, status: "live", expires_at: "2020-01-01T00:00:00Z" });
  const path = `sessions/${sessionId}/swipes`;
  const response = await handleMobileRequest(request(path, { movieId: "tmdb-329865", intent: "like" }), path.split("/"));
  assert.equal(response.status, 409);
  assert.deepEqual(writes, []);
});

test("swipe retries use an idempotent key and the authenticated user ID", async () => {
  let swipeBody: Record<string, unknown> = {};
  const writes = mockBackend((url, init) => {
    if (url.pathname.endsWith("session_participants")) return { saved_at: null };
    if (url.pathname.endsWith("sessions")) return { id: sessionId, status: "live", expires_at: "2999-01-01T00:00:00Z" };
    if (url.pathname.endsWith("movies")) return { id: "tmdb-329865" };
    assert.equal(url.pathname, "/rest/v1/swipes");
    assert.equal(url.searchParams.get("on_conflict"), "session_id,user_id,movie_id");
    assert.match(new Headers(init?.headers).get("prefer") ?? "", /resolution=ignore-duplicates/);
    swipeBody = JSON.parse(String(init?.body));
    return {};
  });
  const path = `sessions/${sessionId}/swipes`;
  const response = await handleMobileRequest(request(path, { movieId: "tmdb-329865", intent: "like", user_id: "forged-id" }), path.split("/"));
  assert.equal(response.status, 200);
  assert.equal(swipeBody.user_id, userId);
  assert.deepEqual(writes, ["POST /rest/v1/swipes"]);
});

test("live match responses decode to the same field contract as both native clients", async () => {
  const fixture = JSON.parse(readFileSync("mobile/shared/demo.json", "utf8"));
  const movie = fixture.movies[0];
  mockBackend((url) => {
    if (url.pathname.endsWith("session_participants")) {
      return url.searchParams.has("user_id") ? { saved_at: null } : [{ user_id: userId }, { user_id: "partner" }];
    }
    if (url.pathname.endsWith("sessions")) return { id: sessionId, code: "VIBE-ABCD", title: "Movie night", creator_id: userId,
      status: "complete", duration_seconds: 180, expires_at: "2020-01-01T00:00:00Z", filters: fixture.session.filters };
    if (url.pathname.endsWith("swipes")) return [userId, "partner"].map(user_id => ({ user_id, movie_id: movie.id, intent: "like" }));
    return [{ id: movie.id, title: movie.title, overview: movie.overview, poster_url: null, release_date: `${movie.year}-01-01`,
      runtime_minutes: movie.runtimeMinutes, genres: movie.genres, tmdb_rating: movie.rating, watch_providers: [] }];
  });
  const path = `sessions/${sessionId}`;
  const response = await handleMobileRequest(request(path), path.split("/"));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.deepEqual(Object.keys(result).sort(), Object.keys(fixture).sort());
  assert.deepEqual(Object.keys(result.session).sort(), Object.keys(fixture.session).sort());
  assert.deepEqual(Object.keys(result.matches[0].movie).sort(), Object.keys(movie).sort());
  assert.equal(result.matches[0].kind, "perfect");
  assert.equal(result.participantCount, 2);
});
