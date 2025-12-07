import { parseCustomDate, getWordCount, formatTimeAgo } from './date';
import { processExcalidrawImage, extractBannerFilename } from './excalidraw';
import type { ImageMetadata } from 'astro';

export interface BlogPost {
    url: string;
    slug: string;
    title: string;
    description: string;
    date: Date;
    tags: string[];
    cover: any;
    coverLight: any;
    coverDark: any;
    isExcalidrawCover: boolean;
    draft: boolean;
    wordCount: number;
    rawContent?: () => string;
    frontmatter?: any;
}

export function getBlogPosts() {
    const allPosts = import.meta.glob('../pages/blog/**/index.md', { eager: true });
    const images = import.meta.glob<{ default: ImageMetadata }>('../pages/blog/**/_assets/**/*.{png,jpg,jpeg,gif,webp,svg}', { eager: true });

    const blogPosts: any[] = Object.entries(allPosts).map(([path, module]: [string, any]) => {
        const pathParts = path.split('/');
        const slug = pathParts[pathParts.length - 2];

        return {
            ...module,
            url: `/blog/${slug}/`,
            slug,
        };
    });

    const isDevelopment = import.meta.env.DEV;

    const publishedPosts = blogPosts.filter((post) => {
        const { slug } = post;

        if (slug && (slug.startsWith('_') || slug.startsWith('.'))) {
            return false;
        }

        if (!isDevelopment && post.frontmatter?.draft === true) {
            return false;
        }

        return true;
    });

    const posts = publishedPosts.map((post) => {
        const frontmatter = post.frontmatter || {};
        const { slug } = post;

        const rawContent = post.rawContent ? post.rawContent() : '';
        const wordCount = getWordCount(rawContent);

        let bannerImage: any = null;
        let bannerLightImage: any = null;
        let bannerDarkImage: any = null;
        let isExcalidrawBanner = false;

        if (frontmatter.banner) {
            const bannerFilename = extractBannerFilename(frontmatter.banner);

            if (bannerFilename.startsWith('http://') || bannerFilename.startsWith('https://')) {
                bannerImage = bannerFilename;
            } else {
                const excalidrawResult = processExcalidrawImage(bannerFilename, images, slug);

                if (excalidrawResult.isExcalidraw) {
                    isExcalidrawBanner = true;
                    bannerLightImage = excalidrawResult.lightImage;
                    bannerDarkImage = excalidrawResult.darkImage;
                    bannerImage = excalidrawResult.fallbackImage;
                } else {
                    // Handle relative path from lib logic
                    // images keys are like "../pages/blog/slug/_assets/image.png"
                    // bannerFilename is like "image.png" or "./image.png"

                    const cleanBannerFilename = bannerFilename.startsWith('./') ? bannerFilename.slice(2) : bannerFilename;
                    const bannerPath = `../pages/blog/${slug}/_assets/${cleanBannerFilename}`;

                    const localImage = images[bannerPath];
                    if (localImage) {
                        bannerImage = localImage.default;
                    }
                }
            }
        }

        return {
            url: post.url,
            slug,
            title: frontmatter.title || 'Untitled',
            description: frontmatter.description || '',
            date: frontmatter.date ? parseCustomDate(frontmatter.date) : new Date(),
            tags: (frontmatter.tags || []) as string[],
            cover: bannerImage,
            coverLight: bannerLightImage,
            coverDark: bannerDarkImage,
            isExcalidrawCover: isExcalidrawBanner,
            draft: frontmatter.draft || false,
            wordCount,
        };
    });

    posts.sort((a, b) => b.date.getTime() - a.date.getTime());

    return posts;
}
