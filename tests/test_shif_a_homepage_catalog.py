import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
HOME = (ROOT / "index.html").read_text(encoding="utf-8")
TOOLS = (ROOT / "scripts" / "shif-a-tools.js").read_text(encoding="utf-8")


class HomepageCatalogTests(unittest.TestCase):
    def test_homepage_embeds_the_complete_searchable_tool_directory(self):
        for marker in [
            'id="allToolsDirectory"',
            'id="toolSearch"',
            'id="categoryFilter"',
            'id="toolCount"',
            'id="toolGrid"',
            'id="emptyState"',
            '<script src="scripts/shif-a-tools.js"></script>',
        ]:
            self.assertIn(marker, HOME, f"homepage is missing {marker}")

    def test_homepage_directory_uses_real_tool_registry_and_statuses(self):
        self.assertIn('status:"available"', TOOLS)
        self.assertIn('status:"limited"', TOOLS)
        self.assertIn('status:"coming-soon"', TOOLS)
        tool_ids = re.findall(r'\{id:"([^"]+)"', TOOLS)
        self.assertGreaterEqual(len(tool_ids), 40)
        self.assertEqual(len(tool_ids), len(set(tool_ids)), "tool IDs must be unique")

    def test_homepage_final_theme_uses_navy_electric_blue_and_white_not_purple(self):
        marker = '<style id="shifa-navy-electric-blue-theme">'
        self.assertIn(marker, HOME)
        theme = HOME.split(marker, 1)[1].split("</style>", 1)[0]
        self.assertIn("#0b1f3a", theme)
        self.assertIn("#1769ff", theme)
        self.assertRegex(theme, r"#fff(?:fff)?")
        self.assertNotRegex(theme.lower(), r"purple|violet|#6842c2|#4e2b9e|#b45cff|#ed48ff|#a85ee1|#843bc5")

if __name__ == "__main__":
    unittest.main()
