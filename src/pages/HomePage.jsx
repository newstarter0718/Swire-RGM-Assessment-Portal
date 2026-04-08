import { ArrowRight, Building2, GitBranchPlus, Radar, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Eyebrow, SectionHeading, SurfaceCard } from "../components/ui.jsx";
import { assessmentData } from "../lib/assessment-data.js";

const whyShiftMatters = [
  {
    title: "Not a one-off survey",
    body: "The assessment becomes the first step in a broader capability system rather than a one-time diagnostic snapshot.",
    icon: Radar,
  },
  {
    title: "Common enterprise standard",
    body: "Markets work against one shared RGM capability standard across pillars, stages, and enablers.",
    icon: Building2,
  },
  {
    title: "Evidence-backed certification",
    body: "Self-assessment is only one input. Validation, interviews, and evidence make the outcome credible.",
    icon: ShieldCheck,
  },
  {
    title: "Annual improvement cycle",
    body: "Outputs feed directly into remediation plans, capability investment choices, and the next cycle.",
    icon: GitBranchPlus,
  },
];

const referenceModels = [
  {
    title: "Simon-Kucher",
    body: "Detailed lever-level question design and maturity logic.",
  },
  {
    title: "China Enterprise Certification",
    body: "Governance, scoring discipline, and recurring review cadence.",
  },
  {
    title: "Global IE",
    body: "Strategic framing, opportunity mapping, and forward-looking capability logic.",
  },
];

const leadershipOutcomes = [
  "A Swire RGM capability standard",
  "A standardized assessment and scoring model",
  "A formal certification outcome",
  "A required improvement roadmap",
  "A repeatable annual cycle",
];

export function HomePage() {
  const metrics = [
    { label: "Pillars", value: assessmentData.meta.pillarCount, sub: "Core commercial levers" },
    { label: "Stages", value: assessmentData.meta.stageCount, sub: "Capability chain" },
    { label: "Enablers", value: assessmentData.meta.enablerCount, sub: "Cross-cutting drivers" },
    { label: "Main Questions", value: assessmentData.meta.mainQuestionCount, sub: "Assessment architecture" },
    { label: "Sub-items", value: assessmentData.meta.subItemCount, sub: "Evidence-backed scoring units" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-16 px-8 py-12 pb-24 md:px-12">
      <section className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
        <div className="space-y-5">
          <Eyebrow>Enterprise Capability Standard</Eyebrow>
          <h1 className="max-w-4xl font-[var(--font-display)] text-5xl font-black leading-[1.02] tracking-tight text-[var(--text-primary)] md:text-7xl">
            From Assessment to <span className="text-[var(--swire-red)]">Certification</span>.
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-[var(--text-secondary)]">
            Swire is building an annual RGM certification program that sets a common capability standard,
            assesses current maturity, validates evidence, identifies priority gaps, and links outcomes to
            market improvement planning and long-range capability investment.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/architecture">
              <Button>
                Review Architecture
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/assessment">
              <Button tone="secondary">Open Assessment Flow</Button>
            </Link>
          </div>
        </div>

        <SurfaceCard className="rounded-[32px] bg-[linear-gradient(180deg,rgba(0,26,72,0.98)_0%,rgba(0,45,114,0.96)_100%)] p-8 text-white">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Program Structure</p>
              <h2 className="mt-3 font-[var(--font-display)] text-3xl font-bold leading-tight">
                One model. Multiple management views.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {metrics.map((item) => (
                <div key={item.label} className="rounded-[24px] bg-white/8 px-5 py-5 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/58">{item.label}</p>
                  <p className="mt-3 text-4xl font-black">{String(item.value).padStart(2, "0")}</p>
                  <p className="mt-2 text-sm leading-6 text-white/72">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </SurfaceCard>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Why This Shift Matters"
          title="The assessment becomes an operating system."
          description="The ambition is to move from one-off diagnostics toward a structured, repeatable enterprise capability cycle."
        />

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {whyShiftMatters.map((item) => {
            const Icon = item.icon;
            return (
              <SurfaceCard key={item.title} className="rounded-[26px] p-6">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--swire-red)]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{item.body}</p>
              </SurfaceCard>
            );
          })}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <SectionHeading
            eyebrow="Reference Models"
            title="Built from three reference models"
            description="The final design is not copied from any single source. It is a Swire-specific synthesis."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {referenceModels.map((item) => (
              <SurfaceCard key={item.title} className="rounded-[24px] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  {item.title}
                </p>
                <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{item.body}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>

        <SurfaceCard className="rounded-[30px] border border-[rgba(225,38,28,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(249,249,253,0.96)_100%)] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Swire-specific synthesis</p>
          <h2 className="mt-4 font-[var(--font-display)] text-3xl font-bold leading-tight text-[var(--text-primary)]">
            Diagnostic detail + governance logic + strategic direction.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
            The architecture preserves detailed question design, adds formal enterprise governance, and keeps
            the model oriented toward future value pools rather than short-term process compliance alone.
          </p>
        </SurfaceCard>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Leadership Outcomes"
            title="What leadership gets"
            description="The outcome is a management mechanism, not only a questionnaire."
          />

          <div className="grid gap-4">
            {leadershipOutcomes.map((item, index) => (
              <SurfaceCard key={item} className="rounded-[24px] p-5">
                <div className="flex items-start gap-4">
                  <span className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-base font-semibold leading-7 text-[var(--text-primary)]">{item}</p>
                </div>
              </SurfaceCard>
            ))}
          </div>
        </div>

        <SurfaceCard className="rounded-[32px] bg-[linear-gradient(180deg,rgba(0,26,72,0.96)_0%,rgba(0,45,114,0.94)_100%)] p-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Next move</p>
          <h2 className="mt-4 font-[var(--font-display)] text-3xl font-bold leading-tight">
            Review the architecture, then open the assessment flow.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/76">
            The site now needs to orient users around the 5 by 5 architecture, the certification model, and
            the annual operating cycle before they move into the assessment workflow itself.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/architecture">
              <Button>Review Architecture</Button>
            </Link>
            <Link to="/assessment">
              <Button tone="secondary">Open Assessment Flow</Button>
            </Link>
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
