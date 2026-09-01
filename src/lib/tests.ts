import { supabase } from "@/integrations/supabase/client";

export interface AttemptDetail {
  word: string;
  pronunciation: string;
  english: string;
  sentence: string;
  spelling_correct: boolean;
  grammar_stars: number;
  points: number;
  issues: string[];
}

export interface TestAttempt {
  id: string;
  user_id: string;
  score: number;
  max_score: number;
  duration_sec: number;
  created_at: string;
  details: AttemptDetail[];
  integrity: { violations?: string[]; duration_used?: number };
}

function normalize(row: Record<string, unknown>): TestAttempt {
  return {
    id: String(row['id']),
    user_id: String(row['user_id']),
    score: Number(row['score'] ?? 0),
    max_score: Number(row['max_score'] ?? 0),
    duration_sec: Number(row['duration_sec'] ?? 0),
    created_at: String(row['created_at']),
    details: (row['details'] as AttemptDetail[]) ?? [],
    integrity: (row['integrity'] as TestAttempt["integrity"]) ?? {},
  };
}

/** The signed-in student's own attempts, newest first. */
export async function listMyAttempts(): Promise<TestAttempt[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await supabase
    .from("test_attempts")
    .select("id, user_id, score, max_score, duration_sec, created_at, details, integrity")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(r => normalize(r as unknown as Record<string, unknown>));
}

export interface StudentAttempts {
  userId: string;
  name: string;
  grade: string;
  village: string;
  attempts: TestAttempt[];
}

/** Admin-only: every student's test attempts, grouped by student. RLS enforces access. */
export async function listAllAttempts(): Promise<StudentAttempts[]> {
  const [{ data: rows, error }, { data: profiles }] = await Promise.all([
    supabase
      .from("test_attempts")
      .select("id, user_id, score, max_score, duration_sec, created_at, details, integrity")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, name, grade, village"),
  ]);
  if (error) throw error;

  const byUser = new Map<string, TestAttempt[]>();
  for (const raw of rows ?? []) {
    const a = normalize(raw as unknown as Record<string, unknown>);
    const list = byUser.get(a.user_id) ?? [];
    list.push(a);
    byUser.set(a.user_id, list);
  }
  return [...byUser.entries()]
    .map(([userId, attempts]) => {
      const p = (profiles ?? []).find(x => x.id === userId);
      return {
        userId,
        name: p?.name || "Unnamed student",
        grade: p?.grade || "",
        village: p?.village || "",
        attempts,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
