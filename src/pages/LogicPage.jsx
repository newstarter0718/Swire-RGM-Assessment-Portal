import {
  CheckCircle2,
  CircleAlert,
  CircleGauge,
  ListChecks,
  MoveRight,
} from "lucide-react";
import logicPriorityFlow from "../../assets/images/logic-priority-flow.svg";
import { Eyebrow, SectionHeading, SurfaceCard } from "../components/ui.jsx";

const steps = [
  {
    title: "Respond",
    copy: "Each question is scored on a horizontal 1-5 rail, and the detailed maturity anchor only appears after selection.",
    icon: CheckCircle2,
  },
  {
    title: "Score",
    copy: "Responses roll into the pillar, stage, and enabler metrics using the same question weights carried over from the workbook.",
    icon: CircleGauge,
  },
  {
    title: "Compare",
    copy: "A live gap-to-target view shows where capability sits beneath the intended operating standard.",
    icon: CircleAlert,
  },
  {
    title: "Prioritize",
    copy: "The priority list weights each answered question by both gap and importance so action planning becomes more concrete.",
    icon: ListChecks,
  },
];

const accordions = [
  {
    title: "Why the portal delays live results until enough answers exist",
    body: "The dashboard stays intentionally quiet until a minimum response base has been captured. This reduces the risk of over-reading unstable early scores.",
  },
  {
    title: "How gap-to-target works",
    body: "Each metric compares the observed average to the target embedded in the assessment design. The gap is never negative; once a target is exceeded, the signal shifts from catch-up to sustainment.",
  },
  {
    title: "How the priority list should be read",
    body: "Priority is not simply the lowest score. It combines the maturity gap with the question weight so teams can focus on the issues that matter most to the operating model.",
  },
];

export function LogicPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 py-8 md:px-8 md:py-12">
      <section className="grid gap-8 xl:grid-cols-[1fr_1fr] xl:items-center">
        <div className="space-y-4">
          <Eyebrow>Logic</Eyebrow>
          <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">
            The scoring logic is short enough to scan and clear enough to trust.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
            This page strips the methodology down to its decision path so respondents understand what the system does with every score they enter.
          </p>
        </div>

        <div className="rounded-[32px] bg-[var(--surface-glass)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
          <img
            src={logicPriorityFlow}
            alt="Flow showing respond, score, compare, and prioritize"
            className="w-full rounded-[24px] bg-[var(--surface-container-lowest,#fff)]"
            loading="lazy"
          />
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Flow"
          title="A four-step chain turns response data into a priority view."
          description="The page keeps the logic visual, short, and operational instead of burying it in methodology copy."
        />
        <div className="grid gap-5 xl:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <SurfaceCard key={step.title} className="relative overflow-hidden flex h-full flex-col gap-4 rounded-[24px] p-6 hover:shadow-[0_20px_48px_rgba(23,28,31,0.1)] transition-shadow duration-300">
                <span className="absolute top-4 right-5 text-5xl font-black text-[var(--surface-container-highest,#dfe3e7)] select-none leading-none">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="relative flex size-12 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--swire-red)]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="relative font-[var(--font-display)] text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  {step.title}
                </h3>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">{step.copy}</p>
                <MoveRight className="mt-auto size-4 text-[var(--text-tertiary)]" aria-hidden="true" />
              </SurfaceCard>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <SurfaceCard className="rounded-[28px] p-8">
          <SectionHeading
            eyebrow="Result Views"
            title="The output is meant to support action, not just reporting."
            description="Once enough answers exist, the dashboard opens three lenses and one action list."
          />
          <div className="mt-6 grid gap-4 text-sm leading-6 text-[var(--text-secondary)]">
            <p><span className="font-semibold text-[var(--text-primary)]">By Pillar:</span> where the business levers are strong or weak.</p>
            <p><span className="font-semibold text-[var(--text-primary)]">By Stage:</span> where the operating chain breaks.</p>
            <p><span className="font-semibold text-[var(--text-primary)]">By Enabler:</span> what structural capability is missing.</p>
            <p><span className="font-semibold text-[var(--text-primary)]">Priority List:</span> which scored items carry the biggest weighted action need.</p>
          </div>
        </SurfaceCard>

        <div className="grid gap-4">
          {accordions.map((item, index) => (
            <SurfaceCard key={item.title} className="rounded-[24px] p-0">
              <details className="group p-6" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                  <span className="font-[var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)] group-open:text-[var(--swire-red)]">
                    Open
                  </span>
                </summary>
                <p className="pt-4 text-sm leading-7 text-[var(--text-secondary)]">{item.body}</p>
              </details>
            </SurfaceCard>
          ))}
        </div>
      </section>
    </div>
  );
}
