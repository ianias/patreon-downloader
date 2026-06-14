const test = require("node:test");
const assert = require("node:assert/strict");

const {
  makeUniqueFilename,
  escapeHtml,
  contentJsonToHtml,
  formatLocalDateTime,
  HumanFileSize,
  slugify,
} = require("../src/js/utils.js");

test("slugify lowercases nothing but strips illegal characters and collapses spaces", () => {
  assert.equal(slugify("Hello World"), "Hello-World");
  assert.equal(slugify('a/b\\c:d*e?f"g<h>i|j'), "abcdefghij");
  assert.equal(slugify("Tom & Jerry"), "Tom-and-Jerry");
  assert.equal(slugify("  trim  me  "), "trim-me");
});

test("slugify normalizes unicode dashes and trims trailing dots", () => {
  assert.equal(slugify("en–dash"), "en-dash");
  assert.equal(slugify("trailing..."), "trailing");
});

test("slugify blanks reserved Windows names", () => {
  assert.equal(slugify("con"), "");
  assert.equal(slugify("lpt1"), "");
});

test("escapeHtml escapes the five significant characters", () => {
  assert.equal(
    escapeHtml(`<a href="x">&'</a>`),
    "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;",
  );
  assert.equal(escapeHtml(null), "");
  assert.equal(escapeHtml(undefined), "");
});

test("contentJsonToHtml renders paragraphs, bold, hardBreak and links", () => {
  const doc = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Hidden lies " },
          { type: "text", marks: [{ type: "bold" }], text: "Highland Creek" },
          { type: "text", text: "." },
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", marks: [{ type: "bold" }], text: "For Free Members:" },
          { type: "hardBreak" },
          { type: "text", text: "Reduced resolution, no grid." },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [{ type: "link", attrs: { href: "https://example.com/x" } }, { type: "bold" }],
            text: "Link",
          },
        ],
      },
    ],
  };

  assert.equal(
    contentJsonToHtml(JSON.stringify(doc)),
    "<p>Hidden lies <strong>Highland Creek</strong>.</p>" +
      "<p><strong>For Free Members:</strong><br>Reduced resolution, no grid.</p>" +
      '<p><a href="https://example.com/x" rel="noopener noreferrer"><strong>Link</strong></a></p>',
  );
});

test("contentJsonToHtml drops javascript: links and non-http image sources", () => {
  const linkDoc = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            text: "click",
          },
        ],
      },
    ],
  };
  assert.equal(contentJsonToHtml(linkDoc), '<p><a href="" rel="noopener noreferrer">click</a></p>');

  const imgDoc = {
    type: "doc",
    content: [{ type: "image", attrs: { src: "javascript:alert(1)", alt: "x" } }],
  };
  assert.equal(contentJsonToHtml(imgDoc), "");
});

test("contentJsonToHtml renders bullet lists", () => {
  const doc = {
    type: "doc",
    content: [
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "First" }] }],
          },
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Second" }] }],
          },
        ],
      },
    ],
  };

  assert.equal(contentJsonToHtml(doc), "<ul><li><p>First</p></li><li><p>Second</p></li></ul>");
});

test("contentJsonToHtml escapes text and returns empty for blank input", () => {
  const doc = {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "a < b & c" }] }],
  };
  assert.equal(contentJsonToHtml(doc), "<p>a &lt; b &amp; c</p>");
  assert.equal(contentJsonToHtml(null), "");
  assert.equal(contentJsonToHtml(""), "");
  assert.equal(contentJsonToHtml("not json"), "");
});

test("formatLocalDateTime renders a parseable date and passes through the rest", () => {
  // Timezone-agnostic: a UTC midday timestamp stays on the same calendar day everywhere.
  assert.match(formatLocalDateTime("2026-06-11T12:00:00.000+00:00"), /2026/);
  assert.equal(formatLocalDateTime(""), "");
  assert.equal(formatLocalDateTime("not a date"), "not a date");
});

test("HumanFileSize formats bytes with SI units by default", () => {
  assert.equal(HumanFileSize(500), "500 B");
  assert.equal(HumanFileSize(1000), "1.0 kB");
  assert.equal(HumanFileSize(1_500_000), "1.5 MB");
});

test("makeUniqueFilename returns the original name when unseen", () => {
  const seen = new Set();
  assert.equal(makeUniqueFilename("photo.jpg", seen), "photo.jpg");
  assert.ok(seen.has("photo.jpg"));
});

test("makeUniqueFilename appends the supplied id on collision", () => {
  const seen = new Set(["photo.jpg"]);
  assert.equal(makeUniqueFilename("photo.jpg", seen, "42"), "photo-42.jpg");
  assert.ok(seen.has("photo-42.jpg"));
});

test("makeUniqueFilename handles names without an extension", () => {
  const seen = new Set(["embed"]);
  assert.equal(makeUniqueFilename("embed", seen, "7"), "embed-7");
});

test("makeUniqueFilename falls back to a random suffix without an id", () => {
  const seen = new Set(["photo.jpg"]);
  const result = makeUniqueFilename("photo.jpg", seen);
  assert.match(result, /^photo-\d+\.jpg$/);
});
