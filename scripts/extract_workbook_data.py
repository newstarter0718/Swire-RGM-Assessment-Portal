from __future__ import annotations

import argparse
import json
import re
import zipfile
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"x": NS_MAIN}


def clean_text(value: Any) -> str:
    return str(value).replace("\r", " ").replace("\n", " ").strip()


def as_number(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def as_int(value: Any) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def stage_order(stage_code: str) -> int:
    match = re.search(r"(\d+)", stage_code or "")
    return int(match.group(1)) if match else 0


def column_letters(reference: str) -> str:
    match = re.match(r"([A-Z]+)", reference or "")
    return match.group(1) if match else ""


@dataclass
class WorkbookReader:
    workbook_path: Path

    def __post_init__(self) -> None:
        self.archive = zipfile.ZipFile(self.workbook_path)
        self.shared_strings = self._load_shared_strings()
        self.sheet_targets = self._load_sheet_targets()

    def _load_shared_strings(self) -> list[str]:
        if "xl/sharedStrings.xml" not in self.archive.namelist():
            return []

        root = ET.fromstring(self.archive.read("xl/sharedStrings.xml"))
        items: list[str] = []

        for item in root.findall(f"{{{NS_MAIN}}}si"):
            items.append("".join(node.text or "" for node in item.iter(f"{{{NS_MAIN}}}t")))

        return items

    def _load_sheet_targets(self) -> dict[str, str]:
        workbook_root = ET.fromstring(self.archive.read("xl/workbook.xml"))
        rels_root = ET.fromstring(self.archive.read("xl/_rels/workbook.xml.rels"))
        rel_map = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels_root}
        targets: dict[str, str] = {}

        for sheet in workbook_root.find(f"{{{NS_MAIN}}}sheets"):
            name = sheet.attrib["name"]
            rel_id = sheet.attrib[f"{{{NS_REL}}}id"]
            target = rel_map[rel_id].lstrip("/")
            if not target.startswith("xl/"):
                target = f"xl/{target}"
            targets[name] = target

        return targets

    def _read_cell_value(self, cell: ET.Element) -> Any:
        cell_type = cell.attrib.get("t")
        value_node = cell.find(f"{{{NS_MAIN}}}v")

        if value_node is None:
            inline_string = cell.find(f"{{{NS_MAIN}}}is")
            if inline_string is None:
                return ""
            return "".join(node.text or "" for node in inline_string.iter(f"{{{NS_MAIN}}}t"))

        raw_value = value_node.text or ""
        if cell_type == "s":
            index = as_int(raw_value)
            return self.shared_strings[index] if 0 <= index < len(self.shared_strings) else raw_value
        if cell_type == "b":
            return raw_value == "1"
        return raw_value

    def read_sheet_rows(self, sheet_name: str) -> list[dict[str, Any]]:
        root = ET.fromstring(self.archive.read(self.sheet_targets[sheet_name]))
        rows: list[dict[str, Any]] = []

        for row in root.findall(".//x:sheetData/x:row", NS):
            row_number = as_int(row.attrib.get("r"))
            data: dict[str, Any] = {"_row": row_number}

            for cell in row.findall(f"{{{NS_MAIN}}}c"):
                column = column_letters(cell.attrib.get("r", ""))
                if not column:
                    continue
                data[column] = self._read_cell_value(cell)

            if len(data) > 1:
                rows.append(data)

        return rows

    def close(self) -> None:
        self.archive.close()


