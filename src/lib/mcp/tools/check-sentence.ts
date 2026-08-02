import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { checkGrammar } from "@/lib/grammar";

export default defineTool({
  name: "check_sentence",
  title: "Check a sentence",
  description:
    "Run the app's strict English grammar and spelling checker on a sentence that uses a target word. Returns a 0-5 star score and the issues found.",
  inputSchema: {
    sentence: z.string().trim().min(1).describe("The English sentence to check."),
    word: z.string().trim().min(1).describe("The target word the sentence must use."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ sentence, word }) => {
    const result = checkGrammar(sentence, word);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result as unknown as Record<string, unknown>,
    };
  },
});
