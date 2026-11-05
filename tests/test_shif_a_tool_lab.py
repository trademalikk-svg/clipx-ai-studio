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
        ids = re.findall(r'id:"([a-z0-9-]+)".*?href:"tool-lab\.html\?tool=([a-z0-9-]+)"', self.registry)
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

    def test_csv_parser_rejects_misplaced_quotes_and_trailing_characters(self):
        self.assertIn("afterQuote", self.lab)
        self.assertIn("CSV में quote केवल field की शुरुआत में हो सकता है", self.lab)
        self.assertIn("Closing quote के बाद केवल comma या नई line मान्य है", self.lab)

    def test_image_info_limits_file_size_and_ignores_stale_loads(self):
        self.assertIn("MAX_IMAGE_BYTES", self.lab)
        self.assertIn("imageRequestId", self.lab)
        self.assertIn("requestId!==imageRequestId", self.lab)

    def test_base64_tool_has_explicit_encode_and_decode_modes(self):
        self.assertIn('id="base64Mode"', self.lab)
        self.assertIn('case"base64":{const mode=$("base64Mode").value', self.lab)
        self.assertIn("TextEncoder", self.lab)
        self.assertIn("TextDecoder", self.lab)
        self.assertIn("Invalid Base64 input", self.lab)

    def test_regex_runs_in_a_terminable_worker_with_input_limits(self):
        self.assertIn("new Worker(workerUrl)", self.lab)
        self.assertIn("setTimeout(()=>", self.lab)
        self.assertIn("worker.terminate()", self.lab)
        self.assertIn("REGEX_MAX_INPUT", self.lab)
        self.assertIn("REGEX_MAX_PATTERN", self.lab)

    def test_copy_and_download_report_success_or_failure(self):
        self.assertIn("async function copyOutput()", self.lab)
        self.assertIn("Clipboard permission नहीं मिली", self.lab)
        self.assertIn("setTimeout(()=>URL.revokeObjectURL(url),1500)", self.lab)
        self.assertIn('status.textContent="Download शुरू हुआ ✓"', self.lab)

    def test_all_local_utilities_are_registered_in_tool_lab(self):
        registry_ids = re.findall(r'id:"([a-z0-9-]+)".*?href:"tool-lab\.html\?tool=([a-z0-9-]+)"', self.registry)
        self.assertEqual(len(registry_ids), 22)
        for tool_id, _ in registry_ids:
            self.assertIn('"'+tool_id+'"', self.lab)


if __name__ == "__main__":
    unittest.main()
