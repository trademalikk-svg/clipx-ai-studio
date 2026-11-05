import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class ShifAAIProviderContractTests(unittest.TestCase):
    def test_tool_directory_has_no_duplicate_array_separator(self):
        import re
        source = (ROOT / "scripts" / "shif-a-tools.js").read_text(encoding="utf-8")
        self.assertNotRegex(source, r",\s*,\s*\{")


    def test_core_tools_describe_cloudflare_as_the_active_provider(self):
        root = ROOT
        for name in ("writing-studio.html", "coding-studio.html", "research-studio.html", "business-tools.html", "chat-studio.html", "education-studio.html"):
            page = (root / name).read_text(encoding="utf-8")
            self.assertNotIn("Gemini", page, f"stale provider label in {name}")
        helper = (root / "scripts" / "shif-a-ai-tools.js").read_text(encoding="utf-8")
        self.assertNotIn("Gemini provider", helper)
        self.assertIn("Cloudflare Workers AI", helper)

    def test_chat_model_selector_matches_cloudflare_gateway_default(self):
        page = (ROOT / "chat-studio.html").read_text(encoding="utf-8")
        self.assertIn("@cf/qwen/qwen3-30b-a3b-fp8", page)
        self.assertNotIn("gemini-3.8-flash", page)
        self.assertNotIn("gemini-3.1-flash-lite", page)

    def test_cloudflare_is_default_and_gemini_remains_switchable(self):
        source = (ROOT / "supabase" / "functions" / "shif-a-model-gateway" / "index.ts").read_text(encoding="utf-8")
        self.assertIn('Deno.env.get("AI_PROVIDER") || "cloudflare"', source)
        self.assertIn('provider === "gemini"', source)
        self.assertIn("GEMINI_API_KEY", source)

    def test_cloudflare_model_is_fixed_server_side(self):
        source = (ROOT / "supabase" / "functions" / "shif-a-model-gateway" / "index.ts").read_text(encoding="utf-8")
        self.assertIn('@cf/qwen/qwen3-30b-a3b-fp8', source)
        self.assertIn("CLOUDFLARE_ACCOUNT_ID", source)
        self.assertIn("CLOUDFLARE_API_TOKEN", source)
        self.assertIn("api.cloudflare.com/client/v4/accounts/", source)

    def test_provider_secrets_are_not_read_from_browser(self):
        source = (ROOT / "scripts" / "shif-a-ai-tools.js").read_text(encoding="utf-8")
        self.assertNotIn("CLOUDFLARE_API_TOKEN", source)
        self.assertNotIn("GEMINI_API_KEY", source)
        self.assertIn('@cf/qwen/qwen3-30b-a3b-fp8', source)

    def test_usage_guard_runs_before_provider_request_and_free_limit_has_no_fallback(self):
        source = (ROOT / "supabase" / "functions" / "shif-a-model-gateway" / "index.ts").read_text(encoding="utf-8")
        self.assertLess(source.index('adminClient.rpc('), source.index('https://api.cloudflare.com/client/v4/accounts/'))
        self.assertIn("no paid fallback will be used", source)
        self.assertIn("maximum 10 model requests per hour", source)

if __name__ == "__main__":
    unittest.main()
