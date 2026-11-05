(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    const toolbar = document.querySelector(".toolbar");
    const editor = document.getElementById("codeEditor");
    const status = document.getElementById("status");
    if (!toolbar || !editor || !status) return;

    const panel = document.createElement("section");
    panel.style.cssText = "margin:0 0 12px;padding:14px;border:1px solid #4f306c;border-radius:14px;background:#100b21";
    const title = document.createElement("h2");
    title.textContent = "Gemini AI Coding Assistant";
    title.style.cssText = "font-size:16px;margin:0 0 8px";
    const help = document.createElement("p");
    help.textContent = "अपने active file के लिए बदलाव, bug explanation या code review माँगें। AI का सुझाव पहले नीचे देखें; Apply दबाने पर ही editor बदलेगा।";
    help.style.cssText = "color:#b8a9ca;font-size:13px;line-height:1.5";
    const prompt = document.createElement("textarea");
    prompt.maxLength = 3000;
    prompt.placeholder = "उदाहरण: इस page में mobile responsive navigation जोड़ो…";
    prompt.style.cssText = "width:100%;min-height:80px;padding:11px;border:1px solid #71449a;border-radius:9px;background:#080713;color:white;font:inherit";
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-top:9px";
    const run = document.createElement("button");
    run.type = "button";
    run.textContent = "Ask Gemini";
    const apply = document.createElement("button");
    apply.type = "button";
    apply.textContent = "Apply to active file";
    apply.className = "secondary";
    apply.disabled = true;
    const result = document.createElement("pre");
    result.style.cssText = "display:none;white-space:pre-wrap;overflow-wrap:anywhere;max-height:320px;overflow:auto;padding:12px;border:1px solid #4f306c;border-radius:9px;background:#080713;color:#d8f5ff;font:12px/1.5 ui-monospace,monospace";
    actions.append(run, apply);
    panel.append(title, help, prompt, actions, result);
    toolbar.insertAdjacentElement("afterend", panel);

    let latest = "";
    run.addEventListener("click", async function () {
      const task = prompt.value.trim();
      if (!task) { status.textContent = "पहले Gemini के लिए अपना coding task लिखें।"; return; }
      if (!window.ShifAAI) { status.textContent = "AI client load नहीं हुआ। Page refresh करें।"; return; }
      run.disabled = true;
      apply.disabled = true;
      result.style.display = "block";
      result.textContent = "Gemini से सुरक्षित request भेजी जा रही है…";
      try {
        const file = document.getElementById("activeFile").textContent || "active file";
        const current = editor.value;
        const message = [
          "You are SHIF-A's coding assistant. Help with safe, maintainable code.",
          "User task: " + task,
          "Project type: " + (document.getElementById("projectMode").value || "website"),
          "Active file: " + file,
          "Current file content:",
          current.slice(0, 2200),
          "Return a concise explanation followed by a complete replacement file inside one fenced code block. Do not claim code was executed or tested."
        ].join("\n\n");
        latest = await window.ShifAAI.request(message, "coding");
        result.textContent = latest;
        apply.disabled = !latest;
        status.textContent = "Gemini suggestion तैयार है। Apply करने से पहले पूरा output जाँचें।";
      } catch (error) {
        latest = "";
        result.textContent = error.message || "Gemini request failed.";
        status.textContent = "AI request पूरी नहीं हुई।";
      } finally {
        run.disabled = false;
      }
    });

    apply.addEventListener("click", function () {
      if (!latest) return;
      const match = latest.match(/```(?:[a-zA-Z0-9_+.-]+)?\s*([\s\S]*?)```/);
      if (!match) { status.textContent = "Output में complete code block नहीं मिला; editor नहीं बदला गया।"; return; }
      editor.value = match[1].replace(/^\n|\n$/g, "");
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      status.textContent = "Gemini code active file में apply हुआ। Save/ZIP से पहले review और test करें।";
      apply.disabled = true;
    });
  });
})();