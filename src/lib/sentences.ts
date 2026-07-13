import { useEffect, useState } from "react";

export interface SavedSentence {
  id: string;
  word: string;
  sentence: string;
  createdAt: number;
  stars: number;
}

const KEY = "ac.sentences.v1";

function read(): SavedSentence[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedSentence[]) : [];
  } catch {
    return [];
  }
}

function write(list: SavedSentence[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("ac:sentences"));
}

export function useSentences() {
  const [items, setItems] = useState<SavedSentence[]>([]);
  useEffect(() => {
    setItems(read());
    const h = () => setItems(read());
    window.addEventListener("ac:sentences", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("ac:sentences", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return {
    items,
    add: (s: Omit<SavedSentence, "id" | "createdAt">) => {
      const next: SavedSentence = { ...s, id: crypto.randomUUID(), createdAt: Date.now() };
      write([next, ...read()]);
    },
    remove: (id: string) => write(read().filter(x => x.id !== id)),
    clear: () => write([]),
  };
}

export interface Feedback {
  stars: number;
  checks: { label: string; ok: boolean; hint?: string }[];
}

export function checkSentence(sentence: string, targetWord: string): Feedback {
  const trimmed = sentence.trim();
  const lower = trimmed.toLowerCase();
  const target = targetWord.toLowerCase();
  // Word appears (allow simple morphology: exact / plural / -ed / -ing / -s)
  const stem = target.replace(/(e|y)$/, "");
  const wordRe = new RegExp(`\\b(${target}|${target}s|${target}es|${stem}ed|${stem}ing|${stem}ies)\\b`, "i");

  const usesWord = wordRe.test(trimmed);
  const startsCapital = /^[A-Z]/.test(trimmed);
  const endsPunct = /[.!?]$/.test(trimmed);
  const enoughWords = trimmed.split(/\s+/).filter(Boolean).length >= 4;
  const hasVerbish = /\b(is|am|are|was|were|has|have|had|do|does|did|can|will|goes|go|went|make|makes|help|helps|like|likes|see|saw|feel|feels|find|found|know|show|shows|need|needs|want|wants|play|plays|read|reads|write|writes|learn|learns|teach|teaches|use|uses|works?|running|walking)\b/i.test(lower);

  const checks = [
    { label: `Uses the word “${targetWord}”`, ok: usesWord, hint: `Include the word ${targetWord} in your sentence.` },
    { label: "Starts with a capital letter", ok: startsCapital, hint: "Start with a capital letter like A, B, C…" },
    { label: "Ends with . ! or ?", ok: endsPunct, hint: "End your sentence with . ! or ?" },
    { label: "Has at least 4 words", ok: enoughWords, hint: "Try to write at least 4 words." },
    { label: "Includes an action word", ok: hasVerbish, hint: "Add a verb, like is, has, plays, helps…" },
  ];
  const stars = Math.min(5, checks.filter(c => c.ok).length);
  return { stars, checks };
}
