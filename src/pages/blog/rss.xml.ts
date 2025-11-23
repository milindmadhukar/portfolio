import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { personalInfo } from '../../data/portfolio';

export async function GET(context: APIContext) {
  // Get all blog posts
  const allPosts = import.meta.glob('./**/index.md', { eager: true });
  
  // Get the site URL (remove trailing slash if present)
  const siteUrl = (context.site?.toString() || 'https://milind.dev').replace(/\/$/, '');
  
  // Convert glob result to array format
  const blogPosts: any[] = Object.entries(allPosts).map(([path, module]: [string, any]) => {
    // Extract slug from path
    const pathParts = path.split('/');
    const slug = pathParts[pathParts.length - 2];
    
    return {
      ...module,
      url: `/blog/${slug}/`,
      slug,
    };
  });
  
  // Filter out template folders and drafts
  const publishedPosts = blogPosts.filter((post) => {
    const { slug } = post;
    
    // Exclude template folders (starting with _) and hidden folders (starting with .)
    if (slug && (slug.startsWith('_') || slug.startsWith('.'))) {
      return false;
    }
    
    // Exclude drafts in production
    if (post.frontmatter?.draft === true) {
      return false;
    }
    
    return true;
  });
  
  // Process and sort posts by date
  const posts = publishedPosts.map((post) => {
    const frontmatter = post.frontmatter || {};
    
    return {
      title: frontmatter.title || 'Untitled',
      description: frontmatter.description || '',
      pubDate: frontmatter.date ? new Date(frontmatter.date) : new Date(),
      link: `${siteUrl}${post.url}`,
    };
  });
  
  // Sort by date (newest first)
  posts.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  
  return rss({
    title: `${personalInfo.name}'s Blog`,
    description: personalInfo.bio.short,
    site: siteUrl,
    items: posts,
    customData: `<language>en-us</language>`,
  });
}
