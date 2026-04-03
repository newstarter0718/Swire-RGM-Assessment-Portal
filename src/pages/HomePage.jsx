import {
  ArrowRight,
  BookOpenText,
  Gauge,
  LayoutPanelTop,
  PlayCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import heroSystemOverview from "../../assets/images/hero-system-overview.svg";
import { Button, Eyebrow, SectionHeading, SurfaceCard } from "../components/ui.jsx";
import { assessmentData } from "../lib/assessment-data.js";

const launchers = [
  {
    title: "Start Assessment",
    description: "Move directly into the guided wizard and complete the 48-question maturity review section by section.",
    to: "/assessment",
    icon: PlayCircle,
  },
  {
    title: "Review Framework",
    description: "Understand the 4 pillars, 5 capability stages, and 4 enablers before opening the questionnaire.",
    to: "/framework",
    icon: LayoutPanelTop,
  },
  {
    title: "Understand Logic",
    description: "See how each answer becomes a score, a gap-to-target view, and a practical priority list.",
    to: "/logic",
    icon: Gauge,
  },
];

export function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-5 py-8 md:px-8 md:py-12">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <Eyebrow>Assessment Portal</Eyebrow>
          <div className="space-y-4">
            <h1 className="max-w-3xl font-[var(--font-display)] text-4xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-6xl">
              A task-first RGM portal built to move people from orientation to action.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
              Use a single workspace to understand the assessment model, review the scoring logic, and complete the full RGM maturity review with live results and draft saving.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/assessment">
              <Button className="w-full sm:w-auto" aria-label="Start the Swire RGM assessment">
                <span>Start Assessment</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/framework">
              <Button
                tone="secondary"
                className="w-full sm:w-auto"
                aria-label="Review the assessment framework"
              >
                Review Framework
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <SurfaceCard className="rounded-[20px] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Pillars
              </p>
              <strong className="mt-2 block text-3xl font-semibold text-[var(--text-primary)]">
                {assessmentData.meta.pillarCount}
              </strong>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Core commercial levers</p>
            </SurfaceCard>
            <SurfaceCard className="rounded-[20px] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Stages
              </p>
              <strong className="mt-2 block text-3xl font-semibold text-[var(--text-primary)]">
                {assessmentData.meta.stageCount}
              </strong>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Capability chain coverage</p>
            </SurfaceCard>
            <SurfaceCard className="rounded-[20px] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Questions
              </p>
              <strong className="mt-2 block text-3xl font-semibold text-[var(--text-primary)]">
                {assessmentData.meta.questionCount}
              </strong>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Core maturity signals</p>
            </SurfaceCard>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/70 bg-[var(--surface-glass)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
          <img
            src={heroSystemOverview}
            alt="System view of pillars, stages, and enablers in the Swire RGM assessment"
            className="w-full rounded-[24px] border border-[rgba(38,38,38,0.06)] bg-white/85"
          />
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Portal Paths"
          title="Choose the path you need, then go straight into it."
          description="The homepage now behaves like an executive task launcher instead of a long explainer."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {launchers.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className="group">
                <SurfaceCard className="flex h-full flex-col gap-5 rounded-[28px] transition duration-300 group-hover:-translate-y-0.5 group-hover:border-[rgba(225,38,28,0.18)] group-hover:shadow-[var(--shadow-card)]">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-tint)] text-[var(--swire-red)]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="space-y-2">
                    <h3 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
                      {item.title}
                    </h3>
                    <p className="text-base leading-7 text-[var(--text-secondary)]">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[var(--swire-red)]">
                    Open
                    <ArrowRight className="size-4 transition duration-200 group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </SurfaceCard>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <SurfaceCard className="rounded-[28px] p-8">
          <div className="space-y-4">
            <Eyebrow>Why It Exists</Eyebrow>
            <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
              Turn a complex workbook into a decision-ready operating view.
            </h2>
            <p className="text-base leading-7 text-[var(--text-secondary)]">
              The portal is designed to reduce completion friction while preserving the workbook’s structure, anchor logic, and reporting outputs for leadership review.
            </p>
          </div>
        </SurfaceCard>

        <SurfaceCard className="rounded-[28px] p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <BookOpenText className="size-5 text-[var(--swire-red)]" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Explain the model</h3>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                Clarify what is being assessed before the respondent starts scoring.
              </p>
            </div>
            <div className="space-y-2">
              <Gauge className="size-5 text-[var(--swire-red)]" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Guide the scoring</h3>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                Use a lighter digital flow with autosave, progress, and section-based completion.
              </p>
            </div>
            <div className="space-y-2">
              <LayoutPanelTop className="size-5 text-[var(--swire-red)]" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Read the outcome</h3>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                Surface results by pillar, stage, enabler, and priority without leaving the workflow.
              </p>
            </div>
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
