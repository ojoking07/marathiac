import words from "@/data/words.json";

export type Grammar = "Noun" | "Verb" | "Adjective" | "Adverb";

export interface WordEntry {
  id: number;
  word: string;
  pronunciation: string;
  marathi: string;
  meaning: string;
  grammar: Grammar;
  example: string;
  image?: string;
}

export const WORDS: WordEntry[] = words as WordEntry[];

export const GRAMMAR_STYLES: Record<Grammar, { chip: string; ring: string; label: string; emoji: string }> = {
  Noun:      { chip: "bg-ocean text-ocean-foreground",       ring: "ring-ocean/30",   label: "Noun",      emoji: "🧱" },
  Verb:      { chip: "bg-coral text-coral-foreground",       ring: "ring-coral/30",   label: "Verb",      emoji: "⚡" },
  Adjective: { chip: "bg-sun text-sun-foreground",           ring: "ring-sun/30",     label: "Adjective", emoji: "🎨" },
  Adverb:    { chip: "bg-leaf text-leaf-foreground",         ring: "ring-leaf/30",    label: "Adverb",    emoji: "🌿" },
};

export function findWord(idOrWord: string | number): WordEntry | undefined {
  const s = String(idOrWord).toLowerCase();
  return WORDS.find(w => String(w.id) === s || w.word.toLowerCase() === s);
}
