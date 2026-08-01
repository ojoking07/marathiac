import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { WORDS } from "@/lib/words";
import { checkGrammar, checkSpelling } from "@/lib/grammar";

const QUESTION_LIMIT = 30;
const TIME_LIMIT_SEC = 15 * 60;

const submissionSchema = z.object({
  answers: z
    .array(
      z.object({
        wordId: z.number().int().nonnegative(),
        english: z.string().max(100),
        sentence: z.string().max(500),
      }),
    )
    .min(1)
    .max(QUESTION_LIMIT),
  violations: z.array(z.string().max(200)).max(50).default([]),
  durationSec: z.number().int().min(0).max(TIME_LIMIT_SEC),
});

export interface ScoredAnswer {
  wordId: number;
  word: string;
  pronunciation: string;
  english: string;
  sentence: string;
  spellingCorrect: boolean;
  spellingHint?: string;
  grammarStars: number;
  grammarIssues: string[];
  points: number;
}

/**
 * Grades a test attempt entirely on the server and writes the row itself.
 * The browser never supplies score, max_score or details — only raw answers.
 */
export const submitTestAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => submissionSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

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
  });
