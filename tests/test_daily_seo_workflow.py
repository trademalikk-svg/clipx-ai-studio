import unittest
from pathlib import Path


class DailySeoWorkflowTests(unittest.TestCase):
    def test_workflow_is_read_only_and_artifact_only(self):
        workflow = Path(".github/workflows/daily-seo.yml").read_text(encoding="utf-8")
        self.assertIn("contents: read", workflow)
        self.assertNotIn("contents: write", workflow)
        self.assertNotIn("git push", workflow)
        self.assertNotIn("git commit", workflow)
        self.assertIn("upload-artifact", workflow)
        self.assertNotIn("OPENAI_API_KEY", workflow)
        self.assertIn("workflow_dispatch", workflow)

    def test_workflow_does_not_publish_or_mutate_site(self):
        workflow = Path(".github/workflows/daily-seo.yml").read_text(encoding="utf-8")
        self.assertNotIn("git add index.html", workflow)
        self.assertNotIn("pages: write", workflow)
        self.assertIn("seo-reports/", workflow)


if __name__ == "__main__":
    unittest.main()
