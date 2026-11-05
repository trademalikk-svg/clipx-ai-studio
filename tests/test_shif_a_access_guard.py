import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class AccessGuardTests(unittest.TestCase):
    def test_guard_requires_verified_session_and_explicit_tool_permission(self):
        script = (ROOT / "scripts/shif-a-access-guard.js").read_text(encoding="utf-8")
        for marker in ("requireSession()", "getAccessProfile(", 'access.role==="owner"', "enabledTools.includes(toolId)", "Login required", "Access denied"):
            self.assertIn(marker, script)

    def test_all_tool_entry_pages_load_the_central_guard(self):
        pages = {
            "index.html": "clipx-video",
            "workspace.html": "workspace",
            "ai-tools.html": "tool-directory",
            "tool-studio.html": "dynamic-tool",
            "coding-studio.html": "coding-studio",
            "media-studio.html": "media-studio",
            "video-studio.html": "video-studio",
            "growth-manager.html": "growth-manager",
            "projects.html": "projects",
            "owner-security.html": "owner-security",
        }
        for filename, tool_id in pages.items():
            page = (ROOT / filename).read_text(encoding="utf-8")
            self.assertIn('data-shifa-tool="' + tool_id + '"', page, filename)
            self.assertIn('scripts/shif-a-access-guard.js', page, filename)

if __name__ == "__main__":
    unittest.main()
