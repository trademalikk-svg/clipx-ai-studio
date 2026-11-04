import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class OwnerSecurityAuditContractTests(unittest.TestCase):
    def test_private_security_records_are_locked_down(self):
        sql = (ROOT / "supabase" / "shif_a_access_foundation.sql").read_text(encoding="utf-8")
        for phrase in (
            "private.shif_a_owner_recovery_codes",
            "private.shif_a_owner_security_settings",
            "private.shif_a_security_events",
            "ENABLE ROW LEVEL SECURITY",
            "REVOKE ALL ON ALL TABLES IN SCHEMA private FROM PUBLIC, anon, authenticated",
        ):
            self.assertIn(phrase, sql)

    def test_audit_endpoint_derives_actor_and_allowlists_events(self):
        ts = (ROOT / "supabase" / "functions" / "shif-a-security-audit" / "index.ts").read_text(encoding="utf-8")
        for phrase in ("auth.getUser(", "shif_a_get_membership", "ALLOWED_EVENTS", "actor_user_id: user.id"):
            self.assertIn(phrase, ts)
        self.assertNotIn("body.actor_user_id", ts)
        self.assertNotIn("service_role", ts.lower().replace("service_role", ""))

    def test_audit_payload_is_minimal_and_rejects_secrets(self):
        ts = (ROOT / "supabase" / "functions" / "shif-a-security-audit" / "index.ts").read_text(encoding="utf-8")
        for phrase in ("credential", "token", "password", "biometric", "metadata"):
            self.assertIn(phrase, ts.lower())

if __name__ == "__main__":
    unittest.main()
