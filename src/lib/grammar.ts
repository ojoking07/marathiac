// Rule-based English grammar checker (intermediate / Level 2).
// Designed for Marathi-speaking beginners in the Alphabet Commanders program.
// Rules are inspired by the categories in https://en.wikipedia.org/wiki/English_grammar
// (capitalisation, sentence structure, subject–verb agreement, articles,
// pronoun case, negation, tense consistency, punctuation).
//
// NOTE: A perfect English grammar engine is a research project. This checker
// is designed to be *accurate* — it does not flag things it cannot prove wrong.
// Every rule below only reports an error when the pattern strongly indicates
// a mistake.

export interface GrammarIssue {
  rule: string;
  message: string;
  hint?: string;
  severity: "error" | "warning";
}

export interface GrammarResult {
  stars: number;      // 0–5
  issues: GrammarIssue[];
  passes: string[];   // labels of rules that passed
  wordCount: number;
}

// Small lexicons — kept tight so we only fire on strong signals.
const BE_VERBS   = new Set(["am","is","are","was","were","be","been","being"]);
const HAVE_VERBS = new Set(["has","have","had","having"]);
const DO_VERBS   = new Set(["do","does","did","doing","done"]);
const MODALS     = new Set(["can","could","will","would","shall","should","may","might","must"]);

// Common base-form verbs that could be flagged for subject-verb agreement.
const BASE_VERBS = new Set([
  "go","come","run","walk","play","read","write","learn","teach","help",
  "make","see","look","watch","find","give","take","use","need","want",
  "like","love","hate","know","think","say","tell","ask","answer","open",
  "close","start","stop","eat","drink","sleep","work","live","stand","sit",
  "jump","swim","sing","dance","draw","paint","clean","cook","buy","sell",
  "wash","fix","try","wait","move","carry","bring","get","put","keep","hold",
  "feel","hear","speak","meet","show","turn","talk","study","learn","catch",
  "throw","fly","drive","ride","climb","cry","laugh","smile","stay"
]);
// The -s / -es third-person singular forms of those verbs (rough plural).
const THIRD_SINGULAR = new Set(
  [...BASE_VERBS].flatMap(v => {
    if (/(s|x|z|ch|sh|o)$/.test(v)) return [v + "es"];
    if (/[^aeiou]y$/.test(v)) return [v.slice(0,-1) + "ies"];
    return [v + "s"];
  })
);

const SUBJECT_PRONOUNS = new Set(["i","you","he","she","it","we","they"]);
const OBJECT_PRONOUNS  = new Set(["me","you","him","her","it","us","them"]);
const THIRD_SINGULAR_SUBJ = new Set(["he","she","it"]);
const PLURAL_OR_YOU_SUBJ  = new Set(["we","you","they"]);

const PREPOSITIONS = new Set([
  "to","from","with","without","for","of","on","in","at","by","about",
  "into","onto","over","under","above","below","between","among","through",
  "after","before","during","behind","beside","near","against","toward","upon"
]);

