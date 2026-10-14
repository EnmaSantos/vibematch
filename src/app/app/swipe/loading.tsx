import { LoaderCircle } from "lucide-react";

export default function SwipeLoading() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <div className="mb-8 text-center" role="status" aria-live="polite">
        <span className="mx-auto mb-4 block size-8 animate-spin text-[#f0b44c] motion-reduce:animate-none" aria-hidden="true">
          <LoaderCircle className="size-8" />
        </span>
        <h1 className="text-2xl font-black text-[#fff8ee]">
          Getting your movie deck ready…
        </h1>
        <p className="mt-2 text-sm text-[#aeb7c7]">
          Finding picks for this session.
        </p>
      </div>
      <div
        className="mx-auto h-[430px] max-w-[500px] animate-pulse rounded-3xl border border-white/10 bg-gradient-to-br from-[#202a40] via-[#161d2c] to-[#090b11] motion-reduce:animate-none"
        aria-hidden="true"
      />
    </main>
  );
}
