#!/usr/bin/env bun
/**
 * Regenerates the Nerd Font subset that the site actually ships.
 *
 * The upstream release is 10,764 icon rules and a 2.4 MB TTF; this site uses
 * around 28 icons. Shipping the whole thing put ~560 KB of CSS in the bundle
 * and re-downloaded 2.4 MB of font on every load, which was the bulk of a
 * ~3 s cold load.
 *
 * Sources stay vendored under vendor/nerdfonts/ and are NOT imported by the
 * app. This writes the two generated artefacts that are:
 *
 *   src/styles/nerdfonts.subset.css   - @font-face + only the used rules
 *   src/styles/fonts/*.woff2          - only the used glyphs
 *
 * Run it after adding a new `nf-` icon, otherwise that icon renders as tofu:
 *
 *   bun scripts/subset-nerdfont.ts
 *
 * Requires pyftsubset (`pip install fonttools brotli`), a dev-only dependency.
 */

import { $ } from "bun";
import { readdir } from "fs/promises";
import { join } from "path";

const ROOT = join(import.meta.dir, "..");
const VENDOR_CSS = join(ROOT, "vendor/nerdfonts/nerdfonts.css");
const VENDOR_TTF = join(ROOT, "vendor/nerdfonts/SymbolsNerdFontMono-Regular.ttf");
const OUT_CSS = join(ROOT, "src/styles/nerdfonts.subset.css");
const OUT_FONT_DIR = join(ROOT, "src/styles/fonts");
const OUT_FONT = join(OUT_FONT_DIR, "symbols-nerd-font-subset.woff2");

// Where icon classes can appear. The Go SSH server is scanned too: it prints
// the same glyphs, so an icon used only there must survive subsetting.
const SCAN_DIRS = [join(ROOT, "src"), join(ROOT, "../ssh-server")];
const SCAN_EXT = [".astro", ".ts", ".tsx", ".js", ".jsx", ".go", ".md"];

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === "dist" || e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (SCAN_EXT.some((x) => e.name.endsWith(x))) yield p;
  }
}

// Every `nf-<set>-<name>` mentioned anywhere in the source.
const used = new Set<string>();
for (const dir of SCAN_DIRS) {
  for await (const file of walk(dir)) {
    const text = await Bun.file(file).text();
    for (const m of text.matchAll(/nf-[a-z0-9]+-[a-z0-9_]+/g)) used.add(m[0]);
  }
}

const vendorCss = await Bun.file(VENDOR_CSS).text();

// Pull the @font-face block through verbatim apart from its src, which is
// rewritten to the generated woff2. A relative path here matters: it makes Vite
// fingerprint the file, so it is served immutable instead of the max-age=0 the
// old /fonts/ copy got.
const fontFace = `@font-face {
  font-family: 'NerdFontsSymbols Nerd Font';
  src: url("./fonts/symbols-nerd-font-subset.woff2") format("woff2");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`;

// class -> codepoint, e.g. `.nf-fa-github:before { content: "\f09b"; }`
const rules = new Map<string, string>();
for (const m of vendorCss.matchAll(/\.(nf-[a-z0-9]+-[a-z0-9_]+):before\s*\{\s*content:\s*"\\([0-9a-fA-F]+)";?\s*\}/g)) {
  rules.set(m[1], m[2]);
}

const missing = [...used].filter((c) => !rules.has(c)).sort();
const kept = [...used].filter((c) => rules.has(c)).sort();

if (missing.length) {
  console.warn(`⚠ ${missing.length} class(es) used but not defined upstream: ${missing.join(", ")}`);
}

const body = kept.map((c) => `.${c}:before {\n  content: "\\${rules.get(c)}";\n}`).join("\n\n");

// The base .nf rule that applies the family; carried over from upstream.
const baseRule = vendorCss.match(/\.nf\s*\{[^}]*\}/)?.[0] ?? `.nf {
  font-family: 'NerdFontsSymbols Nerd Font';
  font-style: normal;
  font-weight: normal;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
}`;

await Bun.write(
  OUT_CSS,
  `/*
 * GENERATED - do not edit. Run \`bun scripts/subset-nerdfont.ts\` to refresh.
 *
 * ${kept.length} of ${rules.size} upstream icons, i.e. the ones this site
 * actually references. Adding an \`nf-\` class without re-running the script
 * leaves that icon rendering as tofu.
 */

${fontFace}

${baseRule}

${body}
`,
);

// Subset the font to just those codepoints.
//
// Two steps rather than pyftsubset --flavor=woff2: that path needs the brotli
// Python extension, while woff2_compress ships with the woff2 tools and is far
// likelier to already be present.
await $`mkdir -p ${OUT_FONT_DIR}`.quiet();
const unicodes = kept.map((c) => `U+${rules.get(c)}`).join(",");
const tmpTtf = join(OUT_FONT_DIR, "symbols-nerd-font-subset.ttf");
await $`pyftsubset ${VENDOR_TTF} --unicodes=${unicodes} --output-file=${tmpTtf}`.quiet();
await $`woff2_compress ${tmpTtf}`.quiet();
await $`rm -f ${tmpTtf}`.quiet();

const before = Bun.file(VENDOR_TTF).size + Bun.file(VENDOR_CSS).size;
const after = Bun.file(OUT_FONT).size + Bun.file(OUT_CSS).size;
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
console.log(`✓ ${kept.length} icons kept`);
console.log(`  css  ${kb(Bun.file(VENDOR_CSS).size)} -> ${kb(Bun.file(OUT_CSS).size)}`);
console.log(`  font ${kb(Bun.file(VENDOR_TTF).size)} -> ${kb(Bun.file(OUT_FONT).size)}`);
console.log(`  total ${kb(before)} -> ${kb(after)}`);