const NEGATIVE_WORDS = new Set([
  "not","no","never","nothing","nobody","none","nowhere","neither"
]);
const CONTRACTED_NEG = /(?:^|\s)(don't|doesn't|didn't|can't|cannot|won't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|shouldn't|wouldn't|couldn't|mustn't)(?=\s|$|[.,!?])/i;

const VOWEL_SOUND_START = /^[aeiou]/i; // approximation for a/an
// A few common exceptions where the letter and sound diverge.
const AN_EXCEPTIONS_A_TO_AN = new Set(["hour","honest","honor","honour","heir"]);        // consonant letter, vowel sound
const AN_EXCEPTIONS_AN_TO_A = new Set(["university","universe","user","one","european","unicorn","unit","uniform","useful"]); // vowel letter, consonant sound

function tokens(sentence: string): string[] {
  return sentence
    .replace(/[.!?;:,"“”‘’()]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function isVerbToken(t: string): boolean {
  const low = t.toLowerCase();
  if (BE_VERBS.has(low) || HAVE_VERBS.has(low) || DO_VERBS.has(low) || MODALS.has(low)) return true;
  if (BASE_VERBS.has(low) || THIRD_SINGULAR.has(low)) return true;
  if (/(ing|ed)$/.test(low) && low.length > 4) return true;
  return false;
}

function morphMatches(target: string, tok: string): boolean {
  const t = target.toLowerCase();
  const w = tok.toLowerCase();
  if (w === t) return true;
  const stem = t.replace(/(e|y)$/, "");
  const forms = new Set([
    t, t + "s", t + "es", t + "ed", t + "ing",
    stem + "ed", stem + "ing", stem + "ies", stem + "s"
  ]);
  return forms.has(w);
}

export function checkGrammar(sentenceRaw: string, targetWord: string): GrammarResult {
  const issues: GrammarIssue[] = [];
  const passes: string[] = [];
  const trimmed = sentenceRaw.trim();
  const toks = tokens(trimmed);
  const wc = toks.length;

  // 1. Non-empty
  if (!trimmed) {
    return { stars: 0, issues: [{ rule: "empty", message: "Write a sentence first.", severity: "error" }], passes, wordCount: 0 };
  }

  // 2. Capital start
  const startsCap = /^[A-Z]/.test(trimmed);
  if (!startsCap) issues.push({ rule: "capitalization", message: "Sentence should start with a capital letter.", hint: "Change the first letter to uppercase.", severity: "error" });
  else passes.push("Starts with a capital letter");

  // 3. End punctuation
  const endsPunct = /[.!?]$/.test(trimmed);
  if (!endsPunct) issues.push({ rule: "end-punctuation", message: "Sentence should end with . ! or ?", severity: "error" });
  else passes.push("Ends with correct punctuation");

  // 4. No repeated end punctuation like "!!" or ".."
  if (/([.!?]){2,}$/.test(trimmed)) {
    issues.push({ rule: "end-punctuation-repeat", message: "Use only one ending punctuation mark.", severity: "warning" });
  }

  // 5. Standalone "i" must be "I"
  const badLowerI = /\bi\b/.test(trimmed) && !/\bI\b/.test(trimmed.replace(/\bi\b/g, "I")); // detect any lone lowercase i
  if (/\bi\b/.test(trimmed)) {
    issues.push({ rule: "capital-i", message: 'The pronoun "I" is always capitalized.', hint: "Change lowercase i to I.", severity: "error" });
  }
  void badLowerI;

  // 6. Target word present
  const usesTarget = toks.some(t => morphMatches(targetWord, t));
  if (!usesTarget) issues.push({ rule: "target-word", message: `Your sentence must use the word "${targetWord}".`, severity: "error" });
  else passes.push(`Uses the word "${targetWord}"`);

  // 7. Min length (4 words)
  if (wc < 4) issues.push({ rule: "too-short", message: "Write at least 4 words.", severity: "error" });
  else passes.push("Has enough words");

  // 8. Contains a verb
  const hasVerb = toks.some(isVerbToken);
  if (!hasVerb) issues.push({ rule: "no-verb", message: "Your sentence needs an action word (a verb).", hint: "Try is, has, plays, helps, goes, sees…", severity: "error" });
  else passes.push("Has a verb");

  // 9. Repeated adjacent duplicate words: "the the", "is is"
  for (let i = 1; i < toks.length; i++) {
    if (toks[i].toLowerCase() === toks[i-1].toLowerCase() && toks[i].length > 1) {
      issues.push({ rule: "duplicate-word", message: `Repeated word: "${toks[i-1]} ${toks[i]}".`, severity: "error" });
      break;
    }
  }

  // 10. a / an usage
  for (let i = 0; i < toks.length - 1; i++) {
    const art = toks[i].toLowerCase();
    const next = toks[i+1].toLowerCase().replace(/[^a-z]/g,"");
    if (!next) continue;
    if (art === "a") {
      const shouldBeAn = VOWEL_SOUND_START.test(next) && !AN_EXCEPTIONS_AN_TO_A.has(next);
      const forceAn = AN_EXCEPTIONS_A_TO_AN.has(next);
      if (shouldBeAn || forceAn) issues.push({ rule: "a-an", message: `Use "an" before "${toks[i+1]}", not "a".`, severity: "error" });
    } else if (art === "an") {
      const shouldBeA = !VOWEL_SOUND_START.test(next) && !AN_EXCEPTIONS_A_TO_AN.has(next);
      const forceA = AN_EXCEPTIONS_AN_TO_A.has(next);
      if (shouldBeA || forceA) issues.push({ rule: "a-an", message: `Use "a" before "${toks[i+1]}", not "an".`, severity: "error" });
    }
  }

  // 11. Subject–verb agreement (simple heuristic on adjacent tokens)
  //    a) he/she/it + base verb (not -s form)  → error
  //    b) he/she/it + are/were/have/do  → error   (need is/was/has/does)
  //    c) I + is/was/has/does/are/were  → error   (need am/was/have/do/are - allow "I am"/"I was"/"I have"/"I do"/"I will")
  //    d) we/you/they + is/was/has/does → error
  for (let i = 0; i < toks.length - 1; i++) {
    const s = toks[i].toLowerCase();
    const v = toks[i+1].toLowerCase();
    if (THIRD_SINGULAR_SUBJ.has(s)) {
      if (BASE_VERBS.has(v)) {
        issues.push({ rule: "sv-agreement", message: `"${toks[i]} ${toks[i+1]}" — with he/she/it, add -s: "${toks[i]} ${v}${/(s|x|z|ch|sh|o)$/.test(v) ? "es" : "s"}".`, severity: "error" });
      }
      if (v === "are" || v === "were") {
        issues.push({ rule: "sv-agreement", message: `Use "${v === "are" ? "is" : "was"}" with ${toks[i]}, not "${toks[i+1]}".`, severity: "error" });
      }
      if (v === "have") {
        issues.push({ rule: "sv-agreement", message: `Use "has" with ${toks[i]}, not "have".`, severity: "error" });
      }
      if (v === "do") {
        issues.push({ rule: "sv-agreement", message: `Use "does" with ${toks[i]}, not "do".`, severity: "error" });
      }
    }
    if (s === "i") {
      if (v === "is" || v === "was") issues.push({ rule: "sv-agreement", message: `Use "${v === "is" ? "am" : "was"}" with I. Say "I am" or "I was".`, severity: "error" });
      if (v === "are" || v === "were") issues.push({ rule: "sv-agreement", message: `Use "${v === "are" ? "am" : "was"}" with I, not "${toks[i+1]}".`, severity: "error" });
      if (v === "has") issues.push({ rule: "sv-agreement", message: `Use "have" with I, not "has".`, severity: "error" });
      if (v === "does") issues.push({ rule: "sv-agreement", message: `Use "do" with I, not "does".`, severity: "error" });
    }
    if (PLURAL_OR_YOU_SUBJ.has(s)) {
      if (v === "is" || v === "was") issues.push({ rule: "sv-agreement", message: `Use "${v === "is" ? "are" : "were"}" with ${toks[i]}, not "${toks[i+1]}".`, severity: "error" });
      if (v === "has") issues.push({ rule: "sv-agreement", message: `Use "have" with ${toks[i]}, not "has".`, severity: "error" });
      if (v === "does") issues.push({ rule: "sv-agreement", message: `Use "do" with ${toks[i]}, not "does".`, severity: "error" });
    }
  }
  if (!issues.some(i => i.rule === "sv-agreement")) passes.push("Subject and verb agree");

  // 12. Pronoun case:
  //    a) subject pronoun (I/he/she/we/they) directly after a preposition  → should be object case.
  //    b) object pronoun (me/him/her/us/them) at the start of the sentence acting as subject
  for (let i = 0; i < toks.length - 1; i++) {
    const p = toks[i].toLowerCase();
    const q = toks[i+1].toLowerCase();
    if (PREPOSITIONS.has(p) && SUBJECT_PRONOUNS.has(q) && q !== "you" && q !== "it") {
      const map: Record<string,string> = { i:"me", he:"him", she:"her", we:"us", they:"them" };
      issues.push({ rule: "pronoun-case", message: `After "${p}", use "${map[q]}" instead of "${toks[i+1]}".`, severity: "error" });
    }
  }
  const first = toks[0]?.toLowerCase();
  if (first && OBJECT_PRONOUNS.has(first) && first !== "you" && first !== "it") {
    // If followed by a verb, this is subject position.
    const nextT = toks[1]?.toLowerCase();
    if (nextT && isVerbToken(nextT)) {
      const map: Record<string,string> = { me:"I", him:"he", her:"she", us:"we", them:"they" };
      issues.push({ rule: "pronoun-case", message: `Use "${map[first]}" as the subject, not "${toks[0]}".`, severity: "error" });
    }
  }

  // 13. Double negatives: contracted negative + a negative word further in the sentence
  const contractedMatch = trimmed.match(CONTRACTED_NEG);
  if (contractedMatch) {
    const rest = toks.slice(toks.findIndex(t => t.toLowerCase().replace(/[.,!?]/g,"") === contractedMatch[1].toLowerCase()) + 1);
    if (rest.some(t => NEGATIVE_WORDS.has(t.toLowerCase()))) {
      issues.push({ rule: "double-negative", message: "Avoid double negatives (e.g., don't … nothing).", hint: 'Say "don\'t have anything" instead of "don\'t have nothing".', severity: "error" });
    }
  }
  // "not ... nothing/nobody/never" without contraction
  const lowerToks = toks.map(t => t.toLowerCase());
  const notIdx = lowerToks.indexOf("not");
  if (notIdx !== -1) {
    for (let i = notIdx + 1; i < lowerToks.length; i++) {
      if (["nothing","nobody","never","none","nowhere"].includes(lowerToks[i])) {
        issues.push({ rule: "double-negative", message: `Double negative: "not … ${lowerToks[i]}".`, severity: "error" });
        break;
      }
    }
  }

  // 14. Run-on: >20 words with no internal punctuation and no conjunction
  const conj = /\b(and|but|or|because|so|while|when|if|although|though)\b/i;
  if (wc > 20 && !/[,;:]/.test(trimmed) && !conj.test(trimmed)) {
    issues.push({ rule: "run-on", message: "This is a very long sentence — try adding a comma or splitting it.", severity: "warning" });
  }

  // 15. Space after comma / period inside sentence
  if (/[.,!?][A-Za-z]/.test(trimmed)) {
    issues.push({ rule: "spacing", message: "Add a space after . , ! or ?", severity: "error" });
  }

  // 16. Simple tense mixing: past + present indicators
  const pastMarkers    = ["was","were","went","did","had","saw","ate","ran","made","took"];
  const presentMarkers = ["is","are","am","does","do","has","have","goes","see","eat","runs","makes","takes"];
  const hasPast    = lowerToks.some(t => pastMarkers.includes(t));
  const hasPresent = lowerToks.some(t => presentMarkers.includes(t));
  if (hasPast && hasPresent) {
    // Only warn — could be legitimate ("I was tired but now I am fine")
    if (!conj.test(trimmed)) {
      issues.push({ rule: "tense-mix", message: "You mixed past and present tense — try to keep one tense.", severity: "warning" });
    }
  }

  // ---- Scoring: 5 stars if no errors, minus 1 per unique error category, warnings −0.5 (rounded).
  const errorCats = new Set(issues.filter(i => i.severity === "error").map(i => i.rule));
  const warnCats  = new Set(issues.filter(i => i.severity === "warning").map(i => i.rule));
  const raw = 5 - errorCats.size - warnCats.size * 0.5;
  const stars = Math.max(0, Math.min(5, Math.round(raw)));

  return { stars, issues, passes, wordCount: wc };
}

// Score a single-word English spelling attempt against the correct word.
export function checkSpelling(attempt: string, target: string): { correct: boolean; hint?: string } {
  const a = attempt.trim().toLowerCase();
  const t = target.trim().toLowerCase();
  if (!a) return { correct: false, hint: "You didn't type anything." };
  if (a === t) return { correct: true };
  // small typo tolerance: 1 edit-distance
  if (levenshtein(a, t) === 1) return { correct: false, hint: `Very close — the correct spelling is "${target}".` };
  return { correct: false, hint: `The correct English word is "${target}".` };
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,
        dp[i][j-1] + 1,
        dp[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}
