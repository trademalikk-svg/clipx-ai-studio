import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ShifADocumentsStudioTests(unittest.TestCase):
    def test_document_editor_restores_and_saves_local_drafts(self):
        js = (ROOT / "scripts/shif-a-documents-studio.js").read_text(encoding="utf-8")
        self.assertIn('const STORAGE_KEY="shifA.documentsStudio.draft.v1"', js)
        self.assertIn("function saveDraft()", js)
        self.assertIn("function restoreDraft()", js)
        self.assertIn('localStorage.setItem(STORAGE_KEY', js)
        self.assertIn('localStorage.getItem(STORAGE_KEY)', js)
        self.assertIn('localStorage.removeItem(STORAGE_KEY)', js)
        self.assertIn(r"split(/\s+/u)", js)
        self.assertIn(r'title+"\n"', js)
        self.assertIn(r"[^\p{L}\p{N}-]+", js)

    def test_document_studio_has_saved_document_library(self):
        js = (ROOT / "scripts/shif-a-documents-studio.js").read_text(encoding="utf-8")
        html = (ROOT / "documents-studio.html").read_text(encoding="utf-8")
        self.assertIn('const LIBRARY_KEY="shifA.documentsStudio.library.v1"', js)
        self.assertIn("function saveToLibrary()", js)
        self.assertIn("function renderLibrary()", js)
        self.assertIn("function openLibraryDocument(", js)
        self.assertIn("function deleteLibraryDocument(", js)
        self.assertIn("MAX_LIBRARY_ITEMS=30", js)
        self.assertIn('id="saveLibraryBtn"', html)
        self.assertIn('id="documentLibrary"', html)
        self.assertIn("local browser", html.lower())

    def test_document_studio_explains_local_draft_persistence(self):
        html = (ROOT / "documents-studio.html").read_text(encoding="utf-8")
        self.assertIn("local browser", html.lower())
        self.assertIn('id="docStatus"', html)


if __name__ == "__main__":
    unittest.main()
