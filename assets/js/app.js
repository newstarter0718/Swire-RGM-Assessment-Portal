import { saveDraftToGoogleSheets, submitToGoogleSheets } from "./google-sheets.js";

const STORAGE_KEY = "swire-rgm-assessment-draft-v1";
const ENDPOINT_STORAGE_KEY = "swire-rgm-apps-script-url";
const AUTOSAVE_DEBOUNCE_MS = 1000;
const RESULTS_MIN_ANSWERED = 5;

const state = {
  config: null,
  activePillarIndex: 0,
  sessionId: buildSessionId(),
  meta: createDefaultMeta(),
  responses: {},
  results: null,
  lastSavedAt: "",
  lastRemoteSavedAt: "",
};

const dom = {};
let autosaveTimer = null;

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", init);
}

async function init() {
  cacheDom();
  hydrateEndpointFromQuery();
  state.config = await loadConfig();
  hydrateFromStorage();
  bindEvents();
  syncEndpointUi();
  renderFramework();
  syncHeroCounts();
  renderPillarNav();
  renderActivePillar();
  recomputeResults();
}

function cacheDom() {
  dom.respondentForm = document.getElementById("respondent-form");
  dom.heroPillarCount = document.getElementById("hero-pillar-count");
  dom.heroStageCount = document.getElementById("hero-stage-count");
  dom.heroQuestionCount = document.getElementById("hero-question-count");
  dom.heroEnablerCount = document.getElementById("hero-enabler-count");
  dom.heroPillarStack = document.getElementById("hero-pillar-stack");
  dom.heroStageTrack = document.getElementById("hero-stage-track");
  dom.heroEnablerStack = document.getElementById("hero-enabler-stack");
  dom.pillarCards = document.getElementById("pillar-cards");
  dom.stageCards = document.getElementById("stage-cards");
  dom.enablerCards = document.getElementById("enabler-cards");
  dom.questionnaireNav = document.getElementById("questionnaire-nav");
  dom.currentPillarTitle = document.getElementById("current-pillar-title");
  dom.currentPillarDescription = document.getElementById("current-pillar-description");
  dom.currentStageSummary = document.getElementById("current-stage-summary");
  dom.questionnairePanels = document.getElementById("questionnaire-panels");
  dom.wizardStep = document.getElementById("wizard-step");
  dom.wizardSection = document.getElementById("wizard-section");
  dom.wizardProgressValue = document.getElementById("wizard-progress-value");
  dom.wizardProgressFill = document.getElementById("wizard-progress-fill");
  dom.draftSavedAt = document.getElementById("draft-saved-at");
  dom.answeredCount = document.getElementById("answered-count");
  dom.completionRate = document.getElementById("completion-rate");
  dom.saveStatus = document.getElementById("save-status");
  dom.prevPillar = document.getElementById("previous-pillar");
  dom.nextPillar = document.getElementById("next-pillar");
  dom.saveDraft = document.getElementById("save-draft");
  dom.resetAssessment = document.getElementById("reset-assessment");
  dom.submitAssessment = document.getElementById("submit-assessment");
  dom.downloadJson = document.getElementById("download-json");
  dom.resultsEmpty = document.getElementById("results-empty");
  dom.resultsContent = document.getElementById("results-content");
  dom.resultsSummary = document.getElementById("results-summary");
  dom.pillarResults = document.getElementById("pillar-results");
  dom.stageResults = document.getElementById("stage-results");
  dom.enablerResults = document.getElementById("enabler-results");
  dom.priorityBody = document.getElementById("priority-body");
  dom.endpointInput = document.getElementById("apps-script-url");
  dom.saveEndpoint = document.getElementById("save-endpoint");
  dom.clearEndpoint = document.getElementById("clear-endpoint");
  dom.endpointStatus = document.getElementById("endpoint-status");
}

async function loadConfig() {
  const response = await fetch("./data/assessment-config.json");
  if (!response.ok) {
    throw new Error("Failed to load assessment configuration.");
  }
  return response.json();
}

function createDefaultMeta() {
  return {
    market: "",
    cluster: "",
    businessUnit: "",
    respondentName: "",
    respondentEmail: "",
    role: "",
    assessmentCycle: "",
  };
}

function hydrateFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    syncFormFromState();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state.meta = { ...createDefaultMeta(), ...(parsed.meta || {}) };
    state.responses = parsed.responses || {};
    state.sessionId = parsed.sessionId || buildSessionId();
    state.lastSavedAt = parsed.lastSavedAt || "";
    state.lastRemoteSavedAt = parsed.lastRemoteSavedAt || "";
    state.activePillarIndex = Math.min(
      Math.max(parsed.activePillarIndex || 0, 0),
      state.config.pillars.length - 1,
    );
  } catch (error) {
    console.warn("Unable to restore saved assessment draft.", error);
  }

  syncFormFromState();
  syncDraftIndicator();
}

