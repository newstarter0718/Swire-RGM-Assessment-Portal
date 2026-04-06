import { useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  Gauge,
  HelpCircle,
  Home,
  LayoutPanelTop,
  Menu,
  Settings2,
  X,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const navItems = [
  { label: "Home",       to: "/",           icon: Home,           end: true },
  { label: "Framework",  to: "/framework",  icon: LayoutPanelTop, end: false },
  { label: "Logic",      to: "/logic",      icon: Gauge,          end: false },
  { label: "Assessment", to: "/assessment", icon: ClipboardList,  end: false },
  { label: "Admin Setup",to: "/admin",      icon: Settings2,      end: false },
];

export function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const close = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-[var(--surface)]">

      {/* ── Top header ─────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-[var(--border-soft)] bg-white/80 px-5 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            className="flex size-9 items-center justify-center rounded-xl text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>

          <Link to="/" className="flex items-center gap-2.5" aria-label="Swire RGM home">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--swire-red)] text-sm font-black text-white shadow-[0_8px_20px_rgba(225,38,28,0.28)]">
              S
            </span>
            <span className="hidden sm:block leading-tight">
              <strong className="block text-sm font-semibold text-[var(--text-primary)]">Swire Coca-Cola</strong>
              <span className="block text-[11px] text-[var(--text-secondary)]">RGM Assessment Portal</span>
            </span>
          </Link>
        </div>

        <Link to="/assessment">
          <button className="hidden items-center gap-2 rounded-lg bg-[var(--swire-red)] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(225,38,28,0.24)] transition hover:bg-[#ca2118] md:inline-flex">
            Start Assessment
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </Link>
      </header>

      {/* ── Sidebar ────────────────────────────────────────────── */}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={close}
        />
      )}

      <aside
        className={[
          "fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-[var(--border-soft)] bg-[var(--surface-muted)] pt-16 transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {/* Mobile close */}
        <button
          className="absolute right-3 top-[68px] flex size-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--surface-container-high,#e4e9ed)] lg:hidden"
          onClick={close}
          aria-label="Close navigation"
        >
          <X className="size-4" />
        </button>

        {/* Brand block */}
        <div className="border-b border-[var(--border-soft)] px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--swire-red)] text-sm font-black text-white shadow-[0_8px_20px_rgba(225,38,28,0.22)]">
              S
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-[var(--text-primary)]">RGM Portal</p>
              <p className="text-[11px] text-[var(--text-secondary)]">Enterprise Assessment</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 thin-scrollbar">
          <div className="space-y-0.5">
            {navItems.map(({ label, to, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={close}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "border-l-2 border-[var(--swire-red)] bg-[rgba(225,38,28,0.07)] pl-[10px] text-[var(--swire-red)]"
                      : "text-[var(--text-secondary)] hover:translate-x-0.5 hover:bg-[rgba(23,28,31,0.05)] hover:text-[var(--text-primary)]",
                  ].join(" ")
                }
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-[var(--border-soft)] px-3 py-4 space-y-1">
          <Link to="/assessment" onClick={close} className="block">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--swire-red)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(225,38,28,0.25)] transition hover:scale-[1.02] active:scale-[0.98]">
              <ArrowRight className="size-4" aria-hidden="true" />
              Start Assessment
            </button>
          </Link>
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[rgba(23,28,31,0.05)] hover:text-[var(--text-primary)] cursor-default">
            <HelpCircle className="size-4 shrink-0" aria-hidden="true" />
            Support
          </div>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────── */}
      <main className="min-h-screen pt-16 lg:ml-64">
        {children}
      </main>

    </div>
  );
}
