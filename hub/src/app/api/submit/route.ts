import { createServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, url, genre, creator_name, tags } = body;

    if (!title || !url || !genre || !creator_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    const { data, error } = await supabase.from("games").insert({
      title,
      description: description || "",
      url,
      genre,
      creator_name,
      tags: tags || [],
      status: "pending",
    }).select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, gameId: data.id });
  } catch (error: any) {
    console.error("API Submission Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
