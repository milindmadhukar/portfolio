import type { ImageMetadata } from 'astro';

export interface ExcalidrawImageResult {
  isExcalidraw: boolean;
  lightImage: ImageMetadata | null;
  darkImage: ImageMetadata | null;
  fallbackImage: ImageMetadata | null;
  baseName: string | null;
}

/**
 * Process an image filename to determine if it's an Excalidraw image
 * and load both light/dark variants from the excalidraw folder
 * 
 * Handles:
 * - filename.excalidraw (loads both .light and .dark variants)
 * - filename.excalidraw.light or filename.excalidraw.light.png (loads both variants)
 * - filename.excalidraw.dark or filename.excalidraw.dark.png (loads both variants)
 * 
 * @param filename - The image filename (can include Obsidian [[ ]] syntax)
 * @param images - The glob result containing all images
 * @param slug - The blog post slug
 * @returns ExcalidrawImageResult with light/dark variants if found
 */
export function processExcalidrawImage(
  filename: string,
  images: Record<string, { default: ImageMetadata }>,
  slug: string
): ExcalidrawImageResult {
  // Extract filename from Obsidian link format [[filename]]
  let cleanFilename = filename;
  if (filename.startsWith('[[') && filename.endsWith(']]')) {
    cleanFilename = filename.slice(2, -2);
  }

  // Check if this is an Excalidraw image
  // Matches: filename.excalidraw, filename.excalidraw.light, filename.excalidraw.dark, 
  //          filename.excalidraw.light.png, filename.excalidraw.dark.png
  const excalidrawMatch = cleanFilename.match(/^(.+\.excalidraw)(?:\.(light|dark))?(?:\.png)?$/);

  if (!excalidrawMatch) {
    return {
      isExcalidraw: false,
      lightImage: null,
      darkImage: null,
      fallbackImage: null,
      baseName: null
    };
  }

  const baseName = excalidrawMatch[1]; // e.g., "banner.excalidraw"

  // Try to load both light and dark variants from excalidraw folder
  // The glob pattern can return either relative paths (./slug/...) or absolute paths (/src/pages/blog/slug/...)
  // Detect which format is being used by checking the first key
  const sampleKey = Object.keys(images)[0] || '';
  const isAbsolutePath = sampleKey.startsWith('/src/pages/blog/');
  const isRelativeLibPath = sampleKey.startsWith('../pages/blog/');

  const lightPath = isAbsolutePath
    ? `/src/pages/blog/${slug}/_assets/excalidraw/${baseName}.light.png`
    : isRelativeLibPath
      ? `../pages/blog/${slug}/_assets/excalidraw/${baseName}.light.png`
      : `./${slug}/_assets/excalidraw/${baseName}.light.png`;
  const darkPath = isAbsolutePath
    ? `/src/pages/blog/${slug}/_assets/excalidraw/${baseName}.dark.png`
    : isRelativeLibPath
      ? `../pages/blog/${slug}/_assets/excalidraw/${baseName}.dark.png`
      : `./${slug}/_assets/excalidraw/${baseName}.dark.png`;

  const lightImageModule = images[lightPath];
  const darkImageModule = images[darkPath];

  return {
    isExcalidraw: true,
    lightImage: lightImageModule?.default || null,
    darkImage: darkImageModule?.default || null,
    fallbackImage: lightImageModule?.default || darkImageModule?.default || null,
    baseName
  };
}

/**
 * Extract banner filename from various formats
 * @param banner - Banner field from frontmatter
 * @returns Clean filename
 */
export function extractBannerFilename(banner: string): string {
  if (banner.startsWith('[[') && banner.endsWith(']]')) {
    return banner.slice(2, -2);
  }
  return banner;
}
