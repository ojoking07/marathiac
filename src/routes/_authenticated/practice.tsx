import type { ChangeEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { WORDS, GRAMMAR_STYLES, findWord, type WordEntry } from "@/lib/words";
import { checkGrammar } from "@/lib/grammar";
import { addSentence } from "@/lib/sentences";
import { listProgress, recordAttempt } from "@/lib/progress";
import { NoAssistTextarea } from "@/components/NoAssistTextarea";
import { toast } from "sonner";

const searchSchema = z.object({ word: z.string().optional() });

export const Route = createFileRoute("/_authenticated/practice")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Practice | Alphabet Commanders" },
      { name: "description", content: "Write your own English sentence for each word and get instant grammar feedback with a five-star rating." },
      { property: "og:title", content: "Sentence Practice — Alphabet Commanders" },
      { property: "og:description", content: "Pick a word, write a sentence, and get instant grammar feedback and stars." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://marathiac.lovable.app/practice" },
    ],
  }),
  component: PracticePage,
});

function PracticePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const initial = (search.word && findWord(search.word)) || WORDS[0];
  const [current, setCurrent] = useState<WordEntry>(initial);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: progress } = useQuery({ queryKey: ["progress"], queryFn: listProgress });
  const mastered = useMemo(() => new Set((progress ?? []).filter(p => p.mastered).map(p => p.word_id)), [progress]);
  const bestStars = useMemo(() => {
    const m = new Map<number, number>();
    (progress ?? []).forEach(p => m.set(p.word_id, p.best_stars));
    return m;
  }, [progress]);

  const result = useMemo(() => checkGrammar(text, current.word), [text, current.word]);
  const s = GRAMMAR_STYLES[current.grammar];

  const selectWord = (w: WordEntry) => {
    setCurrent(w); setText(""); setSubmitted(false);
    navigate({ to: "/practice", search: { word: w.word }, replace: true });
  };
  const random = () => {
    const other = WORDS.filter(w => w.id !== current.id);
    selectWord(other[Math.floor(Math.random() * other.length)]);
  };

  const onCheck = async () => {
    setSubmitted(true);
    if (text.trim()) {
      try { await recordAttempt(current.id, result.stars); qc.invalidateQueries({ queryKey: ["progress"] }); } catch {}
    }
  };
  const onSave = async () => {
    if (!text.trim()) return;
    try {
      await addSentence(current.word, text.trim(), result.stars);
      await recordAttempt(current.id, result.stars);
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["sentences"] });
      toast.success("Saved to My Sentences ⭐");
      setSubmitted(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl bg-card p-6 shadow-pop sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${s.chip}`}>
                {s.emoji} {s.label}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">Word #{current.id} of {WORDS.length}</span>
              {mastered.has(current.id) && <span className="rounded-full bg-leaf/20 px-2 py-0.5 text-xs font-bold">Mastered ✓</span>}
            </div>
            <button onClick={random} aria-label="Surprise me with a random word" className="rounded-full border-2 border-primary/20 bg-card px-4 py-1.5 text-sm font-bold shadow-soft hover:bg-secondary">
              🎲 Surprise me
            </button>
          </div>

          <div className="mt-5 animate-pop-in" key={current.id}>
            {current.image && (
              <img
                src={current.image}
                alt={`Picture showing the meaning of the word ${current.word}`}
                loading="lazy"
                width={640}
                height={512}
                className="mb-4 aspect-[5/4] w-full max-w-sm rounded-3xl object-cover shadow-soft"
              />
            )}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-6xl font-extrabold sm:text-7xl">{current.word}</h1>
              <SpeakButton text={current.word} />
            </div>
            <div className="mt-1 text-lg font-semibold text-muted-foreground">
              <span className="text-foreground/80">{current.pronunciation}</span>
            </div>
            <p className="mt-3 text-lg">{current.meaning}</p>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-bold text-primary hover:underline">Show an example sentence</summary>
              <blockquote className="mt-2 rounded-2xl bg-secondary/60 p-3 italic">"{current.example}"</blockquote>
            </details>
          </div>

          <label className="mt-6 block">
            <span className="font-display text-lg font-extrabold">✏️ Write your own sentence using <span className="text-primary">{current.word}</span></span>
            <NoAssistTextarea
              value={text}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { setText(e.target.value); setSubmitted(false); }}
              rows={3}
              placeholder="Type your sentence here…"
              className="mt-2 w-full resize-none rounded-2xl border-2 border-border bg-background p-4 text-lg font-semibold shadow-soft outline-none focus:border-primary"
            />
          </label>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{result.wordCount} words</span>
            <div className="flex gap-2">
              <button onClick={onCheck} disabled={!text.trim()} className="rounded-full bg-accent px-5 py-2 font-bold text-accent-foreground shadow-sun transition hover:scale-[1.03] disabled:opacity-50">
                ✅ Check my sentence
              </button>
              <button onClick={onSave} disabled={!text.trim() || result.stars < 5}
                title={result.stars < 5 ? "You need 5/5 stars to save" : "Save"}
                className="rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground shadow-pop transition hover:scale-[1.03] disabled:opacity-50">
                💾 Save
              </button>

            </div>
          </div>

          {submitted && text.trim() && (
            <div className="mt-6 animate-pop-in rounded-3xl bg-gradient-hero p-5 ring-1 ring-primary/10">
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5 text-2xl leading-none">
                  {[1,2,3,4,5].map(i => <span key={i} className={i <= result.stars ? "" : "opacity-25 grayscale"}>⭐</span>)}
                </div>
                <span className="font-display text-2xl font-extrabold">{result.stars} / 5</span>
              </div>
              {result.passes.length > 0 && (
                <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                  {result.passes.map((p: string) => (
                    <li key={p} className="flex items-start gap-2 font-semibold">✓ <span>{p}</span></li>
                  ))}
                </ul>
              )}
              {result.issues.length > 0 && (
                <ul className="mt-3 grid gap-1.5 text-sm">
                  {result.issues.map((i, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className={i.severity === "error" ? "text-coral" : "text-sun-foreground"}>{i.severity === "error" ? "✗" : "!"}</span>
                      <span>
                        <span className="font-semibold">{i.message}</span>
                        {i.hint && <span className="ml-1 text-muted-foreground">— {i.hint}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <aside className="rounded-3xl bg-card p-5 shadow-soft">
          <h2 className="font-display text-xl font-extrabold">Pick a word</h2>
          <p className="text-sm text-muted-foreground">Green = mastered.</p>
          <div className="mt-3 max-h-[560px] overflow-y-auto pr-1">
            <ul className="grid gap-1.5">
              {WORDS.map(w => {
                const active = w.id === current.id;
                const g = GRAMMAR_STYLES[w.grammar];
                const isMastered = mastered.has(w.id);
                const stars = bestStars.get(w.id) ?? 0;
                return (
                  <li key={w.id}>
                    <button onClick={() => selectWord(w)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left transition ${
                        active ? "bg-primary text-primary-foreground shadow-soft" : isMastered ? "bg-leaf/20 hover:bg-leaf/30" : "hover:bg-secondary"
                      }`}>
                      <span className="font-display text-base font-extrabold">{w.word}</span>
                      <span className="flex items-center gap-1">
                        {stars > 0 && <span className="text-[10px] font-bold opacity-70">{stars}⭐</span>}
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-primary-foreground/20" : g.chip}`}>{g.emoji}</span>
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
