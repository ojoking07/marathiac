import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_meanings",
  title: "List my Marathi meanings",
  description: "List the signed-in student's own private Marathi meanings for the Level 1 words.",
  inputSchema: {
    word: z.string().trim().optional().describe("Optionally return only this English word's meaning."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ word }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("word_meanings")
      .select("word_id, word, meaning, updated_at")
      .order("word_id");
    if (word) query = query.ilike("word", word);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { meanings: data ?? [] },
    };
  },
});
