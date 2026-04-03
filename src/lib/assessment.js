export const AUTOSAVE_DEBOUNCE_MS = 1000;
export const RESULTS_MIN_ANSWERED = 5;

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

export function getQuestionScore(responses, questionId) {
  return Number(responses?.[questionId]?.score || 0);
}

export function getQuestionsForPillar(config, pillarLabel) {
  return config.questions.filter((question) => question.pillar === pillarLabel);
}

export function groupQuestionsByStage(questions) {
  return questions.reduce((groups, question) => {
    if (!groups[question.stage]) {
      groups[question.stage] = [];
    }
    groups[question.stage].push(question);
    return groups;
  }, {});
}

export function getAnsweredQuestionsCount(questions, responses) {
  return questions.filter((question) => getQuestionScore(responses, question.id) > 0).length;
}

export function getUnansweredQuestions(config, responses) {
  return config.questions.filter((question) => getQuestionScore(responses, question.id) === 0);
}

export function averageScores(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function computeGroupMetric(label, questions, responses, target, threshold, weight = 0) {
  const answeredScores = questions
    .map((question) => getQuestionScore(responses, question.id))
    .filter(Boolean);
  const average = averageScores(answeredScores);
  const answered = answeredScores.length;
  const total = questions.length;
  const completion = total > 0 ? answered / total : 0;

  return {
    label,
    average,
    target,
    threshold,
    gap: Math.max(0, target - average),
    answered,
    total,
    completion,
    weight,
  };
}

export function computeResults(config, responses) {
  const totalQuestions = config.questions.length;
  const answeredQuestions = getAnsweredQuestionsCount(config.questions, responses);

  const pillarResults = config.pillars.map((pillar) =>
    computeGroupMetric(
      pillar.label,
      getQuestionsForPillar(config, pillar.label),
      responses,
      pillar.target,
      pillar.threshold,
      pillar.weight,
    ),
  );

  const stageResults = config.stages.map((stage) =>
    computeGroupMetric(
      stage.label,
      config.questions.filter((question) => question.stage === stage.label),
      responses,
      stage.target,
      stage.threshold,
    ),
  );

  const enablerResults = config.enablers.map((enabler) =>
    computeGroupMetric(
      enabler.label,
      config.questions.filter((question) => question.enabler === enabler.label),
      responses,
      enabler.target,
      enabler.threshold,
    ),
  );

  const totalWeight = pillarResults.reduce((sum, item) => sum + (item.weight || 0), 0);
  const weightedScore = pillarResults.reduce((sum, item) => sum + item.average * (item.weight || 0), 0);
  const overallCoreScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  const largestStageGap = [...stageResults].sort((left, right) => right.gap - left.gap)[0];
  const largestEnablerGap = [...enablerResults].sort((left, right) => right.gap - left.gap)[0];

  const priorityList = config.questions
    .map((question) => {
      const score = getQuestionScore(responses, question.id);
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

export function buildSubmissionPayload(config, assessmentState, results, isFinalSubmission, saveMode = isFinalSubmission ? "final" : "draft") {
  const sessionId = assessmentState.sessionId || buildSessionId();
  const submittedAt = new Date().toISOString();

  return {
    sessionId,
    submittedAt,
    isFinalSubmission,
    saveMode,
    currentSection: config.pillars[assessmentState.activePillarIndex]?.label || "",
    meta: { ...assessmentState.meta },
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
      question_id: item.id,
      pillar: item.pillar,
      stage: item.stage,
      enabler: item.enabler,
      score: roundNumber(item.score),
      target: roundNumber(item.target),
      priorityIndex: roundNumber(item.priorityIndex),
      questionText: item.text,
    })),
    responses: config.questions.map((question) => ({
      questionId: question.id,
      pillar: question.pillar,
      stage: question.stage,
      enabler: question.enabler,
      target: roundNumber(question.target),
      weight: roundNumber(question.weight),
      score: roundNumber(getQuestionScore(assessmentState.responses, question.id)),
      evidence: assessmentState.responses[question.id]?.evidence || "",
      comment: assessmentState.responses[question.id]?.comment || "",
      questionText: question.text,
    })),
  };
}

export function serialiseMetric(metric) {
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

export function anchorLabel(score) {
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

export function anchorShortLabel(score) {
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
      return "Leading";
    default:
      return "Unscored";
  }
}

export function roundNumber(value) {
  return Number(Number(value || 0).toFixed(3));
}

export function formatScore(value) {
  return Number(value || 0).toFixed(1);
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
