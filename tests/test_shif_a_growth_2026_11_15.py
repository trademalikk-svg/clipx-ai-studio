from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]

class ShifAGrowth20261115Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / "data/shif-a-keywords.json").read_text(encoding="utf-8"))
        cls.by_keyword = {item["keyword"]: item for item in cls.data["keywords"]}
        cls.report = (ROOT / "growth/daily/2026-11-15.md").read_text(encoding="utf-8")

    def test_keyword_map_has_unique_terms_and_complete_evidence_fields(self):
        terms = [item["keyword"] for item in self.data["keywords"]]
        self.assertEqual(len(terms), len(set(terms)))
        self.assertEqual(self.data["lastUpdated"], "2026-11-15")
        self.assertEqual(len(terms), 36)
        for item in self.data["keywords"]:
            for field in ("keyword", "language", "intent", "targetPage", "source", "checkedAt", "trend", "priority"):
                self.assertTrue(item.get(field), f"missing {field}: {item.get('keyword')}")

    def test_chhath_candidates_are_low_priority_and_explicitly_unverified(self):
        for term, language in (
            ("Chhath Puja 2026", "en"),
            ("छठ पूजा 2026", "hi"),
            ("Chhath Puja status video 2026", "en"),
        ):
            item = self.by_keyword[term]
            self.assertEqual(item["language"], language)
            self.assertEqual(item["checkedAt"], "2026-11-15")
            self.assertEqual(item["priority"], "low")
            self.assertIn("guide-youtube-shorts.html", item["targetPage"])
            self.assertTrue(item["sourceUrl"])
            self.assertIn("unverified", item["verificationStatus"])

    def test_expired_seasonal_terms_are_not_active_targets(self):
        for term in ("children day 2026", "बाल दिवस 2026", "Diwali wishes images", "Diwali wishes in Hindi"):
            item = self.by_keyword[term]
            self.assertEqual(item["checkedAt"], "2026-11-15")
            self.assertIn("expired", item["trend"].lower())
            self.assertEqual(item["priority"], "low")

    def test_daily_plan_contains_all_requested_draft_types_and_approval_limits(self):
        markers = (
            "YouTube Shorts draft 1", "YouTube Shorts draft 2",
            "Instagram Reel draft 1", "Instagram Reel draft 2",
            "Facebook post 1", "Facebook post 2",
            "Pinterest Pin 1", "Pinterest Pin 2", "Pinterest Pin 3",
            "SEO article draft", "15-minute community-engagement checklist",
            "No social publishing/scheduling", "No website merge or deployment",
            "Actual spend: ₹0"
        )
        for marker in markers:
            self.assertIn(marker, self.report)

if __name__ == "__main__":
    unittest.main()
