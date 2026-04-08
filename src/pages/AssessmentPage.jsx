import { Download, Pencil, RotateCcw, Save, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, MetricBar, SurfaceCard } from "../components/ui.jsx";
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
  getAnsweredSubItemsCount,
  getQuestionAnsweredSubItemsCount,
  getQuestionPercent,
  getSuggestedAnchorLevel,
  getUnansweredQuestions,
  isQuestionComplete,
  RESULTS_MIN_ANSWERED,
  SUB_ITEM_SCORE_OPTIONS,
  subItemScoreShortLabel,
} from "../lib/assessment.js";
import { clearDraftState, readDraftState, saveDraftState } from "../lib/browser-storage.js";
import { saveDraftPayload, submitAssessmentPayload } from "../lib/submission.js";

function normalizeResponses(rawResponses) {
  const validQuestionIds = new Set(assessmentData.questions.map((question) => question.id));
  const allowedValues = new Set(SUB_ITEM_SCORE_OPTIONS.map((option) => option.value));
  const normalized = {};

  Object.entries(rawResponses || {}).forEach(([questionId, rawValue]) => {
    if (!validQuestionIds.has(questionId) || !rawValue || typeof rawValue !== "object" || Array.isArray(rawValue)) {
      return;
    }

    const question = assessmentData.questions.find((item) => item.id === questionId);
    if (!question) {
      return;
    }

    const validSubItemIds = new Set(question.subItems.map((subItem) => subItem.id));
    const subItemResponses = {};

    Object.entries(rawValue.subItemResponses || {}).forEach(([subItemId, score]) => {
      const numericScore = Number(score);
      if (validSubItemIds.has(subItemId) && allowedValues.has(numericScore)) {
        subItemResponses[subItemId] = numericScore;
      }
    });

    normalized[questionId] = {
      evidence: typeof rawValue.evidence === "string" ? rawValue.evidence : "",
      comment: typeof rawValue.comment === "string" ? rawValue.comment : "",
      subItemResponses,
    };
  });

  return normalized;
}

function createInitialState() {
  const saved = readDraftState();

  return {
    sessionId: saved?.sessionId || buildSessionId(),
    meta: { ...createDefaultMeta(), ...(saved?.meta || {}) },
    responses: normalizeResponses(saved?.responses),
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

function GroupPanel({ title, description, items }) {
  return (
    <SurfaceCard className="rounded-[24px] p-5">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      </div>

      <div className="mt-5 grid gap-4">
        {items.map((item) => {
          const answeredLabel =
            item.scoreType === "pillar"
              ? `${item.answered}/${item.total} main questions complete`
              : `${item.answered}/${item.total} sub-items scored`;

          return (
            <div key={item.label} className="grid gap-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</strong>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">{answeredLabel}</p>
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {formatScore(item.average)}
                  <span className="text-[var(--text-tertiary)]"> / {formatScore(item.maxScore, 0)}</span>
                </span>
              </div>
              <MetricBar value={(item.average / item.maxScore) * 100} />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-tertiary)]">
                <span>Target {formatScore(item.target)}</span>
                <span>Gap {formatScore(item.gap)}</span>
                <span>{formatPercent(item.completion)} coverage</span>
              </div>
            </div>
          );
        })}
      </div>
    </SurfaceCard>
  );
}

