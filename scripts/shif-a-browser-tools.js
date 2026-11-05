(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const text = () => $("textInput").value;
  let selectedImage = null;

  function updateStats() {
    const value = text();
    const words = value.trim() ? value.trim().split(/\\s+/u).length : 0;
    const sentences = value.trim() ? (value.match(/[.!?।]+/g) || []).length : 0;
    $("textStats").textContent = words + " words · " + value.length + " characters · " + sentences + " sentences";
  }
  $("textInput").addEventListener("input", updateStats);
  $("upperBtn").addEventListener("click", () => { $("textInput").value = text().toLocaleUpperCase(); updateStats(); });
  $("lowerBtn").addEventListener("click", () => { $("textInput").value = text().toLocaleLowerCase(); updateStats(); });
  $("titleBtn").addEventListener("click", () => {
    $("textInput").value = text().toLocaleLowerCase().replace(/(^|\\s|[-'])\\p{L}/gu, m => m.toLocaleUpperCase());
    updateStats();
  });
  $("copyTextBtn").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(text()); $("textStats").textContent = $("textStats").textContent + " · Copied"; }
    catch { $("textStats").textContent = "Clipboard permission unavailable. Select and copy manually."; }
  });

  function makeCaptions(value, max) {
    const words = value.trim().split(/\\s+/u).filter(Boolean), lines = [];
    let line = "";
    for (const word of words) {
      if (word.length > max) {
        if (line) { lines.push(line); line = ""; }
        for (let i = 0; i < word.length; i += max) lines.push(word.slice(i, i + max));
        continue;
      }
      const next = line ? line + " " + word : word;
      if (next.length > max) { lines.push(line); line = word; } else line = next;
    }
    if (line) lines.push(line);
    return lines.join("\\n");
  }
  $("formatCaptionBtn").addEventListener("click", () => {
    const max = Math.max(12, Math.min(48, Number($("lineLength").value) || 32));
    $("captionOutput").textContent = makeCaptions($("captionInput").value, max) || "पहले caption text डालें।";
    $("captionStatus").textContent = "";
  });
  $("copyCaptionBtn").addEventListener("click", async () => {
    const value = $("captionOutput").textContent;
    if (!value || value === "Formatted captions यहाँ दिखेंगे।" || value === "पहले caption text डालें।") {
      $("captionStatus").textContent = "पहले captions format करें।"; return;
    }
    try { await navigator.clipboard.writeText(value); $("captionStatus").textContent = "Captions copied."; }
    catch { $("captionStatus").textContent = "Clipboard unavailable; output manually select करें।"; }
  });

  let jsonResult = "";
  function parseJson() {
    try { return { ok: true, parsed: JSON.parse($("jsonInput").value) }; }
    catch (error) { return { ok: false, error }; }
  }
  function renderJson(minify) {
    const result = parseJson();
    if (!result.ok) {
      jsonResult = "";
      $("jsonOutput").textContent = "Invalid JSON";
      $("jsonStatus").textContent = result.error.message;
      return;
    }
    jsonResult = JSON.stringify(result.parsed, null, minify ? 0 : 2);
    $("jsonOutput").textContent = jsonResult;
    $("jsonStatus").textContent = minify ? "Valid minified JSON ✓" : "Valid JSON ✓";
  }
  $("formatJsonBtn").addEventListener("click", () => renderJson(false));
  $("minifyJsonBtn").addEventListener("click", () => renderJson(true));
  $("copyJsonBtn").addEventListener("click", async () => {
    if (!jsonResult) { $("jsonStatus").textContent = "पहले valid JSON format करें।"; return; }
    try { await navigator.clipboard.writeText(jsonResult); $("jsonStatus").textContent = "JSON copied."; }
    catch { $("jsonStatus").textContent = "Clipboard unavailable; result manually select करें।"; }
  });

  function releaseSelectedImage() {
    if (selectedImage) URL.revokeObjectURL(selectedImage.url);
    selectedImage = null;
  }
  $("imageFile").addEventListener("change", () => {
    releaseSelectedImage();
    $("imageStatus").textContent = "";
    $("imageWidth").value = "";
    $("imageHeight").value = "";
    const file = $("imageFile").files[0];
    if (!file) { $("imageInfo").textContent = "No image selected."; return; }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      $("imageInfo").textContent = "Please choose PNG, JPEG or WebP."; return;
    }
    if (file.size > 15 * 1024 * 1024) {
      $("imageInfo").textContent = "Please choose an image under 15 MB."; return;
    }
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      selectedImage = { file, img, url };
      $("imageWidth").value = img.naturalWidth;
      $("imageHeight").value = img.naturalHeight;
      $("imageInfo").textContent = img.naturalWidth + " × " + img.naturalHeight + " px · " + (file.size / 1024).toFixed(1) + " KB";
    };
    img.onerror = () => { URL.revokeObjectURL(url); $("imageInfo").textContent = "Image could not be opened."; };
    img.src = url;
  });
  $("imageWidth").addEventListener("input", () => {
    if (!$("keepRatio").checked || !selectedImage) return;
    const width = Number($("imageWidth").value);
    if (width > 0) $("imageHeight").value = Math.round(width * selectedImage.img.naturalHeight / selectedImage.img.naturalWidth);
  });
  $("imageHeight").addEventListener("input", () => {
    if (!$("keepRatio").checked || !selectedImage) return;
    const height = Number($("imageHeight").value);
    if (height > 0) $("imageWidth").value = Math.round(height * selectedImage.img.naturalWidth / selectedImage.img.naturalHeight);
  });
  $("resizeImageBtn").addEventListener("click", () => {
    if (!selectedImage) { $("imageStatus").textContent = "पहले valid image चुनें।"; return; }
    const width = Number($("imageWidth").value), height = Number($("imageHeight").value);
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 6000 || height > 6000) {
      $("imageStatus").textContent = "Width और height 1 से 6000 px के बीच दें।"; return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) { $("imageStatus").textContent = "Canvas उपलब्ध नहीं है।"; return; }
    context.drawImage(selectedImage.img, 0, 0, width, height);
    const type = selectedImage.file.type;
    canvas.toBlob(blob => {
      if (!blob) { $("imageStatus").textContent = "Image export नहीं हो सका।"; return; }
      const url = URL.createObjectURL(blob), anchor = document.createElement("a");
      const extension = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
      anchor.href = url; anchor.download = "shif-a-resized." + extension;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      $("imageStatus").textContent = "Resized image download शुरू हुआ।";
    }, type, type === "image/jpeg" ? 0.9 : undefined);
  });
  window.addEventListener("beforeunload", releaseSelectedImage);
  updateStats();
})();