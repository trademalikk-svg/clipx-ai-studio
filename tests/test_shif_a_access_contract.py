import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class ShifAAccessSecurityContractTests(unittest.TestCase):
    """Fail-closed requirements for the future membership backend."""

    def test_private_membership_schema_exists(self):
        sql = (ROOT / "supabase" / "shif_a_access_foundation.sql").read_text(encoding="utf-8")
        for phrase in (
            "private.shif_a_memberships",
            "private.shif_a_invitations",
            "private.shif_a_access_audit",
            "ENABLE ROW LEVEL SECURITY",
            "REVOKE ALL",
        ):
            self.assertIn(phrase, sql)

    def test_access_endpoint_authenticates_server_side(self):
        ts = (ROOT / "supabase" / "functions" / "shif-a-access" / "index.ts").read_text(encoding="utf-8")
        self.assertIn("auth.getUser(", ts)
        self.assertIn("Bearer ", ts)
        self.assertNotIn("user_metadata", ts)
        self.assertNotIn("raw_user_meta_data", ts)

    def test_invitation_requires_verified_identity_and_one_time_token(self):
        ts = (ROOT / "supabase" / "functions" / "shif-a-invite" / "index.ts").read_text(encoding="utf-8")
        for phrase in ("auth.getUser(", "email_confirmed_at", "expires_at", "accepted_at", "owner"):
            self.assertIn(phrase, ts)
        self.assertNotIn("user_metadata", ts)

if __name__ == "__main__":
    unittest.main()