function syncFormFromState() {
  if (!dom.respondentForm) {
    return;
  }

  const fields = Object.keys(createDefaultMeta());
  for (const key of fields) {
    if (dom.respondentForm.elements[key]) {
      dom.respondentForm.elements[key].value = state.meta[key] || "";
    }
  }
}

function bindEvents() {
  dom.respondentForm?.addEventListener("input", handleMetaInput);
  dom.questionnaireNav?.addEventListener("click", handlePillarNavClick);
  dom.questionnairePanels?.addEventListener("click", handleScoreClick);
  dom.questionnairePanels?.addEventListener("input", handleQuestionNoteInput);
  dom.prevPillar?.addEventListener("click", () => shiftPillar(-1));
  dom.nextPillar?.addEventListener("click", handleNextAssessmentAction);
  dom.saveDraft?.addEventListener("click", handleManualDraftSave);
  dom.downloadJson?.addEventListener("click", handleDownloadJson);
  dom.resetAssessment?.addEventListener("click", handleResetAssessment);
  dom.submitAssessment?.addEventListener("click", handleSubmitAssessment);
  dom.saveEndpoint?.addEventListener("click", handleSaveEndpoint);
  dom.clearEndpoint?.addEventListener("click", handleClearEndpoint);
}

function hydrateEndpointFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const queryEndpoint = (params.get("appsScriptUrl") || "").trim();
  if (!queryEndpoint) {
    return;
  }
  persistEndpoint(queryEndpoint);
}

function handleMetaInput(event) {
  const { name, value } = event.target;
  state.meta[name] = value;
  persistDraft();
  queueAutosave();
}

function handlePillarNavClick(event) {
  const button = event.target.closest("[data-pillar-index]");
  if (!button) {
    return;
  }
  state.activePillarIndex = Number(button.dataset.pillarIndex);
  persistDraft();
  renderPillarNav();
  renderActivePillar();
  queueAutosave();
}

function handleScoreClick(event) {
  const scoreButton = event.target.closest("[data-score]");
  if (!scoreButton) {
    return;
  }

  const questionId = scoreButton.dataset.questionId;
  const score = Number(scoreButton.dataset.score);
  const existing = state.responses[questionId] || {};

  state.responses[questionId] = {
    ...existing,
    score,
  };

  persistDraft();
  updateQuestionSelection(questionId, score);
  renderPillarNav();
  recomputeResults();
  queueAutosave();
}

function handleQuestionNoteInput(event) {
  const field = event.target.closest("[data-field]");
  if (!field) {
    return;
  }

  const questionId = field.dataset.questionId;
  const fieldName = field.dataset.field;
  const existing = state.responses[questionId] || {};

  state.responses[questionId] = {
    ...existing,
    [fieldName]: field.value,
  };

  persistDraft();
  queueAutosave();
}

async function handleNextAssessmentAction() {
  const isLastSection = state.activePillarIndex === state.config.pillars.length - 1;
  if (isLastSection) {
    setButtonLoading(dom.nextPillar, true, "Submitting");
    try {
      await handleSubmitAssessment();
    } finally {
      setButtonLoading(dom.nextPillar, false);
    }
    return;
  }

  shiftPillar(1);
}

