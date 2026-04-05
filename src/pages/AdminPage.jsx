import { Link2, ShieldCheck, Workflow } from "lucide-react";
import { useState } from "react";
import { Button, Eyebrow, SectionHeading, SurfaceCard } from "../components/ui.jsx";
import { readCustomEndpoint, saveCustomEndpoint } from "../lib/browser-storage.js";
import { getSubmissionModeLabel } from "../lib/submission.js";

export function AdminPage() {
  const [endpoint, setEndpoint] = useState(() => readCustomEndpoint());
  const [status, setStatus] = useState(
    endpoint ? "A browser-specific Apps Script URL override is currently active." : "No browser-specific override is set.",
  );

  function handleSave() {
    saveCustomEndpoint(endpoint);
    setStatus(endpoint ? "Apps Script URL saved for this browser." : "Browser-specific override cleared.");
  }

  function handleClear() {
    setEndpoint("");
    saveCustomEndpoint("");
    setStatus("Browser-specific Apps Script URL override cleared.");
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-5 py-8 md:px-8 md:py-12">
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Eyebrow>Admin Setup</Eyebrow>
          <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">
            Keep configuration close to operations, not inside the respondent flow.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
            The assessment page now stays focused on completion. Endpoint setup, deployment notes, and fallback options live here instead.
          </p>
        </div>

        <SurfaceCard className="rounded-[28px] p-8">
          <div className="grid gap-5">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--swire-red)]">
                <Workflow className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  Active Submission Path
                </p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{getSubmissionModeLabel()}</p>
              </div>
            </div>
            <p className="text-sm leading-7 text-[var(--text-secondary)]">
              In Vercel preview or production, the app can route draft saves and submissions through `/api/assessment`. If you want a browser-specific override, paste the Apps Script URL here.
            </p>
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard className="rounded-[28px] p-8">
          <SectionHeading
            eyebrow="Browser Override"
            title="Set or clear a direct Apps Script URL for this browser."
            description="This is useful for local testing or emergency bypasses when the Vercel proxy is not configured yet."
          />

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
              Apps Script Web App URL
              <input
                value={endpoint}
                onChange={(event) => setEndpoint(event.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="h-12 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[rgba(225,38,28,0.45)] focus:ring-2 focus:ring-[rgba(225,38,28,0.16)]"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={handleSave} aria-label="Save Apps Script URL override">
                Save Endpoint
              </Button>
              <Button tone="secondary" onClick={handleClear} aria-label="Clear Apps Script URL override">
                Clear Override
              </Button>
            </div>

            <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              {status}
            </div>
          </div>
        </SurfaceCard>

        <div className="grid gap-4">
          <SurfaceCard className="rounded-[24px] p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--swire-red)]">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">Recommended deployment path</h3>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  Store `APPS_SCRIPT_URL` as a Vercel environment variable so the assessment uses the proxy route instead of exposing the endpoint in client code.
                </p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-[24px] p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--swire-red)]">
                <Link2 className="size-5" aria-hidden="true" />
              </span>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">Keep respondents in flow</h3>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  The assessment page now links back here only through a secondary utility path, so the main task remains completion-first.
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </section>
    </div>
  );
}
