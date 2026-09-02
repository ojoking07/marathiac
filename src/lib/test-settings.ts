import { supabase } from "@/integrations/supabase/client";

export const MIN_TEST_QUESTIONS = 1;
export const MAX_TEST_QUESTIONS = 30;
export const DEFAULT_TEST_QUESTIONS = 10;

/** How many words the test asks. Set by teachers, read by everyone. */
export async function getTestQuestionCount(): Promise<number> {
  const { data, error } = await supabase
    .from("test_settings")
    .select("question_count")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.question_count ?? DEFAULT_TEST_QUESTIONS;
}

/** Admin-only (enforced by RLS). */
export async function setTestQuestionCount(count: number): Promise<number> {
  const clamped = Math.min(MAX_TEST_QUESTIONS, Math.max(MIN_TEST_QUESTIONS, Math.round(count)));
  const { data, error } = await supabase
    .from("test_settings")
    .update({ question_count: clamped })
    .eq("id", true)
    .select("question_count")
    .single();
  if (error) throw error;
  return data.question_count;
}
