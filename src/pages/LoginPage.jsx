import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui.jsx";

export function LoginPage({ configured, loading, onLogin }) {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!configured || loading) {
      return;
    }

    setSubmitting(true);
    setStatus("");
    const result = await onLogin(password);
    if (!result.ok) {
      setStatus(result.message || "Login failed.");
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f7f2ec_0%,#ffffff_55%,#f3f0ea_100%)] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[32px] border border-[rgba(23,28,31,0.08)] bg-white/80 p-8 shadow-[0_28px_80px_rgba(17,17,17,0.08)] backdrop-blur-xl md:p-10">
            <div className="space-y-5">
              <p className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-[var(--swire-red)]">Protected Access</p>
              <h1 className="font-[var(--font-display)] text-4xl font-black leading-[1.05] tracking-tight text-[var(--text-primary)] md:text-5xl">
                Swire RGM Certification Portal
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[var(--text-secondary)] md:text-lg">
                This portal is now protected by a server-side login gate. Access is granted only after a valid password is verified and
                a secure session cookie is issued.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5">
                <ShieldCheck className="size-5 text-[var(--swire-red)]" aria-hidden="true" />
                <p className="mt-4 text-lg font-semibold text-[var(--text-primary)]">Session-based protection</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  The password is checked on the server and the portal runs behind an HttpOnly cookie-based session.
                </p>
              </div>
              <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5">
                <LockKeyhole className="size-5 text-[var(--swire-red)]" aria-hidden="true" />
                <p className="mt-4 text-lg font-semibold text-[var(--text-primary)]">Assessment API protected</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  Submission endpoints are also blocked unless the session is authenticated.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-[rgba(23,28,31,0.08)] bg-white p-8 shadow-[0_28px_80px_rgba(17,17,17,0.08)] md:p-10">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-[var(--swire-red)]">Login</p>
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">Enter portal password</h2>
              <p className="text-sm leading-7 text-[var(--text-secondary)]">
                Use the shared access password for the current deployment.
              </p>
            </div>

            <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter portal password"
                  className="h-12 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[rgba(225,38,28,0.45)] focus:bg-white focus:ring-2 focus:ring-[rgba(225,38,28,0.16)]"
                  autoComplete="current-password"
                />
              </label>

              {!configured ? (
                <div className="rounded-2xl border border-[rgba(178,106,0,0.2)] bg-[rgba(178,106,0,0.08)] px-4 py-3 text-sm leading-6 text-[var(--warning)]">
                  Login is not configured yet. Vercel needs `APP_LOGIN_PASSWORD` and `APP_LOGIN_SESSION_SECRET`.
                </div>
              ) : null}

              {status ? (
                <div className="rounded-2xl border border-[rgba(180,35,24,0.2)] bg-[rgba(180,35,24,0.08)] px-4 py-3 text-sm leading-6 text-[var(--danger)]">
                  {status}
                </div>
              ) : null}

              <Button type="submit" className="h-12 w-full text-base" loading={submitting || loading} disabled={!configured}>
                Enter Portal
              </Button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
