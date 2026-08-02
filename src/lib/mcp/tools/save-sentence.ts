import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { findWord } from "@/lib/words";
import { checkGrammar } from "@/lib/grammar";

export default defineTool({
  name: "save_sentence",
  title: "Save a practice sentence",
  description:
    "Score a sentence with the app's grammar checker and save it to the signed-in student's journal. Only perfect 5/5 sentences are saved.",
  inputSchema: {
    word: z.string().trim().min(1).describe("The Level 1 word used in the sentence."),
    sentence: z.string().trim().min(1).describe("The student's English sentence."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ word, sentence }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const entry = findWord(word);
    if (!entry) {
      return { content: [{ type: "text", text: `"${word}" is not a Level 1 word.` }], isError: true };
    }
    const result = checkGrammar(sentence, entry.word);
    if (result.stars < 5) {
      return {
        content: [
          {
            type: "text",
            text: `Not saved — the sentence scored ${result.stars}/5. Issues: ${JSON.stringify(result.issues)}`,
          },
        ],
        structuredContent: { saved: false, stars: result.stars, issues: result.issues },
      };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("sentences")
      .insert({ user_id: ctx.getUserId(), word: entry.word, sentence, stars: result.stars })
      .select("id, word, sentence, stars, created_at");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Saved with ${result.stars}/5 stars.` }],
      structuredContent: { saved: true, stars: result.stars, row: data?.[0] },
    };
  },
});
