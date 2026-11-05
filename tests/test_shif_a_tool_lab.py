import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ShifAToolLabContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.lab = (ROOT / "tool-lab.html").read_text(encoding="utf-8")
        cls.registry = (ROOT / "scripts/shif-a-tools.js").read_text(encoding="utf-8")

    def test_directory_links_select_the_requested_local_tool(self):
        ids = re.findall(r'id:"([a-z-]+)".*?href:"tool-lab\.html\?tool=([a-z-]+)"', self.registry)
        self.assertGreaterEqual(len(ids), 22)
        self.assertTrue(all(tool_id == target_id for tool_id, target_id in ids))

    def test_tool_lab_reads_and_validates_query_parameter(self):
        self.assertIn('new URLSearchParams(location.search).get("tool")', self.lab)
        self.assertIn("if(ids.includes(requested))tool.value=requested", self.lab)

    def test_csv_parser_supports_quoted_commas_quotes_and_newlines(self):
        self.assertIn("function parseCSV(source)", self.lab)
        self.assertIn('c===\'"\'&&source[i+1]===\'"\'', self.lab)
        self.assertIn('else if(c==="\\n")', self.lab)
        self.assertIn('if(quoted)throw Error("CSV में closing quote नहीं मिला")', self.lab)

    def test_copy_and_download_report_success_or_failure(self):
        self.assertIn("async function copyOutput()", self.lab)
        self.assertIn("Clipboard permission नहीं मिली", self.lab)
        self.assertIn("setTimeout(()=>URL.revokeObjectURL(url),1500)", self.lab)
        self.assertIn('status.textContent="Download शुरू हुआ ✓"', self.lab)

    def test_all_local_utilities_are_registered_in_tool_lab(self):
        registry_ids = re.findall(r'id:"([a-z-]+)".*?href:"tool-lab\.html\?tool=([a-z-]+)"', self.registry)
        self.assertEqual(len(registry_ids), 22)
        for tool_id, _ in registry_ids:
            self.assertIn('"'+tool_id+'"', self.lab)


if __name__ == "__main__":
    unittest.main()
