import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class OwnerPasskeyContractTests(unittest.TestCase):
    def test_owner_security_page_uses_pinned_supabase_client(self):
        page = (ROOT / "owner-security.html").read_text(encoding="utf-8")
        script = (ROOT / "scripts/shif-a-owner-security.js").read_text(encoding="utf-8")
        self.assertIn("@supabase/supabase-js@2.105.0", page)
        self.assertIn("experimental:{passkey:true}", script)

    def test_direct_passkey_login_is_discoverable_and_server_role_checked(self):
        script = (ROOT / "scripts/shif-a-owner-security.js").read_text(encoding="utf-8")
        self.assertIn("signInWithPasskey", script)
        self.assertIn("shif-a-access", script)
        self.assertIn("if(!access.ok)", script)
        self.assertIn("signOut", script)

    def test_passkey_enrollment_requires_server_confirmed_owner(self):
        script = (ROOT / "scripts/shif-a-owner-security.js").read_text(encoding="utf-8")
        self.assertIn("registerPasskey", script)
        self.assertIn("async function owner()", script)
        self.assertIn("Owner verification required.", script)

    def test_no_biometric_data_or_client_side_owner_flag(self):
        script = (ROOT / "scripts/shif-a-owner-security.js").read_text(encoding="utf-8")
        self.assertNotIn('localStorage.setItem("shif_role"', script)
        self.assertNotIn("fingerprintTemplate", script)
        self.assertNotIn("irisTemplate", script)

if __name__ == "__main__":
    unittest.main()
