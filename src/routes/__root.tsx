import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useSession } from "../lib/session";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/lib/meanings";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-7xl">🌊</div>
        <h1 className="mt-4 text-4xl text-foreground">Page not found</h1>
        <p className="mt-2 text-muted-foreground">Let's swim back to shore.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-pop transition hover:scale-[1.03]">
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl text-foreground">Something splashed wrong</h1>
        <p className="mt-2 text-muted-foreground">Try again or head home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground shadow-soft">Try again</button>
          <a href="/" className="rounded-full border border-border bg-card px-5 py-2 font-semibold">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Alphabet Commanders — Sentence Practice for Marathi Students" },
      { name: "description", content: "A sentence-building and testing playground for Marathi-speaking children learning English through the US Kids 4 Water Alphabet Commanders program." },
      { name: "author", content: "US Kids 4 Water" },
      // Block Grammarly and other writing assistants across the whole app.
      { name: "grammarly", content: "false" },
      { property: "og:title", content: "Alphabet Commanders — Sentence Practice" },
      { property: "og:description", content: "Learn English one sentence at a time. Marathi Alphabet Commanders program." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SiteHeader() {
  const { user } = useSession();
  const router = useRouter();
  const { data: admin } = useQuery({ queryKey: ["is-admin", user?.id ?? null], queryFn: isAdmin, enabled: !!user });

  const signOut = async () => {
    await supabase.auth.signOut();
    router.invalidate();
    router.navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🌊</span>
          <div className="leading-tight">
            <div className="font-display text-lg font-extrabold text-foreground">Alphabet Commanders</div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">US Kids 4 Water</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/words">Words</NavLink>
          <NavLink to="/practice">Practice</NavLink>
          <NavLink to="/test">Test</NavLink>
          <NavLink to="/my-sentences">My Sentences</NavLink>
          <NavLink to="/my-meanings">My Meanings</NavLink>
          {admin && <NavLink to="/admin/meanings">Review</NavLink>}
          {user ? (
            <button onClick={signOut} className="ml-1 rounded-full border-2 border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground/80 shadow-soft hover:bg-secondary">
              Sign out
            </button>
          ) : (
            <Link to="/auth" className="ml-1 rounded-full bg-primary px-3 py-1.5 text-primary-foreground shadow-soft">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-full px-3 py-1.5 text-foreground/80 transition hover:bg-secondary hover:text-foreground"
      activeProps={{ className: "rounded-full px-3 py-1.5 bg-primary text-primary-foreground shadow-soft" }}
      activeOptions={{ exact: to === "/" }}
    >
      {children}
    </Link>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/60 bg-card/60">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted-foreground">
        <p>
          Built for the <span className="font-semibold text-foreground">Alphabet Commanders</span> program by{" "}
          <a href="https://www.uskids4water.org/" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">
            US Kids 4 Water
          </a>.
        </p>
        <p className="mt-1">Teaching English to Marathi-speaking children in rural India. 🇮🇳</p>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1"><Outlet /></main>
        <SiteFooter />
      </div>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
