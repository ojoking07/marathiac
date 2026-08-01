import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { WORDS, GRAMMAR_STYLES } from "@/lib/words";
import { listMyMeanings, saveMeaning } from "@/lib/meanings";

export const Route = createFileRoute("/_authenticated/my-meanings")({
  head: () => ({
    meta: [
      { title: "My Marathi Meanings | Alphabet Commanders" },
      { name: "description", content: "Write your own Marathi meaning for each English word. Your meanings are private to you." },
      { property: "og:title", content: "My Marathi Meanings — Alphabet Commanders" },
      { property: "og:description", content: "Every student writes their own Marathi meaning for each English word." },
    ],
  }),
  component: MyMeanings,
});

function MyMeanings() {
  const qc = useQueryClient();
  const { data: saved = [], isLoading } = useQuery({ queryKey: ["my-meanings"], queryFn: listMyMeanings });
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    setDrafts(Object.fromEntries(saved.map(m => [m.word_id, m.meaning])));
  }, [saved]);

  const savedMap = new Map(saved.map(m => [m.word_id, m.meaning]));
  const done = saved.length;

  const onSave = async (wordId: number, word: string) => {
    setBusy(wordId);
    try {
      await saveMeaning(wordId, word, drafts[wordId] ?? "");
      await qc.invalidateQueries({ queryKey: ["my-meanings"] });
      toast.success(`Saved your meaning for “${word}”`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-4xl sm:text-5xl">My Marathi Meanings</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Write what each English word means <span className="font-semibold text-foreground">in your own Marathi words</span>.
        Only you can see what you write here — your teacher reviews them privately.
      </p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-bold">
        🖊️ {isLoading ? "Loading…" : `${done} of ${WORDS.length} words written`}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {WORDS.map(w => {
          const s = GRAMMAR_STYLES[w.grammar];
          const value = drafts[w.id] ?? "";
          const dirty = value.trim() !== (savedMap.get(w.id) ?? "");
          return (
            <article key={w.id} className={`rounded-3xl bg-card p-5 shadow-soft ring-1 ${s.ring}`}>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${s.chip}`}>
                  {s.emoji} {s.label}
                </span>
                {savedMap.has(w.id) && <span className="text-xs font-bold text-leaf">✓ saved</span>}
              </div>
              <h2 className="mt-3 font-display text-2xl font-extrabold">{w.word}</h2>
              <div className="text-sm font-semibold text-foreground/70">{w.pronunciation}</div>
              <p className="mt-1 text-sm text-foreground/85">{w.meaning}</p>
              <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-muted-foreground" htmlFor={`m-${w.id}`}>
                Marathi meaning (your own words)
              </label>
              <input
                id={`m-${w.id}`}
                value={value}
                onChange={e => setDrafts(d => ({ ...d, [w.id]: e.target.value }))}
                placeholder="इथे मराठी अर्थ लिहा…"
                maxLength={200}
                className="mt-1 w-full rounded-2xl border-2 border-border bg-background px-4 py-2 font-semibold outline-none transition focus:border-primary"
              />
              <button
                onClick={() => onSave(w.id, w.word)}
                disabled={!dirty || busy === w.id}
                className="mt-3 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground shadow-soft transition hover:scale-[1.03] disabled:opacity-40 disabled:hover:scale-100"
              >
                {busy === w.id ? "Saving…" : "Save"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
