import { supabase } from "@/integrations/supabase/client";

export interface WordMeaning {
  id: string;
  user_id: string;
  word_id: number;
  word: string;
  meaning: string;
  updated_at: string;
}

/** The signed-in student's own private meanings. */
export async function listMyMeanings(): Promise<WordMeaning[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from("word_meanings")
    .select("id, user_id, word_id, word, meaning, updated_at")
    .eq("user_id", auth.user.id)
    .order("word_id");
  if (error) throw error;
  return (data ?? []) as WordMeaning[];
}

export async function saveMeaning(wordId: number, word: string, meaning: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not signed in");
  const trimmed = meaning.trim();
  if (!trimmed) {
    const { error } = await supabase
      .from("word_meanings")
      .delete()
      .eq("user_id", auth.user.id)
      .eq("word_id", wordId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("word_meanings")
    .upsert(
      { user_id: auth.user.id, word_id: wordId, word, meaning: trimmed },
      { onConflict: "user_id,word_id" },
    );
  if (error) throw error;
}

export async function isAdmin(): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export interface StudentMeanings {
  userId: string;
  name: string;
  grade: string;
  village: string;
  meanings: WordMeaning[];
}

/** Admin-only: every student's meanings, grouped by student. RLS enforces access. */
export async function listAllMeanings(): Promise<StudentMeanings[]> {
  const [{ data: rows, error }, { data: profiles }] = await Promise.all([
    supabase
      .from("word_meanings")
      .select("id, user_id, word_id, word, meaning, updated_at")
      .order("word_id"),
    supabase.from("profiles").select("id, name, grade, village"),
  ]);
  if (error) throw error;

  const byUser = new Map<string, WordMeaning[]>();
  for (const r of (rows ?? []) as WordMeaning[]) {
    const list = byUser.get(r.user_id) ?? [];
    list.push(r);
    byUser.set(r.user_id, list);
  }
  return [...byUser.entries()]
    .map(([userId, meanings]) => {
      const p = (profiles ?? []).find(x => x.id === userId);
      return {
        userId,
        name: p?.name || "Unnamed student",
        grade: p?.grade || "",
        village: p?.village || "",
        meanings,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
