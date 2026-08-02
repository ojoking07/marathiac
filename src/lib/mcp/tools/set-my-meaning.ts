import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { findWord } from "@/lib/words";

export default defineTool({
  name: "set_my_meaning",
  title: "Save my Marathi meaning",
  description:
    "Save or update the signed-in student's own private Marathi meaning for a Level 1 word. An empty meaning removes it.",
  inputSchema: {
    word: z.string().trim().min(1).describe("The Level 1 English word."),
    meaning: z.string().trim().describe("The student's Marathi meaning. Empty string deletes it."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ word, meaning }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const entry = findWord(word);
    if (!entry) {
      return { content: [{ type: "text", text: `"${word}" is not a Level 1 word.` }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const trimmed = meaning.trim();
    if (!trimmed) {
      const { error } = await supabase
        .from("word_meanings")
        .delete()
        .eq("user_id", userId)
        .eq("word_id", entry.id);
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      return {
        content: [{ type: "text", text: `Removed your meaning for "${entry.word}".` }],
        structuredContent: { removed: true, word: entry.word },
      };
    }
    const { data, error } = await supabase
      .from("word_meanings")
      .upsert(
        { user_id: userId, word_id: entry.id, word: entry.word, meaning: trimmed },
        { onConflict: "user_id,word_id" },
      )
      .select("word_id, word, meaning, updated_at");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Saved your meaning for "${entry.word}".` }],
      structuredContent: { removed: false, row: data?.[0] },
    };
  },
});
