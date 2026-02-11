import { createServerClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import StarRating from "@/components/StarRating";

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single();

  if (!game) {
    notFound();
  }

  // Fetch rating stats for this game
  const { data: ratingsData } = await supabase
    .from("ratings")
    .select("score")
    .eq("game_id", id);

  const totalRatings = ratingsData?.length || 0;
  const averageRating =
    totalRatings > 0
      ? ratingsData!.reduce((sum, r) => sum + r.score, 0) / totalRatings
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="text-gray-400 hover:text-white mb-6 inline-flex items-center gap-2">
        &larr; Back to Hub
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        {/* Game Player */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
            <iframe
              src={game.url}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen; keyboard"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>

          {/* Star Rating */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Ratings</h2>
            <StarRating
              gameId={game.id}
              averageRating={averageRating}
              totalRatings={totalRatings}
            />
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <div>
            <span className="inline-block rounded-full bg-neon/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-neon border border-neon/30 mb-3">
              {game.genre}
            </span>
            <h1 className="text-4xl font-black text-white">{game.title}</h1>
            <p className="mt-1 text-gray-400">Created by <span className="text-white font-medium">{game.creator_name}</span></p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-3">Description</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {game.description}
            </p>
          </div>

          <div className="flex gap-4">
            <a
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 btn-primary py-3 text-center"
            >
              Open Fullscreen &#x2197;
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
