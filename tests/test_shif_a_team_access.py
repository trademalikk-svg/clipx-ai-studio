import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class ShifATeamAccessTests(unittest.TestCase):
    def test_invitation_function_authenticates_verified_users(self):
        source=(ROOT/"supabase"/"functions"/"shif-a-team-access"/"index.ts").read_text(encoding="utf-8")
        self.assertIn('auth.getUser(jwt)',source)
        self.assertIn('user.email_confirmed_at',source)
        self.assertIn('project.user_id !== user.id',source)
        self.assertIn('crypto.getRandomValues',source)
        self.assertIn('shown_once: true',source)

    def test_invitation_acceptance_checks_verified_email_and_is_atomic(self):
        sql=(ROOT/"supabase"/"migrations"/"20261105120000_shif_a_team_access_foundation.sql").read_text(encoding="utf-8")
        self.assertIn("shif_a_accept_project_invitation",sql)
        self.assertIn("for update",sql.lower())
        self.assertIn("i.invited_email = lower(btrim(p_verified_email))",sql)
        self.assertIn("i.status = 'pending'",sql)
        self.assertIn("grant execute on function public.shif_a_accept_project_invitation",sql.lower())

    def test_invites_are_non_owner_roles_and_browser_cannot_read_tokens(self):
        sql=(ROOT/"supabase"/"migrations"/"20261105120000_shif_a_team_access_foundation.sql").read_text(encoding="utf-8")
        self.assertIn("role in ('admin','editor','ai_user','viewer')",sql)
        self.assertIn("revoke all on public.shif_a_project_invitations from anon, public, authenticated",sql.lower())
        self.assertIn("'member_revoked'",sql)

    def test_team_access_edge_function_is_in_deno_ci(self):
        workflow=(ROOT/".github"/"workflows"/"validate.yml").read_text(encoding="utf-8")
        self.assertIn("deno check supabase/functions/shif-a-team-access/index.ts",workflow)

if __name__ == "__main__":
    unittest.main()
