"use server";

import { fetchOmdbDetails, type OmdbRatings } from "@/lib/omdb";

export async function getMovieRatings(imdbId: string): Promise<OmdbRatings | null> {
  if (!imdbId) return null;
  return await fetchOmdbDetails(imdbId);
}
