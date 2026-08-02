import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listWords from "./tools/list-words";
import checkSentence from "./tools/check-sentence";
import listMySentences from "./tools/list-my-sentences";
import saveSentence from "./tools/save-sentence";
import listMyMeanings from "./tools/list-my-meanings";
import setMyMeaning from "./tools/set-my-meaning";
import getMyProgress from "./tools/get-my-progress";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "alphabet-commanders",
  title: "Alphabet Commanders",
  version: "0.1.0",
  instructions:
    "Tools for Alphabet Commanders, an English sentence-practice app for Marathi-speaking students. Use `list_words` for the 30 Level 1 words, `check_sentence` to score a sentence with the app's strict grammar checker, and the `my_*` tools to read or update the signed-in student's own sentences, private Marathi meanings, and progress.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listWords,
    checkSentence,
    listMySentences,
    saveSentence,
    listMyMeanings,
    setMyMeaning,
    getMyProgress,
  ],
});
