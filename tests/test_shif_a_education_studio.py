import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ShifAEducationStudioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.script = (ROOT / "scripts/shif-a-education-studio.js").read_text(encoding="utf-8")

    def test_plans_and_flashcards_restore_after_refresh(self):
        self.assertIn('const STORAGE_KEY="shif-a-study-v1"', self.script)
        self.assertIn('localStorage.setItem(STORAGE_KEY', self.script)
        self.assertIn('localStorage.getItem(STORAGE_KEY)', self.script)
        self.assertIn('function restoreStudyData()', self.script)
        self.assertIn('function saveStudyData()', self.script)

    def test_saved_study_data_is_validated_before_restore(self):
        self.assertIn('Array.isArray(data.plans)', self.script)
        self.assertIn('Array.isArray(data.cards)', self.script)
        self.assertIn('MAX_SAVED_ITEMS', self.script)
        self.assertIn('try{', self.script)
        self.assertIn('catch{', self.script)


if __name__ == "__main__":
    unittest.main()
