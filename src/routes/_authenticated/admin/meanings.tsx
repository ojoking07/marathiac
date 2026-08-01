import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { WORDS } from "@/lib/words";
import { isAdmin, listAllMeanings } from "@/lib/meanings";

export const Route = createFileRoute("/_authenticated/admin/meanings")({
  head: () => ({
    meta: [
      { title: "Teacher Review — Student Meanings | Alphabet Commanders" },
      { name: "description", content: "Private teacher view comparing each student's Marathi meanings with the official Alphabet Commanders word list." },
      { property: "og:title", content: "Teacher Review — Student Meanings" },
      { property: "og:description", content: "Compare student-written Marathi meanings against the official word list." },
    ],
  }),
  component: AdminMeanings,
});

function AdminMeanings() {
  const { data: admin, isLoading: checking } = useQuery({ queryKey: ["is-admin"], queryFn: isAdmin });
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["all-meanings"],
    queryFn: listAllMeanings,
    enabled: admin === true,
  });
  const [q, setQ] = useState("");

  if (checking) return <div className="mx-auto max-w-4xl px-4 py-16 text-muted-foreground">Checking access…</div>;

  if (!admin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="text-6xl">🔒</div>
        <h1 className="mt-4 text-3xl">Teachers only</h1>
        <p className="mt-2 text-muted-foreground">This page is private. Student meanings can only be reviewed by a teacher account.</p>
        <Link to="/my-meanings" className="mt-6 inline-block rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground shadow-pop">
          Go to My Meanings
        </Link>
      </div>
    );
  }

  const filtered = students.filter(s => !q.trim() || s.name.toLowerCase().includes(q.toLowerCase()) || s.village.toLowerCase().includes(q.toLowerCase()));
  const totalEntries = students.reduce((n, s) => n + s.meanings.length, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl">Teacher Review</h1>
          <p className="mt-1 text-muted-foreground">
            {isLoading ? "Loading…" : `${students.length} student${students.length === 1 ? "" : "s"} · ${totalEntries} meanings submitted`}
          </p>
        </div>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search student or village…"
          className="w-full rounded-full border-2 border-border bg-card px-5 py-2.5 font-semibold shadow-soft outline-none focus:border-primary sm:w-72"
        />
      </div>

      {!isLoading && students.length === 0 && (
        <div className="mt-12 rounded-3xl bg-card p-10 text-center shadow-soft">
          <div className="text-6xl">📭</div>
          <p className="mt-3 text-muted-foreground">No students have written meanings yet.</p>
        </div>
      )}

      <div className="mt-8 grid gap-6">
        {filtered.map(s => (
          <section key={s.userId} className="rounded-3xl bg-card p-6 shadow-soft">
            <header className="flex flex-wrap items-baseline gap-2">
              <h2 className="font-display text-2xl font-extrabold">{s.name}</h2>
              <span className="text-sm text-muted-foreground">
                {[s.grade && `Grade ${s.grade}`, s.village].filter(Boolean).join(" · ")}
              </span>
              <span className="ml-auto rounded-full bg-secondary px-3 py-1 text-xs font-bold">
                {s.meanings.length}/{WORDS.length} words
              </span>
            </header>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">Word</th>
                    <th className="py-2 pr-3">Official meaning (word list)</th>
                    <th className="py-2 pr-3">Student's Marathi meaning</th>
                    <th className="py-2">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {s.meanings.map(m => {
                    const official = WORDS.find(w => w.id === m.word_id);
                    return (
                      <tr key={m.id} className="border-t border-border/60 align-top">
                        <td className="py-2 pr-3">
                          <div className="font-display text-base font-extrabold">{m.word}</div>
                          <div className="text-xs text-muted-foreground">{official?.pronunciation}</div>
                        </td>
                        <td className="py-2 pr-3 text-foreground/75">{official?.meaning ?? "—"}</td>
                        <td className="py-2 pr-3 font-semibold">{m.meaning}</td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {new Date(m.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
