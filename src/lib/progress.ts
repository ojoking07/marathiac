import { supabase } from "@/integrations/supabase/client";
import { WORDS } from "./words";

export interface WordProgressRow {
  word_id: number;
  attempts: number;
  correct: number;
  best_stars: number;
  mastered: boolean;
  last_seen: string;
}

export async function listProgress(): Promise<WordProgressRow[]> {
  const { data, error } = await supabase
    .from("word_progress")
    .select("word_id, attempts, correct, best_stars, mastered, last_seen");
  if (error) throw error;
  return (data ?? []) as WordProgressRow[];
}

/**
 * Record an attempt for a word. Updates attempts, correct, best_stars, and
 * flips mastered=true when the student reaches 4+ stars.
 */
export async function recordAttempt(wordId: number, stars: number, opts?: { spellingCorrect?: boolean }) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not signed in");

  // Read existing
  const { data: existing } = await supabase
    .from("word_progress")
    .select("*")
    .eq("user_id", user.user.id)
    .eq("word_id", wordId)
    .maybeSingle();

  const attempts = (existing?.attempts ?? 0) + 1;
  const correct  = (existing?.correct ?? 0) + (stars >= 3 || opts?.spellingCorrect ? 1 : 0);
  const bestStars = Math.max(existing?.best_stars ?? 0, stars);
  const mastered = bestStars >= 4;

  const row = {
    user_id: user.user.id,
    word_id: wordId,
    attempts, correct, best_stars: bestStars, mastered,
    last_seen: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("word_progress")
    .upsert(row, { onConflict: "user_id,word_id" });
  if (error) throw error;
}

/**
 * Choose N words for a progressive test — least-mastered first.
 * Falls back to random when the student has no progress yet.
 */
export function pickTestWords(progress: WordProgressRow[], count = 10) {
  const byId = new Map<number, WordProgressRow>();
  for (const p of progress) byId.set(p.word_id, p);

  const scored = WORDS.map(w => {
    const p = byId.get(w.id);
    if (!p) return { w, score: -1 };           // never seen → highest priority
    if (p.mastered) return { w, score: 1000 };  // deprioritise mastered
    return { w, score: p.best_stars * 100 - p.attempts }; // low stars > low attempts
  });
  scored.sort((a, b) => a.score - b.score);
  // Shuffle within the top slice for variety.
  const pool = scored.slice(0, Math.max(count, 15)).map(s => s.w);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
