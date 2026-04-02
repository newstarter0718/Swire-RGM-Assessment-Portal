from __future__ import annotations

import argparse
import json
import re
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS = {"x": NS_MAIN}

PILLAR_SHEETS = [
    "Pricing",
    "OBPPC",
    "Promotion_Spend",
    "DFR_Trade_Investment",
]

PILLAR_LABELS = {
    "Pricing": "Pricing",
    "OBPPC": "OBPPC",
    "Promotion_Spend": "Promotion Spend",
    "DFR_Trade_Investment": "DFR / Trade Investment",
}

PILLAR_DESCRIPTIONS = {
    "Pricing": "Price realization, architecture, ex-factory discipline, P&L impact, and long-term price direction.",
    "OBPPC": "Revenue architecture across occasions, brands, packs, price points, and channels.",
    "Promotion Spend": "Promotion role, spend efficiency, guardrails, ROI discipline, and reallocation logic.",
    "DFR / Trade Investment": "Commercial terms, funding logic, gross-to-net discipline, and customer investment structure.",
}

STAGE_DESCRIPTIONS = {
    "1. Opportunity Understanding": "Whether the market can diagnose value pools, market realities, and performance gaps with fact-based clarity.",
    "2. Strategy Design": "Whether the market can convert insight into a coherent pillar strategy and clear prioritization.",
    "3. Policy Translation": "Whether strategy is translated into rules, guardrails, commercial policy, and operating logic.",
    "4. Execution Management": "Whether the market manages implementation through tools, data, routines, and closed-loop review.",
    "5. Capability & Forward Planning": "Whether the market can sustain improvement through people, governance, roadmap thinking, and future scenario planning.",
}

ENABLER_DESCRIPTIONS = {
    "Governance": "Decision rights, review cadence, escalation, KPI reviews, and cross-functional working routines.",
    "Digital / Data / Tools": "Dashboards, tool adoption, data availability, analytics maturity, and workflow support.",
    "People & Capability Development": "Role clarity, team capability, RGM literacy, leadership profile, training, and certification.",
    "Forward-looking": "Long-term roadmap thinking, scenario planning, future profit pools, and reallocation discipline.",
}


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


def stage_order(stage_label: str) -> int:
    match = re.match(r"(\d+)", stage_label or "")
    return int(match.group(1)) if match else 0


@dataclass
class WorkbookReader:
    workbook_path: Path

    def __post_init__(self) -> None:
        self.archive = zipfile.ZipFile(self.workbook_path)
        self.shared_strings = self._load_shared_strings()
        self.sheet_targets = self._load_sheet_targets()

    def _load_shared_strings(self) -> list[str]:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" not in self.archive.namelist():
            return shared_strings

        root = ET.fromstring(self.archive.read("xl/sharedStrings.xml"))
        for item in root.findall(f"{{{NS_MAIN}}}si"):
            text = "".join(node.text or "" for node in item.iter(f"{{{NS_MAIN}}}t"))
            shared_strings.append(text)
        return shared_strings

    def _load_sheet_targets(self) -> dict[str, str]:
        workbook_root = ET.fromstring(self.archive.read("xl/workbook.xml"))
        rels_root = ET.fromstring(self.archive.read("xl/_rels/workbook.xml.rels"))
        rel_map = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels_root}
        sheet_targets: dict[str, str] = {}

        for sheet in workbook_root.find(f"{{{NS_MAIN}}}sheets"):
            sheet_name = sheet.attrib["name"]
            rel_id = sheet.attrib[f"{{{NS_REL}}}id"]
            target = rel_map[rel_id].lstrip("/")
            if not target.startswith("xl/"):
                target = f"xl/{target}"
            sheet_targets[sheet_name] = target

        return sheet_targets

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
            return self.shared_strings[int(raw_value)]
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
                reference = cell.attrib.get("r", "")
                match = re.match(r"([A-Z]+)", reference)
                if not match:
                    continue
                column = match.group(1)
                data[column] = self._read_cell_value(cell)

            rows.append(data)

        return rows

    def close(self) -> None:
        self.archive.close()


def build_pillars(reader: WorkbookReader) -> list[dict[str, Any]]:
    rows = reader.read_sheet_rows("Scoring_Summary")
    pillars: list[dict[str, Any]] = []

    for row in rows:
        label = clean_text(row.get("A", ""))
        if not label or label == "Core Pillar":
            continue
        if label not in PILLAR_DESCRIPTIONS:
            continue
        pillars.append(
            {
                "id": label,
                "label": label,
                "weight": as_number(row.get("B")),
                "questionCount": as_int(row.get("C")),
                "target": as_number(row.get("E")),
                "threshold": as_number(row.get("F")),
                "description": PILLAR_DESCRIPTIONS[label],
            }
        )

    pillars.sort(key=lambda item: list(PILLAR_DESCRIPTIONS.keys()).index(item["label"]))
    return pillars


