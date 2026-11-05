import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ShifAWritingStudioTests(unittest.TestCase):
    def test_writing_workspace_persists_local_template_and_form_state(self):
        js = (ROOT / "scripts/shif-a-writing-studio.js").read_text(encoding="utf-8")
        self.assertIn('const STORAGE_KEY="shifA.writingStudio.draft.v1"', js)
        self.assertIn("function saveWorkspace()", js)
        self.assertIn("function restoreWorkspace()", js)
        self.assertIn("localStorage.setItem(STORAGE_KEY", js)
        self.assertIn("localStorage.getItem(STORAGE_KEY)", js)
        self.assertIn("localStorage.removeItem(STORAGE_KEY)", js)


    def test_writing_studio_has_a_separate_saved_drafts_library(self):
        js = (ROOT / "scripts/shif-a-writing-studio.js").read_text(encoding="utf-8")
        html = (ROOT / "writing-studio.html").read_text(encoding="utf-8")
        self.assertIn('const LIBRARY_KEY="shifA.writingStudio.library.v1"', js)
        self.assertIn("function saveDraftToLibrary()", js)
        self.assertIn("function renderDraftLibrary()", js)
        self.assertIn("function loadSavedDraft(", js)
        self.assertIn("function deleteSavedDraft(", js)
        self.assertIn('id="saveDraftBtn"', html)
        self.assertIn('id="savedDrafts"', html)

    def test_writing_workspace_discloses_local_storage(self):
        html = (ROOT / "writing-studio.html").read_text(encoding="utf-8")
        self.assertIn("local browser", html.lower())


if __name__ == "__main__":
    unittest.main()
