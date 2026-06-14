const test = require("node:test");
const assert = require("node:assert/strict");

const { Compressor } = require("../src/js/compressor.js");

test("already-compressed archive formats are stored, not recompressed", () => {
  assert.equal(Compressor.shouldStoreUncompressed("bundle.zip"), true);
  assert.equal(Compressor.shouldStoreUncompressed("pack.7z"), true);
  assert.equal(Compressor.shouldStoreUncompressed("archive.rar"), true);
  assert.equal(Compressor.shouldStoreUncompressed("backup.tar.gz"), true);
});

test("existing incompressible media types are still stored", () => {
  assert.equal(Compressor.shouldStoreUncompressed("photo.jpg"), true);
  assert.equal(Compressor.shouldStoreUncompressed("clip.mp4"), true);
  assert.equal(Compressor.shouldStoreUncompressed("doc.pdf"), true);
});

test("extension matching is case-insensitive", () => {
  assert.equal(Compressor.shouldStoreUncompressed("BUNDLE.ZIP"), true);
  assert.equal(Compressor.shouldStoreUncompressed("Photo.JPG"), true);
});

test("genuinely compressible files are not stored uncompressed", () => {
  assert.equal(Compressor.shouldStoreUncompressed("notes.txt"), false);
  assert.equal(Compressor.shouldStoreUncompressed("data.csv"), false);
  assert.equal(Compressor.shouldStoreUncompressed("noextension"), false);
});
