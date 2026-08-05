import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteSentence, listSentences } from "@/lib/sentences";
import { findWord, GRAMMAR_STYLES } from "@/lib/words";

export const Route = createFileRoute("/_authenticated/my-sentences")({
  head: () => ({
    meta: [
      { title: "My Sentences | Alphabet Commanders" },
      { name: "description", content: "Review and manage your saved English sentences, track your star ratings, and see your writing progress in the Alphabet Commanders program." },
      { property: "og:title", content: "My Sentences — Alphabet Commanders" },
      { property: "og:description", content: "Your personal journal of English sentences and the stars you earned for each one." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://marathiac.lovable.app/my-sentences" },
    ],
  }),
  component: MySentences,
});

function MySentences() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({ queryKey: ["sentences"], queryFn: listSentences });

  const onRemove = async (id: string) => {
    await deleteSentence(id);
    qc.invalidateQueries({ queryKey: ["sentences"] });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl sm:text-5xl">My Sentences</h1>
          <p className="mt-1 text-muted-foreground">
            {isLoading ? "Loading…" : items.length === 0 ? "No sentences yet — write your first one!" : `You've saved ${items.length} sentence${items.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        <Link to="/practice" className="rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground shadow-pop hover:scale-[1.03]">
          ✏️ Write another
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="mt-12 rounded-3xl bg-card p-10 text-center shadow-soft">
          <div className="text-6xl">📓</div>
          <h2 className="mt-3 font-display text-2xl font-extrabold">Your journal is empty</h2>
          <p className="mt-1 text-muted-foreground">Practice writing sentences and reach 3 stars to save them here.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3">
          {items.map(item => {
            const w = findWord(item.word);
            const style = w ? GRAMMAR_STYLES[w.grammar] : null;
            return (
              <li key={item.id} className="rounded-3xl bg-card p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {style && <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${style.chip}`}>{style.emoji} {style.label}</span>}
                    <span className="font-display text-xl font-extrabold">{item.word}</span>
                    {w && <span className="text-sm text-muted-foreground">· {w.pronunciation}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-lg leading-none">
                      {[1,2,3,4,5].map(i => <span key={i} className={i <= item.stars ? "" : "opacity-25 grayscale"}>⭐</span>)}
                    </div>
                    <button onClick={() => onRemove(item.id)} aria-label={`Remove sentence "${item.sentence}"`} className="rounded-full px-2 py-1 text-xs font-bold text-muted-foreground hover:text-destructive">Remove</button>
                  </div>
                </div>
                <p className="mt-2 text-lg">"{item.sentence}"</p>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
