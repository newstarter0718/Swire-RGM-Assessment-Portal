import { CheckCircle2, CircleAlert, CircleGauge, ListChecks } from "lucide-react";
import logicPriorityFlow from "../../assets/images/logic-priority-flow.svg";

const steps = [
  {
    title: "Respond",
    copy: "Score each question 1–5. The full workbook anchor only appears after selection — keeping the flow clean and decision-focused.",
    icon: CheckCircle2,
  },
  {
    title: "Score",
    copy: "Responses roll into pillar, stage, and enabler metrics using the original workbook weights — no recalibration, no interpretation layer.",
    icon: CircleGauge,
  },
  {
    title: "Compare",
    copy: "A live gap-to-target view shows where capability sits below the commercial standard for each pillar, stage, and enabler.",
    icon: CircleAlert,
  },
  {
    title: "Prioritize",
    copy: "The priority list combines gap size with question weight — so action planning focuses on what matters most to profitable growth.",
    icon: ListChecks,
  },
];

const accordions = [
  {
    title: "Why the portal delays live results until enough answers exist",
    body: "The dashboard stays intentionally quiet until a minimum response base has been captured. This reduces the risk of over-reading unstable early scores.",
    open: true,
  },
  {
    title: "How gap-to-target works",
    body: "Each metric compares the observed average to the target embedded in the assessment design. The gap is never negative; once a target is exceeded, the signal shifts from catch-up to sustainment.",
    open: false,
  },
  {
    title: "How the priority list should be read",
    body: "Priority is not simply the lowest score. It combines the maturity gap with the question weight so teams can focus on the issues that matter most to the operating model.",
    open: false,
  },
];

const resultViews = [
  { label: "By Pillar",     body: "Which commercial lever — OBPPC, Pricing, Promotion, or Trade Investment — is holding performance back." },
  { label: "By Stage",      body: "Where the operating chain breaks: opportunity identification, strategy, policy, execution, or future planning." },
  { label: "By Enabler",    body: "Which structural gaps — governance, data, capability, or forward-looking discipline — are the root cause." },
  { label: "Priority List", body: "A weighted view of which scored items carry the greatest gap-to-target, ranked for action planning." },
];

export function LogicPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-20 px-8 py-12 pb-24 md:px-12">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="flex flex-col items-end justify-between gap-8 md:flex-row">
        <div className="max-w-2xl space-y-4">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-[var(--swire-red)]">
            Scoring Logic
          </p>
          <h1 className="font-[var(--font-display)] text-5xl font-black leading-[1.08] tracking-tight text-[var(--text-primary)] md:text-6xl">
            Every score becomes a <span className="italic text-[var(--swire-red)]">commercial signal</span>.
          </h1>
          <p className="text-lg font-light leading-relaxed text-[var(--text-secondary)]">
            A four-step chain converts each maturity rating into pillar scores, gap-to-target views, and a weighted priority list for action planning.
          </p>
        </div>
        <div className="flex shrink-0 gap-4">
          <div className="rounded-2xl border-l-4 border-[var(--swire-red)] bg-[var(--surface-container-lowest,#fff)] px-6 py-4 shadow-[var(--shadow-soft)]">
            <span className="block text-[0.65rem] font-black uppercase tracking-widest text-[var(--text-secondary)]">Steps</span>
            <span className="text-3xl font-black text-[var(--text-primary)]">04</span>
          </div>
          <div className="rounded-2xl border-l-4 border-[var(--charcoal-soft,#515f74)] bg-[var(--surface-container-lowest,#fff)] px-6 py-4 shadow-[var(--shadow-soft)]">
            <span className="block text-[0.65rem] font-black uppercase tracking-widest text-[var(--text-secondary)]">Result Views</span>
            <span className="text-3xl font-black text-[var(--text-primary)]">04</span>
          </div>
        </div>
      </section>

      {/* ── Priority flow image ────────────────────────────────── */}
      <section className="rounded-3xl bg-[var(--surface-glass)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <img
          src={logicPriorityFlow}
          alt="Flow showing respond, score, compare, and prioritize"
          className="w-full rounded-[20px] bg-white"
          loading="lazy"
        />
      </section>

      {/* ── 4-Step Flow ────────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="flex items-baseline gap-4 border-b border-[var(--border-soft)] pb-4">
          <h2 className="font-[var(--font-display)] text-4xl font-black tracking-tighter text-[var(--text-primary)]">
            A four-step chain turns response data into a <span className="italic text-[var(--swire-red)]">priority view</span>
          </h2>
        </div>

        <div className="grid gap-5 xl:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="group relative overflow-hidden rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-container-lowest,#fff)] p-8 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(23,28,31,0.1)]"
              >
                <span className="absolute right-5 top-4 select-none text-6xl font-black leading-none text-[var(--surface-container-highest,#dfe3e7)] transition-colors duration-300 group-hover:text-[rgba(225,38,28,0.07)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="relative space-y-4">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--swire-red)]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-[var(--font-display)] text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">{step.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Result views + Accordions ──────────────────────────── */}
      <section className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">

        {/* Result views */}
        <div className="rounded-3xl border border-[var(--border-soft)] bg-[var(--surface-container-lowest,#fff)] p-8 shadow-[var(--shadow-card)] space-y-6">
          <div>
            <p className="mb-2 text-[0.72rem] font-black uppercase tracking-[0.3em] text-[var(--swire-red)]">Result Views</p>
            <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Built for action, not just reporting.
            </h2>
            <p className="mt-3 text-base leading-7 text-[var(--text-secondary)]">
              Once enough answers exist, the dashboard opens three lenses and one action list.
            </p>
          </div>
          <div className="space-y-4">
            {resultViews.map((item) => (
              <div key={item.label} className="flex items-start gap-4">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--swire-red)]" />
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{item.label}</p>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {accordions.map((item) => (
            <div key={item.title} className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-container-lowest,#fff)] shadow-[var(--shadow-soft)]">
              <details className="group p-6" open={item.open}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
                  <span className="font-[var(--font-display)] text-lg font-bold text-[var(--text-primary)]">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-xs font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] group-open:text-[var(--swire-red)]">
                    Show
                  </span>
                </summary>
                <p className="pt-4 text-sm leading-7 text-[var(--text-secondary)]">{item.body}</p>
              </details>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
