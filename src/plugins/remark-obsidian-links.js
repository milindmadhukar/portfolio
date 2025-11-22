import { visit } from 'unist-util-visit';

/**
 * Remark plugin to convert Obsidian-style wikilinks to standard markdown syntax
 * Converts: 
 * - ![[image.png]] to ![](./assets/image.png) with optimization attributes
 * - [[page-name|Display Text]] to markdown links
 * - [[page-name]] to markdown links
 */
export function remarkObsidianLinks() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!node.value || typeof node.value !== 'string') return;
      
      // Match both image wikilinks and regular wikilinks
      const combinedRegex = /!\[\[([^\]]+\.(png|jpg|jpeg|gif|webp|avif|svg))\]\]|\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/gi;
      
      if (combinedRegex.test(node.value)) {
        const segments = [];
        let lastIndex = 0;
        
        // Reset regex
        combinedRegex.lastIndex = 0;
        let match;
        
        while ((match = combinedRegex.exec(node.value)) !== null) {
          const [fullMatch, imageFilename, _imageExt, linkPath, linkText] = match;
          
          // Add text before the match
          if (match.index > lastIndex) {
            segments.push({
              type: 'text',
              value: node.value.slice(lastIndex, match.index)
            });
          }
          
          // Handle image wikilinks
          if (imageFilename) {
            // Create an image node with data attributes for Astro to handle
            segments.push({
              type: 'image',
              url: `./_assets/${imageFilename}`,
              alt: imageFilename.replace(/\.(png|jpg|jpeg|gif|webp|avif|svg)$/i, ''),
              data: {
                hProperties: {
                  loading: 'lazy',
                  decoding: 'async',
                  class: 'blog-image'
                }
              }
            });
          }
          // Handle internal link wikilinks
          else if (linkPath) {
            // Convert Obsidian path format to blog URL format
            let url = linkPath;
            
            // Remove .md extension if present
            url = url.replace(/\.md$/, '');
            
            // Remove /index suffix if present
            url = url.replace(/\/index$/, '');
            
            // Prepend /blog/ if not already present
            if (!url.startsWith('/')) {
              url = `/blog/${url}/`;
            }
            
            // Use custom text if provided, otherwise use the path as text
            const displayText = linkText || linkPath.split('/').pop() || linkPath;
            
            segments.push({
              type: 'link',
              url: url,
              children: [{ type: 'text', value: displayText }]
            });
          }
          
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
