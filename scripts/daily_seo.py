#!/usr/bin/env python3
"""Daily, conservative SEO metadata updater for ClipX AI Studio."""
from __future__ import annotations

import datetime as dt
import html
import json
import os
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOME = ROOT / "index.html"
REPORT_DIR = ROOT / "seo-reports"
TREND_FEEDS = {
    "India": "https://trends.google.com/trending/rss?geo=IN",
    "United States": "https://trends.google.com/trending/rss?geo=US",
    "United Kingdom": "https://trends.google.com/trending/rss?geo=GB",
    "Australia": "https://trends.google.com/trending/rss?geo=AU",
    "Canada": "https://trends.google.com/trending/rss?geo=CA",
}
BLOCKED_CLAIMS = re.compile(
    r"\b(unlimited|instant cloud rendering|cloud rendering|automatic ai highlights|"
    r"automatic highlight detection|10\s?gb uploads|guaranteed results|free forever)\b",
    re.IGNORECASE,
)


def parse_trends(xml_text: str, limit: int = 12) -> list[str]:
    root = ET.fromstring(xml_text)
    seen: set[str] = set()
    values: list[str] = []
    for node in root.findall(".//item/title"):
        value = " ".join((node.text or "").split())
        key = value.casefold()
        if value and key not in seen:
            seen.add(key)
            values.append(value)
        if len(values) >= limit:
            break
    return values


def fetch_trends(timeout: int = 20) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for market, url in TREND_FEEDS.items():
        request = urllib.request.Request(url, headers={"User-Agent": "ClipX-SEO-Bot/1.0"})
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                result[market] = parse_trends(response.read().decode("utf-8"))
        except Exception as exc:
            print(f"Warning: trends unavailable for {market}: {exc}", file=sys.stderr)
            result[market] = []
    if not any(result.values()):
        raise RuntimeError("No Google Trends feeds could be read; refusing to change SEO metadata.")
    return result


def validate_metadata(metadata: dict) -> dict[str, str]:
    if not isinstance(metadata, dict):
        raise ValueError("AI response must be a JSON object.")
    title = metadata.get("title")
    description = metadata.get("description")
    if not isinstance(title, str) or not isinstance(description, str):
        raise ValueError("SEO title and description must both be strings.")
    title, description = title.strip(), description.strip()
    if not (25 <= len(title) <= 70):
        raise ValueError("SEO title must be between 25 and 70 characters.")
    if not (80 <= len(description) <= 180):
        raise ValueError("Meta description must be between 80 and 180 characters.")
    if any(ord(ch) < 32 for ch in title + description):
        raise ValueError("Control characters are not allowed in SEO metadata.")
    if "<" in title or ">" in title or "<" in description or ">" in description:
        raise ValueError("HTML markup is not allowed in SEO metadata.")
    if BLOCKED_CLAIMS.search(title + " " + description):
        raise ValueError("Metadata contains a product claim that is not currently supported.")
    if "clipx" not in title.casefold():
        raise ValueError("SEO title must retain the ClipX brand.")
    return {"title": title, "description": description}


def replace_homepage_metadata(source: str, metadata: dict[str, str]) -> str:
    safe = validate_metadata(metadata)
    title_pattern = re.compile(r"<title>.*?</title>", re.IGNORECASE | re.DOTALL)
    desc_pattern = re.compile(
        r'(<meta\s+name=["\']description["\']\s+content=["\']).*?(["\']\s*/?>)',
        re.IGNORECASE | re.DOTALL,
    )
    if not title_pattern.search(source) or not desc_pattern.search(source):
        raise ValueError("Homepage title or description tag was not found; no changes made.")
    source = title_pattern.sub(f"<title>{html.escape(safe['title'])}</title>", source, count=1)
    source = desc_pattern.sub(
        lambda match: match.group(1) + html.escape(safe["description"], quote=True) + match.group(2),
        source,
        count=1,
    )
    return source


def call_openai(trends: dict[str, list[str]], api_key: str, model: str) -> dict:
    prompt = {
        "task": "Suggest one conservative homepage SEO title and meta description using trends only when genuinely relevant.",
        "markets": trends,
        "verified_product_facts": [
            "ClipX is a browser-based creator toolkit.",
            "Existing tools include video trim/split, captions/subtitles, thumbnail layouts and script/text utilities.",
            "The public site currently uses Free Browser Mode.",
            "Do not claim cloud rendering, automatic semantic highlight selection, unlimited uploads, or guaranteed outcomes.",
        ],
        "rules": [
            "Target India first while remaining useful to worldwide English-speaking creators.",
            "Do not stuff keywords or mention unrelated trends.",
            "Title: 25-70 characters and must include ClipX.",
            "Description: 80-180 characters.",
            "Do not invent features, prices, rankings, statistics or customer counts.",
            "Return JSON only with title, description and rationale.",
        ],
    }
    body = json.dumps({
        "model": model,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": "You are a conservative technical SEO editor. Product truth outranks trend keywords."},
            {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)},
        ],
    }).encode("utf-8")
    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return json.loads(payload["choices"][0]["message"]["content"])


def write_report(trends: dict[str, list[str]], metadata: dict[str, str], rationale: str, changed: bool) -> Path:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    today = dt.datetime.now(dt.timezone.utc).date().isoformat()
    lines = [f"# ClipX Daily SEO Report — {today}", "", "Google Trends RSS snapshot:"]
    for market, items in trends.items():
        lines.append(f"- **{market}:** " + (", ".join(items[:8]) if items else "Feed unavailable"))
    lines += [
        "", "Homepage metadata:",
        f"- **Title:** {metadata['title']}",
        f"- **Description:** {metadata['description']}",
        f"- **Reason:** {rationale or 'No rationale supplied.'}",
        "", f"**Homepage metadata updated:** {'Yes' if changed else 'No (already current)'}",
        "", "Trend snapshots are not verified search rankings. Use Google Search Console for actual impressions, clicks and positions.",
    ]
    path = REPORT_DIR / f"{today}.md"
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def main() -> int:
    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("Missing OPENAI_API_KEY GitHub Actions secret. No SEO changes were made.")
    model = os.environ.get("OPENAI_SEO_MODEL", "").strip() or "gpt-4.1-mini"
    trends = fetch_trends()
    response = call_openai(trends, api_key, model)
    metadata = validate_metadata(response)
    old = HOME.read_text(encoding="utf-8")
    new = replace_homepage_metadata(old, metadata)
    changed = new != old
    if changed:
        HOME.write_text(new, encoding="utf-8")
    report = write_report(trends, metadata, str(response.get("rationale", "")), changed)
    print(f"SEO report written: {report.relative_to(ROOT)}")
    print(f"Homepage metadata changed: {changed}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, ValueError, KeyError, urllib.error.URLError, json.JSONDecodeError) as exc:
        print(f"SEO automation stopped safely: {exc}", file=sys.stderr)
        raise SystemExit(1)
