import { Building2, CheckCheck, FileCheck2, GitCompareArrows, ShieldCheck, Waypoints } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Eyebrow, SectionHeading, SurfaceCard } from "../components/ui.jsx";
import { assessmentData } from "../lib/assessment-data.js";

const certificationElements = [
  "A standard framework",
  "A standard questionnaire and scoring logic",
  "Evidence-based validation",
  "A tiered certification outcome",
  "A required improvement plan",
  "Annual renewal",
];

const validationSources = [
  {
    title: "Self-assessment",
    body: "Structured market input against the common capability standard.",
    icon: Building2,
  },
  {
    title: "Knowledge or scenario-based assessment",
    body: "Validation that teams understand the commercial logic behind the routines.",
    icon: GitCompareArrows,
  },
  {
    title: "Structured interviews",
    body: "Cross-functional calibration to separate process claims from operating reality.",
    icon: Waypoints,
  },
  {
    title: "Selected evidence or routine validation",
    body: "Use of decks, dashboards, workflows, and operating evidence to support final judgement.",
    icon: FileCheck2,
  },
];

const maturityAnchors = [
  "Lacking",
  "Developing",
  "Competent",
  "Advanced / Professional",
  "Leading",
];

export function CertificationModelPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-16 px-8 py-12 pb-24 md:px-12">
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div className="max-w-3xl space-y-4">
          <Eyebrow>Certification Model</Eyebrow>
          <h1 className="font-[var(--font-display)] text-5xl font-black leading-[1.05] tracking-tight text-[var(--text-primary)] md:text-6xl">
            What Certification Means at <span className="text-[var(--swire-red)]">Swire</span>.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
            Certification is not a ranking exercise. It is a formal enterprise capability standard with
            evidence-based validation and annual renewal.
          </p>
        </div>

        <SurfaceCard className="rounded-[28px] border border-[rgba(225,38,28,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(249,249,253,0.96)_100%)] p-6">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Governance Note
            </p>
            <p className="text-base leading-7 text-[var(--text-secondary)]">
              Regional rules should stay standardized while improvement actions remain local. The standard
              holds centrally; remediation must still reflect market reality.
            </p>
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {certificationElements.map((item, index) => (
          <SurfaceCard key={item} className="rounded-[26px] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Element {String(index + 1).padStart(2, "0")}
            </p>
            <p className="mt-4 text-xl font-semibold leading-8 text-[var(--text-primary)]">{item}</p>
          </SurfaceCard>
        ))}
      </section>

      <section className="grid gap-10 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Validation"
            title="Multi-source validation model"
            description="Self-perception alone is not enough. The model must distinguish routine presence, knowledge depth, cross-functional ownership, and sustainable operating quality."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {validationSources.map((item) => {
              const Icon = item.icon;
              return (
                <SurfaceCard key={item.title} className="rounded-[24px] p-5">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--swire-red)]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{item.body}</p>
                </SurfaceCard>
              );
            })}
          </div>
        </div>

        <SurfaceCard className="rounded-[30px] bg-[linear-gradient(180deg,rgba(0,26,72,0.96)_0%,rgba(0,45,114,0.94)_100%)] p-8 text-white">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Certification Outcomes</p>
              <h2 className="font-[var(--font-display)] text-3xl font-bold leading-tight">
                Related layers, different decisions.
              </h2>
              <p className="text-sm leading-7 text-white/76">
                The maturity anchors and certification tiers are related but not the same layer of the
                model. One describes capability behavior; the other defines formal enterprise outcome.
              </p>
            </div>

            <div className="space-y-4 rounded-[24px] bg-white/8 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <CheckCheck className="size-5 text-[#ffb3ad]" aria-hidden="true" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Maturity Anchor Scale</p>
              </div>
              <div className="grid gap-3">
                {maturityAnchors.map((anchor, index) => (
                  <div key={anchor} className="flex items-center justify-between gap-3 rounded-2xl bg-white/6 px-4 py-3">
                    <span className="text-sm font-semibold text-white/85">{anchor}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                      L{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-[24px] bg-white/8 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-5 text-[#ffdea8]" aria-hidden="true" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Certification Outcome</p>
              </div>
              <div className="grid gap-3">
                {assessmentData.meta.certificationTiers.map((tier) => (
                  <div key={tier.label} className="flex items-center justify-between gap-3 rounded-2xl bg-white/6 px-4 py-3">
                    <span className="text-sm font-semibold text-white/88">{tier.label}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">
                      {tier.min} - {tier.max}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SurfaceCard>
      </section>

      <section className="flex flex-wrap gap-3 rounded-[32px] border border-[var(--border-soft)] bg-[var(--surface-container-lowest,#fff)] px-6 py-6 shadow-[var(--shadow-card)]">
        <Link to="/scoring-outputs">
          <Button>Review Scoring and Outputs</Button>
        </Link>
        <Link to="/operating-cycle">
          <Button tone="secondary">Review Operating Cycle</Button>
        </Link>
      </section>
    </div>
  );
}
