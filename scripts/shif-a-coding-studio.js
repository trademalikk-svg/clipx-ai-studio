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
    setStatus(mode === "android"
      ? "Android starter source project created locally. No APK has been compiled."
      : "Website starter created locally. Edit the files and preview your changes.");
  }

  function exportProject() {
    if (!fileNames().length) {
      setStatus("पहले starter project बनाएँ।");
      return;
    }
    const bundle = {
      format: "shif-a-project-bundle",
      version: 1,
      projectType: state.mode,
      exportedAt: new Date().toISOString(),
      files: state.files,
      notes: state.mode === "android"
        ? ["Source files only.", "Open in Android Studio with compatible Android SDK and Gradle.", "APK compilation and signing are not performed here."]
        : ["Static website source bundle.", "Open index.html in a browser.", "No hosting service is activated by this export."]
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = state.mode === "android" ? "shif-a-android-project.json" : "shif-a-website-project.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Project source bundle export शुरू किया गया।");
  }

  function boot() {
    if (!LOCAL_TEMPLATE_MODE) {
      setStatus("AI generation is not connected.");
    } else {
      setStatus("Free local template mode. AI generation is not connected.");
    }
    byId("buildButton").addEventListener("click", () => createProject(byId("projectMode").value));
    byId("resetButton").addEventListener("click", () => createProject(state.mode));
    byId("exportButton").addEventListener("click", exportProject);
    byId("codeEditor").addEventListener("input", () => {
      if (!state.activeFile) return;
      state.files[state.activeFile] = byId("codeEditor").value;
      if (state.mode === "website" && ["index.html", "style.css", "app.js"].includes(state.activeFile)) renderPreview();
      setStatus("Unsaved local edit: " + state.activeFile);
    });
    createProject("website");
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
