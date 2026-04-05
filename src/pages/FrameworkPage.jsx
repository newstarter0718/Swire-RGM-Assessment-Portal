import { Building2, Layers3, Network, ShieldCheck } from "lucide-react";
import frameworkArchitecture from "../../assets/images/framework-architecture.svg";
import { Eyebrow, SectionHeading, SurfaceCard } from "../components/ui.jsx";
import { assessmentData } from "../lib/assessment-data.js";
import { formatPercent, formatScore } from "../lib/assessment.js";

const pillarIcons = {
  Pricing: Building2,
  OBPPC: Layers3,
  "Promotion Spend": Network,
  "DFR / Trade Investment": ShieldCheck,
};

export function FrameworkPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 py-8 md:px-8 md:py-12">
      <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr] xl:items-center">
        <div className="space-y-4">
          <Eyebrow>Framework</Eyebrow>
          <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">
            One architecture, three layers, and a clearer view of the full RGM system.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
            This page is intentionally visual first: pillars frame the business levers, stages show the operating sequence, and enablers explain what sustains capability over time.
          </p>
        </div>

        <div className="rounded-[32px] bg-[var(--surface-glass)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
          <img
            src={frameworkArchitecture}
            alt="Layered architecture of the Swire RGM assessment framework"
            className="w-full rounded-[24px] bg-[var(--surface-container-lowest,#fff)]"
            loading="lazy"
          />
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Pillars"
          title="Four business pillars anchor the assessment."
          description="Each pillar keeps its workbook weight, target, and question count while being reframed into a cleaner visual system."
        />
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {assessmentData.pillars.map((pillar, index) => {
            const Icon = pillarIcons[pillar.label] || Layers3;
            return (
              <SurfaceCard key={pillar.id} className="group relative overflow-hidden space-y-4 rounded-[26px] p-6 hover:shadow-[0_20px_48px_rgba(23,28,31,0.1)] transition-shadow duration-300">
                <span className="absolute top-4 right-5 text-6xl font-black text-[var(--surface-container-highest,#dfe3e7)] select-none leading-none">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="relative flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--swire-red)]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="relative space-y-2">
                  <h3 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    {pillar.label}
                  </h3>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">
                    {pillar.description}
                  </p>
                </div>
                <div className="relative grid gap-2 text-sm text-[var(--text-secondary)]">
                  <p>Questions: <span className="font-semibold text-[var(--text-primary)]">{pillar.questionCount}</span></p>
                  <p>Target: <span className="font-semibold text-[var(--text-primary)]">{formatScore(pillar.target)}</span></p>
                  <p>Weight: <span className="font-semibold text-[var(--text-primary)]">{formatPercent(pillar.weight)}</span></p>
                </div>
              </SurfaceCard>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SurfaceCard className="space-y-5 rounded-[28px] p-8">
          <SectionHeading
            eyebrow="Stages"
            title="Five capability stages show where the operating chain holds or breaks."
            description="The stage view helps leadership pinpoint whether the issue is opportunity understanding, policy translation, execution, or forward planning."
          />
        </SurfaceCard>
        <div className="grid gap-4">
          {assessmentData.stages.map((stage) => (
            <SurfaceCard key={stage.id} className="rounded-[24px] p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                    Stage {stage.order}
                  </p>
                  <h3 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
                    {stage.label.replace(/^\d+\.\s*/, "")}
                  </h3>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">
                    {stage.description}
                  </p>
                </div>
                <div className="grid gap-1 text-sm text-[var(--text-secondary)] md:text-right">
                  <span>{stage.questionCount} linked questions</span>
                  <span>Target {formatScore(stage.target)}</span>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Enablers"
          title="Cross-cutting enablers explain what must be strengthened to sustain the result."
          description="These are not side notes. They are the structural reasons why a strong strategy still fails to land in-market."
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {assessmentData.enablers.map((enabler, index) => {
            const isDark = index === 0;
            const isAccent = index === assessmentData.enablers.length - 1;
            const cardClass = isDark
              ? "space-y-4 rounded-[24px] p-6 bg-[var(--inverse-surface,#2c3134)] text-[var(--inverse-on-surface,#edf1f5)] shadow-[var(--shadow-card)] backdrop-blur-md"
              : isAccent
                ? "space-y-4 rounded-[24px] p-6 bg-[var(--swire-red)] text-white shadow-[0_14px_30px_rgba(225,38,28,0.22)] backdrop-blur-md"
                : "space-y-4 rounded-[24px] p-6 hover:shadow-[0_20px_48px_rgba(23,28,31,0.1)] transition-shadow duration-300";
            return isDark || isAccent ? (
              <div key={enabler.id} className={cardClass}>
                <div className="space-y-2">
                  <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? "text-white/50" : "text-white/70"}`}>
                    {enabler.implication}
                  </p>
                  <h3 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-white">
                    {enabler.label}
                  </h3>
                </div>
                <p className={`text-sm leading-6 ${isDark ? "text-white/70" : "text-white/80"}`}>
                  {enabler.description}
                </p>
                <div className={`grid gap-2 text-sm ${isDark ? "text-white/50" : "text-white/70"}`}>
                  <p>{enabler.questionCount} linked questions</p>
                  <p>Target {formatScore(enabler.target)}</p>
                </div>
              </div>
            ) : (
              <SurfaceCard key={enabler.id} className={cardClass}>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                    {enabler.implication}
                  </p>
                  <h3 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    {enabler.label}
                  </h3>
                </div>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  {enabler.description}
                </p>
                <div className="grid gap-2 text-sm text-[var(--text-secondary)]">
                  <p>{enabler.questionCount} linked questions</p>
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
