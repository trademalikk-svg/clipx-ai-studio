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

    def test_ai_chat_is_limited_and_opens_chat_page(self):
        js = (ROOT / "scripts" / "shif-a-tools.js").read_text(encoding="utf-8")
        self.assertIn('name:"AI Chat & Research"', js)
        self.assertIn('status:"limited",href:"chat.html"', js)

    def test_local_image_and_voice_tools_are_limited_and_linked(self):
        js = (ROOT / "scripts/shif-a-tools.js").read_text(encoding="utf-8")
        self.assertRegex(js, re.compile(r'name:"Image Studio".{0,320}status:"limited",href:"media-studio.html#image-studio"', re.S))
        self.assertRegex(js, re.compile(r'name:"Voice Studio".{0,320}status:"limited",href:"media-studio.html#voice-studio"', re.S))
        self.assertIn("AI generation is not connected", js)
        self.assertIn("Hosted AI voice generation is not connected", js)
        self.assertIn('if(t.href)', js)

    def test_future_agent_and_automation_tools_remain_coming_soon(self):
        js = (ROOT / "scripts/shif-a-tools.js").read_text(encoding="utf-8")
        for tool in ("AI Agents Studio", "AI Automation Studio"):
            self.assertRegex(js, re.compile(r'name:"' + re.escape(tool) + r'".{0,260}status:"coming-soon"', re.S))

if __name__ == "__main__":
    unittest.main()
