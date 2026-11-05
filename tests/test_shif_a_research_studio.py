import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ResearchStudioPersistenceTests(unittest.TestCase):
    def test_research_workspace_autosaves_restores_and_clears(self):
        script = (ROOT / "scripts/shif-a-research-studio.js").read_text(encoding="utf-8")
        page = (ROOT / "research-studio.html").read_text(encoding="utf-8")
        self.assertIn('STORAGE_KEY="shifA.researchStudio.workspace.v1"', script)
        self.assertIn("function saveWorkspace()", script)
        self.assertIn("function restoreWorkspace()", script)
        self.assertIn("localStorage.setItem(STORAGE_KEY", script)
        self.assertIn("localStorage.removeItem(STORAGE_KEY)", script)
        self.assertIn('d.version!==1', script)
        self.assertIn('sources.length>=50', script)
        self.assertIn('["http:","https:"]', script)
        self.assertIn('renderSources();saveWorkspace();', script)
        self.assertIn('restoreWorkspace();renderSources();', script)
        self.assertIn("अपने-आप save होते हैं", page)
        self.assertIn("does not fetch or verify sources", script)
        self.assertIn('setTimeout(()=>URL.revokeObjectURL(url),1500)', script)


if __name__ == "__main__":
    unittest.main()
