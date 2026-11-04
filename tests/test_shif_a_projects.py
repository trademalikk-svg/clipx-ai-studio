import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class ShifAProjectsContractTests(unittest.TestCase):
    def test_projects_page_explains_non_persistence(self):
        html=(ROOT/"projects.html").read_text(encoding="utf-8")
        self.assertIn('id="projectForm"',html)
        self.assertIn('id="projectStatus"',html)
        self.assertIn('id="files"',html)
        self.assertIn('Project database',html)
        self.assertIn('कोई project save नहीं होगा',html)

    def test_project_script_does_not_persist_or_call_backend(self):
        js=(ROOT/"scripts"/"shif-a-projects.js").read_text(encoding="utf-8")
        self.assertIn("renderProjectState",js)
        self.assertIn("formatProjectActivity",js)
        self.assertNotIn("localStorage",js)
        self.assertNotIn("sessionStorage",js)
        self.assertNotIn("fetch(",js)
        self.assertNotIn("innerHTML =",js)

if __name__=="__main__":
    unittest.main()