function handleDownloadJson() {
  const payload = buildSubmissionPayload(false);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${payload.sessionId}.json`;
  link.click();
  URL.revokeObjectURL(url);
  setStatus("Current assessment state downloaded as JSON.", "success");
}

function handleSaveEndpoint() {
  const endpoint = (dom.endpointInput?.value || "").trim();
  if (!endpoint) {
    setEndpointStatus("Paste a deployed Apps Script Web App URL first.", "warn");
    return;
  }

  persistEndpoint(endpoint);
  syncEndpointUi("Apps Script endpoint saved in this browser.", "success");
}

function handleClearEndpoint() {
  persistEndpoint("");
  syncEndpointUi("Apps Script endpoint cleared from this browser.", "warn");
}

function handleResetAssessment() {
  const confirmed = window.confirm("Reset all scores, notes, and respondent details for this local draft?");
  if (!confirmed) {
    return;
  }

  window.clearTimeout(autosaveTimer);
  autosaveTimer = null;
  state.meta = createDefaultMeta();
  state.responses = {};
  state.activePillarIndex = 0;
  state.sessionId = buildSessionId();
  state.lastSavedAt = "";
  state.lastRemoteSavedAt = "";
  persistDraft();
  syncFormFromState();
  syncDraftIndicator();
  renderPillarNav();
  renderActivePillar();
  recomputeResults();
  setStatus("Assessment draft reset.", "warn");
}

async function handleManualDraftSave() {
  if (!dom.saveDraft) {
    return;
  }

  setButtonLoading(dom.saveDraft, true, "Saving");
  try {
    await flushAutosave({ manual: true, preferRemote: true });
  } finally {
    setButtonLoading(dom.saveDraft, false);
  }
}

async function handleSubmitAssessment() {
  const unanswered = getUnansweredQuestions();
  if (unanswered.length > 0) {
    const firstMissing = unanswered[0];
    const targetPillarIndex = state.config.pillars.findIndex((pillar) => pillar.label === firstMissing.pillar);
    state.activePillarIndex = targetPillarIndex;
    renderPillarNav();
    renderActivePillar();
    recomputeResults();
    setStatus(
      `Assessment is incomplete. ${unanswered.length} question(s) still need scores. First missing item: ${firstMissing.id}.`,
      "warn",
    );
    document.getElementById(`question-${firstMissing.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const payload = buildSubmissionPayload(true);
  persistDraft();
  setButtonLoading(dom.submitAssessment, true, "Submitting");
  let result;
  try {
    result = await submitToGoogleSheets(payload);
  } finally {
    setButtonLoading(dom.submitAssessment, false);
  }

  if (result.ok) {
    setStatus(
      result.transport === "disabled"
        ? result.message
        : `Assessment submitted. ${result.message}`,
      result.transport === "disabled" ? "warn" : "success",
    );
  } else {
    setStatus(`Submission did not complete cleanly. ${result.message}`, "error");
  }

  document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function shiftPillar(direction) {
  const nextIndex = state.activePillarIndex + direction;
  if (nextIndex < 0 || nextIndex >= state.config.pillars.length) {
    return;
  }
  state.activePillarIndex = nextIndex;
  persistDraft();
  renderPillarNav();
  renderActivePillar();
  queueAutosave();
}

function queueAutosave() {
  syncDraftIndicator("Saving draft...");

  if (autosaveTimer) {
    window.clearTimeout(autosaveTimer);
  }

  autosaveTimer = window.setTimeout(() => {
    void flushAutosave();
  }, AUTOSAVE_DEBOUNCE_MS);
}

async function flushAutosave({ manual = false, preferRemote = true } = {}) {
  if (autosaveTimer) {
    window.clearTimeout(autosaveTimer);
    autosaveTimer = null;
  }

  const savedAt = new Date().toISOString();
  state.lastSavedAt = savedAt;
  persistDraft();
  syncDraftIndicator();

  if (!preferRemote || !getActiveEndpoint()) {
    if (manual) {
      setStatus("Draft saved locally in this browser.", "success");
    }
    return;
  }

  const result = await saveDraftToGoogleSheets(buildSubmissionPayload(false, "draft"));

  if (result.ok) {
    state.lastRemoteSavedAt = new Date().toISOString();
    persistDraft();
    syncDraftIndicator();
    if (manual) {
      setStatus("Draft saved locally and synced to Google Sheets.", "success");
    }
    return;
  }

  if (manual) {
    setStatus(`Draft saved locally. Remote sync pending: ${result.message}`, "warn");
  }
}

function renderFramework() {
  if (dom.pillarCards) {
    dom.pillarCards.innerHTML = state.config.pillars
      .map(
        (pillar) => `
          <article class="pillar-card">
            <div class="card-head">
              <span class="icon-badge">${iconMarkup("pillar", pillar.label)}</span>
              <span class="count-badge">${pillar.questionCount}</span>
            </div>
            <h3>${pillar.label}</h3>
            <p>${pillar.description}</p>
            <div class="pillar-meta">
              <span class="meta-chip">Target ${formatScore(pillar.target)}</span>
              <span class="meta-chip">Threshold ${formatScore(pillar.threshold)}</span>
              <span class="meta-chip">Weight ${formatPercent(pillar.weight)}</span>
            </div>
          </article>
        `,
      )
      .join("");
  }

  if (dom.heroPillarStack) {
    dom.heroPillarStack.innerHTML = state.config.pillars
      .map(
        (pillar) => `
          <span class="hero-chip is-pillar">
            <span class="hero-chip-icon">${iconMarkup("pillar", pillar.label)}</span>
            <span>${pillar.label}</span>
          </span>
        `,
      )
      .join("");
  }

  if (dom.stageCards) {
    dom.stageCards.innerHTML = state.config.stages
      .map(
        (stage) => `
          <article class="stage-card">
            <div class="card-head">
              <span class="icon-badge">${iconMarkup("stage", stage.label)}</span>
              <span class="count-badge">${stage.order}</span>
            </div>
            <h3>${stage.label.replace(/^\d+\.\s*/, "")}</h3>
            <p>${stage.description}</p>
            <div class="pillar-meta">
              <span class="meta-chip">${stage.questionCount} questions</span>
              <span class="meta-chip">Target ${formatScore(stage.target)}</span>
            </div>
          </article>
        `,
      )
      .join("");
  }

  if (dom.heroStageTrack) {
    dom.heroStageTrack.innerHTML = state.config.stages
      .map(
        (stage) => `
          <div class="hero-stage-node">
            <strong>${stage.order}</strong>
            <span>${stage.label.replace(/^\d+\.\s*/, "")}</span>
          </div>
        `,
      )
      .join("");
  }

  if (dom.enablerCards) {
    dom.enablerCards.innerHTML = state.config.enablers
      .map(
        (enabler, index) => `
          <article class="enabler-card">
            <div class="card-head">
              <span class="icon-badge">${iconMarkup("enabler", enabler.label)}</span>
              <span class="count-badge">${index + 1}</span>
            </div>
            <h3>${enabler.label}</h3>
            <p>${enabler.description}</p>
            <div class="pillar-meta">
              <span class="meta-chip">${enabler.questionCount} linked questions</span>
              <span class="meta-chip">Target ${formatScore(enabler.target)}</span>
            </div>
          </article>
        `,
      )
      .join("");
  }

  if (dom.heroEnablerStack) {
    dom.heroEnablerStack.innerHTML = state.config.enablers
      .map(
        (enabler) => `
          <span class="hero-chip is-enabler">
            <span class="hero-chip-icon">${iconMarkup("enabler", enabler.label)}</span>
            <span>${enabler.label}</span>
          </span>
        `,
      )
      .join("");
  }
}

function syncHeroCounts() {
  if (dom.heroPillarCount) {
    dom.heroPillarCount.textContent = String(state.config.meta.pillarCount);
  }
  if (dom.heroStageCount) {
    dom.heroStageCount.textContent = String(state.config.meta.stageCount);
  }
  if (dom.heroQuestionCount) {
    dom.heroQuestionCount.textContent = String(state.config.meta.questionCount);
  }
  if (dom.heroEnablerCount) {
    dom.heroEnablerCount.textContent = String(state.config.meta.enablerCount);
  }
}

function renderPillarNav() {
  if (!dom.questionnaireNav) {
    return;
  }

  dom.questionnaireNav.innerHTML = state.config.pillars
    .map((pillar, index) => {
      const pillarQuestions = getQuestionsForPillar(pillar.label);
      const answered = pillarQuestions.filter((question) => getQuestionScore(question.id) > 0).length;
      const average = averageScores(pillarQuestions.map((question) => getQuestionScore(question.id)).filter(Boolean));

      return `
        <button
          class="pillar-nav-button ${index === state.activePillarIndex ? "is-active" : ""}"
          type="button"
          data-pillar-index="${index}"
        >
          <span class="pillar-nav-step">Step ${index + 1}</span>
          <strong>${pillar.label}</strong>
          <div class="pillar-nav-meta">
            <span>${answered}/${pillarQuestions.length} answered</span>
            <span>${average > 0 ? formatScore(average) : "Not started"}</span>
          </div>
        </button>
      `;
    })
    .join("");
}

function renderActivePillar() {
  if (!dom.currentPillarTitle || !dom.currentPillarDescription || !dom.currentStageSummary || !dom.questionnairePanels) {
    return;
  }

  const pillar = state.config.pillars[state.activePillarIndex];
  const questions = getQuestionsForPillar(pillar.label);
  const grouped = groupQuestionsByStage(questions);
  const answered = questions.filter((question) => getQuestionScore(question.id) > 0).length;

  dom.currentPillarTitle.textContent = pillar.label;
  dom.currentPillarDescription.textContent = `${answered}/${questions.length} questions answered in this section.`;

  dom.currentStageSummary.innerHTML = Object.entries(grouped)
    .map(([stage, stageQuestions]) => {
      const answered = stageQuestions.filter((question) => getQuestionScore(question.id) > 0).length;
      return `<span class="stage-chip">${stage.replace(/^\d+\.\s*/, "")}: ${answered}/${stageQuestions.length}</span>`;
    })
    .join("");

  dom.questionnairePanels.innerHTML = Object.entries(grouped)
    .map(
      ([stage, stageQuestions]) => `
        <section class="question-stage-block">
          <h4 class="section-subtitle">${stage}</h4>
          ${stageQuestions.map(renderQuestionCard).join("")}
        </section>
      `,
    )
    .join("");

  syncWizardProgress();

  if (dom.prevPillar) {
    dom.prevPillar.disabled = state.activePillarIndex === 0;
    dom.prevPillar.textContent = "Previous Section";
  }
  if (dom.nextPillar) {
    dom.nextPillar.disabled = false;
    dom.nextPillar.textContent = state.activePillarIndex === state.config.pillars.length - 1
      ? "Submit Assessment"
      : "Next Section";
  }
}

function renderQuestionCard(question) {
  const response = state.responses[question.id] || {};
  const selectedScore = Number(response.score || 0);
  const notesOpen = response.evidence || response.comment ? "open" : "";

  return `
    <article class="question-card" id="question-${question.id}">
      <div class="question-card-head">
        <div>
          <div class="question-tags">
            <span class="question-tag code">${question.id}</span>
            <span class="question-tag">${question.enabler}</span>
          </div>
          <h4>${question.text}</h4>
        </div>
        <div class="question-score-meta">
          <span class="question-tag">Target ${formatScore(question.target)}</span>
          <span class="question-tag question-tag-state" data-score-status="${question.id}">
            ${selectedScore ? anchorShortLabel(selectedScore) : "Unscored"}
          </span>
        </div>
      </div>

      <div class="score-rail" role="group" aria-label="Maturity scoring for ${question.id}">
        ${[1, 2, 3, 4, 5]
          .map((score) => {
            const selected = selectedScore === score;
            return `
              <button
                class="score-option ${selected ? "is-selected" : ""}"
                type="button"
                data-question-id="${question.id}"
                data-score="${score}"
                data-score-option="${question.id}"
                aria-pressed="${selected ? "true" : "false"}"
              >
                <span class="score-option-value">${score}</span>
                <span class="score-option-label">${anchorShortLabel(score)}</span>
              </button>
            `;
          })
          .join("")}
      </div>

      <div class="selected-anchor ${selectedScore ? "is-active" : ""}" data-selected-anchor="${question.id}">
        ${renderSelectedAnchor(question, selectedScore)}
      </div>

      <details class="question-disclosure" ${notesOpen}>
        <summary>
          <span>Evidence & comments</span>
          <span class="question-disclosure-meta">Optional details</span>
        </summary>

        <div class="question-disclosure-body">
          <p class="evidence-prompt">
            <strong>Evidence prompt</strong>
            <span>${question.evidencePrompt}</span>
          </p>

          <div class="question-notes">
            <label>
              <span>Evidence notes</span>
              <textarea
                class="question-textarea"
                data-question-id="${question.id}"
                data-field="evidence"
                placeholder="Optional: summarize evidence, references, or documents used."
              >${escapeHtml(response.evidence || "")}</textarea>
            </label>
            <label>
              <span>Reviewer comment</span>
              <textarea
                class="question-textarea"
                data-question-id="${question.id}"
                data-field="comment"
                placeholder="Optional: capture interpretation, concerns, or follow-up actions."
              >${escapeHtml(response.comment || "")}</textarea>
            </label>
          </div>
        </div>
      </details>
    </article>
  `;
}

function updateQuestionSelection(questionId, score) {
  const options = document.querySelectorAll(`[data-score-option="${questionId}"]`);
  options.forEach((option) => {
    const selected = Number(option.dataset.score) === Number(score);
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  });

  const selectedAnchor = document.querySelector(`[data-selected-anchor="${questionId}"]`);
  const question = findQuestion(questionId);
  if (selectedAnchor && question) {
    selectedAnchor.classList.toggle("is-active", Number(score) > 0);
    selectedAnchor.innerHTML = renderSelectedAnchor(question, Number(score));
  }

  const scoreStatus = document.querySelector(`[data-score-status="${questionId}"]`);
  if (scoreStatus) {
    scoreStatus.textContent = score ? anchorShortLabel(score) : "Unscored";
  }
}

function renderSelectedAnchor(question, selectedScore) {
  if (!selectedScore) {
    return `
      <div class="selected-anchor-head">
        <span class="selected-anchor-badge is-empty">?</span>
        <div>
          <strong>Select a maturity level</strong>
          <p>Choose 1 to 5 to reveal the matching workbook anchor.</p>
        </div>
      </div>
    `;
  }

  const anchorText = question.anchors[String(selectedScore)] || "No anchor supplied in workbook.";
  return `
    <div class="selected-anchor-head">
      <span class="selected-anchor-badge">${selectedScore}</span>
      <div>
        <strong>${anchorLabel(selectedScore)}</strong>
        <p>${anchorText}</p>
      </div>
    </div>
  `;
}

function syncWizardProgress() {
  if (!dom.wizardStep || !dom.wizardSection || !dom.wizardProgressValue || !dom.wizardProgressFill) {
    return;
  }

  const pillar = state.config?.pillars?.[state.activePillarIndex];
  const completion = state.config?.questions?.length
    ? getAnsweredQuestionsCount() / state.config.questions.length
    : 0;

  dom.wizardStep.textContent = `Section ${state.activePillarIndex + 1} of ${state.config.pillars.length}`;
  dom.wizardSection.textContent = pillar?.label || "Assessment";
  dom.wizardProgressValue.textContent = `${Math.round(completion * 100)}% complete`;
  dom.wizardProgressFill.style.width = `${Math.round(completion * 100)}%`;
}

function recomputeResults() {
  if (!dom.answeredCount || !dom.completionRate || !dom.resultsEmpty || !dom.resultsContent) {
    return;
  }

  state.results = computeResults();
  const answered = getAnsweredQuestionsCount();
  const total = state.config.questions.length;
  dom.answeredCount.textContent = `${answered} / ${total}`;
  dom.completionRate.textContent = `${Math.round(state.results.completion * 100)}%`;
  syncWizardProgress();

  if (answered < RESULTS_MIN_ANSWERED) {
    dom.resultsEmpty.hidden = false;
    dom.resultsContent.hidden = true;
    dom.resultsEmpty.innerHTML = answered === 0
      ? `<strong>Live results are waiting for input.</strong><span>Answer at least ${RESULTS_MIN_ANSWERED} questions to activate the dashboard.</span>`
      : `<strong>${answered} question(s) captured so far.</strong><span>Answer at least ${RESULTS_MIN_ANSWERED} questions before reading the live dashboard.</span>`;
    return;
  }

  dom.resultsEmpty.hidden = true;
  dom.resultsContent.hidden = false;
  renderResults();
}

function renderResults() {
  if (!dom.resultsSummary || !dom.pillarResults || !dom.stageResults || !dom.enablerResults || !dom.priorityBody) {
    return;
  }

  const { summary, pillarResults, stageResults, enablerResults, priorityList } = state.results;

  dom.resultsSummary.innerHTML = `
    <article class="summary-card">
      <span>Overall Core Score</span>
      <strong>${formatScore(summary.overallCoreScore)}</strong>
      <p>Weighted across the four business pillars.</p>
    </article>
    <article class="summary-card">
      <span>Completion</span>
      <strong>${Math.round(summary.completion * 100)}%</strong>
      <p>${summary.answeredQuestions} of ${summary.totalQuestions} scored.</p>
    </article>
    <article class="summary-card">
      <span>Largest Stage Gap</span>
      <strong>${summary.largestStageGap.label}</strong>
      <p>Gap to target: ${formatScore(summary.largestStageGap.gap)}</p>
    </article>
    <article class="summary-card">
      <span>Largest Enabler Gap</span>
      <strong>${summary.largestEnablerGap.label}</strong>
      <p>Gap to target: ${formatScore(summary.largestEnablerGap.gap)}</p>
    </article>
  `;

  dom.pillarResults.innerHTML = pillarResults.map(renderMetricItem).join("");
  dom.stageResults.innerHTML = stageResults.map(renderMetricItem).join("");
  dom.enablerResults.innerHTML = enablerResults.map(renderMetricItem).join("");

  dom.priorityBody.innerHTML = priorityList
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.id}</td>
          <td>${item.pillar}</td>
          <td>${item.stage}</td>
          <td>${item.enabler}</td>
          <td>${formatScore(item.score)}</td>
          <td>${formatScore(item.target)}</td>
          <td>${item.priorityIndex.toFixed(3)}</td>
        </tr>
      `,
    )
    .join("");
}

function renderMetricItem(item) {
  return `
    <article class="metric-item">
      <div class="metric-head">
        <strong>${item.label}</strong>
        <span>${formatScore(item.average)}</span>
      </div>
      <div class="metric-meta">
        <span>Target ${formatScore(item.target)}</span>
        <span>Gap ${formatScore(item.gap)}</span>
        <span>${item.answered}/${item.total} answered</span>
      </div>
      <div class="metric-bar-track">
        <div class="metric-bar-fill" style="width: ${Math.max(0, Math.min(100, (item.average / 5) * 100))}%"></div>
      </div>
    </article>
  `;
}

function computeResults() {
  const allQuestions = state.config.questions;
  const totalQuestions = allQuestions.length;
  const answeredQuestions = getAnsweredQuestionsCount();

  const pillarResults = state.config.pillars.map((pillar) => {
    const questions = getQuestionsForPillar(pillar.label);
    return computeGroupMetric(pillar.label, questions, pillar.target, pillar.threshold, pillar.weight);
  });

  const stageResults = state.config.stages.map((stage) => {
    const questions = allQuestions.filter((question) => question.stage === stage.label);
    return computeGroupMetric(stage.label, questions, stage.target, stage.threshold);
  });

  const enablerResults = state.config.enablers.map((enabler) => {
    const questions = allQuestions.filter((question) => question.enabler === enabler.label);
    return computeGroupMetric(enabler.label, questions, enabler.target, enabler.threshold);
  });

  const totalWeight = pillarResults.reduce((sum, item) => sum + (item.weight || 0), 0);
  const weightedScore = pillarResults.reduce((sum, item) => sum + item.average * (item.weight || 0), 0);
  const overallCoreScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  const largestStageGap = [...stageResults].sort((left, right) => right.gap - left.gap)[0];
  const largestEnablerGap = [...enablerResults].sort((left, right) => right.gap - left.gap)[0];

  const priorityList = allQuestions
    .map((question) => {
      const score = getQuestionScore(question.id);
      if (!score) {
        return null;
      }
      return {
        ...question,
        score,
        priorityIndex: question.weight * Math.max(0, question.target - score),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.priorityIndex - left.priorityIndex)
    .slice(0, 10);

  return {
    completion: totalQuestions > 0 ? answeredQuestions / totalQuestions : 0,
    summary: {
      overallCoreScore,
      answeredQuestions,
      totalQuestions,
      completion: totalQuestions > 0 ? answeredQuestions / totalQuestions : 0,
      largestStageGap,
      largestEnablerGap,
    },
    pillarResults,
    stageResults,
    enablerResults,
    priorityList,
  };
}

function computeGroupMetric(label, questions, target, threshold, weight = 0) {
  const scores = questions.map((question) => getQuestionScore(question.id)).filter(Boolean);
  const average = averageScores(scores);
  const answered = scores.length;

  return {
    label,
    average,
    target,
    threshold,
    gap: Math.max(0, target - average),
    answered,
    total: questions.length,
    completion: questions.length ? answered / questions.length : 0,
    weight,
  };
}

function averageScores(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getQuestionsForPillar(pillarLabel) {
  return state.config.questions.filter((question) => question.pillar === pillarLabel);
}

function groupQuestionsByStage(questions) {
  const groups = {};
  for (const stage of state.config.stages) {
    groups[stage.label] = questions.filter((question) => question.stage === stage.label);
  }
  return groups;
}

function getQuestionScore(questionId) {
  return Number(state.responses[questionId]?.score || 0);
}

function getAnsweredQuestionsCount() {
  return state.config.questions.filter((question) => getQuestionScore(question.id) > 0).length;
}

function getUnansweredQuestions() {
  return state.config.questions.filter((question) => getQuestionScore(question.id) === 0);
}

function buildSubmissionPayload(isFinalSubmission, saveMode = isFinalSubmission ? "final" : "draft") {
  const sessionId = state.sessionId || buildSessionId();
  const submittedAt = new Date().toISOString();
  const results = state.results || computeResults();

  return {
    sessionId,
    submittedAt,
    isFinalSubmission,
    saveMode,
    currentSection: state.config.pillars[state.activePillarIndex]?.label || "",
    meta: { ...state.meta },
    summary: {
      overallCoreScore: roundNumber(results.summary.overallCoreScore),
      completion: roundNumber(results.summary.completion),
      answeredQuestions: results.summary.answeredQuestions,
      totalQuestions: results.summary.totalQuestions,
      largestStageGap: {
        label: results.summary.largestStageGap.label,
        gap: roundNumber(results.summary.largestStageGap.gap),
      },
      largestEnablerGap: {
        label: results.summary.largestEnablerGap.label,
        gap: roundNumber(results.summary.largestEnablerGap.gap),
      },
    },
    pillarResults: results.pillarResults.map(serialiseMetric),
    stageResults: results.stageResults.map(serialiseMetric),
    enablerResults: results.enablerResults.map(serialiseMetric),
    priorityList: results.priorityList.map((item, index) => ({
      rank: index + 1,
      id: item.id,
      pillar: item.pillar,
      stage: item.stage,
      enabler: item.enabler,
      score: roundNumber(item.score),
      target: roundNumber(item.target),
      priorityIndex: roundNumber(item.priorityIndex),
      questionText: item.text,
    })),
    responses: state.config.questions.map((question) => ({
      questionId: question.id,
      pillar: question.pillar,
      stage: question.stage,
      enabler: question.enabler,
      target: roundNumber(question.target),
      weight: roundNumber(question.weight),
      score: roundNumber(getQuestionScore(question.id)),
      evidence: state.responses[question.id]?.evidence || "",
      comment: state.responses[question.id]?.comment || "",
      questionText: question.text,
    })),
  };
}

function serialiseMetric(metric) {
  return {
    label: metric.label,
    average: roundNumber(metric.average),
    target: roundNumber(metric.target),
    gap: roundNumber(metric.gap),
    answered: metric.answered,
    total: metric.total,
    completion: roundNumber(metric.completion),
    weight: roundNumber(metric.weight || 0),
  };
}

function buildSessionId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RGM-${stamp}-${suffix}`;
}

function persistEndpoint(endpoint) {
  const trimmed = (endpoint || "").trim();
  window.RGM_SITE_CONFIG = {
    ...(window.RGM_SITE_CONFIG || {}),
    appsScriptUrl: trimmed,
  };

  try {
    if (trimmed) {
      localStorage.setItem(ENDPOINT_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(ENDPOINT_STORAGE_KEY);
    }
  } catch (error) {
    console.warn("Unable to persist Apps Script endpoint locally.", error);
  }
}

function persistDraft() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sessionId: state.sessionId,
        meta: state.meta,
        responses: state.responses,
        activePillarIndex: state.activePillarIndex,
        lastSavedAt: state.lastSavedAt,
        lastRemoteSavedAt: state.lastRemoteSavedAt,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.warn("Unable to persist assessment draft locally.", error);
  }
}

