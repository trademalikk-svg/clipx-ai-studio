import os
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from scripts import daily_seo


class DailySeoResearchTests(unittest.TestCase):
    def test_trends_parser_deduplicates_limits_and_handles_empty_feed(self):
        xml = '<rss><channel><item><title>Video editing</title></item><item><title>Shorts creator</title></item><item><title>Video editing</title></item></channel></rss>'
        self.assertEqual(daily_seo.parse_trends(xml, limit=2), ["Video editing", "Shorts creator"])
        self.assertEqual(daily_seo.parse_trends("<rss><channel /></rss>"), [])

    def test_malformed_feed_is_reported_as_unavailable_not_fatal_to_other_markets(self):
        def fetcher(url, timeout):
            if "geo=IN" in url:
                raise ValueError("feed unavailable")
            return "<rss><channel><item><title>Creator tools</title></item></channel></rss>"

        snapshot = daily_seo.fetch_trends(fetcher=fetcher, now=datetime(2026, 11, 6, tzinfo=timezone.utc))
        self.assertEqual(snapshot["India"]["status"], "unavailable")
        self.assertEqual(snapshot["United States"]["status"], "ok")
        self.assertEqual(snapshot["United States"]["items"], ["Creator tools"])
        self.assertIn("source", snapshot["India"])
        self.assertIn("retrieved_at", snapshot["India"])

    def test_all_failed_feeds_raise_and_create_no_report(self):
        with tempfile.TemporaryDirectory() as tmp:
            def fetcher(url, timeout):
                raise OSError("offline")
            with self.assertRaises(RuntimeError):
                daily_seo.run_research(output_dir=Path(tmp), fetcher=fetcher)
            self.assertEqual(list(Path(tmp).iterdir()), [])

    def test_report_is_dated_and_labels_evidence_limitations(self):
        with tempfile.TemporaryDirectory() as tmp:
            def fetcher(url, timeout):
                return "<rss><channel><item><title>Video editing</title></item></channel></rss>"
            now = datetime(2026, 11, 6, 10, 30, tzinfo=timezone.utc)
            path = daily_seo.run_research(output_dir=Path(tmp), fetcher=fetcher, now=now)
            report = path.read_text(encoding="utf-8")
            self.assertEqual(path.name, "2026-11-06.md")
            self.assertIn("directional snapshot", report.lower())
            self.assertIn("not search volume", report.lower())
            self.assertIn("not shif-a ranking data", report.lower())
            self.assertIn("Google Trends RSS", report)

    def test_research_does_not_modify_homepage_or_require_api_key(self):
        homepage = daily_seo.HOME
        before = homepage.read_bytes() if homepage.exists() else None
        with tempfile.TemporaryDirectory() as tmp:
            def fetcher(url, timeout):
                return "<rss><channel><item><title>Video editing</title></item></channel></rss>"
            daily_seo.run_research(output_dir=Path(tmp), fetcher=fetcher)
        after = homepage.read_bytes() if homepage.exists() else None
        self.assertEqual(before, after)
        self.assertNotIn("OPENAI_API_KEY", os.environ)

    def test_keyword_map_candidates_are_reported_without_volume_claims(self):
        with tempfile.TemporaryDirectory() as tmp:
            def fetcher(url, timeout):
                return "<rss><channel><item><title>Video editing</title></item></channel></rss>"
            path = daily_seo.run_research(output_dir=Path(tmp), fetcher=fetcher)
            report = path.read_text(encoding="utf-8")
            self.assertIn("Keyword map candidates", report)
            self.assertIn("candidate", report.lower())


if __name__ == "__main__":
    unittest.main()
