import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class ShifAAIProviderContractTests(unittest.TestCase):
    def test_tool_directory_has_no_duplicate_array_separator(self):
        import re
        source = (ROOT / "scripts" / "shif-a-tools.js").read_text(encoding="utf-8")
        self.assertNotRegex(source, r",\s*,\s*\{")


    def test_core_tools_describe_gemini_as_the_active_provider(self):
        root = ROOT
        for name in ("writing-studio.html", "coding-studio.html", "research-studio.html", "business-tools.html", "chat-studio.html", "education-studio.html", "documents-studio.html", "agents-studio.html", "automation-studio.html"):
            page = (root / name).read_text(encoding="utf-8")
            if name in ("writing-studio.html", "coding-studio.html", "chat-studio.html"):
                self.assertIn("Gemini", page, f"Gemini provider label missing in {name}")
            else:
                self.assertNotIn("Cloudflare Workers AI", page, f"stale provider label in {name}")
        helper = (root / "scripts" / "shif-a-ai-tools.js").read_text(encoding="utf-8")
        self.assertNotIn("Gemini provider", helper)
        self.assertIn("Gemini", helper)

    def test_chat_model_selector_matches_gemini_gateway_default(self):
        page = (ROOT / "chat-studio.html").read_text(encoding="utf-8")
        self.assertIn("gemini-3.8-flash", page)
        self.assertNotIn("@cf/qwen/qwen3-30b-a3b-fp8", page)

    def test_core_ai_tool_field_and_output_ids_exist_in_their_pages(self):
        import re
        helper = (ROOT / "scripts" / "shif-a-ai-tools.js").read_text(encoding="utf-8")
        configs = {
            "writing-studio.html": ("draftOutput", ["topic", "language", "format", "platform", "tone", "audience", "keywords", "details"]),
            "business-tools.html": ("result", ["businessName", "businessType", "city", "language", "details", "customerMessage", "goal", "budget", "itemName", "itemPrice", "itemQty", "taxRate"]),
            "coding-studio.html": ("codeEditor", ["projectMode", "activeFile", "codeEditor"]),
            "research-studio.html": ("reportOutput", ["topic", "language", "question", "scope", "audience", "findings", "gaps", "conclusion"]),
            "education-studio.html": ("quizArea", ["subject", "quizNotes", "flashQuestion", "flashAnswer"]),
            "documents-studio.html": ("docBody", ["docTitle", "docAuthor", "docBody"]),
            "agents-studio.html": ("blueprint", ["agentName", "agentRole", "agentGoal", "agentInstructions", "agentSteps", "agentLimits"]),
            "automation-studio.html": ("flowOutput", ["flowName", "flowTrigger", "flowPurpose", "flowFrequency", "flowOwner", "stepList", "approvalMode", "failureMode", "dataRules"]),
        }
        for page_name, (target, fields) in configs.items():
            with self.subTest(page=page_name):
                page = (ROOT / page_name).read_text(encoding="utf-8")
                ids = set(re.findall(r'id="([^"]+)"', page))
                self.assertIn(target, ids)
                for field in fields:
                    self.assertIn(field, ids, f"{field} missing from {page_name}")
                self.assertIn('"' + page_name + '"', helper)

    def test_gemini_is_the_only_enabled_provider(self):
        source = (ROOT / "supabase" / "functions" / "shif-a-model-gateway" / "index.ts").read_text(encoding="utf-8")
        self.assertIn('const GEMINI_MODEL = "gemini-3.8-flash"', source)
        self.assertIn("GEMINI_API_KEY", source)
        self.assertNotIn("CLOUDFLARE_API_TOKEN", source)

    def test_gemini_model_is_fixed_server_side(self):
        source = (ROOT / "supabase" / "functions" / "shif-a-model-gateway" / "index.ts").read_text(encoding="utf-8")
        self.assertIn('const GEMINI_MODEL = "gemini-3.8-flash"', source)
        self.assertIn("generativelanguage.googleapis.com/v1beta/models/", source)
        self.assertIn('provider: "gemini"', source)

    def test_provider_secrets_are_not_read_from_browser(self):
        source = (ROOT / "scripts" / "shif-a-ai-tools.js").read_text(encoding="utf-8")
        self.assertNotIn("CLOUDFLARE_API_TOKEN", source)
        self.assertNotIn("GEMINI_API_KEY", source)
        self.assertIn("gemini-3.8-flash", (ROOT / "scripts" / "shif-a-ai-client.js").read_text(encoding="utf-8"))

    def test_gateway_enforces_verified_email_server_side(self):
        source = (ROOT / "supabase" / "functions" / "shif-a-model-gateway" / "index.ts").read_text(encoding="utf-8")
        self.assertIn("!authData.user.email_confirmed_at", source)
        self.assertIn("Email verification is required.", source)

    def test_usage_guard_runs_before_provider_request_and_free_limit_has_no_fallback(self):
        source = (ROOT / "supabase" / "functions" / "shif-a-model-gateway" / "index.ts").read_text(encoding="utf-8")
        self.assertLess(source.index('adminClient.rpc('), source.index('https://generativelanguage.googleapis.com/v1beta/models/'))
        self.assertIn("no paid fallback will be used", source)
        self.assertIn("maximum 10 model requests per hour", source)

if __name__ == "__main__":
    unittest.main()
