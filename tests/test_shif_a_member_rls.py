import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SQL = (ROOT / "supabase/migrations/20261105130000_shif_a_member_project_rls.sql").read_text(encoding="utf-8")


class MemberProjectPolicyTests(unittest.TestCase):
    def test_role_helpers_use_definer_and_fixed_search_path(self):
        self.assertEqual(SQL.count("security definer"), 4)
        self.assertEqual(SQL.count("set search_path = ''"), 4)
        self.assertIn("shif_a_can_use_project_ai", SQL)

    def test_project_permissions_are_role_separated(self):
        self.assertIn("Owners and active members can read SHIF-A projects", SQL)
        self.assertIn("Only owners can update SHIF-A projects", SQL)
        self.assertIn("Only owners can delete SHIF-A projects", SQL)

    def test_file_permissions_are_role_separated(self):
        self.assertIn("Project members read SHIF-A files", SQL)
        self.assertIn("Editors upload SHIF-A project files", SQL)
        self.assertIn("Owners and admins delete SHIF-A project files", SQL)

    def test_chat_records_remain_creator_private(self):
        self.assertIn("Users read own SHIF-A conversations", SQL)
        self.assertIn("Users read own SHIF-A chat messages", SQL)
        self.assertIn("AI roles create own project conversations", SQL)

    def test_storage_reads_require_registered_file_metadata(self):
        self.assertIn("Project members read registered SHIF-A objects", SQL)
        self.assertIn("where f.object_path = name", SQL)


if __name__ == "__main__":
    unittest.main()
