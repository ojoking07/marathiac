import { createFileRoute, Link } from "@tanstack/react-router";
import { DAILY_SENTENCE_GROUPS, DAILY_SENTENCE_COUNT } from "@/data/daily-sentences";

const URL = "https://marathiac.lovable.app/sentences/daily-use";
const OG_IMAGE = "https://marathiac.lovable.app/og-image.jpg";
const TITLE = `${DAILY_SENTENCE_COUNT} Daily Use English Sentences with Marathi Meaning`;
const DESCRIPTION =
  "Everyday English sentences with Marathi meaning and pronunciation — greetings, classroom talk and household chores. Free for Marathi-speaking students.";

export const Route = createFileRoute("/sentences/daily-use")({
  head: () => ({
    meta: [
      { title: `${TITLE} | Alphabet Commanders` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: TITLE,
          description: DESCRIPTION,
          inLanguage: ["en", "mr"],
          image: OG_IMAGE,
          author: { "@type": "Organization", name: "US Kids 4 Water" },
          publisher: { "@type": "Organization", name: "US Kids 4 Water" },
          mainEntityOfPage: URL,
        }),
      },
    ],
  }),
  component: DailyUseSentences,
});

function DailyUseSentences() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <header>
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
          🌊 US Kids 4 Water · Free resource
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold sm:text-5xl">
          Daily Use English Sentences with Marathi Meaning
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {DAILY_SENTENCE_COUNT} short English sentences that Marathi-speaking children can use every day — at
          home, at school and in the village. Each sentence shows the Marathi meaning and a simple
          pronunciation written in Marathi script, so you can read it out loud straight away.
        </p>
        <p className="mt-3 text-muted-foreground">
          Read a sentence, say it aloud three times, then try writing your own version in{" "}
          <Link to="/practice" className="font-bold text-primary underline">
            sentence practice
          </Link>{" "}
          or explore the{" "}
          <Link to="/words" className="font-bold text-primary underline">
            30-word Word Bank
          </Link>
          .
        </p>
      </header>

      <nav aria-label="Sentence categories" className="mt-8 flex flex-wrap gap-2">
        {DAILY_SENTENCE_GROUPS.map(g => (
          <a
            key={g.id}
            href={`#${g.id}`}
            className="rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-bold hover:border-primary"
          >
            {g.emoji} {g.title}
          </a>
        ))}
      </nav>

      {DAILY_SENTENCE_GROUPS.map(group => (
        <section key={group.id} id={group.id} className="mt-10 scroll-mt-20">
          <h2 className="font-display text-2xl font-extrabold">
            {group.emoji} {group.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{group.blurb}</p>
          <ul className="mt-4 grid gap-3">
            {group.sentences.map(s => (
              <li key={s.english} className="rounded-2xl bg-card p-4 shadow-soft">
                <p className="font-display text-xl font-extrabold">{s.english}</p>
                <p className="mt-1 text-base font-semibold text-primary">{s.marathi}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.pronunciation}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-12 rounded-3xl bg-gradient-hero p-8 text-center shadow-pop">
        <h2 className="font-display text-2xl font-extrabold">Ready to write your own sentences?</h2>
        <p className="mt-2 text-muted-foreground">
          Alphabet Commanders checks your grammar, gives you stars and saves your progress.
        </p>
        <Link
          to="/auth"
          className="mt-5 inline-block rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-pop"
        >
          Start practising free
        </Link>
      </section>
    </div>
  );
}
