import { CalendarClock, ClipboardCheck, FolderGit2, Scale, ShieldAlert, Workflow } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Eyebrow, SectionHeading, SurfaceCard } from "../components/ui.jsx";

const annualSteps = [
  "Set the Standard",
  "Assess the Market",
  "Certify",
  "Improve",
  "Embed into Planning",
  "Reassess in the Next Cycle",
];

const yearlyCards = [
  {
    title: "Framework refresh and standards alignment",
    body: "Refresh the architecture, maturity anchors, evidence rules, and scoring standards before the next cycle begins.",
    icon: Workflow,
  },
  {
    title: "Market assessments and validation",
    body: "Run the market assessment, conduct interviews, and collect evidence packages for calibration.",
    icon: ClipboardCheck,
  },
  {
    title: "Certification approval and recognition",
    body: "Confirm formal outcomes, apply gating rules, and complete enterprise-level recognition decisions.",
    icon: Scale,
  },
  {
    title: "Improvement roadmap integration into planning",
    body: "Translate the output into market action plans, capability investment choices, and planning cycle priorities.",
    icon: FolderGit2,
  },
];

const responsibilities = [
  "Framework ownership",
  "Annual cycle management",
  "Scoring calibration",
  "Certification approval",
  "Market remediation follow-up",
  "Linkage to planning and capability investment",
];

export function OperatingCyclePage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-16 px-8 py-12 pb-24 md:px-12">
      <section className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
        <div className="max-w-3xl space-y-4">
          <Eyebrow>Operating Cycle</Eyebrow>
          <h1 className="font-[var(--font-display)] text-5xl font-black leading-[1.05] tracking-tight text-[var(--text-primary)] md:text-6xl">
            Annual <span className="text-[var(--swire-red)]">Operating Cycle</span>.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
            The certification model should run as an annual enterprise rhythm, not as a one-time project.
          </p>
        </div>

        <SurfaceCard className="rounded-[30px] bg-[linear-gradient(180deg,rgba(0,26,72,0.96)_0%,rgba(0,45,114,0.94)_100%)] p-7 text-white">
          <div className="flex items-start gap-4">
            <CalendarClock className="mt-1 size-6 text-[#ffdea8]" aria-hidden="true" />
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Why rhythm matters</p>
              <p className="text-base leading-7 text-white/82">
                Without recurring governance, the work stays a project instead of becoming a capability system.
              </p>
            </div>
          </div>
        </SurfaceCard>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Cycle"
          title="Annual enterprise rhythm"
          description="This is the management cadence that turns the assessment into a repeatable certification system."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {annualSteps.map((step, index) => (
            <SurfaceCard key={step} className="rounded-[26px] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Step {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-4 text-xl font-semibold text-[var(--text-primary)]">{step}</p>
            </SurfaceCard>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Calendar"
          title="What happens through the year"
          description="A certification cycle needs both central discipline and clear moments of market action."
        />

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {yearlyCards.map((item) => {
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
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Governance"
            title="Governance and ownership"
            description="The cycle only works if ownership is explicit and calibration remains consistent."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {responsibilities.map((item) => (
              <SurfaceCard key={item} className="rounded-[24px] p-5">
                <p className="text-sm font-semibold leading-7 text-[var(--text-primary)]">{item}</p>
              </SurfaceCard>
            ))}
          </div>
        </div>

        <SurfaceCard className="rounded-[30px] border border-[rgba(225,38,28,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(249,249,253,0.96)_100%)] p-8">
          <div className="flex items-start gap-4">
            <ShieldAlert className="mt-1 size-6 text-[var(--swire-red)]" aria-hidden="true" />
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Capability System
              </p>
              <h2 className="font-[var(--font-display)] text-3xl font-bold leading-tight text-[var(--text-primary)]">
                Annual rhythm is what institutionalizes the model.
              </h2>
              <p className="text-sm leading-7 text-[var(--text-secondary)]">
                The first implementation should be treated as the baseline certification round. Its purpose is
                to assess the markets, test the model, and establish the governance rhythm needed for future
                cycles.
              </p>
            </div>
          </div>
        </SurfaceCard>
      </section>

      <section className="flex flex-wrap gap-3 rounded-[32px] border border-[var(--border-soft)] bg-[var(--surface-container-lowest,#fff)] px-6 py-6 shadow-[var(--shadow-card)]">
        <Link to="/assessment">
          <Button>Review Assessment</Button>
        </Link>
        <Link to="/architecture">
          <Button tone="secondary">Review Architecture</Button>
        </Link>
      </section>
    </div>
  );
}
