import { supabase } from "@/integrations/supabase/client";

export interface SavedSentence {
  id: string;
  word: string;
  sentence: string;
  stars: number;
  created_at: string;
}

export async function listSentences(): Promise<SavedSentence[]> {
  const { data, error } = await supabase
    .from("sentences")
    .select("id, word, sentence, stars, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavedSentence[];
}

export async function addSentence(word: string, sentence: string, stars: number) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not signed in");
  const { error } = await supabase.from("sentences").insert({
    user_id: user.user.id, word, sentence, stars,
  });
  if (error) throw error;
}

export async function deleteSentence(id: string) {
  const { error } = await supabase.from("sentences").delete().eq("id", id);
  if (error) throw error;
}
