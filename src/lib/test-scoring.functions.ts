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
  .handler(async ({ data, context }) => {
    // Revalidate with Auth before deriving ownership; never accept an owner from input.
    const { data: auth, error } = await context.supabase.auth.getUser();
    if (error || !auth.user || auth.user.id !== context.userId) {
      throw new Error("Your session has expired. Please sign in again.");
    }
    return scoreTestSubmission(auth.user.id, data);
  });