function getActiveEndpoint() {
  const configured = (window.RGM_SITE_CONFIG?.appsScriptUrl || "").trim();
  if (configured) {
    return configured;
  }

  try {
    return (localStorage.getItem(ENDPOINT_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

function setStatus(message, tone = "") {
  if (!dom.saveStatus) {
    return;
  }

  dom.saveStatus.textContent = message;
  dom.saveStatus.className = "status-panel";
  if (tone) {
    dom.saveStatus.classList.add(`is-${tone}`);
  }
}

function syncDraftIndicator(message = "") {
  if (!dom.draftSavedAt) {
    return;
  }

  if (message) {
    dom.draftSavedAt.textContent = message;
    return;
  }

  if (!state.lastSavedAt) {
    dom.draftSavedAt.textContent = "Draft not saved yet";
    return;
  }

  const label = state.lastRemoteSavedAt ? "Draft synced" : "Draft saved";
  dom.draftSavedAt.textContent = `${label} ${formatTimestamp(state.lastSavedAt)}`;
}

function syncEndpointUi(message = "", tone = "") {
  if (!dom.endpointInput || !dom.endpointStatus) {
    return;
  }

  const endpoint = getActiveEndpoint();
  dom.endpointInput.value = endpoint;

  if (message) {
    setEndpointStatus(message, tone);
    return;
  }

  setEndpointStatus(
    endpoint
      ? "Apps Script endpoint is configured for this browser."
      : "No Apps Script endpoint configured yet.",
    endpoint ? "success" : "warn",
  );
}

function setEndpointStatus(message, tone = "") {
  if (!dom.endpointStatus) {
    return;
  }

  dom.endpointStatus.textContent = message;
  dom.endpointStatus.className = "endpoint-status";
  if (tone) {
    dom.endpointStatus.classList.add(`is-${tone}`);
  }
}

function anchorLabel(score) {
  switch (score) {
    case 1:
      return "Lacking";
    case 2:
      return "Developing";
    case 3:
      return "Competent";
    case 4:
      return "Advanced";
    case 5:
      return "Master / Forward-looking";
    default:
      return "";
  }
}

function anchorShortLabel(score) {
  switch (score) {
    case 1:
      return "Lacking";
    case 2:
      return "Developing";
    case 3:
      return "Capable";
    case 4:
      return "Advanced";
    case 5:
      return "Leading";
    default:
      return "";
  }
}

function formatScore(value) {
  return Number(value || 0).toFixed(1);
}

function formatPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function roundNumber(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
}

function formatTimestamp(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function iconMarkup(type, label) {
  const normalized = String(label || "").toLowerCase();

  if (type === "pillar") {
    if (normalized.includes("pricing")) {
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 7h12M6 12h12M6 17h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="18" cy="17" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
        </svg>
      `;
    }
    if (normalized.includes("obppc")) {
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5" width="6" height="6" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <rect x="14" y="5" width="6" height="6" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <rect x="9" y="14" width="6" height="6" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/>
        </svg>
      `;
    }
    if (normalized.includes("promotion")) {
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 14V9l8-3v12l-8-4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M13 9h3a3 3 0 0 1 0 6h-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M7.5 15.5 9 19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 18V6l7 4 7-4v12l-7 4-7-4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M12 10v12" fill="none" stroke="currentColor" stroke-width="1.8"/>
      </svg>
    `;
  }

  if (type === "enabler") {
    if (normalized.includes("governance")) {
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4 5 7v5c0 4.1 2.7 7.8 7 9 4.3-1.2 7-4.9 7-9V7l-7-3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M9.5 12 11 13.5 14.5 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
    }
    if (normalized.includes("tool") || normalized.includes("digital")) {
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5" width="16" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M8 9h8M8 13h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `;
    }
    if (normalized.includes("people")) {
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="9" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="16.5" cy="10.5" r="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>
          <path d="M4.5 18c1.3-2.2 3-3.3 5-3.3s3.7 1.1 5 3.3M14 17.4c.7-1.2 1.8-1.9 3.2-1.9 1.3 0 2.4.6 3.3 1.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      `;
    }
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/>
      </svg>
    `;
  }

  const stageNumber = Number(String(label).match(/\d+/)?.[0] || 0);
  if (stageNumber === 1) {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 18h14M7 14l4-4 3 3 4-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }
  if (stageNumber === 2) {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 17h12M7 13h10M9 9h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `;
  }
  if (stageNumber === 3) {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 17h14M7 15V8m5 7V5m5 10v-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `;
  }
  if (stageNumber === 4) {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 16c2.2-3.8 4.4-5.7 6.5-5.7 2.1 0 3.9 1.5 5.5 4.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M16 8h3v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    `;
  }
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5 19 12 12 19 5 12 12 5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M12 9v6M9 12h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  `;
}

function findQuestion(questionId) {
  return state.config.questions.find((question) => question.id === questionId);
}

function setButtonLoading(button, isLoading, loadingText = "Loading") {
  if (!button) {
    return;
  }

  if (isLoading) {
    if (!button.dataset.originalHtml) {
      button.dataset.originalHtml = button.innerHTML;
    }
    button.style.width = `${button.offsetWidth}px`;
    button.disabled = true;
    button.classList.add("is-loading");
    button.setAttribute("aria-busy", "true");
    button.innerHTML = `
      <span class="button-spinner" aria-hidden="true"></span>
      <span class="button-label">${loadingText}</span>
    `;
    return;
  }

  if (button.dataset.originalHtml) {
    button.innerHTML = button.dataset.originalHtml;
  }
  button.disabled = false;
  button.classList.remove("is-loading");
  button.removeAttribute("aria-busy");
  button.style.width = "";
}
