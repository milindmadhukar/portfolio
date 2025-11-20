import { visit } from 'unist-util-visit';

/**
 * Remark plugin to convert Obsidian-style wikilinks to standard markdown image syntax
 * Converts: ![[image.png]] to ![](./assets/image.png)
 */
export function remarkObsidianImage() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!node.value || typeof node.value !== 'string') return;
      
      // Match Obsidian image syntax: ![[filename.ext]]
      const wikilinkRegex = /!\[\[([^\]]+\.(png|jpg|jpeg|gif|webp|avif|svg))\]\]/gi;
      
      if (wikilinkRegex.test(node.value)) {
        const segments = [];
        let lastIndex = 0;
        
        // Reset regex
        wikilinkRegex.lastIndex = 0;
        let match;
        
        while ((match = wikilinkRegex.exec(node.value)) !== null) {
          const [fullMatch, filename] = match;
          
          // Add text before the match
          if (match.index > lastIndex) {
            segments.push({
              type: 'text',
              value: node.value.slice(lastIndex, match.index)
            });
          }
          
          // Add the converted image
          segments.push({
            type: 'image',
            url: `./assets/${filename}`,
            alt: filename.replace(/\.(png|jpg|jpeg|gif|webp|avif|svg)$/i, ''),
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
