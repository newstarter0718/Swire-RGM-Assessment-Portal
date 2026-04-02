import { submitToGoogleSheets } from "./google-sheets.js";

const STORAGE_KEY = "swire-rgm-assessment-draft-v1";
const ENDPOINT_STORAGE_KEY = "swire-rgm-apps-script-url";

const state = {
  config: null,
  activePillarIndex: 0,
  meta: createDefaultMeta(),
  responses: {},
  results: null,
};

const dom = {};

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
    state.activePillarIndex = Math.min(
      Math.max(parsed.activePillarIndex || 0, 0),
      state.config.pillars.length - 1,
    );
  } catch (error) {
    console.warn("Unable to restore saved assessment draft.", error);
  }

  syncFormFromState();
}

function syncFormFromState() {
  const fields = Object.keys(createDefaultMeta());
  for (const key of fields) {
    if (dom.respondentForm.elements[key]) {
      dom.respondentForm.elements[key].value = state.meta[key] || "";
    }
  }
}

function bindEvents() {
  dom.respondentForm.addEventListener("input", handleMetaInput);
  dom.questionnaireNav.addEventListener("click", handlePillarNavClick);
  dom.questionnairePanels.addEventListener("click", handleScoreClick);
  dom.questionnairePanels.addEventListener("input", handleQuestionNoteInput);
  dom.prevPillar.addEventListener("click", () => shiftPillar(-1));
  dom.nextPillar.addEventListener("click", () => shiftPillar(1));
  dom.saveDraft.addEventListener("click", () => {
    persistDraft();
    setStatus("Draft saved locally in this browser.", "success");
  });
  dom.downloadJson.addEventListener("click", handleDownloadJson);
  dom.resetAssessment.addEventListener("click", handleResetAssessment);
  dom.submitAssessment.addEventListener("click", handleSubmitAssessment);
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

  state.meta = createDefaultMeta();
  state.responses = {};
  state.activePillarIndex = 0;
  persistDraft();
  syncFormFromState();
  renderPillarNav();
  renderActivePillar();
  recomputeResults();
  setStatus("Assessment draft reset.", "warn");
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
  const result = await submitToGoogleSheets(payload);

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
}

function renderFramework() {
  dom.pillarCards.innerHTML = state.config.pillars
    .map(
      (pillar) => `
        <article class="pillar-card">
          <span>${pillar.questionCount}</span>
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

  if (dom.heroPillarStack) {
    dom.heroPillarStack.innerHTML = state.config.pillars
      .map((pillar) => `<span class="hero-chip is-pillar">${pillar.label}</span>`)
      .join("");
  }

  dom.stageCards.innerHTML = state.config.stages
    .map(
      (stage) => `
        <article class="stage-card">
          <span>${stage.order}</span>
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

  dom.enablerCards.innerHTML = state.config.enablers
    .map(
      (enabler, index) => `
        <article class="enabler-card">
          <span>${index + 1}</span>
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

  if (dom.heroEnablerStack) {
    dom.heroEnablerStack.innerHTML = state.config.enablers
      .map((enabler) => `<span class="hero-chip is-enabler">${enabler.label}</span>`)
      .join("");
  }
}

function syncHeroCounts() {
  dom.heroPillarCount.textContent = String(state.config.meta.pillarCount);
  dom.heroStageCount.textContent = String(state.config.meta.stageCount);
  dom.heroQuestionCount.textContent = String(state.config.meta.questionCount);
  dom.heroEnablerCount.textContent = String(state.config.meta.enablerCount);
}

function renderPillarNav() {
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
  const pillar = state.config.pillars[state.activePillarIndex];
  const questions = getQuestionsForPillar(pillar.label);
  const grouped = groupQuestionsByStage(questions);

  dom.currentPillarTitle.textContent = pillar.label;
  dom.currentPillarDescription.textContent = pillar.description;

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

  dom.prevPillar.disabled = state.activePillarIndex === 0;
  dom.nextPillar.disabled = state.activePillarIndex === state.config.pillars.length - 1;
}

function renderQuestionCard(question) {
  const response = state.responses[question.id] || {};

  return `
    <article class="question-card" id="question-${question.id}">
      <div class="question-card-head">
        <div>
          <div class="question-tags">
            <span class="question-tag code">${question.id}</span>
            <span class="question-tag">${question.enabler}</span>
            <span class="question-tag">${question.subDimension}</span>
          </div>
          <h4>${question.text}</h4>
        </div>
        <div class="question-tag">Target ${formatScore(question.target)}</div>
      </div>

      <p class="evidence-prompt">Evidence prompt: ${question.evidencePrompt}</p>

      <div class="anchor-grid">
        ${[1, 2, 3, 4, 5]
          .map((score) => {
            const selected = Number(response.score) === score;
            const anchorText = question.anchors[String(score)] || "No anchor supplied in workbook.";
            return `
              <div class="anchor-card ${selected ? "is-selected" : ""}" data-question-card="${question.id}" data-card-score="${score}">
                <button
                  class="anchor-button"
                  type="button"
                  data-question-id="${question.id}"
                  data-score="${score}"
                >
                  ${score}
                </button>
                <strong>${anchorLabel(score)}</strong>
                <p>${anchorText}</p>
              </div>
            `;
          })
          .join("")}
      </div>

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
    </article>
  `;
}

function updateQuestionSelection(questionId, score) {
  const cards = document.querySelectorAll(`[data-question-card="${questionId}"]`);
  cards.forEach((card) => {
    card.classList.toggle("is-selected", Number(card.dataset.cardScore) === Number(score));
  });
}

function recomputeResults() {
  state.results = computeResults();
  const answered = getAnsweredQuestionsCount();
  const total = state.config.questions.length;
  dom.answeredCount.textContent = `${answered} / ${total}`;
  dom.completionRate.textContent = `${Math.round(state.results.completion * 100)}%`;

  if (answered === 0) {
    dom.resultsEmpty.hidden = false;
    dom.resultsContent.hidden = true;
    return;
  }

  dom.resultsEmpty.hidden = true;
  dom.resultsContent.hidden = false;
  renderResults();
}

function renderResults() {
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

function buildSubmissionPayload(isFinalSubmission) {
  const sessionId = buildSessionId();
  const submittedAt = new Date().toISOString();
  const results = state.results || computeResults();

  return {
    sessionId,
    submittedAt,
    isFinalSubmission,
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
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      meta: state.meta,
      responses: state.responses,
      activePillarIndex: state.activePillarIndex,
      updatedAt: new Date().toISOString(),
    }),
  );
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
  dom.saveStatus.textContent = message;
  dom.saveStatus.className = "status-panel";
  if (tone) {
    dom.saveStatus.classList.add(`is-${tone}`);
  }
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

function formatScore(value) {
  return Number(value || 0).toFixed(1);
}

function formatPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function roundNumber(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
