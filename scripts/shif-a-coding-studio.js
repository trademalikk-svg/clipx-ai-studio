(function () {
  "use strict";

  const LOCAL_TEMPLATE_MODE = true;
  const byId = (id) => document.getElementById(id);
  const state = { mode: "website", files: {}, activeFile: "" };

  const websiteTemplate = () => ({
    "index.html": `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Website</title><link rel="stylesheet" href="style.css"></head>
<body><main class="hero"><p class="eyebrow">YOUR BRAND</p><h1>Build something useful.</h1><p>Edit this starter website in SHIF-A Coding Studio.</p><a class="button" href="#about">Explore</a></main><section id="about"><h2>About this project</h2><p>Replace this text with your own content.</p></section><script src="app.js"><\/script></body></html>`,
    "style.css": `*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:#f4f3ff;color:#211b35}.hero{min-height:70vh;padding:12vh 9vw;background:linear-gradient(130deg,#24124b,#6241ad);color:white}.eyebrow{letter-spacing:3px;font-size:12px}.hero h1{font-size:clamp(38px,7vw,72px);max-width:780px}.hero p{line-height:1.7}.button{display:inline-block;padding:13px 20px;border-radius:30px;background:#fff;color:#39236d;text-decoration:none;font-weight:bold}section#about{padding:50px 9vw;line-height:1.7}`,
    "app.js": `document.querySelector(".button")?.addEventListener("click",()=>console.log("Welcome to your new website!"));`,
    "README.md": `# My Website\n\nEdit index.html, style.css and app.js. Open index.html in a browser to run the project.\n\nThis starter was created locally in SHIF-A Coding Studio.\n`
  });

  const androidTemplate = () => ({
    "settings.gradle.kts": `pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
dependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }
rootProject.name = "ShifAStarter"
include(":app")
`,
    "build.gradle.kts": `plugins {
    id("com.android.application") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
}
`,
    "app/build.gradle.kts": `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}
android {
    namespace = "com.shifa.starter"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.shifa.starter"
        minSdk = 23
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"
    }
}
`,
    "app/src/main/AndroidManifest.xml": `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:theme="@android:style/Theme.Material.Light.NoActionBar" android:label="SHIF-A Starter">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
`,
    "app/src/main/java/com/shifa/starter/MainActivity.kt": `package com.shifa.starter

import android.app.Activity
import android.os.Bundle
import android.view.Gravity
import android.widget.TextView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val message = TextView(this).apply {
            text = "Welcome to your Android app"
            textSize = 22f
            gravity = Gravity.CENTER
            setPadding(24, 24, 24, 24)
        }
        setContentView(message)
    }
}
`,
    "README.md": `# SHIF-A Android Starter\n\nThis is a Kotlin Android source project. Open the folder in Android Studio with a compatible Android Gradle Plugin and SDK.\n\nSHIF-A exports source files only. APK compilation, signing and Play Store publication are not performed in this browser workbench.\n`
  });

  function setStatus(message) { byId("status").textContent = message; }
  function fileNames() { return Object.keys(state.files); }

  function renderFileList() {
    const list = byId("fileList");
    list.replaceChildren();
    fileNames().forEach((name) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "file-button" + (name === state.activeFile ? " active" : "");
      button.textContent = name;
      button.addEventListener("click", () => selectFile(name));
      list.appendChild(button);
    });
    byId("fileCount").textContent = fileNames().length + " files";
  }

  function selectFile(name) {
    if (!Object.prototype.hasOwnProperty.call(state.files, name)) return;
    state.activeFile = name;
    byId("activeFile").textContent = name;
    byId("codeEditor").value = state.files[name];
    renderFileList();
    scheduleAutoSave();
  }

  function safeInline(value, closingTag) {
    const escaped = closingTag === "script" ? "<\\/script" : "<\\/style";
    return String(value).replace(new RegExp("</" + closingTag, "gi"), escaped);
  }

  function renderPreview() {
    const isAndroid = state.mode === "android";
    byId("previewFrame").hidden = isAndroid;
    byId("androidPreview").hidden = !isAndroid;
    byId("previewTitle").textContent = isAndroid ? "Android project preview" : "Live website preview";
    if (isAndroid) {
      const preview = byId("androidPreview");
      preview.replaceChildren();
      const heading = document.createElement("h3");
      heading.textContent = "Android source project";
      const description = document.createElement("p");
      description.textContent = "This project contains Kotlin source, Android manifest and Gradle configuration. APK compilation is not available in this browser-only free MVP.";
      const files = document.createElement("pre");
      files.textContent = fileNames().join("\n");
      preview.append(heading, description, files);
      return;
    }
    const html = state.files["index.html"] || "<h1>Create a website project</h1>";
    const css = safeInline(state.files["style.css"] || "", "style");
    const script = safeInline(state.files["app.js"] || "", "script");
    const documentHtml = html
      .replace(/<link[^>]+href=["']style\.css["'][^>]*>/i, "")
      .replace(/<script[^>]+src=["']app\.js["'][^>]*><\/script>/i, "")
      .replace(/<\/head>/i, "<style>" + css + "</style></head>")
      .replace(/<\/body>/i, "<script>" + script + "</script></body>");
    byId("previewFrame").srcdoc = documentHtml;
  }

  function createProject(mode) {
    state.mode = mode;
    state.files = mode === "android" ? androidTemplate() : websiteTemplate();
    state.activeFile = fileNames()[0] || "";
    byId("codeEditor").disabled = false;
    selectFile(state.activeFile);
    renderPreview();
    saveProject({ quiet: true });
    setStatus(mode === "android"
      ? "Android starter source project created locally. No APK has been compiled."
      : "Website starter created locally. Edit the files and preview your changes.");
  }

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function zipProject(files) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let localOffset = 0;
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    const dosDate = ((Math.max(1980, now.getFullYear()) - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

    for (const [name, content] of Object.entries(files)) {
      const nameBytes = encoder.encode(name);
      const data = encoder.encode(content);
      const checksum = crc32(data);
      const local = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);
      lv.setUint16(6, 0x0800, true);
      lv.setUint16(8, 0, true);
      lv.setUint16(10, dosTime, true);
      lv.setUint16(12, dosDate, true);
      lv.setUint32(14, checksum, true);
      lv.setUint32(18, data.length, true);
      lv.setUint32(22, data.length, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      local.set(nameBytes, 30);
      localParts.push(local, data);

      const central = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(central.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, dosTime, true);
      cv.setUint16(14, dosDate, true);
      cv.setUint32(16, checksum, true);
      cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, localOffset, true);
      central.set(nameBytes, 46);
      centralParts.push(central);
      localOffset += local.length + data.length;
    }

    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, centralParts.length, true);
    ev.setUint16(10, centralParts.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, localOffset, true);
    ev.setUint16(20, 0, true);
    return new Blob([...localParts, ...centralParts, end], { type: "application/zip" });
  }

  const STORAGE_KEY = "shifA.codingStudio.project.v1";
  let autoSaveTimer = null;
  const MAX_PROJECT_BYTES = 1500000;

  function scheduleAutoSave() {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      autoSaveTimer = null;
      saveProject({ quiet: true });
    }, 350);
  }

  function saveProject(options = {}) {
    const quiet = options.quiet === true;
    if (!fileNames().length) {
      setStatus("पहले starter project बनाएँ।");
      return;
    }
    try {
      const saved = { version: 1, mode: state.mode, files: state.files, activeFile: state.activeFile, savedAt: new Date().toISOString() };
      const serialized = JSON.stringify(saved);
      if (serialized.length > MAX_PROJECT_BYTES) {
        if (!quiet) setStatus("Project browser की local storage सीमा से बड़ा है। ZIP export इस्तेमाल करें।");
        return false;
      }
      localStorage.setItem(STORAGE_KEY, serialized);
      if (!quiet) setStatus("Project इसी device के browser में save हो गया। Browser data clear करने पर यह मिट सकता है।");
      return true;
    } catch (error) {
      if (!quiet) setStatus("इस device पर save नहीं हो पाया। Storage full या browser storage disabled हो सकता है। ZIP export इस्तेमाल करें।");
      return false;
    }
  }

  function restoreProject(options = {}) {
    const quiet = options.quiet === true;
    let saved;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        if (!quiet) setStatus("इस browser में कोई saved project नहीं मिला।");
        return false;
      }
      saved = JSON.parse(raw);
    } catch (error) {
      if (!quiet) setStatus("Saved project पढ़ा नहीं जा सका। ZIP export backup इस्तेमाल करें।");
      return false;
    }
    if (!saved || saved.version !== 1 || !["website", "android"].includes(saved.mode) ||
        !saved.files || typeof saved.files !== "object" || Array.isArray(saved.files) ||
        Object.keys(saved.files).length > 100 ||
        !Object.entries(saved.files).every(([name, value]) =>
          typeof name === "string" && name.length > 0 && name.length <= 180 &&
          !name.startsWith("/") && !name.split("/").includes("..") &&
          typeof value === "string" && value.length <= MAX_PROJECT_BYTES) ||
        JSON.stringify(saved).length > MAX_PROJECT_BYTES) {
      if (!quiet) setStatus("Saved project format मान्य नहीं है।");
      return false;
    }
    state.mode = saved.mode;
    state.files = saved.files;
    state.activeFile = Object.prototype.hasOwnProperty.call(state.files, saved.activeFile)
      ? saved.activeFile : (fileNames()[0] || "");
    byId("projectMode").value = state.mode;
    if (state.activeFile) selectFile(state.activeFile);
    else {
      byId("codeEditor").value = "";
      byId("activeFile").textContent = "No file";
      renderFileList();
    }
    renderPreview();
    if (!quiet) setStatus("इस device पर save किया गया project restore हो गया।");
    return true;
  }

  function exportProject() {
    if (!fileNames().length) {
      setStatus("पहले starter project बनाएँ।");
      return;
    }
    const blob = zipProject(state.files);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = state.mode === "android" ? "shif-a-android-project.zip" : "shif-a-website-project.zip";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    setStatus("ZIP source project export शुरू किया गया।");
  }

  function boot() {
    if (!LOCAL_TEMPLATE_MODE) {
      setStatus("AI generation is not connected.");
    } else {
      setStatus("Free local template mode. AI generation is not connected.");
    }
    byId("buildButton").addEventListener("click", () => createProject(byId("projectMode").value));
    byId("resetButton").addEventListener("click", () => createProject(state.mode));
    byId("saveButton").addEventListener("click", () => saveProject());
    byId("restoreButton").addEventListener("click", () => restoreProject());
    byId("exportButton").addEventListener("click", exportProject);
    byId("codeEditor").addEventListener("input", () => {
      if (!state.activeFile) return;
      state.files[state.activeFile] = byId("codeEditor").value;
      if (state.mode === "website" && ["index.html", "style.css", "app.js"].includes(state.activeFile)) renderPreview();
      setStatus("Autosaving locally: " + state.activeFile);
      scheduleAutoSave();
    });
    if (!restoreProject({ quiet: true })) createProject("website");
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
