import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("homepage uses compact navigation and keeps auth actions", () => {
  assert.match(html, /href="#home">Home<\/a>/);
  assert.match(html, /href="ai-tools\.html">AI Tools<\/a>/);
  assert.match(html, /href="#paymentSandbox">Pricing<\/a>/);
  assert.match(html, /href="contact\.html">Support<\/a>/);
  assert.match(html, /id="loginNavButton"/);
  assert.match(html, /id="signupNavButton"/);
});

test("homepage hero directs visitors to the tools directory", () => {
  assert.match(html, /<h1>Make more with <span>SHIF-A AI\.<\/span><\/h1>/);
  assert.match(html, /href="ai-tools\.html">Explore AI Tools/);
});

test("homepage shows the seven simplified tool categories", () => {
  for (const label of ["Video Studio", "Content Studio", "Image Studio", "Voice Studio", "Chat & Research", "Coding Studio", "More AI Tools"]) {
    assert.ok(html.includes("<strong>" + label + "</strong>"), "missing category: " + label);
  }
});

test("homepage keeps auth and protected tool anchors", () => {
  for (const id of ["authBox", "upload", "promptStudio"]) {
    assert.ok(html.includes('id="' + id + '"'), "missing preserved anchor: " + id);
  }
});

test("homepage includes the approved light purple-blue theme and mobile breakpoints", () => {
  assert.match(html, /--brand-purple:#6842c2/);
  assert.match(html, /--brand-blue:#2563eb/);
  assert.match(html, /@media\(max-width:760px\)/);
  assert.match(html, /@media\(max-width:360px\)/);
});

test("homepage retains support and legal destinations", () => {
  for (const href of ["about.html", "contact.html", "privacy.html", "terms.html"]) {
    assert.ok(html.includes('href="' + href + '"'), "missing destination: " + href);
  }
});
