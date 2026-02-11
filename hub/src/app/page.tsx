import { createServerClient } from "@/lib/supabase-server";
import GameCard from "@/components/GameCard";
import GamesSearch from "@/components/GamesSearch";
import type { Game } from "@/lib/types";
import Link from "next/link";

const genres = ["all", "runner", "arena", "puzzle"] as const;

const GAMES_PER_PAGE = 12;

interface HomePageProps {
  searchParams: Promise<{ genre?: string; page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const selectedGenre = params.genre || "all";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  let games: Game[] = [];
  let totalCount = 0;
  let ratingsMap: Record<string, number> = {};

  try {
    const supabase = await createServerClient();

    // Count total for pagination
    let countQuery = supabase
      .from("games")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");

    if (selectedGenre !== "all") {
      countQuery = countQuery.eq("genre", selectedGenre);
    }

    const { count } = await countQuery;
    totalCount = count || 0;

    // Fetch approved games with pagination
    const offset = (currentPage - 1) * GAMES_PER_PAGE;
    let query = supabase
      .from("games")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .range(offset, offset + GAMES_PER_PAGE - 1);

    if (selectedGenre !== "all") {
      query = query.eq("genre", selectedGenre);
    }

    const { data: gamesData } = await query;
    games = (gamesData as Game[]) || [];

    // Fetch average ratings for all games
    if (games.length > 0) {
      const gameIds = games.map((g) => g.id);
      const { data: ratingsData } = await supabase
        .from("ratings")
        .select("game_id, score")
        .in("game_id", gameIds);

      if (ratingsData) {
        const grouped: Record<string, number[]> = {};
        for (const r of ratingsData) {
          if (!grouped[r.game_id]) grouped[r.game_id] = [];
          grouped[r.game_id].push(r.score);
        }
        for (const [gameId, scores] of Object.entries(grouped)) {
          ratingsMap[gameId] =
            scores.reduce((a, b) => a + b, 0) / scores.length;
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch games:", err);
  }

  const totalPages = Math.ceil(totalCount / GAMES_PER_PAGE);
  const genreParam = selectedGenre !== "all" ? `&genre=${selectedGenre}` : "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero section */}
      <section className="mb-16 text-center">
        <h1 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
          <span className="text-neon">Arcade</span>
          <span className="text-white">Forge</span>{" "}
          <span className="text-accent">Hub</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
          Discover and play browser games built by the community
        </p>
        <div className="mt-8">
          <Link href="/submit" className="btn-primary text-base px-8 py-3">
            Submit Your Game
          </Link>
        </div>
      </section>

      {/* Genre filter buttons */}
      <section className="mb-10">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {genres.map((genre) => {
            const isActive = selectedGenre === genre;
            return (
              <Link
                key={genre}
                href={genre === "all" ? "/" : `/?genre=${genre}`}
                className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition-all ${
                  isActive
                    ? "bg-neon text-black shadow-neon"
                    : "border border-white/15 text-gray-400 hover:border-neon/40 hover:text-neon"
                }`}
              >
                {genre}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Client-side search filter */}
      <GamesSearch games={games} ratingsMap={ratingsMap} />

      {/* Pagination */}
      {totalPages > 1 && (
        <section className="mt-10 flex items-center justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/?page=${currentPage - 1}${genreParam}`}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-gray-400 hover:border-neon/40 hover:text-neon transition-colors"
            >
              Previous
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={`/?page=${page}${genreParam}`}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                page === currentPage
                  ? "bg-neon text-black"
                  : "border border-white/15 text-gray-400 hover:border-neon/40 hover:text-neon"
              }`}
            >
              {page}
            </Link>
          ))}
          {currentPage < totalPages && (
            <Link
              href={`/?page=${currentPage + 1}${genreParam}`}
              className="rounded-lg border border-white/15 px-4 py-2 text-sm text-gray-400 hover:border-neon/40 hover:text-neon transition-colors"
            >
              Next
            </Link>
          )}
        </section>
      )}

      {/* Empty state (only if no games at all) */}
      {games.length === 0 && (
        <section className="py-20 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <h2 className="text-xl font-semibold text-gray-300">
              No games found
            </h2>
            <p className="text-sm text-gray-500">
              {selectedGenre !== "all"
                ? `No approved ${selectedGenre} games yet. Be the first to submit one!`
                : "No approved games yet. Be the first to submit one!"}
            </p>
            <Link href="/submit" className="btn-secondary inline-block mt-4">
              Submit a Game
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
