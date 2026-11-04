import unittest

from scripts.daily_seo import validate_metadata, replace_homepage_metadata, parse_trends


class DailySeoTests(unittest.TestCase):
    def test_metadata_accepts_grounded_title_and_description(self):
        metadata = {
            "title": "Free Video Editor for Shorts & Reels | ClipX",
            "description": "Trim and split videos, prepare captions, subtitles and thumbnails with ClipX browser-based creator tools."
        }
        self.assertEqual(validate_metadata(metadata), metadata)

    def test_metadata_rejects_unavailable_cloud_rendering_claim(self):
        metadata = {
            "title": "Unlimited AI Cloud Video Editor | ClipX",
            "description": "Create unlimited videos with instant cloud rendering and automatic AI highlights in ClipX."
        }
        with self.assertRaises(ValueError):
            validate_metadata(metadata)

    def test_replace_updates_only_title_and_description(self):
        html = '<title>Old title</title>\n<meta name="description" content="Old description">\n<p>Keep me</p>'
        updated = replace_homepage_metadata(html, {
            "title": "ClipX Video Tools for Shorts and Reels",
            "description": "Trim videos, prepare subtitles and create thumbnails with ClipX browser-based creator tools."
        })
        self.assertIn('<title>ClipX Video Tools for Shorts and Reels</title>', updated)
        self.assertIn('content="Trim videos, prepare subtitles and create thumbnails with ClipX browser-based creator tools."', updated)
        self.assertIn('<p>Keep me</p>', updated)

    def test_trends_parser_deduplicates_and_limits(self):
        xml = '<rss><channel><item><title>Video editing</title></item><item><title>Shorts creator</title></item><item><title>Video editing</title></item></channel></rss>'
        self.assertEqual(parse_trends(xml, limit=2), ["Video editing", "Shorts creator"])


if __name__ == "__main__":
    unittest.main()
