import { describe, expect, test, mock } from "bun:test";
import { testSubmissionSchema } from "./test-scoring.schema";

let inserted;
mock.module("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: () => ({ insert: (row) => {
    inserted = row;
    return { select: () => ({ single: async () => ({ data: { id: "attempt-1", created_at: "2026-10-24T19:22:00Z" }, error: null }) }) };
  } }) },
}));
const { scoreTestSubmission } = await import("./test-scoring.server");

describe("saved test submission", () => {
  test("ignores a caller-supplied alternate owner and persists the verified owner", async () => {
    const input = testSubmissionSchema.parse({ answers: [{ wordId: 1, english: "Courage", sentence: "I have lots of courage." }], durationSec: 10, user_id: "other-user" });
    await scoreTestSubmission("verified-user", input);
    expect(inserted?.user_id).toBe("verified-user");
    expect(input).not.toHaveProperty("user_id");
  });
  test("returns the stored submission timestamp and written answers", async () => {
    const result = await scoreTestSubmission("verified-user", testSubmissionSchema.parse({ answers: [{ wordId: 1, english: "Courage", sentence: "I have lots of courage." }], durationSec: 10 }));
    expect(result.createdAt).toBe("2026-10-24T19:22:00Z");
    expect(result.results[0]?.sentence).toBe("I have lots of courage.");
    expect(inserted?.details).toEqual(expect.arrayContaining([expect.objectContaining({ english: "Courage", sentence: "I have lots of courage." })]));
  });
});