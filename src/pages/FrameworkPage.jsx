import { Layers3, Orbit, ShieldCheck, Split, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Eyebrow, SectionHeading, SurfaceCard } from "../components/ui.jsx";
import { assessmentData } from "../lib/assessment-data.js";

const pillarIcons = {
  Pricing: TrendingUp,
  OBPPC: Layers3,
  Mix: Split,
  "Promotion Spend": Orbit,
  "DFR / Trade Investment": ShieldCheck,
};

const architectureReasons = [
  "Intuitive business ownership",
  "One end-to-end operating chain",
  "Detailed but not fragmented design",
  "Future-oriented flexibility",
];

export function FrameworkPage() {
  const structureMetrics = [
    { label: "Main questions", value: assessmentData.meta.mainQuestionCount },
    { label: "Sub-items", value: assessmentData.meta.subItemCount },
    { label: "Main questions per pillar", value: 10 },
    { label: "Main questions per stage", value: 10 },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-16 px-8 py-12 pb-24 md:px-12">
      <section className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
        <div className="space-y-5">
          <Eyebrow>Architecture</Eyebrow>
          <h1 className="font-[var(--font-display)] text-5xl font-black leading-[1.04] tracking-tight text-[var(--text-primary)] md:text-6xl">
            The 5 by 5 <span className="text-[var(--swire-red)]">RGM Architecture</span>.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--text-secondary)]">
            A holistic capability framework built around 5 core pillars, 5 capability stages, and 4
            cross-cutting enablers.
          </p>
        </div>

        <SurfaceCard className="rounded-[30px] bg-[linear-gradient(180deg,rgba(0,26,72,0.96)_0%,rgba(0,45,114,0.94)_100%)] p-7 text-white">
          <div className="grid gap-4 sm:grid-cols-2">
            {structureMetrics.map((item) => (
              <div key={item.label} className="rounded-[24px] bg-white/8 px-5 py-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">{item.label}</p>
                <p className="mt-3 text-4xl font-black">{String(item.value).padStart(2, "0")}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Core Pillars"
          title="Five commercial levers, one enterprise frame"
          description="Mix is now a full core pillar rather than a supporting theme inside another lever."
        />

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
          {assessmentData.pillars.map((pillar) => {
            const Icon = pillarIcons[pillar.label] || Layers3;
            return (
              <SurfaceCard key={pillar.id} className="rounded-[26px] p-6">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--swire-red)]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="mt-5 flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{pillar.label}</h3>
                  {pillar.label === "Mix" ? (
                    <span className="rounded-full bg-[rgba(225,38,28,0.08)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--swire-red)]">
                      Full core pillar
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{pillar.description}</p>
              </SurfaceCard>
            );
          })}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <SectionHeading
            eyebrow="Capability Stages"
            title="One end-to-end operating chain"
            description="The stages show where the capability journey strengthens or breaks, from identifying opportunity to building future readiness."
          />

          <div className="grid gap-4">
            {assessmentData.stages.map((stage) => (
              <SurfaceCard key={stage.id} className="rounded-[24px] p-5">
                <div className="flex items-start gap-5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    S{stage.order}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{stage.label}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{stage.description}</p>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <SectionHeading
            eyebrow="Cross-cutting Enablers"
            title="The structural conditions behind capability"
            description="These are not side notes. They explain why a strong strategy still fails to land in-market."
          />

          <div className="grid gap-4">
            {assessmentData.enablers.map((enabler) => (
              <SurfaceCard key={enabler.id} className="rounded-[24px] p-5">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{enabler.label}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{enabler.description}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Why This Architecture Works"
            title="Designed for enterprise use, not only assessment logic"
            description="The structure keeps the model usable for leadership, diagnostic work, and future operating cycles."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {architectureReasons.map((item) => (
              <SurfaceCard key={item} className="rounded-[24px] p-5">
                <p className="text-base font-semibold leading-7 text-[var(--text-primary)]">{item}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>

        <SurfaceCard className="rounded-[32px] border border-[rgba(225,38,28,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(249,249,253,0.96)_100%)] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Structure summary</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {structureMetrics.map((item) => (
              <div key={item.label} className="rounded-[22px] bg-[var(--surface-muted)] px-5 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{item.label}</p>
                <p className="mt-3 text-4xl font-black text-[var(--text-primary)]">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/certification-model">
              <Button>Review Certification Model</Button>
            </Link>
            <Link to="/assessment">
              <Button tone="secondary">Open Assessment</Button>
            </Link>
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
