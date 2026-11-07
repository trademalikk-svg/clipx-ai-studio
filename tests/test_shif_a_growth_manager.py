import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class GrowthManagerTests(unittest.TestCase):
    def test_growth_manager_is_owner_gated_and_has_daily_keyword_workflow(self):
        page = (ROOT / "growth-manager.html").read_text(encoding="utf-8")
        script = (ROOT / "scripts/shif-a-growth-manager.js").read_text(encoding="utf-8")
        for marker in ('name="robots" content="noindex,nofollow"', 'id="growthStatus"', 'id="keywordTable"', 'id="dailyTargets"', 'scripts/shif-a-growth-manager.js'):
            self.assertIn(marker, page)
        for marker in ("requireSession()", "getAccessProfile(", 'access.role!=="owner"', "data/shif-a-keywords.json", "lastUpdated", "item.intent", "item.trend", "item.checkedAt", "item.sourceUrl"):
            self.assertIn(marker, script)

    def test_keyword_map_has_grounded_initial_terms_and_source_fields(self):
        import json
        data = json.loads((ROOT / "data/shif-a-keywords.json").read_text(encoding="utf-8"))
        self.assertIn("keywords", data)
        self.assertIsInstance(data["keywords"], list)
        self.assertGreaterEqual(len(data["keywords"]), 5)
        for item in data["keywords"]:
            for field in ("keyword", "language", "intent", "targetPage", "source", "checkedAt", "trend"):
                self.assertIn(field, item)

    def test_keyword_map_records_daily_research_and_exact_target_pages(self):
        import json
        data = json.loads((ROOT / "data/shif-a-keywords.json").read_text(encoding="utf-8"))
        by_keyword = {item["keyword"]: item for item in data["keywords"]}
        self.assertIn("AI tools India", by_keyword)
        self.assertIn("AI tools directory", by_keyword)
        self.assertEqual(by_keyword["AI tools India"]["targetPage"], "ai-tools.html")
        self.assertEqual(by_keyword["AI tools directory"]["checkedAt"], "2026-11-07")
        self.assertIn("YouTube Shorts series", by_keyword)
        self.assertEqual(by_keyword["YouTube Shorts series"]["targetPage"], "guide-youtube-shorts.html")
        for item in by_keyword.values():
            self.assertTrue(item["source"])
            self.assertTrue(item["trend"])

    def test_daily_plan_contains_all_requested_draft_targets_and_approval_controls(self):
        plan = (ROOT / "growth/daily/2026-11-07.md").read_text(encoding="utf-8")
        for marker in ("YouTube Shorts draft 1", "YouTube Shorts draft 2", "Instagram Reel draft 1", "Instagram Reel draft 2", "Facebook post 1", "Facebook post 2", "Pinterest Pin 1", "Pinterest Pin 2", "Pinterest Pin 3", "SEO article draft", "15-minute community-engagement checklist", "No social content published"):
            self.assertIn(marker, plan)

    def test_workspace_links_growth_manager(self):
        workspace = (ROOT / "workspace.html").read_text(encoding="utf-8")
        self.assertIn('href="growth-manager.html"', workspace)
        self.assertIn("Growth Manager", workspace)

if __name__ == "__main__":
    unittest.main()