def build_stages(reader: WorkbookReader) -> list[dict[str, Any]]:
    rows = reader.read_sheet_rows("Stage_Summary")
    stages: list[dict[str, Any]] = []

    for row in rows:
        label = clean_text(row.get("A", ""))
        if not label or label == "Capability Stage":
            continue
        if label not in STAGE_DESCRIPTIONS:
            continue
        stages.append(
            {
                "id": label,
                "label": label,
                "order": stage_order(label),
                "questionCount": as_int(row.get("B")),
                "target": as_number(row.get("D")),
                "threshold": as_number(row.get("E")),
                "prioritySignal": clean_text(row.get("H", "")),
                "description": STAGE_DESCRIPTIONS[label],
            }
        )

    stages.sort(key=lambda item: item["order"])
    return stages


def build_enablers(reader: WorkbookReader) -> list[dict[str, Any]]:
    rows = reader.read_sheet_rows("Cross_Cutting_Enablers")
    enablers: list[dict[str, Any]] = []

    for row in rows:
        label = clean_text(row.get("A", ""))
        if not label or label == "Enabler":
            continue
        if label not in ENABLER_DESCRIPTIONS:
            continue
        enablers.append(
            {
                "id": label,
                "label": label,
                "questionCount": as_int(row.get("B")),
                "target": as_number(row.get("D")),
                "threshold": as_number(row.get("E")),
                "implication": clean_text(row.get("I", "")),
                "description": ENABLER_DESCRIPTIONS[label],
            }
        )

    return enablers


def build_questions(reader: WorkbookReader) -> list[dict[str, Any]]:
    questions: list[dict[str, Any]] = []

    for sheet_name in PILLAR_SHEETS:
        rows = reader.read_sheet_rows(sheet_name)
        pillar_label = PILLAR_LABELS[sheet_name]

        for row in rows:
            question_code = clean_text(row.get("C", ""))
            question_text = clean_text(row.get("F", ""))
            if not question_code or not question_text:
                continue
            if question_code == "Q Code" or question_text == "Question / Assessment Area":
                continue

            questions.append(
                {
                    "id": question_code,
                    "pillar": pillar_label,
                    "sheet": sheet_name,
                    "stage": clean_text(row.get("A", "")),
                    "stageOrder": stage_order(clean_text(row.get("A", ""))),
                    "sequence": as_int(row.get("B")),
                    "enabler": clean_text(row.get("D", "")),
                    "subDimension": clean_text(row.get("E", "")),
                    "text": question_text,
                    "evidencePrompt": clean_text(row.get("G", "")),
                    "anchors": {
                        "1": clean_text(row.get("H", "")),
                        "2": clean_text(row.get("I", "")),
                        "3": clean_text(row.get("J", "")),
                        "4": clean_text(row.get("K", "")),
                        "5": clean_text(row.get("L", "")),
                    },
                    "weight": as_number(row.get("M")),
                    "target": as_number(row.get("N")),
                }
            )

    questions.sort(
        key=lambda item: (
            list(PILLAR_LABELS.values()).index(item["pillar"]),
            item["stageOrder"],
            item["sequence"],
            item["id"],
        )
    )
    return questions


def build_payload(reader: WorkbookReader, workbook_name: str) -> dict[str, Any]:
    pillars = build_pillars(reader)
    stages = build_stages(reader)
    enablers = build_enablers(reader)
    questions = build_questions(reader)

    return {
        "meta": {
            "title": "Swire RGM Enterprise Assessment",
            "version": "v1-web-core",
            "sourceWorkbook": workbook_name,
            "questionCount": len(questions),
            "pillarCount": len(pillars),
            "stageCount": len(stages),
            "enablerCount": len(enablers),
            "assessmentFocus": "Core maturity assessment with dashboard outputs by pillar, stage, and enabler.",
        },
        "pillars": pillars,
        "stages": stages,
        "enablers": enablers,
        "questions": questions,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract Swire RGM workbook data to JSON.")
    parser.add_argument("--workbook", required=True, help="Path to the source XLSX workbook.")
    parser.add_argument("--output", required=True, help="Path to the output JSON file.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    workbook_path = Path(args.workbook).resolve()
    output_path = Path(args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    reader = WorkbookReader(workbook_path)
    try:
        payload = build_payload(reader, workbook_path.name)
    finally:
        reader.close()

    output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
