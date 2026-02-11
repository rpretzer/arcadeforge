"use client";

import { useState } from "react";
import GameCard from "./GameCard";
import type { Game } from "@/lib/types";

interface GamesSearchProps {
  games: Game[];
  ratingsMap: Record<string, number>;
}

export default function GamesSearch({ games, ratingsMap }: GamesSearchProps) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? games.filter((g) =>
        g.title.toLowerCase().includes(search.toLowerCase())
      )
    : games;

  return (
    <>
      {/* Search input */}
      <section className="mb-8">
        <div className="mx-auto max-w-md">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games by title..."
              className="input-field pl-10"
            />
          </div>
        </div>
      </section>

      {/* Games grid */}
      {filtered.length > 0 ? (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              averageRating={ratingsMap[game.id]}
            />
          ))}
        </section>
      ) : (
        search.trim() && (
          <section className="py-12 text-center">
            <p className="text-gray-500">
              No games matching &ldquo;{search}&rdquo;
            </p>
          </section>
        )
      )}
    </>
  );
}
