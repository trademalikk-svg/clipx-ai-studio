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


    def test_keyword_map_adds_current_seasonal_queries_and_feature_candidates(self):
        import json
        data = json.loads((ROOT / "data/shif-a-keywords.json").read_text(encoding="utf-8"))
        by_keyword = {item["keyword"]: item for item in data["keywords"]}
        for keyword in ("Diwali wishes images", "Diwali wishes in Hindi"):
            self.assertIn(keyword, by_keyword)
            self.assertEqual(by_keyword[keyword]["checkedAt"], "2026-11-09")
            self.assertTrue(by_keyword[keyword]["sourceUrl"])
            self.assertTrue(by_keyword[keyword]["targetPage"])
        self.assertIn("AI editing for YouTube Shorts", by_keyword)
        self.assertEqual(by_keyword["AI editing for YouTube Shorts"]["checkedAt"], "2026-11-10")
        self.assertIn("YouTube Shorts AI editing assistant", by_keyword)
        self.assertEqual(by_keyword["YouTube Shorts AI editing assistant"]["checkedAt"], "2026-11-10")
        self.assertIn("not a SHIF-A capability", by_keyword["YouTube Shorts AI editing assistant"]["targetPage"])

    def test_daily_plan_2026_11_08_contains_all_requested_drafts_and_approval_controls(self):
        plan = (ROOT / "growth/daily/2026-11-08.md").read_text(encoding="utf-8")
        for marker in ("YouTube Shorts draft 1", "YouTube Shorts draft 2", "Instagram Reel draft 1", "Instagram Reel draft 2", "Facebook post 1", "Facebook post 2", "Pinterest Pin 1", "Pinterest Pin 2", "Pinterest Pin 3", "SEO article draft", "15-minute community-engagement checklist", "No social content published", "No website merge or deployment"):
            self.assertIn(marker, plan)

    def test_shorts_guide_documents_series_feature_and_internal_link(self):
        page = (ROOT / "guide-youtube-shorts.html").read_text(encoding="utf-8")
        self.assertIn("Plan a YouTube Shorts series", page)
        self.assertIn("series setup and publishing happen in YouTube", page)
        self.assertIn('href="split-video-into-multiple-clips.html"', page)
        self.assertIn('"dateModified":"2026-11-11"', page)

    def test_growth_manager_links_latest_daily_report(self):
        page = (ROOT / "growth-manager.html").read_text(encoding="utf-8")
        self.assertIn("growth/daily/2026-11-11.md", page)
        self.assertIn("Open 11 November content drafts and Owner report", page)
        self.assertIn("growth/reviews/2026-11-10-1700.md", page)
        self.assertIn("Open 10 November 17:00 Owner review", page)

    def test_daily_plan_2026_11_09_contains_all_requested_drafts_and_approval_controls(self):
        plan = (ROOT / "growth/daily/2026-11-09.md").read_text(encoding="utf-8")
        for marker in ("YouTube Shorts drafts", "Instagram Reels drafts", "Facebook post drafts", "Pinterest Pin drafts", "SEO article draft", "15-minute community-engagement checklist", "No social post published or scheduled", "No website merge or deployment"):
            self.assertIn(marker, plan)

    def test_instagram_edits_keyword_is_editorial_only_and_not_a_shifa_feature(self):
        import json
        data = json.loads((ROOT / "data/shif-a-keywords.json").read_text(encoding="utf-8"))
        item = next(item for item in data["keywords"] if item["keyword"] == "Instagram Edits for Mac")
        self.assertEqual(item["priority"], "low")
        self.assertIn("No direct indexable SHIF-A page", item["targetPage"])
        self.assertIn("not a SHIF-A feature", item["verificationStatus"])


    def test_2026_11_11_keyword_map_and_shorts_update_are_evidence_labelled(self):
        import json
        data = json.loads((ROOT / "data/shif-a-keywords.json").read_text(encoding="utf-8"))
        by_keyword = {item["keyword"]: item for item in data["keywords"]}
        self.assertIn("shorts", by_keyword)
        self.assertEqual(by_keyword["shorts"]["targetPage"], "guide-youtube-shorts.html")
        self.assertIn("relative index 4", by_keyword["shorts"]["source"])
        self.assertIn("YouTube Shorts up to 3 minutes", by_keyword)
        self.assertIn("support.google.com/youtube/answer/15424877", by_keyword["YouTube Shorts up to 3 minutes"]["sourceUrl"])
        self.assertEqual(data["lastUpdated"], "2026-11-11")

    def test_2026_11_11_daily_plan_contains_all_drafts_and_approval_controls(self):
        plan = (ROOT / "growth/daily/2026-11-11.md").read_text(encoding="utf-8")
        for marker in ("YouTube Shorts draft 1", "YouTube Shorts draft 2", "Instagram Reel draft 1", "Instagram Reel draft 2", "Facebook post 1", "Facebook post 2", "Pinterest Pin 1", "Pinterest Pin 2", "Pinterest Pin 3", "SEO article draft", "15-minute community-engagement checklist", "No social post published or scheduled", "No website merge or deployment"):
            self.assertIn(marker, plan)

    def test_shorts_guide_documents_three_minute_eligibility_and_copyright_rule(self):
        page = (ROOT / "guide-youtube-shorts.html").read_text(encoding="utf-8")
        self.assertIn("Can a YouTube Short be up to three minutes?", page)
        self.assertIn("active Content ID claim of any type, including manual claims", page)
        self.assertIn("support.google.com/youtube/answer/15424877", page)
        self.assertIn("support.google.com/youtube/answer/15424877", page)
        self.assertIn('"dateModified":"2026-11-11"', page)

if __name__ == "__main__":
    unittest.main()