def build_architecture(reader: WorkbookReader) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    rows = reader.read_sheet_rows("Assessment_Architecture")
    pillars: dict[str, dict[str, Any]] = {}
    stages: dict[str, dict[str, Any]] = {}
    enablers: dict[str, dict[str, Any]] = {}

    for row in rows:
        dimension_type = clean_text(row.get("A", ""))
        code = clean_text(row.get("B", ""))
        name = clean_text(row.get("C", ""))
        definition = clean_text(row.get("D", ""))
        if not dimension_type or dimension_type == "Dimension_Type":
            continue

        record = {
            "id": code,
            "code": code,
            "label": name,
            "description": definition,
            "includedInOfficialScore": clean_text(row.get("E", "")) == "Y",
            "diagnosticOnly": clean_text(row.get("F", "")) == "Y",
        }

        if dimension_type == "Pillar":
            pillars[code] = record
        elif dimension_type == "Stage":
            record["order"] = stage_order(code)
            stages[code] = record
        elif dimension_type == "Enabler":
            enablers[code] = record

    return pillars, stages, enablers


def build_templates(reader: WorkbookReader) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    pillar_templates = {}
    for row in reader.read_sheet_rows("Scoring_Summary_Template"):
        code = clean_text(row.get("A", ""))
        if not code or code == "Pillar_Code":
            continue
        pillar_templates[code] = {
            "weightPoints": as_number(row.get("C")),
            "threshold": as_number(row.get("G")),
            "target": as_number(row.get("H")),
        }

    stage_templates = {}
    for row in reader.read_sheet_rows("Stage_Summary_Template"):
        code = clean_text(row.get("A", ""))
        if not code or code == "Stage_Code":
            continue
        stage_templates[code] = {
            "threshold": as_number(row.get("F")),
            "target": as_number(row.get("G")),
        }

    enabler_templates = {}
    for row in reader.read_sheet_rows("Enabler_Summary_Template"):
        code = clean_text(row.get("A", ""))
        if not code or code == "Enabler_Code":
            continue
        enabler_templates[code] = {
            "threshold": as_number(row.get("F")),
            "target": as_number(row.get("G")),
        }

    return pillar_templates, stage_templates, enabler_templates


def build_questions(reader: WorkbookReader) -> tuple[list[dict[str, Any]], dict[str, list[dict[str, Any]]]]:
    main_rows = reader.read_sheet_rows("Main_Question_Anchors")
    sub_rows = reader.read_sheet_rows("Sub_Item_Bank")

    sub_items_by_question: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in sub_rows:
        question_id = clean_text(row.get("A", ""))
        sub_item_id = clean_text(row.get("B", ""))
        if not question_id or question_id == "Main_Q_ID" or not sub_item_id:
            continue
        sub_items_by_question[question_id].append(
            {
                "id": sub_item_id,
                "text": clean_text(row.get("J", "")),
                "boundaryNote": clean_text(row.get("K", "")),
                "coreOrOptional": clean_text(row.get("L", "")),
                "officialScoreFlag": clean_text(row.get("M", "")) == "Y",
                "stageScoreFlag": clean_text(row.get("N", "")) == "Y",
                "enablerScoreFlag": clean_text(row.get("O", "")) == "Y",
            }
        )

    questions: list[dict[str, Any]] = []
    for row in main_rows:
        question_id = clean_text(row.get("A", ""))
        if not question_id or question_id == "Main_Q_ID":
            continue

        stage_code = clean_text(row.get("D", ""))
        question = {
            "id": question_id,
            "pillarCode": clean_text(row.get("B", "")),
            "pillar": clean_text(row.get("C", "")),
            "stageCode": stage_code,
            "stage": clean_text(row.get("E", "")),
            "stageOrder": stage_order(stage_code),
            "enablerCode": clean_text(row.get("F", "")),
            "enabler": clean_text(row.get("G", "")),
            "text": clean_text(row.get("H", "")),
            "coreOrOptional": clean_text(row.get("I", "")),
            "anchors": {
                "1": clean_text(row.get("J", "")),
                "2": clean_text(row.get("K", "")),
                "3": clean_text(row.get("L", "")),
                "4": clean_text(row.get("M", "")),
                "5": clean_text(row.get("N", "")),
            },
            "subItems": sub_items_by_question.get(question_id, []),
        }
        question["subItemCount"] = len(question["subItems"])
        questions.append(question)

    return questions, sub_items_by_question


