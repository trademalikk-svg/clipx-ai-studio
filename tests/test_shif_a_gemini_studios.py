import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ShifAGeminiStudioContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.gateway = (ROOT / "supabase/functions/shif-a-model-gateway/index.ts").read_text(encoding="utf-8")
        cls.client = (ROOT / "scripts/shif-a-ai-client.js").read_text(encoding="utf-8")
        cls.chat = (ROOT / "chat-studio.html").read_text(encoding="utf-8")
        cls.writing = (ROOT / "writing-studio.html").read_text(encoding="utf-8")
        cls.writing_js = (ROOT / "scripts/shif-a-writing-studio.js").read_text(encoding="utf-8")
        cls.coding = (ROOT / "coding-studio.html").read_text(encoding="utf-8")
        cls.coding_js = (ROOT / "scripts/shif-a-coding-ai.js").read_text(encoding="utf-8")

    def test_gateway_uses_gemini_and_server_side_secret(self):
        self.assertIn('const GEMINI_MODEL = "gemini-3.8-flash"', self.gateway)
        self.assertIn('Deno.env.get("GEMINI_API_KEY")', self.gateway)
        self.assertIn("generativelanguage.googleapis.com/v1beta/models/", self.gateway)
        self.assertNotIn("CLOUDFLARE_API_TOKEN", self.gateway)
        self.assertIn('authClient.auth.getUser(token)', self.gateway)
        self.assertIn('shif_a_consume_model_request', self.gateway)

    def test_shared_client_sends_authenticated_request_without_provider_secret(self):
        self.assertIn('Authorization: "Bearer " + auth.session.access_token', self.client)
        self.assertIn('apikey: KEY', self.client)
        self.assertIn('model: MODEL', self.client)
        self.assertNotIn("GEMINI_API_KEY", self.client)

    def test_chat_studio_selects_gemini(self):
        self.assertIn('value="gemini-3.8-flash"', self.chat)
        self.assertIn('scripts/shif-a-ai-client.js', self.chat)
        self.assertNotIn("Cloudflare Workers AI", self.chat)

    def test_writing_studio_has_separate_real_ai_action(self):
        self.assertIn('id="generateAiBtn"', self.writing)
        self.assertIn('scripts/shif-a-ai-client.js', self.writing)
        self.assertIn('window.ShifAAI.request(prompt,"writing")', self.writing_js)
        self.assertIn('Generate local template', self.writing)

    def test_coding_studio_has_review_then_apply_flow(self):
        self.assertIn('scripts/shif-a-ai-client.js', self.coding)
        self.assertIn('scripts/shif-a-coding-ai.js', self.coding)
        self.assertIn('window.ShifAAI.request(message, "coding")', self.coding_js)
        self.assertIn('Apply to active file', self.coding_js)
        self.assertIn('dispatchEvent(new Event("input"', self.coding_js)


if __name__ == "__main__":
    unittest.main()
