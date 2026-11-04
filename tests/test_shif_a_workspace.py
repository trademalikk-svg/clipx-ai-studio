import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class ShifAWorkspaceContractTests(unittest.TestCase):
    def test_dashboard_is_private_and_uses_shared_auth(self):
        html = (ROOT / "dashboard.html").read_text(encoding="utf-8")
        self.assertRegex(html, r'<meta[^>]+name="robots"[^>]+noindex')
        self.assertIn('scripts/shif-a-auth.js', html)
        self.assertIn('scripts/shif-a-dashboard.js', html)
        self.assertIn('id="loginPrompt"', html)
        self.assertIn('id="dashboardContent"', html)
        self.assertIn('id="ownerPanel"', html)

    def test_auth_uses_server_managed_metadata_only_for_display(self):
        js = (ROOT / "scripts/shif-a-auth.js").read_text(encoding="utf-8")
        self.assertIn("auth.getUser", js)
        self.assertIn("app_metadata", js)
        self.assertNotIn("user_metadata", js)
        self.assertNotIn("service_role", js)
        self.assertIn("getDisplayAccess", js)

    def test_dashboard_has_truthful_empty_states(self):
        html = (ROOT / "dashboard.html").read_text(encoding="utf-8")
        self.assertIn("Project history backend अभी connect नहीं है", html)
        self.assertIn("Plan और credit ledger तैयार होने के बाद", html)
        self.assertIn("Provider quotas और device limits", html)

if __name__ == "__main__":
    unittest.main()
