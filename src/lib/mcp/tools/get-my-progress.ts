import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_progress",
  title: "Get my progress",
  description:
    "Summarize the signed-in student's word progress and recent test attempts (scores, duration, dates).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const [progress, attempts] = await Promise.all([
      supabase.from("word_progress").select("*").order("word_id"),
      supabase.from("test_attempts").select("*").order("created_at", { ascending: false }).limit(10),
    ]);
    if (progress.error) return { content: [{ type: "text", text: progress.error.message }], isError: true };
    if (attempts.error) return { content: [{ type: "text", text: attempts.error.message }], isError: true };
    const payload = { word_progress: progress.data ?? [], recent_tests: attempts.data ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
