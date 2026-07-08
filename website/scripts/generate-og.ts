#!/usr/bin/env bun
/**
 * Generates the Open Graph / social share card at public/og.png (1200x630).
 *
 * The card is derived from the current favicon, so simply replacing
 * public/favicon.ico and re-running this script (it runs automatically on every
 * build via the "prebuild" npm script) refreshes the share image. A
 * higher-resolution favicon automatically yields a crisper card.
 *
 * Pipeline: favicon.ico --decode-ico--> raw RGBA --sharp--> PNG data-URI
 *           --satori--> SVG (text baked to vector paths) --sharp--> og.png
 *
 * Text is rendered by satori using the bundled JetBrains Mono TTFs so the
 * result is identical in Docker/CI where the font isn't installed on the host.
 */

import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import satori from "satori";
import decodeIco from "decode-ico";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT = join(ROOT, "public", "og.png");
const FAVICON = join(ROOT, "public", "favicon.ico");
const FONT_DIR = join(ROOT, "src", "assets", "fonts");

const WIDTH = 1200;
const HEIGHT = 630;

// Catppuccin Mocha palette (matches the site theme).
const C = {
  crust: "#11111b",
  mantle: "#181825",
  base: "#1e1e2e",
  surface0: "#313244",
  surface1: "#45475a",
  text: "#cdd6f4",
  subtext: "#a6adc8",
  overlay: "#6c7086",
  mauve: "#cba6f7",
  blue: "#89b4fa",
  sapphire: "#74c7ec",
  green: "#a6e3a1",
  yellow: "#f9e2af",
  red: "#f38ba8",
};

/** Minimal hyperscript so we don't need JSX/React in a plain Bun script. */
function h(type: string, props: Record<string, any> = {}, ...children: any[]) {
  const kids = children.flat();
  const style = { ...(props.style ?? {}) };
  // Satori requires an explicit display on any div with more than one child;
  // default every div to flex unless it opts out.
  if (type === "div" && style.display === undefined) {
    style.display = "flex";
  }
  return { type, props: { ...props, style, children: kids } };
}

/** Decode favicon.ico -> a crisp PNG data-URI sized for the titlebar. */
async function faviconDataUri(px: number): Promise<string> {
  const ico = await readFile(FAVICON);
  const frames = decodeIco(ico);
  // Pick the largest frame so a higher-res favicon later yields a sharper icon.
  const best = frames.reduce((a, b) => (b.width * b.height > a.width * a.height ? b : a));
  const png = await sharp(Buffer.from(best.data), {
    raw: { width: best.width, height: best.height, channels: 4 },
  })
    .resize(px * 2, px * 2, { fit: "contain", kernel: "lanczos3" }) // 2x for retina crispness
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

function dot(color: string) {
  return h("div", {
    style: {
      width: 14,
      height: 14,
      borderRadius: 9999,
      backgroundColor: color,
    },
  });
}

function chip(label: string, color: string) {
  return h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        paddingTop: 8,
        paddingBottom: 8,
        paddingLeft: 18,
        paddingRight: 18,
        borderRadius: 10,
        border: `1px solid ${color}55`,
        backgroundColor: `${color}1a`,
        color,
        fontSize: 24,
      },
    },
    label,
  );
}

async function build() {
  const favicon = await faviconDataUri(24);

  const [regular, bold] = await Promise.all([
    readFile(join(FONT_DIR, "JetBrainsMono-Regular.ttf")),
    readFile(join(FONT_DIR, "JetBrainsMono-Bold.ttf")),
  ]);

  const tree = h(
    "div",
    {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: C.crust,
        backgroundImage: `radial-gradient(1000px 500px at 78% -10%, ${C.mauve}22, transparent 60%), radial-gradient(900px 500px at 10% 120%, ${C.blue}18, transparent 55%)`,
        fontFamily: "JetBrains Mono",
        position: "relative",
      },
    },
    // Subtle dotted grid overlay.
    h("div", {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `radial-gradient(${C.surface0}66 1.2px, transparent 1.2px)`,
        backgroundSize: "28px 28px",
        opacity: 0.5,
      },
    }),

    // Terminal window.
    h(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          width: 1000,
          borderRadius: 18,
          border: `1px solid ${C.surface0}`,
          backgroundColor: C.base,
          boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
          overflow: "hidden",
        },
      },
      // Title bar.
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            height: 58,
            paddingLeft: 24,
            paddingRight: 24,
            backgroundColor: C.mantle,
            borderBottom: `1px solid ${C.surface0}`,
          },
        },
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 10 } },
          dot(C.red),
          dot(C.yellow),
          dot(C.green),
        ),
        h("img", {
          src: favicon,
          width: 24,
          height: 24,
          style: { marginLeft: 22, borderRadius: 6 },
        }),
        h(
          "div",
          {
            style: {
              marginLeft: 12,
              color: C.subtext,
              fontSize: 24,
            },
          },
          "portfolio@milind.dev",
        ),
      ),
      // Body.
      h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            padding: 48,
          },
        },
        // Prompt line.
        h(
          "div",
          { style: { display: "flex", alignItems: "center", fontSize: 26 } },
          h("span", { style: { color: C.green } }, ">"),
          h("span", { style: { color: C.subtext, marginLeft: 14 } }, "whoami"),
        ),
        // Name.
        h(
          "div",
          {
            style: {
              marginTop: 18,
              color: C.text,
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: -1,
            },
          },
          "Milind Madhukar",
        ),
        // Subtitle (bio voice).
        h(
          "div",
          {
            style: {
              marginTop: 16,
              color: C.subtext,
              fontSize: 32,
            },
          },
          "I build useful software people actually use",
        ),
        // Tech chips.
        h(
          "div",
          {
            style: {
              display: "flex",
              gap: 14,
              marginTop: 36,
            },
          },
          chip("Go", C.blue),
          chip("TypeScript", C.sapphire),
          chip("Docker", C.blue),
          chip("Kubernetes", C.mauve),
        ),
      ),
    ),

    // Footer line under the window.
    h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: 1000,
          marginTop: 26,
          fontSize: 24,
        },
      },
      h("span", { style: { color: C.mauve } }, "milind.dev"),
      h("span", { style: { color: C.overlay } }, "Developer · DevOps · Mumbai"),
    ),
  );

  const svg = await satori(tree as any, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: "JetBrains Mono", data: regular, weight: 400, style: "normal" },
      { name: "JetBrains Mono", data: bold, weight: 700, style: "normal" },
    ],
  });

  await sharp(Buffer.from(svg)).png().toFile(OUT);
  console.log(`✨ Wrote ${OUT} (${WIDTH}x${HEIGHT})`);
}

build().catch((err) => {
  console.error("✗ Failed to generate OG image:", err);
  process.exit(1);
});
