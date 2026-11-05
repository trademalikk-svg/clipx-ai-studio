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
        self.assertIn("यदि इस email से account मौजूद है", js)
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

    def test_recovery_code_ui_is_bound_to_passkey_revocation(self):
        html = (ROOT / "owner-security.html").read_text(encoding="utf-8")
        js = (ROOT / "scripts" / "shif-a-owner-security.js").read_text(encoding="utf-8")
        self.assertIn('id="revokePasskeyId"', html)
        self.assertIn('id="consumeRecoveryCode"', html)
        self.assertIn('action:"revoke_with_code"', js)
        self.assertIn('passkey_id:', js)
        self.assertIn('shif-a-owner-recovery', js)

    def test_recovery_codes_require_aal2_and_never_create_sessions(self):
        fn = (ROOT / "supabase" / "functions" / "shif-a-owner-recovery" / "index.ts").read_text(encoding="utf-8")
        self.assertIn('readAal(jwt) !== "aal2"', fn)
        self.assertIn("getUser(jwt)", fn)
        self.assertIn("listPasskeys({ userId: user.id })", fn)
        self.assertIn("deletePasskey({", fn)
        self.assertNotIn("generateLink(", fn)
        self.assertNotIn("createSession(", fn)
        self.assertIn("shif_a_consume_recovery_code", fn)

    def test_recovery_code_verifiers_are_salted_and_one_time(self):
        fn = (ROOT / "supabase" / "functions" / "shif-a-owner-recovery" / "index.ts").read_text(encoding="utf-8")
        sql = (ROOT / "supabase" / "shif_a_access_foundation.sql").read_text(encoding="utf-8")
        self.assertIn("crypto.getRandomValues", fn)
        self.assertIn('sha256(salt + ":" + normalizeCode(code))', fn)
        self.assertIn("expires_at>now()", sql)
        self.assertIn("consumed_at is null", sql)
        self.assertIn("attempt_count >= case when p_action='generate' then 2 else 5 end", sql)

if __name__ == "__main__":
    unittest.main()
