"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

interface StarRatingProps {
  gameId: string;
  averageRating: number;
  totalRatings: number;
}

export default function StarRating({
  gameId,
  averageRating,
  totalRatings,
}: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (selectedStar === 0) {
      setError("Please select a rating.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("ratings")
        .insert({
          game_id: gameId,
          score: selectedStar,
          comment: comment.trim(),
        });

      if (insertError) throw insertError;
      setSubmitted(true);
    } catch (err) {
      setError("Failed to submit rating. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Average rating display */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`h-5 w-5 ${
                star <= Math.round(averageRating)
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
        <span className="text-sm text-gray-400">
          {averageRating > 0
            ? `${averageRating.toFixed(1)} / 5`
            : "No ratings yet"}{" "}
          ({totalRatings} {totalRatings === 1 ? "rating" : "ratings"})
        </span>
      </div>

      {/* Rating form */}
      {submitted ? (
        <div className="rounded-lg border border-neon/30 bg-neon/10 p-4">
          <p className="text-sm font-medium text-neon">
            Thank you for your rating!
          </p>
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-white/10 bg-gray-900/50 p-4">
          <p className="text-sm font-medium text-gray-300">Rate this game</p>

          {/* Clickable stars */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setSelectedStar(star)}
                className="transition-transform hover:scale-110"
              >
                <svg
                  className={`h-7 w-7 transition-colors ${
                    star <= (hoveredStar || selectedStar)
                      ? "text-yellow-400"
                      : "text-gray-600"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
            {selectedStar > 0 && (
              <span className="ml-2 text-sm text-gray-400">
                {selectedStar} / 5
              </span>
            )}
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave a comment (optional)"
            rows={2}
            className="input-field resize-none text-sm"
          />

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || selectedStar === 0}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      )}
    </div>
  );
}
