import { createClient } from "@/lib/supabase";
import GameCard from "@/components/GameCard";
import type { Game } from "@/lib/types";
import Link from "next/link";

const genres = ["all", "runner", "arena", "puzzle"] as const;

interface HomePageProps {
  searchParams: { genre?: string };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const selectedGenre = searchParams.genre || "all";

  let games: Game[] = [];
  let ratingsMap: Record<string, number> = {};

  try {
    const supabase = createClient();

    // Fetch approved games
    let query = supabase
      .from("games")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

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

      {/* Games grid */}
      {games.length > 0 ? (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              averageRating={ratingsMap[game.id]}
            />
          ))}
        </section>
      ) : (
        <section className="py-20 text-center">
          <div className="mx-auto max-w-md space-y-4">
            <div className="text-5xl">🎮</div>
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
