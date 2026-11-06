"""Contract tests for evidence-backed SHIF-A keyword and content data."""
from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://trademalikk-svg.github.io/clipx-ai-studio/"


class KeywordContentContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((ROOT / "data/shif-a-keywords.json").read_text(encoding="utf-8"))
        cls.keywords = cls.data["keywords"]
        cls.registry = (ROOT / "scripts/shif-a-tools.js").read_text(encoding="utf-8")
        cls.directory = (ROOT / "ai-tools.html").read_text(encoding="utf-8")

    def test_every_keyword_has_explicit_evidence_and_market_fields(self):
        required = ("keyword", "language", "intent", "targetPage", "checkedAt",
                    "verificationStatus", "market", "evidenceType")
        allowed_status = {"verified", "candidate", "unverified", "rejected"}
        for item in self.keywords:
            for field in required:
                with self.subTest(keyword=item.get("keyword"), field=field):
                    self.assertTrue(item.get(field), f"Missing {field}")
            self.assertIn(item["verificationStatus"], allowed_status)
            self.assertIn(item["language"], {"en", "hi"})

    def test_unverified_terms_are_not_presented_as_measured_or_verified(self):
        for item in self.keywords:
            if item["verificationStatus"] in {"candidate", "unverified"}:
                self.assertNotIn("searchVolume", item)
                self.assertNotIn("monthlySearches", item)
                self.assertNotEqual(item.get("trendStatus"), "verified-rising")

    def test_each_keyword_target_is_an_existing_public_html_page(self):
        for item in self.keywords:
            target = item["targetPage"]
            self.assertFalse(target.startswith("/"))
            self.assertFalse(".." in Path(target).parts)
            self.assertTrue((ROOT / target).is_file(), f"Missing target page: {target}")

    def test_each_target_page_has_at_most_one_primary_keyword(self):
        primary_by_page = {}
        for item in self.keywords:
            if item.get("clusterRole") == "primary":
                page = item["targetPage"]
                self.assertNotIn(page, primary_by_page, f"Duplicate primary cluster for {page}")
                primary_by_page[page] = item["keyword"]

    def test_public_tool_directory_uses_registry_status_and_explains_states(self):
        self.assertIn('state.textContent=t.status.replace("-", " ")', self.registry)
        self.assertIn('className="state "+t.status', self.registry)
        for phrase in ("Available", "Limited", "Coming soon"):
            self.assertIn(phrase.casefold(), self.directory.casefold())

    def test_candidate_keywords_do_not_claim_shif_a_has_cloud_ai_generation(self):
        for item in self.keywords:
            if item["targetPage"] in {"index.html", "ai-tools.html"}:
                self.assertNotRegex(item.get("editorialCaveat", ""), re.compile(r"cloud ai generation is available", re.I))


if __name__ == "__main__":
    unittest.main()
