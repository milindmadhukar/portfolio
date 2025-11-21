// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import { remarkObsidianLinks } from './src/plugins/remark-obsidian-links.js';
import { remarkBlogLayout } from './src/plugins/remark-blog-layout.js';

// https://astro.build/config
export default defineConfig({
  server: {
    host: true
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: true,
      allowedHosts: ["spaceship3000.milind.dev"]
    }
  },

  markdown: {
    remarkPlugins: [remarkObsidianLinks, remarkBlogLayout],
    shikiConfig: {
      theme: 'dracula',
      wrap: true
    }
  },
  
  image: {
    // Enable image optimization for all images
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  },

  integrations: [react()]
});
