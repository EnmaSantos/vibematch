"use client";

import { useState } from "react";
import { Film, Calendar, Clock, Star, Play } from "lucide-react";
import { MediaItem } from "@/lib/vibematch-data";
import MovieDetailsModal from "./MovieDetailsModal";

interface MovieCardProps {
  movie: MediaItem;
}

export default function MovieCard({ movie }: MovieCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasRealPoster = movie.poster_url && !movie.poster_url.includes("placeholder");
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A";

  return (
    <>
      <article
        onClick={() => setIsOpen(true)}
        className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#101722] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-black/40 cursor-pointer"
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
                background: `linear-gradient(135deg, ${movie.posterTheme?.from || "#0f172a"}, ${movie.posterTheme?.via || "#1e293b"}, ${movie.posterTheme?.to || "#475569"})`,
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

          {/* Quick preview overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
            <span className="flex items-center gap-1.5 rounded-lg bg-[#f0b44c] px-3.5 py-2 text-xs font-bold text-[#18100b] shadow-lg shadow-[#f0b44c]/20">
              <Play className="size-3.5 fill-[#18100b]" /> View Details
            </span>
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

      {/* Render Modal */}
      {isOpen ? (
        <MovieDetailsModal movie={movie} onClose={() => setIsOpen(false)} />
      ) : null}
    </>
  );
}
