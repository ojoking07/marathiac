import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): { next?: string } => {
    const next = typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : undefined;
    return next ? { next } : {};
  },


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

const PHONE_RE = /^[6-9]\d{9}$/;
/** Students sign in with their 10-digit phone number; we map it to an internal login id. */
const phoneToEmail = (phone: string) => `${phone}@students.alphabetcommanders.app`;

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(80),
  grade: z.string().trim().max(40),
  village: z.string().trim().max(80),
  phone: z.string().trim().regex(PHONE_RE, "Enter a valid 10-digit Indian phone number"),
  password: z.string().min(6, "At least 6 characters").max(72),
});

/** Teacher/admin accounts sign in with their email and a password. */
const ADMIN_EMAILS = new Set([
  "2009ojastar@gmail.com",
  "shilpanikam@yahoo.com",
  "thedighes@gmail.com",
]);


function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [village, setVillage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isTeacher = role === "teacher";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (isTeacher) {
        const addr = email.trim().toLowerCase();
        if (!ADMIN_EMAILS.has(addr)) { setErr("This email is not a teacher account."); return; }
        if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }

        const { error } = await supabase.auth.signInWithPassword({ email: addr, password });
        if (error) {
          if (error.message === "Invalid login credentials") {
            // First time signing in: create the teacher account with this password.
            const { error: signUpError } = await supabase.auth.signUp({
              email: addr,
              password,
              options: { emailRedirectTo: `${window.location.origin}${next ?? "/admin/meanings"}` },
            });
            if (signUpError) { setErr(signUpError.message); return; }
            const { error: retry } = await supabase.auth.signInWithPassword({ email: addr, password });
            if (retry) { setErr("Wrong password for this teacher account."); return; }
          } else {
            setErr(error.message);
            return;
          }
        }
        if (next) { window.location.href = next; return; }
        navigate({ to: "/admin/meanings" });
        return;
      }


      const digits = phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");

      if (mode === "signup") {
        const parsed = signUpSchema.safeParse({ name, grade, village, phone: digits, password });
        if (!parsed.success) { setErr(parsed.error.issues[0].message); return; }
        const { error } = await supabase.auth.signUp({
          email: phoneToEmail(digits),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${next ?? "/practice"}`,
            data: { name, grade, village, phone: digits },
          },
        });
        if (error) { setErr(error.message); return; }
      } else {
        if (!PHONE_RE.test(digits)) { setErr("Enter a valid 10-digit Indian phone number"); return; }
        const { error } = await supabase.auth.signInWithPassword({
          email: phoneToEmail(digits),
          password,
        });
        if (error) { setErr(error.message === "Invalid login credentials" ? "Wrong phone number or password." : error.message); return; }
      }

      if (next) { window.location.href = next; return; }
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
            {isTeacher ? "Teacher sign in" : mode === "signin" ? "Sign in to Alphabet Commanders" : "Create your Alphabet Commanders account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isTeacher ? "Use your teacher email and password." : mode === "signin" ? "Use your 10-digit phone number." : "Create a student account with your phone number."}
          </p>

        </div>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3" autoComplete="off">
          {!isTeacher && mode === "signup" && (
            <>
              <Field label="Your name" value={name} onChange={setName} placeholder="e.g., Aarav" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Class / Grade" value={grade} onChange={setGrade} placeholder="e.g., 5" />
                <Field label="Village" value={village} onChange={setVillage} placeholder="e.g., Wai" />
              </div>
            </>
          )}

          {isTeacher ? (
            <>
              <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
              <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" />
              <p className="text-xs text-muted-foreground">First time? The password you type here becomes your teacher password.</p>
            </>
          ) : (

            <>
              <Field
                label="Phone number"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={v => setPhone(v.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
              />
              <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" />
            </>
          )}

          {err && <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-full bg-primary px-5 py-3 font-bold text-primary-foreground shadow-pop transition hover:scale-[1.02] disabled:opacity-50"
          >
            {busy ? "Please wait…" : isTeacher ? "Sign in" : mode === "signin" ? "Sign in" : "Create account"}
          </button>

        </form>

        {!isTeacher && (
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
        )}
        <div className="mt-2 text-center">
          <button
            className="text-xs text-muted-foreground hover:underline"
            onClick={() => { setRole(isTeacher ? "student" : "teacher"); setErr(null); setPassword(""); }}
          >
            {isTeacher ? "← Student sign in" : "Teacher sign in"}
          </button>
        </div>
        <div className="mt-2 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">← Back home</Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, inputMode, maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
  inputMode?: "numeric" | "text" | "tel"; maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
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
