export interface Game {
  id: string;
  title: string;
  description: string;
  url: string;
  tags: string[];
  genre: "runner" | "arena" | "puzzle";
  thumbnail_url: string | null;
  creator_name: string;
  created_at: string;
  status: "pending" | "approved" | "rejected";
}

export interface Rating {
  id: string;
  game_id: string;
  score: number;
  comment: string;
  created_at: string;
}

export type Genre = Game["genre"];
export type GameStatus = Game["status"];
