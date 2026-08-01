import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { scoreTestSubmission } from "@/lib/test-scoring.server";
import { testSubmissionSchema } from "@/lib/test-scoring.schema";

export type { ScoredAnswer } from "@/lib/test-scoring.schema";

/**
 * Grades a test attempt entirely on the server and writes the row itself.
 * The browser never supplies score, max_score or details — only raw answers.
 */
export const submitTestAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => testSubmissionSchema.parse(input))
  .handler(async ({ data, context }) => scoreTestSubmission(context.userId, data));
