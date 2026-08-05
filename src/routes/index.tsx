import { createFileRoute, Link } from "@tanstack/react-router";
import { WORDS, GRAMMAR_STYLES } from "@/lib/words";

const HOME_URL = "https://marathiac.lovable.app/";
const OG_IMAGE = "https://marathiac.lovable.app/og-image.jpg";
const HOME_TITLE = "Alphabet Commanders — English Sentences in Marathi";
const HOME_DESCRIPTION =
  "Free English sentence practice for Marathi-speaking kids: 30 Level 1 words with Marathi pronunciation, instant grammar feedback and a scored test.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: HOME_TITLE },
      { name: "description", content: HOME_DESCRIPTION },
      { property: "og:title", content: HOME_TITLE },
      { property: "og:description", content: HOME_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: HOME_URL },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: HOME_URL }],
  }),
  component: Home,
});

function Home() {
  const preview = WORDS.slice(0, 6);
  const counts = {
    Noun: WORDS.filter(w => w.grammar === "Noun").length,
    Verb: WORDS.filter(w => w.grammar === "Verb").length,
    Adjective: WORDS.filter(w => w.grammar === "Adjective").length,
    Adverb: WORDS.filter(w => w.grammar === "Adverb").length,
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="pointer-events-none absolute -top-16 -right-20 h-72 w-72 rounded-full bg-sun/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="animate-pop-in">
              <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-soft">
                🌊 US Kids 4 Water · Level 1
              </span>
              <h1 className="mt-4 text-4xl leading-tight text-foreground sm:text-6xl">
                Learn English,{" "}
                <span className="bg-gradient-ocean bg-clip-text text-transparent">one sentence</span>{" "}
                at a time.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                A friendly playground for the Alphabet Commanders program. Explore 30 English words with Marathi meanings, then write your own sentences and collect stars. मराठी मुलांसाठी!
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/practice"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-pop transition hover:scale-[1.03]"
                >
                  ✏️ Start Practicing
                </Link>
                <Link
                  to="/words"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-primary/20 bg-card px-6 py-3 font-bold text-foreground shadow-soft transition hover:bg-secondary"
                >
                  📚 Browse Word Bank
                </Link>
              </div>
              <dl className="mt-8 grid max-w-md grid-cols-4 gap-3 text-center">
                {(["Noun","Verb","Adjective","Adverb"] as const).map(g => (
                  <div key={g} className="rounded-2xl bg-card p-3 shadow-soft">
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{g}</dt>
                    <dd className="mt-0.5 font-display text-2xl font-extrabold text-foreground">{counts[g]}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Illustration card stack */}
            <div className="relative h-[380px] w-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-bob rounded-3xl bg-gradient-ocean p-8 text-ocean-foreground shadow-pop">
                  <div className="text-6xl">🌊</div>
                  <div className="mt-3 font-display text-3xl font-extrabold">Alphabet</div>
                  <div className="font-display text-3xl font-extrabold">Commanders</div>
                  <div className="mt-2 text-sm opacity-90">Level 1 · 30 words</div>
                </div>
              </div>
              <div className="absolute left-4 top-6 w-44 rotate-[-8deg] rounded-2xl bg-card p-4 shadow-pop">
                <div className="text-xs font-bold uppercase text-coral">Verb</div>
                <div className="font-display text-2xl font-extrabold">Discover</div>
                <div className="text-sm text-muted-foreground">डिस्कव्हर</div>
              </div>
              <div className="absolute bottom-6 right-2 w-48 rotate-[6deg] rounded-2xl bg-card p-4 shadow-pop">
                <div className="text-xs font-bold uppercase text-sun-foreground">Adjective</div>
                <div className="font-display text-2xl font-extrabold">Curious</div>
                <div className="text-sm text-muted-foreground">क्युरिअस</div>
              </div>
              <div className="absolute bottom-24 left-0 w-40 rotate-[4deg] rounded-2xl bg-card p-4 shadow-pop">
                <div className="text-xs font-bold uppercase text-leaf-foreground">Adverb</div>
                <div className="font-display text-2xl font-extrabold">Together</div>
                <div className="text-sm text-muted-foreground">टुगेदर</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-3xl text-foreground sm:text-4xl">How it works</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
          Three simple steps to build strong English sentences.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            { emoji: "🔎", title: "1. Explore a word", body: "See the word, hear it in Marathi letters, and learn what it means." },
            { emoji: "✏️", title: "2. Write your sentence", body: "Use the word in your own sentence. Add capital letters and end punctuation." },
            { emoji: "⭐", title: "3. Earn stars", body: "Get instant feedback and save your best sentences to your journal." },
          ].map(step => (
            <div key={step.title} className="rounded-3xl bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-pop">
              <div className="text-4xl">{step.emoji}</div>
              <h3 className="mt-3 font-display text-xl font-extrabold">{step.title}</h3>
              <p className="mt-1 text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Word preview */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl text-foreground sm:text-4xl">Some words to try</h2>
          <Link to="/words" className="text-sm font-bold text-primary hover:underline">See all 30 →</Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map(w => {
            const s = GRAMMAR_STYLES[w.grammar];
            return (
              <Link
                key={w.id}
                to="/practice"
                search={{ word: w.word }}
                className={`group block rounded-3xl bg-card p-5 shadow-soft ring-1 ${s.ring} transition hover:-translate-y-1 hover:shadow-pop`}
              >
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${s.chip}`}>
                    {s.emoji} {s.label}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">#{w.id}</span>
                </div>
                <div className="mt-3 font-display text-3xl font-extrabold text-foreground">{w.word}</div>
                <div className="text-sm text-muted-foreground">{w.pronunciation}</div>
                <p className="mt-2 text-sm text-foreground/80">{w.meaning}</p>
                <div className="mt-3 text-sm font-semibold text-primary opacity-0 transition group-hover:opacity-100">Practice this word →</div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
