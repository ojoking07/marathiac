import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { WORDS, GRAMMAR_STYLES, type Grammar } from "@/lib/words";

export const Route = createFileRoute("/words")({
  head: () => ({
    meta: [
      { title: "Word Bank — 30 Level 1 Words | Alphabet Commanders" },
      { name: "description", content: "Browse all 30 Level 1 words with Marathi pronunciation, meaning, grammar, and example sentences." },
      { property: "og:title", content: "Word Bank — Alphabet Commanders" },
      { property: "og:description", content: "30 English words with Marathi meanings for children in rural India." },
    ],
  }),
  component: WordsPage,
});

const FILTERS = ["All", "Noun", "Verb", "Adjective", "Adverb"] as const;
type Filter = (typeof FILTERS)[number];

function WordsPage() {
  const [filter, setFilter] = useState<Filter>("All");
  const [q, setQ] = useState("");
  const list = WORDS.filter(w => filter === "All" || w.grammar === filter)
    .filter(w => {
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return w.word.toLowerCase().includes(s) || w.marathi.includes(q) || w.meaning.toLowerCase().includes(s);
    });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl text-foreground sm:text-5xl">Word Bank</h1>
          <p className="mt-1 text-muted-foreground">30 English words · Level 1 · Alphabet Commanders</p>
        </div>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search words, meanings, मराठी…"
          className="w-full rounded-full border-2 border-border bg-card px-5 py-2.5 font-semibold shadow-soft outline-none transition focus:border-primary sm:w-72"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map(f => {
          const active = filter === f;
          const count = f === "All" ? WORDS.length : WORDS.filter(w => w.grammar === (f as Grammar)).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                active ? "bg-primary text-primary-foreground shadow-pop" : "bg-card text-foreground/80 shadow-soft hover:bg-secondary"
              }`}
            >
              {f !== "All" && <span className="mr-1">{GRAMMAR_STYLES[f as Grammar].emoji}</span>}
              {f} <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(w => {
          const s = GRAMMAR_STYLES[w.grammar];
          return (
            <article key={w.id} className={`rounded-3xl bg-card p-5 shadow-soft ring-1 ${s.ring} transition hover:-translate-y-1 hover:shadow-pop`}>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${s.chip}`}>
                  {s.emoji} {s.label}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">#{w.id}</span>
              </div>
              <h3 className="mt-3 font-display text-3xl font-extrabold text-foreground">{w.word}</h3>
              <div className="text-sm font-semibold text-muted-foreground">
                <span className="text-foreground/70">{w.pronunciation}</span> · {w.marathi}
              </div>
              <p className="mt-2 text-sm text-foreground/85">{w.meaning}</p>
              <blockquote className="mt-3 rounded-2xl bg-secondary/60 p-3 text-sm italic text-foreground/80">
                “{w.example}”
              </blockquote>
              <Link
                to="/practice"
                search={{ word: w.word }}
                className="mt-4 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground shadow-soft transition hover:scale-[1.03]"
              >
                ✏️ Write a sentence
              </Link>
            </article>
          );
        })}
      </div>
      {list.length === 0 && (
        <div className="mt-16 text-center text-muted-foreground">No words match — try a different search.</div>
      )}
    </div>
  );
}
