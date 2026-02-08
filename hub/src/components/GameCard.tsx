import Link from "next/link";
import type { Game } from "@/lib/types";

const genreColors: Record<Game["genre"], string> = {
  runner: "bg-red-500/80",
  arena: "bg-blue-500/80",
  puzzle: "bg-emerald-500/80",
};

const genreBadgeColors: Record<Game["genre"], string> = {
  runner: "bg-red-500/20 text-red-400 border-red-500/30",
  arena: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  puzzle: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

interface GameCardProps {
  game: Game;
  averageRating?: number;
}

export default function GameCard({ game, averageRating }: GameCardProps) {
  return (
    <Link href={`/games/${game.id}`} className="group">
      <div className="card overflow-hidden">
        {/* Thumbnail placeholder */}
        <div
          className={`relative h-40 ${genreColors[game.genre]} flex items-center justify-center transition-transform group-hover:scale-[1.02]`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
          <span className="relative text-4xl font-black text-white/30 uppercase tracking-widest">
            {game.genre}
          </span>
        </div>

        {/* Card body */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-white leading-tight group-hover:text-neon transition-colors line-clamp-1">
              {game.title}
            </h3>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${genreBadgeColors[game.genre]}`}
            >
              {game.genre}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              by {game.creator_name}
            </span>

            {/* Star rating display */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`h-3.5 w-3.5 ${
                    averageRating && star <= Math.round(averageRating)
                      ? "text-yellow-400"
                      : "text-gray-600"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
