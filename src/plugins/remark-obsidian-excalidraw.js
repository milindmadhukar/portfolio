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
          
          // Generate paths for light and dark variants in excalidraw folder
          const lightPath = `./_assets/excalidraw/${baseName}.light.png`;
          const darkPath = `./_assets/excalidraw/${baseName}.dark.png`;
          const altText = baseName.replace('.excalidraw', '');
          
          // Create a container div with two separate image nodes
          // This allows Astro's markdown processor to handle the images properly
          segments.push({
            type: 'html',
            value: `<div class="excalidraw-container">`
          });
          
          segments.push({
            type: 'image',
            url: lightPath,
            alt: altText,
            data: {
              hProperties: {
                loading: 'lazy',
                decoding: 'async',
                class: 'blog-image excalidraw excalidraw-light'
              }
            }
          });
          
          segments.push({
            type: 'image',
            url: darkPath,
            alt: altText,
            data: {
              hProperties: {
                loading: 'lazy',
                decoding: 'async',
                class: 'blog-image excalidraw excalidraw-dark'
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
