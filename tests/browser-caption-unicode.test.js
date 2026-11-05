const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const source = fs.readFileSync("scripts/shif-a-browser-tools.js", "utf8");
const match = source.match(/function makeCaptions\(value, max\) \{[\s\S]*?\n  \}/);
assert.ok(match, "makeCaptions helper must exist");
const makeCaptions = new Function(match[0] + "; return makeCaptions;")();

test("caption lines do not split emoji surrogate pairs", () => {
  const output = makeCaptions("A😀B", 2);
  assert.equal(output, "A😀\nB");
  assert.equal(output.includes("\uFFFD"), false);
});

test("caption wrapping counts Unicode code points", () => {
  const output = makeCaptions("😀😀😀", 2);
  assert.equal(output, "😀😀\n😀");
});

test("Hindi captions remain intact while wrapping", () => {
  const output = makeCaptions("नमस्ते दुनिया", 5);
  assert.equal(output, "नमस्ते\nदुनिया");
});
