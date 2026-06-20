import { refreshMovieCatalog } from "@/lib/tmdb";

export const maxDuration = 300;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    return Response.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshMovieCatalog();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Daily movie catalog refresh failed:", error);
    return Response.json(
      { error: "Movie catalog refresh failed." },
      { status: 500 },
    );
  }
}
