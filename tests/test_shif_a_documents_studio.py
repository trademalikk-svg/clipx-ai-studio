import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ShifADocumentsStudioTests(unittest.TestCase):
    def test_document_editor_restores_and_saves_local_drafts(self):
        js = (ROOT / "scripts/shif-a-documents-studio.js").read_text(encoding="utf-8")
        self.assertIn('const STORAGE_KEY = "shifA.documentsStudio.draft.v1"', js)
        self.assertIn("function saveDraft()", js)
        self.assertIn("function restoreDraft()", js)
        self.assertIn('localStorage.setItem(STORAGE_KEY', js)
        self.assertIn('localStorage.getItem(STORAGE_KEY)', js)
        self.assertIn('localStorage.removeItem(STORAGE_KEY)', js)

    def test_document_studio_explains_local_draft_persistence(self):
        html = (ROOT / "documents-studio.html").read_text(encoding="utf-8")
        self.assertIn("local browser", html.lower())
        self.assertIn('id="docStatus"', html)


if __name__ == "__main__":
    unittest.main()
