import { WORDS } from "@/lib/words";
import { checkGrammar, checkSpelling } from "@/lib/grammar";
import type { ScoredAnswer, testSubmissionSchema } from "@/lib/test-scoring.schema";
import type { z } from "zod";

type Submission = z.infer<typeof testSubmissionSchema>;

export async function scoreTestSubmission(userId: string, data: Submission) {
  const results: ScoredAnswer[] = [];

  for (const a of data.answers) {
    const word = WORDS.find(w => w.id === a.wordId);
    if (!word) continue;
    const english = a.english.trim();
    const sentence = a.sentence.trim();
    const spell = checkSpelling(english, word.word);
    const gram = sentence
      ? checkGrammar(sentence, word.word)
      : { stars: 0, issues: [] as { message: string }[] };
    const points = (spell.correct ? 1 : 0) + (gram.stars === 5 ? 1 : 0);
    results.push({
      wordId: word.id,
      word: word.word,
      pronunciation: word.pronunciation,
      english,
      sentence,
      spellingCorrect: spell.correct,
      ...(spell.hint ? { spellingHint: spell.hint } : {}),
      grammarStars: gram.stars,
      grammarIssues: gram.issues.map(i => i.message),
      points,
    });
  }

  const score = results.reduce((s, r) => s + r.points, 0);
  const maxScore = results.length * 2;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("test_attempts").insert({
    user_id: userId,
    score,
    max_score: maxScore,
    details: results.map(r => ({
      word: r.word,
      pronunciation: r.pronunciation,
      english: r.english,
      sentence: r.sentence,
      spelling_correct: r.spellingCorrect,
      grammar_stars: r.grammarStars,
      points: r.points,
      issues: r.grammarIssues,
    })),
    integrity: { violations: data.violations, duration_used: data.durationSec },
    duration_sec: data.durationSec,
  });
  if (error) {
    console.error("test_attempts insert failed", error);
    throw new Error("Could not save your test attempt.");
  }

  return { score, maxScore, results };
}
