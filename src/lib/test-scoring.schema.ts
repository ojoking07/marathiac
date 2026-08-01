import { z } from "zod";

export const TEST_QUESTION_LIMIT = 30;
export const TEST_TIME_LIMIT_SEC = 15 * 60;

export const testSubmissionSchema = z.object({
  answers: z
    .array(
      z.object({
        wordId: z.number().int().nonnegative(),
        english: z.string().max(100),
        sentence: z.string().max(500),
      }),
    )
    .min(1)
    .max(TEST_QUESTION_LIMIT),
  violations: z.array(z.string().max(200)).max(50).default([]),
  durationSec: z.number().int().min(0).max(TEST_TIME_LIMIT_SEC),
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
