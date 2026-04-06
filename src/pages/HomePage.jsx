import { ArrowRight, BarChart3, ClipboardCheck, LayoutPanelTop, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import heroSystemOverview from "../../assets/images/hero-system-overview.svg";
import { assessmentData } from "../lib/assessment-data.js";

const pillars = [
  {
    number: "01",
    title: "Pricing",
    description: "Optimizing price strategy across channels and customer segments to capture maximum value.",
    icon: TrendingUp,
  },
  {
    number: "02",
    title: "OBPPC",
    description: "Occasion, Brand, Pack, Price, Channel segmentation for precise commercial targeting.",
    icon: LayoutPanelTop,
  },
  {
    number: "03",
    title: "Promotion",
    description: "Evaluating trade promotion investment effectiveness and ROI across spend categories.",
    icon: BarChart3,
  },
  {
    number: "04",
    title: "DFR / TI",
    description: "Managing distributor fees, rebates, and trade investments to protect net margin.",
    icon: ClipboardCheck,
  },
];

const stages = [
  { number: "1", label: "Foundation",  description: "Manual processes, limited visibility" },
  { number: "2", label: "Developed",   description: "Structured processes, basic analytics" },
  { number: "3", label: "Advanced",    description: "Target state — data-driven decisions", highlight: true },
  { number: "4", label: "Expert",      description: "Predictive capability, integrated systems" },
  { number: "5", label: "Mastery",     description: "Automated intelligence and leadership" },
];

export function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-0 px-8 py-12 md:px-12">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="mb-20 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-8">
          <div>
            <p className="mb-3 text-[0.72rem] font-black uppercase tracking-[0.3em] text-[var(--swire-red)]">
              Assessment Portal
            </p>
            <h1 className="font-[var(--font-display)] text-5xl font-black leading-[1.08] tracking-tight text-[var(--text-primary)] md:text-6xl">
              The Precision<br />
              <span className="text-[var(--swire-red)]">Architect</span>
            </h1>
          </div>
          <p className="max-w-xl text-lg font-light leading-8 text-[var(--text-secondary)]">
            Transform complexity into a structured roadmap for commercial excellence through a strategic 48-question RGM maturity assessment.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/assessment">
              <button className="inline-flex items-center gap-2 rounded-xl bg-[var(--swire-red)] px-6 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(225,38,28,0.28)] transition hover:bg-[#ca2118] hover:shadow-[0_18px_36px_rgba(225,38,28,0.34)]">
                Start Assessment
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </Link>
            <Link to="/framework">
              <button className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-white px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)]">
                Review Framework
              </button>
            </Link>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Pillars",    value: assessmentData.meta.pillarCount,   sub: "Core commercial levers" },
              { label: "Stages",     value: assessmentData.meta.stageCount,    sub: "Capability chain" },
              { label: "Questions",  value: assessmentData.meta.questionCount, sub: "Maturity signals" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-container-lowest,#fff)] p-4 shadow-[var(--shadow-soft)]"
              >
                <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-[var(--text-secondary)]">{stat.label}</p>
                <strong className="mt-1 block text-3xl font-black text-[var(--text-primary)]">
                  {String(stat.value).padStart(2, "0")}
                </strong>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero image */}
        <div className="relative rounded-3xl bg-[var(--surface-glass)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
          <img
            src={heroSystemOverview}
            alt="System view of pillars, stages, and enablers in the Swire RGM assessment"
            className="w-full rounded-[20px] bg-white"
          />
          {/* Floating accent */}
          <div className="absolute -bottom-4 -left-4 rounded-2xl border border-[var(--border-soft)] bg-white px-5 py-3 shadow-[var(--shadow-card)]">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-[var(--text-secondary)]">Maturity Target</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">Stage 3</p>
          </div>
          <div className="absolute -right-4 -top-4 rounded-2xl border border-[var(--border-soft)] bg-white px-5 py-3 shadow-[var(--shadow-card)]">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-[var(--text-secondary)]">Active Pillars</p>
            <p className="text-2xl font-black text-[var(--text-primary)]">04</p>
          </div>
        </div>
      </section>

      {/* ── Divider ───────────────────────────────────────────── */}
      <div className="mb-16 flex items-center gap-6">
        <div className="h-px flex-1 bg-[var(--border-soft)]" />
        <span className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)]">The 04 Pillars</span>
        <div className="h-px flex-1 bg-[var(--border-soft)]" />
      </div>

      {/* ── 4 Pillars ──────────────────────────────────────────── */}
      <section className="mb-20 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {pillars.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.number}
              className="group relative overflow-hidden rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-container-lowest,#fff)] p-8 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(23,28,31,0.1)]"
            >
              <span className="absolute right-5 top-4 text-6xl font-black leading-none text-[var(--surface-container-highest,#dfe3e7)] transition-colors duration-300 group-hover:text-[rgba(225,38,28,0.07)] select-none">
                {p.number}
              </span>
              <div className="relative">
                <span className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--swire-red)]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mb-3 font-[var(--font-display)] text-xl font-bold text-[var(--text-primary)]">{p.title}</h3>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">{p.description}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── Divider ───────────────────────────────────────────── */}
      <div className="mb-16 flex items-center gap-6">
        <div className="h-px flex-1 bg-[var(--border-soft)]" />
        <span className="text-[0.65rem] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)]">Maturity Framework</span>
        <div className="h-px flex-1 bg-[var(--border-soft)]" />
      </div>

      {/* ── 5-Stage Maturity ───────────────────────────────────── */}
      <section className="mb-20">
        <div className="mb-8 max-w-2xl">
          <h2 className="font-[var(--font-display)] text-4xl font-black tracking-tight text-[var(--text-primary)]">
            Five stages from <span className="text-[var(--swire-red)]">Foundation</span> to Mastery
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">
            Each stage represents a step-change in commercial capability — from manual, reactive processes to automated intelligence.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-5">
          {stages.map((s) => (
            <div
              key={s.number}
              className={[
                "relative rounded-2xl border p-6 transition-all duration-200",
                s.highlight
                  ? "border-[var(--swire-red)] bg-[rgba(225,38,28,0.04)] shadow-[0_0_0_1px_rgba(225,38,28,0.15),var(--shadow-card)]"
                  : "border-[var(--border-soft)] bg-[var(--surface-container-lowest,#fff)] shadow-[var(--shadow-soft)]",
              ].join(" ")}
            >
              {s.highlight && (
                <span className="absolute -top-2.5 left-4 rounded-full bg-[var(--swire-red)] px-2.5 py-0.5 text-[0.6rem] font-black uppercase tracking-widest text-white">
                  Target
                </span>
              )}
              <p className={[
                "text-4xl font-black leading-none",
                s.highlight ? "text-[var(--swire-red)]" : "text-[var(--surface-container-highest,#dfe3e7)]",
              ].join(" ")}>{s.number}</p>
              <p className="mt-3 text-sm font-bold text-[var(--text-primary)]">{s.label}</p>
              <p className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why it exists ──────────────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-container-lowest,#fff)] p-8 shadow-[var(--shadow-card)]">
          <p className="mb-3 text-[0.72rem] font-black uppercase tracking-[0.26em] text-[var(--swire-red)]">Why It Exists</p>
          <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Turn a complex workbook into a decision-ready operating view.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--text-secondary)]">
            The portal reduces completion friction while preserving the workbook's structure, anchor logic, and reporting outputs for leadership review.
          </p>
        </div>

        <div className="grid gap-4 rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-container-lowest,#fff)] p-8 shadow-[var(--shadow-card)] md:grid-cols-3">
          {[
            { title: "Explain the model",   body: "Clarify what is being assessed before the respondent starts scoring." },
            { title: "Guide the scoring",   body: "Use a digital flow with autosave, progress, and section-based completion." },
            { title: "Read the outcome",    body: "Surface results by pillar, stage, enabler, and priority without leaving the workflow." },
          ].map((item) => (
            <div key={item.title} className="space-y-2">
              <div className="h-1 w-8 rounded-full bg-[var(--swire-red)]" />
              <h3 className="text-base font-bold text-[var(--text-primary)]">{item.title}</h3>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
