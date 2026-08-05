import { createFileRoute, Link } from "@tanstack/react-router";
import { DAILY_SENTENCE_GROUPS } from "@/data/daily-sentences";

const URL = "https://marathiac.lovable.app/sentences/daily-guide";
const OG_IMAGE = "https://marathiac.lovable.app/og-image.jpg";
const TITLE = "Daily Use English Sentences for Students: A Step-by-Step Guide";
const META_TITLE = "Daily English Sentences Guide | Alphabet Commanders";
const DESCRIPTION =
  "A step-by-step guide for students learning daily use English sentences — classroom and household phrases, Marathi pronunciation and a 5-step practice routine.";

const FAQS = [
  {
    q: "How many sentences should I learn a day?",
    a: "Five is enough. Saying five sentences correctly every day works better than reading fifty once.",
  },
  {
    q: "Do I need to know Marathi meanings?",
    a: "Each sentence shows a Marathi meaning and pronunciation, and you can save your own Marathi meaning for every word once you sign in.",
  },
  {
    q: "Is this free?",
    a: "Yes. Alphabet Commanders is a free resource built by US Kids 4 Water for students in rural India.",
  },
];

const STEPS = [
  {
    n: 1,
    title: "Start with the 30 Level 1 words",
    body:
      "Every daily sentence is built from a small set of words. Open the Word Bank, read each word out loud with its Marathi pronunciation, and learn five new words a day.",
    to: "/words" as const,
    linkLabel: "Open the Word Bank",
  },
  {
    n: 2,
    title: "Learn ready-made everyday sentences",
    body:
      "Before writing your own, copy good examples. Read the greetings, classroom and household sentences aloud three times each, matching the Marathi pronunciation written under them.",
    to: "/sentences/daily-use" as const,
    linkLabel: "See daily use sentences",
  },
  {
    n: 3,
    title: "Change one word at a time",
    body:
      "Take a sentence like \"I am going to school.\" and swap one word: \"I am going to the market.\" Changing one word teaches sentence structure faster than memorising whole lines.",
  },
  {
    n: 4,
    title: "Write your own sentence and check the grammar",
    body:
      "In Practice, choose a word and write your own sentence. The grammar checker looks at spelling, capital letters, full stops, subject-verb agreement and word order, and gives you stars.",
    to: "/practice" as const,
    linkLabel: "Go to sentence practice",
  },
  {
    n: 5,
    title: "Test yourself every week",
    body:
      "The weekly test shows a Marathi pronunciation and asks you to write the English word and a full sentence. Scores are saved so you can see which words you have mastered.",
    to: "/test" as const,
    linkLabel: "Take the test",
  },
];

export const Route = createFileRoute("/sentences/daily-guide")({
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
          "@type": "HowTo",
          name: TITLE,
          description: DESCRIPTION,
          inLanguage: ["en", "mr"],
          image: OG_IMAGE,
          publisher: { "@type": "Organization", name: "US Kids 4 Water" },
          mainEntityOfPage: URL,
          step: STEPS.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.title,
            text: s.body,
          })),
        }),
      },
    ],
  }),
  component: DailyGuide,
});

function DailyGuide() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <header>
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
          🌊 US Kids 4 Water · Learning guide
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold sm:text-5xl">
          Daily Use English Sentences for Students
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A step-by-step learning path for Marathi-speaking students who want to speak and write
          everyday English — at school, at home and in the village. Follow the five steps below in
          order, a little every day.
        </p>
      </header>

      <ol className="mt-10 grid gap-5">
        {STEPS.map(s => (
          <li key={s.n} className="rounded-3xl bg-card p-6 shadow-soft">
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-extrabold text-primary-foreground">
                {s.n}
              </span>
              <div>
                <h2 className="font-display text-2xl font-extrabold">{s.title}</h2>
                <p className="mt-2 text-muted-foreground">{s.body}</p>
                {s.to && (
                  <Link to={s.to} className="mt-3 inline-block font-bold text-primary underline">
                    {s.linkLabel} →
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-extrabold">What to practise each week</h2>
        <p className="mt-2 text-muted-foreground">
          Each week, pick one group of everyday sentences and make it your focus. Say them aloud,
          then write two of your own using the same pattern.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {DAILY_SENTENCE_GROUPS.map(g => (
            <article key={g.id} className="rounded-2xl bg-card p-5 shadow-soft">
              <h3 className="font-display text-xl font-extrabold">
                {g.emoji} {g.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{g.blurb}</p>
              <p className="mt-3 font-semibold">{g.sentences[0]?.english}</p>
              <p className="text-sm text-primary">{g.sentences[0]?.marathi}</p>
              <a
                href={`/sentences/daily-use#${g.id}`}
                className="mt-3 inline-block text-sm font-bold text-primary underline"
              >
                All {g.title.toLowerCase()} sentences →
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-extrabold">Common questions</h2>
        <div className="mt-4 grid gap-4">
          <div className="rounded-2xl bg-card p-5 shadow-soft">
            <h3 className="font-display text-lg font-extrabold">
              How many sentences should I learn a day?
            </h3>
            <p className="mt-1 text-muted-foreground">
              Five is enough. Saying five sentences correctly every day works better than reading
              fifty once.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-soft">
            <h3 className="font-display text-lg font-extrabold">
              Do I need to know Marathi meanings?
            </h3>
            <p className="mt-1 text-muted-foreground">
              Each sentence shows a Marathi meaning and pronunciation, and you can save your own
              Marathi meaning for every word once you sign in.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-soft">
            <h3 className="font-display text-lg font-extrabold">Is this free?</h3>
            <p className="mt-1 text-muted-foreground">
              Yes. Alphabet Commanders is a free resource built by US Kids 4 Water for students in
              rural India.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12 rounded-3xl bg-gradient-hero p-8 text-center shadow-pop">
        <h2 className="font-display text-2xl font-extrabold">Start step 1 today</h2>
        <p className="mt-2 text-muted-foreground">
          Create a free student account to save your sentences, meanings and test scores.
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
