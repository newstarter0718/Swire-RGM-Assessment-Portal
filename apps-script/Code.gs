// Optional: paste a standalone spreadsheet ID here if you deploy this script
// from script.google.com instead of binding it directly to the target sheet.
var SPREADSHEET_ID = "";

function doGet() {
  return jsonOutput_({
    ok: true,
    service: "Swire RGM Assessment Writer",
    timestamp: new Date().toISOString(),
  });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var spreadsheet = getTargetSpreadsheet_();
    ensureSheets_(spreadsheet);

    if (payload.saveMode === "draft" || payload.isFinalSubmission !== true) {
      writeOrUpdateDraft_(spreadsheet.getSheetByName("Assessment_Drafts"), payload);
      return jsonOutput_({
        ok: true,
        sessionId: payload.sessionId || "",
        message: "Draft written to Google Sheets.",
      });
    }

    writeSession_(spreadsheet.getSheetByName("Assessment_Sessions"), payload);
    writeResponses_(spreadsheet.getSheetByName("Assessment_Responses"), payload);
    writePriorities_(spreadsheet.getSheetByName("Assessment_Priority"), payload);

    return jsonOutput_({
      ok: true,
      sessionId: payload.sessionId || "",
      message: "Assessment written to Google Sheets.",
    });
  } catch (error) {
    return jsonOutput_({
      ok: false,
      message: error && error.message ? error.message : String(error),
    });
  } finally {
    lock.releaseLock();
  }
}

function getTargetSpreadsheet_() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureSheets_(spreadsheet) {
  ensureSheet_(
    spreadsheet,
    "Assessment_Drafts",
    [
      "session_id",
      "saved_at",
      "current_section",
      "market",
      "respondent_name",
      "respondent_email",
      "role",
      "completion",
      "answered_questions",
      "total_questions",
      "overall_core_score",
      "payload_json",
    ],
  );

  ensureSheet_(
    spreadsheet,
    "Assessment_Sessions",
    [
      "session_id",
      "submitted_at",
      "is_final_submission",
      "market",
      "cluster",
      "business_unit",
      "respondent_name",
      "respondent_email",
      "role",
      "assessment_cycle",
      "overall_core_score",
      "completion",
      "answered_questions",
      "total_questions",
      "largest_stage_gap_label",
      "largest_stage_gap_value",
      "largest_enabler_gap_label",
      "largest_enabler_gap_value",
      "top_priority_codes",
    ],
  );

  ensureSheet_(
    spreadsheet,
    "Assessment_Responses",
    [
      "session_id",
      "submitted_at",
      "question_id",
      "pillar",
      "stage",
      "enabler",
      "score",
      "target",
      "weight",
      "evidence",
      "comment",
      "question_text",
    ],
  );

  ensureSheet_(
    spreadsheet,
    "Assessment_Priority",
    [
      "session_id",
      "submitted_at",
      "rank",
      "question_id",
      "pillar",
      "stage",
      "enabler",
      "score",
      "target",
      "priority_index",
      "question_text",
    ],
  );
}

function ensureSheet_(spreadsheet, name, headers) {
  var sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
}

function writeSession_(sheet, payload) {
  var summary = payload.summary || {};
  var meta = payload.meta || {};
  var priorityCodes = (payload.priorityList || []).map(function (item) {
    return item.question_id || item.id || "";
  }).filter(String).join(", ");

  sheet.appendRow([
    payload.sessionId || "",
    payload.submittedAt || "",
    payload.isFinalSubmission === true,
    meta.market || "",
    meta.cluster || "",
    meta.businessUnit || "",
    meta.respondentName || "",
    meta.respondentEmail || "",
    meta.role || "",
    meta.assessmentCycle || "",
    summary.overallCoreScore || 0,
    summary.completion || 0,
    summary.answeredQuestions || 0,
    summary.totalQuestions || 0,
    summary.largestStageGap ? summary.largestStageGap.label : "",
    summary.largestStageGap ? summary.largestStageGap.gap : 0,
    summary.largestEnablerGap ? summary.largestEnablerGap.label : "",
    summary.largestEnablerGap ? summary.largestEnablerGap.gap : 0,
    priorityCodes,
  ]);
}

function writeOrUpdateDraft_(sheet, payload) {
  var summary = payload.summary || {};
  var meta = payload.meta || {};
  var values = [
    payload.sessionId || "",
    payload.submittedAt || "",
    payload.currentSection || "",
    meta.market || "",
    meta.respondentName || "",
    meta.respondentEmail || "",
    meta.role || "",
    summary.completion || 0,
    summary.answeredQuestions || 0,
    summary.totalQuestions || 0,
    summary.overallCoreScore || 0,
    JSON.stringify(payload),
  ];
  var rowIndex = findRowBySessionId_(sheet, payload.sessionId || "");

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);
    return;
  }

  sheet.appendRow(values);
}

function writeResponses_(sheet, payload) {
  var rows = (payload.responses || []).map(function (item) {
    return [
      payload.sessionId || "",
      payload.submittedAt || "",
      item.questionId || "",
      item.pillar || "",
      item.stage || "",
      item.enabler || "",
      item.score || 0,
      item.target || 0,
      item.weight || 0,
      item.evidence || "",
      item.comment || "",
      item.questionText || "",
    ];
  });

  appendRows_(sheet, rows);
}

function writePriorities_(sheet, payload) {
  var rows = (payload.priorityList || []).map(function (item) {
    return [
      payload.sessionId || "",
      payload.submittedAt || "",
      item.rank || "",
      item.question_id || item.id || "",
      item.pillar || "",
      item.stage || "",
      item.enabler || "",
      item.score || 0,
      item.target || 0,
      item.priorityIndex || 0,
      item.questionText || "",
    ];
  });

  appendRows_(sheet, rows);
}

function appendRows_(sheet, rows) {
  if (!rows || rows.length === 0) {
    return;
  }

  var startRow = sheet.getLastRow() + 1;
  var startColumn = 1;
  var numRows = rows.length;
  var numColumns = rows[0].length;
  sheet.getRange(startRow, startColumn, numRows, numColumns).setValues(rows);
}

function findRowBySessionId_(sheet, sessionId) {
  if (!sessionId || sheet.getLastRow() < 2) {
    return -1;
  }

  var sessionIds = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
  for (var index = 0; index < sessionIds.length; index += 1) {
    if (sessionIds[index][0] === sessionId) {
      return index + 2;
    }
  }

  return -1;
}

function jsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
