import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class ShifAToolsContractTests(unittest.TestCase):
    def test_catalog_page_and_filter_controls_exist(self):
        html = (ROOT / "ai-tools.html").read_text(encoding="utf-8")
        self.assertIn('id="toolSearch"', html)
        self.assertIn('id="categoryFilter"', html)
        self.assertIn('scripts/shif-a-tools.js', html)
        self.assertRegex(html, r'<link[^>]+rel="canonical"')

    def test_registry_has_unique_ids_and_explicit_states(self):
        js = (ROOT / "scripts/shif-a-tools.js").read_text(encoding="utf-8")
        ids = re.findall(r'id:"([^"]+)"', js)
        self.assertGreaterEqual(len(ids), 12)
        self.assertEqual(len(ids), len(set(ids)))
        for status in ("available", "limited", "coming-soon"):
            self.assertIn('status:"' + status + '"', js)

    def test_future_tools_are_not_claimed_as_available(self):
        js = (ROOT / "scripts/shif-a-tools.js").read_text(encoding="utf-8")
        for tool in ("AI Image Studio", "AI Voice Studio", "AI Chat & Research", "AI Coding Studio", "AI Agents Studio", "AI Automation Studio"):
            self.assertRegex(js, re.compile(r'name:"' + re.escape(tool) + r'".{0,260}status:"coming-soon"', re.S))
        self.assertIn('if(t.href)', js)

if __name__ == "__main__":
    unittest.main()
