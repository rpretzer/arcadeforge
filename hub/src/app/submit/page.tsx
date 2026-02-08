"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import type { Genre } from "@/lib/types";
import Link from "next/link";

export default function SubmitPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [genre, setGenre] = useState<Genre>("runner");
  const [tags, setTags] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!url.trim()) {
      setError("Game URL is required.");
      return;
    }
    if (!creatorName.trim()) {
      setError("Creator name is required.");
      return;
    }

    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const { error: insertError } = await supabase.from("games").insert({
        title: title.trim(),
        description: description.trim(),
        url: url.trim(),
        genre,
        tags: parsedTags,
        creator_name: creatorName.trim(),
        thumbnail_url: thumbnailUrl.trim() || null,
        status: "pending",
      });

      if (insertError) throw insertError;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Failed to submit game. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <div className="rounded-xl border border-neon/30 bg-neon/5 p-10">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon/20">
            <svg
              className="h-8 w-8 text-neon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-white">
            Game Submitted!
          </h2>
          <p className="mb-6 text-gray-400">
            Your game has been submitted for review. It will appear on the hub
            once approved.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/" className="btn-secondary">
              Back to Hub
            </Link>
            <button
              onClick={() => {
                setSubmitted(false);
                setTitle("");
                setDescription("");
                setUrl("");
                setGenre("runner");
                setTags("");
                setCreatorName("");
                setThumbnailUrl("");
              }}
              className="btn-primary"
            >
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">
          Submit Your <span className="text-neon">Game</span>
        </h1>
        <p className="mt-2 text-gray-400">
          Share your browser game with the ArcadeForge community. Games are
          reviewed before appearing on the hub.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Game Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Awesome Game"
            className="input-field"
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your game, how to play, what makes it fun..."
            rows={4}
            className="input-field resize-none"
            maxLength={2000}
          />
        </div>

        {/* URL */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Game URL <span className="text-red-400">*</span>
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-game.example.com"
            className="input-field"
          />
          <p className="mt-1 text-xs text-gray-500">
            Direct link to your playable game
          </p>
        </div>

        {/* Genre */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Genre <span className="text-red-400">*</span>
          </label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value as Genre)}
            className="input-field"
          >
            <option value="runner">Runner</option>
            <option value="arena">Arena</option>
            <option value="puzzle">Puzzle</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="platformer, pixel-art, singleplayer"
            className="input-field"
          />
          <p className="mt-1 text-xs text-gray-500">
            Comma-separated tags to help players find your game
          </p>
        </div>

        {/* Creator Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Creator Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            placeholder="Your name or studio"
            className="input-field"
            maxLength={100}
          />
        </div>

        {/* Thumbnail URL */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-300">
            Thumbnail URL
          </label>
          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://example.com/thumbnail.png"
            className="input-field"
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional preview image for your game card
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Game for Review"}
        </button>
      </form>
    </div>
  );
}
