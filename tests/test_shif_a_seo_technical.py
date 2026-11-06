"""Technical SEO contracts for public and private SHIF-A pages."""

from __future__ import annotations

import re
import unittest
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


BASE_URL = "https://trademalikk-svg.github.io/clipx-ai-studio/"
SITEMAP_NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
PRIVATE_PAGES = (
    "admin.html",
    "growth-manager.html",
    "owner-security.html",
    "web-manager.html",
)


class HeadMetadataParser(HTMLParser):
    """Collect document language and SEO metadata without third-party packages."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.lang = ""
        self.title = ""
        self.in_title = False
        self.meta: dict[tuple[str, str], str] = {}
        self.links: list[dict[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        if tag.lower() == "html":
            self.lang = values.get("lang", "").strip()
        elif tag.lower() == "title":
            self.in_title = True
        elif tag.lower() == "meta":
            for key in ("name", "property", "http-equiv"):
                if values.get(key):
                    self.meta[(key, values[key].lower())] = values.get("content", "").strip()
        elif tag.lower() == "link":
            self.links.append(values)

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title += data


def read_metadata(relative_path: str) -> tuple[str, HeadMetadataParser]:
    html = Path(relative_path).read_text(encoding="utf-8")
    parser = HeadMetadataParser()
    parser.feed(html)
    return html, parser


def get_meta(parser: HeadMetadataParser, key: str, value: str) -> str:
    return parser.meta.get((key, value), "")


class TechnicalSEOTests(unittest.TestCase):
    def test_sitemap_urls_are_unique_absolute_and_inside_project_base(self) -> None:
        root = ET.parse("sitemap.xml").getroot()
        urls = [
            node.text or ""
            for node in root.findall("sm:url/sm:loc", SITEMAP_NS)
        ]
        self.assertTrue(urls, "Sitemap must contain public URLs")
        self.assertEqual(len(urls), len(set(urls)), "Sitemap URLs must be unique")
        for url in urls:
            self.assertTrue(url.startswith(BASE_URL), f"URL outside project base: {url}")
            parsed = urlsplit(url)
            self.assertEqual(parsed.scheme, "https", url)
            self.assertTrue(parsed.netloc, url)
            self.assertFalse(parsed.query or parsed.fragment, url)

    def test_sitemap_targets_exist_and_exclude_private_pages(self) -> None:
        root = ET.parse("sitemap.xml").getroot()
        urls = {
            node.text or ""
            for node in root.findall("sm:url/sm:loc", SITEMAP_NS)
        }
        for url in urls:
            relative = url.removeprefix(BASE_URL) or "index.html"
            self.assertTrue(Path(relative).is_file(), f"Missing sitemap target: {relative}")
        for private_page in PRIVATE_PAGES:
            self.assertNotIn(BASE_URL + private_page, urls)

    def test_every_sitemap_page_has_complete_self_canonical_metadata(self) -> None:
        root = ET.parse("sitemap.xml").getroot()
        urls = [
            node.text or ""
            for node in root.findall("sm:url/sm:loc", SITEMAP_NS)
        ]
        for url in urls:
            relative = url.removeprefix(BASE_URL) or "index.html"
            with self.subTest(page=relative):
                _, parser = read_metadata(relative)
                self.assertTrue(parser.title.strip(), "Missing page title")
                self.assertTrue(
                    get_meta(parser, "name", "description"),
                    "Missing meta description",
                )
                self.assertRegex(parser.lang, r"^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$")
                canonicals = [
                    link.get("href", "").strip()
                    for link in parser.links
                    if link.get("rel", "").lower().split() == ["canonical"]
                ]
                self.assertEqual(canonicals, [url], "Expected one self-referencing canonical")
                self.assertNotIn(
                    "noindex",
                    get_meta(parser, "name", "robots").lower(),
                    "Public sitemap page must not be noindex",
                )

    def test_hreflang_targets_exist_and_translated_pairs_are_reciprocal(self) -> None:
        root = ET.parse("sitemap.xml").getroot()
        sitemap_urls = {
            node.text or ""
            for node in root.findall("sm:url/sm:loc", SITEMAP_NS)
        }
        alternate_map: dict[str, list[tuple[str, str]]] = {}
        for url in sitemap_urls:
            relative = url.removeprefix(BASE_URL) or "index.html"
            _, parser = read_metadata(relative)
            alternates = []
            for link in parser.links:
                if link.get("rel", "").lower().split() == ["alternate"] and link.get("hreflang"):
                    target = link.get("href", "").strip()
                    self.assertIn(target, sitemap_urls, f"hreflang target missing from sitemap: {target}")
                    alternates.append((link["hreflang"].lower(), target))
            alternate_map[url] = alternates

        for source, alternates in alternate_map.items():
            for language, target in alternates:
                with self.subTest(source=source, target=target, language=language):
                    target_relative = target.removeprefix(BASE_URL) or "index.html"
                    _, target_parser = read_metadata(target_relative)
                    reciprocal = [
                        (link.get("hreflang", "").lower(), link.get("href", "").strip())
                        for link in target_parser.links
                        if link.get("rel", "").lower().split() == ["alternate"]
                        and link.get("hreflang")
                    ]
                    self.assertIn((language, source), reciprocal)

    def test_robots_points_to_sitemap_without_blocking_public_assets_or_private_noindex(self) -> None:
        robots = Path("robots.txt").read_text(encoding="utf-8")
        self.assertIn("Sitemap: " + BASE_URL + "sitemap.xml", robots)
        directives = [
            line.strip().lower()
            for line in robots.splitlines()
            if line.strip().lower().startswith("disallow:")
        ]
        self.assertNotIn("disallow: /", directives)
        self.assertFalse(
            any(
                directive in {"disallow: /assets/", "disallow: /scripts/", "disallow: /styles/"}
                for directive in directives
            ),
            "robots.txt must not block public assets",
        )
        self.assertFalse(
            any(
                re.search(r"/(?:admin|growth-manager|owner-security|web-manager)\.html", directive)
                for directive in directives
            ),
            "Private pages must remain crawlable so crawlers can read their noindex directive",
        )

    def test_private_owner_pages_remain_noindex_nofollow(self) -> None:
        for relative in PRIVATE_PAGES:
            with self.subTest(page=relative):
                self.assertTrue(Path(relative).is_file())
                _, parser = read_metadata(relative)
                robots = get_meta(parser, "name", "robots").lower()
                self.assertIn("noindex", robots)
                self.assertIn("nofollow", robots)


if __name__ == "__main__":
    unittest.main()
