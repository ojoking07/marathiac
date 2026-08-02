import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: RedirectPayload | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: RedirectPayload | null; error: { message: string } | null }>;
};
type RedirectPayload = { redirect_url?: string; redirect_to?: string };
type AuthorizationDetails = RedirectPayload & { client?: { name?: string } };

const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl">Could not load this authorization request</h1>
      <p className="mt-2 text-muted-foreground">{String((error as Error)?.message ?? error)}</p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    if (err) { setBusy(false); setError(err.message); return; }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); setError("No redirect returned by the authorization server."); return; }
    window.location.href = target;
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl bg-card p-8 text-center shadow-pop">
        <div className="text-5xl">🔗</div>
        <h1 className="mt-4 text-2xl text-foreground">Connect {clientName} to your account</h1>
        <p className="mt-2 text-muted-foreground">
          This lets {clientName} use Alphabet Commanders as you — reading and saving your own sentences,
          meanings and progress.
        </p>
        {error && <p role="alert" className="mt-4 text-sm font-semibold text-destructive">{error}</p>}
        <div className="mt-6 flex justify-center gap-3">
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-soft disabled:opacity-60"
          >
            Approve
          </button>
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="rounded-full border-2 border-border bg-card px-6 py-3 font-bold text-foreground disabled:opacity-60"
          >
            Deny
          </button>
        </div>
      </div>
    </main>
  );
}
