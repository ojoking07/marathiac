import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { listProgress, pickTestWords, recordAttempt } from "@/lib/progress";
import { WORDS, type WordEntry } from "@/lib/words";
import { submitTestAttempt, type ScoredAnswer } from "@/lib/test-scoring.functions";
import { listMyAttempts, formatWhen } from "@/lib/tests";
import { getTestQuestionCount, DEFAULT_TEST_QUESTIONS } from "@/lib/test-settings";
import { NoAssistInput, NoAssistTextarea } from "@/components/NoAssistTextarea";
import { toast } from "sonner";

const TIME_LIMIT_SEC = 15 * 60; // 15 minutes
const MAX_VIOLATIONS = 1;

export const Route = createFileRoute("/_authenticated/test")({
  head: () => ({
    meta: [
      { title: "English Vocabulary Test | Alphabet Commanders" },
      { name: "description", content: "Timed English vocabulary and sentence test with lockdown mode and automatic scoring." },
      { property: "og:title", content: "English Vocabulary Test — Alphabet Commanders" },
      { property: "og:description", content: "A timed, automatically scored English word and sentence test in lockdown mode." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://marathiac.lovable.app/test" },
    ],
  }),
  component: TestPage,
});

interface Answer { wordId: number; english: string; sentence: string; }
interface Scored {
  word: WordEntry;
  english: string;
  sentence: string;
  spellingCorrect: boolean;
  spellingHint?: string;
  grammarStars: number;
  grammarIssues: string[];
  points: number; // 0–2
}

function TestPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const submitAttempt = useServerFn(submitTestAttempt);
  const { data: progress } = useQuery({ queryKey: ["progress"], queryFn: listProgress });
  const { data: attempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ["my-attempts"],
    queryFn: listMyAttempts,
  });
  const previous = attempts?.[0] ?? null;
  const { data: questionCount = DEFAULT_TEST_QUESTIONS } = useQuery({
    queryKey: ["test-question-count"],
    queryFn: getTestQuestionCount,
  });

  const [stage, setStage] = useState<"intro" | "active" | "done">("intro");
  const [words, setWords] = useState<WordEntry[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SEC);
  const [violations, setViolations] = useState<string[]>([]);
  const [scored, setScored] = useState<Scored[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submittedRef = useRef(false);

  // Timer
  useEffect(() => {
    if (stage !== "active") return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { autoSubmit("time_up"); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Lockdown listeners
  useEffect(() => {
    if (stage !== "active") return;

    const flag = (reason: string) => {
      setViolations(v => {
        const next = [...v, `${reason} at ${new Date().toLocaleTimeString()}`];
        if (next.length >= MAX_VIOLATIONS) autoSubmit("too_many_violations");
        else toast.warning(`Warning: ${reason}. (${next.length}/${MAX_VIOLATIONS})`);
        return next;
      });
    };

    const onVisibility = () => { if (document.hidden) flag("Left the test tab/window"); };
    const onBlur = () => flag("Switched away from the test");
    const onFullscreenChange = () => { if (!document.fullscreenElement) flag("Exited fullscreen"); };
    const block = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      // Block copy/paste/cut, dev tools, tab switching shortcuts.
      if ((e.ctrlKey || e.metaKey) && ["c","v","x","a","u","s","p"].includes(e.key.toLowerCase())) { e.preventDefault(); flag("Blocked shortcut"); }
      if (e.key === "F12") { e.preventDefault(); flag("Blocked dev tools"); }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("paste", block);
    document.addEventListener("cut", block);
    document.addEventListener("selectstart", block);
    document.addEventListener("keydown", onKey);
    document.body.classList.add("test-lockdown");

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("selectstart", block);
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("test-lockdown");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const startTest = async () => {
    const chosen = pickTestWords(progress ?? [], questionCount);
    setWords(chosen);
    setAnswers(chosen.map(w => ({ wordId: w.id, english: "", sentence: "" })));
    setIdx(0);
    setTimeLeft(TIME_LIMIT_SEC);
    setViolations([]);
    submittedRef.current = false;
    setStage("active");
    try { await document.documentElement.requestFullscreen(); } catch { /* ignore */ }
  };

  const updateAnswer = (patch: Partial<Answer>) => {
    setAnswers(a => a.map((x, i) => i === idx ? { ...x, ...patch } : x));
  };

  const autoSubmit = (_reason: string) => { void _reason; submitTest(); };

  const submitTest = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    setStage("done");
    setSubmitting(true);
    if (document.fullscreenElement) { document.exitFullscreen().catch(()=>{}); }

    try {
      // Scoring happens on the server — the browser only sends raw answers.
      const res = await submitAttempt({
        data: {
          answers: words.map((w, i) => ({
            wordId: w.id,
            english: answers[i]?.english ?? "",
            sentence: answers[i]?.sentence ?? "",
          })),
          violations,
          durationSec: TIME_LIMIT_SEC - timeLeft,
        },
      });

      const byId = new Map(words.map(w => [w.id, w]));
      const results: Scored[] = res.results.map((r: ScoredAnswer) => ({
        word: byId.get(r.wordId)!,
        english: r.english,
        sentence: r.sentence,
        spellingCorrect: r.spellingCorrect,
        ...(r.spellingHint ? { spellingHint: r.spellingHint } : {}),
        grammarStars: r.grammarStars,
        grammarIssues: r.grammarIssues,
        points: r.points,
      }));
      setScored(results);

      for (const r of results) {
        try {
          await recordAttempt(r.word.id, r.grammarStars, { spellingCorrect: r.spellingCorrect });
        } catch { /* progress tracking is best-effort */ }
      }
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["my-attempts"] });
      qc.invalidateQueries({ queryKey: ["all-attempts"] });
    } catch (e) {
      console.error(e);
      toast.error("We couldn't score your test. Please try again.");
      submittedRef.current = false;
      setStage("intro");
    } finally {
      setSubmitting(false);
    }
  };

  // Submitting spinner
  if (stage === "done" && submitting) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="animate-pulse text-6xl">📝</div>
        <h1 className="mt-4 text-3xl">Submitting your test…</h1>
        <p className="mt-2 text-muted-foreground">Please wait while we score your answers.</p>
      </div>
    );
  }

  // Already submitted (only one attempt allowed)
  if (stage !== "active" && !scored && previous) {
    const pct = previous.max_score ? Math.round((previous.score / previous.max_score) * 100) : 0;
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl bg-gradient-hero p-8 text-center shadow-pop">
          <div className="text-6xl">✅</div>
          <h1 className="mt-3 font-display text-3xl font-extrabold">You have already submitted your test</h1>
          <p className="mt-2 text-muted-foreground">
            Submitted on <span className="font-bold text-foreground">{formatWhen(previous.created_at)}</span>
          </p>
          <p className="mt-4 font-display text-5xl font-extrabold">{previous.score} / {previous.max_score}</p>
          <p className="text-lg font-semibold text-muted-foreground">{pct}%</p>
          <p className="mt-4 text-sm text-muted-foreground">The test can only be taken once. Your teacher can see your answers and score.</p>
        </div>

        <ol className="mt-6 grid gap-3">
          {previous.details.map((d, i) => (
            <li key={i} className="rounded-3xl bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-lg font-semibold text-muted-foreground">{d.pronunciation}</div>
                  <div className="font-display text-2xl font-extrabold">{d.word}</div>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">{d.points}/2</div>
              </div>
              <div className="mt-3 grid gap-2 text-sm">
                <div>
                  <span className="font-semibold">English word:</span> "{d.english || "—"}"
                  {d.spelling_correct ? <span className="ml-2 text-leaf-foreground">✓ correct</span> : <span className="ml-2 text-coral">✗ incorrect</span>}
                </div>
                <div>
                  <span className="font-semibold">Sentence:</span> "{d.sentence || "—"}"
                  <span className="ml-2">{"⭐".repeat(d.grammar_stars)}<span className="opacity-25">{"⭐".repeat(5 - d.grammar_stars)}</span></span>
                </div>
                {d.issues?.length > 0 && (
                  <ul className="ml-4 list-disc text-xs text-muted-foreground">
                    {d.issues.map((m, k) => <li key={k}>{m}</li>)}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6">
          <button onClick={() => navigate({ to: "/practice" })} className="rounded-full border-2 border-border bg-card px-5 py-2 font-bold">Back to practice</button>
        </div>
      </div>
    );
  }

  if (stage === "intro" && attemptsLoading) {
    return <div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">Loading your test…</div>;
  }


  // Intro
  if (stage === "intro") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-3xl bg-card p-8 shadow-pop">
          <h1 className="font-display text-4xl font-extrabold">📝 English Test</h1>
          <p className="mt-2 text-muted-foreground">
            {questionCount} Marathi words → write the English word AND a sentence using it. Each question is worth 2 points.
          </p>
          <div className="mt-5 rounded-2xl bg-secondary/60 p-4">
            <div className="font-bold">Lockdown rules:</div>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
              <li>Runs in fullscreen — do not exit until you're finished.</li>
              <li>Do not switch tabs, apps, or windows. Copy/paste is disabled.</li>
              <li>Right-click, spellcheck, autocorrect and Grammarly are blocked.</li>
              <li>Timer: {Math.floor(TIME_LIMIT_SEC/60)} minutes. Auto-submits when time is up.</li>
              <li>{MAX_VIOLATIONS} warning = test auto-submits.</li>
            </ul>
          </div>
          <button onClick={startTest}
            className="mt-6 w-full rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-pop hover:scale-[1.02]">
            🔒 Start test in lockdown mode
          </button>
        </div>
      </div>
    );
  }

  // Results
  if (stage === "done" && scored) {
    const total = scored.reduce((s, r) => s + r.points, 0);
    const max = scored.length * 2;
    const pct = Math.round((total / max) * 100);
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-3xl bg-gradient-hero p-8 shadow-pop text-center">
          <div className="text-6xl">{pct >= 80 ? "🏆" : pct >= 60 ? "🎉" : "💪"}</div>
          <h1 className="mt-3 font-display text-3xl font-extrabold">Test submitted — your results</h1>
          <p className="mt-1 text-sm text-muted-foreground">Submitted on {formatWhen(previous?.created_at ?? new Date().toISOString())}</p>
          <p className="mt-2 font-display text-5xl font-extrabold">{total} / {max}</p>
          <p className="text-lg font-semibold text-muted-foreground">{pct}%</p>
          {violations.length > 0 && (
            <p className="mt-2 rounded-full bg-destructive/10 px-3 py-1 text-xs font-bold text-destructive inline-block">
              {violations.length} integrity warning{violations.length === 1 ? "" : "s"}
            </p>
          )}
        </div>

        <ol className="mt-6 grid gap-3">
          {scored.map((r, i) => (
            <li key={i} className="rounded-3xl bg-card p-5 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-lg font-semibold text-muted-foreground">{r.word.pronunciation}</div>
                  <div className="flex items-center gap-2">
                    <div className="font-display text-2xl font-extrabold">{r.word.word}</div>
                    <SpeakButton text={r.word.word} />
                  </div>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 font-bold text-primary">{r.points}/2</div>
              </div>
              <div className="mt-3 grid gap-2 text-sm">
                <div>
                  <span className="font-semibold">English word:</span> "{r.english || "—"}"
                  {r.spellingCorrect ? <span className="ml-2 text-leaf-foreground">✓ correct</span> : <span className="ml-2 text-coral">✗ {r.spellingHint}</span>}
                </div>
                <div>
                  <span className="font-semibold">Sentence:</span> "{r.sentence || "—"}"
                  <span className="ml-2">{"⭐".repeat(r.grammarStars)}<span className="opacity-25">{"⭐".repeat(5 - r.grammarStars)}</span></span>
                </div>
                {r.grammarIssues.length > 0 && (
                  <ul className="ml-4 list-disc text-xs text-muted-foreground">
                    {r.grammarIssues.map((m, k) => <li key={k}>{m}</li>)}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex gap-3">
          <button onClick={() => navigate({ to: "/practice" })} className="rounded-full border-2 border-border bg-card px-5 py-2 font-bold">Back to practice</button>
        </div>
      </div>
    );
  }

  // Active
  const w = words[idx];
  const cur = answers[idx];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-destructive text-destructive-foreground">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2 text-sm font-bold">
          <span>🔒 LOCKDOWN MODE</span>
          <span className={timeLeft < 60 ? "animate-pulse" : ""}>{mins}:{secs.toString().padStart(2,"0")}</span>
          <span>Warnings: {violations.length}/{MAX_VIOLATIONS}</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="sr-only">English vocabulary and sentence test</h1>
        <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-bold">Question {idx + 1} of {words.length}</span>
          <div className="flex gap-1">
            {words.map((_, i) => (
              <span key={i} className={`h-2 w-6 rounded-full ${i < idx ? "bg-primary" : i === idx ? "bg-accent" : "bg-border"}`} />
            ))}
          </div>
        </div>

          <div className="rounded-3xl bg-card p-6 shadow-pop">
          <div className="text-sm font-bold text-muted-foreground">Pronunciation</div>
          <div className="mt-1 font-display text-3xl font-extrabold">{w.pronunciation}</div>

          <label className="mt-6 block">
            <span className="text-sm font-bold">1. Write this in English</span>
            <NoAssistInput
              type="text"
              value={cur.english}
              onChange={(e: ChangeEvent<HTMLInputElement>) => updateAnswer({ english: e.target.value })}
              placeholder="Type the English word…"
              className="mt-1 w-full rounded-2xl border-2 border-border bg-background px-4 py-3 text-lg font-semibold outline-none focus:border-primary"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-bold">2. Write a sentence using it</span>
            <NoAssistTextarea
              value={cur.sentence}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => updateAnswer({ sentence: e.target.value })}
              rows={3}
              placeholder="Write your sentence here…"
              className="mt-1 w-full resize-none rounded-2xl border-2 border-border bg-background p-4 text-base font-semibold outline-none focus:border-primary"
            />
          </label>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setIdx(i => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-bold disabled:opacity-40">
              ← Previous
            </button>
            {idx < words.length - 1 ? (
              <button onClick={() => setIdx(i => i + 1)}
                className="rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground shadow-pop">
                Next →
              </button>
            ) : (
              <button onClick={() => { if (confirm("Submit test?")) submitTest(); }}
                className="rounded-full bg-accent px-5 py-2 font-bold text-accent-foreground shadow-sun">
                🏁 Submit test
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// silence unused warning
void WORDS;
