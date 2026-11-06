import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class CloudMediaTests(unittest.TestCase):
    def test_image_and_video_studios_expose_cloud_generation_on_mobile_and_desktop(self):
        image = (ROOT / "media-studio.html").read_text(encoding="utf-8")
        video = (ROOT / "video-studio.html").read_text(encoding="utf-8")
        for marker in ("cloudImagePrompt", "cloudImageGenerate", "cloudImageResult", "shif-a-cloud-media.js"):
            self.assertIn(marker, image)
        for marker in ("cloudVideoPrompt", "cloudVideoGenerate", "cloudVideoResult", "shif-a-cloud-media.js"):
            self.assertIn(marker, video)
        self.assertIn('name="viewport"', image)
        self.assertIn('name="viewport"', video)

    def test_browser_client_requires_verified_session_and_never_contains_provider_secret(self):
        client = (ROOT / "scripts/shif-a-cloud-media.js").read_text(encoding="utf-8")
        self.assertIn("requireSession()", client)
        self.assertIn("auth.session.access_token", client)
        self.assertIn("/functions/v1/shif-a-media-gateway", client)
        self.assertNotIn("SHIF_A_REPLICATE_API_TOKEN", client)
        self.assertNotIn("Bearer r8_", client)

    def test_gateway_requires_server_secrets_and_verified_user(self):
        gateway = (ROOT / "supabase/functions/shif-a-media-gateway/index.ts").read_text(encoding="utf-8")
        self.assertIn("SHIF_A_REPLICATE_API_TOKEN", gateway)
        self.assertIn("SHIF_A_MEDIA_TASK_SECRET", gateway)
        self.assertIn("auth.auth.getUser(jwt)", gateway)
        self.assertIn("email_confirmed_at", gateway)
        self.assertIn("makeTaskToken", gateway)
        self.assertIn("readTaskToken", gateway)

    def test_gateway_validates_prompts_and_media_parameters(self):
        gateway = (ROOT / "supabase/functions/shif-a-media-gateway/index.ts").read_text(encoding="utf-8")
        self.assertIn("prompt.length > 1800", gateway)
        self.assertIn('["1:1", "16:9", "9:16", "4:5", "3:2", "2:3"]', gateway)
        self.assertIn("[5, 10].includes(duration)", gateway)
        self.assertIn("Unsupported video aspect ratio", gateway)

    def test_provider_not_enabled_without_server_configuration(self):
        gateway = (ROOT / "supabase/functions/shif-a-media-gateway/index.ts").read_text(encoding="utf-8")
        self.assertIn("No provider has been activated.", gateway)
        self.assertIn("SHIF_A_REPLICATE_IMAGE_MODEL", gateway)
        self.assertIn("SHIF_A_REPLICATE_VIDEO_MODEL", gateway)

if __name__ == "__main__":
    unittest.main()
