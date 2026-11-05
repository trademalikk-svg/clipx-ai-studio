import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class AgentAndAutomationPersistenceTests(unittest.TestCase):
    def test_agent_studio_autosaves_restores_and_clears(self):
        script = (ROOT / "scripts/shif-a-agents-studio.js").read_text(encoding="utf-8")
        page = (ROOT / "agents-studio.html").read_text(encoding="utf-8")
        self.assertIn('STORAGE_KEY="shifA.agentsStudio.workspace.v1"', script)
        self.assertIn("function saveWorkspace()", script)
        self.assertIn("function restoreWorkspace()", script)
        self.assertIn('localStorage.setItem(STORAGE_KEY', script)
        self.assertIn('localStorage.removeItem(STORAGE_KEY)', script)
        self.assertIn('data.version!==1', script)
        self.assertIn("input[name='perm']", script)
        self.assertIn("Reset करने पर saved draft मिट जाएगा", page)
        self.assertIn("setTimeout(()=>URL.revokeObjectURL(url),1500)", script)
        self.assertIn('$("copyBlueprint").addEventListener("click",async()=>{render();', script)
        self.assertIn('$("downloadJson").addEventListener("click",()=>{render();', script)

    def test_automation_studio_autosaves_steps_restores_and_clears(self):
        script = (ROOT / "scripts/shif-a-automation-studio.js").read_text(encoding="utf-8")
        page = (ROOT / "automation-studio.html").read_text(encoding="utf-8")
        self.assertIn('STORAGE_KEY="shifA.automationStudio.workspace.v1"', script)
        self.assertIn("function saveWorkspace()", script)
        self.assertIn("function restoreWorkspace()", script)
        self.assertIn('localStorage.setItem(STORAGE_KEY', script)
        self.assertIn('localStorage.removeItem(STORAGE_KEY)', script)
        self.assertIn("d.steps.length>30", script)
        self.assertIn("saveWorkspace();", script)
        self.assertIn("let steps=[],blueprint=null,nextStepNumber=1;", script)
        self.assertIn('id:"step-"+(nextStepNumber++)', script)
        self.assertIn("nextStepNumber=steps.length+1", script)
        self.assertIn("steps=[];nextStepNumber=1;", script)
        self.assertIn("Reset all करने पर saved draft मिट जाएगा", page)
        self.assertIn("setTimeout(()=>URL.revokeObjectURL(url),1500)", script)
        self.assertIn('$("copyFlow").addEventListener("click",async()=>{renderOutput();', script)
        self.assertIn('$("jsonFlow").addEventListener("click",()=>{renderOutput();', script)


if __name__ == "__main__":
    unittest.main()
