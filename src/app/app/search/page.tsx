import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, Film } from "lucide-react";
import {
  fetchMovieCatalogPage,
  MAX_CATALOG_PAGES,
  searchMovies,
} from "@/lib/tmdb";
import { redirect } from "next/navigation";
import MovieCard from "@/components/MovieCard";

type SearchPageProps = {
  searchParams?: Promise<{
    page?: string | string[];
    q?: string | string[];
  }>;
};

function firstString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pageNumber(value: string | undefined) {
  const page = Number(value);
  return Number.isInteger(page)
    ? Math.min(Math.max(page, 1), MAX_CATALOG_PAGES)
    : 1;
}

function searchHref(query: string, page: number) {
  const params = new URLSearchParams({ page: String(page) });
  if (query) params.set("q", query);

  return `/app/search?${params.toString()}`;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = (await searchParams) ?? {};
  const query = firstString(params.q) || "";
  const requestedPage = pageNumber(firstString(params.page));
  const result = query
    ? await searchMovies(query, requestedPage)
    : await fetchMovieCatalogPage(requestedPage);
  const { currentPage, movies, totalPages, totalResults } = result;

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
            {query ? `Results for "${query}"` : "Popular Movies"}
          </h1>
          <p className="text-sm text-[#8f9bad]">
            {totalResults > 0
              ? `Page ${currentPage} of ${totalPages} · ${totalResults.toLocaleString()} titles`
              : "No titles available right now"}
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
            We could not find any movies matching &ldquo;{query}&rdquo;. Try checking the spelling or searching for another title.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              aria-label="Movie result pages"
              className="mt-10 flex items-center gap-2 overflow-x-auto pb-2"
            >
              <Link
                href={searchHref(query, Math.max(currentPage - 1, 1))}
                aria-disabled={currentPage === 1}
                className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg border text-sm font-black transition ${
                  currentPage === 1
                    ? "pointer-events-none border-white/5 text-[#4f5968]"
                    : "border-white/12 bg-white/5 text-[#fff8ee] hover:bg-white/10"
                }`}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                <span className="sr-only">Previous page</span>
              </Link>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <Link
                    key={page}
                    href={searchHref(query, page)}
                    aria-current={page === currentPage ? "page" : undefined}
                    className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg border text-sm font-black transition ${
                      page === currentPage
                        ? "border-[#f0b44c] bg-[#f0b44c] text-[#18100b]"
                        : "border-white/12 bg-white/5 text-[#fff8ee] hover:bg-white/10"
                    }`}
                  >
                    {page}
                  </Link>
                ),
              )}

              <Link
                href={searchHref(query, Math.min(currentPage + 1, totalPages))}
                aria-disabled={currentPage === totalPages}
                className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg border text-sm font-black transition ${
                  currentPage === totalPages
                    ? "pointer-events-none border-white/5 text-[#4f5968]"
                    : "border-white/12 bg-white/5 text-[#fff8ee] hover:bg-white/10"
                }`}
              >
                <ChevronRight className="size-4" aria-hidden="true" />
                <span className="sr-only">Next page</span>
              </Link>
            </nav>
          ) : null}
        </>
      )}
    </main>
  );
}
