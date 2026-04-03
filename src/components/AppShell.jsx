import { ArrowRight, Settings2 } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Button } from "./ui.jsx";

const navigation = [
  { label: "Home", to: "/" },
  { label: "Framework", to: "/framework" },
  { label: "Logic", to: "/logic" },
  { label: "Assessment", to: "/assessment" },
];

export function AppShell({ children }) {
  const location = useLocation();
  const isAssessment = location.pathname === "/assessment";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-[var(--surface-glass)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3"
            aria-label="Swire RGM Assessment Portal home"
          >
            <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--swire-red)] text-base font-bold text-white shadow-[0_12px_26px_rgba(225,38,28,0.22)]">
              S
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                Swire Coca-Cola
              </strong>
              <span className="block truncate text-xs text-[var(--text-secondary)]">
                RGM Assessment Portal
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/72 px-2 py-1 shadow-[var(--shadow-soft)] lg:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "rounded-full px-4 py-2 text-sm font-medium transition duration-200",
                    isActive
                      ? "bg-[var(--swire-red)] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[rgba(38,38,38,0.05)] hover:text-[var(--text-primary)]",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="hidden items-center gap-2 rounded-full border border-[var(--border-soft)] bg-white/75 px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[rgba(225,38,28,0.2)] hover:text-[var(--text-primary)] md:inline-flex"
            >
              <Settings2 className="size-4" aria-hidden="true" />
              Admin
            </Link>
            <Link to="/assessment" className="hidden md:block">
              <Button aria-label={isAssessment ? "Review live results" : "Start assessment"}>
                <span>{isAssessment ? "Review Results" : "Start Assessment"}</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/70 bg-white/75">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-[var(--text-secondary)] md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Swire RGM Assessment Portal</p>
            <p>Structured assessment, live scoring, and lightweight operating governance.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/framework" className="hover:text-[var(--text-primary)]">
              Framework
            </Link>
            <Link to="/logic" className="hover:text-[var(--text-primary)]">
              Logic
            </Link>
            <Link to="/assessment" className="hover:text-[var(--text-primary)]">
              Assessment
            </Link>
            <Link to="/admin" className="hover:text-[var(--text-primary)]">
              Admin Setup
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
