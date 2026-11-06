import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from scripts.daily_seo import parse_trends, run_research


class DailySeoTests(unittest.TestCase):
    def test_trends_parser_deduplicates_and_limits(self):
        xml = '<rss><channel><item><title>Video editing</title></item><item><title>Shorts creator</title></item><item><title>Video editing</title></item></channel></rss>'
        self.assertEqual(parse_trends(xml, limit=2), ["Video editing", "Shorts creator"])

    def test_trends_parser_handles_empty_feed(self):
        self.assertEqual(parse_trends("<rss><channel /></rss>"), [])

    def test_report_generation_uses_no_cost_injected_feed(self):
        with tempfile.TemporaryDirectory() as tmp:
            def fetcher(url, timeout):
                return "<rss><channel><item><title>Creator tools</title></item></channel></rss>"
            path = run_research(
                output_dir=Path(tmp),
                fetcher=fetcher,
                now=datetime(2026, 11, 6, tzinfo=timezone.utc),
            )
            self.assertTrue(path.is_file())
            self.assertIn("Creator tools", path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
