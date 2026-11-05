import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ShifABusinessToolsTests(unittest.TestCase):
    def test_business_toolkit_persists_working_state_and_generated_draft(self):
        js = (ROOT / "scripts/shif-a-business-tools.js").read_text(encoding="utf-8")
        self.assertIn('const WORKSPACE_KEY="shifA.businessTools.workspace.v1"', js)
        self.assertIn("function saveWorkspace()", js)
        self.assertIn("function restoreWorkspace()", js)
        self.assertIn("localStorage.setItem(WORKSPACE_KEY", js)
        self.assertIn("localStorage.getItem(WORKSPACE_KEY)", js)

    def test_business_toolkit_has_saved_document_library(self):
        js = (ROOT / "scripts/shif-a-business-tools.js").read_text(encoding="utf-8")
        html = (ROOT / "business-tools.html").read_text(encoding="utf-8")
        self.assertIn('const LIBRARY_KEY="shifA.businessTools.library.v1"', js)
        self.assertIn("function saveToLibrary()", js)
        self.assertIn("function renderLibrary()", js)
        self.assertIn("function openLibraryItem(", js)
        self.assertIn("function deleteLibraryItem(", js)
        self.assertIn('id="saveToLibraryBtn"', html)
        self.assertIn('id="savedBusinessDocs"', html)


if __name__ == "__main__":
    unittest.main()
