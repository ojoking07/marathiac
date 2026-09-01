import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { isAdmin } from "@/lib/meanings";
import { listAllAttempts, formatWhen } from "@/lib/tests";

export const Route = createFileRoute("/_authenticated/admin/tests")({
  head: () => ({
    meta: [
      { title: "Teacher Review — Test Results | Alphabet Commanders" },
      { name: "description", content: "Private teacher view of every student's submitted English test, with scores and written answers." },
      { property: "og:title", content: "Teacher Review — Test Results" },
      { property: "og:description", content: "See each student's test score and their written English answers." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://marathiac.lovable.app/admin/tests" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminTests,
});

function AdminTests() {
  const { data: admin, isLoading: checking } = useQuery({ queryKey: ["is-admin"], queryFn: isAdmin });
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["all-attempts"],
    queryFn: listAllAttempts,
    enabled: admin === true,
  });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  if (checking) return <div className="mx-auto max-w-4xl px-4 py-16 text-muted-foreground">Checking access…</div>;

  if (!admin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="text-6xl">🔒</div>
        <h1 className="mt-4 text-3xl">Teachers only</h1>
        <p className="mt-2 text-muted-foreground">Test results can only be reviewed by a teacher account.</p>
        <Link to="/test" className="mt-6 inline-block rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground shadow-pop">
          Go to Test
        </Link>
      </div>
    );
  }

  const filtered = students.filter(s =>
    !q.trim() || s.name.toLowerCase().includes(q.toLowerCase()) || s.village.toLowerCase().includes(q.toLowerCase()));
  const totalAttempts = students.reduce((n, s) => n + s.attempts.length, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl">Test Results</h1>
          <p className="mt-1 text-muted-foreground">
            {isLoading ? "Loading…" : `${students.length} student${students.length === 1 ? "" : "s"} · ${totalAttempts} test${totalAttempts === 1 ? "" : "s"} submitted`}
          </p>
        </div>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by name or village…"
          aria-label="Search students"
          className="w-64 rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-semibold outline-none focus:border-primary"
        />
      </div>

      {!isLoading && filtered.length === 0 && (
        <p className="mt-10 rounded-3xl bg-card p-8 text-center text-muted-foreground shadow-soft">No submitted tests yet.</p>
      )}

      <div className="mt-6 grid gap-4">
        {filtered.map(s => (
          <div key={s.userId} className="rounded-3xl bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl">{s.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {[s.grade && `Grade ${s.grade}`, s.village].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                {s.attempts.length} test{s.attempts.length === 1 ? "" : "s"}
              </div>
            </div>

            <ul className="mt-4 grid gap-3">
              {s.attempts.map(a => {
                const pct = a.max_score ? Math.round((a.score / a.max_score) * 100) : 0;
                const isOpen = open === a.id;
                return (
                  <li key={a.id} className="rounded-2xl bg-secondary/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold">
                        Submitted {formatWhen(a.created_at)}
                        {(a.integrity.violations?.length ?? 0) > 0 && (
                          <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                            {a.integrity.violations?.length} integrity warning(s)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display text-xl font-extrabold">{a.score} / {a.max_score}</span>
                        <span className="text-sm font-bold text-muted-foreground">{pct}%</span>
                        <button
                          onClick={() => setOpen(isOpen ? null : a.id)}
                          className="rounded-full border-2 border-border bg-card px-3 py-1 text-xs font-bold">
                          {isOpen ? "Hide answers" : "View answers"}
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <ol className="mt-3 grid gap-2">
                        {a.details.map((d, i) => (
                          <li key={i} className="rounded-xl bg-card p-3 text-sm shadow-soft">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-display text-lg font-extrabold">{d.word}</span>
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{d.points}/2</span>
                            </div>
                            <div className="mt-1">
                              <span className="font-semibold">English word:</span> "{d.english || "—"}"
                              {d.spelling_correct ? " ✓" : " ✗"}
                            </div>
                            <div>
                              <span className="font-semibold">Sentence:</span> "{d.sentence || "—"}" · {d.grammar_stars}/5 stars
                            </div>
                            {d.issues?.length > 0 && (
                              <ul className="ml-4 list-disc text-xs text-muted-foreground">
                                {d.issues.map((m, k) => <li key={k}>{m}</li>)}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
