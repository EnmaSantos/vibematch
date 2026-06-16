import { Search, Film } from "lucide-react";
import { fetchTrendingMovies, searchMovies } from "@/lib/tmdb";
import { redirect } from "next/navigation";
import MovieCard from "@/components/MovieCard";

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
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </main>
  );
}
