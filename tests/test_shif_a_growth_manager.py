import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class GrowthManagerTests(unittest.TestCase):
    def test_growth_manager_is_owner_gated_and_has_daily_keyword_workflow(self):
        page = (ROOT / "growth-manager.html").read_text(encoding="utf-8")
        script = (ROOT / "scripts/shif-a-growth-manager.js").read_text(encoding="utf-8")
        for marker in ('name="robots" content="noindex,nofollow"', 'id="growthStatus"', 'id="keywordTable"', 'id="dailyTargets"', 'scripts/shif-a-growth-manager.js'):
            self.assertIn(marker, page)
        for marker in ("requireSession()", "getAccessProfile(", 'role !== "owner"', "data/shif-a-keywords.json", "lastUpdated", "item.intent", "item.trend"):
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

    def test_workspace_links_growth_manager(self):
        workspace = (ROOT / "workspace.html").read_text(encoding="utf-8")
        self.assertIn('href="growth-manager.html"', workspace)
        self.assertIn("Growth Manager", workspace)

if __name__ == "__main__":
    unittest.main()
