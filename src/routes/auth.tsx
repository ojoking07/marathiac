import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Sign in | Alphabet Commanders" },
      { name: "description", content: "Sign in or create a student account to save your English progress." },
      { property: "og:title", content: "Sign in to Alphabet Commanders" },
      { property: "og:description", content: "Create a free student account to practise English sentences and save your stars." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://marathiac.lovable.app/auth" },
    ],
    links: [{ rel: "canonical", href: "https://marathiac.lovable.app/auth" }],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(80),
  grade: z.string().trim().max(40),
  village: z.string().trim().max(80),
  email: z.string().trim().email("Enter a valid email").max(200),
  password: z.string().min(6, "At least 6 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [village, setVillage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse({ name, grade, village, email, password });
        if (!parsed.success) { setErr(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/practice`,
            data: { name, grade, village },
          },
        });
        if (error) { setErr(error.message); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setErr(error.message); return; }
      }
      navigate({ to: "/practice" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-3xl bg-card p-6 shadow-pop sm:p-8">
        <div className="text-center">
          <div className="text-4xl">🌊</div>
          <h1 className="mt-2 font-display text-3xl font-extrabold">
            {mode === "signin" ? "Sign in to Alphabet Commanders" : "Create your Alphabet Commanders account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to keep your progress." : "Create a student account."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3" autoComplete="off">
          {mode === "signup" && (
            <>
              <Field label="Your name" value={name} onChange={setName} placeholder="e.g., Aarav" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Class / Grade" value={grade} onChange={setGrade} placeholder="e.g., 5" />
                <Field label="Village" value={village} onChange={setVillage} placeholder="e.g., Wai" />
              </div>
            </>
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" />

          {err && <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground shadow-pop transition hover:scale-[1.02] disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === "signin" ? (
            <button className="text-primary hover:underline" onClick={() => setMode("signup")}>
              New here? Create an account
            </button>
          ) : (
            <button className="text-primary hover:underline" onClick={() => setMode("signin")}>
              Already have an account? Sign in
            </button>
          )}
        </div>
        <div className="mt-2 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">← Back home</Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="mt-1 w-full rounded-2xl border-2 border-border bg-background px-4 py-2.5 text-base outline-none focus:border-primary"
      />
    </label>
  );
}
