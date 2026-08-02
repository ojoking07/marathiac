import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { WORDS } from "@/lib/words";

export default defineTool({
  name: "list_words",
  title: "List Level 1 words",
  description:
    "List the 30 Level 1 Alphabet Commanders words with Marathi pronunciation, part of speech, meaning and an example sentence.",
  inputSchema: {
    grammar: z
      .enum(["Noun", "Verb", "Adjective", "Adverb"])
      .optional()
      .describe("Optionally filter by part of speech."),
    search: z.string().trim().optional().describe("Optional text match on the English word."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ grammar, search }) => {
    const q = search?.toLowerCase();
    const rows = WORDS.filter(
      (w) => (!grammar || w.grammar === grammar) && (!q || w.word.toLowerCase().includes(q)),
    );
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { words: rows },
    };
  },
});
