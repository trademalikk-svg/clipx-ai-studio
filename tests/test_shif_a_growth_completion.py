import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class SignupAnalyticsContractTests(unittest.TestCase):
    def test_analytics_sql_stores_only_daily_aggregate_counts(self):
        sql = (ROOT / "supabase/drafts/shif_a_signup_analytics.sql").read_text(encoding="utf-8").lower()
        for marker in ("private.shif_a_growth_daily", "signup_count", "auth.users", "security definer", "enable row level security", "revoke all"):
            self.assertIn(marker, sql)
        for forbidden in ("email text", "user_id uuid", "ip_address", "user_agent", "raw_prompt"):
            self.assertNotIn(forbidden, sql)

    def test_growth_analytics_endpoint_is_owner_only_and_server_authenticated(self):
        ts = (ROOT / "supabase/functions/shif-a-growth-analytics/index.ts").read_text(encoding="utf-8")
        for marker in ('auth.getUser(', 'shif_a_get_membership', 'role !== "owner"', 'shif_a_get_growth_daily_counts', 'SUPABASE_SERVICE_ROLE_KEY'):
            self.assertIn(marker, ts)
        self.assertIn('Cache-Control": "no-store"', ts)

    def test_growth_manager_uses_owner_only_aggregate_analytics(self):
        page = (ROOT / "growth-manager.html").read_text(encoding="utf-8")
        script = (ROOT / "scripts/shif-a-growth-analytics.js").read_text(encoding="utf-8")
        self.assertIn('id="signupAnalytics"', page)
        self.assertIn("shif-a-growth-analytics", script)
        self.assertIn("getAccessProfile", script)

    def test_daily_growth_script_generates_draft_only_report(self):
        script = (ROOT / "scripts/daily_growth.py").read_text(encoding="utf-8")
        for marker in ("verificationStatus", "No content was published", "growth/daily", "SEO article", "YouTube Shorts"):
            self.assertIn(marker, script)
        self.assertNotIn("requests.post", script)
        self.assertNotIn("subprocess", script)

    def test_daily_growth_workflow_is_free_read_only_and_artifact_only(self):
        workflow = (ROOT / ".github/workflows/daily-seo.yml").read_text(encoding="utf-8")
        self.assertIn("python scripts/daily_growth.py", workflow)
        self.assertIn("permissions:", workflow)
        self.assertIn("contents: read", workflow)
        self.assertNotIn("git push", workflow.lower())
        self.assertNotIn("OPENAI_API_KEY", workflow)

if __name__ == "__main__":
    unittest.main()
