import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class ShifAEveningGrowth20261116Tests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / "data/shif-a-keywords.json").read_text(encoding="utf-8"))
        self.by_keyword = {item["keyword"]: item for item in self.data["keywords"]}

    def test_keyword_map_is_unique_and_next_day_plan_is_current(self):
        self.assertEqual(len(self.data["keywords"]), 36)
        self.assertEqual(len(self.by_keyword), 36)
        self.assertEqual(self.data["lastUpdated"], "2026-11-16")
        self.assertEqual(self.data["nextDayPlanFor"], "2026-11-17")
        self.assertEqual(len(self.data["nextDayPlan"]), 5)

    def test_chhath_terms_are_historical_after_event_window(self):
        for keyword in ("Chhath Puja 2026", "छठ पूजा 2026", "Chhath Puja status video 2026"):
            item = self.by_keyword[keyword]
            self.assertEqual(item["status"], "historical/inactive")
            self.assertFalse(item["active"])
            self.assertIn("historical", item["verificationStatus"])
            self.assertEqual(item["priority"], "low")

    def test_evening_review_records_targets_and_zero_spend(self):
        review = self.data["eveningReview"]
        self.assertEqual(review["spendInr"], 0)
        self.assertEqual(review["contentTargets"]["youtubeShorts"]["drafted"], 2)
        self.assertEqual(review["contentTargets"]["instagramReels"]["drafted"], 2)
        self.assertEqual(review["contentTargets"]["facebookPosts"]["drafted"], 2)
        self.assertEqual(review["contentTargets"]["pinterestPins"]["drafted"], 3)
        self.assertEqual(review["contentTargets"]["seoArticle"]["drafted"], 1)
        self.assertEqual(review["contentTargets"]["communityChecklistMinutes"], 15)

    def test_evening_research_entries_have_required_evidence_fields(self):
        rows = [r for r in self.data["researchLog"] if r.get("checkedAt") == "2026-11-16T17:00:00+05:30"]
        self.assertEqual(len(rows), 5)
        for row in rows:
            for field in ("source", "sourceUrl", "checkedAt", "keyword", "language", "intent", "trendDirection", "targetPage", "priority", "finding", "limitation"):
                self.assertIn(field, row)

    def test_daily_report_contains_all_requested_draft_sections(self):
        daily = (ROOT / "growth/daily/2026-11-16.md").read_text(encoding="utf-8")
        for marker in (
            "### YouTube Short 1", "### YouTube Short 2",
            "### Instagram Reel 1", "### Instagram Reel 2",
            "### Facebook Post 1", "### Facebook Post 2",
            "### Pinterest Pin 1", "### Pinterest Pin 2", "### Pinterest Pin 3",
            "## SEO article draft — existing Shorts guide expansion", "## 15-minute community engagement checklist"
        ):
            self.assertIn(marker, daily)

if __name__ == "__main__":
    unittest.main()
