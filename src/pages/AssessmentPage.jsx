import { Download, Pencil, RotateCcw, Save, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Eyebrow, MetricBar, SectionHeading, SurfaceCard } from "../components/ui.jsx";
import { assessmentData } from "../lib/assessment-data.js";
import {
  anchorLabel,
  anchorShortLabel,
  AUTOSAVE_DEBOUNCE_MS,
  buildSessionId,
  buildSubmissionPayload,
  computeResults,
  createDefaultMeta,
  formatPercent,
  formatScore,
  formatTimestamp,
  getAnsweredQuestionsCount,
  getUnansweredQuestions,
  RESULTS_MIN_ANSWERED,
} from "../lib/assessment.js";
import { clearDraftState, readDraftState, saveDraftState } from "../lib/browser-storage.js";
import { saveDraftPayload, submitAssessmentPayload } from "../lib/submission.js";

function createInitialState() {
  const saved = readDraftState();

  return {
    sessionId: saved?.sessionId || buildSessionId(),
    meta: { ...createDefaultMeta(), ...(saved?.meta || {}) },
    responses: saved?.responses || {},
    activePillarIndex: Math.max(0, Math.min(saved?.activePillarIndex || 0, assessmentData.pillars.length - 1)),
    lastSavedAt: saved?.lastSavedAt || "",
    lastRemoteSavedAt: saved?.lastRemoteSavedAt || "",
  };
}

function statusClass(tone) {
  if (tone === "success") {
    return "border-[rgba(15,138,75,0.18)] bg-[rgba(15,138,75,0.08)] text-[var(--success)]";
  }
  if (tone === "warn") {
    return "border-[rgba(178,106,0,0.2)] bg-[rgba(178,106,0,0.08)] text-[var(--warning)]";
  }
  if (tone === "error") {
    return "border-[rgba(180,35,24,0.2)] bg-[rgba(180,35,24,0.08)] text-[var(--danger)]";
  }
  return "border-[var(--border-soft)] bg-[var(--surface-muted)] text-[var(--text-secondary)]";
}

