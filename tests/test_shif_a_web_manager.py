import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class WebManagerTests(unittest.TestCase):
    def test_manager_page_is_private_and_not_indexed(self):
        page = (ROOT / "web-manager.html").read_text(encoding="utf-8")
        self.assertIn('name="robots" content="noindex,nofollow"', page)
        self.assertIn('id="locked"', page)
        self.assertIn('id="manager" class="hidden"', page)
        self.assertNotIn("web-manager.html", (ROOT / "sitemap.xml").read_text(encoding="utf-8"))

    def test_manager_requires_server_verified_owner(self):
        script = (ROOT / "scripts/shif-a-web-manager.js").read_text(encoding="utf-8")
        self.assertIn("getAccessProfile(session)", script)
        self.assertIn('profile.role!=="owner"', script)
        self.assertIn("authorized=true", script)

    def test_offline_and_local_runtime_are_explicit(self):
        script = (ROOT / "scripts/shif-a-web-manager.js").read_text(encoding="utf-8")
        page = (ROOT / "web-manager.html").read_text(encoding="utf-8")
        self.assertIn('addEventListener("offline"', script)
        self.assertIn('"/api/tags"', script)
        self.assertIn("Device बंद होने पर local AI भी बंद रहेगा", page)

    def test_offline_shell_cache_excludes_authenticated_api_data(self):
        worker = (ROOT / "shif-a-manager-sw.js").read_text(encoding="utf-8")
        self.assertIn("shif-a-owner-manager-v1", worker)
        self.assertIn('/functions/', worker)
        self.assertIn('/rest/v1/', worker)
        self.assertIn('request.method!=="GET"', worker)
        page = (ROOT / "web-manager.html").read_text(encoding="utf-8")
        self.assertIn('scripts/shif-a-tools.js', page)

    def test_production_actions_are_not_exposed(self):
        page = (ROOT / "web-manager.html").read_text(encoding="utf-8")
        self.assertIn("Owner approval required", page)
        self.assertIn("Never automatic", page)
        self.assertNotIn("Deploy now", page)

if __name__ == "__main__":
    unittest.main()
