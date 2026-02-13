import { createServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const ALLOWED_GENRES = [
  "runner",
  "arena",
  "puzzle",
  "story",
  "rpg",
  "tower-defense",
  "racing",
] as const;

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, url, genre, creator_name, tags } = body;

    if (!title || !url || !genre || !creator_name) {
      return NextResponse.json(
        { error: "Missing required fields: title, url, genre, creator_name" },
        { status: 400 }
      );
    }

    if (typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "title must be a non-empty string" }, { status: 400 });
    }

    if (!ALLOWED_GENRES.includes(genre)) {
      return NextResponse.json(
        { error: `genre must be one of: ${ALLOWED_GENRES.join(", ")}` },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: "url must be a valid http or https URL" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase.from("games").insert({
      title: String(title).trim(),
      description: typeof description === "string" ? description : "",
      url: String(url).trim(),
      genre,
      creator_name: String(creator_name).trim(),
      tags: Array.isArray(tags) ? tags : [],
      status: "pending",
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, gameId: data.id });
  } catch (error: unknown) {
    console.error("API Submission Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