function ResultsPanel({ results, answeredQuestions }) {
  if (answeredQuestions < RESULTS_MIN_ANSWERED) {
    return (
      <SurfaceCard className="rounded-[28px]">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {answeredQuestions === 0
              ? "Live certification results are waiting for scored questions."
              : `${answeredQuestions} main question(s) are complete so far.`}
          </p>
          <p className="text-sm leading-7 text-[var(--text-secondary)]">
            Complete at least {RESULTS_MIN_ANSWERED} main questions before reading the live certification dashboard.
          </p>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 xl:grid-cols-4">
        <SurfaceCard className="rounded-[24px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Official Score</p>
          <strong className="mt-3 block text-3xl font-semibold text-[var(--text-primary)]">{formatScore(results.summary.overallOfficialScore)}</strong>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Out of 100 official certification points</p>
        </SurfaceCard>
        <SurfaceCard className="rounded-[24px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Certification Tier</p>
          <strong className="mt-3 block text-2xl font-semibold text-[var(--text-primary)]">
            {results.summary.finalCertification?.label || "Pending"}
          </strong>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Preliminary {results.summary.preliminaryCertification?.label || "Pending"}
          </p>
        </SurfaceCard>
        <SurfaceCard className="rounded-[24px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Completion</p>
          <strong className="mt-3 block text-3xl font-semibold text-[var(--text-primary)]">{formatPercent(results.summary.completion)}</strong>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {results.summary.answeredSubItems}/{results.summary.totalSubItems} sub-items scored
          </p>
        </SurfaceCard>
        <SurfaceCard className="rounded-[24px] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Gating Rule</p>
          <strong className="mt-3 block text-xl font-semibold text-[var(--text-primary)]">
            {results.summary.gatingTriggered ? "Gate active" : "All pillars above minimum"}
          </strong>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{results.summary.gatingRule}</p>
        </SurfaceCard>
      </div>

      <SurfaceCard className="rounded-[24px] p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Weakest Pillar</p>
            <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{results.summary.weakestPillar?.label || "Pending"}</p>
            <p className="text-sm text-[var(--text-secondary)]">
              {results.summary.weakestPillar ? `${formatScore(results.summary.weakestPillar.average)} / 20` : "Score after more coverage"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Largest Stage Gap</p>
            <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{results.summary.largestStageGap?.label || "Pending"}</p>
            <p className="text-sm text-[var(--text-secondary)]">
              {results.summary.largestStageGap ? `Gap ${formatScore(results.summary.largestStageGap.gap)}` : "Diagnostic view builds with more data"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Largest Enabler Gap</p>
            <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{results.summary.largestEnablerGap?.label || "Pending"}</p>
            <p className="text-sm text-[var(--text-secondary)]">
              {results.summary.largestEnablerGap ? `Gap ${formatScore(results.summary.largestEnablerGap.gap)}` : "Diagnostic view builds with more data"}
            </p>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <GroupPanel title="By Pillar" description="Official scoring view, converted into 20-point pillar scores." items={results.pillarResults} />
        <GroupPanel title="By Stage" description="Diagnostic view across the annual operating cycle." items={results.stageResults} />
        <GroupPanel title="By Enabler" description="Diagnostic view for governance, tools, people, and future readiness." items={results.enablerResults} />
      </div>

      <SurfaceCard className="rounded-[24px] p-5">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Priority Questions</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Main questions with the largest gap to the 75% expected operating standard.
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
                <th className="pb-1">Gap</th>
              </tr>
            </thead>
            <tbody>
              {results.priorityList.map((item, index) => (
                <tr key={item.id} className="rounded-2xl bg-[var(--surface-muted)] text-[var(--text-secondary)]">
                  <td className="rounded-l-2xl px-3 py-3 font-semibold text-[var(--text-primary)]">{index + 1}</td>
                  <td className="px-3 py-3">{item.id}</td>
                  <td className="px-3 py-3">{item.pillar}</td>
                  <td className="px-3 py-3">{item.stage}</td>
                  <td className="px-3 py-3">{formatScore(item.score)}</td>
                  <td className="px-3 py-3">{formatScore(item.target)}</td>
                  <td className="rounded-r-2xl px-3 py-3 font-semibold text-[var(--text-primary)]">{formatScore(item.gap)}</td>
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
  const [status, setStatus] = useState({ message: "Draft storage is ready for the certification model.", tone: "" });
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
  const answeredSubItems = getAnsweredSubItemsCount(assessmentData.questions, assessmentState.responses);
  const allQuestions = assessmentData.questions;
  const totalQuestions = allQuestions.length;
  const totalSubItems = assessmentData.meta.subItemCount;
  const currentQuestion = currentStep >= 1 && currentStep <= totalQuestions ? allQuestions[currentStep - 1] : null;
  const currentResponse = currentQuestion ? assessmentState.responses[currentQuestion.id] : null;
  const currentQuestionAnsweredSubItems = currentQuestion
    ? getQuestionAnsweredSubItemsCount(currentQuestion, assessmentState.responses)
    : 0;
  const currentQuestionComplete = currentQuestion ? isQuestionComplete(currentQuestion, assessmentState.responses) : false;
  const currentQuestionPercent = currentQuestion
    ? getQuestionPercent(currentQuestion, assessmentState.responses, { requireComplete: false })
    : null;
  const currentSuggestedAnchor = currentQuestion ? getSuggestedAnchorLevel(currentQuestion, assessmentState.responses) : 0;
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
      setAssessmentState((current) => ({
        ...current,
        activePillarIndex: nextPillarIndex,
      }));
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

  function updateSubItemScore(questionId, subItemId, score) {
    setAssessmentState((current) => ({
      ...current,
      responses: {
        ...current.responses,
        [questionId]: {
          evidence: current.responses[questionId]?.evidence || "",
          comment: current.responses[questionId]?.comment || "",
          subItemResponses: {
            ...(current.responses[questionId]?.subItemResponses || {}),
            [subItemId]: score,
          },
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
          evidence: current.responses[questionId]?.evidence || "",
          comment: current.responses[questionId]?.comment || "",
          subItemResponses: {
            ...(current.responses[questionId]?.subItemResponses || {}),
          },
          [field]: value,
        },
      },
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
      const targetIndex = assessmentData.questions.findIndex((question) => question.id === firstMissing.id);

      if (targetIndex >= 0) {
        setCurrentStep(targetIndex + 1);
      }

      setStatus({
        message: `Assessment is incomplete. ${unanswered.length} main question(s) still need all sub-items scored. First missing item: ${firstMissing.id}.`,
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
  }

  function handleReset() {
    const confirmed = window.confirm("Reset all scores, notes, and respondent details for this local certification draft?");
    if (!confirmed) {
      return;
    }

    clearDraftState();
    setAssessmentState({
      sessionId: buildSessionId(),
      meta: createDefaultMeta(),
      responses: {},
      activePillarIndex: 0,
      lastSavedAt: "",
      lastRemoteSavedAt: "",
    });
    setCurrentStep(0);
    setDraftLabel("Draft not saved yet");
    setStatus({ message: "Certification draft reset.", tone: "warn" });
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
    setStatus({ message: "Current certification state downloaded as JSON.", tone: "success" });
  }

  function goNext() {
    if (!currentQuestion) {
      return;
    }

    if (!currentQuestionComplete) {
      setStatus({
        message: `Complete all ${currentQuestion.subItems.length} sub-items for ${currentQuestion.id} before moving on.`,
        tone: "warn",
      });
      return;
    }

    if (currentStep === totalQuestions) {
      setCurrentStep(totalQuestions + 1);
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    setCurrentStep((step) => step + 1);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goPrev() {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-8 py-12 md:px-12">
      {currentStep === 0 ? (
        <section className="flex min-h-[calc(100vh-12rem)] items-center">
          <div className="mx-auto w-full max-w-4xl rounded-[32px] border border-[var(--border-soft)] bg-white p-8 shadow-[var(--shadow-card)] md:p-10">
            <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-5">
                <div className="space-y-3">
                  <p className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-[var(--swire-red)]">RGM Certification Assessment</p>
                  <h1 className="font-[var(--font-display)] text-4xl font-black leading-[1.08] tracking-tight text-[var(--text-primary)] md:text-5xl">
                    50 main questions. <span className="italic text-[var(--swire-red)]">150 proof points.</span>
                  </h1>
                  <p className="text-base leading-8 text-[var(--text-secondary)] md:text-lg">
                    This version scores each main question through three sub-items, converts pillar results into official certification points,
                    and keeps stage and enabler diagnostics visible while you work.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Structure</p>
                    <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">5 pillars x 5 stages x 4 enablers</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Mix is now a full core pillar in the certification model.</p>
                  </div>
                  <div className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Scoring</p>
                    <p className="mt-3 text-lg font-semibold text-[var(--text-primary)]">0 / 0.5 / 1 by sub-item</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                      Pillars convert to 20-point official scores; certification rolls up to 100.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {[
                  ["market", "Market", "e.g. Hong Kong"],
                  ["cluster", "Cluster", "e.g. Greater China"],
                  ["businessUnit", "Business Unit", "e.g. Commercial Excellence"],
                  ["respondentName", "Respondent Name", "Full name"],
                  ["respondentEmail", "Respondent Email", "name@company.com"],
                  ["role", "Role", "e.g. Market RGM Lead"],
                  ["assessmentCycle", "Assessment Cycle", "e.g. 2026 Annual Certification"],
                ].map(([key, label, placeholder]) => (
                  <label key={key} className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
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

                <Button
                  onClick={() => {
                    setCurrentStep(1);
                    window.scrollTo({ top: 0, behavior: "auto" });
                  }}
                  className="mt-2 h-12 w-full text-base"
                  aria-label="Start certification assessment"
                >
                  {answeredSubItems > 0 ? "Continue Certification Assessment" : "Start Certification Assessment"}
                </Button>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  <span>{answeredQuestions}/{totalQuestions} main questions complete</span>
                  <span>{answeredSubItems}/{totalSubItems} sub-items scored</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4">
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

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                <span>{draftLabel}</span>
                <span>Autosave is active</span>
              </div>

              <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${statusClass(status.tone)}`}>{status.message}</div>
            </div>
          </div>
        </section>
      ) : currentQuestion ? (
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
          <div className="flex items-center justify-between gap-3 rounded-[22px] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
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

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                {currentQuestion.pillar} &gt; {currentQuestion.stage}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">{currentQuestion.text}</h2>
            </div>
            <div className="text-right text-sm font-semibold text-[var(--text-secondary)]">
              Main Question {currentStep} of {totalQuestions}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              <span>Question flow</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[rgba(38,38,38,0.08)]">
              <div className="h-full rounded-full bg-[var(--swire-red)] transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <article id={`question-${currentQuestion.id}`} className="rounded-[28px] bg-[var(--surface-glass)] p-6 shadow-[var(--shadow-card)] backdrop-blur-md md:p-7">
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    {currentQuestion.id}
                  </span>
                  <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    {currentQuestion.enabler}
                  </span>
                  <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                    {currentQuestion.subItems.length} sub-items
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[22px] border border-[var(--border-soft)] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Question Score</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                      {currentQuestionPercent === null ? "0.0" : formatScore(currentQuestionPercent)}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">Percent of sub-items currently in place</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--border-soft)] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Suggested Anchor</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                      {currentSuggestedAnchor ? anchorShortLabel(currentSuggestedAnchor) : "Pending"}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">Qualitative reference, not the scoring control itself</p>
                  </div>
                  <div className="rounded-[22px] border border-[var(--border-soft)] bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Completion</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
                      {currentQuestionAnsweredSubItems}/{currentQuestion.subItems.length}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {currentQuestionComplete ? "Ready for next question" : "Score every sub-item to continue"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Maturity anchor guidance</h3>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Target operating standard: 75%</span>
                  </div>
                  <div className="grid gap-3">
                    {[1, 2, 3, 4, 5].map((level) => {
                      const active = currentSuggestedAnchor === level;
                      return (
                        <div
                          key={level}
                          className={[
                            "rounded-[22px] border px-4 py-4 transition duration-200",
                            active ? "border-[rgba(225,38,28,0.24)] bg-[var(--surface-tint)]" : "border-[var(--border-soft)] bg-white",
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-3">
                            <span className="rounded-full border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                              {anchorLabel(level)}
                            </span>
                            {active ? (
                              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--swire-red)]">Current fit</span>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{currentQuestion.anchors[String(level)]}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[24px] border border-[var(--border-soft)] bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">Sub-item scoring</h3>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">0 / 0.5 / 1</span>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {currentQuestion.subItems.map((subItem, index) => {
                      const selectedScore = currentResponse?.subItemResponses?.[subItem.id];
                      return (
                        <div key={subItem.id} className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold text-[var(--text-primary)]">
                                {index + 1}. {subItem.text}
                              </p>
                              <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                                {selectedScore === undefined ? "Unscored" : subItemScoreShortLabel(selectedScore)}
                              </span>
                            </div>
                            {subItem.boundaryNote ? (
                              <p className="text-xs leading-6 text-[var(--text-tertiary)]">Boundary note: {subItem.boundaryNote}</p>
                            ) : null}
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-3">
                            {SUB_ITEM_SCORE_OPTIONS.map((option) => {
                              const selected = selectedScore === option.value;
                              return (
                                <button
                                  key={`${subItem.id}-${option.value}`}
                                  type="button"
                                  onClick={() => updateSubItemScore(currentQuestion.id, subItem.id, option.value)}
                                  aria-label={`Score ${subItem.id} as ${option.label}`}
                                  aria-pressed={selected}
                                  className={[
                                    "rounded-2xl border px-3 py-3 text-left transition duration-200",
                                    selected
                                      ? "border-[rgba(225,38,28,0.28)] bg-[var(--surface-tint)] shadow-[0_12px_26px_rgba(225,38,28,0.08)]"
                                      : "border-[var(--border-soft)] bg-white hover:border-[rgba(225,38,28,0.18)] hover:bg-[rgba(255,255,255,0.96)]",
                                  ].join(" ")}
                                >
                                  <span className="block text-lg font-semibold text-[var(--text-primary)]">{option.value}</span>
                                  <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">{option.shortLabel}</span>
                                  <span className="mt-2 block text-xs leading-5 text-[var(--text-tertiary)]">{option.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[var(--border-soft)] bg-white p-5">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">Evidence and interpretation</h3>
                    <p className="text-sm leading-6 text-[var(--text-secondary)]">
                      Capture the evidence trail and any interpretation notes for this main question.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
                      Evidence notes
                      <textarea
                        value={currentResponse?.evidence || ""}
                        onChange={(event) => updateNote(currentQuestion.id, "evidence", event.target.value)}
                        rows={4}
                        className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none transition focus:border-[rgba(225,38,28,0.45)] focus:bg-white focus:ring-2 focus:ring-[rgba(225,38,28,0.16)]"
                        placeholder="Summarize evidence, examples, or data sources supporting this question."
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-medium text-[var(--text-primary)]">
                      Reviewer comment
                      <textarea
                        value={currentResponse?.comment || ""}
                        onChange={(event) => updateNote(currentQuestion.id, "comment", event.target.value)}
                        rows={4}
                        className="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none transition focus:border-[rgba(225,38,28,0.45)] focus:bg-white focus:ring-2 focus:ring-[rgba(225,38,28,0.16)]"
                        placeholder="Capture interpretation, caveats, or follow-up action for moderation."
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <div className="flex flex-col gap-3 rounded-[22px] bg-[var(--surface-muted)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <Button tone="secondary" onClick={goPrev} aria-label="Go to previous step">Back</Button>
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              {answeredQuestions}/{totalQuestions} main questions complete | {answeredSubItems}/{totalSubItems} sub-items scored
            </span>
            <Button onClick={goNext} aria-label={currentStep === totalQuestions ? "Review certification results" : "Go to next question"}>
              {currentStep === totalQuestions ? "Review Results" : "Next Question"}
            </Button>
          </div>

          <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${statusClass(status.tone)}`}>{status.message}</div>
        </section>
      ) : (
        <section id="results-section" className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="space-y-2">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.3em] text-[var(--swire-red)]">Certification Results</p>
            <h2 className="font-[var(--font-display)] text-4xl font-black tracking-tight text-[var(--text-primary)]">
              Review the certification output before <span className="italic text-[var(--swire-red)]">submission</span>
            </h2>
            <p className="text-base leading-7 text-[var(--text-secondary)]">
              Official pillar scoring, stage and enabler diagnostics, and the certification tier all update from the same scored sub-items.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-[var(--border-soft)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            <span>
              {assessmentState.meta.market || "Market"} | {assessmentState.meta.businessUnit || "Business Unit"} | {assessmentState.meta.respondentName || "Respondent"}
            </span>
            <span>{draftLabel}</span>
          </div>

          <ResultsPanel results={results} answeredQuestions={answeredQuestions} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button tone="secondary" onClick={goPrev} aria-label="Back to questions">Back to Questions</Button>
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

          <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${statusClass(status.tone)}`}>{status.message}</div>
        </section>
      )}
    </div>
  );
}
