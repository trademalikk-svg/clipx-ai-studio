import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class AccessGuardTests(unittest.TestCase):
    def test_signed_in_users_get_free_tools_without_admin_approval(self):
        script = (ROOT / "scripts/shif-a-access-guard.js").read_text(encoding="utf-8")
        self.assertIn("requireSession()", script)
        self.assertIn("getAccessProfile(", script)
        self.assertIn("isOwnerOnlyTool", script)
        self.assertIn('return id==="owner-security"', script)
        self.assertIn("Access denied", script)
        self.assertIn("Login required", script)

    def test_all_tool_entry_pages_load_the_central_guard(self):
        pages = {
            "index.html": "clipx-video",
            "workspace.html": "workspace",
            "tool-studio.html": "dynamic-tool",
            "chat.html": "ai-chat",
            "creator-tools.html": "thumbnail-tools",
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
