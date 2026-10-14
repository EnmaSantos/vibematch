export class MobileError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function bearerToken(request: Request) {
  const match = /^Bearer ([^\s]+)$/i.exec(request.headers.get("authorization") ?? "");
  if (!match) throw new MobileError(401, "Please sign in again.");
  return match[1];
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new MobileError(415, "Send a JSON request body.");
  }
  // Bound actual bytes, including requests without Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new MobileError(400, "A JSON object is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 16_384) {
      await reader.cancel();
      throw new MobileError(413, "Request is too large.");
    }
    chunks.push(value);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw new MobileError(400, "A valid JSON object is required.");
  }
}

export function requiredString(body: Record<string, unknown>, key: string, max = 200) {
  const value = body[key];
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new MobileError(400, `Invalid ${key}.`);
  }
  return value;
}

export function durationFromBody(body: Record<string, unknown>) {
  const duration = body.durationSeconds ?? 180;
  if (typeof duration !== "number" || !Number.isInteger(duration) || duration < 60 || duration > 900) {
    throw new MobileError(400, "Session duration must be between 60 and 900 seconds.");
  }
  return duration;
}

export function requireLiveSession(session: { status: string; expires_at: string | null }) {
  if (session.status !== "live" || !session.expires_at || Date.parse(session.expires_at) <= Date.now() || !Number.isFinite(Date.parse(session.expires_at))) {
    throw new MobileError(409, "This round has ended. View your matches or start another round.");
  }
}

export function swipeIntent(body: Record<string, unknown>): "like" | "skip" {
  if (body.intent !== "like" && body.intent !== "skip") throw new MobileError(400, "Choose like or skip.");
  return body.intent;
}
