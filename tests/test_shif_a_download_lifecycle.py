import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

DOWNLOAD_SCRIPTS = (
    "scripts/shif-a-research-studio.js",
    "scripts/shif-a-agents-studio.js",
    "scripts/shif-a-automation-studio.js",
    "scripts/shif-a-documents-studio.js",
    "scripts/shif-a-education-studio.js",
    "scripts/shif-a-productivity-studio.js",
    "scripts/shif-a-coding-studio.js",
)


class DownloadLifecycleTests(unittest.TestCase):
    def test_download_object_urls_are_not_revoked_synchronously(self):
        for relative_path in DOWNLOAD_SCRIPTS:
            with self.subTest(script=relative_path):
                source = (ROOT / relative_path).read_text(encoding="utf-8")
                self.assertIn("setTimeout(()=>URL.revokeObjectURL(url),1500)", source,
                              "Downloaded object URLs should remain valid briefly for mobile browsers.")
                self.assertNotIn("URL.revokeObjectURL(url);", source,
                                 "Immediate revocation can interrupt a download before the browser consumes it.")


if __name__ == "__main__":
    unittest.main()
