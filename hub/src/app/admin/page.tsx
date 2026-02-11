"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { Game } from "@/lib/types";

export default function AdminPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchPendingGames();
  }, []);

  async function fetchPendingGames() {
    setLoading(true);
    const { data } = await supabase
      .from("games")
      .select("*")
      .eq("status", "pending" as any)
      .order("created_at", { ascending: true });

    setGames((data as Game[]) || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: "approved" | "rejected") {
    try {
      const res = await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      setGames(games.filter((g) => g.id !== id));
    } catch (err) {
      alert("Failed to update game status");
      console.error(err);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-black">
        Moderation <span className="text-neon">Queue</span>
      </h1>

      {loading ? (
        <p className="text-gray-400">Loading pending games...</p>
      ) : games.length === 0 ? (
        <p className="text-gray-400">Queue is empty. Good job!</p>
      ) : (
        <div className="grid gap-6">
          {games.map((game) => (
            <div
              key={game.id}
              className="rounded-xl border border-white/10 bg-white/5 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div>
                <h2 className="text-xl font-bold">{game.title}</h2>
                <p className="text-sm text-gray-400 mb-2">
                  by {game.creator_name} &bull; {game.genre}
                </p>
                <p className="text-sm line-clamp-2 max-w-2xl">
                  {game.description}
                </p>
                <a
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline mt-2 inline-block"
                >
                  View Game Site &#x2197;
                </a>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => updateStatus(game.id, "approved")}
                  className="bg-neon text-black px-4 py-2 rounded-lg font-bold hover:bg-neon/80 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => updateStatus(game.id, "rejected")}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
