import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class ShifAGrowth20261118EveningTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / "data/shif-a-keywords.json").read_text(encoding="utf-8"))
        cls.by_keyword = {item["keyword"].casefold(): item for item in cls.data["keywords"]}
        cls.daily = (ROOT / "growth/daily/2026-11-18.md").read_text(encoding="utf-8")
        cls.review = (ROOT / "growth/reviews/2026-11-18-1700.md").read_text(encoding="utf-8")

    def test_keyword_map_unique_and_current(self):
        self.assertEqual(len(self.data["keywords"]), len(self.by_keyword))
        self.assertEqual(self.data["lastUpdated"], "2026-11-18")
        self.assertEqual(self.data["nextDayPlanFor"], "2026-11-19")
        self.assertEqual(len(self.data["nextDayPlan"]), 5)

    def test_required_fields_exist_for_every_keyword(self):
        required = ("source", "sourceUrl", "checkedAt", "language", "intent",
                    "trendDirection", "targetPage", "priority")
        for item in self.data["keywords"]:
            for field in required:
                self.assertTrue(item.get(field), f"{item.get('keyword')}: missing {field}")

    def test_six_evening_research_observations(self):
        rows = [r for r in self.data["researchLog"]
                if r.get("checkedAt") == "2026-11-18T17:00:00+05:30"]
        self.assertEqual(len(rows), 6)
        for row in rows:
            for field in ("source", "sourceUrl", "checkedAt", "keyword", "language",
                          "intent", "trendDirection", "targetPage", "priority",
                          "finding", "limitation"):
                self.assertTrue(row.get(field), f"{row.get('source')}: missing {field}")

    def test_new_candidate_is_not_verified_demand(self):
        item = self.by_keyword["youtube shorts subtitles"]
        self.assertEqual(item["status"], "candidate")
        self.assertIn("unverified", item["verificationStatus"].lower())
        self.assertEqual(item["targetPage"], "guide-hindi-subtitles.html")

    def test_seasonal_terms_remain_inactive(self):
        for phrase in ("children day 2026", "बाल दिवस 2026", "Diwali wishes images",
                       "Diwali wishes in Hindi", "Chhath Puja 2026", "छठ पूजा 2026",
                       "Chhath Puja status video 2026"):
            item = self.by_keyword[phrase.casefold()]
            self.assertFalse(item.get("active", True))
            self.assertEqual(item.get("status"), "historical/inactive")

    def test_daily_content_targets_remain_complete(self):
        for marker in ("### YouTube Short 1", "### YouTube Short 2",
                       "### Instagram Reel 1", "### Instagram Reel 2",
                       "### Facebook Post 1", "### Facebook Post 2",
                       "### Pinterest Pin 1", "### Pinterest Pin 2",
                       "### Pinterest Pin 3", "## SEO article draft",
                       "## 15-minute community-engagement checklist"):
            self.assertIn(marker, self.daily)

    def test_evening_controls_and_metrics_are_explicit(self):
        self.assertIn("Actual spend: ₹0", self.review)
        self.assertIn("No social posts published or scheduled", self.review)
        self.assertIn("No fresh first-party SHIF-A analytics", self.review)
        self.assertIn("Full Python unit suite was not executed", self.review)
        self.assertIn("No public page metadata or page copy was changed", self.review)
