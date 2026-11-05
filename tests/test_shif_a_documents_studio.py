import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ShifADocumentsStudioTests(unittest.TestCase):
    def test_document_editor_restores_and_saves_local_drafts(self):
        js = (ROOT / "scripts/shif-a-documents-studio.js").read_text(encoding="utf-8")
        self.assertIn('const STORAGE_KEY="shifA.documentsStudio.draft.v1"', js)
        self.assertIn("function saveDraft()", js)
        self.assertIn("function restoreDraft()", js)
        self.assertIn('localStorage.setItem(STORAGE_KEY', js)
        self.assertIn('localStorage.getItem(STORAGE_KEY)', js)
        self.assertIn('localStorage.removeItem(STORAGE_KEY)', js)
        self.assertIn(r"split(/\s+/u)", js)
        self.assertIn(r'title+"\n"', js)
        self.assertIn(r"[^\p{L}\p{N}-]+", js)

    def test_document_studio_has_saved_document_library(self):
        js = (ROOT / "scripts/shif-a-documents-studio.js").read_text(encoding="utf-8")
        html = (ROOT / "documents-studio.html").read_text(encoding="utf-8")
        self.assertIn('const LIBRARY_KEY="shifA.documentsStudio.library.v1"', js)
        self.assertIn("function saveToLibrary()", js)
        self.assertIn("function renderLibrary()", js)
        self.assertIn("function openLibraryDocument(", js)
        self.assertIn("function deleteLibraryDocument(", js)
        self.assertIn("MAX_LIBRARY_ITEMS=30", js)
        self.assertIn('id="saveLibraryBtn"', html)
        self.assertIn('id="documentLibrary"', html)
        self.assertIn("local browser", html.lower())

    def test_pdf_import_extracts_text_in_browser_with_limits(self):
        js = (ROOT / "scripts/shif-a-documents-studio.js").read_text(encoding="utf-8")
        html = (ROOT / "documents-studio.html").read_text(encoding="utf-8")
        self.assertIn("async function importPdfFile(", js)
        self.assertIn("MAX_PDF_BYTES=20971520", js)
        self.assertIn("MAX_PDF_PAGES=100", js)
        self.assertIn("pdfjsLib.getDocument", js)
        self.assertIn('id="pdfImportInput"', html)
        self.assertIn("pdf.min.js", html)
        self.assertIn("PDF text extraction happens locally", html)

    def test_pdf_merge_and_page_range_split_are_available_locally(self):
        js = (ROOT / "scripts/shif-a-documents-studio.js").read_text(encoding="utf-8")
        html = (ROOT / "documents-studio.html").read_text(encoding="utf-8")
        self.assertIn("async function mergePdfFiles(", js)
        self.assertIn("async function splitPdfFile(", js)
        self.assertIn("MAX_PDF_INPUT_FILES=10", js)
        self.assertIn("parsePageRanges(", js)
        self.assertIn('id="pdfMergeInput"', html)
        self.assertIn('id="mergePdfBtn"', html)
        self.assertIn('id="pdfSplitInput"', html)
        self.assertIn('id="splitPdfBtn"', html)
        self.assertIn("pdf-lib", html)
        self.assertEqual(html.count("pdf.min.js"), 1)

    def test_document_studio_explains_local_draft_persistence(self):
        html = (ROOT / "documents-studio.html").read_text(encoding="utf-8")
        self.assertIn("local browser", html.lower())
        self.assertIn('id="docStatus"', html)

    def test_scanned_pdf_ocr_is_opt_in_local_and_bounded(self):
        js = (ROOT / "scripts/shif-a-documents-studio.js").read_text(encoding="utf-8")
        html = (ROOT / "documents-studio.html").read_text(encoding="utf-8")
        self.assertIn("async function runPdfOcr(", js)
        self.assertIn("MAX_OCR_PAGES=5", js)
        self.assertIn("MAX_OCR_PDF_BYTES=10485760", js)
        self.assertIn("Tesseract.createWorker", js)
        self.assertIn("pdfjsLib.getDocument", js)
        self.assertIn('id="ocrLanguage"', html)
        self.assertIn('id="ocrPageCount"', html)
        self.assertIn('id="runPdfOcrBtn"', html)
        self.assertIn("tesseract.js", html.lower())
        self.assertIn("OCR आपके browser में चलता है", html)


if __name__ == "__main__":
    unittest.main()
