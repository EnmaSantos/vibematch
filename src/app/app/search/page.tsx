import { Search, Film, Calendar, Clock, Star, Play } from "lucide-react";
import { fetchTrendingMovies, searchMovies } from "@/lib/tmdb";
import { redirect } from "next/navigation";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = (await searchParams) ?? {};
  const query = firstString(params.q) || "";
  const movies = query ? await searchMovies(query) : await fetchTrendingMovies();

  // Search action handler for Server Component form submit
  async function handleSearch(formData: FormData) {
    "use server";
    const q = formData.get("q")?.toString().trim() || "";
    redirect(`/app/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      {/* Header & Search Bar */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#fff8ee]">
            {query ? `Results for "${query}"` : "Trending Movies"}
          </h1>
          <p className="text-sm text-[#8f9bad]">
            {query ? `Found ${movies.length} matches from TMDB` : "What's popular on the couch today"}
          </p>
        </div>

        <form action={handleSearch} className="flex h-12 w-full max-w-md items-center gap-2 rounded-lg border border-white/12 bg-[#101722] px-3 focus-within:border-[#f0b44c]/60">
          <Search className="size-4 text-[#8f9bad]" />
          <input
            name="q"
            type="text"
            defaultValue={query}
            placeholder="Search movie titles..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[#fff8ee] outline-none placeholder:text-[#687386]"
          />
          <button type="submit" className="text-xs font-bold text-[#f0b44c] hover:underline">
            Search
          </button>
        </form>
      </div>

      {movies.length === 0 ? (
        <div className="rounded-xl border border-white/12 bg-[#101722] p-12 text-center">
          <Film className="mx-auto size-12 text-[#687386] mb-4" />
          <h2 className="text-xl font-bold">No movies found</h2>
          <p className="mt-2 text-sm text-[#8f9bad] max-w-md mx-auto">
            We couldn't find any movies matching "{query}". Try checking the spelling or searching for another title.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {movies.map((movie) => {
            const hasRealPoster = movie.poster_url && !movie.poster_url.includes("placeholder");
            const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A";
            
            return (
              <article
                key={movie.id}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#101722] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-black/40"
              >
                {/* Poster container */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/40">
                  {hasRealPoster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full flex-col justify-end p-4"
                      style={{
                        background: `linear-gradient(135deg, ${movie.posterTheme.from}, ${movie.posterTheme.via}, ${movie.posterTheme.to})`,
                      }}
                    >
                      <Film className="size-8 text-white/40 mb-2" />
                      <p className="text-lg font-black text-white">{movie.title}</p>
                    </div>
                  )}
                  
                  {/* Rating Badge */}
                  <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs font-bold text-[#f0b44c] backdrop-blur-sm">
                    <Star className="size-3 fill-[#f0b44c] text-[#f0b44c]" />
                    {movie.tmdb_rating}
                  </div>
                </div>

                {/* Info block */}
                <div className="p-4">
                  <h2 className="line-clamp-1 text-base font-black text-[#fff8ee] group-hover:text-[#f0b44c] transition-colors">
                    {movie.title}
                  </h2>
                  
                  <div className="mt-1 flex items-center gap-3 text-xs text-[#8f9bad] font-bold">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {releaseYear}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {movie.runtime_minutes}m
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#aeb7c7]">
                    {movie.overview}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {movie.genres.slice(0, 2).map((g) => (
                      <span key={g} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[#aeb7c7] font-bold">
                        {g}
                      </span>
                    ))}
                  </div>

                  {/* Watch Providers */}
                  {movie.watch_providers && movie.watch_providers.length > 0 ? (
                    <div className="mt-4 border-t border-white/5 pt-3">
                      <p className="text-[10px] font-bold uppercase text-[#687386] mb-2">Available on (US):</p>
                      <div className="flex flex-wrap gap-2">
                        {movie.watch_providers
                          .filter((p, index, self) => self.findIndex(t => t.provider_name === p.provider_name) === index) // Unique
                          .slice(0, 3)
                          .map((provider) => (
                            <span
                              key={provider.id}
                              className="inline-flex h-6 items-center rounded bg-emerald-500/10 border border-emerald-500/20 px-2 text-[10px] font-bold text-emerald-300"
                            >
                              {provider.provider_name}
                            </span>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 border-t border-white/5 pt-3">
                      <p className="text-[10px] font-bold text-[#687386]">Check local stream listings</p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
