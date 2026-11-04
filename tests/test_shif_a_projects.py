import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class ShifAProjectsContractTests(unittest.TestCase):
    def test_projects_page_loads_authenticated_storage_modules(self):
        html=(ROOT/"projects.html").read_text(encoding="utf-8")
        self.assertIn('id="projectForm"',html)
        self.assertIn('id="projectStatus"',html)
        self.assertIn('id="files"',html)
        self.assertIn('@supabase/supabase-js@2',html)
        self.assertIn('scripts/shif-a-auth.js',html)
        self.assertIn('scripts/shif-a-projects.js',html)
        self.assertIn('Database migration',html)

    def test_project_script_uses_authenticated_database_and_safe_rendering(self):
        js=(ROOT/"scripts"/"shif-a-projects.js").read_text(encoding="utf-8")
        self.assertIn('requireSession()',js)
        self.assertIn('from("shif_a_projects")',js)
        self.assertIn('renderProjects',js)
        self.assertIn('textContent',js)
        self.assertNotIn("localStorage",js)
        self.assertNotIn("sessionStorage",js)
        self.assertNotIn("innerHTML =",js)

    def test_project_migration_enforces_user_scoped_rls(self):
        sql=(ROOT/"supabase"/"migrations"/"20261105090000_shif_a_private_projects.sql").read_text(encoding="utf-8")
        self.assertIn("enable row level security",sql.lower())
        self.assertIn("to authenticated",sql.lower())
        self.assertIn("(select auth.uid()) = user_id",sql)
        self.assertIn("references auth.users(id) on delete cascade",sql)

if __name__=="__main__":
    unittest.main()
