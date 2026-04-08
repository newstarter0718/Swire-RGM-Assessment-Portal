export const AUTOSAVE_DEBOUNCE_MS = 1000;
export const RESULTS_MIN_ANSWERED = 5;
export const SUB_ITEM_SCORE_OPTIONS = [
  { value: 0, label: "Not yet in place", shortLabel: "Not yet" },
  { value: 0.5, label: "Partially in place", shortLabel: "Partial" },
  { value: 1, label: "Clearly in place", shortLabel: "In place" },
];

export function createDefaultMeta() {
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

export function buildSessionId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RGM-${stamp}-${suffix}`;
}

export function averageScores(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getQuestionResponse(responses, questionId) {
  const response = responses?.[questionId];
  return response && typeof response === "object" && !Array.isArray(response) ? response : {};
}

export function hasSubItemScore(responses, questionId, subItemId) {
  return Object.prototype.hasOwnProperty.call(getQuestionResponse(responses, questionId).subItemResponses || {}, subItemId);
}

export function getSubItemScore(responses, questionId, subItemId) {
  if (!hasSubItemScore(responses, questionId, subItemId)) {
    return null;
  }

  return Number(getQuestionResponse(responses, questionId).subItemResponses[subItemId]);
}

export function getQuestionAnsweredSubItemsCount(question, responses) {
  return question.subItems.filter((subItem) => hasSubItemScore(responses, question.id, subItem.id)).length;
}

export function isQuestionComplete(question, responses) {
  return getQuestionAnsweredSubItemsCount(question, responses) === question.subItems.length;
}

function getQuestionFilteredSubItems(question, flagKey) {
  const filtered = flagKey ? question.subItems.filter((subItem) => subItem[flagKey] !== false) : question.subItems;
  return filtered.length ? filtered : question.subItems;
}

export function getQuestionScoredValues(question, responses, flagKey) {
  return getQuestionFilteredSubItems(question, flagKey)
    .map((subItem) => getSubItemScore(responses, question.id, subItem.id))
    .filter((score) => score !== null);
}

export function getQuestionAverageRaw(question, responses, flagKey, { requireComplete = false } = {}) {
  const relevantSubItems = getQuestionFilteredSubItems(question, flagKey);
  const scoredValues = relevantSubItems
    .map((subItem) => getSubItemScore(responses, question.id, subItem.id))
    .filter((score) => score !== null);

  if (!scoredValues.length) {
    return null;
  }

  if (requireComplete && scoredValues.length !== relevantSubItems.length) {
    return null;
  }

  return averageScores(scoredValues);
}

export function getQuestionPercent(question, responses, options = {}) {
  const average = getQuestionAverageRaw(question, responses, null, options);
  return average === null ? null : average * 100;
}

export function getQuestionsForPillar(config, pillarLabel) {
  return config.questions.filter((question) => question.pillar === pillarLabel);
}

export function getAnsweredQuestionsCount(questions, responses) {
  return questions.filter((question) => isQuestionComplete(question, responses)).length;
}

export function getAnsweredSubItemsCount(questions, responses) {
  return questions.reduce((count, question) => count + getQuestionAnsweredSubItemsCount(question, responses), 0);
}

export function getUnansweredQuestions(config, responses) {
  return config.questions.filter((question) => !isQuestionComplete(question, responses));
}

export function getSuggestedAnchorLevel(question, responses) {
  const percent = getQuestionPercent(question, responses, { requireComplete: false });

  if (percent === null) {
    return 0;
  }
  if (percent <= 20) {
    return 1;
  }
  if (percent <= 40) {
    return 2;
  }
  if (percent <= 60) {
    return 3;
  }
  if (percent <= 80) {
    return 4;
  }
  return 5;
}

function buildPillarMetric(pillar, questions, responses) {
  const questionScores = questions
    .map((question) => getQuestionAverageRaw(question, responses, "officialScoreFlag", { requireComplete: true }))
    .filter((score) => score !== null);
  const averageRaw = questionScores.length ? averageScores(questionScores) : 0;

  return {
    label: pillar.label,
    average: averageRaw * (pillar.weightPoints || 20),
    target: pillar.target,
    threshold: pillar.threshold,
    gap: Math.max(0, pillar.target - averageRaw * (pillar.weightPoints || 20)),
    answered: questionScores.length,
    total: questions.length,
    completion: questions.length ? questionScores.length / questions.length : 0,
    weight: pillar.weight || 0,
    maxScore: pillar.weightPoints || 20,
    scoreType: "pillar",
  };
}

function buildDiagnosticMetric(group, questions, responses, flagKey, scoreType) {
  const relevantSubItems = questions.flatMap((question) =>
    getQuestionFilteredSubItems(question, flagKey).map((subItem) => ({
      questionId: question.id,
      subItemId: subItem.id,
    })),
  );
  const answeredValues = relevantSubItems
    .map(({ questionId, subItemId }) => getSubItemScore(responses, questionId, subItemId))
    .filter((score) => score !== null);
  const averageRaw = answeredValues.length ? averageScores(answeredValues) : 0;

  return {
    label: group.label,
    average: averageRaw * (group.diagnosticMax || 100),
    target: group.target,
    threshold: group.threshold,
    gap: Math.max(0, group.target - averageRaw * (group.diagnosticMax || 100)),
    answered: answeredValues.length,
    total: relevantSubItems.length,
    completion: relevantSubItems.length ? answeredValues.length / relevantSubItems.length : 0,
    weight: 0,
    maxScore: group.diagnosticMax || 100,
    scoreType,
  };
}

function resolveCertificationTier(tiers, score) {
  return tiers.find((tier) => score >= tier.min && score <= tier.max) || tiers[tiers.length - 1] || null;
}

function applyCertificationGate(tier, gatingTriggered, tiers) {
  if (!tier) {
    return null;
  }

  if (!gatingTriggered) {
    return tier;
  }

  const established = tiers.find((item) => item.label === "Established");
  if (!established) {
    return tier;
  }

  return tier.min > established.max ? established : tier;
}

export function computeResults(config, responses) {
  const totalQuestions = config.questions.length;
  const totalSubItems = config.questions.reduce((count, question) => count + question.subItems.length, 0);
  const answeredQuestions = getAnsweredQuestionsCount(config.questions, responses);
  const answeredSubItems = getAnsweredSubItemsCount(config.questions, responses);

  const pillarResults = config.pillars.map((pillar) =>
    buildPillarMetric(
      pillar,
      getQuestionsForPillar(config, pillar.label),
      responses,
    ),
  );

  const stageResults = config.stages.map((stage) =>
    buildDiagnosticMetric(
      { ...stage, diagnosticMax: config.meta.scoreModel.diagnosticScoreMax || 100 },
      config.questions.filter((question) => question.stage === stage.label),
      responses,
      "stageScoreFlag",
      "stage",
    ),
  );

  const enablerResults = config.enablers.map((enabler) =>
    buildDiagnosticMetric(
      { ...enabler, diagnosticMax: config.meta.scoreModel.diagnosticScoreMax || 100 },
      config.questions.filter((question) => question.enabler === enabler.label),
      responses,
      "enablerScoreFlag",
      "enabler",
    ),
  );

  const overallOfficialScore = pillarResults.reduce((sum, item) => sum + item.average, 0);
  const gatingTriggered = pillarResults.some((item) => item.average < item.threshold);
  const preliminaryCertification = resolveCertificationTier(config.meta.certificationTiers || [], overallOfficialScore);
  const finalCertification = applyCertificationGate(preliminaryCertification, gatingTriggered, config.meta.certificationTiers || []);
  const largestStageGap = [...stageResults].sort((left, right) => right.gap - left.gap)[0] || null;
  const largestEnablerGap = [...enablerResults].sort((left, right) => right.gap - left.gap)[0] || null;
  const weakestPillar = [...pillarResults].sort((left, right) => left.average - right.average)[0] || null;

  const priorityList = config.questions
    .map((question) => {
      const score = getQuestionPercent(question, responses, { requireComplete: true });
      if (score === null) {
        return null;
      }

      const target = 75;
      const gap = Math.max(0, target - score);

      return {
        id: question.id,
        pillar: question.pillar,
        stage: question.stage,
        enabler: question.enabler,
        score,
        target,
        gap,
        priorityIndex: gap,
        questionText: question.text,
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.priorityIndex - left.priorityIndex)
    .slice(0, 10);

  return {
    completion: totalSubItems > 0 ? answeredSubItems / totalSubItems : 0,
    summary: {
      overallOfficialScore,
      answeredQuestions,
      totalQuestions,
      answeredSubItems,
      totalSubItems,
      questionCompletion: totalQuestions > 0 ? answeredQuestions / totalQuestions : 0,
      completion: totalSubItems > 0 ? answeredSubItems / totalSubItems : 0,
      largestStageGap,
      largestEnablerGap,
      weakestPillar,
      preliminaryCertification,
      finalCertification,
      gatingTriggered,
      gatingRule: config.meta.scoreModel.gatingRule,
    },
    pillarResults,
    stageResults,
    enablerResults,
    priorityList,
  };
}

export function buildSubmissionPayload(
  config,
  assessmentState,
  results,
  isFinalSubmission,
  saveMode = isFinalSubmission ? "final" : "draft",
) {
  const sessionId = assessmentState.sessionId || buildSessionId();
  const submittedAt = new Date().toISOString();

  return {
    sessionId,
    submittedAt,
    isFinalSubmission,
    saveMode,
    modelVersion: config.meta.version,
    currentSection: config.pillars[assessmentState.activePillarIndex]?.label || "",
    meta: { ...assessmentState.meta },
    summary: {
      overallOfficialScore: roundNumber(results.summary.overallOfficialScore),
      completion: roundNumber(results.summary.completion),
      questionCompletion: roundNumber(results.summary.questionCompletion),
      answeredQuestions: results.summary.answeredQuestions,
      totalQuestions: results.summary.totalQuestions,
      answeredSubItems: results.summary.answeredSubItems,
      totalSubItems: results.summary.totalSubItems,
      preliminaryCertification: results.summary.preliminaryCertification?.label || "",
      finalCertification: results.summary.finalCertification?.label || "",
      gatingTriggered: results.summary.gatingTriggered,
      gatingRule: results.summary.gatingRule || "",
      weakestPillar: results.summary.weakestPillar
        ? {
            label: results.summary.weakestPillar.label,
            score: roundNumber(results.summary.weakestPillar.average),
          }
        : null,
      largestStageGap: results.summary.largestStageGap
        ? {
            label: results.summary.largestStageGap.label,
            gap: roundNumber(results.summary.largestStageGap.gap),
          }
        : null,
      largestEnablerGap: results.summary.largestEnablerGap
        ? {
            label: results.summary.largestEnablerGap.label,
            gap: roundNumber(results.summary.largestEnablerGap.gap),
          }
        : null,
    },
    pillarResults: results.pillarResults.map(serialiseMetric),
    stageResults: results.stageResults.map(serialiseMetric),
    enablerResults: results.enablerResults.map(serialiseMetric),
    priorityList: results.priorityList.map((item, index) => ({
      rank: index + 1,
      questionId: item.id,
      pillar: item.pillar,
      stage: item.stage,
      enabler: item.enabler,
      score: roundNumber(item.score),
      target: roundNumber(item.target),
      gap: roundNumber(item.gap),
      priorityIndex: roundNumber(item.priorityIndex),
      questionText: item.questionText,
    })),
    responses: config.questions.map((question) => {
      const response = getQuestionResponse(assessmentState.responses, question.id);
      const questionAverageRaw = getQuestionAverageRaw(question, assessmentState.responses, null, { requireComplete: true });
      const questionAveragePercent = questionAverageRaw === null ? null : questionAverageRaw * 100;

      return {
        questionId: question.id,
        pillar: question.pillar,
        stage: question.stage,
        enabler: question.enabler,
        questionText: question.text,
        questionAverageRaw: questionAverageRaw === null ? null : roundNumber(questionAverageRaw),
        questionAveragePercent: questionAveragePercent === null ? null : roundNumber(questionAveragePercent),
        score: questionAveragePercent === null ? null : roundNumber(questionAveragePercent),
        suggestedAnchorLevel: getSuggestedAnchorLevel(question, assessmentState.responses),
        evidence: response.evidence || "",
        comment: response.comment || "",
        subItemResponses: question.subItems.map((subItem) => ({
          subItemId: subItem.id,
          subItemText: subItem.text,
          score: getSubItemScore(assessmentState.responses, question.id, subItem.id),
          officialScoreFlag: subItem.officialScoreFlag !== false,
          stageScoreFlag: subItem.stageScoreFlag !== false,
          enablerScoreFlag: subItem.enablerScoreFlag !== false,
        })),
      };
    }),
  };
}

export function serialiseMetric(metric) {
  return {
    label: metric.label,
    average: roundNumber(metric.average),
    target: roundNumber(metric.target),
    threshold: roundNumber(metric.threshold || 0),
    gap: roundNumber(metric.gap),
    answered: metric.answered,
    total: metric.total,
    completion: roundNumber(metric.completion),
    weight: roundNumber(metric.weight || 0),
    maxScore: roundNumber(metric.maxScore || 0),
    scoreType: metric.scoreType || "",
  };
}

export function anchorLabel(level) {
  return level ? `Level ${level}` : "";
}

export function anchorShortLabel(level) {
  return level ? `L${level}` : "Unmapped";
}

export function subItemScoreLabel(value) {
  return SUB_ITEM_SCORE_OPTIONS.find((option) => option.value === value)?.label || "";
}

export function subItemScoreShortLabel(value) {
  return SUB_ITEM_SCORE_OPTIONS.find((option) => option.value === value)?.shortLabel || "Unscored";
}

export function roundNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 0;
  }

  return Number(Number(value).toFixed(3));
}

export function formatScore(value, digits = 1) {
  return Number(value || 0).toFixed(digits);
}

export function formatPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

export function formatTimestamp(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function widthClassFromPercent(percent) {
  const rounded = Math.max(0, Math.min(100, Math.round(Number(percent || 0) / 5) * 5));
  const map = {
    0: "w-0",
    5: "w-[5%]",
    10: "w-[10%]",
    15: "w-[15%]",
    20: "w-[20%]",
    25: "w-1/4",
    30: "w-[30%]",
    35: "w-[35%]",
    40: "w-2/5",
    45: "w-[45%]",
    50: "w-1/2",
    55: "w-[55%]",
    60: "w-3/5",
    65: "w-[65%]",
    70: "w-[70%]",
    75: "w-3/4",
    80: "w-4/5",
    85: "w-[85%]",
    90: "w-[90%]",
    95: "w-[95%]",
    100: "w-full",
  };

  return map[rounded] || "w-0";
}
