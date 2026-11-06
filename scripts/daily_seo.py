#!/usr/bin/env python3
"""Free, evidence-labelled daily SEO research. Never edits or publishes site content."""
from __future__ import annotations
import datetime as dt
import json
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Callable

ROOT = Path(__file__).resolve().parents[1]
HOME = ROOT / "index.html"  # Read-only reference: this script never writes to it.
REPORT_DIR = ROOT / "seo-reports"
KEYWORD_MAP = ROOT / "data" / "shif-a-keywords.json"
TREND_FEEDS = {
    "India": "https://trends.google.com/trending/rss?geo=IN",
    "United States": "https://trends.google.com/trending/rss?geo=US",
    "United Kingdom": "https://trends.google.com/trending/rss?geo=GB",
    "Australia": "https://trends.google.com/trending/rss?geo=AU",
    "Canada": "https://trends.google.com/trending/rss?geo=CA",
}

def utc_now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)

def iso_utc(value: dt.datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=dt.timezone.utc)
    return value.astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

def parse_trends(xml_text: str, limit: int = 12) -> list[str]:
    if limit < 1:
        return []
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

def _read_feed(url: str, timeout: int) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "SHIF-A-SEO-Research/1.0"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8")

def fetch_trends(timeout: int = 20, fetcher: Callable[[str, int], str] | None = None, now: dt.datetime | None = None) -> dict[str, dict]:
    fetch = fetcher or _read_feed
    retrieved_at = iso_utc(now or utc_now())
    result: dict[str, dict] = {}
    for market, url in TREND_FEEDS.items():
        record = {"market": market, "source": url, "retrieved_at": retrieved_at, "status": "unavailable", "items": [], "error": ""}
        try:
            record["items"] = parse_trends(fetch(url, timeout))
            record["status"] = "ok"
        except Exception as exc:
            record["error"] = f"{type(exc).__name__}: {exc}"[:240]
            print(f"Warning: Google Trends feed unavailable for {market}: {record['error']}", file=sys.stderr)
        result[market] = record
    return result

def load_keyword_candidates(path: Path = KEYWORD_MAP) -> list[dict]:
    if not path.exists():
        return []
    payload = json.loads(path.read_text(encoding="utf-8"))
    candidates = []
    for item in payload.get("keywords", []):
        if item.get("verificationStatus") in {"candidate", "unverified"}:
            candidates.append({
                "keyword": str(item.get("keyword", "")),
                "language": str(item.get("language", "")),
                "market": str(item.get("market", "")),
                "intent": str(item.get("intent", "")),
                "target_page": str(item.get("targetPage", "")),
                "verification_status": str(item.get("verificationStatus", "unverified")),
                "evidence_type": str(item.get("evidenceType", "Evidence not supplied")),
            })
    return candidates

def render_report(trends: dict[str, dict], candidates: list[dict], generated_at: dt.datetime) -> str:
    lines = [
        f"# SHIF-A Daily SEO Research — {generated_at.date().isoformat()}",
        "",
        f"- **Generated at (UTC):** {iso_utc(generated_at)}",
        "- **Operating cost:** ₹0; public Google Trends RSS and Python standard library only",
        "- **Mode:** Research report only. No homepage edits, public content creation, commits, pushes, or publishing.",
        "",
        "## Google Trends directional snapshots",
        "",
        "These are directional snapshots of topics currently present in public Trends RSS feeds. They are **not search volume**, keyword-demand estimates, SHIF-A ranking data, Search Console metrics, or proof that a trend is relevant to SHIF-A.",
        "",
    ]
    for market, record in trends.items():
        lines.extend([
            f"### {market}",
            f"- **Status:** {record['status']}",
            f"- **Retrieved at (UTC):** {record['retrieved_at']}",
            f"- **Source:** {record['source']}",
        ])
        if record["error"]:
            lines.append(f"- **Feed note:** {record['error']}")
        if record["items"]:
            lines.extend(f"- {item}" for item in record["items"])
        else:
            lines.append("- No trend titles were returned.")
        lines.append("")
    lines.extend([
        "## Keyword map candidates",
        "",
        "The phrases below are existing research candidates, not verified demand or rising keywords. Check Search Console and relevant market evidence before prioritising or writing content.",
        "",
    ])
    if candidates:
        for item in candidates:
            lines.append(
                f"- **{item['keyword']}** ({item['language']}; {item['market']}; {item['intent']}) "
                f"— status: {item['verification_status']}; target: {item['target_page']}; "
                f"evidence: {item['evidence_type']}."
            )
    else:
        lines.append("- No candidate keywords were available in the keyword map.")
    lines.extend([
        "",
        "## Evidence and publication safeguards",
        "",
        "- A feed failure is shown as unavailable; it is not interpreted as zero demand.",
        "- RSS topic presence is not an estimate of monthly searches, traffic, conversions, or rankings.",
        "- Search Console figures must be read from the connected property and its reporting window; hidden query rows are not reconstructed.",
        "- This automation does not create articles, rewrite metadata, alter the sitemap, or publish social posts.",
        "- An Owner must review any proposed page or metadata draft separately before publication.",
        "",
    ])
    return "\n".join(lines)

def run_research(output_dir: Path = REPORT_DIR, fetcher: Callable[[str, int], str] | None = None, now: dt.datetime | None = None, keyword_map_path: Path = KEYWORD_MAP) -> Path:
    generated_at = now or utc_now()
    trends = fetch_trends(fetcher=fetcher, now=generated_at)
    if not any(record["status"] == "ok" and record["items"] for record in trends.values()):
        raise RuntimeError("No Google Trends feed returned usable items; no successful report was created.")
    candidates = load_keyword_candidates(keyword_map_path)
    report = render_report(trends, candidates, generated_at)
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{generated_at.date().isoformat()}.md"
    path.write_text(report, encoding="utf-8")
    return path

def main() -> int:
    report = run_research()
    print(f"SEO research report written: {report.relative_to(ROOT)}")
    print("Site files changed: no")
    print("Publishing or Git push performed: no")
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, ValueError, OSError, json.JSONDecodeError) as exc:
        print(f"SEO research stopped safely: {exc}", file=sys.stderr)
        raise SystemExit(1)
