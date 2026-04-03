import { LoaderCircle } from "lucide-react";
import { widthClassFromPercent } from "../lib/assessment.js";

export function Button({
  children,
  type = "button",
  tone = "primary",
  loading = false,
  className = "",
  ...props
}) {
  const toneClass =
    tone === "primary"
      ? "bg-[var(--swire-red)] text-white shadow-[0_14px_30px_rgba(225,38,28,0.24)] hover:bg-[#ca2118]"
      : tone === "secondary"
        ? "border border-[var(--border-strong)] bg-white/80 text-[var(--text-primary)] hover:border-[rgba(225,38,28,0.32)] hover:bg-white"
        : "border border-transparent bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]";

  return (
    <button
      type={type}
      className={[
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--swire-red)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        toneClass,
        className,
      ].join(" ")}
      disabled={loading || props.disabled}
      aria-label={props["aria-label"] || (typeof children === "string" ? children : "Action")}
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}

export function Eyebrow({ children }) {
  return (
    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[var(--swire-red)]">
      {children}
    </p>
  );
}

export function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl space-y-3">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="text-base leading-7 text-[var(--text-secondary)] md:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function SurfaceCard({ children, className = "" }) {
  return (
    <div
      className={[
        "rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-elevated)] p-6 shadow-[var(--shadow-soft)] backdrop-blur-sm",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function MetricBar({ value }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(38,38,38,0.08)]">
      <div
        className={[
          "h-full rounded-full bg-[linear-gradient(90deg,#e1261c_0%,#ff8f87_100%)] transition-[width] duration-300",
          widthClassFromPercent(value),
        ].join(" ")}
      />
    </div>
  );
}
