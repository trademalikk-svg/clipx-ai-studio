import datetime as dt
import importlib.util
import json
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class SignupAnalyticsContractTests(unittest.TestCase):
    def test_analytics_sql_stores_only_daily_aggregate_counts(self):
        sql = (ROOT / "supabase/drafts/shif_a_signup_analytics.sql").read_text(encoding="utf-8").lower()
        for marker in ("private.shif_a_growth_daily", "signup_count", "auth.users", "security definer", "enable row level security", "revoke all", "grant usage on schema private to service_role", "after insert on auth.users", "after update of email_confirmed_at"):
            self.assertIn(marker, sql)
        for forbidden in ("email text", "user_id uuid", "ip_address", "user_agent", "raw_prompt"):
            self.assertNotIn(forbidden, sql)

    def test_growth_analytics_endpoint_is_owner_only_and_server_authenticated(self):
        ts = (ROOT / "supabase/functions/shif-a-growth-analytics/index.ts").read_text(encoding="utf-8")
        for marker in ('auth.getUser(', 'OWNER_EMAIL', 'user.email?.toLowerCase() !== OWNER_EMAIL', 'shif_a_get_growth_daily_counts', 'SUPABASE_SERVICE_ROLE_KEY'):
            self.assertIn(marker, ts)
        self.assertIn('Cache-Control": "no-store"', ts)

    def test_growth_manager_uses_owner_only_aggregate_analytics(self):
        page = (ROOT / "growth-manager.html").read_text(encoding="utf-8")
        script = (ROOT / "scripts/shif-a-growth-analytics.js").read_text(encoding="utf-8")
        self.assertIn('id="signupAnalytics"', page)
        self.assertIn("getGrowthAnalytics", script)
        self.assertIn("getAccessProfile", script)

    def test_daily_growth_script_generates_draft_only_report(self):
        script = (ROOT / "scripts/daily_growth.py").read_text(encoding="utf-8")
        for marker in ("verificationStatus", "No content was published", "growth-reports", "SEO article", "YouTube Shorts"):
            self.assertIn(marker, script)
        self.assertNotIn("requests.post", script)
        self.assertNotIn("subprocess", script)
        self.assertIn("def build(", script)
        self.assertIn("No content was published", script)

    def test_daily_growth_workflow_is_free_read_only_and_artifact_only(self):
        workflow = (ROOT / ".github/workflows/daily-seo.yml").read_text(encoding="utf-8")
        self.assertIn("python scripts/daily_growth.py", workflow)
        self.assertIn("permissions:", workflow)
        self.assertIn("contents: read", workflow)
        self.assertNotIn("git push", workflow.lower())
        self.assertNotIn("OPENAI_API_KEY", workflow)

    def test_daily_growth_generator_writes_complete_draft_pack(self):
        spec = importlib.util.spec_from_file_location("daily_growth", ROOT / "scripts/daily_growth.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as folder:
            keyword_file = pathlib.Path(folder) / "keywords.json"
            keyword_file.write_text(json.dumps({"keywords": [
                {"keyword": "Hindi subtitles kaise lagaye", "verificationStatus": "unverified",
                 "priority": "high", "targetPage": "guide-hindi-subtitles.html"}
            ]}), encoding="utf-8")
            output = pathlib.Path(folder) / "out"
            report_path = module.build(output, dt.date(2026, 11, 6), keyword_file)
            report = report_path.read_text(encoding="utf-8")
            self.assertEqual(report_path.name, "2026-11-06.md")
            for marker in ("YouTube Shorts draft 1", "YouTube Shorts draft 2",
                           "Instagram Reel draft 1", "Instagram Reel draft 2",
                           "Facebook post 1", "Facebook post 2", "Pinterest Pin 1",
                           "Pinterest Pin 2", "Pinterest Pin 3", "SEO article draft",
                           "15-minute community-engagement checklist", "No content was published"):
                self.assertIn(marker, report)
            self.assertIn("Hindi subtitles kaise lagaye", report)

if __name__ == "__main__":
    unittest.main()
