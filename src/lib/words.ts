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

// Word pictures live on Lovable's asset CDN, which is only mounted on Lovable
// hosting. Use the stable absolute origin so the pictures also load when the
// site is served from another host (e.g. Vercel).
const ASSET_ORIGIN = "https://project--3121f0d0-ac4b-4bd3-a1db-4a608fef3a0f.lovable.app";

function absoluteImage(src?: string): string | undefined {
  if (!src) return undefined;
  return src.startsWith("/__l5e/") ? `${ASSET_ORIGIN}${src}` : src;
}

export const WORDS: WordEntry[] = (words as WordEntry[]).map(w => ({
  ...w,
  image: absoluteImage(w.image),
}));

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
