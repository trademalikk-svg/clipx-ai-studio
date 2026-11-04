import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class ShifAGuideContractTests(unittest.TestCase):
    def test_hindi_guide_has_required_sections(self):
        html=(ROOT/"user-guide.html").read_text(encoding="utf-8")
        for anchor in ["login","workspace","command","projects","tools","files","tasks","security","troubleshoot"]:
            self.assertIn('id="'+anchor+'"',html)
        self.assertIn('lang="hi"',html)
        self.assertIn('id="guideSearch"',html)
        self.assertIn('scripts/shif-a-guide.js',html)

    def test_guide_is_truthful_about_unavailable_features(self):
        html=(ROOT/"user-guide.html").read_text(encoding="utf-8")
        self.assertIn("Project backend जुड़ने के बाद सक्रिय होगी",html)
        self.assertIn("task complete होने का दावा नहीं करता",html)
        self.assertIn("Coming Soon",html)

    def test_guide_search_uses_text_content(self):
        js=(ROOT/"scripts"/"shif-a-guide.js").read_text(encoding="utf-8")
        self.assertIn("textContent",js)
        self.assertNotIn("innerHTML",js)

if __name__=="__main__":
    unittest.main()
