const OMDB_API_KEY = process.env.OMDB_API_KEY || "326ff20d";
const BASE_URL = "https://www.omdbapi.com/";

export type OmdbRatings = {
  imdbRating?: string;
  rottenTomatoesRating?: string;
  metacriticRating?: string;
  director?: string;
  actors?: string;
  writer?: string;
  rated?: string;
};

export async function fetchOmdbDetails(imdbId: string): Promise<OmdbRatings | null> {
  if (!imdbId || !imdbId.startsWith("tt")) return null;

  try {
    const res = await fetch(`${BASE_URL}?apikey=${OMDB_API_KEY}&i=${imdbId}`, {
      next: { revalidate: 86400 }, // Cache details for 24 hours
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.Response === "False") return null;

    const ratings = data.Ratings || [];
    const rtRating = ratings.find((r: any) => r.Source === "Rotten Tomatoes")?.Value;
    const metaRating = ratings.find((r: any) => r.Source === "Metacritic")?.Value;

    return {
      imdbRating: data.imdbRating && data.imdbRating !== "N/A" ? `${data.imdbRating}/10` : undefined,
      rottenTomatoesRating: rtRating,
      metacriticRating: metaRating,
      director: data.Director !== "N/A" ? data.Director : undefined,
      actors: data.Actors !== "N/A" ? data.Actors : undefined,
      writer: data.Writer !== "N/A" ? data.Writer : undefined,
      rated: data.Rated !== "N/A" ? data.Rated : undefined,
    };
  } catch (error) {
    console.error("Error fetching from OMDB API:", error);
    return null;
  }
}
