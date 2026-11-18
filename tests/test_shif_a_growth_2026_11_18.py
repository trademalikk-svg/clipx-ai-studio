import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class ShifAGrowth20261118Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / "data/shif-a-keywords.json").read_text(encoding="utf-8"))
        cls.by_keyword = {item["keyword"].casefold(): item for item in cls.data["keywords"]}
        cls.daily = (ROOT / "growth/daily/2026-11-18.md").read_text(encoding="utf-8")
        cls.review = (ROOT / "growth/reviews/2026-11-18-0800.md").read_text(encoding="utf-8")

    def test_keyword_map_is_unique_and_current(self):
        self.assertEqual(len(self.data["keywords"]), len(self.by_keyword))
        self.assertEqual(self.data["lastUpdated"], "2026-11-18")
        self.assertEqual(self.data["nextDayPlanFor"], "2026-11-19")
        self.assertEqual(len(self.data["nextDayPlan"]), 5)

    def test_all_keywords_have_required_fields(self):
        required = ("source", "sourceUrl", "checkedAt", "language", "intent", "trendDirection", "targetPage", "priority")
        for item in self.data["keywords"]:
            for field in required:
                self.assertTrue(item.get(field), f"{item.get('keyword')}: missing {field}")

    def test_research_log_has_nine_current_observations(self):
        rows = [r for r in self.data["researchLog"] if r.get("checkedAt") == "2026-11-18T08:00:00+05:30"]
        self.assertEqual(len(rows), 9)
        for row in rows:
            for field in ("source", "sourceUrl", "checkedAt", "keyword", "language", "intent", "trendDirection", "targetPage", "priority", "finding", "limitation"):
                self.assertTrue(row.get(field), f"{row.get('source')}: missing {field}")

    def test_candidates_are_not_claimed_as_verified_demand(self):
        for phrase in ("Hindi SRT file kaise banaye", "split video into multiple clips", "YouTube Shorts music duration"):
            item = self.by_keyword[phrase.casefold()]
            self.assertIn("unverified", item["verificationStatus"].lower())

    def test_seasonal_keywords_remain_inactive(self):
        for phrase in ("children day 2026", "बाल दिवस 2026", "Diwali wishes images", "Diwali wishes in Hindi",
                       "Chhath Puja 2026", "छठ पूजा 2026", "Chhath Puja status video 2026"):
            item = self.by_keyword[phrase.casefold()]
            self.assertFalse(item.get("active", True))
            self.assertEqual(item.get("status"), "historical/inactive")

    def test_all_daily_content_targets_are_present(self):
        for marker in ("### YouTube Short 1", "### YouTube Short 2",
                       "### Instagram Reel 1", "### Instagram Reel 2",
                       "### Facebook Post 1", "### Facebook Post 2",
                       "### Pinterest Pin 1", "### Pinterest Pin 2", "### Pinterest Pin 3",
                       "## SEO article draft", "## 15-minute community-engagement checklist"):
            self.assertIn(marker, self.daily)

    def test_zero_spend_and_no_publication_are_explicit(self):
        self.assertIn("Actual spend: ₹0", self.review)
        self.assertIn("No social post published or scheduled", self.review)
        self.assertIn("no website merge", self.review.lower())
