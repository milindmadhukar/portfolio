import { visit } from 'unist-util-visit';

/**
 * Remark plugin to convert Obsidian-style Excalidraw wikilinks to theme-aware images
 * Converts: ![[drawing.excalidraw]], ![[drawing.excalidraw.light]], ![[drawing.excalidraw.dark]]
 * to a container div with light/dark variants
 * Expects files: drawing.excalidraw.light.png and drawing.excalidraw.dark.png in excalidraw folder
 */
export function remarkObsidianExcalidraw() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!node.value || typeof node.value !== 'string') return;

      // Match Excalidraw wikilinks: ![[filename.excalidraw]], ![[filename.excalidraw.light]], etc.
      const excalidrawRegex = /!\[\[([^\]]+\.excalidraw(?:\.(light|dark))?(?:\.png)?)\]\]/gi;

      if (excalidrawRegex.test(node.value)) {
        const segments = [];
        let lastIndex = 0;

        // Reset regex
        excalidrawRegex.lastIndex = 0;
        let match;

        while ((match = excalidrawRegex.exec(node.value)) !== null) {
          const [fullMatch, filename] = match;

          // Add text before the match
          if (match.index > lastIndex) {
            segments.push({
              type: 'text',
              value: node.value.slice(lastIndex, match.index)
            });
          }

          // Extract base name (e.g., "banner.excalidraw" from "banner.excalidraw.light.png")
          const baseMatch = filename.match(/^(.+\.excalidraw)(?:\.(light|dark))?(?:\.png)?$/);
          const baseName = baseMatch ? baseMatch[1] : filename;

          // Only the dark path is referenced here; the light variant is still
          // built because src/lib/blog.ts eagerly globs every _assets image.
          const darkPath = `./_assets/excalidraw/${baseName}.dark.png`;
          const altText = baseName.replace('.excalidraw', '');

          // Only the dark variant is emitted. Shipping both and hiding one with
          // CSS meant anything that ignores CSS — feed readers, reader mode,
          // text browsers — rendered the diagram twice.
          //
          // Dark is the default theme, so it is what the server renders. The
          // light swap happens on the client: this runs on mdast, long before
          // Astro rewrites image paths to hashed /_astro/ URLs, so the light URL
          // cannot be written here. Instead the light variant is named by source
          // filename in data-light-key, and BlogPost.astro injects a map from
          // those keys to the built URLs.
          segments.push({
            type: 'html',
            value: `<div class="relative my-8 rounded-xl overflow-hidden">`
          });

          segments.push({
            type: 'image',
            url: darkPath,
            alt: altText,
            data: {
              hProperties: {
                loading: 'lazy',
                decoding: 'async',
                class: 'excalidraw',
                'data-light-key': `${baseName}.light.png`
              }
            }
          });

          segments.push({
            type: 'html',
            value: `</div>`
          });

          lastIndex = match.index + fullMatch.length;
        }

        // Add remaining text
        if (lastIndex < node.value.length) {
          segments.push({
            type: 'text',
            value: node.value.slice(lastIndex)
          });
        }

        // Replace the node with the segments
        if (segments.length > 0 && parent && typeof index === 'number') {
          parent.children.splice(index, 1, ...segments);
        }
      }
    });
  };
}
