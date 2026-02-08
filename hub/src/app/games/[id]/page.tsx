import { createServerClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function GamePage({ params }: { params: { id: string } }) {
  const supabase = createServerClient();
  
  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!game) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="text-gray-400 hover:text-white mb-6 inline-flex items-center gap-2">
        ← Back to Hub
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        {/* Game Player */}
        <div className="lg:col-span-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
            <iframe
              src={game.url}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen; keyboard"
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
              Open Fullscreen ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}