import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class OwnerRecoveryContractTests(unittest.TestCase):
    def test_password_reset_uses_supabase_verified_email_flow(self):
        js = (ROOT / "scripts" / "shif-a-owner-security.js").read_text(encoding="utf-8")
        self.assertIn("resetPasswordForEmail(", js)
        self.assertIn("PASSWORD_RECOVERY", js)
        self.assertIn("updateUser({password:first})", js)
        self.assertIn("owner-security.html", js)

    def test_recovery_responses_do_not_enumerate_accounts(self):
        js = (ROOT / "scripts" / "shif-a-owner-security.js").read_text(encoding="utf-8")
        self.assertGreaterEqual(js.count("यदि इस email से account मौजूद है"), 2)
        self.assertNotIn("getUserByEmail", js)
        self.assertNotIn("admin.listUsers", js)

    def test_owner_security_page_explains_identifier_and_has_reset_controls(self):
        html = (ROOT / "owner-security.html").read_text(encoding="utf-8")
        for phrase in ("recoveryEmail", "sendPasswordReset", "newPasswordPanel", "Owner ID", "verified email"):
            self.assertIn(phrase, html)
        self.assertIn('name="robots"', html)
        self.assertIn("noindex", html)

    def test_password_reset_does_not_grant_owner_role(self):
        js = (ROOT / "scripts" / "shif-a-owner-security.js").read_text(encoding="utf-8")
        self.assertNotIn("shif_a_memberships", js)
        self.assertNotIn("app_metadata", js)

if __name__ == "__main__":
    unittest.main()
