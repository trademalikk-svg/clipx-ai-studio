import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class ShifACodingStudioTests(unittest.TestCase):
    def test_studio_page_is_mobile_ready_and_has_editor_surfaces(self):
        html = (ROOT / "coding-studio.html").read_text(encoding="utf-8")
        for token in ('name="viewport"', 'id="projectMode"', 'id="fileList"', 'id="codeEditor"', 'id="previewFrame"', 'id="buildButton"', 'id="exportButton"', 'sandbox="allow-scripts"'):
            self.assertIn(token, html)
        self.assertIn('scripts/shif-a-coding-studio.js', html)

    def test_studio_has_no_fake_ai_or_paid_provider(self):
        js = (ROOT / "scripts" / "shif-a-coding-studio.js").read_text(encoding="utf-8")
        self.assertIn('LOCAL_TEMPLATE_MODE', js)
        self.assertIn('AI generation is not connected', js)
        self.assertNotRegex(js, re.compile(r'(openai|anthropic|gemini)\\.com', re.I))
        self.assertNotIn('service_role', js)

    def test_website_and_android_templates_are_exportable(self):
        js = (ROOT / "scripts" / "shif-a-coding-studio.js").read_text(encoding="utf-8")
        for token in ('website', 'android', 'MainActivity.kt', 'AndroidManifest.xml', 'exportProject'):
            self.assertIn(token, js)

    def test_catalog_marks_studio_limited_until_ai_engine_exists(self):
        js = (ROOT / "scripts" / "shif-a-tools.js").read_text(encoding="utf-8")
        self.assertRegex(js, re.compile(r'id:"coding-studio".{0,260}status:"limited"', re.S))
        self.assertIn('href:"coding-studio.html"', js)

if __name__ == "__main__":
    unittest.main()
