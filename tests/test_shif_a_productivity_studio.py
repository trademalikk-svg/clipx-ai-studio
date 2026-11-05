import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ProductivityStudioAutosaveTests(unittest.TestCase):
    def test_notes_and_planner_drafts_autosave_and_restore(self):
        script = (ROOT / "scripts/shif-a-productivity-studio.js").read_text(encoding="utf-8")
        page = (ROOT / "productivity-studio.html").read_text(encoding="utf-8")
        self.assertIn('plannerDraft:{date:"",title:"",items:""}', script)
        self.assertIn('plannerDraft:v.plannerDraft&&typeof v.plannerDraft==="object"', script)
        self.assertIn('$("quickNotes").addEventListener("input"', script)
        self.assertIn('addEventListener("input",savePlannerDraft)', script)
        self.assertIn('$("planTitle").value=state.plannerDraft.title', script)
        self.assertIn('state.plans[date]={title,items}', script)
        self.assertIn("Daily Planner draft typing के दौरान auto-save होते हैं", page)
        self.assertIn('setTimeout(()=>URL.revokeObjectURL(url),1500)', script)


if __name__ == "__main__":
    unittest.main()
