import { BarChart3, Binary, Layers3, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Eyebrow, SectionHeading, SurfaceCard } from "../components/ui.jsx";
import { assessmentData } from "../lib/assessment-data.js";

const scoringSteps = [
  {
    title: "Sub-item score",
    body: "Use 0 for not yet in place, 0.5 for partially in place, and 1 for clearly in place.",
  },
  {
    title: "Main question score",
    body: "Average the sub-item scores belonging to the same main question.",
  },
  {
    title: "Pillar official score",
    body: "Average the question or sub-item scores within each pillar, then multiply by 20.",
  },
  {
    title: "Official total score",
    body: "Sum the 5 pillar scores for a maximum of 100.",
  },
  {
    title: "Stage diagnostic score",
    body: "Average the sub-item scores within each stage, then multiply by 100.",
  },
  {
    title: "Enabler diagnostic score",
    body: "Average the sub-item scores within each primary enabler, then multiply by 100.",
  },
];

const analyticalViews = [
  { label: "By pillar", icon: Target },
  { label: "By stage", icon: Layers3 },
  { label: "By enabler", icon: Binary },
  { label: "By market", icon: BarChart3 },
  { label: "By respondent group", icon: Layers3 },
];

const outputLayers = [
  {
    title: "Diagnostic output",
    body: "Where are we today.",
  },
  {
    title: "Certification output",
    body: "What is the formal capability outcome.",
  },
  {
    title: "Improvement output",
    body: "What do we do next.",
  },
];

export function ScoringOutputsPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-16 px-8 py-12 pb-24 md:px-12">
      <section className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
        <div className="max-w-3xl space-y-4">
          <Eyebrow>Scoring and Outputs</Eyebrow>
          <h1 className="font-[var(--font-display)] text-5xl font-black leading-[1.05] tracking-tight text-[var(--text-primary)] md:text-6xl">
            Scoring and <span className="text-[var(--swire-red)]">Outputs</span>.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
            A rigorous assessment structure that converts detailed capability evidence into enterprise-level
            insight, certification outcomes, and improvement priorities.
          </p>
        </div>

        <SurfaceCard className="rounded-[30px] bg-[linear-gradient(180deg,rgba(0,26,72,0.96)_0%,rgba(0,45,114,0.94)_100%)] p-7 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Formal Outputs</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-3xl font-black">{assessmentData.meta.scoreModel.officialScoreMax}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-white/60">Official score max</p>
            </div>
            <div>
              <p className="text-3xl font-black">{assessmentData.meta.scoreModel.pillarScoreMax}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-white/60">Per pillar max</p>
            </div>
            <div>
              <p className="text-3xl font-black">{assessmentData.meta.scoreModel.diagnosticScoreMax}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-white/60">Diagnostic display max</p>
            </div>
          </div>
        </SurfaceCard>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Method"
          title="How scoring works"
          description="One integrated question bank, three score views, and one official certification score."
        />

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {scoringSteps.map((step, index) => (
            <SurfaceCard key={step.title} className="rounded-[26px] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Step {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{step.body}</p>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Analysis"
            title="Analytical views"
            description="Outputs should be management-ready, not only a technical report."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {analyticalViews.map((item) => {
              const Icon = item.icon;
              return (
                <SurfaceCard key={item.label} className="rounded-[24px] p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--swire-red)]">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-base font-semibold text-[var(--text-primary)]">{item.label}</span>
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        </div>

        <SurfaceCard className="rounded-[30px] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            Three-layer output model
          </p>
          <div className="mt-6 grid gap-4">
            {outputLayers.map((layer, index) => (
              <div
                key={layer.title}
                className={[
                  "rounded-[24px] px-5 py-5",
                  index === 0
                    ? "bg-[rgba(0,26,72,0.05)]"
                    : index === 1
                      ? "bg-[rgba(225,38,28,0.05)]"
                      : "bg-[rgba(21,104,116,0.08)]",
                ].join(" ")}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  Layer {index + 1}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-[var(--text-primary)]">{layer.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{layer.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-5 py-4 text-sm leading-7 text-[var(--text-secondary)]">
            The maturity anchors and certification tiers are related but not the same layer of the model.
          </div>
        </SurfaceCard>
      </section>

      <section className="flex flex-wrap gap-3 rounded-[32px] border border-[var(--border-soft)] bg-[var(--surface-container-lowest,#fff)] px-6 py-6 shadow-[var(--shadow-card)]">
        <Link to="/certification-model">
          <Button>Review Certification Model</Button>
        </Link>
        <Link to="/operating-cycle">
          <Button tone="secondary">Review Operating Cycle</Button>
        </Link>
      </section>
    </div>
  );
}