function PillarNavButton({ pillar, index, active, answered, total, average, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${pillar.label}`}
      className={[
        "flex w-full flex-col gap-2 rounded-[22px] border px-4 py-4 text-left transition duration-200",
        active
          ? "border-[rgba(225,38,28,0.26)] bg-[var(--surface-tint)] shadow-[0_18px_40px_rgba(225,38,28,0.08)]"
          : "border-[var(--border-soft)] bg-white hover:border-[rgba(225,38,28,0.18)] hover:bg-[rgba(255,255,255,0.96)]",
      ].join(" ")}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
        Section {index + 1}
      </span>
      <strong className="text-lg font-semibold text-[var(--text-primary)]">{pillar.label}</strong>
      <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
        <span>{answered}/{total} answered</span>
        <span>{answered ? formatScore(average) : "Not started"}</span>
      </div>
    </button>
  );
}

function QuestionCard({ question, response, onScoreSelect, onNoteChange }) {
  const selectedScore = Number(response?.score || 0);
  const notesOpen = Boolean(response?.evidence || response?.comment);
  const anchorText = selectedScore ? question.anchors[String(selectedScore)] : "";

  return (
    <article id={`question-${question.id}`} className="rounded-[24px] border border-[var(--border-soft)] bg-white p-5 shadow-[0_12px_28px_rgba(17,17,17,0.04)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              {question.id}
            </span>
            <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              {question.enabler}
            </span>
          </div>
          <h4 className="text-lg font-semibold leading-7 text-[var(--text-primary)]">
            {question.text}
          </h4>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1 font-medium text-[var(--text-secondary)]">
            Target {formatScore(question.target)}
          </span>
          <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1 font-medium text-[var(--text-secondary)]">
            {selectedScore ? anchorShortLabel(selectedScore) : "Unscored"}
          </span>
        </div>
      </div>

      <div className="thin-scrollbar mt-5 overflow-x-auto">
        <div className="flex min-w-max gap-2 pb-1">
          {[1, 2, 3, 4, 5].map((score) => {
            const selected = selectedScore === score;

            return (
              <button
                key={score}
                type="button"
                aria-label={`Score ${question.id} as ${anchorShortLabel(score)}`}
                aria-pressed={selected}
                onClick={() => onScoreSelect(question.id, score)}
                className={[
                  "flex min-w-28 flex-1 flex-col items-center gap-1 rounded-2xl border px-4 py-3 text-center transition duration-200 sm:min-w-32",
                  selected
                    ? "border-[rgba(225,38,28,0.24)] bg-[var(--surface-tint)] text-[var(--swire-red)] shadow-[0_16px_34px_rgba(225,38,28,0.1)]"
                    : "border-[var(--border-soft)] bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:border-[rgba(225,38,28,0.16)] hover:bg-white",
                ].join(" ")}
              >
                <span className="text-xl font-semibold">{score}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em]">
                  {anchorShortLabel(score)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={[
          "mt-5 rounded-[22px] border px-4 py-4 transition duration-200",
          selectedScore
            ? "border-[rgba(225,38,28,0.18)] bg-[var(--surface-tint)]"
            : "border-dashed border-[var(--border-soft)] bg-[var(--surface-muted)]",
        ].join(" ")}
      >
        {selectedScore ? (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--swire-red)]">{anchorLabel(selectedScore)}</p>
            <p className="text-sm leading-7 text-[var(--text-secondary)]">{anchorText}</p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Select a maturity level</p>
            <p className="text-sm leading-7 text-[var(--text-secondary)]">
              Choose 1 to 5 and the matching workbook anchor will appear here.
            </p>
          </div>
        )}
      </div>

      <details className="mt-5 rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)]" open={notesOpen}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Evidence & comments</span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Optional
          </span>
        </summary>
        <div className="grid gap-4 border-t border-[var(--border-soft)] px-4 py-4">
          <p className="text-sm leading-7 text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">Evidence prompt:</span>{" "}
            {question.evidencePrompt}
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
              Evidence notes
              <textarea
                value={response?.evidence || ""}
                onChange={(event) => onNoteChange(question.id, "evidence", event.target.value)}
                rows={4}
                className="rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none transition focus:border-[rgba(225,38,28,0.45)] focus:ring-2 focus:ring-[rgba(225,38,28,0.16)]"
                placeholder="Optional: summarize evidence, references, or documents used."
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
              Reviewer comment
              <textarea
                value={response?.comment || ""}
                onChange={(event) => onNoteChange(question.id, "comment", event.target.value)}
                rows={4}
                className="rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none transition focus:border-[rgba(225,38,28,0.45)] focus:ring-2 focus:ring-[rgba(225,38,28,0.16)]"
                placeholder="Optional: capture interpretation, concerns, or follow-up actions."
              />
            </label>
          </div>
        </div>
      </details>
    </article>
  );
}
function ResultsPanel({ results, answeredQuestions }) {
  if (answeredQuestions < RESULTS_MIN_ANSWERED) {
    return (
      <SurfaceCard className="rounded-[28px]">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {answeredQuestions === 0
              ? "Live results are waiting for input."
              : `${answeredQuestions} question(s) captured so far.`}
          </p>
          <p className="text-sm leading-7 text-[var(--text-secondary)]">
            Answer at least {RESULTS_MIN_ANSWERED} questions before reading the live dashboard.
          </p>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <SurfaceCard className="rounded-[24px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Overall Core Score
          </p>
          <strong className="mt-3 block text-3xl font-semibold text-[var(--text-primary)]">
            {formatScore(results.summary.overallCoreScore)}
          </strong>
        </SurfaceCard>
        <SurfaceCard className="rounded-[24px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Completion
          </p>
          <strong className="mt-3 block text-3xl font-semibold text-[var(--text-primary)]">
            {formatPercent(results.summary.completion)}
          </strong>
        </SurfaceCard>
        <SurfaceCard className="rounded-[24px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Largest Stage Gap
          </p>
          <strong className="mt-3 block text-xl font-semibold text-[var(--text-primary)]">
            {results.summary.largestStageGap.label}
          </strong>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Gap {formatScore(results.summary.largestStageGap.gap)}
          </p>
        </SurfaceCard>
        <SurfaceCard className="rounded-[24px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Largest Enabler Gap
          </p>
          <strong className="mt-3 block text-xl font-semibold text-[var(--text-primary)]">
            {results.summary.largestEnablerGap.label}
          </strong>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Gap {formatScore(results.summary.largestEnablerGap.gap)}
          </p>
        </SurfaceCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {[["By Pillar", results.pillarResults], ["By Stage", results.stageResults], ["By Enabler", results.enablerResults]].map(([label, items]) => (
          <SurfaceCard key={label} className="rounded-[24px] p-5">
            <div className="mb-4 space-y-1">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{label}</h3>
            </div>
            <div className="grid gap-4">
              {items.map((item) => (
                <div key={item.label} className="grid gap-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <strong className="text-[var(--text-primary)]">{item.label.replace(/^\d+\.\s*/, "")}</strong>
                    <span className="text-[var(--text-secondary)]">{formatScore(item.average)}</span>
                  </div>
                  <MetricBar value={(item.average / 5) * 100} />
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-tertiary)]">
                    <span>Target {formatScore(item.target)}</span>
                    <span>Gap {formatScore(item.gap)}</span>
                    <span>{item.answered}/{item.total} answered</span>
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        ))}
      </div>

      <SurfaceCard className="rounded-[24px] p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Priority List</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Weighted gap-to-target view for action planning.
          </p>
        </div>

        <div className="thin-scrollbar mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                <th className="pb-1 pr-4">Rank</th>
                <th className="pb-1 pr-4">Code</th>
                <th className="pb-1 pr-4">Pillar</th>
                <th className="pb-1 pr-4">Stage</th>
                <th className="pb-1 pr-4">Score</th>
                <th className="pb-1 pr-4">Target</th>
                <th className="pb-1">Priority</th>
              </tr>
            </thead>
            <tbody>
              {results.priorityList.map((item, index) => (
                <tr key={item.id} className="rounded-2xl bg-[var(--surface-muted)] text-[var(--text-secondary)]">
                  <td className="rounded-l-2xl px-3 py-3 font-semibold text-[var(--text-primary)]">{index + 1}</td>
                  <td className="px-3 py-3">{item.id}</td>
                  <td className="px-3 py-3">{item.pillar}</td>
                  <td className="px-3 py-3">{item.stage.replace(/^\d+\.\s*/, "")}</td>
                  <td className="px-3 py-3">{formatScore(item.score)}</td>
                  <td className="px-3 py-3">{formatScore(item.target)}</td>
                  <td className="rounded-r-2xl px-3 py-3 font-semibold text-[var(--text-primary)]">
                    {item.priorityIndex.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}

export function AssessmentPage() {
  const [assessmentState, setAssessmentState] = useState(createInitialState);
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState({ message: "Draft storage is ready.", tone: "" });
  const [draftLabel, setDraftLabel] = useState(
    assessmentState.lastSavedAt
      ? `${assessmentState.lastRemoteSavedAt ? "Draft synced" : "Draft saved"} ${formatTimestamp(assessmentState.lastSavedAt)}`
      : "Draft not saved yet",
  );
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const autosaveReady = useRef(false);

  const results = computeResults(assessmentData, assessmentState.responses);
  const answeredQuestions = getAnsweredQuestionsCount(assessmentData.questions, assessmentState.responses);
  const allQuestions = assessmentData.questions;
  const totalQuestions = allQuestions.length;
  const currentQuestion = currentStep >= 1 && currentStep <= totalQuestions ? allQuestions[currentStep - 1] : null;
  const currentResponse = currentQuestion ? assessmentState.responses[currentQuestion.id] : null;
  const currentScore = Number(currentResponse?.score || 0);
  const notesOpen = Boolean(currentResponse?.evidence || currentResponse?.comment);
  const progressPercent = totalQuestions > 0 ? (currentStep / totalQuestions) * 100 : 0;

  useEffect(() => {
    saveDraftState({
      ...assessmentState,
      updatedAt: new Date().toISOString(),
    });
  }, [assessmentState]);

  useEffect(() => {
    if (!autosaveReady.current) {
      autosaveReady.current = true;
      return;
    }

    setDraftLabel("Saving draft...");

    const timer = window.setTimeout(async () => {
      const savedAt = new Date().toISOString();
      const currentState = {
        ...assessmentState,
        lastSavedAt: savedAt,
      };

      setAssessmentState((current) => ({
        ...current,
        lastSavedAt: savedAt,
      }));
      setDraftLabel(`Draft saved ${formatTimestamp(savedAt)}`);

      const result = await saveDraftPayload(
        buildSubmissionPayload(
          assessmentData,
          currentState,
          computeResults(assessmentData, currentState.responses),
          false,
          "draft",
        ),
      );

      if (result.ok) {
        const remoteSavedAt = new Date().toISOString();
        setAssessmentState((current) => ({
          ...current,
          lastRemoteSavedAt: remoteSavedAt,
        }));
        setDraftLabel(`Draft synced ${formatTimestamp(remoteSavedAt)}`);
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [assessmentState.activePillarIndex, assessmentState.meta, assessmentState.responses]);

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    const nextPillarIndex = assessmentData.pillars.findIndex((pillar) => pillar.label === currentQuestion.pillar);

    if (nextPillarIndex >= 0 && nextPillarIndex !== assessmentState.activePillarIndex) {
      setActivePillarIndex(nextPillarIndex);
    }
  }, [currentQuestion, assessmentState.activePillarIndex]);

  function updateMeta(key, value) {
    setAssessmentState((current) => ({
      ...current,
      meta: {
        ...current.meta,
        [key]: value,
      },
    }));
  }

  function updateScore(questionId, score) {
    setAssessmentState((current) => ({
      ...current,
      responses: {
        ...current.responses,
        [questionId]: {
          ...(current.responses[questionId] || {}),
          score,
        },
      },
    }));
  }

  function updateNote(questionId, field, value) {
    setAssessmentState((current) => ({
      ...current,
      responses: {
        ...current.responses,
        [questionId]: {
          ...(current.responses[questionId] || {}),
          [field]: value,
        },
      },
    }));
  }

  function setActivePillarIndex(nextIndex) {
    setAssessmentState((current) => ({
      ...current,
      activePillarIndex: nextIndex,
    }));
  }

  async function handleManualSave() {
    setSavingDraft(true);
    const savedAt = new Date().toISOString();
    const nextState = {
      ...assessmentState,
      lastSavedAt: savedAt,
    };

    setAssessmentState(nextState);
    setDraftLabel(`Draft saved ${formatTimestamp(savedAt)}`);
    const result = await saveDraftPayload(
      buildSubmissionPayload(assessmentData, nextState, computeResults(assessmentData, nextState.responses), false, "draft"),
    );

    if (result.ok) {
      const remoteSavedAt = new Date().toISOString();
      setAssessmentState((current) => ({
        ...current,
        lastRemoteSavedAt: remoteSavedAt,
      }));
      setDraftLabel(`Draft synced ${formatTimestamp(remoteSavedAt)}`);
      setStatus({ message: "Draft saved locally and synced.", tone: "success" });
    } else {
      setStatus({ message: `Draft saved locally. Remote sync pending: ${result.message}`, tone: "warn" });
    }
    setSavingDraft(false);
  }

  async function handleSubmit() {
    const unanswered = getUnansweredQuestions(assessmentData, assessmentState.responses);
    if (unanswered.length > 0) {
      const firstMissing = unanswered[0];
      const targetIndex = assessmentData.pillars.findIndex((pillar) => pillar.label === firstMissing.pillar);
      const missingStep = assessmentData.questions.findIndex((question) => question.id === firstMissing.id);
      setActivePillarIndex(targetIndex);
      if (missingStep >= 0) {
        setCurrentStep(missingStep + 1);
      }
      setStatus({
        message: `Assessment is incomplete. ${unanswered.length} question(s) still need scores. First missing item: ${firstMissing.id}.`,
        tone: "warn",
      });
      window.setTimeout(() => {
        document.getElementById(`question-${firstMissing.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 80);
      return;
    }

    setCurrentStep(totalQuestions + 1);
    window.scrollTo({ top: 0, behavior: "auto" });
    setSubmitting(true);
    const payload = buildSubmissionPayload(assessmentData, assessmentState, results, true);
    const result = await submitAssessmentPayload(payload);
    if (result.ok) {
      setStatus({
        message: result.transport === "disabled" ? result.message : `Assessment submitted. ${result.message}`,
        tone: result.transport === "disabled" ? "warn" : "success",
      });
    } else {
      setStatus({
        message: `Submission did not complete cleanly. ${result.message}`,
        tone: "error",
      });
    }
    setSubmitting(false);
    document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleReset() {
    const confirmed = window.confirm("Reset all scores, notes, and respondent details for this local draft?");
    if (!confirmed) {
      return;
    }

    clearDraftState();
    const fresh = createInitialState();
    fresh.sessionId = buildSessionId();
    fresh.meta = createDefaultMeta();
    fresh.responses = {};
    fresh.activePillarIndex = 0;
    fresh.lastSavedAt = "";
    fresh.lastRemoteSavedAt = "";
    setAssessmentState(fresh);
    setCurrentStep(0);
    setDraftLabel("Draft not saved yet");
    setStatus({ message: "Assessment draft reset.", tone: "warn" });
  }

  function handleDownload() {
    const payload = buildSubmissionPayload(assessmentData, assessmentState, results, false, "draft");
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${payload.sessionId}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus({ message: "Current assessment state downloaded as JSON.", tone: "success" });
  }

  function goNext() {
    if (currentStep === totalQuestions) {
      void handleSubmit();
    } else {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  function goPrev() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 md:px-8 md:py-12">
      {currentStep === 0 ? (
        <section className="flex min-h-[calc(100vh-12rem)] items-center">
          <SurfaceCard className="mx-auto w-full max-w-2xl rounded-[32px] p-8 md:p-10">
            <div className="space-y-4">
              <Eyebrow>Assessment</Eyebrow>
              <h1 className="font-[var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">
                Start the assessment one question at a time.
              </h1>
              <p className="text-base leading-8 text-[var(--text-secondary)] md:text-lg">
                Capture the respondent profile first, then move through each workbook question in a focused wizard flow with autosave and final review intact.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                ["market", "Market", "e.g. Hong Kong"],
                ["cluster", "Cluster", "e.g. Greater China"],
                ["businessUnit", "Business Unit", "e.g. RGM / Commercial"],
                ["respondentName", "Respondent Name", "Full name"],
                ["respondentEmail", "Respondent Email", "name@company.com"],
                ["role", "Role", "e.g. Market RGM Lead"],
                ["assessmentCycle", "Assessment Cycle", "e.g. 2026 Full Assessment"],
              ].map(([key, label, placeholder]) => (
                <label
                  key={key}
                  className={key === "assessmentCycle" ? "grid gap-2 text-sm font-medium text-[var(--text-primary)] md:col-span-2" : "grid gap-2 text-sm font-medium text-[var(--text-primary)]"}
                >
                  {label}
                  <input
                    type={key === "respondentEmail" ? "email" : "text"}
                    value={assessmentState.meta[key]}
                    onChange={(event) => updateMeta(key, event.target.value)}
                    placeholder={placeholder}
                    className="h-12 rounded-2xl border border-[var(--border-soft)] bg-white px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[rgba(225,38,28,0.45)] focus:ring-2 focus:ring-[rgba(225,38,28,0.16)]"
                  />
                </label>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <Button
                onClick={() => {
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: "auto" });
                }}
                className="h-12 w-full text-base"
                aria-label="Start assessment"
              >
                Start Assessment
              </Button>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                <span>{answeredQuestions}/{totalQuestions} questions answered</span>
                <span>{draftLabel}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button tone="secondary" onClick={handleManualSave} loading={savingDraft} aria-label="Save assessment draft">
                  <Save className="size-4" aria-hidden="true" />
                  Save Draft
                </Button>
                <Button tone="secondary" onClick={handleDownload} aria-label="Download assessment JSON">
                  <Download className="size-4" aria-hidden="true" />
                  Download JSON
                </Button>
                <Button tone="secondary" onClick={handleReset} aria-label="Reset assessment draft">
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Reset Draft
                </Button>
              </div>

              <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${statusClass(status.tone)}`}>
                {status.message}
              </div>
            </div>
          </SurfaceCard>
        </section>
      ) : currentQuestion ? (
        <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] py-2 px-4 text-sm text-[var(--text-secondary)]">
            <span className="truncate">
              {assessmentState.meta.market || "Market"} | {assessmentState.meta.businessUnit || "Business Unit"} | {assessmentState.meta.respondentName || "Respondent"}
            </span>
            <button
              type="button"
              onClick={() => {
                setCurrentStep(0);
                window.scrollTo({ top: 0, behavior: "auto" });
              }}
              className="inline-flex size-8 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--text-secondary)] transition hover:border-[rgba(225,38,28,0.25)] hover:text-[var(--swire-red)]"
              aria-label="Edit respondent details"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-end justify-between gap-4">
            <p className="text-sm font-semibold text-[var(--text-secondary)]">
              {currentQuestion.pillar} &gt; {currentQuestion.stage}
            </p>
            <span className="text-sm font-semibold text-[var(--text-secondary)]">
              Question {currentStep} of {totalQuestions}
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-[rgba(38,38,38,0.08)]">
            <div
              className="h-full rounded-full bg-[var(--swire-red)] transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <article
            id={`question-${currentQuestion.id}`}
            className="rounded-[28px] border border-[var(--border-soft)] bg-white p-6 shadow-[0_18px_40px_rgba(17,17,17,0.06)] md:p-7"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                {currentQuestion.id}
              </span>
              <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                {currentQuestion.enabler}
              </span>
              <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1 text-sm font-medium text-[var(--text-secondary)]">
                Target {formatScore(currentQuestion.target)}
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-semibold leading-9 text-[var(--text-primary)]">
              {currentQuestion.text}
            </h2>

            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Evidence prompt:</span>{" "}
              {currentQuestion.evidencePrompt}
            </p>

            <div className="mt-6 grid gap-3">
              {[1, 2, 3, 4, 5].map((score) => {
                const selected = currentScore === score;

                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => updateScore(currentQuestion.id, score)}
                    aria-label={`Score ${currentQuestion.id} as ${anchorShortLabel(score)}`}
                    aria-pressed={selected}
                    className={[
                      "flex w-full flex-col gap-2 rounded-[22px] border px-5 py-4 text-left transition duration-200",
                      selected
                        ? "border-[rgba(225,38,28,0.35)] bg-[var(--surface-tint)] shadow-[0_14px_30px_rgba(225,38,28,0.08)]"
                        : "border-[var(--border-soft)] bg-[var(--surface-muted)] hover:border-[rgba(225,38,28,0.18)] hover:bg-white",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-2xl font-semibold text-[var(--text-primary)]">{score}</span>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                        {anchorShortLabel(score)}
                      </span>
                    </div>
                    <p className="text-sm leading-7 text-[var(--text-secondary)]">
                      {currentQuestion.anchors[String(score)]}
                    </p>
                  </button>
                );
              })}
            </div>

            <details className="mt-6 rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)]" open={notesOpen}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Evidence & comments</span>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Optional
                </span>
              </summary>
              <div className="grid gap-4 border-t border-[var(--border-soft)] px-4 py-4">
                <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
                  Evidence notes
                  <textarea
                    value={currentResponse?.evidence || ""}
                    onChange={(event) => updateNote(currentQuestion.id, "evidence", event.target.value)}
                    rows={4}
                    className="rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none transition focus:border-[rgba(225,38,28,0.45)] focus:ring-2 focus:ring-[rgba(225,38,28,0.16)]"
                    placeholder="Optional: summarize evidence, references, or documents used."
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
                  Reviewer comment
                  <textarea
                    value={currentResponse?.comment || ""}
                    onChange={(event) => updateNote(currentQuestion.id, "comment", event.target.value)}
                    rows={4}
                    className="rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none transition focus:border-[rgba(225,38,28,0.45)] focus:ring-2 focus:ring-[rgba(225,38,28,0.16)]"
                    placeholder="Optional: capture interpretation, concerns, or follow-up actions."
                  />
                </label>
              </div>
            </details>
          </article>

          <div className="flex flex-col gap-3 rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-elevated)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <Button tone="secondary" onClick={goPrev} aria-label="Go to previous step">
              Back
            </Button>
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              {answeredQuestions}/{totalQuestions} answered
            </span>
            <Button
              onClick={goNext}
              loading={submitting && currentStep === totalQuestions}
              aria-label={currentStep === totalQuestions ? "Submit assessment" : "Go to next question"}
            >
              {currentStep === totalQuestions ? "Submit Assessment" : "Next Question"}
            </Button>
          </div>

          <div className="flex flex-col gap-4 rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
              <span>{draftLabel}</span>
              <span>{currentScore ? `${anchorShortLabel(currentScore)} selected` : "No score selected yet"}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button tone="secondary" onClick={handleManualSave} loading={savingDraft} aria-label="Save assessment draft">
                <Save className="size-4" aria-hidden="true" />
                Save Draft
              </Button>
              <Button tone="secondary" onClick={handleDownload} aria-label="Download assessment JSON">
                <Download className="size-4" aria-hidden="true" />
                Download JSON
              </Button>
              <Button tone="secondary" onClick={handleReset} aria-label="Reset assessment draft">
                <RotateCcw className="size-4" aria-hidden="true" />
                Reset Draft
              </Button>
            </div>
            <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${statusClass(status.tone)}`}>
              {status.message}
            </div>
          </div>
        </section>
      ) : (
        <section id="results-section" className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <SectionHeading
            eyebrow="Live Results"
            title="Assessment review and submission"
            description="Review the computed dashboard, submit when ready, or jump back to the question flow to refine scores and notes."
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            <span>
              {assessmentState.meta.market || "Market"} | {assessmentState.meta.businessUnit || "Business Unit"} | {assessmentState.meta.respondentName || "Respondent"}
            </span>
            <span>{draftLabel}</span>
          </div>

          <ResultsPanel results={results} answeredQuestions={answeredQuestions} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button tone="secondary" onClick={goPrev} aria-label="Back to questions">
              Back to Questions
            </Button>
            <Button onClick={handleSubmit} loading={submitting} aria-label="Submit completed assessment">
              <Send className="size-4" aria-hidden="true" />
              Submit Assessment
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button tone="secondary" onClick={handleManualSave} loading={savingDraft} aria-label="Save assessment draft">
              <Save className="size-4" aria-hidden="true" />
              Save Draft
            </Button>
            <Button tone="secondary" onClick={handleDownload} aria-label="Download assessment JSON">
              <Download className="size-4" aria-hidden="true" />
              Download JSON
            </Button>
            <Button tone="secondary" onClick={handleReset} aria-label="Reset assessment draft">
              <RotateCcw className="size-4" aria-hidden="true" />
              Reset Draft
            </Button>
          </div>

          <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${statusClass(status.tone)}`}>
            {status.message}
          </div>
        </section>
      )}
    </div>
  );
}
