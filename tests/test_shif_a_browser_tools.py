import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
HTML = (ROOT / "browser-tools.html").read_text(encoding="utf-8")
SCRIPT = (ROOT / "scripts" / "shif-a-browser-tools.js").read_text(encoding="utf-8")


class BrowserToolsContractTests(unittest.TestCase):
    def test_every_browser_tool_control_has_a_matching_handler(self):
        for ident in [
            "textInput", "textStats", "upperBtn", "lowerBtn", "titleBtn", "copyTextBtn",
            "captionInput", "lineLength", "formatCaptionBtn", "copyCaptionBtn",
            "captionOutput", "captionStatus", "jsonInput", "formatJsonBtn", "minifyJsonBtn",
            "copyJsonBtn", "jsonOutput", "jsonStatus", "imageFile", "imageInfo",
            "imageWidth", "imageHeight", "keepRatio", "resizeImageBtn", "imageStatus",
        ]:
            self.assertIn(f'id="{ident}"', HTML, f"Missing HTML control: {ident}")
            self.assertIn(f'$("{ident}")', SCRIPT, f"Missing script reference: {ident}")

    def test_caption_copy_does_not_mutate_the_generated_caption(self):
        self.assertIn('await navigator.clipboard.writeText(value)', SCRIPT)
        self.assertIn('$("captionStatus").textContent = "Captions copied."', SCRIPT)
        self.assertNotIn('$("captionOutput").textContent +=', SCRIPT)

    def test_json_copy_requires_a_valid_formatted_result(self):
        self.assertIn('if (!jsonResult)', SCRIPT)
        self.assertIn('jsonResult = ""', SCRIPT)
        self.assertIn('JSON.parse($("jsonInput").value)', SCRIPT)

    def test_image_resizer_releases_old_preview_and_preserves_supported_format(self):
        self.assertIn("URL.revokeObjectURL(selectedImage.url)", SCRIPT)
        self.assertIn('"image/webp"', SCRIPT)
        self.assertIn('type === "image/webp" ? "webp"', SCRIPT)
        self.assertIn("width > 6000 || height > 6000", SCRIPT)

    def test_page_loads_the_external_tool_script(self):
        self.assertIn('<script src="scripts/shif-a-browser-tools.js"></script>', HTML)
        self.assertIn('aria-live="polite"', HTML)


if __name__ == "__main__":
    unittest.main()
