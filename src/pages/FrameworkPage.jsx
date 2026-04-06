import { Building2, Layers3, Network, ShieldCheck } from "lucide-react";
import frameworkArchitecture from "../../assets/images/framework-architecture.svg";
import { SurfaceCard } from "../components/ui.jsx";
import { assessmentData } from "../lib/assessment-data.js";
import { formatPercent, formatScore } from "../lib/assessment.js";

const pillarIcons = {
  Pricing: Building2,
  OBPPC: Layers3,
  "Promotion Spend": Network,
  "DFR / Trade Investment": ShieldCheck,
};

function Divider({ label }) {
  return (
    <div className="flex items-baseline gap-4 border-b border-[var(--border-soft)] pb-4">
      <h2 className="font-[var(--font-display)] text-4xl font-black tracking-tighter text-[var(--text-primary)]">
        {label}
      </h2>
    </div>
  );
}

export function FrameworkPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-20 px-8 py-12 pb-24 md:px-12">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="flex flex-col items-end justify-between gap-8 md:flex-row">
        <div className="max-w-2xl space-y-4">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-[var(--swire-red)]">
            Framework Strategy
          </p>
          <h1 className="font-[var(--font-display)] text-5xl font-black leading-[1.08] tracking-tight text-[var(--text-primary)] md:text-6xl">
            Revenue Growth <span className="italic text-[var(--swire-red)]">Mastery</span>
          </h1>
          <p className="text-lg font-light leading-relaxed text-[var(--text-secondary)]">
            The Precision Architect framework is our blueprint for sustainable value creation — aligning pricing, promotion, and portfolio strategies through a rigorous data-centric approach.
          </p>
        </div>
        <div className="flex shrink-0 gap-4">
          <div className="rounded-2xl border-l-4 border-[var(--swire-red)] bg-[var(--surface-container-lowest,#fff)] px-6 py-4 shadow-[var(--shadow-soft)]">
            <span className="block text-[0.65rem] font-black uppercase tracking-widest text-[var(--text-secondary)]">Maturity Target</span>
            <span className="text-3xl font-black text-[var(--text-primary)]">Stage 3</span>
          </div>
          <div className="rounded-2xl border-l-4 border-[var(--charcoal-soft,#515f74)] bg-[var(--surface-container-lowest,#fff)] px-6 py-4 shadow-[var(--shadow-soft)]">
            <span className="block text-[0.65rem] font-black uppercase tracking-widest text-[var(--text-secondary)]">Active Pillars</span>
            <span className="text-3xl font-black text-[var(--text-primary)]">04</span>
          </div>
        </div>
      </section>

      {/* ── Framework architecture image ─────────────────────── */}
      <section className="relative h-[360px] overflow-hidden rounded-3xl md:h-[480px]">
        <img
          src={frameworkArchitecture}
          alt="Layered architecture of the Swire RGM assessment framework"
          className="h-full w-full rounded-3xl object-cover opacity-90"
          loading="lazy"
        />
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[var(--surface)] via-transparent to-transparent" />
        {/* Floating glass pill */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 rounded-2xl border border-white/20 bg-white/80 p-5 shadow-2xl backdrop-blur-md">
          <p className="text-[0.65rem] font-black uppercase tracking-widest text-[var(--text-secondary)]">Framework</p>
          <p className="text-xl font-black text-[var(--text-primary)]">4 Pillars × 5 Stages</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">{assessmentData.meta.questionCount} maturity signals</p>
        </div>
      </section>

      {/* ── 4 Pillars ──────────────────────────────────────────── */}
      <section className="space-y-8">
        <Divider label={<>The 04 <span className="italic text-[var(--swire-red)]">Pillars</span></>} />
        <p className="max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
          Each pillar keeps its workbook weight, target, and question count while being reframed into a cleaner visual system.
        </p>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {assessmentData.pillars.map((pillar, index) => {
            const Icon = pillarIcons[pillar.label] || Layers3;
            return (
              <div
                key={pillar.id}
                className="group relative overflow-hidden rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-container-lowest,#fff)] p-8 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(23,28,31,0.1)]"
              >
                <span className="absolute right-5 top-4 select-none text-6xl font-black leading-none text-[var(--surface-container-highest,#dfe3e7)] transition-colors duration-300 group-hover:text-[rgba(225,38,28,0.07)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="relative space-y-4">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--swire-red)]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-[var(--font-display)] text-xl font-bold text-[var(--text-primary)]">
                    {pillar.label}
                  </h3>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">{pillar.description}</p>
                  <div className="grid gap-1.5 border-t border-[var(--border-soft)] pt-4 text-xs text-[var(--text-secondary)]">
                    <p>Questions: <span className="font-bold text-[var(--text-primary)]">{pillar.questionCount}</span></p>
                    <p>Target: <span className="font-bold text-[var(--text-primary)]">{formatScore(pillar.target)}</span></p>
                    <p>Weight: <span className="font-bold text-[var(--text-primary)]">{formatPercent(pillar.weight)}</span></p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5 Stages ───────────────────────────────────────────── */}
      <section className="space-y-8">
        <Divider label={<>The 05 <span className="italic text-[var(--swire-red)]">Stages</span></>} />
        <p className="max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
          Five capability stages show where the operating chain holds or breaks — from opportunity understanding through to forward planning.
        </p>

        <div className="grid gap-4">
          {assessmentData.stages.map((stage) => (
            <div
              key={stage.id}
              className="flex flex-col gap-4 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-container-lowest,#fff)] p-6 shadow-[var(--shadow-soft)] transition hover:shadow-[0_16px_40px_rgba(23,28,31,0.08)] md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-5">
                <span className="shrink-0 text-4xl font-black leading-none text-[var(--surface-container-highest,#dfe3e7)]">
                  {String(stage.order).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-[var(--font-display)] text-xl font-bold text-[var(--text-primary)]">
                    {stage.label.replace(/^\d+\.\s*/, "")}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{stage.description}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-4 text-xs text-[var(--text-secondary)] md:flex-col md:items-end">
                <span className="rounded-full border border-[var(--border-soft)] px-3 py-1 font-medium">
                  {stage.questionCount} questions
                </span>
                <span className="rounded-full border border-[var(--border-soft)] px-3 py-1 font-medium">
                  Target {formatScore(stage.target)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Enablers (Bento grid) ──────────────────────────────── */}
      <section className="space-y-8">
        <Divider label={<>The <span className="italic text-[var(--swire-red)]">Enablers</span></>} />
        <p className="max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
          Cross-cutting enablers are the structural reasons why a strong strategy still fails to land in-market. Not side notes — core capability requirements.
        </p>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {assessmentData.enablers.map((enabler, index) => {
            const isDark = index === 0;
            const isRed = index === assessmentData.enablers.length - 1;
            if (isDark) {
              return (
                <div key={enabler.id} className="space-y-4 rounded-3xl bg-[var(--inverse-surface,#2c3134)] p-7 shadow-[var(--shadow-card)]">
                  <p className="text-[0.65rem] font-black uppercase tracking-widest text-white/40">{enabler.implication}</p>
                  <h3 className="font-[var(--font-display)] text-xl font-bold text-white">{enabler.label}</h3>
                  <p className="text-sm leading-6 text-white/60">{enabler.description}</p>
                  <div className="border-t border-white/10 pt-3 text-xs text-white/40 space-y-1">
                    <p>{enabler.questionCount} questions</p>
                    <p>Target {formatScore(enabler.target)}</p>
                  </div>
                </div>
              );
            }
            if (isRed) {
              return (
                <div key={enabler.id} className="space-y-4 rounded-3xl bg-[var(--swire-red)] p-7 shadow-[0_14px_30px_rgba(225,38,28,0.22)]">
                  <p className="text-[0.65rem] font-black uppercase tracking-widest text-white/60">{enabler.implication}</p>
                  <h3 className="font-[var(--font-display)] text-xl font-bold text-white">{enabler.label}</h3>
                  <p className="text-sm leading-6 text-white/80">{enabler.description}</p>
                  <div className="border-t border-white/20 pt-3 text-xs text-white/60 space-y-1">
                    <p>{enabler.questionCount} questions</p>
                    <p>Target {formatScore(enabler.target)}</p>
                  </div>
                </div>
              );
            }
            return (
              <SurfaceCard key={enabler.id} className="space-y-4 rounded-3xl p-7">
                <p className="text-[0.65rem] font-black uppercase tracking-widest text-[var(--text-tertiary)]">{enabler.implication}</p>
                <h3 className="font-[var(--font-display)] text-xl font-bold text-[var(--text-primary)]">{enabler.label}</h3>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">{enabler.description}</p>
                <div className="border-t border-[var(--border-soft)] pt-3 text-xs text-[var(--text-secondary)] space-y-1">
                  <p>{enabler.questionCount} questions</p>
                  <p>Target {formatScore(enabler.target)}</p>
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      </section>

    </div>
  );
}
