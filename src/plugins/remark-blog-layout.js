import { visit } from 'unist-util-visit';

/**
 * Remark plugin to automatically inject BlogPost layout for blog posts
 */
export function remarkBlogLayout() {
  return (tree, file) => {
    // Only apply to files in the blog directory, but not the index or templates
    const filePath = file.history[0];
    if (filePath && filePath.includes('/blog/') && 
        !filePath.includes('/blog/index.') && 
        !filePath.includes('/_templates/')) {
      
      // Check if frontmatter already exists
      visit(tree, 'yaml', (node) => {
        // If layout is not already specified, we'll add it via file.data
        if (!node.value.includes('layout:')) {
          // Set the layout in file.data which Astro will use
          file.data.astro = file.data.astro || {};
          file.data.astro.frontmatter = file.data.astro.frontmatter || {};
          
          // Only set layout if not already present
          if (!file.data.astro.frontmatter.layout) {
            file.data.astro.frontmatter.layout = '../../../layouts/BlogPost.astro';
          }
        }
      });
    }
  };
}
