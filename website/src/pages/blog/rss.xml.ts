import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { personalInfo } from '../../lib/constants';
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { parseCustomDate } from '../../lib/date';

export async function GET(context: APIContext) {
  // Get all blog posts
  const allPosts = import.meta.glob('./**/index.md', { eager: true });

  // Get all blog images for optimization
  const allImages = import.meta.glob<{ default: ImageMetadata }>('./**/_assets/**/*.{png,jpg,jpeg,gif,webp,svg}', { eager: true });

  // Check if we're in development mode
  const isDev = import.meta.env.DEV;

  // Get the site URL (use localhost in dev, production URL otherwise)
  let siteUrl: string;
  if (isDev) {
    // In development, use localhost with the current port
    siteUrl = context.url.origin;
  } else {
    // In production, use the configured site or fallback
    siteUrl = (context.site?.toString() || 'https://milind.dev').replace(/\/$/, '');
  }

  // Convert glob result to array format
  const blogPosts: any[] = Object.entries(allPosts).map(([path, module]: [string, any]) => {
    // Extract slug from path
    const pathParts = path.split('/');
    const slug = pathParts[pathParts.length - 2];

    return {
      ...module,
      url: `/blog/${slug}/`,
      slug,
      compiledContent: module.compiledContent,
    };
  });

  // Filter out template folders and drafts
  const publishedPosts = blogPosts.filter((post) => {
    const { slug } = post;

    // Exclude template folders (starting with _) and hidden folders (starting with .)
    if (slug && (slug.startsWith('_') || slug.startsWith('.'))) {
      return false;
    }

    // Exclude drafts only in production (allow in development)
    if (!isDev && post.frontmatter?.draft === true) {
      return false;
    }

    return true;
  });

  // Process and sort posts by date
  const posts = await Promise.all(
    publishedPosts.map(async (post) => {
      const frontmatter = post.frontmatter || {};

      // Get the compiled HTML content
      let content = '';
      if (post.compiledContent) {
        content = await post.compiledContent();

        // Convert relative URLs to absolute URLs for images and links
        // Replace src="/_astro/..." with src="https://milind.dev/_astro/..."
        content = content.replace(/src="(\/[^"]+)"/g, `src="${siteUrl}$1"`);

        // Replace href="/" with href="https://milind.dev/"
        content = content.replace(/href="(\/[^"]+)"/g, `href="${siteUrl}$1"`);

        // Excalidraw diagrams need no fixing up here any more. The remark plugin
        // emits a single dark <img> (see remark-obsidian-excalidraw.js), so the
        // feed gets one image per diagram for free. This used to be a regex that
        // matched the light/dark pair and rewrote it — a workaround for markup
        // the site should not have been producing in the first place.
      }

      // Prepend banner to content if banner exists
      let finalContent = content;
      if (frontmatter.banner) {
        let bannerUrl = '';

        // Extract filename from Obsidian link format [[filename]]
        let bannerFilename = frontmatter.banner;
        if (frontmatter.banner.startsWith('[[') && frontmatter.banner.endsWith(']]')) {
          bannerFilename = frontmatter.banner.slice(2, -2);
        }

        // Check if banner is a URL
        if (bannerFilename.startsWith('http://') || bannerFilename.startsWith('https://')) {
          bannerUrl = bannerFilename;
        } else {
          // Check if this is an Excalidraw image - use the exact variant specified
          const isExcalidraw = bannerFilename.match(/\.excalidraw(?:\.(light|dark))?(?:\.png)?$/);

          if (isExcalidraw) {
            // For excalidraw, prefer the dark variant for RSS feed
            // Construct filename with .dark suffix if it doesn't have one
            let darkFilename = bannerFilename;
            if (!bannerFilename.includes('.dark') && !bannerFilename.includes('.light')) {
              // If it's just filename.excalidraw, append .dark
              darkFilename = `${bannerFilename}.dark.png`;
            } else if (bannerFilename.includes('.light')) {
              // If it's explicitly light, switch to dark
              darkFilename = bannerFilename.replace('.light', '.dark');
            }

            // Clean up double extension if present (e.g., .excalidraw.dark.png.png)
            if (!darkFilename.endsWith('.png')) {
              darkFilename = `${darkFilename}.png`;
            }

            // Look for the dark image
            const imagePath = `./${post.slug}/_assets/excalidraw/${darkFilename}`;
            let imageModule = allImages[imagePath];

            // Fallback to original filename if dark variant not found
            if (!imageModule) {
              const originalPath = `./${post.slug}/_assets/excalidraw/${bannerFilename}`;
              imageModule = allImages[originalPath];
            }

            if (imageModule) {
              const optimizedImage = await getImage({ src: imageModule.default, format: 'webp' });
              bannerUrl = `${siteUrl}${optimizedImage.src}`;
            } else {
              // Fallback to direct path if image not found
              bannerUrl = `${siteUrl}/blog/${post.slug}/_assets/excalidraw/${darkFilename}`;
            }
          } else {
            // Regular image handling
            const bannerPath = bannerFilename.startsWith('./')
              ? bannerFilename.slice(2)
              : bannerFilename;

            // The glob pattern returns paths like './{slug}/_assets/{filename}'
            const imagePath = `./${post.slug}/_assets/${bannerPath}`;
            const imageModule = allImages[imagePath];

            if (imageModule) {
              // Get the optimized image
              const optimizedImage = await getImage({ src: imageModule.default, format: 'webp' });
              bannerUrl = `${siteUrl}${optimizedImage.src}`;
            } else {
              // Fallback to direct path if image not found
              bannerUrl = `${siteUrl}/blog/${post.slug}/${bannerPath}`;
            }
          }
        }

        if (bannerUrl) {
          finalContent = `<img src="${bannerUrl}" alt="${frontmatter.title || 'Banner'}" />${content}`;
        }
      }

      return {
        title: frontmatter.title || 'Untitled',
        description: frontmatter.description || '',
        pubDate: frontmatter.date ? parseCustomDate(frontmatter.date) : new Date(),
        link: `${siteUrl}${post.url}`,
        content: finalContent,
      };
    })
  );

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