def build_payload(reader: WorkbookReader, source_name: str) -> dict[str, Any]:
    pillars_map, stages_map, enablers_map = build_architecture(reader)
    pillar_templates, stage_templates, enabler_templates = build_templates(reader)
    questions, sub_items_by_question = build_questions(reader)

    question_counts_by_pillar = Counter(question["pillarCode"] for question in questions)
    question_counts_by_stage = Counter(question["stageCode"] for question in questions)
    question_counts_by_enabler = Counter(question["enablerCode"] for question in questions)

    sub_item_counts_by_pillar = Counter()
    sub_item_counts_by_stage = Counter()
    sub_item_counts_by_enabler = Counter()
    for question in questions:
        count = len(question["subItems"])
        sub_item_counts_by_pillar[question["pillarCode"]] += count
        sub_item_counts_by_stage[question["stageCode"]] += count
        sub_item_counts_by_enabler[question["enablerCode"]] += count

    pillars = []
    for code, pillar in pillars_map.items():
        template = pillar_templates.get(code, {})
        pillars.append(
            {
                **pillar,
                "weight": as_number(template.get("weightPoints")) / 100 if template else 0,
                "weightPoints": as_number(template.get("weightPoints")),
                "questionCount": question_counts_by_pillar[code],
                "subItemCount": sub_item_counts_by_pillar[code],
                "threshold": as_number(template.get("threshold")),
                "target": as_number(template.get("target")),
            }
        )

    stages = []
    for code, stage in sorted(stages_map.items(), key=lambda item: item[1]["order"]):
        template = stage_templates.get(code, {})
        stages.append(
            {
                **stage,
                "questionCount": question_counts_by_stage[code],
                "subItemCount": sub_item_counts_by_stage[code],
                "threshold": as_number(template.get("threshold")),
                "target": as_number(template.get("target")),
            }
        )

    enablers = []
    for code, enabler in enablers_map.items():
        template = enabler_templates.get(code, {})
        enablers.append(
            {
                **enabler,
                "questionCount": question_counts_by_enabler[code],
                "subItemCount": sub_item_counts_by_enabler[code],
                "threshold": as_number(template.get("threshold")),
                "target": as_number(template.get("target")),
            }
        )

    return {
        "meta": {
            "title": "Swire RGM Certification Program",
            "version": "v2-certification-portal",
            "sourceWorkbook": source_name,
            "questionCount": len(questions),
            "mainQuestionCount": len(questions),
            "subItemCount": sum(len(items) for items in sub_items_by_question.values()),
            "pillarCount": len(pillars),
            "stageCount": len(stages),
            "enablerCount": len(enablers),
            "assessmentFocus": "Annual certification model with official pillar scoring and diagnostic stage and enabler views.",
            "scoreModel": {
                "subItemScale": [
                    {"value": 0, "label": "Not yet in place"},
                    {"value": 0.5, "label": "Partially in place"},
                    {"value": 1, "label": "Clearly in place"},
                ],
                "officialScoreMax": 100,
                "pillarScoreMax": 20,
                "diagnosticScoreMax": 100,
                "gatingRule": "If any pillar score is below 10 / 20, the highest possible overall certification is Established.",
            },
            "certificationTiers": [
                {"label": "Leading", "min": 85, "max": 100},
                {"label": "Advanced", "min": 70, "max": 84},
                {"label": "Established", "min": 55, "max": 69},
                {"label": "Developing", "min": 40, "max": 54},
                {"label": "Emerging", "min": 0, "max": 39},
            ],
        },
        "pillars": pillars,
        "stages": stages,
        "enablers": enablers,
        "questions": questions,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract Swire RGM certification workbook data into JSON.")
    parser.add_argument("--workbook", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    reader = WorkbookReader(args.workbook)
    try:
        payload = build_payload(reader, args.workbook.name)
    finally:
        reader.close()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
