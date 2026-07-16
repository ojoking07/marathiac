import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { WORDS, GRAMMAR_STYLES, findWord, type WordEntry } from "@/lib/words";
import { checkSentence, useSentences } from "@/lib/sentences";

const searchSchema = z.object({ word: z.string().optional() });

export const Route = createFileRoute("/_authenticated/practice")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sentence Practice | Alphabet Commanders" },
      { name: "description", content: "Pick a word and write your own sentence. Get instant feedback and earn stars." },
      { property: "og:title", content: "Sentence Practice — Alphabet Commanders" },
      { property: "og:description", content: "Write English sentences using Level 1 words. For Marathi-speaking children in rural India." },
    ],
  }),
  component: PracticePage,
});

function PracticePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const initial = (search.word && findWord(search.word)) || WORDS[0];
  const [current, setCurrent] = useState<WordEntry>(initial);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { add } = useSentences();

  const feedback = useMemo(() => checkSentence(text, current.word), [text, current.word]);
  const s = GRAMMAR_STYLES[current.grammar];

  const selectWord = (w: WordEntry) => {
    setCurrent(w);
    setText("");
    setSubmitted(false);
    navigate({ to: "/practice", search: { word: w.word }, replace: true });
  };

  const random = () => {
    const other = WORDS.filter(w => w.id !== current.id);
    selectWord(other[Math.floor(Math.random() * other.length)]);
  };

  const onCheck = () => setSubmitted(true);

  const onSave = () => {
    if (!text.trim()) return;
    add({ word: current.word, sentence: text.trim(), stars: feedback.stars });
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main practice card */}
        <div className="rounded-3xl bg-card p-6 shadow-pop sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${s.chip}`}>
                {s.emoji} {s.label}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">Word #{current.id} of {WORDS.length}</span>
            </div>
            <button
              onClick={random}
              className="rounded-full border-2 border-primary/20 bg-card px-4 py-1.5 text-sm font-bold text-foreground shadow-soft transition hover:bg-secondary"
            >
              🎲 Surprise me
            </button>
          </div>

          <div className="mt-5 animate-pop-in" key={current.id}>
            <h1 className="font-display text-6xl font-extrabold text-foreground sm:text-7xl">{current.word}</h1>
            <div className="mt-1 text-lg font-semibold text-muted-foreground">
              <span className="text-foreground/80">{current.pronunciation}</span> · {current.marathi}
            </div>
            <p className="mt-3 text-lg text-foreground/85">{current.meaning}</p>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-bold text-primary hover:underline">Show an example sentence</summary>
              <blockquote className="mt-2 rounded-2xl bg-secondary/60 p-3 italic text-foreground/80">“{current.example}”</blockquote>
            </details>
          </div>

          <label className="mt-6 block">
            <span className="font-display text-lg font-extrabold text-foreground">
              ✏️ Write your own sentence using <span className="text-primary">{current.word}</span>
            </span>
            <textarea
              value={text}
              onChange={e => { setText(e.target.value); setSubmitted(false); }}
              rows={3}
              placeholder={`Try: "${current.example}"`}
              className="mt-2 w-full resize-none rounded-2xl border-2 border-border bg-background p-4 text-lg font-semibold shadow-soft outline-none transition focus:border-primary"
            />
          </label>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{text.trim() ? `${text.trim().split(/\s+/).length} words` : "0 words"}</span>
            <div className="flex gap-2">
              <button
                onClick={onCheck}
                disabled={!text.trim()}
                className="rounded-full bg-accent px-5 py-2 font-bold text-accent-foreground shadow-sun transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-50"
              >
                ✅ Check my sentence
              </button>
              <button
                onClick={onSave}
                disabled={!text.trim() || feedback.stars < 3}
                title={feedback.stars < 3 ? "Reach 3 stars to save" : "Save to My Sentences"}
                className="rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground shadow-pop transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-50"
              >
                💾 Save
              </button>
            </div>
          </div>

          {submitted && text.trim() && (
            <div className="mt-6 animate-pop-in rounded-3xl bg-gradient-hero p-5 ring-1 ring-primary/10">
              <div className="flex items-center gap-3">
                <StarRow value={feedback.stars} />
                <span className="font-display text-2xl font-extrabold text-foreground">{feedback.stars} / 5</span>
                <span className="text-sm text-muted-foreground">{cheer(feedback.stars)}</span>
              </div>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {feedback.checks.map(c => (
                  <li key={c.label} className="flex items-start gap-2 text-sm">
                    <span className={c.ok ? "text-leaf-foreground" : "text-coral"}>{c.ok ? "✓" : "•"}</span>
                    <span className={c.ok ? "font-semibold text-foreground" : "text-foreground/80"}>
                      {c.ok ? c.label : c.hint}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar: word picker */}
        <aside className="rounded-3xl bg-card p-5 shadow-soft">
          <h2 className="font-display text-xl font-extrabold text-foreground">Pick a word</h2>
          <p className="text-sm text-muted-foreground">Tap any word to practice it.</p>
          <div className="mt-3 max-h-[560px] overflow-y-auto pr-1">
            <ul className="grid gap-1.5">
              {WORDS.map(w => {
                const active = w.id === current.id;
                const g = GRAMMAR_STYLES[w.grammar];
                return (
                  <li key={w.id}>
                    <button
                      onClick={() => selectWord(w)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left transition ${
                        active ? "bg-primary text-primary-foreground shadow-soft" : "hover:bg-secondary"
                      }`}
                    >
                      <span className="font-display text-base font-extrabold">{w.word}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-primary-foreground/20" : g.chip}`}>
                        {g.emoji}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StarRow({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5 text-2xl leading-none">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= value ? "" : "opacity-25 grayscale"}>⭐</span>
      ))}
    </div>
  );
}

function cheer(n: number) {
  if (n === 5) return "Perfect! You're a sentence commander! 🚀";
  if (n === 4) return "Great job! Almost perfect.";
  if (n === 3) return "Nice work! You can save this one.";
  if (n === 2) return "Good try — keep going!";
  if (n === 1) return "A start — let's fix a few things.";
  return "Give it a try!";
}
