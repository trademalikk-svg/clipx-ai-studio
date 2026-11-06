#!/usr/bin/env python3
"""Create zero-cost, evidence-labelled organic content drafts. Never publishes."""
from __future__ import annotations
import argparse
import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KEYWORD_MAP = ROOT / "data" / "shif-a-keywords.json"
OUTPUT_DIR = ROOT / "growth-reports"

def load_candidates(path: Path = KEYWORD_MAP) -> list[dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    items = data.get("keywords", [])
    return [item for item in items if isinstance(item, dict) and item.get("verificationStatus") in {"candidate", "unverified"}]

def render_report(day: dt.date, candidates: list[dict]) -> str:
    ranked = sorted(candidates, key=lambda item: {"high": 0, "medium": 1, "low": 2}.get(item.get("priority"), 3))
    focus = ranked[0] if ranked else {}
    phrase = str(focus.get("keyword") or "video editing workflow")
    evidence = str(focus.get("verificationStatus") or "unverified")
    page = str(focus.get("targetPage") or "index.html")
    return f"""# SHIF-A AI — Daily Organic Content Drafts
**Date:** {day.isoformat()}  
**Status:** Draft only · Owner review required · ₹0 spend  
**Keyword focus:** {phrase}  
**Evidence status:** {evidence} — candidate phrases are not verified search demand.  
**Target page:** {page}

> These are editorial starting points, not performance claims. Check each feature against the live page before recording. No content was published, scheduled, or submitted.

## YouTube Shorts

### YouTube Shorts draft 1 — One clear idea per clip
- **Hook:** “Ek long video ko short clips mein plan karna hai?”
- **Steps:** Preview your own video; mark one useful idea; note start/end points; review framing and captions.
- **CTA:** “ClipX ke browser-based workflow ko explore karein.”
- **Disclosure:** Export and processing depend on browser support; avoid claiming semantic AI highlight selection.

### YouTube Shorts draft 2 — Check tool status first
- **Hook:** “AI tool kholne se pehle 3 checks.”
- **Steps:** Match the task; read Available/Limited/Coming Soon; confirm account permission.
- **CTA:** “SHIF-A AI directory par current tool status dekhein.”
- **Disclosure:** Do not imply every directory item is an active generation engine.

## Instagram Reels

### Instagram Reel draft 1 — Review subtitles
- **Hook:** “Auto captions ko publish se pehle review karein.”
- **Checklist:** Names, punctuation, line breaks, timestamps and final playback.
- **CTA:** “Hindi subtitle guide dekhein.”
- **Disclosure:** Transcription may contain errors; human review is required.

### Instagram Reel draft 2 — Choose a tool by task
- **Hook:** “Pehle task choose karein, phir tool.”
- **Steps:** Video, creator, writing or coding; inspect status; sign in and confirm access.
- **CTA:** “SHIF-A AI workspace explore karein.”

## Facebook posts

### Facebook post 1 — Video workflow
“Short clips plan karte waqt har clip mein ek main idea rakhein. Start/end points, vertical framing, audio aur captions review karein. Publish se pehle final clip poora dekhein. Browser export support device aur format par depend karta hai.”

### Facebook post 2 — Tool availability
“Tool directory mein sirf naam nahi, status bhi dekhein. Available, Limited aur Coming Soon ka matlab alag hai. Login ke baad bhi tool use ke liye account permission zaroori ho sakti hai.”

## Pinterest Pins

### Pinterest Pin 1 — Shorts planning checklist
- Title: “Long Video to Shorts: 5-Step Planning Checklist”
- Overlay: Preview · Mark · Trim · Caption · Review
- Destination: {page}

### Pinterest Pin 2 — Hindi subtitle review
- Title: “Hindi Subtitle Review Checklist”
- Overlay: Names · Timing · Readability · Proofread
- Destination: guide-hindi-subtitles.html

### Pinterest Pin 3 — AI tool selection
- Title: “Choose an AI Tool by Task”
- Overlay: Task · Availability · Permission
- Destination: ai-tools.html

## SEO article draft

### Working title: {phrase}: a practical workflow guide
- **Search intent:** Validate before prioritising; current evidence status is {evidence}.
- **Audience problem:** Explain the task in plain Hindi and English.
- **Outline:** What the task involves; step-by-step browser workflow; device/browser limitations; privacy and permission checks; troubleshooting; FAQ.
- **Internal link destination:** {page}
- **Editorial safeguards:** Demonstrate only verified live controls. No unsupported AI, speed, ranking, or guaranteed-result claims.

## 15-minute community-engagement checklist
1. 3 min — Review relevant comments and questions.
2. 4 min — Reply with accurate, helpful information; do not promise unavailable features.
3. 3 min — Note recurring questions without collecting personal data.
4. 3 min — Identify one useful guide or FAQ improvement.
5. 2 min — Record a simple aggregate observation for the Owner.

## Owner approval gate
- Confirm every shown feature exists on the current live site.
- Review language, accessibility, privacy, links and claims.
- Edit or reject each draft before any manual publication.
- Do not publish automatically; this workflow has no social-platform posting integration.
- No content was published.
"""

def build(output_dir: Path = OUTPUT_DIR, day: dt.date | None = None, keyword_map: Path = KEYWORD_MAP) -> Path:
    current_day = day or dt.datetime.now(dt.timezone.utc).date()
    candidates = load_candidates(keyword_map)
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{current_day.isoformat()}.md"
    path.write_text(render_report(current_day, candidates), encoding="utf-8")
    return path

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    parser.add_argument("--date", type=dt.date.fromisoformat)
    args = parser.parse_args()
    report = build(args.output_dir, args.date)
    print(f"Draft report written: {report}")
    print("No content was published, scheduled, or sent.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
