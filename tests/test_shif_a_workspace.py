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


class MainWorkspaceContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "workspace.html").read_text(encoding="utf-8")
        cls.js = (ROOT / "scripts" / "shif-a-workspace.js").read_text(encoding="utf-8")

    def test_semantic_workspace_regions_and_navigation(self):
        for token in ['<nav', 'aria-label="Primary navigation"', 'id="workspaceMain"', 'id="contextPanel"', 'id="mobileNavToggle"', 'id="toolGrid"']:
            self.assertIn(token, self.html)

    def test_universal_command_modes_and_label(self):
        for token in ['id="universalCommand"', 'id="commandMode"', 'value="auto"', 'value="manual"', 'value="project"', 'id="commandSubmit"']:
            self.assertIn(token, self.html)

    def test_project_activity_and_guide_regions_exist(self):
        for token in ['id="recentProjects"', 'id="activityFeed"', 'user-guide.html']:
            self.assertIn(token, self.html)

    def test_tool_availability_is_truthful(self):
        for token in ['Available', 'Limited', 'Coming Soon']:
            self.assertIn(token, self.html)
        self.assertIn('Coming Soon', self.js)

    def test_command_router_only_recommends_and_does_not_execute(self):
        self.assertIn('classifyIntent', self.js)
        self.assertIn('getToolById', self.js)
        self.assertNotIn('fetch(', self.js)
        self.assertNotIn('XMLHttpRequest', self.js)
        self.assertNotIn('localStorage', self.js)
        self.assertNotIn('sessionStorage', self.js)
        self.assertNotIn('task.status = "Running"', self.js)
        self.assertNotIn('task.status = "Completed"', self.js)

    def test_user_text_is_rendered_as_text(self):
        self.assertIn('textContent', self.js)
        self.assertNotIn('innerHTML =', self.js)


if __name__ == "__main__":
    unittest.main()
