import { Link2, ShieldCheck, Workflow } from "lucide-react";
import { useState } from "react";
import { SurfaceCard } from "../components/ui.jsx";
import { readCustomEndpoint, saveCustomEndpoint } from "../lib/browser-storage.js";
import { getSubmissionModeLabel } from "../lib/submission.js";

export function AdminPage() {
  const [endpoint, setEndpoint] = useState(() => readCustomEndpoint());
  const [status, setStatus] = useState(
    endpoint
      ? "A browser-specific Apps Script URL override is currently active."
      : "No browser-specific override is set.",
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
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-20 px-8 py-12 pb-24 md:px-12">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="flex flex-col items-end justify-between gap-8 md:flex-row">
        <div className="max-w-2xl space-y-4">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-[var(--swire-red)]">
            Admin Setup
          </p>
          <h1 className="font-[var(--font-display)] text-5xl font-black leading-[1.08] tracking-tight text-[var(--text-primary)] md:text-6xl">
            Configuration stays here. <span className="italic text-[var(--swire-red)]">Respondents stay focused.</span>
          </h1>
          <p className="text-lg font-light leading-relaxed text-[var(--text-secondary)]">
            Endpoint setup and deployment options live here — outside the assessment flow — so nothing interrupts completion.
          </p>
        </div>

        {/* Active path card */}
        <div className="w-full shrink-0 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-container-lowest,#fff)] p-6 shadow-[var(--shadow-card)] md:w-80">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--swire-red)]">
              <Workflow className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[0.65rem] font-black uppercase tracking-widest text-[var(--text-secondary)]">
                Active Submission Path
              </p>
              <p className="text-base font-bold text-[var(--text-primary)]">{getSubmissionModeLabel()}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">
            In Vercel preview or production, the app routes submissions through <code className="rounded bg-[var(--surface-muted)] px-1 py-0.5 text-xs font-mono">/api/assessment</code>. Use the override below for local testing.
          </p>
        </div>
      </section>

      {/* ── Main grid ──────────────────────────────────────────── */}
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">

        {/* Endpoint input */}
        <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-container-lowest,#fff)] p-8 shadow-[var(--shadow-card)] space-y-6">
          <div>
            <p className="mb-2 text-[0.72rem] font-black uppercase tracking-[0.3em] text-[var(--swire-red)]">Browser Override</p>
            <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Set or clear a direct Apps Script URL for this browser.
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              Useful for local testing or emergency bypasses when the Vercel proxy is not yet configured.
            </p>
          </div>

          <label className="grid gap-2 text-sm font-bold text-[var(--text-primary)]">
            Apps Script Web App URL
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="h-12 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[rgba(225,38,28,0.45)] focus:bg-white focus:ring-2 focus:ring-[rgba(225,38,28,0.16)]"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleSave}
              aria-label="Save Apps Script URL override"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--swire-red)] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(225,38,28,0.24)] transition hover:bg-[#ca2118]"
            >
              Save Endpoint
            </button>
            <button
              onClick={handleClear}
              aria-label="Clear Apps Script URL override"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-container-high,#e4e9ed)]"
            >
              Clear Override
            </button>
          </div>

          <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            {status}
          </div>
        </div>

        {/* Info cards */}
        <div className="grid gap-4">
          <SurfaceCard className="rounded-3xl p-7">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--swire-red)]">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Recommended deployment path</h3>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  Store <code className="rounded bg-[var(--surface-muted)] px-1 py-0.5 text-xs font-mono">APPS_SCRIPT_URL</code> as a Vercel environment variable so the assessment uses the proxy route instead of exposing the endpoint in client code.
                </p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="rounded-3xl p-7">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--swire-red)]">
                <Link2 className="size-5" aria-hidden="true" />
              </span>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-[var(--text-primary)]">Keep respondents in flow</h3>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  The assessment page links back here only through a secondary utility path, so the main task remains completion-first.
                </p>
              </div>
            </div>
          </SurfaceCard>

          <div className="rounded-3xl border-l-4 border-[var(--swire-red)] bg-[var(--surface-container-lowest,#fff)] px-6 py-5 shadow-[var(--shadow-soft)]">
            <p className="text-[0.65rem] font-black uppercase tracking-widest text-[var(--text-secondary)]">Submission Mode</p>
            <p className="mt-1 text-xl font-black text-[var(--text-primary)]">{getSubmissionModeLabel()}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {endpoint ? "Using browser-specific override URL" : "Using environment default or Vercel proxy"}
            </p>
          </div>
        </div>

      </section>
    </div>
  );
}
